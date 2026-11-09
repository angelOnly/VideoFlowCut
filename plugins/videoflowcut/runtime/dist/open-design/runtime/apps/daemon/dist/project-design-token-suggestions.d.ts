import type { ProjectDesignTokenSuggestionQuery, ProjectDesignTokenSuggestionsResponse } from '@open-design/contracts';
type ProjectFileLike = {
    name: string;
    mime?: string;
    size?: number;
};
type Candidate = {
    token: string;
    value: string;
    sourceFile: string;
    line: number;
};
export type BuildProjectDesignTokenSuggestionsOptions = {
    projectId: string;
    projectMetadata?: unknown;
    project?: {
        designSystemId?: string | null;
    } | null;
    projectsRoot: string;
    designSystemsRoot: string;
    userDesignSystemsRoot: string;
    listFiles: (projectsRoot: string, projectId: string, options?: {
        metadata?: unknown;
    }) => Promise<ProjectFileLike[]>;
    resolveProjectDir: (projectsRoot: string, projectId: string, metadata?: unknown) => string;
    query: ProjectDesignTokenSuggestionQuery;
};
export declare function buildProjectDesignTokenSuggestions(options: BuildProjectDesignTokenSuggestionsOptions): Promise<ProjectDesignTokenSuggestionsResponse>;
export declare function extractTokenCandidates(content: string, sourceFile: string): Candidate[];
export {};
