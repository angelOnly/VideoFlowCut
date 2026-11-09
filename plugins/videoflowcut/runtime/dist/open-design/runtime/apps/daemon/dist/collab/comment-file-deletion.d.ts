import type Database from 'better-sqlite3';
import type { runVelaCommand } from '../integrations/vela-command.js';
import type { createLocalCommentFiles } from './local-comment-files.js';
import { type PublicFileDeleteTarget } from './project-public-file-stop.js';
/** A metadata-only working-root retry returns false: no new local lifetime ended. */
export type CommentFileDeletion = (projectId: string, target?: PublicFileDeleteTarget, mutate?: () => Promise<void | false>, mode?: 'committed-retry') => Promise<void>;
/** Optional route adapters still perform their ordinary local mutation. */
export declare function withCommentFileDeletion(deletion: CommentFileDeletion | undefined, projectId: string, target: PublicFileDeleteTarget | undefined, mutate: () => Promise<void | false>, mode?: 'committed-retry'): Promise<void>;
/** Public stop precedes bytes; irreversible catalog retirement follows bytes.
 * The existing project mutation lane encloses this entire operation. A durable,
 * exact intent freezes old identities across remote failure/reopen; it is never
 * treated as catalog admission. Only confirmed missing descendants of a failed
 * recursive deletion may retire, in one mixed-receipt CAS.
 */
export declare function createCommentFileDeletion(input: {
    db: Database.Database;
    localFiles: ReturnType<typeof createLocalCommentFiles>;
    hasActiveRun: (projectId: string) => boolean;
    runForWorkspace: (workspaceId: string) => typeof runVelaCommand;
    stopPublicFiles: (scope: {
        resourceTeamId: string;
        ownerMemberId: string;
        projectId: string;
    }, target?: PublicFileDeleteTarget) => Promise<void>;
    isPresent: (projectId: string, filePath: string) => Promise<boolean>;
}): CommentFileDeletion;
