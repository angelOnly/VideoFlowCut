import { cleanupClosedCodexThread } from './thread-cleanup.js';
/** Own the original child-close boundary independently of mutable run attempts. */
export function createCodexThreadCleanupOwner() {
    const pending = new Set();
    const bound = new WeakSet();
    let expired = false;
    return {
        bind(child, session, invocation, report, evidenceCollected) {
            if (expired || bound.has(child))
                return;
            bound.add(child);
            // Later config updates or retry generations cannot change this process's
            // executable, wrapper arguments, environment or workspace authority.
            const context = { ...invocation, args: [...invocation.args], env: { ...invocation.env } };
            let complete = () => { };
            const completion = new Promise(resolve => { complete = resolve; });
            const finish = () => { pending.delete(work); complete(); };
            const work = { child, started: false, completion, complete,
                onClose: () => {
                    // bind() must run after attach(): the session's earlier close listener
                    // establishes the proof before the ordinary run close handler aborts.
                    const receipt = session.takeClosedThreadCleanup();
                    if (!receipt) {
                        finish();
                        return;
                    }
                    void (async () => {
                        let result;
                        try {
                            // Archive moves rollout paths. Keep the close-time receipt, but
                            // let this attempt finish reading its evidence before moving it.
                            await evidenceCollected;
                            if (expired)
                                return;
                            work.started = true;
                            result = await cleanupClosedCodexThread({ ...context, receipt });
                        }
                        catch (error) {
                            result = { status: 'failed', message: String(error) };
                        }
                        try {
                            report(result);
                        }
                        catch (error) {
                            console.warn('[codex] thread cleanup diagnostic failed', error);
                        }
                    })().finally(finish);
                },
            };
            pending.add(work);
            child.once('close', work.onClose);
        },
        async drain(timeoutMs) {
            if (pending.size === 0)
                return { pending: 0 };
            const budget = Number.isFinite(timeoutMs) ? Math.max(0, Math.min(3000, timeoutMs)) : 3000;
            let timer;
            try {
                return await Promise.race([
                    Promise.all([...pending].map(work => work.completion)).then(() => ({ pending: pending.size })),
                    new Promise(resolve => {
                        timer = setTimeout(() => {
                            expired = true;
                            const remaining = pending.size;
                            // No late close may launch a fresh cleanup after shutdown's
                            // deadline. Already started helpers retain their own bounded
                            // process cleanup and still report their independent result.
                            for (const work of pending) {
                                if (work.started)
                                    continue;
                                work.child.removeListener('close', work.onClose);
                                pending.delete(work);
                                work.complete();
                            }
                            resolve({ pending: remaining });
                        }, budget);
                    }),
                ]);
            }
            finally {
                clearTimeout(timer);
            }
        },
    };
}
//# sourceMappingURL=cleanup-owner.js.map