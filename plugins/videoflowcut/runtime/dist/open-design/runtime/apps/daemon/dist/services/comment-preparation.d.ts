import { type PrepareCommentIdentityRequest, type PrepareCommentIdentityResponse, type ProjectMetadata } from '@open-design/contracts';
export declare class CommentPreparationError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status?: number);
}
/** Insert attributes using parser source offsets: never serialize/reformat authored HTML.
 * Validate the whole authored document before indexing, including non-selectable nodes.
 */
export declare function prepareStaticCommentSource(source: string): {
    source: string;
    preparedTargets: number;
};
/** Locally serialized preparation, NOT an atomic filesystem transaction or global CAS.
 * Saves participating in withProjectFileVersionLock serialize. External writers can race after any read; observed
 * changes are rejected, but no lock here can exclude an external OS writer.
 * Failure never rolls source back (a rollback could destroy a later edit).
 */
export declare function prepareCommentIdentity(projectsRoot: string, projectId: string, fileName: string, request: PrepareCommentIdentityRequest, metadata?: ProjectMetadata, editingBusy?: () => boolean): Promise<PrepareCommentIdentityResponse>;
