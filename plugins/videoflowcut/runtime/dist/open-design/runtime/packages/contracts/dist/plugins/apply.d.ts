import { z } from 'zod';
import { type ContextItem } from './context.js';
import { type GenUISurfaceSpec, type InputField, type McpServerSpec, type PluginConnectorRef, type PluginPipeline } from './manifest.js';
export declare const PluginAssetRefSchema: z.ZodObject<{
    path: z.ZodString;
    src: z.ZodString;
    mime: z.ZodOptional<z.ZodString>;
    stageAt: z.ZodDefault<z.ZodEnum<["project-create", "run-start"]>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    src: string;
    mime?: string | undefined;
    stageAt: "project-create" | "run-start";
}, {
    path: string;
    src: string;
    mime?: string | undefined;
    stageAt?: "project-create" | "run-start" | undefined;
}>;
export type PluginAssetRef = z.infer<typeof PluginAssetRefSchema>;
export declare const InputFieldSpecSchema: z.ZodObject<{
    name: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
    required: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    placeholder: z.ZodOptional<z.ZodString>;
    default: z.ZodOptional<z.ZodUnknown>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
    required: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    placeholder: z.ZodOptional<z.ZodString>;
    default: z.ZodOptional<z.ZodUnknown>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
    required: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    placeholder: z.ZodOptional<z.ZodString>;
    default: z.ZodOptional<z.ZodUnknown>;
}, z.ZodTypeAny, "passthrough">>;
export type InputFieldSpec = InputField;
export declare const PluginConnectorBindingSchema: z.ZodObject<{
    id: z.ZodString;
    tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    required: z.ZodOptional<z.ZodBoolean>;
} & {
    accountLabel: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["connected", "pending", "unavailable"]>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    required: z.ZodOptional<z.ZodBoolean>;
} & {
    accountLabel: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["connected", "pending", "unavailable"]>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    required: z.ZodOptional<z.ZodBoolean>;
} & {
    accountLabel: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["connected", "pending", "unavailable"]>;
}, z.ZodTypeAny, "passthrough">>;
export type PluginConnectorBinding = z.infer<typeof PluginConnectorBindingSchema>;
export declare const AppliedPluginSnapshotSchema: z.ZodObject<{
    snapshotId: z.ZodString;
    pluginId: z.ZodString;
    pluginSpecVersion: z.ZodOptional<z.ZodString>;
    pluginVersion: z.ZodString;
    manifestSourceDigest: z.ZodString;
    sourceMarketplaceId: z.ZodOptional<z.ZodString>;
    sourceMarketplaceEntryName: z.ZodOptional<z.ZodString>;
    sourceMarketplaceEntryVersion: z.ZodOptional<z.ZodString>;
    marketplaceTrust: z.ZodOptional<z.ZodEnum<["official", "trusted", "restricted"]>>;
    resolvedSource: z.ZodOptional<z.ZodString>;
    resolvedRef: z.ZodOptional<z.ZodString>;
    archiveIntegrity: z.ZodOptional<z.ZodString>;
    pinnedRef: z.ZodOptional<z.ZodString>;
    inputs: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    resolvedContext: z.ZodObject<{
        items: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
            kind: z.ZodLiteral<"skill">;
            id: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "skill";
            id: string;
            label: string;
        }, {
            kind: "skill";
            id: string;
            label: string;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"design-system">;
            id: z.ZodString;
            label: z.ZodString;
            primary: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        }, {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"craft">;
            id: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "craft";
            id: string;
            label: string;
        }, {
            kind: "craft";
            id: string;
            label: string;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"asset">;
            path: z.ZodString;
            label: z.ZodString;
            mime: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        }, {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"mcp">;
            name: z.ZodString;
            label: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        }, {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"claude-plugin">;
            id: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "claude-plugin";
            id: string;
            label: string;
        }, {
            kind: "claude-plugin";
            id: string;
            label: string;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"atom">;
            id: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "atom";
            id: string;
            label: string;
        }, {
            kind: "atom";
            id: string;
            label: string;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"plugin">;
            id: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "plugin";
            id: string;
            label: string;
        }, {
            kind: "plugin";
            id: string;
            label: string;
        }>]>, "many">;
        promptFragments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        items: ({
            kind: "skill";
            id: string;
            label: string;
        } | {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        } | {
            kind: "craft";
            id: string;
            label: string;
        } | {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        } | {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        } | {
            kind: "claude-plugin";
            id: string;
            label: string;
        } | {
            kind: "atom";
            id: string;
            label: string;
        } | {
            kind: "plugin";
            id: string;
            label: string;
        })[];
        promptFragments?: Record<string, string> | undefined;
        atoms?: string[] | undefined;
    }, {
        items: ({
            kind: "skill";
            id: string;
            label: string;
        } | {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        } | {
            kind: "craft";
            id: string;
            label: string;
        } | {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        } | {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        } | {
            kind: "claude-plugin";
            id: string;
            label: string;
        } | {
            kind: "atom";
            id: string;
            label: string;
        } | {
            kind: "plugin";
            id: string;
            label: string;
        })[];
        promptFragments?: Record<string, string> | undefined;
        atoms?: string[] | undefined;
    }>;
    craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    capabilitiesGranted: z.ZodArray<z.ZodString, "many">;
    capabilitiesRequired: z.ZodArray<z.ZodString, "many">;
    assetsStaged: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        src: z.ZodString;
        mime: z.ZodOptional<z.ZodString>;
        stageAt: z.ZodDefault<z.ZodEnum<["project-create", "run-start"]>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt: "project-create" | "run-start";
    }, {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt?: "project-create" | "run-start" | undefined;
    }>, "many">;
    taskKind: z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>;
    appliedAt: z.ZodNumber;
    connectorsRequired: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    connectorsResolved: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    } & {
        accountLabel: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["connected", "pending", "unavailable"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    } & {
        accountLabel: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["connected", "pending", "unavailable"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    } & {
        accountLabel: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["connected", "pending", "unavailable"]>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    mcpServers: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    pipeline: z.ZodOptional<z.ZodObject<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">>>;
    genuiSurfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    pluginTitle: z.ZodOptional<z.ZodString>;
    pluginDescription: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    strategy: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodObject<{
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
    }>>>;
    status: z.ZodDefault<z.ZodEnum<["fresh", "stale"]>>;
}, "strip", z.ZodTypeAny, {
    snapshotId: string;
    pluginId: string;
    pluginSpecVersion?: string | undefined;
    pluginVersion: string;
    manifestSourceDigest: string;
    sourceMarketplaceId?: string | undefined;
    sourceMarketplaceEntryName?: string | undefined;
    sourceMarketplaceEntryVersion?: string | undefined;
    marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
    resolvedSource?: string | undefined;
    resolvedRef?: string | undefined;
    archiveIntegrity?: string | undefined;
    pinnedRef?: string | undefined;
    inputs: Record<string, string | number | boolean>;
    resolvedContext: {
        items: ({
            kind: "skill";
            id: string;
            label: string;
        } | {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        } | {
            kind: "craft";
            id: string;
            label: string;
        } | {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        } | {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        } | {
            kind: "claude-plugin";
            id: string;
            label: string;
        } | {
            kind: "atom";
            id: string;
            label: string;
        } | {
            kind: "plugin";
            id: string;
            label: string;
        })[];
        promptFragments?: Record<string, string> | undefined;
        atoms?: string[] | undefined;
    };
    craftRequires?: string[] | undefined;
    capabilitiesGranted: string[];
    capabilitiesRequired: string[];
    assetsStaged: {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt: "project-create" | "run-start";
    }[];
    taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
    appliedAt: number;
    connectorsRequired: z.objectOutputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">[];
    connectorsResolved: z.objectOutputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    } & {
        accountLabel: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["connected", "pending", "unavailable"]>;
    }, z.ZodTypeAny, "passthrough">[];
    mcpServers: z.objectOutputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    pipeline?: z.objectOutputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    genuiSurfaces?: z.objectOutputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    pluginTitle?: string | undefined;
    pluginDescription?: string | undefined;
    query?: string | undefined;
    strategy?: {
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
    } | null | undefined;
    status: "fresh" | "stale";
}, {
    snapshotId: string;
    pluginId: string;
    pluginSpecVersion?: string | undefined;
    pluginVersion: string;
    manifestSourceDigest: string;
    sourceMarketplaceId?: string | undefined;
    sourceMarketplaceEntryName?: string | undefined;
    sourceMarketplaceEntryVersion?: string | undefined;
    marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
    resolvedSource?: string | undefined;
    resolvedRef?: string | undefined;
    archiveIntegrity?: string | undefined;
    pinnedRef?: string | undefined;
    inputs: Record<string, string | number | boolean>;
    resolvedContext: {
        items: ({
            kind: "skill";
            id: string;
            label: string;
        } | {
            kind: "design-system";
            id: string;
            label: string;
            primary?: boolean | undefined;
        } | {
            kind: "craft";
            id: string;
            label: string;
        } | {
            kind: "asset";
            path: string;
            label: string;
            mime?: string | undefined;
        } | {
            kind: "mcp";
            name: string;
            label: string;
            command?: string | undefined;
        } | {
            kind: "claude-plugin";
            id: string;
            label: string;
        } | {
            kind: "atom";
            id: string;
            label: string;
        } | {
            kind: "plugin";
            id: string;
            label: string;
        })[];
        promptFragments?: Record<string, string> | undefined;
        atoms?: string[] | undefined;
    };
    craftRequires?: string[] | undefined;
    capabilitiesGranted: string[];
    capabilitiesRequired: string[];
    assetsStaged: {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt?: "project-create" | "run-start" | undefined;
    }[];
    taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
    appliedAt: number;
    connectorsRequired: z.objectInputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">[];
    connectorsResolved: z.objectInputType<{
        id: z.ZodString;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodOptional<z.ZodBoolean>;
    } & {
        accountLabel: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["connected", "pending", "unavailable"]>;
    }, z.ZodTypeAny, "passthrough">[];
    mcpServers: z.objectInputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    pipeline?: z.objectInputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    genuiSurfaces?: z.objectInputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    pluginTitle?: string | undefined;
    pluginDescription?: string | undefined;
    query?: string | undefined;
    strategy?: {
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
    } | null | undefined;
    status?: "fresh" | "stale" | undefined;
}>;
export type AppliedPluginSnapshot = z.infer<typeof AppliedPluginSnapshotSchema>;
export declare const PluginProjectMetadataPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    skillId: z.ZodOptional<z.ZodString>;
    designSystemId: z.ZodOptional<z.ZodString>;
    craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodOptional<z.ZodString>;
    skillId: z.ZodOptional<z.ZodString>;
    designSystemId: z.ZodOptional<z.ZodString>;
    craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodOptional<z.ZodString>;
    skillId: z.ZodOptional<z.ZodString>;
    designSystemId: z.ZodOptional<z.ZodString>;
    craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
}, z.ZodTypeAny, "passthrough">>;
export type PluginProjectMetadataPatch = z.infer<typeof PluginProjectMetadataPatchSchema>;
export declare const ApplyResultSchema: z.ZodObject<{
    query: z.ZodString;
    contextItems: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"skill">;
        id: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "skill";
        id: string;
        label: string;
    }, {
        kind: "skill";
        id: string;
        label: string;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"design-system">;
        id: z.ZodString;
        label: z.ZodString;
        primary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        kind: "design-system";
        id: string;
        label: string;
        primary?: boolean | undefined;
    }, {
        kind: "design-system";
        id: string;
        label: string;
        primary?: boolean | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"craft">;
        id: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "craft";
        id: string;
        label: string;
    }, {
        kind: "craft";
        id: string;
        label: string;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"asset">;
        path: z.ZodString;
        label: z.ZodString;
        mime: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        kind: "asset";
        path: string;
        label: string;
        mime?: string | undefined;
    }, {
        kind: "asset";
        path: string;
        label: string;
        mime?: string | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"mcp">;
        name: z.ZodString;
        label: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        kind: "mcp";
        name: string;
        label: string;
        command?: string | undefined;
    }, {
        kind: "mcp";
        name: string;
        label: string;
        command?: string | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"claude-plugin">;
        id: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "claude-plugin";
        id: string;
        label: string;
    }, {
        kind: "claude-plugin";
        id: string;
        label: string;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"atom">;
        id: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "atom";
        id: string;
        label: string;
    }, {
        kind: "atom";
        id: string;
        label: string;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"plugin">;
        id: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "plugin";
        id: string;
        label: string;
    }, {
        kind: "plugin";
        id: string;
        label: string;
    }>]>, "many">;
    inputs: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    assets: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        src: z.ZodString;
        mime: z.ZodOptional<z.ZodString>;
        stageAt: z.ZodDefault<z.ZodEnum<["project-create", "run-start"]>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt: "project-create" | "run-start";
    }, {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt?: "project-create" | "run-start" | undefined;
    }>, "many">;
    mcpServers: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    pipeline: z.ZodOptional<z.ZodObject<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">>>;
    genuiSurfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    projectMetadata: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        skillId: z.ZodOptional<z.ZodString>;
        designSystemId: z.ZodOptional<z.ZodString>;
        craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        skillId: z.ZodOptional<z.ZodString>;
        designSystemId: z.ZodOptional<z.ZodString>;
        craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        skillId: z.ZodOptional<z.ZodString>;
        designSystemId: z.ZodOptional<z.ZodString>;
        craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
    }, z.ZodTypeAny, "passthrough">>;
    trust: z.ZodEnum<["trusted", "restricted"]>;
    capabilitiesGranted: z.ZodArray<z.ZodString, "many">;
    capabilitiesRequired: z.ZodArray<z.ZodString, "many">;
    appliedPlugin: z.ZodObject<{
        snapshotId: z.ZodString;
        pluginId: z.ZodString;
        pluginSpecVersion: z.ZodOptional<z.ZodString>;
        pluginVersion: z.ZodString;
        manifestSourceDigest: z.ZodString;
        sourceMarketplaceId: z.ZodOptional<z.ZodString>;
        sourceMarketplaceEntryName: z.ZodOptional<z.ZodString>;
        sourceMarketplaceEntryVersion: z.ZodOptional<z.ZodString>;
        marketplaceTrust: z.ZodOptional<z.ZodEnum<["official", "trusted", "restricted"]>>;
        resolvedSource: z.ZodOptional<z.ZodString>;
        resolvedRef: z.ZodOptional<z.ZodString>;
        archiveIntegrity: z.ZodOptional<z.ZodString>;
        pinnedRef: z.ZodOptional<z.ZodString>;
        inputs: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
        resolvedContext: z.ZodObject<{
            items: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
                kind: z.ZodLiteral<"skill">;
                id: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "skill";
                id: string;
                label: string;
            }, {
                kind: "skill";
                id: string;
                label: string;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"design-system">;
                id: z.ZodString;
                label: z.ZodString;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            }, {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"craft">;
                id: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "craft";
                id: string;
                label: string;
            }, {
                kind: "craft";
                id: string;
                label: string;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"asset">;
                path: z.ZodString;
                label: z.ZodString;
                mime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            }, {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"mcp">;
                name: z.ZodString;
                label: z.ZodString;
                command: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            }, {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"claude-plugin">;
                id: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "claude-plugin";
                id: string;
                label: string;
            }, {
                kind: "claude-plugin";
                id: string;
                label: string;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"atom">;
                id: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "atom";
                id: string;
                label: string;
            }, {
                kind: "atom";
                id: string;
                label: string;
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"plugin">;
                id: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "plugin";
                id: string;
                label: string;
            }, {
                kind: "plugin";
                id: string;
                label: string;
            }>]>, "many">;
            promptFragments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        }, {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        }>;
        craftRequires: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesGranted: z.ZodArray<z.ZodString, "many">;
        capabilitiesRequired: z.ZodArray<z.ZodString, "many">;
        assetsStaged: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            src: z.ZodString;
            mime: z.ZodOptional<z.ZodString>;
            stageAt: z.ZodDefault<z.ZodEnum<["project-create", "run-start"]>>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt: "project-create" | "run-start";
        }, {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt?: "project-create" | "run-start" | undefined;
        }>, "many">;
        taskKind: z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>;
        appliedAt: z.ZodNumber;
        connectorsRequired: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        connectorsResolved: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        mcpServers: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        pipeline: z.ZodOptional<z.ZodObject<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough">>>;
        genuiSurfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        pluginTitle: z.ZodOptional<z.ZodString>;
        pluginDescription: z.ZodOptional<z.ZodString>;
        query: z.ZodOptional<z.ZodString>;
        strategy: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodObject<{
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
        }>>>;
        status: z.ZodDefault<z.ZodEnum<["fresh", "stale"]>>;
    }, "strip", z.ZodTypeAny, {
        snapshotId: string;
        pluginId: string;
        pluginSpecVersion?: string | undefined;
        pluginVersion: string;
        manifestSourceDigest: string;
        sourceMarketplaceId?: string | undefined;
        sourceMarketplaceEntryName?: string | undefined;
        sourceMarketplaceEntryVersion?: string | undefined;
        marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
        resolvedSource?: string | undefined;
        resolvedRef?: string | undefined;
        archiveIntegrity?: string | undefined;
        pinnedRef?: string | undefined;
        inputs: Record<string, string | number | boolean>;
        resolvedContext: {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        };
        craftRequires?: string[] | undefined;
        capabilitiesGranted: string[];
        capabilitiesRequired: string[];
        assetsStaged: {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt: "project-create" | "run-start";
        }[];
        taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
        appliedAt: number;
        connectorsRequired: z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">[];
        connectorsResolved: z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">[];
        mcpServers: z.objectOutputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[];
        pipeline?: z.objectOutputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        genuiSurfaces?: z.objectOutputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        pluginTitle?: string | undefined;
        pluginDescription?: string | undefined;
        query?: string | undefined;
        strategy?: {
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
        } | null | undefined;
        status: "fresh" | "stale";
    }, {
        snapshotId: string;
        pluginId: string;
        pluginSpecVersion?: string | undefined;
        pluginVersion: string;
        manifestSourceDigest: string;
        sourceMarketplaceId?: string | undefined;
        sourceMarketplaceEntryName?: string | undefined;
        sourceMarketplaceEntryVersion?: string | undefined;
        marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
        resolvedSource?: string | undefined;
        resolvedRef?: string | undefined;
        archiveIntegrity?: string | undefined;
        pinnedRef?: string | undefined;
        inputs: Record<string, string | number | boolean>;
        resolvedContext: {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        };
        craftRequires?: string[] | undefined;
        capabilitiesGranted: string[];
        capabilitiesRequired: string[];
        assetsStaged: {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt?: "project-create" | "run-start" | undefined;
        }[];
        taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
        appliedAt: number;
        connectorsRequired: z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">[];
        connectorsResolved: z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">[];
        mcpServers: z.objectInputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[];
        pipeline?: z.objectInputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        genuiSurfaces?: z.objectInputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        pluginTitle?: string | undefined;
        pluginDescription?: string | undefined;
        query?: string | undefined;
        strategy?: {
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
        } | null | undefined;
        status?: "fresh" | "stale" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: string;
    contextItems: ({
        kind: "skill";
        id: string;
        label: string;
    } | {
        kind: "design-system";
        id: string;
        label: string;
        primary?: boolean | undefined;
    } | {
        kind: "craft";
        id: string;
        label: string;
    } | {
        kind: "asset";
        path: string;
        label: string;
        mime?: string | undefined;
    } | {
        kind: "mcp";
        name: string;
        label: string;
        command?: string | undefined;
    } | {
        kind: "claude-plugin";
        id: string;
        label: string;
    } | {
        kind: "atom";
        id: string;
        label: string;
    } | {
        kind: "plugin";
        id: string;
        label: string;
    })[];
    inputs: z.objectOutputType<{
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, z.ZodTypeAny, "passthrough">[];
    assets: {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt: "project-create" | "run-start";
    }[];
    mcpServers: z.objectOutputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    pipeline?: z.objectOutputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    genuiSurfaces?: z.objectOutputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    projectMetadata: {
        name?: string | undefined;
        skillId?: string | undefined;
        designSystemId?: string | undefined;
        craftRequires?: string[] | undefined;
        taskKind?: "code-migration" | "figma-migration" | "new-generation" | "tune-collab" | undefined;
    } & {
        [k: string]: unknown;
    };
    trust: "restricted" | "trusted";
    capabilitiesGranted: string[];
    capabilitiesRequired: string[];
    appliedPlugin: {
        snapshotId: string;
        pluginId: string;
        pluginSpecVersion?: string | undefined;
        pluginVersion: string;
        manifestSourceDigest: string;
        sourceMarketplaceId?: string | undefined;
        sourceMarketplaceEntryName?: string | undefined;
        sourceMarketplaceEntryVersion?: string | undefined;
        marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
        resolvedSource?: string | undefined;
        resolvedRef?: string | undefined;
        archiveIntegrity?: string | undefined;
        pinnedRef?: string | undefined;
        inputs: Record<string, string | number | boolean>;
        resolvedContext: {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        };
        craftRequires?: string[] | undefined;
        capabilitiesGranted: string[];
        capabilitiesRequired: string[];
        assetsStaged: {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt: "project-create" | "run-start";
        }[];
        taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
        appliedAt: number;
        connectorsRequired: z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">[];
        connectorsResolved: z.objectOutputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">[];
        mcpServers: z.objectOutputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[];
        pipeline?: z.objectOutputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        genuiSurfaces?: z.objectOutputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        pluginTitle?: string | undefined;
        pluginDescription?: string | undefined;
        query?: string | undefined;
        strategy?: {
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
        } | null | undefined;
        status: "fresh" | "stale";
    };
}, {
    query: string;
    contextItems: ({
        kind: "skill";
        id: string;
        label: string;
    } | {
        kind: "design-system";
        id: string;
        label: string;
        primary?: boolean | undefined;
    } | {
        kind: "craft";
        id: string;
        label: string;
    } | {
        kind: "asset";
        path: string;
        label: string;
        mime?: string | undefined;
    } | {
        kind: "mcp";
        name: string;
        label: string;
        command?: string | undefined;
    } | {
        kind: "claude-plugin";
        id: string;
        label: string;
    } | {
        kind: "atom";
        id: string;
        label: string;
    } | {
        kind: "plugin";
        id: string;
        label: string;
    })[];
    inputs: z.objectInputType<{
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "text", "select", "number", "boolean", "file"]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, z.ZodTypeAny, "passthrough">[];
    assets: {
        path: string;
        src: string;
        mime?: string | undefined;
        stageAt?: "project-create" | "run-start" | undefined;
    }[];
    mcpServers: z.objectInputType<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    pipeline?: z.objectInputType<{
        stages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            atoms: z.ZodArray<z.ZodString, "many">;
            repeat: z.ZodOptional<z.ZodBoolean>;
            until: z.ZodOptional<z.ZodString>;
            onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    genuiSurfaces?: z.objectInputType<{
        id: z.ZodString;
        kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
        persist: z.ZodEnum<["run", "conversation", "project"]>;
        trigger: z.ZodOptional<z.ZodObject<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            stageId: z.ZodOptional<z.ZodString>;
            atom: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        prompt: z.ZodOptional<z.ZodString>;
        capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodOptional<z.ZodNumber>;
        onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
        default: z.ZodOptional<z.ZodUnknown>;
        oauth: z.ZodOptional<z.ZodObject<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            route: z.ZodEnum<["connector", "mcp", "plugin"]>;
            connectorId: z.ZodOptional<z.ZodString>;
            mcpServerId: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        component: z.ZodOptional<z.ZodObject<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
            export: z.ZodOptional<z.ZodString>;
            sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    projectMetadata: {
        name?: string | undefined;
        skillId?: string | undefined;
        designSystemId?: string | undefined;
        craftRequires?: string[] | undefined;
        taskKind?: "code-migration" | "figma-migration" | "new-generation" | "tune-collab" | undefined;
    } & {
        [k: string]: unknown;
    };
    trust: "restricted" | "trusted";
    capabilitiesGranted: string[];
    capabilitiesRequired: string[];
    appliedPlugin: {
        snapshotId: string;
        pluginId: string;
        pluginSpecVersion?: string | undefined;
        pluginVersion: string;
        manifestSourceDigest: string;
        sourceMarketplaceId?: string | undefined;
        sourceMarketplaceEntryName?: string | undefined;
        sourceMarketplaceEntryVersion?: string | undefined;
        marketplaceTrust?: "official" | "restricted" | "trusted" | undefined;
        resolvedSource?: string | undefined;
        resolvedRef?: string | undefined;
        archiveIntegrity?: string | undefined;
        pinnedRef?: string | undefined;
        inputs: Record<string, string | number | boolean>;
        resolvedContext: {
            items: ({
                kind: "skill";
                id: string;
                label: string;
            } | {
                kind: "design-system";
                id: string;
                label: string;
                primary?: boolean | undefined;
            } | {
                kind: "craft";
                id: string;
                label: string;
            } | {
                kind: "asset";
                path: string;
                label: string;
                mime?: string | undefined;
            } | {
                kind: "mcp";
                name: string;
                label: string;
                command?: string | undefined;
            } | {
                kind: "claude-plugin";
                id: string;
                label: string;
            } | {
                kind: "atom";
                id: string;
                label: string;
            } | {
                kind: "plugin";
                id: string;
                label: string;
            })[];
            promptFragments?: Record<string, string> | undefined;
            atoms?: string[] | undefined;
        };
        craftRequires?: string[] | undefined;
        capabilitiesGranted: string[];
        capabilitiesRequired: string[];
        assetsStaged: {
            path: string;
            src: string;
            mime?: string | undefined;
            stageAt?: "project-create" | "run-start" | undefined;
        }[];
        taskKind: "code-migration" | "figma-migration" | "new-generation" | "tune-collab";
        appliedAt: number;
        connectorsRequired: z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">[];
        connectorsResolved: z.objectInputType<{
            id: z.ZodString;
            tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodOptional<z.ZodBoolean>;
        } & {
            accountLabel: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<["connected", "pending", "unavailable"]>;
        }, z.ZodTypeAny, "passthrough">[];
        mcpServers: z.objectInputType<{
            name: z.ZodString;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[];
        pipeline?: z.objectInputType<{
            stages: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                atoms: z.ZodArray<z.ZodString, "many">;
                repeat: z.ZodOptional<z.ZodBoolean>;
                until: z.ZodOptional<z.ZodString>;
                onFailure: z.ZodOptional<z.ZodEnum<["abort", "skip", "retry"]>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        genuiSurfaces?: z.objectInputType<{
            id: z.ZodString;
            kind: z.ZodEnum<["form", "choice", "confirmation", "oauth-prompt"]>;
            persist: z.ZodEnum<["run", "conversation", "project"]>;
            trigger: z.ZodOptional<z.ZodObject<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                stageId: z.ZodOptional<z.ZodString>;
                atom: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            prompt: z.ZodOptional<z.ZodString>;
            capabilitiesRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout: z.ZodOptional<z.ZodNumber>;
            onTimeout: z.ZodOptional<z.ZodEnum<["abort", "default", "skip"]>>;
            default: z.ZodOptional<z.ZodUnknown>;
            oauth: z.ZodOptional<z.ZodObject<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                route: z.ZodEnum<["connector", "mcp", "plugin"]>;
                connectorId: z.ZodOptional<z.ZodString>;
                mcpServerId: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            component: z.ZodOptional<z.ZodObject<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                export: z.ZodOptional<z.ZodString>;
                sandbox: z.ZodOptional<z.ZodEnum<["iframe", "react"]>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        pluginTitle?: string | undefined;
        pluginDescription?: string | undefined;
        query?: string | undefined;
        strategy?: {
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
        } | null | undefined;
        status?: "fresh" | "stale" | undefined;
    };
}>;
export type ApplyResult = z.infer<typeof ApplyResultSchema>;
export type { ContextItem, GenUISurfaceSpec, InputField, McpServerSpec, PluginConnectorRef, PluginPipeline };
//# sourceMappingURL=apply.d.ts.map