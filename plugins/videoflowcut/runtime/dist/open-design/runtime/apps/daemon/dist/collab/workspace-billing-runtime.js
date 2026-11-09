const DEFAULT_POLL_INTERVAL_MS = 30_000;
const DEFAULT_REALTIME_POLL_FLOOR_MS = 5 * 60_000;
const DEFAULT_RETRY_DELAYS_MS = [5_000, 15_000, 30_000];
const DEFAULT_INTEREST_LEASE_MS = 60_000;
const DEFAULT_INTEREST_SWEEP_INTERVAL_MS = 5_000;
const DEFAULT_ENTRY_RETENTION_MS = 5 * 60_000;
const DEFAULT_MAX_CLIENTS = 64;
const DEFAULT_MAX_INTERESTS_PER_CLIENT = 16;
const DEFAULT_MAX_ENTRIES = 128;
const DEFAULT_MAX_CONCURRENT_REFRESHES = 4;
const DEFAULT_MAX_REFRESH_STARTS_PER_WINDOW = 8;
const DEFAULT_REFRESH_START_WINDOW_MS = 1_000;
const DEFAULT_HARD_TTL_MULTIPLIER = 4;
const MAX_RETIRED_REVISION_EPOCHS = 32;
const EMPTY_PROJECTION = {
    snapshot: null,
    workspaceBalance: null,
};
export class WorkspaceBillingInterestError extends Error {
    code;
    acceptedGeneration;
    constructor(code, acceptedGeneration) {
        super(code);
        this.code = code;
        this.acceptedGeneration = acceptedGeneration;
        this.name = 'WorkspaceBillingInterestError';
    }
}
export class WorkspaceBillingAccessRevokedError extends Error {
    code = 'workspace_not_authorized';
    constructor() {
        super('workspace billing access revoked');
        this.name = 'WorkspaceBillingAccessRevokedError';
    }
}
/**
 * Sole writer for exact workspace/member billing projections.
 *
 * Network reads, SSE events, reconnect hooks, and poll timers only submit
 * invalidations here. Per-key single-flight plus one trailing refresh prevents
 * event bursts from serializing unrelated work or allowing a late read for one
 * workspace/member to overwrite another.
 */
export class WorkspaceBillingRuntimeCoordinator {
    options;
    entries = new Map();
    clients = new Map();
    scheduler;
    pollIntervalMs;
    retryDelaysMs;
    interestLeaseMs;
    entryRetentionMs;
    maxClients;
    maxInterestsPerClient;
    maxEntries;
    softTtlMs;
    hardTtlMs;
    realtimePollFloorMs;
    realtimeHealthyWorkspaces = new Set();
    maxConcurrentRefreshes;
    maxRefreshStartsPerWindow;
    refreshStartWindowMs;
    refreshQueue = [];
    refreshStarts = [];
    activeRefreshes = 0;
    refreshQueueTimer = null;
    pollTimer;
    interestSweepTimer;
    disposed = false;
    constructor(options) {
        this.options = options;
        this.scheduler = options.scheduler ?? defaultScheduler();
        this.pollIntervalMs = Math.max(1, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
        this.retryDelaysMs =
            options.retryDelaysMs?.map((delay) => Math.max(0, delay)) ??
                DEFAULT_RETRY_DELAYS_MS;
        this.interestLeaseMs = Math.max(1, options.interestLeaseMs ?? DEFAULT_INTEREST_LEASE_MS);
        this.entryRetentionMs = Math.max(0, options.entryRetentionMs ?? DEFAULT_ENTRY_RETENTION_MS);
        this.maxClients = Math.max(1, options.maxClients ?? DEFAULT_MAX_CLIENTS);
        this.maxInterestsPerClient = Math.max(1, options.maxInterestsPerClient ?? DEFAULT_MAX_INTERESTS_PER_CLIENT);
        this.maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
        this.softTtlMs = Math.max(1, options.softTtlMs ?? this.pollIntervalMs);
        this.hardTtlMs = Math.max(this.softTtlMs, options.hardTtlMs ?? this.softTtlMs * DEFAULT_HARD_TTL_MULTIPLIER);
        this.realtimePollFloorMs = Math.max(this.softTtlMs, options.realtimePollFloorMs ?? DEFAULT_REALTIME_POLL_FLOOR_MS);
        this.maxConcurrentRefreshes = Math.max(1, options.maxConcurrentRefreshes ?? DEFAULT_MAX_CONCURRENT_REFRESHES);
        this.maxRefreshStartsPerWindow = Math.max(1, options.maxRefreshStartsPerWindow ?? DEFAULT_MAX_REFRESH_STARTS_PER_WINDOW);
        this.refreshStartWindowMs = Math.max(1, options.refreshStartWindowMs ?? DEFAULT_REFRESH_START_WINDOW_MS);
        this.pollTimer = this.scheduler.setInterval(() => {
            this.refreshAll('poll-floor');
        }, this.pollIntervalMs);
        this.pollTimer.unref?.();
        this.interestSweepTimer = this.scheduler.setInterval(() => {
            this.sweepExpiredInterests();
        }, Math.max(1, options.interestSweepIntervalMs ?? DEFAULT_INTEREST_SWEEP_INTERVAL_MS));
        this.interestSweepTimer.unref?.();
    }
    setClientInterests(input) {
        this.assertUsable();
        const clientId = input.clientId.trim();
        const generationText = input.clientGeneration.trim();
        if (!clientId || !/^(?:0|[1-9]\d*)$/.test(generationText)) {
            throw new WorkspaceBillingInterestError('invalid_generation');
        }
        const generation = BigInt(generationText);
        const current = this.clients.get(clientId);
        if (current && generation < current.generation) {
            throw new WorkspaceBillingInterestError('stale_generation', current.generation.toString());
        }
        const keys = new Map();
        for (const interest of input.interests) {
            const key = normalizeKey(interest);
            keys.set(runtimeKey(key), key);
        }
        if (keys.size > this.maxInterestsPerClient) {
            throw new WorkspaceBillingInterestError('interest_capacity_exceeded');
        }
        if (current && generation === current.generation) {
            if (!sameStringSet(current.keys, new Set(keys.keys()))) {
                throw new WorkspaceBillingInterestError('generation_payload_mismatch', current.generation.toString());
            }
            current.expiresAt = this.scheduler.now() + this.interestLeaseMs;
            return this.interestLease(clientId, current);
        }
        if (keys.size === 0) {
            if (current) {
                this.clients.delete(clientId);
                this.handleInterestMutation(current.keys, new Set());
            }
            return {
                clientId,
                acceptedGeneration: generation.toString(),
                leaseExpiresAt: new Date(this.scheduler.now()).toISOString(),
            };
        }
        if (!current && this.clients.size >= this.maxClients) {
            throw new WorkspaceBillingInterestError('interest_capacity_exceeded');
        }
        const prospectiveKeys = new Set([
            ...this.activeRuntimeKeysExcept(clientId),
            ...keys.keys(),
        ]);
        if (prospectiveKeys.size > this.maxEntries) {
            throw new WorkspaceBillingInterestError('interest_capacity_exceeded');
        }
        for (const key of keys.values())
            this.entryFor(key);
        this.clients.set(clientId, {
            generation,
            keys: new Set(keys.keys()),
            expiresAt: this.scheduler.now() + this.interestLeaseMs,
        });
        this.handleInterestMutation(current?.keys ?? new Set(), new Set(keys.keys()));
        return this.interestLease(clientId, this.clients.get(clientId));
    }
    releaseClientInterests(clientIdInput, generationText) {
        this.assertUsable();
        const clientId = clientIdInput.trim();
        const current = this.clients.get(clientId);
        if (!current)
            return false;
        if (generationText != null) {
            const requested = generationText.trim();
            if (!/^(?:0|[1-9]\d*)$/.test(requested)) {
                throw new WorkspaceBillingInterestError('invalid_generation');
            }
            if (BigInt(requested) < current.generation)
                return false;
        }
        this.clients.delete(clientId);
        this.handleInterestMutation(current.keys, new Set());
        return true;
    }
    interestedKeys() {
        this.sweepExpiredInterests();
        const keys = new Set();
        for (const interest of this.clients.values()) {
            for (const key of interest.keys)
                keys.add(key);
        }
        for (const entry of this.entries.values()) {
            if (entry.legacyInterestExpiresAt != null &&
                entry.legacyInterestExpiresAt > this.scheduler.now()) {
                keys.add(runtimeKey(entry.key));
            }
        }
        return [...keys]
            .map((key) => this.entries.get(key)?.key)
            .filter((key) => Boolean(key))
            .map((key) => ({ ...key }));
    }
    /**
     * Fence all projections and leases created under a previous AMR profile.
     * In-flight reads are allowed to settle, but their incremented attempt token
     * prevents them from publishing into the new environment.
     */
    resetIdentity() {
        this.assertUsable();
        this.clients.clear();
        this.realtimeHealthyWorkspaces.clear();
        if (this.refreshQueueTimer)
            this.scheduler.clearTimeout(this.refreshQueueTimer);
        this.refreshQueueTimer = null;
        this.refreshQueue.length = 0;
        for (const entry of this.entries.values()) {
            entry.attempt += 1n;
            entry.inFlight = null;
            entry.queued = false;
            entry.queuedReason = null;
            entry.pending = false;
            entry.pendingReason = null;
            if (entry.retryTimer)
                this.scheduler.clearTimeout(entry.retryTimer);
            entry.retryTimer = null;
            entry.retryAt = null;
            entry.legacyInterestExpiresAt = null;
            entry.projection = EMPTY_PROJECTION;
            entry.status = 'loading';
            entry.errorCode = null;
            entry.reason = 'workspace-identity-changed';
            entry.observedAt = null;
            entry.revision += 1n;
            this.resolveWaiters(entry);
        }
        this.entries.clear();
        this.publishInterestSet();
    }
    async read(keyInput, options = {}) {
        this.assertUsable();
        const key = normalizeKey(keyInput);
        const entry = this.entryFor(key);
        const forceForInterest = this.acceptClientInterest(entry, options);
        const requireFresh = options.requireFresh === true;
        const softTtlMs = this.effectiveSoftTtlMs(entry);
        if (entry.status === 'fresh' &&
            entry.observedAt != null &&
            this.scheduler.now() - entry.observedAt >= softTtlMs) {
            this.markStatus(entry, 'stale', 'soft-ttl-expired');
        }
        if (entry.retryTimer && !forceForInterest && !requireFresh) {
            return this.result(entry);
        }
        if (requireFresh ||
            entry.status !== 'fresh' ||
            entry.observedAt == null ||
            this.scheduler.now() - entry.observedAt >= softTtlMs ||
            forceForInterest) {
            this.requestRefresh(entry, options.reason ?? 'explicit-read', forceForInterest || requireFresh);
            await this.waitForIdle(entry);
        }
        if (requireFresh && entry.status !== 'fresh') {
            throw Object.assign(new Error(entry.errorCode ?? 'workspace_billing_authoritative_unavailable'), {
                code: entry.errorCode ?? 'workspace_billing_authoritative_unavailable',
            });
        }
        return this.result(entry);
    }
    invalidate(invalidation) {
        if (this.disposed)
            return;
        const workspaceId = invalidation.workspaceId?.trim() ?? '';
        const workspaceMemberId = invalidation.workspaceMemberId?.trim() ?? '';
        for (const entry of this.entries.values()) {
            if (workspaceId && entry.key.workspaceId !== workspaceId)
                continue;
            if (!this.hasActiveInterest(entry))
                continue;
            if (invalidation.domain === 'wallet') {
                if (!workspaceId || !workspaceMemberId)
                    continue;
                if (entry.key.workspaceMemberId !== workspaceMemberId)
                    continue;
            }
            if (entry.status === 'access-revoked')
                continue;
            const revisionClock = normalizeRevisionClock(invalidation.revisionClock);
            const clockDomain = invalidation.domain === 'wallet' ? 'wallet' : 'subscription';
            const previousClock = entry.sourceRevisionClocks[clockDomain];
            const revisionResult = revisionClock
                ? acceptFencedSourceRevisionClock(previousClock, revisionClock, entry.retiredRevisionClockEpochs[clockDomain])
                : acceptSourceRevision(entry.sourceRevisions[invalidation.domain], invalidation.revision);
            if (!revisionResult.accepted)
                continue;
            if (revisionClock) {
                if (clockDomain === 'subscription') {
                    // Current producers emit one subscription write as both the v2
                    // event and its legacy billing alias. A valid billing clock is the
                    // shared identity across those aliases, independent of arrival
                    // order, so the second frame must not schedule a trailing refresh.
                    entry.sourceRevisionClocks.subscription = revisionClock;
                    entry.sourceRevisionClocks.legacy = revisionClock;
                }
                else {
                    entry.sourceRevisionClocks.wallet = revisionClock;
                }
            }
            else if (invalidation.revision) {
                entry.sourceRevisions[invalidation.domain] = invalidation.revision;
            }
            entry.sourceGapDetected = revisionResult.gap;
            const reason = revisionResult.gap
                ? 'revision-gap'
                : revisionResult.epochChanged
                    ? 'revision-epoch-change'
                    : invalidation.reason ?? `${invalidation.domain}-invalidation`;
            this.markStatus(entry, hasProjection(entry) ? 'stale' : 'loading', reason);
            this.requestRefresh(entry, reason, true);
        }
    }
    reconnect(workspaceId) {
        if (this.disposed)
            return;
        const requested = workspaceId?.trim() ?? '';
        for (const entry of this.entries.values()) {
            if (requested && entry.key.workspaceId !== requested)
                continue;
            if (!this.hasActiveInterest(entry))
                continue;
            if (entry.status === 'access-revoked')
                continue;
            this.markStatus(entry, hasProjection(entry) ? 'stale' : 'loading', 'reconnect');
            this.requestRefresh(entry, 'reconnect', true);
        }
    }
    setRealtimeHealthy(workspaceId, healthy) {
        if (this.disposed)
            return;
        const requested = workspaceId.trim();
        if (!requested)
            return;
        if (healthy) {
            this.realtimeHealthyWorkspaces.add(requested);
            return;
        }
        if (!this.realtimeHealthyWorkspaces.delete(requested))
            return;
        // A disconnect or source-health downgrade immediately restores the
        // authoritative fallback and refreshes the last-good projection.
        this.reconnect(requested);
    }
    refreshAll(reason = 'catch-up') {
        if (this.disposed)
            return;
        for (const entry of this.entries.values()) {
            if (!this.hasActiveInterest(entry))
                continue;
            if (entry.status === 'access-revoked')
                continue;
            if (reason === 'poll-floor' && entry.retryTimer)
                continue;
            if (reason === 'poll-floor' &&
                this.realtimeHealthyWorkspaces.has(entry.key.workspaceId) &&
                entry.observedAt != null &&
                this.scheduler.now() - entry.observedAt < this.realtimePollFloorMs) {
                this.options.onPollSuppressed?.();
                continue;
            }
            this.markStatus(entry, hasProjection(entry) ? 'stale' : 'loading', reason);
            this.requestRefresh(entry, reason, true);
        }
    }
    markWorkspaceUnavailable(workspaceId, error = 'workspace_directory_unavailable') {
        const requested = workspaceId.trim();
        if (!requested)
            return;
        for (const entry of this.entries.values()) {
            if (entry.key.workspaceId !== requested || entry.status === 'access-revoked')
                continue;
            if (entry.status === 'error' &&
                entry.errorCode === error &&
                entry.retryTimer) {
                continue;
            }
            entry.status = 'error';
            entry.errorCode = error;
            entry.reason = error;
            entry.revision += 1n;
            this.scheduleRetry(entry);
            this.publish(entry);
        }
    }
    revokeWorkspace(workspaceId, reason = 'workspace-not-authorized') {
        const requested = workspaceId.trim();
        if (!requested)
            return;
        this.realtimeHealthyWorkspaces.delete(requested);
        for (const entry of this.entries.values()) {
            if (entry.key.workspaceId !== requested)
                continue;
            this.revokeEntry(entry, reason);
        }
    }
    retainWorkspaceMember(workspaceId, workspaceMemberId) {
        const requestedWorkspaceId = workspaceId.trim();
        const requestedMemberId = workspaceMemberId.trim();
        if (!requestedWorkspaceId || !requestedMemberId)
            return;
        for (const entry of this.entries.values()) {
            if (entry.key.workspaceId === requestedWorkspaceId &&
                entry.key.workspaceMemberId !== requestedMemberId) {
                this.revokeEntry(entry, 'workspace-member-changed');
            }
        }
    }
    authorizeWorkspaceMember(keyInput) {
        const key = normalizeKey(keyInput);
        const entry = this.entries.get(runtimeKey(key));
        if (!entry || entry.status !== 'access-revoked')
            return;
        entry.status = 'loading';
        entry.errorCode = null;
        entry.reason = 'membership-reauthorized';
        entry.observedAt = null;
        entry.revision += 1n;
        this.publish(entry);
    }
    peek(keyInput) {
        const key = normalizeKey(keyInput);
        const entry = this.entries.get(runtimeKey(key));
        return entry ? this.result(entry) : null;
    }
    peekForClient(clientId, workspaceId) {
        const interest = this.clients.get(clientId.trim());
        if (!interest)
            return null;
        const requestedWorkspaceId = workspaceId.trim();
        const key = [...interest.keys].find((candidate) => this.entries.get(candidate)?.key.workspaceId === requestedWorkspaceId);
        const entry = key ? this.entries.get(key) : null;
        if (!entry)
            return null;
        return this.result(entry);
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.scheduler.clearInterval(this.pollTimer);
        this.scheduler.clearInterval(this.interestSweepTimer);
        if (this.refreshQueueTimer)
            this.scheduler.clearTimeout(this.refreshQueueTimer);
        this.refreshQueueTimer = null;
        this.refreshQueue.length = 0;
        for (const entry of this.entries.values()) {
            if (entry.retryTimer)
                this.scheduler.clearTimeout(entry.retryTimer);
            entry.retryTimer = null;
            entry.queued = false;
            entry.queuedReason = null;
            entry.pending = false;
            this.resolveWaiters(entry);
        }
        this.entries.clear();
        this.clients.clear();
        this.realtimeHealthyWorkspaces.clear();
    }
    acceptClientInterest(entry, options) {
        const clientId = options.clientId?.trim() ?? '';
        const generationText = options.clientGeneration?.trim() ?? '';
        if (!clientId && !generationText) {
            const wasInterested = this.hasActiveInterest(entry);
            entry.legacyInterestExpiresAt = this.scheduler.now() + this.interestLeaseMs;
            entry.uninterestedAt = null;
            if (!wasInterested)
                this.publishInterestSet();
            return false;
        }
        if (!clientId || !/^(?:0|[1-9]\d*)$/.test(generationText)) {
            throw new WorkspaceBillingInterestError('invalid_generation');
        }
        const generation = BigInt(generationText);
        const keyText = runtimeKey(entry.key);
        const current = this.clients.get(clientId);
        if (current) {
            if (generation < current.generation) {
                throw new WorkspaceBillingInterestError('stale_generation', current.generation.toString());
            }
            if (generation === current.generation) {
                if (!current.keys.has(keyText)) {
                    throw new WorkspaceBillingInterestError('generation_payload_mismatch', current.generation.toString());
                }
                current.expiresAt = this.scheduler.now() + this.interestLeaseMs;
                return false;
            }
        }
        this.setClientInterests({
            clientId,
            clientGeneration: generationText,
            interests: [entry.key],
        });
        return current != null;
    }
    entryFor(key) {
        const keyText = runtimeKey(key);
        const existing = this.entries.get(keyText);
        if (existing)
            return existing;
        this.evictUninterestedEntries();
        if (this.entries.size >= this.maxEntries) {
            throw new WorkspaceBillingInterestError('interest_capacity_exceeded');
        }
        const entry = {
            key,
            legacyInterestExpiresAt: null,
            uninterestedAt: this.scheduler.now(),
            projection: EMPTY_PROJECTION,
            status: 'loading',
            revision: 0n,
            observedAt: null,
            retryAt: null,
            errorCode: null,
            reason: 'first-interest',
            sourceGapDetected: false,
            sourceRevisions: {},
            sourceRevisionClocks: {},
            retiredRevisionClockEpochs: {
                subscription: new Set(),
                wallet: new Set(),
            },
            inFlight: null,
            queued: false,
            queuedReason: null,
            pending: false,
            pendingReason: null,
            attempt: 0n,
            retryAttempt: 0,
            retryTimer: null,
            waiters: [],
        };
        this.entries.set(keyText, entry);
        return entry;
    }
    hasActiveInterest(entry) {
        if (entry.legacyInterestExpiresAt != null &&
            entry.legacyInterestExpiresAt > this.scheduler.now()) {
            return true;
        }
        const keyText = runtimeKey(entry.key);
        for (const interest of this.clients.values()) {
            if (interest.expiresAt > this.scheduler.now() &&
                interest.keys.has(keyText))
                return true;
        }
        return false;
    }
    quietIfUninterested(entry) {
        if (this.hasActiveInterest(entry))
            return;
        if (entry.retryTimer)
            this.scheduler.clearTimeout(entry.retryTimer);
        entry.retryTimer = null;
        entry.retryAt = null;
        const canceledQueuedRead = this.removeQueuedEntry(entry);
        entry.pending = false;
        entry.pendingReason = null;
        entry.uninterestedAt ??= this.scheduler.now();
        if (canceledQueuedRead && !entry.inFlight)
            this.resolveWaiters(entry);
    }
    activeRuntimeKeysExcept(excludedClientId) {
        const keys = new Set();
        const now = this.scheduler.now();
        for (const [clientId, interest] of this.clients) {
            if (clientId === excludedClientId || interest.expiresAt <= now)
                continue;
            for (const key of interest.keys)
                keys.add(key);
        }
        for (const entry of this.entries.values()) {
            if (entry.legacyInterestExpiresAt != null &&
                entry.legacyInterestExpiresAt > now) {
                keys.add(runtimeKey(entry.key));
            }
        }
        return keys;
    }
    handleInterestMutation(previous, next) {
        for (const key of previous) {
            if (next.has(key))
                continue;
            const entry = this.entries.get(key);
            if (entry)
                this.quietIfUninterested(entry);
        }
        for (const key of next) {
            const entry = this.entries.get(key);
            if (entry)
                entry.uninterestedAt = null;
        }
        this.publishInterestSet();
    }
    sweepExpiredInterests() {
        if (this.disposed)
            return;
        const now = this.scheduler.now();
        let mutated = false;
        for (const [clientId, interest] of this.clients) {
            if (interest.expiresAt > now)
                continue;
            this.clients.delete(clientId);
            for (const key of interest.keys) {
                const entry = this.entries.get(key);
                if (entry)
                    this.quietIfUninterested(entry);
            }
            mutated = true;
        }
        for (const entry of this.entries.values()) {
            if (entry.legacyInterestExpiresAt != null &&
                entry.legacyInterestExpiresAt <= now) {
                entry.legacyInterestExpiresAt = null;
                this.quietIfUninterested(entry);
                mutated = true;
            }
        }
        this.evictUninterestedEntries();
        if (mutated)
            this.publishInterestSet();
    }
    evictUninterestedEntries() {
        const now = this.scheduler.now();
        const candidates = [...this.entries.entries()]
            .filter(([, entry]) => !this.hasActiveInterest(entry) && !entry.inFlight && !entry.queued)
            .sort(([, left], [, right]) => (left.uninterestedAt ?? left.observedAt ?? 0) -
            (right.uninterestedAt ?? right.observedAt ?? 0));
        for (const [key, entry] of candidates) {
            const inactiveAt = entry.uninterestedAt ?? entry.observedAt ?? now;
            const overCapacity = this.entries.size >= this.maxEntries;
            if (!overCapacity && now - inactiveAt < this.entryRetentionMs)
                continue;
            if (entry.retryTimer)
                this.scheduler.clearTimeout(entry.retryTimer);
            this.entries.delete(key);
        }
    }
    publishInterestSet() {
        this.options.onInterestSetChange?.(this.interestedKeysWithoutSweep());
    }
    interestedKeysWithoutSweep() {
        const keys = new Set();
        const now = this.scheduler.now();
        for (const interest of this.clients.values()) {
            if (interest.expiresAt <= now)
                continue;
            for (const key of interest.keys)
                keys.add(key);
        }
        for (const entry of this.entries.values()) {
            if (entry.legacyInterestExpiresAt != null &&
                entry.legacyInterestExpiresAt > now) {
                keys.add(runtimeKey(entry.key));
            }
        }
        return [...keys]
            .map((key) => this.entries.get(key)?.key)
            .filter((key) => Boolean(key))
            .map((key) => ({ ...key }));
    }
    interestLease(clientId, interest) {
        return {
            clientId,
            acceptedGeneration: interest.generation.toString(),
            leaseExpiresAt: new Date(interest.expiresAt).toISOString(),
        };
    }
    requestRefresh(entry, reason, force) {
        if (entry.status === 'access-revoked')
            return;
        if (entry.inFlight) {
            if (force) {
                entry.pending = true;
                entry.pendingReason = strongerReason(entry.pendingReason, reason);
            }
            return;
        }
        if (entry.queued) {
            entry.queuedReason = strongerReason(entry.queuedReason, reason);
            return;
        }
        entry.queued = true;
        entry.queuedReason = reason;
        this.refreshQueue.push(entry);
        this.drainRefreshQueue();
    }
    drainRefreshQueue() {
        if (this.disposed)
            return;
        if (this.refreshQueueTimer) {
            this.scheduler.clearTimeout(this.refreshQueueTimer);
            this.refreshQueueTimer = null;
        }
        const now = this.scheduler.now();
        while (this.refreshStarts.length > 0 &&
            now - this.refreshStarts[0] >= this.refreshStartWindowMs) {
            this.refreshStarts.shift();
        }
        while (this.activeRefreshes < this.maxConcurrentRefreshes &&
            this.refreshStarts.length < this.maxRefreshStartsPerWindow) {
            const entry = this.refreshQueue.shift();
            if (!entry)
                break;
            if (!entry.queued)
                continue;
            entry.queued = false;
            const reason = entry.queuedReason ?? 'queued-refresh';
            entry.queuedReason = null;
            if (entry.status === 'access-revoked' || !this.hasActiveInterest(entry)) {
                this.resolveWaiters(entry);
                continue;
            }
            this.activeRefreshes += 1;
            this.refreshStarts.push(this.scheduler.now());
            this.startRefresh(entry, reason);
        }
        if (this.refreshQueue.some((entry) => entry.queued) &&
            this.activeRefreshes < this.maxConcurrentRefreshes &&
            this.refreshStarts.length >= this.maxRefreshStartsPerWindow) {
            const delay = Math.max(1, this.refreshStartWindowMs -
                (this.scheduler.now() - this.refreshStarts[0]));
            this.refreshQueueTimer = this.scheduler.setTimeout(() => {
                this.refreshQueueTimer = null;
                this.drainRefreshQueue();
            }, delay);
            this.refreshQueueTimer.unref?.();
        }
    }
    startRefresh(entry, reason) {
        if (this.disposed)
            return;
        if (entry.retryTimer) {
            this.scheduler.clearTimeout(entry.retryTimer);
            entry.retryTimer = null;
            entry.retryAt = null;
        }
        const attempt = ++entry.attempt;
        const refresh = Promise.resolve()
            .then(() => this.options.fetchProjection(entry.key))
            .then((projection) => {
            if (entry.attempt !== attempt || this.disposed)
                return;
            validateProjectionScope(entry.key, projection);
            validateProjectionRevision(entry, projection);
            recordProjectionRevisions(entry, projection);
            entry.projection = cloneProjection(projection);
            entry.observedAt = this.scheduler.now();
            entry.retryAt = null;
            entry.errorCode = null;
            entry.retryAttempt = 0;
            entry.revision += 1n;
            entry.status = 'fresh';
            entry.reason = reason;
            this.publish(entry);
        })
            .catch((error) => {
            if (entry.attempt !== attempt || this.disposed)
                return;
            const code = errorCode(error);
            if (isAccessRevokedError(error)) {
                this.revokeEntry(entry, code);
                try {
                    this.options.onAccessRevoked?.({ ...entry.key }, error);
                }
                catch {
                    // Revocation is already committed locally; observers are best-effort.
                }
                return;
            }
            entry.status = 'error';
            entry.errorCode = code;
            entry.reason = reason;
            entry.revision += 1n;
            this.scheduleRetry(entry);
            this.publish(entry);
        })
            .finally(() => {
            this.activeRefreshes = Math.max(0, this.activeRefreshes - 1);
            if (entry.attempt !== attempt) {
                this.drainRefreshQueue();
                return;
            }
            entry.inFlight = null;
            if (entry.pending && !this.disposed && entry.status !== 'access-revoked') {
                const trailingReason = entry.pendingReason ?? 'trailing-invalidation';
                entry.pending = false;
                entry.pendingReason = null;
                this.requestRefresh(entry, trailingReason, true);
                this.drainRefreshQueue();
                return;
            }
            this.resolveWaiters(entry);
            this.drainRefreshQueue();
        });
        entry.inFlight = refresh;
        this.markStatus(entry, hasProjection(entry) ? 'refreshing' : 'loading', reason);
    }
    scheduleRetry(entry) {
        if (entry.retryTimer || this.retryDelaysMs.length === 0 || this.disposed)
            return;
        if (entry.retryAttempt >= this.retryDelaysMs.length)
            return;
        const delay = this.retryDelaysMs[entry.retryAttempt];
        entry.retryAttempt += 1;
        entry.retryAt = this.scheduler.now() + delay;
        entry.retryTimer = this.scheduler.setTimeout(() => {
            entry.retryTimer = null;
            entry.retryAt = null;
            if (entry.status === 'access-revoked' || this.disposed)
                return;
            this.requestRefresh(entry, 'bounded-retry', true);
        }, delay);
        entry.retryTimer.unref?.();
    }
    revokeEntry(entry, reason) {
        const keyText = runtimeKey(entry.key);
        let interestChanged = entry.legacyInterestExpiresAt != null;
        entry.legacyInterestExpiresAt = null;
        for (const [clientId, interest] of this.clients) {
            if (!interest.keys.delete(keyText))
                continue;
            interestChanged = true;
            if (interest.keys.size === 0)
                this.clients.delete(clientId);
        }
        entry.attempt += 1n;
        entry.inFlight = null;
        this.removeQueuedEntry(entry);
        entry.pending = false;
        entry.pendingReason = null;
        if (entry.retryTimer)
            this.scheduler.clearTimeout(entry.retryTimer);
        entry.retryTimer = null;
        entry.retryAt = null;
        entry.projection = EMPTY_PROJECTION;
        entry.status = 'access-revoked';
        entry.errorCode = 'workspace_not_authorized';
        entry.reason = reason;
        entry.observedAt = this.scheduler.now();
        entry.revision += 1n;
        this.publish(entry);
        this.resolveWaiters(entry);
        this.quietIfUninterested(entry);
        if (interestChanged)
            this.publishInterestSet();
    }
    removeQueuedEntry(entry) {
        const wasQueued = entry.queued;
        entry.queued = false;
        entry.queuedReason = null;
        for (let index = this.refreshQueue.length - 1; index >= 0; index -= 1) {
            if (this.refreshQueue[index] === entry)
                this.refreshQueue.splice(index, 1);
        }
        return wasQueued;
    }
    markStatus(entry, status, reason) {
        if (entry.status === status && entry.reason === reason)
            return;
        entry.status = status;
        entry.reason = reason;
        entry.revision += 1n;
        this.publish(entry);
    }
    waitForIdle(entry) {
        if (!entry.inFlight && !entry.queued && !entry.pending)
            return Promise.resolve();
        return new Promise((resolve) => {
            entry.waiters.push(resolve);
        });
    }
    resolveWaiters(entry) {
        const waiters = entry.waiters.splice(0);
        for (const resolve of waiters)
            resolve();
    }
    result(entry) {
        return {
            projection: this.isHardExpired(entry)
                ? EMPTY_PROJECTION
                : cloneProjection(entry.projection),
            state: this.state(entry),
        };
    }
    state(entry) {
        const softTtlMs = this.effectiveSoftTtlMs(entry);
        const hardTtlMs = this.effectiveHardTtlMs(entry);
        return {
            workspaceId: entry.key.workspaceId,
            workspaceMemberId: entry.key.workspaceMemberId,
            status: entry.status,
            revision: entry.revision.toString(),
            observedAt: timestamp(entry.observedAt),
            softExpiresAt: timestamp(entry.observedAt == null ? null : entry.observedAt + softTtlMs),
            hardExpiresAt: timestamp(entry.observedAt == null ? null : entry.observedAt + hardTtlMs),
            retryAt: timestamp(entry.retryAt),
            errorCode: entry.errorCode,
            reason: entry.reason,
            sourceGapDetected: entry.sourceGapDetected,
        };
    }
    publish(entry) {
        this.options.onStateChange?.(this.state(entry));
    }
    isHardExpired(entry) {
        return (entry.observedAt != null &&
            this.scheduler.now() - entry.observedAt >= this.effectiveHardTtlMs(entry));
    }
    effectiveSoftTtlMs(entry) {
        return this.realtimeHealthyWorkspaces.has(entry.key.workspaceId)
            ? this.realtimePollFloorMs
            : this.softTtlMs;
    }
    effectiveHardTtlMs(entry) {
        return this.realtimeHealthyWorkspaces.has(entry.key.workspaceId)
            ? Math.max(this.hardTtlMs, this.realtimePollFloorMs * 2)
            : this.hardTtlMs;
    }
    assertUsable() {
        if (this.disposed)
            throw new Error('workspace billing runtime is disposed');
    }
}
export function createWorkspaceBillingRuntimeCoordinator(options) {
    return new WorkspaceBillingRuntimeCoordinator(options);
}
export function shouldEmitWorkspaceBillingRuntimeNudge(state) {
    if (state.status === 'loading' ||
        state.status === 'stale' ||
        state.status === 'refreshing') {
        return false;
    }
    switch (state.reason) {
        case 'explicit-billing-read':
        case 'vela-billing-changed':
        case 'vela-billing-subscription-changed':
        case 'vela-wallet-balance-changed':
            return false;
        default:
            return true;
    }
}
function defaultScheduler() {
    return {
        now: () => Date.now(),
        setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
        clearTimeout: (timer) => clearTimeout(timer),
        setInterval: (callback, delayMs) => setInterval(callback, delayMs),
        clearInterval: (timer) => clearInterval(timer),
    };
}
function normalizeKey(input) {
    const workspaceId = input.workspaceId.trim();
    const workspaceMemberId = input.workspaceMemberId.trim();
    if (!workspaceId || !workspaceMemberId) {
        throw new Error('workspace billing runtime requires workspace and member identity');
    }
    return { workspaceId, workspaceMemberId };
}
function runtimeKey(key) {
    return `${key.workspaceId}\0${key.workspaceMemberId}`;
}
function sameStringSet(left, right) {
    if (left.size !== right.size)
        return false;
    for (const value of left) {
        if (!right.has(value))
            return false;
    }
    return true;
}
function hasProjection(entry) {
    return Boolean(entry.projection.snapshot || entry.projection.workspaceBalance);
}
function validateProjectionScope(key, projection) {
    const snapshot = projection.snapshot;
    const balance = projection.workspaceBalance;
    if (!snapshot && !balance)
        throw new Error('workspace_billing_unavailable');
    if (snapshot &&
        (snapshot.billingScopeVersion !== 2 ||
            snapshot.workspaceId !== key.workspaceId ||
            snapshot.workspaceMemberId !== key.workspaceMemberId)) {
        throw Object.assign(new Error('workspace billing scope mismatch'), {
            code: 'workspace_billing_scope_mismatch',
        });
    }
    if (balance &&
        (balance.billingScopeVersion !== 2 ||
            balance.workspaceId !== key.workspaceId ||
            balance.workspaceMemberId !== key.workspaceMemberId)) {
        throw Object.assign(new Error('workspace billing scope mismatch'), {
            code: 'workspace_billing_scope_mismatch',
        });
    }
}
function validateProjectionRevision(entry, projection) {
    const snapshot = projection.snapshot;
    if (!snapshot)
        return;
    const expectedBilling = entry.sourceRevisions.subscription ?? entry.sourceRevisions.legacy;
    const expectedWallet = entry.sourceRevisions.wallet;
    const expectedBillingClock = entry.sourceRevisionClocks.subscription ?? entry.sourceRevisionClocks.legacy;
    const expectedWalletClock = entry.sourceRevisionClocks.wallet;
    const actualBillingClock = normalizeRevisionClock(snapshot.revisionClocks?.billing);
    const actualWalletClock = normalizeRevisionClock(snapshot.revisionClocks?.wallet);
    const previousSnapshot = entry.projection.snapshot;
    const previousBillingClock = normalizeRevisionClock(previousSnapshot?.revisionClocks?.billing);
    const previousWalletClock = normalizeRevisionClock(previousSnapshot?.revisionClocks?.wallet);
    const billingClockComparable = Boolean(expectedBillingClock && actualBillingClock);
    const walletClockComparable = Boolean(expectedWalletClock && actualWalletClock);
    if ((expectedBillingClock &&
        actualBillingClock &&
        fencedRevisionClockIsBehind(actualBillingClock, expectedBillingClock, previousBillingClock, entry.retiredRevisionClockEpochs.subscription)) ||
        (expectedWalletClock &&
            actualWalletClock &&
            fencedRevisionClockIsBehind(actualWalletClock, expectedWalletClock, previousWalletClock, entry.retiredRevisionClockEpochs.wallet)) ||
        (!billingClockComparable &&
            revisionIsBehind(snapshot.revisions.billing, expectedBilling)) ||
        (!walletClockComparable &&
            revisionIsBehind(snapshot.revisions.wallet, expectedWallet))) {
        throw Object.assign(new Error('workspace billing revision not caught up'), {
            code: 'workspace_billing_revision_not_caught_up',
        });
    }
}
function recordProjectionRevisions(entry, projection) {
    const snapshot = projection.snapshot;
    if (!snapshot)
        return;
    const billingClock = normalizeRevisionClock(snapshot.revisionClocks?.billing);
    const walletClock = normalizeRevisionClock(snapshot.revisionClocks?.wallet);
    const previousSnapshot = entry.projection.snapshot;
    const previousBillingClock = normalizeRevisionClock(previousSnapshot?.revisionClocks?.billing);
    const previousWalletClock = normalizeRevisionClock(previousSnapshot?.revisionClocks?.wallet);
    if (billingClock) {
        retireRevisionClockEpoch(entry.retiredRevisionClockEpochs.subscription, previousBillingClock, billingClock);
        retireRevisionClockEpoch(entry.retiredRevisionClockEpochs.subscription, entry.sourceRevisionClocks.subscription ??
            entry.sourceRevisionClocks.legacy ??
            null, billingClock);
        entry.sourceRevisionClocks.subscription = billingClock;
        entry.sourceRevisionClocks.legacy = billingClock;
    }
    if (walletClock) {
        retireRevisionClockEpoch(entry.retiredRevisionClockEpochs.wallet, previousWalletClock, walletClock);
        retireRevisionClockEpoch(entry.retiredRevisionClockEpochs.wallet, entry.sourceRevisionClocks.wallet ?? null, walletClock);
        entry.sourceRevisionClocks.wallet = walletClock;
    }
    if (revisionCanAdvance(entry.sourceRevisions.subscription, snapshot.revisions.billing)) {
        entry.sourceRevisions.subscription = snapshot.revisions.billing;
    }
    if (revisionCanAdvance(entry.sourceRevisions.legacy, snapshot.revisions.billing)) {
        entry.sourceRevisions.legacy = snapshot.revisions.billing;
    }
    if (revisionCanAdvance(entry.sourceRevisions.wallet, snapshot.revisions.wallet)) {
        entry.sourceRevisions.wallet = snapshot.revisions.wallet;
    }
}
function revisionIsBehind(actual, expected) {
    if (!expected || !/^\d+$/.test(actual) || !/^\d+$/.test(expected))
        return false;
    return BigInt(actual) < BigInt(expected);
}
function revisionCanAdvance(previous, next) {
    if (!previous)
        return true;
    if (previous === next)
        return false;
    if (/^\d+$/.test(previous) && /^\d+$/.test(next)) {
        return BigInt(next) > BigInt(previous);
    }
    return true;
}
function normalizeRevisionClock(value) {
    const epoch = value?.epoch?.trim() ?? '';
    const counter = value?.counter?.trim() ?? '';
    if (!epoch || !/^(?:0|[1-9]\d*)$/.test(counter))
        return null;
    return { epoch, counter };
}
function fencedRevisionClockIsBehind(actual, expected, previousAuthoritative, retiredEpochs) {
    if (retiredEpochs.has(actual.epoch))
        return true;
    if (actual.epoch === expected.epoch) {
        return BigInt(actual.counter) < BigInt(expected.counter);
    }
    // Snapshot reads are producer-fenced: an unseen epoch is the new
    // authoritative baseline even if it advanced again after the thin event.
    // Remaining on the last committed epoch, however, proves the read model has
    // not crossed the event's epoch fence and must fail closed.
    return previousAuthoritative?.epoch === actual.epoch;
}
function retireRevisionClockEpoch(retired, previous, authoritative) {
    if (previous && previous.epoch !== authoritative.epoch) {
        retired.add(previous.epoch);
        while (retired.size > MAX_RETIRED_REVISION_EPOCHS) {
            const oldest = retired.values().next().value;
            if (!oldest)
                break;
            retired.delete(oldest);
        }
    }
}
function cloneProjection(projection) {
    return {
        snapshot: cloneSnapshot(projection.snapshot),
        workspaceBalance: cloneBalance(projection.workspaceBalance),
    };
}
function cloneSnapshot(snapshot) {
    if (!snapshot)
        return null;
    return {
        ...snapshot,
        billing: { ...snapshot.billing },
        wallet: { ...snapshot.wallet },
        revisions: { ...snapshot.revisions },
        ...(snapshot.revisionClocks
            ? {
                revisionClocks: {
                    billing: { ...snapshot.revisionClocks.billing },
                    wallet: { ...snapshot.revisionClocks.wallet },
                },
            }
            : {}),
    };
}
function cloneBalance(balance) {
    return balance ? { ...balance } : null;
}
function timestamp(value) {
    return value == null ? null : new Date(value).toISOString();
}
function errorCode(error) {
    if (error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string' &&
        error.code.trim()) {
        return error.code.trim();
    }
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim().replace(/\s+/g, '_').toLowerCase();
    }
    return 'workspace_billing_refresh_failed';
}
function isAccessRevokedError(error) {
    const code = errorCode(error);
    return (error instanceof WorkspaceBillingAccessRevokedError ||
        code === 'workspace_not_authorized' ||
        code === 'workspace_access_revoked' ||
        code === 'workspace_billing_scope_mismatch' ||
        code === 'forbidden');
}
function acceptSourceRevision(previous, next) {
    const normalized = next?.trim() ?? '';
    if (!normalized)
        return { accepted: true, gap: false, epochChanged: false };
    if (!previous)
        return { accepted: true, gap: false, epochChanged: false };
    if (previous === normalized)
        return { accepted: false, gap: false, epochChanged: false };
    if (/^\d+$/.test(previous) && /^\d+$/.test(normalized)) {
        const oldValue = BigInt(previous);
        const newValue = BigInt(normalized);
        if (newValue <= oldValue) {
            return { accepted: false, gap: false, epochChanged: false };
        }
        return {
            accepted: true,
            gap: newValue > oldValue + 1n,
            epochChanged: false,
        };
    }
    // Opaque tokens support equality dedupe only. A changed token is a safe
    // invalidation; the authoritative read decides the actual value.
    return { accepted: true, gap: false, epochChanged: false };
}
function acceptSourceRevisionClock(previous, next) {
    if (!previous)
        return { accepted: true, gap: false, epochChanged: false };
    if (previous.epoch !== next.epoch) {
        return { accepted: true, gap: false, epochChanged: true };
    }
    const oldValue = BigInt(previous.counter);
    const newValue = BigInt(next.counter);
    if (newValue <= oldValue) {
        return { accepted: false, gap: false, epochChanged: false };
    }
    return {
        accepted: true,
        gap: newValue > oldValue + 1n,
        epochChanged: false,
    };
}
function acceptFencedSourceRevisionClock(previous, next, retiredEpochs) {
    if (retiredEpochs.has(next.epoch) && previous?.epoch !== next.epoch) {
        return { accepted: false, gap: false, epochChanged: false };
    }
    return acceptSourceRevisionClock(previous, next);
}
function strongerReason(current, next) {
    if (!current)
        return next;
    const rank = (reason) => {
        if (reason === 'revision-gap' || reason === 'reconnect')
            return 3;
        if (reason.includes('invalidation'))
            return 2;
        if (reason === 'poll-floor')
            return 0;
        return 1;
    };
    return rank(next) >= rank(current) ? next : current;
}
//# sourceMappingURL=workspace-billing-runtime.js.map