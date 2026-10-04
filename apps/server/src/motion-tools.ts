import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EditingApplication } from "@videocut/application";
import { MOTION_SOURCES } from "../../../packages/motion-work/src/catalog.js";
import { motionSubmissionSchema, motionReviewFields } from "../../../packages/motion-work/src/schema.js";
import { inspectMotionReferenceViaRuntime } from "./motion-reference-client.js";

export function registerMotionTools(server: McpServer, application: EditingApplication, projectIdFrom: (value?: string) => string) {
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  const failure = (error: unknown) => ({ ...result({ error: error instanceof Error ? error.message : String(error) }), isError: true });
  server.registerTool("inspect_motion_reference", {
    title: "查看在线动效参考", description: "在独立浏览器只读查看四个来源的公开页面。先返回预览索引和页面截图，再通过 preview_index 连续采样一个动效；不下载媒体，不跨越登录、验证或付费限制。",
    inputSchema: { source_url: z.string().url(), preview_index: z.number().int().nonnegative().max(300).optional(), sample_duration_ms: z.number().int().min(1000).max(20000).default(6000) }, annotations: { readOnlyHint: true }
  }, async ({ source_url, preview_index, sample_duration_ms }) => { try {
    const { images, ...evidence } = await inspectMotionReferenceViaRuntime(source_url, preview_index, sample_duration_ms);
    return { content: [...result({ ...evidence, samples: images.map(({ elapsedMs }) => ({ elapsedMs })) }).content, ...images.map((item) => ({ type: "image" as const, mimeType: "image/png", data: item.data }))] };
  } catch (error) { return failure(error); } });
  server.registerTool("browse_motion_sources", { title: "在线动效来源", description: "返回已选的四个在线视觉参考库与访问入口，不下载整库，不表示已经观看预览。AE/Jitter 与开源组件均可作为 Remotion 实现参考。", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => result({ sources: MOTION_SOURCES, execution: "通过 submit_motion_work 提交默认导出的 React + Remotion TSX；原创作品按内容设计并填写 creativeBrief；仅在需要参考时观看并记录布局、运动、节奏和适配依据。" }));
  server.registerTool("submit_motion_work", {
    title: "生成受管 Remotion 作品", description: "新作品必须填写 work.creativeBrief 创作说明；仅历史作品按原输入幂等重放时可省略。保存固定版本源码、Props、创作说明与可选参考观察记录，排队隔离渲染。不会修改平台代码或自动放入 Timeline；修改作品重新提交并填写 previousAssetId。支持文字、CSS、SVG、受管图片与最多4路正常速度静音视频。videoBindings 对每个 slot 一次声明源毫秒半开范围与作品 startFrame/endFrame 半开范围，源码 import {TimelineVideo} from '@videoflowcut/motion'；组件按作品全局局部帧取源片，内部 Sequence 不重置源片时间。提交前校验两段帧数相等，Worker 按实际解码复核；源不足报错，不自动循环或冻结；原声须在声音轨显式编排。视频源合计512MB、解码512MB及650000000像素帧预算；imageBindings 把图片 Asset ID 映射到 props.assets 的命名 Slot，源码用 Remotion Img 消费，不直接填资源 URL。单作品限制：宽高为64–1920的偶数，fps为15–60的整数，durationInFrames为2–900的整数，durationInFrames/fps≤30秒，width×height×durationInFrames≤650000000像素帧。最大帧数=min(900,30×fps,floor(650000000/(width×height)))；须在创作前核算，预算拒绝不会创建Job、Asset、Cue或视频Revision。超限应由原创意负责人按自然内容节点分为独立作品或调整画布，每件使用独立幂等键、从0开始的局部帧与完整源码；可在同一Scene内分别审阅并连续放置Cue，作品分段不要求拆Scene，衔接仍需真实合成审阅。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), idempotency_key: z.string().min(1).max(160), work: motionSubmissionSchema }
  }, async ({ project_id, base_revision_id, idempotency_key, work }) => { try { return result(application.submitManagedMotion({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, idempotencyKey: idempotency_key, work })); } catch (error) { return failure(error); } });
  server.registerTool("read_motion_work", {
    title: "读取作品源码与状态", description: "读取所属项目的固定输入、Job、生成 Asset 与审阅状态；不会修改作品。", inputSchema: { project_id: z.string().optional(), job_id: z.string() }, annotations: { readOnlyHint: true }
  }, async ({ project_id, job_id }) => { try { return result(application.readManagedMotion(projectIdFrom(project_id), job_id)); } catch (error) { return failure(error); } });
  server.registerTool("review_motion_work", {
    title: "记录作品动态审阅", description: "对照 creativeBrief 查看作品，再记录 outcome、note 和 evidence。evidence范围为半开区间[startFrame,endFrame)：work_proxy使用作品局部帧；project_preview使用项目全局帧，并绑定同Revision成功Preview。failed/inconclusive可记录与该版本有效Cue相交的实际局部观察，无需覆盖整件；抽帧点和未确认范围写入note，不把未观看范围扩大成证据。只有passed要求完整覆盖作品及continuous_video/audiovisual连续证据。未审或证据不足如实保留，不阻挡放置、修订、制作完成或导出；只有技术/用途条件参与阻挡。reference_match只兼容历史参考作品，不能与outcome同传。合成与最终文件仍须独立审阅。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), asset_id: z.string(), reference_match: motionReviewFields.referenceMatch, outcome: motionReviewFields.outcome, note: motionReviewFields.note, evidence: motionReviewFields.evidence }
  }, async ({ project_id, base_revision_id, asset_id, reference_match, outcome, evidence, note }) => { try { return result(await application.reviewManagedMotion({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, assetId: asset_id, referenceMatch: reference_match, outcome, evidence, note })); } catch (error) { return failure(error); } });
}
