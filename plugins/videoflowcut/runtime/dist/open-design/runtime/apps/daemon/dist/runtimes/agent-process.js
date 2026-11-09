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
import { ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { captureProcessSnapshot, isProcessAlive, isProcessGroupAlive, readProcessIdentities, selectOwnedProcessTree, stopProcesses, terminateProcessGroup, } from '@open-design/platform';
const STAGED_PROMPT_PREFIX = 'agent-stdin-';
const STAGED_PROMPT_SUFFIX = '.prompt';
const AGENT_PROCESS_RECORD_PREFIX = 'agent-process-';
const AGENT_PROCESS_RECORD_SUFFIX = '.json';
const AGENT_PROCESS_RECORD_SCHEMA_VERSION = 1;
/** How often a lingering group (leader gone, descendants alive) is re-probed. */
const GROUP_RELEASE_POLL_MS = 1_000;
/** Clock slack when matching a recorded spawn time against the OS creation time. */
const IDENTITY_TOLERANCE_MS = 2_000;
/**
 * The owner's creation time is estimated from `process.uptime()`, which starts
 * a little after the OS created the process (Electron boots before Node). A
 * PID can only be recycled after its owner exited, so a generous window here
 * errs toward "owner still alive" — leaving agents alone — never toward a kill.
 */
const OWNER_IDENTITY_TOLERANCE_MS = 10_000;
/** This daemon process's creation time, on the same wall clock `ps` reports. */
const DAEMON_PROCESS_STARTED_AT_MS = Math.round(Date.now() - process.uptime() * 1000);
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
export function openCompletePromptAsStdin(runDir, prompt) {
    fs.mkdirSync(runDir, { recursive: true });
    const filePath = path.join(runDir, `${STAGED_PROMPT_PREFIX}${randomUUID()}${STAGED_PROMPT_SUFFIX}`);
    fs.writeFileSync(filePath, prompt, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    let fd;
    try {
        fd = fs.openSync(filePath, 'r');
    }
    catch (error) {
        try {
            fs.unlinkSync(filePath);
        }
        catch { /* best-effort */ }
        throw error;
    }
    let fdOpen = true;
    const remove = () => {
        try {
            fs.unlinkSync(filePath);
        }
        catch { /* already gone, or still open on Windows */ }
    };
    return {
        fd,
        filePath,
        releaseAfterSpawn() {
            if (fdOpen) {
                fdOpen = false;
                try {
                    fs.closeSync(fd);
                }
                catch { /* best-effort */ }
            }
            remove();
        },
        remove,
    };
}
export function agentProcessRecordPath(runDir, pid) {
    return path.join(runDir, `${AGENT_PROCESS_RECORD_PREFIX}${pid}${AGENT_PROCESS_RECORD_SUFFIX}`);
}
/** Durably record a live agent process so a later daemon can reap it. */
export function writeAgentProcessRecord(runDir, record) {
    const filePath = agentProcessRecordPath(runDir, record.pid);
    const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    fs.mkdirSync(runDir, { recursive: true });
    try {
        fs.writeFileSync(tempPath, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
        fs.renameSync(tempPath, filePath);
    }
    catch (error) {
        try {
            fs.unlinkSync(tempPath);
        }
        catch { /* best-effort */ }
        throw error;
    }
    return filePath;
}
/**
 * Every running agent is on record until its whole process group is gone.
 *
 * The record is the only way a daemon started after this one dies can find the
 * agent (`reapLeftoverAgentProcesses`), so an agent that cannot be recorded is
 * not allowed to run: it is killed at once and this throws, failing the run
 * instead of starting an agent no later daemon could stop.
 *
 * The record is removed only when the whole group is gone, not when the direct
 * child exits: descendants that outlive the CLI are exactly what a group kill
 * exists for, and a PID number cannot be recycled while its group still has
 * members.
 *
 * Only a real OS child is ever recorded. Signalling a PID this daemon did not
 * create is the hazard the reaper's identity checks guard against, so an
 * object that merely looks like a child (no `ChildProcess`, no live PID)
 * records nothing.
 */
function recordAgentProcessUntilGroupExits(child, context) {
    const pid = child.pid;
    if (!(child instanceof ChildProcess)
        || typeof pid !== 'number'
        || !Number.isSafeInteger(pid)
        || pid <= 0) {
        return;
    }
    let recordPath;
    try {
        recordPath = writeAgentProcessRecord(context.runDir, {
            schemaVersion: AGENT_PROCESS_RECORD_SCHEMA_VERSION,
            runId: context.runId,
            pid,
            processGroupId: context.processGroupId,
            spawnedAtMs: context.spawnedAtMs,
            spawnReturnedAtMs: context.spawnReturnedAtMs,
            launchPath: context.launchPath,
            ownerPid: process.pid,
            ownerStartedAtMs: DAEMON_PROCESS_STARTED_AT_MS,
        });
    }
    catch (error) {
        try {
            if (context.processGroupId != null)
                process.kill(-context.processGroupId, 'SIGKILL');
            else
                child.kill('SIGKILL');
        }
        catch {
            // Already gone.
        }
        throw new Error(`could not record agent process ${pid}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    let released = false;
    let timer = null;
    const removeRecordWhenGroupIsGone = () => {
        if (released)
            return;
        if (context.processGroupId != null && isProcessGroupAlive(context.processGroupId)) {
            if (timer)
                return; // `exit` and `close` both land here; poll once.
            timer = setTimeout(() => {
                timer = null;
                removeRecordWhenGroupIsGone();
            }, GROUP_RELEASE_POLL_MS);
            timer.unref?.();
            return;
        }
        released = true;
        try {
            fs.unlinkSync(recordPath);
        }
        catch { /* best-effort */ }
    };
    child.once('exit', removeRecordWhenGroupIsGone);
    // Test doubles and some failure paths only ever emit `close`.
    child.once('close', removeRecordWhenGroupIsGone);
}
/**
 * Spawn one chat-run agent CLI: a plain-text prompt is its complete
 * file-backed stdin from the first instruction, and the agent is on record
 * for the next daemon's startup reaper for as long as its group runs. POSIX
 * agents lead their own process group so cancellation can signal the whole
 * tree.
 */
export function spawnAgentProcess(request) {
    const detached = process.platform !== 'win32';
    const staged = typeof request.stdin === 'object'
        ? openCompletePromptAsStdin(request.runDir, request.stdin.prompt)
        : null;
    const stdin = staged ? staged.fd : request.stdin;
    const spawnedAtMs = Date.now();
    let child;
    try {
        child = spawn(request.command, [...request.args], {
            env: request.env,
            stdio: [stdin, 'pipe', 'pipe'],
            cwd: request.cwd,
            shell: false,
            detached,
            // Required when invocation wraps a Windows .cmd/.bat shim through
            // cmd.exe; without this, Node re-escapes the inner command line and
            // breaks paths containing spaces (issue #315).
            windowsVerbatimArguments: request.windowsVerbatimArguments,
        });
    }
    finally {
        staged?.releaseAfterSpawn();
    }
    const spawnReturnedAtMs = Date.now();
    if (staged) {
        // Windows cannot always unlink a file the child still holds open.
        child.once('close', staged.remove);
        child.once('error', staged.remove);
    }
    const processGroupId = detached && typeof child.pid === 'number' ? child.pid : null;
    recordAgentProcessUntilGroupExits(child, {
        processGroupId,
        runDir: request.runDir,
        runId: request.runId,
        launchPath: request.command,
        spawnedAtMs,
        spawnReturnedAtMs,
    });
    return { child, processGroupId, promptDeliveredAtSpawn: staged != null };
}
function withinSpawnWindow(identity, earliestMs, latestMs, toleranceMs = IDENTITY_TOLERANCE_MS) {
    if (!identity || typeof identity.startedAtMs !== 'number')
        return false;
    const slack = toleranceMs + identity.startedAtResolutionMs;
    return identity.startedAtMs >= earliestMs - slack && identity.startedAtMs <= latestMs + toleranceMs;
}
/**
 * Decide what a surviving agent-process record means. Pure apart from the
 * injected probes so the identity rules are testable without real processes.
 * Only a process whose OS creation time falls inside the recorded spawn window
 * (and, on POSIX, that still leads the recorded group) is treated as ours.
 */
export async function classifyLeftoverAgentRecord(record, probes = {}) {
    const selfPid = probes.selfPid ?? process.pid;
    const selfStartedAtMs = probes.selfStartedAtMs ?? DAEMON_PROCESS_STARTED_AT_MS;
    const isAlive = probes.isAlive ?? isProcessAlive;
    const readIdentities = probes.readIdentities ?? readProcessIdentities;
    if (record.ownerPid === selfPid) {
        // Our PID, our start time: live work of this daemon. Our PID with another
        // start time: the recording daemon is certainly gone and this daemon was
        // handed its recycled PID, so the record is judged like any other.
        if (Math.abs(record.ownerStartedAtMs - selfStartedAtMs) <= OWNER_IDENTITY_TOLERANCE_MS)
            return 'own';
    }
    const ownerAlive = record.ownerPid !== selfPid && isAlive(record.ownerPid);
    const agentAlive = isAlive(record.pid);
    if (!ownerAlive && !agentAlive)
        return 'gone';
    let identities;
    try {
        identities = await readIdentities([
            ...(ownerAlive ? [record.ownerPid] : []),
            ...(agentAlive ? [record.pid] : []),
        ]);
    }
    catch {
        return 'unverifiable';
    }
    if (ownerAlive) {
        const owner = identities.get(record.ownerPid);
        if (!owner)
            return 'unverifiable';
        if (withinSpawnWindow(owner, record.ownerStartedAtMs, record.ownerStartedAtMs, OWNER_IDENTITY_TOLERANCE_MS)) {
            return 'owner_alive';
        }
    }
    if (!agentAlive)
        return 'gone';
    const agent = identities.get(record.pid);
    if (!agent)
        return 'unverifiable';
    if (!withinSpawnWindow(agent, record.spawnedAtMs, record.spawnReturnedAtMs))
        return 'identity_mismatch';
    if (process.platform !== 'win32'
        && record.processGroupId != null
        && agent.processGroupId !== record.processGroupId) {
        return 'identity_mismatch';
    }
    return 'reap';
}
function readAgentProcessRecord(filePath) {
    try {
        const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!value
            || value.schemaVersion !== AGENT_PROCESS_RECORD_SCHEMA_VERSION
            || typeof value.runId !== 'string'
            || !Number.isSafeInteger(value.pid)
            || !Number.isSafeInteger(value.ownerPid)
            || typeof value.spawnedAtMs !== 'number'
            || typeof value.spawnReturnedAtMs !== 'number'
            || typeof value.ownerStartedAtMs !== 'number') {
            return null;
        }
        return value;
    }
    catch {
        return null;
    }
}
async function terminateLeftoverAgent(record, options) {
    if (process.platform !== 'win32' && record.processGroupId != null) {
        const result = await terminateProcessGroup(record.processGroupId, options);
        return { forced: result.forced, survived: result.survived };
    }
    // Windows: no groups. Expand the tree only through processes whose creation
    // time proves they descend from the verified root.
    const identities = await readProcessIdentities([record.pid]);
    const root = identities.get(record.pid);
    if (!root || typeof root.startedAtMs !== 'number')
        return { forced: false, survived: false };
    const tree = selectOwnedProcessTree([{ pid: root.pid, ppid: root.ppid, command: root.command, startedAtMs: root.startedAtMs }], await captureProcessSnapshot());
    const result = await stopProcesses(tree.map((entry) => entry.pid), options);
    return { forced: result.forcedPids.length > 0, survived: result.remainingPids.length > 0 };
}
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
export async function reapLeftoverAgentProcesses(options) {
    const daemonStartedAtMs = options.daemonStartedAtMs ?? DAEMON_PROCESS_STARTED_AT_MS;
    const terminateOptions = {
        termGraceMs: options.termGraceMs ?? 2_000,
        killGraceMs: options.killGraceMs ?? 1_000,
    };
    const result = { reaped: [], skipped: [], stagedPromptsRemoved: 0 };
    let runEntries = [];
    try {
        runEntries = await fs.promises.readdir(options.runsLogDir, { withFileTypes: true });
    }
    catch {
        return result;
    }
    const reapLeftover = async (record, filePath) => {
        const outcome = await terminateLeftoverAgent(record, terminateOptions).catch((error) => {
            console.warn('[agent-process] could not terminate leftover agent', {
                runId: record.runId,
                pid: record.pid,
                error: error instanceof Error ? error.message : String(error),
            });
            return { forced: false, survived: true };
        });
        result.reaped.push({
            runId: record.runId,
            pid: record.pid,
            processGroupId: record.processGroupId,
            ...outcome,
        });
        if (!outcome.survived) {
            try {
                await fs.promises.unlink(filePath);
            }
            catch { /* best-effort */ }
        }
    };
    const terminations = [];
    for (const runEntry of runEntries) {
        if (!runEntry.isDirectory())
            continue;
        const runDir = path.join(options.runsLogDir, runEntry.name);
        let names = [];
        try {
            names = await fs.promises.readdir(runDir);
        }
        catch {
            continue;
        }
        for (const name of names) {
            const filePath = path.join(runDir, name);
            if (name.startsWith(STAGED_PROMPT_PREFIX) && name.endsWith(STAGED_PROMPT_SUFFIX)) {
                try {
                    const stat = await fs.promises.stat(filePath);
                    if (stat.mtimeMs < daemonStartedAtMs) {
                        await fs.promises.unlink(filePath);
                        result.stagedPromptsRemoved += 1;
                    }
                }
                catch {
                    // Raced with its owner, or already removed.
                }
                continue;
            }
            if (!name.startsWith(AGENT_PROCESS_RECORD_PREFIX) || !name.endsWith(AGENT_PROCESS_RECORD_SUFFIX)) {
                continue;
            }
            const record = readAgentProcessRecord(filePath);
            if (!record) {
                try {
                    await fs.promises.unlink(filePath);
                }
                catch { /* best-effort */ }
                continue;
            }
            const verdict = await classifyLeftoverAgentRecord(record);
            if (verdict === 'reap') {
                terminations.push(reapLeftover(record, filePath));
                continue;
            }
            result.skipped.push({ runId: record.runId, pid: record.pid, verdict });
            if (verdict === 'gone' || verdict === 'identity_mismatch') {
                try {
                    await fs.promises.unlink(filePath);
                }
                catch { /* best-effort */ }
            }
        }
    }
    await Promise.all(terminations);
    return result;
}
//# sourceMappingURL=agent-process.js.map