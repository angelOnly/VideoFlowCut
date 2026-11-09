type Counters = {
    input: number;
    output: number;
    total: number;
    modelCalls: number;
};
/** Per-call last usage, deduplicated by cumulative provider counters within an explicit Turn. */
export declare function createCodexTurnUsage(): {
    start(id: string): void;
    add(id: string, tokenUsage: unknown): Counters | null;
};
export declare function codexTurnUsageFromEvents(events: Array<{
    event: string;
    data: unknown;
}>): Counters | null;
export {};
