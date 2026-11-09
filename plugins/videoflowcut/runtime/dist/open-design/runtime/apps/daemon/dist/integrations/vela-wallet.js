import { createHash } from 'node:crypto';
import { readVelaControlApiContext, readVelaLoginStatus, } from './vela.js';
const DEFAULT_AMR_WALLET_CACHE_TTL_MS = 8_000;
const DEFAULT_AMR_WALLET_FETCH_TIMEOUT_MS = 8_000;
const DEFAULT_AMR_API_URL = 'https://amr-api.open-design.ai';
function isValidUsdBalance(value) {
    return typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value);
}
function publicUser(user) {
    if (!user)
        return null;
    return {
        ...(user.id ? { id: user.id } : {}),
        ...(user.email ? { email: user.email } : {}),
        ...(user.name ? { name: user.name } : {}),
        ...(user.plan ? { plan: user.plan } : {}),
    };
}
function unavailableSnapshot(input) {
    return {
        status: input.code === 'signed_out' ? 'signed_out' : 'unavailable',
        profile: input.profile,
        user: input.user,
        balanceUsd: null,
        updatedAt: null,
        fetchedAt: input.fetchedAt,
        stale: false,
        source: 'unavailable',
        error: {
            code: input.code,
            message: input.message,
        },
    };
}
function cacheKey(input) {
    const controlKeyDigest = createHash('sha256')
        .update(input.controlKey)
        .digest('hex')
        .slice(0, 16);
    return JSON.stringify({
        profile: input.profile,
        userId: input.user?.id ?? '',
        userEmail: input.user?.email ?? '',
        apiUrl: input.apiUrl,
        configMtimeMs: input.configMtimeMs,
        controlKeyDigest,
    });
}
function withCacheSource(snapshot, stale) {
    return {
        ...snapshot,
        source: 'daemon_cache',
        stale,
    };
}
function readPositiveInteger(value, fallback) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return fallback;
    return Math.floor(parsed);
}
export function createVelaWalletSnapshotReader(options = {}) {
    const fetchImpl = options.fetch ?? fetch;
    const now = options.now ?? (() => new Date());
    const ttlMs = options.ttlMs ?? DEFAULT_AMR_WALLET_CACHE_TTL_MS;
    const cache = new Map();
    const inflight = new Map();
    async function fetchSnapshot(key, input) {
        const fetchedAt = now().toISOString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
        try {
            const url = new URL('/api/v1/wallet/balance', input.apiUrl || DEFAULT_AMR_API_URL);
            const response = await fetchImpl(url, {
                headers: {
                    authorization: `Bearer ${input.controlKey}`,
                },
                signal: controller.signal,
            });
            if (response.status === 401 || response.status === 403) {
                // Billing is display-only (OPEND-3553): a wallet rejection must never
                // expire the AMR session. Vela also maps internal billing failures to
                // 403, so this only says the balance is unavailable. Genuine credential
                // expiry is detected by the non-billing workspace directory path.
                cache.delete(key);
                return unavailableSnapshot({
                    code: 'unauthorized',
                    fetchedAt,
                    message: 'AMR wallet balance is unavailable for this account right now.',
                    profile: input.profile,
                    user: input.user,
                });
            }
            if (!response.ok) {
                const cached = cache.get(key);
                if (cached) {
                    return {
                        ...withCacheSource(cached.snapshot, true),
                        error: {
                            code: 'upstream',
                            message: `AMR wallet balance is temporarily unavailable (${response.status}).`,
                        },
                    };
                }
                return unavailableSnapshot({
                    code: 'upstream',
                    fetchedAt,
                    message: `AMR wallet balance is temporarily unavailable (${response.status}).`,
                    profile: input.profile,
                    user: input.user,
                });
            }
            const body = (await response.json());
            if (!isValidUsdBalance(body.balanceUsd)) {
                const cached = cache.get(key);
                if (cached) {
                    return {
                        ...withCacheSource(cached.snapshot, true),
                        error: {
                            code: 'upstream',
                            message: 'AMR wallet balance response contained an invalid balanceUsd.',
                        },
                    };
                }
                return unavailableSnapshot({
                    code: 'upstream',
                    fetchedAt,
                    message: 'AMR wallet balance response contained an invalid balanceUsd.',
                    profile: input.profile,
                    user: input.user,
                });
            }
            const balanceUsd = body.balanceUsd;
            const snapshot = {
                status: 'available',
                profile: input.profile,
                user: input.user,
                balanceUsd,
                updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : null,
                fetchedAt,
                stale: false,
                source: 'vela_api',
            };
            cache.set(key, { createdAtMs: now().getTime(), snapshot });
            return snapshot;
        }
        catch {
            const cached = cache.get(key);
            if (cached) {
                return {
                    ...withCacheSource(cached.snapshot, true),
                    error: {
                        code: 'network',
                        message: 'AMR wallet balance is temporarily unavailable.',
                    },
                };
            }
            return unavailableSnapshot({
                code: 'network',
                fetchedAt,
                message: 'AMR wallet balance is temporarily unavailable.',
                profile: input.profile,
                user: input.user,
            });
        }
        finally {
            clearTimeout(timeout);
            controller.abort();
        }
    }
    async function read(readOptions = {}) {
        const env = readOptions.env ?? process.env;
        const configuredEnv = readOptions.configuredEnv ?? {};
        const status = readVelaLoginStatus(env, configuredEnv);
        const fetchedAt = now().toISOString();
        if (!status.loggedIn) {
            return unavailableSnapshot({
                code: 'signed_out',
                fetchedAt,
                message: 'Sign in to AMR to view wallet balance.',
                profile: status.profile,
                user: null,
            });
        }
        const context = readVelaControlApiContext(env, configuredEnv);
        if (!context) {
            return unavailableSnapshot({
                code: 'missing_control_key',
                fetchedAt,
                message: 'Sign in again to refresh AMR wallet credentials.',
                profile: status.profile,
                user: publicUser(status.user),
            });
        }
        const user = publicUser(context.user ?? status.user);
        const key = cacheKey({
            apiUrl: context.apiUrl,
            configMtimeMs: context.configMtimeMs,
            controlKey: context.controlKey,
            profile: context.profile,
            user,
        });
        const cached = cache.get(key);
        if (!readOptions.refresh && cached && now().getTime() - cached.createdAtMs < ttlMs) {
            return withCacheSource(cached.snapshot, false);
        }
        const current = inflight.get(key);
        if (current)
            return current;
        const timeoutMs = options.timeoutMs ??
            readPositiveInteger(env.OD_AMR_WALLET_FETCH_TIMEOUT_MS, DEFAULT_AMR_WALLET_FETCH_TIMEOUT_MS);
        const promise = fetchSnapshot(key, {
            apiUrl: context.apiUrl,
            controlKey: context.controlKey,
            profile: context.profile,
            timeoutMs,
            user,
            env,
            configuredEnv,
        }).finally(() => {
            inflight.delete(key);
        });
        inflight.set(key, promise);
        return promise;
    }
    return {
        clear() {
            cache.clear();
            inflight.clear();
        },
        read,
    };
}
export const velaWalletSnapshotReader = createVelaWalletSnapshotReader();
export function clearVelaWalletSnapshotCache() {
    velaWalletSnapshotReader.clear();
}
//# sourceMappingURL=vela-wallet.js.map