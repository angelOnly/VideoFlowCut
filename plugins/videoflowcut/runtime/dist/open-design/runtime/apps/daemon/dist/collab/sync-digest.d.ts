import { readVelaControlApiContext } from '../integrations/vela.js';
/** The two faces whose payloads are big enough (and change rarely enough) to be
 *  worth reusing from a local snapshot. Workspace context and billing are
 *  deliberately absent: they are cheap and must always read live. */
export type SyncDigestFace = 'catalog' | 'members';
export interface SyncDigest {
    catalogToken: string;
    membersToken: string;
    contextToken: string;
    billingToken: string;
}
/**
 * One digest read, carried together with the identity it was read under.
 *
 * Account + workspace travel WITH the tokens on purpose: a snapshot keyed by a
 * different account than the token it is compared against would let one signed-
 * in user read another's cached data. Keeping them in one object makes that
 * mismatch unrepresentable.
 */
export interface SyncDigestReading {
    /** Vela user id — the account half of the snapshot key. Never empty. */
    accountId: string;
    /** Active workspace id — the workspace half of the snapshot key. Never empty. */
    workspaceId: string;
    digest: SyncDigest;
}
export type SyncDigestReader = () => Promise<SyncDigestReading | null>;
export interface SyncDigestReaderOptions {
    env?: NodeJS.ProcessEnv;
    getWorkspaceId: () => string | null | undefined;
    fetchImpl?: typeof fetch;
    /** Injectable session read for tests; defaults to the vela control-key session. */
    readSession?: typeof readVelaControlApiContext;
    /** Abort a hung digest so it can never outlast the real fetch it is saving. */
    timeoutMs?: number;
    /** How long to stop asking after the endpoint failed to answer. */
    failureCooldownMs?: number;
    now?: () => number;
    onError?: (error: unknown) => void;
}
/** Pick the token that governs one face. */
export declare function tokenForFace(digest: SyncDigest, face: SyncDigestFace): string;
/**
 * Validate a digest response body.
 *
 * All four fields must be present and be strings. `billingToken` is allowed to
 * be empty (no subscription row); the others are not validated for content
 * because their content is opaque by contract.
 */
export declare function parseSyncDigest(value: unknown): SyncDigest | null;
/**
 * A digest reader with in-flight coalescing.
 *
 * Catalog and members are refreshed by the same page load milliseconds apart,
 * so without coalescing one navigation costs two identical digest round-trips.
 * Deliberately in-flight only — no TTL — so a settled reading is never reused:
 * the whole point of the token is that it is compared against a freshly read
 * one, and a cached token could green-light a snapshot the cloud has already
 * moved past.
 */
export declare function createSyncDigestReader(options: SyncDigestReaderOptions): SyncDigestReader;
