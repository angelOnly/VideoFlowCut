import type { Express } from 'express';
import type * as BetterSqlite3 from 'better-sqlite3';
import { type VerifyWorkspaceRequestAuthority } from '../../collab/workspace-resource-mutation.js';
export interface RegisterPluginAssetRoutesDeps {
    db: PluginDbLike;
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    getWorkspacePlugin?: (db: PluginDbLike, id: string, workspaceId: string | null, workspaceMemberId?: string | null) => InstalledPluginLike | null | Promise<InstalledPluginLike | null>;
    pluginAssetCache: {
        get(url: string): Promise<{
            buf: Buffer;
            contentType: string;
        }>;
    };
    AssetCacheError: new (...args: unknown[]) => Error & {
        status: number;
    };
    assetCacheRewriteUrl: (url: string) => string;
    isCacheableExternalUrl: (url: string) => boolean;
    assembleExample: (templateHtml: string, slidesHtml: string, title: string) => string;
}
type PluginDbLike = BetterSqlite3.Database;
interface PluginExampleOutput {
    path?: string;
    title?: string;
}
interface PluginManifestLike {
    title?: string;
    od?: {
        preview?: {
            entry?: string;
        };
        context?: {
            assets?: unknown[];
        };
        useCase?: {
            exampleOutputs?: PluginExampleOutput[];
        };
    };
    [key: string]: unknown;
}
interface InstalledPluginLike {
    fsPath: string;
    title?: string;
    manifest?: PluginManifestLike;
    [key: string]: unknown;
}
export declare function registerPluginAssetRoutes(app: Express, deps: RegisterPluginAssetRoutesDeps): void;
export {};
