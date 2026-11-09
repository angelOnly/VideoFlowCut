type EnvMap = NodeJS.ProcessEnv | Record<string, string | undefined>;
/** The explicit local override: `unset` defers to the origin AMR reports,
 * `invalid` is a present-but-unusable setting and never falls through. */
export type ShareViewerOriginOverride = {
    status: 'unset';
} | {
    status: 'invalid';
} | {
    status: 'origin';
    origin: string;
};
/**
 * Resolve the explicit `OD_SHARE_VIEWER_URL(S)` override for the current AMR
 * profile. Profile-map structure and keys are validated as a whole, but only
 * the selected profile's value is validated. A present invalid selected value
 * is authoritative and cannot fall through to the single-origin setting or to
 * the origin AMR reports: a misconfigured override must be visible, not
 * silently replaced by another host.
 */
export declare function resolveShareViewerOriginOverride(env?: EnvMap, configuredEnv?: EnvMap): ShareViewerOriginOverride;
/** Normalize a candidate Viewer origin with the same root-only HTTPS rules as
 * the override (used to verify an address AMR reported). */
export declare function normalizeShareViewerOrigin(value: unknown): string | undefined;
/** Root-only HTTPS origin of the explicit override, if one is set and valid. */
export declare function resolveEffectiveShareViewerOrigin(env?: EnvMap, configuredEnv?: EnvMap): string | undefined;
export {};
