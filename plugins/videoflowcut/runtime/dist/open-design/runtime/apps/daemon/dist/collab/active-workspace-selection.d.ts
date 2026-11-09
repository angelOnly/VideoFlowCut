export interface ActiveWorkspaceSelectionStore {
    get(): string | null;
    snapshot(): {
        workspaceId: string | null;
        generation: number;
    };
    set(workspaceId: string): Promise<void>;
    clear(): Promise<void>;
    clearIf(workspaceId: string): Promise<boolean>;
    replaceIf(expectedWorkspaceId: string | null, workspaceId: string): Promise<string | null>;
    subscribe(listener: (workspaceId: string | null) => void): () => void;
}
interface AuthorizationWorkspaceContextSnapshot {
    context: {
        workspaceId: string;
        teamId?: string | undefined;
        workspaceMemberId: string;
        workspaceType: string;
        memberStatus: string;
        lifecycleState: string;
    } | null;
    generation: number;
}
export declare function resolveAuthorizedActiveTeamWorkspaceSnapshot(selection: {
    workspaceId: string | null;
    generation: number;
}, observed: AuthorizationWorkspaceContextSnapshot): {
    workspaceId: string | null;
    generation: number;
};
export declare function createActiveWorkspaceSelectionStore(dataDir: string): ActiveWorkspaceSelectionStore;
export {};
