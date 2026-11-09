import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
import type { createTerminalService } from '../terminals.js';
import type { AuthorizeProjectRequest } from '../collab/project-request-authority.js';
export interface RegisterTerminalRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'projectFiles'> {
    terminals: ReturnType<typeof createTerminalService>;
    authorizeProjectRequest: AuthorizeProjectRequest;
}
/**
 * Interactive Terminal HTTP surface under `/api/projects/:id/terminals`.
 *
 * The transport deliberately mirrors the chat-run lifecycle: output streams
 * down over SSE (reusing `createSseResponse` with `Last-Event-ID` replay),
 * keystrokes and resizes flow back up over plain POST. No WebSocket. The
 * PTY runs the user's shell rooted at the project working directory, so both
 * the web `<TerminalViewer>` and `od shell` get the same shell as a hand-off
 * editor would open.
 */
export declare function registerTerminalRoutes(app: Express, ctx: RegisterTerminalRoutesDeps): void;
