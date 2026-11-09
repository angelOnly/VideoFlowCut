import type Database from 'better-sqlite3';
import { type RunSideEffectLedger } from '../../runtimes/run-lifecycle-analytics.js';
import { type StrategyWriteEvidenceSource } from './intent-resolution-store.js';
interface EvidenceRun {
    id: string;
    sideEffectLedger?: RunSideEffectLedger;
    events?: unknown;
    artifactOutcome?: {
        filesWritten?: number;
        filesWrittenUnknown?: boolean;
        filesWrittenSource?: StrategyWriteEvidenceSource;
    };
}
/** The legacy count alone does not establish that the filesystem was observed. */
export declare function strategyRunWriteEvidence(run: EvidenceRun): {
    filesWritten: number;
    filesWrittenUnknown: boolean;
    filesWrittenSource: StrategyWriteEvidenceSource;
};
/** Uses the same ledger and terminal outcome as the real run lifecycle callbacks. */
export declare function createStrategyRunWriteEvidenceRecorder(db: Database.Database): {
    observeToolStream(run: EvidenceRun): void;
    finish(run: EvidenceRun): void;
};
export {};
