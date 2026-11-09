import { runVelaCommand, velaWorkspaceCommandOptions } from '../integrations/vela-command.js';
import { safeVelaCommandError } from './public-file-failure.js';
import { parseAmrShareLink } from './public-share-viewer-url.js';
/** Reserve the original file's stable identity before any remote mutation.
 * A rejected call leaves the reservation intact for the next explicit attempt.
 * This does not retry, record a successful publication, or enqueue binding.
 */
export async function publishReservedVelaShareVersion(input, reservations, run = runVelaCommand) {
    const { scope, ...upload } = input;
    const identity = { ...scope };
    const target = reservations.reserve(identity);
    return publishVelaShareVersion({ ...upload, ...target,
        workspaceId: identity.resourceTeamId, projectId: identity.projectId, filePath: identity.filePath,
    }, run);
}
/** Go share publish atomically advances the alias and binds the project.
 * Accept only a committed receipt for this exact alias, entry and immutable upload.
 * A two-step CLI binary returning binding_pending cannot satisfy this contract.
 */
export async function publishVelaShareVersion(input, run = runVelaCommand) {
    let reason = 'internal';
    try {
        const request = Object.freeze({ ...input });
        // Blank versionId makes the Go command fall back to a mutable ref; blank
        // workspace can similarly select ambient scope. Refuse before spawning.
        const required = [request.filePath, request.workspaceId, request.projectId, request.resourceId,
            request.slug, request.sourceKey, request.entryPath, request.name, request.versionId];
        if (required.some(value => typeof value !== 'string' || !value.trim())) {
            throw new Error('missing publish identity');
        }
        reason = undefined;
        const stdout = await run([
            'share', 'publish', request.resourceId,
            '--project-id', request.projectId,
            '--source-file-path', request.filePath,
            '--slug', request.slug,
            '--source-key', request.sourceKey,
            '--entry-path', request.entryPath,
            '--name', request.name,
            '--version-id', request.versionId,
            '--json',
        ], { ...velaWorkspaceCommandOptions(request.workspaceId), timeoutMs: 30_000 });
        reason = 'invalid_receipt';
        const value = JSON.parse(stdout);
        if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new Error('invalid receipt');
        const record = value;
        const snapshot = record.snapshot;
        if (record.slug !== request.slug || record.entryPath !== request.entryPath
            || typeof record.version !== 'number' || !Number.isSafeInteger(record.version) || record.version < 1
            || typeof record.publishedAt !== 'number' || !Number.isSafeInteger(record.publishedAt) || record.publishedAt < 0
            || !snapshot || typeof snapshot !== 'object' || !('versionId' in snapshot)
            || snapshot.versionId !== request.versionId)
            throw new Error('mismatched receipt');
        const acknowledged = record.receipt;
        if (!acknowledged || typeof acknowledged !== 'object' || Array.isArray(acknowledged))
            throw new Error('missing receipt');
        const confirmed = acknowledged;
        if (confirmed.slug !== request.slug || confirmed.versionId !== request.versionId
            || confirmed.entryPath !== request.entryPath || confirmed.version !== record.version
            || confirmed.publishedAt !== record.publishedAt)
            throw new Error('inconsistent receipt');
        const receipt = { filePath: request.filePath, slug: request.slug, version: record.version,
            versionId: request.versionId, publishedAt: record.publishedAt, entryPath: request.entryPath };
        if (record.status !== 'published')
            throw new Error('unconfirmed publish outcome');
        const amrLink = parseAmrShareLink(record, request.projectId, request.slug);
        return { status: 'published', receipt, ...(amrLink ? { amrLink } : {}) };
    }
    catch (error) {
        // Keep only safe classification through both wrappers. No raw child output,
        // fallback or implicit retry: the remote pointer may already have advanced.
        throw safeVelaCommandError('PUBLIC_SHARE_PUBLISH_FAILED', error, reason);
    }
}
//# sourceMappingURL=vela-share-publish.js.map