import type { ApiErrorResponse } from '@open-design/contracts';
import type { Response } from 'express';
import { type WorkspaceResourceContext } from './workspace-resource-mutation.js';
import type { WorkspaceDirectoryFetchResult } from './vela-workspace-context.js';
export type CreatedProjectWorkspaceResolution = {
    ok: true;
    context: WorkspaceResourceContext | null;
} | {
    ok: false;
    status: 400 | 401 | 403 | 503;
    code: 'WORKSPACE_CONTEXT_INCOMPLETE' | 'AMR_AUTH_REQUIRED' | 'WORKSPACE_PROJECT_PERMISSION_DENIED' | 'WORKSPACE_AUTHORITY_UNAVAILABLE';
    message: string;
    retryable?: true;
};
export type CreatedProjectWorkspaceError = Extract<CreatedProjectWorkspaceResolution, {
    ok: false;
}>;
export declare function sendCreatedProjectWorkspaceError(res: Response, error: CreatedProjectWorkspaceError): Response<ApiErrorResponse>;
/**
 * Capture optional local attribution for an ordinary local project create.
 *
 * PRODUCT INVARIANT: `POST /api/projects` creates local data first. Workspace
 * identity on that request is metadata for `personal` + `local_only` routing;
 * it is not permission to publish and must not trigger a directory/network
 * lookup or block creation. A complete request snapshot is retained as local
 * attribution even if its remote state may have changed; missing or partial
 * identity produces an unbound local project. Later share/sync/move-to-Team
 * operations perform fresh authority checks at their actual remote boundary.
 */
export declare function localProjectWorkspaceAttribution(req: unknown): WorkspaceResourceContext | null;
/** Capture local attribution for project creation without a network gate. */
export declare function authorizeCreatedProjectWorkspace(req: unknown, _fetchWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>, _configuredEnv?: Record<string, string>): Promise<CreatedProjectWorkspaceResolution>;
/**
 * Error thrown by resolver-style creation paths. It preserves the same typed
 * 400/403/503 result as direct HTTP creation gates so callers can reject before
 * touching the filesystem or database.
 */
export declare class CreatedProjectWorkspaceResolutionError extends Error {
    readonly status: CreatedProjectWorkspaceError['status'];
    readonly code: CreatedProjectWorkspaceError['code'];
    readonly retryable?: true;
    constructor(error: CreatedProjectWorkspaceError);
}
/** Resolve the optional local creation scope. */
export declare function createdProjectWorkspaceHome(req: unknown, fetchWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>, configuredEnv?: Record<string, string>): Promise<WorkspaceResourceContext | null>;
/**
 * A `createdProjectWorkspaceHome` bound to one daemon's authorities, so a route
 * module takes a single dep instead of re-threading three.
 */
export type CreatedProjectWorkspaceResolver = (req: unknown) => Promise<WorkspaceResourceContext | null>;
export declare function createCreatedProjectWorkspaceResolver(deps: {
    fetchWorkspaceDirectory?: () => Promise<WorkspaceDirectoryFetchResult>;
    configuredEnv?: () => Record<string, string>;
}): CreatedProjectWorkspaceResolver;
/**
 * Write the `workspace_projects` row for a project this daemon just created.
 *
 * INVARIANT: a project created while this daemon knows a signed-in workspace
 * always gets a binding row. A project with no row is not a harmless default —
 * `GET /api/projects/:id/workspace-scope` answers `unbound` for it, which strips
 * the workspace off the run request (`ProjectView`'s `projectRunWorkspaceContext`
 * → an OpenDesign Cloud run nothing can bill) and blanks the balance/plan area
 * while that project is open (`AvatarMenu`). Headerless local AMR runs may use
 * the signed-in account wallet, but any later request that asserts a Workspace
 * still needs an exact persisted binding before workspace mutation gates allow it.
 *
 * `context` is the caller's complete local Workspace attribution when the
 * request named one. A headerless legacy request supplies null and remains
 * unbound; remote authority is checked only at a later cloud boundary.
 */
export declare function bindCreatedProjectToWorkspace(ensureWorkspaceProject: (input: {
    projectId: string;
    workspaceId: string;
    visibility: 'personal';
    resourceState: 'active';
    createdByWorkspaceMemberId: string;
    updatedByWorkspaceMemberId: string;
    syncState: 'local_only';
    resourceHubResourceId: null;
    cloudTombstonedAt: null;
    createdAt: number;
    updatedAt: number;
}) => unknown, context: WorkspaceResourceContext | null, projectId: string, now: number): void;
