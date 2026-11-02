import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runProcess } from "@videocut/speech";
import { readRuntimeConfig } from "@videocut/project-overview";
import { renderManagedMotion, verifyMotionPreviewFrames } from "../apps/render-worker/src/motion-renderer.js";
import { MotionDiagnostics } from "../apps/render-worker/src/motion-diagnostics.js";
import { hashMotionFile, prepareMotionVideos } from "../apps/render-worker/src/motion-video.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { frameHtml, sizeMotionFixture } from "./fixtures/hyperframes.js";

async function decodedFrames(path: string, root: string, name: string, width: number, height: number) {
  const raw = join(root, `${name}.rgba`);
  await runProcess("ffmpeg", ["-y", "-v", "error", "-i", path, "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgba", raw]);
  const bytes = await readFile(raw), stride = width * height * 4;
  assert.equal(bytes.length % stride, 0);
  return Array.from({ length: bytes.length / stride }, (_, frame) => bytes.subarray(frame * stride, (frame + 1) * stride));
}

test("运行配置默认两路，部署可明确选择单路或四路", () => {
  assert.equal(readRuntimeConfig({ environment: {} }).motion.renderConcurrency, 2);
  for (const value of ["1", "2", "4"]) assert.equal(readRuntimeConfig({ environment: { VIDEOFLOWCUT_MOTION_RENDER_CONCURRENCY: value } }).motion.renderConcurrency, Number(value));
  assert.throws(() => readRuntimeConfig({ environment: { VIDEOFLOWCUT_MOTION_RENDER_CONCURRENCY: "3" } }), /必须为 1、2 或 4/u);
});

test("1/2/4 路共享唯一视频 Provider，局部根时钟、透明像素、接点与完整事件一致", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-concurrency-"));
  let provider: Awaited<ReturnType<typeof prepareMotionVideos>> | undefined;
  try {
    const path = join(root, "source.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=30:d=1", "-c:v", "libx264", path]);
    const binding = { assetId: "source", sourceStartMs: 0, sourceEndMs: 534, startFrame: 0, endFrame: 16 };
    const source = frameHtml('<img id="footage" data-vfc-video-slot="footage" style="position:absolute;left:0;top:0;width:64px;height:64px;opacity:.7"><div id="a" style="position:absolute;top:12px;width:12px;height:16px;background:#ffba25;opacity:.5"></div>', "document.querySelector('#a').style.left=(f*3)+'px';", "window.getVfcMotionEvents=()=>[{id:'crossing',meaning:'全作品根时钟事件',startFrame:7,endFrame:14}];");
    const work = sizeMotionFixture({ ...motionFixture, source, width: 64, height: 64, durationInFrames: 16, videoBindings: { footage: binding } });
    provider = await prepareMotionVideos(root, join(root, "decode"), work, [{ ...binding, slot: "footage", managedPath: "source.mp4", hash: await hashMotionFile(path) }]);
    let expected: string[] | undefined;
    for (const concurrency of [1, 2, 4] as const) {
      const directory = join(root, `render-${concurrency}`);
      const diagnostics = new MotionDiagnostics({});
      const result = await renderManagedMotion(work, directory, {}, provider, undefined, [], diagnostics, { startFrame: 3, endFrame: 16 }, undefined, { concurrency });
      const frames = await decodedFrames(result.output.path, root, `decoded-${concurrency}`, 64, 64);
      const hashes = frames.map(frame => createHash("sha256").update(frame).digest("hex"));
      assert.deepEqual(hashes, result.frameHashes, "拼接媒体逐帧等于实际截图，接点不丢不重");
      if (expected) assert.deepEqual(hashes, expected); else expected = hashes;
      assert.equal(hashes.length, 13);
      assert.equal(result.events?.length, 1, "事件表不得按分路重复追加");
      assert.equal(result.events?.[0]?.startFrame, 7);
      assert.equal(result.metrics?.concurrency, concurrency);
      assert.equal(diagnostics.summary().completedFrames, 13);
      await verifyMotionPreviewFrames(result.previewPath, 13, 30);
      assert.equal((await readdir(directory)).some(name => name.startsWith(".motion-lanes-")), false);
      assert.ok((await provider.getFrame("footage", 5)).length > 0, "分路不能关闭共享 Provider");
    }
  } finally { await provider?.close(); await rm(root, { recursive: true, force: true }); }
});

test("非整秒 opaque 分路拼接保持帧序与尾帧，失败取消其他分路且不留下正式输出", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-opaque-concurrency-"));
  try {
    const source = frameHtml('<div id="a" style="position:absolute;inset:0"></div>', "document.querySelector('#a').style.background='rgb('+(f*12)+',40,80)';");
    const work = sizeMotionFixture({ ...motionFixture, source, compositing: "opaque" as const, width: 64, height: 64, durationInFrames: 17 });
    const result = await renderManagedMotion(work, join(root, "opaque"), {}, undefined, undefined, [], undefined, undefined, undefined, { concurrency: 4 });
    const frames = await decodedFrames(result.output.path, root, "opaque-decoded", 64, 64);
    assert.equal(frames.length, 17);
    for (let frame = 0; frame < frames.length; frame++) assert.ok(Math.abs(frames[frame]![0]! - frame * 12) <= 4, `第 ${frame} 帧不得被接点重复或跳过`);
    const failure = join(root, "failure"), diagnostics = new MotionDiagnostics({});
    await assert.rejects(renderManagedMotion({ ...work, source: work.source.replace("document.querySelector('#a').style.background=", "document.querySelector('#a').style.opacity=f===12?'0.5':'1';document.querySelector('#a').style.background=") }, failure, {}, undefined, undefined, [], diagnostics, undefined, undefined, { concurrency: 4 }), /MOTION_OPACITY_MISMATCH: 第 12 帧/u);
    const names = await readdir(failure);
    assert.equal(names.includes("output.mp4"), false);
    assert.equal(names.some(name => name.startsWith(".motion-lanes-")), false);
    const lanes = diagnostics.summary().lanes as Record<string, unknown>[];
    assert.equal(lanes.length, 4);
    assert.ok(lanes.every(lane => lane.terminationRequestedBy), "所有已启动分路都完成退出处理");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("接点复算拒绝把首次访问帧当作动画起点的副作用，不静默退回单路", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-stateful-lanes-"));
  try {
    const source = frameHtml('<div id="a" style="position:absolute;inset:0"></div>', "if(f>0&&origin===undefined)origin=f;document.querySelector('#a').style.background='rgb('+((origin??1)*15)+',40,80)';", "let origin;");
    const work = sizeMotionFixture({ ...motionFixture, source, width: 64, height: 64, durationInFrames: 17 });
    await renderManagedMotion(work, join(root, "single"), {}, undefined, undefined, [], undefined, undefined, undefined, { concurrency: 1 });
    const directory = join(root, "parallel");
    await assert.rejects(renderManagedMotion(work, directory, {}, undefined, undefined, [], undefined, undefined, undefined, { concurrency: 4 }), /MOTION_NONDETERMINISTIC/u);
    const report = JSON.parse(await readFile(join(directory, "diagnostics", "report.json"), "utf8"));
    assert.equal(report.status, "failed");
    assert.ok(report.differences.some((difference: { frame: number }) => difference.frame === 4));
    await readFile(join(directory, "diagnostics", report.differences[0].paths.diff));
    await assert.rejects(readFile(join(directory, "output.mkv")));
  } finally { await rm(root, { recursive: true, force: true }); }
});
