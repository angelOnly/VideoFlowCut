import { z } from 'zod';
export declare const PluginPipelineStageEventSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"pipeline_stage_started">;
    runId: z.ZodString;
    snapshotId: z.ZodString;
    stageId: z.ZodString;
    iteration: z.ZodNumber;
    startedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    kind: "pipeline_stage_started";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    startedAt: number;
}, {
    kind: "pipeline_stage_started";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    startedAt: number;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"pipeline_stage_completed">;
    runId: z.ZodString;
    snapshotId: z.ZodString;
    stageId: z.ZodString;
    iteration: z.ZodNumber;
    completedAt: z.ZodNumber;
    converged: z.ZodOptional<z.ZodBoolean>;
    diffSummary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    kind: "pipeline_stage_completed";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    completedAt: number;
    converged?: boolean | undefined;
    diffSummary?: string | undefined;
}, {
    kind: "pipeline_stage_completed";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    completedAt: number;
    converged?: boolean | undefined;
    diffSummary?: string | undefined;
}>]>;
export type PluginPipelineStageEvent = z.infer<typeof PluginPipelineStageEventSchema>;
export declare const GenUISurfaceEventSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_request">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    payload: z.ZodUnknown;
    requestedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_request";
    surfaceId: string;
    runId: string;
    payload?: unknown;
    requestedAt: number;
}, {
    kind: "genui_surface_request";
    surfaceId: string;
    runId: string;
    payload?: unknown;
    requestedAt: number;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_response">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    value: z.ZodUnknown;
    respondedAt: z.ZodNumber;
    respondedBy: z.ZodEnum<["user", "agent", "auto", "cache"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_response";
    surfaceId: string;
    runId: string;
    value?: unknown;
    respondedAt: number;
    respondedBy: "agent" | "auto" | "cache" | "user";
}, {
    kind: "genui_surface_response";
    surfaceId: string;
    runId: string;
    value?: unknown;
    respondedAt: number;
    respondedBy: "agent" | "auto" | "cache" | "user";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_timeout">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    resolution: z.ZodEnum<["abort", "default", "skip"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_timeout";
    surfaceId: string;
    runId: string;
    resolution: "abort" | "default" | "skip";
}, {
    kind: "genui_surface_timeout";
    surfaceId: string;
    runId: string;
    resolution: "abort" | "default" | "skip";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_state_synced">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    persistTier: z.ZodEnum<["run", "conversation", "project"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_state_synced";
    surfaceId: string;
    runId: string;
    persistTier: "conversation" | "project" | "run";
}, {
    kind: "genui_state_synced";
    surfaceId: string;
    runId: string;
    persistTier: "conversation" | "project" | "run";
}>]>;
export type GenUISurfaceEvent = z.infer<typeof GenUISurfaceEventSchema>;
export declare const PluginAgentEventSchema: z.ZodUnion<[z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"pipeline_stage_started">;
    runId: z.ZodString;
    snapshotId: z.ZodString;
    stageId: z.ZodString;
    iteration: z.ZodNumber;
    startedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    kind: "pipeline_stage_started";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    startedAt: number;
}, {
    kind: "pipeline_stage_started";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    startedAt: number;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"pipeline_stage_completed">;
    runId: z.ZodString;
    snapshotId: z.ZodString;
    stageId: z.ZodString;
    iteration: z.ZodNumber;
    completedAt: z.ZodNumber;
    converged: z.ZodOptional<z.ZodBoolean>;
    diffSummary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    kind: "pipeline_stage_completed";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    completedAt: number;
    converged?: boolean | undefined;
    diffSummary?: string | undefined;
}, {
    kind: "pipeline_stage_completed";
    runId: string;
    snapshotId: string;
    stageId: string;
    iteration: number;
    completedAt: number;
    converged?: boolean | undefined;
    diffSummary?: string | undefined;
}>]>, z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_request">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    payload: z.ZodUnknown;
    requestedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_request";
    surfaceId: string;
    runId: string;
    payload?: unknown;
    requestedAt: number;
}, {
    kind: "genui_surface_request";
    surfaceId: string;
    runId: string;
    payload?: unknown;
    requestedAt: number;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_response">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    value: z.ZodUnknown;
    respondedAt: z.ZodNumber;
    respondedBy: z.ZodEnum<["user", "agent", "auto", "cache"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_response";
    surfaceId: string;
    runId: string;
    value?: unknown;
    respondedAt: number;
    respondedBy: "agent" | "auto" | "cache" | "user";
}, {
    kind: "genui_surface_response";
    surfaceId: string;
    runId: string;
    value?: unknown;
    respondedAt: number;
    respondedBy: "agent" | "auto" | "cache" | "user";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_surface_timeout">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    resolution: z.ZodEnum<["abort", "default", "skip"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_surface_timeout";
    surfaceId: string;
    runId: string;
    resolution: "abort" | "default" | "skip";
}, {
    kind: "genui_surface_timeout";
    surfaceId: string;
    runId: string;
    resolution: "abort" | "default" | "skip";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"genui_state_synced">;
    surfaceId: z.ZodString;
    runId: z.ZodString;
    persistTier: z.ZodEnum<["run", "conversation", "project"]>;
}, "strip", z.ZodTypeAny, {
    kind: "genui_state_synced";
    surfaceId: string;
    runId: string;
    persistTier: "conversation" | "project" | "run";
}, {
    kind: "genui_state_synced";
    surfaceId: string;
    runId: string;
    persistTier: "conversation" | "project" | "run";
}>]>]>;
export type PluginAgentEvent = z.infer<typeof PluginAgentEventSchema>;
export declare const PLUGIN_AGENT_EVENT_KINDS: readonly ['pipeline_stage_started', 'pipeline_stage_completed', 'genui_surface_request', 'genui_surface_response', 'genui_surface_timeout', 'genui_state_synced'];
export type PluginAgentEventKind = typeof PLUGIN_AGENT_EVENT_KINDS[number];
//# sourceMappingURL=events.d.ts.map