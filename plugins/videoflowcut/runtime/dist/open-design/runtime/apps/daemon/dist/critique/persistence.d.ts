import type Database from 'better-sqlite3';
import { CRITIQUE_RUN_STATUSES, type CritiquePersistedStatus, type CritiqueRoundSummary, type CritiqueRunStatus } from '@open-design/contracts/critique';
/**
 * Re-export the public contract types and enumeration so existing
 * daemon-side imports (`./persistence.js`) keep working unchanged. The
 * canonical definitions live in `@open-design/contracts/critique` so the
 * web layer can consume the same shapes and the same display order
 * through the rerun / history endpoints (AGENTS.md requirement that
 * shared API DTOs live in packages/contracts).
 *
 * `CritiquePersistedStatus` extends `CritiqueRunStatus` with the in-flight
 * `'running'` value so DB-row types can be precisely typed without inline
 * `as X | 'running'` widens at every call site (lefarcen P2 on PR #1016).
 * Public DTOs continue to use the terminal-only `CritiqueRunStatus` so a
 * future endpoint cannot leak a 'running' row through the wire.
 */
export { CRITIQUE_RUN_STATUSES };
export type { CritiquePersistedStatus, CritiqueRoundSummary, CritiqueRunStatus };
export interface CritiqueRunRow {
    id: string;
    projectId: string;
    conversationId: string | null;
    artifactPath: string | null;
    /** Reflects the on-disk row exactly: a row may legitimately be in the
     *  in-flight `'running'` state until the orchestrator (or
     *  reconcileStaleRuns) drives it to a terminal status. Public DTOs that
     *  surface critique runs to the web must narrow to `CritiqueRunStatus`. */
    status: CritiquePersistedStatus;
    score: number | null;
    rounds: CritiqueRoundSummary[];
    transcriptPath: string | null;
    protocolVersion: number;
    createdAt: number;
    updatedAt: number;
}
export interface CritiqueRunInsert {
    id: string;
    projectId: string;
    conversationId?: string | null;
    artifactPath?: string | null;
    /** Accepts every value the DB CHECK constraint allows, so the orchestrator
     *  can insert an in-flight `'running'` row at run-start without an inline
     *  type cast. */
    status: CritiquePersistedStatus;
    score?: number | null;
    rounds?: CritiqueRoundSummary[];
    transcriptPath?: string | null;
    protocolVersion: number;
    createdAt?: number;
    updatedAt?: number;
}
export interface CritiqueRunPatch {
    /** Patches only ever finalize a row into a terminal state; in-flight
     *  rows are created via the insert path, not patched. Keeping this
     *  terminal-only catches accidental writes that would re-park a row in
     *  `'running'` after it transitioned out. */
    status?: CritiqueRunStatus;
    score?: number | null;
    rounds?: CritiqueRoundSummary[];
    transcriptPath?: string | null;
    artifactPath?: string | null;
    updatedAt?: number;
}
/**
 * Idempotent. Creates the critique_runs table and the supporting indexes if
 * they don't exist. Safe to call from the existing migrate(db) flow on every
 * daemon boot.
 */
export declare function migrateCritique(db: Database.Database): void;
export declare function insertCritiqueRun(db: Database.Database, input: CritiqueRunInsert): CritiqueRunRow;
export declare function getCritiqueRun(db: Database.Database, id: string): CritiqueRunRow | null;
/**
 * Updates the patch fields on an existing run. Returns the new row, or null
 * when the id does not exist. Always updates updated_at.
 */
export declare function updateCritiqueRun(db: Database.Database, id: string, patch: CritiqueRunPatch): CritiqueRunRow | null;
export declare function listCritiqueRunsByProject(db: Database.Database, projectId: string): CritiqueRunRow[];
export declare function deleteCritiqueRun(db: Database.Database, id: string): void;
/**
 * Marks a single 'running' row as 'interrupted' with the supplied
 * recoveryReason embedded in rounds_json. Mirror of the per-row write in
 * reconcileStaleRuns(), kept as its own function so the interrupt endpoint
 * can use it when a request arrives for a row that has no live
 * AbortController in the registry (the post-daemon-restart window before
 * reconcileStaleRuns considers the row old enough). Atomic on the
 * status='running' guard so a row that just transitioned to a different
 * terminal state is not overwritten.
 *
 * Returns true when a row was mutated, false when the id was missing or
 * not in 'running' status.
 */
export declare function markRunInterruptedRecovery(db: Database.Database, id: string, recoveryReason: string, now?: number): boolean;
/**
 * Recovery scan called on daemon boot: any run still in a non-terminal status
 * older than staleAfterMs is marked 'interrupted' with rounds_json.recoveryReason
 * = 'daemon_restart'. Returns the count of rows mutated.
 */
export declare function reconcileStaleRuns(db: Database.Database, options: {
    staleAfterMs: number;
    now?: number;
}): number;
