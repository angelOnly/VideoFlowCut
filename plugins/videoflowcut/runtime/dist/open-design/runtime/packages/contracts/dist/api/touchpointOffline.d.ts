/**
 * OPEND-3436 — the daemon/web contract for showing a cached production
 * touchpoint while the CMS runtime is unreachable.
 *
 * The shape of the deal, in one paragraph: the daemon owns persistence and the
 * clock. When the upstream decision endpoint cannot be reached, the daemon
 * rebuilds the last decision it stored for this (account, environment,
 * placement, locale), re-times it against its own rollback-resistant estimate
 * of server time, and answers 200 with the same decision body the browser
 * already knows how to parse — plus `offlineReplay`. The browser therefore
 * needs no second copy of the schedule, no second cache and no clock of its
 * own; it reads one extra field and changes exactly two behaviours (stop
 * polling, revalidate once per recovery event).
 *
 * Why the timing fields are REWRITTEN rather than echoed:
 *
 *  - `serverTime` is replayed as the daemon's estimate of NOW, so the lease the
 *    browser computes (`deadline - serverTime`) measures the remaining window
 *    rather than the window as it stood at fetch time. Echoing the stored value
 *    would hand the browser a lease that expired while it was offline.
 *  - `authorizationExpiresAt` is replayed as `endsAt`. This is the ticket's one
 *    explicit product ruling: an offline client may display up to the last
 *    known END of the activity, and is no longer taken down merely because the
 *    short authorization window it was issued has lapsed. Revocation is a
 *    connected operation — see `TouchpointOfflineReplayReason`.
 *  - `startsAt` and `endsAt` are the server's schedule and are replayed
 *    verbatim. They are the only authority for whether display is allowed;
 *    nothing baked into the creative counts.
 *
 * Fields the daemon does NOT rewrite (activity/deployment/content identity,
 * `touchpointDecisionId`, static actions, required capabilities) are replayed
 * exactly as stored, so the browser's lease key is byte-identical to the one it
 * was already holding and a replay never re-mounts a live placement.
 *
 * Pure types and pure functions only: this module is imported by both the
 * daemon and the browser bundle.
 */
/**
 * Why a decision was replayed from cache instead of fetched.
 *
 * Both members are transport-class failures, and that is the whole list on
 * purpose. An answer the server actually gave — 401/403 (authentication),
 * 404 (no decision), 410 (withdrawal), 4xx generally — is the server exercising
 * its authority, and replaying cached content over it would be the client
 * overruling the server. Those are never offline-eligible, and the daemon's
 * delete path keys off 410 alone.
 */
export type TouchpointOfflineReplayReason = 
/** DNS failure, connection refused/reset, or the proxy's own request timeout. */
'upstream_unreachable'
/** The runtime answered, with a 5xx: temporarily unavailable, not a decision. */
 | 'upstream_unavailable';
/** The marker the daemon adds to a replayed production decision body. */
export interface TouchpointOfflineReplay {
    reason: TouchpointOfflineReplayReason;
    /**
     * `serverTime` as it stood when this decision was fetched and stored
     * (ISO-8601). Diagnostic: it is how far back the replayed schedule comes
     * from, which is what a support report needs and what `serverTime` on the
     * replayed body can no longer tell you.
     */
    cachedServerTime: string;
    /**
     * The daemon's estimate of server time now (ISO-8601), also written to
     * `serverTime` on the replayed body.
     *
     * Derived as `cachedServerTime + elapsed`, where `elapsed` is measured so it
     * can only ever increase: the maximum of an in-process monotonic reading and
     * a persisted wall-clock high-water mark. Within a running daemon, a backward
     * clock step cannot extend display. After restart, if the startup wall time
     * is behind that persisted local-time mark, elapsed downtime is unknown and
     * the daemon refuses offline replay until a fresh server response establishes
     * a new baseline. A consistently offset device clock still supports replay;
     * the comparison is between local readings, not local and server time.
     */
    effectiveServerTime: string;
}
/** Response header mirroring `offlineReplay`, for callers that do not parse the body. */
export declare const TOUCHPOINT_OFFLINE_REPLAY_HEADER = "x-od-touchpoint-offline";
/** The body field carrying {@link TouchpointOfflineReplay}. */
export declare const TOUCHPOINT_OFFLINE_REPLAY_FIELD = "offlineReplay";
/**
 * The server-authoritative schedule every cached decision must carry in full.
 *
 * "In full" is load-bearing: a record missing any one of these cannot be placed
 * on the timeline at all, so the daemon refuses to replay it rather than
 * guessing a bound. That is the "cache with no timing does not display" rule.
 */
export interface TouchpointSchedule {
    serverTime: string;
    startsAt: string;
    endsAt: string;
    authorizationExpiresAt: string;
}
/**
 * Which activity a cached decision is for.
 *
 * The first three name the DELIVERY (activity, deployment, content version) and
 * are what a withdrawal receipt is compared against before anything is
 * deleted, so a receipt for a different delivery can never take this one's
 * cache with it. `touchpointDecisionId` is the credential the delivery was
 * last granted under; it rotates on renewal and is carried, not compared.
 */
export interface TouchpointCachedIdentity {
    activityId: string;
    deploymentId: string;
    contentVersionId: string;
    touchpointDecisionId: string;
}
/** The withdrawal receipt the runtime returns with a 410. */
export interface TouchpointRevocationReceipt extends TouchpointCachedIdentity {
}
export declare const TOUCHPOINT_SCHEDULE_FIELDS: readonly ["serverTime", "startsAt", "endsAt", "authorizationExpiresAt"];
/**
 * The schedule of a decision body, or `null` when any part of it is missing or
 * unparseable.
 *
 * `endsAt` must be strictly after `startsAt`; a window that is empty or
 * inverted is not a schedule anyone can be inside, and treating it as one is
 * how a corrupt record turns into permanent display.
 */
export declare function touchpointScheduleOf(decision: unknown): TouchpointSchedule | null;
/** The activity identity of a decision body, or `null` when it is incomplete. */
export declare function touchpointCachedIdentityOf(decision: unknown): TouchpointCachedIdentity | null;
/** A withdrawal receipt body, or `null` when it is not one. */
export declare function touchpointRevocationReceiptOf(body: unknown): TouchpointRevocationReceipt | null;
/**
 * Whether a withdrawal receipt names the very delivery a cached record holds.
 *
 * Activity, deployment and content version have to agree. A receipt that
 * matches on activity but names another deployment or another content version
 * is about a different delivery of that activity, and deleting on it would
 * throw away a package that is still authorized — the "an unmatched receipt
 * must not delete someone else's activity" rule, stated once, here, so both
 * sides cannot drift.
 *
 * The decision credential is deliberately NOT compared. It rotates on every
 * renewal of the same delivery (OPEND-3374), and the mounted UI keeps the
 * credential it was first shown under, so the receipt the browser's
 * `activeDecisionId` elicits routinely names an older credential than the one
 * the cache last stored. Requiring it to agree would let a revoked delivery
 * survive on disk under its newer credential and replay on the next offline
 * start (OPEND-3436 AC6).
 */
export declare const touchpointReceiptMatches: (receipt: TouchpointRevocationReceipt, identity: TouchpointCachedIdentity) => boolean;
/**
 * Whether a 410 licenses destroying the cached package for the placement that
 * received it.
 *
 * The default is YES, and it is worth saying why, because the obvious rule —
 * "only delete on a receipt that matches" — is the one that leaves a withdrawn
 * campaign able to come back. A withdrawn DEPLOYMENT answers 410
 * `production_runtime_withdrawn` with no receipt at all, because there is no
 * longer a delivery to write one about; the browser already reads any 410 it
 * cannot parse a receipt out of as a withdrawal and clears the screen. If the
 * package survived that, the next offline start would replay the very activity
 * the server took down.
 *
 * The one exception is a READABLE receipt naming a different delivery. That is
 * the server answering about an aged `activeDecisionId` the client offered —
 * evidence that this 410 is about something other than what is stored — and
 * acting on it would throw away a package that is still authorized.
 *
 * A record with no identity cannot be compared against a receipt, so a
 * receipt-bearing 410 leaves it alone; it is unreplayable in any case.
 */
export declare function touchpointWithdrawalReclaims(body: unknown, identity: TouchpointCachedIdentity | null): boolean;
/**
 * Whether an activity may be displayed at `now`, given its schedule.
 *
 * `now` is the caller's EFFECTIVE server time, never a raw device clock. The
 * window is half-open — `startsAt <= now < endsAt` — so the instant `endsAt`
 * names is already outside it and an activity cannot be shown on the tick it
 * ends.
 */
export declare const touchpointScheduleAllowsDisplay: (schedule: TouchpointSchedule, now: number) => boolean;
/** Whether an activity's window has closed at `now`, which is what licenses deleting its cache. */
export declare const touchpointScheduleHasEnded: (schedule: TouchpointSchedule, now: number) => boolean;
/** The `offlineReplay` marker of a decision body, or `null` when the decision was live. */
export declare function touchpointOfflineReplayOf(decision: unknown): TouchpointOfflineReplay | null;
/**
 * Whether an HTTP status from the runtime means "temporarily unavailable".
 *
 * Only 5xx. Shared by the daemon (which replays cache on it) and the browser
 * (which enters offline fallback on it) so the two cannot disagree about what
 * counts as a network-class failure — a disagreement that would show up as the
 * browser polling a daemon that is answering from cache, or the daemon holding
 * cache the browser will not display.
 */
export declare const touchpointStatusIsTransient: (status: number) => boolean;
//# sourceMappingURL=touchpointOffline.d.ts.map