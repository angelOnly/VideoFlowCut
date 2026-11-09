import { type PluginManifest } from '@open-design/contracts';
export interface AgentSkillAdapterOptions {
    folderId: string;
    compatPath?: string;
}
export interface AgentSkillAdapterResult {
    manifest: PluginManifest;
    warnings: string[];
    bodyMarkdown: string;
}
export declare function adaptAgentSkill(rawSkillMd: string, opts: AgentSkillAdapterOptions): AgentSkillAdapterResult;
//# sourceMappingURL=agent-skill.d.ts.map