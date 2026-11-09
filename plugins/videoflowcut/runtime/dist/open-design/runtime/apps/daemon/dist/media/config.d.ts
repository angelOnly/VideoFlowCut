type ProviderEntry = {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
};
type ModelAliasMap = Record<string, string>;
/**
 * Resolve the directory media-config.json (and credentials living next to
 * it, like xai-tokens.json) actually live in. Precedence: explicit
 * media-config override > general data dir > default.
 */
export declare function mediaConfigDir(projectRoot: string): string;
/**
 * Resolve a registered model id to the wire-name the provider should
 * actually receive on the network. Env wins over stored, mirroring
 * the precedence the rest of media-config uses for `apiKey` (issue
 * #1277). Pass-through when no alias is configured.
 */
export declare function resolveModelAlias(projectRoot: string, modelId: string): Promise<string>;
/**
 * Read the merged alias map (env + stored). Exposed for the
 * `/api/media/config` GET endpoint so the Settings UI can display
 * which aliases are active and where they came from.
 */
export declare function readAliasMap(projectRoot: string): Promise<{
    effective: ModelAliasMap;
    env: ModelAliasMap;
    stored: ModelAliasMap;
}>;
/**
 * Resolve credentials for a provider. Env vars win, then stored config,
 * then provider-specific external credential stores. OpenAI only trusts
 * explicit API keys from Codex auth files; Codex/Hermes OAuth tokens are
 * not valid proof that the Images API can be called.
 * Returns { apiKey, baseUrl } where either may be empty string.
 */
export declare function resolveProviderConfig(projectRoot: string, providerId: string): Promise<ProviderEntry>;
/**
 * Read the full config for the GET endpoint. API keys are masked so the
 * frontend can show "••••" + a "configured" indicator without leaking
 * the secret back into the DOM.
 */
export interface MaskedConfigResponse {
    providers: Record<string, {
        configured: boolean;
        source: string;
        apiKeyTail: string;
        baseUrl: string;
        model?: string;
    }>;
    /**
     * Effective alias map plus source attribution. The Settings UI can
     * show "from env" vs "from media-config.json" badges next to each
     * entry without needing a second endpoint. Empty maps mean no
     * aliases are configured (issue #1277).
     */
    aliases: {
        effective: ModelAliasMap;
        env: ModelAliasMap;
        stored: ModelAliasMap;
    };
}
export declare function readMaskedConfig(projectRoot: string): Promise<MaskedConfigResponse>;
/**
 * Write the supplied {providerId: {apiKey, baseUrl}} map. Empty
 * apiKey deletes the entry. Unknown provider IDs are ignored. We
 * deliberately replace the whole map rather than merging so the
 * UI's "clear key" affordance just sends an empty string.
 *
 * Safety: if the incoming payload is empty but the on-disk config
 * currently has providers, we log a WARN to stderr. This catches
 * accidental wipes (e.g. a fresh-localStorage browser bootstrap
 * pushing `{providers: {}}` onto a daemon that had keys from a
 * previous session) without silently destroying the user's data.
 */
export declare function writeConfig(projectRoot: string, body: unknown): Promise<MaskedConfigResponse>;
/**
 * Idempotent "seed if empty" write for a single provider slot. The chat
 * proxy uses this to mirror a BYOK key into media-config so the agent's
 * image / TTS path picks up the same credential without the user having
 * to paste it twice. Strict rules:
 *   * No-op when an apiKey is ALREADY stored for `providerId` (the user
 *     may have configured Media independently and we never overwrite).
 *   * No-op when an env-var key resolves for `providerId` (env wins
 *     regardless of disk state — seeding would be invisible).
 *   * No-op when the incoming `apiKey` is empty (we only seed values
 *     the chat layer has just verified upstream).
 *   * Otherwise merge `{ [providerId]: entry }` into the existing
 *     provider map and persist. All other provider slots and aliases
 *     are preserved byte-for-byte.
 *
 * Returns `true` when a write happened (caller can log), `false` when
 * the call was a no-op. Errors are surfaced — the caller decides
 * whether to swallow them (fire-and-forget) or propagate.
 */
export declare function seedProviderIfMissing(projectRoot: string, providerId: string, entry: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}): Promise<boolean>;
export {};
