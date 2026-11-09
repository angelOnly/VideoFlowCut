import { type LocalDesignSystemImportOptions, type LocalDesignSystemImportResult } from './import.js';
export type GitHubDesignSystemImportOptions = Pick<LocalDesignSystemImportOptions, 'craftApplies' | 'importMode' | 'name' | 'now' | 'reservedIds'> & {
    branch?: string;
    gitBin?: string;
};
export type ParsedGitHubRepoUrl = {
    cloneUrl: string;
    owner: string;
    repo: string;
};
export declare function importGitHubDesignSystemProject(githubUrl: string, tmpRoot: string, userDesignSystemsRoot: string, options?: GitHubDesignSystemImportOptions): Promise<LocalDesignSystemImportResult>;
export declare function parseGitHubRepoUrl(input: string): ParsedGitHubRepoUrl;
