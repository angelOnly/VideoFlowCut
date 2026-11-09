import { type WorkspaceInviteRole } from '@open-design/contracts';
import { readVelaControlApiContext } from '../integrations/vela.js';
export interface CreateWorkspaceInviteInput {
    email: string;
    role: WorkspaceInviteRole;
    /** The workspace the invite is scoped to (derived from the caller's context). */
    workspaceId: string;
}
export type CreateInviteOutcome = {
    ok: true;
    inviteId: string;
} | {
    ok: false;
    status: number;
    error: string;
};
export interface CreateWorkspaceInviteOptions {
    /** Injectable for tests. */
    fetch?: typeof fetch;
    /** Injectable for tests; defaults to reading ~/.amr / env. */
    readSession?: typeof readVelaControlApiContext;
    timeoutMs?: number;
}
/**
 * Create a single workspace invite on B using the local vela session.
 *
 * Errors are typed, not thrown: `no_session` (401) when the client is not signed
 * in, `no_workspace` (409) when there is no workspace to scope the invite to,
 * safe allowlisted business codes for known B failures, `create_<n>` for every
 * other B non-2xx (e.g. `create_404` when the endpoint is absent locally), and
 * `create_unreachable` (502) on a transport failure.
 */
export declare function createWorkspaceInvite(input: CreateWorkspaceInviteInput, options?: CreateWorkspaceInviteOptions): Promise<CreateInviteOutcome>;
