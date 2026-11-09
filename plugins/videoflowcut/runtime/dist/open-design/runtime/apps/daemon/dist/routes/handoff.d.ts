import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterHandoffRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'conversations' | 'validation' | 'handoff'> {
    authorizeProjectRequest: AuthorizeProjectRequest;
}
/**
 * `POST /api/projects/:id/handoff` — synthesise a "first user message"
 * prompt the next conversation can send so a fresh chat can resume the
 * work without replaying the full transcript.
 *
 * Handoff is conversation-scoped: the request carries a `conversationId`
 * the route validates belongs to `:id` (404 CONVERSATION_NOT_FOUND
 * otherwise), and only that conversation's transcript is synthesized.
 *
 * The validation block and BYOK upstream call mirror
 * `import-export-routes.ts::registerFinalizeRoutes`. Error mapping is
 * largely shared but diverges deliberately: handoff maps
 * `TranscriptExportLockedError` to 409 CONFLICT (the transcript-export
 * lock is acquired transitively, not a handoff lockfile of its own),
 * maps `EmptyTranscriptError` to 400 EMPTY_TRANSCRIPT (an empty
 * conversation is caller input, not a server fault), and maps an
 * upstream 400 to the caller's 400 BAD_REQUEST rather than 502.
 */
export declare function registerHandoffRoutes(app: Express, ctx: RegisterHandoffRoutesDeps): void;
