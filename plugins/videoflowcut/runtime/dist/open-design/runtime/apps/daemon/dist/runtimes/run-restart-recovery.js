const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled']);
export const RESTART_ERROR_CODE = 'DAEMON_RESTARTED';
export const RESTART_ERROR_MESSAGE = 'Run interrupted because the daemon restarted.';
export function interruptDurableRunAfterDaemonRestart(state, now = Date.now()) {
    if (TERMINAL_STATUSES.has(state.status))
        return false;
    state.status = 'failed';
    state.updatedAt = now;
    state.terminalAt = now;
    state.exitCode = 1;
    state.signal = null;
    state.error = RESTART_ERROR_MESSAGE;
    state.errorCode = RESTART_ERROR_CODE;
    state.terminalTrigger = 'daemon_restart';
    state.terminalRecoveryReason = 'daemon_restart';
    return true;
}
//# sourceMappingURL=run-restart-recovery.js.map