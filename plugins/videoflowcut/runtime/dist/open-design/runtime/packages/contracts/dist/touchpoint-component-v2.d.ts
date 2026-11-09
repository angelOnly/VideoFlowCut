import { z } from "zod";
/**
 * Controlled mirror of @vela/shared's CMS v2 fixture. It is intentionally
 * copied, rather than imported from a sibling worktree, so host builds retain
 * a versioned contract even when Vela is not present locally.
 */
export declare const TOUCHPOINT_COMPONENT_V2_PROTOCOL: "vela-touchpoint-component/v2";
export declare const TOUCHPOINT_COMPONENT_V2_UPSTREAM_PROVENANCE: Readonly<{
    package: "@vela/shared";
    packageVersion: "0.0.0";
    sourceFiles: readonly string[];
    sourceSha256: Readonly<{
        touchpoints: "be26f9c4e5cfe6e0a0eedee3d31dc70df8f1c8ee61704e765d4f5c89879fc2f0";
        fixture: "278a40cd787dc74544aa785f85d218d8a51820d2d0e14c7b8d7c6eced10b4c92";
    }>;
}>;
export declare const TOUCHPOINT_COMPONENT_V2_RUNTIME_KIND: "web-component";
export declare const TOUCHPOINT_COMPONENT_V2_RUNTIME_API_VERSION: 1;
export declare const TOUCHPOINT_COMPONENT_V2_WRAPPER_VERSION: "vela-touchpoint-wrapper-v1";
export declare const TOUCHPOINT_COMPONENT_V2_SDK_VERSION: "vela-touchpoint-sdk-v1";
/** Controlled mirror of Vela's frozen v2 manifest contract, including defaults and cross-field checks. */
export declare const TouchpointComponentV2ManifestSchema: z.ZodEffects<z.ZodObject<{
    formatVersion: z.ZodLiteral<2>;
    runtimeKind: z.ZodLiteral<"web-component">;
    runtimeApiVersion: z.ZodLiteral<1>;
    platformWrapperVersion: z.ZodLiteral<"vela-touchpoint-wrapper-v1">;
    sdkVersion: z.ZodLiteral<"vela-touchpoint-sdk-v1">;
    contentLine: z.ZodString;
    placements: z.ZodArray<z.ZodObject<{
        key: z.ZodEnum<["opend.home.campaign-modal", "opend.home.account-badge", "opend.home.hover-layer", "opend.home.hover-entry", "vela.web.console-overlay"]>;
        entry: z.ZodEffects<z.ZodString, string, string>;
        resources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        locales: z.ZodArray<z.ZodString, "many">;
        requiredCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        staticActions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            target: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
                kind: z.ZodLiteral<"https">;
                url: z.ZodEffects<z.ZodString, string, string>;
            }, "strip", z.ZodTypeAny, {
                kind: "https";
                url: string;
            }, {
                kind: "https";
                url: string;
            }>, z.ZodObject<{
                /** Parsed across hosts; only the Vela host may execute this action. */
                kind: z.ZodLiteral<"vela-personal-subscription">;
                resourceId: z.ZodLiteral<"vela.dashboard.personal-subscription">;
            }, "strip", z.ZodTypeAny, {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            }, {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            }>, z.ZodObject<{
                kind: z.ZodLiteral<"internal">;
                path: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>;
            }, "strip", z.ZodTypeAny, {
                kind: "internal";
                path: string;
            }, {
                kind: "internal";
                path: string;
            }>]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }, {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources: string[];
        locales: string[];
        requiredCapabilities: string[];
        staticActions: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[];
    }, {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources?: string[] | undefined;
        locales: string[];
        requiredCapabilities?: string[] | undefined;
        staticActions?: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[] | undefined;
    }>, "many">;
    resources: z.ZodArray<z.ZodString, "many">;
    images: z.ZodDefault<z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        output: z.ZodString;
        format: z.ZodDefault<z.ZodEnum<["webp", "png"]>>;
        displayWidth: z.ZodOptional<z.ZodNumber>;
        displayHeight: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        source: string;
        output: string;
        format: "png" | "webp";
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }, {
        source: string;
        output: string;
        format?: "png" | "webp" | undefined;
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    formatVersion: 2;
    runtimeKind: "web-component";
    runtimeApiVersion: 1;
    platformWrapperVersion: "vela-touchpoint-wrapper-v1";
    sdkVersion: "vela-touchpoint-sdk-v1";
    contentLine: string;
    placements: {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources: string[];
        locales: string[];
        requiredCapabilities: string[];
        staticActions: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[];
    }[];
    resources: string[];
    images: {
        source: string;
        output: string;
        format: "png" | "webp";
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }[];
}, {
    formatVersion: 2;
    runtimeKind: "web-component";
    runtimeApiVersion: 1;
    platformWrapperVersion: "vela-touchpoint-wrapper-v1";
    sdkVersion: "vela-touchpoint-sdk-v1";
    contentLine: string;
    placements: {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources?: string[] | undefined;
        locales: string[];
        requiredCapabilities?: string[] | undefined;
        staticActions?: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[] | undefined;
    }[];
    resources: string[];
    images?: {
        source: string;
        output: string;
        format?: "png" | "webp" | undefined;
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }[] | undefined;
}>, {
    formatVersion: 2;
    runtimeKind: "web-component";
    runtimeApiVersion: 1;
    platformWrapperVersion: "vela-touchpoint-wrapper-v1";
    sdkVersion: "vela-touchpoint-sdk-v1";
    contentLine: string;
    placements: {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources: string[];
        locales: string[];
        requiredCapabilities: string[];
        staticActions: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[];
    }[];
    resources: string[];
    images: {
        source: string;
        output: string;
        format: "png" | "webp";
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }[];
}, {
    formatVersion: 2;
    runtimeKind: "web-component";
    runtimeApiVersion: 1;
    platformWrapperVersion: "vela-touchpoint-wrapper-v1";
    sdkVersion: "vela-touchpoint-sdk-v1";
    contentLine: string;
    placements: {
        key: "opend.home.account-badge" | "opend.home.campaign-modal" | "opend.home.hover-entry" | "opend.home.hover-layer" | "vela.web.console-overlay";
        entry: string;
        resources?: string[] | undefined;
        locales: string[];
        requiredCapabilities?: string[] | undefined;
        staticActions?: {
            id: string;
            target: {
                kind: "https";
                url: string;
            } | {
                kind: "vela-personal-subscription";
                resourceId: "vela.dashboard.personal-subscription";
            } | {
                kind: "internal";
                path: string;
            };
        }[] | undefined;
    }[];
    resources: string[];
    images?: {
        source: string;
        output: string;
        format?: "png" | "webp" | undefined;
        displayWidth?: number | undefined;
        displayHeight?: number | undefined;
    }[] | undefined;
}>;
export type TouchpointComponentV2Manifest = z.infer<typeof TouchpointComponentV2ManifestSchema>;
/** A versioned copy of Vela's vectors; hash is compared by maintainer cross-repo verification. */
export declare const touchpointComponentV2ConformanceVectors: {
    readonly positive: {
        readonly populated: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "conformance-component";
            readonly placements: readonly [{
                readonly key: "opend.home.campaign-modal";
                readonly entry: "component.js";
                readonly resources: readonly ["component.css", "source.png", "output.webp"];
                readonly locales: readonly ["en-US"];
                readonly requiredCapabilities: readonly ["static-action"];
                readonly staticActions: readonly [{
                    readonly id: "learn-more";
                    readonly target: {
                        readonly kind: "https";
                        readonly url: "https://example.com/learn";
                    };
                }];
            }];
            readonly resources: readonly ["component.js", "component.css", "source.png", "output.webp"];
            readonly images: readonly [{
                readonly source: "source.png";
                readonly output: "output.webp";
                readonly format: "webp";
                readonly displayWidth: 320;
            }];
        };
        readonly multiPlacement: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "multi-placement-component";
            readonly placements: readonly [{
                readonly key: "opend.home.campaign-modal";
                readonly entry: "modal.js";
                readonly resources: readonly ["shared.css"];
                readonly locales: readonly ["en-US"];
            }, {
                readonly key: "opend.home.account-badge";
                readonly entry: "badge.js";
                readonly resources: readonly ["shared.css"];
                readonly locales: readonly ["en-US"];
            }, {
                readonly key: "opend.home.hover-entry";
                readonly entry: "hover-entry.js";
                readonly resources: readonly ["shared.css"];
                readonly locales: readonly ["en-US"];
            }, {
                readonly key: "opend.home.hover-layer";
                readonly entry: "hover-layer.js";
                readonly resources: readonly ["shared.css"];
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["modal.js", "badge.js", "hover-entry.js", "hover-layer.js", "shared.css"];
        };
        readonly defaults: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "default-component";
            readonly placements: readonly [{
                readonly key: "opend.home.account-badge";
                readonly entry: "component.js";
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["component.js"];
        };
    };
    readonly negative: {
        readonly invalidPath: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "invalid-path";
            readonly placements: readonly [{
                readonly key: "opend.home.account-badge";
                readonly entry: "../component.js";
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["../component.js"];
        };
        readonly duplicateEntry: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "duplicate-entry";
            readonly placements: readonly [{
                readonly key: "opend.home.campaign-modal";
                readonly entry: "component.js";
                readonly locales: readonly ["en-US"];
            }, {
                readonly key: "opend.home.account-badge";
                readonly entry: "component.js";
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["component.js"];
        };
        readonly invalidKey: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "invalid-key";
            readonly placements: readonly [{
                readonly key: "unknown.host";
                readonly entry: "component.js";
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["component.js"];
        };
        readonly imageOutputUndeclared: {
            readonly formatVersion: 2;
            readonly runtimeKind: "web-component";
            readonly runtimeApiVersion: 1;
            readonly platformWrapperVersion: "vela-touchpoint-wrapper-v1";
            readonly sdkVersion: "vela-touchpoint-sdk-v1";
            readonly contentLine: "bad-image";
            readonly placements: readonly [{
                readonly key: "opend.home.account-badge";
                readonly entry: "component.js";
                readonly locales: readonly ["en-US"];
            }];
            readonly resources: readonly ["component.js", "source.png"];
            readonly images: readonly [{
                readonly source: "source.png";
                readonly output: "output.webp";
            }];
        };
    };
};
export declare const TouchpointComponentV2FixtureSchema: z.ZodObject<{
    manifest: z.ZodObject<{
        formatVersion: z.ZodLiteral<2>;
        runtimeKind: z.ZodLiteral<"web-component">;
        runtimeApiVersion: z.ZodLiteral<1>;
        platformWrapperVersion: z.ZodLiteral<"vela-touchpoint-wrapper-v1">;
        sdkVersion: z.ZodLiteral<"vela-touchpoint-sdk-v1">;
        contentLine: z.ZodLiteral<"fixture-component">;
        placements: z.ZodTuple<[z.ZodObject<{
            key: z.ZodLiteral<"opend.home.campaign-modal">;
            entry: z.ZodLiteral<"component.js">;
            resources: z.ZodTuple<[z.ZodLiteral<"component.css">], null>;
            locales: z.ZodTuple<[z.ZodLiteral<"en-US">], null>;
            requiredCapabilities: z.ZodTuple<[], null>;
            staticActions: z.ZodTuple<[], null>;
        }, "strict", z.ZodTypeAny, {
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }, {
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }>], null>;
        resources: z.ZodTuple<[z.ZodLiteral<"component.js">, z.ZodLiteral<"component.css">], null>;
        images: z.ZodTuple<[], null>;
    }, "strict", z.ZodTypeAny, {
        formatVersion: 2;
        runtimeKind: "web-component";
        runtimeApiVersion: 1;
        platformWrapperVersion: "vela-touchpoint-wrapper-v1";
        sdkVersion: "vela-touchpoint-sdk-v1";
        contentLine: "fixture-component";
        placements: [{
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }];
        resources: ["component.js", "component.css"];
        images: [];
    }, {
        formatVersion: 2;
        runtimeKind: "web-component";
        runtimeApiVersion: 1;
        platformWrapperVersion: "vela-touchpoint-wrapper-v1";
        sdkVersion: "vela-touchpoint-sdk-v1";
        contentLine: "fixture-component";
        placements: [{
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }];
        resources: ["component.js", "component.css"];
        images: [];
    }>;
    files: z.ZodObject<{
        "component.js": z.ZodLiteral<"export function mount(root, context, sdk) { root.dataset.cmsRuntime = String(sdk.runtimeApiVersion); return root; }\nexport function update() {}\nexport function dispose() {}\n">;
        "component.css": z.ZodLiteral<":host { display: block; }\n">;
    }, "strict", z.ZodTypeAny, {
        "component.js": "export function mount(root, context, sdk) { root.dataset.cmsRuntime = String(sdk.runtimeApiVersion); return root; }\nexport function update() {}\nexport function dispose() {}\n";
        "component.css": ":host { display: block; }\n";
    }, {
        "component.js": "export function mount(root, context, sdk) { root.dataset.cmsRuntime = String(sdk.runtimeApiVersion); return root; }\nexport function update() {}\nexport function dispose() {}\n";
        "component.css": ":host { display: block; }\n";
    }>;
}, "strict", z.ZodTypeAny, {
    manifest: {
        formatVersion: 2;
        runtimeKind: "web-component";
        runtimeApiVersion: 1;
        platformWrapperVersion: "vela-touchpoint-wrapper-v1";
        sdkVersion: "vela-touchpoint-sdk-v1";
        contentLine: "fixture-component";
        placements: [{
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }];
        resources: ["component.js", "component.css"];
        images: [];
    };
    files: {
        "component.js": "export function mount(root, context, sdk) { root.dataset.cmsRuntime = String(sdk.runtimeApiVersion); return root; }\nexport function update() {}\nexport function dispose() {}\n";
        "component.css": ":host { display: block; }\n";
    };
}, {
    manifest: {
        formatVersion: 2;
        runtimeKind: "web-component";
        runtimeApiVersion: 1;
        platformWrapperVersion: "vela-touchpoint-wrapper-v1";
        sdkVersion: "vela-touchpoint-sdk-v1";
        contentLine: "fixture-component";
        placements: [{
            key: "opend.home.campaign-modal";
            entry: "component.js";
            resources: ["component.css"];
            locales: ["en-US"];
            requiredCapabilities: [];
            staticActions: [];
        }];
        resources: ["component.js", "component.css"];
        images: [];
    };
    files: {
        "component.js": "export function mount(root, context, sdk) { root.dataset.cmsRuntime = String(sdk.runtimeApiVersion); return root; }\nexport function update() {}\nexport function dispose() {}\n";
        "component.css": ":host { display: block; }\n";
    };
}>;
export type TouchpointComponentV2Fixture = z.infer<typeof TouchpointComponentV2FixtureSchema>;
export declare const touchpointComponentV2Fixture: TouchpointComponentV2Fixture;
/** Hash of JSON.stringify(touchpointComponentV2Fixture), checked in tests. */
export declare const TOUCHPOINT_COMPONENT_V2_FIXTURE_SHA256: "sha256:b29be1c55baa58b11375d3289b97b44d8d694755d8b400be8e67241b4449bf40";
export declare function parseTouchpointComponentV2Fixture(input: unknown): TouchpointComponentV2Fixture;
/** Runtime primitives for the sole v2 Web Component contract. */
export type TouchpointDiagnostic = Readonly<{
    code: string;
    detail?: string;
}>;
export type TouchpointSdk = Readonly<{
    runtimeApiVersion: typeof TOUCHPOINT_COMPONENT_V2_RUNTIME_API_VERSION;
    signal: AbortSignal;
    now: () => number;
    dispatchAction: (actionId: string) => Promise<void>;
    getResourceUrl: (resourceId: string) => string | undefined;
    requestClose: () => void;
    diagnose: (diagnostic: TouchpointDiagnostic) => void;
    onCleanup: (cleanup: () => void) => () => void;
}>;
export type TouchpointSdkHost = Readonly<{
    signal: AbortSignal;
    actionIds: ReadonlySet<string>;
    resources: ReadonlyMap<string, string>;
    now: () => number;
    dispatchAction?: (actionId: string) => Promise<void>;
    requestClose?: () => void;
    diagnose?: (diagnostic: TouchpointDiagnostic) => void;
}>;
export type RevocableTouchpointSdk = Readonly<{
    sdk: TouchpointSdk;
    revoke: () => void;
}>;
export declare function createTouchpointSdk(host: TouchpointSdkHost): RevocableTouchpointSdk;
export type TouchpointModuleCacheMetrics = Readonly<{
    count: number;
    limit: number;
    nativeEsmCount: number;
    refused: number;
    failed: number;
}>;
/** Bounded session cache; retaining failed digests prevents unbounded retry churn. */
export declare class TouchpointModuleCache<T = unknown> {
    private readonly limit;
    private readonly entries;
    private nativeEsmCount;
    private refused;
    constructor(limit: number);
    import(digest: string, load: () => Promise<T>): Promise<T>;
    metrics(): TouchpointModuleCacheMetrics;
}
/** Latest-wins update queue for the sole v2 component runtime. */
export type TouchpointComponentContext = Readonly<{
    instanceId: string;
    contentVersionId: string;
    placementKey: string;
    locale: string;
    theme: "light" | "dark";
    fontFamily: string;
    cssVariables: Readonly<Record<string, string>>;
    mode: "preview" | "test" | "production";
}>;
export type TouchpointComponentModule<Root = unknown, Context = TouchpointComponentContext> = Readonly<{
    mount?: (root: Root, context: Context, sdk: import("./touchpoint-component-v2.js").TouchpointSdk) => unknown;
    update?: (instance: unknown, context: Context, sdk: import("./touchpoint-component-v2.js").TouchpointSdk) => unknown;
    dispose?: (instance: unknown, sdk: import("./touchpoint-component-v2.js").TouchpointSdk) => unknown;
}>;
/** Serial latest-wins context queue; cancellation fences queued and late completion. */
export declare class TouchpointUpdateQueue<Context> {
    private readonly apply;
    private readonly diagnose?;
    private revision;
    private queued;
    private running;
    private cancelled;
    private failure;
    private hasFailure;
    constructor(apply: (context: Context) => Promise<void>, diagnose?: ((code: string) => void) | undefined);
    schedule(context: Context): Promise<void>;
    cancel(): void;
    private drain;
}
//# sourceMappingURL=touchpoint-component-v2.d.ts.map