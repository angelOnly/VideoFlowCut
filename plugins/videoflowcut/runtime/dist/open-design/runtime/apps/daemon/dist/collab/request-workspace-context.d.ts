import type { WorkspaceCollabContext } from '@open-design/contracts';
import { type WorkspaceDirectoryFetchResult } from './vela-workspace-context.js';
export type VerifiedWorkspaceRequestContextResult = {
    ok: true;
    context: WorkspaceCollabContext;
} | {
    ok: false;
    status: 400 | 401 | 403 | 503;
    code: 'WORKSPACE_CONTEXT_REQUIRED' | 'WORKSPACE_CONTEXT_INCOMPLETE' | 'AMR_AUTH_REQUIRED' | 'WORKSPACE_AUTHORITY_UNAVAILABLE' | 'WORKSPACE_ACCESS_DENIED';
    message: string;
    retryable?: true;
};
/**
 * Resolve a request's explicit Workspace identity against the signed-in
 * account's authoritative membership directory.
 *
 * Data-plane routes must call this instead of reading the daemon's mutable
 * active Workspace. The headers choose which membership to verify; the
 * directory supplies every authority-bearing field.
 */
export declare function verifyWorkspaceRequestContext(input: {
    req: unknown;
    fetchWorkspaceDirectory: () => Promise<WorkspaceDirectoryFetchResult>;
    configuredEnv?: Record<string, string>;
    requireTeam?: boolean;
}): Promise<VerifiedWorkspaceRequestContextResult>;
