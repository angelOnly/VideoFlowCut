import type { WorkspaceCollabContext } from '@open-design/contracts';
import type { WorkspaceContextProvider, WorkspaceContextRequest } from './workspace-context.js';
export interface WorkspaceExactContextCacheOptions {
    provider: WorkspaceContextProvider;
    identity(): string;
    realtimeTtlMs?: number;
    now?: () => number;
    onDecision?: (input: {
        source: 'cache' | 'current';
        reason: 'cold' | 'lease_hit' | 'lease_expired' | 'catch_up';
        outcome: 'allow' | 'deny' | 'unavailable' | 'fallback';
        ageMs?: number;
    }) => void;
    onSuppressedRequest?: (input: {
        source: 'current';
        reason: 'lease_hit';
    }) => void;
    onInvalidation?: (input: {
        source: 'current';
        reason: 'event_dirty' | 'auth_reject' | 'catch_up' | 'unhealthy';
    }) => void;
}
export interface WorkspaceExactContextCache {
    provider: WorkspaceContextProvider;
    refresh(request: WorkspaceContextRequest & {
        workspaceId: string;
    }, reason?: 'cold' | 'lease_expired' | 'catch_up'): Promise<WorkspaceCollabContext | null>;
    cached(workspaceId: string): WorkspaceCollabContext | null;
    setRealtimeHealthy(workspaceId: string, healthy: boolean): void;
    /** Retire every snapshot and health grant across a credential transition. */
    resetIdentity(): void;
    invalidate(workspaceId?: string, reason?: 'event_dirty' | 'auth_reject' | 'catch_up'): void;
}
/** Exact-workspace cache for an authenticated membership-directory projection. */
export declare function createWorkspaceExactContextCache(options: WorkspaceExactContextCacheOptions): WorkspaceExactContextCache;
