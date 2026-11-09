export interface ResolvedXAICredential {
    accessToken: string;
    /** Whether this came back unchanged from disk or was refreshed inline. */
    source: 'stored' | 'refreshed';
}
/**
 * Get a usable xAI bearer, refreshing in place if the stored token is
 * within the expiry skew window. Returns null when nothing is stored,
 * the stored token has no refresh_token to renew with, or the refresh
 * call fails. Callers should treat null as "no OAuth available, fall
 * back to API key / re-login UI".
 */
export declare function resolveXAIBearer(dataDir: string, fetchImpl?: typeof fetch): Promise<ResolvedXAICredential | null>;
