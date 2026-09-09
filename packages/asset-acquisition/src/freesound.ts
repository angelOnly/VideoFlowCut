import type { AssetCandidate, AssetRequest } from "@videocut/contracts";
import { AssetProviderError, downloadHttpFile, saveProviderMediaResponse, type AssetProvider, type ProviderSearchCandidate } from "./index.js";

type Sound = { id: number; name: string; url: string; duration: number; username: string; license: string; tags?: string[]; type?: string; previews?: Record<string, string> };
export function freesoundRights(license: string): AssetCandidate["rightsStatus"] {
  if (/^https?:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/u.test(license)) return "cleared";
  if (/^https?:\/\/creativecommons\.org\/licenses\/by\/(?:3\.0|4\.0)\/?$/u.test(license)) return "attribution_required";
  return "restricted";
}
export class FreesoundProvider implements AssetProvider {
  readonly name = "freesound";
  readonly previewHosts = ["cdn.freesound.org", "freesound.org"];
  constructor(private readonly apiKey: string, private readonly oauthToken?: string) {}
  private async request(path: string): Promise<unknown> {
    const response = await fetch(`https://freesound.org/apiv2${path}`, { headers: { Authorization: `Token ${this.apiKey}` }, redirect: "error", signal: AbortSignal.timeout(20_000) });
    if (response.status === 429) throw new AssetProviderError("Freesound 限流，请按来源要求稍后重试", "FREESOUND_RATE_LIMITED");
    if (response.status === 401 || response.status === 403) throw new AssetProviderError("Freesound 凭据或 API 使用权限不可用", "FREESOUND_AUTH_FAILED");
    if (!response.ok) throw new AssetProviderError(`Freesound HTTP ${response.status}`, "FREESOUND_HTTP_ERROR");
    return response.json();
  }
  async search({ request, query }: { request: AssetRequest; query: string }): Promise<ProviderSearchCandidate[]> {
    if (request.mediaKind !== "audio") throw new AssetProviderError("Freesound 只处理音频需求", "ASSET_REQUEST_KIND_MISMATCH");
    const params = new URLSearchParams({ query, page_size: "30", fields: "id,name,url,duration,username,license,tags,previews,type", filter: request.rightsRequirement === "cleared_only" ? 'license:"Creative Commons 0"' : 'license:("Creative Commons 0" OR "Attribution")' });
    const response = await this.request(`/search/text/?${params}`) as { results?: Sound[] };
    if (!Array.isArray(response.results)) throw new AssetProviderError("Freesound 返回结构无效", "FREESOUND_RESPONSE_INVALID");
    return response.results.slice(0, 30).map((sound) => ({ originalAssetId: String(sound.id), name: sound.name, kind: "audio", sourceUrl: sound.url, previewUrl: sound.previews?.["preview-hq-mp3"], durationMs: Math.round(sound.duration * 1000), creator: sound.username, license: sound.license, licenseUrl: sound.license, rightsStatus: freesoundRights(sound.license), attributionText: `${sound.name} — ${sound.username} — ${sound.url} — ${sound.license}`, tags: sound.tags ?? [] }));
  }
  async download({ candidate, temporaryDirectory }: { candidate: AssetCandidate; temporaryDirectory: string }) {
    if (!this.oauthToken) throw new AssetProviderError("下载原文件需要 Freesound OAuth，预览不能替代原文件", "FREESOUND_OAUTH_REQUIRED");
    if (!/^\d+$/u.test(candidate.originalAssetId)) throw new AssetProviderError("Freesound 声音身份无效", "FREESOUND_CANDIDATE_INVALID");
    const sound = await this.request(`/sounds/${candidate.originalAssetId}/`) as Sound;
    if (String(sound.id) !== candidate.originalAssetId) throw new AssetProviderError("返回的原文件身份与候选不一致", "FREESOUND_CANDIDATE_INVALID");
    if (freesoundRights(sound.license) !== candidate.rightsStatus || sound.license !== candidate.license) throw new AssetProviderError("声音许可已变化，需要重新选择", "FREESOUND_LICENSE_CHANGED");
    const response = await fetch(`https://freesound.org/apiv2/sounds/${sound.id}/download/`, { headers: { Authorization: `Bearer ${this.oauthToken}` }, redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (response.status === 401 || response.status === 403) throw new AssetProviderError("Freesound OAuth 或原文件权限不可用", "FREESOUND_AUTH_FAILED");
    if (response.status === 429) throw new AssetProviderError("Freesound 原文件下载限流", "FREESOUND_RATE_LIMITED");
    const extension = ["wav", "mp3", "flac", "ogg", "aiff", "aif"].includes(sound.type ?? "") ? sound.type : "wav";
    if (response.status === 200) return saveProviderMediaResponse(response, temporaryDirectory, `freesound-${sound.id}.${extension}`, "audio");
    const location = response.headers.get("location");
    if (![302, 303, 307, 308].includes(response.status) || !location) throw new AssetProviderError(`Freesound 未返回可核实的原文件地址：HTTP ${response.status}`, "FREESOUND_DOWNLOAD_UNAVAILABLE");
    const url = new URL(location, "https://freesound.org");
    // 下载媒体不携带 API/OAuth 凭据，且必须仍在 Provider 声明的媒体域名。
    return downloadHttpFile(url.toString(), temporaryDirectory, `freesound-${sound.id}.${extension}`, "audio", undefined, {}, { allowedHosts: this.previewHosts });
  }
}
