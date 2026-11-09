interface CodexFirstCallUsage {
    first_call_input_tokens: number;
    first_call_cache_read_input_tokens: number;
    first_call_cache_hit_ratio: number;
}
/**
 * Recover the codex thread/session uuid captured for a run from its stored
 * event stream. json-event-stream emits it as `sessionId` on the first
 * `initializing` status event (mirroring claude). Returns the first one found,
 * or null. Matches the `{ event: 'agent', data: {...} }` envelope the run uses.
 */
export declare function codexSessionIdFromRunEvents(events: unknown): string | null;
/**
 * Extract the first-call usage of the rollout's LAST turn — the turn the daemon
 * has just finished. Returns null when the rollout has no completed first call
 * to read (no `last_token_usage`, or an empty/zero-input call), so callers can
 * cleanly fall back to leaving the codex first-call fields unset rather than
 * reporting a bogus ratio.
 */
export declare function extractCodexLastTurnFirstCallUsage(rolloutJsonl: string): CodexFirstCallUsage | null;
/**
 * Locate and read this run's codex rollout, returning the first-call usage of
 * its last turn. Fully best-effort: any failure (no CODEX_HOME, no session id,
 * missing rollout, unreadable file, partial turn) resolves to null so the
 * run_finished analytics path simply omits codex first-call fields rather than
 * failing the capture.
 */
export declare function readCodexRolloutFirstCall(opts: {
    codexHome: string | null | undefined;
    sessionId: string | null | undefined;
}): Promise<CodexFirstCallUsage | null>;
export {};
