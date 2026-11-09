// Persistent xAI OAuth token storage.
//
// Mirrors the pattern in `mcp-tokens.ts` (atomic write + per-dataDir
// in-memory mutex + chmod 0600), but simplified for the xAI single-token
// case: there's only ever one xAI account active per dataDir, so we
// don't need the per-server-id map. The on-disk layout is `{ token: ... }`
// to leave room for future multi-account or multi-account-id schemas
// without breaking existing files.
//
// File: `<dataDir>/xai-tokens.json`
// Permissions: chmod 0600 best-effort on POSIX.
// Lock: in-memory promise chain keyed by dataDir.
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
const EMPTY = {};
function tokensFile(dataDir) {
    return path.join(dataDir, 'xai-tokens.json');
}
function isPlainObject(v) {
    return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}
/** Coerce a freeform JSON blob into the typed shape, dropping anything
 * that doesn't deserialize cleanly. Used both at read time and as a
 * defensive pass when third-party tooling has hand-edited the file. */
export function sanitizeTokensFile(raw) {
    if (!isPlainObject(raw))
        return {};
    const tok = sanitizeToken(raw.token);
    return tok ? { token: tok } : {};
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
    const out = { accessToken, tokenType, savedAt };
    if (refreshToken)
        out.refreshToken = refreshToken;
    if (scope)
        out.scope = scope;
    if (expiresAt !== undefined)
        out.expiresAt = expiresAt;
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
            return { ...EMPTY };
        if (e.name === 'SyntaxError') {
            console.error('[xai-tokens] Corrupted JSON, returning empty:', e.message);
            return { ...EMPTY };
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
    // Best-effort lockdown of file mode. Bearer tokens grant posting-as-you
    // against xAI APIs (and the user's X account scope), so we restrict to
    // owner-only read/write where the OS supports it.
    try {
        await chmod(file, 0o600);
    }
    catch (err) {
        const e = err;
        if (e.code !== 'ENOTSUP' && e.code !== 'EPERM') {
            console.warn('[xai-tokens] could not chmod 0600', file, e.message ?? err);
        }
    }
    return next;
}
/** Get the current stored xAI token, or null when none is stored
 * (or the persisted entry is malformed). */
export async function getXAIToken(dataDir) {
    const file = await readTokensFile(dataDir);
    return file.token ?? null;
}
/** Atomically replace the stored xAI token. */
export async function setXAIToken(dataDir, token) {
    await withLock(dataDir, async () => {
        await writeTokensFile(dataDir, { token });
    });
}
/** Atomically delete the stored xAI token. No-op when absent. */
export async function clearXAIToken(dataDir) {
    await withLock(dataDir, async () => {
        const file = await readTokensFile(dataDir);
        if (!file.token)
            return;
        await writeTokensFile(dataDir, {});
    });
}
/** True when the stored token is past its `expiresAt` (or within `skew`
 * milliseconds of expiring). Returns false when no `expiresAt` is
 * recorded — some providers issue non-expiring tokens. */
export function isXAITokenExpired(token, now = Date.now(), skew = 120_000) {
    if (typeof token.expiresAt !== 'number')
        return false;
    return token.expiresAt - skew <= now;
}
//# sourceMappingURL=xai-tokens.js.map