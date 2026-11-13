import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { createApplication } from "@videocut/application";
import { AssetProviderRegistry } from "@videocut/acquisition";
import { runProcess } from "@videocut/speech";
import type { MediaObservation, MediaSource } from "@videocut/contracts";
import { YoutubeProvider } from "../packages/asset-acquisition/src/youtube.js";
import { createMediaJobProcessor, runOneJob } from "../apps/job-worker/src/index.js";
import { runMotionAuthoringJob } from "../apps/runtime/src/motion-authoring.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";

test("升级后只解除旧时长自动拒绝，人工与类型拒绝保持", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-duration-upgrade-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "旧候选迁移" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const request = app.manageAssetRequirement({ projectId, baseRevision: rev(), action: "create", title: "完整动作", purpose: "按实际内容选段", visualBrief: "主体可见", minDurationMs: 5000 }).snapshot.assetRequests[0];
    app.recordAssetSearch({ projectId, baseRevision: rev(), assetRequestId: request.id, provider: "youtube", query: "旧候选", candidates: [
      { originalAssetId: "abcdefghijk", name: "短片", kind: "video", sourceUrl: "https://youtu.be/abcdefghijk", durationMs: 2000 },
      { originalAssetId: "mnopqrstuvw", name: "人工拒绝", kind: "video", sourceUrl: "https://youtu.be/mnopqrstuvw" },
      { originalAssetId: "audio", name: "类型错误", kind: "audio", sourceUrl: "https://example.org/audio" }
    ] });
    const old = app.repository.mediaIntelligence.searches(projectId)[0];
    old.id = "legacy-search"; old.resultFormatVersion = 3;
    for (const c of old.candidates) { c.filterReasons.push("时长不足 5 秒。"); c.hardFilterPassed = false; c.status = "rejected"; c.rejectionReason = c.filterReasons.join(" "); }
    old.candidates[1].rejectionReason = "主体不符，不采用";
    app.repository.mediaIntelligence.saveSearch(old);
    assert.equal(app.readAssetCandidate({ projectId, assetCandidateId: old.candidates[0].id }).candidate.status, "available");
    const job = app.acquireAssetCandidate({ projectId, baseRevision: rev(), assetCandidateId: old.candidates[0].id });
    assert.equal(job.job.status, "queued");
    for (const c of old.candidates.slice(1)) assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: rev(), assetCandidateId: c.id }), /可用|技术|画质/);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("范围获取保留时间对应和既有观察，分析纠错不影响原文件使用", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-range-evidence-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "在线选段延续", profile: "visual_explainer" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const fixture = join(root, "fixture.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=24:d=2", "-c:v", "libx264", fixture]);
    const request = app.manageAssetRequirement({ projectId, baseRevision: rev(), action: "create", title: "已定位动作", purpose: "直接延续线上选段", visualBrief: "动作范围已观察" }).snapshot.assetRequests[0];
    const provider = new YoutubeProvider(async (args, options) => {
      if (!options.directory) return JSON.stringify({ id: "abcdefghijk", title: "缺省时长的长视频" });
      assert.equal(args[args.indexOf("--download-sections") + 1], "*10-12");
      assert.ok(args.includes("--force-keyframes-at-cuts"));
      assert.equal(args[args.indexOf("-S") + 1], "res:2160,proto:m3u8");
      assert.ok(!args.includes("--max-filesize"), "范围取得不能用整片预计大小作准入限制");
      await copyFile(fixture, join(options.directory, "source.mp4"));
      return "";
    });
    const candidate = app.recordAssetSearch({ projectId, baseRevision: rev(), assetRequestId: request.id, provider: "youtube", query: "https://youtu.be/abcdefghijk", candidates: await provider.search({ request, query: "https://youtu.be/abcdefghijk" }) }).candidates[0];
    assert.equal(candidate.durationMs, undefined);
    const source: MediaSource = { id: "online-source", projectId, target: { candidateId: candidate.id }, identity: "preview", hash: "online-original-encoding", path: fixture, kind: "video", durationMs: 2000, hasAudio: false, streams: [], createdAt: new Date().toISOString() };
    const observation: MediaObservation = { id: "observed-action", projectId, sourceId: source.id, sourceHash: source.hash, range: { startMs: 0, endMs: 2000 }, depth: "review", modalities: ["visual"],
      facts: [{ modality: "visual", text: "夹具动作持续变化", range: { startMs: 0, endMs: 2000 }, basis: "human", precision: "reviewed", keywords: ["动作"] }], unknowns: ["原声没有观察"], context: "已选动作与下一镜接续", rawText: "测试夹具观察", version: { workflowId: "fixture", schemaVersion: "1", model: "fixture", prompt: "fixture", preprocessing: "fixture" }, jobId: "fixture", createdAt: source.createdAt };
    app.repository.mediaIntelligence.saveSource(source); app.repository.mediaIntelligence.saveObservation(observation);
    const options = { qualityHeight: 2160, sourceRange: { startMs: 10000, endMs: 12000 } };
    const queued = app.acquireAssetCandidate({ projectId, baseRevision: rev(), assetCandidateId: candidate.id, options });
    assert.equal(app.acquireAssetCandidate({ projectId, baseRevision: 1, assetCandidateId: candidate.id, options }).job.id, queued.job.id);
    const beforeConflict = rev();
    assert.throws(() => app.acquireAssetCandidate({ projectId, baseRevision: rev(), assetCandidateId: candidate.id, options: { ...options, sourceRange: { startMs: 12000, endMs: 14000 } } }), /未结束/);
    assert.equal(rev(), beforeConflict);
    const processor = createMediaJobProcessor(app, undefined, new AssetProviderRegistry([provider]));
    await runOneJob(app, processor);
    const completed = app.trackJob(queued.job.id);
    assert.equal(completed.status, "succeeded", completed.error);
    const asset = app.readProject(projectId).snapshot.assets[0];
    assert.equal(asset.status, "ready"); assert.equal(asset.metadata?.durationMs, 2000);
    assert.deepEqual(asset.provenance?.acquisition?.sourceRange, options.sourceRange);
    assert.deepEqual(completed.result?.localRange, { startMs: 0, endMs: 2000 });
    assert.deepEqual(completed.result?.observations, [observation]);
    // 实际获取的 Asset、源范围和项目读回继续进入制作交付，不以候选 ID 代替。
    const targetScene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "交付目标", purpose: "验证完整交付", startFrame: 0, endFrame: 24 }).snapshot.scenes[0];
    const previewJob = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "source-preview", work: { ...motionFixture, durationInFrames: 24,
      source: motionHtml('<img id="subject" data-vfc-video-slot="subject" style="width:64px;height:64px">', "", { durationInFrames: 24 }),
      videoBindings: { subject: { assetId: asset.id, sourceStartMs: 100, sourceEndMs: 900, startFrame: 0, endFrame: 24 } } } });
    const preview = app.completeSourceMotionWork(projectId, previewJob.id);
    const state = app.readProject(projectId), snapshotPath = join(root, "project-readback.json"), brief = join(root, "brief.md"), timing = join(root, "timing.md");
    await writeFile(snapshotPath, JSON.stringify(state)); await writeFile(brief, "完整画面编排"); await writeFile(timing, "真实时间资料");
    const inputPath = join(root, "package-input.json"), output = join(root, "package");
    await writeFile(inputPath, JSON.stringify({ projectId, revision: state.revision.number, projectSnapshot: snapshotPath, brief, timingPlan: timing,
      assets: [{ id: asset.id, path: join(state.snapshot.project.rootPath, asset.managedPath), purpose: "展示实际动作" }],
      scenes: [{ sceneId: targetScene.id, status: "ready", visualRoles: [{ role: "主体", referenceFunction: "动作接力", assetIds: [asset.id],
        sourceRanges: [{ startMs: 100, endMs: 1500 }], usage: "展示已获取的主体动作" }],
        visualPlan: { status: "previewed", primaryRoles: ["主体"], preview: { workId: preview.id, startFrame: 0, endFrame: 24 } },
        process: "主体进入、动作发展后接入下一画面", preserve: ["动作连续"], adapt: ["中文排版"] }] }));
    execFileSync(process.execPath, ["scripts/opendesign-reference-package.mjs", "prepare", inputPath, output]);
    const delivery = JSON.parse(await readFile(join(output, "delivery-manifest.json"), "utf8"));
    assert.equal(delivery.scenes[0].status, "ready");
    const mapped = delivery.scenes[0].visualRoles[0].assets[0];
    assert.equal(mapped.assetId, asset.id); assert.equal(mapped.sourceHash, asset.sourceHash);
    assert.deepEqual(mapped.sourceRanges[0], { startMs: 100, endMs: 1500, timeCoordinates: "asset", originalStartMs: 10100, originalEndMs: 11500 });
    const listingPath = join(root, "od-listing.json"), checkPath = join(root, "od-check.json");
    await writeFile(listingPath, JSON.stringify({ files: delivery.files.map((file: { deliveredPath: string }) => ({ path: file.deliveredPath, localPath: join(output, file.deliveredPath) })) }));
    await writeFile(checkPath, JSON.stringify({ revision: state.revision.number, odProjectId: "isolated-od" }));
    execFileSync(process.execPath, ["scripts/opendesign-reference-package.mjs", "verify", join(output, "delivery-manifest.json"), listingPath, checkPath]);
    const prompt = (await readFile(join(output, "start-run-prompt.md"), "utf8")).trimEnd();
    assert.match(prompt, /展示已获取的主体动作/);
    let receivedPrompt = "";
    const od = createServer((req, res) => {
      if (req.method === "POST" && req.url === "/api/runs") {
        let body = ""; req.setEncoding("utf8"); req.on("data", part => { body += part; });
        req.on("end", () => { receivedPrompt = JSON.parse(body).message; res.end(JSON.stringify({ runId: "isolated-run" })); }); return;
      }
      if (req.url?.includes("/events")) { res.setHeader("content-type", "text/event-stream"); res.end(); return; }
      if (req.url === "/api/runs/isolated-run") { res.end(JSON.stringify({ status: "succeeded" })); return; }
      res.statusCode = 404; res.end();
    });
    await new Promise<void>(resolve => od.listen(0, "127.0.0.1", resolve));
    try {
      const job = await app.startMotionAuthoring({ projectId, baseRevision: state.revision.number, intent: "local_edit", idempotencyKey: "isolated-package",
        target: { action: "create_cue", sceneId: targetScene.id, layer: "fullscreen", startFrame: 0, endFrame: 24,
          sourceStartFrame: 0, sourceEndFrame: 24, audioPolicy: "rebind_unchanged_events" },
        openDesignRequest: { project: "isolated-od", prompt } });
      const endpoint = { url: `http://127.0.0.1:${(od.address() as { port: number }).port}` };
      await runMotionAuthoringJob(app, job, new AbortController().signal, endpoint);
      assert.equal(receivedPrompt, prompt);
      assert.match(receivedPrompt, /brief\/scenes\.json/);
    } finally { await new Promise<void>(resolve => od.close(() => resolve())); }
    const read = app.intelligence.inspect(projectId, { assetId: asset.id });
    assert.equal(read.candidateEvidence[0].observations[0].context, observation.context);
    assert.equal(app.readAssetCandidate({ projectId, assetCandidateId: candidate.id }).candidate.durationMs, undefined, "不能用片段长度覆盖原片未知长度");
    const beforeCorrection = rev();
    assert.deepEqual(app.repository.mediaIntelligence.observation(projectId, observation.id), observation, "不得伪造本地观察替换原证据");
    app.intelligence.correct(projectId, { observationId: observation.id, facts: observation.facts, unknowns: ["原声未知"], reason: "测试纠错后需要重新确认当前用途", author: "测试", baseRevision: rev() });
    assert.equal(rev(), beforeCorrection);
    assert.equal(app.readProject(projectId).snapshot.mediaAdoptions?.length ?? 0, 0);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("范围返回整文件或残片时获取失败，不登记错误的源时间", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-range-invalid-")); const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "时间错位拒绝" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const fixture = join(root, "fixture.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=s=64x64:r=24:d=1", "-c:v", "libx264", fixture]);
    const request = app.manageAssetRequirement({ projectId, baseRevision: rev(), action: "create", title: "三秒动作", purpose: "测试范围", visualBrief: "持续变化" }).snapshot.assetRequests[0];
    const candidate = app.recordAssetSearch({ projectId, baseRevision: rev(), assetRequestId: request.id, provider: "youtube", query: "range-invalid", candidates: [{ originalAssetId: "abcdefghijk", name: "源", kind: "video", sourceUrl: "https://youtu.be/abcdefghijk" }] }).candidates[0];
    const provider = new YoutubeProvider(async (_args, options) => { await copyFile(fixture, join(options.directory!, "source.mp4")); return ""; });
    const queued = app.acquireAssetCandidate({ projectId, baseRevision: rev(), assetCandidateId: candidate.id, options: { sourceRange: { startMs: 1000, endMs: 4000 } } });
    await runOneJob(app, createMediaJobProcessor(app, undefined, new AssetProviderRegistry([provider])));
    assert.equal(app.trackJob(queued.job.id).status, "failed");
    assert.match(app.trackJob(queued.job.id).error ?? "", /范围不一致/);
    assert.equal(app.readProject(projectId).snapshot.assets.length, 0);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
