export type HostEditorId = 'cursor' | 'vscode' | 'windsurf' | 'zed' | 'qoder' | 'antigravity' | 'webstorm' | 'idea' | 'xcode' | 'finder' | 'explorer' | 'file-manager' | 'terminal' | 'warp';
export interface HostEditor {
    id: HostEditorId;
    label: string;
    icon?: string;
    command?: string;
    available: boolean;
    resolvedPath?: string;
    platforms?: Array<'darwin' | 'win32' | 'linux'>;
}
export interface HostEditorsResponse {
    editors: HostEditor[];
    platform: 'darwin' | 'win32' | 'linux' | 'unknown';
}
export interface OpenProjectInEditorRequest {
    editorId: HostEditorId;
}
export interface OpenProjectInEditorResponse {
    ok: true;
    editorId: HostEditorId;
    path: string;
}
//# sourceMappingURL=host-tools.d.ts.map