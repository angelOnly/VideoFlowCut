import { z } from "zod";
/** 作者清单跨项目合同；OpenDesign 的副本由同步脚本生成。 */
export declare const AUTHORED_MOTION_MANIFEST_CONTRACT = "videoflowcut.authored-motion-manifest.v1";
export declare const MOTION_SOURCE_MAX_LENGTH = 2000000;
export declare const IMAGE_SLOT_ATTRIBUTE = "data-vfc-image-slot";
export declare const VIDEO_SLOT_ATTRIBUTE = "data-vfc-video-slot";
/** 作者字段与正式提交共享同一个维护源。 */
export declare const motionWorkFields: z.ZodObject<{
    compositing: z.ZodOptional<z.ZodEnum<["opaque", "alpha"]>>;
    name: z.ZodString;
    props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageBindings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    fps: z.ZodNumber;
    durationInFrames: z.ZodNumber;
    reference: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        observation: z.ZodObject<{
            layout: z.ZodString;
            motion: z.ZodString;
            rhythm: z.ZodString;
            adaptation: z.ZodString;
            evidence: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }>>;
    sourceDisplayScopeId: z.ZodOptional<z.ZodString>;
    creativeBrief: z.ZodOptional<z.ZodString>;
    videoBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        assetId: z.ZodString;
        sourceStartMs: z.ZodNumber;
        sourceEndMs: z.ZodNumber;
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
        decodeScale: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }>>>;
    fontBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props: Record<string, unknown>;
    imageBindings: Record<string, string>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    creativeBrief?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
}, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props?: Record<string, unknown> | undefined;
    imageBindings?: Record<string, string> | undefined;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    creativeBrief?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
}>;
type MotionWorkFields = z.infer<typeof motionWorkFields>;
export declare function validateMotionWorkFields(value: MotionWorkFields, ctx: z.RefinementCtx): void;
export declare const authoredMotionWorkFields: z.ZodObject<{
    compositing: z.ZodOptional<z.ZodEnum<["opaque", "alpha"]>>;
    name: z.ZodString;
    props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageBindings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    fps: z.ZodNumber;
    durationInFrames: z.ZodNumber;
    reference: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        observation: z.ZodObject<{
            layout: z.ZodString;
            motion: z.ZodString;
            rhythm: z.ZodString;
            adaptation: z.ZodString;
            evidence: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }>>;
    sourceDisplayScopeId: z.ZodOptional<z.ZodString>;
    videoBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        assetId: z.ZodString;
        sourceStartMs: z.ZodNumber;
        sourceEndMs: z.ZodNumber;
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
        decodeScale: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }>>>;
    fontBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
} & {
    creativeBrief: z.ZodString;
}, "strict", z.ZodTypeAny, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props: Record<string, unknown>;
    imageBindings: Record<string, string>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props?: Record<string, unknown> | undefined;
    imageBindings?: Record<string, string> | undefined;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}>;
export declare const authoredMotionWorkSchema: z.ZodEffects<z.ZodObject<{
    compositing: z.ZodOptional<z.ZodEnum<["opaque", "alpha"]>>;
    name: z.ZodString;
    props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageBindings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    fps: z.ZodNumber;
    durationInFrames: z.ZodNumber;
    reference: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        observation: z.ZodObject<{
            layout: z.ZodString;
            motion: z.ZodString;
            rhythm: z.ZodString;
            adaptation: z.ZodString;
            evidence: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }, {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }, {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    }>>;
    sourceDisplayScopeId: z.ZodOptional<z.ZodString>;
    videoBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        assetId: z.ZodString;
        sourceStartMs: z.ZodNumber;
        sourceEndMs: z.ZodNumber;
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
        decodeScale: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }>>>;
    fontBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
} & {
    creativeBrief: z.ZodString;
}, "strict", z.ZodTypeAny, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props: Record<string, unknown>;
    imageBindings: Record<string, string>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props?: Record<string, unknown> | undefined;
    imageBindings?: Record<string, string> | undefined;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}>, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props: Record<string, unknown>;
    imageBindings: Record<string, string>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}, {
    compositing?: "alpha" | "opaque" | undefined;
    name: string;
    props?: Record<string, unknown> | undefined;
    imageBindings?: Record<string, string> | undefined;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    reference?: {
        url: string;
        observation: {
            layout: string;
            motion: string;
            rhythm: string;
            adaptation: string;
            evidence: string;
        };
    } | undefined;
    sourceDisplayScopeId?: string | undefined;
    videoBindings?: Record<string, {
        assetId: string;
        sourceStartMs: number;
        sourceEndMs: number;
        startFrame: number;
        endFrame: number;
        decodeScale?: number | undefined;
    }> | undefined;
    fontBindings?: Record<string, string> | undefined;
    creativeBrief: string;
}>;
export declare class MotionSourceValidationError extends Error {
    readonly code: string;
    readonly location: {
        line: number;
        column: number;
    };
    readonly nodeKind: string;
    readonly token: string;
    readonly suggestion: string;
    constructor(code: string, message: string, location: {
        line: number;
        column: number;
    }, nodeKind: string, token: string, suggestion: string);
}
export declare class AuthoredMotionValidationError extends Error {
    readonly field: string;
    readonly code = "MOTION_MANIFEST_INVALID";
    constructor(field: string, message: string);
}
/** 发布与导入共用 HTML 根时钟、入口和素材槽检查。 */
export declare function validateAuthoredMotionSource(source: string, work?: Pick<MotionWorkFields, "width" | "height" | "fps" | "durationInFrames" | "imageBindings" | "videoBindings">): void;
export interface AuthoredMotionRange {
    startFrame: number;
    endFrame: number;
}
export interface AuthoredMotionManifest {
    authorSubmissionId: string;
    sourceFile: string;
    sourceSha256: string;
    work: z.infer<typeof authoredMotionWorkFields>;
    readyRanges: AuthoredMotionRange[];
    changedRanges: Array<AuthoredMotionRange & {
        reason: string;
    }>;
}
/** 字段描述与运行时校验共享同一 Schema；跨字段关系在运行时执行。 */
export declare const authoredMotionManifestFields: z.ZodObject<{
    authorSubmissionId: z.ZodString;
    sourceFile: z.ZodString;
    sourceSha256: z.ZodString;
    work: z.ZodObject<{
        compositing: z.ZodOptional<z.ZodEnum<["opaque", "alpha"]>>;
        name: z.ZodString;
        props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        imageBindings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        width: z.ZodNumber;
        height: z.ZodNumber;
        fps: z.ZodNumber;
        durationInFrames: z.ZodNumber;
        reference: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            observation: z.ZodObject<{
                layout: z.ZodString;
                motion: z.ZodString;
                rhythm: z.ZodString;
                adaptation: z.ZodString;
                evidence: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            }, {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            }>;
        }, "strict", z.ZodTypeAny, {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        }, {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        }>>;
        sourceDisplayScopeId: z.ZodOptional<z.ZodString>;
        videoBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            assetId: z.ZodString;
            sourceStartMs: z.ZodNumber;
            sourceEndMs: z.ZodNumber;
            startFrame: z.ZodNumber;
            endFrame: z.ZodNumber;
            decodeScale: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }>>>;
        fontBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    } & {
        creativeBrief: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props: Record<string, unknown>;
        imageBindings: Record<string, string>;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    }, {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props?: Record<string, unknown> | undefined;
        imageBindings?: Record<string, string> | undefined;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    }>;
    readyRanges: z.ZodArray<z.ZodObject<{
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        startFrame: number;
        endFrame: number;
    }, {
        startFrame: number;
        endFrame: number;
    }>, "many">;
    changedRanges: z.ZodArray<z.ZodObject<{
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
    } & {
        reason: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        startFrame: number;
        endFrame: number;
        reason: string;
    }, {
        startFrame: number;
        endFrame: number;
        reason: string;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    authorSubmissionId: string;
    sourceFile: string;
    sourceSha256: string;
    work: {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props: Record<string, unknown>;
        imageBindings: Record<string, string>;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    };
    readyRanges: {
        startFrame: number;
        endFrame: number;
    }[];
    changedRanges: {
        startFrame: number;
        endFrame: number;
        reason: string;
    }[];
}, {
    authorSubmissionId: string;
    sourceFile: string;
    sourceSha256: string;
    work: {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props?: Record<string, unknown> | undefined;
        imageBindings?: Record<string, string> | undefined;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    };
    readyRanges: {
        startFrame: number;
        endFrame: number;
    }[];
    changedRanges: {
        startFrame: number;
        endFrame: number;
        reason: string;
    }[];
}>;
export declare const authoredMotionInputFields: z.ZodObject<{
    authorSubmissionId: z.ZodOptional<z.ZodString>;
    changedRanges: z.ZodArray<z.ZodObject<{
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
    } & {
        reason: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        startFrame: number;
        endFrame: number;
        reason: string;
    }, {
        startFrame: number;
        endFrame: number;
        reason: string;
    }>, "many">;
    readyRanges: z.ZodArray<z.ZodObject<{
        startFrame: z.ZodNumber;
        endFrame: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        startFrame: number;
        endFrame: number;
    }, {
        startFrame: number;
        endFrame: number;
    }>, "many">;
    sourceFile: z.ZodOptional<z.ZodString>;
    sourceSha256: z.ZodOptional<z.ZodString>;
    work: z.ZodObject<{
        compositing: z.ZodOptional<z.ZodEnum<["opaque", "alpha"]>>;
        name: z.ZodString;
        props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        imageBindings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        width: z.ZodNumber;
        height: z.ZodNumber;
        fps: z.ZodNumber;
        durationInFrames: z.ZodNumber;
        reference: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            observation: z.ZodObject<{
                layout: z.ZodString;
                motion: z.ZodString;
                rhythm: z.ZodString;
                adaptation: z.ZodString;
                evidence: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            }, {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            }>;
        }, "strict", z.ZodTypeAny, {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        }, {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        }>>;
        sourceDisplayScopeId: z.ZodOptional<z.ZodString>;
        videoBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            assetId: z.ZodString;
            sourceStartMs: z.ZodNumber;
            sourceEndMs: z.ZodNumber;
            startFrame: z.ZodNumber;
            endFrame: z.ZodNumber;
            decodeScale: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }>>>;
        fontBindings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    } & {
        creativeBrief: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props: Record<string, unknown>;
        imageBindings: Record<string, string>;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    }, {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props?: Record<string, unknown> | undefined;
        imageBindings?: Record<string, string> | undefined;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    }>;
}, "strict", z.ZodTypeAny, {
    authorSubmissionId?: string | undefined;
    changedRanges: {
        startFrame: number;
        endFrame: number;
        reason: string;
    }[];
    readyRanges: {
        startFrame: number;
        endFrame: number;
    }[];
    sourceFile?: string | undefined;
    sourceSha256?: string | undefined;
    work: {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props: Record<string, unknown>;
        imageBindings: Record<string, string>;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    };
}, {
    authorSubmissionId?: string | undefined;
    changedRanges: {
        startFrame: number;
        endFrame: number;
        reason: string;
    }[];
    readyRanges: {
        startFrame: number;
        endFrame: number;
    }[];
    sourceFile?: string | undefined;
    sourceSha256?: string | undefined;
    work: {
        compositing?: "alpha" | "opaque" | undefined;
        name: string;
        props?: Record<string, unknown> | undefined;
        imageBindings?: Record<string, string> | undefined;
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        reference?: {
            url: string;
            observation: {
                layout: string;
                motion: string;
                rhythm: string;
                adaptation: string;
                evidence: string;
            };
        } | undefined;
        sourceDisplayScopeId?: string | undefined;
        videoBindings?: Record<string, {
            assetId: string;
            sourceStartMs: number;
            sourceEndMs: number;
            startFrame: number;
            endFrame: number;
            decodeScale?: number | undefined;
        }> | undefined;
        fontBindings?: Record<string, string> | undefined;
        creativeBrief: string;
    };
}>;
export declare function parseAuthoredMotionManifest(value: unknown): AuthoredMotionManifest;
export {};
