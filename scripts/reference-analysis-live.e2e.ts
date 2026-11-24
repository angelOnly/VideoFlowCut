import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import puppeteer from "puppeteer-core";
import type { Page } from "puppeteer-core";
import { createServer } from "../apps/server/src/app.js";
import { runWorkerForever } from "../apps/job-worker/src/index.js";
import { resolveRenderBrowser } from "../packages/remotion-runtime/src/browser.js";

/** 独立真实链路：工作区和 ComfyUI 队列必须由调用者提供，失败保留原 Job 与日志。 */
const [workspaceArgument, bridgeArgument, runtimeArgument, distributionArgument] = process.argv.slice(2);
assert.ok(workspaceArgument && bridgeArgument, "用法：tsx scripts/reference-analysis-live.e2e.ts <隔离目录> <隔离 Bridge v2 地址> [候选 Runtime 地址 候选 dist]");
assert.equal(Boolean(runtimeArgument), Boolean(distributionArgument), "候选 Runtime 地址和发行目录必须同时提供");
const workspace = resolve(workspaceArgument), bridgeUrl = new URL(bridgeArgument);
assert.notEqual(bridgeUrl.port, "8188", "不能使用生产 ComfyUI 队列");
assert.ok(["127.0.0.1", "localhost"].includes(bridgeUrl.hostname), "验收使用本机独立 Bridge");
assert.ok(workspace.includes(".candidate") || workspace.toLowerCase().includes("temp"), "验收工作区必须位于候选或临时目录");
await mkdir(workspace, { recursive: true });
const tracePath = join(workspace, "reference-analysis-trace.json");
// 每次验收使用新的隔离目录；保留原请求与回执供未知状态对账。
await writeFile(tracePath, "{}\n", { flag: "wx" });
process.env.COMFYUI_BRIDGE_URL = bridgeUrl.href.replace(/\/$/u, "");
const health = await fetch(`${process.env.COMFYUI_BRIDGE_URL}/health`).then(response => response.json()) as { status?: string; workflowCount?: number };
assert.equal(health.status, "ready");
assert.ok(health.workflowCount, "隔离 Bridge 没有可用工作流");
let localServer: Awaited<ReturnType<typeof createServer>> | undefined;
let origin: string;
const abort = new AbortController();
let worker: Promise<void> | undefined;
let releaseId: string | undefined;
if (runtimeArgument && distributionArgument) {
  const runtime = new URL(runtimeArgument);
  assert.ok(["127.0.0.1", "localhost"].includes(runtime.hostname) && runtime.port !== "3100", "候选 Runtime 必须使用本机独立端口");
  origin = runtime.origin;
  const status = await fetch(`${origin}/api/runtime/status`).then(response => response.json()) as { status: string; releaseId: string; workers: { media: boolean } };
  const manifest = JSON.parse(await readFile(join(resolve(distributionArgument), "manifest.json"), "utf8"));
  assert.equal(status.status, "ready"); assert.equal(status.workers.media, true); assert.equal(status.releaseId, manifest.releaseId);
  releaseId = status.releaseId;
} else {
  localServer = await createServer({ workspaceRoot: workspace });
  origin = await localServer.app.listen({ host: "127.0.0.1", port: 0 });
  worker = runWorkerForever(localServer.application, abort.signal);
}
const client = new Client({ name: "参考分析独立验收", version: "1" });
const transport = new StdioClientTransport({ command: process.execPath, args: distributionArgument ? [join(resolve(distributionArgument), "mcp.cjs")] : ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(), stderr: "pipe",
  env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
    VIDEOCUT_WORKSPACE: workspace, WEB_ORIGIN: origin, VIDEOFLOWCUT_RUNTIME_ORIGIN: origin, COMFYUI_BRIDGE_URL: process.env.COMFYUI_BRIDGE_URL,
    ...(distributionArgument ? { NODE_PATH: resolve("node_modules"), VIDEOFLOWCUT_RUNTIME_DIST: resolve(distributionArgument), VIDEOFLOWCUT_RELEASE_ID: releaseId! } : {}) } });
const trace: Array<Record<string, unknown>> = [];
const save = () => writeFile(tracePath, JSON.stringify({ origin, bridge: bridgeUrl.href, trace }, null, 2));
const call = async (name: string, args: Record<string, unknown>) => {
  const entry: Record<string, unknown> = { name, args, state: "submitted" };
  trace.push(entry); await save();
  const response = await client.callTool({ name, arguments: args });
  entry.state = response.isError ? "failed" : "returned";
  const text = (response.content as Array<{ type: string; text?: string }>).find(part => part.type === "text");
  const value = text?.text ? JSON.parse(text.text) : undefined;
  entry.result = value; await save();
  assert.notEqual(response.isError, true, `${name}: ${JSON.stringify(value)}`);
  return value as any;
};
let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
try {
  await client.connect(transport);
  const project = await call("create_project", { name: "参考分析隔离验收" });
  const projectId = project.snapshot.project.id as string;
  browser = await puppeteer.launch({ executablePath: await resolveRenderBrowser(), headless: true, pipe: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  const cases = [
    { id: "026-m07", startMs: 10083, endMs: 22017 }, { id: "032-m09", startMs: 3875, endMs: 11750 },
    { id: "130-c01", startMs: 0, endMs: 10500 }, { id: "016-c01", startMs: 0, endMs: 15000 }
  ];
  for (const item of cases) {
    const motion = item.id.includes("-m"), range = { startMs: item.startMs, endMs: item.endMs };
    const search = await call(motion ? "search_motion_mechanisms" : "search_creative_cases", { ids: [item.id] });
    assert.ok(search.cards.some((card: { id: string }) => card.id === item.id));
    const card = await call(motion ? "read_motion_mechanism" : "read_creative_case", { id: item.id, source_sha256: search.source_sha256, range, include_storyboard: false });
    assert.equal(new URL(card.preview_url).origin, origin);
    if (motion) {
      const frames = await call("inspect_motion_reference_frames", { id: item.id, source_sha256: card.source_sha256,
        range: { startMs: item.startMs, endMs: Math.min(item.endMs, item.startMs + 200) } });
      assert.ok(frames.frame_count > 1 && frames.first_source_ms <= item.startMs);
    }
    const page: Page = await browser.newPage();
    await page.goto(card.preview_url, { waitUntil: "domcontentloaded" });
    const selector = motion ? "#segments video" : ".creative-card video";
    await page.waitForSelector(selector);
    await page.waitForFunction((target: string) => document.querySelector<HTMLVideoElement>(target)!.readyState >= 2, {}, selector);
    const playback: { first: number; afterSeek: number; source: string; duration: number; pixelRange: number; readyState: number } = await page.$eval(selector, async (video: HTMLVideoElement) => {
      video.muted = true; await video.play();
      await new Promise(resolve => setTimeout(resolve, 1200));
      const first = video.currentTime; video.currentTime = Math.min(video.duration - 0.1, first + 0.5);
      await new Promise<void>((resolve, reject) => { video.addEventListener("seeked", () => resolve(), { once: true }); setTimeout(() => reject(new Error("拖动视频超时")), 5000); });
      const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 36;
      const context = canvas.getContext("2d")!; context.drawImage(video, 0, 0, 64, 36);
      const pixels = context.getImageData(0, 0, 64, 36).data;
      const values = Array.from({ length: pixels.length / 4 }, (_, i) => pixels[i * 4]!);
      return { first, afterSeek: video.currentTime, source: video.currentSrc, duration: video.duration,
        pixelRange: Math.max(...values) - Math.min(...values), readyState: video.readyState };
    });
    assert.ok(playback.first > 0 && playback.afterSeek > playback.first && playback.pixelRange > 3, JSON.stringify(playback));
    const rangeResponse: Response = await fetch(playback.source, { headers: { range: "bytes=0-99" } });
    assert.equal(rangeResponse.status, 206);
    trace.push({ name: "browser", id: item.id, ...playback, rangeStatus: rangeResponse.status }); await save();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(selector);
    await page.waitForFunction((target: string) => document.querySelector<HTMLVideoElement>(target)!.readyState >= 2, {}, selector);
    assert.equal(new URL(page.url()).searchParams.get("startMs"), String(range.startMs));
    assert.equal(new URL(page.url()).searchParams.get("endMs"), String(range.endMs));
    if (item.id === "016-c01") {
      const tail = await page.$eval(selector, async (video: HTMLVideoElement) => {
        video.currentTime = 15; video.muted = false;
        await video.play();
        await new Promise<void>((resolve, reject) => { video.addEventListener("ended", () => resolve(), { once: true }); setTimeout(() => reject(new Error("尾音播放超时")), 5000); });
        return { duration: video.duration, endedAt: video.currentTime };
      });
      assert.ok(tail.duration >= 15.06 && tail.endedAt >= 15.06, JSON.stringify(tail));
      trace.push({ name: "original-audio-tail", id: item.id, ...tail }); await save();
    }
    await page.close();
    const submitted = await call("analyze_motion_reference", { project_id: projectId, id: item.id, source_sha256: card.source_sha256, range, mode: "audiovisual", observation_questions: ["描述主体、文字、背景和运动的关系"] });
    console.log(`已提交 ${item.id}：${submitted.id}`);
    const deadline = Date.now() + 900_000;
    let job: any;
    do {
      await new Promise(done => setTimeout(done, 3000));
      job = await call("track_job", { job_id: submitted.id });
      if (["failed", "unknown", "cancelled"].includes(job.status)) throw new Error(`参考分析未成功：${JSON.stringify(job)}`);
    } while (job.status !== "succeeded" && Date.now() < deadline);
    assert.equal(job.status, "succeeded", `超时后保留原 Job：${submitted.id}`);
    assert.equal(job.result.sampling.model_frame_density, "one_per_second", "必须获得结构化采样回执");
    assert.equal(job.result.input.mapping.preprocessing, "reference-source-pts-v2");
    assert.deepEqual(job.result.range, range);
    if (item.id === "016-c01") {
      assert.ok(job.result.input.source_audio_coverage.source_end_ms >= 15060.5);
      const tooLong = await client.callTool({ name: "analyze_motion_reference", arguments: { project_id: projectId, id: item.id,
        source_sha256: card.source_sha256, range: { startMs: 0, endMs: 15061 }, mode: "audiovisual" } });
      assert.equal(tooLong.isError, true, "单次分析必须拒绝超过 15 秒");
      trace.push({ name: "maximum-window", id: item.id, rejected: true }); await save();
    }
    console.log(`已完成 ${item.id}：${job.result.run_id}`);
  }
  for (const media of ["/teaching/r40/R40完整预览.mp4", "/teaching/airfare/preview.mp4"]) {
    const response = await fetch(new URL(media, origin), { headers: { range: "bytes=0-99" } });
    assert.equal(response.status, 206);
    const page: Page = await browser.newPage();
    await page.goto(origin);
    const played = await page.evaluate(async (url: string) => {
      const video = document.createElement("video"); video.src = url; video.muted = true; document.body.append(video);
      await video.play(); await new Promise(resolve => setTimeout(resolve, 1000));
      return { time: video.currentTime, readyState: video.readyState, duration: video.duration };
    }, new URL(media, origin).href);
    assert.ok(played.time > 0 && played.readyState >= 2, JSON.stringify(played));
    await page.close();
    trace.push({ name: "teaching-range", media, status: response.status, ...played });
  }
  await save();
  console.log(`隔离链路完成：${tracePath}`);
} finally {
  await browser?.close(); await client.close().catch(() => undefined);
  if (localServer) { abort.abort(); await worker; await localServer.app.close(); localServer.application.close(); }
  await save();
}
