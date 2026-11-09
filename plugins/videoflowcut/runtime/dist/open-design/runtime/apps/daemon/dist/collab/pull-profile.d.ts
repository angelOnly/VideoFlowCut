export type SharedProjectPullTimingPhase = 'event-received' | 'queued' | 'guard-started' | 'guard-completed' | 'invoke' | 'completed' | 'route-started' | 'initial-authorization-reused' | 'authorized-stage-started' | 'authorized-stage-done' | 'authorized-receipt-validated' | 'authorized-scope-revalidated' | 'promotion-started' | 'promotion-done' | 'version-persisted' | 'transport-invoke' | 'transport-done' | 'registration-prepared' | 'catalog-revalidated' | 'scope-revalidated' | 'mirror-materialized' | 'version-write-started' | 'persisted' | 'route-completed';
export interface SharedProjectPullTimingEvent {
    phase: SharedProjectPullTimingPhase;
    projectId: string;
    version?: number | undefined;
    receivedAtMs?: number | undefined;
    atMs?: number | undefined;
    status?: string | undefined;
}
export declare function sharedProjectPullProfileEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function emitSharedProjectPullTiming(event: SharedProjectPullTimingEvent, env?: NodeJS.ProcessEnv): void;
/**
 * Parse only Vela's secret-free resource pull profile envelope. Arbitrary
 * stderr remains discarded: warnings can contain URLs, paths, or credentials.
 */
export declare function emitVelaResourcePullProfile(stderr: string, env?: NodeJS.ProcessEnv): void;
