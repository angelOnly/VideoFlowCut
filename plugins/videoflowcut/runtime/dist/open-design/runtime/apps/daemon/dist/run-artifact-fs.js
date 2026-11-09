// Agent-agnostic artifact counter. Instead of reconstructing file writes from
// each agent's tool-call stream (which only `claude_code` reports in a shape
// `run-artifacts.ts#countNewArtifacts` recognizes — see the audit that found
// codex / opencode / gemini / cursor / amr / … all report artifact_count: 0),
// this snapshots the project's artifact files before the run and diffs against
// a snapshot taken at run end. Whatever runtime the agent used, a real file
// write or edit shows up as a created or modified path.
//
// Why a fingerprint diff and not a file-count delta: a run that EDITS an
// existing artifact leaves the directory's file count unchanged (still 1 file)
// yet did produce artifact work. Counting only "new files" would miss every
// iteration turn. So we compare per-path fingerprints and count a path as
// touched when it is new OR its size/mtime changed — which matches the
// tool-stream counter's existing semantics (both Write and Edit count).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isArtifactPath, isDesignSystemFile, isPreviewModulePath, } from './runtimes/run-artifacts.js';
import { parsePersistedManifest } from './artifacts/manifest.js';
// A file worth fingerprinting for run-finish bookkeeping: a user-facing
// artifact (HTML / image / video / audio) OR a design-system marker
// (`DESIGN.md`). Preview modules (`preview/*.html`) are already covered by the
// artifact-extension check; they are classified at diff time.
function isTrackedRunFile(name) {
    return isArtifactPath(name) || isDesignSystemFile(name) || isRenderDependencyPath(name);
}
// Manifest-backed artifacts: `create_artifact` persists a manifest sidecar
// next to the artifact file as `<file>.artifact.json`, and the manifest layer
// (`artifacts/manifest.ts`) accepts entry kinds the extension whitelist above
// does not — most importantly Markdown exports (`markdown-document`). A file
// with a valid sidecar therefore counts as a tracked run artifact even though
// its extension is not renderable, while the sidecar itself is metadata and
// never tracked. See #7579: a manifest-backed `.md` export was invisible to
// the snapshot/diff, so finalization reported `artifactCount: 0` →
// `no_artifact`.
const MANIFEST_SIDECAR_SUFFIX = '.artifact.json';
function isManifestSidecarPath(name) {
    return name.toLowerCase().endsWith(MANIFEST_SIDECAR_SUFFIX);
}
function manifestSidecarFor(fullPath) {
    return fullPath + MANIFEST_SIDECAR_SUFFIX;
}
// Valid = parses through the same manifest layer `create_artifact` writes with
// (`parsePersistedManifest`), so a stray or malformed sidecar never widens
// tracking to arbitrary unmanifested files.
function hasValidManifestSidecar(fullPath) {
    if (isManifestSidecarPath(fullPath))
        return false;
    let raw;
    try {
        raw = fs.readFileSync(manifestSidecarFor(fullPath), 'utf8');
    }
    catch {
        return false;
    }
    return parsePersistedManifest(raw, path.basename(fullPath)) !== null;
}
async function hasValidManifestSidecarAsync(fullPath) {
    if (isManifestSidecarPath(fullPath))
        return false;
    let raw;
    try {
        raw = await fs.promises.readFile(manifestSidecarFor(fullPath), 'utf8');
    }
    catch {
        return false;
    }
    return parsePersistedManifest(raw, path.basename(fullPath)) !== null;
}
const RENDER_DEPENDENCY_EXTENSIONS = new Set([
    '.css',
    '.cjs',
    '.js',
    '.jsx',
    '.mjs',
    '.ts',
    '.tsx',
]);
const SUPPORTING_MEDIA_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg',
    '.mp4', '.mov', '.webm', '.mp3', '.wav', '.m4a',
]);
function extensionOf(filePath) {
    return path.extname(filePath).toLowerCase();
}
function isRenderDependencyPath(filePath) {
    return RENDER_DEPENDENCY_EXTENSIONS.has(extensionOf(filePath));
}
function isSupportingMediaPath(filePath) {
    return SUPPORTING_MEDIA_EXTENSIONS.has(extensionOf(filePath));
}
// Files larger than this are not content-hashed (cost bound). Artifacts that
// get edited in place — HTML, DESIGN.md, SVG — are small; large media are
// regenerated wholesale (size changes), so size+mtime suffices for them.
const HASH_MAX_BYTES = 1024 * 1024;
function fingerprintFile(full, size, mtimeMs, onReadFailure) {
    let hash = null;
    if (size <= HASH_MAX_BYTES) {
        try {
            hash = createHash('sha1').update(fs.readFileSync(full)).digest('hex');
        }
        catch {
            onReadFailure();
            hash = null;
        }
    }
    return { size, mtimeMs, hash };
}
async function fingerprintFileAsync(full, size, mtimeMs, onReadFailure) {
    let hash = null;
    if (size <= HASH_MAX_BYTES) {
        try {
            hash = createHash('sha1').update(await fs.promises.readFile(full)).digest('hex');
        }
        catch {
            onReadFailure();
            hash = null;
        }
    }
    return { size, mtimeMs, hash };
}
// Coverage is local to an actual scan, not inferred from a zero-sized Map.
// Keep legacy counters and the existing scan/permission boundaries unchanged.
const snapshotCoverage = new WeakMap();
// Directories that never hold user-facing artifacts; skipped so the walk stays
// cheap and never wanders into dependencies, VCS, or daemon scratch.
const IGNORED_DIR_NAMES = new Set([
    'node_modules',
    '.git',
    '.tmp',
    'dist',
    'build',
    '.next',
    '.cache',
    '.turbo',
]);
// Safety cap: a pathological project tree must not turn run-finish bookkeeping
// into an unbounded walk. Snapshots are best-effort; truncation only risks a
// minor undercount, never a hang.
const MAX_FILES = 5000;
// Separate cap for files outside the tracked-extension set (markdown, docs,
// code, JSON, …). These feed only the coarse `files_written_count` signal, so
// they get their own budget instead of competing with — and on a large
// imported repo starving — the artifact fingerprints that the primary
// `artifact_count` funnel depends on.
const MAX_OTHER_FILES = 5000;
// Cheap fingerprint for non-tracked files: size + mtime only, no content read.
// `files_written_count` is a boolean-ish "did the run write anything" signal,
// so the pathological same-size-same-mtime rewrite these miss is acceptable —
// hashing every code file in an imported repo at run finish is not.
function statOnlyFingerprint(size, mtimeMs) {
    return { size, mtimeMs, hash: null };
}
// Walk `rootDir` and fingerprint every file: tracked files (artifact
// extensions + DESIGN.md + render dependencies, per `run-artifacts.ts`) get a
// full content fingerprint; every other file gets a cheap size+mtime stamp so
// the diff can also report the all-file-types `files_written_count`. Each class
// has its own cap (`MAX_FILES` / `MAX_OTHER_FILES`) so a code-heavy imported
// repo cannot starve artifact tracking. Best-effort: unreadable dirs/files are
// skipped, never thrown. Returns an empty snapshot when the root does not
// exist.
export function snapshotProjectArtifacts(rootDir) {
    const snapshot = new Map();
    let complete = true;
    const markIncomplete = () => { complete = false; };
    let trackedCount = 0;
    let otherCount = 0;
    const walk = (dir) => {
        if (trackedCount >= MAX_FILES && otherCount >= MAX_OTHER_FILES) {
            complete = false;
            return;
        }
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            complete = false;
            return;
        }
        for (const entry of entries) {
            if (trackedCount >= MAX_FILES && otherCount >= MAX_OTHER_FILES) {
                complete = false;
                return;
            }
            if (entry.isDirectory()) {
                if (IGNORED_DIR_NAMES.has(entry.name) || entry.name.startsWith('.'))
                    continue;
                walk(path.join(dir, entry.name));
            }
            else if (entry.isFile() && !isManifestSidecarPath(entry.name)) {
                const full = path.join(dir, entry.name);
                const tracked = isTrackedRunFile(entry.name);
                const manifestBacked = !tracked && hasValidManifestSidecar(full);
                const trackedForBudget = tracked || manifestBacked;
                if (trackedForBudget ? trackedCount >= MAX_FILES : otherCount >= MAX_OTHER_FILES) {
                    complete = false;
                    continue;
                }
                try {
                    const stat = fs.statSync(full);
                    const fingerprint = trackedForBudget
                        ? fingerprintFile(full, stat.size, stat.mtimeMs, markIncomplete)
                        : statOnlyFingerprint(stat.size, stat.mtimeMs);
                    snapshot.set(full, manifestBacked ? { ...fingerprint, manifestBacked } : fingerprint);
                    if (trackedForBudget)
                        trackedCount += 1;
                    else
                        otherCount += 1;
                }
                catch {
                    complete = false;
                    // Race (file removed mid-walk) or permission error — skip.
                }
            }
        }
    };
    walk(rootDir);
    snapshotCoverage.set(snapshot, complete);
    return snapshot;
}
// Async counterpart used by the normal run start/finish path. It deliberately
// preserves the synchronous snapshot's traversal order, cap, filtering, and
// best-effort error behavior; the only difference is that directory, stat, and
// content reads yield the daemon event loop instead of pausing unrelated HTTP
// and SSE traffic while a large project is scanned.
export async function snapshotProjectArtifactsAsync(rootDir) {
    const snapshot = new Map();
    let complete = true;
    const markIncomplete = () => { complete = false; };
    const files = [];
    let trackedCount = 0;
    let otherCount = 0;
    const walk = async (dir) => {
        if (trackedCount >= MAX_FILES && otherCount >= MAX_OTHER_FILES) {
            complete = false;
            return;
        }
        let entries;
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        }
        catch {
            complete = false;
            return;
        }
        for (const entry of entries) {
            if (trackedCount >= MAX_FILES && otherCount >= MAX_OTHER_FILES) {
                complete = false;
                return;
            }
            if (entry.isDirectory()) {
                if (IGNORED_DIR_NAMES.has(entry.name) || entry.name.startsWith('.'))
                    continue;
                await walk(path.join(dir, entry.name));
            }
            else if (entry.isFile() && !isManifestSidecarPath(entry.name)) {
                const full = path.join(dir, entry.name);
                const tracked = isTrackedRunFile(entry.name);
                const manifestBacked = !tracked && await hasValidManifestSidecarAsync(full);
                const trackedForBudget = tracked || manifestBacked;
                if (trackedForBudget ? trackedCount >= MAX_FILES : otherCount >= MAX_OTHER_FILES) {
                    complete = false;
                    continue;
                }
                files.push({ full, tracked: trackedForBudget, manifestBacked });
                if (trackedForBudget)
                    trackedCount += 1;
                else
                    otherCount += 1;
            }
        }
    };
    await walk(rootDir);
    // A small worker pool prevents a 5k-file project from turning the async
    // safety fix into a long serial tail, while still bounding filesystem load.
    // Results are committed in traversal order so diff output remains stable.
    // Non-tracked files only need a stat (size+mtime stamp), never a content
    // read, so widening the walk to all files adds no hashing cost.
    const fingerprints = new Array(files.length);
    let nextIndex = 0;
    const fingerprintWorker = async () => {
        for (;;) {
            const index = nextIndex;
            if (index >= files.length)
                return;
            nextIndex += 1;
            const { full, tracked, manifestBacked } = files[index];
            try {
                const stat = await fs.promises.stat(full);
                const fingerprint = tracked
                    ? await fingerprintFileAsync(full, stat.size, stat.mtimeMs, markIncomplete)
                    : statOnlyFingerprint(stat.size, stat.mtimeMs);
                fingerprints[index] = [
                    full,
                    manifestBacked ? { ...fingerprint, manifestBacked: true } : fingerprint,
                ];
            }
            catch {
                complete = false;
                fingerprints[index] = null;
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(16, files.length) }, () => fingerprintWorker()));
    for (const fingerprint of fingerprints) {
        if (fingerprint)
            snapshot.set(fingerprint[0], fingerprint[1]);
    }
    snapshotCoverage.set(snapshot, complete);
    return snapshot;
}
// Classify created vs modified tracked files between two snapshots into the
// artifact / design-system / preview-module signals the run_finished event
// needs. Deletions are intentionally ignored: removing a file is not artifact
// production.
export function diffRunArtifacts(before, after) {
    let created = 0;
    let modified = 0;
    let previewModuleCount = 0;
    let designSystemCreated = false;
    const touchedPaths = [];
    let contentCreated = 0;
    let contentModified = 0;
    let renderDependencyTouched = 0;
    let supportingMediaTouched = 0;
    let filesWritten = 0;
    const contentTouchedPaths = [];
    const renderDependencyTouchedPaths = [];
    for (const [filePath, fingerprint] of after) {
        const prior = before.get(filePath);
        const isNew = !prior;
        const isChanged = !!prior &&
            (prior.size !== fingerprint.size ||
                prior.mtimeMs !== fingerprint.mtimeMs ||
                prior.hash !== fingerprint.hash);
        if (!isNew && !isChanged)
            continue;
        filesWritten += 1;
        const contentChanged = isNew || (!!prior && (prior.hash !== null && fingerprint.hash !== null
            ? prior.hash !== fingerprint.hash
            : prior.size !== fingerprint.size || prior.mtimeMs !== fingerprint.mtimeMs));
        // Snapshot keys are native paths (`path.join` → backslashes on Windows),
        // but `isPreviewModulePath` / `isDesignSystemFile` match forward slashes
        // only. Normalize separators so the design-system / preview signals work on
        // Windows project runs, not just POSIX.
        const classifyPath = filePath.replace(/\\/g, '/');
        // Manifest-backed files count as artifacts despite a non-renderable
        // extension; the manifest sidecar was validated at snapshot time.
        if (isArtifactPath(classifyPath) || fingerprint.manifestBacked === true) {
            if (isNew)
                created += 1;
            else
                modified += 1;
            touchedPaths.push(filePath);
            if (contentChanged) {
                if (isNew)
                    contentCreated += 1;
                else
                    contentModified += 1;
                contentTouchedPaths.push(filePath);
                if (isSupportingMediaPath(classifyPath))
                    supportingMediaTouched += 1;
            }
        }
        if (contentChanged && isRenderDependencyPath(classifyPath)) {
            renderDependencyTouched += 1;
            renderDependencyTouchedPaths.push(filePath);
        }
        if (isPreviewModulePath(classifyPath))
            previewModuleCount += 1;
        if (isDesignSystemFile(classifyPath))
            designSystemCreated = true;
    }
    return {
        created,
        modified,
        touched: created + modified,
        designSystemCreated,
        previewModuleCount,
        touchedPaths,
        contentCreated,
        contentModified,
        contentTouched: contentCreated + contentModified,
        contentTouchedPaths,
        renderDependencyTouched,
        renderDependencyTouchedPaths,
        supportingMediaTouched,
        filesWritten,
        ...(snapshotCoverage.get(before) !== true || snapshotCoverage.get(after) !== true
            ? { filesWrittenUnknown: true } : {}),
    };
}
export function primaryArtifactChangeForRun(input) {
    if (input.projectKind === 'design_system'
        || input.interactionMode === 'ask'
        || input.interactionMode === 'plan'
        || input.clarificationRequested) {
        return undefined;
    }
    const changed = (() => {
        switch (input.projectKind) {
            case 'prototype':
            case 'live_artifact':
            case 'slide_deck':
            case 'template':
                return input.diff.contentTouchedPaths.some((filePath) => /\.html?$/i.test(filePath))
                    || input.diff.renderDependencyTouched > 0;
            case 'image':
                return input.diff.contentTouchedPaths.some((filePath) => /\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(filePath));
            case 'video':
                return input.diff.contentTouchedPaths.some((filePath) => /\.(?:mp4|mov|webm)$/i.test(filePath));
            case 'audio':
                return input.diff.contentTouchedPaths.some((filePath) => /\.(?:mp3|wav|m4a)$/i.test(filePath));
            default:
                return input.diff.contentTouched > 0 || input.diff.renderDependencyTouched > 0;
        }
    })();
    if (!changed)
        return 'none';
    return input.hadExistingArtifacts ? 'modified' : 'created';
}
export function supportingAssetFilesChangedForRun(diff, projectKind) {
    return projectKind === 'prototype'
        || projectKind === 'live_artifact'
        || projectKind === 'slide_deck'
        || projectKind === 'template'
        ? diff.supportingMediaTouched
        : undefined;
}
// Registry of per-run baselines that flags same-cwd overlap. `remember` marks
// both the incoming run and every still-open run sharing its cwd as contended;
// `peek` lets pre-finish hooks inspect without consuming the baseline, and
// `take` removes and returns it for the final analytics pass.
export function createRunArtifactBaselines(cap = 2000) {
    const baselines = new Map();
    return {
        remember(runId, cwd, before) {
            if (baselines.size >= cap) {
                const oldest = baselines.keys().next().value;
                if (oldest !== undefined)
                    baselines.delete(oldest);
            }
            let contended = false;
            for (const [id, other] of baselines) {
                if (id !== runId && other.cwd === cwd) {
                    other.contended = true; // the already-open run is now contended too
                    contended = true;
                }
            }
            baselines.set(runId, { cwd, before, contended });
        },
        peek(runId) {
            return baselines.get(runId);
        },
        take(runId) {
            const baseline = baselines.get(runId);
            if (baseline)
                baselines.delete(runId);
            return baseline;
        },
    };
}
//# sourceMappingURL=run-artifact-fs.js.map