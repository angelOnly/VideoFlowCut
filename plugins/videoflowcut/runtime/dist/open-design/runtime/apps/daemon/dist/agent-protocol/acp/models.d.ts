import type { JsonObject } from './types.js';
/** A single model entry exposed to the daemon's model-selection UI and to `session/set_model` calls. */
export interface ModelOption {
    id: string;
    label: string;
}
/** Parsed model-selection config option extracted from an ACP `session/new` result's `configOptions` array. */
export interface AcpModelConfigOption {
    configId: string;
    currentValue: string | null;
    values: unknown[];
}
/** Options accepted by `detectAcpModels` to control how the probe subprocess is launched and identified. */
export interface DetectAcpModelsOptions {
    bin: string;
    args: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
    clientName?: string;
    clientVersion?: string;
    defaultModelOption?: ModelOption;
}
/**
 * Normalises a raw config-option field value to a lowercase, whitespace- and
 * punctuation-stripped token for fuzzy matching against `MODEL_CONFIG_OPTION_IDS`.
 *
 * @param value - A raw field value from an ACP config option object.
 * @returns A normalised token string, or `''` when `value` is not a string.
 */
export declare function normalizeConfigOptionToken(value: unknown): string;
/**
 * Returns `true` when the given `option` object from `configOptions` represents
 * a model-selection config option, using a cascade of category, id, and name
 * normalisation checks against `MODEL_CONFIG_OPTION_IDS`.
 *
 * @param option - A single item from the `configOptions` array.
 * @param configId - The trimmed `id` field of that item.
 */
export declare function isModelConfigOption(option: JsonObject, configId: string): boolean;
/**
 * Scans the `configOptions` array from an ACP `session/new` result and returns
 * the first entry that passes `isModelConfigOption`. Returns `null` when no
 * model config option is found, so callers can fall back to the `models` field.
 *
 * @param configOptions - The raw `result.configOptions` value from a session response.
 * @returns A parsed `AcpModelConfigOption` or `null` when absent.
 */
export declare function findModelConfigOption(configOptions: unknown): AcpModelConfigOption | null;
/**
 * Extracts and normalises the available models list from an ACP
 * `configOptions` array (preferred) into a `ModelOption[]`. Prepends
 * `defaultModelOption` and deduplicates by id. Returns `null` when no model
 * config option is found in `configOptions`.
 *
 * @param configOptions - The raw `result.configOptions` from a session response.
 * @param defaultModelOption - The fallback option to prepend to the list.
 * @returns `{ currentModelId, models }` or `null` when no config option is found.
 */
export declare function normalizeModelConfigOptions(configOptions: unknown, defaultModelOption: ModelOption): {
    currentModelId: string | null;
    models: ModelOption[];
} | null;
/**
 * Produces the final ordered `ModelOption[]` for a session, merging the
 * `configOptions` path (preferred when it yields more than one option) with
 * the legacy `models.availableModels` path. Always includes `defaultModelOption`
 * at position zero and deduplicates by id.
 *
 * @param models - The raw `result.models` value from a `session/new` response.
 * @param defaultModelOption - The fallback option to prepend.
 * @param configOptions - Optional `result.configOptions` for the config-option path.
 * @returns A deduplicated array of `ModelOption` items.
 */
export declare function normalizeModels(models: unknown, defaultModelOption: ModelOption, configOptions?: unknown): ModelOption[];
/**
 * Returns `true` for JSON-RPC error codes that indicate a model-selection
 * failure from which the session can recover by falling back to the default
 * model and sending the prompt anyway.
 *
 * @param code - The `error.code` value from a JSON-RPC error response.
 */
export declare function modelSelectionErrorIsRecoverable(code: unknown): boolean;
/**
 * Reads the currently active model id from a `session/new` (or
 * `session/set_model`) result object, checking `configOptions` first and
 * falling back to `models.currentModelId`. Returns `null` when neither is set.
 *
 * @param result - The parsed `result` object from a session handshake response.
 */
export declare function currentModelFromSessionResult(result: JsonObject): string | null;
/**
 * Probes a running ACP binary by spawning it, performing the
 * `initialize` → `session/new` handshake, and reading the model list from the
 * session result. The child is killed with `SIGTERM` once the list is
 * extracted or the timeout expires.
 *
 * Used by runtime adapter definitions to populate the model-selection dropdown
 * without waiting for an actual prompt run.
 *
 * @param options.bin - Absolute path or `$PATH`-resolvable name of the ACP binary.
 * @param options.args - CLI arguments to pass to the binary.
 * @param options.cwd - Working directory for the probe subprocess.
 * @param options.env - Environment for the probe subprocess (default: `process.env`).
 * @param options.timeoutMs - Hard timeout for the probe; subject to `MAX_TIMEOUT_MS`.
 * @param options.clientName - Client name sent in the `initialize` handshake.
 * @param options.clientVersion - Client version sent in the `initialize` handshake.
 * @param options.defaultModelOption - Fallback option prepended to the result list.
 * @returns A promise resolving to the available `ModelOption[]`.
 */
export declare function detectAcpModels({ bin, args, cwd, env, timeoutMs, clientName, clientVersion, defaultModelOption, }: DetectAcpModelsOptions): Promise<ModelOption[]>;
