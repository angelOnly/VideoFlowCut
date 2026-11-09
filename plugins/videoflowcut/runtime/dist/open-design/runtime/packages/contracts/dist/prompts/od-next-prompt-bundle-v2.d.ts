export declare const OD_NEXT_PROMPT_BUNDLE_SCHEMA_V2: 'open-design.od-next-prompt-bundle/v2';
/**
 * The cache-stable head of the Bundle: `open_design_core_system_prompt`,
 * `session_skills`, and `active_stages`.
 *
 * Every byte here is identical across tasks that share a strategy version, task
 * type, and execution profile, so a provider's prompt cache can reuse the whole
 * prefix instead of diverging a few hundred tokens in. The PRD names these
 * blocks at the Bundle's top level rather than under a `system_prompt` wrapper,
 * so they are siblings of `task_metadata`, `context`, and `user_first_prompt`.
 *
 * `userSelectedSkills` is the one deliberate exception: the spec places
 * user-chosen Skills inside `session_skills`, so a task that selects Skills
 * partitions the cache separately from one that does not. It is the last child
 * of `session_skills` to keep that divergence as late as possible.
 */
export interface OdNextPromptBundleHeadV2 {
    coreSystemPrompt: {
        executionBoundary: string;
        nativeExecution: {
            profile: 'filesystem' | 'text_artifact';
            body: string;
        };
        discoveryAndPlanningSurface: string;
        coreStrategy: string;
        /** Output constraints belong to the core system prompt, per §3.7.1 block ①. */
        outputContract: string;
        echoGuard: string;
    };
    sessionSkills: {
        generalOrchestrationSkill: {
            skillName: string;
            body: string;
        };
        taskTypeSkill: {
            skillName: string;
            body: string;
        };
        userSelectedSkills?: {
            skillNames: ReadonlyArray<string>;
            body: string;
        } | undefined;
    };
    activeStages: ReadonlyArray<OdNextPromptBundleStageV2>;
}
/**
 * The initial OD Next payload as an element tree rather than four opaque text
 * blobs.
 *
 * Block order is load-bearing:
 *
 * 1. The head (`OdNextPromptBundleHeadV2`) comes first and is byte-identical
 *    across tasks of the same strategy version, task type, and execution
 *    profile. Every per-task or per-run value lives in `taskMetadata`,
 *    `context`, or `userFirstPrompt`, so the shared cache prefix runs through
 *    the end of `active_stages`.
 * 2. `userFirstPrompt` is the last content element, so the user's own words
 *    hold the recency position rather than transport metadata.
 */
export interface OdNextPromptBundleV2 extends OdNextPromptBundleHeadV2 {
    taskMetadata: {
        taskType: string;
        attachments?: string | undefined;
        taskConfiguration?: string | undefined;
        titleDirective?: string | undefined;
    };
    context: {
        recipeIdentity: OdNextPromptBundleRecipeIdentityV2;
        runtimeFacts?: string | undefined;
        runtimeToolEnvironment?: string | undefined;
        stableRequestContext?: string | undefined;
        frozenSkillPackage?: string | undefined;
        requestInputFacts?: string | undefined;
        researchCommandContract?: string | undefined;
        runContext?: string | undefined;
        connectedExternalMcp?: string | undefined;
        browserUnavailableGuard?: string | undefined;
        clientSystemPrompt?: string | undefined;
        formOverride?: string | undefined;
        priorTranscript?: string | undefined;
    };
    userFirstPrompt: string;
}
export interface OdNextPromptBundleStageV2 {
    name: string;
    atoms: ReadonlyArray<{
        name: string;
        body?: string | undefined;
    }>;
}
/**
 * Per-task strategy identity. It sits in `context`, not in the head, because
 * `appliedSnapshot` is unique per task and would otherwise cut the shared cache
 * prefix at the very front of the bundle.
 *
 * Only the fields the model actually consumes are carried here. The audit-only
 * strategy package hash, Task Skill digest, and stable prompt identity stay out
 * of the prompt; they remain available through `odNextPromptCacheIdentityV2`
 * and the persisted strategy task record.
 */
export interface OdNextPromptBundleRecipeIdentityV2 {
    recipe: string;
    strategyId: string;
    strategyVersion: string;
    appliedSnapshot: string;
    taskProfileVersion: string;
}
/** Serialize the initial bundle to its single canonical encoding. */
export declare function serializeOdNextPromptBundleV2(input: OdNextPromptBundleV2): string;
/**
 * Parse a stored bundle, then prove it is byte-identical to what this version
 * would emit. A payload that parses but would re-serialize differently is
 * rejected, so a drifting writer cannot quietly change persisted prompt bytes.
 */
export declare function parseOdNextPromptBundleV2(source: string): OdNextPromptBundleV2;
//# sourceMappingURL=od-next-prompt-bundle-v2.d.ts.map