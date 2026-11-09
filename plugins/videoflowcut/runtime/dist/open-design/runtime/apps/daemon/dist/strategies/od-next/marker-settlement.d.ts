import type { OdNextReply } from './protocol.js';
import type Database from 'better-sqlite3';
import { type StrategyTaskExecutionRecord } from '../task-store.js';
import type { OdNextCoordinatorResult } from './coordinator.js';
export interface MarkerCompletionEvidence {
    physicalStatus: 'succeeded' | 'failed' | 'canceled';
    deliverableValid: boolean;
    truncated?: boolean;
    todoUnfinished?: boolean;
}
export declare function settleMarkerTurn(db: Database.Database, input: {
    taskExecutionId: string;
    runId: string;
    parsed: OdNextReply;
    completionEvidence?: MarkerCompletionEvidence;
    updatedAt?: number;
}): OdNextCoordinatorResult;
export declare function markerMayContinue(task: StrategyTaskExecutionRecord, parsed: OdNextReply): boolean;
