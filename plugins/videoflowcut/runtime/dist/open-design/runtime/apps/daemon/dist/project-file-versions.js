import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSafeId, kindFor, mimeFor, resolveProjectDir, validateProjectPath } from './projects.js';
const VERSION_ROOT = '.file-versions';
const VERSION_MANIFEST = 'manifest.json';
const VERSION_ID_RE = /^[A-Za-z0-9_-]+$/u;
const CONTENT_DIGEST_RE = /^[a-f0-9]{64}$/u;
const ORIGIN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const EXTERNAL_PLUGIN_IDS = new Set(['open-design']);
const versionFileLocks = new Map();
function codedError(message, code) {
    const err = new Error(message);
    err.code = code;
    return err;
}
function errorCode(err) {
    return typeof err === 'object' && err !== null && 'code' in err
        ? String(err.code)
        : undefined;
}
function isExistingTargetError(err) {
    const code = errorCode(err);
    return code === 'EEXIST' || code === 'ENOTEMPTY';
}
function fileVersionKey(fileName) {
    return createHash('sha256').update(fileName).digest('hex').slice(0, 24);
}
function versionRootFor(projectsRoot, projectId, fileName) {
    if (!isSafeId(projectId))
        throw new Error('invalid project id');
    return path.join(projectsRoot, projectId, VERSION_ROOT, fileVersionKey(fileName));
}
function versionLockKey(projectsRoot, projectId, fileName) {
    return `${path.resolve(projectsRoot)}\0${projectId}\0${fileName}`;
}
async function withVersionLockKey(key, fn) {
    const previous = versionFileLocks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    const chained = previous.then(() => current, () => current);
    versionFileLocks.set(key, chained);
    await previous.catch(() => undefined);
    try {
        return await fn();
    }
    finally {
        release();
        if (versionFileLocks.get(key) === chained) {
            versionFileLocks.delete(key);
        }
    }
}
async function withVersionFileLock(projectsRoot, projectId, fileName, fn) {
    return withVersionLockKey(versionLockKey(projectsRoot, projectId, fileName), fn);
}
async function withVersionFileLocks(projectsRoot, projectId, fileNames, fn) {
    const keys = [...new Set(fileNames.map((fileName) => versionLockKey(projectsRoot, projectId, fileName)))]
        .sort();
    const acquire = (index) => {
        if (index >= keys.length)
            return fn();
        const key = keys[index];
        if (!key)
            return fn();
        return withVersionLockKey(key, () => acquire(index + 1));
    };
    return acquire(0);
}
export async function withProjectFileVersionLock(projectsRoot, projectId, fileName, metadata, fn) {
    const safeName = validateUserFileName(fileName);
    assertProjectAvailable(projectsRoot, projectId, metadata);
    return withVersionFileLock(projectsRoot, projectId, safeName, () => fn({
        safeName,
        createVersion: (content, options = {}) => createProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options),
        ensureCurrentVersion: (content, options = {}) => ensureCurrentProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options),
        matchVersionContent: (content, versionId) => resolveProjectFileVersionContentMatchUnlocked(projectsRoot, projectId, safeName, content, versionId),
    }));
}
function normalizePrompt(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function normalizeContentPath(value, id) {
    if (typeof value === 'string' && /^[A-Za-z0-9._-]+\.html$/u.test(value) && !value.includes('..')) {
        return value;
    }
    return `${id}.html`;
}
function normalizeVersionNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function normalizeVersionId(value) {
    return typeof value === 'string' && VERSION_ID_RE.test(value) ? value : undefined;
}
function normalizeContentDigest(value) {
    return typeof value === 'string' && CONTENT_DIGEST_RE.test(value) ? value : undefined;
}
function normalizeOriginId(value) {
    return typeof value === 'string' && ORIGIN_ID_RE.test(value) ? value : undefined;
}
function normalizeArtifactOrigin(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    const raw = value;
    const entrySurface = raw.entrySurface;
    if (entrySurface !== 'open_design_ui'
        && entrySurface !== 'od_cli'
        && entrySurface !== 'external_mcp'
        && entrySurface !== 'unknown') {
        return undefined;
    }
    if (entrySurface === 'unknown')
        return { entrySurface };
    const externalPluginId = raw.externalPluginId;
    if (externalPluginId !== undefined
        && (typeof externalPluginId !== 'string' || !EXTERNAL_PLUGIN_IDS.has(externalPluginId))) {
        return undefined;
    }
    const pluginWorkflowId = raw.pluginWorkflowId === undefined
        ? undefined
        : normalizeOriginId(raw.pluginWorkflowId);
    const runId = raw.runId === undefined ? undefined : normalizeOriginId(raw.runId);
    if (raw.pluginWorkflowId !== undefined && !pluginWorkflowId)
        return undefined;
    if (raw.runId !== undefined && !runId)
        return undefined;
    const origin = { entrySurface };
    if (typeof externalPluginId === 'string')
        origin.externalPluginId = externalPluginId;
    if (pluginWorkflowId)
        origin.pluginWorkflowId = pluginWorkflowId;
    if (runId)
        origin.runId = runId;
    return origin;
}
function artifactOriginsEqual(left, right) {
    return (left?.entrySurface === right?.entrySurface
        && left?.externalPluginId === right?.externalPluginId
        && left?.pluginWorkflowId === right?.pluginWorkflowId
        && left?.runId === right?.runId);
}
export function projectFileVersionContentDigest(content) {
    return createHash('sha256').update(Buffer.from(String(content ?? ''), 'utf8')).digest('hex');
}
function normalizePromptSource(value) {
    return value === 'message' || value === 'project' || value === 'manual' || value === 'restore'
        ? value
        : undefined;
}
function normalizeVersionSource(value) {
    return value === 'ai' || value === 'manual' || value === 'restore' || value === 'sync' ? value : undefined;
}
function inferVersionSource(value, promptSource, restoreFromVersionId) {
    const normalized = normalizeVersionSource(value);
    if (normalized)
        return normalized;
    if (restoreFromVersionId || promptSource === 'restore')
        return 'restore';
    if (promptSource === 'manual')
        return 'manual';
    return 'ai';
}
function normalizeManifestEntry(raw, fileName, index) {
    const id = raw.id;
    if (typeof id !== 'string' || !VERSION_ID_RE.test(id))
        return null;
    const version = normalizeVersionNumber(raw.version, index + 1);
    const promptSource = normalizePromptSource(raw.promptSource);
    const restoreFromVersionId = normalizeVersionId(raw.restoreFromVersionId);
    const contentDigest = normalizeContentDigest(raw.contentDigest);
    const parentVersionId = normalizeVersionId(raw.parentVersionId);
    const origin = normalizeArtifactOrigin(raw.origin);
    const entry = {
        id,
        fileName,
        version,
        label: typeof raw.label === 'string' && raw.label.trim() ? raw.label : `Version ${version}`,
        createdAt: normalizeVersionNumber(raw.createdAt, Date.now()),
        source: inferVersionSource(raw.source, promptSource, restoreFromVersionId),
        prompt: normalizePrompt(raw.prompt),
        size: normalizeVersionNumber(raw.size, 0),
        mime: typeof raw.mime === 'string' ? raw.mime : mimeFor(fileName),
        kind: (typeof raw.kind === 'string' ? raw.kind : kindFor(fileName)),
        contentPath: normalizeContentPath(raw.contentPath, id),
    };
    if (promptSource)
        entry.promptSource = promptSource;
    if (restoreFromVersionId) {
        entry.restoreFromVersionId = restoreFromVersionId;
    }
    if (contentDigest)
        entry.contentDigest = contentDigest;
    if (parentVersionId)
        entry.parentVersionId = parentVersionId;
    if (origin)
        entry.origin = origin;
    return entry;
}
function normalizeManifest(raw, fileName) {
    if (!raw || typeof raw !== 'object')
        return [];
    const entries = Array.isArray(raw.entries)
        ? raw.entries
        : [];
    return entries.flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object')
            return [];
        const normalized = normalizeManifestEntry(entry, fileName, index);
        return normalized ? [normalized] : [];
    });
}
function normalizeManifestState(raw, fileName) {
    const entries = normalizeManifest(raw, fileName);
    const schemaVersion = raw && typeof raw === 'object'
        ? Number(raw.schemaVersion)
        : NaN;
    const persistedCurrentVersionId = raw && typeof raw === 'object'
        ? normalizeVersionId(raw.currentVersionId)
        : undefined;
    const currentVersionId = schemaVersion >= 2
        ? (persistedCurrentVersionId && entries.some((entry) => entry.id === persistedCurrentVersionId)
            ? persistedCurrentVersionId
            : null)
        : (entries.at(-1)?.id ?? null);
    const state = { entries, currentVersionId };
    const deletedAt = raw && typeof raw === 'object'
        ? Number(raw.deletedAt)
        : NaN;
    if (Number.isFinite(deletedAt) && deletedAt > 0) {
        state.deletedAt = deletedAt;
    }
    return state;
}
function assertProjectAvailable(projectsRoot, projectId, metadata) {
    resolveProjectDir(projectsRoot, projectId, metadata);
}
async function readVersionManifestState(projectsRoot, projectId, fileName) {
    try {
        const raw = await readFile(path.join(versionRootFor(projectsRoot, projectId, fileName), VERSION_MANIFEST), 'utf8');
        return normalizeManifestState(JSON.parse(raw), fileName);
    }
    catch (err) {
        if (errorCode(err) === 'ENOENT')
            return { entries: [], currentVersionId: null };
        throw err;
    }
}
async function writeVersionManifest(projectsRoot, projectId, fileName, entries, options) {
    const root = versionRootFor(projectsRoot, projectId, fileName);
    await mkdir(root, { recursive: true });
    const manifest = {
        schemaVersion: 2,
        fileName,
        currentVersionId: options.currentVersionId,
        entries,
    };
    if (typeof options.deletedAt === 'number' && Number.isFinite(options.deletedAt)) {
        manifest.deletedAt = options.deletedAt;
    }
    await writeFile(path.join(root, VERSION_MANIFEST), JSON.stringify(manifest, null, 2));
}
function publicVersion(entry, currentId) {
    const version = {
        id: entry.id,
        fileName: entry.fileName,
        version: entry.version,
        label: entry.label,
        createdAt: entry.createdAt,
        source: entry.source,
        prompt: entry.prompt,
        size: entry.size,
        mime: entry.mime,
        kind: entry.kind,
        current: currentId === entry.id,
    };
    if (entry.promptSource)
        version.promptSource = entry.promptSource;
    if (entry.restoreFromVersionId)
        version.restoreFromVersionId = entry.restoreFromVersionId;
    if (entry.contentDigest)
        version.contentDigest = entry.contentDigest;
    if (entry.parentVersionId)
        version.parentVersionId = entry.parentVersionId;
    if (entry.origin)
        version.origin = entry.origin;
    return version;
}
function nextLabel(version, restoredFrom) {
    if (!restoredFrom)
        return `Version ${version}`;
    return Number.isFinite(restoredFrom.version)
        ? `Version ${version} · restored from v${restoredFrom.version}`
        : `Version ${version}`;
}
function validateUserFileName(fileName) {
    const safeName = validateProjectPath(fileName);
    if (isProjectFileVersionPath(safeName)) {
        throw codedError('file not found', 'ENOENT');
    }
    return safeName;
}
export function isProjectFileVersionPath(raw) {
    const value = String(raw ?? '').replace(/\\/g, '/');
    return value.split('/').filter(Boolean).includes(VERSION_ROOT);
}
export async function listProjectFileVersions(projectsRoot, projectId, fileName, metadata) {
    const safeName = validateUserFileName(fileName);
    assertProjectAvailable(projectsRoot, projectId, metadata);
    const state = await readVersionManifestState(projectsRoot, projectId, safeName);
    return state.entries.map((entry) => publicVersion(entry, state.currentVersionId));
}
export async function readProjectFileVersion(projectsRoot, projectId, fileName, versionId, metadata) {
    const safeName = validateUserFileName(fileName);
    const safeVersionId = String(versionId || '').trim();
    if (!safeVersionId || !VERSION_ID_RE.test(safeVersionId)) {
        throw codedError('version id required', 'EINVAL');
    }
    assertProjectAvailable(projectsRoot, projectId, metadata);
    const state = await readVersionManifestState(projectsRoot, projectId, safeName);
    const entry = state.entries.find((item) => item.id === safeVersionId);
    if (!entry) {
        throw codedError('version not found', 'ENOENT');
    }
    const content = await readFile(path.join(versionRootFor(projectsRoot, projectId, safeName), entry.contentPath), 'utf8');
    return {
        version: publicVersion(entry, state.currentVersionId),
        content,
    };
}
export async function createProjectFileVersion(projectsRoot, projectId, fileName, content, options = {}, metadata) {
    const safeName = validateUserFileName(fileName);
    assertProjectAvailable(projectsRoot, projectId, metadata);
    return withVersionFileLock(projectsRoot, projectId, safeName, () => createProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options));
}
async function createProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options) {
    const root = versionRootFor(projectsRoot, projectId, safeName);
    await mkdir(root, { recursive: true });
    const state = await readVersionManifestState(projectsRoot, projectId, safeName);
    const preserveDeletedHistory = typeof options.restoreFromVersionId === 'string' &&
        state.entries.some((entry) => entry.id === options.restoreFromVersionId);
    let entries = state.entries;
    let priorCurrentVersionId = state.currentVersionId;
    if (state.deletedAt && !preserveDeletedHistory) {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });
        entries = [];
        priorCurrentVersionId = null;
    }
    const restoredFrom = typeof options.restoreFromVersionId === 'string'
        ? entries.find((entry) => entry.id === options.restoreFromVersionId) ?? null
        : null;
    const requestedParentVersionId = normalizeVersionId(options.parentVersionId);
    const explicitCurrentParent = requestedParentVersionId && requestedParentVersionId === priorCurrentVersionId
        ? entries.find((entry) => entry.id === requestedParentVersionId) ?? null
        : null;
    const now = Date.now();
    const version = entries.reduce((max, entry) => Math.max(max, Number(entry.version) || 0), 0) + 1;
    const id = randomUUID();
    const contentPath = `${String(version).padStart(4, '0')}-${id}.html`;
    const text = String(content ?? '');
    const source = inferVersionSource(options.source, options.promptSource, options.restoreFromVersionId);
    const entry = {
        id,
        fileName: safeName,
        version,
        label: typeof options.label === 'string' && options.label.trim()
            ? options.label.trim()
            : nextLabel(version, restoredFrom),
        createdAt: now,
        source,
        prompt: normalizePrompt(options.prompt),
        size: Buffer.byteLength(text),
        mime: mimeFor(safeName),
        kind: kindFor(safeName),
        contentPath,
        contentDigest: projectFileVersionContentDigest(text),
    };
    if (options.promptSource)
        entry.promptSource = options.promptSource;
    if (typeof options.restoreFromVersionId === 'string' && VERSION_ID_RE.test(options.restoreFromVersionId)) {
        entry.restoreFromVersionId = options.restoreFromVersionId;
    }
    if (source === 'restore' && restoredFrom?.contentDigest) {
        entry.parentVersionId = restoredFrom.id;
        if (restoredFrom.origin)
            entry.origin = restoredFrom.origin;
    }
    else if (source === 'manual' && explicitCurrentParent?.contentDigest) {
        entry.parentVersionId = explicitCurrentParent.id;
        if (explicitCurrentParent.origin)
            entry.origin = explicitCurrentParent.origin;
    }
    else if (source === 'ai') {
        const origin = normalizeArtifactOrigin(options.origin);
        if (origin)
            entry.origin = origin;
    }
    await writeFile(path.join(root, contentPath), text);
    const nextEntries = [...entries, entry];
    await writeVersionManifest(projectsRoot, projectId, safeName, nextEntries, {
        currentVersionId: id,
    });
    return publicVersion(entry, id);
}
export async function markProjectFileVersionStoreDeleted(projectsRoot, projectId, fileName, metadata) {
    const safeName = validateUserFileName(fileName);
    if (!/\.html?$/i.test(safeName))
        return;
    assertProjectAvailable(projectsRoot, projectId, metadata);
    await withVersionFileLock(projectsRoot, projectId, safeName, async () => {
        const state = await readVersionManifestState(projectsRoot, projectId, safeName);
        if (state.entries.length === 0)
            return;
        await writeVersionManifest(projectsRoot, projectId, safeName, state.entries, {
            currentVersionId: state.currentVersionId,
            deletedAt: Date.now(),
        });
    });
}
export async function renameProjectFileVersionStore(projectsRoot, projectId, fromName, toName, metadata) {
    const safeFrom = validateUserFileName(fromName);
    const safeTo = validateUserFileName(toName);
    if (safeFrom === safeTo)
        return;
    if (!/\.html?$/i.test(safeFrom) || !/\.html?$/i.test(safeTo))
        return;
    assertProjectAvailable(projectsRoot, projectId, metadata);
    await withVersionFileLocks(projectsRoot, projectId, [safeFrom, safeTo], async () => {
        const oldRoot = versionRootFor(projectsRoot, projectId, safeFrom);
        const newRoot = versionRootFor(projectsRoot, projectId, safeTo);
        try {
            await stat(oldRoot);
        }
        catch (err) {
            if (errorCode(err) === 'ENOENT')
                return;
            throw err;
        }
        const fromState = await readVersionManifestState(projectsRoot, projectId, safeFrom);
        if (fromState.deletedAt) {
            await rm(oldRoot, { recursive: true, force: true });
            const toState = await readVersionManifestState(projectsRoot, projectId, safeTo);
            if (toState.deletedAt) {
                await rm(newRoot, { recursive: true, force: true });
            }
            return;
        }
        const renamedEntries = fromState.entries.map((entry) => ({ ...entry, fileName: safeTo }));
        try {
            await rename(oldRoot, newRoot);
            await writeVersionManifest(projectsRoot, projectId, safeTo, renamedEntries, {
                currentVersionId: fromState.currentVersionId,
            });
            return;
        }
        catch (err) {
            if (!isExistingTargetError(err))
                throw err;
        }
        const existingState = await readVersionManifestState(projectsRoot, projectId, safeTo);
        if (existingState.deletedAt) {
            await rm(newRoot, { recursive: true, force: true });
            await rename(oldRoot, newRoot);
            await writeVersionManifest(projectsRoot, projectId, safeTo, renamedEntries, {
                currentVersionId: fromState.currentVersionId,
            });
            return;
        }
        await mkdir(newRoot, { recursive: true });
        const existingEntries = existingState.entries;
        const existingIds = new Set(existingEntries.map((entry) => entry.id));
        for (const entry of renamedEntries) {
            if (existingIds.has(entry.id))
                continue;
            try {
                await rename(path.join(oldRoot, entry.contentPath), path.join(newRoot, entry.contentPath));
            }
            catch (err) {
                if (errorCode(err) !== 'ENOENT' && errorCode(err) !== 'EEXIST')
                    throw err;
            }
        }
        await writeVersionManifest(projectsRoot, projectId, safeTo, [
            ...existingEntries,
            ...renamedEntries.filter((entry) => !existingIds.has(entry.id)),
        ], {
            currentVersionId: fromState.currentVersionId ?? existingState.currentVersionId,
        });
        await rm(oldRoot, { recursive: true, force: true });
    });
}
export async function ensureCurrentProjectFileVersion(projectsRoot, projectId, fileName, content, options = {}, metadata) {
    const safeName = validateUserFileName(fileName);
    if (!/\.html?$/i.test(safeName))
        return null;
    assertProjectAvailable(projectsRoot, projectId, metadata);
    return withVersionFileLock(projectsRoot, projectId, safeName, () => ensureCurrentProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options));
}
async function ensureCurrentProjectFileVersionUnlocked(projectsRoot, projectId, safeName, content, options) {
    if (!/\.html?$/i.test(safeName))
        return null;
    const text = String(content ?? '');
    const state = await readVersionManifestState(projectsRoot, projectId, safeName);
    if (!state.deletedAt) {
        const current = state.currentVersionId
            ? state.entries.find((entry) => entry.id === state.currentVersionId)
            : null;
        if (current?.contentPath) {
            try {
                const prior = await readFile(path.join(versionRootFor(projectsRoot, projectId, safeName), current.contentPath), 'utf8');
                if (prior === text) {
                    const source = inferVersionSource(options.source, options.promptSource, options.restoreFromVersionId);
                    if (source !== 'ai'
                        || artifactOriginsEqual(current.origin, normalizeArtifactOrigin(options.origin))) {
                        return publicVersion(current, state.currentVersionId);
                    }
                }
            }
            catch (err) {
                if (errorCode(err) !== 'ENOENT')
                    throw err;
            }
        }
    }
    return createProjectFileVersionUnlocked(projectsRoot, projectId, safeName, text, options);
}
export async function resolveProjectFileVersionContentMatch(projectsRoot, projectId, fileName, content, versionId, metadata) {
    const safeName = validateUserFileName(fileName);
    if (!/\.html?$/i.test(safeName)) {
        return { status: 'missing_version', version: null };
    }
    assertProjectAvailable(projectsRoot, projectId, metadata);
    return withVersionFileLock(projectsRoot, projectId, safeName, () => resolveProjectFileVersionContentMatchUnlocked(projectsRoot, projectId, safeName, content, versionId));
}
async function resolveProjectFileVersionContentMatchUnlocked(projectsRoot, projectId, safeName, content, versionId) {
    const state = await readVersionManifestState(projectsRoot, projectId, safeName);
    const requestedVersionId = versionId === undefined
        ? state.currentVersionId
        : normalizeVersionId(versionId);
    if (!requestedVersionId)
        return { status: 'missing_version', version: null };
    const entry = state.entries.find((candidate) => candidate.id === requestedVersionId);
    if (!entry)
        return { status: 'missing_version', version: null };
    const version = publicVersion(entry, state.currentVersionId);
    if (!entry.contentDigest)
        return { status: 'unknown', version };
    return {
        status: projectFileVersionContentDigest(content) === entry.contentDigest
            ? 'matched'
            : 'digest_mismatch',
        version,
    };
}
export async function getProjectFileVersionRootStats(projectsRoot, projectId, fileName, metadata) {
    const safeName = validateUserFileName(fileName);
    assertProjectAvailable(projectsRoot, projectId, metadata);
    const root = versionRootFor(projectsRoot, projectId, safeName);
    const entries = await readdir(root).catch(() => []);
    const st = await stat(root).catch(() => null);
    return { root, entries, mtime: st?.mtimeMs ?? 0 };
}
//# sourceMappingURL=project-file-versions.js.map