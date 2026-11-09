import type { ChatArtifactDisplayPolicy } from './types.js';
export interface ChatArtifactPolicy {
    displayPolicy: ChatArtifactDisplayPolicy;
    /** Whether the original bytes are copied into the immutable blob store. */
    capturesContent: boolean;
    /** Whether the card wants a separately rendered static cover image. */
    wantsStaticCover: boolean;
}
export declare function chatArtifactPolicyForKind(kind: string): ChatArtifactPolicy;
/**
 * Whether this kind's ORIGINAL bytes may be copied into the immutable blob
 * store.
 *
 * This is the ENFORCEMENT question, and it is asked at the capture chokepoint
 * rather than trusted to each call site. `routes/media.ts` hands the provider's
 * exact bytes straight to `captureChatArtifactSnapshotFromBytes` without
 * consulting a policy at all, so a rule that only lived at the run-terminal
 * call site would have kept storing every generated video while the cards said
 * otherwise. A capture that violates this is skipped, not failed: nothing was
 * attempted and nothing is missing.
 */
export declare function chatArtifactKindStoresOriginalBytes(kind: string): boolean;
