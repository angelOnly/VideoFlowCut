import { z } from 'zod';
export declare const OD_NEXT_STRATEGY_ID: 'od-next-strategy';
export declare const OD_NEXT_PROMPT_RECIPE_ID: 'od-next-plan-build-v2';
export declare const OD_NEXT_APPLIED_STRATEGY_SCHEMA: 'open-design.applied-strategy/v2';
export declare const OD_NEXT_PLAN_CONTRACT_SCHEMA: 'open-design.plan-contract/v2';
export declare const OD_NEXT_RUNTIME_STATE_SCHEMA: 'open-design.strategy-state/v2';
export declare const OD_NEXT_PLAN_CONTRACT_BLOCK: 'open-design-plan-contract';
export declare const OD_NEXT_RUNTIME_STATE_BLOCK: 'open-design-runtime-state';
export declare const OD_NEXT_BUNDLED_STRATEGY_SCHEMA: 'open-design.bundled-strategy/v2';
/**
 * The reason a task carries when the agent itself declared the turn blocked and
 * raised no machine code of its own.
 *
 * Shared because it is the one blocked verdict whose visible text can be taken
 * as the explanation. Every other block is a gate the agent did not ask for —
 * a missing Runtime State, an unresolvable deliverable, an unproven session —
 * and the prose sitting next to it is the agent's ordinary reply, not an
 * account of the stop. Reading the code, rather than the presence of text,
 * keeps those two apart.
 */
export declare const OD_NEXT_AGENT_DECLARED_BLOCK_REASON: 'od_next_agent_declared_block';
export declare const StrategyTaskTypeV2Schema: z.ZodEnum<["prototype", "ppt", "marketing", "hyperframes", "discovery", "motion-design", "generic"]>;
export type StrategyTaskTypeV2 = z.infer<typeof StrategyTaskTypeV2Schema>;
export declare const StrategyInputStageV2Schema: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
export type StrategyInputStageV2 = z.infer<typeof StrategyInputStageV2Schema>;
export declare const StrategyRouteV2Schema: z.ZodEnum<["direct_edit", "full_plan"]>;
export type StrategyRouteV2 = z.infer<typeof StrategyRouteV2Schema>;
export declare const StrategyExecutionModeV2Schema: z.ZodEnum<["simple", "complex"]>;
export type StrategyExecutionModeV2 = z.infer<typeof StrategyExecutionModeV2Schema>;
export declare const StrategyOutcomeV2Schema: z.ZodEnum<["clarification_required", "plan_ready", "completed", "blocked", "canceled"]>;
export type StrategyOutcomeV2 = z.infer<typeof StrategyOutcomeV2Schema>;
export declare const BundledStrategyDeclarationV2Schema: z.ZodEffects<z.ZodObject<{
    schema: z.ZodLiteral<"open-design.bundled-strategy/v2">;
    id: z.ZodLiteral<"od-next-strategy">;
    promptRecipe: z.ZodLiteral<"od-next-plan-build-v2">;
    assets: z.ZodObject<{
        core: z.ZodObject<{
            path: z.ZodEffects<z.ZodString, string, string>;
            version: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            path: string;
            version: string;
        }, {
            path: string;
            version: string;
        }>;
        orchestration: z.ZodObject<{
            path: z.ZodEffects<z.ZodString, string, string>;
            version: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            path: string;
            version: string;
        }, {
            path: string;
            version: string;
        }>;
        taskProfiles: z.ZodArray<z.ZodEffects<z.ZodObject<{
            path: z.ZodEffects<z.ZodString, string, string>;
            version: z.ZodString;
        } & {
            taskType: z.ZodEnum<["prototype", "ppt", "marketing", "hyperframes", "discovery", "motion-design"]>;
            rollout: z.ZodEnum<["active", "reserved"]>;
            projectKinds: z.ZodArray<z.ZodString, "many">;
            /**
             * Non-prompt files the task profile ships alongside its rule card — for
             * example the handheld device shells the prototype profile stages into the
             * project directory. They enter the package identity with the profile that
             * declares them, so a shell edit changes the package hash exactly like a
             * rule-card edit does, and they are never concatenated into the prompt head.
             */
            resources: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodEffects<z.ZodString, string, string>;
                version: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                path: string;
                version: string;
            }, {
                path: string;
                version: string;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }, {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }>, {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }, {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }>, "many">;
        taskProfileMapping: z.ZodObject<{
            path: z.ZodEffects<z.ZodString, string, string>;
            version: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            path: string;
            version: string;
        }, {
            path: string;
            version: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    }, {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    }>;
}, "strict", z.ZodTypeAny, {
    schema: "open-design.bundled-strategy/v2";
    id: "od-next-strategy";
    promptRecipe: "od-next-plan-build-v2";
    assets: {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    };
}, {
    schema: "open-design.bundled-strategy/v2";
    id: "od-next-strategy";
    promptRecipe: "od-next-plan-build-v2";
    assets: {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    };
}>, {
    schema: "open-design.bundled-strategy/v2";
    id: "od-next-strategy";
    promptRecipe: "od-next-plan-build-v2";
    assets: {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    };
}, {
    schema: "open-design.bundled-strategy/v2";
    id: "od-next-strategy";
    promptRecipe: "od-next-plan-build-v2";
    assets: {
        core: {
            path: string;
            version: string;
        };
        orchestration: {
            path: string;
            version: string;
        };
        taskProfiles: {
            path: string;
            version: string;
            taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
            rollout: "active" | "reserved";
            projectKinds: string[];
            resources?: {
                path: string;
                version: string;
            }[] | undefined;
        }[];
        taskProfileMapping: {
            path: string;
            version: string;
        };
    };
}>;
export type BundledStrategyDeclarationV2 = z.infer<typeof BundledStrategyDeclarationV2Schema>;
export declare const AppliedStrategyBindingV2Schema: z.ZodEffects<z.ZodObject<{
    schema: z.ZodLiteral<"open-design.applied-strategy/v2">;
    id: z.ZodLiteral<"od-next-strategy">;
    version: z.ZodString;
    packageHash: z.ZodString;
    assetDigests: z.ZodArray<z.ZodObject<{
        path: z.ZodEffects<z.ZodString, string, string>;
        sha256: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        path: string;
        sha256: string;
    }, {
        path: string;
        sha256: string;
    }>, "many">;
    selectedTaskProfile: z.ZodObject<{
        taskType: z.ZodEnum<["prototype", "ppt", "marketing", "hyperframes", "discovery", "motion-design"]>;
        version: z.ZodString;
        path: z.ZodEffects<z.ZodString, string, string>;
        sha256: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    }, {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    }>;
    taskProfileVersions: z.ZodArray<z.ZodString, "many">;
    promptRecipe: z.ZodLiteral<"od-next-plan-build-v2">;
}, "strict", z.ZodTypeAny, {
    schema: "open-design.applied-strategy/v2";
    id: "od-next-strategy";
    version: string;
    packageHash: string;
    assetDigests: {
        path: string;
        sha256: string;
    }[];
    selectedTaskProfile: {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    };
    taskProfileVersions: string[];
    promptRecipe: "od-next-plan-build-v2";
}, {
    schema: "open-design.applied-strategy/v2";
    id: "od-next-strategy";
    version: string;
    packageHash: string;
    assetDigests: {
        path: string;
        sha256: string;
    }[];
    selectedTaskProfile: {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    };
    taskProfileVersions: string[];
    promptRecipe: "od-next-plan-build-v2";
}>, {
    schema: "open-design.applied-strategy/v2";
    id: "od-next-strategy";
    version: string;
    packageHash: string;
    assetDigests: {
        path: string;
        sha256: string;
    }[];
    selectedTaskProfile: {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    };
    taskProfileVersions: string[];
    promptRecipe: "od-next-plan-build-v2";
}, {
    schema: "open-design.applied-strategy/v2";
    id: "od-next-strategy";
    version: string;
    packageHash: string;
    assetDigests: {
        path: string;
        sha256: string;
    }[];
    selectedTaskProfile: {
        taskType: "discovery" | "hyperframes" | "marketing" | "motion-design" | "ppt" | "prototype";
        version: string;
        path: string;
        sha256: string;
    };
    taskProfileVersions: string[];
    promptRecipe: "od-next-plan-build-v2";
}>;
export type AppliedStrategyBindingV2 = z.infer<typeof AppliedStrategyBindingV2Schema>;
/** Historical storage only. New runs never read or validate model-authored plans. */
export interface OpenDesignPlanContractV2 {
    schema: 'open-design.plan-contract/v2';
    strategy: {
        id: 'od-next-strategy';
        version: string;
        packageHash: string;
        snapshotId: string;
    };
    taskProfile: {
        schemaVersion: '2';
        taskType: StrategyTaskTypeV2;
        taskProfileVersion: string;
        goal: string;
        contextAndAudience: string;
        inputsAndReferences: string[];
        constraints: string[];
        canonicalDeliverable: {
            id: string;
            kind: string;
            format: string;
        };
        requiredDeliverables: {
            id: string;
            kind: string;
            derivesFrom?: string;
        }[];
        designSpec: {
            source: 'existing-artifact' | 'brand' | 'resolved-baseline';
            version: string;
            decisions: Record<string, unknown>;
        };
        buildRequirements: {
            id: string;
            text: string;
        }[];
        assumptions: string[];
        risks: string[];
        taskSpecific: Record<string, unknown>;
    };
    fullPlan: {
        executionMode: StrategyExecutionModeV2;
        steps: {
            id: string;
            objective: string;
            outputs: string[];
            dependsOn?: string[];
        }[];
        readinessArtifacts: {
            id: string;
            version: string;
            digest: string;
        }[];
        buildPackages: {
            id: string;
            objective: string;
            inputs: string[];
            outputs: string[];
            sharedConstraints: string[];
            dependsOn: string[];
            allowedResources: string[];
        }[];
    };
    runManifest: {
        selectedAgentId: string;
        capabilitySnapshotHash: string;
        inputRefs: string[];
        baselineArtifactRef?: string;
        productionRoutes: string[];
        preflight: {
            intake: 'passed';
            execution: 'passed';
        };
    };
    decisionSummary: {
        goal: string;
        deliverables: string[];
        keyConstraints: string[];
        assumptions: string[];
        risks: string[];
        openDecisions: string[];
    };
}
export declare const StrategyExecutionIntentV2Schema: z.ZodEnum<["produce", "plan_only"]>;
export type StrategyExecutionIntentV2 = z.infer<typeof StrategyExecutionIntentV2Schema>;
export declare const CapabilitySupportV2Schema: z.ZodEnum<["unsupported", "unknown", "advertised", "verified"]>;
export type CapabilitySupportV2 = z.infer<typeof CapabilitySupportV2Schema>;
export declare const AgentCapabilitySnapshotV2Schema: z.ZodEffects<z.ZodObject<{
    agentId: z.ZodString;
    agentVersion: z.ZodOptional<z.ZodString>;
    nativeSessionContinuation: z.ZodEnum<["unsupported", "unknown", "advertised", "verified"]>;
    nativeSubagents: z.ZodObject<{
        support: z.ZodEnum<["unsupported", "unknown", "advertised", "verified"]>;
        evidenceLevel: z.ZodEnum<["unavailable", "tool_only", "structured"]>;
        source: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    }, {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    }>;
    capturedAt: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    agentId: string;
    agentVersion?: string | undefined;
    nativeSessionContinuation: "advertised" | "unknown" | "unsupported" | "verified";
    nativeSubagents: {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    };
    capturedAt: number;
}, {
    agentId: string;
    agentVersion?: string | undefined;
    nativeSessionContinuation: "advertised" | "unknown" | "unsupported" | "verified";
    nativeSubagents: {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    };
    capturedAt: number;
}>, {
    agentId: string;
    agentVersion?: string | undefined;
    nativeSessionContinuation: "advertised" | "unknown" | "unsupported" | "verified";
    nativeSubagents: {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    };
    capturedAt: number;
}, {
    agentId: string;
    agentVersion?: string | undefined;
    nativeSessionContinuation: "advertised" | "unknown" | "unsupported" | "verified";
    nativeSubagents: {
        support: "advertised" | "unknown" | "unsupported" | "verified";
        evidenceLevel: "structured" | "tool_only" | "unavailable";
        source: string;
    };
    capturedAt: number;
}>;
export type AgentCapabilitySnapshotV2 = z.infer<typeof AgentCapabilitySnapshotV2Schema>;
export declare const ChildAgentEvidenceV2Schema: z.ZodEffects<z.ZodObject<{
    childId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    packageId: z.ZodOptional<z.ZodString>;
    state: z.ZodEnum<["started", "completed", "failed"]>;
    source: z.ZodString;
    sourceEventType: z.ZodString;
    startedAt: z.ZodOptional<z.ZodNumber>;
    endedAt: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    childId: string;
    parentId?: string | undefined;
    packageId?: string | undefined;
    state: "completed" | "failed" | "started";
    source: string;
    sourceEventType: string;
    startedAt?: number | undefined;
    endedAt?: number | undefined;
}, {
    childId: string;
    parentId?: string | undefined;
    packageId?: string | undefined;
    state: "completed" | "failed" | "started";
    source: string;
    sourceEventType: string;
    startedAt?: number | undefined;
    endedAt?: number | undefined;
}>, {
    childId: string;
    parentId?: string | undefined;
    packageId?: string | undefined;
    state: "completed" | "failed" | "started";
    source: string;
    sourceEventType: string;
    startedAt?: number | undefined;
    endedAt?: number | undefined;
}, {
    childId: string;
    parentId?: string | undefined;
    packageId?: string | undefined;
    state: "completed" | "failed" | "started";
    source: string;
    sourceEventType: string;
    startedAt?: number | undefined;
    endedAt?: number | undefined;
}>;
export type ChildAgentEvidenceV2 = z.infer<typeof ChildAgentEvidenceV2Schema>;
/**
 * Client-facing attribution for a blocked task projection: the protocol gate's
 * reason codes plus the agent-visible text of the rejected turn (null when the
 * turn had no visible text). Mirrors the daemon task store's persisted
 * `blockedContext`; present only when the projected outcome is `blocked`, so
 * the UI can terminate the turn's form interaction and explain why.
 */
declare const StrategyTaskBlockedContextV2Schema: z.ZodObject<{
    reasonCodes: z.ZodArray<z.ZodString, "many">;
    visibleText: z.ZodNullable<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    reasonCodes: string[];
    visibleText: string | null;
}, {
    reasonCodes: string[];
    visibleText: string | null;
}>;
export type StrategyTaskBlockedContextV2 = z.infer<typeof StrategyTaskBlockedContextV2Schema>;
/** The host's routing action; independent of execution success and file facts. */
export declare const StrategySettlementReasonV2Schema: z.ZodEnum<["question", "continued", "ended"]>;
export type StrategySettlementReasonV2 = z.infer<typeof StrategySettlementReasonV2Schema>;
/**
 * Read compatibility for settlement facts persisted by local delivery-recovery
 * betas. The current coordinator does not emit or consume these extra facts.
 * Keep the known optional fields so rolling back does not break stored tasks.
 */
export declare const StrategyOutputKindSchema: z.ZodEnum<["html", "image", "video", "audio", "document", "presentation", "pdf", "text"]>;
export declare const StrategyOutputGoalSchema: z.ZodArray<z.ZodEnum<["html", "image", "video", "audio", "document", "presentation", "pdf", "text"]>, "many">;
export type StrategyOutputGoal = z.infer<typeof StrategyOutputGoalSchema>;
export declare const StrategyDeliveryStateSchema: z.ZodEnum<["answer", "waiting", "pending", "delivered", "incomplete", "unknown"]>;
export type StrategyDeliveryState = z.infer<typeof StrategyDeliveryStateSchema>;
/** Unknown historical facts stay absent rather than being inferred from an outcome. */
export declare const StrategySettlementFactsV2Schema: z.ZodObject<{
    physicalStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
    deliverableValid: z.ZodOptional<z.ZodBoolean>;
    truncated: z.ZodOptional<z.ZodBoolean>;
    todoUnfinished: z.ZodOptional<z.ZodBoolean>;
    askedUserQuestion: z.ZodOptional<z.ZodBoolean>;
    productionReady: z.ZodOptional<z.ZodBoolean>;
    emptyReply: z.ZodOptional<z.ZodBoolean>;
    executionIntent: z.ZodOptional<z.ZodEnum<["produce", "plan_only"]>>;
    outputGoal: z.ZodOptional<z.ZodArray<z.ZodEnum<["html", "image", "video", "audio", "document", "presentation", "pdf", "text"]>, "many">>;
    deliveryState: z.ZodOptional<z.ZodEnum<["answer", "waiting", "pending", "delivered", "incomplete", "unknown"]>>;
    productionSignal: z.ZodOptional<z.ZodEnum<["accepted", "missing", "rejected", "non_terminal"]>>;
    hostDeliveryFailure: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
    deliverableValid?: boolean | undefined;
    truncated?: boolean | undefined;
    todoUnfinished?: boolean | undefined;
    askedUserQuestion?: boolean | undefined;
    productionReady?: boolean | undefined;
    emptyReply?: boolean | undefined;
    executionIntent?: "plan_only" | "produce" | undefined;
    outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
    deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
    productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
    hostDeliveryFailure?: boolean | undefined;
}, {
    physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
    deliverableValid?: boolean | undefined;
    truncated?: boolean | undefined;
    todoUnfinished?: boolean | undefined;
    askedUserQuestion?: boolean | undefined;
    productionReady?: boolean | undefined;
    emptyReply?: boolean | undefined;
    executionIntent?: "plan_only" | "produce" | undefined;
    outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
    deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
    productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
    hostDeliveryFailure?: boolean | undefined;
}>;
export type StrategySettlementFactsV2 = z.infer<typeof StrategySettlementFactsV2Schema>;
/** Read old persisted reasons without continuing to write overlapping categories. */
export declare function normalizeStrategySettlementReason(value: unknown): StrategySettlementReasonV2;
export declare const StrategyTaskProjectionV2Schema: z.ZodEffects<z.ZodObject<{
    taskExecutionId: z.ZodString;
    strategy: z.ZodObject<{
        id: z.ZodLiteral<"od-next-strategy">;
        version: z.ZodString;
        packageHash: z.ZodString;
        snapshotId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    }, {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    }>;
    inputStage: z.ZodEnum<["request", "clarification", "contract_repair", "production"]>;
    outcome: z.ZodUnion<[z.ZodLiteral<"running">, z.ZodEnum<["clarification_required", "plan_ready", "completed", "blocked", "canceled"]>]>;
    route: z.ZodNullable<z.ZodEnum<["direct_edit", "full_plan"]>>;
    executionMode: z.ZodNullable<z.ZodEnum<["simple", "complex"]>>;
    executionIntent: z.ZodOptional<z.ZodEnum<["produce", "plan_only"]>>;
    activeRunId: z.ZodString;
    nextRunId: z.ZodOptional<z.ZodString>;
    /** Daemon-owned positions for the viewed, active and next physical Runs.
     * Optional for old daemon compatibility; never infer positions from stages.
     */
    runMappings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        runId: z.ZodString;
        taskRunIndex: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        runId: string;
        taskRunIndex: number;
    }, {
        runId: string;
        taskRunIndex: number;
    }>, "many">>;
    /** Host file observation, independent of terminal turn status. Absent on old tasks. */
    deliverableValid: z.ZodOptional<z.ZodBoolean>;
    /** Reason for the viewed physical round ending; absent before settlement. */
    settlementReason: z.ZodOptional<z.ZodEffects<z.ZodEnum<["question", "continued", "ended"]>, "continued" | "ended" | "question", unknown>>;
    settlementFacts: z.ZodOptional<z.ZodObject<{
        physicalStatus: z.ZodOptional<z.ZodEnum<["succeeded", "failed", "canceled"]>>;
        deliverableValid: z.ZodOptional<z.ZodBoolean>;
        truncated: z.ZodOptional<z.ZodBoolean>;
        todoUnfinished: z.ZodOptional<z.ZodBoolean>;
        askedUserQuestion: z.ZodOptional<z.ZodBoolean>;
        productionReady: z.ZodOptional<z.ZodBoolean>;
        emptyReply: z.ZodOptional<z.ZodBoolean>;
        executionIntent: z.ZodOptional<z.ZodEnum<["produce", "plan_only"]>>;
        outputGoal: z.ZodOptional<z.ZodArray<z.ZodEnum<["html", "image", "video", "audio", "document", "presentation", "pdf", "text"]>, "many">>;
        deliveryState: z.ZodOptional<z.ZodEnum<["answer", "waiting", "pending", "delivered", "incomplete", "unknown"]>>;
        productionSignal: z.ZodOptional<z.ZodEnum<["accepted", "missing", "rejected", "non_terminal"]>>;
        hostDeliveryFailure: z.ZodOptional<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    }, {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    }>>;
    terminal: z.ZodBoolean;
    blockedContext: z.ZodOptional<z.ZodObject<{
        reasonCodes: z.ZodArray<z.ZodString, "many">;
        visibleText: z.ZodNullable<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        reasonCodes: string[];
        visibleText: string | null;
    }, {
        reasonCodes: string[];
        visibleText: string | null;
    }>>;
}, "strict", z.ZodTypeAny, {
    taskExecutionId: string;
    strategy: {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    };
    inputStage: "clarification" | "contract_repair" | "production" | "request";
    outcome: "blocked" | "canceled" | "clarification_required" | "completed" | "plan_ready" | "running";
    route: "direct_edit" | "full_plan" | null;
    executionMode: "complex" | "simple" | null;
    executionIntent?: "plan_only" | "produce" | undefined;
    activeRunId: string;
    nextRunId?: string | undefined;
    runMappings?: {
        runId: string;
        taskRunIndex: number;
    }[] | undefined;
    deliverableValid?: boolean | undefined;
    settlementReason?: "continued" | "ended" | "question" | undefined;
    settlementFacts?: {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    } | undefined;
    terminal: boolean;
    blockedContext?: {
        reasonCodes: string[];
        visibleText: string | null;
    } | undefined;
}, {
    taskExecutionId: string;
    strategy: {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    };
    inputStage: "clarification" | "contract_repair" | "production" | "request";
    outcome: "blocked" | "canceled" | "clarification_required" | "completed" | "plan_ready" | "running";
    route: "direct_edit" | "full_plan" | null;
    executionMode: "complex" | "simple" | null;
    executionIntent?: "plan_only" | "produce" | undefined;
    activeRunId: string;
    nextRunId?: string | undefined;
    runMappings?: {
        runId: string;
        taskRunIndex: number;
    }[] | undefined;
    deliverableValid?: boolean | undefined;
    settlementReason?: unknown;
    settlementFacts?: {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    } | undefined;
    terminal: boolean;
    blockedContext?: {
        reasonCodes: string[];
        visibleText: string | null;
    } | undefined;
}>, {
    taskExecutionId: string;
    strategy: {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    };
    inputStage: "clarification" | "contract_repair" | "production" | "request";
    outcome: "blocked" | "canceled" | "clarification_required" | "completed" | "plan_ready" | "running";
    route: "direct_edit" | "full_plan" | null;
    executionMode: "complex" | "simple" | null;
    executionIntent?: "plan_only" | "produce" | undefined;
    activeRunId: string;
    nextRunId?: string | undefined;
    runMappings?: {
        runId: string;
        taskRunIndex: number;
    }[] | undefined;
    deliverableValid?: boolean | undefined;
    settlementReason?: "continued" | "ended" | "question" | undefined;
    settlementFacts?: {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    } | undefined;
    terminal: boolean;
    blockedContext?: {
        reasonCodes: string[];
        visibleText: string | null;
    } | undefined;
}, {
    taskExecutionId: string;
    strategy: {
        id: "od-next-strategy";
        version: string;
        packageHash: string;
        snapshotId: string;
    };
    inputStage: "clarification" | "contract_repair" | "production" | "request";
    outcome: "blocked" | "canceled" | "clarification_required" | "completed" | "plan_ready" | "running";
    route: "direct_edit" | "full_plan" | null;
    executionMode: "complex" | "simple" | null;
    executionIntent?: "plan_only" | "produce" | undefined;
    activeRunId: string;
    nextRunId?: string | undefined;
    runMappings?: {
        runId: string;
        taskRunIndex: number;
    }[] | undefined;
    deliverableValid?: boolean | undefined;
    settlementReason?: unknown;
    settlementFacts?: {
        physicalStatus?: "canceled" | "failed" | "succeeded" | undefined;
        deliverableValid?: boolean | undefined;
        truncated?: boolean | undefined;
        todoUnfinished?: boolean | undefined;
        askedUserQuestion?: boolean | undefined;
        productionReady?: boolean | undefined;
        emptyReply?: boolean | undefined;
        executionIntent?: "plan_only" | "produce" | undefined;
        outputGoal?: ("audio" | "document" | "html" | "image" | "pdf" | "presentation" | "text" | "video")[] | undefined;
        deliveryState?: "answer" | "delivered" | "incomplete" | "pending" | "unknown" | "waiting" | undefined;
        productionSignal?: "accepted" | "missing" | "non_terminal" | "rejected" | undefined;
        hostDeliveryFailure?: boolean | undefined;
    } | undefined;
    terminal: boolean;
    blockedContext?: {
        reasonCodes: string[];
        visibleText: string | null;
    } | undefined;
}>;
export type StrategyTaskProjectionV2 = z.infer<typeof StrategyTaskProjectionV2Schema>;
export {};
//# sourceMappingURL=strategy-v2.d.ts.map