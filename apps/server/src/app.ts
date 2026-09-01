import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import { createApplication, NotFoundError, RevisionConflictError } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { evaluateQuality } from "@videocut/quality";
import type { AssetKind, EditorFocus, ProjectSnapshot } from "@videocut/contracts";

const idSchema = z.string().min(1);
const baseRevisionSchema = z.number().int().positive();

const mimeByExtension: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const assetKindFromFile = (fileName: string): AssetKind => {
  const extension = extname(fileName).toLowerCase();
  if ([".mp4", ".mov", ".webm", ".mkv"].includes(extension)) return "video";
  if ([".mp3", ".wav", ".flac", ".m4a", ".aac"].includes(extension)) return "audio";
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return "image";
  throw new DomainError(`不支持的素材格式：${extension || "无扩展名"}`, "UNSUPPORTED_MEDIA");
};

const safeFileName = (fileName: string) => basename(fileName).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
const hashFile = async (path: string) => createHash("sha256").update(await readFile(path)).digest("hex");

const parseBaseRevision = (value: unknown) => baseRevisionSchema.parse(Number(value));

function assertPathWithin(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (rel.startsWith("..") || resolve(root, rel) !== resolve(candidate)) {
    throw new DomainError("文件路径不在允许的项目目录内", "UNSAFE_FILE_PATH");
  }
}

export interface ServerOptions {
  workspaceRoot?: string;
  webOrigin?: string;
  serveWeb?: boolean;
}

export async function createServer(options: ServerOptions = {}): Promise<{ app: FastifyInstance; application: ReturnType<typeof createApplication> }> {
  const workspaceRoot = options.workspaceRoot ?? process.env.VIDEOCUT_WORKSPACE ?? join(process.cwd(), "workspace");
  const webOrigin = options.webOrigin ?? process.env.WEB_ORIGIN ?? "http://127.0.0.1:5173";
  const application = createApplication(workspaceRoot);
  const bridge = new ComfyUIBridgeClient();
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { files: 18, fileSize: 512 * 1024 * 1024 } });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof RevisionConflictError) {
      return reply.status(409).send({ error: "REVISION_CONFLICT", message: error.message, expectedRevision: error.expected, currentRevision: error.actual });
    }
    if (error instanceof NotFoundError) return reply.status(404).send({ error: "NOT_FOUND", message: error.message });
    if (error instanceof DomainError || error instanceof z.ZodError) {
      return reply.status(400).send({ error: error instanceof DomainError ? error.code : "VALIDATION_ERROR", message: error.message });
    }
    app.log.error(error);
    return reply.status(500).send({ error: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "未知服务器错误" });
  });

  app.get("/health", async () => {
    let bridgeStatus: unknown;
    try {
      bridgeStatus = await bridge.health();
    } catch (error) {
      bridgeStatus = { status: "unavailable", reason: error instanceof Error ? error.message : String(error) };
    }
    return { status: "ready", bridge: bridgeStatus };
  });

  app.get("/api/projects", async () => application.listProjects());

  app.post("/api/projects", async (request, reply) => {
    const body = z.object({
      name: z.string().trim().min(1).max(100),
      profile: z.enum(["presenter_motion", "visual_explainer", "vlog", "hybrid"]).optional(),
      brief: z.object({
        platform: z.string().optional(),
        aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
        targetDurationSeconds: z.number().positive().optional(),
        audience: z.string().optional(),
        tone: z.string().optional(),
        captionMode: z.enum(["stable", "none"]).optional(),
        allowHighDensityMotion: z.boolean().optional()
      }).optional()
    }).parse(request.body);
    const state = application.createProject(body);
    return reply.status(201).send(state);
  });

  app.get("/api/projects/:projectId", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    return application.readProject(projectId);
  });

  app.get("/api/projects/:projectId/revisions", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    return application.readRevisions(projectId);
  });

  app.get("/api/projects/:projectId/jobs", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    return application.listJobs(projectId);
  });

  app.get("/api/jobs/:jobId", async (request) => {
    const { jobId } = z.object({ jobId: idSchema }).parse(request.params);
    return application.trackJob(jobId);
  });

  app.get("/api/projects/:projectId/quality", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const state = application.readProject(projectId);
    return evaluateQuality(state.snapshot, state.revision.number);
  });

  app.get("/api/projects/:projectId/editor-url", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const query = z.object({ sceneId: z.string().optional(), itemId: z.string().optional(), effectCueId: z.string().optional(), frame: z.coerce.number().int().min(0).optional() }).parse(request.query);
    const state = application.readProject(projectId);
    const focus: EditorFocus = { projectId, revision: state.revision.number, ...query };
    const url = new URL(webOrigin);
    url.searchParams.set("projectId", projectId);
    if (query.sceneId) url.searchParams.set("sceneId", query.sceneId);
    if (query.itemId) url.searchParams.set("itemId", query.itemId);
    if (query.effectCueId) url.searchParams.set("effectCueId", query.effectCueId);
    if (query.frame !== undefined) url.searchParams.set("frame", String(query.frame));
    return { editorUrl: url.toString(), focus };
  });

  async function importFile(input: { projectId: string; baseRevision: number; sourcePath: string; originalPath?: string }): Promise<unknown> {
    const state = application.readProject(input.projectId);
    const sourceName = safeFileName(basename(input.sourcePath));
    const kind = assetKindFromFile(sourceName);
    const sourceHash = await hashFile(input.sourcePath);
    const duplicate = state.snapshot.assets.find((asset) => asset.sourceHash === sourceHash);
    if (duplicate) return { duplicate: true, asset: duplicate, state };
    const extension = extname(sourceName);
    const storedName = `${Date.now()}-${sourceHash.slice(0, 10)}${extension}`;
    const relativePath = join("assets", "source", storedName);
    const targetPath = join(state.snapshot.project.rootPath, relativePath);
    await mkdir(join(state.snapshot.project.rootPath, "assets", "source"), { recursive: true });
    await copyFile(input.sourcePath, targetPath);
    return application.registerImportedAsset({
      projectId: input.projectId,
      baseRevision: input.baseRevision,
      name: sourceName,
      kind,
      managedPath: relativePath,
      originalPath: input.originalPath,
      sourceHash
    });
  }

  app.post("/api/projects/:projectId/assets/import-path", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema, filePath: z.string().min(1) }).parse(request.body);
    const sourcePath = resolve(body.filePath);
    if (!existsSync(sourcePath)) throw new NotFoundError(`本地文件不存在：${sourcePath}`);
    return importFile({ projectId, baseRevision: body.baseRevision, sourcePath, originalPath: sourcePath });
  });

  app.post("/api/projects/:projectId/assets/upload", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const query = z.object({ baseRevision: z.coerce.number().int().positive() }).parse(request.query);
    const state = application.readProject(projectId);
    const uploadDirectory = join(state.snapshot.project.rootPath, "cache", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    const results: unknown[] = [];
    for await (const part of request.files()) {
      const filename = safeFileName(part.filename);
      const tempPath = join(uploadDirectory, `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`);
      await writeFile(tempPath, await part.toBuffer());
      results.push(await importFile({ projectId, baseRevision: query.baseRevision, sourcePath: tempPath, originalPath: filename }));
      const latest = application.readProject(projectId);
      query.baseRevision = latest.revision.number;
    }
    return { imports: results };
  });

  app.post("/api/projects/:projectId/transcription", async (request, reply) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ assetId: idSchema, idempotencyKey: z.string().optional() }).parse(request.body);
    const job = application.submitTranscription({ projectId, ...body });
    return reply.status(202).send(job);
  });

  app.post("/api/projects/:projectId/transcripts/manual", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ assetId: idSchema, text: z.string().trim().min(1) }).parse(request.body);
    return application.applyTranscript({ projectId, ...body, source: "manual" });
  });

  app.post("/api/projects/:projectId/script", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema, semanticUnitIds: z.array(idSchema) }).parse(request.body);
    return application.applyScript({ projectId, ...body });
  });

  app.post("/api/projects/:projectId/timeline/build-presenter", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema, assetIds: z.array(idSchema).min(1), sceneSize: z.number().int().min(1).max(8).optional() }).parse(request.body);
    return application.buildPresenterTimeline({ projectId, ...body });
  });

  app.post("/api/projects/:projectId/scenes", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({
      baseRevision: baseRevisionSchema,
      type: z.enum(["PresenterScene", "ExplainerScene", "VlogMontageScene", "CutawayScene", "EndCardScene"]),
      title: z.string().min(1),
      purpose: z.string().min(1),
      startFrame: z.number().int().min(0),
      endFrame: z.number().int().positive(),
      assetIds: z.array(idSchema).optional()
    }).parse(request.body);
    return application.createScene({ projectId, ...body });
  });

  app.post("/api/projects/:projectId/effects", async (request) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({
      baseRevision: baseRevisionSchema,
      sceneId: idSchema,
      type: z.enum(["MetricBackdrop", "ProductFan", "GlowCTA", "PortfolioWall", "CommentCloud", "EvidenceCard", "CameraPunch", "FullScreenMeme", "DeviceShowcase", "ContentCarousel", "EndCard"]),
      layer: z.enum(["rear", "actor", "front", "fullscreen"]),
      startFrame: z.number().int().min(0),
      endFrame: z.number().int().positive(),
      anchorTargetId: z.string().optional(),
      note: z.string().optional()
    }).parse(request.body);
    return application.createEffectCue({ projectId, ...body });
  });

  app.patch("/api/projects/:projectId/effects/:cueId", async (request) => {
    const { projectId, cueId } = z.object({ projectId: idSchema, cueId: idSchema }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema, startFrame: z.number().int().min(0).optional(), endFrame: z.number().int().positive().optional(), intensity: z.number().min(0).max(1).optional(), note: z.string().optional() }).parse(request.body);
    return application.updateEffectCue({ projectId, cueId, ...body });
  });

  app.post("/api/projects/:projectId/items/:itemId/move", async (request) => {
    const { projectId, itemId } = z.object({ projectId: idSchema, itemId: idSchema }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema, startFrame: z.number().int().min(0), ripple: z.boolean().optional() }).parse(request.body);
    return application.moveItem({ projectId, itemId, ...body });
  });

  app.post("/api/projects/:projectId/voice-synthesis", async (request, reply) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ voiceReferenceAssetId: idSchema, speechSegmentIds: z.array(idSchema).optional(), idempotencyKey: z.string().optional() }).parse(request.body);
    return reply.status(202).send(application.submitVoiceSynthesis({ projectId, ...body }));
  });

  app.post("/api/projects/:projectId/export", async (request, reply) => {
    const { projectId } = z.object({ projectId: idSchema }).parse(request.params);
    const body = z.object({ revision: z.number().int().positive().optional(), idempotencyKey: z.string().optional() }).parse(request.body);
    return reply.status(202).send(application.submitExport({ projectId, ...body }));
  });

  app.post("/api/projects/:projectId/revisions/:revision/rollback", async (request) => {
    const { projectId, revision } = z.object({ projectId: idSchema, revision: z.coerce.number().int().positive() }).parse(request.params);
    const body = z.object({ baseRevision: baseRevisionSchema }).parse(request.body);
    return application.rollbackToRevision({ projectId, targetRevision: revision, ...body });
  });

  app.post("/api/jobs/:jobId/retry", async (request, reply) => {
    const { jobId } = z.object({ jobId: idSchema }).parse(request.params);
    const oldJob = application.trackJob(jobId);
    const retry = application.repository.createJob({
      projectId: oldJob.projectId,
      kind: oldJob.kind,
      payload: oldJob.payload,
      idempotencyKey: `${oldJob.idempotencyKey}:retry:${Date.now()}`
    });
    return reply.status(202).send(retry);
  });

  app.get("/api/events", async (request, reply) => {
    const query = z.object({ projectId: idSchema }).parse(request.query);
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    });
    reply.raw.write("retry: 1500\n\n");
    const unsubscribe = application.subscribe((event) => {
      if (event.projectId === query.projectId) reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });
    request.raw.on("close", unsubscribe);
    return reply;
  });

  app.get("/media/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    const mediaRoot = join(workspaceRoot, "projects");
    const filePath = resolve(mediaRoot, wildcard);
    assertPathWithin(mediaRoot, filePath);
    if (!existsSync(filePath)) throw new NotFoundError("媒体文件不存在");
    const mime = mimeByExtension[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    return reply.type(mime).send(createReadStream(filePath));
  });

  if (options.serveWeb) {
    const webRoot = join(process.cwd(), "apps", "web", "dist");
    if (existsSync(webRoot)) {
      await app.register(staticPlugin, { root: webRoot, prefix: "/" });
      app.get("/", async (_request, reply) => reply.sendFile("index.html"));
    }
  }

  return { app, application };
}
