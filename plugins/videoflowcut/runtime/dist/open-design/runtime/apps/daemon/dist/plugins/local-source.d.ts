import type Database from 'better-sqlite3';
import type { InstalledPluginRecord } from '@open-design/contracts';
/**
 * Select the local registry partition that belongs to an exact plugin source.
 *
 * PRODUCT INVARIANT: this is filesystem provenance, not membership authority.
 * It lets a locally materialized Team plugin resolve the locally materialized
 * Skill and Design System records stored in the same catalogue partition. Do
 * not compare this Workspace with a project, fetch identity, or block Send.
 */
export declare function localPluginRegistryScope(plugin: {
    id?: unknown;
    source?: unknown;
}): {
    workspaceId: string;
    workspaceMemberId: null;
} | undefined;
/**
 * Resolve the exact record already selected from a local catalogue.
 *
 * PRODUCT INVARIANT: this is local identity resolution, not authorization.
 * The catalogue's Workspace partition and its SSE/poll reconciliation own
 * availability. Do not add a network membership check, compare against a new
 * project's Workspace, or turn this helper into a Send preflight. Remote
 * install/share/sync/move operations enforce their own current authority.
 */
export declare function resolveLocalPluginBySource(input: {
    db: Database.Database;
    id: string;
    source: string;
    userPluginsRoot: string;
}): Promise<InstalledPluginRecord | null>;
