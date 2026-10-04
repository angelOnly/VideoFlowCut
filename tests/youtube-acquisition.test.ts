import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApplication } from "@videocut/application";
import { AssetProviderError, AssetProviderRegistry } from "@videocut/acquisition";
import { runProcess } from "@videocut/speech";
import { YoutubeProvider, youtubeVideoUrl } from "../packages/asset-acquisition/src/youtube.js";
import { createMediaJobProcessor, runOneJob } from "../apps/job-worker/src/index.js";
import type { AssetRequest } from "@videocut/contracts";

test("YouTube 定向页面拒绝任意站点和列表；来源未知不自动获得许可", async () => {
  for (const url of ["https://youtube.com/playlist?list=abc", "https://youtube.com.evil.test/watch?v=abcdefghijk", "http://youtu.be/abcdefghijk", "https://user:pass@youtube.com/watch?v=abcdefghijk", "ytsearch:test", "https://youtube.com/@channel"]) assert.throws(() => youtubeVideoUrl(url));
  assert.equal(youtubeVideoUrl("https://youtu.be/abcdefghijk?t=3").url, "https://www.youtube.com/watch?v=abcdefghijk");
  const provider = new YoutubeProvider(async args => { assert.equal(args.at(-1), "https://www.youtube.com/watch?v=abcdefghijk"); return JSON.stringify({ id: "abcdefghijk", duration: 2, title: "测试元数据" }); });
  const candidates = await provider.search({ request: {} as AssetRequest, query: "https://youtu.be/abcdefghijk" });
  assert.equal(candidates[0]!.rightsStatus, "unknown");
  await assert.rejects(new YoutubeProvider(async () => "{}").search({ request: {} as AssetRequest, query: "https://youtu.be/abcdefghijk" }), /元数据|身份/);
});

test("选定页面沿获取Worker登记真实视频，保留用途；下载失败不登记素材", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-youtube-job-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "YouTube固定夹具", profile: "visual_explainer" }).snapshot.project.id;
    const source = join(root, "test.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=24:d=2", "-c:v", "libx264", source]);
    let fail = false;
    const provider = new YoutubeProvider(async (args, options) => {
      if (!options.directory) return JSON.stringify({ id: "abcdefghijk", duration: 2, title: "模拟下载器" });
      assert.ok(args.includes("--max-filesize"));
      assert.ok(args.includes("--abort-on-unavailable-fragments"), "HLS 缺段必须失败，不能跳过后登记原片");
      assert.equal(args[args.indexOf("--concurrent-fragments") + 1], "4");
      const format = args[args.indexOf("-f") + 1]!;
      assert.ok(format.split("/")[0]!.includes("protocol^=m3u8"), "优先 HLS 而非会触发 Range 403 的普通流");
      assert.ok(format.split("/").every(branch => branch.includes("height<=720")));
      assert.equal(options.timeoutMs, 600_000);
      if (fail) { await writeFile(join(options.directory, "source.mp4"), "<html>failed</html>"); return ""; }
      await copyFile(source, join(options.directory, "source.mp4")); return "";
    });
    const revision = () => app.readProject(projectId).revision.number;
    const makeCandidate = async (minDurationMs = 1000) => {
      const state = app.manageAssetRequirement({ projectId, baseRevision: revision(), action: "create", title: "动作补材", purpose: "验证获取合同", visualBrief: "测试完整动作素材", role: "b_roll", minDurationMs, rightsRequirement: "cleared_or_attribution" });
      const request = state.snapshot.assetRequests.at(-1)!;
      return app.recordAssetSearch({ projectId, baseRevision: revision(), assetRequestId: request.id, provider: "youtube", query: request.id, candidates: await provider.search({ request, query: "https://youtu.be/abcdefghijk" }) }).candidates[0]!;
    };
    const usageRights = { purposes: ["draft"] as ("draft" | "delivery")[], basis: "自制测试夹具，仅测试内部用途授权传递，不证明真实网络视频许可" };
    const short = await makeCandidate(3000);
    assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: short.id, usageRights }), /技术|过滤/);
    const candidate = await makeCandidate();
    assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: candidate.id }), /可用|过滤/);
    const acquisition = app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: candidate.id, usageRights });
    assert.equal(app.acquireAssetCandidate({ projectId, baseRevision: 1, assetCandidateId: candidate.id, usageRights }).job.id, acquisition.job.id);
    const processor = createMediaJobProcessor(app, undefined, new AssetProviderRegistry([provider]));
    await runOneJob(app, processor); await runOneJob(app, processor);
    assert.equal(app.trackJob(acquisition.job.id).status, "succeeded");
    const asset = app.readProject(projectId).snapshot.assets[0]!;
    assert.equal(asset.status, "ready"); assert.equal(asset.metadata?.durationMs, 2000);
    assert.equal(asset.provenance?.rightsStatus, "unknown"); assert.deepEqual(asset.provenance?.usageRights?.purposes, ["draft"]);
    assert.equal(asset.provenance?.sourceUrl, "https://www.youtube.com/watch?v=abcdefghijk");
    fail = true;
    const bad = await makeCandidate();
    const failed = app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: bad.id, usageRights });
    await runOneJob(app, processor);
    assert.equal(app.trackJob(failed.job.id).status, "failed");
    assert.equal(app.readProject(projectId).snapshot.assets.length, 1);
    const failedRevision = revision();
    assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: bad.id, usageRights: { ...usageRights, basis: "不能在恢复中改变依据" } }), /用途依据/);
    assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: bad.id, usageRights, idempotencyKey: failed.job.idempotencyKey }), /幂等键/);
    assert.equal(revision(), failedRevision, "拒绝恢复不得创建视频版本");
    const confirmedAt = app.readProject(projectId).snapshot.assetCandidates.find(entry => entry.id === bad.id)!.usageRights!.confirmedAt;
    fail = false;
    const recovered = app.acquireAssetCandidate({ projectId, baseRevision: revision(), assetCandidateId: bad.id, usageRights });
    assert.notEqual(recovered.job.id, failed.job.id);
    assert.equal(recovered.candidate.usageRights!.confirmedAt, confirmedAt);
    assert.equal(app.acquireAssetCandidate({ projectId, baseRevision: 1, assetCandidateId: bad.id, usageRights }).job.id, recovered.job.id);
    await runOneJob(app, processor);
    assert.equal(app.trackJob(recovered.job.id).status, "succeeded");
    assert.equal(app.trackJob(failed.job.id).status, "failed");
    assert.equal(app.readProject(projectId).snapshot.assetCandidates.find(entry => entry.id === bad.id)!.status, "acquired");
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("HLS 已写部分媒体但下载器报缺段时不得返回可用文件", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-youtube-fragment-"));
  try {
    const provider = new YoutubeProvider(async (_args, options) => {
      await writeFile(join(options.directory!, "source.mp4"), "部分媒体不是完整原片");
      throw new AssetProviderError("片段下载失败", "YOUTUBE_DOWNLOAD_FAILED");
    });
    await assert.rejects(provider.download({ candidate: { sourceUrl: "https://youtu.be/abcdefghijk", originalAssetId: "abcdefghijk" } as any, temporaryDirectory: root }), (error: unknown) => error instanceof AssetProviderError && error.code === "YOUTUBE_DOWNLOAD_FAILED");
  } finally { await rm(root, { recursive: true, force: true }); }
});
