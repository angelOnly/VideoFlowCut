import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EditingApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { presenterMediaKindSchema, presenterSelectionSchema } from "@videocut/contracts";
import { z } from "zod";
import { toolErrorResult } from "./tool-error.js";

const entryChange = z.object({ action: z.enum(["rename", "remove", "set_default"]), id: z.string().min(1), name: z.string().trim().min(1).optional() }).strict();
const importEntry = z.object({ kind: presenterMediaKindSchema, name: z.string().trim().min(1), sourcePath: z.string().min(1), replaceId: z.string().min(1).optional(), setDefault: z.boolean().optional() }).strict();
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });

export function registerPresenterRoutes(server: FastifyInstance, application: EditingApplication) {
  server.get("/api/settings/presenter-library", async () => application.presenterLibrary.read());
  server.post("/api/settings/presenter-library/import", async request => application.presenterLibrary.import(importEntry.parse(request.body)));
  server.post("/api/settings/presenter-library/change", async request => application.presenterLibrary.update(entryChange.parse(request.body)));
  server.post("/api/settings/presenter-library/upload", async request => {
    const input = z.object({ kind: presenterMediaKindSchema, name: z.string().trim().min(1), replaceId: z.string().optional(), setDefault: z.enum(["true", "false"]).optional() }).parse(request.query);
    const part = await request.file();
    if (!part) throw new DomainError("请选择照片或音色文件", "PRESENTER_FILE_REQUIRED");
    const directory = join(application.repository.workspaceRoot, "uploads");
    await mkdir(directory, { recursive: true });
    const path = join(directory, `${randomUUID()}-${basename(part.filename)}`);
    try {
      await pipeline(part.file, createWriteStream(path, { flags: "wx" }));
      if (part.file.truncated) throw new DomainError("上传文件超过大小限制", "UPLOAD_FILE_TOO_LARGE");
      return await application.presenterLibrary.import({ ...input, sourcePath: path, setDefault: input.setDefault === "true" });
    } finally { await rm(path, { force: true }); }
  });
  server.get("/api/settings/presenter-library/:id/media", async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { entry, path } = application.presenterLibrary.file(id);
    const extension = entry.fileName.split(".").pop();
    const mime: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", wav: "audio/wav", mp3: "audio/mpeg", flac: "audio/flac", m4a: "audio/mp4", ogg: "audio/ogg" };
    return reply.type(mime[extension ?? ""] ?? "application/octet-stream").send(createReadStream(path));
  });
  server.post("/api/projects/:projectId/presenter-selection", async request => {
    const { projectId } = z.object({ projectId: z.string().min(1) }).parse(request.params);
    return application.presenterLibrary.apply({ projectId, ...presenterSelectionSchema.parse(request.body) });
  });
}

export function registerPresenterTools(server: McpServer, application: EditingApplication, projectIdFrom: (id?: string) => string) {
  server.registerTool("resume_avatar_job", { title: "恢复 LTX 人物任务", description: "已知 Run 沿原任务查询和回收；明确生成失败才创建固定恢复任务。缺失 Run ID 的未知提交不重复执行，不切换模型。", inputSchema: { job_id: z.string().min(1) } }, async ({ job_id }) => {
    try { return text(application.resumeAvatarGeneration(job_id)); } catch (error) { return toolErrorResult(error); }
  });
  server.registerTool("read_presenter_library", { title: "读取人物照片与音色", description: "读取跨项目保存的照片、音色样本和默认选择。项目内固定输入见 read_project.presenter；修改默认不会回写已有项目。", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => text(application.presenterLibrary.read()));
  server.registerTool("import_presenter_media", { title: "保存人物照片或音色", description: "将本地图片或音色样本复制到工作台受管目录；可替换同类条目或设默认，不启动生成、不修改已有项目。音色样本不是 LTX 的台词音频。", inputSchema: importEntry }, async input => {
    try { return text(await application.presenterLibrary.import(input)); } catch (error) { return toolErrorResult(error); }
  });
  server.registerTool("manage_presenter_library", { title: "管理人物与音色列表", description: "重命名、移除或设置默认。移除默认条目会清除该默认，不自动选择其他条目；项目副本不受影响。", inputSchema: entryChange }, async input => {
    try { return text(application.presenterLibrary.update(input)); } catch (error) { return toolErrorResult(error); }
  });
  server.registerTool("apply_presenter_selection", { title: "选用本片人物与音色", description: "明确 ID 优先，其次项目已选，再使用工作台默认；固定受管副本并返回 Revision/Impact。换照片使生成型人物失效，换音色还使配音与字幕时序失效，须先重配再重生口型。仅提交选择，不自动生成。", inputSchema: presenterSelectionSchema.extend({ projectId: z.string().optional() }) }, async input => {
    try { return text(application.presenterLibrary.apply({ ...input, projectId: projectIdFrom(input.projectId) })); } catch (error) { return toolErrorResult(error); }
  });
}
