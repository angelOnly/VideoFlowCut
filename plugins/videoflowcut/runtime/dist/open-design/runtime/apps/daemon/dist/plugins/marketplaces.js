// Marketplace registry — plan §3.B4 / spec §6 / §7 / §11.5 / §16 Phase 3
// (entry slice).
//
// Stores user-configured federated catalog indexes in
// `plugin_marketplaces`. The actual `od plugin install <name>` resolution
// through these catalogs lands in Phase 3 alongside the trust UI; this
// module is the storage + refresh half so the desktop / CLI can already
// register and inspect catalogs.
//
// We intentionally treat the catalog body as opaque JSON in v1 — Zod
// validation lives in `@open-design/plugin-runtime`'s parser and we only
// store what the parser returns. Trust default mirrors §9: a freshly
// added user-supplied marketplace is `restricted` (discovery only)
// unless `--trust` is passed.
import { randomUUID } from 'node:crypto';
import { safeExternalFetch } from './plugin-asset-cache.js';
import { parseMarketplace, } from '@open-design/plugin-runtime';
import { OPEN_DESIGN_PLUGIN_SPEC_VERSION, } from '@open-design/contracts';
import { parsePluginSpecifier, resolveMarketplaceEntryVersion, } from '../registry/versioning.js';
const HTTPS_RE = /^https:\/\//i;
const DEFAULT_MARKETPLACE_REPO = 'nexu-io/open-design';
const DEFAULT_MARKETPLACE_REPO_REF = 'main';
const DEFAULT_MARKETPLACE_REGISTRY_PATH = 'plugins/registry';
const PUBLIC_MARKETPLACE_BASE_URL = 'https://open-design.ai/marketplace';
const PUBLIC_PLUGINS_BASE_URL = 'https://open-design.ai/plugins';
function marketplaceRegistryRepo() {
    return (process.env.OD_MARKETPLACE_REPO?.trim() || DEFAULT_MARKETPLACE_REPO)
        .replace(/^\/+|\/+$/g, '');
}
export function marketplaceRegistryBaseUrl() {
    const explicit = process.env.OD_MARKETPLACE_REGISTRY_BASE_URL?.trim();
    if (explicit)
        return explicit.replace(/\/+$/, '');
    const repo = marketplaceRegistryRepo();
    const ref = (process.env.OD_MARKETPLACE_REPO_REF?.trim() || DEFAULT_MARKETPLACE_REPO_REF)
        .replace(/^\/+|\/+$/g, '');
    const registryPath = (process.env.OD_MARKETPLACE_REGISTRY_PATH?.trim() || DEFAULT_MARKETPLACE_REGISTRY_PATH)
        .replace(/^\/+|\/+$/g, '');
    return `https://raw.githubusercontent.com/${repo}/${ref}/${registryPath}`;
}
export function marketplaceManifestUrlForRegistry(id) {
    const registryId = id.trim().replace(/^\/+|\/+$/g, '');
    return `${marketplaceRegistryBaseUrl()}/${registryId}/open-design-marketplace.json`;
}
function registryIdFromBaseUrl(url, baseUrl) {
    const base = baseUrl.replace(/\/+$/, '');
    if (!url.startsWith(`${base}/`) || !url.endsWith('/open-design-marketplace.json')) {
        return null;
    }
    const id = url
        .slice(base.length + 1)
        .replace(/\/open-design-marketplace\.json$/, '');
    return id && !id.includes('/') ? id : null;
}
export function marketplaceRegistryIdFromUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return null;
    const configuredId = registryIdFromBaseUrl(trimmed, marketplaceRegistryBaseUrl());
    if (configuredId)
        return configuredId;
    const publicBases = [PUBLIC_MARKETPLACE_BASE_URL, PUBLIC_PLUGINS_BASE_URL];
    for (const base of publicBases) {
        if (trimmed === `${base}/open-design-marketplace.json`)
            return 'official';
        if (trimmed.startsWith(`${base}/`) && trimmed.endsWith('/open-design-marketplace.json')) {
            const id = trimmed
                .slice(base.length + 1)
                .replace(/\/open-design-marketplace\.json$/, '');
            if (id && !id.includes('/'))
                return id;
        }
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'raw.githubusercontent.com') {
            return null;
        }
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length < 6)
            return null;
        const [owner, repo] = parts;
        const allowedRepos = new Set([DEFAULT_MARKETPLACE_REPO, marketplaceRegistryRepo()]);
        if (!allowedRepos.has(`${owner}/${repo}`))
            return null;
        const marker = parts.findIndex((part, index) => part === 'plugins' && parts[index + 1] === 'registry');
        const id = marker >= 0 ? parts[marker + 2] : undefined;
        const filename = marker >= 0 ? parts[marker + 3] : undefined;
        return id && filename === 'open-design-marketplace.json' ? id : null;
    }
    catch {
        return null;
    }
}
export function resolveMarketplaceFetchUrl(url) {
    const trimmed = url.trim();
    const registryId = marketplaceRegistryIdFromUrl(trimmed);
    return registryId ? marketplaceManifestUrlForRegistry(registryId) : trimmed;
}
function normalizeMarketplaceTrust(value) {
    return value === 'official' || value === 'trusted' ? value : 'restricted';
}
export async function addMarketplace(db, input) {
    const url = resolveMarketplaceFetchUrl(input.url);
    if (!HTTPS_RE.test(url)) {
        return {
            ok: false,
            status: 400,
            message: 'marketplace url must use https://',
        };
    }
    const fetcher = input.fetcher ?? defaultFetcher;
    let resp;
    try {
        resp = await fetcher(url);
    }
    catch (err) {
        return {
            ok: false,
            status: 502,
            message: `Fetch failed: ${err.message ?? String(err)}`,
        };
    }
    if (!resp.ok) {
        return {
            ok: false,
            status: 502,
            message: `Marketplace fetch returned ${resp.status}`,
        };
    }
    const text = await resp.text();
    const parsed = parseMarketplace(text);
    if (!parsed.ok) {
        return {
            ok: false,
            status: 422,
            message: 'marketplace manifest failed validation',
            errors: parsed.errors,
        };
    }
    const id = randomUUID();
    const now = Date.now();
    const trust = normalizeMarketplaceTrust(input.trust);
    db.prepare(`INSERT INTO plugin_marketplaces (id, url, spec_version, version, trust, manifest_json, added_at, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, url, parsed.manifest.specVersion, parsed.manifest.version, trust, text, now, now);
    return {
        ok: true,
        row: {
            id,
            url,
            specVersion: parsed.manifest.specVersion,
            version: parsed.manifest.version,
            trust,
            manifest: parsed.manifest,
            addedAt: now,
            refreshedAt: now,
        },
        warnings: [],
    };
}
export function ensureMarketplaceManifest(db, input) {
    const parsed = parseMarketplace(input.manifestText);
    if (!parsed.ok) {
        return {
            ok: false,
            status: 422,
            message: 'marketplace manifest failed validation',
            errors: parsed.errors,
        };
    }
    const now = input.now ?? Date.now();
    const trust = normalizeMarketplaceTrust(input.trust);
    const existing = getMarketplace(db, input.id);
    db.prepare(`
    INSERT INTO plugin_marketplaces (id, url, spec_version, version, trust, manifest_json, added_at, refreshed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      spec_version = excluded.spec_version,
      version = excluded.version,
      trust = excluded.trust,
      manifest_json = excluded.manifest_json,
      refreshed_at = excluded.refreshed_at
  `).run(input.id, input.url, parsed.manifest.specVersion, parsed.manifest.version, trust, input.manifestText, existing?.addedAt ?? now, now);
    return {
        ok: true,
        row: {
            id: input.id,
            url: input.url,
            specVersion: parsed.manifest.specVersion,
            version: parsed.manifest.version,
            trust,
            manifest: parsed.manifest,
            addedAt: existing?.addedAt ?? now,
            refreshedAt: now,
        },
        warnings: [],
    };
}
export function listMarketplaces(db) {
    const rows = db
        .prepare(`SELECT id, url, spec_version, version, trust, manifest_json, added_at, refreshed_at FROM plugin_marketplaces ORDER BY added_at ASC`)
        .all();
    return rows.map((r) => {
        const manifest = safeParseManifest(r.manifest_json);
        return {
            id: r.id,
            url: r.url,
            specVersion: r.spec_version || manifest.specVersion,
            version: r.version === '0.0.0' ? manifest.version : r.version,
            trust: normalizeMarketplaceTrust(r.trust),
            manifest,
            addedAt: r.added_at,
            refreshedAt: r.refreshed_at,
        };
    });
}
export function getMarketplace(db, id) {
    const row = db
        .prepare(`SELECT id, url, spec_version, version, trust, manifest_json, added_at, refreshed_at FROM plugin_marketplaces WHERE id = ?`)
        .get(id);
    if (!row)
        return null;
    const manifest = safeParseManifest(row.manifest_json);
    return {
        id: row.id,
        url: row.url,
        specVersion: row.spec_version || manifest.specVersion,
        version: row.version === '0.0.0' ? manifest.version : row.version,
        trust: normalizeMarketplaceTrust(row.trust),
        manifest,
        addedAt: row.added_at,
        refreshedAt: row.refreshed_at,
    };
}
export function removeMarketplace(db, id) {
    const info = db.prepare(`DELETE FROM plugin_marketplaces WHERE id = ?`).run(id);
    return info.changes > 0;
}
export function setMarketplaceTrust(db, id, trust) {
    const info = db.prepare(`UPDATE plugin_marketplaces SET trust = ? WHERE id = ?`).run(trust, id);
    if (info.changes === 0)
        return null;
    return getMarketplace(db, id);
}
export async function refreshMarketplace(db, id, fetcher) {
    const existing = getMarketplace(db, id);
    if (!existing) {
        return { ok: false, status: 404, message: `marketplace ${id} not found` };
    }
    const useFetcher = fetcher ?? defaultFetcher;
    const url = resolveMarketplaceFetchUrl(existing.url);
    let resp;
    try {
        resp = await useFetcher(url);
    }
    catch (err) {
        return { ok: false, status: 502, message: `Fetch failed: ${err.message ?? String(err)}` };
    }
    if (!resp.ok)
        return { ok: false, status: 502, message: `Marketplace fetch returned ${resp.status}` };
    const text = await resp.text();
    const parsed = parseMarketplace(text);
    if (!parsed.ok) {
        return { ok: false, status: 422, message: 'marketplace manifest failed validation', errors: parsed.errors };
    }
    const now = Date.now();
    db.prepare(`UPDATE plugin_marketplaces SET url = ?, spec_version = ?, version = ?, manifest_json = ?, refreshed_at = ? WHERE id = ?`)
        .run(url, parsed.manifest.specVersion, parsed.manifest.version, text, now, id);
    return {
        ok: true,
        row: {
            ...existing,
            url,
            specVersion: parsed.manifest.specVersion,
            version: parsed.manifest.version,
            manifest: parsed.manifest,
            refreshedAt: now,
        },
    };
}
async function defaultFetcher(url) {
    const response = await safeExternalFetch(url);
    return {
        ok: response.ok,
        status: response.status,
        text: () => response.text(),
    };
}
function safeParseManifest(raw) {
    try {
        const parsed = parseMarketplace(raw);
        if (parsed.ok)
            return parsed.manifest;
    }
    catch {
        // fall through
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('legacy marketplace manifest is not an object');
        }
        const legacy = parsed;
        const metadata = typeof legacy['metadata'] === 'object' && legacy['metadata'] !== null
            ? legacy['metadata']
            : {};
        const plugins = Array.isArray(legacy?.['plugins'])
            ? legacy['plugins'].flatMap((entry) => {
                if (!entry || typeof entry !== 'object' || Array.isArray(entry))
                    return [];
                const obj = entry;
                const name = typeof obj['name'] === 'string' ? obj['name'] : '';
                const source = typeof obj['source'] === 'string' ? obj['source'] : '';
                if (!name || !source)
                    return [];
                return [{
                        ...obj,
                        name,
                        source,
                        version: typeof obj['version'] === 'string' && obj['version'].length > 0
                            ? obj['version']
                            : '0.0.0',
                    }];
            })
            : [];
        return {
            ...legacy,
            specVersion: typeof legacy['specVersion'] === 'string'
                ? legacy['specVersion']
                : OPEN_DESIGN_PLUGIN_SPEC_VERSION,
            name: typeof legacy['name'] === 'string' ? legacy['name'] : 'unknown',
            version: typeof legacy['version'] === 'string' && legacy['version'].length > 0
                ? legacy['version']
                : typeof metadata['version'] === 'string' && metadata['version'].length > 0
                    ? metadata['version']
                    : '0.0.0',
            plugins,
        };
    }
    catch {
        // fall through
    }
    // Last-resort fallback: return a minimal shape so the caller doesn't
    // explode if a database row was stored before a schema patch.
    return {
        specVersion: OPEN_DESIGN_PLUGIN_SPEC_VERSION,
        name: 'unknown',
        version: '0.0.0',
        plugins: [],
    };
}
export function resolvePluginInMarketplaces(db, pluginName) {
    const rows = listMarketplaces(db);
    const specifier = parsePluginSpecifier(pluginName);
    const target = specifier.name.trim().toLowerCase();
    if (!target)
        return null;
    for (const row of rows) {
        const entries = row.manifest.plugins ?? [];
        for (const entry of entries) {
            if (entry.name && entry.name.toLowerCase() === target) {
                const resolvedVersion = resolveMarketplaceEntryVersion(entry, specifier.range);
                if (!resolvedVersion)
                    continue;
                const result = {
                    marketplaceId: row.id,
                    marketplaceUrl: row.url,
                    marketplaceTrust: row.trust,
                    marketplaceSpecVersion: row.specVersion,
                    marketplaceVersion: row.version,
                    pluginName: entry.name,
                    pluginVersion: resolvedVersion.version,
                    source: resolvedVersion.source,
                };
                if (resolvedVersion.ref)
                    result.ref = resolvedVersion.ref;
                if (resolvedVersion.manifestDigest)
                    result.manifestDigest = resolvedVersion.manifestDigest;
                if (resolvedVersion.archiveIntegrity)
                    result.archiveIntegrity = resolvedVersion.archiveIntegrity;
                if (entry.description)
                    result.description = entry.description;
                return result;
            }
        }
    }
    return null;
}
//# sourceMappingURL=marketplaces.js.map