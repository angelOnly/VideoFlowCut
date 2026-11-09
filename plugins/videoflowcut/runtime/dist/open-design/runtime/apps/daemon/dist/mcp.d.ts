import { type LocalMcpBriefStore } from './mcp-brief.js';
import { type ExternalPluginContext, logicalPluginRequestDigest, mapMcpHostProduct, normalizeExternalPluginRunAnalyticsHints, resolvePluginGenerationSloWindowMs, validateExternalPluginContext } from './mcp-observability.js';
export declare const OPEN_DESIGN_BRIEF_APP_RESOURCE = "ui://open-design/artifact-card-v8.html";
export declare const MCP_SERVER_INSTRUCTIONS: string;
type JsonObject = Record<string, unknown>;
interface RunMcpOptions {
    daemonUrl: string | URL;
    resolveDaemonUrl?: () => Promise<string | URL>;
}
interface ActiveContext {
    active?: boolean;
    projectId?: string;
    projectName?: string | null;
    fileName?: string | null;
    ageMs?: number | null;
}
type ResolvedProject = {
    id: string;
    name: string;
    source: 'uuid' | 'id' | 'exact' | 'slug' | 'substring';
};
interface McpArgs extends JsonObject {
    project?: unknown;
    entry?: unknown;
    include?: unknown;
    maxBytes?: unknown;
    path?: unknown;
    offset?: unknown;
    limit?: unknown;
    since?: unknown;
    query?: unknown;
    pattern?: unknown;
    max?: unknown;
    name?: unknown;
    content?: unknown;
    encoding?: unknown;
    artifactManifest?: unknown;
    confirm?: unknown;
    prompt?: unknown;
    plugin?: unknown;
    inputs?: unknown;
    agent?: unknown;
    model?: unknown;
    serviceTier?: unknown;
    apiKey?: unknown;
    requestId?: unknown;
    resume?: unknown;
    runId?: unknown;
    id?: unknown;
    designSystem?: unknown;
    skill?: unknown;
    skills?: string[];
    includeUnavailable?: unknown;
    artifactType?: unknown;
    projectTitle?: unknown;
    locale?: unknown;
    knownAnswers?: unknown;
    skip?: unknown;
    briefDraftId?: unknown;
    nonce?: unknown;
    answers?: unknown;
    externalPluginContext?: unknown;
    pluginWorkflowId?: unknown;
}
interface ProjectFileBundleEntry {
    name: string;
    mime: string;
    size: number | null;
    content: string | null;
    binary: boolean;
}
interface HandleMcpToolCallOptions {
    briefStore?: LocalMcpBriefStore;
    analyticsHeaders?: Record<string, string>;
    pluginAttribution?: McpPluginAttribution | null;
    briefState?: 'confirmed' | 'skipped' | 'not_applicable';
}
interface McpPluginAttribution {
    context: ExternalPluginContext;
    pluginWorkflowId: string;
}
interface McpToolCallResult {
    [key: string]: unknown;
    content: Array<{
        type: 'text';
        text: string;
    }>;
    structuredContent?: JsonObject;
    isError?: boolean;
}
export declare function createMcpDaemonTarget(options: RunMcpOptions): {
    call(name: string, args: McpArgs, handler: (baseUrl: string) => Promise<McpToolCallResult>): Promise<McpToolCallResult>;
    currentUrl(): string;
    refresh(): Promise<string>;
};
export declare function _localeFromMcpToolMetadata(meta: unknown): string | undefined;
interface McpIdleExitControllerOptions {
    idleMs: number;
    onIdle: () => void;
}
export declare function _resolveMcpStdioIdleExitMs(env?: NodeJS.ProcessEnv): number;
export declare function _createMcpIdleExitController({ idleMs, onIdle, }: McpIdleExitControllerOptions): {
    noteActivity(): void;
    trackRequest<T>(fn: () => T | Promise<T>): Promise<T>;
    dispose(): void;
};
export declare const TOOL_DEFS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType: {
                type: string;
                enum: string[];
                description: string;
            };
            projectTitle: {
                type: string;
                description: string;
            };
            locale: {
                type: string;
                description: string;
            };
            knownAnswers: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            skip: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            externalPluginContext: {
                readonly type: 'object';
                readonly properties: {
                    readonly id: {
                        readonly type: 'string';
                        readonly const: "open-design";
                    };
                    readonly version: {
                        readonly type: 'string';
                    };
                    readonly distributionMechanism: {
                        readonly type: 'string';
                        readonly enum: readonly ['git_marketplace', 'local_repo', 'manual', 'unknown'];
                    };
                    readonly publisherClass: {
                        readonly type: 'string';
                        readonly enum: readonly ['open_design_first_party', 'third_party', 'unknown'];
                    };
                };
                readonly required: readonly ['id', 'version', 'distributionMechanism', 'publisherClass'];
                readonly additionalProperties: false;
                readonly description: 'Bounded self-reported distribution context. Used for product analytics only, never authorization or billing.';
            };
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
    _meta: {
        ui: {
            resourceUri: string;
        };
        'ui/resourceUri': string;
        'openai/outputTemplate': string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId: {
                type: string;
                description: string;
            };
            nonce: {
                type: string;
                description: string;
            };
            answers: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            locale: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            entry: {
                type: string;
                description: string;
            };
            include: {
                type: string;
                enum: string[];
                description: string;
            };
            maxBytes: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            query: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            max: {
                type: string;
                description: string;
            };
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            since: {
                type: string;
                description: string;
            };
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            name: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            encoding: {
                type: string;
                enum: string[];
                description: string;
            };
            artifactManifest: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            path?: never;
            confirm?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            encoding: {
                type: string;
                enum: string[];
                description: string;
            };
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        destructiveHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            project: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        destructiveHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name: {
                type: string;
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            designSystem: {
                type: string;
                description: string;
            };
            skill: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            prompt?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            prompt: {
                type: string;
                description: string;
            };
            skill: {
                type: string;
                description: string;
            };
            skills: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            plugin: {
                type: string;
                description: string;
            };
            inputs: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            agent: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            serviceTier: {
                type: string;
                description: string;
            };
            requestId: {
                type: string;
                description: string;
            };
            resume: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            project: {
                type: string;
                description: string;
            };
            run_id: {
                type: string;
                description: string;
            };
            source_path: {
                type: string;
                description: string;
            };
            manifest_path: {
                type: string;
                description: string;
            };
            source_sha256?: never;
            manifest_sha256?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            project: {
                type: string;
                description: string;
            };
            run_id: {
                type: string;
                description: string;
            };
            source_path: {
                type: string;
                description: string;
            };
            manifest_path: {
                type: string;
                description: string;
            };
            source_sha256: {
                type: string;
                description: string;
            };
            manifest_sha256: {
                type: string;
                description: string;
            };
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project: {
                type: string;
                description: string;
            };
            frozen_version: {
                type: string;
                description: string;
            };
            run_id?: never;
            feedback_id?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            runId: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id: {
                type: string;
                description: string;
            };
            feedback_id: {
                type: string;
                description: string;
            };
            frozen_version: {
                type: string;
                description: string;
            };
            range: {
                type: string;
                properties: {
                    startFrame: {
                        type: string;
                        minimum: number;
                    };
                    endFrame: {
                        type: string;
                        minimum: number;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
            text: {
                type: string;
                description: string;
            };
            expected_turn_id: {
                type: string;
                description: string;
            };
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId: {
                type: string;
                description: string;
            };
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        required?: never;
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
        };
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
})[];
export declare function localMcpToolDefinitions(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType: {
                type: string;
                enum: string[];
                description: string;
            };
            projectTitle: {
                type: string;
                description: string;
            };
            locale: {
                type: string;
                description: string;
            };
            knownAnswers: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            skip: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            externalPluginContext: {
                readonly type: 'object';
                readonly properties: {
                    readonly id: {
                        readonly type: 'string';
                        readonly const: "open-design";
                    };
                    readonly version: {
                        readonly type: 'string';
                    };
                    readonly distributionMechanism: {
                        readonly type: 'string';
                        readonly enum: readonly ['git_marketplace', 'local_repo', 'manual', 'unknown'];
                    };
                    readonly publisherClass: {
                        readonly type: 'string';
                        readonly enum: readonly ['open_design_first_party', 'third_party', 'unknown'];
                    };
                };
                readonly required: readonly ['id', 'version', 'distributionMechanism', 'publisherClass'];
                readonly additionalProperties: false;
                readonly description: 'Bounded self-reported distribution context. Used for product analytics only, never authorization or billing.';
            };
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
    _meta: {
        ui: {
            resourceUri: string;
        };
        'ui/resourceUri': string;
        'openai/outputTemplate': string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId: {
                type: string;
                description: string;
            };
            nonce: {
                type: string;
                description: string;
            };
            answers: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            locale: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            entry: {
                type: string;
                description: string;
            };
            include: {
                type: string;
                enum: string[];
                description: string;
            };
            maxBytes: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            query: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            max: {
                type: string;
                description: string;
            };
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            since: {
                type: string;
                description: string;
            };
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            name: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            encoding: {
                type: string;
                enum: string[];
                description: string;
            };
            artifactManifest: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            path?: never;
            confirm?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            encoding: {
                type: string;
                enum: string[];
                description: string;
            };
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            path: {
                type: string;
                description: string;
            };
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        destructiveHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            project: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        destructiveHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name: {
                type: string;
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            designSystem: {
                type: string;
                description: string;
            };
            skill: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            prompt?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            project: {
                readonly type: 'string';
                readonly description: 'Project id (UUID) or name substring. Optional; defaults to the active project (expires after ~5 minutes of no OpenDesign activity).';
            };
            prompt: {
                type: string;
                description: string;
            };
            skill: {
                type: string;
                description: string;
            };
            skills: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            plugin: {
                type: string;
                description: string;
            };
            inputs: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            agent: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            serviceTier: {
                type: string;
                description: string;
            };
            requestId: {
                type: string;
                description: string;
            };
            resume: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
        };
        additionalProperties: boolean;
        required?: never;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            project: {
                type: string;
                description: string;
            };
            run_id: {
                type: string;
                description: string;
            };
            source_path: {
                type: string;
                description: string;
            };
            manifest_path: {
                type: string;
                description: string;
            };
            source_sha256?: never;
            manifest_sha256?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            project: {
                type: string;
                description: string;
            };
            run_id: {
                type: string;
                description: string;
            };
            source_path: {
                type: string;
                description: string;
            };
            manifest_path: {
                type: string;
                description: string;
            };
            source_sha256: {
                type: string;
                description: string;
            };
            manifest_sha256: {
                type: string;
                description: string;
            };
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project: {
                type: string;
                description: string;
            };
            frozen_version: {
                type: string;
                description: string;
            };
            run_id?: never;
            feedback_id?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            runId: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            includeUnavailable?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id: {
                type: string;
                description: string;
            };
            feedback_id: {
                type: string;
                description: string;
            };
            frozen_version: {
                type: string;
                description: string;
            };
            range: {
                type: string;
                properties: {
                    startFrame: {
                        type: string;
                        minimum: number;
                    };
                    endFrame: {
                        type: string;
                        minimum: number;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
            text: {
                type: string;
                description: string;
            };
            expected_turn_id: {
                type: string;
                description: string;
            };
            runId?: never;
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId: {
                type: string;
                description: string;
            };
            includeUnavailable?: never;
            pluginWorkflowId?: never;
        };
        required: string[];
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
} | {
    _meta?: never;
    name: string;
    description: string;
    inputSchema: {
        required?: never;
        type: string;
        properties: {
            artifactType?: never;
            projectTitle?: never;
            knownAnswers?: never;
            skip?: never;
            externalPluginContext?: never;
            briefDraftId?: never;
            nonce?: never;
            answers?: never;
            locale?: never;
            entry?: never;
            include?: never;
            maxBytes?: never;
            offset?: never;
            limit?: never;
            query?: never;
            pattern?: never;
            max?: never;
            since?: never;
            artifactManifest?: never;
            content?: never;
            encoding?: never;
            path?: never;
            confirm?: never;
            name?: never;
            id?: never;
            designSystem?: never;
            prompt?: never;
            skill?: never;
            skills?: never;
            plugin?: never;
            inputs?: never;
            agent?: never;
            model?: never;
            serviceTier?: never;
            requestId?: never;
            resume?: never;
            source_path?: never;
            manifest_path?: never;
            source_sha256?: never;
            manifest_sha256?: never;
            project?: never;
            run_id?: never;
            feedback_id?: never;
            frozen_version?: never;
            range?: never;
            text?: never;
            expected_turn_id?: never;
            runId?: never;
            includeUnavailable: {
                type: string;
                description: string;
            };
            pluginWorkflowId: {
                readonly type: 'string';
                readonly description: 'Opaque workflow id issued by the local OpenDesign MCP after the first attributed call. Reuse it for later plugin-attributed calls; never invent or display it.';
            };
        };
        additionalProperties: boolean;
    };
    annotations: {
        readOnlyHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
        title: string;
    };
})[];
declare function validateMcpToolArgs(name: string, args: McpArgs): void;
export declare function localMcpResourceDefinitions(): {
    uri: string;
    name: string;
    title: string;
    description: string;
    mimeType: string;
    _meta: {
        ui: {
            prefersBorder: boolean;
            csp: {
                connectDomains: never[];
                resourceDomains: never[];
            };
        };
        'ui/prefersBorder': boolean;
        'ui/csp': {
            connectDomains: never[];
            resourceDomains: never[];
        };
        'openai/widgetPrefersBorder': boolean;
    };
}[];
export declare function createLocalMcpBriefStore(): LocalMcpBriefStore;
/** Handler body for MCP `resources/list`. Exported so tests can call it
 * directly without a real server. Mirrors the inline logic in
 * `runMcpStdio` to keep the test harness cheap. */
export declare function _listMcpResources(daemonTarget: ReturnType<typeof createMcpDaemonTarget>): Promise<{
    resources: Array<{
        uri: string;
        name: string;
        description: string;
        mimeType: string;
    }>;
}>;
/** Handler body for MCP `resources/read`. Exported so tests can call it
 * directly without a real server. Mirrors the inline logic in
 * `runMcpStdio` to keep the test harness cheap. */
export declare function _readMcpResource(daemonTarget: ReturnType<typeof createMcpDaemonTarget>, uri: string): Promise<{
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
        _meta?: Record<string, unknown>;
    }>;
}>;
interface McpObservedCall {
    attribution: McpPluginAttribution | null;
    attemptNumber: number;
    pollAttemptCount?: number;
}
declare function issuePluginWorkflowId(callerValue: unknown): string;
export declare class McpObservabilitySession {
    private baseUrl;
    private readonly identity;
    readonly id: `${string}-${string}-${string}-${string}-${string}`;
    readonly hostProduct: import("@open-design/contracts").AnalyticsHostProduct;
    private readonly workflows;
    private readonly runWorkflows;
    private readonly workflowRuns;
    private readonly workflowProjects;
    private readonly attempts;
    private readonly polls;
    private constructor();
    updateBaseUrl(baseUrl: string): void;
    static create(baseUrl: string, clientInfo: {
        name?: unknown;
        version?: unknown;
    } | null | undefined): Promise<McpObservabilitySession>;
    private restoreAcceptedWorkflow;
    resolveAttribution(name: unknown, args: McpArgs, briefStore: LocalMcpBriefStore): Promise<McpPluginAttribution | null>;
    beginCall(name: string, args: McpArgs, attribution: McpPluginAttribution | null): McpObservedCall;
    rememberRun(runId: string, projectId: string | undefined, attribution: McpPluginAttribution): void;
    attributionQuality(name: string, args: McpArgs, attribution: McpPluginAttribution | null, payload: JsonObject | null): 'self_reported' | 'session_correlated';
    correlationFacts(name: string, args: McpArgs, attribution: McpPluginAttribution | null, payload: JsonObject | null): Record<string, unknown>;
    emit(event: 'mcp_session_initialized' | 'mcp_tool_started' | 'mcp_tool_finished', attribution: McpPluginAttribution | null, properties: Record<string, unknown>): Promise<void>;
    headers(attribution: McpPluginAttribution | null, requestId?: string, attributionQuality?: 'self_reported' | 'session_correlated'): Record<string, string>;
}
declare function mcpFailureFacts(name: string, result: McpToolCallResult): Record<string, unknown>;
declare function mcpDeliveryFacts(name: string, result: McpToolCallResult, payload: JsonObject | null, pollAttemptCount?: number): Record<string, unknown>;
export declare function _installMcpFatalErrorHandlers(options?: {
    writeStderr?: (message: string) => void;
    exit?: (code: number) => void;
}): () => void;
export declare function runMcpStdio(options: RunMcpOptions): Promise<void>;
declare function handleMcpToolCall(baseUrl: string, name: unknown, args: McpArgs, options?: HandleMcpToolCallOptions): Promise<McpToolCallResult>;
declare function createArtifact(baseUrl: string, args: McpArgs, headers?: Record<string, string>): Promise<McpToolCallResult>;
declare function resolveProjectArg(baseUrl: string, arg: unknown, headers?: Record<string, string>): Promise<{
    id: string;
    resolved: ResolvedProject | null;
    active: ActiveContext | null;
}>;
declare function resolveProjectId(baseUrl: string, arg: unknown, headers?: Record<string, string>): Promise<ResolvedProject>;
declare function getFile(baseUrl: string, project: string, relPath: string, active: ActiveContext | null, resolved?: ResolvedProject | null, offset?: number, limit?: number, headers?: Record<string, string>): Promise<McpToolCallResult>;
declare function withActiveEcho<T extends JsonObject>(payload: T, active: ActiveContext | null, resolved?: ResolvedProject | null): T & JsonObject;
declare function getArtifact(baseUrl: string, projectArg: unknown, entryArg: unknown, includeMode: unknown, maxBytesArg: unknown, headers?: Record<string, string>): Promise<McpToolCallResult>;
declare function fetchProjectFile(baseUrl: string, projectId: string, relPath: string, remainingBytes?: number, headers?: Record<string, string>): Promise<ProjectFileBundleEntry>;
declare function extractRelativeRefs(text: string, fromPath: string, fromMime: string): string[];
export { createArtifact, extractRelativeRefs, fetchProjectFile, getArtifact, getFile, handleMcpToolCall, logicalPluginRequestDigest, mapMcpHostProduct, normalizeExternalPluginRunAnalyticsHints, mcpDeliveryFacts, mcpFailureFacts, resolvePluginGenerationSloWindowMs, resolveProjectArg, resolveProjectId, validateExternalPluginContext, validateMcpToolArgs, issuePluginWorkflowId, withActiveEcho, };
