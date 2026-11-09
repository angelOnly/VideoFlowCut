/**
 * Terminate every still-active agent run owned by a conversation or project
 * before its row is deleted.
 *
 * Deleting a conversation or project must not orphan a live agent CLI
 * subprocess: without this the child keeps consuming provider quota, the run
 * stays non-terminal in `GET /api/runs` with no UI trace, and for a project
 * delete the process keeps writing into a directory that has been removed out
 * from under it (#5468). The run service already knows how to stop a run —
 * `cancel` terminates the child and marks it `canceled` — so the delete
 * handlers just have to call it for the runs they would otherwise strand.
 *
 * `list({ status: 'active' })` already filters to non-terminal runs, and
 * `cancel` is a no-op on an already-terminal run, so this is safe to call
 * unconditionally and races with a naturally-finishing run harmlessly. A
 * cancellation failure is swallowed per-run so it can never block the delete
 * the user asked for.
 */
export async function cancelRunsOwnedBy(runs, scope) {
    const active = runs.list({ ...scope, status: 'active' });
    await Promise.all(active.map((run) => runs.cancel(run, 'project_cleanup').catch(() => { })));
}
//# sourceMappingURL=cancel-owned-runs.js.map