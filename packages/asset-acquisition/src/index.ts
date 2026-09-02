import { createWriteStream } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AssetCandidate, AssetRequest } from "@videocut/contracts";

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
  sourceUrl: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  creator?: string;
  license?: string;
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

const safeFileName = (value: string) => basename(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "asset.mp4";
const positiveNumber = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

async function downloadHttpFile(url: string, temporaryDirectory: string, fileName: string, headers: Record<string, string> = {}): Promise<ProviderDownload> {
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) throw new AssetProviderError(`下载素材失败：HTTP ${response.status}`, "ASSET_DOWNLOAD_HTTP_ERROR");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (!contentType?.startsWith("video/")) throw new AssetProviderError(`下载内容不是视频媒体：${contentType || "未知 MIME"}`, "ASSET_DOWNLOAD_MIME_INVALID");
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const maxBytes = Number(process.env.VIDEOCUT_MAX_ASSET_DOWNLOAD_BYTES ?? 512 * 1024 * 1024);
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
  await pipeline(Readable.fromWeb(response.body as never), byteLimit, createWriteStream(targetPath));
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
    return (video.video_files ?? [])
      .filter((file) => file.file_type === "video/mp4" && typeof file.link === "string")
      .sort((left, right) => {
        const leftPixels = (left.width ?? 0) * (left.height ?? 0);
        const rightPixels = (right.width ?? 0) * (right.height ?? 0);
        return rightPixels - leftPixels;
      })
      .find((file) => file.quality !== "sd") ?? (video.video_files ?? []).find((file) => typeof file.link === "string");
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
        sourceUrl: video.url,
        previewUrl: video.image,
        width: positiveNumber(video.width) ?? positiveNumber(file.width),
        height: positiveNumber(video.height) ?? positiveNumber(file.height),
        durationMs: positiveNumber(video.duration) ? Math.round(video.duration! * 1_000) : undefined,
        creator: video.user?.name,
        license: "Pexels License",
        rightsStatus: "cleared",
        tags: ["pexels", "stock", ...input.request.queryHints]
      }];
    });
  }

  async download(input: { candidate: AssetCandidate; temporaryDirectory: string }): Promise<ProviderDownload> {
    const response = await this.request(`/videos/${encodeURIComponent(input.candidate.originalAssetId)}`) as PexelsVideo;
    const file = this.selectVideoFile(response);
    if (!file?.link) throw new AssetProviderError("Pexels 候选已没有可下载的视频文件", "PEXELS_DOWNLOAD_MISSING");
    return downloadHttpFile(file.link, input.temporaryDirectory, `${input.candidate.originalAssetId}.mp4`);
  }
}

export interface MockAssetFixture extends ProviderSearchCandidate {
  filePath: string;
  queryIncludes?: string[];
}

/** CI 专用 Provider：固定候选和本地媒体让测试不依赖网络或搜索排序。 */
export class MockAssetProvider implements AssetProvider {
  readonly name = "mock";
  private readonly fixtures = new Map<string, MockAssetFixture>();

  constructor(fixtures: MockAssetFixture[]) {
    for (const fixture of fixtures) this.fixtures.set(fixture.originalAssetId, fixture);
  }

  async search(input: { request: AssetRequest; query: string }): Promise<ProviderSearchCandidate[]> {
    const lowerQuery = input.query.toLocaleLowerCase();
    return [...this.fixtures.values()]
      .filter((fixture) => !fixture.queryIncludes?.length || fixture.queryIncludes.every((word) => lowerQuery.includes(word.toLocaleLowerCase())))
      .map(({ filePath: _filePath, queryIncludes: _queryIncludes, ...candidate }) => ({ ...candidate, tags: [...(candidate.tags ?? []), ...input.request.queryHints] }));
  }

  async download(input: { candidate: AssetCandidate; temporaryDirectory: string }): Promise<ProviderDownload> {
    const fixture = this.fixtures.get(input.candidate.originalAssetId);
    if (!fixture) throw new AssetProviderError("Mock 候选对应的本地测试媒体不存在", "MOCK_ASSET_NOT_FOUND");
    await mkdir(input.temporaryDirectory, { recursive: true });
    const fileName = safeFileName(fixture.name || `${fixture.originalAssetId}.mp4`);
    const targetPath = join(input.temporaryDirectory, `${input.candidate.id}-${fileName}`);
    await copyFile(fixture.filePath, targetPath);
    return { filePath: targetPath, fileName, contentType: "video/mp4" };
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

/** 默认运行环境只在存在 PEXELS_API_KEY 时启用真实网络 Provider。 */
export function createDefaultAssetProviderRegistry(): AssetProviderRegistry {
  const providers: AssetProvider[] = [];
  const pexelsApiKey = process.env.PEXELS_API_KEY?.trim();
  if (pexelsApiKey) providers.push(new PexelsProvider(pexelsApiKey));
  return new AssetProviderRegistry(providers);
}
