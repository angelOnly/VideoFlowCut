import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { evaluateQuality } from "@videocut/quality";
import { EFFECT_TYPES } from "@videocut/contracts";

const workspaceRoot = process.env.VIDEOCUT_WORKSPACE ?? join(process.cwd(), "workspace");
const webOrigin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:5173";
const application = createApplication(workspaceRoot);
let targetProjectId: string | undefined;

const asText = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const asError = (error: unknown) => ({ content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true });
const projectIdFrom = (projectId?: string) => {
  const resolved = projectId ?? targetProjectId;
  if (!resolved) throw new DomainError("请先调用 target_project 或显式传入 project_id", "PROJECT_NOT_TARGETED");
  return resolved;
};
const kindFromPath = (path: string) => {
  const extension = extname(path).toLowerCase();
  if ([".mp4", ".mov", ".webm", ".mkv"].includes(extension)) return "video" as const;
  if ([".mp3", ".wav", ".flac", ".m4a", ".aac"].includes(extension)) return "audio" as const;
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return "image" as const;
  throw new DomainError(`不支持的素材格式：${extension}`, "UNSUPPORTED_MEDIA");
};

async function importLocalMedia(projectId: string, baseRevision: number, filePath: string) {
  const sourcePath = resolve(filePath);
  const sourceHash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  const current = application.readProject(projectId);
  const duplicate = current.snapshot.assets.find((asset) => asset.sourceHash === sourceHash);
  if (duplicate) return { duplicate: true, asset: duplicate, state: current };
  const fileName = basename(sourcePath).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  const relativePath = join("assets", "source", `${Date.now()}-${sourceHash.slice(0, 10)}${extname(fileName)}`);
  const destination = join(current.snapshot.project.rootPath, relativePath);
  await mkdir(join(current.snapshot.project.rootPath, "assets", "source"), { recursive: true });
  await copyFile(sourcePath, destination);
  return application.registerImportedAsset({
    projectId,
    baseRevision,
    name: fileName,
    kind: kindFromPath(fileName),
    managedPath: relativePath,
    originalPath: sourcePath,
    sourceHash
  });
}

const server = new McpServer({ name: "video-editor-mcp", version: "0.1.0" });

server.registerTool("list_projects", {
  title: "列出视频项目",
  description: "读取本地 Editing Application 中的项目摘要。",
  inputSchema: {}
}, async () => {
  try { return asText(application.listProjects()); } catch (error) { return asError(error); }
});

server.registerTool("create_project", {
  title: "创建视频项目",
  description: "创建含 Revision 1 的项目与受管媒体目录。",
  inputSchema: {
    name: z.string().min(1),
    profile: z.enum(["presenter_motion", "visual_explainer", "vlog", "hybrid"]).optional()
  }
}, async (input) => {
  try {
    const state = application.createProject(input);
    targetProjectId = state.snapshot.project.id;
    return asText(state);
  } catch (error) { return asError(error); }
});

server.registerTool("target_project", {
  title: "设定当前项目",
  description: "将 MCP 会话绑定到已存在的项目；不会修改项目内容。",
  inputSchema: { project_id: z.string().min(1) },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const state = application.readProject(project_id);
    targetProjectId = project_id;
    return asText({ projectId: project_id, revision: state.revision.number, name: state.snapshot.project.name });
  } catch (error) { return asError(error); }
});

server.registerTool("read_project", {
  title: "读取项目",
  description: "读取 Project、Story/Scene/Timeline 的同一 Revision 快照。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try { return asText(application.readProject(projectIdFrom(project_id))); } catch (error) { return asError(error); }
});

server.registerTool("get_editor_url", {
  title: "获取工作台链接",
  description: "返回可定位到项目或对象的 Web 工作台 URL。",
  inputSchema: {
    project_id: z.string().optional(),
    scene_id: z.string().optional(),
    item_id: z.string().optional(),
    effect_cue_id: z.string().optional(),
    frame: z.number().int().nonnegative().optional()
  },
  annotations: { readOnlyHint: true }
}, async (input) => {
  try {
    const projectId = projectIdFrom(input.project_id);
    const state = application.readProject(projectId);
    const url = new URL(webOrigin);
    url.searchParams.set("projectId", projectId);
    if (input.scene_id) url.searchParams.set("sceneId", input.scene_id);
    if (input.item_id) url.searchParams.set("itemId", input.item_id);
    if (input.effect_cue_id) url.searchParams.set("effectCueId", input.effect_cue_id);
    if (input.frame !== undefined) url.searchParams.set("frame", String(input.frame));
    return asText({ editorUrl: url.toString(), revision: state.revision.number });
  } catch (error) { return asError(error); }
});

server.registerTool("focus_editor_object", {
  title: "定位工作台对象",
  description: "生成指向指定 Scene、Timeline Item、EffectCue 或帧的稳定工作台 URL；不会修改项目。",
  inputSchema: {
    project_id: z.string().optional(),
    scene_id: z.string().optional(),
    item_id: z.string().optional(),
    effect_cue_id: z.string().optional(),
    frame: z.number().int().nonnegative().optional()
  },
  annotations: { readOnlyHint: true }
}, async (input) => {
  try {
    const projectId = projectIdFrom(input.project_id);
    const state = application.readProject(projectId);
    const url = new URL(webOrigin);
    url.searchParams.set("projectId", projectId);
    if (input.scene_id) url.searchParams.set("sceneId", input.scene_id);
    if (input.item_id) url.searchParams.set("itemId", input.item_id);
    if (input.effect_cue_id) url.searchParams.set("effectCueId", input.effect_cue_id);
    if (input.frame !== undefined) url.searchParams.set("frame", String(input.frame));
    return asText({ editorUrl: url.toString(), revision: state.revision.number, focus: input });
  } catch (error) { return asError(error); }
});

server.registerTool("read_impact_report", {
  title: "读取改动影响",
  description: "读取某个 Revision 的 ImpactReport、脏区与失效对象。",
  inputSchema: { project_id: z.string().optional(), revision: z.number().int().positive().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id, revision }) => {
  try {
    const projectId = projectIdFrom(project_id);
    const current = application.readProject(projectId);
    const target = revision ? application.repository.getRevision(projectId, revision) : current.revision;
    return asText({ revision: target.number, summary: target.summary, impact: target.impact });
  } catch (error) { return asError(error); }
});

server.registerTool("list_revisions", {
  title: "列出 Revision",
  description: "读取不可变 Revision 历史，不会改变当前项目。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try { return asText(application.readRevisions(projectIdFrom(project_id))); } catch (error) { return asError(error); }
});

server.registerTool("rollback_revision", {
  title: "回退 Revision",
  description: "以明确 base_revision_id 原子恢复指定快照，并生成新的 Revision。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), target_revision: z.number().int().positive() }
}, async ({ project_id, base_revision_id, target_revision }) => {
  try { return asText(application.rollbackToRevision({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, targetRevision: target_revision })); } catch (error) { return asError(error); }
});

server.registerTool("browse_assets", {
  title: "浏览素材库",
  description: "读取项目素材、媒体元数据和处理状态。",
  inputSchema: { project_id: z.string().optional(), kind: z.enum(["video", "audio", "image", "document", "actor_video", "speech", "derived"]).optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id, kind }) => {
  try {
    const state = application.readProject(projectIdFrom(project_id));
    return asText(kind ? state.snapshot.assets.filter((asset) => asset.kind === kind) : state.snapshot.assets);
  } catch (error) { return asError(error); }
});

server.registerTool("import_media", {
  title: "导入本地素材",
  description: "复制本地媒体到受管项目目录并创建媒体分析任务。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), file_path: z.string().min(1) }
}, async ({ project_id, base_revision_id, file_path }) => {
  try { return asText(await importLocalMedia(projectIdFrom(project_id), base_revision_id, file_path)); } catch (error) { return asError(error); }
});

server.registerTool("submit_transcription", {
  title: "提交 FunASR 转写",
  description: "使用动态读取 Schema 的 ComfyUI Bridge 工作流提交音频转写。",
  inputSchema: { project_id: z.string().optional(), asset_id: z.string().min(1), idempotency_key: z.string().optional() }
}, async ({ project_id, asset_id, idempotency_key }) => {
  try { return asText(application.submitTranscription({ projectId: projectIdFrom(project_id), assetId: asset_id, idempotencyKey: idempotency_key })); } catch (error) { return asError(error); }
});

server.registerTool("read_script", {
  title: "读取最终 Script",
  description: "读取 SemanticUnit、最终 Script 和 SpeechSegment；不将转写行伪装成词级时序。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText({ semanticUnits: snapshot.semanticUnits, script: snapshot.script, speechSegments: snapshot.speechSegments });
  } catch (error) { return asError(error); }
});

server.registerTool("apply_script", {
  title: "应用语义 Script",
  description: "按完整语义单元更新最终 Script，并返回新 Revision 与 ImpactReport。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), semantic_unit_ids: z.array(z.string()) }
}, async ({ project_id, base_revision_id, semantic_unit_ids }) => {
  try { return asText(application.applyScript({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, semanticUnitIds: semantic_unit_ids })); } catch (error) { return asError(error); }
});

server.registerTool("read_speech_asset", {
  title: "读取语音资产",
  description: "读取 SpeechSegment、SegmentAsset、最终 SpeechAsset 与本地 VoiceReference；不会伪造远端 Voice ID。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText({
      scriptRevision: snapshot.script.revision,
      voiceReferences: snapshot.assets.filter((asset) => asset.kind === "audio" && asset.status === "ready"),
      speechSegments: snapshot.speechSegments,
      speechSegmentAssets: snapshot.speechSegmentAssets,
      speechAsset: snapshot.speechAsset
    });
  } catch (error) { return asError(error); }
});

server.registerTool("read_speech_timing", {
  title: "读取语音时序",
  description: "读取 SpeechTiming 的精度与真实段级范围；第一版不把它描述成词级时序。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText(snapshot.speechAsset ? { scriptRevision: snapshot.speechAsset.scriptRevision, timing: snapshot.speechAsset.timing } : { timing: undefined, reason: "尚未组装 SpeechAsset" });
  } catch (error) { return asError(error); }
});

server.registerTool("submit_voice_synthesis", {
  title: "提交段级声音合成",
  description: "用本地 VoiceReference 加当前 SpeechSegment 文本调用 OmniVoice；返回可跟踪 Job。",
  inputSchema: {
    project_id: z.string().optional(),
    voice_reference_asset_id: z.string().min(1),
    speech_segment_ids: z.array(z.string()).optional(),
    idempotency_key: z.string().optional()
  }
}, async ({ project_id, voice_reference_asset_id, speech_segment_ids, idempotency_key }) => {
  try {
    return asText(application.submitVoiceSynthesis({
      projectId: projectIdFrom(project_id),
      voiceReferenceAssetId: voice_reference_asset_id,
      speechSegmentIds: speech_segment_ids,
      idempotencyKey: idempotency_key
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("read_captions", {
  title: "读取字幕卡",
  description: "读取最终 Caption Program 与其时序精度。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText(snapshot.timeline.captions);
  } catch (error) { return asError(error); }
});

server.registerTool("create_presenter_timeline", {
  title: "创建 Presenter 主线",
  description: "将已就绪视频创建为主画面 Scene、Item 和 Scene Strip。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), asset_ids: z.array(z.string()).min(1), scene_size: z.number().int().min(1).max(8).optional() }
}, async ({ project_id, base_revision_id, asset_ids, scene_size }) => {
  try { return asText(application.buildPresenterTimeline({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, assetIds: asset_ids, sceneSize: scene_size })); } catch (error) { return asError(error); }
});

server.registerTool("browse_scene_types", {
  title: "浏览场景类型",
  description: "读取当前第一版可创建的统一 Scene 类型。",
  inputSchema: {},
  annotations: { readOnlyHint: true }
}, async () => asText(["PresenterScene", "ExplainerScene", "VlogMontageScene", "CutawayScene", "EndCardScene"]));

server.registerTool("create_scene", {
  title: "创建场景",
  description: "基于明确时间范围创建 Scene，并通过 Revision 原子提交。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    type: z.enum(["PresenterScene", "ExplainerScene", "VlogMontageScene", "CutawayScene", "EndCardScene"]),
    title: z.string().min(1),
    purpose: z.string().min(1),
    start_frame: z.number().int().nonnegative(),
    end_frame: z.number().int().positive(),
    asset_ids: z.array(z.string()).optional()
  }
}, async (input) => {
  try {
    return asText(application.createScene({
      projectId: projectIdFrom(input.project_id),
      baseRevision: input.base_revision_id,
      type: input.type,
      title: input.title,
      purpose: input.purpose,
      startFrame: input.start_frame,
      endFrame: input.end_frame,
      assetIds: input.asset_ids
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("browse_effect_types", {
  title: "浏览效果类型",
  description: "读取当前 Remotion Effect Registry 中可用的效果类型。",
  inputSchema: {},
  annotations: { readOnlyHint: true }
}, async () => asText(EFFECT_TYPES));

server.registerTool("manage_effect_cues", {
  title: "管理视觉效果",
  description: "创建 Presenter EffectCue，并强制其位于所属 Scene 内。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    scene_id: z.string(),
    type: z.enum(["MetricBackdrop", "ProductFan", "GlowCTA", "PortfolioWall", "CommentCloud", "EvidenceCard", "CameraPunch", "FullScreenMeme", "DeviceShowcase", "ContentCarousel", "EndCard"]),
    layer: z.enum(["rear", "actor", "front", "fullscreen"]),
    start_frame: z.number().int().nonnegative(),
    end_frame: z.number().int().positive(),
    anchor_target_id: z.string().optional(),
    note: z.string().optional()
  }
}, async (input) => {
  try {
    return asText(application.createEffectCue({
      projectId: projectIdFrom(input.project_id), baseRevision: input.base_revision_id, sceneId: input.scene_id,
      type: input.type, layer: input.layer, startFrame: input.start_frame, endFrame: input.end_frame,
      anchorTargetId: input.anchor_target_id, note: input.note
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("move_item", {
  title: "移动时间线片段",
  description: "以明确 base_revision_id 移动一个 Item；可选择同轨 ripple，冲突会原子回滚。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    item_id: z.string().min(1),
    start_frame: z.number().int().nonnegative(),
    ripple: z.boolean().optional()
  }
}, async ({ project_id, base_revision_id, item_id, start_frame, ripple }) => {
  try {
    return asText(application.moveItem({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id,
      itemId: item_id,
      startFrame: start_frame,
      ripple
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("preview_timeline", {
  title: "读取时间线窗口",
  description: "读取同一 Revision 的多轨 Timeline、Scene、Caption 与 Cue 结构。",
  inputSchema: { project_id: z.string().optional(), from_frame: z.number().int().nonnegative().optional(), to_frame: z.number().int().positive().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id, from_frame, to_frame }) => {
  try {
    const state = application.readProject(projectIdFrom(project_id));
    const from = from_frame ?? 0;
    const to = to_frame ?? state.snapshot.timeline.durationInFrames;
    const overlaps = <T extends { startFrame: number; endFrame: number }>(entry: T) => entry.endFrame > from && entry.startFrame < to;
    return asText({
      revision: state.revision.number,
      timeline: { ...state.snapshot.timeline, items: state.snapshot.timeline.items.filter(overlaps), captions: state.snapshot.timeline.captions.filter(overlaps) },
      scenes: state.snapshot.scenes.filter(overlaps),
      effectCues: state.snapshot.effectCues.filter(overlaps)
    });
  } catch (error) { return asError(error); }
});

server.registerTool("read_quality_report", {
  title: "读取质量报告",
  description: "执行确定性技术检查，并返回需要在真实预览复核的警告。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const state = application.readProject(projectIdFrom(project_id));
    return asText(evaluateQuality(state.snapshot, state.revision.number));
  } catch (error) { return asError(error); }
});

server.registerTool("submit_export", {
  title: "提交导出",
  description: "固定指定 Revision 后异步提交 Remotion MP4 导出；若渲染环境不可用，任务结果会明确标记 FFmpeg 降级。",
  inputSchema: { project_id: z.string().optional(), revision: z.number().int().positive().optional(), idempotency_key: z.string().optional() }
}, async ({ project_id, revision, idempotency_key }) => {
  try { return asText(application.submitExport({ projectId: projectIdFrom(project_id), revision, idempotencyKey: idempotency_key })); } catch (error) { return asError(error); }
});

server.registerTool("track_job", {
  title: "跟踪任务",
  description: "读取异步任务的 queued/running/succeeded/failed 状态与诊断信息。",
  inputSchema: { job_id: z.string().min(1) },
  annotations: { readOnlyHint: true }
}, async ({ job_id }) => {
  try { return asText(application.trackJob(job_id)); } catch (error) { return asError(error); }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("video-editor-mcp 已通过 stdio 启动");
