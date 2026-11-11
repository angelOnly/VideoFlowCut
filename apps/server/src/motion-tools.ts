import { motionOnSuccessSchema } from "../../../packages/contracts/src/motion-continuation.js";
import { motionAuthoringRequestSchema } from "../../../packages/contracts/src/motion-authoring.js";
import { readRuntimeConfig } from "@videocut/project-overview";
import { AUTHORED_MOTION_MANIFEST_CONTRACT, authoredMotionInputFields } from "../../../packages/contracts/src/authored-motion-manifest-v1.js";
import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js";
import { commandReceipt, motionJobReceipt } from "./command-receipt.js";
import { hyperframesContract } from "../../../packages/motion-work/src/hyperframes-contract.js";
import { toolErrorResult } from "./tool-error.js";
import { objectResourceCapabilities } from "../../../packages/media-intelligence/src/object-resources/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EditingApplication } from "@videocut/application";
import { MOTION_SOURCES } from "../../../packages/motion-work/src/catalog.js";
import { motionSubmissionSchema, motionFrameRangeSchema, motionReviewFields } from "../../../packages/motion-work/src/schema.js";
import { inspectMotionReferenceViaRuntime } from "./motion-reference-client.js";
import { listMotionFonts } from "../../../packages/motion-work/src/fonts.js";
import { MOTION_ENGINE_VERSION } from "../../../packages/motion-work/src/compiler.js";
import { frozenMotionBundleSchema, importMotionBundle, readFrozenMotionWork } from "../../../packages/edit-application/src/motion-input.js";
import { prepareReferencePackage } from "../../../packages/edit-application/src/opendesign-reference-package.mjs";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const handoffReferenceSchema = z.object({ id: z.string().min(1), sourceSha256: z.string().min(1),
  usage: z.enum(["study", "adopted"]), purpose: z.string().min(1) }).strict();
const handoffSceneSchema = z.object({
  sceneId: z.string().min(1), status: z.enum(["ready", "pending"]),
  references: z.array(z.object({ kind: z.enum(["creative", "motion"]), id: z.string().min(1), sourceSha256: z.string().min(1),
    startMs: z.number().nonnegative(), endMs: z.number().positive(), purpose: z.string().min(1) }).strict()).optional(),
  resourceIds: z.array(z.string().min(1)).optional(),
  visualRoles: z.array(z.object({ role: z.string().min(1), referenceFunction: z.string().min(1), usage: z.string().min(1),
    assetIds: z.array(z.string().min(1)), sourceRanges: z.array(z.object({ assetId: z.string().optional(),
      startMs: z.number().nonnegative(), endMs: z.number().positive() }).strict()).optional() }).strict()).optional(),
  visualPlan: z.object({ status: z.enum(["draft", "previewed", "pending"]), primaryRoles: z.array(z.string().min(1)).min(1),
    referenceMappings: z.array(z.object({ referenceId: z.string().min(1).describe("对应本场已采用参考的 ID；来源指纹使用场面 references 中对应记录"),
      referenceKind: z.enum(["creative", "motion"]).optional().describe("参考类型；同一 ID 同时对应创意和机制时必须填写"),
      targetRole: z.string().min(1), treatment: z.string().min(1), preserveRelation: z.string().optional().describe("需要保留的原参考关系") }).strict()).optional(),
    graphicLed: z.boolean().optional(), graphicReasons: z.array(z.string().min(1)).optional(),
    preview: z.object({ workId: z.string().min(1), startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict().optional()
  }).strict().optional(),
  process: z.string().optional(), preserve: z.array(z.string()).optional(), adapt: z.array(z.string()).optional()
}).strict();

export function registerMotionTools(server: McpServer, application: EditingApplication, projectIdFrom: (value?: string) => string) {
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  const failure = toolErrorResult;
  server.registerTool("read_motion_capabilities", {
    title: "读取受管动画能力与字体", description: "只读查询当前动画引擎、HTML 合同与固定运行库及随Runtime发布的字体。fontBindings用槽名映射fontId；平台校验文件并在作者初始化前加载，源码使用vfc.fonts[槽位]的family、weight、style，不自行加载字体或联网。新增字体需要发布新版Runtime。",
    inputSchema: {}, annotations: { readOnlyHint: true }
  }, async () => { try { return result({ engineVersion: MOTION_ENGINE_VERSION, authoredManifestContract: AUTHORED_MOTION_MANIFEST_CONTRACT,
    authoredManifestSchema: toJsonSchemaCompat(authoredMotionInputFields),
    authoredManifestRules: ["阶段命令根据实际源码填写 sourceFile、sourceSha256 和 authorSubmissionId", "readyRanges 和 changedRanges 均使用作品根帧半开范围，结束帧不得超出完整作品", "画布宽高为偶数，作品输出体积须在安全整数范围内", "视频源毫秒范围与作品帧范围按作品 fps 对应，允许毫秒取整及不足一帧余量", "源码声明的图片和视频槽必须有绑定，根合成规格与作品一致"],
    html: hyperframesContract, fonts: listMotionFonts(), objectResources: objectResourceCapabilities,
    videoBindings: { maxSlots: null, clock: "work_root", playback: "normal_speed_muted", description: "不设作品视频选段总数上限；每槽固定源身份、哈希、源范围和作品帧范围。分块串行解码并复用缓存，真实资源不足明确失败，不删减选段或静默降质；解码块预算不等于浏览器总内存预算。" },
    fontBindingExample: { title: "noto-sans-sc-bold" }, execution: "仅使用已登记本地字体；通过fontBindings声明，props.fonts由平台注入。配色、描边与帧驱动动效由作者生成，不要求花字模板。理想字体未收录不是平台故障：主任务控制流程，未被用户锁定时由原视觉作者选择合法字体并记录；用户锁定且无法满足时再展示工作台预览并回询。不报工单。已登记原件缺失、变更或加载失败仍明确报错。" }); } catch (error) { return failure(error); } });
  server.registerTool("inspect_motion_reference", {
    title: "查看在线动效参考", description: "在独立浏览器只读查看四个来源的公开页面。先返回预览索引和页面截图，再通过 preview_index 连续采样一个动效；不下载媒体，不跨越登录、验证或付费限制。",
    inputSchema: { source_url: z.string().url(), preview_index: z.number().int().nonnegative().max(300).optional(), sample_duration_ms: z.number().int().min(1000).max(20000).default(6000) }, annotations: { readOnlyHint: true }
  }, async ({ source_url, preview_index, sample_duration_ms }) => { try {
    const { images, ...evidence } = await inspectMotionReferenceViaRuntime(source_url, preview_index, sample_duration_ms);
    return { content: [...result({ ...evidence, samples: images.map(({ elapsedMs }) => ({ elapsedMs })) }).content, ...images.map((item) => ({ type: "image" as const, mimeType: "image/png", data: item.data }))] };
  } catch (error) { return failure(error); } });
  server.registerTool("prepare_motion_handoff", {
    title: "准备场面制作交付",
    description: "按当前项目快照准备固定简报、时间资料、素材、参考与可选同源预排，返回清单哈希、实际文件和逐场面缺口。预排引用使用当前项目的 MotionWork 与作品根帧；资料就绪不等于画面质量通过。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), brief_path: z.string().min(1),
      timing_plan_path: z.string().min(1), selected_scene_ids: z.array(z.string().min(1)).min(1),
      assets: z.array(z.object({ id: z.string().min(1), path: z.string().optional(), purpose: z.string().min(1),
        sourceStartMs: z.number().nonnegative().optional(), sourceEndMs: z.number().positive().optional() }).strict()).optional(),
      creative: z.array(handoffReferenceSchema).optional(), motion: z.array(handoffReferenceSchema).optional(),
      references: z.array(z.object({ id: z.string().min(1), usage: z.enum(["study", "adopted"]), purpose: z.string().min(1),
        files: z.array(z.object({ path: z.string().min(1), deliveredPath: z.string().min(1) }).strict()).min(1) }).strict()).optional(),
      scenes: z.array(handoffSceneSchema).min(1) }
  }, async ({ project_id, base_revision_id, brief_path, timing_plan_path, selected_scene_ids, assets, creative, motion, references, scenes }) => { try {
    const projectId = projectIdFrom(project_id), current = application.readProject(projectId);
    if (current.revision.number !== base_revision_id) throw new Error("项目 Revision 已变化，请读取当前项目后准备交付");
    const handoffId = randomUUID();
    const output = join(current.snapshot.project.rootPath, "reports", "motion-handoffs", handoffId);
    await mkdir(output, { recursive: true });
    const snapshotPath = join(output, "project-snapshot.json");
    await writeFile(snapshotPath, JSON.stringify(current), "utf8");
    const sources = assets?.map(asset => {
      const registered = current.snapshot.assets.find(item => item.id === asset.id);
      return { ...asset, path: asset.path ?? (registered ? join(current.snapshot.project.rootPath, registered.managedPath)
        : join(output, "missing-assets", asset.id)) };
    });
    const manifest = await prepareReferencePackage({ projectId, revision: base_revision_id, projectSnapshot: snapshotPath,
      brief: brief_path, timingPlan: timing_plan_path, deliveryPrefix: `handoffs/${handoffId}`, freezeInputs: true, selectedSceneIds: selected_scene_ids, assets: sources,
      creative, motion, references, scenes }, output);
    const manifestPath = join(output, "delivery-manifest.json");
    const manifestSha256 = createHash("sha256").update(await readFile(manifestPath)).digest("hex");
    return result({ projectId, inputRevision: base_revision_id, manifestPath, manifestSha256,
      scenes: manifest.scenes, diagnostics: manifest.diagnostics,
      files: manifest.files.map(file => ({ path: file.deliveredPath, localPath: join(output, file.deliveredPath),
        sha256: file.sha256, requiredForRun: file.requiredForRun !== false, uses: file.uses })) });
  } catch (error) { return failure(error); } });
  server.registerTool("start_motion_authoring", {
    title: "启动阶段画面制作",
    description: "主任务提交当前范围的完整制作请求与资料，绑定明确的时间线目标。完整新制与主要视觉重构先接回导演采用及视觉作者的同源预排；局部修改沿已有作品继续。制作作者深化已确定的主要关系，阶段源码自动登记和采用。原任务结束后的同源修订使用新幂等键，并通过 continue_from_run_id 指定原制作 Run。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), production_run_id: z.string().min(1).optional(), visual_treatment_ids: z.array(z.string().min(1)).min(1).optional(), target: motionOnSuccessSchema, opendesign_request: motionAuthoringRequestSchema, idempotency_key: z.string().min(1).max(120) }
  }, async ({ project_id, base_revision_id, production_run_id, visual_treatment_ids, target, opendesign_request, idempotency_key }) => { try {
    const job = await application.startMotionAuthoring({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, productionRunId: production_run_id,
      visualTreatmentIds: visual_treatment_ids, target, openDesignRequest: opendesign_request, idempotencyKey: idempotency_key });
    return result({ projectId: job.projectId, jobId: job.id, status: job.status, authoring: job.result?.authoring });
  } catch (error) { return failure(error); } });
  server.registerTool("wait_motion_authoring", {
    title: "等待阶段画面制作结果",
    description: "按 sequence 接回阶段制作与采用结果。authoring.status 表示制作执行与目标范围完成情况；阶段回执定位实际作品及版本，主任务交导演、创意与视觉检查材料组织、整片发展及参考表现。拒收反馈保留实际接收及对账状态；超时表示暂无新进展。",
    inputSchema: { project_id: z.string().optional(), job_id: z.string().min(1), after_sequence: z.number().int().nonnegative().default(0), timeout_ms: z.number().int().min(0).max(30000).default(20000) },
    annotations: { readOnlyHint: true }
  }, async ({ project_id, job_id, after_sequence, timeout_ms }) => { try {
    const config = readRuntimeConfig(), projectId = projectIdFrom(project_id);
    const url = new URL(`/api/projects/${encodeURIComponent(projectId)}/motion-authoring/${encodeURIComponent(job_id)}/wait`, config.http.webOrigin);
    url.searchParams.set("afterSequence", String(after_sequence)); url.searchParams.set("timeoutMs", String(timeout_ms));
    const response = await fetch(url, { headers: { "x-videoflowcut-release-id": config.runtime.releaseId }, signal: AbortSignal.timeout(timeout_ms + 5000) });
    const value = await response.json() as { message?: string; error?: string };
    if (!response.ok) throw new Error(value.message ?? value.error ?? `Runtime HTTP ${response.status}`);
    if (response.headers.get("x-videoflowcut-release-id") !== config.runtime.releaseId) throw new Error("RUNTIME_RELEASE_MISMATCH");
    return result(value);
  } catch (error) { return failure(error); } });
  server.registerTool("browse_motion_sources", { title: "在线动效来源", description: "返回已选的四个在线视觉参考库与访问入口，不下载整库，不表示已经观看预览。AE/Jitter 与开源组件均可作为视觉制作参考。", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => result({ sources: MOTION_SOURCES, execution: "完整新制或主要视觉重做应主动检索并学习创意、美术和动效参考；本在线来源按需补充。通过 register_motion_work 登记完整 HyperFrames HTML，再按需使用 submit_motion_work 生成媒体；按实际观察记录布局、运动、节奏和适配依据。" }));
  server.registerTool("import_motion_bundle", {
    title: "导入固定动画源码包", description: "导入 Local Codex 固定的源码和作者清单，仅写受管输入；不创建素材、版本或生成任务。相同幂等键和相同包可重试。",
    inputSchema: { project_id: z.string().optional(), idempotency_key: z.string().min(1).max(160), bundle: frozenMotionBundleSchema }
  }, async ({ project_id, idempotency_key, bundle }) => { try {
    const id = projectIdFrom(project_id), root = application.readProject(id).snapshot.project.rootPath;
    return result(await importMotionBundle(root, id, idempotency_key, bundle));
  } catch (error) { return failure(error); } });
  server.registerTool("register_motion_work", {
    title: "登记固定动画源码作品",
    description: "校验并固定源码、资源、时钟和引擎，真实初始化取得事件，登记 workId；不捕帧、不编码、不创建视频素材。work 与 frozen_work 二选一。图片用 data-vfc-image-slot，视频用有稳定 id 的 data-vfc-video-slot；字体通过 fontBindings 固定发行原件，视频按完整作品根时钟静音执行。可提供已明确采用目标 on_success；采用冲突保留作品，读回冲突后重新确认。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), idempotency_key: z.string().min(1).max(160), work: motionSubmissionSchema.optional(), frozen_work: z.object({ bundle_path: z.string().min(1), manifest_sha256: z.string().regex(/^[a-f0-9]{64}$/u) }).strict().optional(), on_success: motionOnSuccessSchema.optional() }
  }, async ({ project_id, base_revision_id, idempotency_key, work, frozen_work, on_success }) => { try {
    const id = projectIdFrom(project_id);
    if (Boolean(work) === Boolean(frozen_work)) throw new Error("work 与 frozen_work 必须且只能提供一个");
    const loaded = frozen_work ? await readFrozenMotionWork(application.readProject(id).snapshot.project.rootPath, frozen_work.bundle_path, frozen_work.manifest_sha256) : undefined;
    return result(motionJobReceipt(application.registerMotionWork({ projectId: id, baseRevision: base_revision_id, idempotencyKey: idempotency_key, work: loaded?.work ?? work!, inputBundle: loaded?.inputBundle, readyRanges: loaded?.readyRanges, onSuccess: on_success })));
  } catch (error) { return failure(error); } });
  server.registerTool("submit_motion_work", {
    title: "按固定作品生成媒体",
    description: "只接受已登记的 work_id；按同一源码、固定资源和实际引擎生成真实媒体，按完整输出及临时工作区的真实磁盘需求预检。frame_range 为完整作品 fps 的根半开区间；默认生成范围校样，output_intent=asset 登记正式派生媒体；省略范围生成完整媒体。生成媒体不修改 Cue 的 workId，不自动生成合成预览。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), idempotency_key: z.string().min(1).max(160), work_id: z.string().min(1), frame_range: motionFrameRangeSchema.optional(), output_intent: z.enum(["proof", "asset"]).optional(), proof_job_id: z.string().optional() }
  }, async ({ project_id, base_revision_id, idempotency_key, work_id, frame_range, output_intent, proof_job_id }) => { try {
    return result(motionJobReceipt(application.submitMotionBake({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, idempotencyKey: idempotency_key, workId: work_id, frameRange: frame_range, outputIntent: output_intent, proofJobId: proof_job_id })));
  } catch (error) { return failure(error); } });
  server.registerTool("read_motion_work", {
    title: "读取固定源码作品",
    description: "按 work_id 读取唯一作品身份、完整时钟、绑定、事件和可用范围；任务进度使用 track_job。不会返回整份 HTML 或修改工程。",
    inputSchema: { project_id: z.string().optional(), work_id: z.string().min(1), revision: z.number().int().positive().optional() }, annotations: { readOnlyHint: true }
  }, async ({ project_id, work_id, revision }) => { try { return result(application.readSourceMotionWork(projectIdFrom(project_id), work_id, revision)); } catch (error) { return failure(error); } });
  server.registerTool("inspect_motion_frames", {
    title: "检查源码作品指定帧",
    description: "以正式引擎检查固定作品根帧，比较顺序、同页回跳与干净页结果；不编码视频、不创建素材或编辑版本。返回 Job，结果仅代表实际检查的帧。",
    inputSchema: { project_id: z.string().optional(), revision: z.number().int().positive(), work_id: z.string().min(1), frames: z.array(z.number().int().nonnegative()).min(1), idempotency_key: z.string().min(1).max(160) }
  }, async ({ project_id, revision, work_id, frames, idempotency_key }) => { try {
    return result(motionJobReceipt(application.submitMotionInspection({ projectId: projectIdFrom(project_id), revision, workId: work_id, frames, idempotencyKey: idempotency_key })));
  } catch (error) { return failure(error); } });
  server.registerTool("review_motion_work", {
    title: "记录作品动态审阅", description: "对照完整制作简报、采用参考与同版实际作品记录 outcome、note 和 evidence，creativeBrief 保存提交摘要。evidence 使用半开范围，work_proxy 使用作品局部帧，project_preview 和 workbench 使用项目全局帧。failed/inconclusive 可记录局部观察；passed 要求连续顺序覆盖完整作品并使用 continuous_video 或 audiovisual。审阅独立保存，不产生新 Revision，未观察范围如实记录。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), work_id: z.string(), asset_id: z.string().optional(), outcome: motionReviewFields.outcome, note: motionReviewFields.note, evidence: motionReviewFields.evidence }
  }, async ({ project_id, base_revision_id, work_id, asset_id, outcome, evidence, note }) => { try { return result(commandReceipt(await application.reviewSourceMotionWork({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, workId: work_id, assetId: asset_id, outcome, evidence, note }), { assetId: asset_id, outcome }, true)); } catch (error) { return failure(error); } });
}
