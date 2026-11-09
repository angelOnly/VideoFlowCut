import { z } from 'zod';
/**
 * Local mirror of SseTransportEvent from './sse/common'. Re-defining the
 * three-field interface avoids a cross-file relative import inside this leaf
 * module: the daemon walks this file via the './critique' subpath export
 * under NodeNext (which requires explicit '.js' extensions), while the web
 * Turbopack build refuses to rewrite '.js' to '.ts' on the same source.
 * Keeping the type local makes the file self-contained for both consumers.
 */
interface SseTransportEvent<Name extends string, Payload> {
    id?: string;
    event: Name;
    data: Payload;
}
export declare const PANELIST_ROLES: readonly ['designer', 'critic', 'brand', 'a11y', 'copy'];
export type PanelistRole = typeof PANELIST_ROLES[number];
export declare const FALLBACK_POLICIES: readonly ['ship_best', 'ship_last', 'fail'];
export type FallbackPolicy = typeof FALLBACK_POLICIES[number];
export declare const CRITIQUE_PROTOCOL_VERSION = 1;
export declare const RoleWeights: z.ZodObject<{
    designer: z.ZodNumber;
    critic: z.ZodNumber;
    brand: z.ZodNumber;
    a11y: z.ZodNumber;
    copy: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    designer: number;
    critic: number;
    brand: number;
    a11y: number;
    copy: number;
}, {
    designer: number;
    critic: number;
    brand: number;
    a11y: number;
    copy: number;
}>;
export type RoleWeights = z.infer<typeof RoleWeights>;
export declare const CritiqueConfigSchema: z.ZodEffects<z.ZodObject<{
    enabled: z.ZodBoolean;
    cast: z.ZodArray<z.ZodEnum<["designer", "critic", "brand", "a11y", "copy"]>, "many">;
    maxRounds: z.ZodNumber;
    scoreScale: z.ZodNumber;
    scoreThreshold: z.ZodNumber;
    weights: z.ZodObject<{
        designer: z.ZodNumber;
        critic: z.ZodNumber;
        brand: z.ZodNumber;
        a11y: z.ZodNumber;
        copy: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    }, {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    }>;
    perRoundTimeoutMs: z.ZodNumber;
    totalTimeoutMs: z.ZodNumber;
    parserMaxBlockBytes: z.ZodNumber;
    fallbackPolicy: z.ZodEnum<["ship_best", "ship_last", "fail"]>;
    protocolVersion: z.ZodNumber;
    maxConcurrentRuns: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    cast: ("a11y" | "brand" | "copy" | "critic" | "designer")[];
    maxRounds: number;
    scoreScale: number;
    scoreThreshold: number;
    weights: {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    };
    perRoundTimeoutMs: number;
    totalTimeoutMs: number;
    parserMaxBlockBytes: number;
    fallbackPolicy: "fail" | "ship_best" | "ship_last";
    protocolVersion: number;
    maxConcurrentRuns: number;
}, {
    enabled: boolean;
    cast: ("a11y" | "brand" | "copy" | "critic" | "designer")[];
    maxRounds: number;
    scoreScale: number;
    scoreThreshold: number;
    weights: {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    };
    perRoundTimeoutMs: number;
    totalTimeoutMs: number;
    parserMaxBlockBytes: number;
    fallbackPolicy: "fail" | "ship_best" | "ship_last";
    protocolVersion: number;
    maxConcurrentRuns: number;
}>, {
    enabled: boolean;
    cast: ("a11y" | "brand" | "copy" | "critic" | "designer")[];
    maxRounds: number;
    scoreScale: number;
    scoreThreshold: number;
    weights: {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    };
    perRoundTimeoutMs: number;
    totalTimeoutMs: number;
    parserMaxBlockBytes: number;
    fallbackPolicy: "fail" | "ship_best" | "ship_last";
    protocolVersion: number;
    maxConcurrentRuns: number;
}, {
    enabled: boolean;
    cast: ("a11y" | "brand" | "copy" | "critic" | "designer")[];
    maxRounds: number;
    scoreScale: number;
    scoreThreshold: number;
    weights: {
        designer: number;
        critic: number;
        brand: number;
        a11y: number;
        copy: number;
    };
    perRoundTimeoutMs: number;
    totalTimeoutMs: number;
    parserMaxBlockBytes: number;
    fallbackPolicy: "fail" | "ship_best" | "ship_last";
    protocolVersion: number;
    maxConcurrentRuns: number;
}>;
export type CritiqueConfig = z.infer<typeof CritiqueConfigSchema>;
export declare function defaultCritiqueConfig(): CritiqueConfig;
export declare const DEGRADED_REASONS: readonly ['malformed_block', 'oversize_block', 'adapter_unsupported', 'protocol_version_mismatch', 'missing_artifact'];
export type DegradedReason = typeof DEGRADED_REASONS[number];
export declare const FAILED_CAUSES: readonly ['cli_exit_nonzero', 'per_round_timeout', 'total_timeout', 'orchestrator_internal'];
export type FailedCause = typeof FAILED_CAUSES[number];
export declare const PARSER_WARNING_KINDS: readonly ['weak_debate', 'unknown_role', 'score_clamped', 'composite_mismatch', 'duplicate_ship'];
export type ParserWarningKind = typeof PARSER_WARNING_KINDS[number];
export declare const ROUND_DECISIONS: readonly ['continue', 'ship'];
export type RoundDecision = typeof ROUND_DECISIONS[number];
export declare const SHIP_STATUSES: readonly ['shipped', 'below_threshold', 'timed_out', 'interrupted'];
export type ShipStatus = typeof SHIP_STATUSES[number];
export type PanelEvent = {
    type: 'run_started';
    runId: string;
    protocolVersion: number;
    cast: PanelistRole[];
    maxRounds: number;
    threshold: number;
    scale: number;
} | {
    type: 'panelist_open';
    runId: string;
    round: number;
    role: PanelistRole;
} | {
    type: 'panelist_dim';
    runId: string;
    round: number;
    role: PanelistRole;
    dimName: string;
    dimScore: number;
    dimNote: string;
} | {
    type: 'panelist_must_fix';
    runId: string;
    round: number;
    role: PanelistRole;
    text: string;
} | {
    type: 'panelist_close';
    runId: string;
    round: number;
    role: PanelistRole;
    score: number;
} | {
    type: 'round_end';
    runId: string;
    round: number;
    composite: number;
    mustFix: number;
    decision: RoundDecision;
    reason: string;
} | {
    type: 'ship';
    runId: string;
    round: number;
    composite: number;
    status: ShipStatus;
    artifactRef: {
        projectId: string;
        artifactId: string;
    };
    summary: string;
} | {
    type: 'degraded';
    runId: string;
    reason: DegradedReason;
    adapter: string;
} | {
    type: 'interrupted';
    runId: string;
    bestRound: number;
    composite: number;
} | {
    type: 'failed';
    runId: string;
    cause: FailedCause;
} | {
    type: 'parser_warning';
    runId: string;
    kind: ParserWarningKind;
    position: number;
};
/**
 * Strict runtime guard for the `PanelEvent` union. Validates the union tag
 * (`type`), the non-empty `runId` header, every variant-specific required
 * field, the membership of closed-enum fields (`role`, `status`, `reason`,
 * `cause`, `kind`, `decision`), and the numeric domain of every numeric
 * field (integer / positive / non-negative / range), not just finiteness.
 *
 * This is the single source of truth for wire-side validation. Both the web
 * SSE path (`sseToPanelEvent`) and the transcript replay parser go through
 * here, so a malformed frame (missing field, unknown enum value, NaN /
 * Infinity score, `scale: 0` causing downstream divide-by-zero, threshold
 * outside `[0, scale]`, fractional or negative round numbers) is rejected
 * before any reducer or component touches it.
 *
 * Numeric domains enforced (lefarcen P2 on PR #1314 round 4):
 *
 *   - `protocolVersion`, `maxRounds`, `scale`, `round`: positive integers.
 *     ScoreTicker divides by `scale` for inline CSS, so a `scale: 0` would
 *     produce Infinity and ship as broken style; rounds are 1-indexed.
 *   - `bestRound`, `mustFix`, `position`: non-negative integers. `bestRound:
 *     0` is the valid "interrupt before any round closed" sentinel.
 *   - `threshold`: non-negative finite; cross-checked `threshold <= scale`
 *     inside `run_started`. Threshold is allowed to be fractional (e.g.
 *     8.5 on a scale of 10).
 *   - `composite`, `score`, `dimScore`: non-negative finite. The
 *     `<= scale` bound is per-run state the guard does not see; downstream
 *     code clamps to scale on render, but a negative score is never valid.
 *
 * Earlier review history:
 *
 *   - Siri-Ray round-3 P1: the original guard checked `typeof === 'string'`
 *     for enum fields and accepted unknown values; now validated against
 *     the closed-set arrays.
 */
export declare function isPanelEvent(value: unknown): value is PanelEvent;
type PayloadOf<T extends PanelEvent['type']> = Omit<Extract<PanelEvent, {
    type: T;
}>, 'type'>;
export type CritiqueSseEvent = SseTransportEvent<'critique.run_started', PayloadOf<'run_started'>> | SseTransportEvent<'critique.panelist_open', PayloadOf<'panelist_open'>> | SseTransportEvent<'critique.panelist_dim', PayloadOf<'panelist_dim'>> | SseTransportEvent<'critique.panelist_must_fix', PayloadOf<'panelist_must_fix'>> | SseTransportEvent<'critique.panelist_close', PayloadOf<'panelist_close'>> | SseTransportEvent<'critique.round_end', PayloadOf<'round_end'>> | SseTransportEvent<'critique.ship', PayloadOf<'ship'>> | SseTransportEvent<'critique.degraded', PayloadOf<'degraded'>> | SseTransportEvent<'critique.interrupted', PayloadOf<'interrupted'>> | SseTransportEvent<'critique.failed', PayloadOf<'failed'>> | SseTransportEvent<'critique.parser_warning', PayloadOf<'parser_warning'>>;
export declare const CRITIQUE_SSE_EVENT_NAMES: readonly ["critique.run_started", "critique.panelist_open", "critique.panelist_dim", "critique.panelist_must_fix", "critique.panelist_close", "critique.round_end", "critique.ship", "critique.degraded", "critique.interrupted", "critique.failed", "critique.parser_warning"];
export type CritiqueSseEventName = typeof CRITIQUE_SSE_EVENT_NAMES[number];
export declare function panelEventToSse(e: PanelEvent): CritiqueSseEvent;
/**
 * Per-round summary persisted with each critique run. Mirrors the shape the
 * orchestrator writes via decideRound; web clients consume it through the
 * rerun and history endpoints, so it lives in the shared contract layer.
 */
export interface CritiqueRoundSummary {
    n: number;
    composite: number;
    mustFix: number;
    decision: RoundDecision;
}
/**
 * Terminal critique status persisted with each run. Superset of ShipStatus
 * that also covers degraded / failed / legacy outcomes. The daemon's CHECK
 * constraint also accepts the in-flight 'running' value, but that is handled
 * inline by daemon-side code; the public contract surface is terminal-only
 * because every consumer of this type works against finished runs.
 */
export type CritiqueRunStatus = ShipStatus | 'degraded' | 'failed' | 'legacy';
/**
 * Enumeration of every terminal CritiqueRunStatus value, in the order the
 * UI / docs / status filters typically display them: SHIP outcomes first
 * (shipped → below_threshold → timed_out → interrupted), then quality /
 * lifecycle exits (degraded → failed), then the historical 'legacy' tag
 * for runs created before the feature shipped. Web consumers (status
 * filters, analytics dashboards) iterate this constant directly so the
 * daemon stays the single source of truth on the order.
 */
export declare const CRITIQUE_RUN_STATUSES: readonly ["shipped", "below_threshold", "timed_out", "interrupted", "degraded", "failed", "legacy"];
/**
 * Compile-time guarantee that every `CritiqueRunStatus` variant appears in
 * `CRITIQUE_RUN_STATUSES`. `satisfies` only proves each listed value is
 * valid; this assertion proves the list is exhaustive, so adding a new
 * variant to `CritiqueRunStatus` (or `ShipStatus`) without updating the
 * array fails the build with a tuple naming the missing variants. Picked
 * up from lefarcen P3 on PR #1016. The exported helper type is reusable
 * by other shared enums (e.g. `PANELIST_ROLES`) once they need the same
 * guard.
 */
export type AssertExhaustiveValues<T extends string, U extends readonly T[]> = Exclude<T, U[number]> extends never ? true : ['Missing variants in array:', Exclude<T, U[number]>];
/**
 * Internal-to-the-daemon row status. Adds the in-flight `'running'` value
 * the DB CHECK constraint accepts to the public `CritiqueRunStatus` union
 * so DB-row types can be precisely typed without inline `as X | 'running'`
 * widens at every call site. Every public DTO continues to use the
 * terminal-only `CritiqueRunStatus` so a future endpoint cannot leak a
 * 'running' row through the wire. Picked up from lefarcen P2 on PR #1016.
 */
export type CritiquePersistedStatus = CritiqueRunStatus | 'running';
/**
 * Logical handle the daemon hands to the web layer for a critique run's
 * shipped artifact. Web clients never see daemon filesystem paths; they
 * fetch the artifact bytes via the `url` field, which the daemon serves
 * with the right `Content-Type` header derived from `mime`. Returned by
 * the rerun endpoint and the `GET /api/projects/:projectId/critique/:runId/artifact`
 * route that streams the bytes.
 */
export interface CritiqueArtifactRef {
    /** The owning project; matches the URL segment. */
    projectId: string;
    /** The owning critique run; matches the URL segment. */
    runId: string;
    /** Content-Type announced by the agent in `<ARTIFACT mime="…">`. */
    mime: string;
    /** Size of the artifact body in bytes, as written to disk. */
    sizeBytes: number;
    /** Daemon-relative HTTP path the web layer fetches to stream the bytes. */
    url: string;
}
/**
 * 成对出现、要**脱壳留字**的标记 —— 里面那句话是人写给人看的。
 *
 * 标签名以**真实语法**为准,不凭印象写:prompt 在
 * `apps/daemon/src/prompts/panel.ts`,解析器在
 * `apps/daemon/src/critique/parsers/v1.ts`(`MUST_FIX_RE`),fixtures 在
 * `apps/daemon/src/critique/__fixtures__/`。三处一致才算数。
 *
 * 这里曾经写成 `MUSTFIX`(漏了下划线)。那个拼法在真实数据里一次都没出现过,
 * 于是它挡不住任何东西:同一段话里的 `<PANELIST>` 被剥掉了,
 * `<MUST_FIX id="…">…</MUST_FIX>` 却整条留在正文里给用户看见。
 * 更难认的是它长什么样 —— markdown 把 `MUST_FIX` 里那对下划线当成强调标记,
 * 屏幕上显示的是**斜体的 `MUSTFIX`**,下划线已经被吃掉,
 * 照着屏幕回头找代码只会找到这个错的拼法,正好自圆其说。
 */
export declare const CRITIQUE_INLINE_TAGS: readonly ['PANELIST', 'MUST_FIX', 'RESOLVED', 'SHIP'];
/** 整条都是协议的标记 */
export declare const CRITIQUE_BLOCK_TAGS: readonly ['CRITIQUE_RUN', 'ROUND', 'ROUND_END'];
export declare const CRITIQUE_GRAMMAR_TAGS: readonly string[];
/**
 * 一条完整标记:`<TAG …>` / `</TAG>` / `<TAG …/>`。
 * 标签名后面必须紧跟空白、`>` 或 `/`,否则 `<PANELISTS>` 这种会被误吃。
 *
 * 每次现造一个,不共享 —— 带 `g` 的正则有 `lastIndex` 状态,共享实例会让
 * 相邻两次调用互相干扰(第二次从上一次停下的位置开始找)。
 */
export declare function critiqueGrammarTagPattern(): RegExp;
/**
 * 把一整段**已经完整**的文本里的剧场语法剥掉(给历史消息用)。
 *
 * 只摘标记、不吞标记之间的字:`<PANELIST role="Designer">已完成…</PANELIST>`
 * 剩下「已完成…」。宁可多留一句人话,也不要把用户的正文吃掉。
 *
 * **不避开代码块**,和 daemon 那道流式剥离保持同一口径:那边按 SSE 分片处理,
 * 根本不知道自己在不在围栏里。两边口径必须一致,否则同一段文字在
 * 「刚生成」和「刷新后」会长得不一样。真要在正文里展示这套标记,用转义。
 *
 * 连续标记之间只剩空行时会塌成一个换行 —— 否则剥完会留下一大片空白,
 * 读着像回答中间断了一截。
 */
export declare function stripCritiqueGrammar(text: string): string;
export {};
//# sourceMappingURL=critique.d.ts.map