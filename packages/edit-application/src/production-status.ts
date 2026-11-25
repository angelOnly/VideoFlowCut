import { motionMediaForCue, motionWorkForCue } from "@videocut/contracts";
import type { EditingApplication } from "./index.js";
import type { MotionContinuationResult, ProductionCompletionScope } from "@videocut/contracts";
import { assignmentScopesOverlap, evaluateProductionCoordination } from "./production-coordination.js";
import { readReferenceDecision, referenceComparisonsForRevision } from "./reference-comparison.js";
import { readUnitHandoffs, requiresVisualReferenceUnits } from "./production-unit-handoff.js";

export type ProductionStatusContext = { runId?: string; completionScope?: ProductionCompletionScope;
  referenceDecisionId?: string; referenceArtifactId?: string };

/** 只从真实对象派生状态，不保存另一份“当前制作状态”。 */
export async function readProductionStatus(app: EditingApplication, projectId: string, context?: ProductionStatusContext) {
  const state = app.readProject(projectId), jobs = app.repository.listJobs(projectId);
  const jobById = new Map(jobs.map(job => [job.id, job]));
  const artifacts = app.repository.listExportArtifacts(projectId);
  const run = context?.runId ? await app.readSkillExecutionReport({ projectId, runId: context.runId }) : undefined;
  const comparisonArtifact = context?.referenceArtifactId ? app.readExportArtifact({ projectId, artifactId: context.referenceArtifactId }) : undefined;
  const artifactSnapshot = comparisonArtifact ? app.readProject(projectId, comparisonArtifact.revision).snapshot : undefined;
  const comparison = artifactSnapshot
    ? { referenceComparisons: await referenceComparisonsForRevision(app, artifactSnapshot, { startFrame: 0, endFrame: artifactSnapshot.timeline.durationInFrames }, "artifact") }
    : run && context?.referenceDecisionId ? await readReferenceDecision(app, run, context.referenceDecisionId, true) : undefined;
  const completion = run ? await app.evaluateProductionCompletion({ projectId, runId: run.id, completionScope: context?.completionScope ?? run.completionScope, revision: state.revision.number }) : undefined;
  const scope = context?.completionScope ?? run?.completionScope;
  const preparationIssues = run && scope && run.intent !== "review_only" ? await evaluateProductionCoordination({
    report: run, snapshot: state.snapshot, scope, phase: "authoring",
    readRevision: revision => app.readProject(projectId, revision).snapshot
  }) : undefined;
  const fullReferenceUnits = run && requiresVisualReferenceUnits(run, state.snapshot);
  const draftedSceneIds = new Set(run?.unitHandoffs?.flatMap(event => event.action === "submit_draft" ? [event.draft.sceneId] : []));
  return {
    projectId, revision: state.revision.number, generatedAt: new Date().toISOString(),
    ...(comparison ? { referenceComparisons: comparison.referenceComparisons } : {}),
    ...(comparison && "referenceUnitCoverage" in comparison ? { referenceUnitCoverage: comparison.referenceUnitCoverage } : {}),
    ...(comparison && "authorRequest" in comparison ? { authorRequest: comparison.authorRequest } : {}),
    ...(comparisonArtifact ? { referenceArtifact: { id: comparisonArtifact.id, revision: comparisonArtifact.revision } } : {}),
    ...(completion ? { completion } : {}),
    ...(preparationIssues && scope ? { preparation: { revision: state.revision.number, scope, ready: preparationIssues.length === 0, issues: preparationIssues } } : {}),
    ...(run && scope && (fullReferenceUnits || draftedSceneIds.size) ? {
      unitHandoffs: readUnitHandoffs(run, state.snapshot, state.snapshot.scenes.filter(scene =>
        (fullReferenceUnits || draftedSceneIds.has(scene.id))
        && assignmentScopesOverlap(state.snapshot, scope, { kind: "objects", objectIds: [scene.id] })))
    } : {}),
    ...(run ? { responsibilityOptions: run.assignments.flatMap(assignment => assignment.responsibilities
      .filter((responsibility): responsibility is "creative_research" | "motion_research" | "visual_design" =>
        ["creative_research", "motion_research", "visual_design"].includes(responsibility))
      .map(responsibility => ({ responsibility, assignmentId: assignment.assignmentId, agentId: assignment.agentId,
        decisions: run.creativeDecisions.filter(item => item.phase === responsibility && item.assignmentId === assignment.assignmentId)
          .map(item => ({ id: item.id, decision: item.decision })) }))) } : {}),
    work: {
      adopted: state.snapshot.effectCues.filter(cue => cue.type === "ManagedMotion").map(cue => {
        const work = motionWorkForCue(state.snapshot, cue);
        const asset = motionMediaForCue(state.snapshot, cue);
        const job = work ? jobById.get(work.jobId) : undefined;
        return { cueId: cue.id, status: cue.status, range: { startFrame: cue.startFrame, endFrame: cue.endFrame },
          workId: work?.id, assetId: asset?.id, version: work?.version, jobId: job?.id, authoringInputs: cue.authoringInputs,
          inputBundle: job?.payload.inputBundle ?? null };
      }),
      pending: jobs.filter(job => ["motion_generation", "motion_adoption", "motion_authoring"].includes(job.kind) &&
        (["queued", "running", "failed", "unknown"].includes(job.status) || (job.result?.continuation as MotionContinuationResult | undefined)?.status === "needs_reconfirmation"
          || (job.kind === "motion_authoring" && (job.result?.authoring as { status?: string } | undefined)?.status === "incomplete")))
        .map(job => ({ jobId: job.id, kind: job.kind, status: job.status, continuation: job.result?.continuation,
          target: (job.payload.input as { target?: unknown } | undefined)?.target, targetRange: job.payload.targetRange,
          authoringInputs: job.payload.authoringInputs, authoring: job.result?.authoring,
          inputBundle: job.payload.inputBundle ?? null, error: job.error, execution: job.result?.execution }))
    },
    files: {
      previews: jobs.filter(job => job.kind === "preview").map(job => ({ jobId: job.id, status: job.status,
        revision: job.payload.revision, fromFrame: job.payload.fromFrame, toFrame: job.payload.toFrame,
        sourceHash: job.result?.sourceHash, path: job.result?.relativePath, error: job.error })),
      exports: artifacts.map(artifact => ({ artifactId: artifact.id, revision: artifact.revision, purpose: artifact.purpose,
        path: artifact.relativePath, fileHash: artifact.fileHash, technicalValidation: artifact.validation }))
    },
    audio: {
      // 从当前计划反查实际 Cue，连从未上轨的意图也能在制作状态中看到。
      intentCoverage: (state.snapshot.soundPlans ?? []).filter(plan => plan.status === "current").flatMap(plan =>
        plan.intents.map(intent => {
          const cues = state.snapshot.audioCues.filter(cue => cue.soundPlanId === plan.id && cue.soundIntentId === intent.id);
          const placed = cues.some(cue => cue.status === "ready" && cue.planVersion === plan.version &&
            state.snapshot.timeline.items.some(item => item.id === cue.timelineItemId && !item.disabled));
          let status: "silence" | "placed" | "stale" | "unplaced" = "unplaced";
          if (intent.function === "silence") status = "silence";
          else if (placed) status = "placed";
          else if (cues.length) status = "stale";
          return {
            soundPlanId: plan.id, planVersion: plan.version, soundIntentId: intent.id,
            function: intent.function, brief: intent.brief, status,
            planRange: { startFrame: plan.startFrame, endFrame: plan.endFrame },
            assetRequestIds: state.snapshot.assetRequests.filter(request =>
              request.sound?.soundPlanId === plan.id && request.sound.soundIntentId === intent.id).map(request => request.id),
            audioCueIds: cues.map(cue => cue.id)
          };
        })),
      pending: state.snapshot.audioCues.filter(cue => cue.status === "stale").map(cue => ({
        audioCueId: cue.id, kind: cue.kind, purpose: cue.purpose, eventFrame: cue.eventFrame,
        effectEvent: cue.effectEvent, timelineItemId: cue.timelineItemId,
        disabled: state.snapshot.timeline.items.find(item => item.id === cue.timelineItemId)?.disabled === true
      }))
    },
    observations: {
      sound: state.reviews.soundMixes.map(review => ({ previewJobId: review.previewJobId, previewRevision: review.previewRevision,
        method: review.method, fromFrame: review.fromFrame, toFrame: review.toFrame, outcome: review.outcome,
        currentRevisionApplicability: review.previewRevision === state.revision.number ? "same_revision" : "requires_dependency_check" })),
      motion: state.reviews.motions.map(review => ({ workId: review.workId, assetId: review.assetId, version: review.version, definitionHash: review.definitionHash,
        outcome: review.outcome, note: review.note, evidence: review.evidence })),
      editorial: completion ? { observationGaps: completion.observationGaps, openRequiredFindingIds: completion.openRequiredFindingIds } : undefined
    },
    user: artifacts.map(artifact => ({ artifactId: artifact.id, fileHash: artifact.fileHash, approval: artifact.approval ?? null }))
  };
}
