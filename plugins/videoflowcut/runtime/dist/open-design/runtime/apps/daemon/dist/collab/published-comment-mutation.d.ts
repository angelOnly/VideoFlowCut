import type Database from 'better-sqlite3';
import type { PreviewComment, WorkspaceCollabContext } from '@open-design/contracts';
/** Store only owner-authored-project mutations for the exact historical personal publication mapping. */
export declare function recordPersonalPublishedCommentMutation(db: Database.Database, comment: PreviewComment, context: WorkspaceCollabContext | null, deleted: boolean): boolean;
