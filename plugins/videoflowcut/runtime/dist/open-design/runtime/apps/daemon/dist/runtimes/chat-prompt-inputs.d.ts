import path from 'node:path';
import { type OdNextPromptBundleHeadV2, type OdNextPromptBundleRecipeIdentityV2 } from '@open-design/contracts';
import { type StableChangedSection, type StableSectionHashes } from '../prompts/stable-sections.js';
import { type OdNextExactInputStage } from './od-next-exact-input.js';
export declare const MAX_CHAT_IMAGE_BYTES: number;
export declare const UPLOAD_DIR: string;
type InputValue = string | number | boolean | null | undefined | InputRecord | readonly InputValue[];
type InputRecord = {
    [key: string]: InputValue;
};
type PreviewCommentImageAttachmentInput = {
    path?: InputValue;
    name?: InputValue;
};
type CommentAttachmentPodMemberInput = {
    elementId?: InputValue;
    selector?: InputValue;
    label?: InputValue;
    text?: InputValue;
    position?: InputValue;
    htmlHint?: InputValue;
    style?: InputValue;
};
type CommentAttachmentInput = {
    id?: InputValue;
    order?: InputValue;
    filePath?: InputValue;
    elementId?: InputValue;
    selector?: InputValue;
    label?: InputValue;
    screenshotPath?: InputValue;
    markKind?: InputValue;
    intent?: InputValue;
    imageAttachments?: readonly PreviewCommentImageAttachmentInput[] | null;
    commentContext?: InputValue;
    comment?: InputValue;
    selectionKind?: InputValue;
    podMembers?: readonly CommentAttachmentPodMemberInput[] | null;
    memberCount?: InputValue;
    currentText?: InputValue;
    pagePosition?: InputValue;
    htmlHint?: InputValue;
    style?: InputValue;
    source?: InputValue;
};
export declare function composeLiveInstructionPrompt({ daemonSystemPrompt, runtimeToolPrompt, clientSystemPrompt, finalPromptOverride, }: {
    daemonSystemPrompt?: string | null;
    runtimeToolPrompt?: string | null;
    clientSystemPrompt?: string | null;
    finalPromptOverride?: string | null;
}): string;
export declare function resolveOdNextRequestUserPrompt({ message, currentPrompt, hasCurrentPrompt, }: {
    message: unknown;
    currentPrompt: unknown;
    hasCurrentPrompt: boolean;
}): string;
export declare function composeChatAgentTextPayload({ formOverride, daemonSystemPrompt, runtimeToolPrompt, researchCommandContract, runContextPrompt, connectedExternalMcpReference, browserUnavailableGuard, titleGenerationDirective, clientSystemPrompt, cwdReference, linkedDirectoryReferences, echoGuard, requestOrStageText, projectAttachmentReferences, commentAttachmentReferences, imageReferences, odNextRequestBundle, strategyInputStage, }: {
    formOverride: string;
    daemonSystemPrompt: string;
    runtimeToolPrompt: string;
    researchCommandContract: string;
    runContextPrompt: string;
    connectedExternalMcpReference: string;
    browserUnavailableGuard: string;
    titleGenerationDirective: string;
    clientSystemPrompt: string;
    cwdReference: string;
    linkedDirectoryReferences: string;
    echoGuard: string;
    requestOrStageText: string;
    projectAttachmentReferences: string;
    commentAttachmentReferences: string;
    imageReferences: string;
    odNextRequestBundle?: {
        head: OdNextPromptBundleHeadV2;
        recipeIdentity: OdNextPromptBundleRecipeIdentityV2;
        runtimeFacts: string;
        taskType: string;
        attachments: string;
        taskConfiguration: string;
        stableContext: string;
        priorTranscript: string;
        frozenSkillPackage: string;
        requestInputFacts: string;
        userSelectedSkills: {
            skillNames: ReadonlyArray<string>;
            body: string;
        } | null;
    } | undefined;
    strategyInputStage?: OdNextExactInputStage | null;
}): {
    composedPrompt: string;
    clientInstructionPrompt: string;
    instructionPrompt: string;
};
export declare function resolveResearchCommandContract(research: {
    enabled?: boolean;
    query?: string;
    maxSources?: number;
} | null | undefined, message: string): string;
/**
 * Read-only directories the run may reach outside its project cwd.
 *
 * The invariant: every absolute path the composed prompt advertises to the
 * agent has to appear here. `withSkillRootPreamble()` names the skill's own
 * directory as the "absolute fallback" skill root, and `skillsDir` only covers
 * the skills that ship in the repository — a skill installed under the daemon
 * data dir, or a plugin-local `SKILL.md` loaded from the bundled plugin folder,
 * resolves to a root that is outside every entry below. The agent then reads a
 * path we told it to read and the runtime treats it as an unapproved external
 * directory: OpenCode raises `permission.external_directory`, which a headless
 * run surfaces as a rejected tool call rather than as the staging gap it is.
 * Passing `activeSkillDirs` keeps the allowlist keyed on the roots actually in
 * play for this turn instead of on a fixed subset of them.
 *
 * Codex is excluded wholesale because it treats allowlisted directories as
 * writable, and skill roots are shipped read-only resources (PR #622).
 */
export declare function resolveChatExtraAllowedDirs({ agentId, skillsDir, designSystemsDir, linkedDirs, activeSkillDirs, existsSync, }: {
    agentId?: string | null;
    skillsDir?: string | null;
    designSystemsDir?: string | null;
    linkedDirs?: Array<string | null | undefined>;
    activeSkillDirs?: Array<string | null | undefined>;
    existsSync?: (path: string) => boolean;
}): string[];
export type DesignSystemSelectionSource = 'request' | 'plugin' | 'project' | 'app-default' | 'none';
export declare function resolveEffectiveDesignSystemSelection({ requestDesignSystemId, pluginDesignSystemId, projectDesignSystemId, appDefaultDesignSystemId, disabledDesignSystemIds, allowAppDefault, }: {
    requestDesignSystemId?: InputValue;
    pluginDesignSystemId?: InputValue;
    projectDesignSystemId?: InputValue;
    appDefaultDesignSystemId?: InputValue;
    disabledDesignSystemIds?: InputValue;
    allowAppDefault?: boolean;
}): {
    id: string | null;
    source: DesignSystemSelectionSource;
};
export declare function designSystemIdFromPluginSnapshot(snapshot: InputValue): string | null;
export type StablePromptCacheMissReason = 'new-session' | 'missing-stored-hash' | 'stable-prompt-changed' | null;
export declare function describeStablePromptCache({ isResuming, storedStablePromptHash, currentStableHash, storedStableSections, currentStableSections, }: {
    isResuming: boolean;
    storedStablePromptHash: string | null;
    currentStableHash: string;
    storedStableSections?: StableSectionHashes | null;
    currentStableSections?: StableSectionHashes | null;
}): {
    stablePromptHash: string;
    hit: boolean;
    missReason: StablePromptCacheMissReason;
    changedSections: StableChangedSection[] | null;
};
export declare function normalizeCommentAttachments(input: readonly CommentAttachmentInput[] | null | undefined): {
    id: string;
    order: number;
    filePath: string;
    elementId: string;
    selector: string;
    label: string;
    comment: string;
    currentText: string;
    pagePosition: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    htmlHint: string;
    style: Record<string, string> | undefined;
    selectionKind: string;
    memberCount: number;
    podMembers: {
        elementId: string;
        selector: string;
        label: string;
        text: string;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        htmlHint: string;
        style: Record<string, string> | undefined;
    }[];
    screenshotPath: string | undefined;
    markKind: string | undefined;
    intent: string | undefined;
    imageAttachments: {
        path: string;
        name: string;
    }[] | undefined;
    commentContext: string;
    source: string;
}[];
export declare function renderCommentAttachmentHint(commentAttachments: ReturnType<typeof normalizeCommentAttachments>): string;
type DesignFilesHintEntry = {
    name?: string;
    path?: string;
    kind?: string;
    type?: string;
    size?: number;
};
export declare function resolveSafeProjectAttachments(cwd: string | null | undefined, attachments: readonly string[] | null | undefined, opts?: {
    pathImpl?: typeof path;
    existsSync?: (path: string) => boolean;
}): string[];
export declare function formatProjectAttachmentHint(attachments: readonly string[] | null | undefined): string;
export declare function formatDesignFilesWorkspaceHint(cwd: string | null | undefined, files?: DesignFilesHintEntry[], folders?: DesignFilesHintEntry[]): string;
export declare function resolveSafePromptImagePaths(imagePaths: readonly string[] | null | undefined, opts?: {
    pathImpl?: typeof path;
    existsSync?: (path: string) => boolean;
    statSync?: (path: string) => {
        isFile(): boolean;
        size?: number;
    };
    uploadDir?: string;
    maxBytes?: number;
}): {
    safeImages: string[];
    oversizedImages: {
        path: string;
        sizeBytes: number;
    }[];
    failedImages: {
        path: string;
        error: string;
    }[];
};
export declare function selectPromptImagePaths(agentId: string | null | undefined, safeImages: string[], amrStagedImages: string[]): string[];
export declare function excludeAcpImagePathsAlreadyDeliveredAsResources(imagePaths: string[], resourcePaths: string[]): string[];
export {};
