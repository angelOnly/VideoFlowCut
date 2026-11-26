import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const event = JSON.parse(Buffer.concat(chunks).toString("utf8"));
const dataRoot = process.env.PLUGIN_DATA;
if (!dataRoot || !event.session_id || !event.turn_id) {
  process.stdout.write("{}\n");
  process.exit(0);
}
const key = createHash("sha256").update(event.session_id).digest("hex");
const directory = join(dataRoot, "production-continuation");
const path = join(directory, `${key}.json`);
const finish = value => process.stdout.write(`${JSON.stringify(value)}\n`);

if (event.hook_event_name === "PostToolUse") {
  const response = event.tool_response;
  if (event.agent_id || response?.isError) finish({});
  else {
    const text = response?.content?.find?.(item => item.type === "text")?.text;
    const result = response?.structuredContent ?? (typeof text === "string" ? JSON.parse(text) : response);
    if (result?.projectId && result?.runId && result?.runtimeOrigin) {
      await mkdir(directory, { recursive: true });
      await writeFile(path, JSON.stringify({ projectId: result.projectId, runId: result.runId,
        origin: result.runtimeOrigin, turnId: event.turn_id }), "utf8");
      finish({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "当前回合的完整成片续办检查已启用。" } });
    } else {
      finish({});
    }
  }
} else if (event.hook_event_name === "Interrupt") {
  await rm(path, { force: true });
  finish({});
} else if (event.hook_event_name === "Stop") {
  const binding = await readFile(path, "utf8").then(JSON.parse).catch(() => undefined);
  if (!binding || binding.turnId !== event.turn_id) finish({});
  else {
    try {
      const url = new URL(`/api/projects/${encodeURIComponent(binding.projectId)}/production-status`, binding.origin);
      url.searchParams.set("runId", binding.runId);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const status = await response.json();
      if (["completed", "abandoned"].includes(status.progress?.state)) {
        await rm(path, { force: true });
        finish({});
      } else if (["actionable", "waiting"].includes(status.progress?.state)) {
        // 同一回合多次尝试结束却没有任何状态变化时，最后一次要求解释原因，避免无限续办。
        const signature = JSON.stringify({ revision: status.revision, progress: status.progress });
        const unchangedStops = event.stop_hook_active && signature === binding.lastProgress ? (binding.unchangedStops ?? 0) + 1 : 0;
        if (unchangedStops >= 2) {
          await rm(path, { force: true });
          finish({ systemMessage: "完整成片尚未完成，连续续办未改变制作状态。请核对原 Run 的实际等待或阻塞后继续。" });
        } else {
          await writeFile(path, JSON.stringify({ ...binding, lastProgress: signature, unchangedStops }), "utf8");
          if (unchangedStops === 1) {
            finish({ decision: "block", reason: `制作状态连续未变化。请核对原项目 ${binding.projectId} 的任务 ${binding.runId}，继续可执行工作或跟踪必要 Job；确实无法推进时说明未完成范围和具体原因。` });
          } else if (status.progress.state === "actionable") {
            const actions = status.progress.actionable.slice(0, 8);
            finish({ decision: "block", reason: `完整成片尚未完成。请继续原项目 ${binding.projectId} 的制作任务 ${binding.runId}，先读回当前版本并执行这些可推进事项：${JSON.stringify(actions)}。` });
          } else {
            finish({ decision: "block", reason: `完整成片仍在等待原任务：${JSON.stringify(status.progress.waiting)}。请跟踪原 Job，继续其他可执行工作，回件后接回并推进正式制作。` });
          }
        }
      } else if (!status.progress) {
        await rm(path, { force: true });
        finish({ decision: "block", reason: "当前 Runtime 没有返回制作续办状态，请核对版本并按实际情况继续或报告阻塞。" });
      } else if (!event.stop_hook_active) {
        finish({ decision: "block", reason: `完整成片仍未完成。请核对当前阻塞并继续可执行工作；确实无法推进时说明具体原因：${JSON.stringify(status.progress.blocked)}。` });
      } else finish({});
    } catch (error) {
      await rm(path, { force: true });
      finish({ decision: "block", reason: `未能读取完整制作状态，请诊断 Runtime 并续接原任务；无法恢复时说明具体阻塞：${error instanceof Error ? error.message : String(error)}` });
    }
  }
} else finish({});
