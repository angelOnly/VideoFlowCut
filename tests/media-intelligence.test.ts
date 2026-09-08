import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import type { MediaFact, MediaObservation, MediaSource } from "@videocut/contracts";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";
import { lexicalTokens, matchObservation, parseObservation, planWindows, uncoveredRanges } from "../packages/media-intelligence/src/index.js";

const source: MediaSource = { id: "source", projectId: "project", target: { assetId: "asset" }, identity: "original", hash: "hash", path: "source.mp4", kind: "video", durationMs: 600000, hasAudio: true, streams: [], createdAt: "2026-09-08" };
const fact = (modality: MediaFact["modality"], text: string, range = { startMs: 252000, endMs: 260000 }): MediaFact => ({ modality, text, range, basis: "human", precision: "reviewed", keywords: [] });
const observation = (...facts: MediaFact[]): MediaObservation => ({ id: "observation", projectId: source.projectId, sourceId: source.id, sourceHash: source.hash, range: { startMs: 252000, endMs: 262000 }, depth: "review", modalities: ["visual", "audio", "speech"], facts, unknowns: [], context: "", rawText: "原始响应", version: { workflowId: "workflow", schemaVersion: "v1", model: "model", prompt: "v1", preprocessing: "v1" }, jobId: "job", createdAt: "2026-09-08" });

test("长素材分窗覆盖后半段且重叠不重复计算；发现阶段间隙保持未覆盖", () => {
  const windows = planWindows(610000, "index");
  assert.equal(windows.at(-1)?.endMs, 610000);
  assert.deepEqual(uncoveredRanges({ startMs: 0, endMs: 610000 }, windows), []);
  const discovery = planWindows(610000, "discovery");
  assert.ok(discovery.some((range) => range.startMs >= 600000));
  assert.ok(uncoveredRanges({ startMs: 0, endMs: 610000 }, discovery).length > 0);
  assert.throws(() => planWindows(1000, "index", { startMs: 0, endMs: 2000 }));
});

test("八秒连续条件不能用不相连片段或整条时长拼凑", () => {
  const observed = observation(fact("visual", "海边特写", { startMs: 0, endMs: 4000 }), fact("visual", "海边特写", { startMs: 6000, endMs: 10000 }));
  const matches = matchObservation(source, observed, { query: "海边", modality: "visual", minDurationMs: 8000 });
  assert.equal(matches.length, 2);
  assert.ok(matches.every((match) => match.status === "rejected"));
});

test("画外旁白提到海浪不会被召回成海边画面", () => {
  const observed = observation(fact("visual", "办公室里的电脑"), fact("speech", "海浪拍打沙滩"));
  assert.equal(matchObservation(source, observed, { query: "海浪", modality: "visual" }).length, 0);
  assert.equal(matchObservation(source, observed, { query: "海浪", modality: "speech" }).length, 1);
  assert.ok(lexicalTokens("笔记本接口特写").has("接口"));
});

test("高相似度不能抵消真实人声；未分析原声不能判无人声", () => {
  const visual = fact("visual", "笔记本接口特写");
  const query = { query: "接口", modality: "visual" as const, minDurationMs: 6000, excludeSpeech: true };
  assert.equal(matchObservation(source, observation(visual), query, 0.99)[0].status, "insufficient");
  assert.equal(matchObservation(source, observation(visual, { ...fact("audio", "有人讲解"), speechPresence: "present" }), query, 0.99)[0].status, "rejected");
  const muted = matchObservation(source, observation(visual, { ...fact("audio", "有人讲解"), speechPresence: "present" }), { ...query, allowMute: true }, 0.99)[0];
  assert.equal(muted.status, "conditional");
  assert.ok(muted.conditions.includes("本次采用必须静音"));
});

test("无人声证据需覆盖同一个拟用范围；低密度视觉仍需连续性复核", () => {
  const visual = fact("visual", "海边画面");
  const shortAudio = { ...fact("audio", "只有浪声", { startMs: 252000, endMs: 255000 }), speechPresence: "absent" as const };
  assert.equal(matchObservation(source, observation(visual, shortAudio), { query: "海边", modality: "visual", excludeSpeech: true })[0].status, "insufficient");
  assert.equal(matchObservation(source, observation({ ...visual, precision: "sampled" }), { query: "海边", modality: "visual", minDurationMs: 6000 })[0].status, "insufficient");
});

test("模型不合法格式和越界时间不能补成事实，精度由调用方限定", () => {
  assert.equal(parseObservation("这是普通文字", { startMs: 1000, endMs: 6000 }, ["audio"]).facts.length, 0);
  const raw = JSON.stringify({ facts: [{ modality: "audio", text: "电击声", startMs: 0, endMs: 10000 }, { modality: "visual", text: "红色页面", startMs: 500, endMs: 2000, precision: "reviewed" }] });
  const parsed = parseObservation(raw, { startMs: 1000, endMs: 6000 }, ["visual", "audio"]);
  assert.equal(parsed.facts.length, 1);
  assert.equal(parsed.facts[0].precision, "sampled");
  assert.deepEqual(parsed.facts[0].range, { startMs: 1500, endMs: 3000 });
});

test("分析/观察不产生 Revision，纠错保留原文并只使已采用依据失效", async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-media-test-"));
  const app = createApplication(root);
  try {
    let state = app.createProject({ name: "隔离素材测试" });
    const projectId = state.snapshot.project.id;
    const assetId = "asset_fixture";
    const path = join(state.snapshot.project.rootPath, "assets", "source", "sample.wav");
    await mkdir(join(state.snapshot.project.rootPath, "assets", "source"), { recursive: true });
    await writeFile(path, "这里只测试源身份与事务，不冒充实际解码");
    const hash = await hashMediaFile(path);
    state = app.repository.commit(projectId, state.revision.number, "测试素材", (snapshot, impact) => {
      snapshot.assets.push({ id: assetId, name: "sample", kind: "audio", status: "ready", managedPath: path, sourceHash: hash, tags: [], metadata: { durationMs: 10000, hasAudio: true }, createdAt: source.createdAt });
      impact.changed.push(assetId);
    });
    const original = { ...source, projectId, hash, path, target: { assetId }, kind: "audio" as const, durationMs: 10000 };
    app.intelligence.store.saveSource(original);
    const observed = { ...observation({ ...fact("audio", "短促机械落定", { startMs: 0, endMs: 10000 }), speechPresence: "absent" as const }), projectId, sourceHash: hash, range: { startMs: 0, endMs: 10000 } };
    app.intelligence.store.saveObservation(observed);
    const job = app.intelligence.submitAnalysis(projectId, { assetId, depth: "index", modalities: ["audio"], context: "" });
    const duplicate = app.intelligence.submitAnalysis(projectId, { assetId, depth: "index", modalities: ["audio"], context: "" });
    assert.equal(job.id, duplicate.id);
    assert.equal(app.readProject(projectId).revision.number, state.revision.number);
    state = await app.intelligence.adopt(projectId, { baseRevision: state.revision.number, assetId, observationIds: [observed.id], range: { startMs: 0, endMs: 1000 }, purpose: "机械动作完成", audioPolicy: "retain", conditions: [] });
    const corrected = app.intelligence.correct(projectId, { observationId: observed.id, facts: [{ ...observed.facts[0], text: "机械声后有微弱人声", speechPresence: "present" }], unknowns: [], reason: "实际复核发现尾音中含人声", author: "测试审阅", baseRevision: state.revision.number });
    assert.equal(corrected.affectedAdoptionIds.length, 1);
    assert.equal(app.readProject(projectId).snapshot.mediaAdoptions?.[0].status, "needs_review");
    assert.equal(app.intelligence.store.observation(projectId, observed.id)?.rawText, "原始响应");
    assert.deepEqual(app.intelligence.store.observations(projectId).map((entry) => entry.id), [corrected.observation.id]);
    assert.equal(app.readProject(projectId).snapshot.assets[0].status, "ready");
    await assert.rejects(app.intelligence.adopt(projectId, { baseRevision: corrected.revision, assetId, observationIds: [observed.id], range: { startMs: 0, endMs: 1000 }, purpose: "采用旧观察", audioPolicy: "retain", conditions: [] }), /有效观察/u);
  } finally { app.repository.close(); await rm(root, { recursive: true, force: true }); }
});
