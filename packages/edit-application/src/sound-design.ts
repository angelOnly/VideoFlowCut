import { z } from "zod";
import type { AudioCue, ProjectSnapshot, SoundPlan, ImpactReport } from "@videocut/contracts";
import { createId, DomainError, now } from "@videocut/domain";
import type { EditingApplication } from "./index.js";
import { assetRequestVersion, digest } from "../../media-intelligence/src/index.js";
import { soundDependencySignature } from "../../media-intelligence/src/sound-signature.js";

export const audioRoleSchema = z.enum(["narration", "source_speech", "demonstration", "sfx", "ambience", "music"]);
export const soundRequirementSchema = z.object({
  soundPlanId: z.string().min(1), soundIntentId: z.string().min(1), material: z.string().max(500).optional(),
  attack: z.string().max(500).optional(), tail: z.string().max(500).optional(), energy: z.string().max(200).optional(),
  excludeSpeech: z.boolean().default(true), excludeMusic: z.boolean().default(true), maxDurationMs: z.number().int().positive().optional()
}).strict();
export const soundPlanInputSchema = z.object({
  action: z.enum(["create", "update", "remove"]), soundPlanId: z.string().min(1).optional(),
  startFrame: z.number().int().nonnegative().optional(), endFrame: z.number().int().positive().optional(),
  narrationDirection: z.string().trim().min(1).max(2000).optional(), dominantRole: audioRoleSchema.optional(), musicDirection: z.string().trim().min(1).max(2000).optional(),
  intents: z.array(z.object({ id: z.string().min(1).max(160), function: z.enum(["anticipation", "settle", "reaction", "connection", "ambience", "music", "silence", "demonstration"]), brief: z.string().trim().min(1).max(1600), requestId: z.string().optional(), motionEventId: z.string().optional() }).strict()).max(30).optional(),
  dominantRanges: z.array(z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(), role: audioRoleSchema, reason: z.string().trim().min(8).max(800) }).strict()).max(40).optional()
}).strict();
export const audioDesignSchema = z.object({
  soundPlanId: z.string().min(1).optional(), soundIntentId: z.string().min(1).optional(), planVersion: z.number().int().positive().optional(),
  role: audioRoleSchema.optional(), adoptionId: z.string().min(1).optional(),
  durationFrames: z.number().int().positive().max(108000).optional(),
  envelope: z.array(z.object({ frame: z.number().int().nonnegative(), gainDb: z.number().min(-80).max(12) }).strict()).max(100).optional(),
  loopCrossfadeFrames: z.number().int().min(0).max(300).optional(),
  loopReview: z.object({ status: z.enum(["confirmed", "inconclusive"]), note: z.string().min(16).max(2400) }).strict().optional()
}).strict();
export type AudioDesignInput = z.infer<typeof audioDesignSchema>;

export function applyAudioDesign(snapshot: ProjectSnapshot, cue: AudioCue, input: AudioDesignInput) {
  const parsed = audioDesignSchema.parse(input);
  const item = snapshot.timeline.items.find((item) => item.id === cue.timelineItemId)!;
  const duration = item.endFrame - item.startFrame;
  if (cue.effectEvent?.endLocalFrame !== undefined) {
    const effect = snapshot.effectCues.find((entry) => entry.id === cue.effectEvent!.effectCueId)!;
    if (item.endFrame !== effect.startFrame + cue.effectEvent.endLocalFrame + cue.effectEvent.syncOffsetFrames) throw new DomainError("持续声终点必须与绑定动作范围一致", "SOUND_EVENT_DURATION_MISMATCH");
  }
  const role = parsed.role ?? cue.role ?? (cue.kind === "bgm" ? "music" : "sfx");
  if (cue.kind === "bgm" && role !== "music") throw new DomainError("音乐 Cue 必须使用音乐角色", "SOUND_ROLE_MISMATCH");
  cue.role = role;
  const planId = parsed.soundPlanId ?? cue.soundPlanId, intentId = parsed.soundIntentId ?? cue.soundIntentId;
  if (planId || intentId) {
    const plan = snapshot.soundPlans?.find((entry) => entry.id === planId);
    if (!plan || plan.status !== "current" || !plan.intents.some((entry) => entry.id === intentId) || (parsed.planVersion ?? cue.planVersion) !== plan.version) throw new DomainError("声音意图或计划版本已变化，请重新读取段落计划", "SOUND_PLAN_STALE");
    if (item.endFrame <= plan.startFrame || item.startFrame >= plan.endFrame) throw new DomainError("声音不在所属段落附近", "SOUND_PLAN_RANGE_MISMATCH");
    if (snapshot.audioCues.some((entry) => entry.id !== cue.id && entry.status === "ready" && entry.soundPlanId === planId && entry.soundIntentId === intentId)) throw new DomainError("该声音意图已有 Cue，请更新现有 Cue；分层应声明独立意图", "SOUND_INTENT_ALREADY_USED");
    cue.soundPlanId = planId; cue.soundIntentId = intentId; cue.planVersion = plan.version;
  }
  const envelope = parsed.envelope ?? cue.envelope;
  if (envelope?.some((point, index) => point.frame > duration || index > 0 && point.frame <= envelope[index - 1].frame)) throw new DomainError("音量包络需严格递增且在当前 Cue 局部范围内", "SOUND_ENVELOPE_INVALID");
  cue.envelope = envelope;
  const crossfade = parsed.loopCrossfadeFrames ?? cue.loopCrossfadeFrames ?? 0;
  if (crossfade && (!cue.loop || crossfade * 2 >= item.sourceEndFrame - item.sourceStartFrame)) throw new DomainError("循环交叉淡化必须小于源范围的一半", "SOUND_LOOP_INVALID");
  if (cue.loop && cue.kind === "sfx" && crossfade === 0) throw new DomainError("持续音效循环需要明确接缝交叉淡化", "SOUND_LOOP_CROSSFADE_REQUIRED");
  if (cue.loop && crossfade && Math.ceil(duration / (item.sourceEndFrame - item.sourceStartFrame - crossfade)) > 512) throw new DomainError("循环次数过多，请选择更长的原声音段", "SOUND_LOOP_BUDGET_EXCEEDED");
  cue.loopCrossfadeFrames = crossfade;
  cue.loopReview = parsed.loopReview ?? cue.loopReview;
  const adoptionId = parsed.adoptionId ?? cue.adoptionId;
  const requirement = planId && intentId ? snapshot.assetRequests.find((entry) => entry.status !== "closed" && entry.sound?.soundPlanId === planId && entry.sound?.soundIntentId === intentId) : undefined;
  // 缺少采用依据可以先试听；交付由质量门禁拦住，显式传入的错误依据仍拒绝。
  if (requirement && adoptionId && snapshot.mediaAdoptions?.find((entry) => entry.id === adoptionId)?.requestId !== requirement.id) throw new DomainError("该声音意图需要与当前需求一致的原文件采用依据", "SOUND_ADOPTION_REQUIRED");
  if (adoptionId) {
    const adoption = snapshot.mediaAdoptions?.find((entry) => entry.id === adoptionId);
    const asset = snapshot.assets.find((entry) => entry.id === cue.assetId)!;
    const range = { startMs: item.sourceStartFrame * 1000 / snapshot.timeline.fps, endMs: item.sourceEndFrame * 1000 / snapshot.timeline.fps };
    if (!adoption || adoption.status !== "current" || adoption.assetId !== cue.assetId || adoption.sourceHash !== asset.sourceHash || !adoption.range || adoption.audioPolicy !== "retain" || range.startMs < adoption.range.startMs - 1 || range.endMs > adoption.range.endMs + 1) throw new DomainError("声音采用依据未覆盖当前原文件源范围", "SOUND_ADOPTION_STALE");
    cue.adoptionId = adoptionId;
  }
  cue.mixReview = "needs_review";
}

export function manageSoundPlan(app: EditingApplication, projectId: string, baseRevision: number, value: z.infer<typeof soundPlanInputSchema>) {
  const input = soundPlanInputSchema.parse(value);
  const state = app.repository.commit(projectId, baseRevision, "更新段落声音设计", (snapshot, impact) => {
    const existing = snapshot.soundPlans?.find((plan) => plan.id === input.soundPlanId);
    if (input.action !== "create" && !existing) throw new DomainError("声音计划不存在", "SOUND_PLAN_NOT_FOUND");
    if (input.action === "remove") { snapshot.soundPlans = snapshot.soundPlans!.filter((plan) => plan.id !== existing!.id); impact.changed.push(existing!.id); return; }
    const plan = { ...existing, ...Object.fromEntries(Object.entries(input).filter(([key, value]) => value !== undefined && !["action", "soundPlanId"].includes(key))), id: existing?.id ?? createId("sound_plan"), version: (existing?.version ?? 0) + 1, status: "current", updatedAt: now() } as SoundPlan;
    if (!Number.isInteger(plan.startFrame) || !Number.isInteger(plan.endFrame) || plan.endFrame <= plan.startFrame || !plan.narrationDirection || !plan.musicDirection || !plan.dominantRole || !Array.isArray(plan.intents)) throw new DomainError("计划需要完整范围、旁白意图、主声音、音乐设计和声音意图", "SOUND_PLAN_INCOMPLETE");
    if (new Set(plan.intents.map((entry) => entry.id)).size !== plan.intents.length || plan.dominantRanges?.some((range) => range.startFrame < plan.startFrame || range.endFrame > plan.endFrame || range.startFrame >= range.endFrame)) throw new DomainError("声音意图重复或主导范围越界", "SOUND_PLAN_RANGE_INVALID");
    snapshot.soundPlans ??= [];
    if (existing) snapshot.soundPlans[snapshot.soundPlans.indexOf(existing)] = plan; else snapshot.soundPlans.push(plan);
    impact.changed.push(plan.id); impact.dirtyRanges.push({ startFrame: plan.startFrame, endFrame: plan.endFrame, reason: "段落声音设计已更新" });
  });
  app.publish({ projectId, revision: state.revision.number, type: "revision" });
  return state;
}

/** 只传播有实际依赖的失效，普通音量修改不能恢复已过期选择。 */
export function reconcileSoundDesign(previous: ProjectSnapshot, snapshot: ProjectSnapshot, impact: ImpactReport) {
  for (const adoption of snapshot.mediaAdoptions ?? []) {
    const asset = snapshot.assets.find((entry) => entry.id === adoption.assetId);
    const request = snapshot.assetRequests.find((entry) => entry.id === adoption.requestId);
    if (!asset || asset.sourceHash !== adoption.sourceHash || adoption.requestId && (!request || assetRequestVersion(request) !== adoption.requestVersion)) { adoption.status = "needs_review"; adoption.reviewReason = "原文件或需求版本已变化"; impact.stale.push(adoption.id); }
  }
  const contextChanged = soundDependencySignature(previous) !== soundDependencySignature(snapshot);
  for (const cue of snapshot.audioCues) {
    const plan = snapshot.soundPlans?.find((entry) => entry.id === cue.soundPlanId);
    const adoption = snapshot.mediaAdoptions?.find((entry) => entry.id === cue.adoptionId);
    if (cue.soundPlanId && (!plan || plan.version !== cue.planVersion || !plan.intents.some((entry) => entry.id === cue.soundIntentId)) || cue.adoptionId && adoption?.status !== "current") {
      cue.mixReview = "needs_review"; impact.stale.push(cue.id);
      if (cue.soundPlanId && (!plan || !plan.intents.some((entry) => entry.id === cue.soundIntentId))) { cue.status = "stale"; const item = snapshot.timeline.items.find((entry) => entry.id === cue.timelineItemId); if (item) item.disabled = true; }
    }
    const before = previous.audioCues.find((entry) => entry.id === cue.id);
    const beforeAsset = previous.assets.find((entry) => entry.id === before?.assetId), asset = snapshot.assets.find((entry) => entry.id === cue.assetId);
    if (before && beforeAsset?.sourceHash !== asset?.sourceHash) {
      cue.onsetReview = { status: "inconclusive", note: "源文件内容已变化，原可听起音需要重新复核", recordedAt: now() };
      cue.loopReview = undefined;
    }
    if (contextChanged && before) cue.mixReview = "needs_review";
  }
}
