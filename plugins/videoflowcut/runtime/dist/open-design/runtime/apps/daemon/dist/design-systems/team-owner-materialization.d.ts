export interface WorkspaceDesignSystemBindingWitness {
    workspaceId: string;
    visibility: string;
    resourceState: string | null;
    createdByWorkspaceMemberId: string | null;
}
export declare function ownedDesignSystemSourceIsReady(input: {
    ownerMemberId: string | null | undefined;
    currentMemberId: string;
    workspaceId: string;
    localSourceExists: boolean;
    binding: WorkspaceDesignSystemBindingWitness | null | undefined;
}): boolean;
