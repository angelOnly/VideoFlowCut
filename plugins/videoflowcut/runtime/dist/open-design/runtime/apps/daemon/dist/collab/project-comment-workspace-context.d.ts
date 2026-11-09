import type { WorkspaceCollabContext } from '@open-design/contracts';
import type { ProjectCommentWorkspaceContextResolution } from '../routes/project/comments.js';
export interface LocalProjectCommentWorkspaceBinding {
    workspaceId?: string | null;
    visibility?: string | null;
    resourceState?: string | null;
    createdByWorkspaceMemberId?: string | null;
}
/**
 * Resolves the persisted project binding against request authority without
 * consulting a member directory. The caller supplies the local authority and
 * fallback-context constructors, keeping this policy deterministic and
 * importable by production wiring and relay tests alike.
 */
export declare function resolveLocalProjectCommentWorkspaceContext(input: {
    binding: LocalProjectCommentWorkspaceBinding | undefined;
    revoked: boolean;
    local: ProjectCommentWorkspaceContextResolution;
    fallbackContext: () => WorkspaceCollabContext;
}): ProjectCommentWorkspaceContextResolution;
