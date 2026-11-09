import type Database from 'better-sqlite3';
import { type CommentAlignProjection, type CommentAlignRequest, type CommentAlignResult, type WorkspaceCollabContext } from '@open-design/contracts';
import type { VelaControlApiContext } from '../integrations/vela.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
import type { CommentSyncScope } from './comment-sync-state.js';
/** Export persisted, already-merged rows: no author/status/conversation filter.
 * Deleted comments are physically removed by mergeSyncedPreviewComment.
 * Source file paths stay local; the cloud maps public entry paths before comparing.
 */
export declare function exportCommentAlignment(db: Database.Database, projectId: string): CommentAlignProjection[];
/** Exit zero is only successful execution, never proof of alignment. */
export declare function parseCommentAlignmentResult(stdout: string): CommentAlignResult;
export declare function runVelaCommentAlignment(input: {
    projectId: string;
    workspaceId: string;
    request: CommentAlignRequest;
    session: VelaControlApiContext;
    dataRoot: string;
}, run?: typeof runPinnedVelaCommand): Promise<CommentAlignResult>;
export declare function createCommentAlignmentService(deps: {
    db: Database.Database;
    readCursor: (projectId: string, context: WorkspaceCollabContext) => number | null;
    compare: (projectId: string, context: WorkspaceCollabContext, request: CommentAlignRequest) => Promise<CommentAlignResult>;
}): {
    read(scope: CommentSyncScope): CommentAlignResult | undefined;
    check(projectId: string, context: WorkspaceCollabContext): Promise<CommentAlignResult>;
};
