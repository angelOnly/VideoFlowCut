import type Database from 'better-sqlite3';
import type { GenUISurfaceSpec } from '@open-design/contracts';
import { type GenUIEventSink } from './events.js';
import { type RespondSurfaceInput, type SurfaceKind, type SurfaceRow, type SurfaceTier } from './store.js';
type SqliteDb = Database.Database;
export declare function schemaDigest(schema: unknown): string;
export interface RequestOrReuseInput {
    projectId: string;
    conversationId?: string | null | undefined;
    runId: string;
    pluginSnapshotId: string;
    surface: GenUISurfaceSpec;
    payload?: unknown;
    emit?: GenUIEventSink;
}
export interface RequestOrReuseResult {
    reused: boolean;
    row: SurfaceRow;
}
export declare function requestOrReuseSurface(db: SqliteDb, input: RequestOrReuseInput): RequestOrReuseResult;
export interface RespondInput extends RespondSurfaceInput {
    runId: string;
    emit?: GenUIEventSink;
}
export declare function respondSurface(db: SqliteDb, input: RespondInput): SurfaceRow;
export interface RevokeInput {
    projectId: string;
    surfaceId: string;
}
export declare function revokeProjectSurface(db: SqliteDb, input: RevokeInput): number;
export interface PrefillInput {
    projectId: string;
    pluginSnapshotId: string;
    surfaceId: string;
    kind: SurfaceKind;
    persist: SurfaceTier;
    value: unknown;
    schema?: unknown;
    expiresAt?: number | null;
}
export declare function prefillProjectSurface(db: SqliteDb, input: PrefillInput): SurfaceRow;
export {};
