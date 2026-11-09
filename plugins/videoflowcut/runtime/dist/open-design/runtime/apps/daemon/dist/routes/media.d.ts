import type { Express } from 'express';
import type { ProjectFile } from '@open-design/contracts';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest, AuthorizeProjectToolRequest } from '../collab/project-request-authority.js';
import { type ToolTokenGrant } from '../tool-tokens.js';
import { mediaTaskErrorFromFailure } from '../media/task-error.js';
/**
 * Resolve one media task's generation-time file metadata to the path that is
 * currently registered in the project. Ambiguous matches fail closed so
 * ChatPanel never previews an unrelated file.
 */
export declare function resolveMediaTaskProjectFile(taskFile: unknown, projectFiles: ProjectFile[], claimedNames?: ReadonlySet<string>): ProjectFile | null;
/**
 * Resolve every moved media task against the project at once, so no surviving
 * file is handed to two of them.
 *
 * Per-task uniqueness is not enough: two tasks that recorded the same witness
 * each see exactly one candidate and each would take it. A file that more than
 * one task can claim proves nothing about either, so it is withdrawn from all
 * of them — the same fail-closed rule, applied across tasks instead of within
 * one.
 */
export declare function resolveMovedMediaTaskFiles(candidates: ReadonlyArray<{
    taskId: string;
    file: unknown;
}>, projectFiles: readonly ProjectFile[], claimedNames?: ReadonlySet<string>): Map<string, ProjectFile>;
export interface RegisterMediaRoutesDeps extends RouteDeps<'db' | 'design' | 'http' | 'paths' | 'ids' | 'auth' | 'media' | 'appConfig' | 'orbit' | 'nativeDialogs' | 'projectStore' | 'projectFiles' | 'conversations' | 'research'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
    authorizeProjectToolRequest: AuthorizeProjectToolRequest;
}
export type LegacyMediaRouteGrantDecision = {
    ok: true;
    grant: ToolTokenGrant | null;
} | {
    ok: false;
    code: string;
    details?: Record<string, unknown>;
    message: string;
    status: number;
};
export declare function resolveLegacyMediaRouteGrant(input: {
    grant: ToolTokenGrant | null;
    projectId: string;
    requestProjectOverride: (projectId: string, tokenProjectId: string) => boolean;
    sandboxMode: boolean;
}): LegacyMediaRouteGrantDecision;
export { mediaTaskErrorFromFailure };
export declare function registerMediaRoutes(app: Express, ctx: RegisterMediaRoutesDeps): void;
