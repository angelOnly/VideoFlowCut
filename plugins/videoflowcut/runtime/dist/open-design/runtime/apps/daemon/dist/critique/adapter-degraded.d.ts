/**
 * In-memory registry of adapters the conformance harness has marked
 * `critique:degraded` (Phase 10). Tracks (adapterId -> { reason, expiresAtMs })
 * with a per-entry TTL so a flaky adapter is sidelined automatically until
 * the next prerelease cycle without operator action.
 *
 * v1 scope: process-local Map. The orchestrator and adapter routing both
 * sit inside the same daemon process, so a daemon-life-scoped store is
 * sufficient to gate routing decisions. Persisting to SQLite (so the
 * mark survives a daemon restart) is a Phase 15 follow-up because it
 * needs a schema migration that should land alongside the rollout-flag
 * wiring rather than ahead of it. The plan's `markDegraded(id, reason, ttlMs)`
 * + `isDegraded(id)` contract is preserved so the upgrade is drop-in
 * (the same call sites keep working when the storage layer swaps).
 */
import type { DegradedReason } from '@open-design/contracts/critique';
export type DegradedSource = 'conformance' | 'orchestrator' | 'manual';
export interface DegradedEntry {
    adapterId: string;
    reason: DegradedReason;
    source: DegradedSource;
    /** Epoch milliseconds; reads after this are treated as cleared. */
    expiresAtMs: number;
    markedAtMs: number;
}
export interface DegradedClock {
    now(): number;
}
/** Default TTL the plan specifies for adapter-level marks (24h). */
export declare const ADAPTER_DEGRADED_DEFAULT_TTL_MS: number;
/**
 * Mark an adapter as degraded for `ttlMs` from now. Subsequent calls
 * for the same adapter overwrite the existing entry, so a worse
 * reason or a renewed TTL during the same window takes precedence.
 */
export declare function markDegraded(adapterId: string, reason: DegradedReason, ttlMs?: number, source?: DegradedSource): DegradedEntry;
/**
 * `true` when the adapter has an unexpired degraded mark. Reads after
 * the entry's TTL transparently clear the mark so the caller doesn't
 * have to evict separately.
 */
export declare function isDegraded(adapterId: string): boolean;
/**
 * Read the full entry (or `null` if not degraded). Same TTL-eviction
 * semantics as `isDegraded`. Useful for surfacing the reason on
 * operator dashboards.
 */
export declare function getDegradedEntry(adapterId: string): DegradedEntry | null;
/**
 * Explicitly clear a degraded mark (operator-initiated remediation).
 * Returns `true` if a mark was actually removed.
 */
export declare function clearDegraded(adapterId: string): boolean;
/**
 * Snapshot the current degraded-adapter table (post-TTL eviction).
 * Used by the `/api/metrics/critique` Prometheus exporter from
 * Phase 12.
 */
export declare function listDegraded(): DegradedEntry[];
/**
 * Test-only hook to inject a deterministic clock. Production code never
 * calls this; vitest cases that exercise TTL boundaries do.
 */
export declare function __setDegradedClockForTests(next: DegradedClock | null): void;
/**
 * Test-only hook to drop the table between cases without exposing the
 * map directly.
 */
export declare function __resetDegradedRegistryForTests(): void;
