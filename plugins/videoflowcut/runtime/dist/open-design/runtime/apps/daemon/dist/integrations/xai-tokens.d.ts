/**
 * Stored xAI OAuth token. Mirrors the relevant subset of an OAuth 2.0
 * token-endpoint response (RFC 6749 §5.1). client_id, redirect_uri, and
 * issuer aren't persisted because they're constants in `xai-oauth.ts`.
 */
export interface StoredXAIToken {
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
}
export interface XAITokensFile {
    token?: StoredXAIToken;
}
/** Coerce a freeform JSON blob into the typed shape, dropping anything
 * that doesn't deserialize cleanly. Used both at read time and as a
 * defensive pass when third-party tooling has hand-edited the file. */
export declare function sanitizeTokensFile(raw: unknown): XAITokensFile;
export declare function readTokensFile(dataDir: string): Promise<XAITokensFile>;
/** Get the current stored xAI token, or null when none is stored
 * (or the persisted entry is malformed). */
export declare function getXAIToken(dataDir: string): Promise<StoredXAIToken | null>;
/** Atomically replace the stored xAI token. */
export declare function setXAIToken(dataDir: string, token: StoredXAIToken): Promise<void>;
/** Atomically delete the stored xAI token. No-op when absent. */
export declare function clearXAIToken(dataDir: string): Promise<void>;
/** True when the stored token is past its `expiresAt` (or within `skew`
 * milliseconds of expiring). Returns false when no `expiresAt` is
 * recorded — some providers issue non-expiring tokens. */
export declare function isXAITokenExpired(token: StoredXAIToken, now?: number, skew?: number): boolean;
