import { SHARE_STATUSES } from '@open-design/contracts';
import { runVelaCommand, velaWorkspaceCommandOptions } from '../integrations/vela-command.js';
/** Owner-only lookup: not-found is non-enumerable, not proof of absence or stop.
 * Callers may inject a runner pinned to their verified session.
 */
export async function readVelaShareStatus(input, run = runVelaCommand) {
    const request = { ...input };
    if ([request.workspaceId, request.projectId, request.slug].some(value => typeof value !== 'string' || !value.trim()))
        return { known: false };
    try {
        const stdout = await run(['share', 'status', request.slug, '--project-id', request.projectId, '--json'], { ...velaWorkspaceCommandOptions(request.workspaceId), timeoutMs: 30_000 });
        const value = JSON.parse(stdout);
        if (!value || typeof value !== 'object' || Array.isArray(value))
            return { known: false };
        const record = value;
        if (record.projectId !== request.projectId || record.slug !== request.slug)
            return { known: false };
        const status = SHARE_STATUSES.find(candidate => candidate === record.status);
        if (!status)
            return { known: false };
        return { known: true, projectId: request.projectId, slug: request.slug, status,
            bindingExists: true, shareStopped: status === 'stopped' };
    }
    catch {
        // Raw transport errors may contain URLs or session material.
        return { known: false };
    }
}
//# sourceMappingURL=vela-share-status.js.map