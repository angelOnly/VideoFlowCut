// Daemon-side OAuth 2.1 client for HTTP / SSE MCP servers.
//
// Replaces the per-agent `mcp-remote` subprocess that bound a transient
// `localhost:<port>` listener — that pattern can never work for a cloud-
// deployed daemon (the user's browser can't reach the listener) and it
// also broke locally because the listener died with the agent turn.
//
// What this module owns:
//   - Discovery of the auth server for a given MCP URL
//     (RFC 9728 protected-resource → RFC 8414 authorization-server).
//   - Dynamic Client Registration (RFC 7591) when the server supports it,
//     cached per `(authServerUrl, redirectUri)` in `<dataDir>/mcp-oauth-clients.json`
//     so we register once and reuse forever.
//   - PKCE (RFC 7636) code-verifier / code-challenge generation.
//   - Authorization-code → token exchange and refresh-token rotation.
//   - In-memory state cache keyed by the `state` parameter, used to look
//     up the originating server + verifier when the browser hits our
//     callback endpoint.
//
// Token persistence lives in `mcp-tokens.ts`. This file is the protocol
// layer; storage is somebody else's job.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
// ───────────────────────────────────────────────────────────────────────
// PKCE + state helpers.
// ───────────────────────────────────────────────────────────────────────
const VERIFIER_LEN = 64; // RFC 7636 §4.1: 43–128 chars
function base64url(buf) {
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}
export function generateCodeVerifier() {
    return base64url(randomBytes(VERIFIER_LEN));
}
export function deriveCodeChallenge(verifier) {
    return base64url(createHash('sha256').update(verifier).digest());
}
export function generateState() {
    return base64url(randomBytes(32));
}
// ───────────────────────────────────────────────────────────────────────
// Discovery.
// ───────────────────────────────────────────────────────────────────────
/**
 * Try to fetch the protected-resource metadata for a given MCP URL.
 *
 * Per RFC 9728, the well-known is at the resource origin's
 * `/.well-known/oauth-protected-resource[<path>]`. We try both the
 * path-suffixed form and the bare `/.well-known/...` so servers that
 * only publish at the root still work.
 */
export async function discoverProtectedResource(resourceUrl, fetchImpl = fetch) {
    let parsed;
    try {
        parsed = new URL(resourceUrl);
    }
    catch {
        return null;
    }
    const candidates = [
        new URL(`/.well-known/oauth-protected-resource${parsed.pathname.replace(/\/+$/u, '')}`, `${parsed.protocol}//${parsed.host}`).toString(),
        new URL('/.well-known/oauth-protected-resource', `${parsed.protocol}//${parsed.host}`).toString(),
    ];
    for (const url of candidates) {
        const json = await fetchJson(url, fetchImpl);
        if (json)
            return json;
    }
    return null;
}
/**
 * Fetch the authorization-server metadata for an issuer URL. Tries both
 * the OAuth (RFC 8414) and OIDC layouts (`/.well-known/oauth-authorization-server`
 * and `/.well-known/openid-configuration`); some providers only publish one.
 */
export async function discoverAuthServer(issuer, fetchImpl = fetch) {
    let parsed;
    try {
        parsed = new URL(issuer);
    }
    catch {
        return null;
    }
    const trimmed = parsed.pathname.replace(/\/+$/u, '');
    const base = `${parsed.protocol}//${parsed.host}`;
    const candidates = [
        `${base}/.well-known/oauth-authorization-server${trimmed}`,
        `${base}/.well-known/openid-configuration${trimmed}`,
        `${base}/.well-known/oauth-authorization-server`,
        `${base}/.well-known/openid-configuration`,
    ];
    for (const url of candidates) {
        const json = await fetchJson(url, fetchImpl);
        if (json && typeof json.authorization_endpoint === 'string' && typeof json.token_endpoint === 'string') {
            // Spread first so the explicit issuer wins (otherwise duplicate-key
            // assignments under exactOptionalPropertyTypes complain).
            return { ...json, issuer: json.issuer ?? issuer };
        }
    }
    return null;
}
async function fetchJson(url, fetchImpl) {
    try {
        const res = await fetchImpl(url, {
            headers: { accept: 'application/json' },
        });
        if (!res.ok)
            return null;
        return (await res.json());
    }
    catch {
        return null;
    }
}
function clientsFile(dataDir) {
    return path.join(dataDir, 'mcp-oauth-clients.json');
}
async function readClientCache(dataDir) {
    try {
        const raw = await readFile(clientsFile(dataDir), 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.clients))
            return { clients: [] };
        return { clients: parsed.clients.filter(isRegisteredClient) };
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT')
            return { clients: [] };
        throw err;
    }
}
function isRegisteredClient(v) {
    if (!v || typeof v !== 'object')
        return false;
    const r = v;
    return (typeof r.authServerIssuer === 'string' &&
        typeof r.redirectUri === 'string' &&
        typeof r.clientId === 'string');
}
async function writeClientCache(dataDir, next) {
    const file = clientsFile(dataDir);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.' + randomBytes(4).toString('hex') + '.tmp';
    await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await rename(tmp, file);
}
/**
 * POST to the auth server's `registration_endpoint` per RFC 7591. Returns
 * a freshly issued client_id (and optional client_secret). Caller is
 * responsible for caching the result.
 */
export async function registerClient(registrationEndpoint, redirectUri, fetchImpl = fetch) {
    const body = {
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        client_name: 'OpenDesign',
        application_type: 'web',
    };
    const res = await fetchImpl(registrationEndpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`dynamic client registration failed: HTTP ${res.status} ${res.statusText} ${txt}`);
    }
    const json = (await res.json());
    if (!json.client_id) {
        throw new Error('dynamic client registration response missing client_id');
    }
    const out = { clientId: json.client_id };
    if (json.client_secret)
        out.clientSecret = json.client_secret;
    return out;
}
/**
 * Cached version of `registerClient`. Looks up `(authServerIssuer, redirectUri)`
 * in the cache file and re-uses the existing client; falls back to a fresh
 * DCR call when nothing is cached.
 */
export async function getOrRegisterClient(dataDir, authServer, redirectUri, fetchImpl = fetch) {
    const cache = await readClientCache(dataDir);
    const cached = cache.clients.find((c) => c.authServerIssuer === authServer.issuer && c.redirectUri === redirectUri);
    if (cached)
        return cached;
    if (!authServer.registration_endpoint) {
        throw new Error(`auth server ${authServer.issuer} does not advertise a registration_endpoint and no client is pre-registered`);
    }
    const reg = await registerClient(authServer.registration_endpoint, redirectUri, fetchImpl);
    const next = {
        authServerIssuer: authServer.issuer,
        redirectUri,
        clientId: reg.clientId,
        registeredAt: Date.now(),
    };
    if (reg.clientSecret)
        next.clientSecret = reg.clientSecret;
    cache.clients.push(next);
    await writeClientCache(dataDir, cache);
    return next;
}
export function buildAuthorizeUrl(input) {
    const u = new URL(input.authServer.authorization_endpoint);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('client_id', input.clientId);
    u.searchParams.set('redirect_uri', input.redirectUri);
    u.searchParams.set('state', input.state);
    u.searchParams.set('code_challenge', input.codeChallenge);
    u.searchParams.set('code_challenge_method', 'S256');
    if (input.scope)
        u.searchParams.set('scope', input.scope);
    // RFC 8707 resource indicator — narrows the issued token to the MCP
    // resource we actually care about. Most authoritative MCP servers
    // require it; harmless when ignored.
    if (input.resource)
        u.searchParams.set('resource', input.resource);
    return u.toString();
}
export async function exchangeCodeForToken(input, fetchImpl = fetch) {
    const form = new URLSearchParams();
    form.set('grant_type', 'authorization_code');
    form.set('code', input.code);
    form.set('redirect_uri', input.redirectUri);
    form.set('client_id', input.clientId);
    form.set('code_verifier', input.codeVerifier);
    if (input.resource)
        form.set('resource', input.resource);
    return tokenRequest(input.tokenEndpoint, form, input.clientSecret, fetchImpl);
}
export async function refreshAccessToken(input, fetchImpl = fetch) {
    const form = new URLSearchParams();
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', input.refreshToken);
    form.set('client_id', input.clientId);
    if (input.scope)
        form.set('scope', input.scope);
    if (input.resource)
        form.set('resource', input.resource);
    return tokenRequest(input.tokenEndpoint, form, input.clientSecret, fetchImpl);
}
async function tokenRequest(tokenEndpoint, form, clientSecret, fetchImpl) {
    const headers = {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
    };
    if (clientSecret) {
        // RFC 6749 §2.3.1 — confidential clients use HTTP Basic with the
        // client_id we already put in the form. Public clients (PKCE-only)
        // skip this branch.
        const basic = Buffer.from(`${form.get('client_id')}:${clientSecret}`).toString('base64');
        headers['authorization'] = `Basic ${basic}`;
    }
    const res = await fetchImpl(tokenEndpoint, {
        method: 'POST',
        headers,
        body: form.toString(),
    });
    if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`token endpoint rejected request: HTTP ${res.status} ${res.statusText} ${txt}`);
    }
    const json = (await res.json());
    if (!json.access_token) {
        throw new Error('token endpoint response missing access_token');
    }
    return json;
}
async function safeText(res) {
    try {
        const t = await res.text();
        return t.slice(0, 500);
    }
    catch {
        return '';
    }
}
// ───────────────────────────────────────────────────────────────────────
// In-memory pending-state cache.
// ───────────────────────────────────────────────────────────────────────
/**
 * The OAuth dance is split across two HTTP requests on our side:
 *   1. POST /api/mcp/oauth/start          — we mint state + verifier
 *   2. GET  /api/mcp/oauth/callback       — browser returns code + state
 * State has to survive between (1) and (2) on the daemon. We keep it in a
 * Map with a TTL sweeper; persistence isn't needed because the user has
 * to complete auth in the same daemon process anyway (state is single-use).
 */
export class PendingAuthCache {
    ttlMs;
    store = new Map();
    timer = null;
    constructor(ttlMs = 10 * 60 * 1000) {
        this.ttlMs = ttlMs;
    }
    put(state, value) {
        this.store.set(state, value);
        this.startSweeper();
    }
    /** One-shot consume — any successful callback removes the state so a
     * replay can't reuse it. */
    consume(state) {
        const v = this.store.get(state);
        if (!v)
            return null;
        this.store.delete(state);
        if (Date.now() - v.createdAt > this.ttlMs)
            return null;
        return v;
    }
    size() {
        return this.store.size;
    }
    /** Stop the background sweeper. Used by tests; production lets the
     * timer ride on the daemon process lifetime. */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    startSweeper() {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.sweep(), Math.min(this.ttlMs, 60_000));
        // unref so the cache doesn't keep the event loop alive in tests
        if (typeof this.timer === 'object' && this.timer && typeof this.timer.unref === 'function') {
            this.timer.unref();
        }
    }
    sweep() {
        const now = Date.now();
        for (const [k, v] of this.store) {
            if (now - v.createdAt > this.ttlMs)
                this.store.delete(k);
        }
        if (this.store.size === 0 && this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
/**
 * Run the entire pre-redirect half of the OAuth dance:
 *   discovery → DCR (cached) → PKCE → authorize URL.
 *
 * Returns everything the caller needs to (a) push the user's browser at the
 * correct authorize URL, and (b) finish the flow when the callback hits.
 */
export async function beginAuth(input) {
    const fetchImpl = input.fetchImpl ?? fetch;
    // Step 1: ask the MCP server who its auth server is. If the server
    // doesn't publish protected-resource metadata, fall back to assuming
    // the resource origin IS the auth server — most "stand-alone" MCP
    // providers (Higgsfield etc.) host both at the same host.
    const prm = await discoverProtectedResource(input.serverUrl, fetchImpl);
    const issuerHint = prm?.authorization_servers?.[0];
    const issuer = issuerHint ?? new URL(input.serverUrl).origin;
    // Step 2: discovery on the auth server.
    const authServer = await discoverAuthServer(issuer, fetchImpl);
    if (!authServer) {
        throw new Error(`could not discover OAuth metadata for ${issuer}`);
    }
    // Step 3: ensure we have a registered client_id (DCR if missing).
    const client = await getOrRegisterClient(input.dataDir, authServer, input.redirectUri, fetchImpl);
    // Step 4: PKCE + state.
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = deriveCodeChallenge(codeVerifier);
    const state = generateState();
    const scope = input.scope ??
        (Array.isArray(prm?.scopes_supported) && prm.scopes_supported.length > 0
            ? prm.scopes_supported.join(' ')
            : authServer.scopes_supported?.join(' '));
    const resource = prm?.resource ?? input.serverUrl;
    const authUrlInput = {
        authServer,
        clientId: client.clientId,
        redirectUri: input.redirectUri,
        state,
        codeChallenge,
        resource,
    };
    if (scope)
        authUrlInput.scope = scope;
    const authorizeUrl = buildAuthorizeUrl(authUrlInput);
    const pending = {
        serverId: input.serverId,
        authServerIssuer: authServer.issuer,
        tokenEndpoint: authServer.token_endpoint,
        clientId: client.clientId,
        redirectUri: input.redirectUri,
        codeVerifier,
        resourceUrl: resource,
        createdAt: Date.now(),
    };
    if (client.clientSecret)
        pending.clientSecret = client.clientSecret;
    if (scope)
        pending.scope = scope;
    return { authorizeUrl, state, pending };
}
//# sourceMappingURL=mcp-oauth.js.map