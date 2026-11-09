import type { ResearchFindings } from '@open-design/contracts/api/research';
export declare class ResearchError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status?: number, code?: string);
}
export interface SearchResearchInput {
    query: string;
    projectRoot: string;
    maxSources?: number;
    providers?: string[];
    requestInit?: Pick<RequestInit, 'dispatcher'>;
    signal?: AbortSignal;
}
export declare function searchResearch(input: SearchResearchInput): Promise<ResearchFindings>;
