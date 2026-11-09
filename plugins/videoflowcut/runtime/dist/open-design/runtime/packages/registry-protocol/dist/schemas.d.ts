import { z } from 'zod';
export declare const RegistryBackendKindSchema: z.ZodEnum<["github", "http", "local", "db"]>;
export type RegistryBackendKind = z.infer<typeof RegistryBackendKindSchema>;
export declare const RegistryTrustSchema: z.ZodEnum<["official", "trusted", "restricted"]>;
export type RegistryTrust = z.infer<typeof RegistryTrustSchema>;
export declare const RegistryDistSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
    archive: z.ZodOptional<z.ZodString>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
    archive: z.ZodOptional<z.ZodString>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
    archive: z.ZodOptional<z.ZodString>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type RegistryDist = z.infer<typeof RegistryDistSchema>;
export declare const RegistryPublisherSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
export type RegistryPublisher = z.infer<typeof RegistryPublisherSchema>;
export declare const RegistryMetricsSchema: z.ZodObject<{
    downloads: z.ZodOptional<z.ZodNumber>;
    installs: z.ZodOptional<z.ZodNumber>;
    stars: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodString>;
    lastPublishedAt: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    downloads: z.ZodOptional<z.ZodNumber>;
    installs: z.ZodOptional<z.ZodNumber>;
    stars: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodString>;
    lastPublishedAt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    downloads: z.ZodOptional<z.ZodNumber>;
    installs: z.ZodOptional<z.ZodNumber>;
    stars: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodString>;
    lastPublishedAt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type RegistryMetrics = z.infer<typeof RegistryMetricsSchema>;
export declare const RegistrySignatureSchema: z.ZodObject<{
    kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
    issuer: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    signature: z.ZodString;
    certificate: z.ZodOptional<z.ZodString>;
    signedAt: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
    issuer: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    signature: z.ZodString;
    certificate: z.ZodOptional<z.ZodString>;
    signedAt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
    issuer: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    signature: z.ZodString;
    certificate: z.ZodOptional<z.ZodString>;
    signedAt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type RegistrySignature = z.infer<typeof RegistrySignatureSchema>;
export declare const RegistryVersionSchema: z.ZodObject<{
    version: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    ref: z.ZodOptional<z.ZodString>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
export type RegistryVersion = z.infer<typeof RegistryVersionSchema>;
export declare const RegistryEntrySchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    source: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    version: z.ZodString;
    source: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    version: z.ZodString;
    source: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dist: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
        archive: z.ZodOptional<z.ZodString>;
        integrity: z.ZodOptional<z.ZodString>;
        manifestDigest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    homepage: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    yanked: z.ZodOptional<z.ZodBoolean>;
    yankedAt: z.ZodOptional<z.ZodString>;
    yankReason: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        downloads: z.ZodOptional<z.ZodNumber>;
        installs: z.ZodOptional<z.ZodNumber>;
        stars: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastPublishedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
        issuer: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        certificate: z.ZodOptional<z.ZodString>;
        signedAt: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export declare const RegistryListFilterSchema: z.ZodOptional<z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    publisher: z.ZodOptional<z.ZodString>;
    includeYanked: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query?: string | undefined;
    tags?: string[] | undefined;
    publisher?: string | undefined;
    includeYanked?: boolean | undefined;
}, {
    query?: string | undefined;
    tags?: string[] | undefined;
    publisher?: string | undefined;
    includeYanked?: boolean | undefined;
}>>;
export type RegistryListFilter = z.infer<typeof RegistryListFilterSchema>;
export declare const RegistrySearchQuerySchema: z.ZodObject<{
    query: z.ZodDefault<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    limit: z.ZodOptional<z.ZodNumber>;
    includeYanked: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    tags?: string[] | undefined;
    limit?: number | undefined;
    includeYanked?: boolean | undefined;
}, {
    query?: string | undefined;
    tags?: string[] | undefined;
    limit?: number | undefined;
    includeYanked?: boolean | undefined;
}>;
export type RegistrySearchQuery = z.infer<typeof RegistrySearchQuerySchema>;
export declare const RegistrySearchResultSchema: z.ZodObject<{
    entry: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>;
    score: z.ZodNumber;
    matched: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    score: number;
    matched: string[];
}, {
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    score: number;
    matched: string[];
}>;
export type RegistrySearchResult = z.infer<typeof RegistrySearchResultSchema>;
export declare const ResolvedRegistryEntrySchema: z.ZodObject<{
    backendId: z.ZodString;
    backendKind: z.ZodEnum<["github", "http", "local", "db"]>;
    trust: z.ZodEnum<["official", "trusted", "restricted"]>;
    entry: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>;
    version: z.ZodObject<{
        version: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        ref: z.ZodOptional<z.ZodString>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
    source: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    integrity: z.ZodOptional<z.ZodString>;
    manifestDigest: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    backendId: string;
    backendKind: "db" | "github" | "http" | "local";
    trust: "official" | "restricted" | "trusted";
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    version: {
        version: string;
        source?: string | undefined;
        ref?: string | undefined;
        dist?: z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
    } & {
        [k: string]: unknown;
    };
    source: string;
    ref?: string | undefined;
    integrity?: string | undefined;
    manifestDigest?: string | undefined;
}, {
    backendId: string;
    backendKind: "db" | "github" | "http" | "local";
    trust: "official" | "restricted" | "trusted";
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    version: {
        version: string;
        source?: string | undefined;
        ref?: string | undefined;
        dist?: z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
    } & {
        [k: string]: unknown;
    };
    source: string;
    ref?: string | undefined;
    integrity?: string | undefined;
    manifestDigest?: string | undefined;
}>;
export type ResolvedRegistryEntry = z.infer<typeof ResolvedRegistryEntrySchema>;
export declare const RegistryPublishRequestSchema: z.ZodObject<{
    entry: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        version: z.ZodString;
        source: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        capabilitiesSummary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dist: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        versions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        homepage: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        deprecated: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
        yanked: z.ZodOptional<z.ZodBoolean>;
        yankedAt: z.ZodOptional<z.ZodString>;
        yankReason: z.ZodOptional<z.ZodString>;
        metrics: z.ZodOptional<z.ZodObject<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        signatures: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>;
    packagePath: z.ZodOptional<z.ZodString>;
    dryRun: z.ZodOptional<z.ZodBoolean>;
    tag: z.ZodOptional<z.ZodString>;
    changelog: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectOutputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectOutputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectOutputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectOutputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    packagePath?: string | undefined;
    dryRun?: boolean | undefined;
    tag?: string | undefined;
    changelog?: string | undefined;
}, {
    entry: {
        name: string;
        version: string;
        source: string;
        ref?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        capabilitiesSummary?: string[] | undefined;
        dist?: z.objectInputType<{
            type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
            archive: z.ZodOptional<z.ZodString>;
            integrity: z.ZodOptional<z.ZodString>;
            manifestDigest: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        versions?: z.objectInputType<{
            version: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
            ref: z.ZodOptional<z.ZodString>;
            dist: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
                archive: z.ZodOptional<z.ZodString>;
                integrity: z.ZodOptional<z.ZodString>;
                manifestDigest: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodOptional<z.ZodEnum<["github-release", "https-archive", "local-archive", "database"]>>;
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
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        distTags?: Record<string, string> | undefined;
        integrity?: string | undefined;
        manifestDigest?: string | undefined;
        publisher?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        homepage?: string | undefined;
        license?: string | undefined;
        deprecated?: string | boolean | undefined;
        yanked?: boolean | undefined;
        yankedAt?: string | undefined;
        yankReason?: string | undefined;
        metrics?: z.objectInputType<{
            downloads: z.ZodOptional<z.ZodNumber>;
            installs: z.ZodOptional<z.ZodNumber>;
            stars: z.ZodOptional<z.ZodNumber>;
            updatedAt: z.ZodOptional<z.ZodString>;
            lastPublishedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        signatures?: z.objectInputType<{
            kind: z.ZodEnum<["github-oidc", "cosign", "minisign", "custom"]>;
            issuer: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            signature: z.ZodString;
            certificate: z.ZodOptional<z.ZodString>;
            signedAt: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    packagePath?: string | undefined;
    dryRun?: boolean | undefined;
    tag?: string | undefined;
    changelog?: string | undefined;
}>;
export type RegistryPublishRequest = z.infer<typeof RegistryPublishRequestSchema>;
export declare const RegistryPublishOutcomeSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    dryRun: z.ZodOptional<z.ZodBoolean>;
    pullRequestUrl: z.ZodOptional<z.ZodString>;
    changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    dryRun?: boolean | undefined;
    pullRequestUrl?: string | undefined;
    changedFiles: string[];
    warnings: string[];
}, {
    ok: boolean;
    dryRun?: boolean | undefined;
    pullRequestUrl?: string | undefined;
    changedFiles?: string[] | undefined;
    warnings?: string[] | undefined;
}>;
export type RegistryPublishOutcome = z.infer<typeof RegistryPublishOutcomeSchema>;
export declare const RegistryDoctorIssueSchema: z.ZodObject<{
    severity: z.ZodEnum<["error", "warning", "info"]>;
    code: z.ZodString;
    message: z.ZodString;
    pluginName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    severity: "error" | "info" | "warning";
    code: string;
    message: string;
    pluginName?: string | undefined;
}, {
    severity: "error" | "info" | "warning";
    code: string;
    message: string;
    pluginName?: string | undefined;
}>;
export type RegistryDoctorIssue = z.infer<typeof RegistryDoctorIssueSchema>;
export declare const RegistryDoctorReportSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    backendId: z.ZodString;
    checkedAt: z.ZodNumber;
    entriesChecked: z.ZodNumber;
    issues: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<["error", "warning", "info"]>;
        code: z.ZodString;
        message: z.ZodString;
        pluginName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        severity: "error" | "info" | "warning";
        code: string;
        message: string;
        pluginName?: string | undefined;
    }, {
        severity: "error" | "info" | "warning";
        code: string;
        message: string;
        pluginName?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    backendId: string;
    checkedAt: number;
    entriesChecked: number;
    issues: {
        severity: "error" | "info" | "warning";
        code: string;
        message: string;
        pluginName?: string | undefined;
    }[];
}, {
    ok: boolean;
    backendId: string;
    checkedAt: number;
    entriesChecked: number;
    issues: {
        severity: "error" | "info" | "warning";
        code: string;
        message: string;
        pluginName?: string | undefined;
    }[];
}>;
export type RegistryDoctorReport = z.infer<typeof RegistryDoctorReportSchema>;
export declare const RegistryYankOutcomeSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    name: z.ZodString;
    version: z.ZodString;
    reason: z.ZodString;
    pullRequestUrl: z.ZodOptional<z.ZodString>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    name: string;
    version: string;
    reason: string;
    pullRequestUrl?: string | undefined;
    warnings: string[];
}, {
    ok: boolean;
    name: string;
    version: string;
    reason: string;
    pullRequestUrl?: string | undefined;
    warnings?: string[] | undefined;
}>;
export type RegistryYankOutcome = z.infer<typeof RegistryYankOutcomeSchema>;
//# sourceMappingURL=schemas.d.ts.map