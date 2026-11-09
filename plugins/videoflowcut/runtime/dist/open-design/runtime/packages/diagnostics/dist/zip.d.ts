import { type RedactionOptions } from "./redaction.js";
import { type DiagnosticsContext, type DiagnosticsManifest, type MachineInfo } from "./manifest.js";
import { type CrashDumpLookup, type CrashReportLookup, type LogSource } from "./sources.js";
export interface DiagnosticsExportInput {
    context: DiagnosticsContext;
    sources: LogSource[];
    redaction?: RedactionOptions;
    /** Sanitized live snapshots unavailable from file logs (e.g. pre-run failures). */
    summaries?: Record<string, unknown>;
    /** When provided, scan macOS crash reports matching these substrings. */
    crashReports?: CrashReportLookup;
    /** When provided, collect Chromium/Electron crash minidumps from this dir. */
    crashDumps?: CrashDumpLookup;
}
export interface DiagnosticsExportResult {
    zip: Buffer;
    manifest: DiagnosticsManifest;
    machineInfo: MachineInfo;
}
export declare function buildDiagnosticsZip(input: DiagnosticsExportInput): Promise<DiagnosticsExportResult>;
