export declare const QUESTION_FORM_OPEN_RE: RegExp;
/**
 * True when `body` is a renderable question-form body.
 *
 * The grammar is exactly the one the web parser's `parseForm` accepts:
 * canonical JSON (optionally fenced, object or bare array) plus the narrow
 * `question-select` / `question-text` compatibility shape already persisted
 * by older runs. A body that fails both grammars becomes the UI's safe error
 * fallback (no form card renders).
 *
 * The bare top-level array is not a tolerance this module invents: the UI has
 * always rendered `[{…}]`, so requiring the `questions` key here scored a
 * displayed form as absent (OPEND-2364).
 */
export declare function questionFormBodyIsRenderable(body: string): boolean;
export declare function findQuestionFormCloseTag(text: string, from: number, closeTag: string): number;
export declare function emittedRenderableQuestionForm(text: unknown): boolean;
/**
 * What a text actually did with the `<question-form>` markup.
 *
 * "No form" and "a form that cannot render" are different facts with different
 * remedies, and collapsing them to a single renderable count is what let a
 * production turn emit `<question-form> 无需提出——…` — an open marker with prose
 * for a body and no close tag — while every consumer scored it as silence.
 */
export interface QuestionFormScan {
    /** Closed blocks whose body satisfies the parser contract. These render. */
    renderable: number;
    /** Closed blocks whose body fails the contract. The UI keeps them as prose. */
    unrenderable: number;
    /** An open marker with no matching close tag and no inner marker to retry from. */
    unterminated: boolean;
}
/**
 * Classify every `<question-form>`/`<ask-question>` marker in `text`.
 *
 * A marker is only charged as `unrenderable` or `unterminated` once the web
 * renderer would also have given up on it. Both of its recovery paths are
 * mirrored here, because a marker it recovers from is a form the user is
 * looking at:
 *
 *   - a closed block whose body fails to parse but itself contains another open
 *     marker — the outer match was a false positive, so the scan resumes at the
 *     inner marker instead of charging the outer one;
 *   - an open marker with no close tag but another open marker after it — same
 *     unwind, over the rest of the text.
 *
 * Scanning stops only at a marker with neither a close tag nor an inner marker
 * to resume from: without a close tag there is genuinely no way to know where
 * the body ends, so nothing after it can be attributed. That stop is *reported*
 * (`unterminated`) instead of silently returning a count of zero.
 *
 * Every resume point lies at or past the current open tag's end, so the cursor
 * strictly advances on each iteration and the scan always terminates.
 */
export declare function scanQuestionForms(text: unknown): QuestionFormScan;
/** Count complete renderable forms so one-round protocols can reject ambiguity. */
export declare function countRenderableQuestionForms(text: unknown): number;
//# sourceMappingURL=question-form-markup.d.ts.map