import type Database from 'better-sqlite3';
import { type StrategyTaskExecutionRecord } from '../task-store.js';
import { type OdNextIntakePreflightInput } from './resolver.js';
type SqliteDb = Database.Database;
export declare class OdNextCoordinatorError extends Error {
    readonly reasonCodes: string[];
    constructor(message: string, reasonCodes: string[]);
}
export interface OdNextCoordinatorResult {
    action: 'running' | 'awaiting_clarification' | 'plan_ready' | 'completed' | 'blocked' | 'canceled';
    task: StrategyTaskExecutionRecord;
    visibleText: string;
    reasonCodes: string[];
}
export declare function prepareStrategyIntake(db: SqliteDb, input: {
    taskExecutionId: string;
    intake: OdNextIntakePreflightInput;
}): {
    ok: boolean;
    reasonCodes: string[];
};
export {};
