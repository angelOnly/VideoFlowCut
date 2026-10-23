import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { transformSync } from "esbuild";
import { readPresenterReference } from "../docs/development/presenter-creation-20261020/composition-demo/reference-source.js";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { runProcess, probeMedia } from "@videocut/speech";
import { hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";

// 运行参考原文的函数，避免在测试中抄一套几何实现再测试自己。
const source = readPresenterReference().replace(/^import .*;$/gmu, "");
const javascript = transformSync(source, { loader: "tsx", jsx: "transform" }).code;
const methods = new Function("React", "TimelineVideo", `${javascript};return {sourcePlane,blendBox,PresenterWindow,PaperPresenter,SplitPresenter,EmbeddedPresenter};`)(React, "test-video");
const actor = { slot: "actor", source: { width: 1920, height: 1080 }, crop: { x: .25, y: .1, width: .5, height: .8 } };
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-7);

test("参考制法先取景再 cover：裁点居中、源等比缩放且不露底", () => {
  const box = { x: 45, y: 30, width: 150, height: 150 };
  const plane = methods.sourcePlane(actor.source, box, actor.crop);
  near(plane.width / 1920, plane.height / 1080);
  near(plane.x + (.25 + .5 / 2) * plane.width, 75);
  near(plane.y + (.1 + .8 / 2) * plane.height, 75);
  assert.ok(.5 * plane.width >= 150 && .8 * plane.height >= 150);
  assert.throws(() => methods.sourcePlane(actor.source, box, { ...actor.crop, x: .8 }), /取景范围无效/u);
  const window = methods.PresenterWindow({ ...actor, box, radius: "50%" });
  assert.equal(window.props.style.borderRadius, "50%");
  assert.equal(window.props.children.props.children.props.slot, "actor");
});

test("纸片和设备的外框、视频、附着标记共用父变换；屏幕仍在局部坐标", () => {
  const box = { x: 80, y: 40, width: 180, height: 220 };
  const mark = React.createElement("b");
  const paper = methods.PaperPresenter({ actor, box, inset: 8, paperStyle: { background: "white" }, transform: "rotate(12deg)", marks: mark });
  assert.equal(paper.props.style.transform, "rotate(12deg)");
  assert.deepEqual(paper.props.children[0].props.box, { x: 8, y: 8, width: 164, height: 204 });
  assert.equal(paper.props.children[1], mark);
  const screen = { x: 10, y: 20, width: 160, height: 180 };
  const device = methods.EmbeddedPresenter({ actor, outer: box, screen, radius: 10, transform: "scale(1.2)", shell: mark });
  assert.equal(device.props.style.transform, "scale(1.2)");
  assert.deepEqual(device.props.children[0].props.box, screen);
  assert.equal(device.props.children[1], mark);
});

test("分屏中途两区用同一进度保持接缝，素材取得空间而源取景保持独立", () => {
  const actorFrom = { x: 0, y: 0, width: 240, height: 270 };
  const actorTo = { x: 0, y: 0, width: 120, height: 270 };
  const materialFrom = { x: 240, y: 0, width: 240, height: 270 };
  const materialTo = { x: 120, y: 0, width: 360, height: 270 };
  for (const progress of [0, .25, .5, .75, 1]) {
    let materialBox: typeof materialFrom | undefined;
    const split = methods.SplitPresenter({ actor, actorFrom, actorTo, materialFrom, materialTo, progress, renderMaterial: (box: typeof materialFrom) => { materialBox = box; return null; } });
    const window = split.props.children[1];
    near(window.props.box.x + window.props.box.width, materialBox!.x);
    near(window.props.box.width + materialBox!.width, 480);
    assert.deepEqual(window.props.crop, actor.crop);
    assert.equal(window.props.slot, "actor");
  }
});

test("实际人物窗口退出后换位置返回，仍读取当前源帧而不是重新播片头", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-presenter-method-clock-"));
  const previous = process.env.VIDEOCUT_WORKSPACE;
  process.env.VIDEOCUT_WORKSPACE = root;
  const app = createApplication(root);
  try {
    const project = app.createProject({ name: "参考制法源时钟隔离回归" });
    const projectId = project.snapshot.project.id;
    const sourcePath = join(project.snapshot.project.rootPath, "assets/source/clock.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=15:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", sourcePath]);
    const asset = app.registerImportedAsset({ projectId, baseRevision: app.readProject(projectId).revision.number,
      name: "真实源时钟夹具", kind: "video", managedPath: "assets/source/clock.mp4", sourceHash: await hashMotionFile(sourcePath) }).asset;
    app.applyMediaAnalysis({ projectId, assetId: asset.id, metadata: await probeMedia(sourcePath) });
    const job = app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "clock", work: {
      name: "参考窗口隐藏与返回", creativeBrief: "只验证原文制法在退出和新位置返回时保留源时钟，不验证真人美感。",
      width: 96, height: 64, fps: 15, durationInFrames: 6, props: {}, imageBindings: {},
      videoBindings: { actor: { assetId: asset.id, sourceStartMs: 1000, sourceEndMs: 1400, startFrame: 0, endFrame: 6 } },
      source: readPresenterReference() + `
import {useCurrentFrame} from 'remotion';
export default function Motion(){const f=useCurrentFrame();return <div style={{width:96,height:64,background:'black'}}>
{f<2||f>=4?<PresenterWindow slot="actor" source={{width:64,height:64}} crop={{x:0,y:0,width:1,height:1}}
box={{x:f>=4?32:0,y:0,width:64,height:64}}/>:null}</div>;}`
    } });
    const result = await runMotionJob(app, job);
    const output = join(project.snapshot.project.rootPath, String(result.previewPath));
    for (const frame of [0, 2, 4, 5]) {
      const image = join(root, `output-${frame}.png`);
      await runProcess("ffmpeg", ["-y", "-v", "error", "-i", output, "-vf", `select=eq(n\\,${frame})`, "-frames:v", "1", image]);
      const actual = PNG.sync.read(await readFile(image));
      if (frame === 2) { assert.ok(actual.data[32 * 4]! < 10); continue; }
      const reference = join(root, `source-${frame}.png`);
      await runProcess("ffmpeg", ["-y", "-v", "error", "-i", sourcePath, "-vf", `select=eq(n\\,${frame + 15})`, "-frames:v", "1", reference]);
      const expected = PNG.sync.read(await readFile(reference));
      let error = 0, count = 0;
      for (let y = 4; y < 60; y += 2) for (let x = 4; x < 60; x += 2) for (let c = 0; c < 3; c++) {
        error += Math.abs(actual.data[(y * 96 + x + (frame >= 4 ? 32 : 0)) * 4 + c]! - expected.data[(y * 64 + x) * 4 + c]!);
        count++;
      }
      assert.ok(error / count < 12, `返回帧 F${frame} 与当前源帧误差 ${error / count}`);
    }
  } finally {
    app.close();
    if (previous === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = previous;
  }
});
