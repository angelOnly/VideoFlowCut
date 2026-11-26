import type { EditingApplication } from "@videocut/application";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import { DomainError } from "@videocut/domain";
import { readRuntimeConfig } from "@videocut/project-overview";

type Checkpoint = { status?: string; runId?: string };

/** 等待超时只结束本地尝试，读取原外部运行后才决定是否接回。 */
export async function reconcileMediaJob(app: EditingApplication, projectId: string, jobId: string,
  createBridge = (url: string) => new ComfyUIBridgeClient(url)) {
  const job = app.trackJob(jobId);
  if (job.projectId !== projectId) throw new DomainError("任务不属于当前项目", "JOB_PROJECT_MISMATCH");
  const diagnostic = job.result?.diagnostic as { code?: string } | undefined;
  if (job.kind !== "motion_reference_analysis" || job.status !== "failed" || diagnostic?.code !== "BRIDGE_RUN_TIMEOUT") {
    throw new DomainError("该任务不属于参考分析等待超时，请按原任务恢复提示处理", "MEDIA_RECONCILE_UNSUPPORTED");
  }
  const checkpoints = Object.values((job.result?.externalRuns ?? {}) as Record<string, Checkpoint>)
    .filter(entry => entry.status !== "succeeded");
  if (!checkpoints.length || checkpoints.some(entry => !entry.runId)) {
    return { jobId, state: "unknown" as const, nextAction: "读取原任务诊断，核对外部提交身份" };
  }
  const config = job.payload.modelConfig as { apiBaseUrl?: string } | undefined;
  const bridge = createBridge(config?.apiBaseUrl ?? readRuntimeConfig().bridge.apiBaseUrl);
  const runs = await Promise.all(checkpoints.map(async checkpoint => {
    try {
      const run = await bridge.getRun(checkpoint.runId!);
      return { runId: checkpoint.runId!, status: run.status, error: run.error };
    } catch (error) {
      return { runId: checkpoint.runId!, status: "unknown" as const, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  if (runs.some(run => run.status === "unknown")) return { jobId, state: "unknown" as const, runs, nextAction: "恢复 Bridge 连接后继续读取原任务" };
  if (runs.some(run => ["failed", "cancelled", "canceled"].includes(run.status))) return { jobId, state: "failed" as const, runs, nextAction: "按原任务错误恢复或调整参考研究" };
  if (runs.some(run => run.status === "queued" || run.status === "running")) return { jobId, state: "waiting" as const, runs, nextAction: "等待原运行，继续其他可执行工作" };
  if (runs.some(run => run.status !== "succeeded")) return { jobId, state: "unknown" as const, runs, nextAction: "核对原运行返回的状态" };
  const resumed = app.intelligence.retry(projectId, jobId);
  return { jobId, state: "resuming" as const, runs, resumedJobId: resumed.id, nextAction: "跟踪恢复任务并接回原运行结果" };
}
