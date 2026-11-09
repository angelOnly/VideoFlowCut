import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
/**
 * Team Skill mirrors use a Workspace-qualified envelope key in the generic
 * binding table. The logical Skill id remains unchanged at every UI/API
 * surface, while Personal and multiple Teams may safely use the same id.
 */
export declare function workspaceTeamSkillBindingResourceId(workspaceId: string, skillId: string): string;
export declare function skillIdFromWorkspaceTeamBinding(workspaceId: string, bindingResourceId: string): string | null;
export declare function skillLogicalResourceId(bindingResourceId: string): string;
export declare function workspaceTeamSkillBindingAllowsRead(db: SqliteDb, workspaceId: string, skillId: string): boolean;
/**
 * Capture the full local generation before an asynchronous hub read. State is
 * included because two SQLite writes may share one millisecond; a tombstone
 * must still invalidate an older positive response in that case.
 */
export declare function workspaceTeamSkillBindingActivationFence(db: SqliteDb, workspaceId: string, skillId: string): string | null;
export declare function resolveWorkspaceTeamSkillWithBindingGate<T>(input: {
    bindingAllowsRead: () => boolean;
    resolve: () => Promise<T | null>;
}): Promise<T | null>;
export declare function activateWorkspaceTeamSkillIfStillShared(input: {
    captureActivationFence: () => string | null;
    stillShared: () => Promise<boolean>;
    activationFenceIsCurrent: (fence: string | null) => boolean;
    activate: () => boolean;
}): Promise<boolean>;
export declare function resolveAndActivateWorkspaceTeamSkill<T>(input: {
    resolve: () => Promise<T | null>;
    captureActivationFence: () => string | null;
    stillShared: () => Promise<boolean>;
    activationFenceIsCurrent: (fence: string | null) => boolean;
    activate: () => boolean;
}): Promise<T | null>;
export {};
