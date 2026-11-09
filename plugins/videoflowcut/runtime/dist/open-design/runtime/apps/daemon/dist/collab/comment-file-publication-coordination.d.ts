import type { ResourceHubPrincipal } from './resource-principal.js';
/** Bounded root-publish scheduling only, never evidence of a file lifetime.
 * Active physical runs may temporarily remove files during normal edits.
 * Preserve pending work until the LAST run settles; restart recovery uses
 * persisted content checkpoints/facts at the existing startup boundary.
 */
export declare function createCommentFilePublicationCoordination(deps: {
    isBusy(projectId: string): boolean;
    wake(projectId: string, principal: ResourceHubPrincipal): void;
}): {
    /** The Run is already accepted/visible as busy before this starter gate.
     * Only cwd-writing startup waits; ongoing Runs and other projects do not.
     * No wait is introduced when there is no bounded publication in flight.
     */
    start<T>(projectId: string | null | undefined, starter: () => Promise<T>): Promise<T>;
    run<T>(projectId: string, principal: ResourceHubPrincipal, operation: () => Promise<T>): Promise<T>;
    settled(projectId: string): void;
};
