import type { ProjectContentTransferState } from '@open-design/contracts';
export interface ProjectContentTransferScope {
    projectId: string;
    workspaceId: string;
    resourceTeamId: string;
    viewerMemberId: string;
    ownerMemberId: string;
}
declare const projectContentTransferTokenBrand: unique symbol;
/**
 * Opaque capability for completing one exact transfer generation. Runtime
 * membership is also checked, so a structurally copied token cannot finish a
 * transfer.
 */
export interface ProjectContentTransferToken {
    readonly generation: number;
    readonly scopeKey: string;
    readonly [projectContentTransferTokenBrand]: true;
}
export interface ProjectContentTransferStart {
    token: ProjectContentTransferToken;
    state: ProjectContentTransferState;
}
export interface ProjectContentTransferStateStore {
    begin(scope: ProjectContentTransferScope, version?: number): ProjectContentTransferStart;
    finish(scope: ProjectContentTransferScope, token: ProjectContentTransferToken, version?: number): ProjectContentTransferState | null;
    read(scope: ProjectContentTransferScope): ProjectContentTransferState | null;
}
export interface ProjectContentTransferStateStoreOptions {
    now?: () => number;
    onChange?: (scope: ProjectContentTransferScope, state: ProjectContentTransferState) => void;
}
/**
 * Process-local transfer snapshot used by both project SSE and
 * `/collab/status`.
 *
 * A project id alone is not a safe identity: the same id can be observed
 * across workspace/resource/owner bindings. Each actual begin also issues a
 * fresh opaque generation token. Only that exact token together with the same
 * scope may finish the current transfer, so a versionless event or an older
 * async completion cannot hide a newer transfer.
 */
export declare function createProjectContentTransferStateStore(options?: ProjectContentTransferStateStoreOptions): ProjectContentTransferStateStore;
export {};
