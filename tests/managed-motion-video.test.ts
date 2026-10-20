import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { runProcess, probeMedia } from "@videocut/speech";
import { createApplication } from "@videocut/application";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { boundMotionVideoSchema, motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { prepareMotionVideos, hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";

test("视频合同固定作品帧范围，允许毫秒取整，拒绝旧入口及错误范围", () => {
  const binding = { assetId: "asset-node", sourceStartMs: 628000, sourceEndMs: 631334, startFrame: 90, endFrame: 170 };
  const input = { ...motionFixture, fps: 24, durationInFrames: 792, videoBindings: { nodePre: binding } };
  assert.equal(motionSubmissionSchema.safeParse(input).success, true);
  assert.equal(boundMotionVideoSchema.safeParse({ slot: "nodePre", ...binding, managedPath: "source.mp4", hash: "a".repeat(64) }).success, true);
  for (const change of [{ startFrame: 171 }, { endFrame: 793 }, { sourceEndMs: 631000 }, { sourceEndMs: 640000 }]) assert.equal(motionSubmissionSchema.safeParse({ ...input, videoBindings: { nodePre: { ...binding, ...change } } }).success, false);
  assert.equal(motionSubmissionSchema.safeParse({ ...input, videoBindings: { "node-pre": binding } }).success, false);
  const { startFrame: _start, endFrame: _end, ...oldBinding } = binding;
  assert.equal(motionSubmissionSchema.safeParse({ ...input, videoBindings: { nodePre: oldBinding } }).success, false);
});

test("23.976/25/30/VFR按PTS采样；跨Sequence保持作品时钟及精确帧数", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-video-"));
  try {
    for (const [index, rate] of ["24000/1001", "25", "30", "vfr"].entries()) {
      const source = join(root, `source${index}.mp4`);
      await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `testsrc2=s=64x64:r=${rate === "vfr" ? "30" : rate}:d=3`, ...(rate === "vfr" ? ["-vf", "select='not(mod(n,2))+not(mod(n,3))'", "-fps_mode", "vfr"] : []), "-c:v", "libx264", "-pix_fmt", "yuv420p", source]);
      const binding = { slot: "footage", assetId: "test", managedPath: `source${index}.mp4`, hash: await hashMotionFile(source), sourceStartMs: 0, sourceEndMs: 2000, startFrame: 0, endFrame: 48 };
      const work = motionSubmissionSchema.parse({ ...motionFixture, width: 64, height: 64, fps: 24, durationInFrames: 48, videoBindings: { footage: { assetId: "test", sourceStartMs: 0, sourceEndMs: 2000, startFrame: 0, endFrame: 48 } } });
      const provider = await prepareMotionVideos(root, join(root, `decode${index}`), work, [binding]);
      try {
        assert.equal(provider.videos.footage.frameCount, 48);
        const reference = join(root, `ref${index}`); await mkdir(reference);
        await runProcess("ffmpeg", ["-v", "error", "-i", source, "-vf", "setpts=PTS-STARTPTS,fps=24:start_time=0:round=up:eof_action=pass", "-frames:v", "48", "-pix_fmt", "rgba", join(reference, "%d.png")]);
        for (const frame of [0, 1, 20, 46, 47]) assert.deepEqual(PNG.sync.read(await provider.getFrame("footage", frame)).data, PNG.sync.read(await readFile(join(reference, `${frame + 1}.png`))).data);
        if (index === 0) {
          const source = `import React from 'react';import {Sequence} from 'remotion';import {TimelineVideo} from '@videoflowcut/motion';export default function Motion(){return <><Sequence durationInFrames={4}><TimelineVideo slot="footage"/></Sequence><Sequence from={4}><TimelineVideo slot="footage"/></Sequence></>;}`;
          const rendered = await renderManagedMotion({ ...work, source, durationInFrames: 8 }, join(root, "render"), {}, provider);
          assert.equal(rendered.frameHashes.length, 8); assert.notEqual(rendered.frameHashes[0], rendered.frameHashes[7]); assert.ok(rendered.determinism);
          await assert.rejects(renderManagedMotion({ ...work, source: source.replace('slot="footage"', 'slot="missing"'), durationInFrames: 8 }, join(root, "overflow"), {}, provider), /MOTION_VIDEO_RANGE/);
          // 跨作品接续由真实源范围表达；新作品的第零帧应是原片第24帧，而非重新播放片头。
          await provider.close(); // 同一项目的渲染队列串行消费，先释放前一作品的缓存租约。
          const continuation = { ...binding, sourceStartMs: 1000, sourceEndMs: 2000, endFrame: 24 };
          const nextWork = { ...work, durationInFrames: 24, videoBindings: { footage: { assetId: "test", sourceStartMs: 1000, sourceEndMs: 2000, startFrame: 0, endFrame: 24 } } };
          const nextProvider = await prepareMotionVideos(root, join(root, "continuation"), nextWork, [continuation]);
          try {
            for (const frame of [0, 1, 23]) assert.deepEqual(PNG.sync.read(await nextProvider.getFrame("footage", frame)).data, PNG.sync.read(await readFile(join(reference, `${frame + 25}.png`))).data);
          } finally { await nextProvider.close(); }
        }
      } finally { await provider.close(); }
      await assert.rejects(prepareMotionVideos(root, join(root, `bad${index}`), work, [{ ...binding, sourceEndMs: 4000 }]), /SOURCE_RANGE/);
      await assert.rejects(prepareMotionVideos(root, join(root, `changed${index}`), work, [{ ...binding, hash: "a".repeat(64) }]), /VIDEO_CHANGED/);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

for (const kind of ["video", "actor_video"] as const) test(`${kind} 多路Job共享原片且不保存副本，完整作品独立于解码缓存，损坏结果不得复用`, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-video-job-")); const app = createApplication(root);
  try {
    const created = app.createProject({ name: "多路视频隔离验证" }); const projectId = created.snapshot.project.id;
    const path = join(created.snapshot.project.rootPath, "assets/source/video.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=24:d=1", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:v", "libx264", "-c:a", "aac", "-shortest", path]);
    const imported = app.registerImportedAsset({ projectId, baseRevision: 1, name: "video.mp4", kind, managedPath: "assets/source/video.mp4", sourceHash: await hashMotionFile(path), provenance: { source: "local_import", acquiredAt: new Date().toISOString() } });
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(path) });
    const binding = { assetId: imported.asset.id, sourceStartMs: 0, sourceEndMs: 500, startFrame: 0, endFrame: 12 };
    const work = motionSubmissionSchema.parse({ ...motionFixture, width: 128, height: 64, fps: 24, durationInFrames: 12, videoBindings: { left: binding, right: binding }, source: `import React from 'react';import {TimelineVideo} from '@videoflowcut/motion';export default function Motion(){return <div style={{display:'flex',width:128,height:64}}><TimelineVideo slot="left" style={{width:64,height:64}}/><TimelineVideo slot="right" style={{width:64,height:64}}/></div>}` });
    const job = app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "two", work });
    const result = await runMotionJob(app, job); const asset = app.readProject(projectId).snapshot.assets.find(a => a.id === result.assetId)!;
    assert.equal(asset.metadata?.hasAudio, false); assert.deepEqual(asset.motion?.sourceAssetIds, [imported.asset.id]);
    const directory = join(created.snapshot.project.rootPath, asset.motion!.sourcePath, "..");
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
    assert.equal(manifest.videoResources.uniqueSources, 1); assert.equal(manifest.videoResources.decodedChunks, 1);
    assert.equal((await readdir(directory)).includes("resources"), false);
    await rm(join(created.snapshot.project.rootPath, ".cache"), { recursive: true, force: true });
    const revision = app.readProject(projectId).revision.number;
    assert.equal((await runMotionJob(app, job)).assetId, asset.id); assert.equal(app.readProject(projectId).revision.number, revision);
    await writeFile(join(directory, "frames/frame-00000.png"), "damaged");
    await assert.rejects(runMotionJob(app, job), /MOTION_CACHE_CORRUPT/);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("竖向真实视频在头像、纸片、分屏、容器和退出后返回时保持源时钟", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-presenter-forms-"));
  try {
    const source = join(root, "source.mp4");
    // 用随源帧变化的颜色检测重播；这是技术夹具，不冒充真实人物或审美样片。
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=black:s=64x96:r=30:d=2",
      "-vf", "geq=r='N*3':g=40:b=80", "-c:v", "libx264", "-pix_fmt", "yuv420p", source]);
    const timing = { assetId: "actor", sourceStartMs: 1000, sourceEndMs: 2000, startFrame: 0, endFrame: 24 };
    const work = motionSubmissionSchema.parse({
      ...motionFixture, width: 128, height: 96, fps: 24, durationInFrames: 24, imageBindings: {},
      videoBindings: { actor: timing },
      source: `import React from 'react';import {useCurrentFrame} from 'remotion';import {TimelineVideo} from '@videoflowcut/motion';
export default function Motion(){
 const f=useCurrentFrame();
 const phase=Math.floor(f/4);
 const left=phase===0?4:phase===1?8:phase===2?0:phase===3?76:60;
 const top=phase===2?0:phase===3?20:4;
 const width=phase===1?40:phase===2?48:32;
 const height=phase===1?60:phase===2?96:phase===3?48:32;
 return <><div style={{position:'absolute',left:120,top:88,width:8,height:8,background:'#00ff00'}}/>
 {phase===3?<div style={{position:'absolute',left:72,top:16,width:40,height:56,background:'#ffffff'}}/>:null}
 {phase===4?null:<div style={{position:'absolute',left,top,width,height,overflow:'hidden',borderRadius:phase===0||phase===5?'50%':0}}>
 <TimelineVideo slot="actor" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}</>;
}`
    });
    const provider = await prepareMotionVideos(root, join(root, "decode"), work, [{
      slot: "actor", ...timing, managedPath: "source.mp4", hash: await hashMotionFile(source)
    }]);
    try {
      const directory = join(root, "render");
      await renderManagedMotion(work, directory, {}, provider);
      const pixels = async (frame: number) => PNG.sync.read(await readFile(join(directory, `frames/frame-${String(frame).padStart(5, "0")}.png`)));
      const at = (png: PNG, x: number, y: number) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
      for (const [frame, x, y] of [[2, 20, 20], [6, 28, 30], [10, 24, 48], [14, 92, 40], [22, 76, 20]]) {
        const actual = at(await pixels(frame!), x!, y!);
        const expected = at(PNG.sync.read(await provider.getFrame("actor", frame!)), 32, 48);
        assert.ok(actual.slice(0, 3).every((value, i) => Math.abs(value - expected[i]!) <= 3), `F${frame} 保持真实源时间`);
        assert.equal(actual[3], 255);
      }
      assert.equal(at(await pixels(2), 4, 4)[3], 0, "圆形窗口裁掉角部");
      assert.equal(at(await pixels(6), 8, 4)[3], 255, "纸片保留矩形背景，无需伪造轮廓 Mask");
      assert.equal(at(await pixels(10), 60, 40)[3], 0, "分屏释放材料区域");
      assert.deepEqual(at(await pixels(14), 73, 17), [255, 255, 255, 255], "内部视频在设计容器内");
      assert.equal(at(await pixels(18), 76, 20)[3], 0, "退出时人物像素不可见");
      assert.notDeepEqual(at(await pixels(22), 76, 20), at(await pixels(2), 20, 20), "重新挂载没有重播片头");
    } finally { await provider.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
