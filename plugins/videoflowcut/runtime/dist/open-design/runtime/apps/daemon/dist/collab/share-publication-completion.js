import { confirmedReceipt, recordPendingShareBinding } from './share-binding-outbox.js';
import { publishedPathForSource } from './share-file-mapping.js';
/** Persist local witnesses and both kinds of intent in one transaction, after
 * confirmed network publication. A failed pending write retains the receipt in
 * the response, but cannot promise an automatic binding retry.
 * All dependencies must use the same database; no callback performs network I/O.
 */
export function createSharePublicationCompletion(db, recordPublication, outbox, retryAvailable = false) {
    const commit = db.transaction((input) => {
        const revision = recordPublication(input.scope, input.publication, input.mapping, input.reopened === true);
        if (input.result.status === 'published')
            return input.result;
        const pending = recordPendingShareBinding(outbox, { ...input.scope, resourceId: input.resourceId,
            publicationRevision: revision.token, receipt: input.result.receipt }, retryAvailable, true);
        if (pending.status !== 'binding_pending')
            throw new Error('SHARE_BINDING_OUTCOME_INVALID');
        return { status: 'binding_pending', receipt: input.result.receipt,
            binding: { retrying: pending.binding.retrying,
                ...(input.result.binding.code ? { code: input.result.binding.code } : {}) } };
    });
    return (input) => {
        const receipt = confirmedReceipt(input.result.receipt);
        if (receipt.filePath !== input.scope.filePath || receipt.slug !== input.publication.slug
            || receipt.entryPath !== publishedPathForSource(input.mapping, input.scope.filePath)) {
            throw new Error('SHARE_PUBLICATION_RECEIPT_MISMATCH');
        }
        input = { ...input, result: { ...input.result, receipt } };
        try {
            return commit(input);
        }
        catch (error) {
            if (input.result.status === 'published')
                throw error;
            return { status: 'binding_pending', receipt: input.result.receipt,
                binding: { retrying: false, code: 'SHARE_BINDING_RETRY_UNAVAILABLE' } };
        }
    };
}
//# sourceMappingURL=share-publication-completion.js.map