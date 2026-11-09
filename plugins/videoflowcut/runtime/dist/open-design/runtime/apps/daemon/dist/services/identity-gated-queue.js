/**
 * Invariant (OPEND-4220): an event that arrives before the installation
 * identity exists is retained, not lost, and is delivered before any later
 * event so a launch attempt is never counted after its own result. Retention is
 * bounded; overflow drops the newest item rather than growing without limit.
 */
export function createIdentityGatedQueue(options) {
    const retained = [];
    let chain = Promise.resolve();
    const serialized = (task) => {
        const next = chain.then(task, task);
        chain = next.catch(() => undefined);
        return next;
    };
    const resolveSafely = async () => {
        try {
            return await options.resolveIdentity();
        }
        catch {
            return 'pending';
        }
    };
    const drain = async () => {
        if (retained.length === 0)
            return;
        if ((await resolveSafely()) === 'pending')
            return;
        for (const item of retained.splice(0)) {
            try {
                await options.deliver(item);
            }
            catch { /* Delivery is best-effort. */ }
        }
    };
    return {
        submit: (item) => serialized(async () => {
            if (retained.length < options.limit)
                retained.push(item);
            await drain();
        }),
        flush: () => serialized(drain),
        size: () => retained.length,
    };
}
//# sourceMappingURL=identity-gated-queue.js.map