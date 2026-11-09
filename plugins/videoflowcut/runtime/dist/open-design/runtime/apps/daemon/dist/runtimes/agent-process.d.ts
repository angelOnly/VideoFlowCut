/**
 * Chat-run agent CLI processes, from spawn until the next daemon start.
 *
 * Chat-run agents are spawned as their own process-group leaders (POSIX
 * `detached`) so the daemon can signal an agent's whole tree. The price is that
 * an agent does not die with the daemon: every in-daemon kill path
 * (`killChild`, `terminateProcessTree`, `shutdownActive` from the SIGINT/SIGTERM
 * handlers) needs a live daemon, and a daemon killed by SIGKILL or a V8
 * out-of-memory abort runs none of them. The reparented agent — often running
 * with auto-approved file edits — keeps working unsupervised until it exits on
 * its own or the next daemon starts. In the 2026-09-14 incident it did so on a
 * prompt truncated to the first 64 KiB, which ended right after the
 * conversation's FIRST request, and re-executed it.
 *
 * Two invariants bound that, one helper each:
 *
 * - `openCompletePromptAsStdin` — an agent receives the complete prompt or
 *   nothing, whatever happens to the daemon after the spawn.
 * - `reapLeftoverAgentProcesses` — every running agent is on record, and the
 *   next daemon start terminates the ones a dead daemon left behind.
 *
 * `spawnAgentProcess` is the one spawn path that composes them; the daemon's
 * chat-run launcher calls it instead of `child_process.spawn`.
 *
 * All files live in the run's directory under the daemon data root
 * (`<RUNTIME_DATA_DIR>/runs/<runId>`), which callers derive from
 * `RUNTIME_DATA_DIR`.
 */
import { ChildProcess } from 'node:child_process';
import { type ProcessIdentity } from '@open-design/platform';
declare const AGENT_PROCESS_RECORD_SCHEMA_VERSION = 1;
export type StagedPromptStdin = {
    /** Read-only descriptor to pass as the child's stdin. */
    fd: number;
    filePath: string;
    /** Close the daemon's descriptor and unlink the file (the child keeps its own). */
    releaseAfterSpawn(): void;
    /** Best-effort unlink for platforms that refuse to unlink an open file. */
    remove(): void;
};
/**
 * An agent receives the complete prompt or nothing.
 *
 * A prompt written into a stdin PIPE is only delivered while the daemon keeps
 * pumping it: the kernel buffers 64 KiB, and everything beyond that lives in
 * daemon memory until the child reads. Agent CLIs take seconds to start
 * reading, so a daemon that dies in that window hands the agent a prefix of
 * its prompt followed by EOF, and a prefix of a transcript-first prompt is a
 * different, older instruction.
 *
 * So the complete prompt is written to a 0600 file in the run's directory
 * BEFORE the child exists, and the child's stdin is that file: every byte is
 * on disk and owned by the child's descriptor from the moment it is spawned,
 * whatever happens to the daemon afterwards. The daemon closes its descriptor
 * and unlinks the file right after spawn; the startup sweep removes any file a
 * dead daemon staged but never handed over.
 *
 * Throws when the prompt cannot be staged — the run then fails before any
 * child exists, which is the "nothing" half of the invariant.
 */
export declare function openCompletePromptAsStdin(runDir: string, prompt: string): StagedPromptStdin;
export type AgentProcessRecord = {
    schemaVersion: typeof AGENT_PROCESS_RECORD_SCHEMA_VERSION;
    runId: string;
    pid: number;
    /** POSIX process group the agent leads; null on Windows. */
    processGroupId: number | null;
    /** Daemon wall clock immediately before and after `spawn()` returned. */
    spawnedAtMs: number;
    spawnReturnedAtMs: number;
    launchPath: string;
    /** The daemon that spawned the agent, identified by PID + creation time. */
    ownerPid: number;
    ownerStartedAtMs: number;
};
export declare function agentProcessRecordPath(runDir: string, pid: number): string;
/** Durably record a live agent process so a later daemon can reap it. */
export declare function writeAgentProcessRecord(runDir: string, record: AgentProcessRecord): string;
export type AgentProcessStdin = 'pipe' | 'ignore' | {
    readonly prompt: string;
};
export type SpawnAgentProcessRequest = {
    command: string;
    args: readonly string[];
    env: NodeJS.ProcessEnv;
    cwd: string;
    windowsVerbatimArguments?: boolean | undefined;
    /**
     * `'pipe'` for runtimes that speak a framed protocol on stdin (stream-json,
     * JSON-RPC) — a truncated frame is unparseable, so those cannot act on a
     * partial prompt — `'ignore'` for argv/file prompts, and `{ prompt }` for
     * runtimes that read a plain-text prompt from stdin.
     */
    stdin: AgentProcessStdin;
    /** `<RUNTIME_DATA_DIR>/runs/<runId>`: holds the staged prompt and the process record. */
    runDir: string;
    runId: string;
};
export type SpawnedAgentProcess = {
    child: ChildProcess;
    /** POSIX process group the agent leads (its own PID); null on Windows. */
    processGroupId: number | null;
    /** The whole prompt was handed over as the child's stdin at spawn. */
    promptDeliveredAtSpawn: boolean;
};
/**
 * Spawn one chat-run agent CLI: a plain-text prompt is its complete
 * file-backed stdin from the first instruction, and the agent is on record
 * for the next daemon's startup reaper for as long as its group runs. POSIX
 * agents lead their own process group so cancellation can signal the whole
 * tree.
 */
export declare function spawnAgentProcess(request: SpawnAgentProcessRequest): SpawnedAgentProcess;
export type LeftoverAgentVerdict = 
/** Written by this daemon: it is live work, not a leftover. */
'own'
/** The daemon that spawned it is still running (another daemon on this data root). */
 | 'owner_alive'
/** The recorded process no longer exists. */
 | 'gone'
/** The PID is alive but belongs to a different process now. */
 | 'identity_mismatch'
/** Alive, but its identity could not be read; left alone and kept on record. */
 | 'unverifiable'
/** The recorded agent is still running without its daemon: terminate it. */
 | 'reap';
/**
 * Decide what a surviving agent-process record means. Pure apart from the
 * injected probes so the identity rules are testable without real processes.
 * Only a process whose OS creation time falls inside the recorded spawn window
 * (and, on POSIX, that still leads the recorded group) is treated as ours.
 */
export declare function classifyLeftoverAgentRecord(record: AgentProcessRecord, probes?: {
    selfPid?: number;
    selfStartedAtMs?: number;
    isAlive?: (pid: number) => boolean;
    readIdentities?: (pids: number[]) => Promise<Map<number, ProcessIdentity>>;
}): Promise<LeftoverAgentVerdict>;
export type LeftoverAgentReapResult = {
    reaped: Array<{
        runId: string;
        pid: number;
        processGroupId: number | null;
        forced: boolean;
        survived: boolean;
    }>;
    skipped: Array<{
        runId: string;
        pid: number;
        verdict: LeftoverAgentVerdict;
    }>;
    stagedPromptsRemoved: number;
};
/**
 * Startup reconciliation reaps leftovers.
 *
 * A record that survives in a run directory means its daemon never saw that
 * agent's group end: the daemon died, and nothing else stops an agent that
 * outlived it. The daemon calls this once, early in startup and without
 * blocking it; every record is checked whatever became of its run (a run a
 * previous start already reconciled as failed can still have a live agent).
 * Only an agent that is alive AND provably the process that was spawned is
 * terminated: its OS creation time must fall inside the recorded spawn window
 * and, on POSIX, it must still lead the recorded group. A PID recycled by an
 * unrelated process fails that check and is left alone. Records of a
 * still-running owner daemon (two daemons on one data root) are left in
 * place, and so are unverifiable ones and groups that survived termination,
 * so the next start retries them.
 *
 * Each verified leftover is terminated as soon as the scan finds it, without
 * waiting for the others, so N of them cost one grace period rather than N.
 *
 * Also removes staged prompt files that a previous daemon wrote but never
 * handed to a child (it died between staging and spawn).
 */
export declare function reapLeftoverAgentProcesses(options: {
    runsLogDir: string;
    /** Files staged before this instant belong to a previous daemon. */
    daemonStartedAtMs?: number;
    termGraceMs?: number;
    killGraceMs?: number;
}): Promise<LeftoverAgentReapResult>;
export {};
