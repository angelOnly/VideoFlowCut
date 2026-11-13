import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createApplication } from "@videocut/application";

test("真实 MCP 将文案、事实依据与文案作者和项目版本关联", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-narration-handoff-"));
  const app = createApplication(root);
  const projectId = app.createProject({ name: "文案交接隔离验证" }).snapshot.project.id;
  const run = await app.startProductionRun({ projectId, baseRevision: 1, intent: "full_creation", completionScope: { kind: "project" },
    operationId: "start-writer", loadedSkills: ["production-coordinator"] });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"],
    cwd: process.cwd(), env: { ...getDefaultEnvironment(), VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  const client = new Client({ name: "narration-handoff-test", version: "1.0.0" });
  const parse = <T>(response: { isError?: boolean; content: Array<{ type: string; text?: string }> }): T => {
    assert.notEqual(response.isError, true, JSON.stringify(response.content));
    return JSON.parse(response.content.find(item => item.type === "text")!.text!) as T;
  };
  try {
    await client.connect(transport);
    parse(await client.callTool({ name: "update_production_run", arguments: { project_id: projectId, run_id: run.id,
      expected_audit_version: run.auditVersion, operation_id: "assign-writer", action: "add_assignment", assignment: {
        assignment_id: "writer", agent_id: "/fixture/writer", responsibilities: ["narration"], skill_ids: ["narration-writing"],
        scope: { kind: "project" }, input_revision: 1
      } } }) as never);

    const draft = ["第一段：问题从实际场景开始。", "第二段：这里仍有一项事实等待核对。"];
    const applied = parse<{ revision: number }>(await client.callTool({ name: "apply_authored_script", arguments: {
      project_id: projectId, base_revision_id: 1, source_note: "隔离测试：文案作者提供的当前完整稿",
      units: draft.map(text => ({ text, kind: "statement" }))
    } }) as never);
    const revision = applied.revision;
    assert.ok(revision > 1);

    const report = parse<{ creativeDecisions: Array<{ assignmentId?: string; inputRevision?: number; evidence: string[] }> }>(await client.callTool({
      name: "record_creative_decision", arguments: { project_id: projectId, run_id: run.id, operation_id: "writer-evidence",
        category: "story", decision: "交回完整文案与声画说明", rationale: "依据当前素材和已确认资料整理",
        assignment_id: "writer", input_revision: revision, object_ids: [projectId],
        evidence: ["来源：隔离测试资料", "待核：第二段的具体数字", "声画：第二段由实际素材接续"] }
    }) as never);
    const decision = report.creativeDecisions.at(-1)!;
    assert.equal(decision.assignmentId, "writer");
    assert.equal(decision.inputRevision, revision);
    assert.deepEqual(decision.evidence, ["来源：隔离测试资料", "待核：第二段的具体数字", "声画：第二段由实际素材接续"]);

    const script = parse<{ speechSegments: Array<{ text: string }> }>(await client.callTool({ name: "read_script", arguments: { project_id: projectId } }) as never);
    assert.deepEqual(script.speechSegments.map(segment => segment.text), draft);
    const readback = parse<typeof report>(await client.callTool({ name: "read_skill_execution_report", arguments: { project_id: projectId, run_id: run.id } }) as never);
    assert.deepEqual(readback.creativeDecisions.at(-1), decision);

    // 旧版本不得覆盖新稿；不同作者应先读取同一当前 Revision 再提交修改。
    const stale = await client.callTool({ name: "apply_authored_script", arguments: { project_id: projectId, base_revision_id: 1,
      source_note: "过期修改", units: [{ text: "过期内容", kind: "statement" }] } });
    assert.equal(stale.isError, true);
    const unchanged = parse<typeof script>(await client.callTool({ name: "read_script", arguments: { project_id: projectId } }) as never);
    assert.deepEqual(unchanged.speechSegments.map(segment => segment.text), draft);

    const invalid = await client.callTool({ name: "record_creative_decision", arguments: { project_id: projectId, run_id: run.id,
      operation_id: "unknown-writer", category: "story", decision: "记录", rationale: "测试", assignment_id: "missing", input_revision: revision } });
    assert.equal(invalid.isError, true);

    const status = parse<{ auditVersion: number }>(await client.callTool({ name: "read_skill_execution_report", arguments: { project_id: projectId, run_id: run.id } }) as never);
    parse(await client.callTool({ name: "update_production_run", arguments: { project_id: projectId, run_id: run.id,
      expected_audit_version: status.auditVersion, operation_id: "assign-feedback", action: "add_assignment", assignment: {
        assignment_id: "feedback", agent_id: "/fixture/feedback", responsibilities: ["asset_sourcing", "creative_research", "visual_design"],
        skill_ids: ["visual-asset-sourcing", "creative-sequence-design", "visual-treatment-planning"], scope: { kind: "project" }, input_revision: revision
      } } }) as never);
    const feedback = ["素材核实：数字仍需确认", "创意建议：由画面引出问题", "视觉反馈：第二段留出素材承载"];
    for (const [index, text] of feedback.entries()) {
      parse(await client.callTool({ name: "record_creative_decision", arguments: { project_id: projectId, run_id: run.id,
        operation_id: `feedback-${index}`, category: "story", decision: text, rationale: "隔离协作反馈",
        assignment_id: "feedback", input_revision: revision, object_ids: [projectId], evidence: [text] } }) as never);
    }
    const revisedText = [draft[0], "第二段：数字仍待核对，画面先呈现现场。"];
    const revised = parse<{ revision: number }>(await client.callTool({ name: "apply_authored_script", arguments: {
      project_id: projectId, base_revision_id: revision, source_note: "文案作者合并素材、创意和视觉反馈",
      units: revisedText.map(text => ({ text, kind: "statement" }))
    } }) as never);
    assert.ok(revised.revision > revision);
    const impact = parse<{ revision: number }>(await client.callTool({ name: "read_impact_report", arguments: { project_id: projectId, revision: revised.revision } }) as never);
    assert.equal(impact.revision, revised.revision);
    const currentScript = parse<typeof script>(await client.callTool({ name: "read_script", arguments: { project_id: projectId } }) as never);
    assert.deepEqual(currentScript.speechSegments.map(segment => segment.text), revisedText);
    const merged = parse<typeof report>(await client.callTool({ name: "record_creative_decision", arguments: { project_id: projectId, run_id: run.id,
      operation_id: "writer-merge", category: "story", decision: "合并反馈后的当前完整稿", rationale: "保留待核事实并调整画面承载",
      assignment_id: "writer", input_revision: revised.revision, object_ids: [projectId], evidence: feedback } }) as never);
    assert.equal(merged.creativeDecisions.at(-1)!.inputRevision, revised.revision);
    assert.deepEqual(merged.creativeDecisions.at(-1)!.evidence, feedback);
  } finally {
    await client.close();
    app.close();
    await rm(root, { recursive: true, force: true });
  }
});
