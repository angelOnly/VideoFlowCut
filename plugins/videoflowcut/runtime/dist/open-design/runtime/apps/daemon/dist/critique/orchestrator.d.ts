import type { ChildProcess } from 'node:child_process';
import type Database from 'better-sqlite3';
import type { CritiqueConfig } from '@open-design/contracts/critique';
import type { CritiqueSseEvent } from '@open-design/contracts/critique';
import { type CritiqueRunRow, type CritiqueRunStatus } from './persistence.js';
/**
 * SSE bus contract: the orchestrator emits CritiqueSseEvent variants here so
 * the existing /api/projects/:id/events stream can fan them out unchanged.
 * Implementations should be non-blocking; backpressure is the caller's job.
 */
export interface CritiqueSseBus {
    emit(event: CritiqueSseEvent): void;
}
export interface OrchestratorParams {
    runId: string;
    projectId: string;
    conversationId: string | null;
    artifactId: string;
    artifactDir: string;
    adapter: string;
    /**
     * SKILL.md id for the run, used as a Prometheus label so the dashboard
     * can break adapter performance down by skill. Optional because not
     * every spawn site has threaded it yet (Phase 12 follow-up). Defaults
     * to 'unknown' so the series shape stays stable.
     */
    skill?: string;
    cfg: CritiqueConfig;
    db: Database.Database;
    bus: CritiqueSseBus;
    /**
     * Source of CLI stdout. The orchestrator is transport-agnostic: a real
     * spawn wrapper passes the child process stdout, tests pass a synthetic
     * iterable.
     */
    stdout: AsyncIterable<string>;
    /**
     * Optional abort signal. Aborting causes the orchestrator to flush
     * best-so-far state and emit critique.interrupted before returning.
     */
    signal?: AbortSignal;
    /**
     * Optional handle to the spawned child process. When provided the
     * orchestrator calls child.kill('SIGTERM') on every non-clean termination
     * path (timeout, abort, parser error, child non-zero exit).
     */
    child?: Pick<ChildProcess, 'kill'>;
    /**
     * Resolves when the child process exits. Used to race parser completion
     * against an early child exit so a non-zero exit code is classified as
     * 'failed' rather than waiting for the parser to time out.
     */
    childExitPromise?: Promise<{
        code: number | null;
        signal: string | null;
    }>;
}
export interface OrchestratorResult {
    status: CritiqueRunStatus;
    composite: number | null;
    rounds: CritiqueRunRow['rounds'];
    transcriptPath: string | null;
    artifactPath: string | null;
}
/**
 * Drives one Critique Theater run end-to-end:
 *   parse stdout -> collect events -> score per round -> persist -> emit SSE.
 *
 * @see specs/current/critique-theater.md § Wire protocol parser invariants
 *      and § Failure modes (recovery)
 */
export declare function runOrchestrator(params: OrchestratorParams): Promise<OrchestratorResult>;
