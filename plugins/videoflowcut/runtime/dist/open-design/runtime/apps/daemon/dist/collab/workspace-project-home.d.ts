/** A `workspace_projects` row, as far as this invariant is concerned. */
export interface WorkspaceProjectHomeRow {
    projectId: string;
    workspaceId: string;
    visibility?: string | null;
    createdByWorkspaceMemberId?: string | null;
    createdAt?: number | null;
}
/**
 * True for a row that records no act — `visibility: 'personal'` with no creator.
 *
 * This is exactly the shape the old `ensureWorkspaceProjection(project, ctx,
 * 'personal')` back-fill wrote, and nothing else writes it: project creation
 * stamps the creating member (`routes/project/index.ts`), a share stamps the
 * sharer, and a pull stamps the owner (`server.ts
 * persistWorkspaceProjectVisibility`). So the predicate cannot mistake a real
 * binding for a guess, which is what makes it safe to delete on.
 */
export declare function isBackfilledWorkspaceProjectRow(row: WorkspaceProjectHomeRow): boolean;
/**
 * Workspaces that provably host a team plane, inferred from the rows alone.
 *
 * A `visibility: 'team'` row can only exist in a team workspace — the share path
 * refuses one anywhere else (collab/team-share-scope.ts) and startup heals the
 * rows older builds wrote in violation. That makes "has ever hosted a share" a
 * table-local proxy for "is a team workspace", which is what lets the collapse
 * below run as a migration instead of waiting on the signed-in workspace
 * directory. Workspaces it has no evidence about are simply absent, and every
 * caller treats absence as "no opinion".
 */
export declare function teamWorkspaceIdsFromRows(rows: readonly WorkspaceProjectHomeRow[]): ReadonlySet<string>;
/** What one project collapses to. */
export interface WorkspaceProjectHomeDecision {
    projectId: string;
    /**
     * The workspace the project ends up in. Null means every candidate row was an
     * ownerless guess inside a team workspace, where no view would render it —
     * the project is left unbound on purpose and the next personal-workspace read
     * binds it. See {@link collapseWorkspaceProjectHomes}.
     */
    keptWorkspaceId: string | null;
    /** Rows to delete. */
    drop: WorkspaceProjectHomeRow[];
}
/**
 * Collapse every project's rows down to the one workspace it belongs to.
 *
 * The winner is the row with the strongest evidence ({@link rowEvidence}). Ties
 * break on, in order: whether the workspace is provably a TEAM workspace (an
 * ownerless personal row is suppressed there by
 * `workspaceProjectRowBelongsToCurrentWorkspace`, so promoting one would hide
 * the project in every view at once); how much real activity that workspace
 * holds; the oldest row, so the workspace the user reached first wins; and
 * finally the workspace id. That last step is genuinely arbitrary — the
 * back-fill copied one `project.createdAt` onto every row it wrote, so two
 * guesses in two personal workspaces really do carry identical evidence — but
 * it is deterministic, which is what stops two daemons from disagreeing.
 *
 * NO PROJECT CAN BE LOST HERE. This function only ever names rows to delete
 * from `workspace_projects`; it never touches `projects`, and the schema's
 * cascade runs the other way (deleting a project deletes its rows, never the
 * reverse). Every project that had a row keeps exactly one, with a single
 * deliberate exception: when EVERY candidate is an ownerless guess sitting in a
 * team workspace, all of them go and `keptWorkspaceId` is null. Keeping one
 * would be worse than keeping none — a suppressed row renders nowhere, while an
 * unbound project is still listed by `/api/projects`, still opens by id, and is
 * bound to the user's personal workspace by the next read. The migration cannot
 * make that binding itself: which workspace ids are personal is a signed-in
 * fact it cannot see, and the read path can.
 */
export declare function collapseWorkspaceProjectHomes(rows: readonly WorkspaceProjectHomeRow[]): WorkspaceProjectHomeDecision[];
