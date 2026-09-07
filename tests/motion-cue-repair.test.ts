import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import type { MotionVisibility } from "@videocut/contracts";
import { evaluateQuality, requiresEditorialReview } from "@videocut/quality";
import { parseMotionVisibility } from "../apps/render-worker/src/motion-visibility.js";
import { motionCaptionSafety } from "../packages/quality-system/src/motion-caption-safety.js";
import { motionFixture } from "./fixtures/managed-motion.js";

const clearVisibility = (): MotionVisibility => ({ method: "png_alpha_bbox_v1", alphaThreshold: 1, frames: Array.from({ length: 18 }, () => ({ x: 20, y: 10, width: 100, height: 30 })) });

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "videocut-cue-repair-"));
  const app = createApplication(root);
  const created = app.createProject({ name: "透明画布与局部编辑回归", profile: "presenter_motion" });
  const projectId = created.snapshot.project.id;
  const revision = () => app.readProject(projectId).revision.number;
  app.repository.commit(projectId, revision(), "独立测试画布与字幕", (snapshot) => {
    Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30, durationInFrames: 120 });
  });
  const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "fixture", work: motionFixture });
  const asset = app.completeManagedMotion({ projectId, jobId: job.id, sourceHash: "fixture", engineVersion: "fixture-only", visibility: clearVisibility(), metadata: { durationMs: 600, width: 320, height: 320, fps: 30, hasAudio: false } });
  app.reviewManagedMotion({ projectId, baseRevision: revision(), assetId: asset.id, referenceMatch: "passed", note: "单元测试固定状态，不代表真实用户视频审片。" });
  const sceneState = app.createScene({ projectId, baseRevision: revision(), type: "PresenterScene", title: "测试", purpose: "局部编辑回归", startFrame: 0, endFrame: 120 });
  const sceneId = sceneState.snapshot.scenes.at(-1)!.id;
  const state = app.createEffectCue({ projectId, baseRevision: revision(), sceneId, type: "ManagedMotion", layer: "front", startFrame: 20, endFrame: 38, assetBindings: [{ slot: "motion", assetId: asset.id }], qualityRules: ["caption_safe_area", "semantic_anchor_required"], semanticAnchor: { type: "absolute", relation: "land_on" }, note: "保留的说明" });
  const cueId = state.snapshot.effectCues.at(-1)!.id;
  return { app, projectId, revision, asset, sceneId, cueId, state, close: async () => { app.repository.close(); await rm(root, { recursive: true, force: true }); } };
}

test("Alpha 解析保留透明帧并拒绝缺帧、重复、负坐标和越界，不将坏测量当安全", () => {
  const opaque = "frame:0 pts:0\nmotion_alpha_frame=1\nlavfi.bbox.x1=4\nlavfi.bbox.y1=5\nlavfi.bbox.w=6\nlavfi.bbox.h=7\n";
  const transparent = "frame:1 pts:1\nmotion_alpha_frame=1\n";
  assert.deepEqual(parseMotionVisibility(opaque + transparent, 2, 32, 32).frames, [{ x: 4, y: 5, width: 6, height: 7 }, null]);
  assert.throws(() => parseMotionVisibility(opaque, 2, 32, 32), /INCOMPLETE/u);
  // 滤镜局部 frame 可以合法重置；输入 PTS 不能缺失、重复、跳帧或倒序。
  for (const invalid of [opaque.replace("pts:0", "pts:1"), opaque.replace("pts:0", "pts:-1"), opaque.replace("pts:0", "pts:N/A"), opaque.replace(" pts:0", ""), opaque + opaque, opaque.replace("x1=4", "x1=-4"), opaque.replace("w=6", "w=60"), opaque.replace("w=6", "w=NaN"), opaque.replace("w=6\n", ""), opaque.replace("motion_alpha_frame=1\n", ""), opaque + "lavfi.bbox.w=6\n"]) {
    assert.throws(() => parseMotionVisibility(invalid, 1, 32, 32), /INVALID/u);
  }
  assert.deepEqual(parseMotionVisibility(opaque + transparent.replace("frame:1", "frame:0") + opaque.replace("pts:0", "pts:2"), 3, 32, 32).frames,
    [{ x: 4, y: 5, width: 6, height: 7 }, null, { x: 4, y: 5, width: 6, height: 7 }]);
});

test("透明画布按真实像素和共同时间检查，语义与整片审片门禁不被放宽", async () => {
  const f = await fixture();
  try {
    const snapshot = structuredClone(f.state.snapshot);
    snapshot.timeline.captions.push({ id: "caption-fixture", text: "字幕", startFrame: 20, endFrame: 38, style: "stable", precision: "segment_exact" });
    const cue = snapshot.effectCues.at(-1)!;
    assert.equal(cue.spatialAnchor, "full_frame");
    const codes = () => evaluateQuality(snapshot, f.revision()).issues;
    assert.equal(motionCaptionSafety(snapshot, cue), "clear");
    assert.equal(codes().some((issue) => issue.code.includes("CAPTION_SAFE")), false);
    assert.ok(codes().some((issue) => issue.code === "EFFECT_SEMANTIC_ANCHOR_REQUIRED" && issue.level === "blocking"));
    assert.equal(evaluateQuality(snapshot, f.revision()).editorial.status, "not_recorded");
    assert.equal(requiresEditorialReview(evaluateQuality(snapshot, f.revision()), "delivery"), true);
    const motion = snapshot.assets.find((entry) => entry.id === f.asset.id)!.motion!;
    motion.visibility!.frames[9] = { x: 20, y: 270, width: 200, height: 30 };
    assert.equal(motionCaptionSafety(snapshot, cue), "review");
    assert.ok(codes().some((issue) => issue.code === "EFFECT_CAPTION_SAFETY_REVIEW_REQUIRED" && issue.level === "warning"));
    snapshot.timeline.captions[0].startFrame = 30;
    assert.equal(motionCaptionSafety(snapshot, cue), "clear", "不相交的时间不能误算遮挡");
    motion.visibility = undefined;
    assert.equal(motionCaptionSafety(snapshot, cue), "unknown");
    assert.ok(codes().some((issue) => issue.code === "EFFECT_CAPTION_SAFETY_REVIEW_REQUIRED"));
    motion.visibility = clearVisibility();
    motion.visibility.frames.pop();
    assert.equal(motionCaptionSafety(snapshot, cue), "unknown");
    motion.visibility = clearVisibility();
    motion.visibility.frames[0] = { x: -1, y: 0, width: 20, height: 20 };
    assert.equal(motionCaptionSafety(snapshot, cue), "unknown");
    cue.type = "EvidenceCard";
    assert.ok(codes().some((issue) => issue.code === "EFFECT_RULE_CAPTION_SAFE_AREA" && issue.level === "blocking"), "普通前景组件保护不被削弱");
  } finally { await f.close(); }
});

test("按 ID 修改锚点与位置不复制片段，移除只动一个 Cue 且保留作品及历史", async () => {
  const f = await fixture();
  try {
    const other = f.app.createEffectCue({ projectId: f.projectId, baseRevision: f.revision(), sceneId: f.sceneId, type: "CameraPunch", layer: "actor", startFrame: 85, endFrame: 110 });
    const before = f.app.readProject(f.projectId);
    const otherCue = before.snapshot.effectCues.find((cue) => cue.id === other.snapshot.effectCues.at(-1)!.id)!;
    const identity = { projectId: f.projectId, baseRevision: f.revision(), cueId: f.cueId };
    for (const patch of [{ semanticAnchor: { type: "scene" as const, targetId: "missing", relation: "land_on" as const } }, { props: { text: "不生效的覆盖" } }, { endFrame: 39 }, { startFrame: 110, endFrame: 128 }]) {
      assert.throws(() => f.app.updateEffectCue({ ...identity, ...patch }));
      assert.deepEqual(f.app.readProject(f.projectId), before, "失败不产生 Revision 或副作用");
    }
    const updated = f.app.updateEffectCue({ ...identity, startFrame: 60, endFrame: 78, semanticAnchor: { type: "scene", targetId: f.sceneId, relation: "land_on" } });
    const cue = updated.snapshot.effectCues.find((entry) => entry.id === f.cueId)!;
    assert.equal(cue.note, "保留的说明");
    assert.equal(cue.motion.enterFrames, 0);
    assert.equal(cue.motion.exitFrames, 0);
    assert.equal(updated.snapshot.effectCues.length, 2);
    assert.deepEqual(updated.snapshot.effectCues.find((entry) => entry.id === otherCue.id), otherCue);
    assert.deepEqual(updated.snapshot.assets, before.snapshot.assets);
    for (const range of [[20, 38], [60, 78]]) assert.ok(updated.revision.impact.dirtyRanges.some((dirty) => dirty.startFrame <= range[0] && dirty.endFrame >= range[1]));
    assert.equal(evaluateQuality(updated.snapshot, updated.revision.number).issues.some((issue) => issue.code === "EFFECT_SEMANTIC_ANCHOR_REQUIRED" && issue.objectId === cue.id), false);
    assert.throws(() => f.app.removeEffectCue(identity), /Revision|版本|revision/u);
    assert.throws(() => f.app.removeEffectCue({ ...identity, baseRevision: f.revision(), cueId: "missing" }), /不存在/u);
    assert.equal(f.revision(), updated.revision.number);
    const removed = f.app.removeEffectCue({ ...identity, baseRevision: f.revision() });
    assert.deepEqual(removed.snapshot.effectCues, [otherCue]);
    assert.deepEqual(removed.snapshot.assets, before.snapshot.assets);
    assert.deepEqual(f.app.repository.getRevision(f.projectId, before.revision.number)!.snapshot.effectCues, before.snapshot.effectCues);
    assert.ok(removed.revision.impact.dirtyRanges.some((dirty) => dirty.startFrame <= 60 && dirty.endFrame >= 78));
  } finally { await f.close(); }
});
