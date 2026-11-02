import { z } from "zod";
import type { EditingApplication } from "./index.js";
import { DomainError, now } from "@videocut/domain";
import { audioDesignSchema } from "./sound-design.js";
import { hashMediaFile, managedSourcePath } from "./media-intelligence.js";
import { SOUND_REVIEW_DEPENDENCY_VERSION, soundDependenciesHaveIdentity, soundDependencySignature, soundVisualDependenciesHaveIdentity } from "../../media-intelligence/src/sound-signature.js";
import { captureRenderEnvironmentIdentity, type RenderEnvironmentIdentity } from "../../media-intelligence/src/render-environment.js";
import { validateEditorialObservations } from "./editorial-evidence.js";
import { readRuntimeConfig } from "@videocut/project-overview";
export { soundComparisonSignature, soundDependencySignature } from "../../media-intelligence/src/sound-signature.js";

export const soundComparisonSchema = z.object({
  revision: z.number().int().positive(), fromFrame: z.number().int().nonnegative(), toFrame: z.number().int().positive(),
  replaceCueId: z.string().min(1).optional(),
  alternatives: z.array(z.object({ name: z.string().trim().min(1).max(100), assetId: z.string().min(1), kind: z.enum(["sfx", "bgm"]), purpose: z.string().trim().min(1).max(800),
    eventFrame: z.number().int().nonnegative().optional(), onsetOffsetFrames: z.number().int().nonnegative().optional(), startFrame: z.number().int().nonnegative().optional(), endFrame: z.number().int().positive().optional(),
    sourceStartFrame: z.number().int().nonnegative(), sourceEndFrame: z.number().int().positive(), gainDb: z.number().min(-48).max(12), fadeInFrames: z.number().int().min(0).max(480).default(0), fadeOutFrames: z.number().int().min(0).max(480).default(0), loop: z.boolean().default(false), design: audioDesignSchema.optional()
  }).strict()).min(1).max(3), includeWithout: z.boolean().default(true)
}).strict().refine((input) => input.toFrame > input.fromFrame && input.toFrame - input.fromFrame <= 3600, "比较范围须为有效的有限上下文");

export async function reviewSoundMix(app: EditingApplication, projectId: string, input: { baseRevision: number; outcome: "passed" | "failed" | "inconclusive"; method: "audio" | "audiovisual"; note: string } & ({ source?: "preview"; previewJobId: string } | { source: "workbench"; observer: string; fromFrame: number; toFrame: number })) {
  if (input.source === "workbench") {
    const current = app.readProject(projectId);
    if (current.revision.number !== input.baseRevision) throw new DomainError("观察后项目版本已改变，请按实际版本重新核对", "SOUND_REVIEW_STALE");
    const [evidence] = await validateEditorialObservations(current.snapshot, input.baseRevision, [], [{ source: "workbench", observer: input.observer, pass: input.method === "audio" ? "audio_only" : "audiovisual", method: input.method, startFrame: input.fromFrame, endFrame: input.toFrame, observation: input.note }]);
    const identity = `workbench:${readRuntimeConfig().runtime.releaseId}`;
    const signature = soundDependencySignature(current.snapshot, { method: input.method, fromFrame: input.fromFrame, toFrame: input.toFrame, renderIdentity: identity });
    const state = app.repository.recordReview(projectId, input.baseRevision, reviews => {
      reviews.soundMixes.push({ ...input, signature, dependencySchemaVersion: SOUND_REVIEW_DEPENDENCY_VERSION, evidenceScope: "workbench", workbenchEvidence: evidence,
        renderIdentity: identity, renderReleaseId: readRuntimeConfig().runtime.releaseId, fromFrame: input.fromFrame, toFrame: input.toFrame, recordedAt: now() });
    });
    app.publish({ projectId, revision: state.revision.number, type: "review" });
    return state;
  }
  const job = app.trackJob(input.previewJobId);
  if (job.projectId !== projectId || job.kind !== "preview" || job.status !== "succeeded" || !job.result?.path) throw new DomainError("混合审阅需要正式预览的成功产物，候选对比不等于最终采用", "SOUND_REVIEW_PREVIEW_REQUIRED");
  const current = app.readProject(projectId);
  const path = await managedSourcePath(current.snapshot.project.rootPath, String(job.result.path));
  const previewHash = await hashMediaFile(path);
  if (job.result.sourceHash !== previewHash) throw new DomainError("预览文件已改变或没有固定文件身份，需要重新生成", "SOUND_REVIEW_ARTIFACT_CHANGED");
  const previewRevision = Number(job.payload.revision);
  const reference = app.repository.getRevision(projectId, previewRevision);
  const from = Number(job.payload.fromFrame), to = Number(job.payload.toFrame);
  const environment = job.result.renderEnvironmentIdentity as Partial<RenderEnvironmentIdentity> | undefined;
  const release = typeof job.result.releaseId === "string" && job.result.releaseId ? job.result.releaseId : "unknown";
  const currentEnvironment = await captureRenderEnvironmentIdentity({ includeVisual: false });
  const identity = environment?.releaseId === release && typeof environment.audio === "string" ? environment.audio : "unknown";
  if (previewRevision !== current.revision.number) {
    const contentChecks = new Map<string, boolean>();
    if (release === "unknown" || release === "manual" || !currentEnvironment || currentEnvironment.releaseId !== release
      || identity === "unknown" || currentEnvironment.audio !== identity
      || !soundDependenciesHaveIdentity(reference.snapshot, from, to, contentChecks) || !soundDependenciesHaveIdentity(current.snapshot, from, to, contentChecks)) {
      throw new DomainError("旧预览的发行版本或声音素材身份不足，无法确认跨版本复用", "SOUND_REVIEW_STALE");
    }
    if (input.method === "audiovisual" && [reference.snapshot, current.snapshot].some(snapshot => !soundVisualDependenciesHaveIdentity(snapshot, from, to, contentChecks)))
      throw new DomainError("旧预览的画面或系统字体身份不足，无法确认跨版本复用", "SOUND_REVIEW_STALE");
  }
  const parameters = { method: input.method, fromFrame: from, toFrame: to, renderIdentity: identity };
  const signature = soundDependencySignature(current.snapshot, parameters);
  if (signature !== soundDependencySignature(reference.snapshot, parameters)) throw new DomainError("试听后声画依赖已改变，需要重新生成预览", "SOUND_REVIEW_STALE");
  const state = app.repository.recordReview(projectId, input.baseRevision, (reviews) => {
    reviews.soundMixes.push({ ...input, signature, previewHash, previewRevision, dependencySchemaVersion: SOUND_REVIEW_DEPENDENCY_VERSION,
      renderIdentity: identity, renderReleaseId: release, evidenceScope: "source_preview", fromFrame: from, toFrame: to, recordedAt: now() });
  });
  app.publish({ projectId, revision: state.revision.number, type: "review" });
  return state;
}
