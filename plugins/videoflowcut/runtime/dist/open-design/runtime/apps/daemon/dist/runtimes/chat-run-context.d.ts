export interface WorkspaceContextItem {
    id: string;
    kind: string;
    label: string;
    tabId?: string;
    path?: string;
    absolutePath?: string;
    url?: string;
    title?: string;
}
export interface RunContextSelection {
    skillIds?: string[];
    pluginIds?: string[];
    mcpServerIds?: string[];
    connectorIds?: string[];
    workspaceItems?: WorkspaceContextItem[];
}
export declare function normalizeWorkspaceContextItems(items: unknown): WorkspaceContextItem[];
export declare function normalizeRunContextSelection(value: unknown): RunContextSelection;
export declare function mergeRunContextSelections(...contexts: unknown[]): RunContextSelection;
export declare function projectMetadataContextSelection(metadata: unknown): RunContextSelection;
export declare function renderRunContextPrompt(selection: unknown, metadata: unknown): string;
