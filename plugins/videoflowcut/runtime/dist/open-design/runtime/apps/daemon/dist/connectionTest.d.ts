import { lookup as dnsLookupCb } from 'node:dns';
import type { Pool } from 'undici';
import { type AgentTestRequest, type BaseUrlValidationResult, type ValidateBaseUrlOptions, type ConnectionTestResponse, type ProviderTestRequest } from '@open-design/contracts/api/connectionTest';
export { validateBaseUrl } from '@open-design/contracts/api/connectionTest';
export type DnsLookupAddress = {
    address: string;
    family: number;
};
export type DnsLookupFn = (hostname: string) => Promise<DnsLookupAddress[]>;
export declare function validateBaseUrlResolved(baseUrl: string, lookup?: DnsLookupFn, options?: ValidateBaseUrlOptions): Promise<BaseUrlValidationResult>;
/**
 * Validate a base URL that the USER deliberately configured as a provider
 * endpoint (connection test, model discovery, BYOK chat dispatch). Identical
 * to {@link validateBaseUrlResolved} except it honors the operator's
 * `OD_ALLOWED_INTERNAL_HOSTS` allowlist (issue #3225), so an internally hosted
 * gateway on an RFC1918 address can be reached when — and only when — the
 * operator opted in.
 *
 * INVARIANT: use this ONLY for user-configured endpoints. URLs that arrive
 * inside an upstream response (image/video download links) are
 * attacker-controllable and MUST stay on the strict {@link assertExternalAssetUrl}
 * / {@link validateBaseUrlResolved} path, which never consults the allowlist.
 */
export declare function validateUserProviderBaseUrl(baseUrl: string, lookup?: DnsLookupFn): Promise<BaseUrlValidationResult>;
/**
 * SSRF guard for asset URLs handed back inside a successful API
 * response — typically a `data.url` or `data.video_url` that points
 * at the gateway's CDN, but is attacker-controllable when the
 * upstream gateway is compromised or misconfigured. Routes the URL
 * through `validateBaseUrlResolved` (DNS-resolve → reject loopback,
 * RFC1918, link-local, CGNAT, metadata-service IPs) and returns a
 * discriminated union so callers don't have to repeat the
 * `validated.error || !validated.parsed` plumbing.
 *
 * Two callers today:
 *   - `byok-tools.ts` for the chat-tool image/video downloads
 *   - `media.ts` `renderSenseAudioImage` for the CLI agent path
 * Both hand the URL straight to `fetch(...)` next, so pair this
 * guard with `redirect: 'error'` on the fetch to also block a
 * 3xx hop into private space.
 *
 * Returns the DNS-resolved addresses that passed validation on the `ok` branch
 * so callers (e.g. {@link assertAndFetchExternalAsset}) can pin the actual
 * connection to those addresses and prevent DNS rebinding (issue #5478).
 */
export declare function assertExternalAssetUrl(rawUrl: string, lookup?: DnsLookupFn): Promise<{
    ok: true;
    resolvedAddresses?: ReadonlyArray<{
        address: string;
        family: number;
    }>;
} | {
    ok: false;
    error: string;
}>;
/**
 * Connection-time DNS validator for asset-download requests. Wraps `dns.lookup`
 * and rejects any resolved address that is loopback, RFC1918, link-local,
 * CGNAT, metadata-service, or multicast — the same predicate used during
 * pre-validation. Installed as the Undici Agent's `connect.lookup` so the
 * address we validate IS the address the socket connects to, closing the
 * DNS-rebinding / TOCTOU gap that a separate pre-validation lookup leaves open
 * (issue #5478). Same pattern as `brands/safe-fetch.ts` and
 * `plugins/plugin-asset-cache.ts`.
 *
 * Exported so the guard can be unit-tested without a live server.
 */
export declare function createAssetValidatingLookup(lookupImpl?: typeof dnsLookupCb): (hostname: string, options: unknown, callback: (...args: unknown[]) => void) => void;
/**
 * Test-visible accessor for the shared asset-validating dispatcher attached by
 * `assertAndFetchExternalAsset`. Tests key dispatcher assertions on the asset
 * URL and compare against this exact instance (`toBe`), so a regression that
 * reverts to forwarding the caller's turn-proxy dispatcher on the asset hop
 * fails loudly (issue #5478).
 */
export declare function getAssetValidatingDispatcher(): NonNullable<RequestInit['dispatcher']>;
/**
 * Validate an upstream-controlled asset URL and fetch it with the SSRF guard
 * pinned through redirects and DNS resolution. Runs `assertExternalAssetUrl`
 * on the literal URL (fail-closed on DNS errors), forces `redirect: 'error'`
 * (blocking a 3xx hop into private space), and routes the fetch through a
 * long-lived Undici dispatcher whose connection-time `lookup` rejects any
 * non-public address — so even if an attacker's DNS returns a public address
 * during pre-validation and loopback at connect time, the socket is refused
 * (issue #5478).
 *
 * For non-IP-literal hostnames, if DNS validation did not attach a vetted
 * address set (e.g., lookup failure), the function throws rather than falling
 * back to an unpinned fetch. IP literals are safe to fetch unpinned because
 * they were validated synchronously and have no hostname to rebind.
 *
 * Throws on a blocked host or unpinned-fetch refusal. Callers keep their own
 * `!resp.ok` HTTP-status handling. The forced `redirect` is spread last so it
 * overrides any value the caller passed in `init`.
 */
export declare function assertAndFetchExternalAsset(url: string, init?: RequestInit, lookup?: DnsLookupFn, fetchImpl?: typeof fetch): Promise<Response>;
export declare function resolveConnectionTestTimeoutMs(key: 'OD_CONNECTION_TEST_PROVIDER_TIMEOUT_MS' | 'OD_CONNECTION_TEST_AGENT_TIMEOUT_MS', fallback: number, env?: NodeJS.ProcessEnv): number;
export declare function mergeNoProxyWithLoopbackDefaults(noProxy: string | undefined): string | null;
export declare function proxyDispatcherRequestInit(env?: NodeJS.ProcessEnv, options?: Pool.Options): {
    close(): Promise<void>;
    requestInit: Pick<RequestInit, 'dispatcher'>;
};
export declare function redactSecrets(text: string, exactSecrets?: Array<string | undefined | null>): string;
type ProviderConnectionInput = ProviderTestRequest & {
    signal?: AbortSignal;
};
type AgentConnectionInput = AgentTestRequest & {
    signal?: AbortSignal;
};
export declare function isSmokeOkReply(text: unknown): boolean;
export declare function resolveOpenAIConnectionTestRunProviderPackage(input: Pick<ProviderTestRequest, 'protocol' | 'baseUrl' | 'apiKey' | 'apiVersion' | 'model'>): string | null;
export declare function testProviderConnection(input: ProviderConnectionInput): Promise<ConnectionTestResponse>;
type AgentSinkResult = {
    kind: 'text';
    text: string;
} | {
    kind: 'streamError';
    error: Error;
};
interface AgentSink {
    send: (event: string, payload: unknown) => void;
    result: Promise<AgentSinkResult>;
    streamError: Promise<Error>;
    getText: () => string;
    getStderrTail: () => string;
    appendRawStdout: (chunk: string) => void;
    getRawStdout: () => string;
    getRawStdoutTail: () => string;
    getResolvedModel: () => string | null;
    sawTerminalCompletion: () => boolean;
    dispose: () => void;
}
export declare function createAgentSink(): AgentSink;
export declare function testAgentConnection(input: AgentConnectionInput): Promise<ConnectionTestResponse>;
