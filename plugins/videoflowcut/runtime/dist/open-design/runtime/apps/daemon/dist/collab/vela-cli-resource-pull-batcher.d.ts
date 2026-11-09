import { type VelaResourcePullBatchRequest } from './vela-cli-resource-adapter.js';
export interface VelaResourcePullRequest {
    workspaceId: string;
    kind: 'design_system' | 'plugin' | 'skill';
    resourceId: string;
    dir: string;
    ref?: string;
}
export type RunVelaResourceBatch = (requests: readonly VelaResourcePullBatchRequest[], workspaceId: string) => Promise<string>;
/**
 * Coalesce resource pulls admitted in the same event-loop turn into one Vela
 * process. Workspace scope is a process-wide identity input, so queues never
 * cross workspace boundaries. Each caller still owns its private staging
 * directory and receives its own success/failure verdict.
 */
export declare function createVelaResourcePullBatcher(run?: RunVelaResourceBatch): {
    pull(request: VelaResourcePullRequest): Promise<void>;
};
