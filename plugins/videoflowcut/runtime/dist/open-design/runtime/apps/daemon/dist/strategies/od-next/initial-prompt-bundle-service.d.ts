import { type OdNextPromptBundleHeadV2, type OdNextPromptBundleRecipeIdentityV2, type OdNextStrategyRequestRecipeV2 } from '@open-design/contracts';
import { getProject } from '../../db.js';
import type { RunWorkspaceScope } from '../../runtimes/project-amr-trace-env.js';
import type { RuntimeAgentDef } from '../../runtimes/types.js';
import { type FrozenSkillPackageV1 } from './frozen-skill-package.js';
import { type OdNextTaskInputSnapshotDescriptor } from './task-input-snapshot.js';
type SqliteDb = Parameters<typeof getProject>[0];
type ResearchInput = {
    enabled?: boolean;
    query?: string;
    maxSources?: number;
} | null;
export interface OdNextInitialPromptMeta {
    agentId: string;
    doneKey?: unknown;
    message?: unknown;
    currentPrompt?: unknown;
    priorTranscript?: unknown;
    systemPrompt?: unknown;
    projectId?: unknown;
    conversationId?: unknown;
    skillId?: unknown;
    skillIds?: unknown;
    designSystemId?: unknown;
    sessionMode?: unknown;
    locale?: unknown;
    research?: ResearchInput;
    context?: unknown;
    titleGeneration?: unknown;
    byokMediaDefaults?: unknown;
    mediaExecution?: unknown;
    appliedPluginSnapshotId?: unknown;
    workspaceScope?: RunWorkspaceScope | null;
    toolBundle?: unknown;
    strategyRolloutDecision?: {
        syntheticCanary?: boolean;
        effectiveMode?: 'off' | 'observe' | 'active';
    } | null;
}
interface DaemonSystemPromptResult {
    prompt: string;
    /**
     * Structured cache-stable head of the canonical Bundle
     * (`open_design_core_system_prompt`, `session_skills`, `active_stages`). Null
     * when the run has no verified OD Next recipe, which the Bundle path treats
     * as fatal rather than falling back to an untyped Markdown payload.
     */
    odNextBundleHead?: OdNextPromptBundleHeadV2 | null;
    odNextRecipeIdentity?: OdNextPromptBundleRecipeIdentityV2 | null;
    odNextRuntimeFacts?: string | null;
    odNextStableContextPrompt?: string | null;
}
interface OdNextInitialPromptBundleServiceDeps {
    db: SqliteDb;
    projectsDir: string;
    runtimeDataDir: string;
    daemonUrl: string;
    sandboxEnabled: boolean;
    getAgentDef: (agentId: string) => RuntimeAgentDef | null | undefined;
    createAgentRuntimeToolPrompt: (daemonUrl: string, toolTokenGrant: {
        token: string;
    } | null) => string;
    composeDaemonSystemPrompt: (input: Record<string, unknown>) => Promise<DaemonSystemPromptResult>;
}
export interface PrepareOdNextInitialPromptBundleInput {
    meta: OdNextInitialPromptMeta;
    frozenSkillPackage: FrozenSkillPackageV1;
    taskInputSnapshot: OdNextTaskInputSnapshotDescriptor;
}
export interface PreparedOdNextInitialPromptBundle {
    text: string;
}
/** Resolve the installed strategy recipe using its existing execution profile. */
export declare function resolveOdNextPromptRecipeForRun(input: {
    db: SqliteDb;
    bundledPluginsDir: string;
    appliedPluginSnapshotId: unknown;
    streamFormat: string;
    atomPromptsEnabled: boolean;
}): Promise<OdNextStrategyRequestRecipeV2 | null>;
/**
 * Own the immutable request-stage Prompt Bundle assembly. The daemon
 * composition root supplies process/runtime dependencies; project, MCP,
 * frozen-input, and prompt ordering decisions stay together here.
 */
export declare function createOdNextInitialPromptBundleService(deps: OdNextInitialPromptBundleServiceDeps): (input: PrepareOdNextInitialPromptBundleInput) => Promise<PreparedOdNextInitialPromptBundle>;
export {};
