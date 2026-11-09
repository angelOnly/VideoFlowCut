/**
 * Resolve the path to the Codex CLI config file, respecting CODEX_HOME.
 *
 * Mirrors the resolution used by codex-pets.ts and the codex agentCliEnv
 * allowlist so all daemon code agrees on the config location.
 *
 * `~/` and `~\` prefixes in CODEX_HOME are expanded to the OS home directory,
 * matching the behaviour of `expandConfiguredEnv` in `runtimes/paths.ts` that
 * the Codex child process sees via `spawnEnvForAgent`. Without this expansion
 * a user-configured `CODEX_HOME=~/.codex-alt` would resolve to the literal
 * path `~/.codex-alt/config.toml` in the normalizer while the child process
 * expands it to `<homedir>/.codex-alt/config.toml`, causing the normalizer to
 * patch the wrong (non-existent) path and leave the real config untouched.
 */
export declare function resolveCodexConfigPath(env?: NodeJS.ProcessEnv): string;
/**
 * Resolve the `env_key` of the currently-selected Codex provider from a
 * config.toml string, or null when there is no custom provider / env_key.
 *
 * Codex custom providers name the environment variable holding their API key
 * via `env_key`, e.g.:
 *
 *   model_provider = "azure"
 *   [model_providers.azure]
 *   env_key = "AZURE_OPENAI_API_KEY"
 *
 * Consumed by the auth probe (`runtimes/auth.ts`) so a working custom-provider
 * Codex install isn't reported as unauthenticated just because
 * `codex login status` (a ChatGPT/OpenAI-login check) exits non-zero.
 *
 * Deliberately a narrow line scanner rather than a full TOML parse — matching
 * this module's regex-scoped handling of config.toml (the daemon ships no TOML
 * parser); it reads only the two fields it needs.
 */
export declare function extractCodexProviderEnvKey(toml: string): string | null;
/**
 * Read the selected Codex provider's `env_key` from the on-disk config.toml
 * (honoring CODEX_HOME). Returns null when the file is absent/unreadable or
 * declares no custom provider env_key.
 */
export declare function readCodexProviderEnvKey(env?: NodeJS.ProcessEnv): Promise<string | null>;
/**
 * Normalize the `service_tier` field in a config.toml string.
 *
 * Any standalone `service_tier` key line whose value is not in
 * {@link VALID_SERVICE_TIERS} has its entire line removed (so the Codex CLI
 * uses its built-in default tier). Valid values are left verbatim.
 *
 * Any nested `[features.*]` table is also removed because current Codex CLI
 * configs expect `[features]` entries to be booleans, not maps.
 *
 * Returns `null` when nothing needed to change, otherwise the patched content.
 */
export declare function normalizeCodexConfigContent(content: string): string | null;
/**
 * Injectable I/O layer for `normalizeCodexConfigFile`.
 * Production code uses the real `node:fs/promises` functions; tests inject
 * stubs to exercise failure paths without filesystem tricks.
 */
export interface CodexConfigIO {
    readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
    writeFile: (path: string, data: string, encoding: BufferEncoding) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    unlink: (path: string) => Promise<void>;
}
/**
 * Read `~/<codex-home>/config.toml`, normalize any stale `service_tier`
 * value, and write the result back only when a change was made.
 *
 * The write is performed atomically: the patched content is written to a
 * sibling temp file in the same directory (same filesystem, so the rename is
 * always atomic), then renamed over the original. This prevents partial writes
 * from corrupting the config if the process is interrupted mid-write.
 *
 * A missing or unreadable config.toml is silently ignored — Codex uses
 * built-in defaults in that case. Write/rename failures are logged with
 * `console.warn` so they appear in daemon logs without blocking the launch.
 *
 * @param env - Process environment, injectable for testing.
 * @param io  - I/O layer, injectable for testing (defaults to node:fs/promises).
 */
export declare function normalizeCodexConfigFile(env?: NodeJS.ProcessEnv, io?: CodexConfigIO): Promise<void>;
