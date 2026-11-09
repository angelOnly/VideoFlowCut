/** @module agent-protocol/codex-app-server/session
 *
 * Drives one codex turn over the `codex app-server` stdio JSON-RPC transport.
 *
 * Shape of a turn, from spawn to close:
 *
 *   initialize            -> capabilities handshake
 *   initialized           -> (notification)
 *   thread/start | thread/resume
 *   turn/start            -> the user prompt travels here, not on stdin
 *   …notifications…       -> normalized and handed to the agent-event channel
 *   turn/completed        -> turn is over; the daemon closes the child
 *
 * The daemon still spawns one child per turn and resumes by thread id, so this
 * is a transport swap, not an architecture change: `getDurableSessionId()`
 * returns the same capture-style handle the `exec --json` path reads off
 * `thread.started`.
 *
 * Three defects the ACP transport carries are avoided here BY CONSTRUCTION,
 * and each has a named test:
 *
 *   1. Langfuse's `stdin-write` / `agent-call` spans exist only when the run
 *      records prompt-send marks. ACP never records them because the marks are
 *      wired to the stdin branch, so its tool spans hang off `agent-run`. This
 *      module calls `onPromptSendStart` / `onPromptSendEnd` around the
 *      `turn/start` write, which is this transport's real prompt boundary.
 *   2. ACP files per-step usage under `diagnostic`, where the analytics scan
 *      cannot reach it. Usage here is a plain `usage` agent event — the exact
 *      channel `exec --json` uses.
 *   3. ACP raises `fatal_rpc_error` instead of the `stream_error` failure
 *      detail the Langfuse triage practice queries on. Every failure here,
 *      including a JSON-RPC error response, is emitted as an `error` AGENT
 *      event so it flows through `sendAgentEvent`'s classifier.
 *
 * OD-owned threads opt into experimentalApi for persistent paginated history.
 * Codex 0.146.0 only locks paginated histories across processes when archiving;
 * its default legacy history can be archived while another process writes it.
 * Streaming itself does not require the experimental capability.
 */
import { createCodexAppServerNormalizer } from './normalize.js';
import { codexHistoryCapabilities } from './thread-cleanup.js';
const closedThreadProof = Symbol('closed owned Codex thread');
/**
 * The `exec` path forces `--ask-for-approval never` implicitly (that is what
 * non-interactive exec means). Say it out loud on the thread so the app-server
 * transport cannot be more permissive than the transport it replaces.
 */
const APPROVAL_POLICY_NEVER = 'never';
/**
 * Codex's embedded model catalog ships `default_reasoning_summary = "none"`,
 * so without this the turn reasons but reports nothing. The `exec` path sets
 * the same value through `-c model_reasoning_summary="detailed"`; on this
 * transport it is a typed per-turn parameter.
 */
const REASONING_SUMMARY = 'detailed';
/** `default` is the daemon's synthetic "user did not choose" sentinel. */
function chosen(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'default')
        return null;
    return trimmed;
}
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * PatchUpdated reached app-server in rust-v0.123.0 (upstream #18289).
 * 0.122.0 already had the internal event but did not forward it to clients.
 * Read the running server's version, not another `codex` found on PATH. The
 * first user-agent token is client-name/CODEX_VERSION; later tokens include
 * OS and client versions and must not be mistaken for the server version.
 * Unknown and prerelease builds keep the existing completion-only behavior.
 */
function supportsPatchStreaming(userAgent) {
    if (typeof userAgent !== 'string')
        return false;
    const match = /^[^/\s]+\/(\d+)\.(\d+)\.(\d+)(?:\+[\w.-]+)?(?:\s|$)/u.exec(userAgent);
    if (!match)
        return false;
    return Number(match[1]) > 0 || Number(match[2]) >= 123;
}
export function attachCodexAppServerSession(opts) {
    const { child, prompt, cwd, sandboxMode, resumeSessionId, onAgentEvent, onCliReady, onSessionReady, onPromptSendStart, onPromptSendEnd, onTurnComplete, } = opts;
    const normalizer = createCodexAppServerNormalizer(onAgentEvent, Date.now, cwd);
    const pending = new Map();
    let nextId = 1;
    let buffer = '';
    let threadId = null;
    let turnId = null;
    let turnStartRequestId = null;
    let interruptSent = false;
    const steeringPending = new Set();
    let rolloutPath = null;
    let cliReadySeen = false;
    let promptSent = false;
    let aborted = false;
    let fatalReported = false;
    let turnEnded = false;
    let turnSucceeded = false;
    let handleReported = false;
    let terminalReceived = false;
    let childClosed = false;
    let cleanupThread = null;
    let canArchiveSafely = false;
    let supportsPaginatedHistory = false;
    let protectsLegacyHistory = false;
    let archiveTimer;
    const ownsThread = !resumeSessionId || opts.resumeSessionOwned === true;
    let patchStreaming = false;
    function write(frame, onWritten) {
        const stdin = child.stdin;
        if (!stdin || stdin.destroyed)
            return;
        try {
            stdin.write(`${JSON.stringify(frame)}\n`, () => onWritten?.());
        }
        catch {
            // A child that exited before reading stdin surfaces through the daemon's
            // exit/close handlers; a throw here would take the daemon with it.
        }
    }
    function request(method, params, onResult, onWritten, onError) {
        const id = nextId++;
        pending.set(id, (frame) => {
            if (frame.error !== undefined) {
                if (onError)
                    onError(frame.error);
                else
                    reportFatal(rpcErrorText(method, frame.error));
                return;
            }
            onResult(isRecord(frame.result) ? frame.result : {});
        });
        write({ jsonrpc: '2.0', id, method, params }, onWritten);
        return id;
    }
    function interruptActiveTurn() {
        if (!aborted || interruptSent || !threadId || !turnId)
            return;
        interruptSent = true;
        write({ jsonrpc: '2.0', id: nextId++, method: 'turn/interrupt', params: { threadId, turnId } });
    }
    function setActiveTurn(value) {
        if (typeof value !== 'string' || !value || terminalReceived || turnEnded)
            return;
        turnId = value;
        interruptActiveTurn();
    }
    function notify(method, params) {
        write({ jsonrpc: '2.0', method, params });
    }
    function rpcErrorText(method, error) {
        const detail = isRecord(error) ? error : {};
        const message = typeof detail.message === 'string' && detail.message
            ? detail.message
            : `json-rpc error from ${method}`;
        const code = typeof detail.code === 'number' ? ` (${detail.code})` : '';
        return `codex app-server ${method}${code}: ${message}`;
    }
    /**
     * Surface a transport failure on the AGENT event channel so it reaches
     * `sendAgentEvent` and becomes a `stream_error` failure detail, rather than a
     * transport-private error shape no triage query knows about.
     */
    function reportFatal(message) {
        if (fatalReported || aborted)
            return;
        fatalReported = true;
        onAgentEvent({ type: 'error', message });
    }
    function startTurn() {
        if (!threadId || promptSent)
            return;
        promptSent = true;
        const params = {
            threadId,
            input: [
                { type: 'text', text: prompt, text_elements: [] },
                ...(opts.imagePaths ?? []).map((path) => ({ type: 'localImage', path })),
            ],
            summary: REASONING_SUMMARY,
        };
        const model = chosen(opts.model);
        if (model)
            params.model = model;
        const effort = chosen(opts.reasoning);
        if (effort)
            params.effort = effort;
        const serviceTier = chosen(opts.serviceTier);
        if (serviceTier)
            params.serviceTier = serviceTier;
        // The prompt-send boundary for this transport. Marked here, not around a
        // stdin write that never happens, so the Langfuse `stdin-write` and
        // `agent-call` spans exist on app-server runs too.
        onPromptSendStart?.();
        turnStartRequestId = request('turn/start', params, (result) => {
            // `turn/start` resolves when the turn is accepted; completion arrives
            // as the `turn/completed` notification.
            const turn = isRecord(result.turn) ? result.turn : null;
            setActiveTurn(turn?.id);
        }, () => onPromptSendEnd?.());
    }
    function openThread() {
        const shared = {
            cwd,
            sandbox: sandboxMode,
            approvalPolicy: APPROVAL_POLICY_NEVER,
            ...(patchStreaming ? { config: { 'features.apply_patch_streaming_events': true } } : {}),
        };
        const onThread = (result) => {
            const thread = isRecord(result.thread) ? result.thread : null;
            const id = typeof thread?.id === 'string' ? thread.id : null;
            if (id) {
                threadId = id;
                canArchiveSafely = opts.manageThreadVisibility === true
                    && (protectsLegacyHistory || (supportsPaginatedHistory && thread?.historyMode === 'paginated'));
                if (canArchiveSafely && ownsThread && id.trim()
                    && (!resumeSessionId || id === resumeSessionId)) {
                    cleanupThread = Object.freeze({ threadId: id,
                        historyMode: thread?.historyMode === 'paginated' ? 'paginated' : 'legacy',
                        [closedThreadProof]: true });
                }
                const path = typeof thread?.path === 'string' ? thread.path : '';
                if (path)
                    rolloutPath = path;
                // `thread/start` is followed by a `thread/started` notification, but
                // `thread/resume` answers only with this result. Capture-style resume
                // persists whatever handle the run reported THIS turn, so a resumed
                // turn that reported none would let the stored handle go stale and the
                // next turn would start a cold thread.
                reportSessionHandle(id);
                onSessionReady?.();
                startTurn();
                return;
            }
            reportFatal('codex app-server returned no thread id');
        };
        if (resumeSessionId) {
            request('thread/resume', { ...shared, threadId: resumeSessionId }, onThread, undefined, (error) => {
                const message = rpcErrorText('thread/resume', error);
                if (opts.manageThreadVisibility !== true || !ownsThread || !/\bis archived\b/u.test(message)) {
                    reportFatal(message);
                    return;
                }
                archiveTimer = setTimeout(() => {
                    reportFatal('codex app-server thread/unarchive timed out');
                    shutdown();
                }, 1_500);
                request('thread/unarchive', { threadId: resumeSessionId }, () => {
                    clearTimeout(archiveTimer);
                    archiveTimer = undefined;
                    request('thread/resume', { ...shared, threadId: resumeSessionId }, onThread);
                }, undefined, (unarchiveError) => {
                    onAgentEvent({ type: 'diagnostic', name: 'codex_thread_unarchive_failed',
                        message: rpcErrorText('thread/unarchive', unarchiveError) });
                    // Do not feed a cleanup error's "no rollout" wording into the
                    // daemon's stale-resume detector, which would clear the cursor.
                    reportFatal('codex app-server thread/unarchive failed');
                    shutdown();
                });
            });
            return;
        }
        request('thread/start', supportsPaginatedHistory ? { ...shared, historyMode: 'paginated' } : shared, onThread);
    }
    /** Emit the thread id on the session-capture channel, at most once. */
    function reportSessionHandle(id) {
        if (handleReported || !id)
            return;
        handleReported = true;
        onAgentEvent({ type: 'status', label: 'initializing', sessionId: id });
    }
    function handleFrame(frame) {
        // Preserve archive replies after a terminal event, but never reopen a canceled turn.
        if (turnEnded || childClosed)
            return;
        if ((aborted || fatalReported) && !terminalReceived && frame.method !== 'turn/completed'
            && frame.method !== 'turn/started' && frame.id !== turnStartRequestId)
            return;
        if (!cliReadySeen) {
            cliReadySeen = true;
            onCliReady?.();
        }
        const id = typeof frame.id === 'number' ? frame.id : null;
        if (id !== null && typeof frame.method !== 'string') {
            const resolver = pending.get(id);
            pending.delete(id);
            resolver?.(frame);
            return;
        }
        if (typeof frame.method !== 'string')
            return;
        if (id !== null) {
            // A server-to-client REQUEST. Nothing in this build answers one — the
            // thread runs with approvals disabled, so MCP elicitation and approval
            // prompts should never fire. Refusing explicitly keeps a future codex
            // that does send one from blocking the turn forever waiting on a reply.
            write({
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `unsupported request: ${frame.method}` },
            });
            return;
        }
        if (frame.method === 'thread/started') {
            const params = isRecord(frame.params) ? frame.params : {};
            const thread = isRecord(params.thread) ? params.thread : null;
            const path = typeof thread?.path === 'string' ? thread.path : '';
            if (path)
                rolloutPath = path;
            const startedId = typeof thread?.id === 'string' ? thread.id : '';
            if (startedId && !threadId)
                threadId = startedId;
            reportSessionHandle(startedId);
            return;
        }
        if (frame.method === 'turn/started') {
            const params = isRecord(frame.params) ? frame.params : {};
            const turn = isRecord(params.turn) ? params.turn : null;
            setActiveTurn(turn?.id ?? params.turnId);
        }
        if (frame.method === 'turn/completed' && terminalReceived)
            return;
        normalizer.handleNotification(frame.method, frame.params);
        if (frame.method === 'turn/completed') {
            terminalReceived = true;
            turnId = null;
            for (const settle of steeringPending)
                settle();
            const params = isRecord(frame.params) ? frame.params : {};
            const turn = isRecord(params.turn) ? params.turn : null;
            turnSucceeded = turn?.status !== 'failed';
            onTurnComplete?.();
            if (canArchiveSafely && ownsThread && threadId
                && (!resumeSessionId || threadId === resumeSessionId)) {
                // The upstream archive operation checks its cross-process writer lock.
                // A competing resume therefore refuses cleanup instead of losing history.
                archiveTimer = setTimeout(shutdown, 1_500);
                request('thread/archive', { threadId }, shutdown, undefined, (error) => {
                    onAgentEvent({ type: 'diagnostic', name: 'codex_thread_archive_failed',
                        message: rpcErrorText('thread/archive', error) });
                    shutdown();
                });
            }
            else
                shutdown();
        }
    }
    /**
     * End the turn by closing the child's stdin.
     *
     * This is the one lifecycle difference between the two transports, and it is
     * not optional: `codex exec` runs a turn and exits, while `codex app-server`
     * is a server that keeps listening. Without this the child never exits, the
     * daemon's close handler never fires, and the run sits in `running` forever
     * with its answer already delivered. Measured on codex-cli 0.149.1, stdin EOF
     * shuts the server down with exit code 0 in roughly 250ms — a normal clean
     * exit, so nothing downstream needs a special case for it.
     */
    function shutdown() {
        if (turnEnded)
            return;
        turnEnded = true;
        if (archiveTimer)
            clearTimeout(archiveTimer);
        const stdin = child.stdin;
        if (!stdin || stdin.destroyed)
            return;
        try {
            stdin.end();
        }
        catch {
            // The child already went away; its exit handler owns the run from here.
        }
    }
    child.stdout.on('data', (chunk) => {
        buffer += String(chunk);
        let newline;
        while ((newline = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line)
                continue;
            let frame;
            try {
                frame = JSON.parse(line);
            }
            catch {
                // codex writes structured frames only; a non-JSON line is noise from a
                // wrapper script, not a protocol failure. Dropping it keeps a chatty
                // shim from failing an otherwise healthy run.
                continue;
            }
            if (isRecord(frame))
                handleFrame(frame);
        }
    });
    child.once?.('close', () => {
        childClosed = true;
        if (archiveTimer)
            clearTimeout(archiveTimer);
        for (const settle of steeringPending)
            settle();
        pending.clear();
    });
    request('initialize', {
        clientInfo: {
            name: 'open-design',
            title: 'Open Design',
            version: opts.clientVersion ?? '0.0.0',
        },
        capabilities: { experimentalApi: opts.manageThreadVisibility === true, requestAttestation: false },
    }, (result) => {
        // Verified with the official 0.146.0 and 0.153.4 binaries: paginated
        // history has cross-process archive locks in both; legacy only in the
        // latter. Never convert an existing legacy history or archive it on an
        // older server. Unknown servers retain the existing resumable behavior.
        const capabilities = codexHistoryCapabilities(result.userAgent);
        supportsPaginatedHistory = opts.manageThreadVisibility === true && capabilities.paginated;
        protectsLegacyHistory = opts.manageThreadVisibility === true && capabilities.legacy;
        patchStreaming = supportsPatchStreaming(result.userAgent);
        notify('initialized', {});
        openThread();
    });
    return {
        abort() {
            if (aborted)
                return;
            aborted = true;
            // Cancel the turn rather than only signalling the process: codex keeps
            // the thread alive and reports `turn/completed` with status
            // `interrupted`, so a later resume still finds it.
            interruptActiveTurn();
        },
        async steer(text, expectedTurnId, feedbackId) {
            if (aborted || terminalReceived || turnEnded || childClosed)
                return { ok: false, refusal: 'run_terminal' };
            if (!threadId || !turnId)
                return { ok: false, refusal: 'turn_not_ready' };
            if (expectedTurnId && expectedTurnId !== turnId)
                return { ok: false, refusal: 'turn_mismatch' };
            if (!child.stdin || child.stdin.destroyed)
                return { ok: false, refusal: 'delivery_unknown' };
            const currentThread = threadId, currentTurn = turnId, id = nextId++;
            return await new Promise((resolve) => {
                let settled = false;
                const finish = (outcome) => {
                    if (settled)
                        return;
                    settled = true;
                    clearTimeout(timer);
                    pending.delete(id);
                    steeringPending.delete(unknown);
                    resolve(outcome);
                };
                const unknown = () => finish({ ok: false, refusal: 'delivery_unknown' });
                const timer = setTimeout(unknown, 15_000);
                timer.unref();
                steeringPending.add(unknown);
                pending.set(id, (frame) => {
                    if (frame.error !== undefined)
                        return finish({ ok: false, refusal: 'rpc_rejected', detail: rpcErrorText('turn/steer', frame.error) });
                    const result = isRecord(frame.result) ? frame.result : {};
                    if (result.turnId !== currentTurn)
                        return unknown();
                    finish({ ok: true, threadId: currentThread, turnId: currentTurn });
                });
                try {
                    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method: 'turn/steer', params: {
                            threadId: currentThread, expectedTurnId: currentTurn,
                            input: [{ type: 'text', text, text_elements: [] }],
                            ...(feedbackId ? { clientUserMessageId: feedbackId } : {}),
                        } })}\n`, (error) => { if (error)
                        unknown(); });
                }
                catch {
                    unknown();
                }
            });
        },
        completedSuccessfully() {
            return turnEnded && turnSucceeded && !fatalReported;
        },
        getDurableSessionId() {
            return threadId;
        },
        getLastSessionPath() {
            return rolloutPath;
        },
        takeClosedThreadCleanup() {
            if (!childClosed || terminalReceived)
                return null;
            const receipt = cleanupThread;
            cleanupThread = null;
            return receipt;
        },
        stats() {
            return normalizer.stats();
        },
    };
}
//# sourceMappingURL=session.js.map