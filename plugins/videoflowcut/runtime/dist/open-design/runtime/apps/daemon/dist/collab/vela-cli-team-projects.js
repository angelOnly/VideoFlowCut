import { runVelaCommand, velaWorkspaceCommandOptions, } from '../integrations/vela-command.js';
import { createSwrCache } from './swr-cache.js';
import { parseCommentFileState } from './comment-file-facts.js';
const PROJECT_RESOURCE_PREFIX = 'project-';
/** Latest paired CLI only: no catalog/list or root-upload fallback. */
export async function ensurePrivateVelaTeamProject(projectId, principal, run) {
    const record = JSON.parse(await run(['team-projects', 'ensure-private', projectId]));
    if (record.projectId !== projectId || record.workspaceId !== principal.teamId
        || record.ownerMemberId !== principal.memberId
        || typeof record.resourceId !== 'string' || !record.resourceId.trim()
        || (record.visibility !== 'private' && record.visibility !== 'team')
        || typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))) {
        throw new Error('PUBLIC_SHARE_PROJECT_CATALOG_UNAVAILABLE');
    }
    return record;
}
/** Await the association ACK before any selected-file version/blob transport. */
export async function registerVelaTeamProjectResource(projectId, resourceId, run) {
    const result = JSON.parse(await run(['team-projects', 'register-resource', projectId, resourceId]));
    if (result?.ok !== true)
        throw new Error('PUBLIC_SHARE_RESOURCE_REGISTRATION_UNAVAILABLE');
}
export function projectResourceId(projectId) {
    return `${PROJECT_RESOURCE_PREFIX}${projectId}`;
}
export function createVelaCliTeamProjectCatalog(options = {}) {
    const run = options.run ?? defaultRunVelaTeamProjects;
    const runResource = options.runResource ?? defaultRunVelaResources;
    const supportsTeamProjects = createTeamProjectsCapabilityCheck(run, options.supportsTeamProjects);
    async function runJson(args, workspaceId) {
        const stdout = await run(args, workspaceId);
        const trimmed = stdout.trim();
        if (!trimmed)
            return {};
        return JSON.parse(trimmed);
    }
    async function list(workspaceId) {
        const resolvedWorkspaceId = requireWorkspaceId(workspaceId);
        if (!(await supportsTeamProjects(resolvedWorkspaceId))) {
            const resources = await listSharedProjectResources(runResource, resolvedWorkspaceId);
            return resources.map(toFallbackTeamProject);
        }
        const stdout = await run(['list'], resolvedWorkspaceId);
        const payload = stdout.trim()
            ? JSON.parse(stdout.trim())
            : {};
        return Array.isArray(payload.projects)
            ? payload.projects.map(toTeamProject).filter((project) => project != null)
            : [];
    }
    let exactLookupUnavailable = false;
    return {
        list,
        ensurePrivate(projectId, principal) {
            return ensurePrivateVelaTeamProject(projectId, principal, (args) => run(args.slice(1), requirePrincipalWorkspaceId(principal)));
        },
        async setVisibility(projectId, visibility, principal) {
            const record = await runJson(['visibility', projectId, visibility], requirePrincipalWorkspaceId(principal));
            if (record.projectId !== projectId || record.workspaceId !== principal.teamId
                || record.ownerMemberId !== principal.memberId || record.visibility !== visibility
                || typeof record.resourceId !== 'string' || !record.resourceId.trim()) {
                throw new Error('TEAM_PROJECT_VISIBILITY_UNAVAILABLE');
            }
        },
        async getRegistration(projectId, principal) {
            try {
                const record = await runJson(['get', projectId, '--json'], requirePrincipalWorkspaceId(principal));
                if (record.projectId !== projectId || record.workspaceId !== principal.teamId
                    || record.ownerMemberId !== principal.memberId
                    || (record.visibility !== 'private' && record.visibility !== 'team')
                    || (record.resourceId != null && typeof record.resourceId !== 'string')
                    || typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))) {
                    throw new Error('TEAM_PROJECT_REGISTRATION_UNAVAILABLE');
                }
                // A pending private row has owner authority even without a readable root.
                return { projectId, workspaceId: principal.teamId, ownerMemberId: principal.memberId,
                    visibility: record.visibility, resourceId: typeof record.resourceId === 'string' ? record.resourceId : null, createdAt: record.createdAt };
            }
            catch (error) {
                if (isAuthoritativeTeamProjectNotFound(error))
                    return null;
                throw error;
            }
        },
        async get(projectId, workspaceId) {
            const resolvedWorkspaceId = requireWorkspaceId(workspaceId);
            if (exactLookupUnavailable) {
                return (await list(resolvedWorkspaceId))
                    .find((project) => project.projectId === projectId) ?? null;
            }
            try {
                const payload = await runJson([
                    'get',
                    projectId,
                    '--json',
                ], resolvedWorkspaceId);
                return toTeamProject(payload);
            }
            catch (error) {
                if (isAuthoritativeTeamProjectNotFound(error))
                    return null;
                if (!isExactTeamProjectLookupUnavailable(error))
                    throw error;
                exactLookupUnavailable = true;
                return (await list(resolvedWorkspaceId))
                    .find((project) => project.projectId === projectId) ?? null;
            }
        },
        async upsert(input, principal) {
            const workspaceId = requirePrincipalWorkspaceId(principal);
            // Explicit root synchronization cannot claim success when its catalog
            // transport is unavailable; no resource-index fallback is authority.
            if (!(await supportsTeamProjects(workspaceId)))
                throw new Error('TEAM_PROJECT_CATALOG_UNAVAILABLE');
            const args = [
                'upsert',
                input.projectId,
                '--resource-id',
                input.resourceId ?? projectResourceId(input.projectId),
            ];
            if (input.displayName?.trim())
                args.push('--display-name', input.displayName.trim());
            if (input.syncState)
                args.push('--sync-state', input.syncState);
            if (input.lastSyncedVersionId?.trim()) {
                args.push('--last-synced-version-id', input.lastSyncedVersionId.trim());
            }
            if (input.metadata && Object.keys(input.metadata).length > 0) {
                args.push('--metadata-json', JSON.stringify(input.metadata));
            }
            await run(args, workspaceId);
        },
        async remove(projectId, principal) {
            const workspaceId = requirePrincipalWorkspaceId(principal);
            // The resource adapter removes the resource-index row in compatibility
            // mode; there is no separate catalog row to delete.
            if (!(await supportsTeamProjects(workspaceId)))
                return;
            await run(['remove', projectId], workspaceId);
        },
    };
}
export function createVelaCliTeamProjectCatalogClient(options = {}) {
    const run = options.run ?? defaultRunVelaTeamProjects;
    const runResource = options.runResource ?? defaultRunVelaResources;
    const supportsTeamProjects = createTeamProjectsCapabilityCheck(run, options.supportsTeamProjects);
    async function runJson(args, workspaceId) {
        const stdout = await run(args, workspaceId);
        const trimmed = stdout.trim();
        if (!trimmed)
            return {};
        return JSON.parse(trimmed);
    }
    return {
        async list(principal) {
            // Capture before the first await. Capability detection may itself await,
            // during which another tab can switch the daemon's active Workspace.
            const workspaceId = principal.teamId.trim();
            if (!workspaceId)
                throw new Error('explicit workspace scope is required');
            if (!(await supportsTeamProjects(workspaceId))) {
                const resources = await listSharedProjectResources(runResource, workspaceId);
                const records = resources.map(toFallbackVelaTeamProjectRecord);
                if (records.some((record) => record.workspaceId !== workspaceId)) {
                    throw new Error('incomplete team project catalog: workspace mismatch');
                }
                return records;
            }
            const payload = await runJson(['list'], workspaceId);
            if (!Array.isArray(payload.projects)) {
                throw new Error('incomplete team project catalog: projects are missing');
            }
            const records = payload.projects
                .filter((project) => recordObject(project)?.visibility !== 'private')
                .map((project) => toVelaTeamProjectRecord(project));
            if (records.some((project) => project == null)) {
                throw new Error('incomplete team project catalog: invalid project row');
            }
            const completeRecords = records.filter((project) => project.visibility === undefined || project.visibility === 'team');
            if (completeRecords.some((project) => project.workspaceId !== workspaceId)) {
                throw new Error('incomplete team project catalog: workspace mismatch');
            }
            return completeRecords;
        },
        async upsert(input, principal) {
            const workspaceId = principal.teamId.trim();
            if (!workspaceId)
                throw new Error('explicit workspace scope is required');
            // See the catalog adapter above: resource push owns the fallback index.
            if (!(await supportsTeamProjects(workspaceId)))
                return null;
            const args = [
                'upsert',
                input.projectId,
                '--resource-id',
                input.resourceId,
            ];
            if (input.displayName?.trim())
                args.push('--display-name', input.displayName.trim());
            if (input.syncState)
                args.push('--sync-state', input.syncState);
            if (input.lastSyncedVersionId?.trim()) {
                args.push('--last-synced-version-id', input.lastSyncedVersionId.trim());
            }
            const stdout = await run(args, workspaceId);
            return toVelaTeamProjectRecord(JSON.parse(stdout.trim()));
        },
    };
}
/**
 * Short-lived read cache for request-scoped project catalogs.
 *
 * One cache instance is created per complete principal identity. The fetcher
 * closes over that immutable principal, so a daemon-wide Workspace switch can
 * neither change the request sent to Vela nor place B's response in A's entry.
 */
export function createScopedVelaTeamProjectCatalogClientCache(client, freshMs = 3000) {
    const lists = new Map();
    const workspaceIds = new Map();
    const scopeKey = (principal) => JSON.stringify([
        principal.teamId,
        principal.memberId,
        principal.role,
        principal.lifecycleState,
        principal.workspaceType ?? null,
    ]);
    const invalidate = (principal) => {
        if (principal) {
            const key = scopeKey(principal);
            lists.get(key)?.invalidate();
            lists.delete(key);
            workspaceIds.delete(key);
            return;
        }
        for (const list of lists.values())
            list.invalidate();
        lists.clear();
        workspaceIds.clear();
    };
    const invalidateWorkspace = (workspaceIdInput) => {
        const workspaceId = workspaceIdInput.trim();
        if (!workspaceId)
            return;
        for (const [key, cachedWorkspaceId] of workspaceIds) {
            if (cachedWorkspaceId !== workspaceId)
                continue;
            lists.get(key)?.invalidate();
            lists.delete(key);
            workspaceIds.delete(key);
        }
    };
    return {
        list(principal) {
            const key = scopeKey(principal);
            let list = lists.get(key);
            if (!list) {
                const capturedPrincipal = { ...principal };
                list = createSwrCache(() => client.list(capturedPrincipal), () => key, freshMs);
                lists.set(key, list);
                workspaceIds.set(key, capturedPrincipal.teamId);
            }
            return list();
        },
        async upsert(input, principal) {
            const result = await client.upsert(input, principal);
            invalidate(principal);
            return result;
        },
        invalidate,
        invalidateWorkspace,
    };
}
export function createVelaCliTeamProjectCatalogClientFromEnv(options = {}) {
    return shouldUseVelaCliTeamProjectCatalog()
        ? createVelaCliTeamProjectCatalogClient(options)
        : null;
}
export function createVelaCliTeamProjectCatalogFromEnv(options = {}) {
    return shouldUseVelaCliTeamProjectCatalog()
        ? createVelaCliTeamProjectCatalog(options)
        : null;
}
export function shouldUseVelaCliTeamProjectCatalog(env = process.env) {
    if (env.OD_WORKSPACE_CONTEXT_SOURCE?.trim() === 'vela')
        return true;
    const explicitTransport = env.OD_TEAM_PROJECTS_TRANSPORT?.trim();
    if (explicitTransport)
        return explicitTransport === 'vela-cli';
    return env.OD_RESOURCE_TRANSPORT?.trim() === 'vela-cli';
}
function toTeamProject(input) {
    if (!input || typeof input !== 'object')
        return null;
    const record = input;
    if (record.visibility !== undefined && record.visibility !== 'team')
        return null;
    // The published ref is the durable read boundary. A failed newer sync must
    // not hide the last successfully published version. Older Vela responses do
    // not carry this field, so retain their last known successful-version hint;
    // a genuine first failure still has neither signal and remains hidden.
    if (!hasReadablePublishedVersion(record)) {
        return null;
    }
    if (typeof record.projectId !== 'string' ||
        typeof record.ownerMemberId !== 'string' ||
        typeof record.createdAt !== 'string') {
        return null;
    }
    const project = {
        projectId: record.projectId,
        ownerMemberId: record.ownerMemberId,
        sharedAt: record.createdAt,
    };
    if (typeof record.displayName === 'string' && record.displayName.trim()) {
        project.name = record.displayName.trim();
    }
    const metadata = recordObject(record.metadata);
    if (metadata) {
        if (typeof metadata.skillId === 'string')
            project.skillId = metadata.skillId;
        if (typeof metadata.designSystemId === 'string')
            project.designSystemId = metadata.designSystemId;
        const projectMetadata = recordObject(metadata.metadata);
        if (projectMetadata) {
            // SAFETY: this opaque app-owned DTO round-trips persisted catalog metadata.
            const unreserved = { ...projectMetadata };
            delete unreserved._commentFiles;
            project.metadata = unreserved;
        }
        if (typeof metadata.createdAt === 'number')
            project.createdAt = metadata.createdAt;
        if (typeof metadata.updatedAt === 'number')
            project.updatedAt = metadata.updatedAt;
    }
    if (typeof record.updatedAt === 'string') {
        const updatedAt = Date.parse(record.updatedAt);
        if (Number.isFinite(updatedAt) && project.updatedAt === undefined)
            project.updatedAt = updatedAt;
    }
    const commentFiles = parseCommentFileState(metadata?._commentFiles);
    if (metadata?._commentFiles !== undefined && !commentFiles)
        throw new Error('COMMENT_FILE_AUTHORITY_UNAVAILABLE');
    if (commentFiles)
        project.metadata = { kind: project.metadata?.kind ?? 'other', ...project.metadata, _commentFiles: commentFiles };
    const createdAt = Date.parse(record.createdAt);
    if (Number.isFinite(createdAt) && project.createdAt === undefined)
        project.createdAt = createdAt;
    return project;
}
function toVelaTeamProjectRecord(input) {
    if (!input || typeof input !== 'object')
        return null;
    const record = input;
    if (typeof record.id !== 'string' ||
        typeof record.workspaceId !== 'string' ||
        typeof record.projectId !== 'string' ||
        typeof record.resourceId !== 'string' ||
        typeof record.ownerMemberId !== 'string' ||
        typeof record.syncState !== 'string' ||
        typeof record.createdAt !== 'string' ||
        typeof record.updatedAt !== 'string') {
        return null;
    }
    const access = record.access && typeof record.access === 'object' && !Array.isArray(record.access)
        ? record.access
        : {};
    const metadata = recordObject(record.metadata);
    const originProjectUpdatedAt = metadata?.updatedAt;
    return {
        id: record.id,
        ...(record.visibility !== undefined ? { visibility: record.visibility } : {}),
        workspaceId: record.workspaceId,
        projectId: record.projectId,
        resourceId: record.resourceId,
        ownerMemberId: record.ownerMemberId,
        displayName: typeof record.displayName === 'string' ? record.displayName : null,
        syncState: toVelaSyncState(record.syncState),
        lastSyncedVersionId: typeof record.lastSyncedVersionId === 'string' ? record.lastSyncedVersionId : null,
        ...(Object.hasOwn(record, 'publishedVersionId')
            ? {
                publishedVersionId: typeof record.publishedVersionId === 'string' && record.publishedVersionId.trim()
                    ? record.publishedVersionId.trim()
                    : null,
            }
            : {}),
        createdAt: record.createdAt,
        originProjectUpdatedAt: typeof originProjectUpdatedAt === 'number' && Number.isFinite(originProjectUpdatedAt)
            ? originProjectUpdatedAt
            : null,
        updatedAt: record.updatedAt,
        access: {
            canView: access.canView ?? true,
            canComment: access.canComment ?? true,
            canEdit: access.canEdit ?? false,
            frozen: access.frozen ?? false,
        },
    };
}
function hasReadablePublishedVersion(record) {
    if (Object.hasOwn(record, 'publishedVersionId')) {
        return typeof record.publishedVersionId === 'string'
            && record.publishedVersionId.trim().length > 0;
    }
    // The original team-project response did not include publication fields or
    // sync state. Preserve its established visibility until Vela explicitly
    // supplies one of the newer publication signals.
    if (typeof record.syncState !== 'string')
        return true;
    return record.syncState === 'synced'
        || (typeof record.lastSyncedVersionId === 'string'
            && record.lastSyncedVersionId.trim().length > 0);
}
function toVelaSyncState(value) {
    if (value === 'syncing' || value === 'synced' || value === 'failed')
        return value;
    return 'pending_upload';
}
function recordObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : null;
}
function isAuthoritativeTeamProjectNotFound(error) {
    return errorMessage(error).includes('team_project_not_found');
}
/**
 * Compatibility is deliberately narrow. Only a CLI that lacks `get` (or its
 * `--json` flag), or a pre-endpoint API returning an untyped 404, may fall back
 * to the full catalog. Auth, permission, server, and network failures remain
 * hard failures so a pull can never authorize itself from stale/partial data.
 */
function isExactTeamProjectLookupUnavailable(error) {
    const message = errorMessage(error);
    if (isAuthoritativeTeamProjectNotFound(error))
        return false;
    return /unknown command ["']?(?:get|team-projects)["']?/i.test(message) ||
        /unknown flag:\s*--json/i.test(message) ||
        /API request failed with status 404(?!\s*:)/i.test(message);
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function createTeamProjectsCapabilityCheck(run, injected) {
    // The packaged dependency can lag the source-built CLI. Probe once per
    // adapter so source builds use the richer catalog while older builds retain
    // resource-index discovery without a version pin.
    let result = null;
    return (workspaceId) => {
        const exactWorkspaceId = requireWorkspaceId(workspaceId);
        if (!injected && run === defaultRunVelaTeamProjects) {
            defaultTeamProjectsCapability ??= run(['--help'], exactWorkspaceId).then(() => true, () => false);
            return defaultTeamProjectsCapability;
        }
        result ??= injected
            ? Promise.resolve().then(injected)
            : run(['--help'], exactWorkspaceId).then(() => true, () => false);
        return result;
    };
}
let defaultTeamProjectsCapability = null;
async function listSharedProjectResources(runResource, workspaceId) {
    const stdout = await runResource(['shared', '--json'], workspaceId);
    const trimmed = stdout.trim();
    if (!trimmed) {
        throw new Error('incomplete shared project catalog: empty response');
    }
    const payload = JSON.parse(trimmed);
    if (!Array.isArray(payload.resources)) {
        throw new Error('incomplete shared project catalog: resources are missing');
    }
    const projectRows = payload.resources.filter((value) => Boolean(value)
        && typeof value === 'object'
        && value.kind === 'project');
    if (projectRows.some((value) => !isSharedProjectResource(value))) {
        throw new Error('incomplete shared project catalog: invalid project row');
    }
    return projectRows;
}
function requireWorkspaceId(workspaceId) {
    const exactWorkspaceId = workspaceId.trim();
    if (!exactWorkspaceId) {
        throw new Error('explicit workspace scope is required');
    }
    return exactWorkspaceId;
}
function requirePrincipalWorkspaceId(principal) {
    return requireWorkspaceId(principal?.teamId ?? '');
}
function isSharedProjectResource(value) {
    if (!value || typeof value !== 'object')
        return false;
    const resource = value;
    return resource.kind === 'project' &&
        typeof resource.id === 'string' &&
        typeof resource.teamId === 'string' &&
        typeof resource.ownerMemberId === 'string' &&
        typeof resource.createdAt === 'string' &&
        (resource.deletedAt === null || resource.deletedAt === undefined);
}
function toFallbackTeamProject(resource) {
    const metadata = recordObject(resource.metadata) ?? {};
    const project = {
        projectId: fallbackProjectId(resource, metadata),
        ownerMemberId: resource.ownerMemberId,
        sharedAt: resource.createdAt,
    };
    if (typeof metadata.name === 'string' && metadata.name.trim()) {
        project.name = metadata.name.trim();
    }
    if (metadata.skillId === null || typeof metadata.skillId === 'string') {
        project.skillId = metadata.skillId;
    }
    if (metadata.designSystemId === null || typeof metadata.designSystemId === 'string') {
        project.designSystemId = metadata.designSystemId;
    }
    if (typeof metadata.createdAt === 'number')
        project.createdAt = metadata.createdAt;
    if (typeof metadata.updatedAt === 'number')
        project.updatedAt = metadata.updatedAt;
    const projectMetadata = recordObject(metadata.metadata);
    if (projectMetadata) {
        const unreserved = { ...projectMetadata };
        delete unreserved._commentFiles;
        // SAFETY: opaque app metadata is round-tripped only after removing authority-bearing fields.
        project.metadata = unreserved;
    }
    return project;
}
function toFallbackVelaTeamProjectRecord(resource) {
    const metadata = recordObject(resource.metadata) ?? {};
    const project = toFallbackTeamProject(resource);
    const createdAt = resource.createdAt;
    const updatedAt = typeof metadata.updatedAt === 'number' && Number.isFinite(metadata.updatedAt)
        ? new Date(metadata.updatedAt).toISOString()
        : createdAt;
    return {
        id: resource.id,
        workspaceId: resource.teamId,
        projectId: project.projectId,
        resourceId: resource.id,
        ownerMemberId: resource.ownerMemberId,
        displayName: project.name ?? null,
        syncState: 'synced',
        lastSyncedVersionId: null,
        createdAt,
        originProjectUpdatedAt: typeof metadata.updatedAt === 'number' && Number.isFinite(metadata.updatedAt)
            ? metadata.updatedAt
            : null,
        updatedAt,
        access: {
            canView: true,
            canComment: true,
            canEdit: false,
            frozen: false,
        },
    };
}
function fallbackProjectId(resource, metadata) {
    if (typeof metadata.projectId === 'string' && metadata.projectId.trim()) {
        return metadata.projectId.trim();
    }
    const resourceId = resource.id;
    const suffix = resourceId.startsWith(PROJECT_RESOURCE_PREFIX)
        ? resourceId.slice(PROJECT_RESOURCE_PREFIX.length)
        : resourceId;
    try {
        const decoded = JSON.parse(Buffer.from(suffix, 'base64url').toString('utf8'));
        if (Array.isArray(decoded) && typeof decoded[2] === 'string' && decoded[2].trim()) {
            return decoded[2].trim();
        }
    }
    catch {
        // Legacy resource ids are simply `project-<projectId>`.
    }
    return suffix;
}
const defaultRunVelaTeamProjects = (args, workspaceId) => runVelaCommand(['team-projects', ...args], velaWorkspaceCommandOptions(workspaceId));
const defaultRunVelaResources = (args, workspaceId) => runVelaCommand(['resource', ...args], velaWorkspaceCommandOptions(workspaceId));
//# sourceMappingURL=vela-cli-team-projects.js.map