import { type ChatArtifactCaptureDeps, type ChatArtifactCaptureResult } from './capture.js';
import { type MessageArtifactRow } from './store.js';
import type { ChatArtifactFailureCode } from './types.js';
export interface CaptureRunChatArtifactsInput {
    projectId: string;
    /** Absolute project directory the run wrote into. */
    projectRoot: string;
    /** Assistant message that will carry the refs. */
    messageId: string;
    runId?: string;
    /** Absolute paths the run created or modified. */
    touchedPaths: readonly string[];
    /** Optional lineage from the existing HTML version store, per entry path. */
    htmlVersionIds?: Readonly<Record<string, string>>;
    /** Cap on refs per message so a pathological run cannot flood the card list. */
    maxRefs?: number;
}
export interface CaptureRunChatArtifactsReport {
    refs: number;
    captured: number;
    reused: number;
    failed: number;
    /**
     * Why the failures failed, counted by code.
     *
     * A bare `failed` total cannot separate "the store is full" from "the file
     * changed under us", and those are different incidents: the first is a
     * capacity problem, the second means the bytes on disk stopped being the
     * bytes this turn produced — a timing failure that silently fabricates
     * history if anything downstream decides to substitute the current file.
     * `source_changed` therefore has to be countable on its own.
     */
    failureCodes: Partial<Record<ChatArtifactFailureCode, number>>;
    /**
     * The ref rows as written, in card order.
     *
     * The cover pass needs the ref IDs it is about to attach to, and re-reading
     * them would mean trusting that nothing rewrote this message's refs in
     * between. Returning what was just written keeps the two passes talking about
     * the same rows.
     */
    rows: MessageArtifactRow[];
}
export declare function captureRunChatArtifactSnapshots(deps: ChatArtifactCaptureDeps, input: CaptureRunChatArtifactsInput): Promise<CaptureRunChatArtifactsReport>;
/**
 * Attach a rendered static cover to an existing ref.
 *
 * This is the seam the first-viewport renderer plugs into. It is separate from
 * capture because the cover may arrive after the turn ends, while the ORIGINAL
 * bytes never may — those must be frozen at the chokepoint or not at all.
 */
export declare function attachChatArtifactThumbnail(deps: ChatArtifactCaptureDeps, input: {
    messageArtifactId: string;
    bytes: Buffer;
    mime?: string;
}): Promise<ChatArtifactCaptureResult>;
