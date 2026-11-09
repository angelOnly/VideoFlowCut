export type WorkspaceScopeSource = 'explicit' | 'project' | 'local-selection' | 'environment' | 'unresolved';
export interface WorkspaceScope {
    workspaceId?: string;
    source: WorkspaceScopeSource;
}
export interface WorkspaceScopeInputs {
    explicit?: string | null;
    projectWorkspaceId?: string | null;
    localSelection?: string | null;
    envWorkspaceId?: string | null;
}
export declare function resolveWorkspaceScope(inputs: WorkspaceScopeInputs): WorkspaceScope;
