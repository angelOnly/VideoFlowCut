import type Database from 'better-sqlite3';
import type { CommentFileFact } from '@open-design/contracts';
import type { runVelaCommand } from '../integrations/vela-command.js';
/** Paths whose current new-protocol lifetime must not be moved by managed rename.
 * Local pre-share comments carry a durable artifact UUID before catalog admission.
 * Join that exact UUID AND original path; never infer identities for historical rows.
 */
export declare function trackedCommentFilePaths(db: Database.Database, projectId: string): string[];
/** Creator-only producers use the existing artifact pointer; mirrors never remint it. */
export declare function createLocalCommentFiles(db: Database.Database): {
    identity: (projectId: string, filePath: string, catalogState?: unknown) => string;
    admit: (input: {
        projectId: string;
        workspaceId: string;
        creatorMemberId: string;
        resourceId: string;
        versionId: string;
        paths: Array<{
            sourceFilePath: string;
            entryPath: string;
            sourceFileId?: string;
        }>;
        run: typeof runVelaCommand;
    }) => Promise<void>;
    retire: (input: {
        projectId: string;
        workspaceId: string;
        creatorMemberId: string;
        fact: CommentFileFact;
        run: typeof runVelaCommand;
    }) => Promise<void>;
    retireMany: (input: {
        projectId: string;
        workspaceId: string;
        creatorMemberId: string;
        facts: readonly CommentFileFact[];
        run: typeof runVelaCommand;
    }) => Promise<void>;
};
