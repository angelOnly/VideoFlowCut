import type { WorkspaceCollabContext } from '@open-design/contracts';
import type { ProjectPublicFilePublicationStore } from './public-file-publication-store.js';
import type { LocalProjectCommentWorkspaceBinding } from './project-comment-workspace-context.js';
export interface CommentRelayScope {
    workspaceId: string;
    teamId: string;
    ownerMemberId: string;
    relayScope: 'team' | 'personal';
}
/**
 * The relay eligibility channel is deliberately separate from team-directory
 * identity. A personal project, including one in a team workspace, may relay
 * only when its persisted creator owns an active publication for the comment's
 * exact file; no commenter identity
 * and no member-directory lookup can widen that scope.
 */
export declare function personalCommentRelayFilePaths(input: {
    binding: LocalProjectCommentWorkspaceBinding | undefined;
    context: WorkspaceCollabContext | null;
    projectId: string;
    publications: ProjectPublicFilePublicationStore;
}): ReadonlySet<string>;
export declare function commentRelayScope(input: {
    binding: LocalProjectCommentWorkspaceBinding | undefined;
    context: WorkspaceCollabContext | null;
    projectId: string;
    filePath: string;
    publications: ProjectPublicFilePublicationStore;
}): CommentRelayScope | null;
