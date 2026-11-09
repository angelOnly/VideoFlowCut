/** Freeze recovery context while the plan text is available, before UI writeback.
 * No model summary, mutable chat history, or extra planning round is involved.
 */
export declare function composeColdProductionBundle(input: {
    frozenBundleText: string;
    planningReply: string;
    productionTurn: string;
}): string;
