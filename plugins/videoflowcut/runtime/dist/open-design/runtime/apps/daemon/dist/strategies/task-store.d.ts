import { OD_NEXT_PROMPT_BUNDLE_SCHEMA_V1, OD_NEXT_PROMPT_BUNDLE_SCHEMA_V2, OD_NEXT_REQUEST_TURN_SCHEMA_V1, OD_NEXT_RESUME_REQUEST_SCHEMA, OD_NEXT_STRATEGY_ID, type StrategySettlementFactsV2, type StrategySettlementReasonV2, OD_NEXT_INTENT_RESOLUTION_TURN_SCHEMA, type OpenDesignPlanContractV2, type StrategyExecutionModeV2, type StrategyExecutionIntentV2, type ChatSessionMode, type StrategyInputStageV2, type StrategyOutcomeV2, type StrategyRouteV2 } from '@open-design/contracts';
import type Database from 'better-sqlite3';
import { type FrozenSkillPackageV1 } from './od-next/frozen-skill-package.js';
import { type StrategyIntentResolution } from './od-next/intent-resolution-store.js';
type SqliteDb = Database.Database;
declare const TASK_STORE_SCHEMA_VERSION: 1;
export type StrategyTaskOutcome = 'running' | StrategyOutcomeV2;
export interface StrategyTaskRunMapping {
    runId: string;
    inputStage: StrategyInputStageV2;
    taskRunIndex: number;
    sourceRunId?: string;
    purpose?: 'intent_resolution';
    finalText: StrategyTaskFinalTextIdentity;
    /** Immutable alternative used only when native production resume is unavailable. */
    coldStartFinalText?: StrategyTaskFinalTextIdentity;
    resumeFinalText?: StrategyTaskFinalTextIdentity;
    settlementReason?: StrategySettlementReasonV2;
    settlementFacts?: StrategySettlementFactsV2;
}
export type StrategyTaskFinalTextKind = 'bundle' | 'turn';
/**
 * A stored final text always carries the schema it was written with. Prompt
 * Bundles exist at two versions because v1 rows are already persisted and are
 * never rewritten; request Turns have exactly one.
 */
export type StrategyTaskFinalTextSchema = typeof OD_NEXT_PROMPT_BUNDLE_SCHEMA_V1 | typeof OD_NEXT_PROMPT_BUNDLE_SCHEMA_V2 | typeof OD_NEXT_REQUEST_TURN_SCHEMA_V1 | typeof OD_NEXT_RESUME_REQUEST_SCHEMA | typeof OD_NEXT_INTENT_RESOLUTION_TURN_SCHEMA;
export interface StrategyTaskFinalTextIdentity {
    kind: StrategyTaskFinalTextKind;
    schema: StrategyTaskFinalTextSchema;
    text: string;
    utf8Bytes: number;
    sha256: string;
}
export interface StrategyTaskFrozenInputIdentity {
    schema: 'open-design.od-next-frozen-input-identity/v1';
    snapshotId: string;
    strategyPackageHash: string;
    frozenSkillPackageIdentity: string;
    taskInputManifestSha256: string;
}
export interface StrategyTaskExecutionRecord {
    schemaVersion: typeof TASK_STORE_SCHEMA_VERSION;
    revision: number;
    taskExecutionId: string;
    continuedFromTaskExecutionId?: string;
    projectId: string;
    conversationId: string;
    snapshotId: string;
    strategyId: typeof OD_NEXT_STRATEGY_ID;
    strategyVersion: string;
    strategyPackageHash: string;
    selectedAgentId: string;
    route: StrategyRouteV2 | null;
    inputStage: StrategyInputStageV2;
    outcome: StrategyTaskOutcome;
    executionMode: StrategyExecutionModeV2 | null;
    executionIntent?: StrategyExecutionIntentV2;
    intentResolution: StrategyIntentResolution | null;
    deliverableValid?: boolean;
    blockedContext?: StrategyTaskBlockedContext;
    planContract?: OpenDesignPlanContractV2;
    planContractHash?: string;
    clarificationCount: 0 | 1;
    planContractRepairAttempts: 0 | 1;
    initialRunId: string;
    latestRunId: string;
    activeRunId: string | null;
    terminalRunId: string | null;
    runs: StrategyTaskRunMapping[];
    frozenSkillPackage: FrozenSkillPackageV1;
    promptBundle: StrategyTaskFinalTextIdentity;
    frozenInputIdentity: StrategyTaskFrozenInputIdentity;
    createdAt: number;
    updatedAt: number;
}
export interface CreateStrategyTaskExecutionInput {
    sessionMode?: ChatSessionMode;
    taskExecutionId: string;
    continuedFromTaskExecutionId?: string;
    projectId: string;
    conversationId: string;
    snapshotId: string;
    selectedAgentId: string;
    initialRunId: string;
    frozenSkillPackage: FrozenSkillPackageV1;
    promptBundleText: string;
    taskInputManifestSha256: string;
    createdAt?: number;
}
/**
 * Durable attribution for a blocked strategy task: the exact gate reason codes
 * plus the agent-visible text of the turn that was rejected. Every blocked
 * outcome must be diagnosable from the store alone, without live logs.
 */
export interface StrategyTaskBlockedContext {
    reasonCodes: string[];
    visibleText: string | null;
}
export interface StrategyTaskTransitionState {
    route: StrategyRouteV2;
    inputStage: StrategyInputStageV2;
    outcome: StrategyTaskOutcome;
    executionMode: StrategyExecutionModeV2 | null;
    executionIntent?: StrategyExecutionIntentV2;
}
export interface CompareAndTransitionStrategyTaskInput {
    taskExecutionId: string;
    expectedRevision: number;
    to: StrategyTaskTransitionState;
    nextRun?: {
        runId: string;
        sourceRunId: string;
        finalText: string;
        coldStartText?: string;
    };
    blockedContext?: {
        reasonCodes: readonly string[];
        visibleText?: string | null;
    };
    updatedAt?: number;
    deliverableValid?: boolean;
    settlementReason?: StrategySettlementReasonV2;
    settlementFacts?: StrategySettlementFactsV2;
}
export declare class InvalidStrategyTaskRecordError extends Error {
    constructor(message: string);
}
export declare class InvalidStrategyTaskTransitionError extends Error {
    constructor(message: string);
}
export declare class StrategyTaskTransitionConflictError extends Error {
    constructor(message: string);
}
export declare function migrateStrategyTaskStore(db: SqliteDb): void;
export declare function createStrategyTaskExecution(db: SqliteDb, input: CreateStrategyTaskExecutionInput): StrategyTaskExecutionRecord;
export declare function getStrategyTaskExecution(db: SqliteDb, taskExecutionId: string): StrategyTaskExecutionRecord | null;
export declare function getStrategyTaskExecutionByRunId(db: SqliteDb, runId: string): StrategyTaskExecutionRecord | null;
/** One assistant message's place in its logical task, for rendering. */
export interface StrategyTaskTurnProjection {
    taskExecutionId: string;
    taskRunIndex: number;
    /** The task ended with explicit verified file evidence. Carried because the
     *  messages table has no strategy column, so a reload has no other way to
     *  learn the verdict, and surfaces keyed off the agent's TodoWrite snapshot
     *  (the "continue remaining tasks" offer) would resurrect on every reload. */
    delivered: boolean;
    /** Persisted task verdict, independent of the physical Run's status. */
    blocked: boolean;
    blockedText: string | null;
}
/**
 * Map physical Run ids to the logical task turn they belong to.
 *
 * A read-side projection for rendering: an OD Next Full Plan spans several
 * physical Runs (request -> production) that are ONE conversation turn, and a
 * daemon-issued continuation has no user prompt of its own. Clients need to
 * know which assistant messages belong to the same turn so a continuation is
 * not drawn as an answer nobody asked for.
 *
 * Message run pointers may be client supplied. An existing task must belong
 * to the authorized project and conversation before any metadata is exposed;
 * only a genuinely missing task row retains the legacy turn-position fallback.
 *
 * Deliberately does NOT go through `rowToTask`: this is a projection for
 * display, so it must stay cheap over a whole conversation and must never let
 * one unverifiable task record fail the entire message list.
 */
export declare function strategyTaskTurnsForRunIds(db: SqliteDb, runIds: readonly string[], owner: {
    projectId: string;
    conversationId: string;
}): Map<string, StrategyTaskTurnProjection>;
export declare function getAwaitingClarificationStrategyTaskExecution(db: SqliteDb, input: {
    projectId: string;
    conversationId: string;
}): StrategyTaskExecutionRecord | null;
/** Logical request stage is not proof that a physical Run owns the initial Bundle. */
export declare function isInitialStrategyTaskRun(task: StrategyTaskExecutionRecord, runId: string): boolean;
export declare function compareAndTransitionStrategyTaskExecution(db: SqliteDb, input: CompareAndTransitionStrategyTaskInput): StrategyTaskExecutionRecord;
export declare function cancelStrategyTaskExecution(db: SqliteDb, input: {
    taskExecutionId: string;
    expectedRevision: number;
    updatedAt?: number;
}): StrategyTaskExecutionRecord;
/**
 * Converge a logical task after startup reconciles its latest physical Run.
 * Successful Runs still require Coordinator settlement; failures end the task
 * while their error and retry authority remain on the physical Run. Cancellation
 * keeps its distinct task outcome. Databases without Task06 tables are intentionally a no-op.
 */
export declare function reconcileStrategyTaskRunTerminal(db: SqliteDb, input: {
    runId: string;
    status: 'failed' | 'canceled';
    updatedAt?: number;
}): boolean;
/** Preserve the actual incremental request alongside its full recovery bundle. */
export declare function persistStrategyResumeText(db: Database.Database, runId: string, text: string): StrategyTaskFinalTextIdentity;
export {};
