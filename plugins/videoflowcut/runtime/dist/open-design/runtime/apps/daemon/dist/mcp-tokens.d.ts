/**
 * Stored OAuth token for a single MCP server. Mirrors the relevant subset
 * of an OAuth 2.0 token-endpoint response (RFC 6749 §5.1), plus the OAuth
 * client context the original authorization-code exchange used. Refresh
 * tokens are bound (RFC 6749 §6) to the client that received them, so we
 * have to refresh against the same `client_id` / `redirect_uri` pair —
 * persisting the context here is what lets us do that without re-running
 * authorization.
 */
export interface StoredMcpToken {
    /** The bearer token to send as `Authorization: Bearer …`. */
    accessToken: string;
    /** Refresh token (RFC 6749 §6) if the auth server issued one. */
    refreshToken?: string;
    /** Absolute epoch ms at which `accessToken` expires. Optional — some
     * providers never expire. */
    expiresAt?: number;
    /** RFC 6749 §5.1 token_type. Almost always `Bearer`. */
    tokenType: string;
    /** Space-separated scopes granted (verbatim from the token response). */
    scope?: string;
    /** Wall-clock epoch ms when this record was first persisted. */
    savedAt: number;
    /** Token endpoint that issued this token; reused verbatim for refresh. */
    tokenEndpoint?: string;
    /** Client id that obtained the refresh token. */
    clientId?: string;
    /** Confidential-client secret, if the upstream issued one. */
    clientSecret?: string;
    /** Authorization-server issuer, used to look the cached client back up. */
    authServerIssuer?: string;
    /** Redirect URI registered with the client at authorization time. */
    redirectUri?: string;
    /** RFC 8707 resource indicator the original token was scoped to. */
    resourceUrl?: string;
}
export interface McpTokensFile {
    /** keyed by McpServerConfig.id */
    servers: Record<string, StoredMcpToken>;
}
/** Coerce a freeform JSON blob into the typed shape, dropping anything that
 * doesn't deserialize cleanly. Used both at read time and as a defensive
 * pass when third-party tooling has hand-edited the file. */
export declare function sanitizeTokensFile(raw: unknown): McpTokensFile;
export declare function readTokensFile(dataDir: string): Promise<McpTokensFile>;
/** Get the current token for a given server, or null when none is stored
 * (or the persisted entry is malformed). */
export declare function getToken(dataDir: string, serverId: string): Promise<StoredMcpToken | null>;
/** Atomically merge a new token for `serverId` into the tokens file. */
export declare function setToken(dataDir: string, serverId: string, token: StoredMcpToken): Promise<void>;
/** Atomically delete the stored token for `serverId`. No-op when absent. */
export declare function clearToken(dataDir: string, serverId: string): Promise<void>;
/** Bulk read used by the spawn pipeline so we make one disk hit per spawn,
 * not one per server. */
export declare function readAllTokens(dataDir: string): Promise<Record<string, StoredMcpToken>>;
/** True when the stored token is past its `expiresAt` (or within `skew`
 * milliseconds of expiring). Returns false when no `expiresAt` is recorded
 * — many providers issue non-expiring tokens. */
export declare function isTokenExpired(token: StoredMcpToken, now?: number, skew?: number): boolean;
