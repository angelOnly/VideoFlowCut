import { createWriteStream } from "node:fs";
import { copyFile, mkdir, open, rm, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AssetCandidate, AssetRequest, MediaMetadata } from "@videocut/contracts";
import { readRuntimeConfig } from "@videocut/project-overview";
import { WikimediaCommonsProvider } from "./wikimedia-commons.js";

/** Provider 失败会由 Job Runtime 保留为可诊断的错误码，而不是伪造空候选。 */
export class AssetProviderError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

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
  search(input: { request: AssetRequest; query: string }): Promise<ProviderSearchCandidate[]>;
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
  ".webm": "video/webm"
};

function normalizedContentType(value: string | undefined): string | undefined {
  const normalized = value?.split(";", 1)[0]?.trim().toLocaleLowerCase();
  return normalized || undefined;
}

/** 只把明确的 image/*、video/* 当作视觉素材；audio、HTML 和二进制下载页不能蒙混过关。 */
export function providerMediaKindFromMime(value: string | undefined): ProviderMediaKind | undefined {
  const mimeType = normalizedContentType(value);
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
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
  if (!actual) throw new AssetProviderError("下载响应缺少图片或视频 MIME，不能安全收录素材", "ASSET_DOWNLOAD_MIME_MISSING");
  const actualKind = providerMediaKindFromMime(actual);
  if (!actualKind) throw new AssetProviderError(`下载内容不是图片或视频媒体：${actual}`, "ASSET_DOWNLOAD_MIME_INVALID");
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
      throw new AssetProviderError("下载内容是网页错误页，不是图片或视频素材", "ASSET_DOWNLOAD_HTML");
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

async function downloadHttpFile(
  url: string,
  temporaryDirectory: string,
  fileName: string,
  expectedKind: ProviderMediaKind,
  expectedMimeType?: string,
  headers: Record<string, string> = {}
): Promise<ProviderDownload> {
  const response = await fetch(url, { headers, redirect: "follow" });
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
    const response = await fetch(`https://api.pexels.com${path}`, { headers: { Authorization: this.apiKey } });
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
    if (!provider) throw new AssetProviderError(`素材 Provider “${name}”当前未配置；请使用已启用 Provider 或配置本地密钥。`, "ASSET_PROVIDER_NOT_CONFIGURED");
    return provider;
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
  const providers: AssetProvider[] = [new WikimediaCommonsProvider()];
  const pexelsApiKey = readRuntimeConfig().providers.pexelsApiKey;
  if (pexelsApiKey) providers.push(new PexelsProvider(pexelsApiKey));
  return new AssetProviderRegistry(providers);
}

// Commons 的逐文件许可解析在独立模块中实现，避免 Pexels Provider 承担不同站点的 API 细节。
export { WikimediaCommonsProvider, type WikimediaCommonsProviderOptions, type WikimediaCommonsSearchCandidate } from "./wikimedia-commons.js";
