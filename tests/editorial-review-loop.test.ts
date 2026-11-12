import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { canExport, evaluateQuality } from "@videocut/quality";
import { DomainError } from "@videocut/domain";
import { runProcess } from "@videocut/speech";
import type { EditorialReviewObservation, EditorialReviewPass } from "@videocut/contracts";
import { openEditorialFindings, productionReconciliation } from "../packages/quality-system/src/editorial-review.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createServer } from "../apps/server/src/app.js";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";

const passes: EditorialReviewPass[] = ["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"];

test("并发追加不会丢失问题，损坏审计不得静默放行", async () => {
  const f = await fixture();
  try {
    await Promise.all([0, 1].map((index) => f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["mute_visual"], previewEvidence: ["观察"], findings: [{ pass: "mute_visual", category: "motion", severity: "major", summary: `问题 ${index}`, impact: "损害观看", evidence: "回归输入" }] })));
    const review = await f.app.readEditorialQualityReview(f.base);
    assert.equal(review!.findings.length, 2);
    assert.equal(new Set(evaluateQuality(f.state.snapshot, f.base.revision, review).editorial.motion.map((entry) => entry.id)).size, 2, "同类别不同问题保持独立身份");
    await writeFile(join(f.state.snapshot.project.rootPath, "reports", `production-run-${f.run.id}.json`), "corrupted");
    await assert.rejects(() => f.app.readEditorialQualityReview(f.base), (error: unknown) => error instanceof DomainError && error.code === "EDITORIAL_REVIEW_READ_FAILED");
  } finally { await f.dispose(); }
});

test("真实 MCP Schema 支持阶段审片并把结构化证据和对账返回主流程", async () => {
  const f = await fixture();
  const environment = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(), env: { ...environment, VIDEOCUT_WORKSPACE: f.root }, stderr: "pipe" });
  const client = new Client({ name: "editorial-loop-regression", version: "1.0.0" });
  try {
    const preview = await f.preview();
    await client.connect(transport);
    const tools = (await client.listTools()).tools;
    const schema = tools.find((tool) => tool.name === "record_editorial_quality_review")!.inputSchema;
    const editor = await client.callTool({ name: "get_editor_url", arguments: { project_id: f.projectId, production_run_id: f.run.id, revision: f.base.revision, from_frame: 5, to_frame: 12 } });
    assert.notEqual(editor.isError, true);
    const editorResult = JSON.parse((editor.content as Array<{ text: string }>)[0]!.text);
    const editorUrl = new URL(editorResult.editorUrl);
    assert.equal(editorUrl.searchParams.get("productionRunId"), f.run.id);
    assert.equal(editorUrl.searchParams.get("fromFrame"), "5");
    assert.equal(editorUrl.searchParams.get("toFrame"), "12");
    const statusArgs = { project_id: f.projectId, run_id: f.run.id, completion_scope: { kind: "objects", object_ids: [f.state.snapshot.timeline.items[0]!.id] } };
    const statusResult = await client.callTool({ name: "read_production_status", arguments: statusArgs });
    assert.notEqual(statusResult.isError, true);
    const productionStatus = JSON.parse((statusResult.content as Array<{ text: string }>)[0]!.text);
    assert.equal(productionStatus.completion.revision, productionStatus.revision);
    assert.equal(productionStatus.completion.runId, f.run.id);
    const invalidStatus = await client.callTool({ name: "read_production_status", arguments: { project_id: f.projectId, run_id: f.run.id } });
    assert.notEqual(invalidStatus.isError, true);
    assert.ok(tools.find(tool => tool.name === "submit_motion_work")!.inputSchema.properties?.frame_range);
    assert.equal(Object.hasOwn(tools.find(tool => tool.name === "review_motion_work")!.inputSchema.properties!, "reference_match"), false);
    assert.ok(tools.find(tool => tool.name === "resume_voice_synthesis"));
    const batch = await client.callTool({ name: "track_jobs", arguments: { job_ids: [preview.id, preview.id, "job_missing"] } });
    assert.notEqual(batch.isError, true);
    const statuses = JSON.parse((batch.content as Array<{text: string}>)[0]!.text);
    assert.equal(statuses.length, 2);
    assert.equal(statuses[0].status, "succeeded");
    assert.ok(statuses[1].error);
    assert.ok(schema.properties?.observations && schema.properties?.resolutions);
    const recorded = await client.callTool({ name: "record_editorial_quality_review", arguments: { project_id: f.projectId, run_id: f.run.id, operation_id: "mcp-review", revision: f.base.revision, passes: ["mute_visual"], findings: [], observations: [{ pass: "mute_visual", preview_job_id: preview.id, start_frame: 5, end_frame: 12, method: "continuous_video", observation: "MCP 回归模拟观察声明" }] } });
    assert.ok(!recorded.isError, JSON.stringify(recorded));
    const quality = await client.callTool({ name: "read_quality_report", arguments: { project_id: f.projectId } });
    assert.ok(!quality.isError);
    const content = quality.content as Array<{ type: string; text?: string }>;
    const report = JSON.parse(content.find((entry) => entry.type === "text")!.text!);
    assert.equal(report.editorial.status, "partial");
    assert.equal(report.editorial.coverage.length, 5);
    assert.ok(Array.isArray(report.productionReconciliation));
    assert.equal(f.app.readProject(f.projectId).revision.number, f.base.revision);
  } finally { await transport.close(); await f.dispose(); }
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "editorial-evidence-"));
  const app = createApplication(root);
  const created = app.createProject({ name: "结构化审片测试" });
  const projectId = created.snapshot.project.id;
  const source = join(created.snapshot.project.rootPath, "assets/source/source.mp4");
  await mkdir(join(created.snapshot.project.rootPath, "assets/source"), { recursive: true });
  await runProcess("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=24:d=2", "-f", "lavfi", "-i", "sine=frequency=500:sample_rate=48000:duration=2", "-c:v", "mpeg4", "-c:a", "aac", "-shortest", source]);
  const imported = app.registerImportedAsset({ projectId, baseRevision: created.revision.number, name: "source.mp4", kind: "video", managedPath: "assets/source/source.mp4", sourceHash: await hashMediaFile(source), provenance: { source: "local_import", acquiredAt: new Date().toISOString() } });
  app.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: { durationMs: 2_000, hasAudio: true, width: 64, height: 64, fps: 24, videoCodec: "h264", audioCodec: "aac" } });
  const state = app.buildPresenterTimeline({ projectId, baseRevision: app.readProject(projectId).revision.number, assetIds: [imported.asset.id] });
  const previewRoot = join(created.snapshot.project.rootPath, "previews");
  await mkdir(previewRoot, { recursive: true });
  const run = await app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: app.readProject(projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId, loadedSkills: ["quality-verification"] });
  async function preview(revision = state.revision.number, from = 0, to = 48, silent = false) {
    const job = app.submitPreview({ projectId, revision, fromFrame: from, toFrame: to, idempotencyKey: `${revision}:${from}:${to}:${silent}` });
    const path = join(previewRoot, `${job.id}.mp4`);
    if (from === 0 && to === 48 && !silent) await copyFile(source, path);
    else await runProcess("ffmpeg", ["-y", "-i", source, "-ss", String(from / 24), "-t", String((to - from) / 24), ...(silent ? ["-an"] : []), "-c:v", "mpeg4", path]);
    app.updateJob(job.id, { status: "succeeded", result: { revision, fromFrame: from, toFrame: to, path } });
    return { ...job, path };
  }
  const base = { projectId, runId: run.id, revision: state.revision.number, previewEvidence: [], findings: [] };
  const observe = (previewJobId: string, startFrame = 0, endFrame = 48, selected = passes): EditorialReviewObservation[] => selected.map((pass) => ({ pass, previewJobId, startFrame, endFrame, method: pass === "audio_only" ? "audio" : pass === "mute_visual" ? "continuous_video" : "audiovisual", observation: "测试观察声明，不代表真人或模型实际审美判断" }));
  return { root, app, projectId, state, run, base, preview, observe, dispose: async () => { app.close(); await rm(root, { recursive: true, force: true }); } };
}

test("独立审阅按实际选择的声音或画面方式收口，不升级为声画观察", async () => {
  const f = await fixture();
  try {
    for (const [pass, method] of [["audio_only", "audio"], ["mute_visual", "continuous_video"]] as const) {
      const scope = { kind: "frames" as const, startFrame: 5, endFrame: 12 };
      const run = await f.app.startProductionRun({ projectId: f.projectId, baseRevision: f.state.revision.number, intent: "review_only", completionScope: scope,
        operationId: `independent-${method}`, loadedSkills: ["quality-verification"] });
      await f.app.recordEditorialQualityReview({ projectId: f.projectId, runId: run.id, revision: f.state.revision.number, operationId: `observe-${method}`,
        passes: [pass], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "隔离测试", pass, method,
          startFrame: 5, endFrame: 12, observation: `测试声明：仅检查${method}` }] });
      const status = await f.app.readProductionStatus(f.projectId, { runId: run.id });
      assert.equal(status.completion?.ready, true);
      assert.equal(status.completion?.validObservations[0]?.method, method);
    }
  } finally { await f.dispose(); }
});

test("工作台观察随局部字幕修改分段复用，结果版复查后可收口并幂等重试", async () => {
  const f = await fixture();
  try {
    f.app.importSrtCaptions({ projectId: f.projectId, baseRevision: f.state.revision.number, srtText: "1\n00:00:00,000 --> 00:00:01,000\n修改前\n", sourceName: "工作台复查", targetRange: { startFrame: 0, endFrame: 48 }, writePolicy: "reject_conflicts", idempotencyKey: "workbench-caption" });
    const initial = f.app.readProject(f.projectId);
    const caption = initial.snapshot.timeline.captions[0]!;
    const scope = { kind: "objects" as const, objectIds: [caption.id] };
    const run = await f.app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), intent: "local_edit", completionScope: scope, projectId: f.projectId, baseRevision: initial.revision.number, loadedSkills: ["web-editor-operator"] });
    const firstStatus = await f.app.readProductionStatus(f.projectId, { runId: run.id, completionScope: scope });
    assert.equal(firstStatus.completion!.ready, false);
    const initialReview = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(),
      projectId: f.projectId, runId: run.id, revision: initial.revision.number, passes: ["audiovisual", "mute_visual"], previewEvidence: [],
      observations: [{ source: "workbench", observer: "隔离测试", pass: "audiovisual", method: "audiovisual", startFrame: 0, endFrame: 48, observation: "测试声明：已观察完整声画" }],
      findings: [{ pass: "mute_visual", severity: "major", category: "typography", summary: "字幕文字需要修改", evidence: "工作台测试观察", impact: "影响字幕", objectId: caption.id, frameRange: { startFrame: caption.startFrame, endFrame: caption.endFrame } }]
    });
    const evidenceId = initialReview.editorialReview!.evidenceRecords![0]!.id;
    const findingId = initialReview.editorialReview!.findings[0]!.id;
    const changed = f.app.editCaptions({ projectId: f.projectId, baseRevision: initial.revision.number, captionId: caption.id, action: "update", text: "修改后" });
    const review = await f.app.readEditorialQualityReview({ projectId: f.projectId, revision: changed.revision.number });
    assert.deepEqual(review!.applicableEvidence!.filter(part => part.evidenceId === evidenceId).map(({ startFrame, endFrame }) => ({ startFrame, endFrame })), [{ startFrame: caption.endFrame, endFrame: 48 }]);
    const pending = await f.app.readProductionStatus(f.projectId, { runId: run.id, completionScope: scope });
    assert.ok(pending.completion!.observationGaps.length);
    assert.deepEqual(pending.completion!.openRequiredFindingIds, [findingId]);
    const observed = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), projectId: f.projectId, runId: run.id, revision: changed.revision.number, passes: ["mute_visual"], previewEvidence: [], findings: [], observations: [{ source: "workbench", observer: "隔离测试", pass: "mute_visual", method: "frames", startFrame: caption.startFrame, endFrame: caption.startFrame + 1, observation: "测试声明：已复查字幕文字" }] });
    const newEvidenceId = observed.editorialReview!.evidenceRecords!.at(-1)!.id;
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), projectId: f.projectId, runId: run.id, revision: changed.revision.number, passes: ["mute_visual"], previewEvidence: [], findings: [], resolutions: [{ findingId, evidenceIds: [newEvidenceId], note: "测试声明：文字已修正", scope: "caption_text" }] });
    const completed = await f.app.completeProductionRun({ operationId: globalThis.crypto.randomUUID(), projectId: f.projectId, runId: run.id, finalRevision: changed.revision.number, completionScope: scope });
    assert.equal(completed.status, "completed", completed.completionBlockers.join("; "));
    const repeated = await f.app.completeProductionRun({ operationId: globalThis.crypto.randomUUID(), projectId: f.projectId, runId: run.id, finalRevision: changed.revision.number, completionScope: scope });
    assert.equal(repeated.completedAt, completed.completedAt);
    const status = await f.app.readProductionStatus(f.projectId, { runId: run.id, completionScope: scope });
    assert.equal(status.completion!.recordedStatus, "completed");
    assert.equal(status.completion!.revision, changed.revision.number);
    assert.equal(f.app.listJobs(f.projectId).filter(job => job.kind === "preview" || job.kind === "export").length, 0);
  } finally { await f.dispose(); }
});

test("工作台声画观察在局部声音变更后只保留依赖未变的范围", async () => {
  const f = await fixture();
  try {
    const recorded = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["audiovisual"], observations: [{
      source: "workbench", observer: "隔离测试", pass: "audiovisual", method: "audiovisual", startFrame: 0, endFrame: 48, observation: "测试声明：观察原始声画"
    }] });
    const evidenceId = recorded.editorialReview!.evidenceRecords![0]!.id;
    const soundPath = join(f.state.snapshot.project.rootPath, "assets/source/local-sound.wav");
    await runProcess("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=400:sample_rate=48000:duration=0.5", "-c:a", "pcm_s16le", soundPath]);
    const imported = f.app.registerImportedAsset({ projectId: f.projectId, baseRevision: f.app.readProject(f.projectId).revision.number, name: "local-sound.wav", kind: "audio", managedPath: "assets/source/local-sound.wav", sourceHash: await hashMediaFile(soundPath) });
    f.app.applyMediaAnalysis({ projectId: f.projectId, assetId: imported.asset.id, metadata: { durationMs: 500, hasAudio: true, audioCodec: "pcm_s16le" } });
    const changed = f.app.placeNarration({ projectId: f.projectId, baseRevision: f.app.readProject(f.projectId).revision.number, assetId: imported.asset.id, startFrame: 0, sourceStartFrame: 0, sourceEndFrame: 12 });
    const review = await f.app.readEditorialQualityReview({ projectId: f.projectId, revision: changed.revision.number });
    const parts = review!.applicableEvidence!.filter(part => part.evidenceId === evidenceId);
    assert.ok(parts.every(part => part.startFrame >= 12), "新增声音的位置应重新检查");
    assert.ok(parts.some(part => part.endFrame === 48 && part.startFrame <= 24), "声音影响范围之外应复用旧观察");
  } finally { await f.dispose(); }
});

test("工作台观察固定版本和范围，不伪造预览文件或修改视频", async () => {
  const f = await fixture();
  try {
    const observation: EditorialReviewObservation = { source: "workbench", observer: "测试审阅者", pass: "mute_visual", startFrame: 5, endFrame: 12, method: "frames", observation: "实际检查指定静帧，连续运动尚未观察" };
    const report = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["mute_visual"], observations: [observation] });
    const evidence = report.editorialReview!.evidenceRecords![0]!;
    assert.equal(evidence.source, "workbench");
    assert.equal(evidence.previewJobId, undefined);
    assert.equal(evidence.relativePath, undefined);
    assert.equal(evidence.contentHash, undefined);
    assert.match(evidence.snapshotHash!, /^[a-f0-9]{64}$/);
    assert.equal(evidence.workbenchIdentity!.resources[0]!.hash, f.state.snapshot.assets[0]!.sourceHash);
    await writeFile(join(f.state.snapshot.project.rootPath, "assets/source/source.mp4"), "changed");
    assert.equal((await f.app.readEditorialQualityReview(f.base))!.evidenceRecords!.length, 0, "实际素材改变后旧观察不再有效");
    await assert.rejects(f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["mute_visual"], observations: [observation] }), error => error instanceof DomainError && error.code === "EDITORIAL_RESOURCE_CHANGED");
    assert.equal(f.app.readProject(f.projectId).revision.number, f.base.revision);
    assert.equal((await f.app.readEditorialQualityReview(f.base))!.evidenceRecords!.length, 0);
    assert.equal(evaluateQuality(f.state.snapshot, f.base.revision, await f.app.readEditorialQualityReview(f.base)).editorial.coverage!.find(entry => entry.pass === "mute_visual")!.complete, false);
    await assert.rejects(() => f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["mute_visual"], observations: [{ ...observation, previewJobId: "fake" }] }), /不能填写 Preview Job/u);
  } finally { await f.dispose(); }
});

test("工作台观察、返修工作单和结果版复查沿同一审计闭环", async () => {
  const f = await fixture();
  const { app: server, application } = await createServer({ workspaceRoot: f.root });
  try {
    const itemId = f.state.snapshot.timeline.items[0]!.id;
    const editorUrl = await server.inject({ method: "GET", url: `/api/projects/${f.projectId}/editor-url?productionRunId=${encodeURIComponent(f.run.id)}&revision=${f.base.revision}&fromFrame=5&toFrame=12` });
    assert.equal(editorUrl.statusCode, 200, editorUrl.body);
    assert.equal(new URL(editorUrl.json().editorUrl).searchParams.get("productionRunId"), f.run.id);
    const observation = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`, payload: {
      operationId: "observation-one", runId: f.run.id, revision: f.base.revision, pass: "mute_visual", method: "frames", observer: "审片者", observation: "第五帧发生遮挡", startFrame: 5, endFrame: 12,
      finding: { category: "motion", severity: "warning", summary: "遮挡文字", impact: "影响阅读", objectId: itemId }
    } });
    assert.equal(observation.statusCode, 200, observation.body);
    const recorded = observation.json();
    assert.equal(recorded.runId, f.run.id);
    const finding = recorded.review.findings[0];
    assert.equal(recorded.review.evidenceRecords[0].previewJobId, undefined);
    assert.equal(application.readProject(f.projectId).revision.number, f.base.revision);
    const order = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/agent-work-orders`, payload: {
      baseRevision: f.base.revision, title: "处理遮挡", intent: "请原作者调整文字与动作", relatedObjectIds: [itemId],
      reviewContext: { revision: f.base.revision, findingIds: [finding.id], frameRange: { startFrame: 5, endFrame: 12 } }
    } });
    assert.equal(order.statusCode, 201, order.body);
    assert.deepEqual(order.json().workOrder.reviewContext.findingIds, [finding.id]);
    const revision = order.json().state.revision.number;
    const checked = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/workbench-observations`, payload: {
      operationId: "observation-two", runId: recorded.runId, revision, pass: "mute_visual", method: "continuous_video", observer: "审片者", observation: "复查运动及两端接点", startFrame: 4, endFrame: 13
    } });
    assert.equal(checked.statusCode, 200, checked.body);
    const evidence = checked.json().review.evidenceRecords.at(-1);
    const resolution = await server.inject({ method: "POST", url: `/api/projects/${f.projectId}/editorial-resolutions`, payload: {
      operationId: "resolution-one", runId: recorded.runId, revision, pass: "mute_visual", findingId: finding.id, evidenceIds: [evidence.id], note: "已确认遮挡消失"
    } });
    assert.equal(resolution.statusCode, 200, resolution.body);
    const current = await server.inject({ method: "GET", url: `/api/projects/${f.projectId}/editorial-review?revision=${revision}` });
    assert.equal(current.json().resolutions[0].findingId, finding.id);
    const status = await server.inject({ method: "GET", url: `/api/projects/${f.projectId}/production-status?runId=${encodeURIComponent(f.run.id)}&completionScope=${encodeURIComponent(JSON.stringify({ kind: "objects", objectIds: [itemId] }))}` });
    assert.equal(status.statusCode, 200, status.body);
    assert.equal(status.json().completion.runId, f.run.id);
    assert.equal(status.json().completion.revision, revision);
    const invalid = await server.inject({ method: "GET", url: `/api/projects/${f.projectId}/production-status?runId=${encodeURIComponent(f.run.id)}` });
    assert.equal(invalid.statusCode, 200);
    assert.equal(application.readProject(f.projectId).revision.number, revision, "观察及复查不创建视频版本");
  } finally { await server.close(); application.close(); await f.dispose(); }
});

test("字幕文字单帧复核只关闭对应文字问题，不关闭动态也不补全连续覆盖", async () => {
  const f = await fixture();
  try {
    const state = f.app.repository.commit(f.projectId, f.base.revision, "测试字幕", (snapshot) => {
      snapshot.speechSegments.push({ id: "static-speech-test", text: "情况", semanticUnitIds: [], scriptRevision: 0, order: 0 } as any);
      snapshot.timeline.captions.push({ speechSegmentId: "static-speech-test", id: "caption-static-test", startFrame: 5, endFrame: 20, text: "情况" } as any);
    });
    const base = { ...f.base, revision: state.revision.number, passes: ["mute_visual"] as EditorialReviewPass[] };
    const finding = { pass: "mute_visual" as const, severity: "major" as const, category: "semantic" as const, summary: "显示错字", evidence: "测试观察", impact: "影响字义", objectId: "caption-static-test", frameRange: { startFrame: 6, endFrame: 7 } };
    const first = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, previewEvidence: ["发现文字及动态问题"], findings: [finding, { ...finding, category: "motion", summary: "换卡闪烁" }] });
    const ids = first.editorialReview!.findings.map((entry) => entry.id);
    const next = f.app.updateStory({ projectId: f.projectId, baseRevision: base.revision, title: "新版" });
    base.revision = next.revision.number;
    const preview = await f.preview(base.revision);
    const checked = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, observations: [{ pass: "mute_visual", previewJobId: preview.id, startFrame: 6, endFrame: 7, method: "frames", observation: "只看到该帧文字正确" }] });
    const evidenceIds = [checked.editorialReview!.evidenceRecords!.at(-1)!.id];
    const resolve = (findingId: string, scope?: "caption_text") => f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, resolutions: [{ findingId, evidenceIds, note: "仅字面显示复核", scope }] });
    await assert.rejects(resolve(ids[0]), /连续证据/u);
    await assert.rejects(resolve(ids[1], "caption_text"), /不能关闭声音或运动/u);
    // 已结束的旧Run保持不可追加；新Run可引用仍有效的旧Run当前版本证据。
    checked.status = "completed";
    await writeFile(join(f.state.snapshot.project.rootPath, "reports", `production-run-${base.runId}.json`), JSON.stringify(checked));
    await assert.rejects(resolve(ids[0], "caption_text"), /已结束/u);
    const followup = await f.app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: f.app.readProject(f.projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId: f.projectId, loadedSkills: ["quality-verification"] });
    base.runId = followup.id;
    await resolve(ids[0], "caption_text");
    const review = await f.app.readEditorialQualityReview(base);
    assert.deepEqual(openEditorialFindings(review).map((entry) => entry.id), [ids[1]]);
    assert.equal(evaluateQuality(next.snapshot, base.revision, review).editorial.coverage!.find((entry) => entry.pass === "mute_visual")!.complete, false);
    await writeFile(preview.path, "替换证据");
    assert.equal(openEditorialFindings(await f.app.readEditorialQualityReview(base)).length, 2);
  } finally { await f.dispose(); }
});

test("局部和抽帧证据不等于全片，逐阶段累积并保留真实哈希", async () => {
  const f = await fixture();
  try {
    const local = await f.preview(f.base.revision, 0, 24);
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["mute_visual"], observations: [{ ...f.observe(local.id, 0, 24, ["mute_visual"])[0]!, method: "frames" }] });
    let review = await f.app.readEditorialQualityReview(f.base);
    assert.equal(evaluateQuality(f.state.snapshot, f.base.revision, review).editorial.coverage!.find((entry) => entry.pass === "mute_visual")!.complete, false);
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes, observations: f.observe(local.id, 0, 24) });
    review = await f.app.readEditorialQualityReview(f.base);
    let quality = evaluateQuality(f.state.snapshot, f.base.revision, review);
    assert.equal(quality.editorial.status, "partial");
    assert.equal(canExport(quality, "delivery"), true, "未审完不阻挡生成文件");
    assert.equal(canExport(quality, "draft"), true, "未审片仍允许草稿迭代");
    assert.match(review!.evidenceRecords![0]!.contentHash!, /^[a-f0-9]{64}$/);
    const tail = await f.preview(f.base.revision, 24, 48);
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes, observations: f.observe(tail.id, 24, 48) });
    review = await f.app.readEditorialQualityReview(f.base);
    quality = evaluateQuality(f.state.snapshot, f.base.revision, review);
    assert.deepEqual(quality.editorial.coverage!.filter((entry) => !entry.complete).map((entry) => entry.pass), ["first_viewer"], "首次观众不能用两个片段拼出全片体验");
    const full = await f.preview();
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, passes: ["first_viewer"], observations: f.observe(full.id, 0, 48, ["first_viewer"]) });
    review = await f.app.readEditorialQualityReview(f.base);
    quality = evaluateQuality(f.state.snapshot, f.base.revision, review);
    assert.equal(quality.editorial.status, "reviewed");
    assert.equal(canExport(quality, "delivery"), true);
    assert.equal(f.app.readProject(f.projectId).revision.number, f.base.revision, "审阅不制造视频 Revision");
    await writeFile(full.path, "changed");
    const changed = evaluateQuality(f.state.snapshot, f.base.revision, await f.app.readEditorialQualityReview(f.base));
    assert.equal(changed.editorial.status, "partial", "文件替换会使哈希证据失效");
  } finally { await f.dispose(); }
});

test("拒绝旧 Revision、范围越界、伪造媒体、无音轨和错误观察方式", async () => {
  const f = await fixture();
  try {
    const local = await f.preview(f.base.revision, 0, 24);
    const rejects = (observations: EditorialReviewObservation[], code: string, revision = f.base.revision) => assert.rejects(() => f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, revision, passes, observations }), (error: unknown) => error instanceof DomainError && error.code === code);
    await rejects(f.observe(local.id), "EDITORIAL_EVIDENCE_RANGE_INVALID");
    await rejects([{ ...f.observe(local.id, 0, 24)[0]!, method: "frames" }], "EDITORIAL_METHOD_INVALID");
    const silent = await f.preview(f.base.revision, 0, 48, true);
    await rejects(f.observe(silent.id), "EDITORIAL_AUDIO_MISSING");
    await writeFile(local.path, "not a video");
    await rejects(f.observe(local.id, 0, 24), "EDITORIAL_EVIDENCE_MEDIA_INVALID");
    const next = f.app.updateStory({ projectId: f.projectId, baseRevision: f.base.revision, title: "修订" });
    await rejects(f.observe(silent.id), "EDITORIAL_PREVIEW_MISMATCH", next.revision.number);
  } finally { await f.dispose(); }
});

test("问题跨 Run、Revision 保留，只有当前范围复核才能关闭且文件失效会重新待审", async () => {
  const f = await fixture();
  try {
    const cueState = f.app.createEffectCue({ projectId: f.projectId, baseRevision: f.base.revision, sceneId: f.state.snapshot.scenes[0]!.id, type: "CameraPunch", layer: "actor", startFrame: 5, endFrame: 10, note: "测试定位" });
    const revision = cueState.revision.number;
    const cueId = cueState.snapshot.effectCues[0]!.id;
    const first = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...f.base, revision, passes: ["mute_visual"], previewEvidence: ["发现局部问题"], findings: [{ pass: "mute_visual", severity: "major", category: "motion", summary: "运动入口闪烁", evidence: "测试观察", impact: "破坏连续性", objectId: cueId, frameRange: { startFrame: 5, endFrame: 10 } }] });
    const findingId = first.editorialReview!.findings[0]!.id;
    const next = f.app.updateStory({ projectId: f.projectId, baseRevision: revision, title: "下一版" });
    const secondRun = await f.app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: f.app.readProject(f.projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId: f.projectId, loadedSkills: ["quality-verification"] });
    const base = { ...f.base, revision: next.revision.number, runId: secondRun.id, passes: ["mute_visual"] as EditorialReviewPass[] };
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, previewEvidence: ["恢复任务"] });
    assert.equal(openEditorialFindings(await f.app.readEditorialQualityReview(base))[0]!.id, findingId);
    const preview = await f.preview(next.revision.number);
    const tooShort = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, observations: f.observe(preview.id, 5, 7, ["mute_visual"]) });
    await assert.rejects(() => f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, resolutions: [{ findingId, evidenceIds: [tooShort.editorialReview!.evidenceRecords![0]!.id], note: "局部不够" }] }), (error: unknown) => error instanceof DomainError && error.code === "EDITORIAL_RESOLUTION_EVIDENCE_REQUIRED");
    const checked = await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, observations: f.observe(preview.id, 4, 11, ["mute_visual"]) });
    await f.app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...base, resolutions: [{ findingId, evidenceIds: [checked.editorialReview!.evidenceRecords!.at(-1)!.id], note: "复核当前对象完整进入退出" }] });
    let review = await f.app.readEditorialQualityReview(base);
    assert.equal(openEditorialFindings(review).length, 0);
    assert.equal(review!.findings.length, 1, "关闭保留历史而不是删除问题");
    assert.equal(openEditorialFindings(await f.app.readEditorialQualityReview({ projectId: f.projectId, revision })).length, 1, "新版本关闭不改写旧版本结论");
    await writeFile(preview.path, "replaced");
    review = await f.app.readEditorialQualityReview(base);
    assert.equal(openEditorialFindings(review).length, 1);
  } finally { await f.dispose(); }
});

test("共用长 Scene 不会把一个效果误算为每拍都实现，stale 计划不会算成主动留白", async () => {
  const f = await fixture();
  try {
    const snapshot = structuredClone(f.state.snapshot);
    snapshot.story.beats = ["a", "b"].map((id, order) => ({ id, order, title: id, purpose: "测试", semanticUnitIds: [], sceneIds: [snapshot.scenes[0]!.id] }));
    snapshot.visualTreatments = ["a", "b"].map((id) => ({ id: `t-${id}`, narrativeBeatId: id, sceneId: snapshot.scenes[0]!.id, mode: "remotion", intensity: "high", primaryAttention: "对比", narrativePurpose: "测试", status: id === "a" ? "ready" : "stale", createdAt: "", updatedAt: "" }));
    const cue = f.app.createEffectCue({ projectId: f.projectId, baseRevision: f.base.revision, sceneId: snapshot.scenes[0]!.id, type: "CameraPunch", layer: "actor", startFrame: 5, endFrame: 10, note: "测试" }).snapshot.effectCues[0]!;
    snapshot.effectCues = [{ ...cue, semanticAnchor: { type: "narrative_beat", targetId: "a", relation: "land_on" } }];
    const rows = productionReconciliation(snapshot);
    assert.equal(rows[0]!.linkedEffectCueIds.length, 1);
    assert.equal(rows[1]!.linkedEffectCueIds.length, 0);
    assert.deepEqual(rows[1]!.staleTreatmentIds, ["t-b"]);
  } finally { await f.dispose(); }
});

test("严重观感问题不得被质量门禁丢弃，空报告和新 Run 不得清除待修问题", async () => {
  const root = await mkdtemp(join(tmpdir(), "editorial-loop-"));
  const app = createApplication(root);
  try {
    const state = app.createProject({ name: "审片闭环回归" });
    const projectId = state.snapshot.project.id;
    const revision = state.revision.number;
    const run = await app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: app.readProject(projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId, loadedSkills: ["quality-verification"] });
    const input = { projectId, runId: run.id, revision, passes, previewEvidence: ["历史文字证据（不代表连续看过）"] };
    const first = await app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...input, findings: [{ pass: "mute_visual", severity: "major", category: "attention", summary: "重点遮挡人物五官", evidence: "局部观察", impact: "影响阅读与人物表达" }] });
    const findingId = first.editorialReview!.findings[0]!.id;
    const quality = evaluateQuality(state.snapshot, revision, first.editorialReview);
    assert.ok(quality.editorial.attention.some((issue) => issue.message === "重点遮挡人物五官"));
    await app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...input, findings: [] });
    const secondRun = await app.startProductionRun({ operationId: globalThis.crypto.randomUUID(), baseRevision: app.readProject(projectId).revision.number, intent: "local_edit", completionScope: { kind: "project" }, projectId, loadedSkills: ["quality-verification"] });
    await app.recordEditorialQualityReview({ operationId: globalThis.crypto.randomUUID(), ...input, runId: secondRun.id, findings: [] });
    const review = await app.readEditorialQualityReview({ projectId, revision });
    assert.ok(review!.findings.some((finding) => finding.id === findingId));
  } finally {
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});
