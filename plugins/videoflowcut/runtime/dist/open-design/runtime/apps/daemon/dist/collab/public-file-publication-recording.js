import { publishedPathForSource } from './share-file-mapping.js';
/** Record publication and its comment intent atomically, after network success.
 * The enqueuer is synchronous/local-only. It owns author policy and durable mapping.
 */
export function createPublicFilePublicationRecorder(db, publications, enqueue) {
    return db.transaction((scope, publication, mapping, reopened = false) => {
        const publicFilePath = publishedPathForSource(mapping, scope.filePath);
        if (!publicFilePath)
            throw new Error('SHARE_ENTRY_MAPPING_UNAVAILABLE');
        publications.set(scope, publication);
        const publicationRevision = publications.getRevision(scope);
        if (!publicationRevision?.token || publicationRevision.slug !== publication.slug)
            throw new Error('PUBLICATION_WITNESS_UNAVAILABLE');
        enqueue(db, { scope, publicationRevision, publicFilePath, reopened });
        return publicationRevision;
    });
}
//# sourceMappingURL=public-file-publication-recording.js.map