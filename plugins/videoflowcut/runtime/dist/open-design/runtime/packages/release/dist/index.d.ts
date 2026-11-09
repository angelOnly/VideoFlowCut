export declare const EXACT_RELEASE_NAME_PATTERN: RegExp;
export declare const RESERVED_RELEASE_NAMES: readonly ["local"];
/** Counted lanes are prerelease or a data-defined exact release name. */
export type CountedReleaseChannel = string;
export type ReleaseChannel = CountedReleaseChannel | "stable";
export type ReleasePlatform = "mac" | "macIntel" | "win" | "linux";
export type ParsedReleaseVersion = {
    baseVersion: string;
    channel: CountedReleaseChannel;
    number: number;
    releaseVersion: string;
} | {
    baseVersion: string;
    channel: "stable";
    releaseVersion: string;
};
export type ReleaseBaseVersionTuple = readonly [number, number, number];
export type ReleaseChannelDescriptor = {
    appId: string;
    baseVersionField: "baseVersion";
    channel: ReleaseChannel;
    counterField: "releaseNumber" | null;
    displayLabel: string;
    githubReleaseEnabled: boolean;
    internal: boolean;
    productName: string;
    releaseVersionField: "releaseVersion";
    storagePrefix: ReleaseChannel;
};
export type ReleaseInstallIdentity = {
    appId: string;
    executableName: string;
    productName: string;
};
export declare const RELEASE_CHANNELS: Readonly<{
    readonly BETA: "beta";
    readonly PRERELEASE: "prerelease";
    readonly STABLE: "stable";
}>;
export declare const RELEASE_PLATFORM_NAMESPACE_SUFFIXES: Readonly<{
    readonly linux: "linux";
    readonly mac: "";
    readonly macIntel: "intel";
    readonly win: "win";
}>;
export declare function isReleaseChannel(value: unknown): value is ReleaseChannel;
export declare function releaseChannelDescriptor(channel: string): ReleaseChannelDescriptor;
export declare function releaseChannelFromVersion(version: string | null | undefined): ReleaseChannel | null;
export declare function releaseChannelFromNamespace(namespace: string, defaultNamespace?: string): ReleaseChannel | null;
export declare function isReleaseChannelNamespace(namespace: string, channel: ReleaseChannel): boolean;
export declare function releaseNamespace(channel: ReleaseChannel, platform?: ReleasePlatform): string;
export declare function releaseInstallIdentity(channel: ReleaseChannel): ReleaseInstallIdentity;
export declare function parseCountedReleaseVersion(value: string, channel: CountedReleaseChannel): {
    baseVersion: string;
    number: number;
    releaseVersion: string;
} | null;
export declare function parseStableReleaseVersion(value: string): {
    baseVersion: string;
    releaseVersion: string;
} | null;
export declare function parseReleaseBaseVersion(value: string): ReleaseBaseVersionTuple | null;
export declare function compareReleaseBaseVersions(left: ReleaseBaseVersionTuple, right: ReleaseBaseVersionTuple): number;
export declare function parseReleaseVersion(value: string, channel: ReleaseChannel): ParsedReleaseVersion;
export declare function formatReleaseVersion(channel: CountedReleaseChannel, baseVersion: string, number: number): string;
export declare function releaseMetadataVersionFields(channel: ReleaseChannel, releaseVersion: string): Record<string, unknown>;
//# sourceMappingURL=index.d.ts.map