/** Bounded root-publish scheduling only, never evidence of a file lifetime.
 * Active physical runs may temporarily remove files during normal edits.
 * Preserve pending work until the LAST run settles; restart recovery uses
 * persisted content checkpoints/facts at the existing startup boundary.
 */
export function createCommentFilePublicationCoordination(deps) {
    const pending = new Map();
    const publications = new Map();
    return {
        /** The Run is already accepted/visible as busy before this starter gate.
         * Only cwd-writing startup waits; ongoing Runs and other projects do not.
         * No wait is introduced when there is no bounded publication in flight.
         */
        start(projectId, starter) {
            const publication = projectId ? publications.get(projectId) : undefined;
            return publication ? publication.then(starter) : starter();
        },
        async run(projectId, principal, operation) {
            if (deps.isBusy(projectId)) {
                let principals = pending.get(projectId);
                if (!principals) {
                    principals = new Map();
                    pending.set(projectId, principals);
                }
                principals.set(JSON.stringify([principal.teamId, principal.memberId]), { ...principal });
                throw new Error('COMMENT_FILE_PROJECT_BUSY');
            }
            // Acquire synchronously with the busy check, before operation's first
            // await. Callers serialize root publications via publicFileMutations.
            if (publications.has(projectId))
                throw new Error('COMMENT_FILE_PUBLICATION_IN_PROGRESS');
            let release;
            const reservation = new Promise(resolve => { release = resolve; });
            publications.set(projectId, reservation);
            try {
                return await operation();
            }
            finally {
                publications.delete(projectId);
                release();
            }
        },
        settled(projectId) {
            if (deps.isBusy(projectId))
                return;
            const principals = pending.get(projectId);
            pending.delete(projectId);
            for (const principal of principals?.values() ?? [])
                deps.wake(projectId, principal);
        },
    };
}
//# sourceMappingURL=comment-file-publication-coordination.js.map