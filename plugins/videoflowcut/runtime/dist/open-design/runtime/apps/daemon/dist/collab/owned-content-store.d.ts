import type Database from 'better-sqlite3';
export interface OwnedContentScope {
    /** Exact trusted catalog root, when using the production transport. */
    resourceId?: string;
    projectId: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
}
export interface OwnedContentRecord {
    localVersion: number | null;
    latestVersion: number | null;
    ignoredVersion: number | null;
    promptSuppressedUntil: number | null;
    fingerprint: string | null;
}
export interface OwnedContentStore {
    read(scope: OwnedContentScope): OwnedContentRecord;
    write(scope: OwnedContentScope, record: OwnedContentRecord): void;
}
export declare const ownedContentScopeKey: (scope: OwnedContentScope) => string;
export declare const emptyOwnedContentRecord: () => OwnedContentRecord;
export declare function migrateOwnedContentSync(db: Database.Database): void;
export declare function createSqliteOwnedContentStore(db: Database.Database): OwnedContentStore;
