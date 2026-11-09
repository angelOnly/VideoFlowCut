import type Database from 'better-sqlite3';
import type { CollabCloudComment } from '@open-design/contracts';
import type { CommentRelayPublicationWitness } from './comment-relay-outbox.js';
import type { PublicFilePublicationScope } from './public-file-publication-store.js';
/** Persist only the publisher's chosen pair; no renaming rules live here. */
export declare function migrateCommentRelayPublicationMappings(db: Database.Database): void;
/** Persist a publication-authorized mutation while its public alias is stopped. */
export declare function recordPublishedCommentMutation(db: Database.Database, scope: PublicFilePublicationScope, comment: CollabCloudComment): boolean;
export declare function listPublishedCommentMutations(db: Database.Database, scope: PublicFilePublicationScope, slug: string): CollabCloudComment[];
/** Clear a journaled stop-race event only after the matching personal alias event is confirmed remotely. */
export declare function acknowledgePublishedCommentMutation(db: Database.Database, input: {
    resourceTeamId: string;
    ownerMemberId: string;
    projectId: string;
    filePath: string;
    commentId: string;
    slug: string;
    revision: string;
    status: string;
    deleted?: boolean | undefined;
}): void;
/** A resume changes the local witness, not the public alias. Keep unsent
 * stopped mutations under the new witness until the relay confirms delivery;
 * otherwise a second stop cancels their outbox and loses deleted identities.
 */
export declare function carryPublishedCommentMutationsToRevision(db: Database.Database, scope: PublicFilePublicationScope, revision: {
    slug: string;
    token: string;
}): void;
export declare function recordCommentRelayPublicationMapping(db: Database.Database, scope: PublicFilePublicationScope, witness: CommentRelayPublicationWitness): void;
export declare function currentCommentRelayPublicationMapping(db: Database.Database, scope: PublicFilePublicationScope): CommentRelayPublicationWitness | undefined;
/** Resolve a trusted alias-scoped cloud path, never a project-wide path guess.
 * Callers must obtain slug from the authenticated transport, not infer it from
 * the sole current publication. Two aliases can both package index.html, and
 * a stopped alias must never borrow another alias's surviving mapping.
 * This is location resolution, NOT authorization: normal relay checks still apply.
 */
export declare function sourcePathForCurrentPublication(db: Database.Database, input: {
    resourceTeamId: string;
    ownerMemberId: string;
    projectId: string;
    slug: string;
    publishedPath: string;
}): string | null;
