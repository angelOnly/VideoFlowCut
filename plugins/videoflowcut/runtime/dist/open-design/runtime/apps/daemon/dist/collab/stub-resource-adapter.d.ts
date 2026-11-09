import type { ResourcePublishAdapter } from './publish-scheduler.js';
/**
 * Placeholder resource-hub adapter until E's `services/resource-hub` (the resource-hub owner,
 * ) ships its client. It assigns a monotonic in-memory version per
 * project so the author-side publish flow (coalesce → publish → notify) is
 * exercisable end-to-end locally, but it does NOT durably store content. Swap
 * for the real E client (the resource hub the spec = createVersion + setRef('published')) when
 * it lands; the {@link ResourcePublishAdapter} interface is the seam.
 */
export declare function createStubResourcePublishAdapter(): ResourcePublishAdapter;
