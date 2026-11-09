import { type TouchpointOfflineReplayReason } from '@open-design/contracts/api/touchpointOffline';
/**
 * Local store for touchpoint content bytes and the schedule they were
 * authorized under.
 *
 * It started (OPEND-3371) as a bandwidth optimization: hold the bytes of a
 * content package the daemon already downloaded so a steady-state production
 * refresh can ask Vela to omit them. OPEND-3436 added the second half —
 * the store now also holds the server's own `startsAt`/`endsAt`/`serverTime`/
 * `authorizationExpiresAt`, the activity/deployment/content identity, and the
 * decision envelope — so that a client which cannot reach the runtime at all
 * can go on showing the activity it was already authorized for, and stop the
 * moment that authorization runs out.
 *
 * Three layers:
 *
 *   - blobs, addressed by their own digest, so the four placements of one
 *     activity naturally share `shared.js` / `theme.css`;
 *   - an assembly record per (scope, placementKey, requested locale), naming
 *     the manifest, the entry, the path → digest map that puts a `content`
 *     object back together, and the schedule/identity above;
 *   - a scope directory per (environment, account), because a cache that one
 *     account can read into another's session is not a cache, it is a leak.
 *
 * What is deliberately NOT here: any opinion about WHICH activity should be
 * shown while the server is REACHABLE. The server re-decides that on every
 * request, so a cache can never pin a withdrawn or superseded activity onto
 * the screen. Offline is the one case where this store answers, and it answers
 * only from the last thing the server itself said, inside the window the server
 * itself set.
 *
 * Content assembly remains best-effort. Production authority admission requires
 * durable pre-dispatch evidence; a failed journal/ownership check refuses the
 * protected request. A content miss, an unreadable file, a
 * digest that does not match, a read-only data directory — each one returns
 * `null` (or does nothing) and the caller falls back to the full request it
 * would have made anyway after durable admission. No content failure alone
 * should suppress an otherwise authorized online campaign.
 */
/**
 * `scope` is the (environment, account) this record belongs to. It is opaque
 * here: the route computes it, this module only refuses to look across it.
 */
export type TouchpointContentKey = Readonly<{
    scope: string;
    placementKey: string;
    locale: string;
}>;
export type HeldContentRef = Readonly<{
    heldContentId: string;
    heldContentLocale: string;
}>;
export interface TouchpointContentCache {
    /** Durable operation marker BEFORE any production request, including events. */
    beginAuthority(scope: string): string | null;
    settleAuthority(scope: string, token: string): void;
    /** Stop mutations/timers and release OS ownership; pending evidence is retained. */
    close(): void;
    /** The (id, locale) pair to offer upstream for this placement, if one is fully held. */
    held(key: TouchpointContentKey): HeldContentRef | null;
    /** Persisted delivery credential for a cold recheck when no mounted caller supplies one. */
    activeDecisionId(key: TouchpointContentKey): string | null;
    /**
     * Rebuild a `contentOmitted` response into a full one, or `null` when the
     * bytes for `held` are not available. `held` is the pair THIS attempt offered
     * upstream; passing it is what binds the answer to the question it answers.
     *
     * A trimmed reply is still a complete server answer about schedule and
     * identity, so a successful rebuild also REPLACES the stored envelope,
     * schedule and identity with it, exactly as `remember` does for a full one.
     * Otherwise a renewal that shortened `endsAt` would be served online and
     * forgotten on disk, and the next offline start would replay the old window.
     */
    reassemble(key: TouchpointContentKey, held: HeldContentRef, trimmed: Record<string, unknown>, ticket?: number, requestElapsedMs?: number): Record<string, unknown> | null;
    /**
     * Record the content of a full response for later reassembly. Never throws.
     *
     * `ticket` is what {@link ticket} returned when the request that produced
     * `response` was sent; see there for why an answer must carry one.
     * `requestElapsedMs` measures from request start through body decoding with a
     * monotonic clock. It consumes schedule authority on full and trimmed replies.
     */
    remember(key: TouchpointContentKey, response: unknown, ticket?: number, requestElapsedMs?: number): void;
    /**
     * Stamp a request for this placement as it is sent, so the answer can later
     * be told apart from one that a 410 has since overtaken.
     *
     * The server-time fence in `remember` can only date a withdrawal it has a
     * stored record for; a 410 that arrives while the cache is empty, holds
     * another delivery, or carries no receipt at all leaves it nothing to date.
     * The ticket is local order instead: once a 410 for this placement has been
     * handled, an older request cannot persist the withdrawn delivery. A precise
     * receipt fences that delivery only; an unreadable receipt fences the placement.
     * Such answers are still served; only persisting their authority is refused.
     */
    ticket(key: TouchpointContentKey): number;
    /** Release the request-local fence after its response is classified or aborted. */
    finishTicket(ticket: number): void;
    /**
     * The whole decision to answer with while the runtime is unreachable, or
     * `null` when there is nothing this store may put on the screen.
     *
     * Also one of the moments expired records are reclaimed: a schedule that
     * has closed is deleted here rather than waiting for a network round trip
     * that, by definition, is not coming. The others are the expiry timer armed
     * at a record's known `endsAt` and the sweep run when the store is created.
     */
    replayOffline(key: TouchpointContentKey, reason: TouchpointOfflineReplayReason): Record<string, unknown> | null;
    /**
     * Act on a 410 the runtime returned for this placement, and report whether
     * the package was destroyed. `body` is the parsed 410 body, or `null` when it
     * could not be read; the rule for which of those reclaim lives in
     * `touchpointWithdrawalReclaims`.
     */
    forgetWithdrawn(key: TouchpointContentKey, body: unknown): boolean;
    /** Pause placement replay while a received 410 receipt is still being read. Idempotent release. */
    pauseReplay(key: TouchpointContentKey): () => void;
    /** Account authority is independent of whether this request assembles content. */
    refuseScope(scope: string): void;
    /** Retire display authority after authentication refusal or no decision; keep reusable bytes. */
    refuseReplay(key: TouchpointContentKey, status: 401 | 403 | 404): void;
}
/**
 * One content package is bounded by the same budget the web host enforces.
 *
 * Exported so the proxy that buffers a decision body sizes its own ceiling
 * against this number rather than inventing a second one: a body that cannot
 * fit this budget is not assemblable, whoever is measuring it.
 */
export declare const MAX_CONTENT_BYTES: number;
export declare function createTouchpointContentCache(runtimeDataDir: string): TouchpointContentCache;
