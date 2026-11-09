/** Historical persisted-turn identity reader only; current runs use production markers. */
import { z } from 'zod';
export declare const OD_NEXT_INTENT_RESOLUTION_TURN_SCHEMA: 'open-design.od-next-intent-resolution-turn/v1';
export declare const OdNextIntentResolutionTurnV1Schema: z.ZodObject<{
    taskExecutionId: z.ZodString;
    stage: z.ZodEnum<["request", "clarification"]>;
    taskRunIndex: z.ZodNumber;
    sourceRunId: z.ZodString;
    promptBundleSha256: z.ZodString;
    sourceResultSha256: z.ZodString;
    payload: z.ZodString;
}, "strict", z.ZodTypeAny, {
    taskExecutionId: string;
    stage: "clarification" | "request";
    taskRunIndex: number;
    sourceRunId: string;
    promptBundleSha256: string;
    sourceResultSha256: string;
    payload: string;
}, {
    taskExecutionId: string;
    stage: "clarification" | "request";
    taskRunIndex: number;
    sourceRunId: string;
    promptBundleSha256: string;
    sourceResultSha256: string;
    payload: string;
}>;
export type OdNextIntentResolutionTurnV1 = z.infer<typeof OdNextIntentResolutionTurnV1Schema>;
/** A host-owned supplemental request; it never changes the logical task stage. */
export declare function serializeOdNextIntentResolutionTurnV1(value: OdNextIntentResolutionTurnV1): string;
export declare function parseOdNextIntentResolutionTurnV1(source: string): OdNextIntentResolutionTurnV1;
//# sourceMappingURL=od-next-intent-resolution.d.ts.map