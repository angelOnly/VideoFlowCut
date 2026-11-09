import type { UserDesignSystemInput } from './index.js';
export type DesignSystemSourceContext = {
    github: GitHubRepositoryContext[];
    notes: string;
};
export type GitHubRepositoryContext = {
    url: string;
    owner: string;
    repo: string;
    description?: string;
    homepage?: string;
    defaultBranch?: string;
    language?: string;
    stars?: number;
    topics?: string[];
    readmeExcerpt?: string;
    packageName?: string;
    packageDescription?: string;
    error?: string;
};
export type FetchLike = (url: string, init?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
}) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
}>;
export type SourceContextOptions = {
    fetch?: FetchLike;
    maxRepos?: number;
    maxReadmeChars?: number;
    timeoutMs?: number;
};
export declare function collectDesignSystemSourceContext(input: UserDesignSystemInput, options?: SourceContextOptions): Promise<DesignSystemSourceContext>;
export declare function mergeSourceContextIntoInput(input: UserDesignSystemInput, context: DesignSystemSourceContext): UserDesignSystemInput;
