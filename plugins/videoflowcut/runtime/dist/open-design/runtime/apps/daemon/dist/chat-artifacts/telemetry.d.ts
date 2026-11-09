import type { ChatArtifactCaptureResultProps } from '@open-design/contracts';
import type { CaptureRunChatArtifactsReport } from './run-capture.js';
export interface ChatArtifactCaptureTelemetryInput {
    projectId: string;
    runId: string;
    report: CaptureRunChatArtifactsReport;
}
/**
 * Build the event for one finished turn, or `null` when the turn produced no
 * cards at all.
 *
 * The null case matters: most turns write no artifacts, and emitting a row of
 * zeroes for each of them would make the failure rate this event exists to
 * watch a rounding error against a flood of no-ops.
 */
export declare function chatArtifactCaptureResultProps(input: ChatArtifactCaptureTelemetryInput): ChatArtifactCaptureResultProps | null;
