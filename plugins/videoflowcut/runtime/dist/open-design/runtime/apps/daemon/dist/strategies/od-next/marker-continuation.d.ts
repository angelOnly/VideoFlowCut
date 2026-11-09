import type { MarkerCompletionEvidence } from './marker-settlement.js';
import type { OdNextReply } from './protocol.js';
import type Database from 'better-sqlite3';
import type { InternalPhysicalRun, InternalRunCreateInput, InternalRunCreationService } from '../../services/internal-run-service.js';
import { type StrategyTaskExecutionRecord } from '../task-store.js';
import type { PreparedAutomaticStrategyContinuation } from './automatic-simple-production.js';
/** The source verdict and successor claim commit together, before either is published. */
export declare function prepareMarkerContinuation<TMeta extends InternalRunCreateInput, TRun extends InternalPhysicalRun>(input: {
    db: Database.Database;
    service: InternalRunCreationService<TMeta, TRun>;
    task: StrategyTaskExecutionRecord;
    parsed: OdNextReply;
    createMeta: (stage: 'production', instruction: string, taskRunIndex: number) => TMeta;
    completionEvidence?: MarkerCompletionEvidence;
    locale?: string | undefined;
    updatedAt?: number;
}): PreparedAutomaticStrategyContinuation<TRun>;
