// Card covers: freeze what the card will show at the chokepoint (spec §4.1 +
// §6.3).
//
// TWO COVER PATHS LIVE HERE, and they differ only in what "freeze" can mean:
//
//   * HTML gets its RENDERER INPUT frozen now and rendered later, because a
//     self-contained document is portable evidence — see the four steps below.
//   * VIDEO gets its FIRST FRAME decoded now, inside a verified window, because
//     there is no portable freeze for a video short of copying it, and the
//     capacity ruling forbids that. The mechanics live in `video-cover.ts`;
//     this file owns the per-ref bookkeeping both paths share.
//
// WHY A FREEZE AND NOT A JOB. The obvious implementation — "queue a screenshot
// of this file, take it when the renderer is free" — is a version race, not an
// optimization. Between the queue and the render the agent's next turn can
// overwrite the file, and the cover then shows a version that message never
// produced. Worse, it does so silently: a screenshot of the wrong bytes looks
// exactly like a screenshot of the right ones.
//
// So the input is frozen while the daemon still owns the moment, and the freeze
// is STRUCTURAL rather than advisory:
//
//   1. The entry HTML and every local dependency it references are read inside
//      one window, and every file read is fingerprinted (size + mtime).
//   2. The whole graph is inlined into ONE self-contained document. The result
//      carries no relative URL that could resolve to a project file.
//   3. The window is re-verified at the end. Any drift — a write that landed
//      while we were reading — voids the freeze instead of producing a document
//      torn across two versions.
//   4. The renderer is handed that document with NO `baseHref`. It loads from a
//      `data:` URL, so even a render that starts minutes later has no address
//      for the live workspace. It cannot read latest; there is nothing to read.
//
// Step 4 is what makes the async render safe. Steps 1-3 are what make step 4
// honest — a self-contained document assembled from a moving target would still
// be a lie, just an unfalsifiable one.
//
// WHY FAILURE IS SILENT. Product ruling 2026-09-02: a cover that cannot be
// rendered falls back to the card's live preview, with no placeholder and no
// error copy ("不允许退回不就一个错误文案显示在上面了?这感觉更奇怪呢"). That is
// coherent with the click ruling of the same day — clicking a card always opens
// the workspace's LATEST file, for HTML and images alike — so a card that falls
// back to live is showing the same thing the click would open. There is no
// "cover says one thing, click shows another" state to explain away.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES, DESKTOP_ARTIFACT_CAPTURE_MODES, } from '@open-design/sidecar-proto';
import { bundleStandaloneHtml, } from '../artifacts/standalone-html.js';
import { mimeForArtifactPath } from './mime.js';
import { chatArtifactPolicyForKind } from './policy.js';
import { attachChatArtifactThumbnail } from './run-capture.js';
import { insertSnapshotIntent, markSnapshotFailed } from './store.js';
import { CHAT_ARTIFACT_VIDEO_FRAME_MAX_PER_RUN, freezeVideoFirstFrame, } from './video-cover.js';
import { freezeMotionArtifactCovers } from './motion-cover.js';
/**
 * Wall clock the daemon gives one cover. The desktop renderer enforces its own
 * 8s budget; this is the outer guard for the case where the desktop process is
 * wedged and the IPC call (600s) never comes back at all.
 */
export const CHAT_ARTIFACT_COVER_BUDGET_MS = 20_000;
/**
 * Per-turn ceiling. A run that rewrote forty pages is not worth forty renders —
 * the renderer is a shared, single-window resource and the next turn's covers
 * matter more than the tail of this one's.
 */
export const CHAT_ARTIFACT_COVER_MAX_PER_RUN = 8;
/**
 * Freeze every coverable ref on this message, then render them in the
 * background.
 *
 * The AWAITED half is the freeze — it must complete before the terminal SSE
 * frame goes out, because after that the next turn may start writing. For HTML
 * the render is deliberately NOT awaited: it costs seconds, the frozen document
 * makes it race-free, and a chat turn should not sit open waiting for a
 * thumbnail. A card with no cover yet simply keeps its live preview.
 *
 * A video's frame extraction IS awaited, because for video the extraction is
 * the freeze — there is nothing to hand a later worker that is still guaranteed
 * to be this turn's bytes. `video-cover.ts` keeps that cost bounded (one frame,
 * a 10s budget, a handful per turn).
 */
export async function freezeAndRenderChatArtifactCovers(deps, input) {
    const report = { frozen: 0, skipped: 0, failed: 0 };
    const projectRoot = path.resolve(input.projectRoot);
    const pending = [];
    const motion = await freezeMotionArtifactCovers(deps, input);
    let videoFrames = motion.attempts;
    report.frozen += motion.frozen;
    report.skipped += motion.skipped;
    for (const failure of motion.failures) {
        recordCoverFailure(deps, failure.row, failure.code);
        report.failed++;
    }
    for (const row of input.rows) {
        if (motion.handled.has(row.id))
            continue;
        if (wantsFrozenVideoFrame(row)) {
            if (videoFrames >= CHAT_ARTIFACT_VIDEO_FRAME_MAX_PER_RUN) {
                report.skipped += 1;
                continue;
            }
            videoFrames += 1;
            const outcome = await freezeVideoFrameCover(deps, projectRoot, row, input.videoFrameExtractor);
            if (outcome === 'frozen')
                report.frozen += 1;
            else
                report.failed += 1;
            continue;
        }
        if (!wantsRenderedCover(row)) {
            report.skipped += 1;
            continue;
        }
        // No renderer at all is not a failure of THIS turn — recording one would
        // mark every HTML card in a web-only daemon as failed forever, which buries
        // the real render failures the state is there to surface.
        if (typeof input.renderer !== 'function' || pending.length >= CHAT_ARTIFACT_COVER_MAX_PER_RUN) {
            report.skipped += 1;
            continue;
        }
        const frozen = await freezeCoverDocument(projectRoot, row.labelAtCapture);
        if (!frozen.ok) {
            recordCoverFailure(deps, row, frozen.failureCode);
            report.failed += 1;
            continue;
        }
        pending.push({ row, render: frozen.render });
        report.frozen += 1;
    }
    if (pending.length > 0 && typeof input.renderer === 'function') {
        // Serial: the desktop renderer is one Electron window behind one IPC
        // socket, so firing these in parallel would only queue them somewhere less
        // observable.
        void renderCoversSequentially(deps, input.renderer, pending, input.onRefsChanged);
    }
    return report;
}
/**
 * Which refs today's BROWSER renderer can actually serve.
 *
 * `wantsStaticCover` is the POLICY answer (every non-immutable kind wants one).
 * `kind === 'html'` is the CAPABILITY answer: this renderer is a browser, so a
 * .pdf or .docx ref has to keep waiting for a document renderer that does not
 * exist yet. Keeping the two separate means adding that renderer later is a
 * change here, not a change to the product policy — which is exactly how video
 * arrived: a second capability answer below, with the policy untouched.
 */
function wantsRenderedCover(row) {
    if (row.kind !== 'html')
        return false;
    return coverable(row);
}
/**
 * Which refs get a decoded first frame.
 *
 * Video only. Audio shares video's policy row but has no frames, and its card
 * is a waveform pill rather than a thumbnail, so there is nothing for a cover
 * to occupy — asking ffmpeg for a frame of an mp3 would spend a subprocess to
 * learn that.
 */
function wantsFrozenVideoFrame(row) {
    if (row.kind !== 'video')
        return false;
    return coverable(row);
}
/**
 * The part both paths share: the policy says this kind wants a static cover,
 * and the ref does not already own a snapshot. An immutable-original ref
 * carries its own bytes; a cover would be a second identity on a row that is
 * supposed to have exactly one.
 */
function coverable(row) {
    if (!chatArtifactPolicyForKind(row.kind).wantsStaticCover)
        return false;
    return row.snapshotId == null && row.workspaceArtifactId != null;
}
/**
 * Decode this turn's first frame and attach it as the card's cover.
 *
 * Returns which bucket the ref landed in; the caller owns the counters. A
 * failure is recorded the same way a failed HTML render is — as an honest miss
 * on the ref, never as a substituted frame from the current file.
 */
async function freezeVideoFrameCover(deps, projectRoot, row, extractor) {
    const absolute = resolveInsideProject(projectRoot, row.labelAtCapture);
    if (!absolute) {
        recordCoverFailure(deps, row, 'source_missing');
        return 'failed';
    }
    const frozen = extractor
        ? await freezeVideoFirstFrame(absolute, extractor)
        : await freezeVideoFirstFrame(absolute);
    if (!frozen.ok) {
        recordCoverFailure(deps, row, frozen.failureCode);
        return 'failed';
    }
    try {
        await attachChatArtifactThumbnail(deps, {
            messageArtifactId: row.id,
            bytes: frozen.bytes,
            mime: frozen.mime,
        });
    }
    catch (err) {
        logCoverFailure(row.labelAtCapture, err);
        try {
            recordCoverFailure(deps, row, 'internal_error');
        }
        catch {
            // best effort
        }
        return 'failed';
    }
    return 'frozen';
}
/**
 * Read the entry and its local dependency graph inside one verified window, and
 * return a self-contained document.
 *
 * The witness map is the freeze: every file the bundler touched is fingerprinted
 * when it is read and re-checked when the bundle is done. A single drift means
 * the assembled document may mix two versions, and a mixed document is worse
 * than no cover — it is a screenshot of something that never existed.
 */
async function freezeCoverDocument(projectRoot, relativePath) {
    const entryAbsolute = resolveInsideProject(projectRoot, relativePath);
    if (!entryAbsolute)
        return { ok: false, failureCode: 'source_missing' };
    const witnesses = new Map();
    let html;
    try {
        const stat = await fs.promises.stat(entryAbsolute);
        witnesses.set(entryAbsolute, { size: stat.size, mtimeMs: stat.mtimeMs });
        html = await fs.promises.readFile(entryAbsolute, 'utf8');
    }
    catch {
        return { ok: false, failureCode: 'source_missing' };
    }
    const readAsset = async (projectPath) => {
        const absolute = resolveInsideProject(projectRoot, projectPath);
        if (!absolute)
            return null;
        let stat;
        try {
            stat = await fs.promises.stat(absolute);
        }
        catch {
            return null;
        }
        if (!stat.isFile())
            return null;
        const buffer = await fs.promises.readFile(absolute);
        witnesses.set(absolute, { size: stat.size, mtimeMs: stat.mtimeMs });
        return {
            buffer,
            mime: mimeForArtifactPath(projectPath) ?? 'application/octet-stream',
            size: buffer.byteLength,
        };
    };
    let bundled;
    try {
        bundled = await bundleStandaloneHtml({
            entryPath: toProjectPath(relativePath),
            html,
            readAsset,
        });
    }
    catch (err) {
        // A graph that cannot be closed (a missing local dependency, a document
        // past the bundler's limits) has no dependency-complete freeze available.
        // Spec §6.3's fallback — render the live file immediately while its
        // fingerprint still matches — is deliberately NOT taken here: it would put
        // the daemon's live raw endpoint back in the renderer's hands, which only
        // fingerprints the entry and leaves every dependency free to move.
        logCoverFailure(relativePath, err);
        return { ok: false, failureCode: 'dependencies_incomplete' };
    }
    for (const [absolute, expected] of witnesses) {
        try {
            const stat = await fs.promises.stat(absolute);
            if (stat.size !== expected.size || stat.mtimeMs !== expected.mtimeMs) {
                return { ok: false, failureCode: 'source_changed' };
            }
        }
        catch {
            return { ok: false, failureCode: 'source_changed' };
        }
    }
    return {
        ok: true,
        render: {
            captureMode: DESKTOP_ARTIFACT_CAPTURE_MODES.FIRST_VIEWPORT_THUMBNAIL,
            deck: false,
            format: 'image',
            html: bundled.html,
            imageFormat: 'png',
            title: path.posix.basename(toProjectPath(relativePath)) || 'artifact',
            // No baseHref, on purpose. See the module header: this is the last thing
            // standing between an async render and the live workspace.
        },
    };
}
async function renderCoversSequentially(deps, renderer, pending, onRefsChanged) {
    for (const item of pending) {
        try {
            await renderOneCover(deps, renderer, item.row, item.render, onRefsChanged);
        }
        catch (err) {
            // A cover is never allowed to take anything else down with it: the turn
            // has already been reported as finished by the time this runs.
            logCoverFailure(item.row.labelAtCapture, err);
            try {
                recordCoverFailure(deps, item.row, 'internal_error');
            }
            catch {
                // best effort
            }
        }
    }
}
async function renderOneCover(deps, renderer, row, render, onRefsChanged) {
    let result;
    try {
        result = await withBudget(renderer(render), CHAT_ARTIFACT_COVER_BUDGET_MS, (err) => logCoverFailure(row.labelAtCapture, err));
    }
    catch (err) {
        logCoverFailure(row.labelAtCapture, err);
        recordCoverFailure(deps, row, err instanceof CoverBudgetExceededError ? 'timeout' : 'renderer_unavailable');
        return;
    }
    if (!result?.ok || typeof result.path !== 'string' || result.path.length === 0) {
        recordCoverFailure(deps, row, coverFailureCodeFor(result));
        return;
    }
    try {
        const bytes = await fs.promises.readFile(result.path);
        await attachChatArtifactThumbnail(deps, {
            messageArtifactId: row.id,
            bytes,
            mime: result.mime || 'image/png',
        });
        // The cover is durable now, so the client's re-read is guaranteed to find
        // it. Announcing before the attach would race the very fetch it invites.
        // Never allowed to fail the render it is reporting on.
        try {
            onRefsChanged?.(row);
        }
        catch (err) {
            logCoverFailure(row.labelAtCapture, err);
        }
    }
    finally {
        // The renderer's temp file is the daemon's to clean up — the same contract
        // the `od export` route follows.
        await fs.promises.rm(result.path, { force: true }).catch(() => { });
    }
}
function coverFailureCodeFor(result) {
    if (result?.code === DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES.RENDER_TIMEOUT)
        return 'timeout';
    return 'renderer_unavailable';
}
/**
 * Record an honest miss.
 *
 * The ref keeps its `workspace_artifact_id`, so the card still opens the latest
 * file; it just has no cover and the web falls back to a live preview. The row
 * exists so a real render failure is distinguishable from a card that was never
 * a cover candidate in the first place — otherwise every legacy message would
 * look like a failure and the failures would look like nothing.
 */
function recordCoverFailure(deps, row, failureCode) {
    const projectId = projectIdForWorkspaceArtifact(deps, row.workspaceArtifactId);
    if (!projectId)
        return;
    const snapshotId = randomUUID();
    const now = deps.now ? deps.now() : Date.now();
    insertSnapshotIntent(deps.db, {
        id: snapshotId,
        projectId,
        workspaceArtifactId: row.workspaceArtifactId,
        sourcePathAtCapture: row.labelAtCapture,
        kind: row.kind,
        mime: mimeForArtifactPath(row.labelAtCapture) ?? null,
        runId: null,
        mediaTaskId: null,
        expectedSize: null,
        expectedMtime: null,
        expectedDigest: null,
        // Nothing was ever staged, so the reconciler has no temp to sweep.
        tempKey: null,
        now,
    });
    markSnapshotFailed(deps.db, snapshotId, failureCode);
    deps.db
        .prepare(`UPDATE message_artifacts SET snapshot_id = ? WHERE id = ? AND snapshot_id IS NULL`)
        .run(snapshotId, row.id);
}
function projectIdForWorkspaceArtifact(deps, workspaceArtifactId) {
    if (!workspaceArtifactId)
        return null;
    const row = deps.db
        .prepare(`SELECT project_id AS projectId FROM workspace_artifacts WHERE id = ?`)
        .get(workspaceArtifactId);
    return row?.projectId ?? null;
}
class CoverBudgetExceededError extends Error {
    constructor(budgetMs) {
        super(`chat artifact cover exceeded ${budgetMs}ms`);
        this.name = 'CoverBudgetExceededError';
    }
}
async function withBudget(work, budgetMs, onLateCleanupFailure) {
    let timer;
    let timedOut = false;
    const ownedWork = work.then(async (result) => {
        // Promise.race does not cancel the renderer. After the deadline the ref
        // already owns a failed snapshot; only release the renderer's late temp
        // output, never attach it or announce a ready cover.
        if (timedOut && result?.ok && typeof result.path === 'string' && result.path.length > 0) {
            await fs.promises.rm(result.path, { force: true }).catch(onLateCleanupFailure);
        }
        return result;
    });
    try {
        return await Promise.race([
            ownedWork,
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    timedOut = true;
                    reject(new CoverBudgetExceededError(budgetMs));
                }, budgetMs);
                timer.unref?.();
            }),
        ]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
/** Forward-slash, project-relative. The bundler speaks project paths only. */
function toProjectPath(relativePath) {
    return relativePath.split(path.sep).join('/').replace(/^\/+/, '');
}
/**
 * Containment-checked absolute path, or null. A dependency reference is agent
 * output: it must never be able to pull a file from outside the project into a
 * document the daemon is about to render.
 */
function resolveInsideProject(projectRoot, projectPath) {
    const cleaned = toProjectPath(projectPath);
    if (!cleaned)
        return null;
    const absolute = path.resolve(projectRoot, cleaned);
    const relative = path.relative(projectRoot, absolute);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`))
        return null;
    if (path.isAbsolute(relative))
        return null;
    return absolute;
}
function logCoverFailure(label, err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
        // Project-relative label only — never bytes, never an absolute path.
        console.warn(`[chat-artifacts] cover failed for ${label}: ${message}`);
    }
    catch {
        // logging is best effort
    }
}
//# sourceMappingURL=cover.js.map