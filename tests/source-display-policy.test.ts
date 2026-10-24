import {motionHtml} from "./fixtures/hyperframes.js";
import {sizeMotionFixture} from "./fixtures/hyperframes.js";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { createServer } from "../apps/server/src/app.js";
import { checkMotionSourceDisplay, checkFrozenExplainerSourceDisplay, SourceDisplayValidationError } from "../packages/edit-application/src/source-display-checks.js";
import { sourceDisplayPolicySchema, type FrozenSourceDisplay } from "../packages/contracts/src/source-display-policy.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHash, motionHashEngine, MOTION_ENGINE_VERSION } from "../packages/motion-work/src/compiler.js";

const frozen: FrozenSourceDisplay = { scopeId: "project", policy: { mode: "internal_only" } };
const source = (body: string) => motionHtml(`<div>${body}</div>`);

test("自由源码只检查可见出处，保留正文、后台资料及核对提示", () => {
  for (const body of ["来源：某机构", "第 3 页", "报告标题", "出处：某报告"]) {
    assert.throws(() => checkMotionSourceDisplay(source(body), { sourceTitle: "报告标题" }, frozen), error => {
      assert.ok(error instanceof SourceDisplayValidationError);
      assert.ok(error.fields[0]!.line && error.fields[0]!.column); return true;
    });
  }
  assert.equal(checkMotionSourceDisplay(source("数据来源是什么？"), {}, frozen).length, 1);
  assert.equal(checkMotionSourceDisplay(source("截至2026年，单位元，不含税"), { sourceTitle: "后台报告，第3页" }, frozen).length, 0);
  assert.doesNotThrow(() => checkMotionSourceDisplay(motionHtml("<div>能量来自哪里</div>","const note='来源：报告';"), {}, frozen));
  const specified: FrozenSourceDisplay = { scopeId: "project", policy: { mode: "specified", exceptions: [{ scopeId: "project", text: "来源：某机构", basis: "用户请求：保留该署名" }] } };
  assert.doesNotThrow(() => checkMotionSourceDisplay(source("来源：某机构"), {}, specified));
  assert.throws(() => checkMotionSourceDisplay(source("来源：某机构"), {}, { ...specified, scopeId: "other" }));
  assert.equal(sourceDisplayPolicySchema.safeParse({ mode: "specified", exceptions: [{ scopeId: "project", text: "署名", basis: "" }] }).success, false);
});

test("HTTP策略与源码拒绝原子性、冻结输入、幂等恢复和历史哈希", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-source-policy-"));
  const { app, application } = await createServer({ workspaceRoot: root });
  try {
    application.createProject({ name: "来源策略隔离验证" });
    const created = application.readProject(application.repository.listProjects()[0]!.id);
    const projectId = created.snapshot.project.id;
    assert.equal(created.snapshot.project.brief.explicitCreativePreferences, undefined);
    assert.deepEqual(created.snapshot.project.brief.sourceDisplayPolicy, { mode: "internal_only" });
    const submit = (work: typeof motionFixture, key = "同一提交") => app.inject({ method: "POST", url: `/api/projects/${projectId}/motion-works`, payload: { baseRevision: application.readProject(projectId).revision.number, idempotencyKey: key, work } });
    const work = sizeMotionFixture({ ...motionFixture, source: source("来源：研究报告") });
    const rejected = await submit(work);
    assert.equal(rejected.statusCode, 400);
    assert.equal(rejected.json().code, "SOURCE_CAPTION_NOT_ALLOWED");
    assert.equal(rejected.json().sideEffects, "none");
    assert.deepEqual(application.readProject(projectId), created);
    assert.equal(application.repository.listJobs(projectId).length, 0);
    const policy = { mode: "specified" as const, exceptions: [{ scopeId: projectId, text: "来源：研究报告", basis: "用户明确要求此署名，记录在本次任务" }] };
    const update = (sourceDisplayPolicy: unknown) => app.inject({ method: "PATCH", url: `/api/projects/${projectId}/brief`, payload: { baseRevision: application.readProject(projectId).revision.number, brief: { sourceDisplayPolicy } } });
    assert.equal((await update({ ...policy, exceptions: [{ ...policy.exceptions[0], scopeId: "不存在" }] })).statusCode, 400);
    assert.deepEqual(application.readProject(projectId), created);
    assert.equal((await update(policy)).statusCode, 200);
    const accepted = await submit(work); assert.equal(accepted.statusCode, 200);
    const job = accepted.json();
    assert.deepEqual(job.payload.sourceDisplay.policy, policy);
    const oldHash = motionHash(work);
    assert.notEqual(job.payload.version, oldHash);
    assert.equal(motionHashEngine(work, [], job.payload.version, MOTION_ENGINE_VERSION, [], [], job.payload.sourceDisplay), MOTION_ENGINE_VERSION);
    assert.throws(() => motionHashEngine(work, [], job.payload.version, MOTION_ENGINE_VERSION), /MOTION_VERSION_MISMATCH/);
    assert.equal((await update({ mode: "internal_only" })).statusCode, 200);
    assert.equal((await submit(work)).json().id, job.id, "已提交任务按原冻结输入恢复");
    assert.equal((await submit(work, "新提交")).statusCode, 400);
    assert.deepEqual(application.trackJob(job.id).payload, job.payload);
    assert.equal((await submit({ ...work, source: source("来源：另一机构") })).json().error, "MOTION_IDEMPOTENCY_CONFLICT");
    const legacy = application.repository.createJob({ projectId, kind: "motion_generation", idempotencyKey: "motion:历史", payload: { work, version: oldHash, boundImages: [], engineVersion: MOTION_ENGINE_VERSION } });
    assert.equal((await submit(work, "历史")).json().id, legacy.id);
    assert.equal(application.trackJob(legacy.id).payload.sourceDisplay, undefined);
  } finally { await app.close(); application.close(); await rm(root, { recursive: true, force: true }); }
});

test("原生Program拒绝整批写入、保留事实字段并冻结范围与缓存身份", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-program-policy-"));
  const app = createApplication(root);
  try {
    const initial = app.createProject({ name: "原生策略验证", brief: { explicitCreativePreferences: {} } });
    const projectId = initial.snapshot.project.id;
    const story = app.updateStory({ projectId, baseRevision: 1, title: "规则", summary: "规则的适用条件", beats: [{ title: "差异", purpose: "比较条件" }] });
    const map = app.manageNarrativeMap({ projectId, baseRevision: story.revision.number, viewerQuestion: "差异来自哪里", promisedModel: "比较规则", conclusion: "条件影响结果", beats: story.snapshot.story.beats.map(beat => ({ narrativeBeatId: beat.id, enteringKnowledge: "已知规则存在", question: "何时适用", newKnowledge: "理解适用条件", deferredInformation: "无", claim: "条件不同结果不同", evidenceCaptureIds: [] })) });
    const scopeId = map.snapshot.narrativeMap!.beats[0]!.id;
    const plan = { title: "适用范围", purpose: "比较条件", startFrame: 0, endFrame: 24, narrativeMapBeatId: scopeId, kind: "HeroReveal" as const, primaryTask: "看清条件", states: [
      { phase: "entry" as const, startFrame: 0, endFrame: 6, label: "进入" }, { phase: "progressive" as const, startFrame: 6, endFrame: 14, label: "展开" },
      { phase: "settled" as const, startFrame: 14, endFrame: 20, label: "阅读", detail: "不含税，单位元" }, { phase: "exit" as const, startFrame: 20, endFrame: 24, label: "退出" }
    ], props: { metric: "42%", source: "后台报告第3页", sourceCaption: "来源：报告" } };
    const compile = () => app.compileExplainerScenes({ projectId, baseRevision: app.readProject(projectId).revision.number, plans: [plan] });
    assert.throws(compile, SourceDisplayValidationError);
    assert.deepEqual(app.readProject(projectId), map);
    app.updateCreativeBrief({ projectId, baseRevision: map.revision.number, brief: { sourceDisplayPolicy: { mode: "specified", exceptions: [{ scopeId, text: plan.props.sourceCaption, basis: "用户要求署名" }] } } });
    const compiled = compile();
    assert.equal(compiled.snapshot.explainerPrograms[0]!.props.source, "后台报告第3页");
    assert.doesNotThrow(() => checkFrozenExplainerSourceDisplay(compiled.snapshot));
    const altered = structuredClone(compiled.snapshot); altered.explainerPrograms[0]!.props.sourceCaption = "未经允许";
    assert.throws(() => checkFrozenExplainerSourceDisplay(altered), SourceDisplayValidationError);
    delete altered.explainerPrograms[0]!.sourceDisplay;
    assert.doesNotThrow(() => checkFrozenExplainerSourceDisplay(altered), "历史Program不回填默认策略");
    app.updateCreativeBrief({ projectId, baseRevision: compiled.revision.number, brief: { sourceDisplayPolicy: { mode: "internal_only" } } });
    assert.throws(compile, SourceDisplayValidationError);
    assert.doesNotThrow(() => checkFrozenExplainerSourceDisplay(app.readProject(projectId).snapshot), "策略修改不改变已冻结作品");
    plan.props.sourceCaption = "";
    const revised = compile();
    assert.notEqual(revised.snapshot.explainerPrograms[0]!.cacheKey, compiled.snapshot.explainerPrograms[0]!.cacheKey);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
