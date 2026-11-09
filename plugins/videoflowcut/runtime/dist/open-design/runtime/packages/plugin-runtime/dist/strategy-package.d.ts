export interface StrategyPackageAssetInput {
    path: string;
    bytes: Uint8Array;
}
export interface StrategyPackageAssetDigest {
    path: string;
    sha256: string;
}
export interface StrategyPackageIdentity {
    packageHash: string;
    assetDigests: StrategyPackageAssetDigest[];
}
/**
 * Canonicalize a plugin-relative strategy asset path without consulting the
 * filesystem. The result always uses a `./` prefix and POSIX separators so
 * package identity is stable across hosts.
 */
export declare function normalizeStrategyAssetPath(input: string): string;
/**
 * Compute content digests from an explicit asset roster. This helper performs
 * no directory discovery or filesystem I/O; callers own which bytes enter the
 * strategy identity.
 */
export declare function buildStrategyPackageIdentity(input: {
    assets: readonly StrategyPackageAssetInput[];
}): StrategyPackageIdentity;
/** Recompute the package hash from the persisted digest roster. */
export declare function strategyPackageHashFromDigests(input: readonly StrategyPackageAssetDigest[]): string;
//# sourceMappingURL=strategy-package.d.ts.map