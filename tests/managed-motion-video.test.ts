import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProcess, probeMedia } from "@videocut/speech";
import { createApplication } from "@videocut/application";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { boundMotionVideoSchema, motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { prepareMotionVideos, hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";
import { ThreadedRevisionRenderer } from "../apps/render-worker/src/threaded-renderer.js";

test("受管视频绑定接受与 JSX 对应的驼峰槽名，仍拒绝非法槽名", () => {
  const binding = { assetId: "asset-node", sourceStartMs: 6792, sourceEndMs: 8000 };
  const input = { ...motionFixture, videoBindings: { nodePre: binding } };
  assert.equal(motionSubmissionSchema.safeParse(input).success, true);
  assert.equal(boundMotionVideoSchema.safeParse({ slot: "nodePre", ...binding, managedPath: "source.mp4", hash: "a".repeat(64), rightsStatus: "unknown" }).success, true);
  assert.equal(motionSubmissionSchema.safeParse({ ...input, videoBindings: { "node-pre": binding } }).success, false);
});

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
      if (index === 0) {
        const legacy = await prepareMotionVideos(root, join(root, "legacy11"), work, [binding], "managed-motion-11");
        assert.equal(legacy.footage!.framePaths.length, 24);
      }
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
        const timed = motionSubmissionSchema.parse({ ...work, durationInFrames: 12, videoBindings: { footage: { assetId: "test", sourceStartMs: 0, sourceEndMs: 334, startFrame: 2, endFrame: 10 } }, source: `import React from 'react';import {Sequence} from 'remotion';import {TimelineVideo} from '@videoflowcut/motion';export default function Motion(){return <Sequence from={2} durationInFrames={8}><TimelineVideo slot="footage"/></Sequence>}` });
        const timedRender = await renderManagedMotion(timed, join(root, "timeline"), {}, videos);
        assert.equal(timedRender.frameHashes.length, 12);
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
    const work = motionSubmissionSchema.parse({ ...motionFixture, width: 128, height: 64, fps: 24, durationInFrames: 12, videoBindings: { left: { ...binding, sourceEndMs: 500, startFrame: 0, endFrame: 12 }, right: { ...binding, sourceEndMs: 500, startFrame: 0, endFrame: 12 } }, source: `import React from 'react';import {TimelineVideo} from '@videoflowcut/motion';export default function Motion(){return <div style={{display:'flex',width:128,height:64}}><TimelineVideo slot="left" style={{width:64,height:64}}/><TimelineVideo slot="right" style={{width:64,height:64}}/></div>}` });
    const mismatched = motionSubmissionSchema.parse({ ...work, durationInFrames: 66, videoBindings: { left: { ...binding, sourceStartMs: 3292, sourceEndMs: 6000, startFrame: 0, endFrame: 66 } } });
    assert.throws(() => app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "bad-frame", work: mismatched }), /需要 66 帧，源选段预计 65 帧/);
    assert.equal(app.listJobs(projectId).filter(job => job.kind === "motion_generation").length, 0);
    const job = app.submitManagedMotion({ projectId, baseRevision: app.readProject(projectId).revision.number, idempotencyKey: "two", work });
    const thread = new ThreadedRevisionRenderer();
    let result: Record<string, unknown>;
    try { result = await runMotionJob(app, job, undefined, input => thread.renderMotion(input)); }
    finally { await thread.close(); }
    assert.equal(result.motionStage, "completed");
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
