import type { Express } from 'express';
export interface StaticSpaFallbackRequestLike {
    method: string;
    path: string;
    get?: (name: string) => string | undefined;
}
export declare function isStaticSpaFallbackRequest(req: StaticSpaFallbackRequestLike): boolean;
export declare function resolveStaticSpaFallbackPath(req: StaticSpaFallbackRequestLike, staticDir: string): string | null;
export declare function registerStaticSpaFallback(app: Express, staticDir: string): void;
