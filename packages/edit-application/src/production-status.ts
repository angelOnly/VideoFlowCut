import { motionMediaForCue, motionWorkForCue } from "@videocut/contracts";
import type { EditingApplication } from "./index.js";
import type { MotionContinuationResult } from "@videocut/contracts";

/** 只从真实对象派生状态，不保存另一份“当前制作状态”。 */
export function readProductionStatus(app: EditingApplication, projectId: string) {
  const state = app.readProject(projectId), jobs = app.repository.listJobs(projectId);
  const jobById = new Map(jobs.map(job => [job.id, job]));
  const artifacts = app.repository.listExportArtifacts(projectId);
  return {
    projectId, revision: state.revision.number, generatedAt: new Date().toISOString(),
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
      motion: state.reviews.motions.map(review => ({ workId: review.workId, assetId: review.assetId, version: review.version,
        outcome: review.outcome, note: review.note, evidence: review.evidence })),
      completeAudiovisualCoverage: "未由技术状态推断；依据实际观察的方法、范围和依赖判断"
    },
    user: artifacts.map(artifact => ({ artifactId: artifact.id, fileHash: artifact.fileHash, approval: artifact.approval ?? null }))
  };
}
