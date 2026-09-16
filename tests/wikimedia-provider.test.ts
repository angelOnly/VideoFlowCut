import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { AssetCandidate, AssetRequest } from "@videocut/contracts";
import { AssetProviderError } from "@videocut/acquisition";
import { WikimediaCommonsProvider } from "../packages/asset-acquisition/src/wikimedia-commons.js";

const request = { queryHints: ["城市", "夜晚"] } as AssetRequest;

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function fileDetails(input: {
  title: string;
  mime: string;
  url: string;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  attribution?: string;
  duration?: number;
  size?: number;
}): unknown {
  return {
    query: {
      pages: [{
        title: input.title,
        canonicalurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(input.title)}`,
        imageinfo: [{
          url: input.url,
          thumburl: `${input.url}?width=640`,
          mime: input.mime,
          width: 1920,
          height: 1080,
          duration: input.duration,
          size: input.size ?? 100,
          extmetadata: {
            Artist: { value: input.creator ?? "<a href=\"/wiki/User:Author\">Author</a>" },
            LicenseShortName: input.license ? { value: input.license } : undefined,
            LicenseUrl: input.licenseUrl ? { value: input.licenseUrl } : undefined,
            Attribution: input.attribution ? { value: input.attribution } : undefined
          }
        }]
      }]
    }
  };
}

test("Wikimedia Commons 批量读取独立授权元数据，并区分图片、视频和不完整许可", async () => {
  const detailTitles: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(input.toString());
    if (url.searchParams.get("list") === "search") {
      return json({ query: { search: [
        { title: "File:Sunset.jpg" },
        { title: "File:Street.webm" },
        { title: "File:Incomplete.png" },
        { title: "File:Audio.ogg" }
      ] } });
    }
    const title = url.searchParams.get("titles");
    assert.ok(title);
    detailTitles.push(title);
    const details: Record<string, unknown> = {
      "File:Sunset.jpg": fileDetails({
        title: "File:Sunset.jpg",
        mime: "image/jpeg",
        url: "https://upload.wikimedia.org/sunset.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        creator: "<a href=\"/wiki/User:Alice\">Alice</a>",
        attribution: "Alice / CC BY-SA 4.0"
      }),
      "File:Street.webm": fileDetails({
        title: "File:Street.webm",
        mime: "video/webm",
        url: "https://upload.wikimedia.org/street.webm",
        license: "CC0 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        duration: 5.25
      }),
      "File:Incomplete.png": fileDetails({
        title: "File:Incomplete.png",
        mime: "image/png",
        url: "https://upload.wikimedia.org/incomplete.png",
        license: "CC BY 4.0"
      }),
      "File:Audio.ogg": fileDetails({
        title: "File:Audio.ogg",
        mime: "audio/ogg",
        url: "https://upload.wikimedia.org/audio.ogg",
        license: "CC0 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/"
      })
    };
    return json({ query: { pages: title.split('|').flatMap(name => (details[name] as { query: { pages: unknown[] } }).query.pages) } });
  };
  const provider = new WikimediaCommonsProvider({ apiEndpoint: "https://commons.test/w/api.php", fetchImpl });

  const candidates = await provider.search({ request, query: "city at night" });

  assert.deepEqual(detailTitles, ["File:Sunset.jpg|File:Street.webm|File:Incomplete.png|File:Audio.ogg"]);
  assert.equal(candidates.length, 3);
  const image = candidates.find((candidate) => candidate.originalAssetId === "File:Sunset.jpg")!;
  assert.equal(image.kind, "image");
  assert.equal(image.creator, "Alice");
  assert.equal(image.license, "CC BY-SA 4.0");
  assert.equal(image.licenseUrl, "https://creativecommons.org/licenses/by-sa/4.0/");
  assert.equal(image.attribution, "Alice / CC BY-SA 4.0");
  assert.equal(image.rightsStatus, "attribution_required");
  assert.match(image.sourceUrl, /commons\.wikimedia\.org/u);
  const video = candidates.find((candidate) => candidate.originalAssetId === "File:Street.webm")!;
  assert.equal(video.kind, "video");
  assert.equal(video.previewUrl, "https://upload.wikimedia.org/street.webm");
  assert.deepEqual(provider.previewHosts, ["upload.wikimedia.org"]);
  assert.equal(video.durationMs, 5_250);
  assert.equal(video.rightsStatus, "cleared");
  const incomplete = candidates.find((candidate) => candidate.originalAssetId === "File:Incomplete.png")!;
  assert.equal(incomplete.rightsStatus, "unknown");
  assert.equal(incomplete.licenseUrl, undefined);
});

test("Wikimedia Commons 下载保留扩展名，并校验实时元数据、MIME 与字节上限", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-wikimedia-test-"));
  try {
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.hostname === "commons.test") {
        return json(fileDetails({
          title: "File:Street scene.webm",
          mime: "video/webm",
          url: "https://upload.wikimedia.test/Street_scene.webm",
          license: "CC0 1.0",
          licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
          size: 4
        }));
      }
      return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "video/webm" } });
    };
    const provider = new WikimediaCommonsProvider({ apiEndpoint: "https://commons.test/w/api.php", fetchImpl, maxDownloadBytes: 16 });
    const downloaded = await provider.download({
      candidate: { originalAssetId: "File:Street scene.webm" } as AssetCandidate,
      temporaryDirectory: root
    });
    assert.equal(downloaded.fileName, "Street scene.webm");
    assert.equal(downloaded.contentType, "video/webm");
    assert.deepEqual([...await readFile(downloaded.filePath)], [1, 2, 3, 4]);

    // Candidate 在下载前再次与 Commons 当前元数据核对，避免图片/视频类型变化后按旧类型收录。
    await assert.rejects(
      () => provider.download({
        candidate: { originalAssetId: "File:Street scene.webm", kind: "image", mimeType: "image/png" } as AssetCandidate,
        temporaryDirectory: root
      }),
      (error: unknown) => error instanceof AssetProviderError && error.code === "WIKIMEDIA_DOWNLOAD_KIND_MISMATCH"
    );

    const htmlProvider = new WikimediaCommonsProvider({
      apiEndpoint: "https://commons.test/w/api.php",
      fetchImpl: async (input) => {
        const url = new URL(input.toString());
        if (url.hostname === "commons.test") return json(fileDetails({ title: "File:Bad.webp", mime: "image/webp", url: "https://upload.wikimedia.test/bad.webp" }));
        return new Response("<html>not media</html>", { status: 200, headers: { "content-type": "text/html" } });
      }
    });
    await assert.rejects(
      () => htmlProvider.download({ candidate: { originalAssetId: "File:Bad.webp" } as AssetCandidate, temporaryDirectory: root }),
      (error: unknown) => error instanceof AssetProviderError && error.code === "WIKIMEDIA_DOWNLOAD_MIME_INVALID"
    );

    const tooLargeProvider = new WikimediaCommonsProvider({
      apiEndpoint: "https://commons.test/w/api.php",
      maxDownloadBytes: 3,
      fetchImpl: async (input) => {
        const url = new URL(input.toString());
        if (url.hostname === "commons.test") return json(fileDetails({ title: "File:Large.png", mime: "image/png", url: "https://upload.wikimedia.test/large.png", size: 4 }));
        return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "image/png" } });
      }
    });
    await assert.rejects(
      () => tooLargeProvider.download({ candidate: { originalAssetId: "File:Large.png" } as AssetCandidate, temporaryDirectory: root }),
      (error: unknown) => error instanceof AssetProviderError && error.code === "WIKIMEDIA_DOWNLOAD_TOO_LARGE"
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
