import { type OAuthTokenResponse, type PendingAuthCache } from '../mcp-oauth.js';
export declare const XAI_OAUTH_ISSUER = "https://auth.x.ai";
export declare const XAI_OAUTH_AUTHORIZATION_ENDPOINT = "https://auth.x.ai/oauth2/authorize";
export declare const XAI_OAUTH_TOKEN_ENDPOINT = "https://auth.x.ai/oauth2/token";
export declare const XAI_OAUTH_SCOPE = "openid profile email offline_access grok-cli:access api:access";
export declare const XAI_OAUTH_REDIRECT_HOST = "127.0.0.1";
export declare const XAI_OAUTH_REDIRECT_PORT = 56121;
export declare const XAI_OAUTH_REDIRECT_PATH = "/callback";
/**
 * PoC client_id reused from NousResearch/hermes-agent. xAI does not yet
 * publish a public application registration flow that we know of; once
 * an OpenDesign client_id is provisioned, replace this constant.
 */
export declare const XAI_OAUTH_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
/** Stable provider id used to key the xAI token in any per-server cache. */
export declare const XAI_PROVIDER_ID = "xai";
export declare function xaiRedirectUri(): string;
export interface BeginXAIAuthInput {
    pending: PendingAuthCache;
}
export interface BeginXAIAuthResult {
    authorizeUrl: string;
    state: string;
}
/**
 * Pre-redirect half of the OAuth dance. Mints a PKCE verifier/challenge,
 * builds the authorize URL, and stashes the pending state in `pending`.
 *
 * The caller is responsible for sending the user's browser to
 * `authorizeUrl` and then receiving the callback at `xaiRedirectUri()`.
 * When the callback arrives, pass `state` and `code` to `completeXAIAuth`.
 */
export declare function beginXAIAuth(input: BeginXAIAuthInput): BeginXAIAuthResult;
export interface CompleteXAIAuthInput {
    pending: PendingAuthCache;
    state: string;
    code: string;
    fetchImpl?: typeof fetch;
}
/**
 * Post-callback half of the OAuth dance. Looks up `state` in `pending`,
 * validates it (one-shot, TTL-checked by `PendingAuthCache`), and
 * exchanges `code` for tokens. Throws if `state` is unknown, expired,
 * already consumed, or was issued for a different provider.
 */
export declare function completeXAIAuth(input: CompleteXAIAuthInput): Promise<OAuthTokenResponse>;
export interface RefreshXAITokenInput {
    refreshToken: string;
    fetchImpl?: typeof fetch;
}
/**
 * Refresh an existing xAI access token. The refresh_token is bound to
 * the client_id that originally received it (RFC 6749 §6); since we
 * always use the same fixed client_id, we don't need to persist it
 * per-token.
 */
export declare function refreshXAIToken(input: RefreshXAITokenInput): Promise<OAuthTokenResponse>;
