/** A terminal assistant control signal. Canonical output remains a self-closing line. */
export declare class ProductionMarkerStream {
    private readonly key;
    private pending;
    private fence;
    private passthroughLine;
    private discardingLine;
    private matches;
    private lastWasMarker;
    private lineTrusted;
    constructor(key: string);
    push(chunk: string, finishing?: boolean, assistantText?: boolean): string;
    get ready(): boolean;
    private line;
}
