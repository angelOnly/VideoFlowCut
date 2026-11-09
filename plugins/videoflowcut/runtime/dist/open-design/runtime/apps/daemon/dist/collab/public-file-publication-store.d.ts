import type Database from 'better-sqlite3';
import type { PublicFileMutations } from './public-file-mutations.js';
type SqliteDb = Database.Database;
export interface PublicFilePublicationScope {
    /** New-protocol lifetime; path-only records remain historical, never relinked. */
    sourceFileId?: string;
    resourceTeamId: string;
    ownerMemberId: string;
    projectId: string;
    filePath: string;
}
export interface PublicFilePublication {
    /** Content may be published while its deployment Web origin is unknown. */
    url: string | null;
    slug: string;
    fileName: string;
}
/** Internal operation witness; never included in the public publication DTO. */
export interface PublicFilePublicationRevision {
    slug: string;
    token: string;
}
export interface PublicFilePublicationStore {
    getRevision(scope: PublicFilePublicationScope): PublicFilePublicationRevision | null;
    deleteIfRevisionMatches(scope: PublicFilePublicationScope, expected: PublicFilePublicationRevision): boolean;
    get(scope: PublicFilePublicationScope): PublicFilePublication | null;
    set(scope: PublicFilePublicationScope, publication: PublicFilePublication): void;
    delete(scope: PublicFilePublicationScope): void;
    /**
     * Replace only the persisted share address of the publication at this slug.
     * The address is a function of (project, slug) alone, so the slug is the
     * whole guard: a row republished under another slug is left untouched. The
     * revision witness and publish time are deliberately not rotated — this is a
     * presentation refresh, not a new publication. Returns whether a row changed.
     */
    updateLink(scope: PublicFilePublicationScope, slug: string, url: string | null): boolean;
}
/** Full store capability for consumers that enumerate project publications. */
export interface ProjectPublicFilePublicationStore extends PublicFilePublicationStore {
    /** Lists this principal's project with the most recent successful publish time in epoch ms. */
    listByProject(scope: {
        resourceTeamId: string;
        ownerMemberId: string;
        projectId: string;
    }): ReadonlyArray<{
        filePath: string;
        slug: string;
        publishedAt: number;
    }>;
}
export interface PublicFileStopTaskKey extends PublicFilePublicationScope {
    slug: string;
}
export interface PublicFileStopTask extends PublicFileStopTaskKey {
    /** Absent for legacy tasks or a slug without a current local witness. */
    publicationRevision?: string;
    failureCount: number;
}
/** Internal persistence only: callers own stop requests and startup scheduling. */
export interface StopQueuePublicFilePublicationStore extends ProjectPublicFilePublicationStore {
    /** Record initial failure (count 1). Only a matching current revision may replace
     * an older intent; duplicate intents never reset their failure budget. */
    enqueueStop(key: PublicFileStopTaskKey, expected?: PublicFilePublicationRevision): void;
    /** Detached snapshot including exhausted tasks for diagnostics; no raw errors are stored. */
    listStops(): ReadonlyArray<PublicFileStopTask>;
    /** One entry per retryable key for one startup pass; no retries are executed here. */
    listRetryableStops(): ReadonlyArray<PublicFileStopTask>;
    /** Increment an existing task once, capped at five total failures; absent tasks are ignored. */
    recordStopFailure(key: PublicFileStopTaskKey): void;
    /** After successful stop, remove only this exact task, including explicitly resolved terminal tasks. */
    completeStop(key: PublicFileStopTaskKey): void;
}
export declare function migratePublicFilePublications(db: SqliteDb): void;
export declare function createInMemoryPublicFilePublicationStore(): StopQueuePublicFilePublicationStore;
/**
 * Persist public snapshot identities under the exact resource-hub principal
 * that created them. There is deliberately no project foreign key: deleting a
 * local project must not erase the slug needed to redact its still-public
 * remote snapshot.
 */
export declare function createSqlitePublicFilePublicationStore(db: SqliteDb, now?: () => number): StopQueuePublicFilePublicationStore;
/**
 * Prepare an operation bound to the queued resource team AND member. Return null
 * when capability/identity is unavailable; never resolve to a different account.
 * Preparation must not send the stop request. The returned operation must retain
 * the verified credentials rather than consulting mutable current-account state.
 */
interface PreparedPublicFileStop {
    resourceTeamId: string;
    ownerMemberId: string;
    stop(): Promise<void>;
}
export type PreparePublicFileStop = (key: Readonly<PublicFileStopTaskKey>) => Promise<PreparedPublicFileStop | null>;
interface PublicFileStopStartupResult {
    stopped: number;
    failed: number;
    deferred: number;
    persistenceFailures: number;
}
/** One pass per daemon lifecycle, not per route registration or request. */
export declare function createPublicFileStopStartup(store: StopQueuePublicFilePublicationStore, prepare: PreparePublicFileStop | null, mutations?: PublicFileMutations): () => Promise<PublicFileStopStartupResult>;
export {};
