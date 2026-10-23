import type { AvatarSourceReceipt, ProjectSnapshot, ActorGenerationRange } from "@videocut/contracts";
import type { EditingApplication } from "./index.js";

/**
 * 只读取旧 Job 固定输入及当时的 Revision，确认历史长源的真实音频。
 * 缺少采样率或媒体摘要就不宣称可复用，不迁移旧快照、不改写生成历史。
 */
export function readAvatarSourceSnapshot(app: EditingApplication, snapshot: ProjectSnapshot): ProjectSnapshot {
  const result = structuredClone(snapshot);
  for (const asset of result.assets) {
    if (asset.avatarSourceReceipt || asset.kind !== "actor_video" || asset.status !== "ready") continue;
    const performance = snapshot.actorPerformances.find(p => p.source === "generated"
      && snapshot.timeline.items.find(i => i.id === p.timelineItemId)?.assetId === asset.id);
    if (!performance?.generationJobId) continue;
    const job = app.repository.getJob(performance.generationJobId);
    if (job.kind !== "avatar_generation" || job.payload.contractVersion === 2 || job.projectId !== snapshot.project.id) continue;
    const payload = job.payload;
    if (!Number.isInteger(payload.requestedRevision) || !payload.generationRange || !asset.sourceHash) continue;
    const historical = app.repository.getRevision(snapshot.project.id, Number(payload.requestedRevision)).snapshot;
    const speech = historical.speechAsset;
    const file = historical.assets.find(a => a.id === speech?.assetId);
    const image = historical.assets.find(a => a.id === payload.referenceImageAssetId);
    const profile = historical.actorCapabilityProfiles.find(p => p.id === payload.capabilityProfileId);
    if (!speech || speech.id !== payload.speechAssetId || !file?.sourceHash || !file.metadata?.sampleRate
      || !image?.sourceHash || !profile) continue;
    const range = payload.generationRange as ActorGenerationRange;
    const rate = file.metadata.sampleRate;
    const receipt: AvatarSourceReceipt = {
      contractVersion: 2, jobId: job.id, assetId: asset.id,
      input: { audio: { assetId: file.id, sourceHash: file.sourceHash, sampleRate: rate,
        // 旧 Worker 实际按项目秒裁片，不能事后改成另一种映射。
        startSample: Math.round(range.startFrame / historical.timeline.fps * rate),
        endSample: Math.round(range.endFrame / historical.timeline.fps * rate) },
        referenceImageAssetId: image.id, referenceImageHash: image.sourceHash, profile,
        performanceNote: typeof payload.note === "string" ? payload.note : "",
        prompt: typeof payload.prompt === "string" ? payload.prompt : undefined },
      generationRange: structuredClone(range), generationFps: historical.timeline.fps,
      outputOffsetSeconds: 0, outputHash: asset.sourceHash
    };
    asset.avatarSourceReceipt = receipt;
  }
  return result;
}
