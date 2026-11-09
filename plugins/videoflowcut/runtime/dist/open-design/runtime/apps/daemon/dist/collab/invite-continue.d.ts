import type { WorkspaceCollabContext } from '@open-design/contracts';
import { readVelaControlApiContext } from '../integrations/vela.js';
export type InviteContinueOutcome = {
    ok: true;
    context: WorkspaceCollabContext | null;
    workspaceMemberId: string;
} | {
    ok: false;
    status: number;
    error: string;
};
export interface ConsumeInviteContinuationOptions {
    /** Injectable for tests. */
    fetch?: typeof fetch;
    /** Injectable for tests; defaults to reading ~/.amr / env. */
    readSession?: typeof readVelaControlApiContext;
    /** Settings-backed AMR environment selected by the desktop app. */
    configuredEnv?: Record<string, string>;
    timeoutMs?: number;
}
/**
 * Consume an invite continuation nonce against B using the local vela session,
 * returning the mapped workspace context on success. Errors are typed, not
 * thrown: `no_session` (401) when the client is not signed in, `continuation_<n>`
 * for B's 401/403/409/410 (subject mismatch / already consumed / expired), and
 * `continuation_unreachable` (502) on a transport failure.
 */
export declare function consumeInviteContinuation(nonce: string, options?: ConsumeInviteContinuationOptions): Promise<InviteContinueOutcome>;
