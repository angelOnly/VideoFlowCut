import type { AssetCandidate, AssetRequest } from "@videocut/contracts";
import { AssetProviderError, downloadHttpFile, type AssetProvider, type ProviderSearchCandidate } from "./index.js";
import { MIXKIT_SOUND_CATEGORIES } from "./sound-catalog.js";

const origin = "https://mixkit.co";
const licenseUrl = `${origin}/license/#sfxFree`;
const plain = (value: string) => value.replace(/<[^>]*>/gu, " ").replace(/&amp;/gu, "&").replace(/&#39;/gu, "'").replace(/&quot;/gu, '"').replace(/\s+/gu, " ").trim();

/** 分类公开页不是搜索 API；明确限制单页，不能递归抓取或批量镜像。 */
export function parseMixkitSoundPage(html: string, sourceUrl: string): ProviderSearchCandidate[] {
  if (!html.includes("sfxFree")) throw new AssetProviderError("当前页面未确认 Mixkit 音效许可，停止收录", "MIXKIT_LICENSE_UNCONFIRMED");
  const candidates: ProviderSearchCandidate[] = [];
  for (const block of html.split('data-test-id="audio-player"').slice(1, 31)) {
    const id = block.match(/data-audio-player-item-id-value="(\d+)"/u)?.[1];
    const preview = block.match(/data-audio-player-preview-url-value="([^"]+)"/u)?.[1];
    const name = block.match(/<h2[^>]*class="item-grid-card__title"[^>]*>([\s\S]*?)<\/h2>/u)?.[1];
    const duration = block.match(/data-test-id="duration"[^>]*>\s*(\d+):(\d+)\s*</u);
    if (!id || !name || !preview || !new RegExp(`^https://assets\\.mixkit\\.co/active_storage/sfx/${id}/${id}-preview\\.mp3$`, "u").test(preview)) continue;
    candidates.push({ originalAssetId: id, name: plain(name), kind: "audio", sourceUrl,
      previewUrl: preview, durationMs: duration ? (Number(duration[1]) * 60 + Number(duration[2])) * 1000 : undefined,
      license: "Mixkit Sound Effects Free License", licenseUrl, rightsStatus: "cleared",
      tags: ["mixkit", "sfx", ...Array.from(block.matchAll(/href="\/free-sound-effects\/([a-z-]+)\/"/gu), (match) => match[1])].slice(0, 10) });
  }
  if (!candidates.length) throw new AssetProviderError("Mixkit 页面没有可识别音效，可能结构已变化；不猜测下载链接", "MIXKIT_PAGE_CHANGED");
  return candidates;
}

async function page(path: string): Promise<string> {
  const response = await fetch(`${origin}${path}`, { redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (response.status === 429) throw new AssetProviderError("Mixkit 限流，停止请求；不自动重试或更换身份", "MIXKIT_RATE_LIMITED");
  if (!response.ok) throw new AssetProviderError(`Mixkit 页面 HTTP ${response.status}`, "MIXKIT_PAGE_FAILED");
  if (!response.headers.get("content-type")?.includes("text/html")) throw new AssetProviderError("Mixkit 未返回正常公开页面", "MIXKIT_PAGE_CHANGED");
  const reader = response.body?.getReader();
  if (!reader) throw new AssetProviderError("Mixkit 页面正文缺失", "MIXKIT_PAGE_CHANGED");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.length;
      if (bytes > 2_000_000) throw new AssetProviderError("Mixkit 页面超过单页读取上限", "MIXKIT_PAGE_TOO_LARGE");
      chunks.push(next.value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks).toString("utf8");
}

export class MixkitSoundProvider implements AssetProvider {
  readonly name = "mixkit";
  async search({ request, query }: { request: AssetRequest; query: string }) {
    if (request.mediaKind !== "audio") throw new AssetProviderError("Mixkit 音效只接受 audio 素材需求", "ASSET_REQUEST_KIND_MISMATCH");
    const category = query.trim().toLowerCase();
    if (!(MIXKIT_SOUND_CATEGORIES as readonly string[]).includes(category)) {
      throw new AssetProviderError(`当前按单个公开分类浏览，query 可选：${MIXKIT_SOUND_CATEGORIES.join("、")}`, "MIXKIT_CATEGORY_REQUIRED");
    }
    const path = `/free-sound-effects/${category}/`;
    return parseMixkitSoundPage(await page(path), `${origin}${path}`);
  }
  async download({ candidate, temporaryDirectory }: { candidate: AssetCandidate; temporaryDirectory: string }) {
    const id = candidate.originalAssetId;
    if (candidate.kind !== "audio" || !/^\d+$/u.test(id)) throw new AssetProviderError("无效的 Mixkit 音效身份", "MIXKIT_CANDIDATE_INVALID");
    const html = await page(`/free-sound-effects/download/${id}/`);
    const url = html.match(/data-download--modal-url-value="([^"]+)"/u)?.[1];
    if (!url || !new RegExp(`^https://assets\\.mixkit\\.co/active_storage/sfx/${id}/${id}\\.wav$`, "u").test(url)) {
      throw new AssetProviderError("原站未提供对应 WAV 下载；不使用试听压缩版替代", "MIXKIT_DOWNLOAD_UNCONFIRMED");
    }
    return downloadHttpFile(url, temporaryDirectory, `mixkit-${id}.wav`, "audio", undefined, {}, { allowedHosts: ["assets.mixkit.co"] });
  }
}
