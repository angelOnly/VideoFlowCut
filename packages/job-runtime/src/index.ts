import type { EditingApplication } from "@videocut/application";
import type { JobKind, JobRecord } from "@videocut/contracts";

export type JobProcessor = (job: JobRecord) => Promise<Record<string, unknown>>;

/**
 * 任务处理期间持续续租，避免长时间的转码或 Remotion 渲染被另一 Worker 重复领取。
 * Job 的结果状态仍只通过 EditingApplication 写回 SQLite。
 */
export async function processClaimedJob(
  application: EditingApplication,
  job: JobRecord,
  processor: JobProcessor,
  leaseMilliseconds = 60_000
): Promise<void> {
  const heartbeatMilliseconds = Math.max(1_000, Math.floor(leaseMilliseconds / 2));
  const heartbeat = setInterval(() => {
    try {
      application.renewJobLease(job.id, leaseMilliseconds);
    } catch {
      // 任务完成、取消或被人工处理后无需继续续租；最终状态由主流程负责写回。
    }
  }, heartbeatMilliseconds);
  heartbeat.unref();
  try {
    const result = await processor(job);
    application.updateJob(job.id, { status: "succeeded", result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    application.updateJob(job.id, { status: "failed", error: detail, result: { diagnostic: detail } });
  } finally {
    clearInterval(heartbeat);
  }
}

export async function runOneQueuedJob(
  application: EditingApplication,
  kinds: JobKind[],
  processor: JobProcessor,
  leaseMilliseconds = 60_000
): Promise<boolean> {
  const job = application.claimNextJob(kinds, leaseMilliseconds);
  if (!job) return false;
  await processClaimedJob(application, job, processor, leaseMilliseconds);
  return true;
}
