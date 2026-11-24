import { createHash, randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type { ProductionAssignment, ProductionCoordinationIssue, ProductionUnitDraft, ProductionUnitHandoffEvent, ProjectSnapshot, SkillExecutionReport } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import type { ProductionUnitHandoffInput } from "../../contracts/src/production-unit-handoff.js";
import { missingReviewRanges } from "../../quality-system/src/editorial-review.js";
import type { ReferenceManifest, ReferenceScene } from "./opendesign-reference-package.mjs";
import { visualScopeSceneIds } from "./visual-design-revisions.js";

type Scene = ProjectSnapshot["scenes"][number];
type Responsibility = "creative_research" | "visual_design" | "motion_research";

function invalid(message: string): never {
  throw new DomainError(message, "PRODUCTION_UNIT_HANDOFF_INVALID");
}

function assignmentCoversUnit(assignment: ProductionAssignment, snapshot: ProjectSnapshot, scene: Scene,
  range: { startFrame: number; endFrame: number }): boolean {
  const scope = assignment.scope;
  if (scope.kind === "project") return true;
  if (scope.kind === "frames") return range.startFrame >= scope.startFrame && range.endFrame <= scope.endFrame;
  if (scope.kind === "beats") return scope.beatIds.some(id => scene.narrativeBeatIds.includes(id));
  return visualScopeSceneIds(snapshot, scope.objectIds).includes(scene.id);
}

export function unitHandoffOwners(report: SkillExecutionReport, snapshot: ProjectSnapshot, scene: Scene,
  range: { startFrame: number; endFrame: number }, role: Responsibility) {
  const covering = report.assignments.filter(item => item.responsibilities.includes(role) && assignmentCoversUnit(item, snapshot, scene, range));
  return covering.filter(item => !covering.some(next => next.supersedesAssignmentId === item.assignmentId));
}

export function unitDraftMatchesSnapshot(draft: ProductionUnitDraft, snapshot: ProjectSnapshot): boolean {
  const scene = snapshot.scenes.find(item => item.id === draft.sceneId);
  return !!scene && draft.startFrame >= scene.startFrame && draft.endFrame <= scene.endFrame
    && draft.assets.every(source => snapshot.assets.some(asset => asset.id === source.assetId
      && asset.status === "ready" && asset.sourceHash === source.sourceHash));
}

export function readUnitHandoffs(report: SkillExecutionReport, snapshot: ProjectSnapshot, scenes: readonly Scene[]) {
  return scenes.flatMap((scene): ReturnType<typeof readUnitHandoff>[] => {
    const drafts = new Map<string, ProductionUnitDraft>();
    for (const event of report.unitHandoffs ?? []) {
      if (event.action === "submit_draft" && event.draft.sceneId === scene.id) drafts.set(event.draft.unitId, event.draft);
    }
    if (!drafts.size) return [readUnitHandoff(report, snapshot, scene)];
    return [...drafts.values()].map(draft => readUnitHandoff(report, snapshot, scene, draft.unitId));
  });
}

export function readUnitHandoff(report: SkillExecutionReport, snapshot: ProjectSnapshot, scene: Scene, unitId?: string) {
  const events = [...(report.unitHandoffs ?? [])].reverse();
  const submission = events.find(item => item.action === "submit_draft"
    && item.draft.sceneId === scene.id && item.draft.unitId === unitId);
  const draft = submission?.action === "submit_draft" ? submission.draft : undefined;
  const response = draft && events.find(item => item.action !== "submit_draft" && item.draftId === draft.id);
  const creative = unitHandoffOwners(report, snapshot, scene, draft ?? scene, "creative_research");
  const visual = unitHandoffOwners(report, snapshot, scene, draft ?? scene, "visual_design");
  const base = { sceneId: scene.id, unitId, draft };
  if (!draft) return { ...base, status: "waiting_for_draft" as const, assignmentId: creative[0]?.assignmentId, gap: undefined,
    nextAction: "读取选段和实际素材，续接创意作者完成本单元换料正文" };
  if (!unitDraftMatchesSnapshot(draft, snapshot) || !creative.some(owner => owner.assignmentId === draft.assignmentId)) {
    return { ...base, status: "waiting_for_draft" as const, assignmentId: creative[0]?.assignmentId,
      gap: "本场范围、素材或创意负责者已变化", nextAction: "按当前输入重新提交本单元换料正文" };
  }
  if (response?.action === "return_draft") return { ...base, status: "returned" as const,
    assignmentId: draft.assignmentId, gap: response.gap, sourceMs: response.sourceMs, impact: response.impact,
    nextAction: "续接创意作者补稿，需要时补材或重选原段，补完后重新交视觉试摆" };
  if (response?.action === "accept_draft" && visual.some(owner => owner.assignmentId === response.assignmentId)) {
    return { ...base, status: "accepted" as const, assignmentId: response.assignmentId, receipt: response,
      nextAction: "沿同版原稿完成正式视觉编排，将回执和试摆依据纳入本场制作包" };
  }
  return { ...base, status: "waiting_for_visual" as const, assignmentId: visual[0]?.assignmentId,
    nextAction: "将固定正文、原片和本片素材交视觉作者试摆" };
}

type DraftSubmission = Extract<ProductionUnitHandoffInput, { action: "submit_draft" }>;
type ObservedBeat = { startMs: number; endMs: number; observedRelation: string };
const slotPattern = /【([^【】\s]+)】/gu;

function inlineMarkdown(value: string): string {
  return value.replace(/[\r\n]+/gu, " ").replace(/[\\`*_{}[\]()<>|~&!]/gu, "\\$&");
}

function draftBeats(observations: ObservedBeat[], input: DraftSubmission): ObservedBeat[] {
  const { startMs, endMs } = input.reference;
  const beats = observations.filter(beat => beat.endMs > startMs && beat.startMs < endMs)
    .sort((a, b) => a.startMs - b.startMs);
  if (endMs <= startMs || beats.some(beat => beat.startMs < startMs || beat.endMs > endMs)
    || missingReviewRanges(beats.map(beat => ({ startFrame: beat.startMs, endFrame: beat.endMs })), startMs, endMs).length) {
    invalid("采用区间缺少完整覆盖的已登记原句；请按实际采用边界登记原片各拍");
  }
  return beats;
}

function checkReplacementNames(beats: ObservedBeat[], replacements: DraftSubmission["replacements"]) {
  const slots = new Map<string, number>();
  for (const beat of beats) {
    if (/[【】]/u.test(beat.observedRelation.replace(slotPattern, ""))) invalid(`原片 ${beat.startMs} 毫秒的替换标记格式无效，请使用【名称】`);
    for (const match of beat.observedRelation.matchAll(slotPattern)) {
      const name = match[1]!;
      if (!slots.has(name)) slots.set(name, beat.startMs);
    }
  }
  const names = new Set<string>();
  for (const { name } of replacements) {
    if (!slots.has(name)) invalid(`采用区间没有替换项【${name}】`);
    if (names.has(name)) invalid(`替换项【${name}】只能填写一次`);
    names.add(name);
  }
  for (const [name, startMs] of slots) {
    if (!names.has(name)) invalid(`原片 ${startMs} 毫秒缺少替换项【${name}】`);
  }
}

export async function buildUnitHandoffEvent(report: SkillExecutionReport, inputSnapshot: ProjectSnapshot,
  current: ProjectSnapshot, input: ProductionUnitHandoffInput, directory: string,
  hashFile: (path: string) => Promise<string>): Promise<ProductionUnitHandoffEvent> {
  const previous = input.action !== "submit_draft" ? report.unitHandoffs?.find(event =>
    event.action === "submit_draft" && event.draft.id === input.draftId) : undefined;
  const submitted = previous?.action === "submit_draft" ? previous.draft : undefined;
  const sceneId = input.action === "submit_draft" ? input.sceneId : submitted?.sceneId;
  const scene = current.scenes.find(item => item.id === sceneId);
  const inputScene = inputSnapshot.scenes.find(item => item.id === sceneId);
  const range = input.action === "submit_draft" ? input : submitted;
  if (!scene || !inputScene || !range || range.startFrame < scene.startFrame || range.endFrame > scene.endFrame
    || inputScene.startFrame !== scene.startFrame || inputScene.endFrame !== scene.endFrame || range.startFrame >= range.endFrame) {
    invalid("找不到该交件对应的当前场面与有效单元帧段");
  }
  const role = input.action === "submit_draft" ? "creative_research" : "visual_design";
  const assignment = unitHandoffOwners(report, current, scene, range, role).find(item => item.assignmentId === input.assignmentId);
  if (!assignment || input.inputRevision < (assignment.inputRevision ?? report.baseRevision)) invalid("本次交件与当前作者分派或输入版本不符");

  if (input.action === "submit_draft") {
    const creative = report.creativeDecisions.find(item => item.id === input.creativeDecisionId && item.phase === "creative_research");
    const referencePhase = input.reference.kind === "creative" ? "creative_research" : "motion_research";
    const reference = report.creativeDecisions.find(item => item.id === input.reference.researchDecisionId && item.phase === referencePhase);
    if (!creative || creative.assignmentId !== assignment.assignmentId || creative.researchOutcome === "not_applicable"
      || !visualScopeSceneIds(current, creative.objectIds).includes(scene.id) || !reference || reference.researchOutcome === "not_applicable"
      || !visualScopeSceneIds(current, reference.objectIds).includes(scene.id)
      || input.reference.kind === "creative" && reference.id !== creative.id
      || !unitHandoffOwners(report, current, scene, range, referencePhase).some(owner => owner.assignmentId === reference.assignmentId)) {
      invalid("所选原段缺少本单元可追溯的实际研究和原片范围");
    }
    const observations = (reference.researchReferences ?? []).flatMap(source => source.kind === input.reference.kind
      && source.id === input.reference.id && source.sourceSha256 === input.reference.sourceSha256
      && source.startMs !== undefined && source.endMs !== undefined && source.observedRelation?.trim()
      ? [{ startMs: source.startMs, endMs: source.endMs, observedRelation: source.observedRelation }] : []);
    const beats = draftBeats(observations, input);
    checkReplacementNames(beats, input.replacements);
    const values = new Map<string, string>();
    const assets: ProductionUnitDraft["assets"] = [];
    for (const replacement of input.replacements) {
      const { name } = replacement;
      if (replacement.kind === "text") {
        values.set(name, inlineMarkdown(replacement.text));
        continue;
      }
      const { assetId, sourceRange } = replacement;
      const asset = inputSnapshot.assets.find(item => item.id === assetId);
      const live = current.assets.find(item => item.id === assetId);
      if (!asset || !live || live.status !== "ready" || asset.status !== "ready" || !asset.sourceHash || live.sourceHash !== asset.sourceHash
        || !["image", "video", "actor_video"].includes(asset.kind)
        || !(await stat(resolve(current.project.rootPath, live.managedPath)).catch(() => undefined))?.isFile()) {
        invalid(`替换项【${name}】的素材 ${assetId} 未取得或已变化`);
      }
      if (asset.kind !== "image" && (!sourceRange || sourceRange.endMs <= sourceRange.startMs
        || asset.metadata?.durationMs !== undefined && sourceRange.endMs > asset.metadata.durationMs)
        || asset.kind === "image" && sourceRange) invalid(`替换项【${name}】的素材 ${assetId} 源段不成立`);
      assets.push({ assetId, sourceRange, sourceHash: asset.sourceHash });
      const segment = sourceRange ? `，源段 ${sourceRange.startMs}–${sourceRange.endMs} ms` : "";
      values.set(name, `${inlineMarkdown(asset.name)}（Asset ID \`${assetId}\`${segment}）`);
    }
    // 只替换标记，原句里的构图、排印和动作随原片时刻直接进入固定稿。
    const paragraphs = beats.map(beat => `**原片 ${beat.startMs}–${beat.endMs} ms**\n\n${beat.observedRelation.replace(slotPattern, (_, name: string) => values.get(name)!)}`);
    const body = `### 单元 ${input.unitId}\n\n${paragraphs.join("\n\n")}\n`;
    const id = `unit_draft_${randomUUID()}`;
    const path = join(directory, `${id}.md`);
    await mkdir(directory, { recursive: true });
    await writeFile(path, body, { encoding: "utf8", flag: "wx" });
    return { action: input.action, draft: { id, sceneId: scene.id, unitId: input.unitId, startFrame: input.startFrame, endFrame: input.endFrame,
      assignmentId: assignment.assignmentId, inputRevision: input.inputRevision, creativeDecisionId: creative.id,
      reference: input.reference, assets, path, sha256: createHash("sha256").update(body).digest("hex") } };
  }

  if (!submitted) invalid("视觉接件须引用已登记的换料稿");
  const state = readUnitHandoff(report, current, scene, submitted.unitId);
  if (state.draft?.id !== submitted.id || state.status === "waiting_for_draft" || state.status === "returned"
    || assignment.agentId === report.assignments.find(item => item.assignmentId === submitted.assignmentId)?.agentId
    || input.inputRevision < submitted.inputRevision) invalid("换料稿已退回、已被替换或与当前独立作者分派不符");
  if (input.sourceMs < submitted.reference.startMs || input.sourceMs >= submitted.reference.endMs) invalid("试摆原片时刻超出采用区间");
  if (input.action === "return_draft") return input;
  if (input.projectFrame < submitted.startFrame || input.projectFrame >= submitted.endFrame) invalid("试摆本片帧位超出单元区间");
  const comparisonPath = resolve(input.comparisonPath);
  if (!/^\.(?:jpeg|jpg|png|webp|mp4|m4v|mov|webm|ogv)$/iu.test(extname(comparisonPath))) invalid("视觉接件需要图片或视频对照");
  if (await hashFile(submitted.path).catch(() => "") !== submitted.sha256) invalid("固定的换料稿不可读取或内容已变");
  const comparisonSha256 = await hashFile(comparisonPath).catch(() => invalid("无法打开视觉试摆对照"));
  return { ...input, id: `unit_receipt_${randomUUID()}`, comparisonPath, comparisonSha256 };
}

/** 同一单元正文和复摆证据随交付冻结，后续采用及启动沿同一回执检查。 */
export function unitHandoffDeliveryIssues(report: SkillExecutionReport, snapshot: ProjectSnapshot,
  manifest: ReferenceManifest, scene: Scene, delivered: ReferenceScene, designAssignmentIds?: readonly string[]): ProductionCoordinationIssue[] {
  const plan = delivered.visualPlan;
  const units = plan?.units ?? [];
  const pending = (message: string): ProductionCoordinationIssue => ({
    code: "VISUAL_UNIT_HANDOFF_REQUIRED", scope: { kind: "objects", objectIds: [scene.id] }, state: "missing",
    assignmentId: unitHandoffOwners(report, snapshot, scene, scene, "visual_design")[0]?.assignmentId,
    relatedDecisionIds: [], relatedObjectIds: [scene.id], message: `「${scene.title}」${message}`,
    nextAction: "交回本场所有主要单元的当前换料正文和视觉接件"
  });
  if (!units.length || new Set(units.map(unit => unit.id)).size !== units.length
    || units.some((unit, index) => unit.startFrame !== (units[index - 1]?.endFrame ?? scene.startFrame)
      || unit.endFrame <= unit.startFrame || unit.endFrame > scene.endFrame)
    || units.at(-1)?.endFrame !== scene.endFrame) return [pending("缺少连续覆盖本场的主要单元")];

  return units.flatMap(unit => {
    const state = readUnitHandoff(report, snapshot, scene, unit.id);
    const issue = (code: string, message: string, nextAction: string, assignmentId = state.assignmentId): ProductionCoordinationIssue[] =>
      [{ code, scope: { kind: "frames", startFrame: unit.startFrame, endFrame: unit.endFrame }, state: "pending", assignmentId,
        relatedDecisionIds: state.draft ? [state.draft.creativeDecisionId] : [],
        relatedObjectIds: [scene.id], message: `「${scene.title} / ${unit.title}」${message}`, nextAction }];
    if (state.status === "waiting_for_draft") return issue("VISUAL_UNIT_HANDOFF_DRAFT_REQUIRED",
      state.gap ?? "尚未收到正式换料正文", "续接该场创意作者提交实际换料正文");
    if (state.status === "returned") return issue("VISUAL_UNIT_HANDOFF_RETURNED",
      `原片 ${state.sourceMs} 毫秒：${state.gap}。影响：${state.impact}`, "由原作者补材、补稿或重选原段后重新交件");
    if (state.status === "waiting_for_visual") return issue("VISUAL_UNIT_HANDOFF_REVIEW_REQUIRED",
      "视觉作者尚未试摆接收本版正文", "交视觉作者按本版正文试摆并登记接件结果");
    const { draft, receipt } = state;
    if (!draft) return [pending("缺少回执对应的换料稿")];
    const primary = plan?.referenceMappings?.filter(item => item.unitId === unit.id && item.use === "primary") ?? [];
    const reference = delivered.references?.find(item => item.id === draft.reference.id && item.kind === draft.reference.kind
      && item.sourceSha256 === draft.reference.sourceSha256 && item.startMs === draft.reference.startMs && item.endMs === draft.reference.endMs);
    const mapping = primary[0];
    const hasFile = (id: string | undefined, hash: string, comparison = false) => id && delivered.resourceIds?.includes(id)
      && manifest.files.some(file => file.uses.some(use => use.kind === "reference" && use.id === id)
        && file.localReadable && file.requiredForRun !== false && file.sha256 === hash
        && (!comparison || file.localDecode === "verified" && /^(image|video)\//u.test(file.mimeType ?? "")));
    const sequence = plan?.sequence?.filter(step => step.unitId === unit.id) ?? [];
    const roleNames = new Set(sequence.flatMap(step => step.subjects ?? []));
    const sources = delivered.visualRoles?.filter(role => roleNames.has(role.role)).flatMap(role => role.assets) ?? [];
    const assetsMatch = draft.assets.every(asset => sources.some(source => source.assetId === asset.assetId
      && source.sourceHash === asset.sourceHash
      && (!asset.sourceRange || source.sourceRanges.some(range =>
        range.startMs <= asset.sourceRange!.startMs && range.endMs >= asset.sourceRange!.endMs))));
    const requiredSources = new Set(draft.assets.map(asset => asset.assetId));
    if (unit.handoffReceiptId !== receipt.id || unit.creativeDecisionId !== draft.creativeDecisionId
      || unit.startFrame !== draft.startFrame || unit.endFrame !== draft.endFrame
      || !reference || primary.length !== 1 || mapping?.referenceId !== reference.id || mapping.referenceKind !== reference.kind
      || mapping.startMs !== reference.startMs || mapping.endMs !== reference.endMs
      || mapping.researchDecisionId !== draft.reference.researchDecisionId
      || mapping.targetRange?.startFrame !== unit.startFrame || mapping.targetRange.endFrame !== unit.endFrame
      || unit.restage?.sourceMs !== receipt.sourceMs || unit.restage.projectFrame !== receipt.projectFrame
      || !hasFile(unit.creativeDraftId, draft.sha256) || !hasFile(unit.restage.resourceId, receipt.comparisonSha256, true)
      || !assetsMatch || sources.some(source => !requiredSources.has(source.assetId))
      || designAssignmentIds && !designAssignmentIds.includes(receipt.assignmentId)) {
      return issue("VISUAL_UNIT_HANDOFF_MISMATCH", "正式交付与视觉接收的正文、参考范围、素材或复摆依据不一致",
        "核对本场交件及素材角色，当前演出有变动时重新交稿和复摆");
    }
    return [];
  });
}
