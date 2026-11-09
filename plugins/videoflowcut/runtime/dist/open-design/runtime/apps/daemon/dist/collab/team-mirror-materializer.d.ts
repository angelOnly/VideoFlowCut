import Database from 'better-sqlite3';
import type { RegisterPulledProjectInput, TeamMirrorPullScope } from '../routes/collab-sync.js';
import type { AuthorizedTeamProjectPullReceipt } from './authorized-team-project-pull.js';
type SqliteDb = Database.Database;
export interface MaterializePulledTeamMirrorResult {
    localRecordChanged: boolean;
}
export declare function teamProjectMaterializationMatches(stored: AuthorizedTeamProjectPullReceipt | null, expected: AuthorizedTeamProjectPullReceipt): boolean;
export declare function teamProjectMaterializationSupersedes(stored: AuthorizedTeamProjectPullReceipt | null, previous: AuthorizedTeamProjectPullReceipt): boolean;
export declare function getTeamProjectMaterialization(db: SqliteDb, workspaceId: string, projectId: string): AuthorizedTeamProjectPullReceipt | null;
/**
 * Read the newest cursor across the receipt-backed and legacy stores.
 *
 * Legacy/manual pulls may advance after an authorized staged pull. The receipt
 * cursor remains useful, but it must not hide that newer legacy cursor. An
 * authorized row only participates when its complete scope and canonical
 * owner-scoped resource binding still match the requested project.
 */
export declare function latestTeamProjectMaterializationVersion(authorized: AuthorizedTeamProjectPullReceipt | null, legacyVersion: string | null, projectId: string, scope: TeamMirrorPullScope): number | null;
/**
 * Atomically create/update a pulled project and bind it as a read-only mirror
 * in the exact validated team scope. Existing bindings are never migrated:
 * only an absent row or a compatible active mirror may proceed.
 */
export declare function materializePulledTeamMirror(db: SqliteDb, input: RegisterPulledProjectInput, scope: TeamMirrorPullScope, receipt?: AuthorizedTeamProjectPullReceipt, options?: {
    placeholder?: boolean;
    fileReceipt?: {
        resourceId: string;
        versionId: string;
    };
}): MaterializePulledTeamMirrorResult;
export {};
