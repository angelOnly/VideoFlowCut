import { type DesktopExportArtifactInput, type DesktopExportArtifactResult } from '@open-design/sidecar-proto';
import type { ChatArtifactCaptureDeps } from './capture.js';
import { type MessageArtifactRow } from './store.js';
import { type ChatArtifactVideoFrameExtractor } from './video-cover.js';
export type ChatArtifactCoverRenderer = (input: DesktopExportArtifactInput) => Promise<DesktopExportArtifactResult>;
/**
 * Wall clock the daemon gives one cover. The desktop renderer enforces its own
 * 8s budget; this is the outer guard for the case where the desktop process is
 * wedged and the IPC call (600s) never comes back at all.
 */
export declare const CHAT_ARTIFACT_COVER_BUDGET_MS = 20000;
/**
 * Per-turn ceiling. A run that rewrote forty pages is not worth forty renders —
 * the renderer is a shared, single-window resource and the next turn's covers
 * matter more than the tail of this one's.
 */
export declare const CHAT_ARTIFACT_COVER_MAX_PER_RUN = 8;
export interface FreezeChatArtifactCoversInput {
    /** Absolute project directory the run wrote into. */
    projectRoot: string;
    /** The refs the terminal capture just wrote for this message. */
    rows: readonly MessageArtifactRow[];
    /** Absent in a web-only daemon; no renderer means no cover, and no failure. */
    renderer: ChatArtifactCoverRenderer | null | undefined;
    /**
     * Seam for the video first-frame decoder. Defaults to the bundled ffmpeg;
     * only tests that want a deterministic failure pass anything else.
     */
    videoFrameExtractor?: ChatArtifactVideoFrameExtractor;
    /**
     * Announce that this ref's projection changed after the turn already ended.
     *
     * The render outlives the turn on purpose, so by the time a cover exists the
     * client has already done its one post-run re-read and is showing the
     * live-iframe degrade branch. Something has to tell it to look again — spec
     * line 505, "后台 ready 后消息投影更新".
     *
     * A callback rather than an import: this module has no business knowing what
     * an SSE sink is, and the same indifference is what lets the tests observe
     * the render without standing up a transport. Fired only for a cover that
     * actually landed — a failure changes no projection, so announcing one would
     * buy the client a pointless fetch.
     */
    onRefsChanged?: (row: MessageArtifactRow) => void;
}
export interface FreezeChatArtifactCoversReport {
    /** Refs whose renderer input was frozen and handed to a render. */
    frozen: number;
    /** Refs this build cannot cover at all (no renderer, wrong kind, over cap). */
    skipped: number;
    /** Refs whose freeze failed and were recorded as a failed snapshot. */
    failed: number;
}
/**
 * Freeze every coverable ref on this message, then render them in the
 * background.
 *
 * The AWAITED half is the freeze — it must complete before the terminal SSE
 * frame goes out, because after that the next turn may start writing. For HTML
 * the render is deliberately NOT awaited: it costs seconds, the frozen document
 * makes it race-free, and a chat turn should not sit open waiting for a
 * thumbnail. A card with no cover yet simply keeps its live preview.
 *
 * A video's frame extraction IS awaited, because for video the extraction is
 * the freeze — there is nothing to hand a later worker that is still guaranteed
 * to be this turn's bytes. `video-cover.ts` keeps that cost bounded (one frame,
 * a 10s budget, a handful per turn).
 */
export declare function freezeAndRenderChatArtifactCovers(deps: ChatArtifactCaptureDeps, input: FreezeChatArtifactCoversInput): Promise<FreezeChatArtifactCoversReport>;
