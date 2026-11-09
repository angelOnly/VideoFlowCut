import { getWorkspaceProjectByProjectId } from '../db.js';
import { openDesignAmrTraceEnv } from './env.js';
export function accountScopedRunWorkspaceScopeForProject(projectId) {
    return Object.freeze({
        schemaVersion: 1,
        projectId,
        workspaceId: null,
        source: 'unbound_account',
    });
}
export class AmrWorkspaceScopeRequiredError extends Error {
    code = 'AMR_WORKSPACE_SCOPE_REQUIRED';
    projectId;
    constructor(projectId) {
        super(projectId
            ? `AMR Cloud requires project ${projectId} to be bound to a Workspace before running`
            : 'AMR Cloud requires a Workspace-bound project before running');
        this.name = 'AmrWorkspaceScopeRequiredError';
        this.projectId = projectId;
    }
}
/**
 * Freeze the billing address before a run is created.
 *
 * This is the only function in the run path that reads the mutable project
 * binding. Its result is stored on the run and reused for every attempt. The
 * separate account-scoped proof records a genuinely unbound local project;
 * null remains "no proof" and may not silently select a wallet.
 */
export function pinRunWorkspaceScopeForProject(db, projectId) {
    const normalizedProjectId = projectId.trim();
    if (!normalizedProjectId)
        return null;
    const binding = getWorkspaceProjectByProjectId(db, normalizedProjectId);
    const workspaceId = typeof binding?.workspaceId === 'string' && binding.workspaceId.trim()
        ? binding.workspaceId.trim()
        : null;
    if (!workspaceId)
        return null;
    return Object.freeze({
        schemaVersion: 1,
        projectId: normalizedProjectId,
        workspaceId,
        workspaceMemberId: binding?.createdByWorkspaceMemberId?.trim() || null,
        source: 'persisted_project_binding',
    });
}
/**
 * Build the AMR trace environment solely from the run's frozen binding.
 *
 * The request shell's active/current Workspace, the local membership
 * directory, and the project's current binding are intentionally absent.
 * Project A stays pinned to A for initial spawn and every retry even if the UI
 * switches to B, authority lookup is unavailable, or the project is later
 * rebound. Vela/AMR receives the signed-in account credentials plus
 * `OPEN_DESIGN_WORKSPACE_ID=A` and remains the final authorization/billing
 * authority. A genuinely unbound local project stays account-scoped and omits
 * the Workspace env var on every attempt.
 */
export async function openDesignAmrTraceEnvForRun(input, deps = {}) {
    const traceInput = {
        agentId: input.agentId,
        runId: input.runId,
        runAttempt: input.runAttempt,
        ...(input.conversationId !== undefined
            ? { conversationId: input.conversationId }
            : {}),
        ...(input.externalPluginAnalytics !== undefined
            ? { externalPluginAnalytics: input.externalPluginAnalytics }
            : {}),
    };
    if (input.agentId !== 'amr')
        return openDesignAmrTraceEnv(traceInput);
    const projectId = input.projectId?.trim();
    if (!projectId)
        throw new AmrWorkspaceScopeRequiredError(null);
    const accountScoped = input.workspaceScope?.projectId === projectId
        && input.workspaceScope.source === 'unbound_account'
        && input.workspaceScope.schemaVersion === 1
        && input.workspaceScope.workspaceId === null;
    const workspaceId = input.workspaceScope?.projectId === projectId
        && input.workspaceScope.source === 'persisted_project_binding'
        && input.workspaceScope.schemaVersion === 1
        && input.workspaceScope.workspaceId.trim()
        ? input.workspaceScope.workspaceId.trim()
        : null;
    deps.onWorkspaceScopeOutcome?.({
        kind: workspaceId
            ? 'resolved_persisted_binding'
            : accountScoped
                ? 'account_scoped_unbound'
                : 'refused_unbound',
        projectId,
        workspaceId,
    });
    if (!workspaceId) {
        if (accountScoped)
            return openDesignAmrTraceEnv(traceInput);
        throw new AmrWorkspaceScopeRequiredError(projectId);
    }
    return openDesignAmrTraceEnv({
        ...traceInput,
        workspaceId,
    });
}
//# sourceMappingURL=project-amr-trace-env.js.map