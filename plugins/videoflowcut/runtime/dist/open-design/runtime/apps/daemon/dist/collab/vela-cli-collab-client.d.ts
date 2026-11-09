import { type CommentBatchPushRequest, type CommentBatchPushResponse } from "@open-design/contracts";
import type { CollabCloudComment, CollabCloudMemberDirectoryEntry, CollabMemberRole, CollabPresenceMember } from "@open-design/contracts";
import { CollabCloudError, type CollabCloudMemberPageQuery, type CollabCloudMemberPageResult } from "../integrations/collab-cloud.js";
import { type VelaCommandOptions } from "../integrations/vela-command.js";
export type RunVelaCollab = (args: string[], workspaceId?: string, options?: Pick<VelaCommandOptions, "input">) => Promise<string>;
export interface VelaCliCollabClientOptions {
    run?: RunVelaCollab;
}
export interface VelaCliPresenceHeartbeatInput {
    member: CollabPresenceMember;
    clientId?: string;
    filePath?: string | null;
    activity?: CollabPresenceMember["activity"];
}
export interface VelaCliPresenceLeaveInput {
    memberId: string;
    clientId?: string;
}
export declare function createVelaCliCollabClient(options?: VelaCliCollabClientOptions): {
    isConfigured(): boolean;
    registerMember(_teamId: string, _memberId: string, input: {
        displayName: string;
        role: CollabMemberRole;
    }): Promise<CollabCloudMemberDirectoryEntry>;
    listMembers(_teamId: string): Promise<CollabCloudMemberDirectoryEntry[]>;
    pushCommentBatch(workspaceId: string, projectId: string, request: CommentBatchPushRequest): Promise<CommentBatchPushResponse>;
    pushComment(_teamId: string, projectId: string, comment: CollabCloudComment, idempotencyKey?: string, historicalAuthorMemberId?: string): Promise<{
        seq: number;
    }>;
    /**
     * One C3-LITE member page via `vela collab comment pull --mode … --json`.
     * A failed command's `{error, errorCode, status}` stdout envelope becomes a
     * CollabCloudError first, so cursor-invalidating codes map to
     * `rebuild-required` exactly as on the HTTP transport.
     */
    pullMemberPage(teamId: string, projectId: string, query: CollabCloudMemberPageQuery): Promise<CollabCloudMemberPageResult>;
    pullComments(_teamId: string, projectId: string, sinceSeq: number): Promise<{
        comments: CollabCloudComment[];
        latestSeq: number;
        notModified: boolean;
        etag: string | null;
    }>;
    heartbeatPresence(projectId: string, input: VelaCliPresenceHeartbeatInput, workspaceId: string): Promise<CollabPresenceMember[]>;
    listPresence(projectId: string, workspaceId: string): Promise<CollabPresenceMember[]>;
    leavePresence(projectId: string, input: VelaCliPresenceLeaveInput, workspaceId: string): Promise<CollabPresenceMember[]>;
};
export type VelaCliCollabClient = ReturnType<typeof createVelaCliCollabClient>;
/**
 * Preserve a Vela command's machine-readable HTTP failure without ever
 * classifying its human stderr. `runVelaCommand` carries rejected stdout, and
 * structured command envelopes put the Go-defined fields at the root. Legacy
 * nested `error.code` remains accepted. A code alone cannot cancel data;
 * a structured 413 without a code can only pause delivery.
 */
export declare function collabCloudErrorFromVelaFailure(error: unknown): CollabCloudError | null;
export declare function shouldUseVelaCliCollabTransport(env?: NodeJS.ProcessEnv): boolean;
export declare function createVelaCliCollabClientFromEnv(env?: NodeJS.ProcessEnv, options?: Omit<VelaCliCollabClientOptions, "run">): VelaCliCollabClient | null;
