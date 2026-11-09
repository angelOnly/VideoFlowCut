import { jsonBodyByteLength } from '../../http/json-body-size.js';
import { SHARE_COMMENT_MAX_BYTES } from '@open-design/contracts';
import { projectKindFromMetadataToTrackingOrLegacyDefault } from '@open-design/contracts/analytics';
import { getProject, getWorkspaceProjectByProjectId, getProjectCommentReadState, isProjectCommentAnchorConversationId, markProjectCommentsRead, } from '../../db.js';
/** External authors cannot be claimed through a member-only editing endpoint. */
function hasExternalCommentAuthor(comment) {
    return comment.authorKind === 'user'
        || (typeof comment.authorAppUserId === 'string' && comment.authorAppUserId.trim().length > 0);
}
/** Independent read-only diagnostic. This is not the K8 outbox retry action. */
export function registerCommentAlignmentRoutes(app, deps) {
    app.post('/api/projects/:id/comments/align', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            const projectId = req.params.id;
            if (!getProject(deps.db, projectId))
                return res.status(404).json({ error: 'project not found' });
            const resolution = await deps.authorize(req, projectId);
            if (!resolution.ok)
                return res.status(resolution.status).json({ error: resolution.code });
            const context = resolution.context;
            const binding = getWorkspaceProjectByProjectId(deps.db, projectId);
            if (!context || !binding || binding.resourceState === 'deleted'
                || binding.workspaceId !== context.workspaceId
                || binding.createdByWorkspaceMemberId !== context.workspaceMemberId
                || context.memberStatus !== 'active' || context.lifecycleState !== 'active') {
                return res.status(403).json({ error: 'COMMENT_ALIGN_OWNER_REQUIRED' });
            }
            const result = await deps.alignment.check(projectId, context);
            const current = await deps.authorize(req, projectId);
            const currentBinding = getWorkspaceProjectByProjectId(deps.db, projectId);
            if (!current.ok || current.context?.workspaceId !== context.workspaceId
                || current.context.workspaceMemberId !== context.workspaceMemberId
                || current.context.memberStatus !== 'active' || current.context.lifecycleState !== 'active'
                || currentBinding?.workspaceId !== context.workspaceId || currentBinding.resourceState === 'deleted'
                || currentBinding.createdByWorkspaceMemberId !== context.workspaceMemberId) {
                return res.status(403).json({ error: 'COMMENT_ALIGN_AUTHORITY_CHANGED' });
            }
            return res.json(result);
        }
        catch {
            return res.json({ state: 'unknown', reason: 'unavailable' });
        }
    });
}
/** K8 supply only: null body means not determined, never default false.
 * POST retries existing scoped intents through the normal background drain.
 */
export function registerCommentSyncStateRoutes(app, deps) {
    for (const method of ['get', 'post']) {
        app[method]('/api/projects/:id/comment-sync-state', async (req, res) => {
            res.setHeader('Cache-Control', 'no-store');
            try {
                const projectId = req.params.id;
                if (!getProject(deps.db, projectId))
                    return res.status(404).json({ error: 'project not found' });
                const resolution = await deps.authorize(req, projectId);
                if (!resolution.ok)
                    return res.status(resolution.status).json({ error: resolution.code });
                const context = resolution.context;
                if (!context?.workspaceId || !context.workspaceMemberId)
                    return res.json(null);
                const requestedFile = req.query.filePath;
                if (requestedFile !== undefined && (typeof requestedFile !== 'string' || !requestedFile.trim())) {
                    return res.status(400).json({ error: 'COMMENT_SYNC_FILE_REQUIRED' });
                }
                const scope = { projectId, workspaceId: context.workspaceId, workspaceMemberId: context.workspaceMemberId,
                    ...(typeof requestedFile === 'string' ? { filePath: requestedFile } : {}) };
                return res.json(await deps.service[method === 'post' ? 'retry' : 'read'](scope));
            }
            catch {
                return res.status(503).json({ error: 'COMMENT_SYNC_STATE_UNAVAILABLE' });
            }
        });
    }
}
export function registerProjectCommentRoutes(app, ctx) {
    const { db } = ctx;
    const { updateProject, getWorkspaceProject, getWorkspaceProjectByProjectId } = ctx.projectStore;
    const { getConversation, listPreviewComments, listProjectPreviewComments, upsertPreviewComment, getPreviewComment, getProjectPreviewComment, updatePreviewCommentStatus, updatePreviewCommentAnchor, deletePreviewComment, reorderPreviewComment, } = ctx.conversations;
    const getRoutableConversation = (projectId, conversationId) => {
        if (isProjectCommentAnchorConversationId(conversationId))
            return null;
        const conversation = getConversation(db, conversationId);
        return conversation?.projectId === projectId ? conversation : null;
    };
    function commentsAreProjectScoped(projectId, context) {
        if (typeof getWorkspaceProjectByProjectId !== 'function')
            return false;
        const binding = getWorkspaceProjectByProjectId(db, projectId);
        if (!binding
            || binding.visibility !== 'team'
            || binding.resourceState === 'deleted') {
            return false;
        }
        if ((ctx.resolveReadWorkspaceContext || ctx.resolveWorkspaceContext) && !context) {
            return false;
        }
        // The null case preserves narrow local fixtures that deliberately omit
        // Workspace auth; production requires an exact context match.
        return !context || binding.workspaceId === context.workspaceId;
    }
    function getRequestPreviewComment(projectId, conversationId, commentId, context) {
        return (commentsAreProjectScoped(projectId, context)
            && typeof getProjectPreviewComment === 'function'
            ? getProjectPreviewComment(db, projectId, commentId)
            : getPreviewComment(db, projectId, conversationId, commentId, { includeProjectAnchor: true }));
    }
    /**
     * Workspace-identity gate for a comment mutation, borrowing the PARENT
     * PROJECT's binding (see `enforceWorkspaceProjectMutation` on
     * `RegisterProjectCommentRoutesDeps` above). Writes the 401/403 response
     * itself and returns false when denied — callers return immediately on
     * `false` without running their own author-identity logic. A no-op (always
     * allows) when the gate wasn't wired up, matching how an unbound project's
     * comments behaved before this fix existed either way.
     */
    async function enforceCommentWorkspaceMutation(req, res, projectId) {
        if (!ctx.enforceWorkspaceProjectMutation || !ctx.sendApiError)
            return true;
        return ctx.enforceWorkspaceProjectMutation(req, res, ctx.sendApiError, getWorkspaceProject, getWorkspaceProjectByProjectId, db, projectId, 
        // NOT `writeFiles`: a comment is not an artifact edit. Sharing a
        // project into the team grants every active member comment standing
        // (the read-only banner promises "view and comment"), so this gate
        // checks the wider `comment` capability; author-level rules
        // (`callerMayMutate` below) still restrict status/delete per comment.
        'comment');
    }
    async function resolveRequestWorkspaceContext(req, projectId) {
        if (!ctx.resolveWorkspaceContext)
            return { ok: true, context: null };
        try {
            return await ctx.resolveWorkspaceContext(req, projectId);
        }
        catch {
            return {
                ok: false,
                status: 503,
                code: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
                message: 'workspace membership authority is temporarily unavailable',
                retryable: true,
            };
        }
    }
    async function resolveReadRequestWorkspaceContext(req, projectId) {
        if (!ctx.resolveReadWorkspaceContext) {
            return resolveRequestWorkspaceContext(req, projectId);
        }
        try {
            return await ctx.resolveReadWorkspaceContext(req, projectId);
        }
        catch {
            return {
                ok: false,
                status: 503,
                code: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
                message: 'workspace membership authority is temporarily unavailable',
                retryable: true,
            };
        }
    }
    function sendWorkspaceResolutionError(res, resolution) {
        if (ctx.sendApiError) {
            ctx.sendApiError(res, resolution.status, resolution.code, resolution.message);
            return;
        }
        res.status(resolution.status).json({
            error: resolution.code,
            message: resolution.message,
            ...(resolution.retryable ? { retryable: true } : {}),
        });
    }
    function sendCommentPayloadTooLarge(res) {
        const message = `comment request exceeds ${SHARE_COMMENT_MAX_BYTES} bytes`;
        if (ctx.sendApiError) {
            ctx.sendApiError(res, 413, 'PAYLOAD_TOO_LARGE', message);
            return;
        }
        res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message } });
    }
    /** The caller's workspaceMemberId, or undefined off-team / personal mode. */
    async function resolveCaller(req, context) {
        if (ctx.resolveWorkspaceContext) {
            return context?.workspaceMemberId || undefined;
        }
        if (!ctx.resolveAuthorMemberId)
            return undefined;
        return ctx.resolveAuthorMemberId(req.headers.authorization);
    }
    function isLocalTeamRelayCandidate(projectId, filePath, context, callbackConfigured) {
        if (ctx.isCommentRelayEligible) {
            return callbackConfigured && ctx.isCommentRelayEligible(projectId, filePath, context);
        }
        if (!ctx.resolveWorkspaceContext)
            return callbackConfigured;
        if (!callbackConfigured
            || !context
            || context.workspaceType !== 'team'
            || context.memberStatus !== 'active'
            || context.lifecycleState === 'deleted')
            return false;
        const binding = getWorkspaceProjectByProjectId(db, projectId);
        return Boolean(binding
            && binding.workspaceId === context.workspaceId
            && binding.visibility === 'team'
            && binding.resourceState !== 'deleted');
    }
    function requireRelayEnqueued(result) {
        if (result === false) {
            throw new Error('failed to persist Team comment relay delivery');
        }
    }
    /**
     * Server-authoritative permission gate for status change + delete. Both are
     * allowed for the comment's author and the project owner (owner drives
     * send-to-agent and may delete any comment). Degrades open only when the
     * comment itself has no author (legacy/personal comments). Authored shared
     * comments fail closed if the current caller cannot be resolved.
     */
    async function callerMayMutate(req, projectId, comment, context) {
        const author = comment.authorMemberId;
        if (!author) {
            if (!ctx.isSharedProject)
                return true;
            let shared;
            try {
                shared = await ctx.isSharedProject(projectId, context);
            }
            catch {
                return false;
            }
            if (!shared)
                return true;
        }
        let me;
        try {
            me = await resolveCaller(req, context);
        }
        catch {
            return false;
        }
        if (!me)
            return false;
        if (author && me === author)
            return true;
        if (ctx.resolveProjectOwnerMemberId) {
            try {
                const owner = await ctx.resolveProjectOwnerMemberId(projectId, context);
                if (owner && owner === me)
                    return true;
            }
            catch {
                return false;
            }
        }
        return false;
    }
    // Read state is project-scoped by the frozen DTO. The workspace identity is
    // resolved by the existing request authority and is never taken from authorKey.
    const viewerScopeFor = (context) => {
        const workspaceId = context?.workspaceId?.trim();
        const memberId = context?.workspaceMemberId?.trim();
        return workspaceId && memberId ? `${workspaceId}:${memberId}` : 'local';
    };
    app.get('/api/projects/:id/comments/read', async (req, res) => {
        if (!getProject(db, req.params.id))
            return res.status(404).json({ error: 'project not found' });
        const resolution = await resolveReadRequestWorkspaceContext(req, req.params.id);
        if (!resolution.ok)
            return sendWorkspaceResolutionError(res, resolution);
        return res.json(getProjectCommentReadState(db, req.params.id, viewerScopeFor(resolution.context)));
    });
    app.put('/api/projects/:id/comments/read', async (req, res) => {
        if (!getProject(db, req.params.id))
            return res.status(404).json({ error: 'project not found' });
        const resolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!resolution.ok)
            return sendWorkspaceResolutionError(res, resolution);
        const body = req.body;
        if (!Number.isFinite(body?.readAt)) {
            return res.status(400).json({ error: 'readAt must be a finite number' });
        }
        // A future client clock must not hide comments that have not arrived yet.
        const readAt = Math.min(body.readAt, Date.now());
        return res.json(markProjectCommentsRead(db, req.params.id, viewerScopeFor(resolution.context), readAt));
    });
    // ---- Preview comments ----------------------------------------------------
    app.get('/api/projects/:id/conversations/:cid/comments', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        const workspaceResolution = await resolveReadRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        await ctx.onCommentsRead?.(req.params.id, workspaceResolution.context, () => ctx.resolveFreshWorkspaceContext
            ? ctx.resolveFreshWorkspaceContext(req, req.params.id)
            : resolveRequestWorkspaceContext(req, req.params.id));
        res.json({
            comments: commentsAreProjectScoped(req.params.id, workspaceResolution.context) && typeof listProjectPreviewComments === 'function'
                ? listProjectPreviewComments(db, req.params.id)
                : listPreviewComments(db, req.params.id, req.params.cid, { includeProjectAnchor: true }),
        });
    });
    app.post('/api/projects/:id/conversations/:cid/comments/pull', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        const projectId = req.params.id;
        const conversationId = req.params.cid;
        if (!getRoutableConversation(projectId, conversationId)) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        if (!ctx.pullCommentsNow)
            return res.status(503).json({ error: 'COMMENT_PULL_UNAVAILABLE' });
        try {
            const resolution = ctx.resolveFreshWorkspaceContext
                ? await ctx.resolveFreshWorkspaceContext(req, projectId)
                : await resolveRequestWorkspaceContext(req, projectId);
            if (!resolution.ok)
                return sendWorkspaceResolutionError(res, resolution);
            if (!resolution.context)
                return res.status(403).json({ error: 'COMMENT_PULL_CONTEXT_REQUIRED' });
            if (!await ctx.pullCommentsNow(projectId, resolution.context)) {
                return res.status(503).json({ error: 'COMMENT_PULL_UNAVAILABLE' });
            }
            const response = {
                pulled: true,
                comments: commentsAreProjectScoped(projectId, resolution.context)
                    && typeof listProjectPreviewComments === 'function'
                    ? listProjectPreviewComments(db, projectId)
                    : listPreviewComments(db, projectId, conversationId, { includeProjectAnchor: true }),
            };
            return res.json(response);
        }
        catch {
            return res.status(503).json({ error: 'COMMENT_PULL_UNAVAILABLE' });
        }
    });
    app.post('/api/projects/:id/conversations/:cid/comments', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        if (!await enforceCommentWorkspaceMutation(req, res, req.params.id))
            return;
        const workspaceResolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        const workspaceContext = workspaceResolution.context;
        try {
            // Server-authoritative author: stamp the current member id so the stored
            // (and pushed) comment carries who wrote it, rather than trusting the body.
            // New comments do not use a natural element key; editing requires an id
            // and is author-only.
            const body = { ...(req.body || {}) };
            // Author identity is server-stamped. Strip every client-supplied author
            // field before resolving the caller so an absent caller cannot inherit a
            // forged member or share-page user identity into SQLite.
            delete body.authorMemberId;
            delete body.authorKind;
            delete body.authorAppUserId;
            delete body.authorDisplayName;
            delete body.authorKey;
            delete body.sourceFileId;
            delete body.sourceFilePath;
            // This is a transport anti-abuse ceiling, not a product character limit.
            // Keep it server-side: CLI and UI must send the body unchanged and let the
            // route reject a pathological UTF-8 payload without creating a row.
            if (jsonBodyByteLength(req) > SHARE_COMMENT_MAX_BYTES) {
                return sendCommentPayloadTooLarge(res);
            }
            const authorMemberId = await resolveCaller(req, workspaceContext);
            const requestedId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : '';
            let existing = null;
            if (requestedId) {
                existing = getRequestPreviewComment(req.params.id, req.params.cid, requestedId, workspaceContext);
                if (!existing) {
                    return res.status(404).json({ error: 'comment not found' });
                }
                if (hasExternalCommentAuthor(existing)) {
                    return res.status(403).json({ error: 'not permitted' });
                }
                const existingAuthor = existing.authorMemberId ?? null;
                if (existingAuthor) {
                    if (!authorMemberId || existingAuthor !== authorMemberId) {
                        return res.status(403).json({ error: 'not permitted' });
                    }
                    body.authorMemberId = existingAuthor;
                }
                else if (authorMemberId) {
                    body.authorMemberId = authorMemberId;
                }
            }
            else if (authorMemberId) {
                body.authorMemberId = authorMemberId;
                const authorDisplayName = ctx.resolveCurrentAuthorDisplayName?.();
                if (authorDisplayName?.trim())
                    body.authorDisplayName = authorDisplayName.trim();
            }
            if (existing?.sourceFileId)
                body.sourceFileId = existing.sourceFileId;
            else if (!requestedId && ctx.prepareCommentFile) {
                const sourceFileId = await ctx.prepareCommentFile(req.params.id, body.target?.filePath ?? '', workspaceContext);
                if (sourceFileId)
                    body.sourceFileId = sourceFileId;
            }
            // Resolved BEFORE the upsert (not just before the push below) so a
            // genuinely new comment's pin_seq starts unconfirmed on a team-shared
            // project — see UpsertPreviewCommentOptions in db.ts. Ignored on the
            // edit branch, so computing it here for an edit-via-POST is harmless.
            const syncEnabled = isLocalTeamRelayCandidate(req.params.id, body.target?.filePath ?? existing?.filePath ?? '', workspaceContext, Boolean(ctx.onCommentCreated));
            const targetConversationId = requestedId
                ? existing?.conversationId ?? req.params.cid
                : req.params.cid;
            // Local row + durable relay intent commit atomically. Network delivery is
            // still asynchronous, so a Vela outage never delays this transaction.
            const comment = db.transaction(() => {
                const saved = upsertPreviewComment(db, req.params.id, targetConversationId, body, {
                    pinPendingCloudConfirm: syncEnabled,
                });
                updateProject(db, req.params.id, {});
                if (saved && syncEnabled) {
                    // SAFETY: the DB normalizer returns the PreviewComment fields consumed by the relay.
                    requireRelayEnqueued(ctx.onCommentCreated?.(saved, workspaceContext));
                }
                return saved;
            })();
            // Only a genuinely new, successfully persisted comment is counted.
            // Edits reuse this POST route with an id and must not inflate creation.
            if (comment && !requestedId) {
                const project = getProject(db, req.params.id);
                const localBinding = typeof getWorkspaceProjectByProjectId === 'function'
                    ? getWorkspaceProjectByProjectId(db, req.params.id)
                    : undefined;
                let ownerMemberId = localBinding?.createdByWorkspaceMemberId ?? null;
                if (!ownerMemberId && ctx.resolveProjectOwnerMemberId) {
                    ownerMemberId = await ctx.resolveProjectOwnerMemberId(req.params.id, workspaceContext).catch(() => null);
                }
                const targetProjectRelation = authorMemberId && ownerMemberId
                    ? authorMemberId === ownerMemberId
                        ? 'self'
                        : 'other'
                    : 'unknown';
                const planId = workspaceContext?.planId?.trim().toLowerCase();
                try {
                    void Promise.resolve(ctx.telemetry?.captureProductEvent?.(req, 'project_comment_create_result', {
                        page_name: 'artifact',
                        area: 'comments',
                        result: 'success',
                        target_project_relation: targetProjectRelation,
                        comment_level: 'top_level',
                        project_id: req.params.id,
                        comment_id: comment.id,
                        project_kind: projectKindFromMetadataToTrackingOrLegacyDefault(project?.metadata),
                        ...(workspaceContext
                            ? {
                                workspace_key: workspaceContext.workspaceId,
                                workspace_type: workspaceContext.workspaceType,
                                workspace_role: workspaceContext.role,
                                workspace_lifecycle: workspaceContext.lifecycleState,
                                billing_state: workspaceContext.billingState,
                                plan_bucket: !planId || planId === 'free' ? 'free' : 'paid',
                                provider_mode: workspaceContext.providerMode,
                                seat_state: workspaceContext.seatSummary.isSeatFull ? 'full' : 'available',
                                $groups: { workspace: workspaceContext.workspaceId },
                            }
                            : {}),
                    })).catch(() => { });
                }
                catch {
                    // Measurement cannot change the successful save or response.
                }
            }
            res.json({ comment });
        }
        catch (err) {
            res.status(400).json({ error: String(err?.message || err) });
        }
    });
    app.patch('/api/projects/:id/conversations/:cid/comments/:commentId', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        if (!await enforceCommentWorkspaceMutation(req, res, req.params.id))
            return;
        const workspaceResolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        const workspaceContext = workspaceResolution.context;
        try {
            const existing = getRequestPreviewComment(req.params.id, req.params.cid, req.params.commentId, workspaceContext);
            if (!existing)
                return res.status(404).json({ error: 'comment not found' });
            // Status change is the send-to-agent lifecycle: allowed for the author
            // and the project owner, blocked for other members.
            if (!(await callerMayMutate(req, req.params.id, existing, workspaceContext))) {
                return res.status(403).json({ error: 'not permitted' });
            }
            const syncEnabled = isLocalTeamRelayCandidate(req.params.id, existing.filePath, workspaceContext, Boolean(ctx.onCommentUpdated));
            const comment = db.transaction(() => {
                const saved = updatePreviewCommentStatus(db, req.params.id, existing.conversationId, req.params.commentId, req.body?.status);
                if (!saved)
                    return null;
                // SAFETY: updatePreviewCommentStatus returns the normalized DB comment; its fields are the PreviewComment wire snapshot consumed by the relay.
                const mutationSnapshot = saved;
                if (ctx.onPublishedCommentMutation && ctx.onPublishedCommentMutation(mutationSnapshot, workspaceContext, false) === false)
                    throw new Error('failed to persist published comment mutation');
                updateProject(db, req.params.id, {});
                if (syncEnabled) {
                    // SAFETY: the DB normalizer returns the PreviewComment fields consumed by the relay.
                    requireRelayEnqueued(ctx.onCommentUpdated?.(saved, workspaceContext));
                }
                return saved;
            })();
            if (!comment)
                return res.status(404).json({ error: 'comment not found' });
            res.json({ comment });
        }
        catch (err) {
            res.status(400).json({ error: String(err?.message || err) });
        }
    });
    app.patch('/api/projects/:id/conversations/:cid/comments/:commentId/anchor', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        const workspaceResolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        const workspaceContext = workspaceResolution.context;
        try {
            // Drift-ladder write-back: the client resolves anchor state each render
            // and reports it here. This is a per-daemon DERIVED read-back (each
            // daemon anchors against its own content), not a user edit or a synced
            // field — so it is neither permission-gated nor pushed to the relay, and
            // it does not bump updated_at.
            const existing = getRequestPreviewComment(req.params.id, req.params.cid, req.params.commentId, workspaceContext);
            if (!existing)
                return res.status(404).json({ error: 'comment not found' });
            const comment = updatePreviewCommentAnchor(db, req.params.id, existing.conversationId, req.params.commentId, req.body || {});
            if (!comment)
                return res.status(404).json({ error: 'comment not found' });
            res.json({ comment });
        }
        catch (err) {
            res.status(400).json({ error: String(err?.message || err) });
        }
    });
    app.patch('/api/projects/:id/conversations/:cid/comments/:commentId/reorder', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        const workspaceResolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        const workspaceContext = workspaceResolution.context;
        const sortKey = Number(req.body?.sortKey);
        if (!Number.isFinite(sortKey)) {
            return res.status(400).json({ error: 'sortKey must be a finite number' });
        }
        try {
            // Sidebar display order is a per-daemon viewing preference, not a
            // content edit: unlike status change/delete, it is not gated on
            // authorship (any member may reorder their OWN view of a shared
            // project's comments), does not bump updated_at, and is never pushed
            // to the collab-cloud relay — see PreviewComment.sortKey.
            const existing = getRequestPreviewComment(req.params.id, req.params.cid, req.params.commentId, workspaceContext);
            if (!existing)
                return res.status(404).json({ error: 'comment not found' });
            const comment = reorderPreviewComment(db, req.params.id, existing.conversationId, req.params.commentId, sortKey);
            if (!comment)
                return res.status(404).json({ error: 'comment not found' });
            res.json({ comment });
        }
        catch (err) {
            res.status(400).json({ error: String(err?.message || err) });
        }
    });
    app.delete('/api/projects/:id/conversations/:cid/comments/:commentId', async (req, res) => {
        const conv = getRoutableConversation(req.params.id, req.params.cid);
        if (!conv) {
            return res.status(404).json({ error: 'conversation not found' });
        }
        if (!await enforceCommentWorkspaceMutation(req, res, req.params.id))
            return;
        const workspaceResolution = await resolveRequestWorkspaceContext(req, req.params.id);
        if (!workspaceResolution.ok) {
            return sendWorkspaceResolutionError(res, workspaceResolution);
        }
        const workspaceContext = workspaceResolution.context;
        // Load before deleting so we can gate on the author and build the tombstone.
        const existing = getRequestPreviewComment(req.params.id, req.params.cid, req.params.commentId, workspaceContext);
        if (!existing)
            return res.status(404).json({ error: 'comment not found' });
        // Delete is allowed for the comment's author and the project owner.
        if (!(await callerMayMutate(req, req.params.id, existing, workspaceContext))) {
            return res.status(403).json({ error: 'not permitted' });
        }
        const syncEnabled = isLocalTeamRelayCandidate(req.params.id, existing.filePath, workspaceContext, Boolean(ctx.onCommentDeleted));
        let ok = false;
        try {
            ok = db.transaction(() => {
                const deleted = deletePreviewComment(db, req.params.id, existing.conversationId, req.params.commentId);
                if (!deleted)
                    return false;
                if (ctx.onPublishedCommentMutation && ctx.onPublishedCommentMutation(existing, workspaceContext, true) === false)
                    throw new Error('failed to persist published comment mutation');
                updateProject(db, req.params.id, {});
                if (syncEnabled) {
                    requireRelayEnqueued(ctx.onCommentDeleted?.(existing, workspaceContext));
                }
                return true;
            })();
        }
        catch (err) {
            return res.status(400).json({ error: String(err?.message || err) });
        }
        if (!ok)
            return res.status(404).json({ error: 'comment not found' });
        res.json({ ok: true });
    });
}
//# sourceMappingURL=comments.js.map