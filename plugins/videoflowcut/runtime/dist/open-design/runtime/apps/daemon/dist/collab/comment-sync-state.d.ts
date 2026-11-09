import type Database from 'better-sqlite3';
import type { CommentSyncState, CommentAlignResult } from '@open-design/contracts';
import { type ReadProjectShareState } from './vela-project-share-state.js';
export interface CommentSyncScope {
    projectId: string;
    workspaceId: string;
    workspaceMemberId: string;
    filePath?: string;
}
export interface CommentSyncStateService {
    read(scope: CommentSyncScope): Promise<CommentSyncState | null>;
    retry(scope: CommentSyncScope): Promise<CommentSyncState | null>;
}
/** Null is unknown, not a healthy initial state. Session checks are uncached here
 * so a read after login observes recovery without recreating the service.
 */
export declare function createCommentSyncStateService(db: Database.Database, sessionAvailable: (scope: CommentSyncScope) => Promise<boolean | null>, diagnostics?: {
    readAlign?: (scope: CommentSyncScope) => CommentAlignResult | undefined;
    readProjectShareState?: ReadProjectShareState;
    /** Credential used for this GET; compare across availability and remote read. */
    readCredential?: () => {
        apiUrl: string;
        controlKey: string;
    } | null;
}): CommentSyncStateService;
