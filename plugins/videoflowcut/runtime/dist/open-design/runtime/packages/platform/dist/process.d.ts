/**
 * @module process
 *
 * OS process lifecycle and stamp primitives: encode/decode `--flag=value`
 * process stamps and match them against a contract, spawn background and logged
 * child processes, probe liveness, enumerate process snapshots (POSIX `ps` /
 * Windows `Get-CimInstance`), walk a process tree, and stop a set of PIDs with
 * SIGTERM-then-SIGKILL escalation.
 *
 * Depends on the `command` module for invocation construction; keeps a private
 * `errorCode` copy so it owns no cross-module runtime surface.
 */
import { type ChildProcess } from "node:child_process";
import { type CommandInvocationRequest } from "./command.js";
/** Opt-in query budget; existing snapshot callers retain their current defaults. */
export type ProcessSnapshotOptions = {
    timeoutMs?: number;
};
export type ProcessStampShape = object;
export type ProcessStampField<TStamp extends ProcessStampShape> = Extract<keyof TStamp, string>;
export type ProcessStampContract<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>> = {
    normalizeStamp(input: unknown): TStamp;
    normalizeStampCriteria(input?: unknown): TCriteria;
    stampFields: readonly ProcessStampField<TStamp>[];
    stampFlags: {
        readonly [K in ProcessStampField<TStamp>]: string;
    };
};
export type SpawnProcessRequest = CommandInvocationRequest & {
    cwd?: string;
    detached?: boolean;
    logFd?: number | null;
};
export type ProcessSnapshot = {
    command: string;
    pid: number;
    ppid: number;
    /** OS-reported process creation time when the enumeration backend can provide it. */
    startedAtMs?: number;
};
export type StampedProcessInvocationSnapshot = {
    matches: ProcessSnapshot[];
    processes: ProcessSnapshot[];
    roots: ProcessSnapshot[];
};
export type StampedProcessSetInvocationSnapshot<TCriteria> = {
    entries: Array<StampedProcessInvocationSnapshot & {
        criteria: TCriteria;
    }>;
    processes: ProcessSnapshot[];
};
export type StampedProcessMatchCriteria<TStamp extends ProcessStampShape> = Partial<TStamp>;
export type StopProcessesResult = {
    alreadyStopped: boolean;
    forcedPids: number[];
    matchedPids: number[];
    remainingPids: number[];
    stoppedPids: number[];
};
export type StopProcessesOptions = {
    /** Grace after SIGTERM before SIGKILL escalation. Defaults to 5 seconds. */
    termGraceMs?: number;
    /** Wait after SIGKILL before reporting any survivors. Defaults to 5 seconds. */
    killGraceMs?: number;
    /**
     * Called after a signal was delivered to a PID (`process.kill` returned).
     * Not called for a PID that was already gone (`ESRCH`) or when the call threw.
     */
    onSignal?: (pid: number, signal: NodeJS.Signals) => void;
};
/**
 * Test whether a process command line contains only the given executable path.
 * Windows process enumeration may wrap a no-argument executable in quotes;
 * commands with arguments are deliberately rejected on every platform.
 */
export declare function processCommandExactlyRunsExecutable(command: string, executablePath: string, platform?: NodeJS.Platform): boolean;
/**
 * Serialize a process stamp into `--flag=value` CLI arguments per the contract.
 * Every stamp field must normalize to a string or an error is thrown.
 *
 * @param stamp - The stamp object to encode.
 * @param contract - The stamp contract providing field list, flags, and normalization.
 * @returns The `--flag=value` argument strings, one per stamp field.
 */
export declare function createProcessStampArgs<TStamp extends ProcessStampShape>(stamp: TStamp, contract: ProcessStampContract<TStamp>): string[];
/**
 * Read the value of a CLI flag from an argument list, supporting both the
 * `--flag value` and inline `--flag=value` forms.
 *
 * @param args - The argument list to search.
 * @param flagName - The flag name (including any leading dashes).
 * @returns The flag's value, or `null` when the flag is absent.
 */
export declare function readFlagValue(args: readonly string[], flagName: string): string | null;
/**
 * Decode a process stamp from a raw argument list per the contract, returning
 * `null` when normalization fails (e.g. a required field is missing).
 *
 * @param args - The process argument list to read stamp flags from.
 * @param contract - The stamp contract providing field list, flags, and normalization.
 * @returns The decoded stamp, or `null` when it cannot be normalized.
 */
export declare function readProcessStamp<TStamp extends ProcessStampShape>(args: readonly string[], contract: ProcessStampContract<TStamp>): TStamp | null;
/**
 * Decode a process stamp from a full command-line string by tokenizing it first.
 *
 * @param command - The full command line to read stamp flags from.
 * @param contract - The stamp contract providing field list, flags, and normalization.
 * @returns The decoded stamp, or `null` when it cannot be normalized.
 */
export declare function readProcessStampFromCommand<TStamp extends ProcessStampShape>(command: string, contract: ProcessStampContract<TStamp>): TStamp | null;
/**
 * Test whether a stamp matches criteria: every criterion field that is set must
 * equal the corresponding normalized stamp field; unset criteria fields match
 * anything.
 *
 * @param stamp - The stamp to test.
 * @param criteria - The partial criteria to match against (undefined matches all).
 * @param contract - The stamp contract providing field list and normalization.
 * @returns `true` when every specified criterion matches the stamp.
 */
export declare function matchesProcessStamp<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>>(stamp: TStamp, criteria: TCriteria | undefined, contract: ProcessStampContract<TStamp, TCriteria>): boolean;
/**
 * Test whether a process snapshot's command line carries a stamp matching the
 * criteria. Combines stamp decoding from the command with `matchesProcessStamp`.
 *
 * @param processInfo - A snapshot exposing at least the `command` string.
 * @param criteria - The partial criteria to match against (undefined matches all).
 * @param contract - The stamp contract providing field list and normalization.
 * @returns `true` when the command carries a decodable stamp that matches.
 */
export declare function matchesStampedProcess<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>>(processInfo: Pick<ProcessSnapshot, "command">, criteria: TCriteria | undefined, contract: ProcessStampContract<TStamp, TCriteria>): boolean;
/**
 * Spawn a detached background process, wait for it to actually start, then
 * `unref` it so the parent can exit independently.
 *
 * @param request - The command/args/env plus cwd, detached, and log-fd options.
 * @returns The spawned child's `{ pid }`.
 * @throws If the child fails to spawn or reports no pid.
 */
export declare function spawnBackgroundProcess(request: SpawnProcessRequest): Promise<{
    pid: number;
}>;
/**
 * Spawn a (by default non-detached) child process with stdout/stderr routed to
 * an optional log fd, waiting for it to start before returning the handle.
 *
 * @param request - The command/args/env plus cwd, detached, and log-fd options.
 * @returns The live `ChildProcess` handle.
 * @throws If the child fails to spawn or reports no pid.
 */
export declare function spawnLoggedProcess(request: SpawnProcessRequest): Promise<ChildProcess>;
/**
 * Probe whether a process is alive via a signal-0 `process.kill`. Treats
 * `ESRCH` as dead and any other error (e.g. `EPERM`) as alive.
 *
 * @param pid - The PID to probe (non-number values are treated as dead).
 * @returns `true` when the process appears to exist.
 */
export declare function isProcessAlive(pid: number | null | undefined): boolean;
/**
 * Poll until a process exits or the timeout elapses.
 *
 * @param pid - The PID to wait on.
 * @param timeoutMs - Maximum time to wait, in milliseconds (default 5000).
 * @returns `true` if the process is gone by the deadline, otherwise `false`.
 */
export declare function waitForProcessExit(pid: number | null | undefined, timeoutMs?: number): Promise<boolean>;
/** Capture exact PIDs without paying Windows' full Win32_Process enumeration cost. */
export declare function captureProcessSnapshotsByPids(pids: readonly number[]): Promise<ProcessSnapshot[]>;
/** @internal Parse the JSON emitted by the Windows process enumeration command. */
export declare function parseWindowsProcessSnapshots(stdout: string): ProcessSnapshot[];
/**
 * Capture the current process table without converting backend failure into an
 * empty snapshot. Mutation paths use this strict form so discovery failure can
 * never be mistaken for an already-stopped process set.
 */
export declare function captureProcessSnapshot(options?: ProcessSnapshotOptions): Promise<ProcessSnapshot[]>;
/**
 * Enumerate all running processes as `{ pid, ppid, command }` snapshots, using
 * the platform-appropriate backend. Returns an empty list on any failure.
 *
 * @returns The current process snapshots (empty on error).
 */
export declare function listProcessSnapshots(): Promise<ProcessSnapshot[]>;
/**
 * Select stamped processes that unambiguously existed before an operation's
 * invocation boundary. Windows process enumeration is asynchronous, so its
 * results are fenced by the OS creation time. A matching record exactly on the
 * boundary, or without a creation time, is deliberately rejected instead of
 * risking that a newer generation is terminated.
 *
 * @internal Exported from this module for deterministic boundary tests; the
 * package barrel exposes only `captureStampedProcessSnapshot`.
 */
export declare function selectStampedProcessesAtInvocation<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>>(snapshots: ProcessSnapshot[], criteria: TCriteria | undefined, contract: ProcessStampContract<TStamp, TCriteria>, invokedAtMs: number, platform?: NodeJS.Platform): ProcessSnapshot[];
/**
 * Capture the process table and argv-stamped roots that safely belonged to the
 * generation visible when this call began. Unlike `listProcessSnapshots`,
 * enumeration and boundary failures are surfaced so lifecycle callers can
 * quick-fail instead of reporting a false `alreadyStopped` result.
 */
export declare function captureStampedProcessSnapshot<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>>(criteria: TCriteria | undefined, contract: ProcessStampContract<TStamp, TCriteria>): Promise<StampedProcessInvocationSnapshot>;
/**
 * Capture one invocation-fenced process table for several stamp criteria.
 * Lifecycle operations use this form when a logical resource spans multiple
 * stamped generations: every member is observed at the same boundary and a
 * slow platform backend (notably Windows CIM) is paid only once.
 */
export declare function captureStampedProcessSetSnapshot<TStamp extends ProcessStampShape, TCriteria extends Partial<TStamp> = Partial<TStamp>>(criteriaSet: readonly TCriteria[], contract: ProcessStampContract<TStamp, TCriteria>): Promise<StampedProcessSetInvocationSnapshot<TCriteria>>;
/**
 * Collect the transitive set of descendant PIDs (including the roots) from a
 * process snapshot list, returned sorted descending so children precede parents.
 *
 * @param processes - The full process snapshot list to walk.
 * @param rootPids - The root PIDs whose subtrees to collect (non-numbers ignored).
 * @returns The unique PIDs of the roots and all their descendants, descending.
 */
export declare function collectProcessTreePids(processes: ProcessSnapshot[], rootPids: Array<number | null | undefined>): number[];
/**
 * Revalidate known Windows process generations before extending their tree.
 * The caller supplies identities captured while its owned child was alive;
 * this function never upgrades a bare root PID into an ownership proof.
 */
export declare function selectOwnedProcessTree(known: ProcessSnapshot[], current: ProcessSnapshot[]): ProcessSnapshot[];
/**
 * OS identity of one live process: enough to tell "the process we started"
 * apart from an unrelated process that later received the same PID.
 */
export type ProcessIdentity = {
    pid: number;
    ppid: number;
    /** POSIX process group id; `null` where the platform has no process groups. */
    processGroupId: number | null;
    /** OS-reported creation time in ms since the epoch, when the backend reports one. */
    startedAtMs: number | null;
    /** Granularity of `startedAtMs`: POSIX `ps lstart` reports whole seconds. */
    startedAtResolutionMs: number;
    command: string;
};
/**
 * @internal Parse `LC_ALL=C ps -o pid=,ppid=,pgid=,lstart=,command=` output.
 * `lstart` is the C-locale `Www Mmm dd hh:mm:ss yyyy` form in the local zone,
 * which is the zone this process shares with `ps`.
 */
export declare function parsePosixProcessIdentities(stdout: string): ProcessIdentity[];
/**
 * Read the OS identity (creation time, and process group on POSIX) of the given
 * PIDs. PIDs that do not exist are absent from the result; a backend failure
 * throws. Callers that must never mistake "could not look" for "not there"
 * should probe liveness with `isProcessAlive` first and treat a live PID that
 * is missing here as unverifiable, not as gone.
 */
export declare function readProcessIdentities(pids: readonly number[]): Promise<Map<number, ProcessIdentity>>;
/**
 * Probe whether any member of a POSIX process group is alive. Always `false`
 * on Windows, which has no process groups.
 */
export declare function isProcessGroupAlive(processGroupId: number | null | undefined): boolean;
export type TerminateProcessGroupResult = {
    /** The group was already empty before any signal was sent. */
    alreadyStopped: boolean;
    /** SIGKILL was needed because members survived the SIGTERM grace. */
    forced: boolean;
    /** Members were still alive after the SIGKILL grace. */
    survived: boolean;
};
/**
 * Terminate a whole POSIX process group: SIGTERM, wait for the group to empty,
 * then SIGKILL whatever is left. Signalling the group (not a PID list) also
 * catches members created after the call began. No-op on Windows.
 */
export declare function terminateProcessGroup(processGroupId: number, options?: StopProcessesOptions): Promise<TerminateProcessGroupResult>;
/**
 * Send a signal to each PID, ignoring `ESRCH` (already-dead) but rethrowing other errors.
 * `onSignal` runs for each PID the signal was actually delivered to.
 */
export declare function signalProcesses(pids: number[], signal: NodeJS.Signals, onSignal?: (pid: number, signal: NodeJS.Signals) => void): void;
/**
 * Stop a set of PIDs with escalation: SIGTERM, wait, then SIGKILL any
 * survivors. Excludes the current process and de-duplicates the input.
 *
 * @param pids - The PIDs to stop (non-numbers and the current PID are ignored).
 * @returns A result describing matched, stopped, force-killed, and remaining PIDs.
 */
export declare function stopProcesses(pids: Array<number | null | undefined>, options?: StopProcessesOptions): Promise<StopProcessesResult>;
//# sourceMappingURL=process.d.ts.map