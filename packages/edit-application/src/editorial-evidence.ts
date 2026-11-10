import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { promisify } from "node:util";
import type { EditorialReviewEvidence, EditorialReviewObservation, JobRecord, ProductionCompletionScope, ProjectSnapshot, WorkbenchEvidenceIdentity } from "@videocut/contracts";
import { createId, DomainError, effectBeatRanges, now, resolveCompositionReachability } from "@videocut/domain";
import { motionWorkForCue } from "@videocut/contracts";
import { captionDisplayRanges } from "../../contracts/src/caption-presentation.js";
import { soundDependencySignature } from "../../media-intelligence/src/sound-signature.js";
import { visualAssetIdentity } from "../../edit-domain/src/render-plan.js";
import { evidenceSupportsPass } from "../../quality-system/src/editorial-review.js";
import { readRuntimeConfig } from "@videocut/project-overview";
import { readMotionDefinition } from "./motion-definition.js";
import { readMotionFontFile } from "../../motion-work/src/fonts.js";
import { HYPERFRAMES_DEPENDENCIES, MOTION_ENGINE_VERSION } from "../../motion-work/src/hyperframes-contract.js";

const runFile = promisify(execFile);

/** 固定审阅所使用的项目快照；它不是输出视频的文件哈希。 */
export const workbenchSnapshotHash = (snapshot: ProjectSnapshot): string => createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");

/** 只检查观察范围真正使用的资源；不为了核对几帧重新渲染全片。 */
export async function workbenchEvidenceIdentity(snapshot: ProjectSnapshot, range: { startFrame: number; endFrame: number }, hashes = new Map<string, Promise<string>>()): Promise<WorkbenchEvidenceIdentity> {
  const overlaps = (entry: { startFrame: number; endFrame: number }) => entry.startFrame < range.endFrame && entry.endFrame > range.startFrame;
  const active = resolveCompositionReachability({ ...snapshot, timeline: { ...snapshot.timeline, items: snapshot.timeline.items.filter(overlaps) },
    effectCues: snapshot.effectCues.filter(overlaps), explainerPrograms: snapshot.explainerPrograms.filter(program => snapshot.scenes.some(scene => scene.id === program.sceneId && overlaps(scene))) });
  const works: WorkbenchEvidenceIdentity["works"] = [], fonts = new Map<string, { fontId: string; hash: string }>();
  const boundHashes = new Map<string, string>();
  for (const work of snapshot.motionWorks ?? []) {
    if (!active.motionWorkIds.has(work.id)) continue;
    const definition = readMotionDefinition(snapshot.project.rootPath, work);
    works.push({ workId: work.id, definitionHash: work.definitionHash });
    for (const binding of [...definition.boundImages, ...definition.boundVideos]) boundHashes.set(binding.assetId, binding.hash);
    for (const font of definition.boundFonts) {
      readMotionFontFile(font.fontId, font.hash);
      fonts.set(font.fontId, { fontId: font.fontId, hash: font.hash });
    }
  }
  const resources: WorkbenchEvidenceIdentity["resources"] = [];
  for (const asset of snapshot.assets) {
    if (!active.assetIds.has(asset.id)) continue;
    const key = resolve(snapshot.project.rootPath, asset.managedPath);
    if (!hashes.has(key)) hashes.set(key, evidenceHash(snapshot.project.rootPath, asset.managedPath));
    const hash = await hashes.get(key)!;
    const expected = boundHashes.get(asset.id) ?? asset.sourceHash;
    if (expected && expected !== hash) throw new DomainError(`观察素材已改变：${asset.id}`, "EDITORIAL_RESOURCE_CHANGED");
    resources.push({ assetId: asset.id, hash });
  }
  return { works, resources, fonts: [...fonts.values()], engineVersion: MOTION_ENGINE_VERSION, dependencies: HYPERFRAMES_DEPENDENCIES };
}

type FrameRange = { startFrame: number; endFrame: number };

/** 只把本次对象及其实际时间线引用映射为待观察范围。 */
export function productionObservationRanges(snapshot: ProjectSnapshot, scope: ProductionCompletionScope): FrameRange[] {
  if (scope.kind === "project") return snapshot.timeline.durationInFrames > 0 ? [{ startFrame: 0, endFrame: snapshot.timeline.durationInFrames }] : [];
  if (scope.kind === "beats") return scope.beatIds.flatMap(beatId => snapshot.scenes.flatMap(scene => effectBeatRanges(snapshot, beatId, scene.id)));
  const ids = new Set(scope.objectIds);
  const audioItems = new Set(snapshot.audioCues.filter(cue => ids.has(cue.id)).map(cue => cue.timelineItemId));
  const relatedScenes = new Set(snapshot.visualTreatments.filter(item => ids.has(item.id) && item.sceneId).map(item => item.sceneId));
  return [
    ...snapshot.scenes.filter(item => ids.has(item.id) || relatedScenes.has(item.id)),
    ...snapshot.timeline.items.filter(item => ids.has(item.id) || ids.has(item.assetId) || audioItems.has(item.id)),
    ...snapshot.timeline.captions.filter(item => ids.has(item.id)),
    ...snapshot.effectCues.filter(item => ids.has(item.id)),
    ...snapshot.cutaways.filter(item => ids.has(item.id))
  ].map(item => ({ startFrame: item.startFrame, endFrame: item.endFrame }));
}

/** 截取工作台实际合成所需的局部画面，排除派生媒体和其它时间段。 */
function workbenchVisualProjection(snapshot: ProjectSnapshot, range: FrameRange, identity: WorkbenchEvidenceIdentity) {
  const overlaps = (item: FrameRange) => item.startFrame < range.endFrame && item.endFrame > range.startFrame;
  const active = resolveCompositionReachability(snapshot);
  const items = snapshot.timeline.items.filter(item => active.videoItemIds.has(item.id) && overlaps(item));
  const cues = snapshot.effectCues.filter(cue => active.effectCueIds.has(cue.id) && overlaps(cue));
  const scenes = snapshot.scenes.filter(overlaps);
  const captions = snapshot.project.brief.captionMode === "none" ? [] : snapshot.timeline.captions.filter(caption => captionDisplayRanges(caption).some(overlaps));
  const itemIds = new Set(items.map(item => item.id));
  const sceneIds = new Set(scenes.map(scene => scene.id));
  const resourceIds = new Set(identity.resources.map(resource => resource.assetId));
  const programs = snapshot.explainerPrograms.filter(program => sceneIds.has(program.sceneId));
  return {
    width: snapshot.timeline.width, height: snapshot.timeline.height, fps: snapshot.timeline.fps,
    profile: snapshot.project.profile, stylePackId: snapshot.project.stylePackId, captionMode: snapshot.project.brief.captionMode,
    items: items.map(({ gainDb, mediaAudioPolicy, ...item }) => item),
    tracks: snapshot.timeline.tracks.filter(track => items.some(item => item.trackId === track.id)),
    cues, scenes, captions, captionFormat: captions.length ? snapshot.timeline.captionFormat : undefined,
    speechAlignment: captions.length && !snapshot.timeline.captionFormat ? snapshot.speechAlignment : undefined,
    speechAsset: captions.length && !snapshot.timeline.captionFormat ? snapshot.speechAsset : undefined,
    script: captions.length && !snapshot.timeline.captionFormat ? snapshot.script : undefined,
    works: cues.map(cue => {
      const work = motionWorkForCue(snapshot, cue);
      return work && { id: work.id, definitionHash: work.definitionHash, fps: work.fps, frameCount: work.frameCount, width: work.width, height: work.height };
    }),
    assets: snapshot.assets.filter(asset => resourceIds.has(asset.id)).map(visualAssetIdentity),
    performances: snapshot.actorPerformances.filter(item => itemIds.has(item.timelineItemId)).map(({ audioMode, ...item }) => item),
    cutaways: snapshot.cutaways.filter(item => itemIds.has(item.timelineItemId)).map(({ audioMode, ...item }) => item),
    programs,
    evidenceCaptures: snapshot.evidenceCaptures.filter(entry => programs.some(program => program.evidenceCaptureId === entry.id))
  };
}

/** 原观察保持原版本，只有依赖一致的区间可用于当前版本的覆盖计算。 */
export async function applicableWorkbenchEvidence(entry: EditorialReviewEvidence, observed: ProjectSnapshot, target: ProjectSnapshot, hashes = new Map<string, Promise<string>>()): Promise<FrameRange[]> {
  if (!entry.workbenchIdentity || entry.snapshotHash !== workbenchSnapshotHash(observed)) return [];
  if (entry.renderReleaseId !== readRuntimeConfig().runtime.releaseId) return [];
  const end = Math.min(entry.endFrame, target.timeline.durationInFrames);
  if (entry.startFrame >= end || observed.timeline.fps !== target.timeline.fps) return [];
  const boundaries = (snapshot: ProjectSnapshot) => {
    const entries = [...snapshot.timeline.items, ...snapshot.effectCues, ...snapshot.scenes, ...snapshot.timeline.captions.flatMap(captionDisplayRanges)];
    const points = entries.flatMap(item => [item.startFrame, item.endFrame]);
    if (entry.method === "audio" || entry.method === "audiovisual") {
      const ducks = snapshot.audioCues.map(cue => cue.ducking).filter((duck): duck is NonNullable<typeof duck> => Boolean(duck));
      const before = Math.max(12, ...ducks.map(duck => (duck.holdFrames ?? 6) + duck.releaseFrames));
      const after = Math.max(3, ...ducks.map(duck => duck.attackFrames));
      points.push(...snapshot.timeline.items.flatMap(item => [item.startFrame - after, item.endFrame + before]));
    }
    return points;
  };
  const points = [...new Set([entry.startFrame, end, ...boundaries(observed), ...boundaries(target)]
    .filter(point => point >= entry.startFrame && point <= end))].sort((a, b) => a - b);
  const result: FrameRange[] = [];
  const original = entry.workbenchIdentity;
  const isRecorded = (identity: WorkbenchEvidenceIdentity) => {
    if (identity.engineVersion !== original.engineVersion || JSON.stringify(identity.dependencies) !== JSON.stringify(original.dependencies)) return false;
    return identity.works.every(item => original.works.some(saved => saved.workId === item.workId && saved.definitionHash === item.definitionHash))
      && identity.resources.every(item => original.resources.some(saved => saved.assetId === item.assetId && saved.hash === item.hash))
      && identity.fonts.every(item => original.fonts.some(saved => saved.fontId === item.fontId && saved.hash === item.hash));
  };
  for (let index = 0; index < points.length - 1; index++) {
    const range = { startFrame: points[index]!, endFrame: points[index + 1]! };
    try {
      const before = await workbenchEvidenceIdentity(observed, range, hashes);
      const after = await workbenchEvidenceIdentity(target, range, hashes);
      if (!isRecorded(before) || JSON.stringify(before) !== JSON.stringify(after)) continue;
      if (entry.method !== "audio" && JSON.stringify(workbenchVisualProjection(observed, range, before)) !== JSON.stringify(workbenchVisualProjection(target, range, after))) continue;
      if (entry.method === "audio" || entry.method === "audiovisual") {
        const input = { method: "audio" as const, fromFrame: range.startFrame, toFrame: range.endFrame, renderIdentity: original.engineVersion };
        if (soundDependencySignature(observed, input) !== soundDependencySignature(target, input)) continue;
      }
      const last = result.at(-1);
      if (last && last.endFrame === range.startFrame) last.endFrame = range.endFrame;
      else result.push(range);
    } catch {
      // 素材变更或缺失只影响引用它的区间。
    }
  }
  return result;
}

export async function evidenceHash(root: string, path: string): Promise<string> {
  const actual = await realpath(resolve(root, path));
  const distance = relative(await realpath(root), actual);
  if (!distance || isAbsolute(distance) || distance === ".." || distance.startsWith("../") || distance.startsWith("..\\")) throw new DomainError("审片证据不在受管项目内", "EDITORIAL_EVIDENCE_PATH_INVALID");
  const info = await stat(actual);
  if (!info.isFile() || info.size === 0) throw new DomainError("审片文件为空或不可读", "EDITORIAL_EVIDENCE_FILE_INVALID");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(actual)) hash.update(chunk);
  return hash.digest("hex");
}

/** Preview 与作品代理共用真实媒体检查，不把代理伪装成 Preview Job。 */
export async function inspectEvidenceMedia(root: string, path: string, durationSeconds: number, fps: number) {
  const hash = await evidenceHash(root, path);
  let metadata: { streams?: Array<{ codec_type?: string }>; format?: { duration?: string } };
  try {
    const output = await runFile("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", resolve(root, path)], { windowsHide: true, timeout: 30_000, maxBuffer: 1024 * 1024 });
    metadata = JSON.parse(output.stdout) as typeof metadata;
  } catch { throw new DomainError("证据无法解析为真实媒体", "EDITORIAL_EVIDENCE_MEDIA_INVALID"); }
  const duration = Number(metadata.format?.duration);
  if (!metadata.streams?.some((stream) => stream.codec_type === "video") || !Number.isFinite(duration) || Math.abs(duration - durationSeconds) > 2 / fps) throw new DomainError("证据实际时长与声明范围不一致", "EDITORIAL_EVIDENCE_MEDIA_INVALID");
  return { path: relative(root, resolve(root, path)), hash, hasAudio: metadata.streams.some((stream) => stream.codec_type === "audio") };
}

/** 只验证文件、版本与观察方式的事实；不声称程序能代替真实观看和听觉判断。 */
export async function validateEditorialObservations(snapshot: ProjectSnapshot, revision: number, jobs: JobRecord[], observations: EditorialReviewObservation[]): Promise<EditorialReviewEvidence[]> {
  const media = new Map<string, { path: string; hash: string; hasAudio: boolean }>();
  const result: EditorialReviewEvidence[] = [];
  const identities = new Map<string, WorkbenchEvidenceIdentity>();
  for (const entry of observations) {
    if (!evidenceSupportsPass(entry) && !(entry.method === "frames" && ["mute_visual", "mode_specific"].includes(entry.pass))) throw new DomainError("观察方式不支持该审片轮次；抽帧不能表示听过或完整声画观看", "EDITORIAL_METHOD_INVALID");
    if (!Number.isInteger(entry.startFrame) || !Number.isInteger(entry.endFrame) || entry.startFrame < 0 || entry.endFrame > snapshot.timeline.durationInFrames || entry.endFrame <= entry.startFrame) throw new DomainError("实际审阅范围超出目标时间线", "EDITORIAL_EVIDENCE_RANGE_INVALID");
    if (!entry.observation.trim()) throw new DomainError("必须记录实际观察与仍未确认事项", "EDITORIAL_OBSERVATION_REQUIRED");
    if (entry.source === "workbench") {
      if (entry.previewJobId || !entry.observer?.trim()) throw new DomainError("工作台观察需要说明观察者，不能填写 Preview Job", "EDITORIAL_WORKBENCH_INVALID");
      const key = `${entry.startFrame}:${entry.endFrame}`;
      if (!identities.has(key)) identities.set(key, await workbenchEvidenceIdentity(snapshot, entry));
      result.push({ ...entry, observer: entry.observer.trim(), observation: entry.observation.trim(), id: createId("editorial_evidence"), revision, snapshotHash: workbenchSnapshotHash(snapshot), renderReleaseId: readRuntimeConfig().runtime.releaseId, workbenchIdentity: identities.get(key), recordedAt: now() });
      continue;
    }
    const job = jobs.find((candidate) => candidate.id === entry.previewJobId);
    if (!job || job.projectId !== snapshot.project.id || job.kind !== "preview" || job.status !== "succeeded" || !job.result || job.payload.revision !== revision || job.result.revision !== revision) throw new DomainError("证据必须来自本项目、目标 Revision 的成功 Preview Job", "EDITORIAL_PREVIEW_MISMATCH");
    const from = Number(job.payload.fromFrame);
    const to = Number(job.payload.toFrame);
    if (!Number.isInteger(from) || !Number.isInteger(to) || job.result.fromFrame !== from || job.result.toFrame !== to || !Number.isInteger(entry.startFrame) || !Number.isInteger(entry.endFrame) || entry.startFrame < from || entry.endFrame > to || entry.startFrame < 0 || entry.endFrame > snapshot.timeline.durationInFrames || entry.endFrame <= entry.startFrame) throw new DomainError("实际审阅范围超出 Preview 或目标时间线", "EDITORIAL_EVIDENCE_RANGE_INVALID");
    let file = media.get(job.id);
    if (!file) {
      if (typeof job.result.path !== "string") throw new DomainError("Preview 缺少实际文件", "EDITORIAL_EVIDENCE_FILE_INVALID");
      const path = resolve(snapshot.project.rootPath, job.result.path);
      file = await inspectEvidenceMedia(snapshot.project.rootPath, path, (to - from) / snapshot.timeline.fps, snapshot.timeline.fps);
      media.set(job.id, file);
    }
    if (["audio", "audiovisual"].includes(entry.method) && !file.hasAudio) throw new DomainError("无音轨 Preview 不能作为声音或声画审阅证据", "EDITORIAL_AUDIO_MISSING");
    result.push({ ...entry, observation: entry.observation.trim(), id: createId("editorial_evidence"), revision, relativePath: file.path, contentHash: file.hash, recordedAt: now() });
  }
  return result;
}
