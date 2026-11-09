import { OD_NEXT_PROMPT_RECIPE_ID, OD_NEXT_STRATEGY_ID, type StrategyInputStageV2, type StrategyTaskTypeV2 } from '../plugins/strategy-v2.js';
import type { ChatSessionMode } from '../api/chat.js';
import { type DeckFrameworkMode } from './deck-framework.js';
import type { OdNextDeviceFrameContextV2 } from './od-next-device-frame.js';
import type { OdNextPromptBundleHeadV2, OdNextPromptBundleRecipeIdentityV2, OdNextPromptBundleStageV2 } from './od-next-prompt-bundle-v2.js';
export interface OdNextStrategyRequestRecipeV2 {
    recipe: typeof OD_NEXT_PROMPT_RECIPE_ID;
    strategyId: typeof OD_NEXT_STRATEGY_ID;
    strategyVersion: string;
    snapshotId: string;
    packageHash: string;
    taskProfileDigest: string;
    taskProfileVersion: string;
    taskType: Exclude<StrategyTaskTypeV2, 'generic'>;
    executionProfile: 'filesystem' | 'text_artifact';
    coreStrategy: string;
    generalOrchestration: string;
    taskSkill: string;
    activeStages: ReadonlyArray<OdNextPromptBundleStageV2>;
    /**
     * Non-prompt files declared by the selected task profile (see
     * `StrategyTaskProfileAssetDeclarationV2.resources`), already verified
     * against the applied package identity. Never part of the Bundle head; the
     * daemon stages them on disk and may quote one into the stable request
     * context as a fact.
     */
    taskResources?: ReadonlyArray<{
        path: string;
        text: string;
    }> | undefined;
}
/**
 * Stable request facts that are safe and relevant to OD Next planning/Build.
 * The generic prompt stack is intentionally not accepted here: it contains
 * legacy quality tails that the versioned strategy does not own.
 */
export interface OdNextStrategyStableRequestContextV2 {
    agentId?: string | null | undefined;
    sessionMode?: ChatSessionMode | undefined;
    locale?: string | undefined;
    /**
     * The name of the plan tool THIS runtime actually has, as one sentence the
     * host resolved — or null/absent when the host has no verified name for it.
     *
     * A fact about the selected Coding Agent, not a new rule: the planning
     * surface below already asks for a live Todo plan, and the charter it
     * mirrors sanctions "otherwise, provide a numbered plan in your response".
     * A model never told its tool's NAME reads the prose branch as the compliant
     * one — which is what a codex run did on 2026-09-03, answering an explicit
     * request to plan with a seven-item list in its reply body and no tool call.
     *
     * The host resolves the sentence (`planToolNoteForRuntime` in
     * `apps/daemon/src/prompts/system.ts`) so the runtime→tool-name table has
     * exactly one home. This layer only carries it: a runtime the host has no
     * verified name for passes nothing and pays nothing, and this file must
     * never grow its own copy of that table — a second source of truth for tool
     * names is precisely what the Claude Code 2.1 rename punished.
     */
    planToolNote?: string | null | undefined;
    /**
     * The host detected an explicit deck request in the user-authored
     * conversation even though the project is bound to another Task Profile.
     * This does not reclassify the task; it only exposes the canonical deck
     * runtime contract when the Build chooses to produce a deck.
     */
    deckIntent?: boolean | undefined;
    /**
     * Canonical is only safe for a blank/new deck. Selected legacy seeds and
     * existing deck HTML keep their own scaffold and rely on the host bridge.
     */
    deckFrameworkMode?: DeckFrameworkMode | undefined;
    metadata?: object | undefined;
    template?: {
        id?: string | undefined;
        name: string;
        sourceProjectId?: string | undefined;
        files: Array<{
            name: string;
            content: string;
        }>;
        description?: string | null | undefined;
        createdAt?: number | undefined;
    } | undefined;
    designSystemBody?: string | undefined;
    designSystemTitle?: string | undefined;
    designSystemUsageMd?: string | undefined;
    designSystemTokensCss?: string | undefined;
    designSystemComponentsManifest?: string | undefined;
    designSystemFixtureHtml?: string | undefined;
    designSystemPullIndex?: string | undefined;
    designSystemImportMode?: 'normalized' | 'hybrid' | 'verbatim' | undefined;
    /**
     * The official example card this task was started from.
     *
     * The card's SKILL.md already travels as a user-selected Skill, but that
     * body says how to build things of its kind — it never says which card the
     * user actually pointed at, nor what that card is for. `brief` closes the
     * larger gap: the composer seeds only the card's short description, while
     * the real build brief lives in the manifest's `od.useCase.query`. Without
     * carrying it here the run keeps the craft and loses the assignment.
     *
     * A fact, not an instruction: it is quoted product metadata, and it must not
     * be able to add stages or redefine the route.
     */
    exampleReference?: {
        pluginId: string;
        title?: string | undefined;
        brief?: string | undefined;
    } | undefined;
    /**
     * The handheld shell Open Design resolved for a phone-app prototype. A fact
     * in two parts — which shell and why, then the shell source itself — so the
     * Build holds the real handset markup instead of re-drawing one from memory.
     * Omitted when no phone platform was resolved; the rule card then points at
     * the staged shells on disk.
     */
    deviceFrame?: OdNextDeviceFrameContextV2 | undefined;
    /**
     * The structure-only layout primitives stylesheet the prototype profile
     * ships (`layout.css`), quoted as a fact for every prototype run so the
     * Build holds real classes for stacked text, truncation, rails, and screen
     * chrome instead of re-deriving them per component. Omitted for profiles
     * that ship none.
     */
    layoutPrimitivesCss?: string | undefined;
    craftBody?: string | undefined;
    craftSections?: string[] | undefined;
    memoryBody?: string | undefined;
    userInstructions?: string | undefined;
    projectInstructions?: string | undefined;
}
export declare function resolveOdNextDeckFrameworkMode(input: {
    taskType: OdNextStrategyRequestRecipeV2['taskType'];
    deckIntent?: boolean | undefined;
    hasSelectedDeckSeed?: boolean | undefined;
    hasExistingDeckArtifact?: boolean | undefined;
}): DeckFrameworkMode | undefined;
/**
 * OD-NEXT SIDE of the prompt fork. This list is declared TWICE: here, and as
 * `od.pipeline.stages` in
 * `plugins/_official/scenarios/od-next-strategy/open-design.json`. Keep them in
 * step.
 *
 * This file — not the plugin's markdown task profiles — is where OD Next
 * carries host runtime contracts: `discovery-question-form` mirrors the
 * `<question-form>` guidance in the legacy `discovery.ts`, and
 * `resolveOdNextDeckFrameworkMode` above reaches the shared deck scaffold. So
 * "does OD Next say X?" has two possible homes; check both. See
 * `docs/prompt-composition.md`.
 */
export declare const OD_NEXT_PROMPT_STAGE_CONTRACT_V2: readonly [{
    readonly id: 'discovery';
    readonly atoms: readonly ['discovery-question-form'];
}, {
    readonly id: 'plan';
    readonly atoms: readonly ['direction-picker', 'todo-write'];
}, {
    readonly id: 'generate';
    readonly atoms: readonly ['file-write', 'live-artifact'];
}];
/**
 * Reject only post-Build checker semantics. Planning-time phrases such as
 * native-child coordination remain valid inputs.
 */
export declare function assertOdNextPlanningBuildOnlyV2(value: string, field: string): void;
/**
 * Require exactly the declared stages, in order, each carrying exactly its
 * declared atoms.
 *
 * The stage list is structured data now, so this checks the data itself rather
 * than pattern-matching the markdown headings a renderer happened to emit. An
 * atom with no prompt fragment is legal: the element's presence is the fact,
 * and the body is optional.
 */
export declare function assertOdNextActiveStagesV2(stages: ReadonlyArray<OdNextPromptBundleStageV2>): OdNextPromptBundleStageV2[];
/**
 * Render structured stages back into the legacy markdown block form.
 *
 * Only the ordinary/non-Bundle composer still needs this shape; the canonical
 * Bundle consumes the structure directly so it never has to reparse headings.
 */
export declare function renderOdNextActiveStageBlocksV2(stages: ReadonlyArray<OdNextPromptBundleStageV2>): string[];
/**
 * Stable identity for the versioned recipe. The host still hashes the complete
 * instruction prefix; this value makes the two content dimensions explicit in
 * that prefix and in section-level cache diagnostics.
 */
export declare function odNextPromptCacheIdentityV2(input: Pick<OdNextStrategyRequestRecipeV2, 'recipe' | 'packageHash' | 'taskProfileDigest'>): string;
/**
 * Named here so the Bundle's own tag names and the instruction that references
 * them cannot drift apart in separate files.
 */
export declare const OD_NEXT_BUNDLE_ECHO_GUARD_V2 = "Do not quote, restate, or echo <open_design_core_system_prompt>. Begin the response by addressing <user_first_prompt>.";
export declare function composeOdNextStrategyStableRequestContextV2(context: OdNextStrategyStableRequestContextV2, executionProfile?: OdNextStrategyRequestRecipeV2['executionProfile']): string;
/** The output slot is retained; models no longer serialize host state. */
export declare function renderOdNextOutputContractV2(_input: OdNextStrategyRequestRecipeV2): string;
/** Compose the request-stage, cache-stable OD Next planning/Build recipe. */
export declare function composeOdNextStrategyRequestPromptV2(input: OdNextStrategyRequestRecipeV2, context?: OdNextStrategyStableRequestContextV2): string;
/** Per-task strategy identity for the Bundle's `<recipe_identity>` marker. */
export declare function odNextStrategyRecipeIdentityV2(input: OdNextStrategyRequestRecipeV2): OdNextPromptBundleRecipeIdentityV2;
/**
 * Compose the Bundle's cache-stable head — `open_design_core_system_prompt`,
 * `session_skills`, and `active_stages` — as structured nodes.
 *
 * Everything here is byte-identical across tasks that share a strategy version,
 * task type, and execution profile. The caller supplies `userSelectedSkills`
 * separately because those are the one per-task member of `session_skills`.
 */
export declare function composeOdNextStrategyBundleHeadV2(input: OdNextStrategyRequestRecipeV2): OdNextPromptBundleHeadV2;
/** Compose the verified recipe without stable request context for the Bundle head. */
export declare function composeOdNextStrategyCorePromptV2(input: OdNextStrategyRequestRecipeV2): string;
export declare function isOdNextIncrementalStageV2(stage: StrategyInputStageV2): stage is Exclude<StrategyInputStageV2, 'request'>;
//# sourceMappingURL=od-next-strategy.d.ts.map