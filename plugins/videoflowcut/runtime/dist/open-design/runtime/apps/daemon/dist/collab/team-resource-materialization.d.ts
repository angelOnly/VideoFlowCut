export interface TeamResourceMaterializationIdentity {
    kind: 'design_system' | 'plugin' | 'skill';
    workspaceId: string;
    resourceId: string;
    hubResourceId: string;
    sourceKey: string;
}
export type TeamResourceMaterializationResult = {
    status: 'committed';
    targetDir: string;
    sourceKey: string;
} | {
    status: 'revoked';
};
export declare function teamResourceWorkspaceRoot(kindRoot: string, workspaceId: string): string;
export declare function teamResourceMaterializationDir(kindRoot: string, workspaceId: string, resourceId: string, storageName?: string): string;
export declare function teamResourceSourceKey(input: {
    kind: TeamResourceMaterializationIdentity['kind'];
    workspaceId: string;
    resourceId: string;
}): string;
export declare function readTeamResourceMaterialization(kindRoot: string, workspaceId: string, resourceId: string, storageName?: string): Promise<TeamResourceMaterializationIdentity | null>;
export declare function readWorkspaceScopedTeamResourceFile(kindRoot: string, workspaceId: string, resourceId: string, relativePath: string, storageName?: string): Promise<Buffer | null>;
/**
 * Pull into an invisible staging directory, then close both authorization
 * races before replacing the exact Workspace's live copy. A directory/listing
 * failure is a revocation verdict, never permission to commit downloaded
 * bytes.
 */
export declare function materializeWorkspaceScopedTeamResource(input: {
    kindRoot: string;
    identity: Omit<TeamResourceMaterializationIdentity, 'sourceKey'>;
    storageName?: string;
    pullInto: (stagedDir: string) => Promise<void>;
    verifyWorkspaceScope: () => Promise<boolean>;
    verifyStillShared: () => Promise<boolean>;
}): Promise<TeamResourceMaterializationResult>;
