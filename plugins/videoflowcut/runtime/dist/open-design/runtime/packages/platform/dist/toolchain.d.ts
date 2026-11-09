export type WellKnownUserToolchainOptions = {
    home?: string;
    includeSystemBins?: boolean;
    env?: NodeJS.ProcessEnv;
};
/**
 * Assemble the ordered list of user-level toolchain bin directories to prepend
 * to PATH so a GUI-launched daemon can find CLIs installed under the user's own
 * toolchain even when it inherits a stripped PATH. Entries are search-path
 * candidates (existence is not required) except version-manager install roots,
 * which are probed and version-sorted.
 *
 * @param options - Optional `home`, `includeSystemBins`, and `env` overrides (all default to real values).
 * @returns The ordered list of candidate bin directories, most-specific first.
 */
export declare function wellKnownUserToolchainBins(options?: WellKnownUserToolchainOptions): string[];
//# sourceMappingURL=toolchain.d.ts.map