import { readVelaControlApiContext } from '../integrations/vela.js';
import { fetchVelaWorkspaceDirectory } from './vela-workspace-context.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
import { bindVelaShareVersion } from './vela-share-binding.js';
/** Verify the original principal then bind with that exact session and generation.
 * Directory lookup is the existing integration; binding itself is CLI-only.
 */
export function createVelaShareBindingPrepare(options) {
    return async (task) => {
        const dataRoot = options.dataRoot;
        if (!dataRoot)
            return null;
        const ownerMemberId = task.ownerMemberId;
        const request = Object.freeze({ workspaceId: task.resourceTeamId, projectId: task.projectId,
            resourceId: task.resourceId, sourceFilePath: task.receipt.filePath,
            slug: task.receipt.slug, version: task.receipt.version, versionId: task.receipt.versionId });
        const configuredEnv = { ...(typeof options.configuredEnv === 'function' ? options.configuredEnv() : options.configuredEnv ?? {}) };
        const currentSession = (options.readSession ?? readVelaControlApiContext)(process.env, configuredEnv);
        if (!currentSession?.controlKey || !currentSession.apiUrl)
            return null;
        const session = Object.freeze({ ...currentSession });
        const directory = await (options.fetchDirectory ?? fetchVelaWorkspaceDirectory)({ readSession: () => session });
        if (!directory.ok || !directory.items.some(item => item.workspaceId === request.workspaceId
            && item.workspaceMemberId === ownerMemberId && item.memberStatus === 'active'
            && item.lifecycleState !== 'deleted' && item.lifecycleState !== 'deleting'))
            return null;
        return {
            resourceTeamId: request.workspaceId, ownerMemberId,
            bind: () => bindVelaShareVersion(request, args => (options.runCommand ?? runPinnedVelaCommand)({
                args, session, workspaceId: request.workspaceId, dataRoot, configuredEnv,
            })),
        };
    };
}
//# sourceMappingURL=vela-share-binding-prepare.js.map