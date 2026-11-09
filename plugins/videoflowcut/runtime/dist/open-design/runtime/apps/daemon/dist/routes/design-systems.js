import fsp from 'node:fs/promises';
import path from 'node:path';
import { workspaceTeamDesignSystemBindingResourceId } from '../design-systems/workspace-team-binding.js';
import { teamResourceWorkspaceRoot } from '../collab/team-resource-materialization.js';
import { deleteWorkspaceResourceByResourceId } from '../db.js';
import { enforceVerifiedWorkspaceResourceMutation, enforceVerifiedWorkspaceResourceRead, headerValue, requestWithWorkspaceNavigationScope, resolveOptionalLocalWorkspaceRequestAuthority, } from '../collab/workspace-resource-mutation.js';
const PACKAGED_SHOWCASE_PATH = 'system/kit.html';
;
// Strip a brand title down to a safe download filename stem (no path
// separators, control chars, or trailing dashes; capped so the OS accepts it).
function sanitizeArchiveFilename(raw) {
    return String(raw ?? '')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
export function registerDesignSystemRoutes(app, ctx) {
    const { db } = ctx;
    const { CRAFT_DIR, USER_DESIGN_SYSTEMS_DIR } = ctx.paths;
    const { buildUserDesignSystemArchive, canMutateUserDesignSystem, createUserDesignSystem, deleteUserDesignSystem, ensureUserDesignSystemWorkspaceProject, listAllDesignSystems, listUserDesignSystemFiles, listUserDesignSystemRevisions, prepareDesignTokenContractRebuild, readAvailableDesignSystem, readAvailableDesignSystemPackageInfo, readAvailableDesignSystemStaticFile, readDesignSystemWorkspaceTextFile, readUserDesignSystemFile, renderDesignSystemPreview, renderDesignSystemShowcase, syncUserDesignSystemAssetsFromWorkspace, unshareTeamDesignSystemIfShared, updateUserDesignSystem, updateUserDesignSystemRevisionStatus, } = ctx.designSystems;
    const designSystemGenerationJobs = ctx.generationJobs;
    const generationJobScopes = new Map();
    const getBoundDesignSystem = (dbHandle, workspaceId, resourceId) => ctx.workspaceResources.getWorkspaceResource(dbHandle, 'design_system', workspaceId, resourceId);
    const getDesignSystemBinding = (dbHandle, resourceId) => ctx.workspaceResources.getWorkspaceResourceByResourceId(dbHandle, 'design_system', resourceId);
    function resolveDesignSystemStorage(req, id, allowNavigationQuery = false) {
        const workspaceId = (headerValue(req, 'x-od-workspace-id')
            ?? (allowNavigationQuery
                ? designSystemNavigationWorkspaceQuery(req)?.workspaceId
                : null)
            ?? '').trim();
        if (!workspaceId) {
            return { root: USER_DESIGN_SYSTEMS_DIR, bindingResourceId: id, exactTeam: false };
        }
        const teamBindingResourceId = workspaceTeamDesignSystemBindingResourceId(workspaceId, id);
        const teamBinding = getBoundDesignSystem(db, workspaceId, teamBindingResourceId);
        return teamBinding?.visibility === 'team'
            ? {
                root: teamResourceWorkspaceRoot(USER_DESIGN_SYSTEMS_DIR, workspaceId),
                bindingResourceId: teamBindingResourceId,
                exactTeam: true,
            }
            : { root: USER_DESIGN_SYSTEMS_DIR, bindingResourceId: id, exactTeam: false };
    }
    async function authorizeDesignSystemRead(req, res, id, allowNavigationQuery = false) {
        const scopedRequest = allowNavigationQuery
            ? requestWithWorkspaceNavigationScope(req)
            : req;
        if (scopedRequest === 'conflict') {
            res.status(400).json({
                error: 'WORKSPACE_CONTEXT_CONFLICT',
                message: 'workspace header and navigation scope must match',
            });
            return false;
        }
        const resolution = resolveOptionalLocalWorkspaceRequestAuthority(scopedRequest);
        if (!resolution.ok) {
            res.status(resolution.status).json({
                error: resolution.code,
                message: resolution.message,
                ...(resolution.retryable ? { retryable: true } : {}),
            });
            return false;
        }
        let bindingResourceId = id;
        let binding = getDesignSystemBinding(db, id);
        if (resolution.context) {
            const teamBindingResourceId = workspaceTeamDesignSystemBindingResourceId(resolution.context.workspaceId, id);
            const teamBinding = getBoundDesignSystem(db, resolution.context.workspaceId, teamBindingResourceId);
            const personalBinding = getBoundDesignSystem(db, resolution.context.workspaceId, id);
            if (teamBinding?.visibility === 'team') {
                bindingResourceId = teamBindingResourceId;
                binding = teamBinding;
            }
            else {
                binding = personalBinding;
            }
        }
        const isPublicBuiltIn = resolution.context && !binding
            ? (await listAllDesignSystems({
                workspaceId: resolution.context.workspaceId,
            })).some((system) => system.id === id && system.source === 'built-in')
            : false;
        // Explicit Workspace requests never inherit ownerless legacy resources.
        // A Personal design system is private to its exact persisted creator even
        // when the caller is an owner/admin in the same Workspace. Team resources
        // remain readable by every verified active member through the shared gate.
        if (resolution.context && ((!binding && !isPublicBuiltIn)
            || (binding
                && binding.visibility !== 'team'
                && binding.createdByWorkspaceMemberId !== resolution.context.workspaceMemberId))) {
            res.status(403).json({
                error: 'WORKSPACE_DESIGN_SYSTEM_PERMISSION_DENIED',
                message: 'workspace design_system read is not allowed',
            });
            return false;
        }
        if (binding && !resolution.context) {
            res.status(400).json({
                error: 'WORKSPACE_CONTEXT_REQUIRED',
                message: 'an explicit workspace context is required',
            });
            return false;
        }
        return enforceVerifiedWorkspaceResourceRead('design_system', req, res, (_res, status, code, message, details) => res.status(status).json({ error: code, message, ...details }), getBoundDesignSystem, getDesignSystemBinding, db, bindingResourceId, resolution.context
            ? async () => ({ ok: true, context: resolution.context })
            : ctx.verifyWorkspaceRequestAuthority, { allowNavigationQuery });
    }
    async function authorizeDesignSystemMutation(req, res, id) {
        const resolution = resolveOptionalLocalWorkspaceRequestAuthority(req);
        if (!resolution.ok) {
            res.status(resolution.status).json({
                error: resolution.code,
                message: resolution.message,
                ...(resolution.retryable ? { retryable: true } : {}),
            });
            return false;
        }
        let bindingResourceId = id;
        let binding = getDesignSystemBinding(db, id);
        if (resolution.context) {
            const teamBindingResourceId = workspaceTeamDesignSystemBindingResourceId(resolution.context.workspaceId, id);
            const teamBinding = getBoundDesignSystem(db, resolution.context.workspaceId, teamBindingResourceId);
            const personalBinding = getBoundDesignSystem(db, resolution.context.workspaceId, id);
            if (teamBinding?.visibility === 'team') {
                bindingResourceId = teamBindingResourceId;
                binding = teamBinding;
            }
            else {
                binding = personalBinding;
            }
        }
        if (resolution.context && (!binding
            || (binding.visibility !== 'team'
                && binding.createdByWorkspaceMemberId !== resolution.context.workspaceMemberId))) {
            res.status(403).json({
                error: 'WORKSPACE_DESIGN_SYSTEM_PERMISSION_DENIED',
                message: 'workspace design_system mutation is not allowed',
            });
            return false;
        }
        if (binding && !resolution.context) {
            res.status(400).json({
                error: 'WORKSPACE_CONTEXT_REQUIRED',
                message: 'an explicit workspace context is required',
            });
            return false;
        }
        return enforceVerifiedWorkspaceResourceMutation('design_system', req, res, (_res, status, code, message) => res.status(status).json({ error: code, message }), getBoundDesignSystem, getDesignSystemBinding, db, bindingResourceId, 'writeFiles', resolution.context
            ? async () => ({ ok: true, context: resolution.context })
            : ctx.verifyWorkspaceRequestAuthority);
    }
    async function resolveGenerationJobScope(req, res) {
        const resolution = resolveOptionalLocalWorkspaceRequestAuthority(req);
        if (!resolution.ok) {
            res.status(resolution.status).json({
                error: resolution.code,
                message: resolution.message,
                ...(resolution.retryable ? { retryable: true } : {}),
            });
            return 'denied';
        }
        return resolution.context
            ? {
                workspaceId: resolution.context.workspaceId,
                workspaceMemberId: resolution.context.workspaceMemberId,
            }
            : null;
    }
    async function authorizeGenerationJobRead(req, res, job) {
        const scope = generationJobScopes.get(job.id);
        if (scope) {
            const resolution = await resolveGenerationJobScope(req, res);
            if (resolution === 'denied')
                return false;
            if (!resolution
                || resolution.workspaceId !== scope.workspaceId
                || resolution.workspaceMemberId !== scope.workspaceMemberId) {
                res.status(403).json({ error: 'WORKSPACE_DESIGN_SYSTEM_PERMISSION_DENIED' });
                return false;
            }
            return true;
        }
        return job.designSystemId
            ? authorizeDesignSystemRead(req, res, job.designSystemId)
            : true;
    }
    function sendWorkspaceScopeError(res, error) {
        if (!error ||
            typeof error !== 'object' ||
            !('status' in error) ||
            (error.status !== 400 && error.status !== 403 && error.status !== 503) ||
            !('code' in error) ||
            typeof error.code !== 'string') {
            return false;
        }
        res.status(error.status).json({
            error: error.code,
            message: error instanceof Error ? error.message : String(error.code),
            ...('retryable' in error && error.retryable === true ? { retryable: true } : {}),
        });
        return true;
    }
    app.post('/api/design-systems', async (req, res) => {
        try {
            const created = await createUserDesignSystem(USER_DESIGN_SYSTEMS_DIR, req.body || {}, req);
            res.status(201).json({ ...created, designSystem: created });
        }
        catch (err) {
            if (sendWorkspaceScopeError(res, err))
                return;
            res.status(400).json({ error: String(err) });
        }
    });
    app.post('/api/design-systems/generation-jobs', async (req, res) => {
        try {
            const scope = await resolveGenerationJobScope(req, res);
            if (scope === 'denied')
                return;
            const job = designSystemGenerationJobs.start(req.body || {}, (root, input) => createUserDesignSystem(root, input, req));
            generationJobScopes.set(job.id, scope);
            res.status(202).json({ job });
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/generation-jobs/:jobId', async (req, res) => {
        try {
            const job = designSystemGenerationJobs.get(req.params.jobId);
            if (!job) {
                return res.status(404).json({ error: 'design system generation job not found' });
            }
            if (!(await authorizeGenerationJobRead(req, res, job)))
                return;
            res.json({ job });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.post('/api/design-systems/:id/revision-jobs', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            const scope = await resolveGenerationJobScope(req, res);
            if (scope === 'denied')
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const feedback = typeof req.body?.feedback === 'string' ? req.body.feedback : '';
            if (!feedback.trim())
                return res.status(400).json({ error: 'feedback is required' });
            const job = designSystemGenerationJobs.revise({
                root: storage.root,
                designSystemId: req.params.id,
                feedback,
                sectionTitle: typeof req.body?.sectionTitle === 'string' ? req.body.sectionTitle : undefined,
                body: typeof req.body?.body === 'string' ? req.body.body : undefined,
            });
            generationJobScopes.set(job.id, scope);
            res.status(202).json({ job });
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    app.post('/api/design-systems/:id/token-contract/rebuild-jobs', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            const scope = await resolveGenerationJobScope(req, res);
            if (scope === 'denied')
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const preparation = await prepareDesignTokenContractRebuild(storage.root, req.params.id, { force: req.body?.force === true });
            if (!preparation.decision.available) {
                return res.status(200).json({ decision: preparation.decision });
            }
            if (!preparation.revision) {
                return res.status(200).json({ decision: preparation.decision });
            }
            const job = designSystemGenerationJobs.rebuildTokenContract({
                root: storage.root,
                designSystemId: req.params.id,
                decision: preparation.decision,
                ...preparation.revision,
            });
            generationJobScopes.set(job.id, scope);
            res.status(202).json({ decision: preparation.decision, job });
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/:id/revisions', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const revisions = await listUserDesignSystemRevisions(storage.root, req.params.id);
            if (!revisions) {
                return res.status(404).json({ error: 'editable design system not found' });
            }
            res.json({ revisions });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.patch('/api/design-systems/:id/revisions/:revisionId', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            // recvqb6mfyqXLD: accepting a revision commits its proposed body onto
            // the canonical design system — the same "edit" this route family
            // gates everywhere else (PATCH/DELETE/sync-assets above). Without this,
            // a plain member viewing a teammate's team-synced design system could
            // accept/reject its pending revision (surfaced to anyone who can read
            // the system, not just the owner) with no server-side check at all,
            // even after the UI stopped showing it as editable.
            const storage = resolveDesignSystemStorage(req, req.params.id);
            if (!(await canMutateUserDesignSystem(storage.root, req.params.id, req))) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_MANAGE_DENIED' });
            }
            const status = typeof req.body?.status === 'string' ? req.body.status : '';
            if (status !== 'accepted' && status !== 'rejected') {
                return res.status(400).json({ error: 'status must be accepted or rejected' });
            }
            const revision = await updateUserDesignSystemRevisionStatus(storage.root, req.params.id, req.params.revisionId, status);
            if (!revision) {
                return res.status(404).json({ error: 'design system revision not found' });
            }
            res.json({ revision });
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/:id', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id)))
                return;
            const workspaceId = headerValue(req, 'x-od-workspace-id');
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id');
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const systems = await listAllDesignSystems({
                workspaceId,
                workspaceMemberId,
                exactTeam: storage.exactTeam,
            });
            const summary = systems.find((s) => s.id === req.params.id);
            const projectBody = await readDesignSystemWorkspaceTextFile(db, summary, 'DESIGN.md');
            const body = projectBody ?? await readAvailableDesignSystem(req.params.id, {
                workspaceId,
                workspaceMemberId,
                exactTeam: storage.exactTeam,
            });
            if (body === null || !summary) {
                return res.status(404).json({ error: 'design system not found' });
            }
            const packageInfo = await readAvailableDesignSystemPackageInfo(req.params.id, {
                workspaceId,
                workspaceMemberId,
                exactTeam: storage.exactTeam,
            });
            // recvqb6mfyqXLD: mirror the exact PATCH/DELETE verdict onto the read
            // path too. `DesignSystemsTab` already re-derives an equivalent verdict
            // from the separate `/team` share listing for its own list+detail pane,
            // but a design system reached any other way — e.g. the direct
            // `/design-systems/:id` route the Library's "Open design system" link
            // and `LibrarySection` navigate to, which renders `DesignSystemFlow`
            // directly — had no ownership signal at all and fell back to treating
            // any non-built-in system as fully editable. Computing it once here,
            // from the same `canMutateUserDesignSystem` the mutation routes below
            // already gate on, means every detail surface can hide/disable its
            // Publish toggle and Save button on the same authority the backend
            // enforces, instead of each surface re-deriving (or forgetting to
            // derive) its own verdict.
            const canMutate = await canMutateUserDesignSystem(storage.root, req.params.id, req);
            const detail = { ...summary, body, canMutate, ...(packageInfo ? { packageInfo } : {}) };
            res.json({ ...detail, designSystem: detail });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/:id/preview', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id, true)))
                return;
            const workspaceId = headerValue(req, 'x-od-workspace-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceId
                ?? null;
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceMemberId
                ?? null;
            const storage = resolveDesignSystemStorage(req, req.params.id, true);
            const body = await readAvailableDesignSystem(req.params.id, {
                workspaceId,
                workspaceMemberId,
                exactTeam: storage.exactTeam,
            });
            if (body === null)
                return res.status(404).type('text/plain').send('not found');
            const html = renderDesignSystemPreview(req.params.id, body);
            res.type('text/html').send(html);
        }
        catch (err) {
            res.status(500).type('text/plain').send(String(err));
        }
    });
    app.get('/api/design-systems/:id/showcase', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id, true)))
                return;
            const workspaceId = headerValue(req, 'x-od-workspace-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceId
                ?? null;
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceMemberId
                ?? null;
            const storage = resolveDesignSystemStorage(req, req.params.id, true);
            const packaged = await readAvailableDesignSystemStaticFile(req.params.id, PACKAGED_SHOWCASE_PATH, { workspaceId, workspaceMemberId, exactTeam: storage.exactTeam });
            if (packaged?.contentType.startsWith('text/html')) {
                const workspaceQuery = designSystemNavigationWorkspaceQuery(req);
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Last-Modified', packaged.updatedAt);
                return res.type('text/html').send(rewriteDesignSystemShowcaseAssetUrls(packaged.bytes.toString('utf8'), req.params.id, path.posix.dirname(PACKAGED_SHOWCASE_PATH), workspaceQuery));
            }
            const body = await readAvailableDesignSystem(req.params.id, {
                workspaceId,
                workspaceMemberId,
                exactTeam: storage.exactTeam,
            });
            if (body === null)
                return res.status(404).type('text/plain').send('not found');
            const html = renderDesignSystemShowcase(req.params.id, body);
            res.type('text/html').send(html);
        }
        catch (err) {
            res.status(500).type('text/plain').send(String(err));
        }
    });
    app.get('/api/design-systems/:id/static', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id, true)))
                return;
            const workspaceId = headerValue(req, 'x-od-workspace-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceId
                ?? null;
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id')
                ?? designSystemNavigationWorkspaceQuery(req)?.workspaceMemberId
                ?? null;
            const storage = resolveDesignSystemStorage(req, req.params.id, true);
            const requestedPath = typeof req.query.path === 'string' ? req.query.path : '';
            const file = await readAvailableDesignSystemStaticFile(req.params.id, requestedPath, { workspaceId, workspaceMemberId, exactTeam: storage.exactTeam });
            if (!file)
                return res.status(404).type('text/plain').send('not found');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Last-Modified', file.updatedAt);
            res.type(file.contentType).send(file.bytes);
        }
        catch (err) {
            res.status(500).type('text/plain').send(String(err));
        }
    });
    app.post('/api/design-systems/:id/workspace', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            const workspaceId = headerValue(req, 'x-od-workspace-id');
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id');
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const workspace = await ensureUserDesignSystemWorkspaceProject(db, req.params.id, workspaceId || workspaceMemberId
                ? { workspaceId, workspaceMemberId, exactTeam: storage.exactTeam }
                : undefined);
            if (!workspace) {
                return res.status(404).json({ error: 'editable design system not found' });
            }
            res.status(201).json(workspace);
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/:id/files', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            const files = await listUserDesignSystemFiles(storage.root, req.params.id);
            if (!files) {
                return res.status(404).json({ error: 'editable design system not found' });
            }
            res.json({ files });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.get('/api/design-systems/:id/file', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id, true)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id, true);
            const requestedPath = typeof req.query.path === 'string' ? req.query.path : '';
            const file = await readUserDesignSystemFile(storage.root, req.params.id, requestedPath);
            if (!file)
                return res.status(404).json({ error: 'design system file not found' });
            res.json({ file });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    // Streams a .zip of the whole user design system directory plus a generated
    // SKILLS.md usage guide, so the "Download brand" action (and `od
    // design-systems download`) hand the recipient a self-contained, shareable
    // brand package. Only user systems have an editable dir; presets resolve to
    // null and surface as 404.
    app.get('/api/design-systems/:id/archive', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemRead(req, res, req.params.id, true)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id, true);
            const archive = await buildUserDesignSystemArchive(storage.root, req.params.id);
            if (!archive) {
                return res.status(404).json({ error: 'downloadable design system not found' });
            }
            const fileSlug = sanitizeArchiveFilename(archive.baseName) || 'design-system';
            const filename = `${fileSlug}.zip`;
            // RFC 5987: ASCII `filename=` fallback plus UTF-8 `filename*=` so brand
            // names with non-ASCII characters (CJK, accents) download without mojibake.
            const asciiFallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '_') || 'design-system.zip';
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
            res.send(archive.buffer);
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.patch('/api/design-systems/:id', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            if (!(await canMutateUserDesignSystem(storage.root, req.params.id, req))) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_MANAGE_DENIED' });
            }
            const updated = await updateUserDesignSystem(storage.root, req.params.id, req.body || {});
            if (!updated) {
                return res.status(404).json({ error: 'editable design system not found' });
            }
            res.json({ ...updated, designSystem: updated });
        }
        catch (err) {
            res.status(400).json({ error: String(err) });
        }
    });
    // Asset sync (spec 04 §9.3, recvqb1t4FrckM): a signal-only endpoint — the
    // browser never uploads file bytes here. The daemon locates the design
    // system's workspace project itself (same lookup
    // `ensureUserDesignSystemWorkspaceProject` uses) and copies real files
    // under that project's `assets/` directory into the canonical design
    // system directory, entirely on the daemon side of the data-directory
    // boundary. Gated the same way as PATCH/DELETE: a locked workspace or a
    // caller who cannot manage the (possibly team-synced) design system may
    // not trigger a write to canonical.
    app.post('/api/design-systems/:id/sync-assets', async (req, res) => {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, req.params.id)))
                return;
            const storage = resolveDesignSystemStorage(req, req.params.id);
            if (!(await canMutateUserDesignSystem(storage.root, req.params.id, req))) {
                return res.status(403).json({ error: 'WORKSPACE_RESOURCE_MANAGE_DENIED' });
            }
            const workspaceId = headerValue(req, 'x-od-workspace-id');
            const workspaceMemberId = headerValue(req, 'x-od-workspace-member-id');
            const outcome = await syncUserDesignSystemAssetsFromWorkspace(db, req.params.id, workspaceId || workspaceMemberId
                ? { workspaceId, workspaceMemberId, exactTeam: storage.exactTeam }
                : undefined);
            if (!outcome.ok) {
                if (outcome.reason === 'not-found') {
                    return res.status(404).json({ error: 'editable design system not found' });
                }
                // No workspace project to sync from yet — a benign no-op, not an
                // error; the trigger sites call this speculatively on every asset
                // write and run-end.
                return res.json({ synced: [] });
            }
            res.json({ synced: outcome.synced });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    async function deleteDesignSystemForRequest(req, res, id, options = {}) {
        try {
            if (!(await authorizeDesignSystemMutation(req, res, id)))
                return false;
            const storage = resolveDesignSystemStorage(req, id);
            if (!(await canMutateUserDesignSystem(storage.root, id, req))) {
                res.status(403).json({ error: 'WORKSPACE_RESOURCE_MANAGE_DENIED' });
                return false;
            }
            if (options.beforeDelete && !(await options.beforeDelete()))
                return false;
            // spec 04 §11: drop the hub-side share BEFORE the local delete, so a
            // sharer deleting their OWN design system does not leave the hub index
            // pointing at a canonical directory that is about to stop existing —
            // otherwise `syncSharedTeamDesignSystem` (server.ts) keeps re-stamping
            // `markTeamSynced()` onto every teammate's already-synced local copy
            // forever, because the hub still reports the resource as shared. A
            // thrown error here (e.g. the caller cannot actually manage the share)
            // aborts before `deleteUserDesignSystem` runs, matching "unshare must
            // succeed before the local delete proceeds".
            await unshareTeamDesignSystemIfShared(id, req);
            const ok = await deleteUserDesignSystem(storage.root, id);
            if (!ok) {
                res.status(404).json({ error: 'editable design system not found' });
                return false;
            }
            // Envelope cleanup (spec 9.2): drop the `workspace_resources` binding
            // row too, mirroring skill's DELETE route (routes/static-resource.ts)
            // and plugin uninstall (plugins/installer.ts) — the generic table has
            // no ON DELETE CASCADE, so skipping this leaves an orphan row pointing
            // at a design system that no longer exists on disk.
            deleteWorkspaceResourceByResourceId(db, 'design_system', storage.bindingResourceId);
            return true;
        }
        catch (err) {
            if (sendWorkspaceScopeError(res, err))
                return false;
            res.status(500).json({ error: String(err) });
            return false;
        }
    }
    app.delete('/api/design-systems/:id', async (req, res) => {
        if (!(await deleteDesignSystemForRequest(req, res, req.params.id)))
            return;
        res.status(204).end();
    });
    app.get('/api/craft', async (_req, res) => {
        try {
            let entries;
            try {
                entries = await fsp.readdir(CRAFT_DIR, { withFileTypes: true });
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return res.json({ craft: [] });
                }
                throw err;
            }
            const out = [];
            for (const entry of entries) {
                if (!entry.isFile() || !entry.name.endsWith('.md'))
                    continue;
                const slug = entry.name.replace(/\.md$/, '');
                try {
                    const fullPath = `${CRAFT_DIR}/${entry.name}`;
                    const text = await fsp.readFile(fullPath, 'utf8');
                    const heading = text.split('\n').find((line) => line.startsWith('# '));
                    out.push({
                        id: slug,
                        label: heading ? heading.replace(/^#+\s*/, '').trim() : slug,
                        bytes: Buffer.byteLength(text, 'utf8'),
                    });
                }
                catch {
                    // Skip unreadable files; surface what we can.
                }
            }
            res.json({ craft: out });
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    app.get('/api/craft/:id', async (req, res) => {
        try {
            const slug = req.params.id;
            if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
                return res.status(400).json({ error: 'invalid craft id' });
            }
            try {
                const text = await fsp.readFile(`${CRAFT_DIR}/${slug}.md`, 'utf8');
                res.json({ id: slug, body: text });
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return res.status(404).json({ error: 'craft section not found' });
                }
                throw err;
            }
        }
        catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });
    return { authorizeDesignSystemRead, deleteDesignSystemForRequest };
}
export function rewriteDesignSystemShowcaseAssetUrls(html, designSystemId, baseDir, workspaceQuery) {
    if (!html)
        return html;
    return html
        .replace(/\b(src|href)=(["'])([^"']+)\2/gi, (match, attr, quote, raw) => {
        const rewritten = rewriteDesignSystemShowcaseAssetUrl(raw, designSystemId, baseDir, workspaceQuery);
        return rewritten === raw ? match : `${attr}=${quote}${rewritten}${quote}`;
    })
        .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, raw) => {
        const rewritten = rewriteDesignSystemShowcaseAssetUrl(raw, designSystemId, baseDir, workspaceQuery);
        return rewritten === raw ? match : `url(${quote}${rewritten}${quote})`;
    });
}
function rewriteDesignSystemShowcaseAssetUrl(rawUrl, designSystemId, baseDir, workspaceQuery) {
    const value = rawUrl.trim();
    if (value.length === 0
        || value.startsWith('#')
        || value.startsWith('/')
        || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
        return rawUrl;
    }
    const match = /^([^?#]+)([?#].*)?$/.exec(value);
    if (!match)
        return rawUrl;
    const [, rawPath, suffix = ''] = match;
    if (!rawPath)
        return rawUrl;
    const relativePath = path.posix.normalize(path.posix.join(baseDir, rawPath));
    if (relativePath === '.'
        || relativePath.startsWith('../')
        || path.posix.isAbsolute(relativePath)) {
        return rawUrl;
    }
    const staticUrl = `/api/design-systems/${encodeURIComponent(designSystemId)}/static`
        + `?path=${encodeURIComponent(relativePath)}`
        + (workspaceQuery
            ? `&workspaceId=${encodeURIComponent(workspaceQuery.workspaceId)}`
                + `&workspaceMemberId=${encodeURIComponent(workspaceQuery.workspaceMemberId)}`
            : '');
    if (suffix.startsWith('?'))
        return `${staticUrl}&${suffix.slice(1)}`;
    return `${staticUrl}${suffix}`;
}
function designSystemNavigationWorkspaceQuery(req) {
    const workspaceId = typeof req.query?.workspaceId === 'string' ? req.query.workspaceId.trim() : '';
    const workspaceMemberId = typeof req.query?.workspaceMemberId === 'string'
        ? req.query.workspaceMemberId.trim()
        : '';
    return workspaceId && workspaceMemberId
        ? { workspaceId, workspaceMemberId }
        : null;
}
//# sourceMappingURL=design-systems.js.map