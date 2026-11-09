/**
 * Built-in design direction library.
 *
 * Distilled from huashu-design's "5 schools × 20 philosophies" idea. The
 * library gives the agent concrete visual references to infer from by default.
 * When the user explicitly asks to compare visual directions, it can also
 * render these schools as `<question-form>` choices. Each school carries a
 * concrete spec — fonts, palette in OKLch, mood keywords, real-world
 * references — that the agent encodes into active CSS `:root` tokens.
 *
 * The library has TWO purposes:
 *
 *   1. Render-time: the prompt embeds these as choices the user picks from.
 *      One radio click → a deterministic palette + type stack, no model
 *      improvisation.
 *   2. Build-time: once chosen, the agent sees the full spec (palette
 *      values, font stacks, layout posture, mood) inline in its system
 *      prompt and binds the seed template's `:root` to those values.
 *
 * Adding a new direction: append to `DESIGN_DIRECTIONS` and it shows up in
 * the picker automatically. Keep them visually *distinct* — two near-
 * identical directions defeat the purpose.
 */
export interface DesignDirection {
    /** kebab-case id, also the form-option label after `: ` */
    id: string;
    /** Short user-facing label, shown in the radio. ≤ 56 chars including the dash list. */
    label: string;
    /**
     * One-paragraph mood description. Rendered as the `mood` blurb on a
     * `direction-cards` option — NOT as a per-question help string: that field
     * is dormant (OPEND-2707, see `FormQuestion.help` in
     * `apps/web/src/artifacts/question-form.ts`), and this renderer has had no
     * call site since the visual-style question was retired (OPEND-2760).
     */
    mood: string;
    /** References / exemplars — real magazines, products, designers. */
    references: string[];
    /** Headline (display) font stack. CSS-ready. */
    displayFont: string;
    /** Body font stack. CSS-ready. */
    bodyFont: string;
    /** Optional mono override; falls back to ui-monospace. */
    monoFont?: string;
    /** Six palette values in OKLch — bind directly to seed `:root`. */
    palette: {
        bg: string;
        surface: string;
        fg: string;
        muted: string;
        border: string;
        accent: string;
    };
    /** Layout posture cues for the agent. Concrete, not vague. */
    posture: string[];
}
export declare const DESIGN_DIRECTIONS: DesignDirection[];
/**
 * ⚠️ **休眠件(T69,2026-09-07)** —— 说明书在
 * `apps/web/src/runtime/visual-style-catalog.ts` 文件头。
 *
 * 这个函数**在本次改动之前就已经没有任何调用点**(全仓搜 `renderDirectionFormBody`
 * 只搜得到定义),设计风格选择题从提示词整题下线之后更不会有。留着不删是因为
 * 产品明说「后续可能要找回」,而它是那条路上现成的一块。
 *
 * ⚠️ 同文件里**读答案**那一半(`od tools directions` / `catalogue identity` 那段)
 * **是活的,别一起清掉**:旧表单交上来的 `value` / `foundation` / `guidance`
 * 仍要读得懂。撤的是**发问**,不是**读答案**。
 *
 * Render the direction-picker form body for emission as a `<question-form>`.
 * Uses the `direction-cards` question type so the UI renders each option
 * as a rich card (palette swatches + type sample + mood blurb + refs)
 * instead of a plain radio. Falls back gracefully — older clients that
 * don't recognise `direction-cards` treat it as text.
 */
export declare function renderDirectionFormBody(): string;
/**
 * The block we splice into the system prompt so the agent has each
 * direction's full spec inline (palette, fonts, posture). Used by the
 * discovery prompt to teach the agent *how* to bind a chosen direction
 * onto the seed template's `:root` variables.
 */
/** Full spec for one direction: mood, references, CSS-ready :root, posture. */
export declare function renderDirectionSpec(d: DesignDirection): string;
export declare function renderDirectionSpecBlock(): string;
/**
 * Compact pull-layer replacement for the full direction library (slim core):
 * one line per direction so the model can shortlist by vibe, plus the CLI
 * command that prints the chosen direction's full spec. Keeps ~6.7K of
 * palette data out of the always-on prompt at the cost of one tool call on
 * the direction-pick path (which runs once per project at most).
 */
export declare function renderDirectionIndexBlock(): string;
/** Resolve an inferred or user-selected direction; used by `od tools directions`. */
export declare function formatDirectionSpecText(idOrLabel: string): string | null;
/** Look up a direction by its `label` (what the user sees in the form). */
export declare function findDirectionByLabel(label: string): DesignDirection | undefined;
