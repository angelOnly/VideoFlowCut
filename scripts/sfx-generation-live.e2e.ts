import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { readRuntimeConfig } from "@videocut/project-overview";

// 只接受明确指定的隔离服务与新目录；不自动借用生产 ComfyUI 队列。
const { values } = parseArgs({ options: {
  "bridge-url": { type: "string" }, "workspace-root": { type: "string" }, help: { type: "boolean" }
} });
if (values.help) {
  console.log("用法：npx tsx scripts/sfx-generation-live.e2e.ts --bridge-url <独立Bridge完整地址> --workspace-root <不存在的绝对目录>\n仅验证真实生成及候选登记；不代表动画、混音或听审通过。失败后保留目录与原 Job，不自动重发。");
} else {
  if (!values["bridge-url"] || !values["workspace-root"] || !isAbsolute(values["workspace-root"])) throw new Error("必须指定隔离 Bridge 与新的绝对工作目录");
  const url = new URL(values["bridge-url"]);
  const current = new URL(readRuntimeConfig().bridge.apiBaseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash
    || url.port === "8188" || url.origin === current.origin || url.pathname.replace(/\/$/u, "") !== "/comfyui-bridge/v1") {
    throw new Error("需要独立 ComfyUI 实例的 /comfyui-bridge/v1 地址；拒绝当前配置服务和生产 8188 端口");
  }
  const root = resolve(values["workspace-root"]);
  await mkdir(root); // 已存在即拒绝，避免覆盖或混入生产数据库。
  process.env.VIDEOCUT_WORKSPACE = root;
  process.env.COMFYUI_BRIDGE_URL = url.href.replace(/\/$/u, "");
  const { createApplication } = await import("@videocut/application");
  const { manageSoundPlan } = await import("../packages/edit-application/src/sound-design.js");
  const { runOneJob } = await import("../apps/job-worker/src/index.js");
  const app = createApplication(root);
  try {
    const created = app.createProject({ name: "音效真实接口隔离验收", profile: "visual_explainer" });
    const projectId = created.snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const planned = manageSoundPlan(app, projectId, rev(), { action: "create", startFrame: 0, endFrame: 120,
      narrationDirection: "验收单次落定候选", dominantRole: "narration", musicDirection: "本次仅生成候选",
      intents: [{ id: "settle", function: "settle", brief: "单次轻巧木质落定，清楚攻击，短尾音" }] });
    const required = app.manageAssetRequirement({ projectId, baseRevision: rev(), action: "create", mediaKind: "audio", role: "sfx",
      title: "单次木质落定", purpose: "真实HTTP候选登记验收", audioBrief: "一次轻敲，短尾，无旁白或音乐",
      sound: { soundPlanId: planned.snapshot.soundPlans![0]!.id, soundIntentId: "settle", excludeSpeech: true, excludeMusic: true } });
    const job = app.submitSfxGeneration({ projectId, baseRevision: rev(), requestId: required.snapshot.assetRequests[0]!.id,
      prompt: "TrackType: SFX. One isolated soft wooden tap with a crisp attack, warm compact body and very short decay, close and dry studio recording.",
      maxDurationSeconds: 2, seed: 4101, idempotencyKey: "live-candidate-1" });
    const reportPath = join(root, "sfx-live-result.json");
    await writeFile(reportPath, JSON.stringify({ projectId, jobId: job.id, status: "queued", input: job.payload }, null, 2));
    await runOneJob(app);
    const completed = app.trackJob(job.id);
    const snapshot = app.readProject(projectId).snapshot;
    await writeFile(reportPath, JSON.stringify({ projectId, job: completed, assets: snapshot.assets, audioCueCount: snapshot.audioCues.length,
      observation: "仅技术检查；未做动画混合、声音结构或真实听感审阅" }, null, 2));
    if (completed.status !== "succeeded") throw new Error(`验收任务状态为 ${completed.status}，请沿原 Job 恢复；记录：${reportPath}`);
    if (snapshot.audioCues.length !== 0 || !completed.result?.assetId) throw new Error("候选登记合同异常，请检查验收记录");
    console.log(`真实生成及候选登记完成，结果：${reportPath}；尚未听审。`);
  } finally { app.close(); }
}
