import type Database from 'better-sqlite3';
import type { runVelaCommand } from '../integrations/vela-command.js';
import type { createLocalCommentFiles } from './local-comment-files.js';
import type { ResourceHubPrincipal } from './resource-principal.js';
/** Runs inside the existing publication reservation, through receipt admission.
 * Missing lifetimes retire before upload; only HTML in the committed root roster
 * is admitted afterward. An already-recreated native-agent path is not a witness
 * of unlink and is deliberately outside this policy's managed-lifetime guarantee.
 */
export declare function createCommentFilePublisher(input: {
    db: Database.Database;
    localFiles: ReturnType<typeof createLocalCommentFiles>;
    resolveRoot: (projectId: string) => Promise<string>;
    listFiles: (root: string) => Promise<string[]>;
    runForWorkspace: (workspaceId: string) => typeof runVelaCommand;
}): <Result extends {
    versionId?: string;
} | null>(projectId: string, principal: ResourceHubPrincipal | null | undefined, publish: () => Promise<Result>) => Promise<Result>;
