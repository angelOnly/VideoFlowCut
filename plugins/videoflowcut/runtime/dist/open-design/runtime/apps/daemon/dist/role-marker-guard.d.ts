/**
 * Shared utility for detecting and stripping fabricated role-marker lines
 * (`## user`, `## assistant`, `## system`) injected by the model into its
 * own output (see #3247 — same class as #2102 / #2464).
 *
 * `createRoleMarkerGuard()` — stateful per-message guard for structured
 * stream handlers that can track message boundaries (Claude, Copilot,
 * Qoder, OpenCode/Codex, Pi, ACP). Returns `{ feedText, contaminated,
 * warningEvent }`.
 */
export declare const FABRICATED_ROLE_MARKER_RE: RegExp;
export interface RoleMarkerGuard {
    /** Feed a text delta for the current message. Returns the safe portion
     *  to emit (may be shorter than `text` if a marker was found mid-chunk,
     *  or empty string if the entire chunk is past the cut point). */
    feedText(text: string): string;
    /** Whether a fabricated marker was detected (further text is dropped). */
    readonly contaminated: boolean;
    /** If contaminated, the warning event to emit. `null` if clean. */
    warningEvent(): {
        type: 'fabricated_role_marker';
        marker: string;
        messageId: string;
    } | null;
}
/**
 * Create a stateful guard that detects fabricated role markers across
 * chunk boundaries. Memory + per-call work is O(1): instead of
 * accumulating the full message text, the guard retains only a small
 * trailing suffix (TAIL_BUFFER_SIZE chars) — enough for the matcher to
 * see across chunk boundaries when a marker straddles them.
 *
 * Usage in a stream handler:
 *
 *   const guard = createRoleMarkerGuard(messageId);
 *   for (const delta of deltas) {
 *     const safe = guard.feedText(delta.text);
 *     if (safe.length > 0) onEvent({ type: 'text_delta', delta: safe });
 *     if (guard.contaminated) {
 *       onEvent(guard.warningEvent()!);
 *       break; // stop emitting text for this message
 *     }
 *   }
 */
export declare function createRoleMarkerGuard(messageId: string): RoleMarkerGuard;
