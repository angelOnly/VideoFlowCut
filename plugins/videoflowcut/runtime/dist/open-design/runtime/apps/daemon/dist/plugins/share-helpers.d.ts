import type Database from 'better-sqlite3';
import { PLUGIN_SHARE_ACTION_PLUGIN_IDS } from '@open-design/contracts';
type JsonRecord = Record<string, unknown>;
export interface ProjectPluginManifest {
    name: string;
    title: string;
    version: string;
    manifest: JsonRecord;
}
export type PluginShareAction = keyof typeof PLUGIN_SHARE_ACTION_PLUGIN_IDS;
export interface PluginSharePromptInput {
    action: PluginShareAction;
    sourcePlugin: {
        id: string;
        title?: string | null;
    };
    stagedPath: string;
}
export interface RunLike {
    id: string;
    projectId?: string | null;
    conversationId?: string | null;
    assistantMessageId?: string | null;
    agentId?: string | null;
    pluginId?: string | null;
    appliedPluginSnapshotId?: string | null;
}
export interface RunWaiter {
    wait(run: RunLike): Promise<{
        status: string;
        cancelOrigin?: string | null;
    }>;
}
export interface SkillPluginCandidateLike {
    id: string;
    projectId: string;
    conversationId?: string | null;
    status: string;
    assistantMessageId?: string | null;
    title?: string | null;
    description?: string | null;
    confidence?: number | null;
    draftPath?: string | null;
}
export interface SkillPluginCandidateInput {
    message?: string | null;
    currentPrompt?: string | null;
    attachments?: unknown;
}
export interface PluginSnapshotReader {
    (db: Database.Database, snapshotId: string): {
        pluginId?: string | null;
    } | null | undefined;
}
export declare function renderPluginBriefTemplate(template: string | null | undefined, inputs?: Record<string, string | number | boolean | null | undefined>): string;
export declare function readProjectPluginManifest(folder: string): Promise<ProjectPluginManifest>;
export declare const __forTestReadProjectPluginManifest: typeof readProjectPluginManifest;
export declare function githubRepoNameFromPluginName(name: string): string;
export declare const PLUGIN_SHARE_ACTION_LABELS: Record<PluginShareAction, string>;
export declare const USER_PLUGIN_SOURCE_KINDS: Set<string>;
export declare function normalizePluginShareAction(input: unknown): PluginShareAction | null;
export declare function renderPluginSharePrompt({ action, sourcePlugin, stagedPath }: PluginSharePromptInput): string;
export declare function copyPluginFolderForProjectContext(sourceRoot: string, destRoot: string): Promise<void>;
export declare function ensureGhReady(): Promise<{
    ok: true;
    log: string[];
} | {
    ok: false;
    code: string;
    message: string;
    url: string;
    log: string[];
}>;
export declare function reconcileAssistantMessageOnRunEnd(db: Database.Database, runs: RunWaiter, run: RunLike): void;
export declare function isPluginAuthoringRun(db: Database.Database, run: RunLike | null | undefined, getSnapshot: PluginSnapshotReader): boolean;
export declare function hasGeneratedPluginArtifacts(projectRoot: string | null | undefined): Promise<boolean>;
export declare function detectSkillPluginCandidateOnRunSuccess(db: Database.Database, runs: RunWaiter, run: RunLike, input: SkillPluginCandidateInput | null | undefined, projectRoot: string): void;
export declare function upsertSkillPluginCandidateAssistantMessage(db: Database.Database, run: RunLike, candidate: SkillPluginCandidateLike): string | null;
export {};
