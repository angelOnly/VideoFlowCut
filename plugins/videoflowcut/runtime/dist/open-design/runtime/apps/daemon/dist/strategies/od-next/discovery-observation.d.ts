type Event = {
    event?: string;
    data?: unknown;
};
/** Bounded ID-only state survives the runtime's event-ring truncation, without a DB or body copy. */
export declare function observeDiscoveryEvent(run: object, event: Event): void;
export declare function discoveryObservation(events: readonly Event[]): Record<string, unknown>;
/** Task exporters normalize Run objects; keep their bounded live evidence attached. */
export declare function preserveDiscoveryObservation<T extends object>(source: object, target: T): T;
export declare function discoveryObservationForRun(run: {
    events: readonly Event[];
}): Record<string, unknown>;
export {};
