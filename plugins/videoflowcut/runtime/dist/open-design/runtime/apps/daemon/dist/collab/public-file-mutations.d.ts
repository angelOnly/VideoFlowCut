export interface PublicFileMutations {
    /** Nested root publication may join its caller's still-active mutation lane. */
    run<T>(projectId: string | readonly string[], operation: () => Promise<T>, options?: {
        joinCurrent?: true;
    }): Promise<T>;
    withMoves<T>(projectIds: readonly string[], operation: () => Promise<T>): Promise<T>;
    captureReconciliation(): (projectId: string) => boolean;
}
/**
 * One daemon-owned project lane for publication, stop, deletion and explicit
 * visibility moves. Hold until the operation settles, not until its HTTP
 * connection closes. Independent projects never block each other. Only moves
 * fence catalog reads; publishing a file does not change project policy.
 * Remote/cross-daemon races still need cloud authority.
 */
export declare function createPublicFileMutations(): PublicFileMutations;
