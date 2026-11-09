/** Result of a successful artifact write. All paths are absolute. */
export interface WriteShipArtifactResult {
    /** Resolved mime type (input mime if it was on the allowlist, else the
     *  binary fallback). The artifact endpoint serves this as Content-Type. */
    mime: string;
    /** Lowercase extension WITHOUT the leading dot. */
    extension: string;
    /** Absolute path to the file the daemon just wrote. */
    absPath: string;
    /** Filename within the artifact directory (no parent components). */
    filename: string;
    /** UTF-8 byte length of the body that was written. */
    sizeBytes: number;
}
/**
 * Errors thrown by `writeShipArtifact`. The orchestrator distinguishes these
 * from generic Node fs errors so it can map an oversize body to the same
 * `degraded` outcome a parser-side OversizeBlockError would produce, and a
 * filesystem failure to `failed`.
 */
export declare class ArtifactTooLargeError extends Error {
    readonly sizeBytes: number;
    readonly maxBytes: number;
    readonly code: 'ARTIFACT_TOO_LARGE';
    constructor(sizeBytes: number, maxBytes: number);
}
export declare class ArtifactEmptyError extends Error {
    readonly code: 'ARTIFACT_EMPTY';
    constructor();
}
export interface WriteShipArtifactOptions {
    /** Hard cap on the body size in UTF-8 bytes; defaults to 1 MiB. The
     *  orchestrator passes `cfg.parserMaxBlockBytes` so the on-disk limit
     *  matches the parser's in-memory limit. */
    maxBytes?: number;
}
/**
 * Resolve the canonical mime + filename for a SHIP artifact body and write
 * it to `<dir>/artifact.<ext>` atomically (write to a sibling tmp file, then
 * rename). The caller is expected to pass a directory that already exists;
 * the orchestrator builds it as `<artifactsDir>/<projectId>/<runId>` at
 * run-start, so creation is the orchestrator's responsibility, not this
 * module's.
 *
 * `mime` is matched case-insensitively and trimmed of a `; charset=…`
 * suffix before the extension lookup, so `text/html; charset=utf-8` and
 * `Text/HTML` both resolve to the `html` extension.
 */
export declare function writeShipArtifact(dir: string, body: string, mime: string, options?: WriteShipArtifactOptions): Promise<WriteShipArtifactResult>;
/**
 * Look up the on-disk extension for a mime that has already been
 * canonicalized via `canonicalizeMime`. Exported so the artifact-fetch
 * endpoint can reverse the lookup and so the parser's golden tests can
 * assert mime → ext mappings without re-deriving them inline.
 */
export declare function extensionForMime(canonicalMime: string): string;
/**
 * Look up the canonical mime for a known extension. Used by the
 * artifact-fetch endpoint when the row only stores the path; the path
 * extension is the source of truth on read because the row was written by
 * `writeShipArtifact` which derives the extension from the mime in the
 * first place. Falls back to `application/octet-stream` so the response
 * header is always something a browser can refuse to render as HTML.
 */
export declare function mimeForExtension(extension: string): string;
/** Visible-for-testing: the canonical allowlist + the fallbacks. */
export declare const ARTIFACT_WRITER_INTERNALS: {
    ARTIFACT_MIME_EXTENSIONS: {
        readonly 'text/html': 'html';
        readonly 'text/css': 'css';
        readonly 'text/markdown': 'md';
        readonly 'text/plain': 'txt';
        readonly 'application/json': 'json';
        readonly 'image/svg+xml': 'svg';
    };
    FALLBACK_MIME: string;
    FALLBACK_EXTENSION: string;
    DEFAULT_MAX_BYTES: number;
};
