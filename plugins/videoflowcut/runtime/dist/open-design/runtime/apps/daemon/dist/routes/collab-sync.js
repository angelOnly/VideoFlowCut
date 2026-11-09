import { currentFileSharePublication, UnboundFileShareIdentityError } from '../collab/vela-project-share-state.js';
import { publishReservedVelaShareVersion } from '../collab/vela-share-publish.js';
import { sharePublishResponse } from '../collab/share-publish-response.js';
import { persistedAmrShareUrl } from '../collab/public-share-viewer-url.js';
import { stopVelaShare } from '../collab/vela-share-stop.js';
import { publicFileResourceIdFor } from '../collab/public-file-resource-id.js';
import { registerVelaTeamProjectResource } from '../collab/vela-cli-team-projects.js';
import { resumePendingShareBinding } from '../collab/resume-pending-share-binding.js';
import { reserveFileShareAlias } from '../collab/share-alias-recovery.js';
import { ShareAliasIdentityMismatchError } from '../collab/share-alias-reservation.js';
import { resumeExistingVelaShare } from '../collab/vela-share-binding.js';
import { createShareFileMapping, publishedPathForSource } from '../collab/share-file-mapping.js';
import { publicFileMutationHandler } from './public-file-mutation-handler.js';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { stageShareFiles } from '../collab/share-staging.js';
import os from 'node:os';
import path from 'node:path';
import { SHARE_ENTRY_INDEX_CONFLICT, SHARE_MAX_TOTAL_BYTES, workspaceContextHasWorkspaceIdentity, } from '@open-design/contracts';
import { contextToResourceHubPrincipal, } from '../collab/resource-principal.js';
import { isAuthorizedProactivePullInvocation, isBoundProactivePullInvocation, isFreshProactivePullAuthorizationWitness, } from '../collab/proactive-content-pull.js';
import { isAuthorizedTeamProjectPullReceiptExpired, isAuthorizedTeamProjectPullUnavailable, stageAuthorizedTeamProjectPull, validateAuthorizedTeamProjectPullReceipt, } from '../collab/authorized-team-project-pull.js';
import { promoteAuthorizedTeamProjectStage, } from '../collab/team-mirror-promotion.js';
import { isUnmaterializedSharedPlaceholder } from '../collab/shared-project-placeholder.js';
import { isRetractedHubResourceError, parseVelaPushVersionId, } from '../collab/vela-cli-resource-adapter.js';
import { createInMemoryPublicFilePublicationStore, } from '../collab/public-file-publication-store.js';
import { classifyVelaCommandFailure, logPublicFileFailure, logPublicShareDiagnostic } from '../collab/public-file-failure.js';
import { clientRequestIdFor } from '../http/client-request-id.js';
import { publicShareProjectBootstrapDiagnostic } from '../collab/public-share-project-bootstrap.js';
import { isAbortedOperationError } from '../integrations/aborted-error.js';
import { buildDeployFilePlan, entryIndexConflictError } from '../deploy.js';
import { readProjectManifest } from '../project-locations.js';
import { redactSecrets } from '../redact.js';
import { findRealElementRange, HTML_TAG_PATTERNS } from '@open-design/contracts/runtime/html-injection-points';
const SYNC_INTENT_EVENTS = new Set([
    'project_visibility_changed',
    'project_team_share_requested',
    'project_team_unshare_requested',
]);
const PULLED_PROJECT_PLACEHOLDER_NAME = '共享项目';
const PUBLIC_FILE_RESOURCE_KIND = 'project';
const PUBLIC_FILE_REF = 'published';
const MAX_ERROR_LOG_FIELD_LENGTH = 2_048;
/** Builds the share payload through the deploy planner without inheriting its hook. */
async function buildSharePlan(projectDir, entryName, metadata) {
    const deployPlan = await buildDeployFilePlan(path.dirname(projectDir), path.basename(projectDir), entryName, { metadata, hookScriptUrl: '', assetUrlPolicy: 'share-relative' });
    // A conflict leaves the entry at index.html (the planner never reads the
    // colliding root index.html), so the mapping below stays valid; the
    // blocker is what refuses the publish.
    const conflict = deployPlan.indexConflict ? entryIndexConflictError(deployPlan.indexConflict, 'share') : null;
    const mapping = createShareFileMapping(deployPlan.files);
    const entryPath = publishedPathForSource(mapping, deployPlan.entryPath);
    if (!entryPath)
        throw new Error('SHARE_ENTRY_MAPPING_UNAVAILABLE');
    const totalBytes = deployPlan.files.reduce((total, file) => total + Buffer.from(file.data).byteLength, 0);
    return {
        files: deployPlan.files,
        mapping,
        entryPath,
        conflictMessage: conflict?.message ?? null,
        summary: {
            fileCount: deployPlan.files.length,
            totalBytes,
            exceedsSizeLimit: totalBytes > SHARE_MAX_TOTAL_BYTES,
            exclusions: [
                ...deployPlan.missing.map((path) => ({ path, reason: 'missing' })),
                ...deployPlan.invalid.map((path) => ({ path, reason: 'invalid' })),
            ],
            ...(conflict ? { blockers: [{ code: 'entry-index-conflict', ...conflict.data }] } : {}),
        },
    };
}
function redactedErrorLogText(value) {
    const text = value instanceof Error
        ? value.message || value.name
        : String(value);
    return redactSecrets(text).slice(0, MAX_ERROR_LOG_FIELD_LENGTH);
}
function errorLogFields(error) {
    const errorName = redactSecrets(error instanceof Error ? error.name : typeof error).slice(0, MAX_ERROR_LOG_FIELD_LENGTH);
    const errorMessage = redactedErrorLogText(error);
    const cause = error && typeof error === 'object' && 'cause' in error
        ? error.cause
        : undefined;
    return {
        errorName,
        errorMessage,
        ...(cause == null
            ? {}
            : { errorCause: redactedErrorLogText(cause) }),
    };
}
function cleanPulledProjectName(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (!trimmed || trimmed === 'index.html')
        return null;
    return trimmed;
}
async function readJsonObject(filePath) {
    try {
        const parsed = JSON.parse(await readFile(filePath, 'utf8'));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
async function inferNameFromSkillManifest(projectDir) {
    const skillsDir = path.join(projectDir, '.od-skills');
    let entries;
    try {
        entries = await readdir(skillsDir);
    }
    catch {
        return null;
    }
    for (const entry of entries) {
        const manifest = await readJsonObject(path.join(skillsDir, entry, 'open-design.json'));
        const title = cleanPulledProjectName(manifest?.title);
        if (title)
            return title;
        const name = cleanPulledProjectName(manifest?.name);
        if (name)
            return name;
    }
    return null;
}
async function inferNameFromHtmlTitle(projectDir) {
    try {
        const html = await readFile(path.join(projectDir, 'index.html'), 'utf8');
        // The document's own <title>, not one an author stored in a script string
        // or an attribute (nexu-io/open-design#7410). Both ends are located by the
        // parser's rules: the open tag through `endOfTag`, so a `>` in a quoted
        // attribute cannot cut it short, and the close by the raw-text rule, so
        // `</title >` closes it while `</title-page>` does not.
        const range = findRealElementRange(html, HTML_TAG_PATTERNS.titleOpen, 'title');
        if (!range)
            return null;
        const raw = html.slice(range.contentStart, range.contentEnd);
        return cleanPulledProjectName(raw.replace(/<[^>]*>/g, ''));
    }
    catch {
        return null;
    }
}
async function resolvePulledProjectName(projectDir, manifest) {
    return cleanPulledProjectName(manifest?.name)
        ?? await inferNameFromSkillManifest(projectDir)
        ?? await inferNameFromHtmlTitle(projectDir)
        ?? PULLED_PROJECT_PLACEHOLDER_NAME;
}
const STATUS_ENRICHMENT_CACHE_LIMIT = 256;
function readLruEntry(cache, key) {
    if (!cache.has(key))
        return undefined;
    const value = cache.get(key);
    cache.delete(key);
    cache.set(key, value);
    return value;
}
function writeLruEntry(cache, key, value) {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > STATUS_ENRICHMENT_CACHE_LIMIT) {
        const oldest = cache.keys().next();
        if (oldest.done)
            return;
        cache.delete(oldest.value);
    }
}
/** Validate Express-decoded route params without interpreting literal percent escapes. */
function normalizePublicFilePath(filePath) {
    // Express decodes each regexp capture once, including encoded separators.
    // Reject unsafe segments rather than normalizing them into a different file.
    if (!filePath ||
        filePath.includes('\\') ||
        filePath.includes('\0') ||
        /^[A-Za-z]:/.test(filePath) ||
        filePath.split('/').some((part) => part === '' || part === '.' || part === '..')) {
        return null;
    }
    return filePath;
}
function publicFilePublicationScope(projectId, filePath, principal) {
    return {
        resourceTeamId: principal.teamId,
        ownerMemberId: principal.memberId,
        projectId,
        filePath,
    };
}
/**
 * The 409 body for a public-file request that has no team workspace behind it.
 *
 * Public links are snapshots in the workspace resource hub, which only a team
 * workspace can address (`workspaceContextHasTeamIdentity`). A personal or
 * signed-out session — and a team session whose context read momentarily fails —
 * lands here. Ship a sentence alongside the code so every surface that is not
 * the web UI (the `od` CLI, embedding agents) states the reason instead of
 * echoing `WORKSPACE_IDENTITY_REQUIRED` at a human. The web UI localizes the
 * code itself; see `publicFilePublishFailureKey` in apps/web.
 */
function workspaceIdentityRequiredBody() {
    return {
        error: 'WORKSPACE_IDENTITY_REQUIRED',
        message: 'Publishing a public link needs a signed-in workspace. Sign in to OpenDesign Cloud, ' +
            'or use Deploy to publish this file without one.',
    };
}
/**
 * Resource-hub principal for the PUBLIC SINGLE-FILE publish routes.
 *
 * These routes deliberately do NOT use `contextToResourceHubPrincipal`, which
 * requires `workspaceContextHasTeamIdentity` and is still exactly right for team
 * project sharing (a shared project needs teammates to share WITH).
 *
 * A public file link needs no such thing. The hub addresses purely by workspace
 * id, and B stopped refusing a personal workspace on its control-key auth path:
 * `authenticateSession` now mints a principal whose `teamId` IS the workspace id
 * — "a partition of one" — and `resolveAccess` only ever compares that id with
 * the resource's own. So the real requirement here is A workspace, not a TEAM
 * workspace: an id to publish under and a member id to own the resource with.
 *
 * A signed-out session still has neither, and is still refused — this widens the
 * gate, it does not remove it. The web UI must gate its entry point on the SAME
 * rule (`canPublishPublicFile` in apps/web/src/collab/public-file-publish.ts);
 * a button that renders where this returns 409 is the bug this pair exists to
 * prevent.
 */
function publicFilePrincipal(context) {
    if (!workspaceContextHasWorkspaceIdentity(context) || !context)
        return null;
    // The predicate above already proved both ids are present; this is the type
    // narrowing TS needs, not a second copy of the rule.
    const { workspaceId, workspaceMemberId } = context;
    if (!workspaceId || !workspaceMemberId)
        return null;
    return {
        memberId: workspaceMemberId,
        // Personal workspaces carry no `teamId`; the workspace id is the scope.
        teamId: context.teamId ?? workspaceId,
        role: context.role,
        lifecycleState: context.lifecycleState,
        workspaceType: context.workspaceType,
    };
}
async function resolveSharedProjectForPublicFile(resolveSharedProject, projectId, context, principal) {
    try {
        return {
            ok: true,
            project: await resolveSharedProject?.(projectId, {
                workspaceId: context.workspaceId,
                resourceTeamId: principal.teamId,
                viewerMemberId: principal.memberId,
                // This is an ownership lookup, not a pull authorization witness. The
                // catalog result below supplies the authoritative owner.
                ownerMemberId: '',
            }) ?? null,
        };
    }
    catch (error) {
        console.warn('[od] failed to resolve public file project ownership:', error);
        return { ok: false };
    }
}
function normalizeWorkspaceVerification(value) {
    if (value && 'ok' in value)
        return value;
    if (value)
        return { ok: true, context: value };
    // Legacy injected test adapters used null as a route-specific denial.
    // Production supplies the structured verifier result above.
    return { ok: true, context: null };
}
function sendWorkspaceVerificationFailure(res, verification) {
    return res.status(verification.status).json({
        error: verification.code,
        message: verification.message,
        ...(verification.retryable ? { retryable: true } : {}),
    });
}
/** A row whose alias cannot form a Viewer address (for example a pre-alias
 * slug) is still a live publication the owner must be able to see and stop,
 * so any fault here degrades to "link unavailable", never an error. */
function presentPublicShareLink(resolve, projectId, slug, amr) {
    const unavailable = { url: null, code: 'PUBLIC_SHARE_WEB_URL_UNAVAILABLE' };
    if (!resolve)
        return unavailable;
    try {
        return resolve(projectId, slug, amr);
    }
    catch {
        return unavailable;
    }
}
export function registerCollabSyncRoutes(app, deps) {
    const { scheduler, publishedVersion, publishedHead, projectSyncState, projectOwnerMemberId, pullLatest, } = deps.collab;
    const { projectStore, resolveProjectDir, resolvePullDir, resolveSharedProjectOwner, resolveSharedProjectOwnerForStatus, resolveSharedProject, markTeamProjectRevoked, isTeamProjectRevoked, markSharedProjectPlaceholder, retireUnmaterializedSharedPlaceholder, invalidateTeamProjectCatalog, resolveOwnerDisplayName, notifyFilesChanged, notifyProjectMetadataChanged, } = deps;
    const readManifest = deps.readManifest ?? readProjectManifest;
    const publicFilePublicationStore = deps.publicFilePublicationStore
        ?? createInMemoryPublicFilePublicationStore();
    const ownerEnrichmentCache = new Map();
    const ownerEnrichmentInFlight = new Map();
    const headEnrichmentCache = new Map();
    const headEnrichmentInFlight = new Map();
    const OWNER_ENRICHMENT_TTL_MS = 30_000;
    const reportPullTiming = (event) => {
        try {
            deps.onPullTiming?.(event);
        }
        catch {
            // Diagnostics are observational and must never affect pull behavior.
        }
    };
    async function verifyWorkspaceContextForRequest(req, projectId, verifier = deps.verifyWorkspaceRequest) {
        if (!verifier) {
            return { ok: true, context: null };
        }
        try {
            return normalizeWorkspaceVerification(await verifier(req, projectId));
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
    function verifiedWorkspaceContextForRequest(req, projectId) {
        return verifyWorkspaceContextForRequest(req, projectId, deps.verifyWorkspaceRequest);
    }
    function verifiedWorkspaceReadContextForRequest(req, projectId) {
        return verifyWorkspaceContextForRequest(req, projectId, deps.verifyWorkspaceReadRequest ?? deps.verifyWorkspaceRequest);
    }
    async function statusIdentityForRequest(projectId, req) {
        const verification = await verifiedWorkspaceReadContextForRequest(req, projectId);
        const context = verification.ok ? verification.context : null;
        return {
            verification,
            context,
            principal: contextToResourceHubPrincipal(context),
            workspaceId: context?.workspaceId?.trim() || null,
        };
    }
    async function pullAccessForRequest(projectId, req, knownOwnerMemberId, capturedIdentity) {
        const verification = capturedIdentity
            ? { ok: true, context: null }
            : await verifiedWorkspaceContextForRequest(req, projectId);
        const context = verification.ok ? verification.context : null;
        const viewerPrincipal = capturedIdentity?.principal ??
            contextToResourceHubPrincipal(context);
        const workspaceId = capturedIdentity
            ? capturedIdentity.workspaceId
            : context?.workspaceId;
        const viewerMemberId = viewerPrincipal?.memberId ?? null;
        let ownerMemberId = knownOwnerMemberId ?? null;
        if (knownOwnerMemberId === undefined) {
            try {
                ownerMemberId =
                    workspaceId && viewerMemberId
                        ? (await resolveSharedProjectOwner?.(projectId, {
                            workspaceId,
                            workspaceMemberId: viewerMemberId,
                        }))
                            ?? projectOwnerMemberId(projectId, viewerPrincipal)
                            ?? null
                        : null;
            }
            catch {
                ownerMemberId = null;
            }
        }
        const resourceTeamId = capturedIdentity
            ? viewerPrincipal?.teamId
            : context?.workspaceType === 'team'
                && context.memberStatus === 'active'
                && context.lifecycleState === 'active'
                && context.workspaceId === workspaceId
                && context.workspaceMemberId === viewerPrincipal?.memberId
                ? context.teamId ?? context.workspaceId
                : null;
        const scope = ownerMemberId &&
            viewerPrincipal &&
            workspaceId &&
            resourceTeamId &&
            (capturedIdentity != null || context?.workspaceType === 'team')
            ? {
                workspaceId,
                resourceTeamId,
                viewerMemberId: viewerPrincipal.memberId,
                ownerMemberId,
            }
            : null;
        const principal = ownerMemberId && viewerPrincipal?.teamId
            ? {
                ...viewerPrincipal,
                ...(scope ? { teamId: scope.resourceTeamId } : {}),
                memberId: ownerMemberId,
                role: ownerMemberId === viewerPrincipal.memberId ? viewerPrincipal.role : 'member',
            }
            : viewerPrincipal;
        const boundScope = scope && deps.resolveTeamProjectResourceId
            ? { ...scope, resourceId: await deps.resolveTeamProjectResourceId(projectId, scope) }
            : scope;
        return { verification, principal, scope: boundScope };
    }
    async function canShareProjectsForRequest(req, verifiedContext) {
        const verification = verifiedContext === undefined
            ? await verifiedWorkspaceContextForRequest(req)
            : { ok: true, context: verifiedContext };
        const context = verification.ok ? verification.context : null;
        return context?.permissions.canShareProjects === true;
    }
    async function verifiedPublishPrincipalForRequest(req, projectId) {
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok) {
            return {
                ok: false,
                status: verification.status,
                error: verification.code,
                message: verification.message,
                ...(verification.retryable ? { retryable: true } : {}),
            };
        }
        const context = verification.context;
        const principal = contextToResourceHubPrincipal(context);
        if (!context
            || !principal
            || context.memberStatus !== 'active'
            || context.lifecycleState !== 'active'
            || !context.permissions.canWriteSyncedFiles) {
            return {
                ok: false,
                status: 403,
                error: 'WORKSPACE_PROJECT_PUBLISH_DENIED',
            };
        }
        let ownerMemberId;
        try {
            ownerMemberId =
                await resolveSharedProjectOwner?.(projectId, {
                    workspaceId: context.workspaceId,
                    workspaceMemberId: context.workspaceMemberId,
                })
                    ?? projectOwnerMemberId(projectId, principal);
        }
        catch {
            return {
                ok: false,
                status: 503,
                error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE',
            };
        }
        if (ownerMemberId !== principal.memberId) {
            return {
                ok: false,
                status: 403,
                error: 'WORKSPACE_PROJECT_PUBLISH_DENIED',
            };
        }
        return { ok: true, principal };
    }
    async function capturedScopeIsStillAuthorized(scope) {
        try {
            return await deps.verifyWorkspaceScope?.(scope) ?? false;
        }
        catch {
            return false;
        }
    }
    async function preparePulledProjectRegistration(projectId, scope, projectDirOverride) {
        if (!projectStore || !resolvePullDir) {
            if (scope)
                throw new Error('team mirror project store unavailable');
            return null;
        }
        const existing = projectStore.get?.(projectId);
        if (!scope) {
            if (!existing && projectStore.has(projectId))
                return null;
            if (existing && cleanPulledProjectName(existing.name) !== PULLED_PROJECT_PLACEHOLDER_NAME)
                return null;
        }
        const projectDir = projectDirOverride ?? resolvePullDir(projectId);
        let manifest = null;
        try {
            manifest = await readManifest(projectDir);
        }
        catch {
            manifest = null;
        }
        return {
            existing: existing ?? null,
            fallbackName: await resolvePulledProjectName(projectDir, manifest),
            manifest,
            now: Date.now(),
            projectId,
        };
    }
    /**
     * Register/refresh the local project record for a just-pulled shared
     * project. This function is deliberately synchronous: a scoped caller does
     * its final authoritative catalog read and workspace-identity check
     * immediately before entering the SQLite transaction, with no ambient
     * metadata await able to reopen a workspace/unshare race in between.
     */
    function registerPreparedPulledProject(prepared, scope, teamProject, receipt, fileReceipt) {
        if (!prepared || !projectStore)
            return false;
        const { existing, fallbackName, manifest, now, projectId } = prepared;
        const input = {
            id: projectId,
            name: cleanPulledProjectName(teamProject?.name) ?? fallbackName,
            skillId: teamProject?.skillId ?? manifest?.skillId ?? null,
            designSystemId: teamProject?.designSystemId ?? manifest?.designSystemId ?? null,
            ...(teamProject?.metadata ? { metadata: teamProject.metadata } : {}),
            createdAt: typeof teamProject?.createdAt === 'number'
                ? teamProject.createdAt
                : typeof manifest?.createdAt === 'number'
                    ? manifest.createdAt
                    : now,
            updatedAt: typeof teamProject?.updatedAt === 'number'
                ? teamProject.updatedAt
                : typeof manifest?.updatedAt === 'number'
                    ? manifest.updatedAt
                    : now,
        };
        if (scope) {
            if (receipt) {
                if (!projectStore.materializeAuthorizedTeamMirror) {
                    throw new Error('authorized team mirror materializer unavailable');
                }
                return projectStore.materializeAuthorizedTeamMirror(input, scope, receipt).localRecordChanged;
            }
            if (!projectStore.materializeTeamMirror) {
                throw new Error('team mirror materializer unavailable');
            }
            return (fileReceipt
                ? projectStore.materializeTeamMirror(input, scope, fileReceipt)
                : projectStore.materializeTeamMirror(input, scope)).localRecordChanged;
        }
        if (existing) {
            if (!projectStore.update)
                return false;
            projectStore.update(input);
            return true;
        }
        projectStore.register(input);
        return true;
    }
    /**
     * Register a minimal placeholder project record the moment a member opens a
     * shared project they don't have locally yet — synchronously, with no hub
     * round-trip. Without it `getProject` fails for the multi-second window before
     * the resource pull materializes the project, and every project route
     * (conversations, events SSE, tabs, files) 404s. The web answers those 404s
     * with retry storms + EventSource reconnects — the request flood that made a
     * shared project take tens of seconds to open. The post-pull
     * `registerPulledProject` overwrites the placeholder name with the real one;
     * this is a no-op once the project is known locally.
     */
    function ensureSharedProjectPlaceholder(projectId) {
        if (!projectStore || projectStore.has(projectId))
            return;
        const now = Date.now();
        projectStore.register({
            id: projectId,
            name: PULLED_PROJECT_PLACEHOLDER_NAME,
            skillId: null,
            designSystemId: null,
            createdAt: now,
            updatedAt: now,
        });
        // Stamp the record as an unmaterialized placeholder so no publish path
        // ever treats its (empty) content directory as content authority until a
        // pull lands real hub content (the recvqzaDvUU6B3 fresh-install wipe
        // guard — see collab/shared-project-placeholder.ts).
        markSharedProjectPlaceholder?.(projectId, true);
    }
    function ensureTeamBoundSharedProjectPlaceholder(projectId, scope) {
        if (!projectStore?.materializeTeamPlaceholder) {
            throw new Error('team placeholder materializer unavailable');
        }
        const existing = projectStore.get?.(projectId) ?? null;
        if (projectStore.has(projectId) && !isUnmaterializedSharedPlaceholder(existing)) {
            return false;
        }
        const now = Date.now();
        projectStore.materializeTeamPlaceholder({
            id: projectId,
            name: PULLED_PROJECT_PLACEHOLDER_NAME,
            skillId: null,
            designSystemId: null,
            createdAt: now,
            updatedAt: now,
        }, scope);
        return true;
    }
    /**
     * Invariant: opening a shared project whose only local record is an
     * unmaterialized placeholder starts that project's content pull on the very
     * request that discovered it — for EVERY viewer, owner or member.
     *
     * Neither side of the product had another way to start it on first open. The
     * web's auto-pull is gated on `publishedVersion` advancing past its cursor,
     * and a fresh daemon's first status response cannot carry a published head:
     * `collab.publishedVersion()` reads an in-process map that has never been
     * written, and the real hub head is fetched fire-and-forget into
     * `headEnrichmentCache` for a LATER poll to consume. So a brand-new member
     * who opened a shared project on a fresh install got a placeholder, an empty
     * file list, and no pull at all — materialization arrived only whenever a
     * proactive lane (hub push / reconnect catch-up / the recovery floor) next
     * fired, which is why the content appeared to show up "only on the second
     * open".
     *
     * Fire-and-forget by design: the pull replaces the whole project tree and
     * must never hold the status response open. Callers surface progress through
     * `awaitingFirstMaterialization` + `contentTransferState` instead.
     */
    function materializePlaceholderOnOpen(projectId, req, viewer) {
        if (!viewer.ownerMemberId)
            return;
        void (async () => {
            // Status may have been authorized by the bounded read lease. Pulling and
            // materializing bytes is a mutation, so deliberately omit the captured
            // status identity and force `pullAccessForRequest` through fresh
            // `verifyWorkspaceRequest` authority.
            const { principal: resourcePrincipal, scope } = await pullAccessForRequest(projectId, req, viewer.ownerMemberId);
            if (!scope)
                return;
            try {
                if (scope.ownerMemberId === scope.viewerMemberId && deps.ownedContentSync) {
                    const update = await deps.ownedContentSync.request({ projectId, ...scope }, { action: 'check' }, undefined, true);
                    if (update.state !== 'up_to_date' || update.latestVersion != null || update.localVersion != null)
                        return;
                }
                await pullSharedProjectCoalesced(projectId, resourcePrincipal, scope);
            }
            catch (error) {
                // Retracted-share heal (飞书 recvqA6qhV7St1): the catalog names this
                // caller as the project's owner, yet the published pull answered
                // `resource_not_found` — the hub's tombstone gate. A live share can
                // never produce that pair; it is the hub-authoritative signature of a
                // HALF-LANDED retraction: an unshare's `resource remove` landed but
                // its `team-projects remove` did not, leaving a dangling catalog row.
                // On a fresh data root there is no `cloudTombstonedAt` left to
                // suppress it, so the retracted project revives as a ghost team card
                // for every member (reproduced live on the feature-test hub,
                // 2026-07-27). Finish the retraction from the hub's own state instead
                // of trusting local memory: complete the catalog removal (unpublish is
                // idempotent against the tombstone), retire the contentless
                // placeholder this open registered, and drop the cached listing.
                //
                // Owner-only: retracting a share is the sharer's action. A member who
                // hits the same tombstone has merely lost access and must not unshare
                // anyone's project on their behalf.
                if (!viewer.callerIsOwner)
                    throw error;
                if (!isRetractedHubResourceError(error))
                    throw error;
                if (!projectStore?.get ||
                    !isUnmaterializedSharedPlaceholder(projectStore.get(projectId)))
                    return;
                await deps.collab.forgetTeamShare?.(projectId, resourcePrincipal);
                retireUnmaterializedSharedPlaceholder?.(projectId);
                invalidateTeamProjectCatalog?.();
            }
        })().catch(() => undefined);
    }
    app.post('/api/projects/:id/collab/changed', async (req, res) => {
        const projectId = req.params.id;
        const authorization = await verifiedPublishPrincipalForRequest(req, projectId);
        if (!authorization.ok) {
            return res.status(authorization.status).json({
                error: authorization.error,
                ...(authorization.message ? { message: authorization.message } : {}),
                ...(authorization.retryable ? { retryable: true } : {}),
            });
        }
        scheduler.notifyChanged(projectId, 'change', authorization.principal);
        return res.json({ ok: true });
    });
    app.post('/api/projects/:id/collab/publish', async (req, res) => {
        const projectId = req.params.id;
        const authorization = await verifiedPublishPrincipalForRequest(req, projectId);
        if (!authorization.ok) {
            return res.status(authorization.status).json({
                error: authorization.error,
                ...(authorization.message ? { message: authorization.message } : {}),
                ...(authorization.retryable ? { retryable: true } : {}),
            });
        }
        scheduler.notifyChanged(projectId, 'run', authorization.principal);
        scheduler.runBoundary(projectId, authorization.principal);
        return res.json({ ok: true });
    });
    app.post(/^\/api\/projects\/([^/]+)\/files\/(.+)\/share-plan$/u, async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        // SAFETY: Express regex routes expose numeric capture keys at runtime; Express's named-param type omits them.
        const params = req.params;
        const projectId = String(params[0] ?? '');
        const filePath = normalizePublicFilePath(String(params[1] ?? ''));
        if (!projectId || !filePath)
            return res.status(400).json({ error: 'invalid_file_path' });
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok)
            return sendWorkspaceVerificationFailure(res, verification);
        const context = verification.context;
        const principal = publicFilePrincipal(context);
        if (!context || !principal)
            return res.status(409).json(workspaceIdentityRequiredBody());
        if (!await canShareProjectsForRequest(req, context))
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_SHARE_DENIED' });
        const resolved = await resolveSharedProjectForPublicFile(resolveSharedProject, projectId, context, principal);
        if (!resolved.ok)
            return res.status(503).json({ error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE' });
        const owner = resolved.project?.ownerMemberId
            ?? (!resolved.project ? deps.resolveLocalPublicShareOwner?.(projectId, context.workspaceId) : null);
        if (!owner || owner !== principal.memberId || isUnmaterializedSharedPlaceholder(projectStore?.get?.(projectId))) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
        }
        if (!resolveProjectDir)
            return res.status(500).json({ error: 'PROJECT_DIR_UNAVAILABLE' });
        try {
            const plan = await buildSharePlan(await resolveProjectDir(projectId), filePath, projectStore?.get?.(projectId)?.metadata);
            return res.json(plan.summary);
        }
        catch (error) {
            const code = error?.code;
            return res.status(code === 'ENOENT' ? 404 : 400).json({ error: code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'FILE_UNAVAILABLE' });
        }
    });
    app.post(/^\/api\/projects\/([^/]+)\/files\/(.+)\/publish-public$/u, publicFileMutationHandler(deps.publicFileMutations, async (req, res) => {
        const startedAt = Date.now();
        const requestId = clientRequestIdFor(req);
        // SAFETY: these RegExp routes expose numeric capture keys; Express types model named keys only.
        const params = req.params;
        const projectId = String(params[0] ?? '');
        const filePath = normalizePublicFilePath(String(params[1] ?? ''));
        if (!projectId || !filePath) {
            return res.status(400).json({ error: 'invalid_file_path' });
        }
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        const verifiedContext = verification.context;
        const principal = publicFilePrincipal(verifiedContext);
        if (!verifiedContext || !principal) {
            return res.status(409).json(workspaceIdentityRequiredBody());
        }
        if (!await canShareProjectsForRequest(req, verifiedContext)) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_SHARE_DENIED' });
        }
        const sharedProjectResult = await resolveSharedProjectForPublicFile(resolveSharedProject, projectId, verifiedContext, principal);
        if (!sharedProjectResult.ok) {
            return res.status(503).json({ error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE' });
        }
        let sharedProject = sharedProjectResult.project;
        const needsCatalog = sharedProject === null;
        const owner = sharedProject?.ownerMemberId
            ?? (needsCatalog ? deps.resolveLocalPublicShareOwner?.(projectId, verifiedContext.workspaceId) : null);
        // An inbound placeholder is not local content authority, even for the same owner.
        if (!owner || owner !== principal.memberId || isUnmaterializedSharedPlaceholder(projectStore?.get?.(projectId))) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
        }
        const publisher = deps.sharePublishing;
        if (!publisher)
            return res.status(503).json({ error: 'PUBLIC_SHARE_PUBLISH_UNAVAILABLE' });
        const scope = publicFilePublicationScope(projectId, filePath, principal);
        if (publisher.sourceFileId)
            scope.sourceFileId = publisher.sourceFileId(scope, sharedProject);
        // A stopped link cannot be reopened by the ordinary publish/update POST:
        // that path advances the alias and transfers fresh bytes. Only an explicit
        // request may reopen the immutable generation previously bound by Vela.
        const requestBody = req.body;
        if (requestBody != null && (typeof requestBody !== 'object' || Array.isArray(requestBody)
            || Object.keys(requestBody).some(key => key !== 'mode'))) {
            return res.status(400).json({ error: 'INVALID_SHARE_PUBLISH_REQUEST' });
        }
        const mode = requestBody?.mode;
        if (mode !== undefined && mode !== 'resume')
            return res.status(400).json({ error: 'INVALID_SHARE_PUBLISH_REQUEST' });
        if (mode === 'resume') {
            const diagnose = (status, errorCode, stage = 'resume_guard') => {
                logPublicShareDiagnostic({ operation: 'resume', stage, status, errorCode, requestId, startedAt });
            };
            const fail = (status, errorCode, stage) => {
                diagnose(status, errorCode, stage);
                return res.status(status).json({ error: errorCode });
            };
            const remoteState = await deps.readProjectShareState?.(scope).catch(() => null);
            if (!remoteState || remoteState.projectId !== projectId) {
                return fail(503, 'SHARE_STATE_UNAVAILABLE', 'remote_state');
            }
            let candidate;
            try {
                candidate = currentFileSharePublication(remoteState, filePath, scope.sourceFileId);
            }
            catch (error) {
                if (error instanceof UnboundFileShareIdentityError)
                    return fail(409, 'SHARE_FILE_IDENTITY_UNAVAILABLE');
                throw error;
            }
            const stopped = candidate?.status === 'stopped' ? candidate : undefined;
            const localRevision = publicFilePublicationStore.getRevision(scope);
            if (!stopped || (localRevision && localRevision.slug !== stopped.slug)) {
                return fail(409, 'SHARE_RESUME_NOT_STOPPED');
            }
            const stopQueue = publicFilePublicationStore.listStops?.();
            if (!stopQueue)
                return fail(503, 'PUBLIC_SHARE_STOP_STATE_UNAVAILABLE');
            if (stopQueue.some(item => item.resourceTeamId === scope.resourceTeamId
                && item.ownerMemberId === scope.ownerMemberId && item.projectId === projectId
                && item.filePath === filePath && item.slug === stopped.slug)) {
                return fail(409, 'SHARE_STOP_IN_PROGRESS');
            }
            try {
                const reservation = reserveFileShareAlias({ scope, history: remoteState, reservations: publisher.reservations,
                    publications: publicFilePublicationStore, outbox: publisher.outbox });
                if (reservation.slug !== stopped.slug) {
                    return fail(409, 'SHARE_ALIAS_IDENTITY_MISMATCH');
                }
                const prepared = await publisher.prepare(scope, stopped.slug);
                // The remote stopped witness outranks a matching local revision left
                // by a crash after Vela stopped but before OD committed the deletion.
                // CAS prevents a concurrent new publication from being discarded.
                if (localRevision && !publicFilePublicationStore.deleteIfRevisionMatches(scope, localRevision)) {
                    return fail(409, 'SHARE_RESUME_NOT_STOPPED');
                }
                let resumedShare;
                try {
                    resumedShare = await resumeExistingVelaShare(scope, stopped.slug, prepared.run);
                }
                catch {
                    // A lost/invalid command reply may follow a successful remote alias
                    // activation. Revoke the exact Owner-verified alias before reporting
                    // a routine retryable failure; otherwise require explicit revocation.
                    try {
                        await stopVelaShare(projectId, stopped.slug, prepared.run);
                        return fail(502, 'PUBLIC_SHARE_RESUME_UNAVAILABLE', 'resume_command');
                    }
                    catch {
                        const after = await deps.readProjectShareState?.(scope).catch(() => null);
                        if (after?.projectId === projectId && after.publications.some(item => item.sourceFilePath === filePath
                            && item.slug === stopped.slug && item.status === 'stopped')) {
                            return fail(502, 'PUBLIC_SHARE_RESUME_UNAVAILABLE', 'resume_command');
                        }
                        diagnose(502, 'PUBLIC_FILE_MANUAL_REVOKE_REQUIRED', 'resume_command');
                        return res.status(502).json({ error: {
                                code: 'PUBLIC_FILE_MANUAL_REVOKE_REQUIRED',
                                message: 'The original link may have resumed without a confirmed receipt. Stop the link explicitly using od project share stop before retrying.',
                                data: { projectId, slug: stopped.slug, fileName: filePath,
                                    url: presentPublicShareLink(deps.resolvePublicShareLink, projectId, stopped.slug, null).url },
                            } });
                    }
                }
                const { receipt, amrLink } = resumedShare;
                // Persist only the address AMR reported (verified), as for a publish.
                const publication = { url: persistedAmrShareUrl(amrLink), slug: stopped.slug, fileName: filePath };
                let outcome;
                try {
                    // Entry path is Vela's saved generation, never a plan from current
                    // local bytes. This also queues existing local comments atomically.
                    outcome = publisher.complete({ scope, resourceId: publicFileResourceIdFor(scope), publication,
                        mapping: [{ sourcePath: filePath, publishedPath: receipt.entryPath }],
                        result: { status: 'published', receipt }, reopened: true });
                }
                catch {
                    // Local commit failed AFTER the old link was made public. Restore the
                    // stopped state before reporting failure; otherwise a later resume
                    // would be rejected while the old link remains anonymously live.
                    try {
                        await stopVelaShare(projectId, stopped.slug, prepared.run);
                        return fail(502, 'PUBLIC_SHARE_RESUME_RECORD_UNAVAILABLE', 'resume_record');
                    }
                    catch {
                        // If compensation also fails, the normal owner DELETE can revoke
                        // via the remote project/file/slug witness even without a local row.
                        diagnose(502, 'PUBLIC_FILE_MANUAL_REVOKE_REQUIRED', 'resume_record');
                        return res.status(502).json({ error: {
                                code: 'PUBLIC_FILE_MANUAL_REVOKE_REQUIRED',
                                message: 'The original link was resumed remotely but local metadata could not be saved; stop the link explicitly using od project share stop.',
                                data: { projectId, ...publication,
                                    url: presentPublicShareLink(deps.resolvePublicShareLink, projectId, stopped.slug, amrLink).url, receipt },
                            } });
                    }
                }
                // Resume reopens Vela's saved version of this alias, i.e. the bytes the
                // last confirmed publish fingerprinted. Carry that evidence to the new
                // local revision so later edits read as outdated, not unknown
                // (OPEND-3517). Advisory only: failure leaves the resumed link intact.
                if (deps.shareContentFingerprints) {
                    try {
                        const revision = publicFilePublicationStore.getRevision(scope);
                        if (revision?.slug === stopped.slug)
                            deps.shareContentFingerprints.rebind(scope, revision);
                    }
                    catch {
                        console.warn('[od] public file content fingerprint unavailable');
                    }
                }
                return res.json(sharePublishResponse(outcome, presentPublicShareLink(deps.resolvePublicShareLink, projectId, stopped.slug, amrLink)));
            }
            catch (error) {
                if (error instanceof ShareAliasIdentityMismatchError)
                    return fail(409, error.message);
                return fail(502, 'PUBLIC_SHARE_RESUME_UNAVAILABLE', 'resume_prepare');
            }
        }
        // The plan is built, and refused on size or blockers, before the alias is
        // reserved or Vela is contacted: an unpublishable file must not cost a
        // network round-trip or leave a reservation behind.
        if (!resolveProjectDir) {
            return res.status(500).json({ error: 'PROJECT_DIR_UNAVAILABLE' });
        }
        const projectDir = await resolveProjectDir(projectId);
        let sharePlan;
        try {
            sharePlan = await buildSharePlan(projectDir, filePath, projectStore?.get?.(projectId)?.metadata);
        }
        catch (error) {
            const code = error?.code;
            return res.status(code === 'ENOENT' ? 404 : 400).json({
                error: code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'FILE_UNAVAILABLE',
            });
        }
        if (sharePlan.summary.exceedsSizeLimit) {
            return res.status(413).json({
                error: 'too_large',
                plan: sharePlan.summary,
                bytes: sharePlan.summary.totalBytes,
                totalBytes: sharePlan.summary.totalBytes,
                limit: SHARE_MAX_TOTAL_BYTES,
            });
        }
        const blocker = sharePlan.summary.blockers?.[0];
        if (blocker) {
            const { code: _blockerCode, ...data } = blocker;
            return res.status(409).json({
                error: { code: SHARE_ENTRY_INDEX_CONFLICT, message: sharePlan.conflictMessage ?? '', data },
                plan: sharePlan.summary,
            });
        }
        // Read history BEFORE reservation: missing local state is not evidence of
        // a first share. Recover the exact cloud alias before preparing any write.
        // Unknown or pre-existing aliases must never be auto-stopped on a local failure.
        const previousState = await deps.readProjectShareState?.(scope).catch(() => null) ?? null;
        if (!previousState || previousState.projectId !== projectId) {
            return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
        }
        let prepared;
        let reservation;
        try {
            reservation = reserveFileShareAlias({ scope, history: previousState, reservations: publisher.reservations,
                publications: publicFilePublicationStore, outbox: publisher.outbox });
            prepared = await publisher.prepare(scope, reservation.slug);
        }
        catch (error) {
            if (error instanceof UnboundFileShareIdentityError)
                return res.status(409).json({ error: 'SHARE_FILE_IDENTITY_UNAVAILABLE' });
            if (error instanceof ShareAliasIdentityMismatchError)
                return res.status(409).json({ error: error.message });
            return res.status(502).json({ error: 'PUBLIC_SHARE_PREPARATION_UNAVAILABLE' });
        }
        const stoppedSlug = previousState?.projectId === projectId
            ? previousState.publications.find(item => item.sourceFilePath === filePath && item.status === 'stopped'
                && (!scope.sourceFileId || item.sourceFileId === scope.sourceFileId)
                && item.slug === reservation.slug)?.slug
            : undefined;
        const resumed = await resumePendingShareBinding(scope, publicFilePublicationStore, publisher.outbox, prepared.run, stoppedSlug);
        if (resumed) {
            return res.json(sharePublishResponse(resumed, presentPublicShareLink(deps.resolvePublicShareLink, projectId, resumed.receipt.slug, resumed.amrLink ?? null)));
        }
        // Vela refuses a plain publish to a stopped binding (409
        // share_binding_stopped). Refuse before uploading; reopening the original
        // link is the explicit `{ mode: 'resume' }` request (OPEND-3510).
        if (stoppedSlug) {
            return res.status(409).json({ error: 'SHARE_STOPPED_RESUME_REQUIRED' });
        }
        // Policy/bootstrap and association are mutations too: a refused stopped
        // publish must not reach them. Recovery above reuses its existing binding.
        if (needsCatalog) {
            try {
                if (!publisher.ensureProject)
                    throw new Error('project bootstrap unavailable');
                sharedProject = await publisher.ensureProject(scope, principal, prepared.run);
            }
            catch (error) {
                logPublicShareDiagnostic({ operation: 'bootstrap', status: 503,
                    errorCode: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE', requestId, startedAt,
                    ...publicShareProjectBootstrapDiagnostic(error) });
                return res.status(503).json({ error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE' });
            }
            if (sharedProject.projectId !== projectId || sharedProject.ownerMemberId !== principal.memberId) {
                return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
            }
        }
        // Associate even legacy selected resources; catalog presence is not proof
        // of that relationship. The pinned session must ACK before any file bytes.
        try {
            await registerVelaTeamProjectResource(projectId, publicFileResourceIdFor(scope), prepared.run);
        }
        catch {
            return res.status(503).json({ error: 'PUBLIC_SHARE_RESOURCE_REGISTRATION_UNAVAILABLE' });
        }
        const resourceId = publicFileResourceIdFor(scope);
        const tempDir = await mkdtemp(path.join(os.tmpdir(), 'od-public-file-'));
        let stage = 'push';
        try {
            await stageShareFiles(tempDir, sharePlan.files);
            const metadata = {
                source: 'open-design',
                projectId,
                fileName: filePath,
            };
            const pushOutput = await prepared.run([
                'resource', 'push',
                PUBLIC_FILE_RESOURCE_KIND,
                resourceId,
                tempDir,
                '--ref',
                PUBLIC_FILE_REF,
                '--metadata-json',
                JSON.stringify(metadata),
                '--json',
            ]);
            const versionId = parseVelaPushVersionId(pushOutput);
            await publisher.admitFileReceipt?.(scope, resourceId, versionId, sharePlan.entryPath, prepared.run);
            stage = 'snapshot';
            const result = await publishReservedVelaShareVersion({
                scope, resourceId, versionId, entryPath: sharePlan.entryPath,
                name: path.basename(filePath),
            }, publisher.reservations, prepared.run);
            // Persist only the address AMR reported (verified); an override is a
            // presentation choice and is re-applied on every read instead.
            let amrLink = result.amrLink ?? null;
            const publication = {
                url: persistedAmrShareUrl(amrLink), slug: result.receipt.slug, fileName: filePath,
            };
            let outcome;
            stage = 'persist';
            try {
                outcome = publisher.complete({ scope, resourceId, publication, mapping: sharePlan.mapping, result });
            }
            catch {
                if (previousState?.projectId === projectId && !previousState.publications.some(item => item.slug === result.receipt.slug)) {
                    try {
                        await stopVelaShare(projectId, result.receipt.slug, prepared.run);
                        const failure = { stage, reason: 'internal' };
                        logPublicFileFailure({
                            action: 'publish', errorCode: 'PUBLIC_FILE_PUBLISH_UNAVAILABLE', failure, requestId, startedAt,
                        });
                        return res.status(502).json({ error: 'PUBLIC_FILE_PUBLISH_UNAVAILABLE', failure });
                    }
                    catch { /* Remote publication may still be accessible: never hide it. */ }
                }
                const manualUrl = presentPublicShareLink(deps.resolvePublicShareLink, projectId, result.receipt.slug, amrLink).url;
                return res.status(502).json({ error: {
                        code: 'PUBLIC_FILE_MANUAL_REVOKE_REQUIRED',
                        message: `Publication metadata could not be saved; the public share may remain accessible${manualUrl ? ` at ${manualUrl}` : ''}. Use od project share stop to revoke it explicitly.`,
                        data: { ...publication, url: manualUrl, projectId, receipt: result.receipt },
                    } });
            }
            // Register/bind must never revive a stopped link. This foreground owner
            // request alone carries explicit resume intent for the observed alias.
            if (outcome.status === 'binding_pending' && stoppedSlug === outcome.receipt.slug) {
                const resumedOutcome = await resumePendingShareBinding(scope, publicFilePublicationStore, publisher.outbox, prepared.run, stoppedSlug);
                if (resumedOutcome) {
                    outcome = resumedOutcome;
                    amrLink = resumedOutcome.amrLink ?? amrLink;
                }
            }
            const response = sharePublishResponse(outcome, presentPublicShareLink(deps.resolvePublicShareLink, projectId, outcome.receipt.slug, amrLink));
            if (response.status === 'binding_pending' && response.binding.retrying) {
                try {
                    publisher.retry();
                }
                catch {
                    response.binding = { retrying: false, code: 'SHARE_BINDING_RETRY_UNAVAILABLE' };
                }
            }
            // This evidence is advisory, unlike the publication itself. Failure must
            // leave the confirmed link intact; reads without evidence say unknown.
            if (deps.shareContentFingerprints) {
                try {
                    const scope = publicFilePublicationScope(projectId, filePath, principal);
                    const revision = publicFilePublicationStore.getRevision(scope);
                    if (revision?.slug === publication.slug) {
                        deps.shareContentFingerprints.remember(scope, revision, sharePlan.files);
                    }
                }
                catch {
                    console.warn('[od] public file content fingerprint unavailable');
                }
            }
            return res.json(response);
        }
        catch (error) {
            console.warn('[od] failed to publish public project file:', error);
            const failure = stage === 'persist'
                ? { stage, reason: 'internal' }
                : classifyVelaCommandFailure(stage, error);
            logPublicFileFailure({
                action: 'publish', errorCode: 'PUBLIC_FILE_PUBLISH_UNAVAILABLE', failure, requestId, startedAt,
            });
            return res.status(502).json({ error: 'PUBLIC_FILE_PUBLISH_UNAVAILABLE', failure });
        }
        finally {
            await rm(tempDir, { recursive: true, force: true }).catch(() => { });
        }
    }));
    app.delete(/^\/api\/projects\/([^/]+)\/files\/(.+)\/publish-public$/u, publicFileMutationHandler(deps.publicFileMutations, async (req, res) => {
        const startedAt = Date.now();
        const requestId = clientRequestIdFor(req);
        // SAFETY: these RegExp routes expose numeric capture keys; Express types model named keys only.
        const params = req.params;
        const projectId = String(params[0] ?? '');
        const filePath = normalizePublicFilePath(String(params[1] ?? ''));
        const slug = typeof req.body?.slug === 'string'
            ? req.body.slug.trim()
            : '';
        if (!projectId || !filePath || !slug) {
            return res.status(400).json({ error: 'invalid_public_file' });
        }
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        const verifiedContext = verification.context;
        const principal = publicFilePrincipal(verifiedContext);
        if (!verifiedContext || !principal) {
            return res.status(409).json(workspaceIdentityRequiredBody());
        }
        if (!await canShareProjectsForRequest(req, verifiedContext)) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_SHARE_DENIED' });
        }
        const sharedProjectResult = await resolveSharedProjectForPublicFile(resolveSharedProject, projectId, verifiedContext, principal);
        if (!sharedProjectResult.ok) {
            return res.status(503).json({ error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE' });
        }
        const sharedProject = sharedProjectResult.project;
        if (sharedProject?.ownerMemberId && sharedProject.ownerMemberId !== principal.memberId) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
        }
        const scope = publicFilePublicationScope(projectId, filePath, principal);
        const revision = publicFilePublicationStore.getRevision(scope);
        if (revision && revision.slug !== slug)
            return res.status(404).json({ error: 'PUBLIC_SHARE_NOT_FOUND' });
        if (!deps.sharePublishing)
            return res.status(503).json({ error: 'PUBLIC_SHARE_STOP_UNAVAILABLE' });
        if (!revision) {
            if (!sharedProject || sharedProject.ownerMemberId !== principal.memberId) {
                return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
            }
            // A resumed alias may be active in Vela even if the OD transaction that
            // recorded it failed. Permit only the verified Owner to revoke the exact
            // project/file/slug that Vela itself reports as active. Never use this
            // exception to stop a different locally witnessed publication.
            const remoteState = await deps.readProjectShareState?.(scope).catch(() => null);
            if (!remoteState || remoteState.projectId !== projectId)
                return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
            if (!remoteState.publications.some(item => item.sourceFilePath === filePath && item.slug === slug && item.status === 'active')) {
                return res.status(404).json({ error: 'PUBLIC_SHARE_NOT_FOUND' });
            }
        }
        try {
            const prepared = await deps.sharePublishing.prepare(scope, slug);
            const stopped = JSON.parse(await prepared.run([
                'share', 'stop', slug, '--project-id', projectId, '--json',
            ]));
            if (!stopped || typeof stopped !== 'object' || !('status' in stopped) || stopped.status !== 'stopped'
                || !('slug' in stopped) || stopped.slug !== slug || !('projectId' in stopped) || stopped.projectId !== projectId) {
                throw new Error('PUBLIC_SHARE_STOP_UNCONFIRMED');
            }
            if (revision?.slug === slug) {
                publicFilePublicationStore.deleteIfRevisionMatches(scope, revision);
            }
            const response = { ok: true, slug, fileName: filePath };
            return res.json(response);
        }
        catch (error) {
            console.warn('[od] failed to unpublish public project file:', error);
            const failure = classifyVelaCommandFailure('redact', error);
            logPublicFileFailure({
                action: 'unpublish', errorCode: 'PUBLIC_FILE_UNPUBLISH_UNAVAILABLE', failure, requestId, startedAt,
            });
            return res.status(502).json({ error: 'PUBLIC_FILE_UNPUBLISH_UNAVAILABLE', failure });
        }
    }));
    app.get('/api/projects/:id/share-state', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        const projectId = String(req.params.id);
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok)
            return sendWorkspaceVerificationFailure(res, verification);
        const context = verification.context;
        const principal = publicFilePrincipal(context);
        if (!context || !principal)
            return res.status(409).json(workspaceIdentityRequiredBody());
        if (!deps.readProjectShareState)
            return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
        try {
            const state = await deps.readProjectShareState({ projectId, resourceTeamId: principal.teamId, ownerMemberId: principal.memberId });
            // The history DTO names lifecycle only; addresses go through the file read.
            const response = {
                projectId: state.projectId, bindingExists: state.bindingExists, hasEverShared: state.hasEverShared,
                publications: state.publications.map(({ sourceFilePath, sourceFileId, slug, status }) => ({ sourceFilePath, ...(sourceFileId ? { sourceFileId } : {}), slug, status })),
            };
            return res.json(response);
        }
        catch {
            return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
        }
    });
    app.get(/^\/api\/projects\/([^/]+)\/files\/(.+)\/publish-public$/u, async (req, res) => {
        const startedAt = Date.now();
        const requestId = clientRequestIdFor(req);
        res.setHeader('Cache-Control', 'no-store');
        // SAFETY: these RegExp routes expose numeric capture keys; Express types model named keys only.
        const params = req.params;
        const projectId = String(params[0] ?? '');
        const filePath = normalizePublicFilePath(String(params[1] ?? ''));
        if (!projectId || !filePath) {
            return res.status(400).json({ error: 'invalid_file_path' });
        }
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        const verifiedContext = verification.context;
        const principal = publicFilePrincipal(verifiedContext);
        if (!verifiedContext || !principal) {
            return res.status(409).json(workspaceIdentityRequiredBody());
        }
        if (!await canShareProjectsForRequest(req, verifiedContext)) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_SHARE_DENIED' });
        }
        const sharedProjectResult = await resolveSharedProjectForPublicFile(resolveSharedProject, projectId, verifiedContext, principal);
        if (!sharedProjectResult.ok) {
            return res.status(503).json({ error: 'WORKSPACE_PROJECT_OWNERSHIP_UNAVAILABLE' });
        }
        const sharedProject = sharedProjectResult.project;
        if (sharedProject?.ownerMemberId && sharedProject.ownerMemberId !== principal.memberId) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PUBLISH_DENIED' });
        }
        const scope = publicFilePublicationScope(projectId, filePath, principal);
        // Advisory freshness must use exactly the same planner as upload, including
        // rewritten entry and dependencies. Unavailable bytes never mean no share.
        let freshness = 'unknown';
        if (deps.shareContentFingerprints && resolveProjectDir) {
            try {
                const plan = await buildSharePlan(await resolveProjectDir(projectId), filePath, projectStore?.get?.(projectId)?.metadata);
                // A blocked plan is not what would be published; do not compare it.
                if (!plan.summary.blockers?.length)
                    freshness = deps.shareContentFingerprints.compare(scope, plan.files);
            }
            catch {
                // Keep publication visibility independent from failed comparison.
            }
        }
        if (!deps.readProjectShareState) {
            logPublicShareDiagnostic({ operation: 'state_read', stage: 'remote_state', status: 503,
                errorCode: 'SHARE_STATE_UNAVAILABLE', requestId, startedAt });
            return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
        }
        // A stored `url` is the last AMR address; it only ever reaches a response
        // through the link rule, which re-verifies it (a legacy console URL fails).
        const present = (record, amr) => {
            const link = presentPublicShareLink(deps.resolvePublicShareLink, projectId, record.slug, amr);
            return link.url !== null
                ? { publication: { ...record, url: link.url } }
                : { publication: null, link: { status: 'unavailable', code: link.code }, slug: record.slug };
        };
        let history;
        try {
            history = await deps.readProjectShareState(scope);
        }
        catch {
            // The lifecycle source did not answer (offline, signed out, AMR down).
            // A persisted publication is still the best-known link: show it, marked
            // stale, so the panel keeps working offline. Without one there is
            // nothing to say — a request that did not answer is not "none".
            const local = publicFilePublicationStore.get(scope);
            // A queued stop means the owner already asked to end this share: never
            // offer its link as live, even as a stale best guess.
            const stopPending = local && 'listStops' in publicFilePublicationStore
                && publicFilePublicationStore.listStops().some(stop => stop.resourceTeamId === scope.resourceTeamId && stop.ownerMemberId === scope.ownerMemberId
                    && stop.projectId === scope.projectId && stop.filePath === scope.filePath && stop.slug === local.slug);
            const staleFallback = Boolean(local && !stopPending);
            logPublicShareDiagnostic({ operation: 'state_read', stage: 'remote_state', status: staleFallback ? 200 : 503,
                errorCode: 'SHARE_STATE_UNAVAILABLE', requestId, startedAt, staleFallback });
            if (!local || stopPending)
                return res.status(503).json({ error: 'SHARE_STATE_UNAVAILABLE' });
            const response = {
                ...present(local, local.url), status: 'active', freshness, stale: true,
            };
            return res.json(response);
        }
        const sourceFileId = deps.sharePublishing?.sourceFileId?.(scope, sharedProject);
        let remote;
        try {
            remote = currentFileSharePublication(history, filePath, sourceFileId);
        }
        catch (error) {
            if (error instanceof UnboundFileShareIdentityError)
                return res.status(409).json({ error: 'SHARE_FILE_IDENTITY_UNAVAILABLE' });
            throw error;
        }
        let local = publicFilePublicationStore.get(scope);
        // A row that outlived a stop made elsewhere is not a live publication:
        // the owner should see the stopped state (and resume), not a dead link.
        const live = local && remote && local.slug === remote.slug && remote.status === 'active';
        if (local && remote && live && remote.amrLink) {
            // Every successful status read refreshes the persisted AMR address, so a
            // legacy stored console URL is replaced on the first online read and a
            // changed share-shell origin is picked up without republishing.
            const url = persistedAmrShareUrl(remote.amrLink);
            if (local.url !== url) {
                try {
                    if (publicFilePublicationStore.updateLink(scope, local.slug, url))
                        local = { ...local, url };
                }
                catch {
                    console.warn('[od] share link persistence unavailable');
                }
            }
        }
        const response = {
            ...(local && live ? present(local, remote?.amrLink ?? local.url) : { publication: null }),
            status: remote?.status ?? 'none',
            freshness,
        };
        return res.json(response);
    });
    app.post('/api/projects/:id/collab/sync-intent', async (req, res) => {
        const event = req.body?.event;
        if (typeof event !== 'string' || !SYNC_INTENT_EVENTS.has(event)) {
            return res.status(400).json({ error: 'invalid sync intent event' });
        }
        const projectId = req.params.id;
        const verification = await verifiedWorkspaceContextForRequest(req, projectId);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        const context = verification.context;
        const principal = contextToResourceHubPrincipal(context);
        if (event === 'project_team_share_requested' || event === 'project_team_unshare_requested') {
            return res.status(409).json({ error: 'PROJECT_VISIBILITY_REQUIRES_MOVE' });
        }
        res.json({ ok: true, syncState: projectSyncState(projectId, principal) });
    });
    /**
     * The one shared-project content pull flow, shared verbatim between
     * `POST /api/projects/:id/collab/pull` and the daemon-internal handle
     * (`CollabSyncRoutesHandle.pullSharedProject`, driven by the hub push
     * channel's proactive pull). Extracted so the two entry points cannot
     * drift: revocation gate → hub pull → register-on-pull → post-pull
     * signals, in that order.
     */
    async function pullSharedProjectOnce(projectId, principal, capturedScope, authorizationWitness, expectedVersion, authorizedStageInvocation) {
        const scope = capturedScope && deps.resolveTeamProjectResourceId
            ? { ...capturedScope, resourceId: await deps.resolveTeamProjectResourceId(projectId, capturedScope) }
            : capturedScope;
        const profileReceivedAtMs = authorizedStageInvocation?.profileReceivedAtMs;
        const reportAuthorizedPullTiming = (phase, status, version = expectedVersion) => {
            reportPullTiming({
                phase,
                projectId,
                ...(version != null ? { version } : {}),
                ...(profileReceivedAtMs != null
                    ? { receivedAtMs: profileReceivedAtMs }
                    : {}),
                atMs: Date.now(),
                ...(status ? { status } : {}),
            });
        };
        reportPullTiming({
            phase: 'route-started',
            projectId,
            ...(expectedVersion != null ? { version: expectedVersion } : {}),
            ...(profileReceivedAtMs != null
                ? { receivedAtMs: profileReceivedAtMs }
                : {}),
            atMs: Date.now(),
        });
        let terminalStatus = 'threw';
        let terminalVersion;
        const complete = (outcome) => {
            terminalStatus = outcome.status;
            if (outcome.status === 'pulled' && outcome.version != null) {
                terminalVersion = outcome.version;
            }
            return outcome;
        };
        try {
            let authoritativeSharedProject = null;
            let authorizedCapabilityFallbackVersion = null;
            const authorizedPull = deps.authorizedTeamProjectPull;
            const hasStageInvocation = authorizedStageInvocation !== undefined;
            const hasAuthorizedStageBrand = Boolean(scope &&
                isBoundProactivePullInvocation(authorizedStageInvocation, {
                    projectId,
                    workspaceId: scope.workspaceId,
                    resourceTeamId: scope.resourceTeamId,
                    viewerMemberId: scope.viewerMemberId,
                    ownerMemberId: scope.ownerMemberId,
                }, expectedVersion));
            if (hasStageInvocation && !hasAuthorizedStageBrand) {
                return complete({ status: 'register_failed' });
            }
            if (hasAuthorizedStageBrand &&
                (!authorizedStageInvocation ||
                    authorizedStageInvocation.signal.aborted ||
                    !authorizedStageInvocation.isStillExpected() ||
                    !authorizedPull ||
                    !resolvePullDir)) {
                return complete({ status: 'register_failed' });
            }
            const useAuthorizedStage = hasAuthorizedStageBrand;
            if (useAuthorizedStage &&
                scope &&
                authorizedPull &&
                resolvePullDir &&
                authorizedStageInvocation &&
                expectedVersion != null) {
                const authorizedInvocationIsStillValid = async () => {
                    if (!deps.verifyWorkspaceScope ||
                        !isAuthorizedProactivePullInvocation(authorizedStageInvocation, {
                            projectId,
                            workspaceId: scope.workspaceId,
                            resourceTeamId: scope.resourceTeamId,
                            viewerMemberId: scope.viewerMemberId,
                            ownerMemberId: scope.ownerMemberId,
                        }, expectedVersion)) {
                        return false;
                    }
                    try {
                        const scopeStillAuthorized = await deps.verifyWorkspaceScope(scope);
                        if (deps.resolveTeamProjectResourceId
                            && scope.resourceId !== await deps.resolveTeamProjectResourceId(projectId, scope))
                            return false;
                        return (scopeStillAuthorized &&
                            isAuthorizedProactivePullInvocation(authorizedStageInvocation, {
                                projectId,
                                workspaceId: scope.workspaceId,
                                resourceTeamId: scope.resourceTeamId,
                                viewerMemberId: scope.viewerMemberId,
                                ownerMemberId: scope.ownerMemberId,
                            }, expectedVersion));
                    }
                    catch {
                        return false;
                    }
                };
                const shouldRetryStaleReceipt = async (error, attempt) => {
                    if (attempt !== 0 ||
                        !isAuthorizedTeamProjectPullReceiptExpired(error) ||
                        authorizedStageInvocation.signal.aborted) {
                        return false;
                    }
                    return authorizedInvocationIsStillValid();
                };
                for (let authorizedAttempt = 0; authorizedAttempt < 2; authorizedAttempt += 1) {
                    if (!(await authorizedInvocationIsStillValid())) {
                        return complete({ status: 'register_failed' });
                    }
                    let staged = null;
                    reportAuthorizedPullTiming('authorized-stage-started');
                    try {
                        staged = await (authorizedPull.stage ?? stageAuthorizedTeamProjectPull)({
                            projectId,
                            liveDir: resolvePullDir(projectId),
                            scope,
                            expectedVersion,
                            signal: authorizedStageInvocation.signal,
                        });
                        reportAuthorizedPullTiming('authorized-stage-done', 'staged');
                    }
                    catch (error) {
                        const capabilityUnavailable = isAuthorizedTeamProjectPullUnavailable(error);
                        reportAuthorizedPullTiming('authorized-stage-done', capabilityUnavailable ? 'capability-unavailable' : 'failed');
                        if (!capabilityUnavailable) {
                            if (await shouldRetryStaleReceipt(error, authorizedAttempt)) {
                                continue;
                            }
                            // A cancelled child is not a fault: the scheduler aborts this pull
                            // on purpose when a higher version supersedes it, or when the
                            // intent is cleared. Logging that as "failed closed" put a
                            // fault-shaped warning in the log on ordinary version churn and
                            // sent an investigation chasing a phantom failure. The scheduler
                            // already handles the cancellation itself (a superseded intent
                            // bumps `revision` and re-loops; a cleared one is gone), so this
                            // only stops mislabelling it.
                            if (!isAbortedOperationError(error)) {
                                console.warn('[od] authorized proactive team pull failed closed:', {
                                    projectId,
                                    version: expectedVersion,
                                    ...errorLogFields(error),
                                });
                            }
                            return complete({ status: 'register_failed' });
                        }
                        // Old CLIs can materialize successfully while returning no version.
                        // The event version is only a proven lower bound after the legacy
                        // pull and every post-pull authorization/registration gate succeeds;
                        // it is never persisted as an authorized receipt.
                        authorizedCapabilityFallbackVersion = expectedVersion;
                    }
                    if (staged) {
                        let localRecordChanged = false;
                        let promotionStarted = false;
                        let retryAuthorizedStage = false;
                        let cleanupSucceeded = true;
                        try {
                            validateAuthorizedTeamProjectPullReceipt(staged.receipt, {
                                projectId,
                                scope,
                                expectedVersion,
                            });
                            reportAuthorizedPullTiming('authorized-receipt-validated');
                            const prepared = await preparePulledProjectRegistration(projectId, scope, staged.stageDir);
                            const selectedCatalogProject = resolveSharedProject
                                ? await resolveSharedProject(projectId, scope)
                                : null;
                            if (resolveSharedProject && (!selectedCatalogProject || selectedCatalogProject.ownerMemberId !== scope.ownerMemberId)) {
                                throw new Error('authorized team project catalog changed before promotion');
                            }
                            if (!(await authorizedInvocationIsStillValid())) {
                                throw new Error('authorized team project scope changed before promotion');
                            }
                            reportAuthorizedPullTiming('authorized-scope-revalidated');
                            reportAuthorizedPullTiming('promotion-started');
                            promotionStarted = true;
                            const result = await (authorizedPull.promote ?? promoteAuthorizedTeamProjectStage)({
                                receipt: staged.receipt,
                                liveDir: resolvePullDir(projectId),
                                stageDir: staged.stageDir,
                                expectedStageIdentity: staged.identity,
                                journalDir: authorizedPull.journalDir,
                                isScopeStillAuthorized: authorizedStageInvocation.isStillExpected,
                                isExpectedVersion: authorizedStageInvocation.isStillExpected,
                                validateReceipt: () => validateAuthorizedTeamProjectPullReceipt(staged.receipt, {
                                    projectId,
                                    scope,
                                    expectedVersion,
                                }),
                                commit: () => {
                                    const committed = {
                                        localRecordChanged: registerPreparedPulledProject(prepared, scope, selectedCatalogProject, staged.receipt),
                                    };
                                    reportAuthorizedPullTiming('version-persisted', undefined, staged.receipt.version);
                                    return committed;
                                },
                                onPostCommitCleanupError: (error) => {
                                    console.warn('[od] authorized team project committed; deferred promotion cleanup:', {
                                        projectId,
                                        version: expectedVersion,
                                        ...errorLogFields(error),
                                    });
                                },
                            });
                            reportAuthorizedPullTiming('promotion-done', 'pulled');
                            localRecordChanged = result.localRecordChanged;
                        }
                        catch (error) {
                            if (promotionStarted) {
                                reportAuthorizedPullTiming('promotion-done', 'failed');
                            }
                            const versionStillExpected = authorizedStageInvocation.isStillExpected();
                            const reason = !versionStillExpected
                                ? 'version-superseded'
                                : 'promotion-failed';
                            retryAuthorizedStage = await shouldRetryStaleReceipt(error, authorizedAttempt);
                            if (!retryAuthorizedStage) {
                                console.warn('[od] failed to promote authorized team project', {
                                    projectId,
                                    version: expectedVersion,
                                    reason,
                                    ...errorLogFields(error),
                                });
                                return complete({ status: 'register_failed' });
                            }
                        }
                        finally {
                            try {
                                await staged.cleanup();
                            }
                            catch (error) {
                                cleanupSucceeded = false;
                                console.warn('[od] failed to clean authorized team project stage:', {
                                    projectId,
                                    version: expectedVersion,
                                    ...errorLogFields(error),
                                });
                            }
                        }
                        if (retryAuthorizedStage) {
                            if (!cleanupSucceeded) {
                                return complete({ status: 'register_failed' });
                            }
                            continue;
                        }
                        notifyFilesChanged?.(projectId);
                        if (localRecordChanged)
                            notifyProjectMetadataChanged?.(projectId);
                        markTeamProjectRevoked?.(projectId, false);
                        // Real hub content is on disk and registered — the local record is no
                        // longer an unmaterialized placeholder, so publishing may resume.
                        markSharedProjectPlaceholder?.(projectId, false);
                        return complete({
                            status: 'pulled',
                            version: staged.receipt.version,
                        });
                    }
                    break;
                }
            }
            const reuseInitialAuthorization = Boolean(scope &&
                isFreshProactivePullAuthorizationWitness(authorizationWitness, {
                    projectId,
                    workspaceId: scope.workspaceId,
                    resourceTeamId: scope.resourceTeamId,
                    viewerMemberId: scope.viewerMemberId,
                    ownerMemberId: scope.ownerMemberId,
                }, expectedVersion));
            if (reuseInitialAuthorization) {
                reportPullTiming({
                    phase: 'initial-authorization-reused',
                    projectId,
                    version: authorizationWitness.version,
                    atMs: Date.now(),
                });
            }
            else {
                // The initial active-scope check and authoritative catalog lookup are
                // independent, read-only safety gates. A fresh, branded proactive
                // witness already ran both immediately before this internal call; HTTP
                // callers have no path to provide one and always execute these gates.
                const initialSharedProjectRead = resolveSharedProject
                    ? Promise.resolve()
                        .then(() => resolveSharedProject(projectId, scope))
                        .then((project) => ({ ok: true, project }), () => ({ ok: false }))
                    : null;
                if (scope && !(await capturedScopeIsStillAuthorized(scope))) {
                    return complete({ status: 'register_failed' });
                }
                // Revocation gate: a project may only be pulled while it is still shared
                // to the caller's team. Transient uncertainty fails closed for scoped
                // pulls; the post-transport gate below always repeats this uncached.
                if (initialSharedProjectRead) {
                    let stillShared = true;
                    const initialSharedProject = await initialSharedProjectRead;
                    if (initialSharedProject.ok) {
                        authoritativeSharedProject = initialSharedProject.project;
                        stillShared = authoritativeSharedProject != null &&
                            (!scope || authoritativeSharedProject.ownerMemberId === scope.ownerMemberId);
                    }
                    else {
                        if (scope)
                            return complete({ status: 'register_failed' });
                        stillShared = true;
                    }
                    if (scope && !(await capturedScopeIsStillAuthorized(scope))) {
                        return complete({ status: 'register_failed' });
                    }
                    if (!stillShared) {
                        // The project has left the team: mark the stale local mirror revoked
                        // so its files stop being served (files remain on disk).
                        markTeamProjectRevoked?.(projectId, true);
                        return complete({ status: 'revoked' });
                    }
                }
                else if (scope) {
                    return complete({ status: 'register_failed' });
                }
            }
            reportPullTiming({
                phase: 'transport-invoke',
                projectId,
                atMs: Date.now(),
            });
            let result;
            try {
                result = await pullLatest(projectId, principal);
            }
            catch (error) {
                reportPullTiming({
                    phase: 'transport-done',
                    projectId,
                    atMs: Date.now(),
                    status: 'threw',
                });
                throw error;
            }
            reportPullTiming({
                phase: 'transport-done',
                projectId,
                ...(result.version != null
                    ? { version: result.version }
                    : authorizedCapabilityFallbackVersion != null
                        ? { version: authorizedCapabilityFallbackVersion }
                        : {}),
                atMs: Date.now(),
            });
            const materializedVersion = result.version ?? authorizedCapabilityFallbackVersion;
            if (materializedVersion !== null) {
                let prepared = null;
                try {
                    prepared = await preparePulledProjectRegistration(projectId, scope);
                }
                catch (error) {
                    console.warn('[od] failed to prepare pulled team project:', error);
                    return complete({ status: 'register_failed' });
                }
                reportPullTiming({
                    phase: 'registration-prepared',
                    projectId,
                    version: materializedVersion,
                    atMs: Date.now(),
                });
                // The initial catalog result only authorized starting the transfer. The
                // owner may unshare while bytes are in flight, so scoped materialization
                // requires a second uncached authoritative read after every other async
                // metadata operation has completed.
                if (scope) {
                    try {
                        authoritativeSharedProject = await resolveSharedProject(projectId, scope);
                    }
                    catch {
                        return complete({ status: 'register_failed' });
                    }
                    if (!authoritativeSharedProject) {
                        markTeamProjectRevoked?.(projectId, true);
                        return complete({ status: 'revoked' });
                    }
                    if (authoritativeSharedProject.ownerMemberId !== scope.ownerMemberId) {
                        return complete({ status: 'register_failed' });
                    }
                    reportPullTiming({
                        phase: 'catalog-revalidated',
                        projectId,
                        version: materializedVersion,
                        atMs: Date.now(),
                    });
                    // Keep this check adjacent to the synchronous SQLite transaction.
                    // Nothing below may await before materializeTeamMirror revalidates the
                    // binding and commits it.
                    if (!(await capturedScopeIsStillAuthorized(scope))) {
                        return complete({ status: 'register_failed' });
                    }
                    reportPullTiming({
                        phase: 'scope-revalidated',
                        projectId,
                        version: materializedVersion,
                        atMs: Date.now(),
                    });
                }
                else if (resolveSharedProject) {
                    try {
                        authoritativeSharedProject = await resolveSharedProject(projectId, null);
                    }
                    catch {
                        authoritativeSharedProject = null;
                    }
                }
                let localRecordChanged = false;
                try {
                    localRecordChanged = registerPreparedPulledProject(prepared, scope, authoritativeSharedProject, undefined, result.resourceId?.trim() && result.versionId?.trim()
                        ? { resourceId: result.resourceId.trim(), versionId: result.versionId.trim() }
                        : undefined);
                }
                catch (error) {
                    console.warn('[od] failed to register pulled team project:', error);
                    return complete({ status: 'register_failed' });
                }
                reportPullTiming({
                    phase: 'mirror-materialized',
                    projectId,
                    version: materializedVersion,
                    atMs: Date.now(),
                });
                // Persist the exact version before notifying readers. A file-change
                // subscriber may immediately re-check /collab/status; it must never
                // observe the new bytes paired with the previous durable cursor.
                if (scope && deps.writeMaterializedVersion) {
                    try {
                        reportPullTiming({
                            phase: 'version-write-started',
                            projectId,
                            version: materializedVersion,
                            atMs: Date.now(),
                        });
                        await deps.writeMaterializedVersion(projectId, scope, materializedVersion);
                        reportPullTiming({
                            phase: 'persisted',
                            projectId,
                            version: materializedVersion,
                            atMs: Date.now(),
                        });
                        try {
                            await deps.onLegacyPullMaterialized?.(projectId, scope, materializedVersion);
                        }
                        catch (error) {
                            // The bytes, mirror binding, and durable cursor are already
                            // committed. Coordinator notification is recoverable from that
                            // cursor on its next retry and must never turn success into 502.
                            console.warn('[od] failed to notify proactive coordinator of legacy team pull:', {
                                projectId,
                                version: materializedVersion,
                                ...errorLogFields(error),
                            });
                        }
                    }
                    catch (error) {
                        console.warn('[od] failed to persist pulled team project version:', error);
                        return complete({ status: 'register_failed' });
                    }
                }
                // The pull already materialized new bytes on disk at this point —
                // notify now rather than relying on the project's chokidar watcher,
                // which the pull's directory-replace can silently orphan (see
                // `notifyFilesChanged`'s doc comment). A currently-open FileViewer tab
                // for this project refreshes on the same `file-changed` path a real
                // local edit would take.
                notifyFilesChanged?.(projectId);
                if (localRecordChanged) {
                    // The register above swapped the "共享项目" placeholder record for
                    // the real name (or first-registered the record): push the existing
                    // `project-metadata-changed` thin signal so the open project view
                    // re-reads the record and the sidebar/tab title follows without a
                    // manual reload (recvqhwv6RPU1j).
                    notifyProjectMetadataChanged?.(projectId);
                }
                // Real hub content is on disk and registered — the local record is no
                // longer an unmaterialized placeholder, so publishing may resume.
                markSharedProjectPlaceholder?.(projectId, false);
            }
            // A successful pull means the project is shared again (or still is): clear
            // any prior revocation so its files are served normally.
            markTeamProjectRevoked?.(projectId, false);
            return complete({ status: 'pulled', version: materializedVersion });
        }
        finally {
            reportPullTiming({
                phase: 'route-completed',
                projectId,
                ...(terminalVersion != null ? { version: terminalVersion } : {}),
                ...(profileReceivedAtMs != null
                    ? { receivedAtMs: profileReceivedAtMs }
                    : {}),
                atMs: Date.now(),
                status: terminalStatus,
            });
        }
    }
    // In-flight pulls keyed by project + resource-hub scope. A hub-event
    // proactive pull and a member web's poll-triggered POST that race each
    // other coalesce onto ONE materialization (the `vela resource pull`
    // transport replaces the whole project directory, so a duplicate pull is a
    // full-tree transfer, not a cheap no-op). The scope key includes the
    // principal's team + member ids because the same project can be shared
    // under more than one scope (see `scopedProjectKey` in collab/runtime.ts) —
    // only identically-routed pulls may share a result.
    const pullsInFlight = new Map();
    const projectPullTails = new Map();
    function pullSharedProjectCoalesced(projectId, principal, scope, authorizationWitness, expectedVersion, authorizedStageInvocation) {
        const mutationKey = JSON.stringify([
            projectId,
            principal?.teamId ?? null,
            principal?.memberId ?? null,
            scope?.workspaceId ?? null,
            scope?.resourceTeamId ?? null,
            scope?.viewerMemberId ?? null,
            scope?.ownerMemberId ?? null,
        ]);
        const hasInvalidAuthorizedInvocation = authorizedStageInvocation !== undefined &&
            !isAuthorizedProactivePullInvocation(authorizedStageInvocation, {
                projectId,
                workspaceId: scope?.workspaceId ?? '',
                resourceTeamId: scope?.resourceTeamId ?? '',
                viewerMemberId: scope?.viewerMemberId ?? '',
                ownerMemberId: scope?.ownerMemberId ?? '',
            }, expectedVersion);
        // Valid legacy and authorized callers share one exact-scope mutation key:
        // both replace the same live project tree. Invalid/stale authorized
        // invocations stay isolated so they can only fail closed, never borrow a
        // successful legacy result.
        const key = hasInvalidAuthorizedInvocation
            ? JSON.stringify([mutationKey, 'invalid-stage'])
            : mutationKey;
        const existing = pullsInFlight.get(key);
        if (existing) {
            if (!authorizedStageInvocation)
                return existing;
            return existing.then((outcome) => isAuthorizedProactivePullInvocation(authorizedStageInvocation, {
                projectId,
                workspaceId: scope?.workspaceId ?? '',
                resourceTeamId: scope?.resourceTeamId ?? '',
                viewerMemberId: scope?.viewerMemberId ?? '',
                ownerMemberId: scope?.ownerMemberId ?? '',
            }, expectedVersion)
                ? outcome
                : { status: 'register_failed' });
        }
        const transferToken = scope
            ? deps.beginContentTransfer?.(projectId, scope, expectedVersion)
            : undefined;
        const previous = projectPullTails.get(projectId) ?? Promise.resolve();
        let run;
        run = (async () => {
            let outcome = null;
            try {
                await previous.catch(() => undefined);
                outcome = await pullSharedProjectOnce(projectId, principal, scope, authorizationWitness, expectedVersion, authorizedStageInvocation);
                return outcome;
            }
            finally {
                if (scope && transferToken) {
                    deps.finishContentTransfer?.(projectId, scope, transferToken, outcome?.status === 'pulled'
                        ? outcome.version ?? expectedVersion
                        : expectedVersion);
                }
                if (pullsInFlight.get(key) === run) {
                    pullsInFlight.delete(key);
                }
            }
        })();
        const tail = run.then(() => undefined, () => undefined);
        projectPullTails.set(projectId, tail);
        void tail.finally(() => {
            if (projectPullTails.get(projectId) === tail) {
                projectPullTails.delete(projectId);
            }
        });
        pullsInFlight.set(key, run);
        return run;
    }
    app.post('/api/projects/:id/collab/pull', async (req, res) => {
        const projectId = req.params.id;
        const { verification, principal, scope } = await pullAccessForRequest(projectId, req);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        if (!principal || !scope) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PULL_DENIED' });
        }
        if (scope.ownerMemberId === scope.viewerMemberId && deps.ownedContentSync) {
            const update = await deps.ownedContentSync.request({ projectId, ...scope }, { action: 'check', manual: true });
            if (update.state === 'confirmation_required' || update.state === 'ignored' || update.state === 'suppressed') {
                return res.status(409).json({ error: 'COLLAB_OVERWRITE_CONFIRMATION_REQUIRED', update });
            }
            if (update.state !== 'up_to_date')
                return res.status(update.state === 'busy' ? 409 : 502).json({ error: update.errorCode ?? 'PROJECT_SYNC_FAILED', update });
            return res.json({ ok: true, version: update.localVersion });
        }
        const outcome = await pullSharedProjectCoalesced(projectId, principal, scope);
        if (outcome.status === 'revoked') {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PULL_DENIED' });
        }
        if (outcome.status === 'register_failed') {
            return res.status(502).json({ error: 'TEAM_PROJECT_PULL_REGISTER_UNAVAILABLE' });
        }
        res.json({ ok: true, version: outcome.version });
    });
    app.post('/api/projects/:id/collab/update', async (req, res) => {
        const input = req.body;
        if (!input || !['check', 'accept', 'dismiss', 'reset-preference'].includes(input.action)
            || (input.version !== undefined && (!Number.isSafeInteger(input.version) || input.version < 0))
            || ((input.action === 'accept' || input.action === 'dismiss') && input.version === undefined)
            || (input.dontPromptFor24h !== undefined && typeof input.dontPromptFor24h !== 'boolean')
            || (input.manual !== undefined && typeof input.manual !== 'boolean')) {
            return res.status(400).json({ error: 'INVALID_CONTENT_UPDATE_REQUEST' });
        }
        const projectId = req.params.id;
        const { verification, scope } = await pullAccessForRequest(projectId, req);
        if (!verification.ok)
            return sendWorkspaceVerificationFailure(res, verification);
        if (!scope || scope.ownerMemberId !== scope.viewerMemberId)
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_PULL_DENIED' });
        if (!deps.ownedContentSync)
            return res.status(503).json({ error: 'PROJECT_SYNC_UNAVAILABLE' });
        const update = await deps.ownedContentSync.request({ projectId, ...scope }, input);
        return res.json({ update });
    });
    app.put('/api/projects/:id/collab/bootstrap', async (req, res) => {
        const projectId = req.params.id;
        // This endpoint materializes local authority state, so it deliberately uses
        // the fresh mutation verifier and uncached owner lookup, never status's
        // bounded read lease. PUT is idempotent and lets the sidecar safely replay
        // one request on a reset reused socket.
        const { verification, principal, scope } = await pullAccessForRequest(projectId, req);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        if (!principal || !scope) {
            return res.status(404).json({ error: 'TEAM_PROJECT_NOT_FOUND' });
        }
        let awaitingFirstMaterialization;
        try {
            awaitingFirstMaterialization = ensureTeamBoundSharedProjectPlaceholder(projectId, scope);
        }
        catch {
            return res.status(503).json({ error: 'TEAM_PROJECT_BOOTSTRAP_UNAVAILABLE' });
        }
        if (awaitingFirstMaterialization) {
            materializePlaceholderOnOpen(projectId, req, {
                ownerMemberId: scope.ownerMemberId,
                callerIsOwner: scope.ownerMemberId === scope.viewerMemberId,
            });
        }
        return res
            .status(awaitingFirstMaterialization ? 202 : 200)
            .json({ ok: true, awaitingFirstMaterialization });
    });
    app.get('/api/projects/:id/collab/status', async (req, res) => {
        const projectId = req.params.id;
        if (isTeamProjectRevoked?.(projectId)) {
            return res.status(404).json({ error: 'PROJECT_NOT_FOUND' });
        }
        const { verification, context, principal, workspaceId: resolvedWorkspaceId, } = await statusIdentityForRequest(projectId, req);
        if (!verification.ok) {
            return sendWorkspaceVerificationFailure(res, verification);
        }
        if (!context || !resolvedWorkspaceId) {
            return res.status(403).json({ error: 'WORKSPACE_PROJECT_STATUS_DENIED' });
        }
        let syncState = projectSyncState(projectId, principal);
        let ownerMemberId = projectOwnerMemberId(projectId, principal);
        let ownerDisplayName;
        let ownerRole;
        // Resolve ownership first through the CACHED hub owner lookup. This decides
        // whether the project is shared at all — and a project that is local-only AND
        // unowned on the hub is a genuine personal project with no hub-published head.
        // Answering its version from local state lets us skip the uncached ~2s
        // publishedHead round-trip that otherwise ran on every status poll. That hub
        // call was the reason a member's OWN project flashed the "shared read-only"
        // notice for seconds after opening: the front end fails closed until
        // /collab/status confirms ownership, so a slow status made the flash long.
        const statusOwnerResolver = resolveSharedProjectOwnerForStatus ?? resolveSharedProjectOwner;
        if (ownerMemberId == null && statusOwnerResolver) {
            try {
                const hubOwner = resolvedWorkspaceId && principal?.memberId
                    ? await statusOwnerResolver(projectId, {
                        workspaceId: resolvedWorkspaceId,
                        workspaceMemberId: principal.memberId,
                    })
                    : null;
                if (hubOwner != null) {
                    if (syncState === 'local_only')
                        syncState = 'synced';
                    ownerMemberId = hubOwner;
                }
            }
            catch {
                // Hub unavailable: fall back to the local state.
            }
        }
        // The caller owns the project when the resolved owner id matches their own
        // member id. The owner is the single writer of their own project: the front
        // end shows them an editable surface (not the "shared by X" banner) and they
        // never auto-pull, so they need NEITHER the owner display-name directory
        // lookup NOR the hub published-head round-trip. Both are uncached ~1-3s vela
        // calls, and running them made a member's own shared project sit in the
        // fail-closed "shared read-only" state (disabled history/share, disabled
        // composer) for tens of seconds before /collab/status confirmed ownership.
        const callerIsOwner = ownerMemberId != null && principal?.memberId != null && ownerMemberId === principal.memberId;
        // Anyone opening a shared project absent from this daemon's local DB needs
        // the placeholder so the project's other routes stop 404ing while the pull
        // runs (see ensureSharedProjectPlaceholder). This covers BOTH a member
        // viewing someone else's shared project AND an owner opening their OWN shared
        // project that was created/shared on another machine (or attributed to them
        // by a smoke test) and never materialized here: the owner never auto-pulls,
        // so without this its conversations/events/tabs 404 forever and the left pane
        // hangs for a minute. ensureSharedProjectPlaceholder no-ops once the project
        // is known locally, so an owner's normal local project is untouched. The web
        // polls /collab/status on open, so this fires before the conversations/events
        // retry storm builds up.
        if (ownerMemberId) {
            ensureSharedProjectPlaceholder(projectId);
        }
        // Whether this daemon's only local record for the project is still an
        // unmaterialized placeholder. Purely local and synchronous — it needs no
        // hub round-trip, which is exactly why it is the signal the client can act
        // on from the FIRST status response (see `awaitingFirstMaterialization` on
        // CollabSyncStatusResponse).
        const awaitingFirstMaterialization = Boolean(projectStore?.get && isUnmaterializedSharedPlaceholder(projectStore.get(projectId)));
        if (awaitingFirstMaterialization) {
            materializePlaceholderOnOpen(projectId, req, {
                ownerMemberId,
                callerIsOwner,
            });
        }
        // A verified local mirror binding is enough to return shared identity and
        // unlock presence immediately. The owner-name directory and published-head
        // calls are remote enrichment: neither may hold this status response open.
        // Cache them by the exact viewer/team/owner/project tuple so a later poll can
        // consume the result without leaking it across workspace scopes. Unknown local
        // ownership still fails closed above; this path never guesses an owner. The
        // web's default status poll is 5s, so settled enrichment becomes visible on
        // the next poll (<=5s); this local-first fix does not add another SSE contract.
        const needsHubHead = (syncState !== 'local_only' || ownerMemberId != null) && !callerIsOwner;
        const enrichmentKey = JSON.stringify([
            resolvedWorkspaceId ?? '',
            principal?.teamId ?? '',
            principal?.memberId ?? '',
            ownerMemberId ?? '',
            projectId,
        ]);
        const cachedOwnerName = readLruEntry(ownerEnrichmentCache, enrichmentKey);
        const ownerNameEntry = cachedOwnerName?.entry ?? null;
        if (ownerNameEntry) {
            ownerDisplayName = ownerNameEntry.displayName;
            ownerRole = ownerNameEntry.role;
        }
        if (ownerMemberId &&
            resolvedWorkspaceId &&
            context &&
            principal &&
            !callerIsOwner &&
            resolveOwnerDisplayName &&
            (!cachedOwnerName || Date.now() - cachedOwnerName.resolvedAt >= OWNER_ENRICHMENT_TTL_MS) &&
            !ownerEnrichmentInFlight.has(enrichmentKey)) {
            const refreshOwner = resolveOwnerDisplayName(ownerMemberId, context)
                .then((entry) => {
                writeLruEntry(ownerEnrichmentCache, enrichmentKey, {
                    entry,
                    resolvedAt: Date.now(),
                });
            })
                .catch(() => undefined)
                .finally(() => {
                if (ownerEnrichmentInFlight.get(enrichmentKey) === refreshOwner) {
                    ownerEnrichmentInFlight.delete(enrichmentKey);
                }
            });
            ownerEnrichmentInFlight.set(enrichmentKey, refreshOwner);
        }
        let headResult = readLruEntry(headEnrichmentCache, enrichmentKey) ??
            { head: publishedVersion(projectId, principal), scope: null };
        if (needsHubHead && !headEnrichmentInFlight.has(enrichmentKey)) {
            const expectedWorkspaceId = resolvedWorkspaceId;
            const expectedPrincipal = principal;
            const expectedOwnerMemberId = ownerMemberId;
            const refreshHead = (async () => {
                const { principal: resourcePrincipal, scope } = await pullAccessForRequest(projectId, req, expectedOwnerMemberId, {
                    principal: expectedPrincipal,
                    workspaceId: expectedWorkspaceId,
                });
                if (!scope ||
                    !expectedPrincipal ||
                    scope.workspaceId !== expectedWorkspaceId ||
                    scope.resourceTeamId !== expectedPrincipal.teamId ||
                    scope.viewerMemberId !== expectedPrincipal.memberId ||
                    scope.ownerMemberId !== expectedOwnerMemberId) {
                    return;
                }
                const head = await publishedHead(projectId, resourcePrincipal);
                writeLruEntry(headEnrichmentCache, enrichmentKey, { head, scope });
            })()
                .catch(() => undefined)
                .finally(() => {
                if (headEnrichmentInFlight.get(enrichmentKey) === refreshHead) {
                    headEnrichmentInFlight.delete(enrichmentKey);
                }
            });
            headEnrichmentInFlight.set(enrichmentKey, refreshHead);
        }
        let materializedVersion = null;
        if (headResult.scope && deps.readMaterializedVersion) {
            try {
                materializedVersion =
                    deps.readMaterializedVersion(projectId, headResult.scope) ?? null;
            }
            catch {
                materializedVersion = null;
            }
        }
        const transferScope = resolvedWorkspaceId
            && principal
            && ownerMemberId
            ? {
                workspaceId: resolvedWorkspaceId,
                resourceTeamId: principal.teamId,
                viewerMemberId: principal.memberId,
                ownerMemberId,
            }
            : null;
        const ownedContentUpdate = callerIsOwner && transferScope && deps.ownedContentSync
            ? deps.ownedContentSync.read({ projectId, ...transferScope }) : null;
        res.json({
            ...(ownedContentUpdate ? { ownedContentUpdate } : {}),
            publishedVersion: ownedContentUpdate?.latestVersion ?? headResult.head,
            materializedVersion: ownedContentUpdate?.localVersion ?? materializedVersion,
            contentTransferState: transferScope
                ? deps.readContentTransferState?.(projectId, transferScope) ?? null
                : null,
            awaitingFirstMaterialization,
            syncState,
            ownerMemberId,
            ...(ownerDisplayName ? { ownerDisplayName } : {}),
            ...(ownerRole ? { ownerRole } : {}),
        });
    });
    return {
        async pullSharedProject(projectId, scope, authorizationWitness, expectedVersion, authorizedStageInvocation) {
            const principal = {
                teamId: scope.resourceTeamId,
                memberId: scope.ownerMemberId,
                role: 'member',
                lifecycleState: 'active',
                workspaceType: 'team',
            };
            return pullSharedProjectCoalesced(projectId, principal, scope, authorizationWitness, expectedVersion, authorizedStageInvocation);
        },
    };
}
//# sourceMappingURL=collab-sync.js.map