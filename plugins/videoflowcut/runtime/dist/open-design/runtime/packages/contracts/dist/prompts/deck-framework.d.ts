/**
 * Stable deck framework injected into the system prompt when the active skill
 * mode is `deck`. The whole point: stop regenerating the scale-to-fit JS, the
 * keyboard handler, the slide visibility toggle, the counter, and the print
 * rules each turn — every regeneration has subtly different bugs (focus is
 * wrong, scaling drifts inside the iframe wrapper, arrow keys swallowed).
 *
 * Two pieces ship together:
 *   - DECK_SKELETON_HTML : the literal scaffold the model copies verbatim.
 *   - DECK_FRAMEWORK_DIRECTIVE : the prompt fragment that tells the model
 *     what is fixed and what they're allowed to change.
 *
 * Pattern: 1920×1080 fixed canvas anchored at the shell's top-left,
 * centered into the viewport by `fit()` with `transform-origin: top left`
 * and an explicit `translate(tx, ty) scale(s)` whose factor is recomputed
 * on every resize. The shell is intentionally NOT a grid/flex container —
 * any extra centering layer would stack with the explicit translate and
 * push the scaled stage off-screen (see the OD srcdoc bridge's deck-fix
 * placement note in `apps/web/src/runtime/srcdoc.ts:injectDeckBridge`).
 * Slides are `<section class="slide">` inside the stage, only
 * `.slide.active` is visible. Prev/next + counter live OUTSIDE the scaled
 * stage so they don't shrink with it.
 *
 * Why this pattern (not horizontal scroll-snap):
 *   - It matches what the model has the strongest prior on, so the framework
 *     gets adopted verbatim instead of being "blended" with the model's own
 *     instincts (which is what produced the drift in the first place).
 *   - 1920×1080 is the canonical slide canvas. Designs scale predictably.
 *   - Print becomes trivial: render every slide as block, page-break between.
 *
 * Drift fixes baked in:
 *   - `transform-origin: top left` with an explicit
 *     `translate(tx, ty) scale(s)`. The shell is plain block flow (no
 *     grid/flex/place-content), so the stage's natural top-left is (0, 0)
 *     and the translate centers it correctly even inside the OD viewer's
 *     nested transform wrapper.
 *   - Capture-phase keydown on BOTH window and document so iframe focus
 *     quirks can't swallow arrow keys.
 *   - Auto-focus body on load and on every click.
 *   - localStorage position restored on load.
 *   - Print stylesheet shows every slide as a 1920×1080 page-broken block,
 *     producing a multi-page vertical PDF on Save-as-PDF.
 */
export declare const DECK_SKELETON_HTML: string;
export type DeckFrameworkHandoffProfile = 'filesystem' | 'text_artifact';
export type DeckFrameworkMode = 'canonical' | 'legacy_compatible';
export declare function renderDeckFrameworkDirective(profile: DeckFrameworkHandoffProfile): string;
export declare function renderLegacyDeckCompatibilityDirective(profile: DeckFrameworkHandoffProfile): string;
/**
 * Backward-compatible filesystem form for callers that run native agents.
 * API/BYOK callers must use renderDeckFrameworkDirective('text_artifact').
 */
export declare const DECK_FRAMEWORK_DIRECTIVE: string;
//# sourceMappingURL=deck-framework.d.ts.map