import type { MarkerCompletionEvidence } from './marker-settlement.js';
import type { OdNextReply } from './protocol.js';
import type Database from 'better-sqlite3';
import type { InternalPhysicalRun, InternalRunCreateInput, InternalRunCreationService, PreparedInternalRunResult } from '../../services/internal-run-service.js';
import { type StrategyTaskExecutionRecord } from '../task-store.js';
import type { StrategyTaskProjectionV2 } from '@open-design/contracts';
import type { OdNextCoordinatorResult } from './coordinator.js';
type SqliteDb = Database.Database;
export declare function projectStrategyTask(task: StrategyTaskExecutionRecord, viewedRunId?: string): StrategyTaskProjectionV2;
export declare function projectStrategyTaskByRunId(db: SqliteDb, runId: string): StrategyTaskProjectionV2 | undefined;
export interface PreparedAutomaticStrategyContinuation<TRun> {
    result: OdNextCoordinatorResult;
    prepared?: PreparedInternalRunResult<TRun>;
    start: boolean;
    stage?: 'production';
}
export declare function prepareAutomaticStrategyContinuation<TMeta extends InternalRunCreateInput, TRun extends InternalPhysicalRun>(input: {
    db: SqliteDb;
    service: InternalRunCreationService<TMeta, TRun>;
    task: StrategyTaskExecutionRecord;
    parsed: OdNextReply;
    createMeta: (stage: 'production', instruction: string, taskRunIndex: number) => TMeta;
    completionEvidence?: MarkerCompletionEvidence;
    locale?: string | undefined;
    updatedAt?: number;
}): PreparedAutomaticStrategyContinuation<TRun>;
export declare function completeAutomaticSimpleProduction(db: SqliteDb, input: {
    runId: string;
    physicalStatus: 'succeeded' | 'failed' | 'canceled';
    deliverableValid: boolean;
    updatedAt?: number;
}): StrategyTaskExecutionRecord | null;
/** Retain a stop for legacy mappings without recovery context or unsafe replay. */
export declare function endFailedAutomaticContinuation(db: SqliteDb, input: {
    runId: string;
    updatedAt?: number;
}): StrategyTaskExecutionRecord | null;
export {};
