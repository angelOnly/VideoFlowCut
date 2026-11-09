import { createHash, randomBytes } from 'node:crypto';
export const DEFAULT_TOOL_TOKEN_TTL_MS = 15 * 60 * 1000;
export const CHAT_TOOL_TOKEN_TTL_BUFFER_MS = 15 * 60 * 1000;
export function resolveChatToolTokenTtlMs(inactivityTimeoutMs) {
    if (!Number.isFinite(inactivityTimeoutMs) || inactivityTimeoutMs < 0) {
        throw new RangeError(`inactivityTimeoutMs must be a non-negative finite number, got ${String(inactivityTimeoutMs)}`);
    }
    return Math.max(DEFAULT_TOOL_TOKEN_TTL_MS, inactivityTimeoutMs + CHAT_TOOL_TOKEN_TTL_BUFFER_MS);
}
// Capability key for the parameterized media wait route. Token grants cannot
// enumerate a task id that is created after the grant is minted.
export const MEDIA_TASK_WAIT_TOOL_ENDPOINT = '/api/media/tasks/:id/wait';
export const STOCK_SEARCH_TOOL_ENDPOINT = '/api/tools/media/stock-search';
export const HYPERFRAMES_SCAFFOLD_TOOL_ENDPOINT = '/api/tools/media/hyperframes/scaffold';
export const PROJECT_EXPORT_TOOL_ENDPOINT = '/api/projects/:id/export/:format';
export const DELIVERABLE_SYNTAX_CHECK_TOOL_ENDPOINT = '/api/tools/deliverable-syntax/check';
export const CHAT_TOOL_ENDPOINTS = [
    '/api/tools/motion-work/stage',
    '/api/tools/live-artifacts/create',
    '/api/tools/live-artifacts/list',
    '/api/tools/live-artifacts/refresh',
    '/api/tools/live-artifacts/update',
    '/api/tools/connectors/list',
    '/api/tools/connectors/execute',
    '/api/tools/design-systems/read',
    '/api/tools/media/generate',
    STOCK_SEARCH_TOOL_ENDPOINT,
    HYPERFRAMES_SCAFFOLD_TOOL_ENDPOINT,
    DELIVERABLE_SYNTAX_CHECK_TOOL_ENDPOINT,
    MEDIA_TASK_WAIT_TOOL_ENDPOINT,
    PROJECT_EXPORT_TOOL_ENDPOINT,
    '/api/tools/library/search',
    '/api/tools/library/apply',
];
export const CHAT_TOOL_OPERATIONS = [
    'motion-work:stage',
    'live-artifacts:create',
    'live-artifacts:list',
    'live-artifacts:refresh',
    'live-artifacts:update',
    'connectors:list',
    'connectors:execute',
    'design-systems:read',
    'media:generate',
    'media:stock-search',
    'media:scaffold',
    'deliverable-syntax:check',
    'project:export',
    'library:search',
    'library:apply',
];
function tokenHash(token) {
    return createHash('sha256').update(token).digest('hex');
}
function createOpaqueToolToken() {
    return `odtt_${randomBytes(32).toString('base64url')}`;
}
function asPublicGrant(stored) {
    const { tokenHash: _tokenHash, expiresAtMs: _expiresAtMs, timer: _timer, ...grant } = stored;
    return grant;
}
// Plan §3.A3 / spec §9: pure connector capability gate over a token grant.
// When the grant carries no plugin snapshot id, the call is from a
// non-plugin run and we let it through (back-compat). When the grant
// carries a snapshot id, we apply the §9 / §5.3 rule:
//
//   - trusted / bundled plugins implicitly carry connector:* — accept.
//   - restricted plugins must list `connector:<id>` in
//     pluginCapabilitiesGranted — otherwise reject with TOOL_OPERATION_DENIED.
//
// Used by `/api/tools/connectors/execute` (defense in depth, c). Phase 4
// extends this to `connector:*` glob support if the spec patches §5.3 to
// allow it; today we accept only the exact id form.
export function checkConnectorAccess(grant, connectorId) {
    if (!grant.pluginSnapshotId)
        return { ok: true };
    const tier = grant.pluginTrust ?? 'restricted';
    if (tier !== 'restricted')
        return { ok: true };
    const granted = new Set(grant.pluginCapabilitiesGranted ?? []);
    if (granted.has(`connector:${connectorId}`) || granted.has('connector')) {
        return { ok: true };
    }
    return {
        ok: false,
        reason: `restricted plugin (snapshot ${grant.pluginSnapshotId}) lacks "connector:${connectorId}" — grant via /api/plugins/:id/trust before retrying`,
    };
}
export class ToolTokenRegistry {
    #byTokenHash = new Map();
    #tokenHashesByRunId = new Map();
    mint(options) {
        const nowMs = options.nowMs ?? Date.now();
        const ttlMs = options.ttlMs ?? DEFAULT_TOOL_TOKEN_TTL_MS;
        if (!options.runId)
            throw new Error('runId is required');
        if (!options.projectId)
            throw new Error('projectId is required');
        if (!Number.isFinite(ttlMs) || ttlMs <= 0)
            throw new Error('ttlMs must be positive');
        const token = createOpaqueToolToken();
        const hash = tokenHash(token);
        const expiresAtMs = nowMs + ttlMs;
        const timer = setTimeout(() => {
            this.revokeToken(token, 'ttl_expired');
        }, ttlMs);
        timer.unref?.();
        const stored = {
            token,
            tokenHash: hash,
            runId: options.runId,
            projectId: options.projectId,
            allowedEndpoints: [...(options.allowedEndpoints ?? CHAT_TOOL_ENDPOINTS)],
            allowedOperations: [...(options.allowedOperations ?? CHAT_TOOL_OPERATIONS)],
            issuedAt: new Date(nowMs).toISOString(),
            expiresAt: new Date(expiresAtMs).toISOString(),
            expiresAtMs,
            timer,
            ...(options.pluginSnapshotId ? { pluginSnapshotId: options.pluginSnapshotId } : {}),
            ...(options.pluginTrust ? { pluginTrust: options.pluginTrust } : {}),
            ...(options.pluginCapabilitiesGranted
                ? { pluginCapabilitiesGranted: [...options.pluginCapabilitiesGranted] }
                : {}),
        };
        this.#byTokenHash.set(hash, stored);
        const runTokens = this.#tokenHashesByRunId.get(options.runId) ?? new Set();
        runTokens.add(hash);
        this.#tokenHashesByRunId.set(options.runId, runTokens);
        return asPublicGrant(stored);
    }
    validate(token, options = {}) {
        if (!token) {
            return { ok: false, code: 'TOOL_TOKEN_MISSING', message: 'tool token is required' };
        }
        const stored = this.#byTokenHash.get(tokenHash(token));
        if (!stored) {
            return { ok: false, code: 'TOOL_TOKEN_INVALID', message: 'tool token is invalid or revoked' };
        }
        if ((options.nowMs ?? Date.now()) >= stored.expiresAtMs) {
            this.revokeToken(token, 'ttl_expired');
            return { ok: false, code: 'TOOL_TOKEN_EXPIRED', message: 'tool token expired' };
        }
        if (options.endpoint && !stored.allowedEndpoints.includes(options.endpoint)) {
            return { ok: false, code: 'TOOL_ENDPOINT_DENIED', message: 'tool endpoint is not allowed for this run' };
        }
        if (options.operation && !stored.allowedOperations.includes(options.operation)) {
            return { ok: false, code: 'TOOL_OPERATION_DENIED', message: 'tool operation is not allowed for this run' };
        }
        return { ok: true, grant: asPublicGrant(stored) };
    }
    refreshToken(token, options = {}) {
        if (!token)
            return null;
        const stored = this.#byTokenHash.get(tokenHash(token));
        if (!stored)
            return null;
        const nowMs = options.nowMs ?? Date.now();
        if (nowMs >= stored.expiresAtMs) {
            this.revokeToken(token, 'ttl_expired');
            return null;
        }
        const ttlMs = options.ttlMs ?? DEFAULT_TOOL_TOKEN_TTL_MS;
        if (!Number.isFinite(ttlMs) || ttlMs <= 0)
            throw new Error('ttlMs must be positive');
        clearTimeout(stored.timer);
        stored.expiresAtMs = nowMs + ttlMs;
        stored.expiresAt = new Date(stored.expiresAtMs).toISOString();
        stored.timer = setTimeout(() => {
            this.revokeToken(token, 'ttl_expired');
        }, ttlMs);
        stored.timer.unref?.();
        return asPublicGrant(stored);
    }
    revokeToken(token, _reason = 'manual') {
        if (!token)
            return false;
        const hash = tokenHash(token);
        const stored = this.#byTokenHash.get(hash);
        if (!stored)
            return false;
        clearTimeout(stored.timer);
        this.#byTokenHash.delete(hash);
        const runTokens = this.#tokenHashesByRunId.get(stored.runId);
        if (runTokens) {
            runTokens.delete(hash);
            if (runTokens.size === 0)
                this.#tokenHashesByRunId.delete(stored.runId);
        }
        return true;
    }
    revokeRun(runId, reason = 'manual') {
        const runTokens = this.#tokenHashesByRunId.get(runId);
        if (!runTokens)
            return 0;
        const hashes = [...runTokens];
        let revoked = 0;
        for (const hash of hashes) {
            const stored = this.#byTokenHash.get(hash);
            if (stored && this.revokeToken(stored.token, reason))
                revoked += 1;
        }
        return revoked;
    }
    activeTokenCount() {
        return this.#byTokenHash.size;
    }
    activeRunTokenCount(runId) {
        return this.#tokenHashesByRunId.get(runId)?.size ?? 0;
    }
    clear() {
        for (const stored of this.#byTokenHash.values()) {
            clearTimeout(stored.timer);
        }
        this.#byTokenHash.clear();
        this.#tokenHashesByRunId.clear();
    }
}
export const toolTokenRegistry = new ToolTokenRegistry();
//# sourceMappingURL=tool-tokens.js.map