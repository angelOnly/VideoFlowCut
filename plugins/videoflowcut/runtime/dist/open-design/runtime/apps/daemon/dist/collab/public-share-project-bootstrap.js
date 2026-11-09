import { isUnmaterializedSharedPlaceholder } from './shared-project-placeholder.js';
import { ensurePrivateVelaTeamProject } from './vela-cli-team-projects.js';
import { classifyVelaCommandFailure } from './public-file-failure.js';
class PublicShareProjectBootstrapError extends Error {
    stage;
    failure;
    constructor(stage, failure) {
        super('PUBLIC_SHARE_PROJECT_BOOTSTRAP_FAILED');
        this.stage = stage;
        this.failure = failure;
    }
}
/** Emit only bounded stage/reason tokens; arbitrary child errors never cross the logging boundary. */
export function publicShareProjectBootstrapDiagnostic(error) {
    return error instanceof PublicShareProjectBootstrapError
        ? { stage: error.stage, failure: error.failure }
        : { stage: 'bootstrap', failure: { reason: 'unknown' } };
}
/** Establish creator identity without uploading local metadata or root bytes.
 * Existing team policy and the server-generated root are never replaced. */
export async function ensurePublicShareProject(input) {
    const { projectId, principal, run } = input;
    let stage = 'bootstrap_content_preflight';
    try {
        const metadata = input.describeProject(projectId);
        if (!metadata || isUnmaterializedSharedPlaceholder({ metadata: metadata.metadata })) {
            throw new PublicShareProjectBootstrapError(stage, { reason: 'local_file' });
        }
        stage = 'bootstrap_catalog_upsert';
        const registered = await ensurePrivateVelaTeamProject(projectId, principal, run);
        input.retainRoot?.(registered);
        return { ...registered, createdAt: Date.parse(registered.createdAt), sharedAt: registered.createdAt };
    }
    catch (error) {
        if (error instanceof PublicShareProjectBootstrapError)
            throw error;
        const { reason, upstreamStatus } = classifyVelaCommandFailure('push', error);
        throw new PublicShareProjectBootstrapError(stage, { reason, ...(upstreamStatus !== undefined ? { upstreamStatus } : {}) });
    }
}
//# sourceMappingURL=public-share-project-bootstrap.js.map