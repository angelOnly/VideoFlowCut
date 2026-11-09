import type { Request, Response } from 'express';
import type Database from 'better-sqlite3';
import type { RunRegistry } from './run-registry.js';
/**
 * POST /api/projects/:projectId/critique/:runId/interrupt
 *
 * Validates the run exists and belongs to the URL project, then signals the
 * registered AbortController so the orchestrator can flush best-so-far state
 * and emit critique.interrupted.
 *
 * Idempotency: if the row is already 'interrupted', the endpoint returns 202
 * with prevStatus='interrupted' rather than 409, so a client that lost the
 * first response and retries does not see the run flip from 202 to a hard
 * conflict. Other terminal statuses (shipped, failed, timed_out, degraded,
 * below_threshold, legacy) still return 409 because the run reached its real
 * terminal state on its own and an interrupt is no longer meaningful.
 *
 * @see specs/current/critique-theater.md § interrupt endpoint (Task 6.1)
 */
export declare function handleCritiqueInterrupt(db: Database.Database, registry: RunRegistry): (req: Request, res: Response) => void;
