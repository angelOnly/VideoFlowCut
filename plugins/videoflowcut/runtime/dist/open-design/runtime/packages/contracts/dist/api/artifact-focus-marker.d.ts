/**
 * The artifact-focus marker — the agent's say in what this turn *shows*.
 *
 * Two decisions in the chat panel have always been host guesswork:
 *
 *  · **which file the preview opens** when a turn ends (rank HTML over
 *    markdown over media, tie-break on mtime — `auto-open-file.ts`), and
 *  · **which produced files get a card** (everything the turn touched, which
 *    on a website turn means the page plus its stylesheet plus eleven images).
 *
 * The agent knows both answers and the host does not. This marker lets it say
 * so:
 *
 *     <od-focus key="a7f3c91ed2b40561" open="index.html"/>
 *     <od-focus key="a7f3c91ed2b40561" show="index.html, report.md"/>
 *     <od-focus key="a7f3c91ed2b40561" open="index.html" show="index.html"/>
 *
 * **Why one tag with two attributes, and not two tags.** The two answers have
 * different clocks: `open` wants to fire the moment the deliverable has content
 * (the user should not watch a spinner for the ninety seconds the agent spends
 * writing sidecar assets), while `show` is only knowable once the turn's output
 * set is final. A single *block* marker would force the early answer to wait
 * for the late one — precisely the wait this feature exists to remove. A single
 * *self-closing* marker with independent attributes lets the agent emit it
 * twice: early with `open`, late with `show`. Each attribute is last-wins on
 * its own, so a late `show`-only marker cannot retract an early `open`.
 *
 * Self-closing for the same reason `<od-done/>` is (see `done-marker.ts`): a
 * container holds the whole answer back until its closing tag arrives.
 *
 * **Why a key.** Same nonce as `<od-done>` / `<od-next>`, same reason. This
 * marker names a path that the host then reads and renders. An unkeyed form
 * would let any text the agent merely *read* — a cloned page, a quoted
 * document, an instruction hidden inside either — steer the user's preview at
 * a file of its choosing. A model cannot reproduce a nonce it was never shown.
 * Reusing the existing per-turn key costs no second nonce and no second event.
 *
 * **Stripping is unconditional.** A marker with a wrong, malformed, or missing
 * key is still protocol noise and never reaches the reader. That rule is not
 * theoretical: `CRITIQUE_INLINE_TAGS` once spelled `MUST_FIX` as `MUSTFIX`, so
 * the strip list matched nothing in real data and users read raw protocol in
 * their chat for four turns running. Spelling lives here, once, and both the
 * daemon's stream strip and the web's history strip import it.
 *
 * **The marker can only ever narrow.** `show` filters the produced-file list
 * the host already computed; it cannot add a file to it. So the worst a
 * misbehaving marker can do is hide a card — never fabricate one, and never
 * point a card at a file the turn did not produce.
 *
 * **Declaring narrows; silence does not blank.** `show` is how a turn cuts its
 * file list down to the deliverable (`declaredArtifactCards`). A turn that
 * declares nothing does NOT get an empty panel: the host falls back to the main
 * artifacts among the files that turn wrote (`pickPrimaryArtifacts`) — pages
 * and documents over images, never a stylesheet or a script on its own.
 *
 * That fallback replaced the original opt-in rule 「一张都不显示那就不显示呗」
 * for one reason: measurement. Declaration rate came back at 100% on turns that
 * created a file and 22–25% on turns that only edited one, so "no declaration,
 * no cards" meant most edit-only turns showed nothing at all (OPEND-2550). The
 * ruling that replaced it is 方案 C: fall back, but only to the main artifacts —
 * 「一个 html 可能会有 js 或 css 文件或者一堆图片文件, 但最终主要的是这个 html」.
 *
 * `open` was never part of either ruling and keeps its own fallback: a turn
 * without a marker still auto-opens by the host's rank/mtime inference.
 *
 * The fallback is a guess, and a declaration always beats it, so
 * `renderArtifactFocusInstruction` stays load-bearing rather than decorative —
 * it is the only thing that will ever cause a model to emit one. Its wording is
 * also the lever with the most leverage on that 22%: the instruction used to
 * speak only of files "you created this turn", which a model reading literally
 * is right to read as "an edit is not a delivery".
 *
 * This module is the single source of truth for the marker's shape.
 */
/** Opening tag without its attribute list — for streaming hold-back. */
export declare const OD_FOCUS_OPEN_TAG = "<od-focus";
/**
 * Every `<od-focus …>` occurrence, valid key or not, self-closed or not, plus
 * a stray `</od-focus>` a model may write out of habit.
 *
 * Deliberately permissive about the attribute list, exactly like
 * `OD_DONE_TAG_RE`: what makes a marker protocol is the tag name, not whether
 * the model got the attributes right.
 *
 * Global + case-insensitive; callers that keep state must clone it
 * (`lastIndex` is shared on a module-level regex).
 */
export declare const OD_FOCUS_TAG_RE: RegExp;
/**
 * Pull the key out of one `<od-focus …>` tag. Quotes optional, both styles
 * accepted (model formatting drifts); charset restricted so a stray attribute
 * cannot smuggle markup through.
 */
export declare const OD_FOCUS_KEY_ATTR_RE: RegExp;
/** `open="…"` — the single file the preview should show. */
export declare const OD_FOCUS_OPEN_ATTR_RE: RegExp;
/** `show="…"` — the comma-separated deliverables that deserve a card. */
export declare const OD_FOCUS_SHOW_ATTR_RE: RegExp;
/**
 * Ceiling on the `show` list. The whole point is a *shorter* list than the
 * host's inference produces, so a marker naming twenty files has misunderstood
 * the instruction; truncating is friendlier than rejecting and still bounds
 * the work the renderer does.
 */
export declare const MAX_ARTIFACT_FOCUS_SHOW = 8;
/**
 * Normalize one declared path into a project-relative POSIX path, or `null`
 * when it is not one we are willing to act on.
 *
 * This is the **untrusted-input boundary for a path the host will read**, so it
 * rejects rather than repairs:
 *
 *  · anything absolute (`/etc/passwd`, `C:/Windows/…`) — the daemon rebases
 *    absolute paths against the project root *before* calling this, because
 *    only the daemon knows where the root is;
 *  · any `..` segment **anywhere**, not merely a leading one. `a/../b` has no
 *    legitimate reason to appear in a declaration, and refusing it outright
 *    removes the whole class of "my normalizer and your normalizer disagree"
 *    bugs that traversal checks are famous for;
 *  · URL-ish inputs (`file:`, `data:`, `//host/share`), NUL bytes, and paths
 *    past the length/depth ceilings.
 *
 * Backslashes normalize to `/` so a Windows-style declaration still resolves;
 * `./` prefixes and repeated slashes collapse.
 */
export declare function normalizeArtifactFocusPath(raw: unknown): string | null;
/**
 * Split a `show="…"` attribute into normalized project-relative paths.
 *
 * Commas separate; newlines do too, because the tag body is matched with
 * `[^>]*` and a model that wraps a long list will put one there. Entries that
 * fail `normalizeArtifactFocusPath` are dropped individually — one bad path
 * must not discard the good ones alongside it.
 *
 * A path containing a literal comma cannot be expressed and is simply dropped;
 * the turn then falls back to the host's own inference for that file, which is
 * the same outcome as not writing the marker at all.
 */
export declare function parseArtifactFocusPathList(raw: unknown): string[];
/** One parsed `<od-focus …>` tag. `open`/`show` are absent when unusable. */
export interface ParsedArtifactFocusMarker {
    /** The key as written, or `''`. Callers compare it against the turn nonce. */
    key: string;
    /** Normalized project-relative path, or `null` when absent/unusable. */
    open: string | null;
    /** Normalized project-relative paths; `[]` when absent/unusable. */
    show: string[];
}
/**
 * Parse one complete opening tag. Attribute values are NOT normalized against
 * the project root here — that needs the root, which is daemon-only knowledge.
 * `open` is returned raw when it looks absolute so the daemon can rebase it;
 * see `rawOpen`.
 */
export declare function parseArtifactFocusMarker(tag: string): ParsedArtifactFocusMarker & {
    rawOpen: string;
    rawShow: string;
};
/**
 * Remove every `<od-focus …>` tag from a string.
 *
 * Used on any text that could reach a reader — the persisted message body,
 * copy-to-clipboard, exports, and the web's render of a conversation recorded
 * before the daemon learned to strip it.
 *
 * Caller beware: this is context-free, matching `stripDoneMarkers` and
 * `stripCritiqueGrammar`. A call site that must preserve a marker an agent
 * deliberately quoted inside a code fence does its own fenced-region check.
 */
export declare function stripArtifactFocusMarkers(text: string): string;
/**
 * Render the marker for a given key — the one place the wire format is
 * written, so the prompt example and the parser can never drift apart.
 */
export declare function renderArtifactFocusMarkerExample(key: string, parts: {
    open?: string;
    show?: readonly string[];
}): string;
/**
 * The per-turn instruction that teaches this marker — the ONLY place it is
 * taught, and the reason it lives here rather than in a prompt module.
 *
 * It has to be rendered per turn, because the key is a fresh nonce per run: a
 * marker without this turn's key is stripped and never accepted. That rules out
 * the cached stable prefix (`prompts/system.ts` on either side of the app
 * contract), where a per-turn nonce would move the prefix on every turn of every
 * conversation and miss the upstream prompt cache — the same reason `<od-done>`
 * and `<od-next>` are taught from the per-turn slice. Keeping the body next to
 * the parser and the example renderer means the daemon path and any BYOK path
 * read one string, not two copies that drift.
 *
 * Everything the host can decide for itself is decided for itself, so this stays
 * short. What it cannot decide, and therefore must say:
 *
 *  · **When** `open` fires. 「不要在空的时候打开,不然用户看到空的会感觉是 bug,
 *    能看到产物有内容了再打开? 但也不要等完全写完再打开,不然用户可能会等很久」
 *  · **What `show` is for.** 「一个 html 可能会有 js 或 css 文件或者一堆图片文件,
 *    但最终主要的是这个 html,而不是其他杂七杂八的东西,所以让 agent 只显示这个
 *    html」
 *  · **That an edit is a delivery.** The measured declaration rate is 100% on
 *    turns that created a file and 22–25% on turns that only edited one. That
 *    gap is not disobedience: the instruction used to speak only of "a file you
 *    created this turn", so a model deciding a small edit does not qualify was
 *    reading it correctly. The rule is stated explicitly now.
 *  · **What silence costs.** Not the cards — the host falls back to
 *    `pickPrimaryArtifacts` — but the accuracy: the fallback keeps every page,
 *    document and image the turn wrote, which over-lists whenever the turn had
 *    one real deliverable among several, and lists nothing at all when
 *    everything it wrote was a dependency.
 */
export declare function renderArtifactFocusInstruction(key: string): string;
/** The payload the daemon hands the client once a marker is accepted. */
export interface ArtifactFocusSelection {
    /** Project-relative path the preview should open, when the turn declared one. */
    open?: string;
    /** Project-relative paths that deserve a card, when the turn declared them. */
    show?: string[];
}
/**
 * Fold this turn's `artifact_focus` events into one selection, last-wins per
 * field.
 *
 * Per-field rather than per-event: a turn that says `open` early and `show`
 * late must end up with both. Folding whole events would let the late
 * `show`-only event blank the early `open`.
 */
export declare function foldArtifactFocusSelections(events: readonly ArtifactFocusSelection[]): ArtifactFocusSelection;
/** Minimal shape `narrowProducedFilesToFocus` needs — matches `ProjectFile`. */
export interface FocusCandidateFile {
    readonly name: string;
    readonly path?: string;
}
/**
 * What one written file is to the turn that wrote it.
 *
 *  · `deliverable` — a thing the user opens and reads: a page, a document.
 *  · `media` — an image, a video, a clip. A deliverable on an image turn, a
 *    sidecar next to a page.
 *  · `dependency` — the stylesheet, the script, the icon, the data file. Never
 *    a card on its own.
 */
export type ArtifactDeliveryRole = 'deliverable' | 'media' | 'dependency';
/**
 * Classify one written path by extension alone.
 *
 * **Unrecognized means deliverable, never dependency.** The failure direction
 * of this whole fallback has to be "one card too many", not "we quietly hid
 * what the user just made" — so only the explicitly named dependency and media
 * classes are demoted, and everything else is treated as something worth
 * showing.
 */
export declare function artifactDeliveryRole(pathLike: string): ArtifactDeliveryRole;
/**
 * The main artifacts among the files ONE turn wrote — the host's own answer for
 * a turn that declared no `show`.
 *
 * This is the fallback the product ruled in after the declaration rate came
 * back at 22% on edit-only turns: not "show everything the turn touched" (which
 * is the six-card panel the marker exists to shrink) and not "show nothing"
 * (which is OPEND-2550), but the deliverables inside what the turn already
 * wrote.
 *
 * **Ranked, not filtered.** A page outranks the images beside it, so a website
 * turn yields the page alone; an image-generation turn has no page to outrank
 * its images, so the images are the deliverables. That ranking IS the product's
 * sentence — 「一个 html 可能会有 js 或 css 文件或者一堆图片文件, 但最终主要的是
 * 这个 html」 — expressed once instead of as a chain of `if`s at the call site.
 *
 * **It cannot look outside the turn.** A turn that wrote only `app.js` gets an
 * empty list rather than the `index.html` that includes it: reaching for that
 * page would break this module's own rule that a card never points at a file
 * the turn did not produce. Whether that case is even worth an exception is a
 * measurement, not a guess — `run_finished.wrote_only_dependencies` counts it.
 */
export declare function pickPrimaryArtifacts<T extends FocusCandidateFile>(files: readonly T[]): readonly T[];
/**
 * The files the conversation lists as this turn's result cards.
 *
 * **This is the narrowing half only.** It answers "the agent declared X — what
 * does the panel list", and it answers `[]` for every input that is not a
 * usable declaration. That includes a declaration naming only files this turn
 * did not produce: a typo must not be the one input that brings back the full
 * six-card panel the marker exists to shrink.
 *
 * The `[]` it returns for "no declaration at all" is NOT the panel's final
 * answer. That case belongs to the caller, which falls back to
 * `pickPrimaryArtifacts` over the files the turn wrote. Keeping the two apart
 * is deliberate: this function must stay a pure filter — it can only ever
 * shrink a list it was handed — while the fallback is a separate judgment made
 * over separate evidence (the turn's own write/edit rows).
 *
 * It still cannot WIDEN: it filters a list the host built from files it saw for
 * itself, so a declared path that is not in that list matches nothing rather
 * than conjuring a card. Original order is preserved — the panel's ordering is
 * not the agent's call.
 *
 * Deliberately NOT the same function as `narrowProducedFilesToFocus` below.
 * That one answers "what did this turn deliver" for the Share / Download /
 * next-step anchor, where an undeclared turn must keep its inferred list or
 * those affordances lose their target. This one answers "what does the
 * conversation list". The two answers now differ for an undeclared turn, which
 * is exactly why they are two functions.
 */
export declare function declaredArtifactCards<T extends FocusCandidateFile>(files: readonly T[], show: readonly string[] | null | undefined): readonly T[];
/**
 * Narrow a turn's produced-file list to the ones the agent declared.
 *
 * This is the DELIVERY list, not the card list: it feeds the Share / Download /
 * next-step anchor and the plugin-folder scan. `declaredArtifactCards` above
 * owns what the conversation actually lists, and the two deliberately disagree
 * about an undeclared turn.
 *
 * Three rules, all of them load-bearing:
 *
 *  1. **No declaration → no change.** A turn without a marker keeps exactly the
 *     list the host inferred, so Share and Download still have something to
 *     point at. (This is NOT the card rule; cards went the other way — see
 *     `declaredArtifactCards`.)
 *  2. **Narrow only, never widen.** A declared path that is not in the list is
 *     ignored rather than added, so the marker cannot conjure an anchor for a
 *     file the turn did not produce.
 *  3. **An empty intersection is a no-op.** If the agent names only files the
 *     host did not attribute to this turn, we keep the inferred list rather
 *     than leaving those affordances with no target at all.
 *
 * Matching accepts a full project-relative path or a bare basename on either
 * side, because agents write `index.html` about as often as `site/index.html`.
 * Original order is preserved.
 */
export declare function narrowProducedFilesToFocus<T extends FocusCandidateFile>(files: readonly T[], show: readonly string[] | null | undefined): readonly T[];
//# sourceMappingURL=artifact-focus-marker.d.ts.map