/**
 * Classification for collab cloud-transport failures.
 *
 * The vela-cli transport surfaces upstream HTTP failures as a child-process
 * error whose message embeds the spawned command line plus the CLI's stderr
 * (`Command failed: …vela collab …\nError: API request failed with status
 * NNN: code`). Routes must not flatten that into an unconditional 502: an
 * upstream 401/403/404 is an authoritative rejection the web client should
 * see as such, while only genuine infrastructure failures stay 502/503. The
 * raw error (command line, stderr) belongs in the daemon log only — never in
 * an HTTP response body.
 */
export type CollabCloudErrorKind = 'denied' | 'not_found' | 'timeout' | 'infrastructure';
export interface ClassifiedCollabCloudError {
    kind: CollabCloudErrorKind;
    /** HTTP status the daemon should answer with. */
    status: 403 | 404 | 502 | 503;
    /** Whether a client retry can plausibly change the outcome. */
    retryable: boolean;
    /** The upstream HTTP status parsed from the CLI error output, if any. */
    upstreamStatus: number | null;
}
/** Extract the upstream HTTP status from a vela CLI failure, if present. */
export declare function parseVelaApiStatus(error: unknown): number | null;
export declare function classifyCollabCloudError(error: unknown): ClassifiedCollabCloudError;
/**
 * Raised in place of a cloud-transport call while a project's upstream is in
 * a failure cooldown (see the presence negative cache): the stored
 * classification is replayed without spawning another transport process.
 */
export declare class CollabCloudUpstreamBlockedError extends Error {
    readonly classified: ClassifiedCollabCloudError;
    constructor(classified: ClassifiedCollabCloudError);
}
