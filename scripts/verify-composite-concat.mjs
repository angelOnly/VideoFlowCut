// 只在独立工作区创建夹具；候选 MCP、API 与真实渲染线程共同验收打包后的合成链。
import assert from "node:assert/strict";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PNG } from "pngjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "../packages/edit-application/src/index.ts";
import { runProcess } from "../packages/speech-services/src/index.ts";
import { buildRenderPlan } from "../apps/render-worker/src/render-plan.ts";
import { runCandidateRuntime } from "../plugins/videoflowcut/scripts/candidate-runtime.mjs";

const repo = resolve(import.meta.dirname, ".."), output = resolve(process.argv[2]);
const workspace = join(output, "独立工作区_长目录_" + "abcdefghij".repeat(7)), port = 34104;
const options = ["--workspace", workspace, "--port", String(port), "--comfyui-bridge-url", "http://127.0.0.1:48188", "--repo-root", repo];
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(join(repo, "plugins/videoflowcut/runtime/dist/manifest.json"), "utf8"));
const app = createApplication(workspace);
let projectId, revision;
const expected = [];
try {
  let state = app.createProject({ name: "300段1080p候选发行隔离验证" });
  projectId = state.snapshot.project.id;
  const projectRoot = state.snapshot.project.rootPath;
  for (const [name, channel] of [["red", 0], ["blue", 2]]) {
    const png = new PNG({ width: 1920, height: 1080 });
    for (let i = 0; i < png.data.length; i += 4) { png.data[i+channel] = 255; png.data[i+3] = 255; }
    await writeFile(join(projectRoot, `assets/source/${name}.png`), PNG.sync.write(png));
  }
  await runProcess("ffmpeg", ["-v","error","-f","lavfi","-i","aevalsrc=0.125|0.125:s=48000:d=20","-c:a","pcm_f32le",join(projectRoot,"assets/source/audio.wav")]);
  state = app.repository.commit(projectId, state.revision.number, "独立技术夹具", snapshot => {
    snapshot.project.profile = "visual_explainer";
    snapshot.project.brief.captionMode = "none";
    Object.assign(snapshot.timeline, { width: 1920, height: 1080, fps: 30, durationInFrames: 600 });
    const now = new Date().toISOString();
    snapshot.assets.push(...["red", "blue"].map(name => ({ id: name, name, tags: [], kind: "image", status: "ready", managedPath: `assets/source/${name}.png`, createdAt: now, metadata: { width: 1920, height: 1080, hasAudio: false } })));
    snapshot.assets.push({ id: "sound", name: "声音夹具", tags: [], kind: "audio", status: "ready", managedPath: "assets/source/audio.wav", createdAt: now, metadata: { hasAudio: true, durationMs: 20_000 } });
    snapshot.timeline.tracks = [
      { id: "video", name: "Background", kind: "video", order: 0, hidden: false, muted: false, locked: false },
      { id: "audio", name: "BGM", kind: "audio", order: 1, hidden: false, muted: false, locked: false }
    ];
    let cursor = 0;
    snapshot.timeline.items = Array.from({ length: 300 }, (_, i) => {
      const startFrame = cursor, endFrame = cursor += i % 3 + 1;
      expected.push(...Array(endFrame-startFrame).fill(i%2 ? 2 : 0));
      return { id: `item-${i}`, assetId: i%2 ? "blue" : "red", trackId: "video", startFrame, endFrame, sourceStartFrame: 0, sourceEndFrame: endFrame-startFrame, disabled: false };
    });
    snapshot.timeline.items.push({ id: "audio-item", assetId: "sound", trackId: "audio", startFrame: 0, endFrame: 600, sourceStartFrame: 0, sourceEndFrame: 600, disabled: false });
  });
  state = app.createScene({ projectId, baseRevision: state.revision.number, type: "ExplainerScene", title: "候选混合", purpose: "真实浏览器接点", startFrame: 0, endFrame: 600 });
  const item = state.snapshot.timeline.items.find(i => i.id === "item-151");
  state = app.createEffectCue({ projectId, baseRevision: state.revision.number, sceneId: state.snapshot.scenes.at(-1).id, type: "CameraPunch", layer: "front", startFrame: item.startFrame, endFrame: item.endFrame, props: { scale: 1.05 } });
  const plan = buildRenderPlan(state.snapshot);
  assert.equal(plan.spans.length, 300); assert.equal(plan.spans.filter(s => s.kind === "browser").length, 1);
  revision = state.revision.number;
  await writeFile(join(output,"候选输入.json"), JSON.stringify({ workspace, port, bridgeUrl: "http://127.0.0.1:48188", projectId, revision, plan }, null, 2));
} finally { app.close(); }

const client = new Client({ name: "长分段候选发行验证", version: "1" });
let transport;
try {
  const runtime = await runCandidateRuntime("ensure", options);
  await writeFile(join(output,"候选Runtime.json"), JSON.stringify(runtime, null, 2));
  assert.equal(runtime.releaseId, manifest.releaseId); assert.ok(runtime.ready);
  transport = new StdioClientTransport({ command: process.execPath, args: [join(repo,"plugins/videoflowcut/scripts/mcp-launcher.mjs")], cwd: repo,
    env: { ...process.env, VIDEOCUT_WORKSPACE: workspace, VIDEOFLOWCUT_PORT: String(port), COMFYUI_BRIDGE_URL: "http://127.0.0.1:48188" }, stderr: "pipe" });
  transport.stderr?.on("data", d => process.stderr.write(d));
  await client.connect(transport);
  await writeFile(join(output,"候选工具目录.json"), JSON.stringify(await client.listTools(),null,2));
  const call = async (name, args = {}) => {
    const raw = await client.callTool({ name, arguments: args });
    await writeFile(join(output,`${name}.raw.json`), JSON.stringify(raw, null, 2));
    assert.notEqual(raw.isError, true, JSON.stringify(raw));
    return JSON.parse(raw.content.find(c => c.type === "text").text);
  };
  const status = await call("read_runtime_release");
  for (const id of [status.launcherReleaseId,status.mcpReleaseId,status.runtime.releaseId]) assert.equal(id, manifest.releaseId);
  assert.ok(status.aligned && status.runtime.workers.media && status.runtime.workers.render);
  const job = await call("render_preview_range", { project_id: projectId, revision, idempotency_key: "concat-candidate-300" });
  const started = Date.now();
  let current;
  while (true) {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs/${job.id}`); assert.ok(response.ok);
    current = await response.json();
    await writeFile(join(output,"候选Job.json"), JSON.stringify(current, null, 2));
    if (!["queued","running"].includes(current.status)) break;
    assert.ok(Date.now()-started < 10*60_000, "候选任务仍在进行，保留原 Job 供诊断，禁止重复提交");
    await new Promise(r => setTimeout(r, 3000));
  }
  assert.equal(current.status, "succeeded", JSON.stringify(current));
  assert.equal(current.result.frameCount, 600); assert.equal(current.result.fps, 30); assert.equal(current.result.hasAudio, true);
  const path = current.result.path;
  const report = JSON.parse(await readFile(`${path}.render-plan.json`,"utf8"));
  assert.equal(report.plan.spans.length,300); assert.equal(report.plan.renderer,"hybrid");
  const pixelsPath = join(output,"候选逐帧.rgb");
  await runProcess("ffmpeg",["-y","-v","error","-i",path,"-vf","scale=1:1","-pix_fmt","rgb24","-f","rawvideo",pixelsPath]);
  const pixels = await readFile(pixelsPath); assert.equal(pixels.length, 1800);
  expected.forEach((channel,i) => assert.ok(pixels[i*3+channel] > 240 && pixels[i*3+(channel===0?2:0)] < 12, `候选第${i}帧接点异常`));
  const audioPath = join(output,"候选声音.f32");
  await runProcess("ffmpeg",["-y","-v","error","-i",path,"-vn","-f","f32le",audioPath]);
  const samples = await readFile(audioPath);
  for (let frame=1;frame<599;frame++) assert.ok(Math.abs(samples.readFloatLE((frame*1600+800)*8)-.125)<.01, `候选第${frame}帧声音异常`);
  const probe = JSON.parse(await runProcess("ffprobe",["-v","error","-show_streams","-of","json",path]));
  assert.equal(probe.streams[0].width,1920); assert.equal(probe.streams[0].height,1080);
  await copyFile(path,join(output,"候选完整预览.mp4"));
  await copyFile(`${path}.render-plan.json`,join(output,"候选合成报告.json"));
  await writeFile(join(output,"候选验证结果.json"),JSON.stringify({ passed: true, pluginVersion:manifest.pluginVersion, releaseId:manifest.releaseId, runtime:status, projectId, revision, jobId:job.id, spans:300, mediaSpans:299, realBrowserSpans:1, frames:600, fps:30, width:1920, height:1080, everyFrameVerified:true, audioFramesVerified:598, elapsedMs:Date.now()-started, probe },null,2));
  console.log(JSON.stringify({ passed:true, releaseId:manifest.releaseId, jobId:job.id, spans:300, elapsedMs:Date.now()-started }));
} finally {
  await client.close(); await transport?.close();
  await writeFile(join(output,"候选停止.json"),JSON.stringify(await runCandidateRuntime("stop",options),null,2));
}
