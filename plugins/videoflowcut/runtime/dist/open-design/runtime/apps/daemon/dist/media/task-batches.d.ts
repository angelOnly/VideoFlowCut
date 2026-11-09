/**
 * Batch coordinates for media tasks — the "N/M" a chat progress row shows.
 *
 * A media task on its own cannot say how many images the user asked for: the
 * daemon never sees the agent's intent, only one `od media generate` call at a
 * time. What it does see is *when* those calls happen relative to each other,
 * and that is enough to answer the only question the row actually asks — is
 * this image part of one action with the others, or its own action?
 *
 * A batch is therefore a maximal run of same-run, same-surface tasks whose
 * lifetimes overlap: a task joins the open batch when it starts before every
 * member of that batch has ended, and opens a new batch otherwise. There is no
 * timing constant to tune, and it lands exactly where the product ruling put
 * it — a strictly one-at-a-time generation overlaps nothing, so every task is
 * its own batch of one and the row shows a single spinner instead of a
 * fabricated total.
 *
 * Membership only grows while a batch is open and freezes once its last member
 * ends, so M never walks backwards under polling: a task that was observed
 * running when the next one was created must report an end at or after that
 * creation, which is still an overlap on every later read.
 */
/** A media task as far as batching is concerned. */
export interface MediaTaskBatchInput {
    id: string;
    runId?: string | undefined;
    surface?: string | undefined;
    startedAt: number;
    endedAt: number | null;
    /**
     * Monotonic creation order. Required, because `startedAt` ties on every
     * parallel fan-out and a tie decided by list order would let cells swap
     * places between polls.
     */
    sequence: number;
}
export interface MediaTaskBatchMembership {
    /** Stable identity of the batch: the id of the task that opened it. */
    batchId: string;
    /** 1-based position within the batch. The N in "N/M". */
    batchIndex: number;
    /** Tasks known in the batch. The M in "N/M". */
    batchSize: number;
}
export declare function assignMediaTaskBatches(tasks: readonly MediaTaskBatchInput[]): Map<string, MediaTaskBatchMembership>;
