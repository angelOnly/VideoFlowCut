// Hop-1 realtime: cloud hub → daemon thin-event subscriber.
//
// Subscribes to B's `GET /api/v1/collab/events` SSE channel (one connection
// per daemon, authenticated with the same vela control-key session everything
// else uses) and surfaces thin invalidation events. This replaces "poll every
// 5-15s and diff" as the PRIMARY freshness mechanism; the pollers stay alive
// as a lower-frequency safety net and as the sole mechanism while this
// channel is down — the channel's health is exposed through `onStateChange`
// so the caller can switch poll cadences.
//
// Reliability model (mirrors the daemon→web thin-event contract):
//   - Events are signals, not payloads; a missed event is closed by the
//     reconnect catch-up (`onReconnect` → caller re-runs its pollers once).
//   - Exponential backoff 1s→30s, forever; `resolveEndpoint` returning null
//     (signed out / no workspace) idles at the max backoff instead of
//     hammering.
//   - A heartbeat watchdog kills half-dead connections: the server sends a
//     frame at least every 15s, so 45s of silence means the TCP stream is
//     zombied and we abort + reconnect.
const BILLING_REVISION_CLOCKS_CAPABILITY = 'billing-revision-clocks-v1';
export const CODING_PLAN_USAGE_EVENTS_CAPABILITY = 'coding-plan-usage-events-v1';
export const WORKSPACE_MEMBER_EVENTS_CAPABILITY = 'workspace-member-events-v1';
const WORKSPACE_EVENT_LISTENER_STATUS_CAPABILITY = 'workspace-event-listener-status-v1';
export const AUTHORITATIVE_PROJECT_PRESENCE_CAPABILITY = 'authoritative-project-presence-v1';
export const WORKSPACE_DIRECTORY_EVENTS_CAPABILITY = 'workspace-directory-events-v1';
const MAX_HANDLED_SOURCE_GAP_EPOCHS = 64;
const HUB_EVENT_TYPES = new Set([
    'team-projects-changed',
    'comment-changed',
    'presence-changed',
    'workspace-context-changed',
    'workspace-members-changed',
    'billing-changed',
    'billing-subscription-changed',
    'wallet-balance-changed',
    'coding-plan-usage-changed',
    'project-metadata-changed',
    'project-content-changed',
    'team-resources-changed',
]);
const HUB_RESOURCE_STATUSES = new Set(['shared', 'retracted']);
const HUB_WORKSPACE_MEMBER_CHANGES = new Set([
    'added',
    'removed',
    'updated',
]);
const HUB_WORKSPACE_DIRECTORY_CHANGES = new Set([
    'created',
    'updated',
    'deleted',
    'membership-added',
    'membership-updated',
    'membership-removed',
]);
export function parseHubWorkspaceEvent(data) {
    try {
        const parsed = JSON.parse(data);
        if (typeof parsed.type !== 'string' || !HUB_EVENT_TYPES.has(parsed.type)) {
            return null;
        }
        const event = { type: parsed.type };
        if (typeof parsed.workspaceId === 'string')
            event.workspaceId = parsed.workspaceId;
        if (typeof parsed.workspaceMemberId === 'string') {
            event.workspaceMemberId = parsed.workspaceMemberId;
        }
        if (typeof parsed.memberId === 'string')
            event.memberId = parsed.memberId;
        if (typeof parsed.memberChange === 'string'
            && HUB_WORKSPACE_MEMBER_CHANGES.has(parsed.memberChange)) {
            event.memberChange = parsed.memberChange;
        }
        if (typeof parsed.revision === 'string')
            event.revision = parsed.revision;
        const revisionClock = parseRevisionClock(parsed.revisionClock);
        if (revisionClock)
            event.revisionClock = revisionClock;
        if (typeof parsed.projectId === 'string')
            event.projectId = parsed.projectId;
        if (typeof parsed.resourceId === 'string')
            event.resourceId = parsed.resourceId;
        if (typeof parsed.resourceKind === 'string')
            event.resourceKind = parsed.resourceKind;
        if (typeof parsed.resourceStatus === 'string' &&
            HUB_RESOURCE_STATUSES.has(parsed.resourceStatus)) {
            event.resourceStatus = parsed.resourceStatus;
        }
        if (typeof parsed.seq === 'number')
            event.seq = parsed.seq;
        if (typeof parsed.version === 'number')
            event.version = parsed.version;
        if (typeof parsed.at === 'string')
            event.at = parsed.at;
        if (event.type === 'coding-plan-usage-changed') {
            if (!event.workspaceId?.trim() || !event.workspaceMemberId?.trim() ||
                typeof parsed.eventId !== 'string' || !/^\d+$/.test(parsed.eventId))
                return null;
            event.eventId = parsed.eventId;
            // Quota cursors are independent of wallet/subscription revision clocks.
            delete event.revision;
            delete event.revisionClock;
        }
        return event;
    }
    catch {
        return null;
    }
}
export function parseHubWorkspaceDirectoryEvent(data) {
    const parsed = parseJsonRecord(data);
    const workspaceId = typeof parsed?.workspaceId === 'string' ? parsed.workspaceId.trim() : '';
    const change = parsed?.change;
    if (parsed?.type !== 'workspace-directory-changed'
        || !workspaceId
        || typeof change !== 'string'
        || !HUB_WORKSPACE_DIRECTORY_CHANGES.has(change)) {
        return null;
    }
    return {
        type: 'workspace-directory-changed',
        workspaceId,
        change: change,
        ...(typeof parsed.at === 'string' ? { at: parsed.at } : {}),
    };
}
export function parseHubReadyFrame(data) {
    const parsed = parseJsonRecord(data);
    const workspaceId = typeof parsed?.workspaceId === 'string' ? parsed.workspaceId.trim() : '';
    if (!workspaceId)
        return null;
    const capabilities = Array.isArray(parsed?.capabilities)
        ? parsed.capabilities.filter((capability) => typeof capability === 'string' && Boolean(capability.trim()))
        : [];
    return {
        workspaceId,
        capabilities,
        listenerStatus: parseHubListenerStatusRecord(parsed),
    };
}
export function parseHubListenerStatus(data) {
    return parseHubListenerStatusRecord(parseJsonRecord(data));
}
function parseHubListenerStatusRecord(parsed) {
    if (!parsed)
        return null;
    const listenerEpoch = typeof parsed.listenerEpoch === 'string' ? parsed.listenerEpoch.trim() : '';
    const listenerHealth = parsed.listenerHealth;
    if (!listenerEpoch ||
        (listenerHealth !== 'starting' &&
            listenerHealth !== 'healthy' &&
            listenerHealth !== 'reconnecting' &&
            listenerHealth !== 'stopped') ||
        typeof parsed.sourceGap !== 'boolean') {
        return null;
    }
    return {
        listenerEpoch,
        listenerHealth,
        sourceGap: parsed.sourceGap,
    };
}
function parseRevisionClock(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const raw = value;
    const epoch = typeof raw.epoch === 'string' ? raw.epoch.trim() : '';
    const counter = typeof raw.counter === 'string' ? raw.counter.trim() : '';
    if (!epoch || !/^(?:0|[1-9]\d*)$/.test(counter))
        return null;
    return { epoch, counter };
}
function parseJsonRecord(data) {
    try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
export function startHubEventsSubscriber(options) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 45_000;
    const backoffMinMs = options.backoffMinMs ?? 1_000;
    const backoffMaxMs = options.backoffMaxMs ?? 30_000;
    const random = options.random ?? Math.random;
    let stopped = false;
    let isConnected = false;
    let everConnected = false;
    let backoffMs = backoffMinMs;
    let abortController = null;
    let wakeSleep = null;
    let endpointGeneration = 0;
    const handledSourceGapEpochs = new Set();
    const quotaCursors = new Map();
    const setConnected = (next, identityKey) => {
        if (isConnected === next)
            return;
        isConnected = next;
        options.onStateChange?.(next ? 'connected' : 'disconnected', {
            ...(identityKey ? { identityKey } : {}),
        });
    };
    const sleep = (ms) => new Promise((resolve) => {
        const timer = setTimeout(() => {
            wakeSleep = null;
            resolve();
        }, ms);
        timer.unref?.();
        wakeSleep = () => {
            clearTimeout(timer);
            wakeSleep = null;
            resolve();
        };
    });
    const jitteredBackoff = (ms) => Math.max(1, Math.floor(ms * (1 + Math.min(0.999_999, Math.max(0, random())) * 0.5)));
    async function consumeStream(endpoint) {
        abortController = new AbortController();
        let watchdog = null;
        let scopeVerified = false;
        let verifiedWorkspaceId;
        let verifiedCapabilities = [];
        let lastListenerStatus = null;
        let lastAuthorityHealthy = null;
        const publishAuthorityHealth = (status, forceUnhealthy = false) => {
            lastListenerStatus = status;
            const healthy = !forceUnhealthy &&
                scopeVerified &&
                verifiedCapabilities.includes(WORKSPACE_MEMBER_EVENTS_CAPABILITY) &&
                verifiedCapabilities.includes(WORKSPACE_EVENT_LISTENER_STATUS_CAPABILITY) &&
                status?.listenerHealth === 'healthy' &&
                status.sourceGap === false;
            if (lastAuthorityHealthy === healthy)
                return;
            lastAuthorityHealthy = healthy;
            try {
                options.onAuthorityHealthChange?.({
                    ...(verifiedWorkspaceId ? { workspaceId: verifiedWorkspaceId } : {}),
                    ...(endpoint.identityKey ? { identityKey: endpoint.identityKey } : {}),
                    healthy,
                    capabilities: [...verifiedCapabilities],
                    listenerStatus: status,
                });
            }
            catch (error) {
                options.onError?.(error);
            }
        };
        const armWatchdog = () => {
            if (watchdog)
                clearTimeout(watchdog);
            watchdog = setTimeout(() => abortController?.abort(), heartbeatTimeoutMs);
            watchdog.unref?.();
        };
        try {
            const endpointUrl = new URL(endpoint.url);
            endpointUrl.searchParams.set('codingPlanUsageEvents', '1');
            const response = await fetchImpl(endpointUrl.toString(), {
                headers: { ...endpoint.headers, accept: 'text/event-stream' },
                signal: abortController.signal,
            });
            if (!response.ok || !response.body) {
                throw new Error(`hub events stream ${response.status}`);
            }
            // Transport-connected. Do not publish a connected state until the
            // server's `ready` frame proves the exact expected workspace below.
            armWatchdog();
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let connectionNotified = false;
            let revisionClocksEnabled = false;
            const reportSourceGap = (status, suppressCallback = false) => {
                const handledKey = `${verifiedWorkspaceId ?? 'unknown'}\0${status?.listenerEpoch ?? ''}`;
                if (!status ||
                    status.listenerHealth !== 'healthy' ||
                    !status.sourceGap ||
                    handledSourceGapEpochs.has(handledKey)) {
                    return;
                }
                handledSourceGapEpochs.add(handledKey);
                while (handledSourceGapEpochs.size > MAX_HANDLED_SOURCE_GAP_EPOCHS) {
                    const oldest = handledSourceGapEpochs.values().next().value;
                    if (!oldest)
                        break;
                    handledSourceGapEpochs.delete(oldest);
                }
                if (!suppressCallback) {
                    options.onSourceGap?.({
                        ...(verifiedWorkspaceId ? { workspaceId: verifiedWorkspaceId } : {}),
                        ...(endpoint.identityKey ? { identityKey: endpoint.identityKey } : {}),
                        listenerEpoch: status.listenerEpoch,
                    });
                }
            };
            const notifyVerifiedConnection = (workspaceId, capabilities) => {
                if (connectionNotified)
                    return;
                connectionNotified = true;
                const reconnect = everConnected;
                everConnected = true;
                try {
                    options.onConnect?.({
                        reconnect,
                        ...(workspaceId ? { workspaceId } : {}),
                        ...(endpoint.identityKey ? { identityKey: endpoint.identityKey } : {}),
                        capabilities: [...capabilities],
                    });
                    if (reconnect) {
                        options.onReconnect?.({
                            ...(endpoint.identityKey
                                ? { identityKey: endpoint.identityKey }
                                : {}),
                        });
                    }
                }
                catch (error) {
                    options.onError?.(error);
                }
            };
            for (;;) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                armWatchdog();
                buffer += decoder.decode(value, { stream: true });
                // SSE permits CRLF as well as LF. Normalize only after appending so a
                // CR/LF pair split across transport chunks is still handled.
                buffer = buffer.replace(/\r\n/g, '\n');
                let sep;
                while ((sep = buffer.indexOf('\n\n')) !== -1) {
                    const rawEvent = buffer.slice(0, sep);
                    buffer = buffer.slice(sep + 2);
                    let eventName = 'message';
                    const dataLines = [];
                    for (const line of rawEvent.split('\n')) {
                        if (line.startsWith('event:'))
                            eventName = line.slice(6).trim();
                        else if (line.startsWith('data:'))
                            dataLines.push(line.slice(5).trim());
                    }
                    const data = dataLines.join('\n');
                    if (eventName === 'ready') {
                        const ready = parseHubReadyFrame(data);
                        if (!ready) {
                            options.onDrop?.({
                                reason: 'invalid-ready',
                                eventName,
                                ...(endpoint.workspaceId
                                    ? { expectedWorkspaceId: endpoint.workspaceId }
                                    : {}),
                            });
                            abortController?.abort();
                            return 'rejected';
                        }
                        const actualWorkspaceId = ready.workspaceId;
                        if (endpoint.workspaceId && actualWorkspaceId !== endpoint.workspaceId) {
                            options.onDrop?.({
                                reason: 'workspace-mismatch',
                                eventName,
                                expectedWorkspaceId: endpoint.workspaceId,
                                actualWorkspaceId,
                            });
                            abortController?.abort();
                            return 'rejected';
                        }
                        scopeVerified = true;
                        verifiedWorkspaceId = actualWorkspaceId;
                        verifiedCapabilities = [...ready.capabilities];
                        // A verified connection has recovered from prior transport
                        // failures. Terminal revocation below deliberately overrides this
                        // with the maximum retry delay.
                        backoffMs = backoffMinMs;
                        setConnected(true, endpoint.identityKey);
                        revisionClocksEnabled = ready.capabilities.includes(BILLING_REVISION_CLOCKS_CAPABILITY);
                        const reconnect = everConnected;
                        notifyVerifiedConnection(actualWorkspaceId, ready.capabilities);
                        // Transport reconnect already invokes the broader onReconnect
                        // catch-up. A first connection has no such callback, so a healthy
                        // producer-side gap reported in ready must trigger it here.
                        reportSourceGap(ready.listenerStatus, reconnect);
                        // `ready` verifies the stream scope and capabilities, but Vela
                        // emits it before its post-subscribe membership revalidation has
                        // completed. Keep the authority path conservative until the first
                        // healthy post-ready status/heartbeat proves that catch-up crossed
                        // that boundary.
                        publishAuthorityHealth(ready.listenerStatus, true);
                        continue;
                    }
                    if (eventName === 'source-status' || eventName === 'heartbeat') {
                        if (scopeVerified) {
                            const status = parseHubListenerStatus(data);
                            reportSourceGap(status);
                            publishAuthorityHealth(status);
                        }
                        continue;
                    }
                    if (eventName === 'access-revoked') {
                        if (!scopeVerified) {
                            options.onDrop?.({
                                reason: 'unverified-scope',
                                eventName,
                                ...(endpoint.workspaceId
                                    ? { expectedWorkspaceId: endpoint.workspaceId }
                                    : {}),
                            });
                            continue;
                        }
                        const parsed = parseJsonRecord(data);
                        const reason = typeof parsed?.reason === 'string' && parsed.reason.trim()
                            ? parsed.reason.trim()
                            : undefined;
                        try {
                            options.onAccessRevoked?.({
                                ...(verifiedWorkspaceId
                                    ? { workspaceId: verifiedWorkspaceId }
                                    : {}),
                                ...(endpoint.identityKey
                                    ? { identityKey: endpoint.identityKey }
                                    : {}),
                                ...(reason ? { reason } : {}),
                            });
                        }
                        catch (error) {
                            options.onError?.(error);
                        }
                        publishAuthorityHealth(lastListenerStatus, true);
                        setConnected(false, endpoint.identityKey);
                        abortController?.abort();
                        return 'revoked';
                    }
                    if (eventName === 'workspace-directory-changed') {
                        if (!scopeVerified) {
                            options.onDrop?.({
                                reason: 'unverified-scope',
                                eventName,
                                ...(endpoint.workspaceId
                                    ? { expectedWorkspaceId: endpoint.workspaceId }
                                    : {}),
                            });
                            continue;
                        }
                        if (!verifiedCapabilities.includes(WORKSPACE_DIRECTORY_EVENTS_CAPABILITY)) {
                            options.onDrop?.({ reason: 'invalid-payload', eventName });
                            continue;
                        }
                        const directoryEvent = parseHubWorkspaceDirectoryEvent(data);
                        if (!directoryEvent) {
                            options.onDrop?.({ reason: 'invalid-payload', eventName });
                            continue;
                        }
                        // Its workspace may be brand new and therefore intentionally does
                        // NOT have to match the stream that carried the account signal.
                        options.onDirectoryEvent?.(directoryEvent, {
                            ...(endpoint.identityKey ? { identityKey: endpoint.identityKey } : {}),
                        });
                        continue;
                    }
                    if (eventName !== 'workspace-event')
                        continue;
                    if (!scopeVerified) {
                        options.onDrop?.({
                            reason: 'unverified-scope',
                            eventName,
                            ...(endpoint.workspaceId
                                ? { expectedWorkspaceId: endpoint.workspaceId }
                                : {}),
                        });
                        continue;
                    }
                    const event = parseHubWorkspaceEvent(data);
                    if (!event) {
                        options.onDrop?.({ reason: 'invalid-payload', eventName });
                        continue;
                    }
                    if (endpoint.workspaceId &&
                        event.workspaceId &&
                        event.workspaceId !== endpoint.workspaceId) {
                        options.onDrop?.({
                            reason: 'workspace-mismatch',
                            eventName,
                            expectedWorkspaceId: endpoint.workspaceId,
                            actualWorkspaceId: event.workspaceId,
                        });
                        continue;
                    }
                    if (event.type === 'coding-plan-usage-changed') {
                        if (!verifiedCapabilities.includes(CODING_PLAN_USAGE_EVENTS_CAPABILITY)) {
                            options.onDrop?.({ reason: 'invalid-payload', eventName });
                            continue;
                        }
                        const key = `${endpoint.identityKey ?? ''}\0${event.workspaceId}\0${event.workspaceMemberId}`;
                        const cursor = BigInt(event.eventId);
                        const previous = quotaCursors.get(key);
                        if (previous !== undefined && cursor <= previous)
                            continue;
                        quotaCursors.set(key, cursor);
                        if (quotaCursors.size > 64)
                            quotaCursors.delete(quotaCursors.keys().next().value);
                    }
                    if (!revisionClocksEnabled && event.revisionClock) {
                        const { revisionClock: _, ...legacyEvent } = event;
                        options.onEvent(legacyEvent, {
                            ...(endpoint.identityKey
                                ? { identityKey: endpoint.identityKey }
                                : {}),
                        });
                    }
                    else {
                        options.onEvent(event, {
                            ...(endpoint.identityKey
                                ? { identityKey: endpoint.identityKey }
                                : {}),
                        });
                    }
                }
            }
            return 'closed';
        }
        finally {
            if (watchdog)
                clearTimeout(watchdog);
            abortController = null;
            if (scopeVerified)
                publishAuthorityHealth(lastListenerStatus, true);
            setConnected(false, endpoint.identityKey);
        }
    }
    void (async () => {
        while (!stopped) {
            const generation = endpointGeneration;
            try {
                const endpoint = await options.resolveEndpoint();
                if (stopped)
                    break;
                // A workspace switch may land while endpoint resolution is in flight.
                // Never open the now-stale scope; resolve again from current identity.
                if (generation !== endpointGeneration)
                    continue;
                if (!endpoint) {
                    // Signed out / no team workspace — idle at max backoff, keep probing.
                    await sleep(jitteredBackoff(backoffMaxMs));
                    continue;
                }
                const outcome = await consumeStream(endpoint);
                if (generation !== endpointGeneration) {
                    backoffMs = backoffMinMs;
                    continue;
                }
                // Server closed cleanly (deploy/restart) — reconnect promptly. A
                // terminal revocation or untrusted ready frame must not become a
                // one-request-per-second loop; probe only at the bounded maximum until
                // membership, deployment, or scope changes.
                backoffMs = outcome === 'closed' ? backoffMinMs : backoffMaxMs;
            }
            catch (error) {
                // Deliberately aborting the old workspace stream is not a transport
                // failure and must not surface a misleading reconnect warning.
                if (!stopped && generation === endpointGeneration)
                    options.onError?.(error);
            }
            if (stopped)
                break;
            if (generation !== endpointGeneration) {
                backoffMs = backoffMinMs;
                continue;
            }
            await sleep(jitteredBackoff(backoffMs));
            backoffMs = Math.min(backoffMs * 2, backoffMaxMs);
        }
    })();
    return {
        stop() {
            stopped = true;
            abortController?.abort();
            wakeSleep?.();
        },
        connected: () => isConnected,
        refreshEndpoint() {
            if (stopped)
                return;
            endpointGeneration += 1;
            abortController?.abort();
            wakeSleep?.();
        },
    };
}
//# sourceMappingURL=hub-events-subscriber.js.map