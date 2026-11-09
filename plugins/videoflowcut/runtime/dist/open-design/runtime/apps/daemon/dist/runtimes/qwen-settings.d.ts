import type { RuntimeEnv, RuntimeModelOption } from './types.js';
export declare function resolveQwenSettingsFile(env: RuntimeEnv): string | null;
/**
 * Collect model ids from a parsed `settings.json`.
 *
 * Two sources, in priority order:
 * - `modelProviders.<provider>[].id` — every provider entry the user
 *   configured. The shape is `{ openai: [{ id, name, baseUrl, … }], … }`;
 *   provider keys are not enumerated against an allowlist so a Qwen release
 *   that adds one keeps working.
 * - `model` — the currently selected model, which may be a bare string or a
 *   `{ name }`/`{ id }` record depending on Qwen version.
 *
 * Ids are sanitized and de-duplicated; anything unparseable is skipped rather
 * than failing the whole read.
 */
export declare function parseQwenSettingsModelIds(raw: unknown): string[];
export declare function mergeQwenSettingsModels(settingsIds: readonly string[], fallbackModels: readonly RuntimeModelOption[]): RuntimeModelOption[];
export declare function loadQwenSettingsModels(env: RuntimeEnv, fallbackModels: readonly RuntimeModelOption[]): Promise<RuntimeModelOption[] | null>;
