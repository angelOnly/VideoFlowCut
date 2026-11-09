import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export type StrategyWriteEvidenceSource = 'filesystem' | 'tool_stream' | 'unknown';
export type IntentResolutionState = 'unresolved' | 'claimed' | 'started' | 'resolved' | 'failed';
export interface StrategyIntentResolution {
    version: 1;
    state: IntentResolutionState;
    attempts: 0 | 1;
    runId: string | null;
    sourceRunId: string | null;
    sourceResultJson: string | null;
    sourceResultSha256: string | null;
    replyJson: string | null;
    replySha256: string | null;
}
export declare const intentResolutionDigest: (text: string) => string;
export declare function migrateIntentResolutionStore(db: SqliteDb): void;
export declare function readIntentResolution(db: SqliteDb, taskExecutionId: string): StrategyIntentResolution | null;
/** Every observation belongs to an existing physical mapping. Positive/unknown evidence is sticky. */
export declare function recordStrategyRunWriteEvidence(db: SqliteDb, input: {
    taskExecutionId: string;
    runId: string;
    filesWritten: number;
    unknown: boolean;
    source: StrategyWriteEvidenceSource;
}): void;
export declare function readStrategyTaskWriteEvidence(db: SqliteDb, taskExecutionId: string): {
    runId: string;
    filesWritten: number | null;
    unknown: boolean;
    sources: StrategyWriteEvidenceSource[];
}[];
export declare function failIntentResolutionRecord(db: SqliteDb, taskExecutionId: string): void;
export {};
