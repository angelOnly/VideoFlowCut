import { lookup as dnsLookupCb } from 'node:dns';
import type { LookupFunction } from 'node:net';
/**
 * Throw unless `url` is an http(s) URL whose host is a public address — checked
 * both as the literal host and, for a hostname, against every DNS answer.
 */
export declare function assertPublicAssetUrl(url: string, signal?: AbortSignal): Promise<void>;
type DnsLookupCb = typeof dnsLookupCb;
/**
 * Wrap a `dns.lookup`-shaped resolver so the resolved address is rejected when
 * it is non-public. Installed as the undici Agent's connection-time `lookup`, so
 * the address we validate IS the one the socket connects to — closing the
 * DNS-rebinding / TOCTOU gap that a separate pre-validation lookup leaves open
 * (an attacker-controlled name answering public for the check and private for
 * the connect). Uses the same `isNonPublicHost` predicate as
 * `assertPublicAssetUrl` so the connect-time and pre-check block sets can't
 * drift. Exported so the guard can be unit-tested without a live server.
 */
export declare function createValidatingLookup(lookupImpl?: DnsLookupCb): LookupFunction;
export declare function fetchPublicAsset(url: string, init?: RequestInit, options?: {
    httpsOnly?: boolean;
    fetch?: typeof fetch;
}): Promise<Response>;
export {};
