import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { callDeploymentTool } from "./verify-plugin-deployment.mjs";

const skills = ["creative-sequence-design", "motion-case-library", "visual-treatment-planning", "creative-reference-to-sequence"];
const endFrame = 24;
const scope = { kind: "project" };
const purpose = "验证冻结源码接回和同版预览";

async function prepareSmoke(vfc, od, receipt, checkpoint) {
  const smoke = receipt.smoke;
  const title = `插件部署验收 ${receipt.id}`;
  if (!smoke.odProjectId) {
    const project = await callDeploymentTool(od, "create_project", { id: `vfc-deploy-${receipt.id}`, name: title });
    assert.ok(project.project?.id, "缺少画面项目 ID");
    smoke.odProjectId = project.project.id;
    await checkpoint();
  }
  if (!smoke.projectId) {
    const created = await callDeploymentTool(vfc, "create_project", {
      name: title, profile: "visual_explainer", fps: 24, brief: { aspectRatio: "16:9" }
    });
    smoke.projectId = created.snapshot.project.id;
    await checkpoint();
  }
  const project_id = smoke.projectId;
  let frame = await callDeploymentTool(vfc, "read_project", { project_id });
  if (!frame.snapshot.scenes.length) {
    await callDeploymentTool(vfc, "create_scene", {
      project_id, base_revision_id: frame.revision.number, type: "ExplainerScene",
      title: "方块位移", purpose, start_frame: 0, end_frame: endFrame
    });
    frame = await callDeploymentTool(vfc, "read_project", { project_id });
  }
  assert.ok(frame.snapshot.project.name === title && frame.snapshot.scenes.length === 1, "本轮验收项目已变更");
  const sceneId = frame.snapshot.scenes[0].id;
  const base_revision_id = frame.revision.number;
  const run = await callDeploymentTool(vfc, "start_production_run", {
    project_id, base_revision_id, intent: "local_edit", completion_scope: scope,
    operation_id: "deploy-smoke", loaded_skills: ["production-coordinator", ...skills]
  });
  const context = { project_id, run_id: run.id };
  const roles = ["creative_research", "motion_research", "visual_design"];
  if (!run.assignments.some(item => item.assignmentId === "deploy-smoke")) await callDeploymentTool(vfc, "update_production_run", {
    ...context, expected_audit_version: run.auditVersion, operation_id: "assign-smoke", action: "add_assignment",
    assignment: { assignment_id: "deploy-smoke", agent_id: "videoflowcut-deployment",
      responsibilities: roles, skill_ids: skills, scope, input_revision: base_revision_id }
  });
  const inputDecisionIds = [];
  for (const [index, phase] of roles.entries()) {
    const existing = run.creativeDecisions.find(item => item.operationId === phase);
    if (existing) {
      inputDecisionIds.push(existing.id);
      continue;
    }
    const judgment = await callDeploymentTool(vfc, "record_creative_decision", {
      ...context, operation_id: phase, category: "visual", phase, assignment_id: "deploy-smoke",
      input_revision: base_revision_id, object_ids: [sceneId],
      decision: ["使用原创方块单场验证。", "采用从左到右的一次连续位移。", "深色纯底和高对比方块，保持全屏构图。"][index],
      rationale: purpose, evidence: ["固定 24 帧测试场面，验收实际阶段回件和渲染文件。"],
      ...(phase === "visual_design" ? { input_decision_ids: inputDecisionIds } : { research_outcome: "not_applicable" })
    });
    inputDecisionIds.push(judgment.creativeDecisions.at(-1).id);
  }
  const { width, height } = frame.snapshot.timeline;
  return {
    project_id, base_revision_id, production_run_id: run.id, idempotency_key: `deploy-${receipt.id}`,
    target: { action: "create_cue", sceneId, layer: "fullscreen", startFrame: 0, endFrame,
      sourceStartFrame: 0, sourceEndFrame: endFrame, audioPolicy: "rebind_unchanged_events" },
    opendesign_request: { project: smoke.odProjectId, agent: "codex",
      prompt: `这是独立部署验收样片。制作 ${width}×${height}、24fps、24 帧的不透明 HyperFrames 作品。深色背景上让一枚亮色方块从左向右连续位移。使用内联样式及已声明的根时钟，画面无需媒体、字体、声音或外链。按随附受管合同创建源码和阶段清单，readyRanges 和 changedRanges 均用 [0,24)。实际运行 od motion-work stage 发布，以接回固定源码为目标。发布成功后结束任务。` }
  };
}

async function waitForJob(client, id, deadline, pause) {
  while (Date.now() < deadline) {
    const job = await callDeploymentTool(client, "track_job", { job_id: id });
    if (job.status === "succeeded") return job;
    assert.ok(["queued", "running"].includes(job.status), `${job.kind} ${id} ${job.status}：${job.error ?? "请回读任务"}`);
    await pause(3000);
  }
  throw new Error(`等待任务 ${id} 超时，可使用原回执续查`);
}

/** 提交前写入幂等请求，返回后立即保存 Job ID。 */
export async function runDeploymentSmoke(vfc, od, receipt, checkpoint, { timeoutMs = 900_000, pause = delay } = {}) {
  const smoke = receipt.smoke ??= {};
  if (!smoke.authoringRequest) {
    smoke.authoringRequest = await prepareSmoke(vfc, od, receipt, checkpoint);
    await checkpoint();
  }
  if (!smoke.authoringJobId) {
    const submitted = await callDeploymentTool(vfc, "start_motion_authoring", smoke.authoringRequest);
    smoke.authoringJobId = submitted.jobId;
    assert.ok(smoke.authoringJobId, "缺少 OD 制作 Job ID");
    await checkpoint();
  }
  const authoring = await waitForJob(vfc, smoke.authoringJobId, Date.now() + timeoutMs, pause);
  const authoringState = authoring.result?.authoring;
  const frozen = authoringState?.receipts?.at(-1);
  const range = frozen?.ranges?.[0];
  assert.ok(authoringState?.status === "succeeded" && frozen?.frozenVersion && frozen.workId
    && frozen.definitionHash && frozen.cueId && Number.isInteger(frozen.revision)
    && range?.endFrame > range?.startFrame, "制作未接回可预览的冻结阶段作品");
  // 接回源码不等于生成可供合成使用的派生媒体。
  if (!smoke.bakeJobId) {
    const current = await callDeploymentTool(vfc, "read_project", { project_id: smoke.projectId });
    const submitted = await callDeploymentTool(vfc, "submit_motion_work", {
      project_id: smoke.projectId, base_revision_id: current.revision.number,
      work_id: frozen.workId, definition_hash: frozen.definitionHash, output_intent: "asset",
      idempotency_key: `deploy-bake-${receipt.id}`
    });
    smoke.bakeJobId = submitted.id;
    assert.ok(smoke.bakeJobId, "缺少作品媒体 Job ID");
    await checkpoint();
  }
  const bake = await waitForJob(vfc, smoke.bakeJobId, Date.now() + timeoutMs, pause);
  if (!smoke.renderRevision) {
    const current = await callDeploymentTool(vfc, "read_project", { project_id: smoke.projectId });
    assert.ok(bake.result?.assetId && bake.result.workId === frozen.workId
      && current.snapshot.assets.some(asset => asset.id === bake.result.assetId && asset.motion?.workId === frozen.workId
        && asset.motion?.definitionHash === frozen.definitionHash)
      && current.snapshot.effectCues.some(cue => cue.id === frozen.cueId && cue.workId === frozen.workId), "作品媒体未绑定到同一冻结作品");
    smoke.renderRevision = current.revision.number;
    await checkpoint();
  }
  if (!smoke.previewJobId) {
    const preview = await callDeploymentTool(vfc, "render_preview_range", {
      project_id: smoke.projectId, revision: smoke.renderRevision,
      from_frame: range.startFrame, to_frame: Math.min(range.endFrame, range.startFrame + 12),
      idempotency_key: `deploy-preview-${receipt.id}`
    });
    smoke.previewJobId = preview.id;
    assert.ok(smoke.previewJobId, "缺少预览 Job ID");
    await checkpoint();
  }
  const preview = await waitForJob(vfc, smoke.previewJobId, Date.now() + timeoutMs, pause);
  return { authoring, bake, preview, renderRevision: smoke.renderRevision, projectId: smoke.projectId };
}
