import { type KeyLike } from "node:crypto";
export declare const STANDALONE_METADATA_SCHEMA: 4;
export declare const STANDALONE_SHELL_METADATA_SCHEMA: 1;
export declare const STANDALONE_CHANNEL_HEAD_SCHEMA: 1;
export declare const STANDALONE_SIGNATURE_ALGORITHM: "Ed25519";
export declare const EXACT_CHANNEL_PATTERN: RegExp;
export declare const SHA256_PATTERN: RegExp;
export type StandaloneScope = Readonly<{
    channel: string;
    namespace: string;
}>;
export type ArtifactReference = {
    sha256: string;
    size: number;
    url: string;
};
export type StandaloneBlobSource = Readonly<{
    kind: "remote";
    url: string;
}>;
export type StandaloneBlob = Readonly<{
    sha256: string;
    size: number;
    mediaType: string;
    sources: readonly StandaloneBlobSource[];
}>;
export type StandaloneMaterialization = Readonly<{
    type: "file";
    entrypoint: string;
}> | Readonly<{
    type: "zip";
    entrypoint: string;
    treeSha256: string;
}>;
export type StandaloneResource = Readonly<{
    id: string;
    component: "standalone.launcher" | "standalone.resource";
    blob: string;
    sync: true;
    materialization: StandaloneMaterialization;
}>;
export type StandaloneResourceContribution = Readonly<{
    id: string;
    component: "standalone.launcher" | "standalone.resource";
    sync: true;
    blob: StandaloneBlob;
    materialization: StandaloneMaterialization;
}>;
export type StandaloneShellCompatibilityIdentity = {
    type: string;
    version: string;
    buildHash: string;
};
export type StandaloneShellRequirement = {
    type: string;
    minVersion: string;
    buildHash: string;
};
export type StandaloneShellIdentity = StandaloneShellCompatibilityIdentity & {
    digest: string;
};
export type StandaloneMetadata = {
    schemaVersion: typeof STANDALONE_METADATA_SCHEMA;
    channel: string;
    releaseVersion: string;
    standaloneVersion: string;
    sourceCommit: string;
    publishedAt: string;
    blobs: Record<string, StandaloneBlob>;
    resources: StandaloneResource[];
    shellRequirements: StandaloneShellRequirement[];
};
export type StandaloneSignature = {
    algorithm: typeof STANDALONE_SIGNATURE_ALGORITHM;
    keyId: string;
    value: string;
};
export type SignedStandaloneMetadata = {
    metadata: StandaloneMetadata;
    signatures: StandaloneSignature[];
};
export type SignedDocument<T> = {
    document: T;
    signatures: StandaloneSignature[];
};
export type StandaloneLaneReference = ArtifactReference & {
    releaseVersion: string;
};
export type StandaloneShellDistribution = Readonly<{
    shell: Readonly<{
        type: string;
        version: string;
        buildHash: string;
    }>;
    target: string;
    artifact: ArtifactReference & Readonly<{
        mediaType: string;
    }>;
    updater?: Readonly<{
        protocol: "standalone-shell-updater-v3";
        handler: string;
        interaction: "restart-and-install";
    }>;
}>;
export type StandaloneShellMetadata = Readonly<{
    schemaVersion: typeof STANDALONE_SHELL_METADATA_SCHEMA;
    channel: string;
    releaseVersion: string;
    sourceCommit: string;
    publishedAt: string;
    distributions: readonly StandaloneShellDistribution[];
}>;
export type SignedStandaloneShellMetadata = Readonly<{
    document: StandaloneShellMetadata;
    signatures: readonly StandaloneSignature[];
}>;
export type StandaloneChannelHead = {
    schemaVersion: typeof STANDALONE_CHANNEL_HEAD_SCHEMA;
    channel: string;
    publishedAt: string;
    lanes: Record<string, StandaloneLaneReference>;
};
export type SignedStandaloneChannelHead = {
    head: StandaloneChannelHead;
    signatures: StandaloneSignature[];
};
export type StandaloneSigner = {
    keyId: string;
    privateKey: KeyLike;
};
export type StandaloneTrustedKeyRing = ReadonlyMap<string, KeyLike> | Readonly<Record<string, KeyLike>>;
export declare class StandaloneBootstrapError extends Error {
    readonly code: "installer-required" | "no-generation" | "runtime-unavailable" | "shell-update-required";
    constructor(code: "installer-required" | "no-generation" | "runtime-unavailable" | "shell-update-required", message: string);
}
export declare function canonicalJson(value: unknown): string;
export declare function sha256Hex(value: string | Uint8Array): string;
export declare function validateChannelRelease(channel: string, releaseVersion: string): void;
export declare function validateStandaloneScope(scope: StandaloneScope): StandaloneScope;
export declare function standaloneScopeKey(scope: StandaloneScope): string;
export declare function validateShellIdentity(identity: StandaloneShellIdentity): void;
export declare function compareVersions(left: string, right: string): number;
export declare function minimumShellVersion(metadata: StandaloneMetadata, shellType: string): string | null;
/**
 * Preserve the first compatible Shell floor while its declared build remains
 * identical. Missing or unreadable history fails conservatively to the current
 * Shell version.
 */
export declare function deriveMinimumShellVersion(input: Readonly<{
    buildHash: string;
    currentVersion: string;
    previous?: Readonly<{
        buildHash: string;
        minVersion: string;
    }> | null;
}>): string;
export declare function assertShellCompatibility(metadata: StandaloneMetadata, shell: StandaloneShellIdentity): void;
export declare function validateStandaloneMetadata(metadata: StandaloneMetadata): void;
/** Merge app/target contributions into the canonical channel blob graph. */
export declare function mergeStandaloneResourceContributions(contributions: readonly StandaloneResourceContribution[]): Readonly<{
    blobs: Record<string, StandaloneBlob>;
    resources: readonly StandaloneResource[];
}>;
export declare function validateStandaloneChannelHead(head: StandaloneChannelHead): void;
export declare function validateStandaloneShellMetadata(metadata: StandaloneShellMetadata): void;
export declare function signStandaloneMetadata(metadata: StandaloneMetadata, signers: readonly StandaloneSigner[]): SignedStandaloneMetadata;
export declare function signStandaloneMetadata(metadata: StandaloneMetadata, keyId: string, privateKey: KeyLike): SignedStandaloneMetadata;
export declare function verifyStandaloneMetadata(envelope: SignedStandaloneMetadata, ring: StandaloneTrustedKeyRing): string;
export declare function signDocument<T>(document: T, signers: readonly StandaloneSigner[]): SignedDocument<T>;
export declare function verifyDocument<T>(envelope: SignedDocument<T>, ring: StandaloneTrustedKeyRing): string;
export declare function signStandaloneChannelHead(head: StandaloneChannelHead, signers: readonly StandaloneSigner[]): SignedStandaloneChannelHead;
export declare function signStandaloneShellMetadata(metadata: StandaloneShellMetadata, signers: readonly StandaloneSigner[]): SignedStandaloneShellMetadata;
export declare function verifyStandaloneShellMetadata(envelope: SignedStandaloneShellMetadata, ring: StandaloneTrustedKeyRing): string;
export declare function verifyStandaloneChannelHead(envelope: SignedStandaloneChannelHead, ring: StandaloneTrustedKeyRing): string;
//# sourceMappingURL=protocol.d.ts.map