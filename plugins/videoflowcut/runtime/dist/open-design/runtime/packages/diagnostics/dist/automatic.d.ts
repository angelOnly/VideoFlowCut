import { type LogSource } from './sources.js';
import { type RedactionOptions } from './redaction.js';
export declare const DIAGNOSTIC_CHUNK_BYTES: number;
export declare const DIAGNOSTIC_MAX_BYTES: number;
/**
 * Prefix of the daemon's per-delivery receipt log line. Automatic bundles drop
 * these lines: otherwise every upload re-ships the receipts of all earlier
 * uploads and, on a busy device, they crowd the real log out of the tail.
 */
export declare const DIAGNOSTIC_DELIVERY_LOG_PREFIX = "[diagnostics] incident delivered";
export interface AutomaticDiagnosticManifest {
    version: 1;
    incidentId: string;
    completeness: 'complete' | 'partial';
    compressedBytes: number;
    chunks: Array<{
        index: number;
        sizeBytes: number;
        sha256: string;
    }>;
    recoveredAt?: number;
}
export interface AutomaticDiagnosticSource extends LogSource {
    /** Bytes before the last consent boundary must never enter an automatic upload. */
    startOffset?: number;
    omitReason?: string;
    /** Keeps only the lines that belong to the incident from a log shared by many runs. */
    selectLines?: (lines: string[]) => string[];
}
/** Gzipped JSONL records, written sequentially to bounded chunks; no binary discovery. */
export declare function buildAutomaticDiagnostics(input: {
    directory: string;
    incidentId: string;
    summary: unknown;
    sources: AutomaticDiagnosticSource[];
    redaction?: RedactionOptions;
    signal?: AbortSignal;
}): Promise<{
    manifest: AutomaticDiagnosticManifest;
}>;
