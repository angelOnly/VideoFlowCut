let parentMonitorExitHolds = 0;
const releaseWaiters = [];
function notifyReleaseWaiters() {
    if (parentMonitorExitHolds > 0)
        return;
    const waiters = releaseWaiters.splice(0);
    for (const waiter of waiters)
        waiter();
}
export function holdParentMonitorExit() {
    parentMonitorExitHolds += 1;
    let released = false;
    return () => {
        if (released)
            return;
        released = true;
        parentMonitorExitHolds = Math.max(0, parentMonitorExitHolds - 1);
        notifyReleaseWaiters();
    };
}
export function isParentMonitorExitHeld() {
    return parentMonitorExitHolds > 0;
}
export function waitForParentMonitorRelease() {
    if (parentMonitorExitHolds === 0)
        return Promise.resolve();
    return new Promise((resolve) => {
        releaseWaiters.push(resolve);
    });
}
export function resetParentMonitorExitHoldForTests() {
    parentMonitorExitHolds = 0;
    notifyReleaseWaiters();
}
//# sourceMappingURL=parent-monitor-gate.js.map