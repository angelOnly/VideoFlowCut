import type { MotionArtifactPreview } from '@open-design/contracts';
import type { ChatArtifactCaptureDeps } from './capture.js';
import { type MessageArtifactRow } from './store.js';
import { type ChatArtifactVideoFrameExtractor } from './video-cover.js';
import type { ChatArtifactFailureCode } from './types.js';
/** Only a marked video with an explicit cover time opts into this contract.
 * Old sources retain the first-frame compatibility path. Invalid declarations
 * are refused rather than silently replaced by a different frame. */
export declare function readMotionCoverSpec(html: string, sourcePath: string): MotionArtifactPreview | null;
export declare function freezeMotionArtifactCovers(deps: ChatArtifactCaptureDeps, input: {
    projectRoot: string;
    rows: readonly MessageArtifactRow[];
    videoFrameExtractor?: ChatArtifactVideoFrameExtractor;
}): Promise<{
    handled: Set<string>;
    frozen: number;
    failures: {
        row: MessageArtifactRow;
        code: ChatArtifactFailureCode;
    }[];
    attempts: number;
    skipped: number;
}>;
