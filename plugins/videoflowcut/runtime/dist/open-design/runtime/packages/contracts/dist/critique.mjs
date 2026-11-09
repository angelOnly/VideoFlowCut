// src/critique.ts
import { z } from "zod";
var PANELIST_ROLES = ["designer", "critic", "brand", "a11y", "copy"];
var FALLBACK_POLICIES = ["ship_best", "ship_last", "fail"];
var CRITIQUE_PROTOCOL_VERSION = 1;
var RoleWeights = z.object({
  designer: z.number().min(0).max(1),
  critic: z.number().min(0).max(1),
  brand: z.number().min(0).max(1),
  a11y: z.number().min(0).max(1),
  copy: z.number().min(0).max(1)
});
var CritiqueConfigSchema = z.object({
  enabled: z.boolean(),
  cast: z.array(z.enum(PANELIST_ROLES)).min(1),
  maxRounds: z.number().int().min(1).max(10),
  scoreScale: z.number().int().min(1).max(100),
  scoreThreshold: z.number().min(0).max(100).describe("Must be <= scoreScale; enforced by cross-field refine"),
  weights: RoleWeights,
  perRoundTimeoutMs: z.number().int().min(1e3),
  totalTimeoutMs: z.number().int().min(1e3),
  parserMaxBlockBytes: z.number().int().min(1024),
  fallbackPolicy: z.enum(FALLBACK_POLICIES),
  protocolVersion: z.number().int().min(1),
  maxConcurrentRuns: z.number().int().min(1)
}).refine(
  // Small epsilon tolerance so a fractional threshold that rounds up against an
  // integer scale (e.g. 8.0 with floating-point slack) still validates. The
  // semantic check is "threshold cannot meaningfully exceed scale".
  (cfg) => cfg.scoreThreshold <= cfg.scoreScale + 1e-9,
  { message: "scoreThreshold must be <= scoreScale" }
);
function defaultCritiqueConfig() {
  return {
    enabled: false,
    cast: [...PANELIST_ROLES],
    maxRounds: 3,
    scoreScale: 10,
    scoreThreshold: 8,
    weights: { designer: 0, critic: 0.4, brand: 0.2, a11y: 0.2, copy: 0.2 },
    perRoundTimeoutMs: 9e4,
    totalTimeoutMs: 24e4,
    parserMaxBlockBytes: 262144,
    fallbackPolicy: "ship_best",
    protocolVersion: CRITIQUE_PROTOCOL_VERSION,
    // Contracts layer cannot call os.cpus(); daemon env layer overrides via OD_CRITIQUE_MAX_CONCURRENT_RUNS.
    maxConcurrentRuns: 4
  };
}
var DEGRADED_REASONS = [
  "malformed_block",
  "oversize_block",
  "adapter_unsupported",
  "protocol_version_mismatch",
  "missing_artifact"
];
var FAILED_CAUSES = [
  "cli_exit_nonzero",
  "per_round_timeout",
  "total_timeout",
  "orchestrator_internal"
];
var PARSER_WARNING_KINDS = [
  "weak_debate",
  "unknown_role",
  "score_clamped",
  "composite_mismatch",
  "duplicate_ship"
];
var ROUND_DECISIONS = ["continue", "ship"];
var SHIP_STATUSES = [
  "shipped",
  "below_threshold",
  "timed_out",
  "interrupted"
];
var PANEL_EVENT_TYPE_LIST = [
  "run_started",
  "panelist_open",
  "panelist_dim",
  "panelist_must_fix",
  "panelist_close",
  "round_end",
  "ship",
  "degraded",
  "interrupted",
  "failed",
  "parser_warning"
];
var PANEL_EVENT_TYPES = new Set(PANEL_EVENT_TYPE_LIST);
var PANELIST_ROLE_SET = new Set(PANELIST_ROLES);
var SHIP_STATUS_SET = new Set(SHIP_STATUSES);
var DEGRADED_REASON_SET = new Set(DEGRADED_REASONS);
var FAILED_CAUSE_SET = new Set(FAILED_CAUSES);
var PARSER_WARNING_KIND_SET = new Set(PARSER_WARNING_KINDS);
var ROUND_DECISION_SET = new Set(ROUND_DECISIONS);
var isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);
var isNonNegativeFinite = (v) => isFiniteNumber(v) && v >= 0;
var isNonNegativeInt = (v) => isFiniteNumber(v) && Number.isInteger(v) && v >= 0;
var isPositiveInt = (v) => isFiniteNumber(v) && Number.isInteger(v) && v > 0;
var isString = (v) => typeof v === "string";
var isPanelistRole = (v) => isString(v) && PANELIST_ROLE_SET.has(v);
function isPanelEvent(value) {
  if (!value || typeof value !== "object") return false;
  const o = value;
  const t = o["type"];
  if (typeof t !== "string" || !PANEL_EVENT_TYPES.has(t)) return false;
  const runId = o["runId"];
  if (typeof runId !== "string" || runId.length === 0) return false;
  switch (t) {
    case "run_started": {
      const threshold = o["threshold"];
      const scale = o["scale"];
      return isPositiveInt(o["protocolVersion"]) && Array.isArray(o["cast"]) && o["cast"].length > 0 && o["cast"].every(isPanelistRole) && isPositiveInt(o["maxRounds"]) && isPositiveInt(scale) && isNonNegativeFinite(threshold) && threshold <= scale;
    }
    case "panelist_open":
      return isPositiveInt(o["round"]) && isPanelistRole(o["role"]);
    case "panelist_dim":
      return isPositiveInt(o["round"]) && isPanelistRole(o["role"]) && isString(o["dimName"]) && isNonNegativeFinite(o["dimScore"]) && isString(o["dimNote"]);
    case "panelist_must_fix":
      return isPositiveInt(o["round"]) && isPanelistRole(o["role"]) && isString(o["text"]);
    case "panelist_close":
      return isPositiveInt(o["round"]) && isPanelistRole(o["role"]) && isNonNegativeFinite(o["score"]);
    case "round_end":
      return isPositiveInt(o["round"]) && isNonNegativeFinite(o["composite"]) && isNonNegativeInt(o["mustFix"]) && isString(o["decision"]) && ROUND_DECISION_SET.has(o["decision"]) && isString(o["reason"]);
    case "ship": {
      const ref = o["artifactRef"];
      return isPositiveInt(o["round"]) && isNonNegativeFinite(o["composite"]) && isString(o["status"]) && SHIP_STATUS_SET.has(o["status"]) && ref !== null && typeof ref === "object" && typeof ref.projectId === "string" && ref.projectId.length > 0 && typeof ref.artifactId === "string" && ref.artifactId.length > 0 && isString(o["summary"]);
    }
    case "degraded":
      return isString(o["reason"]) && DEGRADED_REASON_SET.has(o["reason"]) && isString(o["adapter"]);
    case "interrupted":
      return isNonNegativeInt(o["bestRound"]) && isNonNegativeFinite(o["composite"]);
    case "failed":
      return isString(o["cause"]) && FAILED_CAUSE_SET.has(o["cause"]);
    case "parser_warning":
      return isString(o["kind"]) && PARSER_WARNING_KIND_SET.has(o["kind"]) && isNonNegativeInt(o["position"]);
  }
}
var CRITIQUE_SSE_EVENT_NAMES = [
  "critique.run_started",
  "critique.panelist_open",
  "critique.panelist_dim",
  "critique.panelist_must_fix",
  "critique.panelist_close",
  "critique.round_end",
  "critique.ship",
  "critique.degraded",
  "critique.interrupted",
  "critique.failed",
  "critique.parser_warning"
];
function panelEventToSse(e) {
  const { type, ...payload } = e;
  return { event: `critique.${type}`, data: payload };
}
var CRITIQUE_RUN_STATUSES = [
  "shipped",
  "below_threshold",
  "timed_out",
  "interrupted",
  "degraded",
  "failed",
  "legacy"
];
var CRITIQUE_INLINE_TAGS = ["PANELIST", "MUST_FIX", "RESOLVED", "SHIP"];
var CRITIQUE_BLOCK_TAGS = ["CRITIQUE_RUN", "ROUND", "ROUND_END"];
var CRITIQUE_GRAMMAR_TAGS = [
  ...CRITIQUE_INLINE_TAGS,
  ...CRITIQUE_BLOCK_TAGS
];
function critiqueGrammarTagPattern() {
  return new RegExp(`</?(?:${CRITIQUE_GRAMMAR_TAGS.join("|")})(?=[\\s/>])[^>]*>`, "g");
}
function stripCritiqueGrammar(text) {
  if (!text || !text.includes("<")) return text;
  const withoutTags = text.replace(critiqueGrammarTagPattern(), "");
  if (withoutTags === text) return text;
  return withoutTags.replace(/\n{3,}/g, "\n\n");
}
export {
  CRITIQUE_BLOCK_TAGS,
  CRITIQUE_GRAMMAR_TAGS,
  CRITIQUE_INLINE_TAGS,
  CRITIQUE_PROTOCOL_VERSION,
  CRITIQUE_RUN_STATUSES,
  CRITIQUE_SSE_EVENT_NAMES,
  CritiqueConfigSchema,
  DEGRADED_REASONS,
  FAILED_CAUSES,
  FALLBACK_POLICIES,
  PANELIST_ROLES,
  PARSER_WARNING_KINDS,
  ROUND_DECISIONS,
  RoleWeights,
  SHIP_STATUSES,
  critiqueGrammarTagPattern,
  defaultCritiqueConfig,
  isPanelEvent,
  panelEventToSse,
  stripCritiqueGrammar
};
