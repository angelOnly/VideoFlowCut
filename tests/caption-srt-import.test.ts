import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parseSrt } from "../packages/contracts/src/caption-srt.js";
import { projectFrameRateChange, assertProjectGraphValid } from "@videocut/domain";
import { createServer } from "../apps/server/src/app.js";
import { validCaptionDisplay } from "../packages/contracts/src/caption-presentation.js";
import { prepareProjectFrameRateChange } from "../packages/edit-application/src/frame-rate-change.js";

const srt = "\uFEFF1\r\n00:00:02,013 --> 00:00:03,027\r\n 原文第一行 \r\n第二行\r\n\r\n2\r\n00:00:03,027 --> 00:00:04,011\r\n后续文字\r\n";

test("SRT 完整解析：保留原文、换行与毫秒，拒绝损坏、重复、重叠和空段", () => {
  assert.deepEqual(parseSrt(srt), [{ index: 1, text: " 原文第一行 \n第二行", startMs: 2013, endMs: 3027 }, { index: 2, text: "后续文字", startMs: 3027, endMs: 4011 }]);
  for (const bad of ["", "1\n00:00:02,000 --> 00:00:01,000\n倒序", "1\n00:61:00,000 --> 00:61:01,000\n时间错误", srt + "\n3\n损坏块", srt.replace("2\r\n00:00:03", "1\r\n00:00:03"), srt.replace("00:00:03,027 -->", "00:00:02,900 -->"), "1\n00:00:00,000 --> 00:00:01,000\n "]) assert.throws(() => parseSrt(bad));
});

test("原 SRT 经 MCP 批量创建，幂等、原子拒绝、显式偏移与帧率换算", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-srt-import-"));
  const { app, application } = await createServer({ workspaceRoot: root });
  const client = new Client({ name: "SRT 隔离合同验证", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(), env: { ...process.env as Record<string, string>, VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  try {
    const initial = application.createProject({ name: "原 SRT 导入隔离验证" });
    const projectId = initial.snapshot.project.id;
    const scene = application.createScene({ projectId, baseRevision: initial.revision.number, type: "PresenterScene", title: "字幕测试画布", purpose: "仅验证字幕合同", startFrame: 0, endFrame: 600 });
    const prepared = application.repository.commit(projectId, scene.revision.number, "隔离测试时间线", snapshot => { snapshot.scenes[0]!.status = "ready"; });
    await client.connect(transport);
    const args = { project_id: projectId, base_revision_id: prepared.revision.number, action: "import_srt", srt_text: srt,
      source_name: "用户交付/字幕时间.srt", target_range: { start_frame: 30, end_frame: 150 }, write_policy: "reject_conflicts", idempotency_key: "original-srt" };
    const response = await client.callTool({ name: "manage_captions", arguments: args });
    assert.notEqual(response.isError, true, JSON.stringify(response));
    const imported = application.readProject(projectId);
    const cards = imported.snapshot.timeline.captions;
    const fps = imported.snapshot.timeline.fps;
    assert.equal(imported.revision.number, prepared.revision.number + 1);
    assert.equal(cards.length, 2);
    assert.equal(cards[0]!.startFrame, Math.round(2.013 * fps), "目标起点不能导致本片局部 SRT 二次平移");
    assert.equal(cards[0]!.endFrame, cards[1]!.startFrame, "相邻边界使用同一半开量化");
    assert.equal(cards[0]!.text, " 原文第一行 \n第二行");
    assert.equal(cards[0]!.precision, "subtitle_exact");
    assert.equal(cards[0]!.speechSegmentId, undefined);
    assert.equal(cards[0]!.sourceBridgeRunId, undefined);
    assert.equal(cards[0]!.sourceTokenStartIndex, undefined);
    assert.equal(cards[0]!.srtSource?.startMs, 2013);
    const record = imported.snapshot.timeline.captionImports![0]!;
    assert.equal(record.sourceName, args.source_name);
    assert.equal(record.srtText, srt);
    assert.equal(record.offsetMs, 0);
    const readResponse = await client.callTool({ name: "read_captions", arguments: { project_id: projectId } });
    assert.deepEqual(JSON.parse((readResponse.content as Array<{ text: string }>)[0]!.text).captionImports, [record]);
    for (const card of cards) {
      assert.ok(Math.abs(card.startFrame / fps * 1000 - card.srtSource!.startMs) <= 500 / fps + 1e-8);
      assert.ok(Math.abs(card.endFrame / fps * 1000 - card.srtSource!.endMs) <= 500 / fps + 1e-8);
    }
    const replay = await client.callTool({ name: "manage_captions", arguments: args });
    assert.notEqual(replay.isError, true, JSON.stringify(replay));
    assert.equal(application.readProject(projectId).revision.number, imported.revision.number);
    for (const change of [
      { srt_text: srt + "\n3\n损坏后半部", idempotency_key: "broken" },
      { srt_text: srt.replace("后续文字", "更改内容") },
      { idempotency_key: "conflict" },
      { idempotency_key: "negative", offset_ms: -3000 },
      { idempotency_key: "outside", offset_ms: 9000 },
      { idempotency_key: "collapsed", srt_text: "1\n00:00:00,001 --> 00:00:00,002\n短", target_range: { start_frame: 0, end_frame: 150 } },
      { idempotency_key: "cut-card", write_policy: "replace_range", srt_text: "1\n00:00:02,500 --> 00:00:03,000\n替换", target_range: { start_frame: 70, end_frame: 150 } }
    ]) {
      const rejected = await client.callTool({ name: "manage_captions", arguments: { ...args, base_revision_id: imported.revision.number, ...change } });
      assert.equal(rejected.isError, true, JSON.stringify(change));
      const diagnostic = JSON.parse((rejected.content as Array<{ text: string }>)[0]!.text);
      assert.equal(diagnostic.sideEffects, "none");
      assert.equal(diagnostic.safeToRetry, true);
      assert.deepEqual(application.readProject(projectId), imported, "全量失败不能留下部分卡或导入记录");
    }
    assert.throws(() => application.importSrtCaptions({ projectId, baseRevision: prepared.revision.number, srtText: srt, sourceName: "另一份", offsetMs: 5000, targetRange: { startFrame: 150, endFrame: 600 }, writePolicy: "reject_conflicts", idempotencyKey: "stale" }), /Revision 已过期/u);
    const http = await app.inject({ method: "POST", url: `/api/projects/${projectId}/captions/import-srt`, payload: { baseRevision: imported.revision.number, srtText: "1\n00:00:00,000 --> 00:00:02,000\n明确偏移", sourceName: "用户局部字幕.srt", offsetMs: 2000, targetRange: { startFrame: 30, endFrame: 150 }, writePolicy: "replace_range", idempotencyKey: "replacement" } });
    assert.equal(http.statusCode, 200, http.body);
    const replaced = application.readProject(projectId);
    assert.equal(replaced.snapshot.timeline.captions.length, 1);
    assert.equal(replaced.snapshot.timeline.captions[0]!.startFrame, 2 * fps);
    assert.equal(replaced.snapshot.timeline.captionImports!.length, 2);
    const oldReplay = await client.callTool({ name: "manage_captions", arguments: args });
    assert.notEqual(oldReplay.isError, true);
    assert.deepEqual(application.readProject(projectId), replaced, "旧幂等请求不恢复已替换的卡");
    const captionId = replaced.snapshot.timeline.captions[0]!.id;
    const edited = application.editCaptions({ projectId, baseRevision: replaced.revision.number, action: "update", captionId, text: "显示修订" });
    assert.equal(edited.snapshot.timeline.captions[0]!.sourceText, "明确偏移");
    const reset = application.editCaptions({ projectId, baseRevision: edited.revision.number, action: "reset", captionId });
    assert.equal(reset.snapshot.timeline.captions[0]!.text, "明确偏移");
    // 使用带小数毫秒的原文件再次验证 24/25/60 fps，不能沿旧帧数反复取整。
    const timed = application.importSrtCaptions({ projectId, baseRevision: reset.revision.number, srtText: srt, sourceName: "用户字幕时间.srt", targetRange: { startFrame: 30, endFrame: 150 }, writePolicy: "replace_range", idempotencyKey: "fps" });
    for (const targetFps of [24, 25, 30, 60]) {
      const changed = projectFrameRateChange(timed.snapshot, targetFps).snapshot;
      assert.equal(changed.timeline.captions[0]!.startFrame, Math.round(2.013 * targetFps));
      assert.equal(changed.timeline.captions[1]!.endFrame, Math.round(4.011 * targetFps));
      assertProjectGraphValid(changed);
    }
    assert.throws(() => application.repository.commit(projectId, timed.revision.number, "隔离伪造词级精度", snapshot => { snapshot.timeline.captions[0]!.precision = "word_exact"; }), { code: "PROJECT_GRAPH_INVALID" });
    assert.equal(application.readProject(projectId).revision.number, timed.revision.number);
    application.setProjectFrameRate({ projectId, baseRevision: timed.revision.number, fps: 24 });
    const exact = application.importSrtCaptions({ projectId, baseRevision: application.readProject(projectId).revision.number, sourceName: "边界.srt", srtText: "1\n00:00:00,017 --> 00:00:01,017\n边界", targetRange: { startFrame: 0, endFrame: 192 }, writePolicy: "replace_range", idempotencyKey: "boundary" });
    const exactCard = exact.snapshot.timeline.captions[0]!;
    assert.deepEqual([exactCard.startFrame, exactCard.endFrame], [0, 24]);
    const shown = application.editCaptions({ projectId, baseRevision: exact.revision.number, action: "update", captionId: exactCard.id, display: { mode: "shown", ranges: [{ startFrame: 0, endFrame: 24 }] } });
    const upsampled = prepareProjectFrameRateChange(shown.snapshot, 60, shown.revision.number, []);
    const projected = upsampled.snapshot.timeline.captions[0]!;
    assert.equal(upsampled.report.canApply, true);
    assert.deepEqual([projected.startFrame, projected.endFrame], [1, 61]);
    assert.deepEqual(projected.display?.ranges, [{ startFrame: 1, endFrame: 61 }]);
    assert.ok(validCaptionDisplay(projected));
    assert.ok(upsampled.report.maxBoundaryErrorMs >= 1000 / 60 - 1e-8, "误差使用最终边界而非中间旧帧映射");
    const collapsed = structuredClone(upsampled.snapshot);
    collapsed.timeline.captions[0]!.display = { mode: "shown", ranges: [{ startFrame: 3, endFrame: 4 }] };
    assert.equal(prepareProjectFrameRateChange(collapsed, 15, 0, []).report.canApply, false, "显示片段压缩为空时阻止提交");
  } finally {
    await client.close(); await transport.close(); await app.close(); application.close();
    await rm(root, { recursive: true, force: true });
  }
});
