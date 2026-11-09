import type { InstalledPluginRecord, MarketplaceTrust, PluginSourceKind, TrustTier } from '@open-design/contracts';
import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
type DbRow = Record<string, unknown>;
export interface RegistryRoots {
    userPluginsRoot: string;
}
export declare function registryRootsForDataDir(dataDir: string): RegistryRoots;
export declare function defaultRegistryRoots(): RegistryRoots;
export interface ScannedPlugin {
    record: InstalledPluginRecord;
    warnings: string[];
}
export interface ResolveOptions {
    folder: string;
    folderId: string;
    sourceKind?: PluginSourceKind;
    source?: string;
    pinnedRef?: string;
    trust?: TrustTier;
    capabilitiesGranted?: string[];
    sourceMarketplaceId?: string;
    sourceMarketplaceEntryName?: string;
    sourceMarketplaceEntryVersion?: string;
    marketplaceTrust?: MarketplaceTrust;
    resolvedSource?: string;
    resolvedRef?: string;
    manifestDigest?: string;
    archiveIntegrity?: string;
}
export interface ResolveOutcome {
    ok: true;
    record: InstalledPluginRecord;
    warnings: string[];
}
export interface ResolveFailure {
    ok: false;
    errors: string[];
    warnings: string[];
}
export type ResolveResult = ResolveOutcome | ResolveFailure;
export declare function resolvePluginFolder(opts: ResolveOptions): Promise<ResolveResult>;
export declare function rowToInstalledPlugin(row: DbRow): InstalledPluginRecord;
/**
 * A materialized Team plugin is readable only while its exact Workspace
 * binding is live. An unbound marker is still accepted for one compatibility
 * read so pre-binding installs can be adopted by the daemon without vanishing
 * during an upgrade; callers must persist that binding immediately.
 */
export declare function workspaceTeamPluginBindingAllowsRead(db: SqliteDb, workspaceId: string, pluginId: string): boolean;
/**
 * Snapshot the local binding generation before an asynchronous hub read.
 * `resourceState` is intentionally part of the fence in addition to
 * `updatedAt`: two synchronous SQLite writes can share the same millisecond,
 * but an intervening tombstone must still invalidate an older positive read.
 * `null` is the generation for a binding that does not exist yet.
 */
export declare function workspaceTeamPluginBindingActivationFence(db: SqliteDb, workspaceId: string, pluginId: string): string | null;
/**
 * Team materializations are separate from the Personal installed-plugin row.
 * The generic binding table only allows one row per resource id, so a Team
 * mirror must not claim the bare plugin id: Personal and Team plugins with the
 * same manifest id are valid and coexist in `listWorkspacePlugins`.
 */
export declare function workspaceTeamPluginBindingResourceId(workspaceId: string, pluginId: string): string;
export declare function pluginIdFromWorkspaceTeamPluginBinding(workspaceId: string, bindingResourceId: string): string | null;
export declare function resolveWorkspaceTeamPluginWithBindingGate<T>(input: {
    bindingAllowsRead: () => boolean;
    resolve: () => Promise<T | null>;
}): Promise<T | null>;
export declare function resolveAndActivateWorkspaceTeamPlugin<T>(input: {
    resolve: () => Promise<T | null>;
    captureActivationFence: () => string | null;
    stillShared: () => Promise<boolean>;
    activationFenceIsCurrent: (fence: string | null) => boolean;
    activate: () => boolean;
}): Promise<T | null>;
export declare function activateWorkspaceTeamPluginIfStillShared(input: {
    captureActivationFence: () => string | null;
    stillShared: () => Promise<boolean>;
    activationFenceIsCurrent: (fence: string | null) => boolean;
    activate: () => boolean;
}): Promise<boolean>;
/**
 * `workspaceId` is optional and defaults to the pre-workspace-isolation
 * behavior (every live installed plugin, otherwise unfiltered) so every existing caller —
 * `od plugin list`, inventory stats, the bundled-scenario scan in server.ts —
 * keeps working unchanged, AS LONG AS THEY OMIT THE ARGUMENT ENTIRELY. A
 * reconciled tombstone is terminal even for these unscoped internal callers.
 * `GET /api/plugins` always passes a second argument (`headerValue(...)`,
 * which returns `string | null`, never `undefined`), so it always gets the
 * workspace-scoped view even when the caller has no header — see
 * `pluginVisibleFromWorkspace`'s doc comment for why `undefined` and `null`
 * must NOT collapse to the same "unfiltered" behavior here.
 */
export declare function listInstalledPlugins(db: SqliteDb, workspaceId?: string | null, workspaceMemberId?: string | null): InstalledPluginRecord[];
export declare function getInstalledPlugin(db: SqliteDb, id: string): InstalledPluginRecord | null;
export declare function upsertInstalledPlugin(db: SqliteDb, record: InstalledPluginRecord): void;
export declare function deleteInstalledPlugin(db: SqliteDb, id: string): boolean;
export {};
