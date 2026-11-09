import type Database from "better-sqlite3";
import type { CollabCloudComment } from "@open-design/contracts";
type SqliteDb = Database.Database;
export interface CommentRelayOutboxIdentity {
    workspaceId: string;
    workspaceMemberId: string;
    teamId: string;
    /** Internal durable discriminator; existing rows default to team. */
    relayScope: "team" | "personal";
}
export interface CommentRelayPublicationWitness {
    slug: string;
    token: string;
    publicFilePath: string;
}
export interface CommentRelayOutboxRecord extends CommentRelayOutboxIdentity {
    projectId: string;
    commentId: string;
    expectedOwnerMemberId: string | null;
    comment: CollabCloudComment;
    publication?: CommentRelayPublicationWitness;
    revision: number;
    /** Stable for one logical mutation even after ACK, stop, restart, or same-alias resume. */
    eventKey: string;
    attemptCount: number;
    nextAttemptAt: number;
}
export interface CommentRelayOutboxStore {
    enqueue(input: CommentRelayOutboxIdentity & {
        projectId: string;
        expectedOwnerMemberId: string | null;
        comment: CollabCloudComment;
        publication?: CommentRelayPublicationWitness;
    }): void;
    isPublicationCurrent?(record: CommentRelayOutboxRecord): boolean;
    isCurrent?(record: CommentRelayOutboxRecord): boolean;
    listDue(now: number, limit?: number): CommentRelayOutboxRecord[];
    /** Default acknowledgement is discard/cancel; only an explicit receipt is delivery. */
    acknowledge(record: CommentRelayOutboxRecord, outcome?: "delivered" | "discarded"): boolean;
    defer(record: CommentRelayOutboxRecord, input: {
        nextAttemptAt: number;
        error: string;
    }): boolean;
    /**
     * Re-queue this exact personal revision as Team relay, keeping its payload
     * and publication witness. Only for a project whose creator's row became
     * team-visible (see {@link commentRelayRecordPromotedToTeam}).
     */
    rescopeToTeam?(record: CommentRelayOutboxRecord): boolean;
    /** Only after fresh creator/exact-file authority; requires a current canonical mapping. */
    rescopeToPersonal?(record: CommentRelayOutboxRecord): boolean;
    count(): number;
}
export interface PersonalCommentRelayPublicationScope {
    resourceTeamId: string;
    ownerMemberId: string;
    projectId: string;
    filePath: string;
}
/**
 * Cancel only durable personal-relay records whose persisted publication scope
 * was authoritatively stopped. This is intentionally not part of enqueue or
 * ordinary publication updates: a stop is the one lifecycle transition that
 * invalidates revisions already waiting in SQLite.
 */
export declare function cancelPersonalCommentRelayOutbox(db: SqliteDb, scope: PersonalCommentRelayPublicationScope): void;
export interface CommentRelayLocalProjectBinding {
    workspaceId?: string | null;
    visibility?: string | null;
    resourceState?: string | null;
    createdByWorkspaceMemberId?: string | null;
}
export declare function commentRelayLocalBindingMatches(record: CommentRelayOutboxRecord, binding: CommentRelayLocalProjectBinding | null | undefined): boolean;
/**
 * A personal record whose project has since become team-visible for the SAME
 * creator in the SAME workspace (decision 67 #11: publishing a private project
 * in a team workspace makes it team-visible). That is not an unshare, delete,
 * or re-home, so the queued comment is still meant for this project's readers;
 * it only needs the Team relay path now. Anything else stays a cancellation.
 */
export declare function commentRelayRecordPromotedToTeam(record: CommentRelayOutboxRecord, binding: CommentRelayLocalProjectBinding | null | undefined): boolean;
export declare function migrateCommentRelayOutbox(db: SqliteDb): void;
export declare function createCommentRelayOutboxStore(db: SqliteDb, now?: () => number): CommentRelayOutboxStore;
export {};
