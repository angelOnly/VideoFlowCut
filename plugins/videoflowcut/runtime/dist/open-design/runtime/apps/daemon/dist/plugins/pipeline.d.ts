import type Database from 'better-sqlite3';
import type { AppliedPluginSnapshot, PluginPipeline, PluginPipelineStageEvent, PipelineStage } from '@open-design/contracts';
import { type UntilSignals } from './until.js';
type SqliteDb = Database.Database;
export interface PipelineEnv {
    maxIterations: number;
}
export interface StageRunOutcome {
    signals?: UntilSignals | undefined;
    artifactDiffSummary?: string | null | undefined;
    critiqueSummary?: string | null | undefined;
    tokensUsed?: number | null | undefined;
}
export type StageRunner = (args: {
    stage: PipelineStage;
    iteration: number;
    snapshot: AppliedPluginSnapshot;
}) => Promise<StageRunOutcome> | StageRunOutcome;
export type PipelineEventSink = (event: PluginPipelineStageEvent) => void;
export interface RunPipelineInput {
    db: SqliteDb;
    runId: string;
    snapshot: AppliedPluginSnapshot;
    pipeline: PluginPipeline;
    env: PipelineEnv;
    runStage: StageRunner;
    emit?: PipelineEventSink | undefined;
}
export interface StageOutcomeRecord {
    stageId: string;
    iterations: number;
    converged: boolean;
    termination: 'until-satisfied' | 'iteration-cap' | 'no-loop';
}
export declare class PipelineConfigError extends Error {
    constructor(message: string);
}
export declare function runPipeline(input: RunPipelineInput): Promise<StageOutcomeRecord[]>;
export interface DevloopIterationRow {
    id: string;
    runId: string;
    stageId: string;
    iteration: number;
    artifactDiffSummary: string | null;
    critiqueSummary: string | null;
    tokensUsed: number | null;
    endedAt: number;
}
interface RecordIterationInput {
    runId: string;
    stageId: string;
    iteration: number;
    artifactDiffSummary: string | null;
    critiqueSummary: string | null;
    tokensUsed: number | null;
}
export declare function recordIteration(db: SqliteDb, input: RecordIterationInput): DevloopIterationRow;
export declare function listIterationsForRun(db: SqliteDb, runId: string): DevloopIterationRow[];
export {};
