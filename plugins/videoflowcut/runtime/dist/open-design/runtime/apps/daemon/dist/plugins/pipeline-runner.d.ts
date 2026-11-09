import type Database from 'better-sqlite3';
import type { AppliedPluginSnapshot, PluginPipeline } from '@open-design/contracts';
import { type PipelineEnv, type PipelineEventSink, type StageOutcomeRecord, type StageRunner } from './pipeline.js';
import type { GenUIEventSink } from '../genui/events.js';
type SqliteDb = Database.Database;
export interface PipelineRunnerInput {
    db: SqliteDb;
    runId: string;
    projectId: string;
    conversationId?: string | null | undefined;
    snapshot: AppliedPluginSnapshot;
    pipeline: PluginPipeline;
    env: PipelineEnv;
    runStage: StageRunner;
    emitPipeline?: PipelineEventSink | undefined;
    emitGenui?: GenUIEventSink | undefined;
}
export declare function runPipelineForRun(input: PipelineRunnerInput): Promise<StageOutcomeRecord[]>;
export {};
