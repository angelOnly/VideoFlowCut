import type { WorkspaceDirectoryItem } from '@open-design/contracts';
export interface WorkspaceExactAuthorityCacheOptions {
    identity(): string;
    ttlMs?: number;
    now?: () => number;
}
export interface WorkspaceExactAuthorityCache {
    /** Observe one successful, complete account-directory snapshot. */
    observe(identity: string, items: readonly WorkspaceDirectoryItem[]): void;
    /** Read only while this exact workspace's strict realtime grant is healthy. */
    cached(workspaceId: string, workspaceMemberId: string): WorkspaceDirectoryItem | null;
    setRealtimeHealthy(workspaceId: string, healthy: boolean): void;
    /** Retire every row and health grant across a credential transition. */
    resetIdentity(): void;
    invalidate(workspaceId?: string): void;
}
/**
 * Directory-sourced authority for one exact Workspace/member pair.
 *
 * An upstream Workspace SSE stream is scoped, while `/api/v1/workspaces` is an
 * account-wide directory. A healthy stream therefore grants reuse only for its
 * own membership row; it can never make the entire directory immortal or hide
 * a newly-added workspace. A successful full directory read seeds rows, and a
 * separate strict-health grant decides which row may suppress another read.
 */
export declare function createWorkspaceExactAuthorityCache(options: WorkspaceExactAuthorityCacheOptions): WorkspaceExactAuthorityCache;
