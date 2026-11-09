export interface TeamResourceVersionStore {
    get(workspaceId: string, kind: string, resourceId: string): string | null;
    set(workspaceId: string, kind: string, resourceId: string, versionId: string): Promise<void>;
}
export declare function createTeamResourceVersionStore(runtimeDataDir: string): TeamResourceVersionStore;
