import assert from "node:assert/strict";
import test from "node:test";
import { AssetProviderError } from "../packages/asset-acquisition/src/index.js";
import { PexelsProvider } from "../packages/asset-acquisition/src/pexels.js";
import type { AssetRequest, AssetCandidate } from "@videocut/contracts";

const video = { id: 7914832, url: "https://www.pexels.com/video/a-woman-live-streaming-using-her-cellphone-7914832/", duration: 10, width: 1920, height: 1080, user: { name: "RDNE Stock project" }, video_files: [{ link: "https://videos.pexels.com/video-files/7914832/test.mp4", file_type: "video/mp4", width: 1280, height: 720 }] };
const request = { mediaKind: "visual" } as unknown as AssetRequest;

test("Pexels 单页候选保留来源、许可与可核验时长", async () => {
  const provider = new PexelsProvider({ apiKey: "test-key", fetchImpl: async (url, init) => {
    assert.match(String(url), /\/videos\/videos\/7914832$/u);
    assert.equal((init?.headers as Record<string, string>).Authorization, "test-key");
    return new Response(JSON.stringify(video), { status: 200 });
  } });
  const candidates = await provider.search({ request, query: video.url });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].durationMs, 10_000);
  assert.equal(candidates[0].rightsStatus, "cleared");
  assert.equal(candidates[0].creator, "RDNE Stock project");
});

test("Pexels 无凭据与不可信文件链接均明确拒绝", async () => {
  const absent = new PexelsProvider({ apiKey: "" });
  await assert.rejects(absent.search({ request, query: video.url }), (error: unknown) => error instanceof AssetProviderError && error.code === "ASSET_PROVIDER_NOT_CONFIGURED");
  const provider = new PexelsProvider({ apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ ...video, video_files: [{ link: "https://invalid.example/test.mp4", file_type: "video/mp4" }] }), { status: 200 }) });
  await assert.rejects(provider.download({ candidate: { kind: "video", originalAssetId: "7914832", sourceUrl: video.url } as AssetCandidate, temporaryDirectory: "unused" }), (error: unknown) => error instanceof AssetProviderError && error.code === "PEXELS_DOWNLOAD_UNAVAILABLE");
});
