import { getDiagnosticsEvidence, recordDiagnosticFailure } from '../services/diagnostics-evidence.js';
import { workspaceSeatCapacityState } from '@open-design/contracts';
import { parseWorkspaceCollabContext, } from '../collab/workspace-context.js';
import { createTeamProjectsLister } from '../collab/team-projects.js';
import { consumeInviteContinuation, } from '../collab/invite-continue.js';
import { createWorkspaceInvite, } from '../collab/invite-create.js';
import { fetchBillingCheckoutUrl, fetchVelaBillingCatalog, fetchVelaBillingPreflight, fetchVelaBillingFundingCheck, isVelaWorkspaceAuthorizationError, fetchVelaWorkspaceBillingProjection, fetchVelaBillingSummary, } from '../integrations/vela-billing.js';
import { listVelaWorkspaceDirectory, workspaceContextFromDirectoryItem, } from '../collab/vela-workspace-context.js';
import { createWorkspaceBillingRuntimeCoordinator, WorkspaceBillingInterestError, } from '../collab/workspace-billing-runtime.js';
import { verifyWorkspaceRequestContext, } from '../collab/request-workspace-context.js';
import { requestWithWorkspaceNavigationScope } from '../collab/workspace-resource-mutation.js';
import { sendApiError } from '../http/api-errors.js';
/**
 * Deliver one thin invalidation only to clients whose EventSource connection
 * was freshly verified for the affected Workspace. Member identity is still
 * verified at subscription time; delivery is workspace-wide because roster,
 * catalog, context, and team billing changes legitimately invalidate every
 * active member's view of that Workspace.
 */
export function emitWorkspaceEventToScope(sinksByWorkspace, workspaceIdInput, payload) {
    const workspaceId = workspaceIdInput.trim();
    if (!workspaceId)
        return false;
    const sinks = sinksByWorkspace.get(workspaceId);
    if (!sinks || sinks.size === 0)
        return false;
    for (const sink of Array.from(sinks)) {
        try {
            sink(payload);
        }
        catch {
            sinks.delete(sink);
        }
    }
    if (sinks.size === 0)
        sinksByWorkspace.delete(workspaceId);
    return true;
}
/**
 * Deliver an account-level dirty signal through every already-authorized local
 * Workspace stream. The payload deliberately contains no Workspace id/content,
 * so this broad local nudge reveals no cross-workspace data; each browser then
 * re-reads the account directory through the daemon's current credential.
 */
export function emitWorkspaceEventToAllScopes(sinksByWorkspace, payload) {
    let emitted = false;
    for (const [workspaceId, sinks] of Array.from(sinksByWorkspace)) {
        for (const sink of Array.from(sinks)) {
            try {
                sink(payload);
                emitted = true;
            }
            catch {
                sinks.delete(sink);
            }
        }
        if (sinks.size === 0)
            sinksByWorkspace.delete(workspaceId);
    }
    return emitted;
}
const ASSIGNABLE_ROLES = new Set(['admin', 'member']);
/**
 * Enrichment may add billing and display metadata, but it must not rewrite the
 * exact Workspace authority already proven by the membership directory.
 */
function enrichVerifiedWorkspaceContext(verified, enriched) {
    if (!enriched
        || enriched.workspaceId !== verified.workspaceId
        || enriched.workspaceMemberId !== verified.workspaceMemberId) {
        return verified;
    }
    const { teamId: _enrichedTeamId, ...enrichedMetadata } = enriched;
    return {
        ...enrichedMetadata,
        workspaceId: verified.workspaceId,
        workspaceType: verified.workspaceType,
        workspaceMemberId: verified.workspaceMemberId,
        role: verified.role,
        memberStatus: verified.memberStatus,
        lifecycleState: verified.lifecycleState,
        permissions: verified.permissions,
        ...(verified.teamId ? { teamId: verified.teamId } : {}),
    };
}
function workspaceGroupProperties(context) {
    const planId = context.planId?.trim().toLowerCase();
    const seatSummary = context.seatSummary;
    const seatState = workspaceSeatCapacityState(seatSummary);
    return {
        workspace_type: context.workspaceType,
        workspace_lifecycle: context.lifecycleState,
        billing_state: context.billingState,
        plan_bucket: !planId || planId === 'free' ? 'free' : 'paid',
        provider_mode: context.providerMode,
        ...(seatState !== 'unknown'
            ? {
                seat_limit: seatSummary.seatLimit,
                member_count: seatSummary.usedSeats,
            }
            : {}),
        seat_state: seatState,
    };
}
/**
 * Normalize an invite-create request body into validated { email, role } items.
 * Accepts either the canonical `{ invites: [...] }` batch shape or a single
 * top-level `{ email, role }`. Rows without a non-empty email are dropped; a
 * missing/unknown role defaults to 'member' (never 'owner').
 */
function parseInviteCreateItems(body) {
    const raw = body;
    const source = Array.isArray(raw?.invites)
        ? raw.invites
        : raw && typeof raw === 'object' && typeof raw.email === 'string'
            ? [raw]
            : [];
    const items = [];
    for (const entry of source) {
        if (!entry || typeof entry !== 'object')
            continue;
        const rec = entry;
        if (typeof rec.email !== 'string')
            continue;
        const email = rec.email.trim();
        if (!email)
            continue;
        const role = typeof rec.role === 'string' && ASSIGNABLE_ROLES.has(rec.role)
            ? rec.role
            : 'member';
        items.push({ email, role });
    }
    return items;
}
/**
 * Workspace-context route : the daemon's single B-integration seam. The
 * web client fetches an explicitly selected workspace context here to decide
 * whether collab runs and who the present member is (resolveCollabSession). In
 * production the provider proxies B; the dev provider is settable via PUT so a
 * demo/tools-dev run can exercise the full path before B is reachable.
 */
export function registerCollabContextRoutes(app, deps) {
    const { workspaceContext } = deps;
    const configuredEnv = () => deps.configuredEnv?.() ?? {};
    const consumeInvite = deps.consumeInvite ?? ((nonce) => consumeInviteContinuation(nonce, {
        configuredEnv: configuredEnv(),
    }));
    const createInvite = deps.createInvite ?? ((input) => createWorkspaceInvite(input));
    const fetchBilling = deps.fetchBilling ?? (() => fetchVelaBillingSummary());
    const fetchWorkspaceBillingProjection = deps.fetchWorkspaceBillingProjection ??
        (deps.fetchWorkspaceBalance
            ? async (workspaceId) => ({
                snapshot: null,
                workspaceBalance: await deps.fetchWorkspaceBalance(workspaceId),
            })
            : (workspaceId) => fetchVelaWorkspaceBillingProjection(workspaceId));
    const billingRuntime = deps.billingRuntime ??
        createWorkspaceBillingRuntimeCoordinator({
            fetchProjection: ({ workspaceId }) => fetchWorkspaceBillingProjection(workspaceId),
        });
    const fetchBillingCatalog = deps.fetchBillingCatalog ?? ((workspaceId) => fetchVelaBillingCatalog(workspaceId));
    const startCheckout = deps.startCheckout ??
        ((input) => fetchBillingCheckoutUrl(input));
    const rawTeamProjectsLister = createTeamProjectsLister({});
    const listTeamProjects = deps.listTeamProjects ??
        ((context) => rawTeamProjectsLister(context.workspaceId));
    const listMembers = deps.listMembers ?? (async () => []);
    const listWorkspaceDirectory = deps.listWorkspaceDirectory ?? (() => listVelaWorkspaceDirectory());
    const fetchWorkspaceDirectory = deps.fetchWorkspaceDirectory ??
        (async () => ({
            ok: true,
            items: await listWorkspaceDirectory(),
        }));
    const sendWorkspaceVerificationFailure = (res, verified) => verified.code === 'AMR_AUTH_REQUIRED'
        ? sendApiError(res, verified.status, verified.code, verified.message, {
            retryable: false,
        })
        : res.status(verified.status).json({
            error: verified.code,
            message: verified.message,
            ...(verified.retryable ? { retryable: true } : {}),
        });
    // Desktop invite hand-off ("桌面唤起和本地恢复"): the desktop app parses the
    // opendesign:// invite deeplink and POSTs the nonce here. The daemon consumes
    // the one-time continuation on B with the signed-in vela session and returns
    // the resolved workspace context so the client can switch into the team
    // workspace. The nonce is single-use — B enforces subject match + one consume.
    app.post('/api/workspace/invite/continue', async (req, res) => {
        const body = req.body;
        const nonce = body && typeof body.nonce === 'string' ? body.nonce : '';
        if (!nonce.trim())
            return res.status(400).json({ error: 'missing_nonce' });
        const outcome = await consumeInvite(nonce);
        if (!outcome.ok)
            return res.status(outcome.status).json({ error: outcome.error });
        // Consuming the one-time nonce has already committed the membership on B.
        // Refresh the daemon's settled authority lease before the renderer makes
        // its first exact-scope read. A refresh outage must not turn a successfully
        // consumed, non-repeatable continuation into an HTTP failure.
        await deps.refreshWorkspaceDirectoryAfterMutation?.().catch(() => undefined);
        if (outcome.context) {
            void deps.observeWorkspace?.(req, outcome.context, workspaceGroupProperties(outcome.context));
        }
        return res.json({ context: outcome.context, workspaceMemberId: outcome.workspaceMemberId });
    });
    // Invite CREATE (the inviter/host flow): the team switcher's "邀请同事" dialog
    // POSTs one or more { email, role } pairs here. The daemon derives the current
    // workspaceId from the caller's workspace context and creates each invite on B
    // with the signed-in vela session. Every outcome is typed: a missing session
    // 401s, a missing workspace 409s, and B's per-invite failures (including a 404
    // when B's create endpoint is absent locally) come back as `ok: false` results
    // — the endpoint never crashes on the backend being unavailable.
    app.post('/api/workspace/invite', async (req, res) => {
        const items = parseInviteCreateItems(req.body);
        if (items.length === 0)
            return res.status(400).json({ error: 'missing_invites' });
        const verified = await verifyWorkspaceRequestContext({
            req,
            fetchWorkspaceDirectory,
            configuredEnv: configuredEnv(),
            requireTeam: true,
        });
        if (!verified.ok)
            return sendWorkspaceVerificationFailure(res, verified);
        const context = verified.context;
        const workspaceId = context.workspaceId;
        if (!context.permissions.canInviteMembers) {
            return res.status(403).json({ error: 'forbidden' });
        }
        const results = [];
        for (const item of items) {
            const outcome = await createInvite({ email: item.email, role: item.role, workspaceId });
            // The vela session is workspace-wide: if it is missing for one invite it is
            // missing for all, so short-circuit to a single 401 instead of N failures.
            if (!outcome.ok && outcome.error === 'no_session') {
                return res.status(401).json({ error: 'no_session' });
            }
            results.push(outcome.ok
                ? { email: item.email, ok: true, inviteId: outcome.inviteId }
                : { email: item.email, ok: false, error: outcome.error });
        }
        const body = { results };
        return res.json(body);
    });
    app.get('/api/workspace/context', async (req, res) => {
        const authorization = req.header('authorization') ?? undefined;
        const verified = deps.verifyWorkspaceReadAuthority
            ? await deps.verifyWorkspaceReadAuthority(req)
            : await verifyWorkspaceRequestContext({
                req,
                fetchWorkspaceDirectory,
                configuredEnv: configuredEnv(),
            });
        if (!verified.ok) {
            recordDiagnosticFailure({ source: 'workspace-context', status: verified.status });
            return sendWorkspaceVerificationFailure(res, verified);
        }
        const enriched = await workspaceContext.resolveExact?.({
            authorization,
            workspaceId: verified.context.workspaceId,
        }).catch(() => null);
        const context = enrichVerifiedWorkspaceContext(verified.context, enriched);
        getDiagnosticsEvidence()?.observeContext(context);
        const body = { context };
        void deps.observeWorkspace?.(req, context, workspaceGroupProperties(context));
        res.json(body);
    });
    // Collab realtime hop-2: workspace-scoped invalidation SSE. Browser-owned
    // EventSource cannot send custom headers, so it carries the exact
    // Workspace/member pair in the navigation query. The pair is promoted to
    // the normal request-header shape, freshly directory-verified, then used
    // only to select the sink partition; authority-bearing role/lifecycle bits
    // always come from the verified directory context.
    //
    // Carries thin
    // `WorkspaceInvalidationSsePayload` signals (`team-projects-changed`,
    // `members-changed`, `workspace-context-changed`, `billing-changed`); the web
    // re-fetches the affected resource on receipt. Modeled on the project events
    // SSE (`/api/projects/:id/events`): one flat sink set, dropped on disconnect
    // via `res.on('close')`. No event buffer — a disconnect gap is closed by the
    // client's reconnect snapshot re-fetch, not a server-side replay.
    const { createSseResponse, workspaceEventSinks } = deps;
    if (createSseResponse && workspaceEventSinks) {
        app.get('/api/workspace/events', async (req, res) => {
            const scopedRequest = requestWithWorkspaceNavigationScope(req);
            if (scopedRequest === 'conflict') {
                res.status(400).json({
                    error: 'WORKSPACE_CONTEXT_CONFLICT',
                    message: 'workspace header and navigation scope must match',
                });
                return;
            }
            const verified = await verifyWorkspaceRequestContext({
                req: scopedRequest,
                fetchWorkspaceDirectory,
                configuredEnv: configuredEnv(),
            });
            if (!verified.ok) {
                sendWorkspaceVerificationFailure(res, verified);
                return;
            }
            const workspaceId = verified.context.workspaceId;
            const sse = createSseResponse(res);
            const sink = (payload) => {
                if (payload.type === 'coding-plan-usage-changed' &&
                    (payload.workspaceId !== workspaceId ||
                        payload.workspaceMemberId !== verified.context.workspaceMemberId))
                    return;
                const type = payload && typeof payload === 'object' && 'type' in payload
                    ? String(payload.type)
                    : 'message';
                sse.send(type, payload);
            };
            let workspaceSinks = workspaceEventSinks.get(workspaceId);
            if (!workspaceSinks) {
                workspaceSinks = new Set();
                workspaceEventSinks.set(workspaceId, workspaceSinks);
            }
            workspaceSinks.add(sink);
            const releaseWorkspaceEventInterest = deps.retainWorkspaceEventInterest?.(workspaceId) ?? (() => undefined);
            // Handshake so the client treats the stream as live and resets its
            // reconnect backoff immediately (mirrors the project stream's `ready`).
            sse.send('ready', { at: Date.now() });
            const cleanup = () => {
                workspaceSinks?.delete(sink);
                if (workspaceSinks?.size === 0) {
                    workspaceEventSinks.delete(workspaceId);
                }
                releaseWorkspaceEventInterest();
            };
            res.on('close', cleanup);
            res.on('finish', cleanup);
        });
    }
    app.get('/api/workspace/directory', async (req, res) => {
        const directory = await fetchWorkspaceDirectory().catch(() => ({ ok: false, items: [] }));
        if (!directory.ok) {
            recordDiagnosticFailure({ source: 'local-api', operation: '/api/workspace/directory', status: directory.reason === 'unauthorized' ? 401 : 503 });
            if (directory.reason === 'unauthorized') {
                return sendApiError(res, 401, 'AMR_AUTH_REQUIRED', 'AMR authorization expired. Sign in again to continue.', { retryable: false });
            }
            return res.status(503).json({
                error: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
                message: 'workspace membership authority is temporarily unavailable',
                retryable: true,
            });
        }
        const items = directory.items;
        const claimed = await verifyWorkspaceRequestContext({
            req,
            fetchWorkspaceDirectory: async () => directory,
            configuredEnv: configuredEnv(),
        });
        const savedWorkspaceId = deps.activeWorkspace?.get()?.trim() || null;
        const workspaceIsVisible = (workspaceId) => Boolean(workspaceId
            && items.some((item) => item.workspaceId === workspaceId
                && item.memberStatus === 'active'
                && item.lifecycleState !== 'deleted'));
        const savedWorkspaceIsVisible = workspaceIsVisible(savedWorkspaceId);
        if (savedWorkspaceId && !savedWorkspaceIsVisible) {
            await deps.activeWorkspace?.clearIf(savedWorkspaceId).catch(() => false);
        }
        const currentWorkspaceId = deps.activeWorkspace?.get()?.trim() || null;
        const currentWorkspaceIsVisible = workspaceIsVisible(currentWorkspaceId);
        let activeWorkspaceId = currentWorkspaceIsVisible ? currentWorkspaceId : null;
        if (claimed.ok)
            activeWorkspaceId = claimed.context.workspaceId;
        const body = { items, activeWorkspaceId };
        res.json(body);
    });
    app.put('/api/workspace/active', async (req, res) => {
        const raw = req.body;
        const workspaceId = typeof raw?.workspaceId === 'string' ? raw.workspaceId.trim() : '';
        const workspaceMemberId = typeof raw?.workspaceMemberId === 'string' ? raw.workspaceMemberId.trim() : '';
        if (!workspaceId)
            return res.status(400).json({ error: 'missing_workspace_id' });
        if (!workspaceMemberId) {
            return res.status(400).json({ error: 'missing_workspace_member_id' });
        }
        const directoryResult = await fetchWorkspaceDirectory().catch(() => ({ ok: false, items: [] }));
        if (!directoryResult.ok) {
            if (directoryResult.reason === 'unauthorized') {
                return sendApiError(res, 401, 'AMR_AUTH_REQUIRED', 'AMR authorization expired. Sign in again to continue.', { retryable: false });
            }
            return res.status(503).json({
                error: 'WORKSPACE_AUTHORITY_UNAVAILABLE',
                message: 'workspace membership authority is temporarily unavailable',
                retryable: true,
            });
        }
        const directory = directoryResult.items;
        // A directory row only authorizes a switch while it is a LIVE membership.
        // Matching on the id alone would let a listed-but-removed membership (or a
        // deleted workspace) through, and this entry is also what gets synthesized
        // into the response below — so an unfiltered match could describe a
        // workspace the caller no longer holds. This matches the context provider's
        // directory-selection predicate.
        const selected = directory.find((item) => item.workspaceId === workspaceId &&
            item.workspaceMemberId === workspaceMemberId &&
            item.memberStatus === 'active' &&
            item.lifecycleState !== 'deleted');
        if (!selected) {
            return res.status(404).json({ error: 'workspace_not_visible' });
        }
        // The membership directory above is the authorization. Persist the choice
        // only as this client's next-start default; data-plane routes continue to
        // require the exact Workspace/member pair on every request, so another tab
        // already operating in a different workspace keeps its own scope.
        //
        // This used to PUT B's account-level active workspace first and fail the
        // user's click (502) when that write did not take. That row is keyed by app
        // user, so it can only ever name ONE workspace for an account whose clients
        // are in different ones: every switch yanked the other clients' server-side
        // scope. Workspace now travels per request, which is what makes N tabs and
        // clients of one account independent.
        const authorization = req.header('authorization') ?? undefined;
        const context = typeof workspaceContext.resolveExact === 'function'
            ? await workspaceContext.resolveExact({
                authorization,
                workspaceId,
            }).catch(() => null)
            : null;
        if (context
            && (context.workspaceId !== workspaceId
                || context.workspaceMemberId !== workspaceMemberId)) {
            return res.status(404).json({ error: 'workspace_no_longer_available' });
        }
        const resolved = context ?? workspaceContextFromDirectoryItem(selected, configuredEnv());
        try {
            await deps.activeWorkspace?.set(workspaceId);
        }
        catch {
            return sendApiError(res, 500, 'INTERNAL_ERROR', 'failed to persist the selected workspace');
        }
        // Warm this exact workspace's cold caches before responding, but never
        // await them — a slow upstream must not delay the tab-local selection.
        deps.onWorkspaceSwitched?.(workspaceId);
        const body = { activeWorkspaceId: workspaceId, context: resolved };
        void deps.observeWorkspace?.(req, resolved, workspaceGroupProperties(resolved));
        res.json(body);
    });
    // Team-wide shared-project discovery: the web "全部项目" view fetches every
    // project any member shared to the team here (read from the resource hub), so a
    // member whose own /api/projects list is empty still sees the owner's shared
    // projects to pull + open. A successful empty result is authoritative. A
    // transient upstream failure must stay distinguishable so clients can retain
    // their exact-scope last-good catalog instead of treating the outage as an
    // authoritative removal of every project.
    app.get('/api/workspace/projects/team', async (req, res) => {
        const verified = deps.verifyWorkspaceReadAuthority
            ? await deps.verifyWorkspaceReadAuthority(req)
            : await verifyWorkspaceRequestContext({
                req,
                fetchWorkspaceDirectory,
                configuredEnv: configuredEnv(),
                requireTeam: true,
            });
        if (!verified.ok) {
            return res.status(verified.status).json({
                error: verified.code,
                message: verified.message,
                ...(verified.retryable ? { retryable: true } : {}),
            });
        }
        if (verified.context.workspaceType !== 'team') {
            return res.status(403).json({
                error: 'WORKSPACE_ACCESS_DENIED',
                message: 'the requested workspace is not available to this member',
            });
        }
        let projects;
        try {
            projects = await listTeamProjects(verified.context);
        }
        catch {
            return sendApiError(res, 503, 'UPSTREAM_UNAVAILABLE', 'team project catalog is temporarily unavailable', { retryable: true });
        }
        const body = { projects };
        res.json(body);
    });
    // Member directory: the web client resolves comment authors (authorMemberId →
    // "琼羽 · Owner") and the shared-project owner name from this. Read from the
    // collab-cloud directory. A directory outage is retryable and must not be
    // represented as an authoritative empty roster: clients retain last-good
    // display metadata until a successful response says members really left.
    app.get('/api/workspace/members', async (req, res) => {
        const verified = deps.verifyWorkspaceReadAuthority
            ? await deps.verifyWorkspaceReadAuthority(req)
            : await verifyWorkspaceRequestContext({
                req,
                fetchWorkspaceDirectory,
                configuredEnv: configuredEnv(),
                requireTeam: true,
            });
        if (!verified.ok)
            return sendWorkspaceVerificationFailure(res, verified);
        if (verified.context.workspaceType !== 'team') {
            return sendWorkspaceVerificationFailure(res, {
                ok: false,
                status: 403,
                code: 'WORKSPACE_ACCESS_DENIED',
                message: 'the requested workspace is not available to this member',
            });
        }
        try {
            const members = await listMembers(verified.context);
            const body = { members };
            return res.json(body);
        }
        catch {
            return sendApiError(res, 503, 'UPSTREAM_UNAVAILABLE', 'team member directory is temporarily unavailable', { retryable: true });
        }
    });
    // Billing reads are explicit at the HTTP boundary:
    // - scope=account is retained only for old callers that cannot name a
    //   Workspace;
    // - scope=workspace requires a workspaceId that resolves to an active
    //   Personal or Team membership in the directory, then reads Vela's
    //   independently scoped v2 wallet response.
    //
    // The URL is the selection source. Authorization is an independent
    // membership lookup — never daemon-global active/current state — so two
    // clients can address different workspaces without switching each other.
    // Account metadata and workspace money remain independently nullable.
    app.put('/api/workspace/billing/interests/:clientId', async (req, res) => {
        const clientId = req.params.clientId?.trim() ?? '';
        const body = (req.body ?? {});
        const generation = typeof body.generation === 'string' ? body.generation.trim() : '';
        if (!clientId ||
            clientId.length > 160 ||
            !/^(?:0|[1-9]\d*)$/.test(generation) ||
            !Array.isArray(body.interests)) {
            return res.status(400).json({ error: 'invalid_billing_interest' });
        }
        const interests = body.interests.map((interest) => ({
            workspaceId: typeof interest?.workspaceId === 'string' ? interest.workspaceId.trim() : '',
            workspaceMemberId: typeof interest?.workspaceMemberId === 'string'
                ? interest.workspaceMemberId.trim()
                : '',
        }));
        if (interests.some((interest) => !interest.workspaceId || !interest.workspaceMemberId)) {
            return res.status(400).json({ error: 'invalid_billing_interest' });
        }
        if (interests.length > 0) {
            const directoryResult = await fetchWorkspaceDirectory().catch(() => ({ ok: false, items: [] }));
            if (!directoryResult.ok) {
                if (directoryResult.reason === 'unauthorized') {
                    return sendApiError(res, 401, 'AMR_AUTH_REQUIRED', 'AMR authorization expired. Sign in again to continue.', { retryable: false });
                }
                return res.status(503).json({ error: 'workspace_directory_unavailable' });
            }
            const unauthorized = interests.filter((interest) => !directoryResult.items.some((item) => item.workspaceId === interest.workspaceId &&
                item.workspaceMemberId === interest.workspaceMemberId &&
                item.memberStatus === 'active' &&
                item.lifecycleState === 'active'));
            if (unauthorized.length > 0) {
                // A stale renderer may still declare an old membership epoch for a
                // workspace another renderer is legitimately using. Reject this
                // declaration without mutating process-wide workspace state.
                return res.status(403).json({ error: 'workspace_not_authorized' });
            }
        }
        try {
            const lease = billingRuntime.setClientInterests({
                clientId,
                clientGeneration: generation,
                interests,
            });
            return res.json(lease);
        }
        catch (error) {
            if (!(error instanceof WorkspaceBillingInterestError))
                throw error;
            return res
                .status(error.code === 'interest_capacity_exceeded' ? 429 : 409)
                .json({
                error: error.code,
                ...(error.acceptedGeneration
                    ? { acceptedGeneration: error.acceptedGeneration }
                    : {}),
            });
        }
    });
    app.delete('/api/workspace/billing/interests/:clientId', (req, res) => {
        const clientId = req.params.clientId?.trim() ?? '';
        const generation = typeof req.query.generation === 'string' ? req.query.generation.trim() : undefined;
        if (!clientId)
            return res.status(400).json({ error: 'invalid_billing_interest' });
        try {
            const released = billingRuntime.releaseClientInterests(clientId, generation);
            return res.json({ ok: true, released });
        }
        catch (error) {
            if (!(error instanceof WorkspaceBillingInterestError))
                throw error;
            return res.status(400).json({ error: error.code });
        }
    });
    // This upstream call authorizes the current member itself. It must not wait
    // for the display-billing projection or spawn an agent run.
    app.get('/api/workspace/billing/preflight', async (req, res) => {
        const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : '';
        const modelId = typeof req.query.modelId === 'string' ? req.query.modelId.trim() || null : null;
        if (!workspaceId || (modelId && modelId.length > 256)) {
            return res.status(400).json({ error: 'invalid_billing_scope' });
        }
        try {
            const preflight = await (deps.fetchBillingFundingCheck ?? ((id, model) => fetchVelaBillingFundingCheck(id, model, { configuredEnv: configuredEnv() })))(workspaceId, modelId);
            if (!preflight || preflight.workspaceId !== workspaceId || preflight.modelId !== modelId) {
                return res.status(503).json({ error: 'billing_preflight_unavailable' });
            }
            res.setHeader('Cache-Control', 'private, no-store');
            return res.json({ preflight });
        }
        catch (error) {
            if (isVelaWorkspaceAuthorizationError(error)) {
                return res.status(403).json({ error: 'workspace_not_authorized' });
            }
            return res.status(503).json({ error: 'billing_preflight_unavailable' });
        }
    });
    app.get('/api/workspace/billing', async (req, res) => {
        const scope = typeof req.query.scope === 'string' ? req.query.scope.trim() : '';
        const requestedWorkspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : '';
        const freshness = typeof req.query.freshness === 'string' ? req.query.freshness.trim() : '';
        if ((scope !== 'account' && scope !== 'workspace') ||
            (scope === 'account' && requestedWorkspaceId) ||
            (scope === 'workspace' && !requestedWorkspaceId) ||
            (freshness !== '' && freshness !== 'authoritative') ||
            (scope !== 'workspace' && freshness !== '')) {
            return res.status(400).json({ error: 'invalid_billing_scope' });
        }
        if (scope === 'account') {
            const summary = await fetchBilling();
            const body = { summary, workspaceBalance: null };
            return res.json(body);
        }
        const clientId = req.header('x-od-workspace-runtime-client-id') ?? undefined;
        const clientGeneration = req.header('x-od-workspace-runtime-generation') ?? undefined;
        const cachedAuthority = deps.readCachedWorkspaceAuthority?.(req, requestedWorkspaceId) ?? null;
        let membership = cachedAuthority?.memberStatus === 'active' &&
            cachedAuthority.lifecycleState === 'active'
            ? cachedAuthority
            : undefined;
        if (!membership) {
            const directoryResult = await fetchWorkspaceDirectory().catch(() => ({ ok: false, items: [] }));
            if (!directoryResult.ok) {
                billingRuntime.markWorkspaceUnavailable(requestedWorkspaceId, 'workspace_directory_unavailable');
                if (directoryResult.reason === 'unauthorized') {
                    return sendApiError(res, 401, 'AMR_AUTH_REQUIRED', 'AMR authorization expired. Sign in again to continue.', { retryable: false });
                }
                return res.status(503).json({ error: 'workspace_directory_unavailable' });
            }
            membership = directoryResult.items.find((item) => item.workspaceId === requestedWorkspaceId &&
                item.memberStatus === 'active' &&
                item.lifecycleState === 'active');
        }
        if (!membership) {
            billingRuntime.revokeWorkspace(requestedWorkspaceId);
            return res.status(403).json({ error: 'workspace_not_authorized' });
        }
        billingRuntime.retainWorkspaceMember(requestedWorkspaceId, membership.workspaceMemberId);
        billingRuntime.authorizeWorkspaceMember({
            workspaceId: requestedWorkspaceId,
            workspaceMemberId: membership.workspaceMemberId,
        });
        let accountSummary;
        let runtimeResult;
        try {
            [accountSummary, runtimeResult] = await Promise.all([
                fetchBilling(),
                billingRuntime.read({
                    workspaceId: requestedWorkspaceId,
                    workspaceMemberId: membership.workspaceMemberId,
                }, {
                    reason: freshness === 'authoritative'
                        ? 'authoritative-action-read'
                        : 'explicit-billing-read',
                    ...(freshness === 'authoritative' ? { requireFresh: true } : {}),
                    ...(clientId ? { clientId } : {}),
                    ...(clientGeneration ? { clientGeneration } : {}),
                }),
            ]);
        }
        catch (error) {
            if (error instanceof WorkspaceBillingInterestError) {
                return res.status(409).json({
                    error: error.code,
                    ...(error.acceptedGeneration
                        ? { acceptedGeneration: error.acceptedGeneration }
                        : {}),
                });
            }
            if (freshness === 'authoritative') {
                const code = typeof error?.code === 'string'
                    ? error.code
                    : 'workspace_billing_authoritative_unavailable';
                return res.status(503).json({ error: code });
            }
            throw error;
        }
        const projection = runtimeResult.projection;
        const workspaceBalance = projection.workspaceBalance;
        const authorizedWorkspaceBalance = workspaceBalance?.workspaceId === requestedWorkspaceId &&
            workspaceBalance.workspaceMemberId === membership.workspaceMemberId
            ? workspaceBalance
            : null;
        const snapshot = projection.snapshot;
        const authorizedWorkspaceSnapshot = snapshot?.workspaceId === requestedWorkspaceId &&
            snapshot.workspaceMemberId === membership.workspaceMemberId
            ? snapshot
            : null;
        const authoritativeObservedAt = freshness === 'authoritative' &&
            runtimeResult.state.status === 'fresh'
            ? runtimeResult.state.observedAt
            : null;
        if (freshness === 'authoritative' && !authoritativeObservedAt) {
            return res.status(503).json({
                error: 'workspace_billing_authoritative_unavailable',
            });
        }
        const body = {
            summary: accountSummary,
            workspaceBalance: authorizedWorkspaceBalance,
            ...(authorizedWorkspaceSnapshot
                ? { workspaceSnapshot: authorizedWorkspaceSnapshot }
                : {}),
            workspaceRuntime: runtimeResult.state,
            ...(authoritativeObservedAt
                ? {
                    authoritativeWorkspaceRead: {
                        workspaceId: requestedWorkspaceId,
                        workspaceMemberId: membership.workspaceMemberId,
                        observedAt: authoritativeObservedAt,
                    },
                }
                : {}),
        };
        if (req.query.includePreflight === '1') {
            const modelId = typeof req.query.modelId === 'string' ? req.query.modelId.trim() || null : null;
            try {
                const preflight = await (deps.fetchBillingPreflight ?? ((id, model) => fetchVelaBillingPreflight(id, model, { configuredEnv: configuredEnv() })))(requestedWorkspaceId, modelId);
                body.preflight = preflight?.workspaceId === requestedWorkspaceId &&
                    preflight.workspaceMemberId === membership.workspaceMemberId ? preflight : null;
            }
            catch (error) {
                if (isVelaWorkspaceAuthorizationError(error))
                    return res.status(403).json({ error: 'workspace_not_authorized' });
                throw error;
            }
            body.quotaRealtime = { healthy: deps.quotaRealtimeHealthy?.(requestedWorkspaceId) === true };
        }
        return res.json(body);
    });
    app.get('/api/workspace/billing/catalog', async (req, res) => {
        const verified = await verifyWorkspaceRequestContext({
            req,
            fetchWorkspaceDirectory,
            configuredEnv: configuredEnv(),
            requireTeam: true,
        });
        if (!verified.ok)
            return sendWorkspaceVerificationFailure(res, verified);
        const catalog = await fetchBillingCatalog(verified.context.workspaceId);
        const body = { catalog };
        return res.json(body);
    });
    // Compatibility checkout route. The current product UI opens Vela Web for
    // upgrade/payment, but keeping this endpoint avoids breaking existing tests
    // and lets A's CLI checkout path be exercised directly when needed.
    app.post('/api/workspace/billing/checkout', async (req, res) => {
        const verified = await verifyWorkspaceRequestContext({
            req,
            fetchWorkspaceDirectory,
            configuredEnv: configuredEnv(),
            requireTeam: true,
        });
        if (!verified.ok)
            return sendWorkspaceVerificationFailure(res, verified);
        const body = (req.body ?? {});
        const planId = parseTeamBillingPlanId(body.planId);
        const seats = typeof body.seats === 'number' && body.seats > 0 ? Math.floor(body.seats) : undefined;
        const checkoutInput = { workspaceId: verified.context.workspaceId };
        if (planId)
            checkoutInput.planId = planId;
        if (seats !== undefined)
            checkoutInput.seats = seats;
        const checkoutUrl = await startCheckout(checkoutInput);
        const response = { checkoutUrl };
        res.json(response);
    });
    // Dev/demo seam: override the in-memory context. A real B-backed provider does
    // not expose `set`, so this 404s in production instead of spoofing identity.
    app.put('/api/workspace/context', (req, res) => {
        if (!workspaceContext.set) {
            return res.status(404).json({ error: 'workspace context is not settable' });
        }
        const body = req.body;
        // `null` explicitly clears the context (sign-out / leave team).
        if (body === null || (body && typeof body === 'object' && Object.keys(body).length === 0)) {
            workspaceContext.set(null);
            const cleared = { context: null };
            return res.json(cleared);
        }
        const context = parseWorkspaceCollabContext(body);
        if (!context)
            return res.status(400).json({ error: 'invalid workspace context' });
        workspaceContext.set(context);
        const response = { context };
        res.json(response);
    });
}
function parseTeamBillingPlanId(value) {
    return value === 'team_plus' || value === 'team_pro' || value === 'team_max' ? value : null;
}
//# sourceMappingURL=collab-context.js.map