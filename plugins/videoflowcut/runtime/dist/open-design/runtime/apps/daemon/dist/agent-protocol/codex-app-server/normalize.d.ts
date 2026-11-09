type AgentEvent = Record<string, unknown>;
export type CodexAppServerEventHandler = (event: AgentEvent) => void;
export interface CodexAppServerNormalizer {
    /** Route one server-to-client notification. Never throws on bad input. */
    handleNotification(method: string, params: unknown): void;
    /** Counters for notifications/items this build had no mapping for. */
    stats(): {
        unknownNotifications: number;
        unknownItems: number;
    };
}
export declare function createCodexAppServerNormalizer(onEvent: CodexAppServerEventHandler, 
/**
 * Injectable clock, for the publication throttle only. The parser is
 * otherwise a pure function of its frames; tests drive a whole turn inside a
 * single millisecond, which would let the throttle swallow every update after
 * the first and make an accumulation bug invisible.
 */
now?: () => number, cwd?: string): CodexAppServerNormalizer;
export {};
