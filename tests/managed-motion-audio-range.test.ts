import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { createTimelineItem } from "@videocut/domain";
import { resolveCompositionReachability } from "@videocut/remotion";
import { resolveAudioProgramEndFrame } from "../packages/edit-domain/src/audio-program-range.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createServer } from "../apps/server/src/app.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-audio-"));
  const app = createApplication(root);
  const created = app.createProject({ name: "纯动效接原旁白隔离验证", profile: "presenter_motion" });
  const projectId = created.snapshot.project.id;
  const current = () => app.readProject(projectId);
  const revision = () => current().revision.number;
  app.repository.commit(projectId, revision(), "隔离画布", snapshot => { Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }); });
  const job = app.submitManagedMotion({ projectId, baseRevision: revision(), idempotencyKey: "fixture", work: { ...motionFixture, durationInFrames: 90 } });
  // 仅提供技术夹具结果验证写入与范围，不声称做过真实渲染或声音审阅。
  const motion = app.completeManagedMotion({ projectId, jobId: job.id, sourceHash: "fixture", engineVersion: "fixture", metadata: { durationMs: 3000, width: 320, height: 320, fps: 30, hasAudio: false } });
  const scene = app.createScene({ projectId, baseRevision: revision(), type: "PresenterScene", title: "原旁白", purpose: "测试正式音频放置", startFrame: 0, endFrame: 180 }).snapshot.scenes.at(-1)!;
  const imported = app.registerImportedAsset({ projectId, baseRevision: revision(), name: "原WAV.wav", kind: "audio", managedPath: "assets/source/narration.wav", sourceHash: "original-wav", provenance: { source: "local_import", acquiredAt: new Date().toISOString() } });
  app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: { durationMs: 2000, hasAudio: true, audioCodec: "pcm_s16le", sampleRate: 48000 } });
  const placeMotion = () => app.createEffectCue({ projectId, baseRevision: revision(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 90, assetBindings: [{ slot: "motion", assetId: motion.id }] });
  const narration = (extra: Partial<Parameters<typeof app.placeNarration>[0]> = {}) => app.placeNarration({ projectId, baseRevision: revision(), assetId: imported.asset.id, startFrame: 12, sourceStartFrame: 6, sourceEndFrame: 48, ...extra });
  const bgm = (extra: Partial<Parameters<typeof app.manageAudio>[0]> = {}) => app.manageAudio({ projectId, baseRevision: revision(), action: "create", kind: "bgm", assetId: imported.asset.id, purpose: "范围测试", loop: true, ...extra });
  return { root, app, projectId, current, revision, scene, motion, imported, placeMotion, narration, bgm, close: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("正式入口复现纯 ManagedMotion 主线并原速放置已有旁白，空场景与未放置作品不通过", async () => {
  const f = await fixture();
  try {
    assert.equal(resolveAudioProgramEndFrame(f.current().snapshot), 0);
    const before = f.current();
    assert.throws(() => f.narration(), { code: "AUDIO_PROGRAM_NOT_READY" });
    assert.throws(() => f.bgm(), { code: "AUDIO_PROGRAM_NOT_READY" });
    assert.deepEqual(f.current(), before);
    f.placeMotion();
    const originalAssets = f.current().snapshot.assets;
    const originalJobs = f.app.repository.listJobs(f.projectId);
    const state = f.narration();
    const item = state.snapshot.timeline.items[0]!;
    assert.equal(state.snapshot.timeline.tracks.find(track => track.id === item.trackId)!.name, "Dialogue");
    assert.deepEqual([item.startFrame, item.endFrame, item.sourceStartFrame, item.sourceEndFrame], [12, 54, 6, 48]);
    assert.equal(item.endFrame - item.startFrame, item.sourceEndFrame - item.sourceStartFrame);
    assert.equal(resolveAudioProgramEndFrame(state.snapshot), 90);
    assert.ok(resolveCompositionReachability(state.snapshot).audioItemIds.has(item.id));
    assert.deepEqual(state.snapshot.assets, originalAssets, "不能生成第二份音频或改变原WAV");
    assert.equal(state.snapshot.speechAsset, undefined, "原声音不冒充合成语音与对齐证据");
    assert.equal(state.snapshot.audioCues.length, 0);
    assert.deepEqual(f.app.repository.listJobs(f.projectId), originalJobs, "不能提交新的声音生成任务");
  } finally { await f.close(); }
});

test("旁白重复、冲突、越界和重叠均原子拒绝，指定原片段更新不重复播放", async () => {
  const f = await fixture();
  try {
    f.placeMotion();
    const priorRevision = f.revision();
    const state = f.narration();
    const assertUnchanged = (call: () => unknown, code?: string) => {
      if (code) assert.throws(call, { code });
      else assert.throws(call);
      assert.deepEqual(f.current(), state);
    };
    assertUnchanged(() => f.narration({ baseRevision: priorRevision }));
    assertUnchanged(() => f.narration(), "TRACK_OVERLAP");
    assertUnchanged(() => f.narration({ sourceEndFrame: 61 }), "INVALID_AUDIO_FRAME");
    assertUnchanged(() => f.narration({ sourceStartFrame: 40, sourceEndFrame: 30 }), "INVALID_AUDIO_SOURCE_RANGE");
    assertUnchanged(() => f.narration({ startFrame: 80 }), "NARRATION_OUT_OF_PROGRAM");
    assertUnchanged(() => f.narration({ timelineItemId: "missing" }), "NARRATION_ITEM_NOT_FOUND");
    const next = f.narration({ timelineItemId: state.snapshot.timeline.items[0]!.id, startFrame: 24 });
    assert.equal(next.snapshot.timeline.items.length, 1);
    assert.deepEqual([next.snapshot.timeline.items[0]!.startFrame, next.snapshot.timeline.items[0]!.endFrame], [24, 66]);
  } finally { await f.close(); }
});

test("范围忽略失效、缺资产、错误时长作品及禁用画面，声音不能撑长主线", async () => {
  const f = await fixture();
  try {
    f.placeMotion();
    for (const mutate of [
      (snapshot: ReturnType<typeof f.current>["snapshot"]) => { snapshot.effectCues[0]!.status = "stale"; },
      (snapshot: ReturnType<typeof f.current>["snapshot"]) => { snapshot.assets.find(asset => asset.id === f.motion.id)!.status = "missing"; },
      (snapshot: ReturnType<typeof f.current>["snapshot"]) => { snapshot.effectCues[0]!.assetBindings[0]!.assetId = "missing"; },
      (snapshot: ReturnType<typeof f.current>["snapshot"]) => { snapshot.effectCues[0]!.endFrame = 180; },
      (snapshot: ReturnType<typeof f.current>["snapshot"]) => { snapshot.scenes[0]!.status = "stale"; }
    ]) {
      const snapshot = structuredClone(f.current().snapshot); mutate(snapshot);
      assert.equal(resolveAudioProgramEndFrame(snapshot), 0);
    }
    const snapshot = structuredClone(f.current().snapshot);
    snapshot.effectCues = [];
    snapshot.timeline.items.push(createTimelineItem({ trackId: snapshot.timeline.tracks.find(track => track.name === "Dialogue")!.id, assetId: f.imported.asset.id, startFrame: 0, endFrame: 1000, sourceStartFrame: 0, sourceEndFrame: 60 }));
    assert.equal(resolveAudioProgramEndFrame(snapshot), 0, "长旁白不能反向成为画面范围");
    const visual = { ...f.motion, id: "normal-video", motion: undefined };
    snapshot.assets.push(visual);
    snapshot.timeline.items.push({ ...createTimelineItem({ trackId: snapshot.timeline.tracks.find(track => track.name === "Actor / A-roll")!.id, assetId: visual.id, startFrame: 0, endFrame: 90, sourceStartFrame: 0, sourceEndFrame: 90 }), disabled: true });
    assert.equal(resolveAudioProgramEndFrame(snapshot), 0);
    snapshot.timeline.items.at(-1)!.disabled = false;
    assert.equal(resolveAudioProgramEndFrame(snapshot), 90);
    snapshot.assets.find(asset => asset.id === visual.id)!.kind = "actor_video";
    assert.equal(resolveAudioProgramEndFrame(snapshot), 90, "数字人视频与普通主画面使用相同范围");
    const before = f.current();
    assert.throws(() => f.bgm({ endFrame: 91 }), { code: "INVALID_AUDIO_FRAME" });
    assert.throws(() => f.bgm({ kind: "sfx", loop: false, eventFrame: 80, sourceStartFrame: 0, sourceEndFrame: 20 }), { code: "INVALID_AUDIO_FRAME" });
    assert.deepEqual(f.current(), before);
    assert.equal(f.bgm().snapshot.timeline.items[0]!.endFrame, 90);
  } finally { await f.close(); }
});

test("独立动效的绑定SFX沿同一范围对账，提交后不会被误停用", async () => {
  const f = await fixture();
  try {
    f.placeMotion();
    const cue = f.current().snapshot.effectCues[0]!;
    const state = f.bgm({ kind: "sfx", loop: false, eventFrame: 12, sourceStartFrame: 0, sourceEndFrame: 15, effectEvent: { effectCueId: cue.id, eventName: "独立动效落点", localFrame: 12 } });
    assert.equal(state.snapshot.audioCues[0]!.status, "ready");
    assert.equal(state.snapshot.timeline.items[0]!.disabled, false);
  } finally { await f.close(); }
});

test("place_narration 真实 MCP/HTTP 发现与映射一致，错误不能产生半条旁白", async () => {
  const f = await fixture();
  const http = await createServer({ workspaceRoot: f.root });
  const client = new Client({ name: "原旁白正式合同", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(),
    env: { ...process.env as Record<string, string>, VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
  try {
    await client.connect(transport);
    const tool = (await client.listTools()).tools.find(entry => entry.name === "place_narration")!;
    assert.ok(tool);
    assert.match(tool.description!, /不重新合成、循环或拉伸/);
    assert.ok(!("end_frame" in tool.inputSchema.properties!));
    const call = (extra: Record<string, unknown> = {}) => client.callTool({ name: "place_narration", arguments: { project_id: f.projectId, base_revision_id: f.revision(), asset_id: f.imported.asset.id, start_frame: 12, source_start_frame: 6, source_end_frame: 48, ...extra } });
    const empty = await call();
    assert.equal(empty.isError, true); assert.match(JSON.stringify(empty.content), /AUDIO_PROGRAM_NOT_READY/);
    const emptyDiagnostic = JSON.parse((empty.content as Array<{ text: string }>)[0]!.text);
    assert.deepEqual([emptyDiagnostic.stage, emptyDiagnostic.sideEffects, emptyDiagnostic.safeToRetry, emptyDiagnostic.recovery], ["validation", "none", true, "correct_input"]);
    f.placeMotion();
    const baseRevision = f.revision();
    const result = await call();
    assert.notEqual(result.isError, true, JSON.stringify(result.content));
    const item = f.current().snapshot.timeline.items[0]!;
    assert.deepEqual([item.startFrame, item.endFrame, item.sourceStartFrame, item.sourceEndFrame], [12, 54, 6, 48]);
    const placed = f.current();
    for (const invalid of [{ base_revision_id: baseRevision }, { source_end_frame: 61 }, { start_frame: 80 }, {}]) {
      const rejected = await call(invalid);
      assert.equal(rejected.isError, true);
      const diagnostic = JSON.parse((rejected.content as Array<{ text: string }>)[0]!.text);
      assert.equal(diagnostic.sideEffects, "base_revision_id" in invalid ? "unknown" : "none");
      assert.deepEqual(f.current(), placed);
    }
    const route = `/api/projects/${f.projectId}/narration`;
    const update = await http.app.inject({ method: "POST", url: route, payload: { baseRevision: f.revision(), assetId: f.imported.asset.id, timelineItemId: item.id, startFrame: 24, gainDb: -3 } });
    assert.equal(update.statusCode, 200, update.body);
    assert.equal(f.current().snapshot.timeline.items.length, 1);
    assert.deepEqual([f.current().snapshot.timeline.items[0]!.startFrame, f.current().snapshot.timeline.items[0]!.gainDb], [24, -3]);
    const before = f.current();
    assert.equal((await http.app.inject({ method: "POST", url: route, payload: { baseRevision: f.revision(), assetId: f.imported.asset.id, startFrame: 0, endFrame: 30 } })).statusCode, 400);
    assert.deepEqual(f.current(), before);
  } finally {
    await client.close(); await transport.close(); await http.app.close(); http.application.close(); await f.close();
  }
});
