/**
 * Group properties derived from an authoritative Workspace project-list read.
 * Only canonical views update the group: filtered subsets must never overwrite
 * the Workspace's total project count.
 */
export declare function workspaceProjectGroupCountProperties(input: {
    view: string;
    owner: string;
    visibility: string;
    projectCount: number;
}): Record<string, number> | null;
