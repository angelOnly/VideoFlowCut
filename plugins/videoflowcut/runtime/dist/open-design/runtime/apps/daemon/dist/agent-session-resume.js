import { createHash, randomUUID } from 'node:crypto';
import { clearAgentSession, getAgentSessionRecord, latestCompletedAssistantMessageId, upsertAgentSession, } from './db.js';
import { parseStableSections, } from './prompts/stable-sections.js';
import { scanRunEventsForUsageAnalytics } from './run-analytics-observability.js';
/**
 * Tracks input usage for one physical agent session attempt. Logical Run
 * retries retain their event history, so a different session needs a fresh
 * tracker; only an exact-session continuation may seed the retained value.
 */
export function createPhysicalAgentSessionUsageTracker(retainedInputTokens = null) {
    const usageEvents = [];
    const bounded = (value) => typeof value === 'number' && Number.isSafeInteger(value) &&
        value >= 0 && value <= 1_000_000_000
        ? value
        : null;
    let latestInputTokens = bounded(retainedInputTokens);
    return {
        observe(event, data) {
            if (event !== 'agent' ||
                !data ||
                typeof data !== 'object' ||
                Array.isArray(data) ||
                data.type !== 'usage') {
                return;
            }
            usageEvents.push({ event, data });
            const usage = scanRunEventsForUsageAnalytics(usageEvents, null, 0);
            latestInputTokens = bounded(usage.input_tokens_effective ?? usage.input_tokens);
        },
        inputTokens: () => latestInputTokens,
    };
}
/**
 * Shared transcript policy for resumable adapters. Native continuation and
 * transcript skipping are coupled: if the daemon cannot prove it is resuming a
 * valid upstream session this turn, the prompt path must recompose the full
 * transcript.
 */
export function resolveAgentResumePromptPolicy(ctx) {
    const canResume = ctx.isResuming === true
        && typeof ctx.resumeSessionId === 'string'
        && ctx.resumeSessionId.length > 0
        && ctx.invalidationReason == null;
    if (canResume) {
        return {
            mode: 'resume-session',
            resumeSessionId: ctx.resumeSessionId,
            skipTranscript: true,
            requiresFullTranscript: false,
            invalidationReason: null,
        };
    }
    return {
        mode: 'full-transcript',
        resumeSessionId: null,
        skipTranscript: false,
        requiresFullTranscript: true,
        invalidationReason: ctx.invalidationReason ?? null,
    };
}
/**
 * Shared fallback policy for a resume target that no longer exists upstream.
 * Only a run that actually attempted native resume may clear the stored handle
 * and auto-reseed; fresh/create turns must ignore matching prose in stdout.
 */
export function resolveAgentResumeFailurePolicy(input) {
    const attemptedResume = input.isResuming === true
        && typeof input.resumeSessionId === 'string'
        && input.resumeSessionId.length > 0;
    const resumeFailed = attemptedResume &&
        isAgentResumeFailure(input.agentId, input.stderr, input.stdout ?? '');
    return {
        resumeFailed,
        clearStaleSession: resumeFailed,
        autoReseedFullTranscript: resumeFailed,
        reason: resumeFailed ? 'resume_failed' : null,
    };
}
/**
 * Resume identity guard. A stored upstream session is only safe to continue
 * (and to `skipTranscript` for) when the conversation has not changed shape
 * under it. We reject the resume — forcing a fresh session reseeded with the
 * full transcript — when:
 *  - the model changed (the session was built under a different model),
 *  - the cwd changed (different workspace identity), or
 *  - the conversation advanced under the session: the assistant message the
 *    session last produced is no longer the latest completed assistant turn
 *    (another agent ran in between, or the message was edited/removed).
 *
 * The cursor is the session's own last assistant message id. At the next turn's
 * resolve time the latest completed assistant message — excluding the current
 * run's in-flight placeholder — must still be that id. A null stored cursor (row
 * written before this guard shipped) cannot be verified, so it is treated as
 * unsafe and reseeded once.
 */
export function evaluateResumeInvalidation(input) {
    if ((input.storedModel ?? null) !== (input.currentModel ?? null))
        return 'model_changed';
    if ((input.storedCwd ?? null) !== (input.currentCwd ?? null))
        return 'cwd_changed';
    if (input.storedLastMessageId == null)
        return 'missing_cursor';
    if (input.latestCompletedAssistantId !== input.storedLastMessageId) {
        return 'conversation_advanced';
    }
    return null;
}
/**
 * Decide whether a resume-capable adapter should continue its stored CLI
 * session or start a new one for this (conversation, agent). Pure read +
 * mint; the caller is responsible for persisting `newSessionId` (and the
 * current model/cwd/cursor) when it actually spawns a create turn.
 */
export function resolveAgentResumeContext(db, input) {
    const record = getAgentSessionRecord(db, input.conversationId, input.agentId);
    const storedSessionId = record?.sessionId ?? null;
    const invalidationReason = storedSessionId != null
        ? evaluateResumeInvalidation({
            storedModel: record?.model ?? null,
            storedCwd: record?.cwd ?? null,
            storedLastMessageId: record?.lastMessageId ?? null,
            currentModel: input.currentModel ?? null,
            currentCwd: input.currentCwd ?? null,
            // Admit the stored session's own last message id through the cursor
            // filter so a resume-on-failure session (whose last turn FAILED but is
            // resumable) still matches its cursor; a different later failed turn
            // stays excluded and genuine advancement is still detected.
            latestCompletedAssistantId: latestCompletedAssistantMessageId(db, input.conversationId, input.currentAssistantMessageId ?? '', record?.lastMessageId ?? null),
        })
        : null;
    const resumable = storedSessionId != null && invalidationReason == null;
    return {
        storedSessionId,
        resumeSessionId: resumable ? storedSessionId : null,
        newSessionId: randomUUID(),
        isResuming: resumable,
        storedLastMessageId: record?.lastMessageId ?? null,
        storedStablePromptHash: resumable ? (record?.stablePromptHash ?? null) : null,
        storedInputTokens: resumable ? (record?.lastInputTokens ?? null) : null,
        storedStableSections: resumable ? parseStableSections(record?.stablePromptSections) : null,
        invalidationReason,
    };
}
/**
 * Whether a continuation turn must be handed the request it is continuing.
 *
 * "Continue the run" sends a directive, not a request: *continue where you left
 * off; otherwise complete the original request*. That sentence is only
 * answerable inside the session that heard the original request. Two surfaces
 * offer it — the chat error card and `od run continue` — and neither can tell
 * whether the session will actually be continued: they see `resumable` (and, in
 * the UI, agent identity), while `evaluateResumeInvalidation` above ALSO
 * compares the stored model, cwd and cursor. Changing the model in Settings
 * between the failure and the click is enough to diverge them.
 *
 * When they do diverge the daemon opens a fresh session, and the directive lands
 * somewhere that has never seen the request it names. Callers that ship a full
 * rendered transcript in `message` are unaffected (the transcript survives the
 * non-resume branch); callers that send only the directive are not, so the
 * daemon reseeds the request itself from persisted history.
 *
 * Deliberately requires a stored session WITH a cursor: that cursor is the exact
 * anchor for "which request", and without one there is nothing to be precise
 * about — guessing a request would be worse than sending none.
 */
export function resolveResumeContinuationSeed(input) {
    const required = input.isContinuation === true
        && input.requiresFullTranscript === true
        && typeof input.storedSessionId === 'string'
        && input.storedSessionId.length > 0
        && typeof input.storedLastMessageId === 'string'
        && input.storedLastMessageId.length > 0;
    return {
        required,
        anchorAssistantMessageId: required ? input.storedLastMessageId : null,
    };
}
/**
 * Persist a captured upstream session for a successful run.
 *
 * A missing captured session on a successful run means the adapter could not
 * safely identify the child session it just created (for example, ambiguous pi
 * `.jsonl` writes in a shared cwd). Clear the stored row so the next turn does
 * not resume stale history; it will start fresh and seed from the transcript.
 */
export function persistCapturedAgentSession(db, input) {
    if (!input.conversationId)
        return 'skipped';
    if (input.sessionId) {
        upsertAgentSession(db, {
            conversationId: input.conversationId,
            agentId: input.agentId,
            sessionId: input.sessionId,
            stablePromptHash: input.stablePromptHash ?? null,
            stablePromptSections: input.stablePromptSections ?? null,
            model: input.model ?? null,
            cwd: input.cwd ?? null,
            lastMessageId: input.lastMessageId ?? null,
            lastInputTokens: input.lastInputTokens ?? null,
        });
        return 'stored';
    }
    clearAgentSession(db, input.conversationId, input.agentId);
    return 'cleared';
}
// Signatures Claude Code prints to stderr when a `--resume <id>` target no
// longer exists on disk (session pruned, repo moved machines, ~/.claude
// cleared). Verified against the installed CLI (v2.1.178): the first pattern
// matches its "No conversation found with session ID: <id>" string. These stay
// as a fast path, but Claude's human-readable prose drifts across builds — when
// it does, none of these match and the stale session id is never cleared, so
// every turn retries the same dead `--resume` (#4275). The structured detector
// below is the version-stable primary; treat these patterns as a complement.
const CLAUDE_RESUME_FAILURE_PATTERNS = [
    /no conversation found with session id/i,
    /no session found/i,
    /session .* not found/i,
];
/**
 * Version-stable structured signal that a `--resume <id>` turn failed because
 * the target session could not be loaded. Unlike the human-readable prose
 * (which #4275 shows can silently stop matching across Claude builds), the
 * stream-json `result` event shape is stable: a resume whose session can't be
 * loaded fails LOCALLY, before any API call, so the terminal result is
 * `is_error` with zero turns and zero API time. A genuine in-turn failure
 * (overload / network) spends real API time (`duration_api_ms > 0`) and/or
 * completes a turn, so it is deliberately left alone — a transient blip must
 * not drop a still-valid session.
 */
function hasClaudeResumeFailureResultEvent(text) {
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{') || !trimmed.includes('"result"'))
            continue;
        let event;
        try {
            event = JSON.parse(trimmed);
        }
        catch {
            continue;
        }
        if (event.type !== 'result')
            continue;
        if (event.is_error === true
            && Number(event.num_turns) === 0
            && Number(event.duration_api_ms) === 0) {
            return true;
        }
    }
    return false;
}
/** sha256 hex digest of the composed stable instruction block. */
export function hashStableInstructions(stable) {
    return createHash('sha256').update(stable, 'utf8').digest('hex');
}
/**
 * Decide whether a resume-capable spawn must include the stable instruction
 * block (daemon prompt + tool contract + design system / skills / memory).
 * Always include it on a create turn (not resuming) or when the block's hash
 * differs from what was last sent on this session; skip it only on a resumed
 * turn whose stable block is byte-identical to last time (incl. legacy
 * sessions with no stored hash, which compare unequal and so re-send).
 */
export function computeIncludeStable(isResuming, storedStableHash, currentStableHash) {
    return !isResuming || storedStableHash !== currentStableHash;
}
/**
 * True when CLI output indicates a resume target session is missing. Prose
 * signatures are matched on `stderr` (where Claude prints the failure); the
 * version-stable structured `result` event is matched on `stdout` (the
 * stream-json channel). We deliberately do NOT scan ordinary assistant stdout
 * for the prose phrases — a successful turn whose model text happens to contain
 * "session not found" must not be mistaken for a resume failure.
 */
export function isClaudeResumeFailure(stderr, stdout = '') {
    if (stderr && CLAUDE_RESUME_FAILURE_PATTERNS.some((re) => re.test(stderr)))
        return true;
    return stdout ? hasClaudeResumeFailureResultEvent(stdout) : false;
}
// Signature codex prints when `exec resume <thread_id>` targets a thread whose
// rollout file is gone (pruned, ~/.codex/sessions cleared, machine moved):
//   Error: thread/resume: thread/resume failed: no rollout found for thread id <id>
// Verified against the installed Codex CLI. Like the Claude case this fails
// locally before any model call, so clearing the stale handle and re-seeding
// the transcript next turn is the correct, lossless recovery.
const CODEX_RESUME_FAILURE_PATTERNS = [
    /no rollout found for thread id/i,
    /thread\/resume failed/i,
];
/** True when codex CLI output indicates a resume target thread is missing. */
export function isCodexResumeFailure(text) {
    if (!text)
        return false;
    return CODEX_RESUME_FAILURE_PATTERNS.some((re) => re.test(text));
}
// Signature OpenCode prints when `run -s <id>` targets a session whose store is
// gone (deleted, corrupted, different machine). Verified against the installed
// OpenCode CLI: `run -s <well-formed-but-missing-id>` prints `Error: Session
// not found` to stderr (and the HTTP path returns a `NotFoundError`). Like the
// other CLIs this fails before any model call, so clearing the stale handle and
// re-seeding the transcript next turn is the correct, lossless recovery.
const OPENCODE_RESUME_FAILURE_PATTERNS = [
    /session not found/i,
    /NotFoundError/,
];
/** True when OpenCode CLI output indicates a resume target session is missing. */
export function isOpencodeResumeFailure(text) {
    if (!text)
        return false;
    return OPENCODE_RESUME_FAILURE_PATTERNS.some((re) => re.test(text));
}
/**
 * Per-agent dispatch for "the session/thread I asked to resume is gone".
 * Generalizes resume-fallback classification so every native-resume adapter
 * routes through one decision point in server.ts. Unknown agents return false
 * (no fallback) — a new resume-capable adapter must opt in here explicitly.
 *
 * Detection scans only the CLI's FAILURE channel, never successful assistant
 * output: codex/opencode print their resume-miss to `stderr` (a generic phrase
 * like OpenCode's "Session not found" must not be matched against the model's
 * stdout, or a turn that merely *mentions* it would be falsely failed); Claude's
 * prose is on stderr and its structured `result` marker on stdout.
 */
export function isAgentResumeFailure(agentId, stderr, stdout = '') {
    if (agentId === 'deepseek-harness') {
        return /DSH_PROFILE_RESUME_(?:REJECTED|MISMATCH)/.test(`${stderr}\n${stdout}`);
    }
    if (agentId === 'codex')
        return isCodexResumeFailure(stderr);
    if (agentId === 'opencode')
        return isOpencodeResumeFailure(stderr);
    if (agentId === 'amr') {
        return (isAmrResumeFailure(stdout) ||
            isAmrOpencodeEventStreamResumeFailure(`${stderr}\n${stdout}`));
    }
    // claude + codebuddy share Claude Code's stream-json result shape.
    return isClaudeResumeFailure(stderr, stdout);
}
// vela (AMR) reports a missing resumed session as a structured ACP JSON-RPC
// error `{"error":{"data":{"kind":"resume_failed",...}}}` on stdout (the
// protocol channel). Match the structured marker — not a bare word — so a
// model reply that merely mentions "resume_failed" cannot trip it.
const AMR_RESUME_FAILURE_PATTERN = /"kind"\s*:\s*"resume_failed"/;
const AMR_OPENCODE_EVENT_STREAM_RESUME_FAILURE_PATTERNS = [
    /opencode SSE ended before prompt completion/i,
    /opencode event stream:\s*opencode SSE ended before prompt completion/i,
];
/** True when vela's ACP output carries a resume_failed signal. */
export function isAmrResumeFailure(stdout) {
    if (!stdout)
        return false;
    return AMR_RESUME_FAILURE_PATTERN.test(stdout);
}
/**
 * True when AMR's opencode ACP bridge reports a stream EOF while resuming.
 * The caller only treats this as recoverable on resume turns, so matching this
 * bridge-level failure lets the daemon clear the stale handle and re-seed.
 */
export function isAmrOpencodeEventStreamResumeFailure(text) {
    if (!text)
        return false;
    return AMR_OPENCODE_EVENT_STREAM_RESUME_FAILURE_PATTERNS.some((re) => re.test(text));
}
//# sourceMappingURL=agent-session-resume.js.map