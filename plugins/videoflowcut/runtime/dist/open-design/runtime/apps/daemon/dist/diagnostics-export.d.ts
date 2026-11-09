import type { RequestHandler } from 'express';
import { type AutomaticDiagnosticSource } from '@open-design/diagnostics';
import { type LegacySidecarRuntimeLayout } from '@open-design/sidecar-proto';
import { type SidecarRuntimeContext } from '@open-design/sidecar';
import { type DiagnosticsEvidence } from './services/diagnostics-evidence.js';
export interface DiagnosticsHandlerOptions {
    evidence?: DiagnosticsEvidence;
    /** Sidecar runtime context, present when daemon is launched via tools-dev or packaged sidecar. */
    runtime: SidecarRuntimeContext<LegacySidecarRuntimeLayout> | null;
    /** Project root used to derive crash-report match strings. */
    projectRoot: string;
    /** Directory containing per-run event logs at <runsDir>/<runId>/events.jsonl. */
    runsDir?: string | null;
    /** OpenDesign data dir (OD_DATA_DIR), used to locate the AMR OpenCode home. */
    dataDir?: string | null;
    automaticUploadStatus?: () => Record<string, unknown>;
}
export declare const STANDALONE_LAUNCH_WARNING: string;
export declare const RUN_EVENT_CONTENT_WARNING: string;
/**
 * The daemon's rotated prior-session log (see `openLog` in
 * apps/packaged/src/sidecars.ts), resolved exactly as the bundle does, or null
 * for launchers that keep none (standalone `od`; tools-dev appends instead).
 */
export declare function resolveDaemonPreviousLogPath(runtime: SidecarRuntimeContext<LegacySidecarRuntimeLayout> | null): string | null;
/**
 * AMR's runtime log (`$AMR_HOME/logs/agent-runtime.jsonl`) is shared by every run.
 * `opencode_session_created` carries the Open Design run id; later records such as
 * `opencode_event_stream_failure` only carry the OpenCode session id. Keep this run's
 * records and its sessions' records until another run takes a session over.
 */
export declare function selectAmrRuntimeRunLines(runId: string): (lines: string[]) => string[];
/** Automatic uploads select the failing run and its runtime; manual exports remain broader. */
export declare function buildAutomaticDiagnosticSources(options: DiagnosticsHandlerOptions, incident: {
    runId?: string;
    agentId?: string;
}): Promise<AutomaticDiagnosticSource[]>;
export declare function createDiagnosticsExportHandler(options: DiagnosticsHandlerOptions): RequestHandler;
