export function createInternalRunCreationService(deps) {
    const isRunActive = (runId) => {
        const existing = deps.runs.get(runId);
        return Boolean(existing && !deps.runs.isTerminal(existing.status));
    };
    const prepare = (input) => {
        const creation = deps.runs.createOrReuse(input.meta);
        if (creation.kind === 'conflict') {
            return { kind: 'idempotency_conflict', run: creation.run };
        }
        const run = creation.run;
        if (creation.kind === 'reused') {
            if (!input.resume?.requested)
                return { kind: 'reused', run };
            if (!input.resume.canResume(run))
                return { kind: 'resume_not_allowed', run };
            const claim = deps.claimAssistantMessage(run, {
                status: 'queued',
                isRunActive,
            });
            if (!claim.ok) {
                return {
                    kind: 'assistant_claim_conflict',
                    run,
                    ...(claim.reason ? { reason: claim.reason } : {}),
                };
            }
            if (!deps.runs.prepareRestart(run)) {
                return { kind: 'resume_not_allowed', run };
            }
            return { kind: 'ready', run, creationKind: 'reused', resumed: true };
        }
        let claim;
        try {
            claim = deps.claimAssistantMessage(run, {
                ...(input.beforeClaimCommit
                    ? { beforeClaimCommit: () => input.beforeClaimCommit?.(run) }
                    : {}),
                isRunActive,
            });
        }
        catch (error) {
            // The registry create is optimistic. A failed ownership transaction must
            // not leave a physical Run that can be listed, streamed, or reconciled.
            deps.runs.drop(run);
            throw error;
        }
        if (!claim.ok) {
            deps.runs.drop(run);
            return {
                kind: 'assistant_claim_conflict',
                run,
                ...(claim.reason ? { reason: claim.reason } : {}),
            };
        }
        return { kind: 'ready', run, creationKind: 'created', resumed: false };
    };
    return {
        prepare,
        start(run, analytics, starter) {
            // Before the child is spawned: `run_created` describes a Run that has
            // been accepted, and the terminal half must already be attached when the
            // Run settles — including a Run that fails on its first tick.
            deps.analyticsLifecycle.install({ ...analytics, run });
            return deps.runs.start(run, () => {
                if (!deps.coordinateStart)
                    return starter(run);
                return deps.coordinateStart(run, () => {
                    // Cancellation/shutdown may settle an accepted Run while admission
                    // waits. Never spawn its child after the reservation is released.
                    if (run.cancelRequested || deps.runs.isTerminal(run.status))
                        return Promise.resolve();
                    return starter(run);
                });
            });
        },
    };
}
//# sourceMappingURL=internal-run-service.js.map