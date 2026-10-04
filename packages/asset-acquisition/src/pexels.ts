import type { AssetCandidate } from "@videocut/contracts";
import { AssetProviderError, downloadHttpFile, type AssetProvider, type ProviderSearchInput, type ProviderSearchCandidate } from "./index.js";
import { assetFetch } from "./http.js";

const API = "https://api.pexels.com";
const LICENSE = "https://www.pexels.com/license/";
type VideoFile = { link?: string; file_type?: string; width?: number; height?: number };
type Video = { id?: number; url?: string; width?: number; height?: number; duration?: number; image?: string; user?: { name?: string }; video_files?: VideoFile[] };

export interface PexelsProviderOptions { apiKey?: string; fetchImpl?: typeof fetch; apiEndpoint?: string }

/** Pexels 只接受官方 API 返回的身份与文件链接，不从网页或缩略图推算下载地址。 */
export class PexelsProvider implements AssetProvider {
  readonly name = "pexels";
  readonly previewHosts = ["images.pexels.com", "videos.pexels.com"];
  private readonly key: string;
  private readonly fetchImpl: typeof fetch;
  private readonly endpoint: string;

  constructor(options: PexelsProviderOptions = {}) {
    this.key = (options.apiKey ?? process.env.PEXELS_API_KEY ?? "").trim();
    this.fetchImpl = options.fetchImpl ?? assetFetch;
    this.endpoint = options.apiEndpoint ?? API;
  }

  private async request(path: string, query?: URLSearchParams): Promise<{ videos?: Video[] } & Video> {
    if (!this.key) throw new AssetProviderError("Pexels API Key 未配置", "ASSET_PROVIDER_NOT_CONFIGURED", { provider: this.name, stage: "provider", recovery: "configure_provider" });
    const url = new URL(path, this.endpoint);
    if (query) url.search = query.toString();
    const response = await this.fetchImpl(url, { headers: { Authorization: this.key, Accept: "application/json" } });
    if (response.status === 401 || response.status === 403) throw new AssetProviderError("Pexels API 凭据无效或无视频权限", "PEXELS_AUTH_FAILED", { provider: this.name, stage: "provider", recovery: "configure_provider" });
    if (response.status === 429) throw new AssetProviderError("Pexels API 已限流", "PEXELS_RATE_LIMITED", { provider: this.name, stage: "search", recovery: "repair" });
    if (!response.ok) throw new AssetProviderError(`Pexels API 请求失败：HTTP ${response.status}`, "PEXELS_API_FAILED", { provider: this.name, stage: "search", recovery: "repair" });
    try { return await response.json() as { videos?: Video[] } & Video; }
    catch { throw new AssetProviderError("Pexels API 响应无法解析", "PEXELS_API_INVALID_RESPONSE", { provider: this.name, stage: "metadata", recovery: "repair" }); }
  }

  private candidate(video: Video): ProviderSearchCandidate | undefined {
    if (!Number.isSafeInteger(video.id) || !video.url || !/^https:\/\/www\.pexels\.com\/video\//u.test(video.url) || !video.duration || !video.video_files?.some(file => file.file_type === "video/mp4")) return undefined;
    return { originalAssetId: String(video.id), name: `Pexels video ${video.id}`, kind: "video", sourceUrl: video.url,
      previewUrl: video.image, mimeType: "video/mp4", width: video.width, height: video.height, durationMs: video.duration * 1000,
      creator: video.user?.name, license: "Pexels License", licenseUrl: LICENSE, rightsStatus: "cleared", tags: ["pexels"] };
  }

  async search(input: ProviderSearchInput): Promise<ProviderSearchCandidate[]> {
    if (input.request.mediaKind !== "visual" || input.mediaType && input.mediaType !== "video") throw new AssetProviderError("Pexels 来源仅支持视频需求", "ASSET_REQUEST_KIND_MISMATCH");
    const match = input.query.trim().match(/^https:\/\/(?:www\.)?pexels\.com\/video\/[a-z0-9-]*?(\d+)\/?(?:\?.*)?$/iu);
    const result = match ? await this.request(`/videos/videos/${match[1]}`) : await this.request("/videos/search", new URLSearchParams({ query: input.query.trim(), per_page: "15" }));
    return (match ? [result] : result.videos ?? []).flatMap(video => { const candidate = this.candidate(video); return candidate ? [candidate] : []; });
  }

  async download({ candidate, temporaryDirectory }: { candidate: AssetCandidate; temporaryDirectory: string }) {
    if (candidate.kind !== "video" || !/^\d+$/u.test(candidate.originalAssetId)) throw new AssetProviderError("Pexels 候选身份无效", "PEXELS_CANDIDATE_INVALID");
    const video = await this.request(`/videos/videos/${candidate.originalAssetId}`);
    if (String(video.id) !== candidate.originalAssetId || video.url !== candidate.sourceUrl) throw new AssetProviderError("Pexels 候选来源已变化", "PEXELS_CANDIDATE_CHANGED");
    const files = (video.video_files ?? []).filter(file => file.file_type === "video/mp4" && file.link && (() => { try { const url = new URL(file.link); return url.protocol === "https:" && url.hostname === "videos.pexels.com" && !url.username && !url.password; } catch { return false; } })());
    const file = files.sort((a, b) => (a.width ?? Infinity) * (a.height ?? Infinity) - (b.width ?? Infinity) * (b.height ?? Infinity))[0];
    if (!file?.link) throw new AssetProviderError("Pexels API 没有提供可信 MP4 原文件", "PEXELS_DOWNLOAD_UNAVAILABLE");
    return downloadHttpFile(file.link, temporaryDirectory, `pexels-${candidate.originalAssetId}.mp4`, "video", "video/mp4", {}, { allowedHosts: ["videos.pexels.com"] });
  }
}
