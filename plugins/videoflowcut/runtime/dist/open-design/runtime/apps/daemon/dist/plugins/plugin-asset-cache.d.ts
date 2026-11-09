import { lookup as dnsLookupCb } from 'node:dns';
/** Media extensions we are willing to cache + proxy. Anything else (HTML,
 *  CSS, JS, fonts) is intentionally left alone so this surface never becomes a
 *  general-purpose open proxy. */
export declare const CACHEABLE_MEDIA_EXT: RegExp;
/** True when `raw` is an absolute http(s) URL pointing at a media file we are
 *  willing to route through the cache. Pure + side-effect free so the URL
 *  rewriter and tests can share the exact predicate. */
export declare function isCacheableExternalUrl(raw: unknown): raw is string;
/** Map a cacheable external URL to its same-origin proxy URL. */
export declare function assetCacheRewriteUrl(raw: string): string;
/** Error carrying the HTTP status the route should surface. */
export declare class AssetCacheError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
/** True for any address an external CDN must never resolve to: loopback,
 *  link-local, private, CGNAT, ULA, multicast, or unspecified. An unparseable
 *  input is treated as unsafe. */
export declare function isPrivateAddress(addr: string): boolean;
/** Cheap up-front rejection: enforce http(s), no embedded credentials, no
 *  localhost, and no *literal* private IP. This is NOT the DNS-rebinding guard
 *  (that is `createValidatingLookup`, applied at connection time) — it only
 *  fast-fails the obvious cases before any socket is opened. */
export declare function assertSafePublicUrl(raw: string): URL;
type DnsLookupCb = typeof dnsLookupCb;
/** Wrap a `dns.lookup`-shaped resolver so the resolved address is rejected when
 *  it is private. Installed as the undici Agent's connection-time `lookup`, so
 *  the validated address IS the one the socket connects to — closing the
 *  DNS-rebinding / TOCTOU gap a separate pre-validation lookup would leave open.
 *  Exported so the guard can be unit-tested without standing up a server. */
export declare function createValidatingLookup(lookupImpl?: DnsLookupCb): (hostname: string, options: unknown, callback?: (err: Error | null, address?: unknown, family?: number) => void) => void;
export interface AssetCacheResult {
    buf: Buffer;
    contentType: string;
}
export interface PluginAssetCacheOptions {
    /** Directory the cache writes content-addressed blobs into. */
    cacheDir: string;
    /** Hard ceiling on a single asset's size. Default 64 MiB. */
    maxBytes?: number;
    /** Per-fetch timeout. Default 15s. */
    fetchTimeoutMs?: number;
    /** Injectable fetch (tests). Defaults to global fetch. */
    fetchImpl?: typeof fetch;
    /** Injectable `dns.lookup` for the connection-time SSRF guard (tests). */
    lookupImpl?: DnsLookupCb;
}
export interface PluginAssetCache {
    get(rawUrl: string): Promise<AssetCacheResult>;
}
/**
 * Fetch a user-influenced external URL with SSRF protection. Rejects
 * private/loopback/link-local/metadata hosts, bad schemes, and embedded
 * credentials up front (`assertSafePublicUrl`), and pins every outbound
 * connection — including redirect hops, since `follow` re-connects per hop —
 * to a validating DNS lookup so a hostname cannot rebind to a private address.
 *
 * Every daemon fetch of a user-supplied URL must route through this instead of
 * a bare `fetch(url, { redirect: 'follow' })`, so no single call site can
 * silently reopen the SSRF hole.
 */
export declare function safeExternalFetch(rawUrl: string, init?: RequestInit, fetchImpl?: typeof fetch): Promise<Response>;
/** Build a disk-backed cache for external preview media. Concurrent requests
 *  for the same URL share one in-flight fetch; completed fetches persist to
 *  `<cacheDir>/<sha256>` (+ `.json` sidecar) and are replayed from disk. */
export declare function createPluginAssetCache(opts: PluginAssetCacheOptions): PluginAssetCache;
/** Exposed for tests that need to assert the on-disk key layout. */
export declare function assetCacheKey(rawUrl: string): string;
export {};
