import * as path from 'node:path';
import { promises as fs } from 'node:fs';
/**
 * Allowlist of artifact mime types the agent is expected to ship under v1.
 * The web layer's preview surface knows how to render each of these inline,
 * and the daemon's `Content-Type` response header for the artifact-fetch
 * endpoint is taken straight from this map. Unknown mimes fall through to
 * the binary sink (see `extensionForMime`) so an experimenting agent can
 * still ship something, but the file is named `.bin` and the response
 * header degrades to `application/octet-stream` so downstream consumers
 * cannot misinterpret raw bytes as a known type.
 *
 * The allowlist is intentionally narrow; expand it through this constant
 * (and the matching tests) rather than guessing from the mime string.
 */
const ARTIFACT_MIME_EXTENSIONS = {
    'text/html': 'html',
    'text/css': 'css',
    'text/markdown': 'md',
    'text/plain': 'txt',
    'application/json': 'json',
    'image/svg+xml': 'svg',
};
const FALLBACK_MIME = 'application/octet-stream';
const FALLBACK_EXTENSION = 'bin';
/**
 * Errors thrown by `writeShipArtifact`. The orchestrator distinguishes these
 * from generic Node fs errors so it can map an oversize body to the same
 * `degraded` outcome a parser-side OversizeBlockError would produce, and a
 * filesystem failure to `failed`.
 */
export class ArtifactTooLargeError extends Error {
    sizeBytes;
    maxBytes;
    code = 'ARTIFACT_TOO_LARGE';
    constructor(sizeBytes, maxBytes) {
        super(`<ARTIFACT> body of ${sizeBytes} bytes exceeded artifact-writer cap of ${maxBytes} bytes`);
        this.sizeBytes = sizeBytes;
        this.maxBytes = maxBytes;
    }
}
export class ArtifactEmptyError extends Error {
    code = 'ARTIFACT_EMPTY';
    constructor() {
        super('<ARTIFACT> body is empty after CDATA strip; refusing to write a zero-byte file');
    }
}
/** Default body cap when the orchestrator doesn't pass one. 1 MiB is the
 *  same ballpark as the parser's default block cap; any artifact larger than
 *  this is a strong signal the agent is misbehaving. */
const DEFAULT_MAX_BYTES = 1024 * 1024;
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
export async function writeShipArtifact(dir, body, mime, options = {}) {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const sizeBytes = Buffer.byteLength(body, 'utf8');
    if (sizeBytes === 0) {
        throw new ArtifactEmptyError();
    }
    if (sizeBytes > maxBytes) {
        throw new ArtifactTooLargeError(sizeBytes, maxBytes);
    }
    const resolvedMime = canonicalizeMime(mime);
    const extension = extensionForMime(resolvedMime);
    const filename = `artifact.${extension}`;
    const absPath = path.join(dir, filename);
    // Atomic write: render to a sibling tmp file then rename. A naive write
    // could leave a half-written file under `artifact.<ext>` if the daemon
    // crashes mid-write; the rename is observed atomically on POSIX and is
    // good enough on Windows for the local-only daemon use case.
    const tmpPath = `${absPath}.tmp.${process.pid}.${Date.now()}`;
    await fs.writeFile(tmpPath, body, { encoding: 'utf8' });
    try {
        await fs.rename(tmpPath, absPath);
    }
    catch (err) {
        // Best-effort cleanup of the tmp file; never let cleanup mask the
        // original rename error.
        await fs.unlink(tmpPath).catch(() => { });
        throw err;
    }
    return { mime: resolvedMime, extension, absPath, filename, sizeBytes };
}
/**
 * Look up the on-disk extension for a mime that has already been
 * canonicalized via `canonicalizeMime`. Exported so the artifact-fetch
 * endpoint can reverse the lookup and so the parser's golden tests can
 * assert mime → ext mappings without re-deriving them inline.
 */
export function extensionForMime(canonicalMime) {
    const known = ARTIFACT_MIME_EXTENSIONS[canonicalMime];
    return known ?? FALLBACK_EXTENSION;
}
/**
 * Look up the canonical mime for a known extension. Used by the
 * artifact-fetch endpoint when the row only stores the path; the path
 * extension is the source of truth on read because the row was written by
 * `writeShipArtifact` which derives the extension from the mime in the
 * first place. Falls back to `application/octet-stream` so the response
 * header is always something a browser can refuse to render as HTML.
 */
export function mimeForExtension(extension) {
    const lower = extension.toLowerCase().replace(/^\./, '');
    for (const [mime, ext] of Object.entries(ARTIFACT_MIME_EXTENSIONS)) {
        if (ext === lower)
            return mime;
    }
    return FALLBACK_MIME;
}
/**
 * Reduce an `<ARTIFACT mime="…">` attribute value to the canonical lookup
 * key: lowercased, with any `; charset=…` parameters stripped. Returns the
 * binary fallback for empty / unknown / malformed inputs so the rest of the
 * pipeline never has to guard for `mime === ''`.
 */
function canonicalizeMime(raw) {
    const head = (raw ?? '').split(';')[0]?.trim().toLowerCase();
    if (!head)
        return FALLBACK_MIME;
    if (Object.prototype.hasOwnProperty.call(ARTIFACT_MIME_EXTENSIONS, head)) {
        return head;
    }
    return FALLBACK_MIME;
}
/** Visible-for-testing: the canonical allowlist + the fallbacks. */
export const ARTIFACT_WRITER_INTERNALS = {
    ARTIFACT_MIME_EXTENSIONS,
    FALLBACK_MIME,
    FALLBACK_EXTENSION,
    DEFAULT_MAX_BYTES,
};
//# sourceMappingURL=artifact-writer.js.map