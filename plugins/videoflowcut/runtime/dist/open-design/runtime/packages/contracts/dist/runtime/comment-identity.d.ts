/** Comment-only identity. Never substitute text, position, or tool IDs for it. */
export declare const COMMENT_ID_ATTRIBUTE = "data-od-comment-id";
export declare const COMMENT_ID_PREFIX = "cmt:";
export declare function isCommentUuid(value: unknown): value is string;
export declare function commentElementId(uuid: string): string;
export declare function commentUuidFromElementId(value: unknown): string | null;
export declare function commentIdentitySelector(uuid: string): string;
/** Check before indexing: a Map alone silently discards duplicate targets. */
export declare function uniqueCommentIdentity(values: readonly string[], uuid: string): boolean;
//# sourceMappingURL=comment-identity.d.ts.map