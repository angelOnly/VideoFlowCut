import { z } from 'zod';
export declare const ContextItemSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
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
}>]>;
export type ContextItem = z.infer<typeof ContextItemSchema>;
export type ContextItemKind = ContextItem['kind'];
export declare const ResolvedContextSchema: z.ZodObject<{
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
export type ResolvedContext = z.infer<typeof ResolvedContextSchema>;
//# sourceMappingURL=context.d.ts.map