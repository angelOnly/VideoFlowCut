import type Database from 'better-sqlite3';
import type { AppliedPluginSnapshot, PipelineStage } from '@open-design/contracts';
import type { UntilSignals } from '../until.js';
import { type RunEventForAnalyticsObservability } from '../../run-analytics-observability.js';
type SqliteDb = Database.Database;
export interface AtomWorkerContext {
    db: SqliteDb;
    runId: string;
    projectId: string;
    conversationId: string | null;
    stage: PipelineStage;
    iteration: number;
    snapshot: AppliedPluginSnapshot;
    runEvents?: RunEventForAnalyticsObservability[];
}
export interface AtomOutcome {
    signals?: UntilSignals;
    note?: string;
}
export interface AtomWorker {
    id: string;
    describe?: string;
    run: (ctx: AtomWorkerContext) => Promise<AtomOutcome> | AtomOutcome;
}
export declare function registerAtomWorker(worker: AtomWorker): void;
export declare function unregisterAtomWorker(id: string): void;
export declare function clearAtomWorkers(): void;
export declare function getAtomWorker(id: string): AtomWorker | undefined;
export declare function listRegisteredAtomIds(): string[];
export declare const PERMISSIVE_DEFAULT_SIGNALS: Readonly<UntilSignals>;
export interface StageRegistryOutcome {
    signals: UntilSignals;
    critiqueSummary: string | null;
    notes: string[];
    observedAtoms: string[];
    tokensUsed?: number | null;
}
export declare function runStageWithRegistry(ctx: AtomWorkerContext): Promise<StageRegistryOutcome>;
export {};
