import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { COMMENT_ALIGN_REASONS } from '@open-design/contracts';
import { listProjectPreviewComments } from '../db.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
const unavailable = () => ({ state: 'unknown', reason: 'unavailable' });
/** Export persisted, already-merged rows: no author/status/conversation filter.
 * Deleted comments are physically removed by mergeSyncedPreviewComment.
 * Source file paths stay local; the cloud maps public entry paths before comparing.
 */
export function exportCommentAlignment(db, projectId) {
    // The display DTO deliberately strips cloud attachment ids; read persisted
    // attachment identities, not its path/name rendering projection.
    const rows = db.prepare('SELECT id, attachments_json AS attachmentsJson FROM preview_comments WHERE project_id=?').all(projectId);
    const attachments = new Map();
    for (const row of rows) {
        let items = [];
        try {
            items = row.attachmentsJson ? JSON.parse(row.attachmentsJson) : [];
        }
        catch {
            throw new Error('Invalid persisted attachment JSON');
        }
        if (!Array.isArray(items))
            throw new Error('Invalid persisted attachments');
        attachments.set(row.id, items.map((item) => {
            if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string' || !item.id) {
                // A legacy path is not a cloud identity. Do not fabricate agreement.
                throw new Error('Attachment comparison identity unavailable');
            }
            return { id: item.id, name: '' };
        }));
    }
    return listProjectPreviewComments(db, projectId).map(comment => ({
        id: comment.id, filePath: comment.filePath, elementId: comment.elementId,
        selector: comment.selector, selectionKind: comment.selectionKind ?? 'element',
        label: comment.label ?? '', text: comment.text ?? '', htmlHint: comment.htmlHint ?? '',
        note: comment.note ?? '', status: comment.status ?? 'open',
        position: { x: Math.round(comment.position.x), y: Math.round(comment.position.y),
            width: Math.round(comment.position.width), height: Math.round(comment.position.height) },
        style: comment.style ?? null, memberCount: comment.memberCount ?? 0,
        slideIndex: comment.slideIndex ?? 0,
        // The frozen transport requires name; comparison deliberately ignores it.
        attachments: attachments.get(comment.id) ?? [],
        authorKind: comment.authorKind ?? 'member',
    })).sort((a, b) => a.id.localeCompare(b.id));
}
/** Exit zero is only successful execution, never proof of alignment. */
export function parseCommentAlignmentResult(stdout) {
    try {
        const value = JSON.parse(stdout);
        if (!value || typeof value !== 'object' || Array.isArray(value))
            return unavailable();
        const row = value;
        if (row.latestSeq !== undefined && (!Number.isSafeInteger(row.latestSeq) || Number(row.latestSeq) < 0))
            return unavailable();
        const latestSeq = typeof row.latestSeq === 'number' ? row.latestSeq : undefined;
        if (row.state === 'unknown') {
            const reason = COMMENT_ALIGN_REASONS.find(item => item === row.reason);
            return reason ? { state: 'unknown', reason, ...(latestSeq === undefined ? {} : { latestSeq }) } : unavailable();
        }
        if ((row.state === 'aligned' || row.state === 'diverged') && latestSeq !== undefined)
            return { state: row.state, latestSeq };
    }
    catch { /* Do not expose raw transport output. */ }
    return unavailable();
}
export async function runVelaCommentAlignment(input, run = runPinnedVelaCommand) {
    let directory;
    try {
        if (!path.isAbsolute(input.dataRoot) || !input.projectId.trim() || !input.workspaceId.trim())
            return unavailable();
        directory = await mkdtemp(path.join(input.dataRoot, 'comment-align-'));
        const file = path.join(directory, 'comments.json');
        await writeFile(file, JSON.stringify(input.request), { mode: 0o600, flag: 'wx' });
        return parseCommentAlignmentResult(await run({
            args: ['collab', 'comment', 'align', input.projectId, '--comment-file', file, '--json'],
            workspaceId: input.workspaceId, session: input.session, dataRoot: input.dataRoot,
        }));
    }
    catch {
        return unavailable();
    }
    finally {
        if (directory)
            await rm(directory, { recursive: true, force: true });
    }
}
export function createCommentAlignmentService(deps) {
    const key = (scope) => JSON.stringify([scope.projectId, scope.workspaceId, scope.workspaceMemberId]);
    const results = new Map();
    const snapshot = (projectId) => {
        try {
            return JSON.stringify(exportCommentAlignment(deps.db, projectId));
        }
        catch {
            return null;
        }
    };
    return {
        read(scope) {
            const last = results.get(key(scope));
            if (!last)
                return undefined;
            if (last.cursor !== deps.readCursor(scope.projectId, last.context) || last.snapshot !== snapshot(scope.projectId))
                return { state: 'unknown', reason: 'snapshot_changed' };
            return { ...last.result };
        },
        async check(projectId, context) {
            const scope = { projectId, workspaceId: context.workspaceId, workspaceMemberId: context.workspaceMemberId };
            const cursor = deps.readCursor(projectId, context);
            const captured = snapshot(projectId);
            let result = unavailable();
            if (captured !== null && cursor !== null && Number.isSafeInteger(cursor) && cursor >= 0) {
                try {
                    const comments = JSON.parse(captured);
                    result = await deps.compare(projectId, context, { comments, expectedLatestSeq: cursor });
                }
                catch {
                    result = unavailable();
                }
                if (deps.readCursor(projectId, context) !== cursor || snapshot(projectId) !== captured
                    || (result.state !== 'unknown' && result.latestSeq !== cursor))
                    result = { state: 'unknown', reason: 'snapshot_changed' };
            }
            results.set(key(scope), { result, snapshot: captured, cursor, context: { ...context } });
            return result;
        },
    };
}
//# sourceMappingURL=comment-alignment.js.map