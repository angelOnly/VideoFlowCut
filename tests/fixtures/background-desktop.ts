import assert from "node:assert/strict";
import "../../plugins/videoflowcut/scripts/background-processes.mjs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { build } from "esbuild";
import { createApplication } from "@videocut/application";
import { createProjectSnapshot } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";
import { ThreadedRevisionRenderer } from "../../apps/render-worker/src/threaded-renderer.js";
import { inspectComposedFrames } from "../../apps/server/src/preview-inspection.js";

const temporaryRoot = resolve(".tmp");
await mkdir(temporaryRoot, { recursive: true });
const root = await mkdtemp(join(temporaryRoot, "background-desktop-"));
const app = createApplication(root);

try {
  // 使用与发行构建相同的 Node 打包方式，在隔离目录生成本次源码的 MCP 和渲染线程。
  const candidate = join(root, "candidate");
  await build({ entryPoints: { mcp: "apps/server/src/mcp.ts", "render-thread": "apps/render-worker/src/render-thread.ts" },
    outdir: candidate, outExtension: { ".js": ".cjs" }, bundle: true, format: "cjs", platform: "node",
    packages: "external", target: "node22", logLevel: "silent" });
  const source = join(root, "source.mp4");
  await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=96x72:rate=24:duration=1",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1", "-c:v", "libx264", "-preset", "ultrafast",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source]);
  const created = app.createProject({ name: "静默后台隔离验证" });
  const projectId = created.snapshot.project.id;
  const asset = app.registerImportedAsset({ projectId, baseRevision: created.revision.number, name: "source.mp4",
    kind: "video", managedPath: "assets/source/source.mp4", sourceHash: createHash("sha256").update(await readFile(source)).digest("hex") });
  const projectRoot = created.snapshot.project.rootPath;
  const managedSource = join(projectRoot, asset.asset.managedPath);
  await mkdir(dirname(managedSource), { recursive: true });
  await copyFile(source, managedSource);
  app.applyMediaAnalysis({ projectId, assetId: asset.asset.id, metadata: await probeMedia(managedSource) });

  const brief = join(root, "brief.md"), timing = join(root, "timing.md");
  await writeFile(brief, "隔离测试指令");
  await writeFile(timing, "隔离测试时间资料");
  const environment = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const transport = new StdioClientTransport({ command: process.execPath, args: [join(candidate, "mcp.cjs")],
    cwd: process.cwd(), env: { ...environment, VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  const client = new Client({ name: "background-desktop-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const inspectResult = await client.callTool({ name: "inspect_asset", arguments: {
      project_id: projectId, asset_id: asset.asset.id, mode: "overview", contact_sheet_frames: 4
    } });
    assert.equal(inspectResult.isError, undefined);
    const inspectContent = inspectResult.content as Array<{ type: string; text: string }>;
    const review = JSON.parse(inspectContent.find(item => item.type === "text")!.text);
    assert.equal(review.contactSheet.frames.length, 4);
    const image = join(projectRoot, review.contactSheet.frames[0].relativePath);
    const handoffResult = await client.callTool({ name: "prepare_motion_handoff", arguments: {
      project_id: projectId, base_revision_id: app.readProject(projectId).revision.number,
      brief_path: brief, timing_plan_path: timing, selected_scene_ids: ["scene"], scenes: [{ sceneId: "scene", status: "pending" }],
      assets: [{ id: asset.asset.id, path: managedSource, purpose: "素材审阅" }],
      references: [{ id: "frame", usage: "study", purpose: "画面参考", files: [{ path: image, deliveredPath: "references/frame.jpg" }] }]
    } });
    assert.equal(handoffResult.isError, undefined);
    const handoffContent = handoffResult.content as Array<{ type: string; text: string }>;
    const handoff = JSON.parse(handoffContent.find(item => item.type === "text")!.text);
    const manifest = JSON.parse(await readFile(handoff.manifestPath, "utf8"));
    assert.ok(manifest.files.some((file: { deliveredPath: string; localDecode?: string }) => file.deliveredPath.endsWith("source.mp4") && file.localDecode === "verified"));
    assert.ok(manifest.files.some((file: { deliveredPath: string; localDecode?: string }) => file.deliveredPath.endsWith("frame.jpg") && file.localDecode === "verified"));
  } finally {
    await transport.close();
  }

  const snapshot = createProjectSnapshot({ projectId: "silent-render-fixture", name: "静默渲染", rootPath: root });
  Object.assign(snapshot.timeline, { width: 96, height: 72, durationInFrames: 12 });
  const output = join(root, "render.mp4");
  const renderer = new ThreadedRevisionRenderer(() => new Worker(join(candidate, "render-thread.cjs"), {
    env: { ...process.env, VIDEOFLOWCUT_RUNTIME_DIST: candidate, VIDEOFLOWCUT_NODE_MODULES: resolve("node_modules") }
  }));
  try {
    await renderer.prepare();
    await renderer.render(snapshot, output);
  } finally {
    await renderer.close();
  }
  assert.ok((await stat(output)).size > 0);
  const frames = await inspectComposedFrames({ projectRoot: root, previewPath: output, revision: 1,
    fromFrame: 0, toFrame: 12, fps: snapshot.timeline.fps });
  assert.equal(frames.length, 3);
  assert.ok((await readFile(frames[0]!.path)).length > 0);

  // 复现 Worker 从后台 Node 入口启动 PowerShell，再执行 Python 与 FFprobe。
  const command = "& python -c 'print(123)'; & ffprobe -v error -version; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; [Console]::Error.WriteLine('test-error'); exit 0";
  const shell = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command]);
  let stdout = "", stderr = "";
  shell.stdout.on("data", chunk => { stdout += chunk; });
  shell.stderr.on("data", chunk => { stderr += chunk; });
  assert.equal((await once(shell, "close"))[0], 0);
  assert.match(stdout, /123/);
  assert.match(stdout, /ffprobe version/i);
  assert.match(stderr, /test-error/);
  const failed = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "exit 7"]);
  assert.equal((await once(failed, "close"))[0], 7);
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Seconds 20"]);
  await once(child, "spawn");
  const closed = once(child, "close");
  assert.equal(child.kill(), true);
  await closed;
  console.log("素材审阅、参考包、渲染、成片抽帧与后台命令验证通过");
} finally {
  app.close();
  await rm(root, { recursive: true, force: true });
}
