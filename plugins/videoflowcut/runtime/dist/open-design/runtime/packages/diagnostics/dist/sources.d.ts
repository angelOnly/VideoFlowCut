import { type RedactionOptions } from "./redaction.js";
export type LogSourceKind = "json" | "text" | "binary";
export interface LogSource {
    /** Relative path inside the export zip (forward-slash). */
    name: string;
    /** Absolute path on disk to read from. */
    absolutePath: string;
    /**
     * How to read the file: `json`/`text` are read as UTF-8 and redacted;
     * `binary` is copied verbatim (no text decode, no redaction) so an opaque
     * artifact like a Chromium crash minidump reaches the bundle intact.
     */
    kind: LogSourceKind;
    /** Optional max bytes to read from the file tail; omit for whole file. */
    tailBytes?: number;
}
export interface CollectedFile {
    name: string;
    absolutePath: string;
    /**
     * Contents to put into the zip: a redacted string for text/json sources, a
     * raw Buffer for binary sources, or null when the file could not be read.
     */
    content: string | Buffer | null;
    bytes: number;
    /** Reason the file is missing or unreadable. */
    error?: string;
}
export declare function collectLogSource(source: LogSource, opts?: RedactionOptions): Promise<CollectedFile>;
export declare function collectLogSources(sources: LogSource[], opts?: RedactionOptions): Promise<CollectedFile[]>;
export interface CrashReportLookup {
    /** Filenames must contain at least one of these substrings (case-insensitive). */
    matchSubstrings: string[];
    /** Only include files modified within this many days. */
    withinDays?: number;
    /** Limit how many reports to include. */
    maxReports?: number;
    /** Override base directories to scan. */
    searchDirs?: string[];
    /** Home directory to derive ~/Library/Logs/DiagnosticReports from. */
    homeDir?: string;
}
export declare function findMacOSCrashReports(lookup: CrashReportLookup): Promise<LogSource[]>;
export interface CrashDumpLookup {
    /** Root crashDumps directory (Electron's `app.getPath('crashDumps')`). */
    dir: string;
    /** Only include dumps modified within this many days. */
    withinDays?: number;
    /** Limit how many dumps to include (newest first). */
    maxDumps?: number;
}
/**
 * Collect Chromium/Electron crash minidumps as BINARY sources. `crashReporter`
 * writes `.dmp` files under `<crashDumps>/completed` (and `pending` before
 * upload; with `uploadToServer:false` they stay there). These carry the native
 * renderer/main crash stack — the only reliable way to root-cause an opaque
 * abort like `0x80000003` (a V8/Chromium CHECK), which no text log records.
 */
export declare function findCrashDumps(lookup: CrashDumpLookup): Promise<LogSource[]>;
