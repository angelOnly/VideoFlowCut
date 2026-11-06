import { motionOnSuccessSchema } from "../../../packages/contracts/src/motion-continuation.js";
import { AUTHORED_MOTION_MANIFEST_CONTRACT } from "../../../packages/contracts/src/authored-motion-manifest-v1.js";
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

export function registerMotionTools(server: McpServer, application: EditingApplication, projectIdFrom: (value?: string) => string) {
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  const failure = toolErrorResult;
  server.registerTool("read_motion_capabilities", {
    title: "读取受管动画能力与字体", description: "只读查询当前动画引擎、HTML 合同与固定运行库及随Runtime发布的字体。fontBindings用槽名映射fontId；平台校验文件并在作者初始化前加载，源码使用vfc.fonts[槽位]的family、weight、style，不自行加载字体或联网。新增字体需要发布新版Runtime。",
    inputSchema: {}, annotations: { readOnlyHint: true }
  }, async () => { try { return result({ engineVersion: MOTION_ENGINE_VERSION, authoredManifestContract: AUTHORED_MOTION_MANIFEST_CONTRACT, html: hyperframesContract, fonts: listMotionFonts(), objectResources: objectResourceCapabilities,
    videoBindings: { maxSlots: null, clock: "work_root", playback: "normal_speed_muted", description: "不设作品视频选段总数上限；每槽固定源身份、哈希、源范围和作品帧范围。分块串行解码并复用缓存，真实资源不足明确失败，不删减选段或静默降质；解码块预算不等于浏览器总内存预算。" },
    fontBindingExample: { title: "noto-sans-sc-bold" }, execution: "仅使用已登记本地字体；通过fontBindings声明，props.fonts由平台注入。配色、描边与帧驱动动效由作者生成，不要求花字模板。理想字体未收录不是平台故障：主任务控制流程，未被用户锁定时由原视觉作者选择合法字体并记录；用户锁定且无法满足时再展示工作台预览并回询。不报工单。已登记原件缺失、变更或加载失败仍明确报错。" }); } catch (error) { return failure(error); } });
  server.registerTool("inspect_motion_reference", {
    title: "查看在线动效参考", description: "在独立浏览器只读查看四个来源的公开页面。先返回预览索引和页面截图，再通过 preview_index 连续采样一个动效；不下载媒体，不跨越登录、验证或付费限制。",
    inputSchema: { source_url: z.string().url(), preview_index: z.number().int().nonnegative().max(300).optional(), sample_duration_ms: z.number().int().min(1000).max(20000).default(6000) }, annotations: { readOnlyHint: true }
  }, async ({ source_url, preview_index, sample_duration_ms }) => { try {
    const { images, ...evidence } = await inspectMotionReferenceViaRuntime(source_url, preview_index, sample_duration_ms);
    return { content: [...result({ ...evidence, samples: images.map(({ elapsedMs }) => ({ elapsedMs })) }).content, ...images.map((item) => ({ type: "image" as const, mimeType: "image/png", data: item.data }))] };
  } catch (error) { return failure(error); } });
  server.registerTool("browse_motion_sources", { title: "在线动效来源", description: "返回已选的四个在线视觉参考库与访问入口，不下载整库，不表示已经观看预览。AE/Jitter 与开源组件均可作为视觉制作参考。", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => result({ sources: MOTION_SOURCES, execution: "通过 register_motion_work 登记完整 HyperFrames HTML，再按需使用 submit_motion_work 生成媒体；原创作品按内容设计并填写 creativeBrief；仅在需要参考时观看并记录布局、运动、节奏和适配依据。" }));
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
  server.registerTool("review_motion_work", {
    title: "记录作品动态审阅", description: "对照 creativeBrief 查看作品，再记录 outcome、note 和 evidence。evidence范围为半开区间[startFrame,endFrame)：work_proxy使用作品局部帧；project_preview使用项目全局帧，并绑定同Revision成功Preview。failed/inconclusive可记录与该版本有效Cue相交的实际局部观察，无需覆盖整件；抽帧点和未确认范围写入note，不把未观看范围扩大成证据。只有passed要求完整覆盖作品及continuous_video/audiovisual连续证据。未审或证据不足如实保留，不阻挡放置、修订、制作完成或导出；只有技术/用途条件参与阻挡。审阅独立保存，不产生新Revision；作品与时间线不变，旧证据不自动升级。按实际覆盖与变化补充合成和最终文件观察，避免各层重复整片审阅。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), work_id: z.string(), asset_id: z.string().optional(), outcome: motionReviewFields.outcome, note: motionReviewFields.note, evidence: motionReviewFields.evidence }
  }, async ({ project_id, base_revision_id, work_id, asset_id, outcome, evidence, note }) => { try { return result(commandReceipt(await application.reviewSourceMotionWork({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, workId: work_id, assetId: asset_id, outcome, evidence, note }), { assetId: asset_id, outcome }, true)); } catch (error) { return failure(error); } });
}
