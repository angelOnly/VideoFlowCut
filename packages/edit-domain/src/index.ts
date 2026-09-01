import { randomUUID } from "node:crypto";
import type {
  Asset,
  AssetKind,
  CreativeBrief,
  EffectCue,
  EffectType,
  Id,
  ImpactReport,
  ProjectSnapshot,
  Scene,
  SceneType,
  SemanticUnit,
  SpeechSegment,
  TimelineDocument,
  TimelineItem,
  TimelineTrack
} from "@videocut/contracts";
import { DEFAULT_TRACKS } from "@videocut/contracts";

export const DEFAULT_BRIEF: CreativeBrief = {
  platform: "短视频",
  aspectRatio: "9:16",
  targetDurationSeconds: 60,
  audience: "泛内容用户",
  tone: "清晰、可信、自然",
  captionMode: "stable",
  allowHighDensityMotion: false
};

export class DomainError extends Error {
  constructor(message: string, public readonly code = "DOMAIN_ERROR") {
    super(message);
  }
}

export const createId = (prefix: string): Id => `${prefix}_${randomUUID()}`;
export const now = (): string => new Date().toISOString();

export const secondsToFrames = (seconds: number, fps: number): number => Math.max(0, Math.round(seconds * fps));
export const millisecondsToFrames = (milliseconds: number, fps: number): number => Math.max(0, Math.round((milliseconds / 1000) * fps));
export const framesToMilliseconds = (frames: number, fps: number): number => Math.round((frames / fps) * 1000);

export function createTimeline(fps = 24, width = 768, height = 1344): TimelineDocument {
  const tracks: TimelineTrack[] = DEFAULT_TRACKS.map((track, index) => ({
    id: createId("track"),
    ...track,
    order: index,
    locked: false,
    hidden: false,
    muted: false
  }));
  return { fps, width, height, durationInFrames: 0, tracks, items: [], captions: [] };
}

export function createProjectSnapshot(input: {
  projectId: string;
  name: string;
  rootPath: string;
  profile?: ProjectSnapshot["project"]["profile"];
  brief?: Partial<CreativeBrief>;
}): ProjectSnapshot {
  const createdAt = now();
  const brief = { ...DEFAULT_BRIEF, ...input.brief };
  const isPortrait = brief.aspectRatio === "9:16";
  return {
    project: {
      id: input.projectId,
      name: input.name,
      rootPath: input.rootPath,
      profile: input.profile ?? "presenter_motion",
      brief,
      stylePackId: "default-clean",
      createdAt,
      updatedAt: createdAt
    },
    assets: [],
    transcripts: [],
    semanticUnits: [],
    script: { semanticUnitIds: [], speechSegmentIds: [], revision: 0 },
    speechSegments: [],
    speechSegmentAssets: [],
    scenes: [],
    effectCues: [],
    timeline: createTimeline(24, isPortrait ? 768 : 1920, isPortrait ? 1344 : 1080),
    markers: []
  };
}

export function cloneSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  return structuredClone(snapshot);
}

export function trackByName(snapshot: ProjectSnapshot, name: string): TimelineTrack {
  const track = snapshot.timeline.tracks.find((candidate) => candidate.name === name);
  if (!track) throw new DomainError(`未找到轨道：${name}`, "TRACK_NOT_FOUND");
  return track;
}

export function assetById(snapshot: ProjectSnapshot, assetId: Id): Asset {
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new DomainError(`未找到素材：${assetId}`, "ASSET_NOT_FOUND");
  return asset;
}

export function recomputeTimelineDuration(timeline: TimelineDocument): void {
  timeline.durationInFrames = timeline.items.reduce((maximum, item) => Math.max(maximum, item.endFrame), 0);
}

/** 同轨不能重叠；不同轨通过层级表达叠加，不偷偷改写轨道。 */
export function assertTimelineValid(snapshot: ProjectSnapshot): void {
  const { timeline } = snapshot;
  for (const item of timeline.items) {
    if (!Number.isInteger(item.startFrame) || !Number.isInteger(item.endFrame) || item.startFrame < 0 || item.endFrame <= item.startFrame) {
      throw new DomainError(`时间线片段 ${item.id} 的帧范围无效`, "INVALID_ITEM_RANGE");
    }
    if (item.sourceEndFrame <= item.sourceStartFrame || item.sourceStartFrame < 0) {
      throw new DomainError(`时间线片段 ${item.id} 的源范围无效`, "INVALID_SOURCE_RANGE");
    }
    if (!timeline.tracks.some((track) => track.id === item.trackId)) {
      throw new DomainError(`时间线片段 ${item.id} 指向不存在的轨道`, "TRACK_NOT_FOUND");
    }
    assetById(snapshot, item.assetId);
  }
  for (const track of timeline.tracks) {
    const items = timeline.items
      .filter((item) => item.trackId === track.id && !item.disabled)
      .sort((left, right) => left.startFrame - right.startFrame);
    for (let index = 1; index < items.length; index += 1) {
      if (items[index - 1]!.endFrame > items[index]!.startFrame) {
        throw new DomainError(`轨道 ${track.name} 存在重叠片段`, "TRACK_OVERLAP");
      }
    }
  }
  recomputeTimelineDuration(timeline);
}

export function createMediaAsset(input: {
  name: string;
  kind: AssetKind;
  managedPath: string;
  originalPath?: string;
  sourceHash?: string;
}): Asset {
  return {
    id: createId("asset"),
    name: input.name,
    kind: input.kind,
    status: "queued",
    managedPath: input.managedPath,
    originalPath: input.originalPath,
    sourceHash: input.sourceHash,
    tags: [],
    createdAt: now()
  };
}

/**
 * FunASR 只有全文，分句仅用于语义讨论，绝不把这里的顺序误写成词级时序。
 */
export function createSemanticUnits(transcriptId: Id, assetId: Id, text: string): SemanticUnit[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks = normalized
    .split(/(?<=[。！？!?；;])\s*|\n+/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const source = chunks.length > 0 ? chunks : normalized ? [normalized] : [];
  return source.map((unitText, order) => ({
    id: createId("semantic"),
    transcriptId,
    sourceAssetId: assetId,
    text: unitText,
    order,
    status: "included"
  }));
}

/**
 * 首版以完整语义句为分段边界。若句子过长，再只在显式停顿处分开，避免机械按字数断句。
 */
export function compileSpeechSegments(units: SemanticUnit[]): SpeechSegment[] {
  const included = units.filter((unit) => unit.status === "included").sort((left, right) => left.order - right.order);
  return included.map((unit, order) => ({
    id: createId("speech_segment"),
    semanticUnitIds: [unit.id],
    text: unit.text,
    order,
    prePauseMs: order === 0 ? 0 : 180,
    postPauseMs: 80,
    status: "pending"
  }));
}

export function createScene(input: {
  type: SceneType;
  title: string;
  purpose: string;
  startFrame: number;
  endFrame: number;
  assetIds?: Id[];
}): Scene {
  if (input.endFrame <= input.startFrame) throw new DomainError("Scene 时长必须大于 0", "INVALID_SCENE_RANGE");
  return {
    id: createId("scene"),
    type: input.type,
    title: input.title,
    purpose: input.purpose,
    startFrame: input.startFrame,
    endFrame: input.endFrame,
    assetIds: input.assetIds ?? [],
    narrativeBeatIds: [],
    status: "draft",
    stylePackId: "default-clean"
  };
}

export function createEffectCue(input: {
  sceneId: Id;
  type: EffectType;
  layer: EffectCue["layer"];
  startFrame: number;
  endFrame: number;
  anchorTargetId?: Id;
  note?: string;
}): EffectCue {
  if (input.endFrame <= input.startFrame) throw new DomainError("效果范围无效", "INVALID_CUE_RANGE");
  return {
    id: createId("cue"),
    sceneId: input.sceneId,
    type: input.type,
    layer: input.layer,
    anchor: input.anchorTargetId ? "segment_start" : "scene",
    anchorTargetId: input.anchorTargetId,
    startFrame: input.startFrame,
    holdFrame: Math.max(input.startFrame + 1, Math.floor((input.startFrame + input.endFrame) / 2)),
    endFrame: input.endFrame,
    intensity: 0.6,
    status: "ready",
    note: input.note ?? ""
  };
}

export function createTimelineItem(input: Omit<TimelineItem, "id" | "disabled">): TimelineItem {
  return { id: createId("item"), ...input, disabled: false };
}

export function emptyImpact(): ImpactReport {
  return { changed: [], moved: [], recomputed: [], stale: [], conflicts: [], dirtyRanges: [], warnings: [] };
}

export function sceneForFrame(snapshot: ProjectSnapshot, frame: number): Scene | undefined {
  return snapshot.scenes.find((scene) => scene.startFrame <= frame && frame < scene.endFrame);
}
