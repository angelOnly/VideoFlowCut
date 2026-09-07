import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EditingApplication } from "@videocut/application";
import { MOTION_SOURCES } from "../../../packages/motion-work/src/catalog.js";
import { motionSubmissionSchema } from "../../../packages/motion-work/src/schema.js";
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
  server.registerTool("browse_motion_sources", { title: "在线动效来源", description: "返回已选的四个在线视觉参考库与访问入口，不下载整库，不表示已经观看预览。AE/Jitter 与开源组件均可作为 Remotion 实现参考。", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => result({ sources: MOTION_SOURCES, execution: "通过 submit_motion_work 提交默认导出的 React + Remotion TSX；先观看动态预览并记录布局、运动、节奏和适配依据。" }));
  server.registerTool("submit_motion_work", {
    title: "生成受管 Remotion 作品", description: "保存固定版本源码、Props 和在线参考观察记录，排队隔离渲染。不会修改平台代码或自动放入 Timeline；修改作品重新提交并填写 previousAssetId。支持文字、CSS、SVG 和受管图片的帧驱动 2D 动效；imageBindings 把图片 Asset ID 映射到 props.assets 的命名 Slot，源码用 Remotion Img 消费，不直接填资源 URL。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), idempotency_key: z.string().min(1).max(160), work: motionSubmissionSchema }
  }, async ({ project_id, base_revision_id, idempotency_key, work }) => { try { return result(application.submitManagedMotion({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, idempotencyKey: idempotency_key, work })); } catch (error) { return failure(error); } });
  server.registerTool("read_motion_work", {
    title: "读取作品源码与状态", description: "读取所属项目的固定输入、Job、生成 Asset 与审阅状态；不会修改作品。", inputSchema: { project_id: z.string().optional(), job_id: z.string() }, annotations: { readOnlyHint: true }
  }, async ({ project_id, job_id }) => { try { return result(application.readManagedMotion(projectIdFrom(project_id), job_id)); } catch (error) { return failure(error); } });
  server.registerTool("review_motion_work", {
    title: "记录动效参考对照", description: "实际观看参考与生成的连续动态后记录 passed/failed；未连续观看时填写 inconclusive，并在 note 写现有证据、待审原因和复核范围。明确待审的技术就绪作品可放入草稿合成，但阻挡正式交付与完成制作；不能以编译成功或单帧代替观看。参考对照通过后仍须做当前版本的完整合成审片。",
    inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), asset_id: z.string(), reference_match: z.enum(["passed", "failed", "inconclusive"]), note: z.string().min(16).max(2400) }
  }, async ({ project_id, base_revision_id, asset_id, reference_match, note }) => { try { return result(application.reviewManagedMotion({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, assetId: asset_id, referenceMatch: reference_match, note })); } catch (error) { return failure(error); } });
}
