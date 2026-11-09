import type { JobRecord } from "@videocut/contracts";
import { projectCreativeSearchResult } from "./creative-library-output.js";
import { motionJobReceipt } from "./command-receipt.js";

type Data = Record<string, unknown>;
const object = (value: unknown): Data => value && typeof value === "object" && !Array.isArray(value) ? value as Data : {};
const pick = (value: unknown, fields: readonly string[]): Data => {
  const source = object(value);
  return Object.fromEntries(fields.filter(field => source[field] !== undefined).map(field => [field, source[field]]));
};
const list = (value: unknown, project: (entry: unknown) => Data) => Array.isArray(value) ? value.map(project) : undefined;
const relationFields = ["categories", "actions", "entry", "exit", "holds", "anchors"];
const connection = (value: unknown) => pick(value, ["from", "to", "left_end", "right_start", "shared_states", "shared_anchors", "next_holds", "checks", "gap", "continuous_verified"]);

/** 搜索卡只交付可判断的动作关系和读取入口；完整检索正文仍留在索引与任务记录。 */
function mechanismCard(value: unknown): Data {
  const source = object(value);
  return {
    ...pick(source, ["id", "title", "case_number", "summary", "purpose", "relation", "start_state", "end_state", "tags", "document", "storyboard", "case_slug", "overview", "detail", "score", "match_reasons"]),
    // 搜索、精确读取和异步 Job 共用投影，保留来源条件而不泄露完整向量输入。
    ...(source.case_context ? { case_context: pick(source.case_context, ["video_types", "materials", "scenario", "material_requirements", "transfer_cost"]) } : {}),
    ...(source.retrieval ? { retrieval: pick(source.retrieval, relationFields) } : {}),
    ...(source.clip ? { clip: pick(source.clip, ["path", "start_ms", "end_ms", "source_sha256", "sha256", "bytes", "boundary_note"]) } : {}),
    ...(source.difference ? { difference: pick(source.difference, ["source_relation", "candidate_relation", "added_actions", "absent_actions"]) } : {}),
    ...(source.connection ? { connection: connection(source.connection) } : {})
  };
}

const diagnostic = (value: unknown) => pick(value, ["code", "message"]);
const recovery = (value: unknown) => {
  const source = object(value);
  return {
    ...pick(source, ["action", "tool", "project_id", "job_id", "message"]),
    ...(source.runs ? { runs: list(source.runs, entry => pick(entry, ["runId", "status", "workflowId", "schemaVersion", "attemptJobId"])) } : {})
  };
};

export function projectMotionSearchResult(value: unknown): Data {
  const source = object(value), diagnostics = object(source.diagnostics);
  return {
    ...pick(source, ["scope", "source_sha256", "library_count", "notice", "stage", "total", "offset", "next_offset", "exhausted", "warnings", "comparison"]),
    ...(source.cards ? { cards: list(source.cards, mechanismCard) } : {}),
    ...(source.groups ? { groups: list(source.groups, projectMotionSearchResult) } : {}),
    ...(source.connections ? { connections: list(source.connections, connection) } : {}),
    ...(source.selection ? { selection: pick(source.selection, ["v", "source_sha256", "ids", "adopted", "unknown_ids", "stale"]) } : {}),
    ...(source.taxonomy ? { taxonomy: pick(source.taxonomy, ["categories", "actions", "states", "holds", "anchors"]) } : {}),
    ...(source.diagnostics ? { diagnostics: {
      ...pick(diagnostics, ["mode", "semantic_used", "source_sha256", "job_id", "status", "reason", "model", "workflow", "schema", "instruction_version", "document_chunks", "cache_hits", "encoded_texts", "elapsed_ms"]),
      ...(diagnostics.failure ? { failure: diagnostic(diagnostics.failure) } : {}),
      ...(diagnostics.recovery ? { recovery: recovery(diagnostics.recovery) } : {})
    } } : {})
  };
}

export function projectMotionMechanismResult(value: unknown): Data {
  const source = object(value);
  return {
    ...pick(source, ["source_sha256", "part", "document", "body", "preview_url", "video_path", "observation", "clip_source_offset_ms"]),
    ...(source.resources ? { resources: Object.fromEntries(Object.entries(object(source.resources)).map(([key, value]) => [key, pick(value, ["path", "absolute_path", "available", "reason"])])) } : {}),
    card: mechanismCard(source.card)
  };
}

function projectMotionAnalysisResult(value: unknown): Data {
  const source = object(value), input = object(source.input);
  return {
    ...pick(source, ["id", "source_sha256", "source_hash", "description", "model", "schema", "run_id"]),
    ...(source.range ? { range: pick(source.range, ["startMs", "endMs"]) } : {}),
    ...(source.sampling ? { sampling: pick(source.sampling, ["model_frame_density", "limitation"]) } : {}),
    ...(source.input ? { input: {
      mapping: pick(input.mapping, ["parentSourceId", "parentHash", "offsetMs", "rate", "coordinateSpace", "preprocessing"]),
      streams: list(input.streams, entry => pick(entry, ["nb_read_frames", "avg_frame_rate"]))
    } } : {})
  };
}

/** 失败只暴露对账所需的运行身份，不回传向量、模型请求或历次成功正文。 */
export function motionJobRecovery(job: JobRecord): Data | undefined {
  if (!["failed", "unknown", "cancelled"].includes(job.status)) return undefined;
  const runs = Object.values(object(job.result?.externalRuns)).filter(entry => object(entry).status !== "succeeded")
    .map(entry => pick(entry, ["runId", "status", "workflowId", "schemaVersion", "attemptJobId"]));
  const code = object(job.result?.diagnostic).code;
  if (job.status === "unknown" || code === "EXTERNAL_RUN_OUTCOME_UNKNOWN") return {
    action: "reconcile", job_id: job.id, project_id: job.projectId, runs,
    message: "外部提交结果未知，先核对原 Job 与已知 Run；不能换幂等键或重新提交。"
  };
  if (["MOTION_LIBRARY_STALE", "CREATIVE_LIBRARY_STALE", "LIBRARY_INSTRUCTION_SNAPSHOT_MISSING"].includes(String(code))) return {
    action: "refresh_search", tool: job.kind === "creative_library_search" ? "search_creative_cases" : "search_motion_mechanisms", job_id: job.id, project_id: job.projectId,
    message: "资料来源或检索指令快照已变化，请重新查询并核读采用项。"
  };
  return {
    action: "retry", tool: "retry_media_job", job_id: job.id, project_id: job.projectId, runs,
    message: "根据失败原因恢复服务或修正条件后，显式恢复原 Job；已知 Run 沿检查点继续，不自动重放。"
  };
}

/** 只收窄已确认的机制任务链；其余工具继续使用现有合同，后台记录不变。 */
export function projectMotionJob(job: JobRecord): JobRecord | Data {
  if (job.kind === "motion_generation" || job.kind === "motion_adoption" || job.kind === "motion_authoring") return motionJobReceipt(job);
  if (!["creative_library_search", "motion_library_search", "motion_reference_analysis"].includes(job.kind)) return job;
  const result = object(job.result), next = motionJobRecovery(job);
  const librarySearch = job.kind === "creative_library_search" || job.kind === "motion_library_search";
  const projected = job.kind === "creative_library_search" ? projectCreativeSearchResult(result)
    : job.kind === "motion_library_search" ? projectMotionSearchResult(result) : projectMotionAnalysisResult(result);
  if (librarySearch) {
    delete projected.cards;
    delete projected.groups;
    delete projected.connections;
    if (job.kind === "creative_library_search" && Array.isArray(result.cards)) projected.total = result.cards.length;
  }
  const readback = librarySearch && job.status === "succeeded" ? {
    tool: job.kind === "creative_library_search" ? "search_creative_cases" : "search_motion_mechanisms",
    arguments: { project_id: job.projectId, ...object(job.payload.request), source_sha256: job.payload.source_sha256, offset: 0 }
  } : undefined;
  return {
    ...pick(job, ["id", "projectId", "kind", "status", "error", "attempt", "createdAt", "updatedAt"]),
    source_sha256: job.payload.source_sha256,
    ...(job.payload.retryOfJobId ? { retryOfJobId: job.payload.retryOfJobId } : {}),
    ...(job.kind === "motion_reference_analysis" ? { mechanism_id: job.payload.id, range: pick(job.payload.range, ["startMs", "endMs"]) } : {}),
    ...(job.result ? { result: {
      ...projected,
      ...(result.creativeIndex ? { creativeIndex: pick(result.creativeIndex, ["completed", "total", "source_sha256"]) } : {}),
      ...(result.motionIndex ? { motionIndex: pick(result.motionIndex, ["completed", "total", "source_sha256"]) } : {}),
      ...(result.diagnostic ? { diagnostic: diagnostic(result.diagnostic) } : {})
    } } : {}),
    ...(readback ? { readback } : {}),
    ...(next ? { recovery: next } : {})
  };
}
