/**
 * Streaming half of the `<od-next key="…">` marker (shape lives in
 * `@open-design/contracts`, `api/next-step-marker`).
 *
 * Two hard requirements, both of them scars:
 *
 *  1. **Never flash half a tag.** SSE cuts the stream wherever it likes, so a
 *     delta can end mid-marker — `<od-ne`, or `<od-next key="a7f`. Anything we
 *     cannot yet prove is prose gets held back until the next delta resolves
 *     it. `<od-title>` shipped without a wide enough look-back once and users
 *     watched a half tag paint and then vanish.
 *
 *  2. **Never swallow the user's words.** Holding back is a bet that more
 *     characters are coming. When the stream ends and the bet was wrong — the
 *     held tail was just prose that happened to start with `<` — `flush()`
 *     returns it verbatim. Silently eating a sentence is worse than briefly
 *     delaying one.
 *
 * Stripping is unconditional; only *acceptance* is keyed. A marker with the
 * wrong key, no key, or a malformed one is still removed from the visible
 * text and simply produces no suggestions.
 *
 * ---
 *
 * **Known duplication — read before "fixing" this in isolation.**
 *
 * Five hand-written streaming tag scanners live in this daemon, all the same
 * shape (hold an ambiguous tail, release or drop it when the next delta
 * decides) and all with *different* rules:
 *
 *   · `next-step-marker.ts`      — this file. Quote-aware tag-end scan, holds
 *                                  256 chars, drops a half tag.
 *   · `artifact-focus-marker.ts` — plain `indexOf('>')` plus a tag-name
 *                                  boundary check, holds 4096, drops a half tag.
 *   · `title-marker.ts`          — open/close pair, no attributes at all,
 *                                  holds 512, and on overflow *swallows* the
 *                                  content instead of releasing it.
 *   · `panel-grammar-strip.ts`   — matches on the tag NAME only, holds 96.
 *   · `role-marker-guard.ts`     — its own `pending`/`tail` withhold buffer.
 *
 * Four caps (96/256/512/4096) and two mutually contradictory overflow policies
 * (release-as-prose vs swallow) is one bug surface, not five. It has already
 * paid out twice: `<PANELIST role=…>` reached the chat because the name-only
 * matcher could not see attributes, and `<od-next … value="…` reached the chat
 * (and the database) because the quote-aware scan below could be poisoned by an
 * unterminated quote.
 *
 * Consolidating them is the right end state and is deliberately NOT done here:
 * `panel-grammar-strip.ts` was being fixed in parallel, and collapsing five
 * scanners into one needs its own change with a behavioural diff against real
 * transcripts, not a drive-by merge inside a bug fix. If you are the next
 * person here, that is the ticket to write — do not rediscover this list.
 */
export interface NextStepMarkerStripper {
    strip(delta: string): string;
    /**
     * Stream ended: give back what is still held. Held *prose* comes back
     * verbatim; a half-written opening tag is protocol and is dropped.
     */
    flush(): string;
}
export interface NextStepMarkerStripperOptions {
    /**
     * This turn's nonce. A marker is only *accepted* when its `key` matches.
     * `null` means the turn has no key (the marker was never taught this turn),
     * so every marker is stripped and none is accepted.
     */
    key: string | null;
    /** Called at most once per turn, with 1..3 suggestions. Never with `[]`. */
    emit: (suggestions: string[]) => void;
    /**
     * How far past an opening tag we keep waiting for `</od-next>` before giving
     * up and releasing the buffer as prose. Three short sentences plus the tag
     * fit comfortably; a model that writes an essay in here loses the marker,
     * which is the right outcome.
     */
    maxScanLength?: number;
}
export declare function createNextStepMarkerStripper(options: NextStepMarkerStripperOptions): NextStepMarkerStripper;
