/** Serialize the entire handler, including authorization and post-request cleanup. */
export function publicFileMutationHandler(mutations, handler) {
    return async (req, res) => {
        const projectId = String(req.params.id ?? req.params[0] ?? '');
        if (mutations)
            await mutations.run(projectId, () => handler(req, res));
        else
            await handler(req, res);
    };
}
//# sourceMappingURL=public-file-mutation-handler.js.map