import { type PluginManifest } from '@open-design/contracts';
export interface ClaudePluginAdapterOptions {
    folderId: string;
    compatPath?: string;
}
export interface ClaudePluginAdapterResult {
    manifest: PluginManifest;
    warnings: string[];
}
export declare function adaptClaudePlugin(rawJson: string, opts: ClaudePluginAdapterOptions): ClaudePluginAdapterResult;
//# sourceMappingURL=claude-plugin.d.ts.map