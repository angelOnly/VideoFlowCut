import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EditingApplication } from "@videocut/application";
import { prepareObjectResourcesSchema, objectResourceCapabilities, ObjectResourceError } from "../../../packages/media-intelligence/src/object-resources/index.js";
import { toolErrorResult } from "./tool-error.js";

export function registerObjectResourceTools(server: McpServer, app: EditingApplication) {
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  server.registerTool("read_object_resource_capabilities", {
    title: "读取物件资源加工能力", description: "读取支持格式、规范化方式、图集与每任务像素预算；加工不提供自动分层、隐藏面生成或创意采用。", inputSchema: {}, annotations: { readOnlyHint: true }
  }, async () => result(objectResourceCapabilities));
  server.registerTool("prepare_object_resources", {
    title: "准备物件部件与图集", description: "使用当前项目真实图片 Asset，按明确裁切、同尺寸 alpha/luminance 遮罩、透明裁边和局部占位生成 PNG 与布局。异步 Job，track_job 读取结果；返回真实 Asset ID、Revision、inputHash、layoutPath 和完整 layout。图集不旋转、不自动缩图，超页数返回诊断。幂等键重放返回原 Job；并发 Revision 冲突不覆盖旧结果。图片按既有 imageBindings 使用，每页一槽。", inputSchema: prepareObjectResourcesSchema.shape
  }, async input => {
    try { return result(await app.prepareObjectResources(input)); }
    catch (error) {
      if (error instanceof ObjectResourceError) return { ...result({ code: error.code, message: error.message, details: error.details, sideEffects: "none", safeToRetry: false }), isError: true };
      return toolErrorResult(error);
    }
  });
}
