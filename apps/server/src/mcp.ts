import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createApplication } from "@videocut/application";
import { DomainError } from "@videocut/domain";
import { evaluateQuality } from "@videocut/quality";
import { EFFECT_QUALITY_RULES, EFFECT_TYPES, type Asset, type AssetProvenance } from "@videocut/contracts";
import { inspectComposedFrames } from "./preview-inspection.js";

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

const assetRoleSchema = z.enum(["a_roll", "b_roll", "actor_mask", "voice_reference", "evidence", "cutaway", "style_reference", "generated_visual"]);
const assetProvenanceSchema = z.object({
  source: z.enum(["local_import", "generated", "provider"]),
  provider: z.string().max(240).optional(),
  source_url: z.string().url().max(2_000).optional(),
  original_asset_id: z.string().max(240).optional(),
  creator: z.string().max(240).optional(),
  license: z.string().max(500).optional(),
  attribution_text: z.string().max(1_000).optional(),
  rights_status: z.enum(["unknown", "cleared", "attribution_required", "restricted", "rejected"])
});
type McpAssetProvenance = z.infer<typeof assetProvenanceSchema>;

function provenanceFromMcp(input?: McpAssetProvenance): Omit<AssetProvenance, "acquiredAt"> | undefined {
  if (!input) return undefined;
  const optional = (value?: string) => value?.trim() || undefined;
  return {
    source: input.source,
    provider: optional(input.provider),
    sourceUrl: optional(input.source_url),
    originalAssetId: optional(input.original_asset_id),
    creator: optional(input.creator),
    license: optional(input.license),
    attributionText: optional(input.attribution_text),
    rightsStatus: input.rights_status
  };
}

async function importLocalMedia(projectId: string, baseRevision: number, filePath: string, metadata: {
  role?: Asset["role"];
  tags?: string[];
  provenance?: Omit<AssetProvenance, "acquiredAt">;
} = {}) {
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
    sourceHash,
    role: metadata.role,
    tags: metadata.tags,
    provenance: metadata.provenance ? { ...metadata.provenance, acquiredAt: new Date().toISOString() } : undefined
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

server.registerTool("read_story", {
  title: "读取 Story",
  description: "读取与 Scene、Timeline 同一 Revision 的 StoryDocument。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const state = application.readProject(projectIdFrom(project_id));
    return asText({ revision: state.revision.number, story: state.snapshot.story });
  } catch (error) { return asError(error); }
});

server.registerTool("manage_story", {
  title: "管理 Story",
  description: "原子更新 Story 标题、摘要或 Beat；不会直接改写 Timeline。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    title: z.string().max(160).optional(),
    summary: z.string().max(2_000).optional(),
    beats: z.array(z.object({ id: z.string().optional(), title: z.string().max(160), purpose: z.string().max(800), semantic_unit_ids: z.array(z.string()).optional(), scene_ids: z.array(z.string()).optional() })).max(40).optional()
  }
}, async (input) => {
  try {
    return asText(application.updateStory({
      projectId: projectIdFrom(input.project_id),
      baseRevision: input.base_revision_id,
      title: input.title,
      summary: input.summary,
      beats: input.beats?.map((beat) => ({ id: beat.id, title: beat.title, purpose: beat.purpose, semanticUnitIds: beat.semantic_unit_ids, sceneIds: beat.scene_ids }))
    }));
  } catch (error) { return asError(error); }
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
  description: "复制本地媒体到受管项目目录并创建媒体分析任务；可同时登记 A/B-roll 角色、来源和版权状态。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    file_path: z.string().min(1),
    role: assetRoleSchema.optional(),
    tags: z.array(z.string().min(1).max(80)).max(30).optional(),
    provenance: assetProvenanceSchema.optional()
  }
}, async ({ project_id, base_revision_id, file_path, role, tags, provenance }) => {
  try {
    return asText(await importLocalMedia(projectIdFrom(project_id), base_revision_id, file_path, {
      role,
      tags,
      provenance: provenanceFromMcp(provenance)
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("update_asset_metadata", {
  title: "标注素材角色与来源",
  description: "为已导入素材记录叙事角色、标签、来源、授权和署名；不改变媒体文件或分析任务。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    asset_id: z.string().min(1),
    role: assetRoleSchema.optional(),
    tags: z.array(z.string().min(1).max(80)).max(30).optional(),
    provenance: assetProvenanceSchema.optional()
  }
}, async ({ project_id, base_revision_id, asset_id, role, tags, provenance }) => {
  try {
    const normalizedProvenance = provenanceFromMcp(provenance);
    return asText(application.updateAssetEditorialMetadata({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id,
      assetId: asset_id,
      role,
      tags,
      provenance: normalizedProvenance ? { ...normalizedProvenance, acquiredAt: new Date().toISOString() } : undefined
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("submit_transcription", {
  title: "提交 FunASR 转写",
  description: "使用动态读取 Schema 的 ComfyUI Bridge 工作流提交音频转写。",
  inputSchema: { project_id: z.string().optional(), asset_id: z.string().min(1), idempotency_key: z.string().optional() }
}, async ({ project_id, asset_id, idempotency_key }) => {
  try { return asText(application.submitTranscription({ projectId: projectIdFrom(project_id), assetId: asset_id, idempotencyKey: idempotency_key })); } catch (error) { return asError(error); }
});

server.registerTool("apply_manual_transcript", {
  title: "写入人工校正转写",
  description: "在 FunASR 不可用、结果需要修正或用户提供文稿时，基于明确 Revision 写入全文和候选句；不会伪造词级时间。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    asset_id: z.string().min(1),
    text: z.string().trim().min(1).max(20_000)
  }
}, async ({ project_id, base_revision_id, asset_id, text }) => {
  try {
    return asText(application.applyTranscript({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id,
      assetId: asset_id,
      text,
      source: "manual"
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("read_script", {
  title: "读取最终 Script",
  description: "读取转写候选、经语义判断的 SemanticUnit、最终 Script 和 SpeechSegment；不把标点候选伪装成语义或词级时序。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText({ transcriptSentenceCandidates: snapshot.transcriptSentenceCandidates, semanticUnits: snapshot.semanticUnits, script: snapshot.script, speechSegments: snapshot.speechSegments });
  } catch (error) { return asError(error); }
});

server.registerTool("apply_semantic_units", {
  title: "应用语义单元判断",
  description: "由 semantic-continuity 根据上下文将转写候选编译为完整 SemanticUnit，并明确停顿理由；这一步才会生成 SpeechSegment。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    units: z.array(z.object({
      candidate_ids: z.array(z.string()).min(1),
      text: z.string().min(1).max(2_000),
      kind: z.enum(["statement", "question", "answer", "cause", "conclusion", "contrast", "list_item", "setup", "payoff", "retake", "intentional_repetition"]),
      dependencies: z.array(z.string()).optional(),
      preceding_context: z.string().max(2_000).optional(),
      following_context: z.string().max(2_000).optional(),
      retake_group_id: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      pause_before: z.object({ duration_ms: z.number().int().min(0).max(10_000), reason: z.enum(["sentence", "contrast", "emotion", "breath", "chapter"]) }).optional()
    })).max(200)
  }
}, async (input) => {
  try {
    return asText(application.applySemanticUnits({
      projectId: projectIdFrom(input.project_id),
      baseRevision: input.base_revision_id,
      units: input.units.map((unit) => ({
        candidateIds: unit.candidate_ids,
        text: unit.text,
        kind: unit.kind,
        dependencies: unit.dependencies,
        precedingContext: unit.preceding_context,
        followingContext: unit.following_context,
        retakeGroupId: unit.retake_group_id,
        confidence: unit.confidence,
        pauseBefore: unit.pause_before ? { durationMs: unit.pause_before.duration_ms, reason: unit.pause_before.reason } : undefined
      }))
    }));
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
      voiceReferences: snapshot.voiceReferences,
      speechSegments: snapshot.speechSegments,
      speechSegmentAssets: snapshot.speechSegmentAssets,
      speechAsset: snapshot.speechAsset
    });
  } catch (error) { return asError(error); }
});

server.registerTool("manage_voice_references", {
  title: "登记 VoiceReference",
  description: "将已就绪本地音频 Asset 作为 VoiceReference 登记；不会创建远端 Voice ID。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    asset_id: z.string().min(1),
    label: z.string().max(160).optional(),
    authorization_note: z.string().max(500).optional(),
    usage_note: z.string().max(500).optional()
  }
}, async ({ project_id, base_revision_id, asset_id, label, authorization_note, usage_note }) => {
  try {
    return asText(application.registerVoiceReference({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id,
      assetId: asset_id,
      label,
      authorizationNote: authorization_note,
      usageNote: usage_note
    }));
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

server.registerTool("rebuild_speech_timeline", {
  title: "修复 SpeechAsset 时间线",
  description: "为旧 Revision 将已就绪 SpeechAsset 重新写入 Dialogue 轨并恢复稳定字幕；不重新调用 OmniVoice。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive() }
}, async ({ project_id, base_revision_id }) => {
  try {
    return asText(application.rebuildSpeechAssetTimeline({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("submit_voice_synthesis", {
  title: "提交段级声音合成",
  description: "用已登记的本地 VoiceReference 加当前 SpeechSegment 文本调用 OmniVoice；返回可跟踪 Job。",
  inputSchema: {
    project_id: z.string().optional(),
    voice_reference_id: z.string().min(1).optional(),
    voice_reference_asset_id: z.string().min(1).optional(),
    speech_segment_ids: z.array(z.string()).optional(),
    idempotency_key: z.string().optional()
  }
}, async ({ project_id, voice_reference_id, voice_reference_asset_id, speech_segment_ids, idempotency_key }) => {
  try {
    return asText(application.submitVoiceSynthesis({
      projectId: projectIdFrom(project_id),
      voiceReferenceId: voice_reference_id,
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

server.registerTool("assemble_presenter_track", {
  title: "组装 Presenter A-roll",
  description: "仅将明确选择的已就绪视频拼接到 Actor / A-roll 轨；不会按素材数量猜测叙事 Scene。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), asset_ids: z.array(z.string()).min(1) }
}, async ({ project_id, base_revision_id, asset_ids }) => {
  try { return asText(application.assemblePresenterTrack({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, assetIds: asset_ids })); } catch (error) { return asError(error); }
});

server.registerTool("compile_presenter_scenes", {
  title: "编译 Presenter 叙事场景",
  description: "将已建立的 Story Beat、语义判断与视觉方案编译为 PresenterScene；每个 A-roll Item 都必须被明确的 Scene 覆盖。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    scenes: z.array(z.object({
      title: z.string().min(1).max(160),
      purpose: z.string().min(1).max(800),
      start_frame: z.number().int().min(0),
      end_frame: z.number().int().positive(),
      narrative_beat_ids: z.array(z.string()).optional(),
      style_pack_id: z.string().max(160).optional()
    })).min(1).max(80)
  }
}, async (input) => {
  try {
    return asText(application.compilePresenterScenes({
      projectId: projectIdFrom(input.project_id),
      baseRevision: input.base_revision_id,
      scenes: input.scenes.map((scene) => ({
        title: scene.title,
        purpose: scene.purpose,
        startFrame: scene.start_frame,
        endFrame: scene.end_frame,
        narrativeBeatIds: scene.narrative_beat_ids,
        stylePackId: scene.style_pack_id
      }))
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("create_presenter_timeline", {
  title: "兼容创建 Presenter 主线",
  description: "旧客户端兼容入口：会按素材数量临时分组。正式创作请依次使用 assemble_presenter_track 与 compile_presenter_scenes。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive(), asset_ids: z.array(z.string()).min(1), scene_size: z.number().int().min(1).max(8).optional() }
}, async ({ project_id, base_revision_id, asset_ids, scene_size }) => {
  try { return asText(application.buildPresenterTimeline({ projectId: projectIdFrom(project_id), baseRevision: base_revision_id, assetIds: asset_ids, sceneSize: scene_size })); } catch (error) { return asError(error); }
});

server.registerTool("align_presenter_to_speech", {
  title: "按旁白收齐 Presenter 主线",
  description: "将未被 direct_override 保护的 Presenter 主画面裁短到当前 SpeechAsset；遇到缺画面或既有 Cue 时明确拒绝自动改写。",
  inputSchema: { project_id: z.string().optional(), base_revision_id: z.number().int().positive() }
}, async ({ project_id, base_revision_id }) => {
  try {
    return asText(application.alignPresenterToSpeech({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("read_actor_performances", {
  title: "读取人物表演",
  description: "读取绑定 Timeline Item 的导入/生成型人物表演、Mask、声音所有权与版本关系。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const snapshot = application.readProject(projectIdFrom(project_id)).snapshot;
    return asText(snapshot.actorPerformances);
  } catch (error) { return asError(error); }
});

server.registerTool("manage_actor_performance", {
  title: "登记人物表演与 Mask",
  description: "将 Actor / A-roll Item 绑定为人物表演，并明确原声、Dialogue 或静音的声音所有权；无 Mask 时显式使用前景降级。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    timeline_item_id: z.string().min(1),
    source: z.enum(["imported", "generated"]),
    mask_mode: z.enum(["alpha_asset", "embedded_alpha", "none"]),
    audio_mode: z.enum(["use_source_audio", "use_dialogue_track", "muted"]).optional(),
    mask_asset_id: z.string().optional(),
    speech_asset_id: z.string().optional(),
    note: z.string().max(500).optional()
  }
}, async (input) => {
  try {
    return asText(application.registerActorPerformance({
      projectId: projectIdFrom(input.project_id),
      baseRevision: input.base_revision_id,
      timelineItemId: input.timeline_item_id,
      source: input.source,
      maskMode: input.mask_mode,
      audioMode: input.audio_mode,
      maskAssetId: input.mask_asset_id,
      speechAssetId: input.speech_asset_id,
      note: input.note
    }));
  } catch (error) { return asError(error); }
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
  description: "创建带叙事目的、语义锚点、真实素材绑定和运动参数的 EffectCue，并强制其位于所属 Scene 内。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive(),
    scene_id: z.string(),
    type: z.enum(["MetricBackdrop", "ProductFan", "GlowCTA", "PortfolioWall", "CommentCloud", "EvidenceCard", "CameraPunch", "FullScreenMeme", "DeviceShowcase", "ContentCarousel", "EndCard"]),
    layer: z.enum(["rear", "actor", "front", "fullscreen"]),
    start_frame: z.number().int().nonnegative(),
    end_frame: z.number().int().positive(),
    anchor_target_id: z.string().optional(),
    note: z.string().optional(),
    narrative_purpose: z.string().max(800).optional(),
    audience_task: z.string().max(800).optional(),
    semantic_anchor: z.object({ type: z.enum(["speech_segment", "narrative_beat", "scene", "absolute"]), target_id: z.string().optional(), relation: z.enum(["anticipate", "land_on", "react_after", "hold_through"]) }).optional(),
    spatial_anchor: z.enum(["top_left", "top_right", "middle_left", "middle_right", "bottom_left", "bottom_right", "center", "full_frame"]).optional(),
    asset_bindings: z.array(z.object({ slot: z.string().min(1).max(80), asset_id: z.string().min(1) })).max(12).optional(),
    props: z.record(z.unknown()).optional(),
    motion: z.object({ enter_preset: z.string().max(80).optional(), settle_preset: z.string().max(80).optional(), exit_preset: z.string().max(80).optional(), enter_frames: z.number().int().min(1).max(240).optional(), hold_frames: z.number().int().min(0).max(10_000).optional(), exit_frames: z.number().int().min(1).max(240).optional() }).optional(),
    style_pack_id: z.string().max(160).optional(),
    // 不接受无执行语义的自由文本；具体的创作理由请写入 note / narrative_purpose。
    quality_rules: z.array(z.enum(EFFECT_QUALITY_RULES)).max(EFFECT_QUALITY_RULES.length).optional()
  }
}, async (input) => {
  try {
    return asText(application.createEffectCue({
      projectId: projectIdFrom(input.project_id), baseRevision: input.base_revision_id, sceneId: input.scene_id,
      type: input.type, layer: input.layer, startFrame: input.start_frame, endFrame: input.end_frame,
      anchorTargetId: input.anchor_target_id,
      note: input.note,
      narrativePurpose: input.narrative_purpose,
      audienceTask: input.audience_task,
      semanticAnchor: input.semantic_anchor ? { type: input.semantic_anchor.type, targetId: input.semantic_anchor.target_id, relation: input.semantic_anchor.relation } : undefined,
      spatialAnchor: input.spatial_anchor,
      assetBindings: input.asset_bindings?.map((binding) => ({ slot: binding.slot, assetId: binding.asset_id })),
      props: input.props,
      motion: input.motion ? {
        enterPreset: input.motion.enter_preset,
        settlePreset: input.motion.settle_preset,
        exitPreset: input.motion.exit_preset,
        enterFrames: input.motion.enter_frames,
        holdFrames: input.motion.hold_frames,
        exitFrames: input.motion.exit_frames
      } : undefined,
      stylePackId: input.style_pack_id,
      qualityRules: input.quality_rules
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

server.registerTool("start_production_run", {
  title: "开始 ProductionRun",
  description: "为本次 Skill 驱动的剪辑创建最小审计报告；报告保存在项目 reports 目录，不复制 Project Snapshot。",
  inputSchema: {
    project_id: z.string().optional(),
    base_revision_id: z.number().int().positive().optional(),
    loaded_skills: z.array(z.string().min(1)).min(1).max(40),
    loaded_references: z.array(z.string().min(1)).max(120).optional()
  }
}, async ({ project_id, base_revision_id, loaded_skills, loaded_references }) => {
  try {
    return asText(await application.startProductionRun({
      projectId: projectIdFrom(project_id),
      baseRevision: base_revision_id,
      loadedSkills: loaded_skills,
      loadedReferences: loaded_references
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("record_creative_decision", {
  title: "记录创作判断",
  description: "把已加载 Skill 的创作决定、依据、安静区、效果取舍或预览证据写入当前 ProductionRun。",
  inputSchema: {
    project_id: z.string().optional(),
    run_id: z.string().min(1),
    category: z.enum(["story", "semantic", "scene", "visual", "audio", "quality"]),
    decision: z.string().min(1).max(2_000),
    rationale: z.string().min(1).max(4_000),
    object_ids: z.array(z.string()).max(80).optional(),
    evidence: z.array(z.string().max(1_000)).max(80).optional(),
    alternatives: z.array(z.string().max(1_000)).max(20).optional(),
    quiet_range: z.object({ start_frame: z.number().int().min(0), end_frame: z.number().int().positive(), reason: z.string().min(1).max(800) }).optional(),
    effect_decision: z.string().max(2_000).optional(),
    rejected_alternative: z.string().max(2_000).optional(),
    mcp_command: z.string().max(160).optional(),
    preview_evidence: z.string().max(2_000).optional(),
    quality_review: z.string().max(2_000).optional()
  }
}, async (input) => {
  try {
    return asText(await application.recordCreativeDecision({
      projectId: projectIdFrom(input.project_id),
      runId: input.run_id,
      category: input.category,
      decision: input.decision,
      rationale: input.rationale,
      objectIds: input.object_ids,
      evidence: input.evidence,
      alternatives: input.alternatives,
      quietRange: input.quiet_range ? { startFrame: input.quiet_range.start_frame, endFrame: input.quiet_range.end_frame, reason: input.quiet_range.reason } : undefined,
      effectDecision: input.effect_decision,
      rejectedAlternative: input.rejected_alternative,
      mcpCommand: input.mcp_command,
      previewEvidence: input.preview_evidence,
      qualityReview: input.quality_review
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("record_editorial_quality_review", {
  title: "记录真实审片结论",
  description: "把四轮审片、模式专项、预览证据和可定位问题写入当前 ProductionRun；不会自动生成审美结论。",
  inputSchema: {
    project_id: z.string().optional(),
    run_id: z.string().min(1),
    revision: z.number().int().positive(),
    passes: z.array(z.enum(["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"])).min(5).max(5),
    preview_evidence: z.array(z.string().min(1).max(2_000)).min(1).max(40),
    findings: z.array(z.object({
      pass: z.enum(["audio_only", "mute_visual", "audiovisual", "first_viewer", "mode_specific"]),
      severity: z.enum(["blocking", "warning", "major", "minor", "suggestion", "inconclusive"]),
      category: z.enum(["semantic", "pacing", "attention", "motion", "typography", "audio", "mode_specific"]),
      summary: z.string().min(1).max(2_000),
      evidence: z.string().min(1).max(2_000),
      impact: z.string().min(1).max(2_000),
      suggested_fix: z.string().max(2_000).optional(),
      verification_method: z.string().max(2_000).optional(),
      object_id: z.string().optional(),
      frame_range: z.object({ start_frame: z.number().int().min(0), end_frame: z.number().int().positive() }).optional()
    })).max(120)
  }
}, async (input) => {
  try {
    return asText(await application.recordEditorialQualityReview({
      projectId: projectIdFrom(input.project_id),
      runId: input.run_id,
      revision: input.revision,
      passes: input.passes,
      previewEvidence: input.preview_evidence,
      findings: input.findings.map((finding) => ({
        pass: finding.pass,
        severity: finding.severity,
        category: finding.category,
        summary: finding.summary,
        evidence: finding.evidence,
        impact: finding.impact,
        suggestedFix: finding.suggested_fix,
        verificationMethod: finding.verification_method,
        objectId: finding.object_id,
        frameRange: finding.frame_range ? { startFrame: finding.frame_range.start_frame, endFrame: finding.frame_range.end_frame } : undefined
      }))
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("complete_production_run", {
  title: "完成 ProductionRun",
  description: "固定本次创作审计对应的最终 Revision，并补充已看过的预览和质量复核证据。",
  inputSchema: {
    project_id: z.string().optional(),
    run_id: z.string().min(1),
    final_revision: z.number().int().positive().optional(),
    quality_review: z.array(z.string().max(2_000)).max(40).optional(),
    preview_evidence: z.array(z.string().max(2_000)).max(40).optional()
  }
}, async ({ project_id, run_id, final_revision, quality_review, preview_evidence }) => {
  try {
    return asText(await application.completeProductionRun({
      projectId: projectIdFrom(project_id),
      runId: run_id,
      finalRevision: final_revision,
      qualityReview: quality_review,
      previewEvidence: preview_evidence
    }));
  } catch (error) { return asError(error); }
});

server.registerTool("read_skill_execution_report", {
  title: "读取 SkillExecutionReport",
  description: "读取某次 ProductionRun 的 Skills、创作判断、MCP 改动与预览/质量证据。",
  inputSchema: { project_id: z.string().optional(), run_id: z.string().min(1) },
  annotations: { readOnlyHint: true }
}, async ({ project_id, run_id }) => {
  try { return asText(await application.readSkillExecutionReport({ projectId: projectIdFrom(project_id), runId: run_id })); } catch (error) { return asError(error); }
});

server.registerTool("validate_project_graph", {
  title: "验证项目对象图",
  description: "检查 Story、Scene、Item、Cue、Caption、Speech 与人物表演是否存在悬空引用；不会修改项目。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const state = application.readProject(projectIdFrom(project_id));
    const report = evaluateQuality(state.snapshot, state.revision.number);
    return asText({ valid: !report.issues.some((entry) => entry.code === "PROJECT_GRAPH_INVALID"), issues: report.issues.filter((entry) => entry.code === "PROJECT_GRAPH_INVALID") });
  } catch (error) { return asError(error); }
});

server.registerTool("read_quality_report", {
  title: "读取质量报告",
  description: "执行技术检查，并合并同一 Revision 已记录的真实审片结论；不会把未审片伪装成通过。",
  inputSchema: { project_id: z.string().optional() },
  annotations: { readOnlyHint: true }
}, async ({ project_id }) => {
  try {
    const projectId = projectIdFrom(project_id);
    const state = application.readProject(projectId);
    const editorialReview = await application.readEditorialQualityReview({ projectId, revision: state.revision.number });
    return asText(evaluateQuality(state.snapshot, state.revision.number, editorialReview));
  } catch (error) { return asError(error); }
});

server.registerTool("render_preview_range", {
  title: "渲染局部预览",
  description: "固定指定 Revision 与帧范围，提交可追踪的 Remotion 局部预览任务。",
  inputSchema: {
    project_id: z.string().optional(),
    revision: z.number().int().positive().optional(),
    from_frame: z.number().int().nonnegative().optional(),
    to_frame: z.number().int().positive().optional(),
    idempotency_key: z.string().optional()
  }
}, async ({ project_id, revision, from_frame, to_frame, idempotency_key }) => {
  try { return asText(application.submitPreview({ projectId: projectIdFrom(project_id), revision, fromFrame: from_frame, toFrame: to_frame, idempotencyKey: idempotency_key })); } catch (error) { return asError(error); }
});

server.registerTool("inspect_composed_frames", {
  title: "检查真实合成帧",
  description: "从已完成的 Remotion 局部预览抽取进入、稳定、退出等关键帧；不会重新渲染或修改项目。",
  inputSchema: {
    project_id: z.string().optional(),
    preview_job_id: z.string().min(1),
    frames: z.array(z.number().int().nonnegative()).min(1).max(12).optional()
  },
  annotations: { readOnlyHint: true }
}, async ({ project_id, preview_job_id, frames }) => {
  try {
    const projectId = projectIdFrom(project_id);
    const job = application.trackJob(preview_job_id);
    if (job.projectId !== projectId || job.kind !== "preview") throw new DomainError("该任务不是当前项目的局部预览", "PREVIEW_JOB_NOT_FOUND");
    if (job.status !== "succeeded" || !job.result) throw new DomainError("局部预览尚未成功，不能检查合成帧", "PREVIEW_NOT_READY");
    const revision = Number(job.result.revision ?? job.payload.revision);
    const fromFrame = Number(job.result.fromFrame ?? job.payload.fromFrame);
    const toFrame = Number(job.result.toFrame ?? job.payload.toFrame);
    const previewPath = typeof job.result.path === "string" ? job.result.path : "";
    const state = application.readProject(projectId);
    const targetRevision = application.repository.getRevision(projectId, revision);
    const artifacts = await inspectComposedFrames({
      projectRoot: targetRevision.snapshot.project.rootPath,
      previewPath,
      revision,
      fromFrame,
      toFrame,
      fps: targetRevision.snapshot.timeline.fps,
      frames
    });
    await application.recordPreviewInspection({
      projectId,
      previewJobId: job.id,
      revision,
      frames: artifacts.map((artifact) => ({ frame: artifact.frame, relativePath: artifact.relativePath }))
    });
    return asText({ revision, sourcePreviewJobId: job.id, currentRevision: state.revision.number, frames: artifacts });
  } catch (error) { return asError(error); }
});

server.registerTool("submit_export", {
  title: "提交导出",
  description: "提交 draft 或 delivery 导出。draft 可用于内部审片；delivery 必须有目标 Revision 的完整真实审片与 Preview 证据，且 Remotion 失败绝不静默交付仅主轨文件。",
  inputSchema: { project_id: z.string().optional(), revision: z.number().int().positive().optional(), purpose: z.enum(["draft", "delivery"]).optional(), idempotency_key: z.string().optional() }
}, async ({ project_id, revision, purpose, idempotency_key }) => {
  try { return asText(application.submitExport({ projectId: projectIdFrom(project_id), revision, purpose, idempotencyKey: idempotency_key })); } catch (error) { return asError(error); }
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
