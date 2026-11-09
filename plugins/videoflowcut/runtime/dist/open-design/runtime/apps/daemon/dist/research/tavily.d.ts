import type { ResearchSource } from '@open-design/contracts/api/research';
export interface TavilySearchInput {
    apiKey: string;
    baseUrl?: string;
    query: string;
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    requestInit?: Pick<RequestInit, 'dispatcher'>;
    signal?: AbortSignal;
}
export interface TavilySearchOutput {
    answer: string;
    sources: ResearchSource[];
}
export declare class TavilyError extends Error {
    readonly status?: number | undefined;
    constructor(message: string, status?: number | undefined);
}
export declare function tavilySearch(input: TavilySearchInput): Promise<TavilySearchOutput>;
