import type { Request, Response } from 'express';
import type Database from 'better-sqlite3';
/**
 * GET /api/projects/:projectId/critique/:runId/artifact
 *
 * Streams the bytes the orchestrator wrote for the run's SHIP `<ARTIFACT>`
 * block, with the mime type derived from the file extension on disk. This
 * is the daemon-resolved logical handle the web layer fetches; clients
 * never receive a raw filesystem path. Cross-project leak guard mirrors
 * the interrupt handler: a request against project p1 must not surface a
 * runId that belongs to p2.
 *
 * Status semantics:
 *   200 — happy path; body is the artifact bytes with the right mime.
 *   400 — projectId/runId missing or whitespace-only.
 *   404 — run not found, cross-project leak, no artifact persisted, or
 *         the on-disk file disappeared (bytes never made it to the row).
 *
 * @see specs/current/critique-theater.md § rerun endpoint (Task 6.2)
 */
export declare function handleCritiqueArtifact(db: Database.Database, options: {
    artifactsRoot: string;
    responseCapBytes?: number;
}): (req: Request, res: Response) => Promise<void>;
