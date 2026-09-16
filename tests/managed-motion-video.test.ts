import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProcess, probeMedia } from "@videocut/speech";
import { createApplication } from "@videocut/application";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { prepareMotionVideos, hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";

test("受管源视频按23.976、25、30及VFR时间采样，拒绝源越界与哈希变化", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-video-"));
  try {
    for (const [index, rate] of ["24000/1001", "25", "30", "vfr"].entries()) {
      const source = join(root, `source${index}.mp4`);
      await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `testsrc2=s=64x64:r=${rate === "vfr" ? "30" : rate}:d=1.5`, ...(rate === "vfr" ? ["-vf", "select='not(mod(n,2))+not(mod(n,3))'", "-fps_mode", "vfr"] : []), "-c:v", "libx264", "-pix_fmt", "yuv420p", source]);
      const binding = { slot: "footage", assetId: "test", managedPath: `source${index}.mp4`, hash: await hashMotionFile(source), rightsStatus: "cleared", sourceStartMs: 0, sourceEndMs: 1000 };
      const work = motionSubmissionSchema.parse({ ...motionFixture, width: 64, height: 64, fps: 24, durationInFrames: 24, videoBindings: { footage: { assetId: "test", sourceStartMs: 0, sourceEndMs: 1000 } } });
      const directory = join(root, `decode${index}`);
      await mkdir(directory);
      const videos = await prepareMotionVideos(root, directory, work, [binding]);
      assert.equal(videos.footage!.framePaths.length, 24);
      assert.notDeepEqual(await readFile(videos.footage!.framePaths[0]!), await readFile(videos.footage!.framePaths[20]!));
      await assert.rejects(prepareMotionVideos(root, join(root, `bad${index}`), work, [{ ...binding, sourceEndMs: 3000 }]), /SOURCE_RANGE/);
      await assert.rejects(prepareMotionVideos(root, join(root, `changed${index}`), work, [{ ...binding, hash: "a".repeat(64) }]), /VIDEO_CHANGED/);
      if (index === 0) {
        const source = `import React from 'react';import {Sequence} from 'remotion';import {BoundVideo} from '@videoflowcut/motion';export default function Motion(){return <><Sequence durationInFrames={4}><BoundVideo slot="footage"/></Sequence><Sequence from={4}><BoundVideo slot="footage" offsetInFrames={4}/></Sequence></>;}`;
        const rendered = await renderManagedMotion({ ...work, source, durationInFrames: 8 }, join(root, "render"), {}, videos);
        assert.equal(rendered.frameHashes.length, 8);
        assert.notEqual(rendered.frameHashes[0], rendered.frameHashes[7]);
        assert.ok(rendered.determinism);
        await assert.rejects(renderManagedMotion({ ...work, source: source.replace('offsetInFrames={4}', 'offsetInFrames={25}'), durationInFrames: 8 }, join(root, "overflow"), {}, videos), /MOTION_VIDEO_RANGE/);
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("多路视频经完整Job固定来源与许可、静音合成，缓存损坏不能复用", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-video-job-"));
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "多路视频隔离验证" });
    const projectId = created.snapshot.project.id;
    const path = join(created.snapshot.project.rootPath, "assets/source/video.mp4");
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x64:r=24:d=1", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:v", "libx264", "-c:a", "aac", "-shortest", path]);
    const imported = app.registerImportedAsset({ projectId, baseRevision: 1, name: "video.mp4", kind: "video", managedPath: "assets/source/video.mp4", sourceHash: await hashMotionFile(path), provenance: { source: "local_import", rightsStatus: "unknown", usageRights: { purposes: ["draft"], basis: "自制夹具验证用途交集", confirmedAt: new Date().toISOString() }, acquiredAt: new Date().toISOString() } });
    app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(path) });
    const binding = { assetId: imported.asset.id, sourceStartMs: 0, sourceEndMs: 1000 };
    const work = motionSubmissionSchema.parse({ ...motionFixture, width: 128, height: 64, fps: 24, durationInFrames: 12, videoBindings: { left: binding, right: binding }, source: `import React from 'react';import {BoundVideo} from '@videoflowcut/motion';export default function Motion(){return <div style={{display:'flex',width:128,height:64}}><BoundVideo slot="left" style={{width:64,height:64}}/><BoundVideo slot="right" offsetInFrames={6} style={{width:64,height:64}}/></div>}` });
    const job = app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "two", work });
    const result = await runMotionJob(app, job);
    const asset = app.readProject(projectId).snapshot.assets.find(a => a.id === result.assetId)!;
    assert.equal(asset.metadata?.hasAudio, false);
    assert.deepEqual(asset.provenance?.usageRights?.purposes, ["draft"]);
    assert.ok(asset.motion?.sourceAssetIds?.includes(imported.asset.id));
    const revision = app.readProject(projectId).revision.number;
    assert.equal((await runMotionJob(app, job)).assetId, asset.id);
    assert.equal(app.readProject(projectId).revision.number, revision);
    const resource = join(created.snapshot.project.rootPath, asset.motion!.sourcePath, "..", "resources", "video-left");
    await writeFile(resource, "damaged");
    await assert.rejects(runMotionJob(app, job), /RESOURCE_CACHE_CORRUPT/);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
