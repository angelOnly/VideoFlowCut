import { isAbortedOperationError } from './aborted-error.js';
/**
 * Node's exec error repeats the full command line in `message`, `cmd`, and
 * `stack`, and callers log those verbatim. Replace the values of identity /
 * user-content flags there before the error leaves the runner. Only the
 * `<flag> <value>` occurrences are rewritten, so stderr (which carries the
 * `API request failed with status NNN` classification signal) is untouched.
 */
export declare function redactVelaCommandError(error: unknown, args: readonly string[]): unknown;
/**
 * Read the stdout captured by `withCommandStdout` off a rejected Vela command.
 * Returns an empty string when the failure carried none (a crash before any
 * output, or a non-object rejection).
 */
export declare function velaCommandStdout(error: unknown): string;
/** Read the exact stderr produced by a rejected Vela command. */
export declare function velaCommandStderr(error: unknown): string;
export interface VelaCommandOptions {
    env?: NodeJS.ProcessEnv;
    configuredEnv?: Record<string, string>;
    maxBuffer?: number;
    /**
     * Terminate the child process tree when it exceeds this wall-clock budget.
     * Rejection happens only after termination is confirmed, so callers cannot
     * release a materialization lock while the old process may still be writing.
     */
    timeoutMs?: number;
    /** Optional caller cancellation with the same confirmed-termination rule. */
    signal?: AbortSignal;
    /** Grace for each of SIGTERM and SIGKILL confirmation. Defaults to 500ms. */
    terminationGraceMs?: number;
    /**
     * Observe buffered stderr after the child exits. The stdout return contract
     * stays unchanged; observer failures never affect command completion.
     */
    onStderr?: (stderr: string) => void;
    /** Optional bytes written to the child stdin before it is closed. */
    input?: string | Buffer;
}
export declare function velaWorkspaceCommandOptions(workspaceId: string | null | undefined): VelaCommandOptions;
/**
 * Run the same resolved Vela binary and environment used by OpenDesign login
 * and AMR agent launches. Resource/team/collab adapters must use this instead
 * of spawning a PATH-only `vela` process, otherwise a packaged login can
 * succeed while the collaboration command uses a different or missing CLI.
 */
export declare function runVelaCommand(args: string[], options?: VelaCommandOptions): Promise<string>;
export { isAbortedOperationError as isAbortedVelaCommandError };
