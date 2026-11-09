import type { Express } from 'express';
import type { HostEditorId } from '@open-design/contracts';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterHostToolsRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'projectFiles'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
export type RealPlatform = 'darwin' | 'win32' | 'linux';
export type Platform = RealPlatform | 'unknown';
export interface CatalogueEntry {
    id: HostEditorId;
    label: string;
    icon: string;
    command?: string;
    commandArgs?: (resolvedDir: string) => string[];
    macOpenBundle?: string | readonly string[];
    macOpenArgs?: (bundleName: string, resolvedDir: string) => string[];
    platforms?: RealPlatform[];
    excludedPlatforms?: RealPlatform[];
}
export declare const CATALOGUE: ReadonlyArray<CatalogueEntry>;
export interface HostToolLaunchPlan {
    available: boolean;
    resolvedPath?: string;
    command?: string;
    args?: string[];
}
export declare function resolveHostToolLaunchPlan(editorId: HostEditorId, resolvedDir: string): Promise<HostToolLaunchPlan>;
export declare function launchHostTool(command: string, args: string[]): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function applicableForPlatform(entry: CatalogueEntry, platform: Platform): boolean;
export declare function registerHostToolsRoutes(app: Express, ctx: RegisterHostToolsRoutesDeps): void;
