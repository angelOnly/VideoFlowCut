import type { CollabCloudComment, CommentFileState } from '@open-design/contracts';
export declare function canonicalCommentFilePath(value: unknown): value is string;
/** Only server response state is usable here. A proposed mutation is not admission. */
export declare function parseCommentFileState(value: unknown): CommentFileState | null;
export declare function commentFileSourceKey(projectId: string, sourceFileId: string): string;
/** Synchronous and shared by both inbound lanes. Unknown MUST abort the page transaction. */
export declare function normalizeCurrentFileComment(state: CommentFileState | null, comment: CollabCloudComment): CollabCloudComment | null;
/** Select only facts whose bytes just committed. Do not install future facts on old content. */
export declare function commentFilesAtReceipt(previous: CommentFileState | null, incoming: CommentFileState | null, receipt: {
    resourceId: string;
    versionId: string;
}, options?: {
    authorizedCatalogRootId?: string;
}): CommentFileState | null;
