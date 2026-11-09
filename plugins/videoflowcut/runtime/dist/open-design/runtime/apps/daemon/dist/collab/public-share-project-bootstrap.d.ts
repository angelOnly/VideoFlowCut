import type { ApiFailureReason, PublicShareProjectRegistration, TeamProject } from '@open-design/contracts';
import type { runVelaCommand } from '../integrations/vela-command.js';
import type { ResourceHubPrincipal } from './resource-principal.js';
import { type PublicShareBootstrapStage } from './public-file-failure.js';
/** Emit only bounded stage/reason tokens; arbitrary child errors never cross the logging boundary. */
export declare function publicShareProjectBootstrapDiagnostic(error: unknown): {
    stage: PublicShareBootstrapStage;
    failure: {
        reason: ApiFailureReason;
        upstreamStatus?: number;
    };
};
/** Establish creator identity without uploading local metadata or root bytes.
 * Existing team policy and the server-generated root are never replaced. */
export declare function ensurePublicShareProject(input: {
    projectId: string;
    principal: ResourceHubPrincipal;
    run: typeof runVelaCommand;
    describeProject(projectId: string): Record<string, unknown> | null;
    retainRoot?(registration: PublicShareProjectRegistration): void;
}): Promise<TeamProject & Omit<PublicShareProjectRegistration, 'createdAt'>>;
