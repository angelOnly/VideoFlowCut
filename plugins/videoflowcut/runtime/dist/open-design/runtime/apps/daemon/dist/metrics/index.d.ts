/**
 * Critique Theater Prometheus registry (Phase 12).
 *
 * Nine series, all under the `open_design_critique_*` namespace, scoped
 * to the default `prom-client` registry so a single `/api/metrics`
 * scrape returns everything the dashboard panels query.
 *
 * Label cardinality is bounded:
 *   - `adapter` is the agent id, capped at installation-time discovery
 *   - `skill` is the SKILL.md id, capped at the skills registry size
 *   - `panelist` / `dim` are closed enums (`PANELIST_ROLES`, dimension
 *     names from the parser contract)
 *   - `reason` / `cause` / `kind` are closed enums in
 *     `packages/contracts/src/critique.ts`
 *   - `round` is small-integer (typical 1-3)
 *   - `status` and `version` are closed enums / small integers
 *
 * Histogram buckets follow `specs/current/critique-theater.md` §
 * Observability and are intentionally explicit so an operator can tune
 * them after the first 1000 runs without code changes.
 *
 * No call signed off on a particular skill label being globally
 * available; orchestrator call sites pass `skill ?? 'unknown'` when the
 * spawn handler did not thread the skill id. Defaulting to 'unknown'
 * keeps the series shape stable while threading the label is a
 * separate fix.
 */
import { Counter, Gauge, Histogram, register } from 'prom-client';
export declare const critiqueRunsTotal: Counter<"adapter" | "skill" | "status">;
export declare const critiqueRoundsTotal: Counter<"adapter" | "skill">;
export declare const critiqueRoundDurationMs: Histogram<"adapter" | "round" | "skill">;
export declare const critiqueCompositeScore: Histogram<"adapter" | "skill">;
export declare const critiqueMustFixTotal: Counter<"adapter" | "dim" | "panelist" | "skill">;
export declare const critiqueDegradedTotal: Counter<"adapter" | "reason">;
export declare const critiqueInterruptedTotal: Counter<"adapter">;
export declare const critiqueParserErrorsTotal: Counter<"adapter" | "kind">;
export declare const critiqueProtocolVersion: Gauge<"version">;
/**
 * Exposed to the `/api/metrics` route. Returns the full Prometheus
 * exposition format as a single string with the correct content type
 * available on `register.contentType`.
 */
export declare function getCritiqueMetrics(): Promise<string>;
export { register };
export * from './workspace-authority.js';
/**
 * Test-only: wipe the default registry so vitest cases can assert
 * series shape without leakage from a prior `runOrchestrator` call.
 * Production code never reaches this; the function name is deliberate
 * so a grep audit flags any accidental production caller.
 */
export declare function __resetCritiqueMetricsForTests(): void;
