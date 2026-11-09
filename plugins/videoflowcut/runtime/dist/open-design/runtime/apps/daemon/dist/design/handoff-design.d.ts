import type Database from 'better-sqlite3';
import type { HandoffRequest, HandoffResponse } from '@open-design/contracts/api/handoff';
export type { HandoffRequest, HandoffResponse };
/**
 * Thrown when the conversation being handed off has no messages. The
 * route maps this to `400` so an empty conversation fails fast instead
 * of spending BYOK tokens synthesizing a handoff prompt from nothing.
 */
export declare class EmptyTranscriptError extends Error {
    constructor(message: string);
}
export interface HandoffOptions {
    /**
     * The conversation to summarize. Handoff is conversation-scoped — only
     * this conversation's transcript is exported and synthesized.
     */
    conversationId: string;
    apiKey: string;
    baseUrl?: string;
    model: string;
    maxTokens?: number;
    now?: () => Date;
    fetchImpl?: typeof globalThis.fetch;
    signal?: AbortSignal;
    /**
     * Override the helper-internal upstream-call timeout. Production
     * callers omit this so the helper bounds at DEFAULT_TIMEOUT_MS; tests
     * pass a smaller value to exercise the AbortSignal.any composition
     * without depending on fake timers.
     */
    timeoutMs?: number;
}
export declare const HANDOFF_SYSTEM_PROMPT = "You are summarizing an in-flight multi-turn design session so a fresh\nconversation can resume work without replaying the full chat. Your\noutput is a single user-style prompt the next conversation will send\nas its first message.\n\nOutput structure (Markdown, exactly these headings):\n## Context\n## Decisions made\n## Open questions\n## Current focus\n## Provenance\n\n- Context: 2-4 sentences naming what the session was about and where it left off.\n- Decisions made: bulleted list of choices the user committed to (one bullet each).\n- Open questions: bulleted list of unresolved questions the prior session surfaced.\n- Current focus: 1-2 sentences naming the artifact, file, or task in progress.\n- Provenance bullets (plain \"- Field: value\", no Markdown emphasis on labels):\n  - Project ID\n  - Transcript message count\n  - Generated UTC timestamp\n\nOutput the prompt body only. No preamble, no chat-style framing, no\n\"Here is the prompt\" prefix. Do not invent facts not supported by the\ntranscript; if a section has no content, write \"(none)\" rather than\nfabricating.";
export interface HandoffPromptInput {
    projectId: string;
    transcriptJsonl: string;
    transcriptMessageCount: number;
    now: Date;
}
export interface HandoffPromptOutput {
    systemPrompt: string;
    userPrompt: string;
}
/**
 * Build the system + user prompts for the Anthropic Messages API call.
 * The transcript JSONL is included verbatim (the caller has already
 * passed it through `truncateTranscriptForPrompt`); generation-context
 * fields (project id, message count, ISO UTC timestamp) feed the
 * Provenance section the system prompt requires.
 */
export declare function buildHandoffPrompt(input: HandoffPromptInput): HandoffPromptOutput;
type Db = Database.Database;
/**
 * Run the full handoff synthesis pipeline:
 *   1. export the project's transcript via PR #493's primitive,
 *   2. truncate it to fit the prompt budget,
 *   3. build the system + user prompts,
 *   4. call Anthropic with the same retry posture as finalize,
 *   5. extract the synthesised body + token usage.
 *
 * Network / parse failures rewrap as `FinalizeUpstreamError(502)` so the
 * route handler maps them to UPSTREAM_FAILED uniformly. A caller-supplied
 * `AbortSignal` is composed with an internal `DEFAULT_TIMEOUT_MS` bound
 * via `AbortSignal.any` so neither cancel path replaces the other.
 */
export declare function synthesizeHandoffPrompt(db: Db, projectsRoot: string, projectId: string, options: HandoffOptions): Promise<HandoffResponse>;
