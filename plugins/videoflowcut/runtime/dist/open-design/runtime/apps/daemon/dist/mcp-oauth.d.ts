/** RFC 9728 `oauth-protected-resource` document fields we use. */
export interface ProtectedResourceMetadata {
    resource?: string;
    authorization_servers?: string[];
    scopes_supported?: string[];
}
/** RFC 8414 / OIDC discovery document fields we use. */
export interface AuthorizationServerMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    registration_endpoint?: string;
    scopes_supported?: string[];
    response_types_supported?: string[];
    grant_types_supported?: string[];
    code_challenge_methods_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
}
/** Cached client registration for a given auth server + redirect URI. */
export interface RegisteredClient {
    authServerIssuer: string;
    redirectUri: string;
    clientId: string;
    clientSecret?: string;
    registeredAt: number;
}
/** RFC 6749 §5.1 token endpoint response (subset). */
export interface OAuthTokenResponse {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}
/** In-flight authorization request. Stashed in memory while the user
 * approves in their browser. */
export interface PendingAuthState {
    serverId: string;
    authServerIssuer: string;
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier: string;
    scope?: string;
    resourceUrl?: string;
    createdAt: number;
}
export declare function generateCodeVerifier(): string;
export declare function deriveCodeChallenge(verifier: string): string;
export declare function generateState(): string;
/**
 * Try to fetch the protected-resource metadata for a given MCP URL.
 *
 * Per RFC 9728, the well-known is at the resource origin's
 * `/.well-known/oauth-protected-resource[<path>]`. We try both the
 * path-suffixed form and the bare `/.well-known/...` so servers that
 * only publish at the root still work.
 */
export declare function discoverProtectedResource(resourceUrl: string, fetchImpl?: typeof fetch): Promise<ProtectedResourceMetadata | null>;
/**
 * Fetch the authorization-server metadata for an issuer URL. Tries both
 * the OAuth (RFC 8414) and OIDC layouts (`/.well-known/oauth-authorization-server`
 * and `/.well-known/openid-configuration`); some providers only publish one.
 */
export declare function discoverAuthServer(issuer: string, fetchImpl?: typeof fetch): Promise<AuthorizationServerMetadata | null>;
/**
 * POST to the auth server's `registration_endpoint` per RFC 7591. Returns
 * a freshly issued client_id (and optional client_secret). Caller is
 * responsible for caching the result.
 */
export declare function registerClient(registrationEndpoint: string, redirectUri: string, fetchImpl?: typeof fetch): Promise<{
    clientId: string;
    clientSecret?: string;
}>;
/**
 * Cached version of `registerClient`. Looks up `(authServerIssuer, redirectUri)`
 * in the cache file and re-uses the existing client; falls back to a fresh
 * DCR call when nothing is cached.
 */
export declare function getOrRegisterClient(dataDir: string, authServer: AuthorizationServerMetadata, redirectUri: string, fetchImpl?: typeof fetch): Promise<RegisteredClient>;
export interface AuthorizeUrlInput {
    authServer: AuthorizationServerMetadata;
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
    scope?: string;
    resource?: string;
}
export declare function buildAuthorizeUrl(input: AuthorizeUrlInput): string;
export interface ExchangeCodeInput {
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    code: string;
    codeVerifier: string;
    resource?: string;
}
export declare function exchangeCodeForToken(input: ExchangeCodeInput, fetchImpl?: typeof fetch): Promise<OAuthTokenResponse>;
export interface RefreshTokenInput {
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    refreshToken: string;
    scope?: string;
    resource?: string;
}
export declare function refreshAccessToken(input: RefreshTokenInput, fetchImpl?: typeof fetch): Promise<OAuthTokenResponse>;
/**
 * The OAuth dance is split across two HTTP requests on our side:
 *   1. POST /api/mcp/oauth/start          — we mint state + verifier
 *   2. GET  /api/mcp/oauth/callback       — browser returns code + state
 * State has to survive between (1) and (2) on the daemon. We keep it in a
 * Map with a TTL sweeper; persistence isn't needed because the user has
 * to complete auth in the same daemon process anyway (state is single-use).
 */
export declare class PendingAuthCache {
    private readonly ttlMs;
    private store;
    private timer;
    constructor(ttlMs?: number);
    put(state: string, value: PendingAuthState): void;
    /** One-shot consume — any successful callback removes the state so a
     * replay can't reuse it. */
    consume(state: string): PendingAuthState | null;
    size(): number;
    /** Stop the background sweeper. Used by tests; production lets the
     * timer ride on the daemon process lifetime. */
    stop(): void;
    private startSweeper;
    private sweep;
}
export interface BeginAuthInput {
    serverId: string;
    serverUrl: string;
    redirectUri: string;
    dataDir: string;
    scope?: string;
    fetchImpl?: typeof fetch;
}
export interface BeginAuthResult {
    authorizeUrl: string;
    state: string;
    pending: PendingAuthState;
}
/**
 * Run the entire pre-redirect half of the OAuth dance:
 *   discovery → DCR (cached) → PKCE → authorize URL.
 *
 * Returns everything the caller needs to (a) push the user's browser at the
 * correct authorize URL, and (b) finish the flow when the callback hits.
 */
export declare function beginAuth(input: BeginAuthInput): Promise<BeginAuthResult>;
