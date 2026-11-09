import type { PanelEvent } from '@open-design/contracts/critique';
/**
 * Write a sequence of PanelEvents as newline-delimited JSON to a transcript
 * file under the artifact directory. Files larger than gzipThresholdBytes
 * are gzipped to .ndjson.gz; smaller files stay as plain .ndjson. The
 * threshold is applied to the cumulative UTF-8 byte size of the serialized
 * payload, not the array length, so multibyte transcripts size correctly.
 *
 * Backpressure-aware: events are streamed via Node streams, so the writer
 * never holds the full transcript in memory.
 *
 * Returns the path written (relative to artifactDir). Caller persists the
 * relative path on the critique_runs row.
 *
 * @see specs/current/critique-theater.md § Persistence (transcript files)
 */
export declare function writeTranscript(artifactDir: string, events: AsyncIterable<PanelEvent> | Iterable<PanelEvent>, opts?: {
    gzipThresholdBytes?: number;
}): Promise<{
    path: string;
    bytes: number;
    gzipped: boolean;
}>;
/**
 * Inverse of writeTranscript. Streams a transcript file (.ndjson or .ndjson.gz)
 * back out as PanelEvents. Used by replay paths and by Phase 11 e2e.
 *
 * @see specs/current/critique-theater.md § Persistence (transcript files)
 */
export declare function readTranscript(artifactDir: string, fileName: string): AsyncIterable<PanelEvent>;
