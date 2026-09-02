import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { Asset, ProjectSnapshot, TimelineItem, VlogShotAnalysis } from "@videocut/contracts";
import { assetById, DomainError, resolveCompositionReachability } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";

/**
 * 原素材审阅的三种证据密度。它们只读取、解码和缓存原素材，不会写入项目 Revision。
 */
export type SourceReviewMode = "overview" | "range" | "dense";

export interface InspectAssetInput {
  projectId: string;
  assetId: string;
  mode: SourceReviewMode;
  /** 项目 Timeline FPS 下的源帧坐标；range / dense 必填。 */
  sourceStartFrame?: number;
  /** 项目 Timeline FPS 下的开区间结束帧坐标；range / dense 必填。 */
  sourceEndFrame?: number;
  /** 联系表帧数；不同密度有各自上限，不能借此制造大范围密集解码。 */
  contactSheetFrames?: number;
}

export interface SourceReviewMediaFile {
  /** 相对于项目根目录的受管派生路径，可由 /media/{projectId}/... 读取。 */
  relativePath: string;
  /** 不绑定具体 Web Host 的媒体路由路径。 */
  mediaPath: string;
}

export interface SourceReviewFrame extends SourceReviewMediaFile {
  sourceFrame: number;
  sourceMs: number;
  timecode: string;
}

export interface SourceReviewRange {
  startFrame: number;
  endFrame: number;
  startMs: number;
  endMs: number;
  fps: number;
}

export interface SourceReviewShot {
  id: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  source: VlogShotAnalysis["source"];
  sceneChangeScore?: number;
  technicalScore: number;
  hasAudio: boolean;
  status: VlogShotAnalysis["status"];
  evidenceNote: string;
}

export interface SourceReviewUsage {
  timelineItems: Array<{
    id: string;
    trackId: string;
    trackName?: string;
    sceneId?: string;
    startFrame: number;
    endFrame: number;
    sourceStartFrame: number;
    sourceEndFrame: number;
    disabled: boolean;
  }>;
  scenes: Array<{ id: string; type: string; title: string; startFrame: number; endFrame: number; status: string }>;
  cutaways: Array<{ id: string; title: string; timelineItemId: string; startFrame: number; endFrame: number; sourceStartFrame: number; sourceEndFrame: number; status: string }>;
  effectCues: Array<{ id: string; type: string; startFrame: number; endFrame: number; status: string }>;
  actorPerformances: Array<{ id: string; timelineItemId: string; status: string; role: "actor" | "mask" }>;
  evidenceCaptures: Array<{ id: string; sourceTitle: string; role: "source" | "snapshot" }>;
}

export interface SourceReviewResponse {
  projectId: string;
  assetId: string;
  /** 审阅读取的当前 Revision；生成缓存不会让它递增。 */
  revision: number;
  mode: SourceReviewMode;
  asset: Asset;
  /** 原素材本身的可播放路径，供 Web 原素材播放器使用。 */
  sourceMedia: SourceReviewMediaFile;
  sourceRange?: SourceReviewRange;
  contactSheet: { frames: SourceReviewFrame[]; density: "low" | "medium" | "high" };
  /** range / dense 的连续声画短代理；音频素材则为连续音频代理。 */
  proxy?: SourceReviewMediaFile & { kind: "video" | "audio"; sourceRange: SourceReviewRange };
  audio: {
    hasAudio: boolean;
    waveform?: SourceReviewMediaFile;
    silenceRanges: Array<{ startFrame: number; endFrame: number }>;
    /** 仅是当前短范围的 dBFS 技术读数，不是母带响度或审美判断。 */
    meanVolumeDb?: number;
    maxVolumeDb?: number;
    /** 仅由静音结束推得的明显起声点，不能替代音乐节拍或语义 Onset。 */
    onsetFrames: number[];
    limitations: string[];
  };
  transcript?: {
    id: string;
    source: "funasr" | "manual";
    text: string;
    sentenceCandidates: Array<{ id: string; order: number; text: string }>;
    /** 当前 Transcript/Candidate 没有词级或句级源时间，因此不得伪装为当前范围的精确转写。 */
    timingPrecision: "unavailable";
  };
  shots: { overlapping: SourceReviewShot[]; current?: SourceReviewShot; previous?: SourceReviewShot; next?: SourceReviewShot };
  usage: SourceReviewUsage;
  /** overview 给出后续可进一步请求的候选窗口；不表示系统已理解其中事件。 */
  requestableRanges: Array<SourceReviewRange & { reason: string }>;
  /** 明确返回证据不能证明什么，避免低密度抽帧被当成完整素材理解。 */
  evidenceBoundaries: string[];
}

const MAX_OVERVIEW_FRAMES = 25;
const MAX_RANGE_FRAMES = 24;
const MAX_DENSE_FRAMES = 48;
const MAX_RANGE_SECONDS = 60;
const MAX_DENSE_SECONDS = 12;
const CACHE_DIRECTORY = ["cache", "source-review"] as const;
const inFlightCacheWrites = new Map<string, Promise<void>>();

function sourcePath(snapshot: ProjectSnapshot, asset: Asset): string {
  const projectRoot = resolve(snapshot.project.rootPath);
  const target = isAbsolute(asset.managedPath)
    ? resolve(asset.managedPath)
    : resolve(projectRoot, asset.managedPath);
  // Source Review 只能读取项目已受管文件；绝不把快照里意外出现的外部绝对路径暴露为 /media URL。
  assertPathWithin(projectRoot, target);
  return target;
}

function assertPathWithin(root: string, candidate: string): void {
  const relativePath = relative(root, candidate);
  if (relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\") || isAbsolute(relativePath)) {
    throw new DomainError("素材审阅路径超出项目目录", "UNSAFE_SOURCE_REVIEW_PATH");
  }
}

function toRelativePath(snapshot: ProjectSnapshot, path: string): string {
  const projectRoot = resolve(snapshot.project.rootPath);
  const resolved = resolve(path);
  assertPathWithin(projectRoot, resolved);
  return relative(projectRoot, resolved).replace(/\\/gu, "/");
}

function mediaPath(projectId: string, relativePath: string): string {
  const encoded = relativePath.replace(/\\/gu, "/").split("/").map(encodeURIComponent).join("/");
  return `/media/${encodeURIComponent(projectId)}/${encoded}`;
}

function mediaFile(snapshot: ProjectSnapshot, relativePath: string): SourceReviewMediaFile {
  const normalized = relativePath.replace(/\\/gu, "/");
  return { relativePath: normalized, mediaPath: mediaPath(snapshot.project.id, normalized) };
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function hashFile(path: string): Promise<string> {
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk: string | Buffer) => hash.update(chunk));
    stream.on("error", rejectHash);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

async function isNonEmptyFile(path: string): Promise<boolean> {
  const result = await stat(path).catch(() => undefined);
  return Boolean(result?.isFile() && result.size > 0);
}

/**
 * 同一素材范围被 Web 和 MCP 同时请求时只生成一次；临时文件完成后才原子换名，
 * 防止任一调用读到另一调用尚未写完的半张联系表或半段代理。
 */
async function ensureCachedFile(path: string, create: (temporaryPath: string) => Promise<void>): Promise<void> {
  if (await isNonEmptyFile(path)) return;
  const existing = inFlightCacheWrites.get(path);
  if (existing) return existing;
  const task = (async () => {
    if (await isNonEmptyFile(path)) return;
    await mkdir(resolve(path, ".."), { recursive: true });
    const extension = extname(path);
    const temporaryPath = `${path.slice(0, Math.max(0, path.length - extension.length))}.partial-${process.pid}-${Math.random().toString(36).slice(2)}${extension}`;
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    try {
      await create(temporaryPath);
      if (!await isNonEmptyFile(temporaryPath)) {
        throw new DomainError("素材审阅派生文件为空", "SOURCE_REVIEW_CACHE_EMPTY");
      }
      await rm(path, { force: true }).catch(() => undefined);
      await rename(temporaryPath, path);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  })();
  inFlightCacheWrites.set(path, task);
  try {
    await task;
  } finally {
    inFlightCacheWrites.delete(path);
  }
}

function durationFrames(snapshot: ProjectSnapshot, asset: Asset): number | undefined {
  const durationMs = asset.metadata?.durationMs;
  if (!Number.isFinite(durationMs) || !durationMs || durationMs <= 0) return undefined;
  return Math.max(1, Math.ceil(durationMs / 1_000 * snapshot.timeline.fps));
}

/**
 * derived 既可能是静态截图，也可能是生成后落盘的视频或音频。不能只凭 Asset.kind
 * 决定审阅方式；有视觉流和可用时长的 derived 才能进入连续视频审阅。
 */
function isReviewableVideo(asset: Asset): boolean {
  const durationMs = asset.metadata?.durationMs ?? 0;
  if (durationMs <= 0) return false;
  if (asset.kind === "video" || asset.kind === "actor_video") return true;
  return asset.kind === "derived" && Boolean(asset.metadata?.videoCodec);
}

/** derived 没有连续视觉流但有音轨时，按音频素材生成连续代理与波形。 */
function isReviewableAudio(asset: Asset): boolean {
  if (!asset.metadata?.hasAudio) return false;
  return asset.kind === "audio" || asset.kind === "speech" || (asset.kind === "derived" && !isReviewableVideo(asset));
}

function rangeFromFrames(snapshot: ProjectSnapshot, startFrame: number, endFrame: number): SourceReviewRange {
  const fps = snapshot.timeline.fps;
  return {
    startFrame,
    endFrame,
    startMs: Math.round(startFrame / fps * 1_000),
    endMs: Math.round(endFrame / fps * 1_000),
    fps
  };
}

function formatTimecode(milliseconds: number): string {
  const ms = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor(ms % 3_600_000 / 60_000);
  const seconds = Math.floor(ms % 60_000 / 1_000);
  const remainder = ms % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(remainder).padStart(3, "0")}`;
}

function sampleFrames(startFrame: number, endFrame: number, count: number): number[] {
  const available = Math.max(0, endFrame - startFrame);
  if (!available || !count) return [];
  const actualCount = Math.min(available, count);
  if (actualCount === 1) return [startFrame];
  return Array.from({ length: actualCount }, (_, index) => (
    startFrame + Math.round(index * (available - 1) / (actualCount - 1))
  ));
}

function sourceReviewRange(snapshot: ProjectSnapshot, asset: Asset, input: InspectAssetInput): SourceReviewRange | undefined {
  const totalFrames = durationFrames(snapshot, asset);
  if (!totalFrames) return undefined;
  if (input.mode === "overview") return rangeFromFrames(snapshot, 0, totalFrames);
  if (!Number.isInteger(input.sourceStartFrame) || !Number.isInteger(input.sourceEndFrame)) {
    throw new DomainError("range 和 dense 审阅必须提供整数 sourceStartFrame 与 sourceEndFrame", "SOURCE_REVIEW_RANGE_REQUIRED");
  }
  const startFrame = input.sourceStartFrame!;
  const endFrame = input.sourceEndFrame!;
  if (startFrame < 0 || endFrame <= startFrame || endFrame > totalFrames) {
    throw new DomainError("请求的源范围不在素材真实时长内", "SOURCE_REVIEW_RANGE_INVALID");
  }
  const maximumSeconds = input.mode === "dense" ? MAX_DENSE_SECONDS : MAX_RANGE_SECONDS;
  if ((endFrame - startFrame) / snapshot.timeline.fps > maximumSeconds) {
    const label = input.mode === "dense" ? "dense" : "range";
    throw new DomainError(`${label} 审阅范围过长；请只展开会改变剪辑判断的最小窗口`, "SOURCE_REVIEW_RANGE_TOO_LONG");
  }
  return rangeFromFrames(snapshot, startFrame, endFrame);
}

function frameCountFor(input: InspectAssetInput, range: SourceReviewRange): number {
  const limit = input.mode === "overview" ? MAX_OVERVIEW_FRAMES : input.mode === "range" ? MAX_RANGE_FRAMES : MAX_DENSE_FRAMES;
  const defaultCount = input.mode === "overview"
    ? 20
    : input.mode === "range"
      ? 12
      : Math.min(MAX_DENSE_FRAMES, Math.max(8, Math.ceil((range.endFrame - range.startFrame) / range.fps * 3)));
  const requested = input.contactSheetFrames ?? defaultCount;
  if (!Number.isInteger(requested) || requested < 1 || requested > limit) {
    throw new DomainError(`${input.mode} 联系表帧数必须是 1 到 ${limit} 的整数`, "SOURCE_REVIEW_CONTACT_SHEET_INVALID");
  }
  return requested;
}

function cacheKey(input: {
  contentHash: string;
  mode: SourceReviewMode;
  range?: SourceReviewRange;
  contactSheetFrames: number;
}): string {
  return hashValue({
    contentHash: input.contentHash,
    mode: input.mode,
    range: input.range ? [input.range.startFrame, input.range.endFrame, input.range.fps] : undefined,
    contactSheetFrames: input.contactSheetFrames,
    // 这几个派生参数也属于缓存合同，修改后不会错误复用旧代理。
    frameWidth: 480,
    proxyWidth: 960,
    proxyCodec: "h264-aac",
    waveform: "960x160",
    audioAnalysis: "silencedetect:-45dB:0.25,volumedetect"
  });
}

function outputPath(snapshot: ProjectSnapshot, key: string, ...parts: string[]): string {
  return join(snapshot.project.rootPath, ...CACHE_DIRECTORY, key, ...parts);
}

async function createFrame(input: {
  sourcePath: string;
  temporaryPath: string;
  sourceMs: number;
}): Promise<void> {
  await runProcess("ffmpeg", [
    "-hide_banner", "-nostdin", "-v", "error",
    "-ss", (input.sourceMs / 1_000).toFixed(6),
    "-i", input.sourcePath,
    "-frames:v", "1",
    "-vf", "scale=480:-2",
    "-q:v", "3",
    "-y", input.temporaryPath
  ], 120_000);
}

async function createContactSheet(input: {
  snapshot: ProjectSnapshot;
  sourcePath: string;
  range: SourceReviewRange;
  frames: number[];
  key: string;
}): Promise<SourceReviewFrame[]> {
  const results: SourceReviewFrame[] = [];
  for (const [index, sourceFrame] of input.frames.entries()) {
    const sourceMs = Math.round(sourceFrame / input.range.fps * 1_000);
    const path = outputPath(input.snapshot, input.key, "frames", `${String(index).padStart(2, "0")}-${sourceFrame}.jpg`);
    await ensureCachedFile(path, (temporaryPath) => createFrame({ sourcePath: input.sourcePath, temporaryPath, sourceMs }));
    const relativePath = toRelativePath(input.snapshot, path);
    results.push({
      ...mediaFile(input.snapshot, relativePath),
      sourceFrame,
      sourceMs,
      timecode: formatTimecode(sourceMs)
    });
  }
  return results;
}

async function createRangeProxy(input: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  sourcePath: string;
  range: SourceReviewRange;
  key: string;
}): Promise<SourceReviewResponse["proxy"]> {
  // SpeechAsset 与普通音频同样需要复听句首、句尾和停顿，不能只因来源不同而缺少连续代理。
  const isVideo = isReviewableVideo(input.asset);
  if (!isVideo && !isReviewableAudio(input.asset)) return undefined;
  const extension = isVideo ? ".mp4" : ".m4a";
  const path = outputPath(input.snapshot, input.key, `source-range${extension}`);
  const durationSeconds = (input.range.endFrame - input.range.startFrame) / input.range.fps;
  await ensureCachedFile(path, async (temporaryPath) => {
    const common = [
      "-hide_banner", "-nostdin", "-v", "error",
      "-ss", (input.range.startFrame / input.range.fps).toFixed(6),
      "-t", durationSeconds.toFixed(6),
      "-i", input.sourcePath
    ];
    if (!isVideo) {
      await runProcess("ffmpeg", [
        ...common,
        "-map", "0:a:0",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "-y", temporaryPath
      ], Math.max(120_000, Math.ceil(durationSeconds * 8_000)));
      return;
    }
    await runProcess("ffmpeg", [
      ...common,
      "-map", "0:v:0?",
      "-map", "0:a:0?",
      "-vf", "scale=960:-2:force_original_aspect_ratio=decrease",
      // H.264/AAC 是浏览器连续声画审阅的公共可播交集，且显式 CFR 与项目源帧坐标一致。
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-r", String(input.range.fps),
      "-vsync", "cfr",
      "-movflags", "+faststart",
      "-y", temporaryPath
    ], Math.max(120_000, Math.ceil(durationSeconds * 8_000)));
    const metadata = await probeMedia(temporaryPath);
    if (metadata.videoCodec?.toLowerCase() !== "h264" || !Number.isFinite(metadata.fps) || Math.abs(metadata.fps! - input.range.fps) > 0.001) {
      throw new DomainError("源素材审阅代理不是项目 FPS 一致的 H.264 视频", "SOURCE_REVIEW_PROXY_INVALID");
    }
  });
  const relativePath = toRelativePath(input.snapshot, path);
  return {
    ...mediaFile(input.snapshot, relativePath),
    kind: isVideo ? "video" : "audio",
    sourceRange: input.range
  };
}

function parseSilenceRanges(output: string, range: SourceReviewRange): { silenceRanges: Array<{ startFrame: number; endFrame: number }>; onsetFrames: number[] } {
  const starts = [...output.matchAll(/silence_start:\s*(-?\d+(?:\.\d+)?)/gu)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const ends = [...output.matchAll(/silence_end:\s*(-?\d+(?:\.\d+)?)/gu)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const silenceRanges = starts.map((start, index) => {
    const end = Math.max(start, ends[index] ?? (range.endFrame - range.startFrame) / range.fps);
    return {
      startFrame: Math.max(range.startFrame, Math.min(range.endFrame, range.startFrame + Math.round(start * range.fps))),
      endFrame: Math.max(range.startFrame, Math.min(range.endFrame, range.startFrame + Math.round(end * range.fps)))
    };
  }).filter((entry) => entry.endFrame > entry.startFrame);
  const onsetFrames = ends
    .map((seconds) => range.startFrame + Math.round(seconds * range.fps))
    .filter((frame) => frame >= range.startFrame && frame < range.endFrame);
  return { silenceRanges, onsetFrames: [...new Set(onsetFrames)] };
}

function parseVolume(output: string): { meanVolumeDb?: number; maxVolumeDb?: number } {
  const mean = output.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/iu);
  const max = output.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/iu);
  return {
    meanVolumeDb: mean ? Number(mean[1]) : undefined,
    maxVolumeDb: max ? Number(max[1]) : undefined
  };
}

async function inspectAudio(input: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  sourcePath: string;
  range?: SourceReviewRange;
  key: string;
}): Promise<SourceReviewResponse["audio"]> {
  if (!input.asset.metadata?.hasAudio) {
    return {
      hasAudio: false,
      silenceRanges: [],
      onsetFrames: [],
      limitations: ["素材分析没有检测到音轨，因此没有波形、静音或响度证据。"]
    };
  }
  if (!input.range || input.asset.kind === "document" || input.asset.kind === "image") {
    return {
      hasAudio: true,
      silenceRanges: [],
      onsetFrames: [],
      limitations: ["overview 仅确认音轨事实；请对短范围请求 range 或 dense 以生成波形和声音技术证据。"]
    };
  }
  const durationSeconds = (input.range.endFrame - input.range.startFrame) / input.range.fps;
  const seek = (input.range.startFrame / input.range.fps).toFixed(6);
  const waveformPath = outputPath(input.snapshot, input.key, "audio-waveform.png");
  await ensureCachedFile(waveformPath, async (temporaryPath) => {
    await runProcess("ffmpeg", [
      "-hide_banner", "-nostdin", "-v", "error",
      "-ss", seek,
      "-t", durationSeconds.toFixed(6),
      "-i", input.sourcePath,
      "-filter_complex", "[0:a:0]aformat=channel_layouts=mono,showwavespic=s=960x160:colors=0x71d9ff[wave]",
      "-map", "[wave]",
      "-c:v", "png",
      "-frames:v", "1",
      "-y", temporaryPath
    ], Math.max(120_000, Math.ceil(durationSeconds * 8_000)));
  });
  const [silenceOutput, volumeOutput] = await Promise.all([
    runProcess("ffmpeg", [
      "-hide_banner", "-nostdin", "-ss", seek, "-t", durationSeconds.toFixed(6), "-i", input.sourcePath,
      // 强制从请求范围的 0 重新计时，随后才能安全地加回 sourceStartFrame。
      "-vn", "-af", "asetpts=PTS-STARTPTS,silencedetect=n=-45dB:d=0.25", "-f", "null", "-"
    ], Math.max(120_000, Math.ceil(durationSeconds * 8_000))),
    runProcess("ffmpeg", [
      "-hide_banner", "-nostdin", "-ss", seek, "-t", durationSeconds.toFixed(6), "-i", input.sourcePath,
      "-vn", "-af", "volumedetect", "-f", "null", "-"
    ], Math.max(120_000, Math.ceil(durationSeconds * 8_000)))
  ]);
  const silence = parseSilenceRanges(silenceOutput, input.range);
  const volume = parseVolume(volumeOutput);
  const relativePath = toRelativePath(input.snapshot, waveformPath);
  return {
    hasAudio: true,
    waveform: mediaFile(input.snapshot, relativePath),
    silenceRanges: silence.silenceRanges,
    ...volume,
    onsetFrames: silence.onsetFrames,
    limitations: [
      "波形、静音和 dBFS 只覆盖当前请求的短范围；它们是辅助定位证据，不判断话语含义、表演质量或音乐节拍。",
      "明显起声点仅由静音结束推得；没有可用的逐词时间或通用音频事件识别。"
    ]
  };
}

function asSourceReviewShot(analysis: VlogShotAnalysis): SourceReviewShot {
  return {
    id: analysis.id,
    sourceStartFrame: analysis.sourceStartFrame,
    sourceEndFrame: analysis.sourceEndFrame,
    source: analysis.source,
    sceneChangeScore: analysis.sceneChangeScore,
    technicalScore: analysis.technicalScore,
    hasAudio: analysis.hasAudio,
    status: analysis.status,
    evidenceNote: analysis.evidenceNote
  };
}

function reviewShots(snapshot: ProjectSnapshot, assetId: string, range?: SourceReviewRange): SourceReviewResponse["shots"] {
  const all = snapshot.vlogShotAnalyses
    .filter((analysis) => analysis.assetId === assetId)
    .sort((left, right) => left.sourceStartFrame - right.sourceStartFrame);
  if (!range) return { overlapping: all.map(asSourceReviewShot) };
  const overlapping = all.filter((analysis) => analysis.sourceEndFrame > range.startFrame && analysis.sourceStartFrame < range.endFrame);
  const previous = all.filter((analysis) => analysis.sourceEndFrame <= range.startFrame).at(-1);
  const next = all.find((analysis) => analysis.sourceStartFrame >= range.endFrame);
  return {
    overlapping: overlapping.map(asSourceReviewShot),
    current: overlapping[0] ? asSourceReviewShot(overlapping[0]) : undefined,
    previous: previous ? asSourceReviewShot(previous) : undefined,
    next: next ? asSourceReviewShot(next) : undefined
  };
}

/** 源范围采用半开区间；range / dense 只返回能证明与请求范围相交的使用位置。 */
function overlapsSourceRange(startFrame: number, endFrame: number, range: SourceReviewRange | undefined): boolean {
  return !range || (endFrame > range.startFrame && startFrame < range.endFrame);
}

function sourceUsage(snapshot: ProjectSnapshot, assetId: string, range?: SourceReviewRange): SourceReviewUsage {
  const reachability = resolveCompositionReachability(snapshot);
  const trackNames = new Map(snapshot.timeline.tracks.map((track) => [track.id, track.name]));
  const matchingTimelineItems = snapshot.timeline.items
    // Source Review 的“当前使用”必须与 Renderer / Preflight 的实际 Composition 一致。
    // 隐藏视频轨、静音音频轨、disabled Item 与 stale Cutaway 仅保留在 Revision 审计中，
    // 不能误导导演为仍会进入当前成片。
    .filter((item) => item.assetId === assetId
      && (reachability.videoItemIds.has(item.id) || reachability.audioItemIds.has(item.id))
      && overlapsSourceRange(item.sourceStartFrame, item.sourceEndFrame, range));
  const matchingTimelineItemIds = new Set(matchingTimelineItems.map((item) => item.id));
  const matchingSceneIds = new Set(matchingTimelineItems.map((item) => item.sceneId).filter((sceneId): sceneId is string => Boolean(sceneId)));
  const activeSceneIds = new Set(matchingSceneIds);
  if (!range) {
    for (const cue of snapshot.effectCues) {
      if (reachability.effectCueIds.has(cue.id) && cue.assetBindings.some((binding) => binding.assetId === assetId)) activeSceneIds.add(cue.sceneId);
    }
    for (const program of snapshot.explainerPrograms ?? []) {
      if (reachability.explainerProgramIds.has(program.id) && program.assetIds.includes(assetId)) activeSceneIds.add(program.sceneId);
    }
  }
  const timelineItems = matchingTimelineItems
    .map((item: TimelineItem) => ({
      id: item.id,
      trackId: item.trackId,
      trackName: trackNames.get(item.trackId),
      sceneId: item.sceneId,
      startFrame: item.startFrame,
      endFrame: item.endFrame,
      sourceStartFrame: item.sourceStartFrame,
      sourceEndFrame: item.sourceEndFrame,
      disabled: item.disabled
    }));
  const scenes = snapshot.scenes
    // Scene.assetIds 是编辑关系而不是可达性。范围审阅只返回可从相交 Item 证明的场景；
    // overview 则返回当前 Composition 内真正消费该素材的 Scene。
    .filter((scene) => (range ? matchingSceneIds : activeSceneIds).has(scene.id))
    .map((scene) => ({ id: scene.id, type: scene.type, title: scene.title, startFrame: scene.startFrame, endFrame: scene.endFrame, status: scene.status }));
  const cutaways = snapshot.cutaways
    .filter((cutaway) => cutaway.assetId === assetId
      && reachability.videoItemIds.has(cutaway.timelineItemId)
      && overlapsSourceRange(cutaway.sourceStartFrame, cutaway.sourceEndFrame, range))
    .map((cutaway) => ({
      id: cutaway.id,
      title: cutaway.purpose,
      timelineItemId: cutaway.timelineItemId,
      startFrame: cutaway.startFrame,
      endFrame: cutaway.endFrame,
      sourceStartFrame: cutaway.sourceStartFrame,
      sourceEndFrame: cutaway.sourceEndFrame,
      status: cutaway.status
    }));
  const effectCues = snapshot.effectCues
    // EffectCue 只有 AssetBinding；范围审阅只能通过同场景的相交片段证明它与当前范围有关。
    .filter((cue) => reachability.effectCueIds.has(cue.id)
      && cue.assetBindings.some((binding) => binding.assetId === assetId)
      && (!range || matchingSceneIds.has(cue.sceneId)))
    .map((cue) => ({ id: cue.id, type: cue.type, startFrame: cue.startFrame, endFrame: cue.endFrame, status: cue.status }));
  const actorPerformances = snapshot.actorPerformances.flatMap((performance) => {
    const roles: Array<{ id: string; timelineItemId: string; status: string; role: "actor" | "mask" }> = [];
    const item = snapshot.timeline.items.find((candidate) => candidate.id === performance.timelineItemId);
    if (performance.status !== "ready" || !item || !reachability.videoItemIds.has(item.id)) return roles;
    if (range && !matchingTimelineItemIds.has(item.id)) return roles;
    if (item?.assetId === assetId) roles.push({ id: performance.id, timelineItemId: performance.timelineItemId, status: performance.status, role: "actor" });
    if (performance.maskAssetId === assetId) roles.push({ id: performance.id, timelineItemId: performance.timelineItemId, status: performance.status, role: "mask" });
    return roles;
  });
  // EvidenceCapture 当前没有源范围字段；范围审阅不把“同一文件的证据”伪装成“当前窗口被使用”。
  const evidenceCaptures = (range ? [] : snapshot.evidenceCaptures).flatMap((capture) => {
    const roles: Array<{ id: string; sourceTitle: string; role: "source" | "snapshot" }> = [];
    if (capture.sourceAssetId === assetId) roles.push({ id: capture.id, sourceTitle: capture.sourceTitle, role: "source" });
    if (capture.snapshotAssetId === assetId) roles.push({ id: capture.id, sourceTitle: capture.sourceTitle, role: "snapshot" });
    return roles;
  });
  return { timelineItems, scenes, cutaways, effectCues, actorPerformances, evidenceCaptures };
}

function transcriptFor(snapshot: ProjectSnapshot, assetId: string): SourceReviewResponse["transcript"] {
  const transcript = snapshot.transcripts.find((candidate) => candidate.assetId === assetId);
  if (!transcript) return undefined;
  return {
    id: transcript.id,
    source: transcript.source,
    text: transcript.text,
    sentenceCandidates: snapshot.transcriptSentenceCandidates
      .filter((candidate) => candidate.transcriptId === transcript.id)
      .sort((left, right) => left.order - right.order)
      .map((candidate) => ({ id: candidate.id, order: candidate.order, text: candidate.text })),
    timingPrecision: "unavailable"
  };
}

function candidateRanges(snapshot: ProjectSnapshot, asset: Asset): Array<SourceReviewRange & { reason: string }> {
  const total = durationFrames(snapshot, asset);
  if (!total) return [];
  const shots = snapshot.vlogShotAnalyses
    .filter((analysis) => analysis.assetId === asset.id && analysis.status === "ready")
    .sort((left, right) => left.sourceStartFrame - right.sourceStartFrame)
    .slice(0, 40);
  if (shots.length) {
    return shots.map((shot) => ({
      ...rangeFromFrames(snapshot, shot.sourceStartFrame, shot.sourceEndFrame),
      reason: "已存在的技术 Shot Boundary；仍需播放与专业判断确定动作、事件或表演价值。"
    }));
  }
  const chunkFrames = Math.max(1, Math.round(Math.min(MAX_RANGE_SECONDS, 15) * snapshot.timeline.fps));
  const chunks: Array<SourceReviewRange & { reason: string }> = [];
  for (let start = 0; start < total && chunks.length < 12; start += chunkFrames) {
    chunks.push({
      ...rangeFromFrames(snapshot, start, Math.min(total, start + chunkFrames)),
      reason: "按时间均匀分段，便于继续请求短范围复核；不代表技术镜头或叙事事件边界。"
    });
  }
  return chunks;
}

function initialEvidenceBoundaries(asset: Asset, mode: SourceReviewMode, transcript: SourceReviewResponse["transcript"]): string[] {
  const boundaries = [
    mode === "overview"
      ? "overview 的低密度抽帧只能证明被采样时刻的画面；动作、微表情、口型和精确切口必须通过 range 或 dense 连续复核。"
      : mode === "dense"
        ? "dense 只展开当前最小短窗口；它用于改变具体剪辑判断，不能替代完整素材播放。"
        : "range 代理保留当前范围的连续声画；是否值得进入成片仍由主工作流结合上下文判断。"
  ];
  if (!asset.metadata?.hasAudio) boundaries.push("素材没有音轨，不能从该素材推断对白、停顿或现场声。");
  if (!transcript) boundaries.push("当前素材没有转写；不能从文件名、缩略图或技术 Shot Boundary 反推语言内容。");
  else boundaries.push("当前转写没有源时间或说话人字段；返回全文仅用于定位，不能当作当前范围的精确逐句证据。");
  return boundaries;
}

/**
 * 统一的只读原素材审阅入口。服务只写可重建缓存，Application 与 Revision 均保持不变，
 * 所以 MCP、HTTP 和 Web 可以使用同一份证据，而不会绕过现有编辑命令。
 */
export async function inspectAsset(application: EditingApplication, input: InspectAssetInput): Promise<SourceReviewResponse> {
  const state = application.readProject(input.projectId);
  const snapshot = state.snapshot;
  const asset = assetById(snapshot, input.assetId);
  const managedSourcePath = sourcePath(snapshot, asset);
  const sourceMedia = mediaFile(snapshot, toRelativePath(snapshot, managedSourcePath));
  const transcript = transcriptFor(snapshot, asset.id);
  // 素材尚未 ready 时没有可信源范围，只返回整个 Asset 已登记的使用事实。
  const assetUsage = sourceUsage(snapshot, asset.id);
  const initialBoundaries = initialEvidenceBoundaries(asset, input.mode, transcript);

  // 尚未完成媒体分析时只交付已持久化的状态事实，不自行把未经 Worker 验证的文件当成可审阅媒体。
  if (asset.status !== "ready" || !asset.metadata) {
    return {
      projectId: snapshot.project.id,
      assetId: asset.id,
      revision: state.revision.number,
      mode: input.mode,
      asset,
      sourceMedia,
      contactSheet: { frames: [], density: input.mode === "overview" ? "low" : input.mode === "range" ? "medium" : "high" },
      audio: {
        hasAudio: Boolean(asset.metadata?.hasAudio),
        silenceRanges: [],
        onsetFrames: [],
        limitations: ["素材尚未完成媒体分析，当前只能读取登记状态，不能生成可依赖的原素材证据。"]
      },
      transcript,
      shots: reviewShots(snapshot, asset.id),
      usage: assetUsage,
      requestableRanges: [],
      evidenceBoundaries: [...initialBoundaries, `素材当前状态为 ${asset.status}；请先等待或修复媒体分析。`]
    };
  }

  const range = sourceReviewRange(snapshot, asset, input);
  // PDF、静态图片或缺少时长的素材仍可以经 overview 显示既有资产事实，但不能假装存在声画源范围。
  if (!range) {
    if (input.mode !== "overview") {
      throw new DomainError("该素材没有可播放的源时间范围，不能请求 range 或 dense 审阅", "SOURCE_REVIEW_RANGE_UNAVAILABLE");
    }
    return {
      projectId: snapshot.project.id,
      assetId: asset.id,
      revision: state.revision.number,
      mode: input.mode,
      asset,
      sourceMedia,
      contactSheet: { frames: [], density: "low" },
      audio: await inspectAudio({ snapshot, asset, sourcePath: managedSourcePath, key: "metadata-only" }),
      transcript,
      shots: reviewShots(snapshot, asset.id),
      usage: assetUsage,
      requestableRanges: [],
      evidenceBoundaries: [...initialBoundaries, "素材没有可用时长；此入口不伪造静态文件或文档的连续声画审阅。"]
    };
  }

  const path = managedSourcePath;
  if (!existsSync(path)) throw new DomainError("受管原素材文件不存在，无法生成审阅证据", "SOURCE_REVIEW_SOURCE_MISSING");
  const contentHash = asset.sourceHash ?? await hashFile(path);
  const contactSheetFrames = frameCountFor(input, range);
  const key = cacheKey({ contentHash, mode: input.mode, range, contactSheetFrames });
  const isVideo = isReviewableVideo(asset);
  const frames = isVideo ? await createContactSheet({
    snapshot,
    sourcePath: path,
    range,
    frames: sampleFrames(range.startFrame, range.endFrame, contactSheetFrames),
    key
  }) : [];
  const proxy = input.mode === "overview" ? undefined : await createRangeProxy({ snapshot, asset, sourcePath: path, range, key });
  const audio = await inspectAudio({ snapshot, asset, sourcePath: path, range: input.mode === "overview" ? undefined : range, key });
  const usage = sourceUsage(snapshot, asset.id, input.mode === "overview" ? undefined : range);
  return {
    projectId: snapshot.project.id,
    assetId: asset.id,
    revision: state.revision.number,
    mode: input.mode,
    asset,
    sourceMedia,
    sourceRange: range,
    contactSheet: { frames, density: input.mode === "overview" ? "low" : input.mode === "range" ? "medium" : "high" },
    proxy,
    audio,
    transcript,
    shots: reviewShots(snapshot, asset.id, input.mode === "overview" ? undefined : range),
    usage,
    requestableRanges: input.mode === "overview" ? candidateRanges(snapshot, asset) : [],
    evidenceBoundaries: input.mode === "overview"
      ? initialBoundaries
      : [...initialBoundaries, "当前使用位置仅列出与请求源范围可证明相交的 Timeline、Cutaway 和关联对象；未带源范围的独立证据对象不会被误判为当前范围使用。"]
  };
}
