// Browser-extension pairing + long-lived library tokens.
//
// Flow: the OD UI (loopback-only) calls startPairing() → a short code shown to
// the user. The extension posts that code plus its own origin to
// confirmPairing(), which mints an `odlt_…` bearer token (persisted, hashed)
// and registers the `chrome-extension://<id>` origin in the in-memory
// allowlist the `/api` origin middleware consults. The allowlist is seeded
// from SQLite on daemon boot so a paired extension survives restarts.
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { findLibraryTokenByHash, insertLibraryToken, listLibraryTokens, touchLibraryToken, } from './library-store.js';
const PAIRING_TTL_MS = 5 * 60 * 1000;
// A single outstanding pairing code is sufficient — pairing is a brief,
// user-driven handshake. A fresh startPairing() supersedes any prior code.
let pendingPairing = null;
// In-memory allowlist of extension origins, seeded from SQLite at boot and
// extended on each successful pairing.
const extensionOrigins = new Set();
function tokenHash(token) {
    return createHash('sha256').update(token).digest('hex');
}
export function seedLibraryExtensionOrigins(origins) {
    for (const origin of origins) {
        if (origin)
            extensionOrigins.add(origin);
    }
}
export function libraryExtensionAllowedOrigins() {
    return Array.from(extensionOrigins);
}
export function isAllowedExtensionOrigin(origin) {
    return Boolean(origin) && extensionOrigins.has(String(origin));
}
export function startPairing(now = Date.now()) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = now + PAIRING_TTL_MS;
    pendingPairing = { code, expiresAt };
    return { code, expiresAt };
}
/** Normalize an extension origin string to `<scheme>//<host>` or null if unsupported. */
function normalizeExtensionOrigin(raw) {
    const value = (raw ?? '').trim();
    if (!value)
        return null;
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        return null;
    }
    if (parsed.protocol !== 'chrome-extension:' && parsed.protocol !== 'moz-extension:') {
        return null;
    }
    if (!parsed.host)
        return null;
    // URL.origin is "null" for non-special schemes, so rebuild it explicitly.
    return `${parsed.protocol}//${parsed.host}`;
}
export function confirmPairing(db, opts, now = Date.now()) {
    const entry = pendingPairing;
    if (!entry || entry.expiresAt < now) {
        pendingPairing = null;
        return { ok: false, error: 'pairing code expired' };
    }
    if (entry.code !== String(opts.code ?? '').trim()) {
        return { ok: false, error: 'invalid pairing code' };
    }
    const origin = normalizeExtensionOrigin(opts.extensionOrigin);
    if (!origin) {
        return { ok: false, error: 'unsupported extension origin' };
    }
    const token = `odlt_${randomBytes(32).toString('base64url')}`;
    const label = (opts.label ?? '').trim() || 'Browser Extension';
    insertLibraryToken(db, {
        tokenHash: tokenHash(token),
        label,
        extensionOrigin: origin,
        createdAt: now,
        lastUsedAt: now,
    });
    extensionOrigins.add(origin);
    pendingPairing = null;
    return { ok: true, token, label };
}
export function validateLibraryToken(db, token) {
    if (!token)
        return { ok: false };
    const row = findLibraryTokenByHash(db, tokenHash(token));
    if (!row)
        return { ok: false };
    touchLibraryToken(db, row.tokenHash);
    return { ok: true, row };
}
export function libraryConnectionStatus(db) {
    const tokens = listLibraryTokens(db).map((t) => ({
        label: t.label,
        extensionOrigin: t.extensionOrigin,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
    }));
    return { paired: tokens.length > 0, tokens };
}
//# sourceMappingURL=library-tokens.js.map