import { hasEverShared } from '@open-design/contracts';
import { ensurePrivateVelaTeamProject } from './vela-cli-team-projects.js';
import { readVelaControlApiContext } from '../integrations/vela.js';
import { fetchVelaWorkspaceDirectory } from './vela-workspace-context.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
import { parseAmrShareLink } from './public-share-viewer-url.js';
export function createVelaProjectShareState(options) {
    return async (scope) => {
        const identity = Object.freeze({ ...scope });
        const configuredEnv = { ...(typeof options.configuredEnv === 'function' ? options.configuredEnv() : options.configuredEnv ?? {}) };
        const current = (options.readSession ?? readVelaControlApiContext)(process.env, configuredEnv);
        if (!current?.controlKey || !current.apiUrl || !options.dataRoot)
            throw new Error('SHARE_STATE_UNAVAILABLE');
        const session = Object.freeze({ ...current });
        const directory = await (options.fetchDirectory ?? fetchVelaWorkspaceDirectory)({ readSession: () => session });
        const workspace = directory.ok ? directory.items.find(item => item.workspaceId === identity.resourceTeamId
            && item.workspaceMemberId === identity.ownerMemberId && item.memberStatus === 'active'
            && item.lifecycleState === 'active') : undefined;
        if (!workspace)
            throw new Error('SHARE_STATE_UNAVAILABLE');
        // A locally owned project can lack a catalog before its first share in
        // either workspace type. Register proven authorship, never content or
        // sharing intent; omitted sync/version/metadata preserve existing state.
        if (options.registerLocallyOwnedProject !== false
            && options.resolveLocalProjectOwner?.(identity.projectId, identity.resourceTeamId) === identity.ownerMemberId) {
            // Ensure returns the retained root, including identities established by
            // earlier paired clients. Never replace it with a locally derived ID.
            await ensurePrivateVelaTeamProject(identity.projectId, { teamId: identity.resourceTeamId, memberId: identity.ownerMemberId,
                role: workspace.role, lifecycleState: workspace.lifecycleState }, args => (options.runCommand ?? runPinnedVelaCommand)({
                args, session, workspaceId: identity.resourceTeamId, dataRoot: options.dataRoot, configuredEnv,
            }));
        }
        const output = await (options.runCommand ?? runPinnedVelaCommand)({
            args: ['share', 'project-status', identity.projectId, '--json'], session,
            workspaceId: identity.resourceTeamId, dataRoot: options.dataRoot, configuredEnv,
        });
        return parseProjectShareState(output, identity.projectId);
    };
}
/** Missing/unauthorized/error replies never become an empty history. */
export function parseProjectShareState(output, projectId) {
    let value;
    try {
        value = JSON.parse(output);
    }
    catch {
        throw new Error('SHARE_STATE_INVALID');
    }
    if (!value || typeof value !== 'object' || !('projectId' in value) || value.projectId !== projectId
        || !('bindingExists' in value) || typeof value.bindingExists !== 'boolean'
        || !('publications' in value) || !Array.isArray(value.publications))
        throw new Error('SHARE_STATE_INVALID');
    const seen = new Set();
    const publications = value.publications.map((item) => {
        if (!item || typeof item !== 'object' || !('sourceFilePath' in item) || typeof item.sourceFilePath !== 'string'
            || item.sourceFilePath.includes('\\') || item.sourceFilePath.includes('\0')
            || item.sourceFilePath.split('/').some(part => !part || part === '.' || part === '..')
            || !('slug' in item) || typeof item.slug !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.slug)
            || !('status' in item) || (item.status !== 'active' && item.status !== 'stopped')
            || ('sourceFileId' in item && (typeof item.sourceFileId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.sourceFileId)))
            || seen.has(item.slug))
            throw new Error('SHARE_STATE_INVALID');
        seen.add(item.slug);
        // Only an active publication has an address; a stopped one carries none.
        const amrLink = item.status === 'active' ? parseAmrShareLink(item, projectId, item.slug) : null;
        return { sourceFilePath: item.sourceFilePath, ...('sourceFileId' in item ? { sourceFileId: item.sourceFileId } : {}), slug: item.slug, status: item.status, ...(amrLink ? { amrLink } : {}) };
    });
    if (value.bindingExists !== (publications.length > 0))
        throw new Error('SHARE_STATE_INVALID');
    return { projectId, bindingExists: value.bindingExists, hasEverShared: hasEverShared({ bindingExists: value.bindingExists }), publications };
}
export class UnboundFileShareIdentityError extends Error {
    constructor() { super('SHARE_FILE_IDENTITY_UNAVAILABLE'); }
}
/** History contains retired aliases at reused paths. Only the current lifetime
 * may drive file status/resume; an unbound live share is neither absence nor
 * authority to infer/migrate its identity. Existing project history/stop stays usable. */
export function currentFileSharePublication(history, filePath, sourceFileId) {
    if (sourceFileId && history.publications.some(item => item.sourceFilePath === filePath
        && item.sourceFileId === undefined && item.status === 'active'))
        throw new UnboundFileShareIdentityError();
    const matches = history.publications.filter(item => item.sourceFilePath === filePath
        && (sourceFileId ? item.sourceFileId === sourceFileId : item.sourceFileId === undefined));
    return matches.length === 1 ? matches[0] : undefined;
}
//# sourceMappingURL=vela-project-share-state.js.map