import type Database from 'better-sqlite3';
import type { AgentSessionInvalidationReason } from '@open-design/contracts';
import { type StableSectionHashes } from './prompts/stable-sections.js';
type SqliteDb = Database.Database;
export type ResumeInvalidationReason = AgentSessionInvalidationReason;
export interface AgentResumeContext {
    /** Stored CLI session id if one exists, even when a guard rejects resuming it. */
    storedSessionId: string | null;
    /** Stored CLI session id to resume, or null when starting fresh. */
    resumeSessionId: string | null;
    /** Freshly minted UUID to open a new session with when not resuming. */
    newSessionId: string;
    /** True when a prior session id exists AND it is still safe to resume. */
    isResuming: boolean;
    /**
     * The assistant turn the stored session last produced. Unlike the fields
     * above this is reported even when the guard REJECTED the session: it is the
     * anchor for "which request was that session working on", which a refused
     * continuation turn needs in order to reseed context.
     */
    storedLastMessageId: string | null;
    /** Hash of the stable instruction block last sent on this session, or null. */
    storedStablePromptHash: string | null;
    /** Last effective input usage reported for this exact resumed session. */
    storedInputTokens: number | null;
    /**
     * Per-section digests behind `storedStablePromptHash`, for naming which input
     * drifted when the hash no longer matches. Diagnostic only — never an input
     * to the resume decision.
     */
    storedStableSections: StableSectionHashes | null;
    /** Set when a stored session existed but was rejected; see the type. */
    invalidationReason: ResumeInvalidationReason | null;
}
/**
 * Tracks input usage for one physical agent session attempt. Logical Run
 * retries retain their event history, so a different session needs a fresh
 * tracker; only an exact-session continuation may seed the retained value.
 */
export declare function createPhysicalAgentSessionUsageTracker(retainedInputTokens?: number | null): {
    observe(event: string, data: unknown): void;
    inputTokens(): number | null;
};
export type CapturedAgentSessionResult = 'stored' | 'cleared' | 'skipped';
export type AgentResumeTranscriptMode = 'resume-session' | 'full-transcript';
export interface AgentResumePromptPolicy {
    mode: AgentResumeTranscriptMode;
    /** Stored upstream handle to continue this turn, or null when reseeding. */
    resumeSessionId: string | null;
    /** True only when the daemon also asks the agent to resume native state. */
    skipTranscript: boolean;
    /** True for every guard miss, missing handle, unsupported adapter, or create turn. */
    requiresFullTranscript: boolean;
    invalidationReason: ResumeInvalidationReason | null;
}
export interface AgentResumeFailurePolicy {
    resumeFailed: boolean;
    /** Clear the persisted handle before the next attempt. */
    clearStaleSession: boolean;
    /** Re-run this turn fresh so the daemon sends the full transcript. */
    autoReseedFullTranscript: boolean;
    reason: 'resume_failed' | null;
}
/**
 * Shared transcript policy for resumable adapters. Native continuation and
 * transcript skipping are coupled: if the daemon cannot prove it is resuming a
 * valid upstream session this turn, the prompt path must recompose the full
 * transcript.
 */
export declare function resolveAgentResumePromptPolicy(ctx: Pick<AgentResumeContext, 'isResuming' | 'resumeSessionId' | 'invalidationReason'>): AgentResumePromptPolicy;
/**
 * Shared fallback policy for a resume target that no longer exists upstream.
 * Only a run that actually attempted native resume may clear the stored handle
 * and auto-reseed; fresh/create turns must ignore matching prose in stdout.
 */
export declare function resolveAgentResumeFailurePolicy(input: {
    agentId: string;
    stderr: string;
    stdout?: string;
    isResuming: boolean;
    resumeSessionId: string | null | undefined;
}): AgentResumeFailurePolicy;
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
export declare function evaluateResumeInvalidation(input: {
    storedModel: string | null;
    storedCwd: string | null;
    storedLastMessageId: string | null;
    currentModel: string | null;
    currentCwd: string | null;
    latestCompletedAssistantId: string | null;
}): ResumeInvalidationReason | null;
/**
 * Decide whether a resume-capable adapter should continue its stored CLI
 * session or start a new one for this (conversation, agent). Pure read +
 * mint; the caller is responsible for persisting `newSessionId` (and the
 * current model/cwd/cursor) when it actually spawns a create turn.
 */
export declare function resolveAgentResumeContext(db: SqliteDb, input: {
    conversationId: string;
    agentId: string;
    currentModel?: string | null;
    currentCwd?: string | null;
    /** The current run's in-flight assistant placeholder id, excluded from the
     *  "latest completed assistant" cursor lookup. */
    currentAssistantMessageId?: string | null;
}): AgentResumeContext;
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
export declare function resolveResumeContinuationSeed(input: {
    /** The caller declared this turn's message is a continuation directive. */
    isContinuation: boolean;
    /** The daemon could not continue a stored session on this turn. */
    requiresFullTranscript: boolean;
    /** Stored handle at resolve time — present even when the guard rejected it. */
    storedSessionId: string | null;
    /** Stored resume cursor; the assistant turn the refused session produced. */
    storedLastMessageId: string | null;
}): {
    required: boolean;
    anchorAssistantMessageId: string | null;
};
/**
 * Persist a captured upstream session for a successful run.
 *
 * A missing captured session on a successful run means the adapter could not
 * safely identify the child session it just created (for example, ambiguous pi
 * `.jsonl` writes in a shared cwd). Clear the stored row so the next turn does
 * not resume stale history; it will start fresh and seed from the transcript.
 */
export declare function persistCapturedAgentSession(db: SqliteDb, input: {
    conversationId: string | null | undefined;
    agentId: string;
    sessionId: string | null;
    stablePromptHash?: string | null;
    stablePromptSections?: string | null;
    model?: string | null;
    cwd?: string | null;
    lastMessageId?: string | null;
    lastInputTokens?: number | null;
}): CapturedAgentSessionResult;
/** sha256 hex digest of the composed stable instruction block. */
export declare function hashStableInstructions(stable: string): string;
/**
 * Decide whether a resume-capable spawn must include the stable instruction
 * block (daemon prompt + tool contract + design system / skills / memory).
 * Always include it on a create turn (not resuming) or when the block's hash
 * differs from what was last sent on this session; skip it only on a resumed
 * turn whose stable block is byte-identical to last time (incl. legacy
 * sessions with no stored hash, which compare unequal and so re-send).
 */
export declare function computeIncludeStable(isResuming: boolean, storedStableHash: string | null, currentStableHash: string): boolean;
/**
 * True when CLI output indicates a resume target session is missing. Prose
 * signatures are matched on `stderr` (where Claude prints the failure); the
 * version-stable structured `result` event is matched on `stdout` (the
 * stream-json channel). We deliberately do NOT scan ordinary assistant stdout
 * for the prose phrases — a successful turn whose model text happens to contain
 * "session not found" must not be mistaken for a resume failure.
 */
export declare function isClaudeResumeFailure(stderr: string, stdout?: string): boolean;
/** True when codex CLI output indicates a resume target thread is missing. */
export declare function isCodexResumeFailure(text: string): boolean;
/** True when OpenCode CLI output indicates a resume target session is missing. */
export declare function isOpencodeResumeFailure(text: string): boolean;
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
export declare function isAgentResumeFailure(agentId: string, stderr: string, stdout?: string): boolean;
/** True when vela's ACP output carries a resume_failed signal. */
export declare function isAmrResumeFailure(stdout: string): boolean;
/**
 * True when AMR's opencode ACP bridge reports a stream EOF while resuming.
 * The caller only treats this as recoverable on resume turns, so matching this
 * bridge-level failure lets the daemon clear the stale handle and re-seed.
 */
export declare function isAmrOpencodeEventStreamResumeFailure(text: string): boolean;
export {};
