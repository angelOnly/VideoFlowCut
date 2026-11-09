import { resolveProjectDir } from '../projects.js';
import { validateRunDeliverable, } from '../run-deliverable-validation.js';
import { finalizeDeliverableSyntax, DeliverableSyntaxInternalError, } from './deliverable-syntax-finalization.js';
export function deliverableSyntaxFinalizerEnabled(env = process.env) {
    const value = env.OD_DELIVERABLE_SYNTAX_FINALIZER?.trim().toLowerCase();
    return value !== '0' && value !== 'false' && value !== 'no' && value !== 'off';
}
/**
 * Resolve the canonical output and run the syntax finalizer for every
 * successful physical Run. Media export validity is owned by the exporter,
 * independent of task orchestration and model-authored plans.
 */
export async function finalizeSuccessfulRunDeliverable(input) {
    const deliverable = await validateRunDeliverable({
        projectsRoot: input.projectsRoot,
        projectId: input.projectId,
        ...(input.projectMetadata !== undefined
            ? { projectMetadata: input.projectMetadata }
            : {}),
        runStatus: 'succeeded',
        artifactCount: input.artifactCount,
        ...(input.touchedPaths ? { touchedPaths: input.touchedPaths } : {}),
        ...(input.baselineEntryFile ? { baselineEntryFile: input.baselineEntryFile } : {}),
        ...(input.allowIndependentOutput ? { allowIndependentOutput: true } : {}),
        ...(input.allowMultipleOutputCandidates ? { allowMultipleOutputCandidates: true } : {}),
    });
    if (!deliverable.valid
        || !input.projectId
        || input.syntaxFinalizerEnabled === false) {
        return { deliverable, syntax: { action: 'skip' } };
    }
    const syntaxInput = {
        artifactKind: deliverable.artifactKind,
        projectRoot: resolveProjectDir(input.projectsRoot, input.projectId, input.projectMetadata),
        entryFile: deliverable.linkedPage ?? deliverable.entryFile,
        relatedPaths: input.relatedPaths ?? [],
        processTreeQuiescent: input.processTreeQuiescent,
        ...(input.repairState ? { repairState: input.repairState } : {}),
        ...(input.previousMetrics ? { previousMetrics: input.previousMetrics } : {}),
    };
    let syntax;
    try {
        syntax = await finalizeDeliverableSyntax(syntaxInput);
    }
    catch (error) {
        if (!(error instanceof DeliverableSyntaxInternalError))
            throw error;
        // The product's non-blocking delivery policy must not hide an engine defect.
        // Never log the cause: it may contain generated source or local paths.
        console.error('[deliverable-syntax] internal_error');
        syntax = error.outcome;
    }
    return { deliverable, syntax };
}
//# sourceMappingURL=successful-run-deliverable-finalization.js.map