import { YoutubeProvider } from "./youtube.js";
import { AssetProviderError } from "./errors.js";
import { assetFetch, assetDownloadFetch } from "./http.js";
export { AssetProviderError } from "./errors.js";
export type { AssetFailureDetails } from "./errors.js";
import { createWriteStream } from "node:fs";
import { copyFile, mkdir, open, rm, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AssetCandidate, AssetRequest, MediaMetadata } from "@videocut/contracts";
import { readRuntimeConfig } from "@videocut/project-overview";
import { WikimediaCommonsProvider } from "./wikimedia-commons.js";
import { MixkitSoundProvider, MixkitMusicProvider } from "./mixkit.js";
import { FreesoundProvider } from "./freesound.js";
import { MIXKIT_SOUND_CATEGORIES, MIXKIT_MUSIC_CATEGORIES } from "./sound-catalog.js";

export function soundSourceCapabilities() {
  const config = readRuntimeConfig().providers;
  return [
    { id: "mixkit", name: "Mixkit 音效", enabled: true, search: "public_category", preview: true, original: true, categories: MIXKIT_SOUND_CATEGORIES, licenseUrl: "https://mixkit.co/license/#sfxFree", limits: "一次读取一个分类的至多30条；按需获取少量文件" },
    { id: "mixkit_music", name: "Mixkit 音乐", enabled: true, search: "public_category", preview: true, original: true, categories: MIXKIT_MUSIC_CATEGORIES, licenseUrl: "https://mixkit.co/license/#musicFree", limits: "单独音乐许可，面向符合许可的网络视频用途" },
    { id: "freesound", name: "Freesound", enabled: Boolean(config.freesoundApiKey && config.freesoundCommercialApiApproved), search: "official_api", preview: Boolean(config.freesoundApiKey && config.freesoundCommercialApiApproved), original: Boolean(config.freesoundApiKey && config.freesoundOAuthToken && config.freesoundCommercialApiApproved), categories: [], licenseUrl: "https://freesound.org/help/faq/#licenses", limits: !config.freesoundApiKey ? "缺少 API 凭据" : !config.freesoundCommercialApiApproved ? "尚未确认商业 API 使用条件" : !config.freesoundOAuthToken ? "缺少原文件下载 OAuth" : "逐条核对 CC0 / CC BY；不采用 NC" }
  ];
}

export interface ProviderSearchInput { request: AssetRequest; query: string; mediaType?: AssetCandidate["kind"]; }
export interface ProviderSearchWarning { code: string; message: string; source?: string; stage?: string; retryAfterMs?: number; }
export interface ProviderSearchResult { candidates: ProviderSearchCandidate[]; complete: boolean; warnings: ProviderSearchWarning[]; }

/** Provider 到 Application 的最小归一化边界；下载 URL 和 API Key 不写入 Project Revision。 */
export interface ProviderSearchCandidate {
  originalAssetId: string;
  name: string;
  /** Provider 必须说明候选的真实视觉媒介类型；省略仅兼容阶段 1 的旧视频 Provider。 */
  kind?: AssetCandidate["kind"];
  sourceUrl: string;
  previewUrl?: string;
  /** HTTP 下载响应和候选记录都要回到这个 MIME 事实，不能由文件扩展名猜成视频。 */
  mimeType?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  creator?: string;
  license?: string;
  licenseUrl?: string;
  attributionText?: string;
  rightsStatus: AssetCandidate["rightsStatus"];
  tags?: string[];
}

export interface ProviderDownload {
  filePath: string;
  fileName: string;
  contentType?: string;
}

export interface AssetProvider {
  readonly name: string;
  readonly previewHosts?: string[];
  search(input: ProviderSearchInput): Promise<ProviderSearchCandidate[]>;
  searchDetailed?(input: ProviderSearchInput): Promise<ProviderSearchResult>;
  download(input: { candidate: AssetCandidate; temporaryDirectory: string }): Promise<ProviderDownload>;
}

// 默认名不带视频扩展名，避免缺失文件名的图片被路径后缀误导成 MP4。
const safeFileName = (value: string) => basename(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "asset";
const positiveNumber = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
export type ProviderMediaKind = AssetCandidate["kind"];

const MIME_BY_EXTENSION: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".aiff": "audio/aiff",
  ".aif": "audio/aiff",
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg"
};

function normalizedContentType(value: string | undefined): string | undefined {
  const normalized = value?.split(";", 1)[0]?.trim().toLocaleLowerCase();
  return normalized || undefined;
}

/** MIME 只确认媒介类型，实际流、时长仍须经 ffprobe 核验。 */
export function providerMediaKindFromMime(value: string | undefined): ProviderMediaKind | undefined {
  const mimeType = normalizedContentType(value);
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  return undefined;
}

function mimeTypeFromFileName(value: string): string | undefined {
  return MIME_BY_EXTENSION[extname(value).toLocaleLowerCase()];
}

/**
 * Provider 响应头是下载时可验证的 MIME 事实。Worker 还必须在 ffprobe 后调用
 * assertProviderMediaAnalysis，二者共同阻断“图片当视频”或下载 HTML 错误页的情况。
 */
export function assertProviderDownloadContentType(input: {
  contentType?: string;
  expectedKind: ProviderMediaKind;
  expectedMimeType?: string;
}): string {
  const actual = normalizedContentType(input.contentType);
  if (!actual) throw new AssetProviderError("下载响应缺少媒体 MIME，不能安全收录素材", "ASSET_DOWNLOAD_MIME_MISSING");
  const actualKind = providerMediaKindFromMime(actual);
  if (!actualKind) throw new AssetProviderError(`下载内容不是图片、视频或音频媒体：${actual}`, "ASSET_DOWNLOAD_MIME_INVALID");
  if (actualKind !== input.expectedKind) {
    throw new AssetProviderError(`下载内容类型与候选不一致：期望 ${input.expectedKind}，实际 ${actualKind}`, "ASSET_DOWNLOAD_KIND_MISMATCH");
  }
  const expectedMimeType = normalizedContentType(input.expectedMimeType);
  if (expectedMimeType && expectedMimeType !== actual) {
    throw new AssetProviderError(`下载内容 MIME 与候选记录不一致：${actual} / ${expectedMimeType}`, "ASSET_DOWNLOAD_MIME_MISMATCH");
  }
  return actual;
}

/**
 * 下载文件进入受管目录前的最小二进制检查。它不把扩展名当作 MIME，也不误伤合法 SVG 的 XML 头。
 * 真正的图像尺寸、视频轨和时长由 Worker 使用 assertProviderMediaAnalysis 在 ffprobe 后确认。
 */
export async function assertDownloadedProviderMedia(input: {
  filePath: string;
  contentType?: string;
  expectedKind: ProviderMediaKind;
  expectedMimeType?: string;
}): Promise<void> {
  assertProviderDownloadContentType(input);
  const fileInfo = await stat(input.filePath);
  if (!fileInfo.isFile() || fileInfo.size <= 0) throw new AssetProviderError("下载素材为空或不是文件", "ASSET_DOWNLOAD_EMPTY");
  const handle = await open(input.filePath, "r");
  try {
    const header = Buffer.alloc(Math.min(512, fileInfo.size));
    await handle.read(header, 0, header.length, 0);
    const leadingText = header.toString("utf8").trimStart().toLocaleLowerCase();
    if (/^(?:<!doctype\s+html|<html(?:\s|>))/u.test(leadingText)) {
      throw new AssetProviderError("下载内容是网页错误页，不是媒体素材", "ASSET_DOWNLOAD_HTML");
    }
  } finally {
    await handle.close();
  }
}

/**
 * MediaMetadata 里的 videoCodec 代表 ffprobe 识别到的视觉流，静态图片也会有该流。
 * 因而图片只要求图像尺寸和可读视觉流，不能强行要求视频时长或把图片登记为 video Asset。
 */
export function assertProviderMediaAnalysis(input: {
  candidate: Pick<AssetCandidate, "kind" | "name">;
  metadata: MediaMetadata;
}): void {
  const { candidate, metadata } = input;
  if (candidate.kind === "audio") {
    if (!metadata.audioCodec || !metadata.hasAudio || metadata.durationMs <= 0) {
      throw new AssetProviderError(`下载音频“${candidate.name}”缺少有效音轨或时长`, "ASSET_DOWNLOAD_AUDIO_STREAM_MISSING");
    }
    if (metadata.videoCodec && metadata.width && metadata.height) {
      throw new AssetProviderError("音频候选不能包含可播放视频流", "ASSET_DOWNLOAD_AUDIO_KIND_MISMATCH");
    }
    return;
  }
  if (!metadata.videoCodec) {
    throw new AssetProviderError(`下载媒体“${candidate.name}”没有可读取的视觉流`, "ASSET_DOWNLOAD_VISUAL_STREAM_MISSING");
  }
  if (candidate.kind === "video" && metadata.durationMs <= 0) {
    throw new AssetProviderError(`下载视频“${candidate.name}”没有有效时长`, "ASSET_DOWNLOAD_VIDEO_DURATION_MISSING");
  }
  if (candidate.kind === "image" && (!metadata.width || !metadata.height)) {
    throw new AssetProviderError(`下载图片“${candidate.name}”缺少可用尺寸`, "ASSET_DOWNLOAD_IMAGE_DIMENSIONS_MISSING");
  }
}

export async function downloadHttpFile(
  url: string,
  temporaryDirectory: string,
  fileName: string,
  expectedKind: ProviderMediaKind,
  expectedMimeType?: string,
  headers: Record<string, string> = {},
  safety?: { allowedHosts: string[] }
): Promise<ProviderDownload> {
  if (safety) {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || !safety.allowedHosts.includes(parsed.host)) {
      throw new AssetProviderError("下载地址不在该 Provider 的公开媒体域名中", "ASSET_DOWNLOAD_HOST_REJECTED");
    }
  }
  // 受控音效下载拒绝隐式重定向，防止公开地址跳到本机或未知站点。
  const response = await assetDownloadFetch(url, { headers, redirect: safety ? "error" : "follow", signal: safety ? AbortSignal.timeout(60_000) : undefined });
  return saveProviderMediaResponse(response, temporaryDirectory, fileName, expectedKind, expectedMimeType);
}

/** 直接响应和受控重定向的最终媒体共用 MIME、体积与解码检查。 */
export async function saveProviderMediaResponse(response: Response, temporaryDirectory: string, fileName: string, expectedKind: ProviderMediaKind, expectedMimeType?: string): Promise<ProviderDownload> {
  if (!response.ok) throw new AssetProviderError(`下载素材失败：HTTP ${response.status}`, "ASSET_DOWNLOAD_HTTP_ERROR");
  const contentType = assertProviderDownloadContentType({
    contentType: response.headers.get("content-type") ?? undefined,
    expectedKind,
    expectedMimeType
  });
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const maxBytes = readRuntimeConfig().downloads.maxAssetBytes;
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new AssetProviderError(`素材文件超过 ${Math.floor(maxBytes / 1024 / 1024)}MB 下载上限`, "ASSET_DOWNLOAD_TOO_LARGE");
  }
  if (!response.body) throw new AssetProviderError("下载响应缺少媒体正文", "ASSET_DOWNLOAD_BODY_MISSING");
  await mkdir(temporaryDirectory, { recursive: true });
  const targetPath = join(temporaryDirectory, safeFileName(fileName));
  let downloadedBytes = 0;
  const byteLimit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      downloadedBytes += chunk.length;
      if (downloadedBytes > maxBytes) {
        callback(new AssetProviderError(`素材文件超过 ${Math.floor(maxBytes / 1024 / 1024)}MB 下载上限`, "ASSET_DOWNLOAD_TOO_LARGE"));
        return;
      }
      callback(null, chunk);
    }
  });
  try {
    await pipeline(Readable.fromWeb(response.body as never), byteLimit, createWriteStream(targetPath));
    await assertDownloadedProviderMedia({ filePath: targetPath, contentType, expectedKind, expectedMimeType });
  } catch (error) {
    await rm(targetPath, { force: true }).catch(() => undefined);
    throw error;
  }
  return { filePath: targetPath, fileName: safeFileName(fileName), contentType };
}

type PexelsVideoFile = {
  id?: number;
  quality?: string;
  file_type?: string;
  width?: number;
  height?: number;
  link?: string;
};

type PexelsVideo = {
  id?: number;
  url?: string;
  image?: string;
  width?: number;
  height?: number;
  duration?: number;
  user?: { name?: string };
  video_files?: PexelsVideoFile[];
};

type PexelsResponse = { videos?: PexelsVideo[] };

/**
 * Pexels 的 Token 只保留在运行进程；MCP 只能看到归一化候选、来源和授权字段。
 * Pexels 仅用于现实 B-roll，不作为网页证据或用户产品图来源。
 */
export class PexelsProvider implements AssetProvider {
  readonly name = "pexels";

  constructor(private readonly apiKey: string) {}

  private async request(path: string): Promise<PexelsResponse | PexelsVideo> {
    const response = await assetFetch(`https://api.pexels.com${path}`, { headers: { Authorization: this.apiKey } });
    if (response.status === 401 || response.status === 403) throw new AssetProviderError("Pexels API Key 无效或没有访问权限", "PEXELS_AUTH_FAILED");
    if (response.status === 429) throw new AssetProviderError("Pexels 请求过于频繁，请稍后重试", "PEXELS_RATE_LIMITED");
    if (!response.ok) throw new AssetProviderError(`Pexels 查询失败：HTTP ${response.status}`, "PEXELS_SEARCH_FAILED");
    return response.json() as Promise<PexelsResponse | PexelsVideo>;
  }

  private selectVideoFile(video: PexelsVideo): PexelsVideoFile | undefined {
    const mp4Files = (video.video_files ?? [])
      .filter((file) => file.file_type === "video/mp4" && typeof file.link === "string")
      .sort((left, right) => {
        const leftPixels = (left.width ?? 0) * (left.height ?? 0);
        const rightPixels = (right.width ?? 0) * (right.height ?? 0);
        return rightPixels - leftPixels;
      });
    return mp4Files.find((file) => file.quality !== "sd") ?? mp4Files[0];
  }

  async search(input: { request: AssetRequest; query: string }): Promise<ProviderSearchCandidate[]> {
    const params = new URLSearchParams({ query: input.query, per_page: "12" });
    const response = await this.request(`/videos/search?${params.toString()}`) as PexelsResponse;
    return (response.videos ?? []).flatMap((video) => {
      if (!video.id || !video.url) return [];
      const file = this.selectVideoFile(video);
      if (!file) return [];
      return [{
        originalAssetId: String(video.id),
        name: `Pexels ${video.id}`,
        kind: "video",
        sourceUrl: video.url,
        previewUrl: video.image,
        mimeType: "video/mp4",
        width: positiveNumber(video.width) ?? positiveNumber(file.width),
        height: positiveNumber(video.height) ?? positiveNumber(file.height),
        durationMs: positiveNumber(video.duration) ? Math.round(video.duration! * 1_000) : undefined,
        creator: video.user?.name,
        license: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        rightsStatus: "cleared",
        tags: ["pexels", "stock", ...input.request.queryHints]
      }];
    });
  }

  async download(input: { candidate: AssetCandidate; temporaryDirectory: string }): Promise<ProviderDownload> {
    const response = await this.request(`/videos/${encodeURIComponent(input.candidate.originalAssetId)}`) as PexelsVideo;
    const file = this.selectVideoFile(response);
    if (!file?.link) throw new AssetProviderError("Pexels 候选已没有可下载的视频文件", "PEXELS_DOWNLOAD_MISSING");
    return downloadHttpFile(
      file.link,
      input.temporaryDirectory,
      `${input.candidate.originalAssetId}.mp4`,
      "video",
      "video/mp4"
    );
  }
}

export interface MockAssetFixture extends ProviderSearchCandidate {
  filePath: string;
  queryIncludes?: string[];
  /** 仅供测试模拟下载响应头；不会写入候选或 Project Revision。 */
  downloadContentType?: string;
}

type ResolvedMockAssetFixture = MockAssetFixture & {
  kind: ProviderMediaKind;
  mimeType?: string;
};

function resolveMockFixture(fixture: MockAssetFixture): ResolvedMockAssetFixture {
  const declaredMimeType = normalizedContentType(fixture.mimeType);
  const inferredMimeType = declaredMimeType ?? mimeTypeFromFileName(fixture.name) ?? mimeTypeFromFileName(fixture.filePath);
  const mimeKind = providerMediaKindFromMime(inferredMimeType);
  const kind = fixture.kind ?? mimeKind ?? "video";
  if (mimeKind && mimeKind !== kind) {
    throw new AssetProviderError(`Mock 素材“${fixture.name}”的 kind 与 MIME 不一致`, "MOCK_ASSET_KIND_MIME_MISMATCH");
  }
  return { ...fixture, kind, mimeType: inferredMimeType };
}

/** CI 专用 Provider：固定候选和本地媒体让测试不依赖网络或搜索排序。 */
export class MockAssetProvider implements AssetProvider {
  readonly name = "mock";
  private readonly fixtures = new Map<string, ResolvedMockAssetFixture>();

  constructor(fixtures: MockAssetFixture[]) {
    for (const fixture of fixtures) {
      const resolved = resolveMockFixture(fixture);
      this.fixtures.set(resolved.originalAssetId, resolved);
    }
  }

  async search(input: { request: AssetRequest; query: string }): Promise<ProviderSearchCandidate[]> {
    const lowerQuery = input.query.toLocaleLowerCase();
    return [...this.fixtures.values()]
      .filter((fixture) => !fixture.queryIncludes?.length || fixture.queryIncludes.every((word) => lowerQuery.includes(word.toLocaleLowerCase())))
      .map(({
        filePath: _filePath,
        queryIncludes: _queryIncludes,
        downloadContentType: _downloadContentType,
        ...candidate
      }) => ({ ...candidate, tags: [...(candidate.tags ?? []), ...input.request.queryHints] }));
  }

  async download(input: { candidate: AssetCandidate; temporaryDirectory: string }): Promise<ProviderDownload> {
    const fixture = this.fixtures.get(input.candidate.originalAssetId);
    if (!fixture) throw new AssetProviderError("Mock 候选对应的本地测试媒体不存在", "MOCK_ASSET_NOT_FOUND");
    await mkdir(input.temporaryDirectory, { recursive: true });
    const fileName = safeFileName(fixture.name || `${fixture.originalAssetId}.mp4`);
    const targetPath = join(input.temporaryDirectory, `${input.candidate.id}-${fileName}`);
    await copyFile(fixture.filePath, targetPath);
    return {
      filePath: targetPath,
      fileName,
      contentType: normalizedContentType(fixture.downloadContentType) ?? fixture.mimeType
    };
  }
}

export class AssetProviderRegistry {
  private readonly providers = new Map<string, AssetProvider>();

  constructor(providers: AssetProvider[] = []) {
    for (const provider of providers) this.providers.set(provider.name, provider);
  }

  get(name: string): AssetProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      const known = this.catalog().find(entry => entry.id === name);
      throw new AssetProviderError(known ? `素材服务 ${name} 不可用：${known.unavailableReason}` : `未知素材服务 ${name}；请从 list_asset_providers 返回的 id 中选择`, known ? "ASSET_PROVIDER_NOT_CONFIGURED" : "ASSET_PROVIDER_UNKNOWN", { stage: "provider", provider: name, availableProviders: this.names(), recovery: known ? "configure_provider" : "select_provider" });
    }
    return provider;
  }

  catalog() {
    const config = readRuntimeConfig().providers;
    const known = [
      { id: "wikimedia-commons", name: "Wikimedia Commons", mediaTypes: ["image", "video"], queryMode: "keywords", requiresKey: false, unavailableReason: "当前注册表未启用" },
      { id: "pexels", name: "Pexels", mediaTypes: ["video"], queryMode: "keywords", requiresKey: true, unavailableReason: config.pexelsApiKey ? "当前注册表未启用" : "缺少 PEXELS_API_KEY" },
      { id: "youtube", name: "YouTube", mediaTypes: ["video"], queryMode: "single_video_url", requiresKey: false, unavailableReason: "当前注册表未启用" },
      { id: "mixkit", name: "Mixkit 音效", mediaTypes: ["audio"], queryMode: "category", requiresKey: false, unavailableReason: "当前注册表未启用" },
      { id: "mixkit_music", name: "Mixkit 音乐", mediaTypes: ["audio"], queryMode: "category", requiresKey: false, unavailableReason: "当前注册表未启用" },
      { id: "freesound", name: "Freesound", mediaTypes: ["audio"], queryMode: "keywords", requiresKey: true, unavailableReason: !config.freesoundApiKey ? "缺少 FREESOUND_API_KEY" : !config.freesoundCommercialApiApproved ? "尚未确认商业 API 使用条件" : "当前注册表未启用" }
    ];
    return [...known, ...this.names().filter(id => !known.some(entry => entry.id === id)).map(id => ({ id, name: id, mediaTypes: ["image", "video", "audio"], queryMode: "provider_defined", requiresKey: false, unavailableReason: "" }))]
      .map(entry => ({ ...entry, enabled: this.providers.has(entry.id), unavailableReason: this.providers.has(entry.id) ? undefined : entry.unavailableReason }));
  }

  names(): string[] {
    return [...this.providers.keys()].sort();
  }
}

/**
 * Commons 不需要项目私钥，因此默认可发现；Pexels 仍只在配置密钥时出现。
 * 发现 Provider 不等于素材已获授权或适合进入 Scene，后续仍要走候选审查和本地化。
 */
export function createDefaultAssetProviderRegistry(): AssetProviderRegistry {
  const providers: AssetProvider[] = [new WikimediaCommonsProvider(), new MixkitSoundProvider(), new MixkitMusicProvider(), new YoutubeProvider()];
  const soundConfig = readRuntimeConfig().providers;
  if (soundConfig.freesoundApiKey && soundConfig.freesoundCommercialApiApproved) providers.push(new FreesoundProvider(soundConfig.freesoundApiKey, soundConfig.freesoundOAuthToken));
  const pexelsApiKey = readRuntimeConfig().providers.pexelsApiKey;
  if (pexelsApiKey) providers.push(new PexelsProvider(pexelsApiKey));
  return new AssetProviderRegistry(providers);
}

// Commons 的逐文件许可解析在独立模块中实现，避免 Pexels Provider 承担不同站点的 API 细节。
export { WikimediaCommonsProvider, type WikimediaCommonsProviderOptions, type WikimediaCommonsSearchCandidate } from "./wikimedia-commons.js";
