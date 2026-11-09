/** Presentation origin and binding readiness are independent. A URL names the
 * Viewer route, not a promise that its binding already serves content. */
export function sharePublishResponse(result, presented) {
    const receipt = result.receipt;
    if (presented.url === null) {
        const link = { status: 'unavailable', code: presented.code };
        return result.status === 'published'
            ? { status: 'published', receipt, link }
            : { status: 'binding_pending', receipt, binding: result.binding, link };
    }
    return result.status === 'published'
        ? { status: 'published', receipt, url: presented.url }
        : { status: 'binding_pending', receipt, binding: result.binding, url: presented.url };
}
//# sourceMappingURL=share-publish-response.js.map