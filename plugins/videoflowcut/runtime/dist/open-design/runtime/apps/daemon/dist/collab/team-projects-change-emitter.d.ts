export type TeamProjectsChange = {
    projectId?: string;
    kind?: 'catalog' | 'metadata';
};
export type TeamProjectsChangedPayload = {
    type: 'team-projects-changed';
    projectId?: string;
    kind: 'catalog' | 'metadata';
    at: number;
};
type TeamProjectsChangeEmitterOptions = {
    invalidateWorkspace(workspaceId: string): void;
    emit(workspaceId: string, payload: TeamProjectsChangedPayload): void;
    warmWorkspace(workspaceId: string): Promise<void>;
    now?: () => number;
};
/**
 * Convert a hub catalog/metadata mutation into an exact-Workspace cache
 * invalidation and a thin SSE signal. Warming is best-effort only.
 */
export declare function createTeamProjectsChangeEmitter(options: TeamProjectsChangeEmitterOptions): (workspaceId: string, change?: TeamProjectsChange) => void;
export {};
