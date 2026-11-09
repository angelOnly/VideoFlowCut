type Event = Record<string, unknown>;
/** Per-run state for the optional local plugin; native final events stay authoritative. */
export declare class OpenCodeToolEvents {
    private sessionId;
    private readonly pending;
    private readonly settled;
    private closed;
    private readonly beforeSession;
    startSession(id: string | null, emit: (event: Event) => void): void;
    handle(frame: Event, emit: (event: Event) => void): boolean;
    complete(id: string): void;
    flush(emit: (event: Event) => void): void;
}
export {};
