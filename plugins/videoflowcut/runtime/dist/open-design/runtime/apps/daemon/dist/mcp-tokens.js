// Persistent OAuth-token storage for external HTTP / SSE MCP servers.
//
// The daemon owns the OAuth flow end-to-end so the user never needs a
// transient `localhost:<port>` listener (the killer of cloud deployments)
// and so a token survives across agent turns. Tokens are written to
// `<dataDir>/mcp-tokens.json` keyed by McpServerConfig.id, with the same
// atomic write + per-dataDir mutex pattern the rest of the daemon uses.
//
// File mode: chmod 0600 on POSIX so other local users can't read raw
// bearer tokens. This is best-effort — we log and continue if the chmod
// fails (e.g. on Windows / some networked filesystems).
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
const EMPTY = { servers: {} };
function tokensFile(dataDir) {
    return path.join(dataDir, 'mcp-tokens.json');
}
function isPlainObject(v) {
    return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}
/** Coerce a freeform JSON blob into the typed shape, dropping anything that
 * doesn't deserialize cleanly. Used both at read time and as a defensive
 * pass when third-party tooling has hand-edited the file. */
export function sanitizeTokensFile(raw) {
    if (!isPlainObject(raw))
        return { servers: {} };
    const servers = raw.servers;
    if (!isPlainObject(servers))
        return { servers: {} };
    const out = {};
    for (const [id, value] of Object.entries(servers)) {
        if (id === '__proto__' || id === 'constructor')
            continue;
        const tok = sanitizeToken(value);
        if (!tok)
            continue;
        out[id] = tok;
    }
    return { servers: out };
}
function sanitizeToken(raw) {
    if (!isPlainObject(raw))
        return null;
    const accessToken = typeof raw.accessToken === 'string' ? raw.accessToken.trim() : '';
    if (!accessToken)
        return null;
    const tokenType = typeof raw.tokenType === 'string' && raw.tokenType.trim()
        ? raw.tokenType.trim()
        : 'Bearer';
    const refreshToken = typeof raw.refreshToken === 'string' && raw.refreshToken.trim()
        ? raw.refreshToken.trim()
        : undefined;
    const scope = typeof raw.scope === 'string' && raw.scope.trim()
        ? raw.scope.trim()
        : undefined;
    const expiresAt = typeof raw.expiresAt === 'number' && Number.isFinite(raw.expiresAt)
        ? raw.expiresAt
        : undefined;
    const savedAt = typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt)
        ? raw.savedAt
        : Date.now();
    const tokenEndpoint = typeof raw.tokenEndpoint === 'string' && raw.tokenEndpoint.trim()
        ? raw.tokenEndpoint.trim()
        : undefined;
    const clientId = typeof raw.clientId === 'string' && raw.clientId.trim()
        ? raw.clientId.trim()
        : undefined;
    const clientSecret = typeof raw.clientSecret === 'string' && raw.clientSecret.trim()
        ? raw.clientSecret.trim()
        : undefined;
    const authServerIssuer = typeof raw.authServerIssuer === 'string' && raw.authServerIssuer.trim()
        ? raw.authServerIssuer.trim()
        : undefined;
    const redirectUri = typeof raw.redirectUri === 'string' && raw.redirectUri.trim()
        ? raw.redirectUri.trim()
        : undefined;
    const resourceUrl = typeof raw.resourceUrl === 'string' && raw.resourceUrl.trim()
        ? raw.resourceUrl.trim()
        : undefined;
    const out = { accessToken, tokenType, savedAt };
    if (refreshToken)
        out.refreshToken = refreshToken;
    if (scope)
        out.scope = scope;
    if (expiresAt !== undefined)
        out.expiresAt = expiresAt;
    if (tokenEndpoint)
        out.tokenEndpoint = tokenEndpoint;
    if (clientId)
        out.clientId = clientId;
    if (clientSecret)
        out.clientSecret = clientSecret;
    if (authServerIssuer)
        out.authServerIssuer = authServerIssuer;
    if (redirectUri)
        out.redirectUri = redirectUri;
    if (resourceUrl)
        out.resourceUrl = resourceUrl;
    return out;
}
export async function readTokensFile(dataDir) {
    try {
        const raw = await readFile(tokensFile(dataDir), 'utf8');
        return sanitizeTokensFile(JSON.parse(raw));
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT')
            return { ...EMPTY, servers: { ...EMPTY.servers } };
        if (e.name === 'SyntaxError') {
            console.error('[mcp-tokens] Corrupted JSON, returning empty:', e.message);
            return { ...EMPTY, servers: { ...EMPTY.servers } };
        }
        throw err;
    }
}
const writeLocks = new Map();
async function withLock(dataDir, fn) {
    const prev = writeLocks.get(dataDir) ?? Promise.resolve();
    const task = prev.catch(() => { }).then(fn);
    writeLocks.set(dataDir, task);
    try {
        return await task;
    }
    finally {
        if (writeLocks.get(dataDir) === task)
            writeLocks.delete(dataDir);
    }
}
async function writeTokensFile(dataDir, next) {
    const file = tokensFile(dataDir);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.' + randomBytes(4).toString('hex') + '.tmp';
    await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await rename(tmp, file);
    // Best-effort lockdown of file mode. Bearer tokens can hand someone
    // posting-as-you against the upstream MCP, so we restrict to owner-only
    // read/write where the OS supports it.
    try {
        await chmod(file, 0o600);
    }
    catch (err) {
        const e = err;
        if (e.code !== 'ENOTSUP' && e.code !== 'EPERM') {
            console.warn('[mcp-tokens] could not chmod 0600', file, e.message ?? err);
        }
    }
    return next;
}
/** Get the current token for a given server, or null when none is stored
 * (or the persisted entry is malformed). */
export async function getToken(dataDir, serverId) {
    const file = await readTokensFile(dataDir);
    return file.servers[serverId] ?? null;
}
/** Atomically merge a new token for `serverId` into the tokens file. */
export async function setToken(dataDir, serverId, token) {
    await withLock(dataDir, async () => {
        const file = await readTokensFile(dataDir);
        file.servers[serverId] = token;
        await writeTokensFile(dataDir, file);
    });
}
/** Atomically delete the stored token for `serverId`. No-op when absent. */
export async function clearToken(dataDir, serverId) {
    await withLock(dataDir, async () => {
        const file = await readTokensFile(dataDir);
        if (!(serverId in file.servers))
            return;
        delete file.servers[serverId];
        await writeTokensFile(dataDir, file);
    });
}
/** Bulk read used by the spawn pipeline so we make one disk hit per spawn,
 * not one per server. */
export async function readAllTokens(dataDir) {
    const file = await readTokensFile(dataDir);
    return file.servers;
}
/** True when the stored token is past its `expiresAt` (or within `skew`
 * milliseconds of expiring). Returns false when no `expiresAt` is recorded
 * — many providers issue non-expiring tokens. */
export function isTokenExpired(token, now = Date.now(), skew = 30_000) {
    if (typeof token.expiresAt !== 'number')
        return false;
    return token.expiresAt - skew <= now;
}
//# sourceMappingURL=mcp-tokens.js.map