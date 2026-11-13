import type { Asset, JobRecord, MotionReviewEvidence, MotionReviewEvidenceInput, MotionReviewOutcome, MotionWork, ProjectSnapshot } from "@videocut/contracts";
import { motionWorkForCue, motionWorkVersion } from "@videocut/contracts";
import { DomainError, now, resolveCompositionReachability } from "@videocut/domain";
import { inspectEvidenceMedia, validateEditorialObservations } from "./editorial-evidence.js";

/** 同一作品支持文件和工作台观察；记录行为不能证明审阅者实际看过。 */
export async function validateSourceMotionReviewEvidence(snapshot: ProjectSnapshot, revision: number, jobs: JobRecord[], work: MotionWork, outcome: MotionReviewOutcome, input?: MotionReviewEvidenceInput, media?: Asset): Promise<MotionReviewEvidence | undefined> {
  if (!input) {
    if (outcome === "passed") throw new DomainError("通过作品审阅需要完整连续动态证据；尚未观看请登记 inconclusive", "MOTION_REVIEW_EVIDENCE_REQUIRED");
    return undefined;
  }
  if (!Number.isInteger(input.startFrame) || !Number.isInteger(input.endFrame) || input.startFrame < 0 || input.endFrame <= input.startFrame) throw new DomainError("作品审阅范围无效", "MOTION_REVIEW_RANGE_INVALID");
  let evidence: MotionReviewEvidence;
  if (input.kind === "work_proxy") {
    if (!media?.motion || input.previewJobId || !["frames", "continuous_video"].includes(input.method)) throw new DomainError("作品文件证据需要真实派生媒体且只支持画面观察", "MOTION_REVIEW_METHOD_INVALID");
    if (input.endFrame > media.motion.frameCount) throw new DomainError("观察超出媒体局部帧范围", "MOTION_REVIEW_RANGE_INVALID");
    const file = await inspectEvidenceMedia(snapshot.project.rootPath, media.motion.preview?.path ?? media.managedPath, media.motion.frameCount / media.motion.fps, media.motion.fps);
    if (file.hash !== (media.motion.preview?.hash ?? media.sourceHash)) throw new DomainError("作品文件已被替换", "MOTION_REVIEW_MEDIA_CHANGED");
    const offset = media.motion.rootRange?.startFrame ?? 0;
    evidence = { ...input, relativePath: file.path, contentHash: file.hash, revision, workStartFrame: offset + input.startFrame, workEndFrame: offset + input.endFrame, recordedAt: now() };
  } else {
    if (input.kind === "project_preview" && !input.previewJobId) throw new DomainError("合成文件证据需要 Preview Job", "MOTION_REVIEW_PREVIEW_REQUIRED");
    const active = resolveCompositionReachability(snapshot);
    const cues = snapshot.effectCues.filter(cue => active.effectCueIds.has(cue.id) && cue.workId === work.id
      && motionWorkForCue(snapshot, cue)?.definitionHash === work.definitionHash && cue.startFrame < input.endFrame && cue.endFrame > input.startFrame);
    const cue = cues[0];
    if (!cue) throw new DomainError("项目观察使用全局帧，范围必须与目标作品的有效 Cue 相交，通过时完整覆盖", "MOTION_REVIEW_CUE_MISMATCH");
    const [record] = await validateEditorialObservations(snapshot, revision, jobs, [{
      source: input.kind === "workbench" ? "workbench" : "preview", observer: input.observer, previewJobId: input.previewJobId,
      startFrame: input.startFrame, endFrame: input.endFrame, method: input.method,
      pass: input.method === "audio" ? "audio_only" : input.method === "audiovisual" ? "audiovisual" : "mute_visual", observation: "校验固定作品在项目范围的观察身份；具体判断保存在作品审阅说明。"
    }]);
    const rootRange = (start: number, end: number, offset: number) => ({
      start: Math.max(0, Math.floor((start + offset) * work.fps / snapshot.timeline.fps)),
      end: Math.min(work.frameCount, Math.ceil((end + offset) * work.fps / snapshot.timeline.fps))
    });
    let range = rootRange(Math.max(cue.startFrame, input.startFrame), Math.min(cue.endFrame, input.endFrame), (cue.sourceStartFrame ?? 0) - cue.startFrame);
    if (outcome === "passed") {
      // 只有项目时间与作品源时间同时连续，多个 Cue 才能证明一次完整顺播。
      const groups = new Map<number, Array<{ start: number; end: number }>>();
      for (const part of cues) {
        const offset = (part.sourceStartFrame ?? 0) - part.startFrame;
        const group = groups.get(offset) ?? [];
        group.push({ start: Math.max(part.startFrame, input.startFrame), end: Math.min(part.endFrame, input.endFrame) });
        groups.set(offset, group);
      }
      let complete = false;
      for (const [offset, group] of groups) {
        group.sort((left, right) => left.start - right.start || left.end - right.end);
        let start = group[0]!.start, end = group[0]!.end;
        for (let i = 1; i <= group.length; i++) {
          const next = group[i];
          if (next && next.start <= end) { end = Math.max(end, next.end); continue; }
          const candidate = rootRange(start, end, offset);
          if (candidate.start === 0 && candidate.end === work.frameCount) { range = candidate; complete = true; break; }
          if (next) { start = next.start; end = next.end; }
        }
        if (complete) break;
      }
      if (!complete) throw new DomainError("项目观察缺少完整覆盖作品的连续顺播范围", "MOTION_REVIEW_INCOMPLETE");
    }
    evidence = { ...input, relativePath: record!.relativePath, contentHash: record!.contentHash, snapshotHash: record!.snapshotHash, renderReleaseId: record!.renderReleaseId, workbenchIdentity: record!.workbenchIdentity, revision,
      workStartFrame: range.start, workEndFrame: range.end, recordedAt: now() };
  }
  if (outcome === "passed" && (!["continuous_video", "audiovisual"].includes(input.method) || evidence.workStartFrame !== 0 || evidence.workEndFrame !== work.frameCount)) throw new DomainError("静帧、只听声音或局部范围不能证明完整作品动态通过", "MOTION_REVIEW_INCOMPLETE");
  return evidence;
}

export async function validateMotionReviewEvidence(snapshot: ProjectSnapshot, revision: number, jobs: JobRecord[], asset: Asset, outcome: MotionReviewOutcome, input?: MotionReviewEvidenceInput) {
  const active = snapshot.motionWorks?.find(work => work.id === asset.motion?.workId);
  const work = asset.motion?.definitionHash ? motionWorkVersion(snapshot.motionWorks, asset.motion.workId, asset.motion.definitionHash)
    : [active, ...(active?.previousVersions ?? [])].find(item => item?.version === asset.motion?.version);
  if (!work) throw new DomainError("派生媒体没有固定作品引用", "MOTION_WORK_NOT_FOUND");
  return validateSourceMotionReviewEvidence(snapshot, revision, jobs, work, outcome, input, asset);
}
