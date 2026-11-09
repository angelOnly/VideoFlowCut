/**
 * Represent old assistant forms as historical information rather than reusable
 * UI templates. This does not infer whether the user answered, interpret their
 * answers, constrain future questions, or validate newly generated output.
 * Unrecognized forms and code examples remain intact. User messages never call
 * this helper; their answers, skips and later changes retain their original text.
 */
export declare function summarizeHistoricalQuestionForms(content: string): string;
//# sourceMappingURL=history-question-form.d.ts.map