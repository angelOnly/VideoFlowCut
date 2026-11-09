import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
/**
 * Persisted Team mirrors use a Workspace-qualified envelope id. The logical
 * Design System id remains `user:<slug>` in every UI/API surface; only the
 * generic `workspace_resources` key is namespaced so two Teams, or Personal
 * and Team in one Workspace, can safely carry the same logical id.
 */
export declare function workspaceTeamDesignSystemBindingResourceId(workspaceId: string, designSystemId: string): string;
export declare function designSystemIdFromWorkspaceTeamBinding(workspaceId: string, bindingResourceId: string): string | null;
export declare function designSystemLogicalResourceId(bindingResourceId: string): string;
export declare function workspaceTeamDesignSystemBindingAllowsRead(db: SqliteDb, workspaceId: string, designSystemId: string): boolean;
export {};
