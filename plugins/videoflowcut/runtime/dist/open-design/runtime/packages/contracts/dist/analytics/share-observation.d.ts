/** Optional source facts for passive share analytics. No business validation or I/O. */
export declare function publishReceiptObservation(value: unknown): {
    share_version?: number;
    published_at?: number;
};
/** Saved IDs only: temporary board notes and unclassified legacy attachments are not original comments. */
export declare function savedCommentIds(value: unknown): string[] | undefined;
//# sourceMappingURL=share-observation.d.ts.map