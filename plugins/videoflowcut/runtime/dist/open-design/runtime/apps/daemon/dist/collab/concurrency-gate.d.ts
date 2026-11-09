/**
 * How many `vela` child processes one collab fan-out may have in flight.
 *
 * Sized for transfer work rather than CPU: these operations are dominated by
 * network round-trips, so several in flight keep the pipe busy without turning
 * one workspace into a load generator against the hub.
 *
 * The cap is a latency trade for a safety guarantee, and the trade is real: a
 * 40-resource fan-out that used to run 40-wide now runs 8-wide, so it takes
 * about five times as many rounds. That is the point — the old version was
 * only "fast" because it borrowed unboundedly from the machine and the hub.
 * 8 matches the bound the hub already puts on its own per-request fan-out
 * (MAX_BLOB_INSPECTION_CONCURRENCY), so neither side is the surprise.
 *
 * This is a per-SITE budget, and there are two sites: materializing shared
 * resources (one gate at the composition root, shared by all three listing
 * kinds) and publishing dirty projects (the scheduler's own). They stay
 * separate because pulls and pushes run in opposite directions with different
 * latency sensitivity — a big listing refresh should not delay a teammate's
 * publish. The honest daemon-wide worst case from these two sites is therefore
 * 8 pulls + 8 pushes, not 8 total.
 */
export declare const COLLAB_VELA_FANOUT_CONCURRENCY = 8;
/**
 * Admits at most `capacity` operations at a time; the rest wait their turn.
 *
 * FIFO by construction — waiters resume in arrival order — so a large fan-out
 * queued ahead of a single later operation delays it by the queue, never
 * starves it indefinitely.
 */
export declare class ConcurrencyGate {
    private readonly capacity;
    private available;
    private readonly waiters;
    constructor(capacity: number);
    /** Operations admitted and not yet settled. */
    get active(): number;
    /** Operations waiting for a slot. */
    get pending(): number;
    /**
     * Run `operation` once a slot is free, releasing the slot when it settles.
     *
     * An uncontended call starts the operation SYNCHRONOUSLY — no microtask hop
     * between asking and starting. Callers that observe "the adapter was invoked
     * by the time this returned" (a run-boundary flush, for one) keep behaving
     * as they did before a gate existed; only a genuinely contended call waits.
     *
     * The slot is released on rejection too, so one failing transfer cannot
     * permanently shrink the gate. The rejection itself is re-thrown to this
     * caller unchanged — the gate schedules work, it does not police errors.
     */
    run<T>(operation: () => Promise<T>): Promise<T>;
    /** Invoke the operation on an already-held slot and release it on settle. */
    private settle;
    private release;
}
/**
 * `Promise.all(items.map(fn))` with at most `gate`'s capacity in flight.
 *
 * Results keep input order and a rejection propagates exactly as
 * `Promise.all` would, so this is a drop-in for the unbounded form.
 */
export declare function mapWithGate<T, U>(items: readonly T[], gate: ConcurrencyGate, fn: (item: T, index: number) => Promise<U>): Promise<U[]>;
