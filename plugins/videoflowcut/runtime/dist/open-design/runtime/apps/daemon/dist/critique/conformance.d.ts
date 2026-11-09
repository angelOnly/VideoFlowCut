/**
 * Adapter conformance harness (Phase 10).
 *
 * The plan asks the prerelease cycle to feed every production adapter the
 * same 10 brief templates and classify each run as `shipped`, `degraded`,
 * or `failed`. The harness sits one level below that schedule: it knows
 * how to take an `AsyncIterable<string>` (everything a real adapter
 * exposes is some flavour of that, whether it's a child process's stdout
 * or an in-process stub) plus the parser config and produce a
 * `ConformanceOutcome`. The synthetic fixtures from
 * `__fixtures__/adapters/` are the deterministic inputs the test
 * harness uses; production code in `runOrchestrator` already covers
 * the live path, so this helper exists to give CI a way to validate
 * end-to-end shape without depending on a network model.
 *
 * The plan's retry budget (one retry per degraded template, two
 * consecutive degraded counts as one failure, ≥ 90% shipped + ≥ 95%
 * clean-parse thresholds) is intentionally NOT implemented here.
 * Those policies live in the scheduler that calls this helper N times
 * across the adapter × template matrix; keeping the harness scoped to
 * a single run makes it testable in isolation.
 *
 * Classification rules (each row that matches wins, top to bottom):
 *
 *   1. The parser threw a MalformedBlockError / OversizeBlockError /
 *      MissingArtifactError → degraded with that reason.
 *   2. The adapter source threw any other error → failed
 *      (`unexpected_error`).
 *   3. The parser yielded a `parser_warning` event anywhere in the
 *      stream (before OR after `ship`) → degraded (`parser_warning`).
 *      The parser tolerated a soft violation (weak debate, unknown
 *      role, clamped score, composite mismatch, duplicate ship) but
 *      the conformance gate treats any of those as a "this adapter
 *      is not protocol-clean" signal (lefarcen P2 on PR #1316,
 *      tightened to post-ship warnings in lefarcen P2 on PR #1316
 *      follow-up: the parser emits `duplicate_ship` AFTER the first
 *      ship event yields, so the harness must drain the rest of the
 *      stream before classifying instead of returning at first ship).
 *   4. The parser yielded a `ship` event but the cast declared by
 *      `run_started` did not all emit `panelist_close` IN THE
 *      SHIPPING ROUND → degraded (`incomplete_panel`). The parser
 *      only enforces the round-1 designer-artifact invariant; the
 *      harness is what catches a ship that skipped panelists or
 *      reused earlier-round closes to fake a complete cast (codex
 *      P2 on PR #1316; per-round bucketing added in lefarcen P2 on
 *      PR #1316 follow-up).
 *   5. The parser yielded a `ship` event with a complete panel and no
 *      parser warnings → shipped.
 *   6. The stream ended without a `ship` event → failed (`no_ship`).
 */
import type { CritiqueConfig, PanelEvent } from '@open-design/contracts/critique';
import { type ShipArtifactPayload } from './parser.js';
/**
 * Local degraded reasons. `'parser_warning'` and `'incomplete_panel'`
 * are conformance-harness-only: they describe a stream the contracts
 * `DegradedReason` does not currently model as a discrete value. The
 * adapter-degraded registry stores the closest contracts reason via
 * `toContractReason` below, so a downstream listing of degraded
 * adapters still uses the wire-shape enum.
 */
export type ConformanceDegradedReason = 'malformed_block' | 'oversize_block' | 'missing_artifact' | 'parser_warning' | 'incomplete_panel' | 'protocol_version_mismatch';
export type ConformanceOutcome = {
    kind: 'shipped';
    round: number;
    composite: number;
    events: PanelEvent[];
    /**
     * Artifact bytes the parser handed back via the `onArtifact`
     * callback for the SHIP event. Callers that want to pin
     * MIME / byte-length / hash on the prerelease cycle read this
     * directly. Always set on `shipped` because the parser rejects
     * a missing-artifact SHIP with `MissingArtifactError` upstream
     * (lefarcen P2 on PR #1317: previously captured-but-never-
     * returned, masked by a `void shipPayload` lint trick).
     */
    artifact: ShipArtifactPayload | null;
} | {
    kind: 'degraded';
    reason: ConformanceDegradedReason;
    events: PanelEvent[];
} | {
    kind: 'failed';
    cause: 'no_ship' | 'unexpected_error';
    events: PanelEvent[];
    error?: string;
};
export interface RunConformanceParams {
    adapterId: string;
    runId: string;
    source: AsyncIterable<string>;
    parserMaxBlockBytes?: number;
    projectId?: string;
    artifactId?: string;
    weights?: CritiqueConfig['weights'];
}
/**
 * Run a synthetic (or recorded) adapter source through the parser and
 * classify the outcome. Side-effect: when the outcome is `degraded`,
 * the adapter is marked degraded for the default 24h TTL via
 * `markDegraded`. The caller can flip the policy by calling
 * `clearDegraded(adapterId)` afterwards if it wants to gate the mark
 * on a "two consecutive failures" rule.
 */
export declare function runAdapterConformance(params: RunConformanceParams): Promise<ConformanceOutcome>;
