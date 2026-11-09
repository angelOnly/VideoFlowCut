import type { InstalledPluginRecord, ProjectMetadata } from '@open-design/contracts';
export interface DuplicatePluginExampleInput {
    plugin: InstalledPluginRecord;
    projectsRoot: string;
    projectId: string;
    metadata: ProjectMetadata;
    assembleExample: (templateHtml: string, slidesHtml: string, title: string) => string;
}
export interface DuplicatePluginExampleResult {
    relPath: 'index.html';
    sourceEntry: string;
    copiedFiles: number;
    skippedFiles: number;
    warnings: string[];
}
export declare class PluginDuplicateProjectError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare function duplicatePluginExampleIntoProject(input: DuplicatePluginExampleInput): Promise<DuplicatePluginExampleResult>;
