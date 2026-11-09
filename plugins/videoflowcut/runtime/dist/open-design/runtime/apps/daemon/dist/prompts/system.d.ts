import { type CritiqueConfig } from '@open-design/contracts/critique';
import { type ByokMediaDefaults, type ChatSessionMode, type DeckFrameworkMode, type ExecutionProfile, type MediaExecutionPolicy, type OdNextStrategyRequestRecipeV2 } from '@open-design/contracts';
type ProjectMetadata = {
    kind?: string;
    intent?: string | null;
    fidelity?: string | null;
    speakerNotes?: boolean | null;
    slideCount?: string | null;
    animations?: boolean | null;
    includeLandingPage?: boolean | null;
    includeOsWidgets?: boolean | null;
    templateId?: string | null;
    templateLabel?: string | null;
    platform?: string | null;
    platformTargets?: string[] | null;
    inspirationDesignSystemIds?: string[];
    skipDiscoveryBrief?: boolean | null;
    examplePrompt?: boolean | null;
    examplePromptTitle?: string | null;
    examplePromptBrief?: Record<string, string> | null;
    imageModel?: string | null;
    imageAspect?: string | null;
    imageStyle?: string | null;
    videoModel?: string | null;
    videoLength?: number | null;
    videoAspect?: string | null;
    audioKind?: string | null;
    audioModel?: string | null;
    audioDuration?: number | null;
    voice?: string | null;
    brandId?: string | null;
    brandSourceUrl?: string | null;
    brandDesignSystemId?: string | null;
    promptTemplate?: {
        id?: string | null;
        surface?: 'image' | 'video' | null;
        title?: string | null;
        prompt?: string | null;
        summary?: string | null;
        category?: string | null;
        tags?: string[] | null;
        model?: string | null;
        aspect?: string | null;
        source?: {
            repo?: string | null;
            license?: string | null;
            author?: string | null;
            url?: string | null;
        } | null;
    } | null;
    contextPlugins?: Array<{
        id?: string | null;
        title?: string | null;
        description?: string | null;
    }> | null;
    contextMcpServers?: Array<{
        id?: string | null;
        label?: string | null;
        transport?: string | null;
        url?: string | null;
        command?: string | null;
    }> | null;
    contextConnectors?: Array<{
        id?: string | null;
        name?: string | null;
        provider?: string | null;
        category?: string | null;
        status?: string | null;
        accountLabel?: string | null;
    }> | null;
};
type ProjectTemplate = {
    name: string;
    description?: string | null;
    files: Array<{
        name: string;
        content: string;
    }>;
};
type AudioVoiceOption = {
    name: string;
    voiceId: string;
    category?: string | null;
    labels?: Record<string, string> | null;
};
type ExclusiveSurfaceMode = 'deck' | 'image' | 'video' | 'audio';
export declare function resolveExclusiveSurface(args: {
    metadata?: ProjectMetadata | undefined;
    skillMode?: ComposeInput['skillMode'] | undefined;
    skillModes?: ComposeInput['skillModes'] | undefined;
}): ExclusiveSurfaceMode | null;
/**
 * Whether the outgoing user request reads as a slide-deck brief. Gates the
 * ~20K maybe-deck framework injection for freeform (kind=other / no
 * metadata) projects: those runs previously carried the full framework on
 * every turn "just in case". Feed it USER-AUTHORED text only (see
 * `extractUserAuthoredSignalText`) — assistant turns in a packed transcript
 * offer deck vocabulary the user never chose; conversation persistence is
 * the latch's job (`latchConversationIntentSignals`), not the scanner's.
 * Callers that cannot supply the request text should pass undefined to
 * `freeformDeckSignal`, which preserves the legacy always-inject behavior.
 */
export declare function detectDeckIntentSignal(...texts: Array<string | null | undefined>): boolean;
/**
 * Whether the visible conversation names a delivery platform. Backstops the
 * metadata-based gate for PLATFORM_CONTRACTS_BLOCK: freeform projects with
 * no platform metadata but a platform-explicit brief ("做个 iOS app 原型")
 * still need the per-platform delivery contracts classic carried always-on.
 */
export declare function detectPlatformIntentSignal(...texts: Array<string | null | undefined>): boolean;
/**
 * Whether the visible conversation mentions generating media. Gates the
 * MEDIA_DISPATCH_HINT for non-media projects: most runs never generate
 * media, so the generate→wait dispatch hint only ships once the request
 * text (transcript included) shows media vocabulary. Callers that cannot
 * supply the request text pass undefined to `mediaHintSignal`, which
 * preserves the legacy always-inject behavior.
 */
export declare function detectMediaIntentSignal(...texts: Array<string | null | undefined>): boolean;
/**
 * Reduce an outgoing request message to the text the USER actually authored,
 * for intent-signal scanning. The three intent signals gate stable-region
 * prompt blocks, and for transcript-resending clients `message` embeds the
 * full packed conversation — assistant turns included. Assistant copy (most
 * damagingly the default discovery form's own option copy: «幻灯 / 路演»,
 * "Slide deck / pitch", «iOS / Android / 响应式») must never flip a signal:
 * every flip changes the stable instruction hash and re-sends the whole
 * stable block on resume.
 *
 * - Packed transcript (contains `## user` / `## assistant` marker lines):
 *   returns only the bodies of `## user` sections; `## assistant` sections
 *   and the leading `## context warning` block are dropped entirely.
 * - Plain message (no role markers): returned unchanged (legacy whole-scan).
 * - `[form answers — <id>]` blocks in either shape are narrowed to the value
 *   part of each `- label: value` line (see narrowFormAnswerSignalText).
 */
export declare function extractUserAuthoredSignalText(message: string | null | undefined): string;
export declare const BASE_SYSTEM_PROMPT: string;
export declare const SKIP_DISCOVERY_BRIEF_OVERRIDE = "# Automated project mode \u2014 skip discovery form\n\nThis project was created through the daemon API with `skipDiscoveryBrief: true`. Override the discovery rules below: do NOT emit a project-opening `<question-form id=\"discovery\">` or show \"Quick brief \u2014 30 seconds\". Treat the user's first message and project metadata as the brief, then proceed directly to planning/building under the normal artifact workflow. Ask at most one concise follow-up only if a required detail is impossible to infer safely.";
export declare function buildExamplePromptOverride(title?: string | null, brief?: Record<string, string> | null): string;
export interface ComposeInput {
    odNextStrategyRecipe?: OdNextStrategyRequestRecipeV2 | undefined;
    agentId?: string | null | undefined;
    streamFormat?: string | undefined;
    /**
     * The plan-tool sentence for this run, pre-resolved by the caller.
     *
     * Only the OD Next fork reads it. The legacy stack below resolves its own
     * from `planToolNoteForRuntime(agentId, streamFormat)` a few lines down, and
     * a caller that passes nothing gets exactly today's behaviour there. It is an
     * input rather than a second internal derivation so this composer and its
     * `@open-design/contracts` mirror stay byte-identical for identical inputs —
     * the parity that `tests/plugins-strategy-recipe.test.ts` pins.
     */
    planToolNote?: string | null | undefined;
    skillBody?: string | undefined;
    skillName?: string | undefined;
    skillMode?: 'prototype' | 'deck' | 'template' | 'design-system' | 'image' | 'video' | 'audio' | undefined;
    skillModes?: Array<'prototype' | 'deck' | 'template' | 'design-system' | 'image' | 'video' | 'audio'> | undefined;
    designSystemBody?: string | undefined;
    designSystemTitle?: string | undefined;
    designSystemUsageMd?: string | undefined;
    designSystemTokensCss?: string | undefined;
    designSystemComponentsManifest?: string | undefined;
    designSystemFixtureHtml?: string | undefined;
    designSystemPullIndex?: string | undefined;
    designSystemImportMode?: 'normalized' | 'hybrid' | 'verbatim' | undefined;
    craftBody?: string | undefined;
    craftSections?: string[] | undefined;
    memoryBody?: string | undefined;
    memoryHooks?: {
        profile?: boolean;
        rewrite?: boolean;
        verify?: boolean;
    } | undefined;
    metadata?: ProjectMetadata | undefined;
    template?: ProjectTemplate | undefined;
    audioVoiceOptions?: AudioVoiceOption[] | undefined;
    audioVoiceOptionsError?: string | undefined;
    critique?: CritiqueConfig | undefined;
    critiqueBrand?: {
        name: string;
        design_md: string;
    } | undefined;
    critiqueSkill?: {
        id: string;
    } | undefined;
    pluginBlock?: string | undefined;
    activeStageBlocks?: ReadonlyArray<string> | undefined;
    userInstructions?: string | undefined;
    projectInstructions?: string | undefined;
    locale?: string | undefined;
    sessionMode?: ChatSessionMode | undefined;
    mediaExecution?: MediaExecutionPolicy | undefined;
    byokMediaDefaults?: ByokMediaDefaults | undefined;
    executionProfile?: ExecutionProfile | undefined;
    freeformDeckSignal?: boolean | undefined;
    /** Host-resolved OD Next deck scaffold policy for blank vs legacy/existing decks. */
    deckFrameworkMode?: DeckFrameworkMode | undefined;
    promptCoreVariant?: 'classic' | 'slim' | undefined;
    mediaHintSignal?: boolean | undefined;
    platformHintSignal?: boolean | undefined;
}
export declare function composeSystemPrompt({ odNextStrategyRecipe, agentId, planToolNote, skillBody, skillName, skillMode, skillModes, designSystemBody, designSystemTitle, designSystemUsageMd, designSystemTokensCss, designSystemComponentsManifest, designSystemFixtureHtml, designSystemPullIndex, designSystemImportMode, craftBody, craftSections, memoryBody, memoryHooks, metadata, template, audioVoiceOptions, audioVoiceOptionsError, critique, critiqueBrand, critiqueSkill, pluginBlock, activeStageBlocks, streamFormat, locale, sessionMode, userInstructions, projectInstructions, mediaExecution, byokMediaDefaults, executionProfile, freeformDeckSignal, deckFrameworkMode, promptCoreVariant, mediaHintSignal, platformHintSignal, }: ComposeInput): string;
/**
 * The plan-tool note for one run, or null when this runtime has no plan tool
 * whose output the daemon can turn into a Todos card.
 *
 * Why the note is needed at all: the charter's plan step offers "Otherwise,
 * provide a numbered plan in your response" as a sanctioned branch, and asks
 * the model to self-assess whether "the runtime supports task lists". A model
 * that was never told its tool's NAME reads the prose branch as the compliant
 * one — which is what a codex run did on 2026-09-03 in answer to an explicit
 * 「先用 todo 进行一轮规划」: it wrote a seven-item plan into the reply body and
 * called no plan tool. Naming the tool removes the ambiguity without touching
 * the charter (which is under a byte ceiling and is prepended to every run);
 * a runtime with no plan tool still pays nothing.
 *
 * Every entry is evidence-backed, not inferred from a family resemblance. A
 * runtime is added here only once its real tool name is known AND the daemon
 * demonstrably reduces that tool's output into a `TodoWrite` snapshot; naming
 * a tool that does not exist is the exact failure the Claude Code 2.1 rename
 * caused, and a silent guess would rebuild it.
 *
 * This is the ONE home for that table, and it now has two consumers: the slim
 * charter below, and the OD Next fork, which composes an entirely separate
 * prompt and would otherwise stay in the pre-fix state forever. OD Next
 * receives the resolved sentence as `planToolNote` — first through
 * `odNextStableRequestContext` in server.ts (the shipping Bundle path), and
 * mirrored on this file's own early return. Callers pass the sentence rather
 * than the runtime so the table never gets a second copy on the other side of
 * the fork.
 */
export declare function planToolNoteForRuntime(agentId: string | null | undefined, streamFormat: string | undefined): string | null;
export declare function renderConnectedExternalMcpDirective(connectedExternalMcp: ReadonlyArray<{
    id: string;
    label?: string | undefined;
}> | undefined): string;
export {};
