/**
 * Attribution for stable-prefix drift.
 *
 * A resumed agent session holds the stable instruction prefix (daemon prompt +
 * tool contract + client system prompt). When any byte of it changes between
 * turns we must re-send the whole block, which also invalidates the upstream
 * prompt cache for everything downstream of it — including the conversation
 * history. `stable_prompt_cache_miss_reason='stable-prompt-changed'` records
 * THAT this happened; this module records WHICH named input caused it.
 *
 * Attribution is computed over the composer's INPUTS rather than by slicing the
 * composed prompt on its `---` separators. The question a drift event has to
 * answer is "what caused the prefix to move", and the cause is always an input;
 * splitting the output would report which bytes differ but still leave the
 * mapping back to a cause to a human diffing Langfuse traces by hand — which is
 * the manual step this exists to remove.
 *
 * INVARIANT: the sha256 over the whole composed block (`stablePromptHash`) is
 * the only source of truth for cache hit/miss. Section hashes are attribution
 * metadata and must never gate a re-send decision — a section-map bug must be
 * able to mislabel a drift event but never to suppress or fabricate one.
 */
/**
 * Every named input that feeds the stable prefix, grouped into the section it
 * is attributed to. Keys are `composeSystemPrompt` argument names plus the two
 * inputs the caller merges in (`runtimeToolPrompt`, `clientSystemPrompt`).
 *
 * Adding an input to the stable prefix without adding it here does not corrupt
 * the drift signal: the overall hash still moves and the turn is reported as
 * `unattributed`, which is the alarm that this table has fallen behind.
 */
declare const SECTION_INPUTS: {
    readonly memory: readonly ["memoryBody", "memoryHooks"];
    readonly intent: readonly ["metadata", "template", "freeformDeckSignal", "mediaHintSignal", "platformHintSignal"];
    readonly mode: readonly ["sessionMode", "executionProfile", "streamFormat"];
    readonly 'design-system': readonly ["designSystemBody", "designSystemTitle", "designSystemUsageMd", "designSystemTokensCss", "designSystemComponentsManifest", "designSystemFixtureHtml", "designSystemPullIndex", "designSystemImportMode"];
    readonly skill: readonly ["skillBody", "skillName", "skillMode", "skillModes"];
    readonly craft: readonly ["craftBody", "craftSections"];
    readonly plugin: readonly ["pluginBlock", "activeStageBlocks"];
    readonly strategy: readonly ["odNextStrategyRecipe"];
    readonly instructions: readonly ["userInstructions", "projectInstructions"];
    readonly locale: readonly ["locale"];
    readonly media: readonly ["mediaExecution", "byokMediaDefaults", "audioVoiceOptions", "audioVoiceOptionsError"];
    readonly critique: readonly ["critique", "critiqueBrand", "critiqueSkill"];
    readonly mcp: readonly ["connectedExternalMcp"];
    readonly runtime: readonly ["agentId", "planToolNote", "promptCoreVariant", "runtimeToolPrompt"];
    readonly 'client-system': readonly ["clientSystemPrompt"];
};
export type StableSectionName = keyof typeof SECTION_INPUTS;
export declare const STABLE_SECTION_NAMES: StableSectionName[];
/** Section name -> short digest of that section's inputs for one turn. */
export type StableSectionHashes = Readonly<Partial<Record<StableSectionName, string>>>;
/**
 * `unattributed` means the composed prefix changed but no tracked section did:
 * the input that moved is missing from SECTION_INPUTS. It is a coverage gap
 * report, not a drift cause.
 */
export type StableChangedSection = StableSectionName | 'unattributed';
/**
 * Hash each section of the stable prefix from the composer inputs.
 *
 * A section whose inputs are all absent is omitted rather than hashed as empty,
 * so a section appearing or disappearing between turns (memory extracted for
 * the first time, a design system detached) reads as a change.
 */
export declare function computeStableSectionHashes(inputs: Readonly<Record<string, unknown>>): StableSectionHashes;
/**
 * Sections whose hash differs between the seeding turn and this turn, in
 * declaration order.
 *
 * Returns an empty list when nothing tracked moved. Callers that already know
 * the overall prefix changed should read that emptiness as `unattributed`
 * rather than as "no drift" — see `describeChangedStableSections`.
 */
export declare function diffStableSections(storedSections: StableSectionHashes | null | undefined, currentSections: StableSectionHashes): StableSectionName[];
/**
 * The changed-section list to report for a turn already known to have drifted.
 *
 * Never returns an empty list: a drift we cannot attribute is reported as
 * `unattributed` so the coverage gap shows up in telemetry instead of looking
 * like a clean turn.
 */
export declare function describeChangedStableSections(storedSections: StableSectionHashes | null | undefined, currentSections: StableSectionHashes): StableChangedSection[];
/** Serialize for the `agent_sessions.stable_prompt_sections` column. */
export declare function serializeStableSections(sections: StableSectionHashes): string;
/**
 * Parse a stored section map. Unknown or malformed entries are dropped rather
 * than thrown on: a row written by a newer/older daemon must degrade to
 * `unattributed`, never break the turn.
 */
export declare function parseStableSections(raw: unknown): StableSectionHashes | null;
export {};
