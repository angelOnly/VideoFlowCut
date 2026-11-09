import type Database from 'better-sqlite3';
import type { GenUISurfaceSpec } from '@open-design/contracts';
type SqliteDb = Database.Database;
export type SurfaceStatus = 'pending' | 'resolved' | 'timeout' | 'invalidated';
export type SurfaceTier = 'run' | 'conversation' | 'project';
export type SurfaceRespondedBy = 'user' | 'agent' | 'auto' | 'cache';
export type SurfaceKind = GenUISurfaceSpec['kind'];
export interface SurfaceRow {
    id: string;
    projectId: string;
    conversationId: string | null;
    runId: string | null;
    pluginSnapshotId: string;
    surfaceId: string;
    kind: SurfaceKind;
    persist: SurfaceTier;
    schemaDigest: string | null;
    value: unknown;
    status: SurfaceStatus;
    respondedBy: SurfaceRespondedBy | null;
    requestedAt: number;
    respondedAt: number | null;
    expiresAt: number | null;
}
export interface RequestSurfaceInput {
    projectId: string;
    conversationId?: string | null | undefined;
    runId?: string | null | undefined;
    pluginSnapshotId: string;
    surfaceId: string;
    kind: SurfaceKind;
    persist: SurfaceTier;
    schemaDigest?: string | null | undefined;
    expiresAt?: number | null | undefined;
}
export interface RespondSurfaceInput {
    rowId: string;
    value: unknown;
    respondedBy: SurfaceRespondedBy;
    expiresAt?: number | null | undefined;
}
export interface PrefillSurfaceInput {
    projectId: string;
    pluginSnapshotId: string;
    surfaceId: string;
    kind: SurfaceKind;
    persist: SurfaceTier;
    value: unknown;
    schemaDigest?: string | null | undefined;
    expiresAt?: number | null | undefined;
}
export declare function requestSurface(db: SqliteDb, input: RequestSurfaceInput): SurfaceRow;
export declare function respondSurface(db: SqliteDb, input: RespondSurfaceInput): SurfaceRow;
export declare function prefillSurface(db: SqliteDb, input: PrefillSurfaceInput): SurfaceRow;
export declare function lookupResolved(db: SqliteDb, args: {
    projectId: string;
    conversationId?: string | null | undefined;
    surfaceId: string;
    persist: SurfaceTier;
    schemaDigest?: string | null | undefined;
    now?: number;
}): SurfaceRow | null;
export declare function revokeSurface(db: SqliteDb, args: {
    projectId: string;
    surfaceId: string;
}): number;
export declare function markTimeout(db: SqliteDb, rowId: string): SurfaceRow | null;
export declare function listSurfacesForRun(db: SqliteDb, runId: string): SurfaceRow[];
export declare function listSurfacesForProject(db: SqliteDb, projectId: string): SurfaceRow[];
export declare function getSurface(db: SqliteDb, rowId: string): SurfaceRow | null;
export declare function findPendingByRunAndSurfaceId(db: SqliteDb, args: {
    runId: string;
    surfaceId: string;
}): SurfaceRow | null;
export {};
