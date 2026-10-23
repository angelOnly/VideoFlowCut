import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApplication } from "@videocut/application";
import { runProcess, probeMedia } from "@videocut/speech";
import { runMotionJob } from "../../../../apps/render-worker/src/motion-job.js";
import { hashMotionFile } from "../../../../apps/render-worker/src/motion-video.js";
import { PNG } from "pngjs";
import { buildDemoSource, demoFps, demoFrames, demoWidth, demoHeight } from "./scene-source.js";

const output = dirname(fileURLToPath(import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), "vfc-presenter-method-demo-"));
const previous = process.env.VIDEOCUT_WORKSPACE;
process.env.VIDEOCUT_WORKSPACE = workspace;
const app = createApplication(workspace);
try {
  const project = app.createProject({ name: "六种人物制法隔离技术示范", profile: "presenter_motion" });
  const projectId = project.snapshot.project.id;
  const revision = () => app.readProject(projectId).revision.number;
  const sourcePath = join(project.snapshot.project.rootPath, "assets/source/clock.mp4");
  // 真实编码的视频包含运动、源帧号、源时间和测试音；不冒充真人或 LTX 输出。
  await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=240x240:r=15:d=20",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=20",
    "-vf", "drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='SOURCE F%{n}':x=14:y=82:fontsize=21:fontcolor=white:box=1:boxcolor=black,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='%{pts}':x=14:y=112:fontsize=17:fontcolor=white:box=1:boxcolor=black",
    "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", sourcePath]);
  await copyFile(sourcePath, join(output, "source-clock.mp4"));
  const asset = app.registerImportedAsset({ projectId, baseRevision: revision(), name: "运动与连续源时钟测试视频",
    kind: "video", managedPath: "assets/source/clock.mp4", sourceHash: await hashMotionFile(sourcePath) }).asset;
  app.applyMediaAnalysis({ projectId, assetId: asset.id, metadata: await probeMedia(sourcePath) });
  const source = buildDemoSource();
  await writeFile(join(output, "PresenterMethodsDemo.tsx"), source, "utf8");
  const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "six-methods-v1", work: {
    name: "六类人物制法技术示范", creativeBrief: "隔离开发验证：真实测试视频裁圆、纸片共同运动、分屏重排、设备内框、退出与当前源时钟返回。仅验证几何、绑定和完整动作，不代表真人审美或口型。",
    source, props: {}, imageBindings: {}, width: demoWidth, height: demoHeight, fps: demoFps, durationInFrames: demoFrames,
    videoBindings: { actor: { assetId: asset.id, sourceStartMs: 1000, sourceEndMs: 19000, startFrame: 0, endFrame: demoFrames } }
  } });
  console.log(JSON.stringify({ workspace, projectId, jobId: job.id, stage: "rendering" }));
  const result = await runMotionJob(app, job);
  app.updateJob(job.id, { status: "succeeded", result });
  const rendered = resolve(project.snapshot.project.rootPath, String(result.previewPath));
  await copyFile(rendered, join(output, "six-methods-silent.mp4"));
  // 管理动效输出本身静音；审阅版只附相同源区间测试音，不声称验证了人物口型。
  await runProcess("ffmpeg", ["-y", "-v", "error", "-i", rendered, "-ss", "1", "-i", sourcePath,
    "-map", "0:v:0", "-map", "1:a:0", "-t", "18", "-c:v", "copy", "-c:a", "aac", join(output, "six-methods.mp4")]);
  const keyframes = [0, 20, 40, 50, 70, 88, 95, 115, 133, 140, 160, 178, 185, 200, 223, 225, 237, 269];
  await mkdir(join(output, "keyframes"), { recursive: true });
  for (const frame of keyframes) {
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", rendered, "-vf", `select=eq(n\\,${frame})`, "-frames:v", "1",
      join(output, "keyframes", `frame-${String(frame).padStart(3, "0")}.png`)]);
  }
  await writeFile(join(output, "keyframes.txt"), keyframes.map(frame =>
    `file 'keyframes/frame-${String(frame).padStart(3, "0")}.png'`).join("\n") + "\n", "utf8");
  await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", join(output, "keyframes.txt"),
    "-vf", "scale=320:180,tile=3x6", "-frames:v", "1", join(output, "keyframes-contact.png")]);
  // 独立解码源当前帧与返回后窗口，像素比较能区分持续播放和从头重播。
  const errors: Array<{ frame: number; expectedSourceFrame: number; meanPixelError: number }> = [];
  for (const frame of [225, 237]) {
    const target = join(workspace, `expected-${frame}.png`);
    await runProcess("ffmpeg", ["-y", "-v", "error", "-i", sourcePath, "-vf", `select=eq(n\\,${frame + 15})`, "-frames:v", "1", target]);
    const expected = PNG.sync.read(await readFile(target));
    const actual = PNG.sync.read(await readFile(join(output, "keyframes", `frame-${frame}.png`)));
    let error = 0, count = 0;
    for (let y = 20; y < 220; y += 3) for (let x = 20; x < 220; x += 3) for (let c = 0; c < 3; c++) {
      error += Math.abs(actual.data[((y + 20) * demoWidth + x + 20) * 4 + c]! - expected.data[(y * 240 + x) * 4 + c]!);
      count++;
    }
    const meanPixelError = error / count;
    assert.ok(meanPixelError < 12, `人物返回 F${frame} 当前源帧误差 ${meanPixelError}`);
    errors.push({ frame, expectedSourceFrame: frame + 15, meanPixelError });
  }
  const metadata = await probeMedia(join(output, "six-methods.mp4"));
  assert.equal(metadata.width, demoWidth); assert.equal(metadata.height, demoHeight);
  assert.ok(Math.abs(metadata.durationMs! - 18000) < 150);
  const report = { description: "六类制法隔离技术验证；测试视频并非真人或 LTX 输出", workspace, projectId, jobId: job.id,
    sourcePath: "source-clock.mp4", outputPath: "six-methods.mp4", metadata, outputBytes: (await stat(join(output, "six-methods.mp4"))).size,
    sourceOffsetMs: 1000, keyframes, returnClockChecks: errors,
    methods: ["0–3 秒：裁圆头像缩小", "3–6 秒：视频纸片与附着标记共同变换", "6–9 秒：分屏空间重排",
      "9–12 秒：设备与内部视频共同变换", "12–15 秒：人物退出、材料接管", "15–18 秒：当前源时钟返回、主画面转小窗"],
    limits: ["测试图案不证明人脸取景、自然表演、真实口型或审美认可", "审阅音轨为 FFmpeg 附加测试音；动效产物原本静音", "没有调用 LTX、生产项目或运行队列"] };
  await writeFile(join(output, "verification.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report));
} finally {
  app.close();
  if (previous === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = previous;
}
