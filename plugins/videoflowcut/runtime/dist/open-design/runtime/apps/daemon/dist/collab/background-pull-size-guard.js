// Size guardrail for BACKGROUND shared-project content pulls (issue #6518,
// incident #6512): when a teammate publishes a project version, every member
// daemon proactively materializes the whole tree — hub push lane and catch-up
// sweep lane alike — with no upper bound. One 7442-file project put its full
// tree on every workspace member's disk. This guard sits in front of the
// background lanes only (`assessBackgroundContentPull` in
// proactive-content-pull.ts): it reads the version's manifest entry count
// through an authorize-only Vela probe — BEFORE any blob download — and
// defers versions above the threshold to the foreground open-project lane,
// which never consults it.
//
// Fail-closed direction (deliberately inverted relative to the other collab
// guards): "closed" here is PULL AS BEFORE. Deferring is the new behavior, so
// every uncertain answer — probe capability missing (old packaged CLI), no
// count in the output (old server), probe transport failure — degrades to the
// pre-guard pull. A project must never be left permanently unmaterialized
// because the CLI shipped inside an older client.
//
// Dedup model (mirrors the in-memory cursor/cooldown conventions of
// proactive-content-pull.ts): one probe per exact scope + version. A deferred
// version is remembered per scope, so repeated sweep rounds never re-issue
// the authorize call against the cloud; only a NEWER version re-probes. The
// marker never needs explicit retirement: once the foreground lane
// materializes the version, the durable cursor satisfies later background
// rounds before this guard is even consulted.
export const DEFAULT_BACKGROUND_PULL_MAX_ENTRIES = 2000;
export const BACKGROUND_PULL_MAX_ENTRIES_ENV = 'OD_COLLAB_BACKGROUND_PULL_MAX_ENTRIES';
export const BACKGROUND_PULL_MAX_CUMULATIVE_ENTRIES_ENV = 'OD_COLLAB_BACKGROUND_PULL_MAX_CUMULATIVE_ENTRIES';
/**
 * Per-process cumulative ceiling for background materialization. Defaults to
 * `0` (disabled), so this ships inert until a deliberate value is chosen —
 * picking that number is a capacity decision that needs production data on
 * real team sizes, not a default inferred from a synthetic workspace.
 */
export function backgroundPullMaxCumulativeEntriesFromEnv(env = process.env) {
    const raw = env[BACKGROUND_PULL_MAX_CUMULATIVE_ENTRIES_ENV]?.trim();
    if (!raw || !/^\d+$/u.test(raw))
        return 0;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}
/**
 * Threshold resolution: a non-negative integer from
 * `OD_COLLAB_BACKGROUND_PULL_MAX_ENTRIES`; `0` disables the guard entirely
 * (every background pull proceeds, probe never runs); anything invalid falls
 * back to the default so a typo can never silently disable the guardrail.
 */
export function backgroundPullMaxEntriesFromEnv(env = process.env) {
    const raw = env[BACKGROUND_PULL_MAX_ENTRIES_ENV]?.trim();
    if (!raw || !/^\d+$/u.test(raw))
        return DEFAULT_BACKGROUND_PULL_MAX_ENTRIES;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed >= 0
        ? parsed
        : DEFAULT_BACKGROUND_PULL_MAX_ENTRIES;
}
export function createBackgroundPullSizeGuard(deps) {
    /** Exact resource scope — the same tuple proactive-content-pull keys its
     *  cursors by. Two scopes may never share a decision. */
    const scopeKey = (scope) => JSON.stringify([
        scope.projectId,
        scope.workspaceId,
        scope.resourceTeamId,
        scope.viewerMemberId,
        scope.ownerMemberId,
    ]);
    /** Highest version deferred per scope. Same or older versions re-defer
     *  WITHOUT a probe; a newer version gets a fresh count. */
    const deferredVersions = new Map();
    /** Entries already cleared for background materialization this process. Only
     *  counted for decisions this guard actually allowed, so a project deferred
     *  for size never consumes budget it did not spend.
     *
     *  Accumulated whether or not a ceiling is set: with `maxCumulativeEntries`
     *  unset this number enforces nothing and exists purely to be reported, so
     *  the ceiling can be chosen from what real launches actually pull. */
    let cumulativeEntries = 0;
    /** Allowed decisions that carried a count, and those that did not. See
     *  `BackgroundPullVolume` for why the two must stay distinguishable. */
    let countedProjects = 0;
    let uncountedProjects = 0;
    /** Versions deferred because the session budget was spent. Kept apart from
     *  `deferredVersions` (which means "permanently too big") so the two reasons
     *  stay distinguishable, while both avoid re-probing. */
    const budgetDeferredVersions = new Map();
    /** Exact version whose probe last said 'pull', per scope. Retry loops for
     *  the same version must not re-authorize against the cloud. */
    const allowedVersions = new Map();
    /** Once the CLI proves it lacks the probe, stop probing for this daemon's
     *  lifetime — every decision is 'pull' (status quo) from then on. */
    let probeUnavailable = false;
    /** Concurrent lanes assessing the same scope+version share one probe. */
    const probesInFlight = new Map();
    const decide = async (scope, key, version) => {
        let inspection;
        try {
            inspection = await deps.inspect(scope, version);
        }
        catch (error) {
            // Transient probe failure: fail open into the pull and do NOT cache,
            // so the next round may still discover an oversized version.
            deps.onError?.(error);
            return 'pull';
        }
        if (inspection.kind === 'unavailable') {
            probeUnavailable = true;
            return 'pull';
        }
        if (inspection.kind === 'uncounted') {
            allowedVersions.set(key, version);
            uncountedProjects += 1;
            return 'pull';
        }
        // Per-project ceiling FIRST. Exceeding it is a permanent property of the
        // version, so it must be decided (and cached) regardless of how much
        // budget happens to remain — checking the budget first mislabelled an
        // oversized project as `budget-exhausted` whenever the remainder was
        // smaller than it, and cost a fresh probe on every later round because it
        // never reached the oversized cache.
        if (inspection.entryCount > deps.maxEntries) {
            const previous = deferredVersions.get(key);
            if (previous == null || version > previous) {
                deferredVersions.set(key, version);
            }
            try {
                deps.onDeferred?.({
                    projectId: scope.projectId,
                    workspaceId: scope.workspaceId,
                    version,
                    entryCount: inspection.entryCount,
                    maxEntries: deps.maxEntries,
                    reason: 'oversized',
                });
            }
            catch {
                // Observation must never affect the decision.
            }
            return 'defer';
        }
        const cumulativeLimit = deps.maxCumulativeEntries ?? 0;
        if (cumulativeLimit > 0 &&
            cumulativeEntries + inspection.entryCount > cumulativeLimit) {
            // Remembered like any other deferral. A budget deferral cannot change
            // until the process restarts, and every map here is process-local — so
            // caching it costs nothing on restart and saves an authorize-only probe
            // (plus a duplicate log line) on every subsequent catch-up round, which
            // otherwise repeat for as long as the head stays unmaterialized.
            budgetDeferredVersions.set(key, version);
            try {
                deps.onDeferred?.({
                    projectId: scope.projectId,
                    workspaceId: scope.workspaceId,
                    version,
                    entryCount: inspection.entryCount,
                    maxEntries: deps.maxEntries,
                    reason: 'budget-exhausted',
                });
            }
            catch {
                // Observation must never affect the decision.
            }
            return 'defer';
        }
        allowedVersions.set(key, version);
        // Unconditional: `cumulativeLimit` decides whether this number STOPS a
        // pull, never whether it is measured. Gating the counter on the ceiling
        // meant every default-configured client reported zero, which left the
        // ceiling unchoosable for exactly as long as it stayed unset.
        cumulativeEntries += inspection.entryCount;
        countedProjects += 1;
        return 'pull';
    };
    return {
        async assess(scope, version) {
            if (deps.maxEntries <= 0 ||
                probeUnavailable ||
                !Number.isSafeInteger(version) ||
                version < 0) {
                return 'pull';
            }
            const key = scopeKey(scope);
            const deferred = deferredVersions.get(key);
            if (deferred != null && version <= deferred)
                return 'defer';
            const budgetDeferred = budgetDeferredVersions.get(key);
            if (budgetDeferred != null && version <= budgetDeferred)
                return 'defer';
            if (allowedVersions.get(key) === version)
                return 'pull';
            const probeKey = `${key}#${version}`;
            const existing = probesInFlight.get(probeKey);
            if (existing)
                return existing;
            const probe = decide(scope, key, version);
            probesInFlight.set(probeKey, probe);
            const clear = () => {
                if (probesInFlight.get(probeKey) === probe) {
                    probesInFlight.delete(probeKey);
                }
            };
            void probe.then(clear, clear);
            return probe;
        },
        volume() {
            return {
                entries: cumulativeEntries,
                countedProjects,
                uncountedProjects,
            };
        },
    };
}
//# sourceMappingURL=background-pull-size-guard.js.map