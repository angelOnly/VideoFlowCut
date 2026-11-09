import type { Project } from '../api/projects.js';
export declare const PLUGIN_SHARE_ACTIONS: readonly ['publish-github', 'contribute-open-design'];
export type PluginShareAction = (typeof PLUGIN_SHARE_ACTIONS)[number];
export declare const PLUGIN_SHARE_ACTION_PLUGIN_IDS: Record<PluginShareAction, string>;
export interface CreatePluginShareProjectRequest {
    action: PluginShareAction;
    locale?: string;
}
export interface CreatePluginShareProjectResponse {
    ok: true;
    project: Project;
    conversationId: string;
    appliedPluginSnapshotId?: string;
    actionPluginId: string;
    sourcePluginId: string;
    stagedPath: string;
    prompt: string;
    message: string;
}
//# sourceMappingURL=share-actions.d.ts.map