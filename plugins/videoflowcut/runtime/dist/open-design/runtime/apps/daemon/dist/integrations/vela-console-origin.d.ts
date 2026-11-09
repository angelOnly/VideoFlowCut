type EnvMap = NodeJS.ProcessEnv | Record<string, string | undefined>;
export declare const DEFAULT_VELA_CONSOLE_ORIGIN = "https://open-design.ai/cloud";
/**
 * Resolve the console origin for the AMR profile selected in app settings.
 *
 * `OD_VELA_WEB_URL` describes only the profile baked into the package. It is
 * safe as a compatibility fallback while that same profile remains selected,
 * but must never leak across a runtime profile switch. New packages also carry
 * `OD_VELA_WEB_URLS`, a build-time-injected profile map that makes switching
 * links deterministic without checking internal deployment names into source.
 */
export declare function resolveEffectiveVelaConsoleOrigin(env?: EnvMap, configuredEnv?: EnvMap): string | undefined;
export {};
