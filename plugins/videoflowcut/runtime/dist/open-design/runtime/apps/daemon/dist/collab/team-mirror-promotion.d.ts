import type { AuthorizedTeamProjectPullReceipt, AuthorizedTeamProjectStageIdentity } from './authorized-team-project-pull.js';
export interface TeamMirrorPromotionJournalRecord {
    schemaVersion: 1;
    id: string;
    receipt: AuthorizedTeamProjectPullReceipt;
    liveDir: string;
    stageDir: string;
    recoveryDir: string;
    liveExisted: boolean;
    phase: 'prepared' | 'live-moved' | 'promoted';
    promotedIdentity: AuthorizedTeamProjectStageIdentity;
    recoveryIdentity?: AuthorizedTeamProjectStageIdentity;
}
interface ActiveWorkspaceSnapshot {
    workspaceId: string | null;
    generation: number;
}
interface PromotionDurability {
    syncDirectory?: (directory: string) => Promise<void>;
    renameDirectorySync?: (from: string, to: string) => void;
}
export interface PromoteAuthorizedTeamProjectStageInput<T> {
    receipt: AuthorizedTeamProjectPullReceipt;
    liveDir: string;
    stageDir: string;
    expectedStageIdentity: AuthorizedTeamProjectStageIdentity;
    journalDir: string;
    /** Exact-scope authorization captured by the caller. When present it
     * replaces the legacy mutable-active-Workspace guard below. */
    isScopeStillAuthorized?: () => boolean;
    /** Legacy compatibility seam for older callers/tests. New data-plane
     * callers must use `isScopeStillAuthorized`. */
    expectedWorkspaceId?: string;
    activeWorkspaceGeneration?: number;
    getActiveWorkspaceSnapshot?: () => ActiveWorkspaceSnapshot;
    isExpectedVersion: () => boolean;
    validateReceipt: () => void;
    commit: () => T;
    onPostCommitCleanupError?: (error: unknown) => void;
    durability?: PromotionDurability;
}
export interface RecoverAuthorizedTeamProjectPromotionsInput {
    journalDir: string;
    allowedProjectsRoot: string;
    isCommitted: (entry: TeamMirrorPromotionJournalRecord) => boolean;
    isSuperseded?: (entry: TeamMirrorPromotionJournalRecord) => boolean;
    onError?: (error: unknown) => void;
    durability?: PromotionDurability;
}
export declare function promoteAuthorizedTeamProjectStage<T>(input: PromoteAuthorizedTeamProjectStageInput<T>): Promise<T>;
export declare function recoverAuthorizedTeamProjectPromotions(input: RecoverAuthorizedTeamProjectPromotionsInput): Promise<void>;
export {};
