/**
 * Identity state of this installation for telemetry delivery.
 * - `ready`: an installation id exists; events can be attributed to it.
 * - `pending`: no id yet and the user has not opted out (fresh install before
 *   the renderer mints one); events must wait rather than be dropped or sent
 *   under a throwaway identity.
 * - `none`: the user explicitly opted out; no id will ever appear, so events
 *   follow the existing safety-channel path immediately.
 */
export type TelemetryIdentityState = 'ready' | 'pending' | 'none';
export interface IdentityGatedQueue<T> {
    /** Deliver now when identity is settled; otherwise retain in arrival order. */
    submit(item: T): Promise<void>;
    /** Replay retained items once identity is settled. Safe to call repeatedly. */
    flush(): Promise<void>;
    /** Number of retained items (for tests/diagnostics). */
    size(): number;
}
/**
 * Invariant (OPEND-4220): an event that arrives before the installation
 * identity exists is retained, not lost, and is delivered before any later
 * event so a launch attempt is never counted after its own result. Retention is
 * bounded; overflow drops the newest item rather than growing without limit.
 */
export declare function createIdentityGatedQueue<T>(options: {
    limit: number;
    resolveIdentity: () => Promise<TelemetryIdentityState>;
    deliver: (item: T) => Promise<void>;
}): IdentityGatedQueue<T>;
