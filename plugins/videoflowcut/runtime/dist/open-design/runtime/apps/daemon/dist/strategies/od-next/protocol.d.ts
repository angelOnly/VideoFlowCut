export interface OdNextReply {
    visibleText: string;
    productionReady: boolean;
}
/** Display-only compatibility for historical machine blocks. No parsing or validation. */
export declare class LegacyBlockFilter {
    private pending;
    private closing;
    get buffered(): boolean;
    push(chunk: string, finish?: boolean): string;
}
/** Every OD Next run, including a historical task, uses the same marker path. */
export declare function createOdNextRunProtocol(_mapping: unknown, productionKey: string): {
    push(delta: string, assistantText?: boolean): string;
    finish(): {
        parsed: OdNextReply;
        visibleTail: string;
    };
};
