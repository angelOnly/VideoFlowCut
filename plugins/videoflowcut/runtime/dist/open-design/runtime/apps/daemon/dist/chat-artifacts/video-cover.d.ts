import type { ChatArtifactFailureCode } from './types.js';
/**
 * Wall clock for one extraction. This one is spent INSIDE the turn (see the
 * module header), so it is deliberately tighter than the HTML cover's 20s
 * render budget: decoding a single frame is a seek and one decode, and a file
 * that cannot manage it in this long is not worth holding a chat turn open for.
 */
export declare const CHAT_ARTIFACT_VIDEO_FRAME_BUDGET_MS = 10000;
/**
 * Per-turn ceiling, for the same reason the budget is tight: this cost is
 * charged to the turn's latency. A run that produced a dozen clips gets posters
 * for the first few and live previews for the rest.
 */
export declare const CHAT_ARTIFACT_VIDEO_FRAME_MAX_PER_RUN = 4;
/**
 * JPEG, not PNG. A decoded video frame is photographic, so PNG would be several
 * megabytes of losslessly-compressed noise against `quota.ts`'s 8 MiB thumbnail
 * cap, while q4 JPEG lands in the hundreds of kilobytes at the same visual
 * quality. The mime travels with the blob, and `image/jpeg` is on the
 * snapshot route's inline-safe list.
 */
export declare const CHAT_ARTIFACT_VIDEO_FRAME_MIME = "image/jpeg";
export type ChatArtifactVideoFrameExtractor = (input: {
    absolutePath: string;
    outputPath: string;
    budgetMs: number;
    timeSeconds?: number;
}) => Promise<void>;
export type FreezeVideoFrameOutcome = {
    ok: true;
    bytes: Buffer;
    mime: string;
} | {
    ok: false;
    failureCode: ChatArtifactFailureCode;
};
/**
 * Decode the frame at `timeSeconds` (default: the first frame) into `outputPath`.
 *
 * `-nostdin` matters: ffmpeg reads stdin by default, and a child that inherits
 * the daemon's would swallow input meant for the process. `-an -sn` keeps the
 * decoder off the audio and subtitle streams it has no use for here.
 */
export declare const extractVideoFirstFrameWithFfmpeg: ChatArtifactVideoFrameExtractor;
/**
 * Extract the selected frame inside a verified window; ordinary videos default to zero.
 *
 * The stat pair around the decode is the whole guarantee: the frame must come
 * from the bytes this turn produced, and a write that landed while ffmpeg was
 * reading would otherwise hand back a frame of the NEXT version — indis-
 * tinguishable, once it is a JPEG, from the right one.
 *
 * Pure of the database on purpose: the caller owns the ref bookkeeping and the
 * honest-miss row, so this stays a capability that can be tested with a file
 * and a temp directory.
 */
export declare function freezeVideoFirstFrame(absolutePath: string, extract?: ChatArtifactVideoFrameExtractor, budgetMs?: number, timeSeconds?: number): Promise<FreezeVideoFrameOutcome>;
