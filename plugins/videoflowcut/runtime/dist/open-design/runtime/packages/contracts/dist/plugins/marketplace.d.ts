import { z } from 'zod';
declare const MarketplacePluginVersionSchema: z.ZodObject<{
    version: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    version: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    version: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type MarketplacePluginVersion = z.infer<typeof MarketplacePluginVersionSchema>;
export declare const MarketplacePluginEntrySchema: z.ZodObject<{
    name: z.ZodString;
    source: z.ZodString;
    version: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    publisher: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    icon: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    source: z.ZodString;
    version: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    publisher: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    icon: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    source: z.ZodString;
    version: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
    publisher: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    title: z.ZodOptional<z.ZodString>;
    title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    description: z.ZodOptional<z.ZodString>;
    description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
    icon: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type MarketplacePluginEntry = z.infer<typeof MarketplacePluginEntrySchema>;
export declare const MarketplaceManifestSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    version: z.ZodString;
    owner: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    metadata: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    plugins: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    version: z.ZodString;
    owner: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    metadata: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    plugins: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    $schema: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    version: z.ZodString;
    owner: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    metadata: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    plugins: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        source: z.ZodString;
        version: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodString>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodString>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
            deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
            yanked: z.ZodOptional<z.ZodBoolean>;
            yankedAt: z.ZodOptional<z.ZodString>;
            yankReason: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        distTags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        title: z.ZodOptional<z.ZodString>;
        title_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        description: z.ZodOptional<z.ZodString>;
        description_i18n: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export type MarketplaceManifest = z.infer<typeof MarketplaceManifestSchema>;
export declare const TrustTierSchema: z.ZodEnum<["bundled", "trusted", "restricted"]>;
export type TrustTier = z.infer<typeof TrustTierSchema>;
export declare const MarketplaceTrustSchema: z.ZodEnum<["official", "trusted", "restricted"]>;
export type MarketplaceTrust = z.infer<typeof MarketplaceTrustSchema>;
export {};
//# sourceMappingURL=marketplace.d.ts.map