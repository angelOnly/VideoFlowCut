import type { CommentFileFact, CommentFileMutation, CommentFileState } from '@open-design/contracts';
import type { runVelaCommand } from '../integrations/vela-command.js';
export interface CommentFileCatalog {
    resourceId: string;
    metadata?: Record<string, unknown>;
}
/** Existing catalog CAS transport only. Response state is never replayed as mutation input. */
export declare function commitCommentFileFacts(input: {
    projectId: string;
    workspaceId: string;
    creatorMemberId: string;
    resourceId: string;
    versionId: string;
    files: CommentFileMutation['files'];
    run: typeof runVelaCommand;
}): Promise<CommentFileState>;
export declare function retiredCommentFileMutation(fact: CommentFileFact, sharedReceipt?: Pick<CommentFileFact, 'resourceId' | 'versionId'>): CommentFileMutation['files'];
