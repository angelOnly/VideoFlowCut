import type { DeliverableSyntaxMetrics, DeliverableSyntaxRepairState, ProjectMetadata } from '@open-design/contracts';
import { type RunDeliverableValidationResult } from '../run-deliverable-validation.js';
import { type DeliverableSyntaxFinalizationOutcome } from './deliverable-syntax-finalization.js';
export interface SuccessfulRunDeliverableFinalizationResult {
    deliverable: RunDeliverableValidationResult;
    syntax: DeliverableSyntaxFinalizationOutcome;
}
export declare function deliverableSyntaxFinalizerEnabled(env?: NodeJS.ProcessEnv): boolean;
/**
 * Resolve the canonical output and run the syntax finalizer for every
 * successful physical Run. Media export validity is owned by the exporter,
 * independent of task orchestration and model-authored plans.
 */
export declare function finalizeSuccessfulRunDeliverable(input: {
    artifactCount: number;
    previousMetrics?: DeliverableSyntaxMetrics;
    processTreeQuiescent: boolean;
    projectId: string | null;
    projectMetadata?: Partial<ProjectMetadata> | Record<string, unknown> | null;
    projectsRoot: string;
    relatedPaths?: readonly string[];
    repairState?: DeliverableSyntaxRepairState;
    touchedPaths?: string[];
    baselineEntryFile?: string;
    allowIndependentOutput?: boolean;
    allowMultipleOutputCandidates?: boolean;
    syntaxFinalizerEnabled?: boolean;
}): Promise<SuccessfulRunDeliverableFinalizationResult>;
