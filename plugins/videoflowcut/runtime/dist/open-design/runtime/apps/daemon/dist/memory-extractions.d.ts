import type { MemoryExtractionOrigin } from '@open-design/contracts';
export declare function captureExtractionOrigin(value: unknown): MemoryExtractionOrigin | undefined;
export declare function startExtraction({ userMessage, kind, extractionOrigin }: {
    extractionOrigin?: undefined;
    kind?: string | undefined;
    userMessage: any;
}): `${string}-${string}-${string}-${string}-${string}`;
export declare function markProvider(id: any, provider: any): void;
export declare function markSkipped(id: any, reason: any): void;
export declare function recordSkip({ userMessage, reason, kind, extractionOrigin }: {
    extractionOrigin?: undefined;
    kind?: string | undefined;
    reason: any;
    userMessage: any;
}): `${string}-${string}-${string}-${string}-${string}`;
export declare function recordHeuristic({ userMessage, writtenCount, writtenIds, extractionOrigin }: {
    extractionOrigin?: undefined;
    userMessage: any;
    writtenCount: any;
    writtenIds: any;
}): `${string}-${string}-${string}-${string}-${string}`;
export declare function markProposed(id: any, proposedCount: any): void;
export declare function markSuccess(id: any, { writtenCount, writtenIds }: {
    writtenCount: any;
    writtenIds: any;
}): void;
export declare function markFailed(id: any, error: any): void;
export declare function listExtractions(): any[];
export declare function removeExtraction(id: any): 0 | 1;
export declare function clearExtractions(): number;
export declare function __resetExtractionsForTests(): void;
