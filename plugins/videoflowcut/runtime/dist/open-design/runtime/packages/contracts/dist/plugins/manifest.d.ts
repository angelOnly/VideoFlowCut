import { z } from 'zod';
export declare const OPEN_DESIGN_PLUGIN_SPEC_VERSION = "1.0.0";
export declare const OpenDesignSpecVersionSchema: z.ZodString;
export declare const ReferenceSchema: z.ZodObject<{
    ref: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ref: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ref: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const RefPathSchema: z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const McpServerSpecSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export type McpServerSpec = z.infer<typeof McpServerSpecSchema>;
export declare const InputFieldSchema: z.ZodObject<{
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
export type InputField = z.infer<typeof InputFieldSchema>;
export declare const LocalizedTextSchema: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>;
export type LocalizedText = string | z.infer<typeof LocalizedTextSchema>;
export declare function resolveLocalizedText(value: LocalizedText | undefined, locale?: string, fallbackLocale?: string): string;
export declare const PipelineStageSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export type PipelineStage = z.infer<typeof PipelineStageSchema>;
export declare const PluginPipelineSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export type PluginPipeline = z.infer<typeof PluginPipelineSchema>;
export declare const GenUISurfaceSpecSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export type GenUISurfaceSpec = z.infer<typeof GenUISurfaceSpecSchema>;
export declare const PluginConnectorRefSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export type PluginConnectorRef = z.infer<typeof PluginConnectorRefSchema>;
export declare const PluginManifestSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    author: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    license: z.ZodOptional<z.ZodString>;
    homepage: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    compat: z.ZodOptional<z.ZodObject<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    od: z.ZodOptional<z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    author: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    license: z.ZodOptional<z.ZodString>;
    homepage: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    compat: z.ZodOptional<z.ZodObject<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    od: z.ZodOptional<z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    author: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    license: z.ZodOptional<z.ZodString>;
    homepage: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    compat: z.ZodOptional<z.ZodObject<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        agentSkills: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            path: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    od: z.ZodOptional<z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodOptional<z.ZodEnum<["skill", "scenario", "atom", "bundle"]>>;
        taskKind: z.ZodOptional<z.ZodEnum<["new-generation", "code-migration", "figma-migration", "tune-collab"]>>;
        mode: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        scenario: z.ZodOptional<z.ZodString>;
        engineRequirements: z.ZodOptional<z.ZodObject<{
            od: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            od: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        preview: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            entry: z.ZodOptional<z.ZodString>;
            poster: z.ZodOptional<z.ZodString>;
            video: z.ZodOptional<z.ZodString>;
            gif: z.ZodOptional<z.ZodString>;
            motion: z.ZodOptional<z.ZodEnum<["scroll", "deck", "static"]>>;
        }, z.ZodTypeAny, "passthrough">>>;
        useCase: z.ZodOptional<z.ZodObject<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            query: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>]>>;
            exampleOutputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                path: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        context: z.ZodOptional<z.ZodObject<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            designSystem: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                primary: z.ZodOptional<z.ZodBoolean>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            craft: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            assets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            claudePlugins: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                ref: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            mcp: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            atoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
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
        genui: z.ZodOptional<z.ZodObject<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            surfaces: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>>;
        connectors: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            required: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
            optional: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
//# sourceMappingURL=manifest.d.ts.map