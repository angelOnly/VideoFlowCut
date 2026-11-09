// Shapes and narrowing guards for the loosely-typed rows the run routes and
// the run analytics lifecycle both read.
//
// These live outside `routes/runs.ts` so the analytics lifecycle can consume
// them without importing the route module back — a run's project row and its
// touched-artifact list are facts about the run, not about HTTP.
//
// Each guard takes the narrowest shape it actually reads rather than the full
// `ChatRun`, so a caller can hand over any object that carries those fields.
import { getProject } from '../db.js';
import { validateProjectDeliverable, validateRunDeliverable, } from '../run-deliverable-validation.js';
export function toJsonRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}
export function toProjectRecord(value) {
    if (!value || typeof value !== 'object')
        return null;
    const record = value;
    return typeof record.id === 'string'
        ? value
        : null;
}
export async function validateChatRunDeliverable(input) {
    const project = input.run.projectId
        ? toProjectRecord(getProject(input.db, input.run.projectId))
        : null;
    return validateRunDeliverable({
        projectsRoot: input.projectsRoot,
        projectId: input.run.projectId,
        projectMetadata: project?.metadata ?? input.run.projectMetadata ?? null,
        runStatus: input.runStatus,
        artifactCount: input.artifactCount,
        ...(input.touchedPaths ? { touchedPaths: input.touchedPaths } : {}),
    });
}
/**
 * Does the project this run belongs to hold a usable canonical deliverable?
 *
 * The presentation-side question, resolved through the same project record
 * lookup as `validateChatRunDeliverable` so both answers describe one project.
 * Never feed it to a completion gate — see `DeliverableValidationScope`.
 */
export async function validateChatProjectDeliverable(input) {
    const project = input.run.projectId
        ? toProjectRecord(getProject(input.db, input.run.projectId))
        : null;
    return validateProjectDeliverable({
        projectsRoot: input.projectsRoot,
        projectId: input.run.projectId,
        projectMetadata: project?.metadata ?? input.run.projectMetadata ?? null,
    });
}
export function runTouchedArtifactPaths(run) {
    const diff = run.artifactOutcome?.diff;
    return Array.isArray(diff?.touchedPaths)
        ? diff.touchedPaths.filter((value) => typeof value === 'string' && value.length > 0)
        : undefined;
}
//# sourceMappingURL=chat-run-records.js.map