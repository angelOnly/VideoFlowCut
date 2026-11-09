// SQLite persistence for the OD Library (global asset registry).
//
// One logical asset per content hash. An asset may carry many source records
// (1 asset : N sources) so the same bytes captured/used in several places
// collapse to one row with several back-links. Owned assets keep their bytes
// under LIBRARY_DIR (content-addressed); referenced assets only point at a
// file already living inside a project / design system.
//
// This module is pure persistence — no filesystem writes, no hashing, no HTTP.
// Higher-level orchestration (storage, enrichment) lives in `library.ts`.
import { randomUUID } from 'node:crypto';
export function migrateLibrary(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS library_assets (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      storage TEXT NOT NULL DEFAULT 'owned',
      source_url TEXT,
      source_title TEXT,
      source_domain TEXT,
      captured_at INTEGER NOT NULL,
      archived_date TEXT NOT NULL,
      file_path TEXT,
      origin_project_id TEXT,
      rel_path TEXT,
      mime TEXT,
      width INTEGER,
      height INTEGER,
      size INTEGER,
      content_hash TEXT NOT NULL,
      caption TEXT,
      ocr_text TEXT,
      palette_json TEXT,
      tags_json TEXT,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(content_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_library_assets_archived
      ON library_assets(archived_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_library_assets_kind
      ON library_assets(kind, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_library_assets_domain
      ON library_assets(source_domain);
    CREATE INDEX IF NOT EXISTS idx_library_assets_origin
      ON library_assets(origin_project_id);

    CREATE TABLE IF NOT EXISTS library_asset_sources (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      project_id TEXT,
      conversation_id TEXT,
      run_id TEXT,
      design_system_id TEXT,
      rel_path TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(asset_id) REFERENCES library_assets(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_library_sources_asset
      ON library_asset_sources(asset_id);
    CREATE INDEX IF NOT EXISTS idx_library_sources_project
      ON library_asset_sources(project_id);
    CREATE INDEX IF NOT EXISTS idx_library_sources_ds
      ON library_asset_sources(design_system_id);

    CREATE TABLE IF NOT EXISTS library_embeddings (
      asset_id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      dim INTEGER NOT NULL,
      vector BLOB NOT NULL,
      indexed_text TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(asset_id) REFERENCES library_assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS library_tasks (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      progress_json TEXT NOT NULL DEFAULT '[]',
      error_json TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      FOREIGN KEY(asset_id) REFERENCES library_assets(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_library_tasks_asset
      ON library_tasks(asset_id);

    CREATE TABLE IF NOT EXISTS library_tokens (
      token_hash TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      extension_origin TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_digests (
      date TEXT PRIMARY KEY,
      project_id TEXT,
      artifact_path TEXT,
      summary TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}
// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
const ASSET_COLS = `id, kind, storage, source_url AS sourceUrl,
  source_title AS sourceTitle, source_domain AS sourceDomain,
  captured_at AS capturedAt, archived_date AS archivedDate,
  file_path AS filePath, origin_project_id AS originProjectId,
  rel_path AS relPath, mime, width, height, size,
  content_hash AS contentHash, caption, ocr_text AS ocrText,
  palette_json AS paletteJson, tags_json AS tagsJson,
  metadata_json AS metadataJson, created_at AS createdAt,
  updated_at AS updatedAt`;
function parseJson(value, fallback) {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
function normalizeAsset(raw, sources) {
    // Build with required fields, then add optionals only when present — the
    // daemon compiles under exactOptionalPropertyTypes, which rejects an
    // explicit `undefined` on an optional property.
    const asset = {
        id: raw.id,
        kind: raw.kind,
        storage: raw.storage,
        capturedAt: Number(raw.capturedAt),
        archivedDate: raw.archivedDate,
        contentHash: raw.contentHash,
        tags: parseJson(raw.tagsJson, []),
        sources,
        createdAt: Number(raw.createdAt),
        updatedAt: Number(raw.updatedAt),
    };
    if (raw.sourceUrl != null)
        asset.sourceUrl = raw.sourceUrl;
    if (raw.sourceTitle != null)
        asset.sourceTitle = raw.sourceTitle;
    if (raw.sourceDomain != null)
        asset.sourceDomain = raw.sourceDomain;
    if (raw.mime != null)
        asset.mime = raw.mime;
    if (raw.width != null)
        asset.width = raw.width;
    if (raw.height != null)
        asset.height = raw.height;
    if (raw.size != null)
        asset.size = raw.size;
    if (raw.caption != null)
        asset.caption = raw.caption;
    if (raw.ocrText != null)
        asset.ocrText = raw.ocrText;
    const palette = parseJson(raw.paletteJson, []);
    if (palette.length)
        asset.palette = palette;
    const metadata = parseJson(raw.metadataJson, undefined);
    if (metadata)
        asset.metadata = metadata;
    if (raw.originProjectId != null)
        asset.originProjectId = raw.originProjectId;
    if (raw.relPath != null)
        asset.relPath = raw.relPath;
    if (raw.filePath != null)
        asset.filePath = raw.filePath;
    return asset;
}
export function insertLibraryAsset(db, input) {
    const now = Date.now();
    db.prepare(`INSERT INTO library_assets
       (id, kind, storage, source_url, source_title, source_domain,
        captured_at, archived_date, file_path, origin_project_id, rel_path,
        mime, width, height, size, content_hash, caption, ocr_text,
        palette_json, tags_json, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(input.id, input.kind, input.storage, input.sourceUrl ?? null, input.sourceTitle ?? null, input.sourceDomain ?? null, input.capturedAt, input.archivedDate, input.filePath ?? null, input.originProjectId ?? null, input.relPath ?? null, input.mime ?? null, input.width ?? null, input.height ?? null, input.size ?? null, input.contentHash, input.caption ?? null, input.ocrText ?? null, input.palette ? JSON.stringify(input.palette) : null, JSON.stringify(input.tags ?? []), input.metadata ? JSON.stringify(input.metadata) : null, now, now);
}
export function updateLibraryAsset(db, id, patch) {
    const sets = [];
    const args = [];
    const assign = (col, value) => {
        sets.push(`${col} = ?`);
        args.push(value);
    };
    if ('caption' in patch)
        assign('caption', patch.caption ?? null);
    if ('ocrText' in patch)
        assign('ocr_text', patch.ocrText ?? null);
    if ('palette' in patch)
        assign('palette_json', patch.palette ? JSON.stringify(patch.palette) : null);
    if ('width' in patch)
        assign('width', patch.width ?? null);
    if ('height' in patch)
        assign('height', patch.height ?? null);
    if ('size' in patch)
        assign('size', patch.size ?? null);
    if ('mime' in patch)
        assign('mime', patch.mime ?? null);
    if ('tags' in patch)
        assign('tags_json', JSON.stringify(patch.tags ?? []));
    if ('metadata' in patch)
        assign('metadata_json', patch.metadata ? JSON.stringify(patch.metadata) : null);
    if (sets.length === 0)
        return;
    assign('updated_at', Date.now());
    args.push(id);
    db.prepare(`UPDATE library_assets SET ${sets.join(', ')} WHERE id = ?`).run(...args);
}
export function findLibraryAssetByHash(db, contentHash) {
    const raw = db
        .prepare(`SELECT ${ASSET_COLS} FROM library_assets WHERE content_hash = ?`)
        .get(contentHash);
    if (!raw)
        return null;
    return normalizeAsset(raw, listLibraryAssetSources(db, raw.id));
}
export function getLibraryAsset(db, id) {
    const raw = db
        .prepare(`SELECT ${ASSET_COLS} FROM library_assets WHERE id = ?`)
        .get(id);
    if (!raw)
        return null;
    return normalizeAsset(raw, listLibraryAssetSources(db, raw.id));
}
/**
 * The referenced asset that already mirrors a project file, keyed by its origin
 * (`origin_project_id` + `rel_path`). The reconcile sync uses this to skip files
 * it has already indexed *without* reading/hashing their bytes — the cheap guard
 * that keeps auto-reconcile-on-open near-free on a large workspace. Rides the
 * existing `idx_library_assets_origin` index.
 */
export function findReferencedAssetByOrigin(db, originProjectId, relPath) {
    const raw = db
        .prepare(`SELECT ${ASSET_COLS} FROM library_assets
        WHERE origin_project_id = ? AND rel_path = ? LIMIT 1`)
        .get(originProjectId, relPath);
    if (!raw)
        return null;
    return normalizeAsset(raw, listLibraryAssetSources(db, raw.id));
}
/**
 * Whether a `design-system` source row already exists for a design system id.
 * The reconcile sync registers exactly one card per design system, so this is
 * its "already synced?" short-circuit (no manifest read / preview hashing).
 */
export function hasDesignSystemSource(db, designSystemId) {
    const row = db
        .prepare(`SELECT 1 FROM library_asset_sources
        WHERE design_system_id = ? AND source_kind = 'design-system' LIMIT 1`)
        .get(designSystemId);
    return Boolean(row);
}
export function deleteLibraryAsset(db, id) {
    db.prepare(`DELETE FROM library_assets WHERE id = ?`).run(id);
}
export function listLibraryAssets(db, filter = {}) {
    const where = [];
    const args = [];
    if (filter.kind) {
        where.push('a.kind = ?');
        args.push(filter.kind);
    }
    if (filter.domain) {
        where.push('a.source_domain = ?');
        args.push(filter.domain);
    }
    if (filter.date) {
        where.push('a.archived_date = ?');
        args.push(filter.date);
    }
    if (filter.q) {
        const like = `%${filter.q}%`;
        where.push('(a.caption LIKE ? OR a.ocr_text LIKE ? OR a.source_title LIKE ? OR a.tags_json LIKE ? OR a.source_url LIKE ?)');
        args.push(like, like, like, like, like);
    }
    if (filter.tag) {
        where.push('a.tags_json LIKE ?');
        args.push(`%"${filter.tag}"%`);
    }
    if (filter.source) {
        where.push('EXISTS (SELECT 1 FROM library_asset_sources s WHERE s.asset_id = a.id AND s.source_kind = ?)');
        args.push(filter.source);
    }
    if (filter.projectId) {
        where.push('(a.origin_project_id = ? OR EXISTS (SELECT 1 FROM library_asset_sources s WHERE s.asset_id = a.id AND s.project_id = ?))');
        args.push(filter.projectId, filter.projectId);
    }
    if (filter.designSystemId) {
        where.push('EXISTS (SELECT 1 FROM library_asset_sources s WHERE s.asset_id = a.id AND s.design_system_id = ?)');
        args.push(filter.designSystemId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Number.isFinite(filter.limit) ? Math.max(1, Math.min(Number(filter.limit), 1000)) : 500;
    const raws = db
        .prepare(
    // Order by archive date first so the grid/timeline reflect when an
    // artifact was made (synced rows carry the file's own mtime as
    // archived_date), with created_at as the within-day tiebreak. Matches
    // idx_library_assets_archived.
    `SELECT ${ASSET_COLS} FROM library_assets a
       ${whereSql}
       ORDER BY a.archived_date DESC, a.created_at DESC
       LIMIT ${limit}`)
        .all(...args);
    if (raws.length === 0)
        return [];
    const sourcesByAsset = listLibraryAssetSourcesFor(db, raws.map((r) => r.id));
    return raws.map((raw) => normalizeAsset(raw, sourcesByAsset.get(raw.id) ?? []));
}
// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
const SOURCE_COLS = `id, asset_id AS assetId, source_kind AS sourceKind,
  project_id AS projectId, conversation_id AS conversationId,
  run_id AS runId, design_system_id AS designSystemId,
  rel_path AS relPath, created_at AS createdAt`;
function normalizeSource(raw) {
    const source = {
        id: raw.id,
        assetId: raw.assetId,
        sourceKind: raw.sourceKind,
        createdAt: Number(raw.createdAt),
    };
    if (raw.projectId != null)
        source.projectId = raw.projectId;
    if (raw.conversationId != null)
        source.conversationId = raw.conversationId;
    if (raw.runId != null)
        source.runId = raw.runId;
    if (raw.designSystemId != null)
        source.designSystemId = raw.designSystemId;
    if (raw.relPath != null)
        source.relPath = raw.relPath;
    return source;
}
export function listLibraryAssetSources(db, assetId) {
    const raws = db
        .prepare(`SELECT ${SOURCE_COLS} FROM library_asset_sources WHERE asset_id = ? ORDER BY created_at ASC`)
        .all(assetId);
    return raws.map(normalizeSource);
}
function listLibraryAssetSourcesFor(db, assetIds) {
    const out = new Map();
    if (assetIds.length === 0)
        return out;
    const placeholders = assetIds.map(() => '?').join(', ');
    const raws = db
        .prepare(`SELECT ${SOURCE_COLS} FROM library_asset_sources WHERE asset_id IN (${placeholders}) ORDER BY created_at ASC`)
        .all(...assetIds);
    for (const raw of raws) {
        const normalized = normalizeSource(raw);
        const list = out.get(raw.assetId) ?? [];
        list.push(normalized);
        out.set(raw.assetId, list);
    }
    return out;
}
/**
 * Append a source record, skipping an exact duplicate (same kind + same
 * project/conversation/run/design-system/relPath) so re-ingesting the same
 * asset from the same place does not multiply back-links.
 */
export function addLibraryAssetSource(db, input) {
    const existing = db
        .prepare(`SELECT id FROM library_asset_sources
        WHERE asset_id = ?
          AND source_kind = ?
          AND IFNULL(project_id,'') = IFNULL(?, '')
          AND IFNULL(conversation_id,'') = IFNULL(?, '')
          AND IFNULL(run_id,'') = IFNULL(?, '')
          AND IFNULL(design_system_id,'') = IFNULL(?, '')
          AND IFNULL(rel_path,'') = IFNULL(?, '')`)
        .get(input.assetId, input.sourceKind, input.projectId ?? null, input.conversationId ?? null, input.runId ?? null, input.designSystemId ?? null, input.relPath ?? null);
    if (existing)
        return;
    db.prepare(`INSERT INTO library_asset_sources
       (id, asset_id, source_kind, project_id, conversation_id, run_id,
        design_system_id, rel_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), input.assetId, input.sourceKind, input.projectId ?? null, input.conversationId ?? null, input.runId ?? null, input.designSystemId ?? null, input.relPath ?? null, Date.now());
}
function normalizeTask(raw) {
    return {
        id: raw.id,
        assetId: raw.assetId,
        status: raw.status,
        progress: parseJson(raw.progressJson, []),
        error: parseJson(raw.errorJson, null),
        startedAt: Number(raw.startedAt),
        endedAt: raw.endedAt == null ? null : Number(raw.endedAt),
    };
}
const TASK_COLS = `id, asset_id AS assetId, status, progress_json AS progressJson,
  error_json AS errorJson, started_at AS startedAt, ended_at AS endedAt`;
export function insertLibraryTask(db, task) {
    db.prepare(`INSERT INTO library_tasks (id, asset_id, status, progress_json, error_json, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run(task.id, task.assetId, task.status, JSON.stringify(task.progress ?? []), task.error ? JSON.stringify(task.error) : null, task.startedAt, task.endedAt ?? null);
}
export function getLibraryTask(db, id) {
    const raw = db.prepare(`SELECT ${TASK_COLS} FROM library_tasks WHERE id = ?`).get(id);
    return raw ? normalizeTask(raw) : null;
}
export function updateLibraryTask(db, id, patch) {
    const existing = getLibraryTask(db, id);
    if (!existing)
        return;
    const next = { ...existing, ...patch };
    db.prepare(`UPDATE library_tasks SET status = ?, progress_json = ?, error_json = ?, ended_at = ? WHERE id = ?`).run(next.status, JSON.stringify(next.progress ?? []), next.error ? JSON.stringify(next.error) : null, next.endedAt ?? null, id);
}
export function insertLibraryToken(db, row) {
    db.prepare(`INSERT OR REPLACE INTO library_tokens (token_hash, label, extension_origin, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?)`).run(row.tokenHash, row.label, row.extensionOrigin, row.createdAt, row.lastUsedAt);
}
export function findLibraryTokenByHash(db, tokenHash) {
    const raw = db
        .prepare(`SELECT token_hash AS tokenHash, label, extension_origin AS extensionOrigin,
              created_at AS createdAt, last_used_at AS lastUsedAt
         FROM library_tokens WHERE token_hash = ?`)
        .get(tokenHash);
    return raw ?? null;
}
export function touchLibraryToken(db, tokenHash) {
    db.prepare(`UPDATE library_tokens SET last_used_at = ? WHERE token_hash = ?`).run(Date.now(), tokenHash);
}
export function listLibraryTokens(db) {
    return db
        .prepare(`SELECT token_hash AS tokenHash, label, extension_origin AS extensionOrigin,
              created_at AS createdAt, last_used_at AS lastUsedAt
         FROM library_tokens ORDER BY created_at DESC`)
        .all();
}
export function listLibraryTokenOrigins(db) {
    const rows = db
        .prepare(`SELECT DISTINCT extension_origin AS origin FROM library_tokens`)
        .all();
    return rows.map((r) => r.origin).filter(Boolean);
}
//# sourceMappingURL=library-store.js.map