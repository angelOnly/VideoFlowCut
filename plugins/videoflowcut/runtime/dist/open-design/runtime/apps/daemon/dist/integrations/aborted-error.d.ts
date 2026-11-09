/**
 * Whether a rejection is an operation WE cancelled, rather than one that
 * failed.
 *
 * `runVelaCommand` marks a deliberate abort with `name: 'AbortError'` and
 * `code: 'ABORT_ERR'`, and keeps a separate `timeout` termination for real
 * deadline breaches. The proactive team-pull scheduler cancels in-flight pulls
 * as ordinary control flow — a higher published version supersedes the one
 * being fetched (`mergeIntentUpdate`), or the intent is cleared
 * (`clearIntent`) — so those must never be logged or counted as faults.
 *
 * Deliberately narrow: a real timeout and any transport error stay failures,
 * so a genuine fault can never be swallowed as "we meant to do that".
 */
export declare function isAbortedOperationError(error: unknown): boolean;
