/**
 * Exit status the supervisor reports for its target.
 *
 * Invariant: the supervisor's own exit must not hide how its target ended.
 * - A stop the supervisor forwarded (SIGINT/SIGTERM from its owner) is an
 *   orderly shutdown and exits 0.
 * - A target killed by any other signal (e.g. an external SIGKILL) exits with
 *   the POSIX shell convention 128 + signal number, so observers that only see
 *   the supervisor can still tell the target was killed.
 * - Otherwise the target's own exit code passes through (unknown → 1).
 */
export declare function supervisorExitCode(code: number | null, signal: NodeJS.Signals | null, forwardedSignal: NodeJS.Signals | null): number;
/**
 * Inverse of {@link supervisorExitCode} for observers of a supervisor process:
 * recovers the target's terminating signal from a 128 + N exit code.
 */
export declare function signalFromSupervisorExitCode(code: number | null): NodeJS.Signals | null;
//# sourceMappingURL=supervisor-exit.d.ts.map