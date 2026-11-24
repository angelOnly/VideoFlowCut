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
    nextAction: "续接创意作者提交本单元的本片正文与素材绑定" };
  if (!draft.mode || !unitDraftMatchesSnapshot(draft, snapshot) || !creative.some(owner => owner.assignmentId === draft.assignmentId)) {
    return { ...base, status: "waiting_for_draft" as const, assignmentId: creative[0]?.assignmentId,
      gap: draft.mode ? "本场范围、素材或创意负责者已变化" : "本单元仍使用旧换料稿，须提交作者本片正文",
      nextAction: "按当前输入重新提交该单元" };
  }
  if (response?.action === "return_draft") return { ...base, status: "returned" as const,
    assignmentId: draft.assignmentId, gap: response.gap, sourceMs: response.sourceMs, projectFrame: response.projectFrame, impact: response.impact,
    nextAction: "续接创意作者补稿，需要时补材或重选原段，补完后重新交视觉试摆" };
  if (response?.action === "accept_draft" && visual.some(owner => owner.assignmentId === response.assignmentId)) {
    return { ...base, status: "accepted" as const, assignmentId: response.assignmentId, receipt: response,
      nextAction: "沿同版原稿完成正式视觉编排，将回执和试摆依据纳入本场制作包" };
  }
  return { ...base, status: "waiting_for_visual" as const, assignmentId: visual[0]?.assignmentId,
    nextAction: "将固定正文、本片素材与实际参考交视觉作者试摆" };
}

type DraftSubmission = Extract<ProductionUnitHandoffInput, { action: "submit_draft" }>;

function validateDraftReference(report: SkillExecutionReport, current: ProjectSnapshot, scene: Scene,
  input: DraftSubmission, creativeDecisionId: string): void {
  const source = input.reference;
  if (input.mode === "original") {
    if (source) invalid("自主创作的采用参考请在研究和导演稿映射中关联");
    return;
  }
  if (!source || source.endMs <= source.startMs || input.mode === "local_mechanism" && source.kind !== "motion") {
    invalid("完整迁移须有有效原片区间，局部机制须有有效机制原片区间");
  }
  const phase = source.kind === "creative" ? "creative_research" : "motion_research";
  const research = report.creativeDecisions.find(item => item.id === source.researchDecisionId && item.phase === phase);
  if (!research || research.researchOutcome === "not_applicable"
    || !visualScopeSceneIds(current, research.objectIds).includes(scene.id)
    || source.kind === "creative" && research.id !== creativeDecisionId
    || !unitHandoffOwners(report, current, scene, input, phase).some(owner => owner.assignmentId === research.assignmentId)) {
    invalid("所选原段缺少本单元可追溯的实际研究和原片范围");
  }
  const ranges = (research.researchReferences ?? []).flatMap(item => item.kind === source.kind && item.id === source.id
    && item.sourceSha256 === source.sourceSha256 && item.observedRelation?.trim() && item.startMs !== undefined && item.endMs !== undefined
    ? [{ startFrame: item.startMs, endFrame: item.endMs }] : []);
  const missing = missingReviewRanges(ranges, source.startMs, source.endMs);
  if (missing.length) {
    invalid(`采用原段缺少实际观察：${missing.map(range => `${range.startFrame}–${range.endFrame} ms`).join("、")}`);
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
    if (!creative || creative.assignmentId !== assignment.assignmentId || creative.researchOutcome === "not_applicable"
      || !visualScopeSceneIds(current, creative.objectIds).includes(scene.id)) {
      invalid("本片创意原稿缺少本单元原作者的研究记录");
    }
    if (!input.body.trim()) invalid("请提交原创意作者实际写出的本片正文");
    validateDraftReference(report, current, scene, input, creative.id);

    const assets: ProductionUnitDraft["assets"] = [];
    for (const { assetId, sourceRange } of input.assets) {
      const asset = inputSnapshot.assets.find(item => item.id === assetId);
      const live = current.assets.find(item => item.id === assetId);
      if (!asset || !live || live.status !== "ready" || asset.status !== "ready" || !asset.sourceHash || live.sourceHash !== asset.sourceHash
        || !["image", "video", "actor_video"].includes(asset.kind)
        || !(await stat(resolve(current.project.rootPath, live.managedPath)).catch(() => undefined))?.isFile()) {
        invalid(`素材 ${assetId} 未取得或已变化`);
      }
      if (asset.kind !== "image" && (!sourceRange || sourceRange.endMs <= sourceRange.startMs
        || asset.metadata?.durationMs !== undefined && sourceRange.endMs > asset.metadata.durationMs)
        || asset.kind === "image" && sourceRange) invalid(`素材 ${assetId} 源段不成立`);
      assets.push({ assetId, sourceRange, sourceHash: asset.sourceHash });
    }
    // 研究记录保存原片证据，固定稿原样保存作者在本片作出的演出决定。
    const body = input.body;
    const id = `unit_draft_${randomUUID()}`;
    const path = join(directory, `${id}.md`);
    await mkdir(directory, { recursive: true });
    await writeFile(path, body, { encoding: "utf8", flag: "wx" });
    return { action: input.action, draft: { id, sceneId: scene.id, unitId: input.unitId, startFrame: input.startFrame, endFrame: input.endFrame,
      assignmentId: assignment.assignmentId, inputRevision: input.inputRevision, creativeDecisionId: creative.id,
      mode: input.mode, ...(input.reference ? { reference: input.reference } : {}), assets, path, sha256: createHash("sha256").update(body).digest("hex") } };
  }

  if (!submitted) invalid("视觉接件须引用已登记的本片原稿");
  const state = readUnitHandoff(report, current, scene, submitted.unitId);
  if (state.draft?.id !== submitted.id || state.status === "waiting_for_draft" || state.status === "returned"
    || assignment.agentId === report.assignments.find(item => item.assignmentId === submitted.assignmentId)?.agentId
    || input.inputRevision < submitted.inputRevision) invalid("本片原稿已退回、已被替换或与当前独立作者分派不符");
  const source = submitted.reference;
  if (source && (input.sourceMs === undefined || input.sourceMs < source.startMs || input.sourceMs >= source.endMs)
    || !source && input.sourceMs !== undefined) invalid("原片对照时刻须落在本单元采用区间内");
  if (input.projectFrame < submitted.startFrame || input.projectFrame >= submitted.endFrame) invalid("本片核对帧位超出单元区间");
  if (input.action === "return_draft") return input;
  const comparisonPath = resolve(input.comparisonPath);
  if (!/^\.(?:jpeg|jpg|png|webp|mp4|m4v|mov|webm|ogv)$/iu.test(extname(comparisonPath))) invalid("视觉接件需要图片或视频对照");
  if (await hashFile(submitted.path).catch(() => "") !== submitted.sha256) invalid("固定的本片原稿不可读取或内容已变");
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
    nextAction: "交回本场所有主要单元的当前本片正文和视觉接件"
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
      state.gap ?? "尚未收到正式本片正文", "续接该场创意作者提交实际本片正文");
    if (state.status === "returned") return issue("VISUAL_UNIT_HANDOFF_RETURNED",
      `本片 F${state.projectFrame}${state.sourceMs === undefined ? "" : `，原片 ${state.sourceMs} ms`}：${state.gap}。影响：${state.impact}`,
      "由原作者核对对应素材和画面后重新交件");
    if (state.status === "waiting_for_visual") return issue("VISUAL_UNIT_HANDOFF_REVIEW_REQUIRED",
      "视觉作者尚未试摆接收本版正文", "交视觉作者按本版正文试摆并登记接件结果");
    const { draft, receipt } = state;
    if (!draft) return [pending("缺少回执对应的本片原稿")];
    const mappings = plan?.referenceMappings?.filter(item => item.unitId === unit.id) ?? [];
    const primaries = mappings.filter(item => item.use === "primary");
    const source = draft.reference;
    const reference = source && delivered.references?.find(item => item.id === source.id && item.kind === source.kind
      && item.sourceSha256 === source.sourceSha256 && item.startMs === source.startMs && item.endMs === source.endMs);
    const mapping = reference && mappings.find(item => item.referenceId === reference.id && item.referenceKind === reference.kind
      && item.startMs === reference.startMs && item.endMs === reference.endMs
      && item.researchDecisionId === source?.researchDecisionId && item.preserveRelation?.trim() && item.treatment?.trim()
      && item.targetRange && item.targetRange.startFrame >= unit.startFrame && item.targetRange.endFrame <= unit.endFrame
      && item.targetRange.startFrame <= receipt.projectFrame && receipt.projectFrame < item.targetRange.endFrame
      && (draft.mode === "full_reference"
        ? item.use === "primary" && item.targetRange.startFrame === unit.startFrame && item.targetRange.endFrame === unit.endFrame
        : item.use === "support"));
    const referenceMatches = draft.mode === "original" ? primaries.length === 0
      : !!mapping && primaries.length === (draft.mode === "full_reference" ? 1 : 0);
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
    if (unit.mode !== draft.mode || unit.handoffReceiptId !== receipt.id || unit.creativeDecisionId !== draft.creativeDecisionId
      || unit.startFrame !== draft.startFrame || unit.endFrame !== draft.endFrame
      || !hasFile(unit.creativeDraftId, draft.sha256)
      || !sequence.some(step => step.action?.trim() && step.transition?.trim()) || !assetsMatch || sources.some(source => !requiredSources.has(source.assetId))
      || designAssignmentIds && !designAssignmentIds.includes(receipt.assignmentId)) {
      return issue("VISUAL_UNIT_HANDOFF_MISMATCH", "正式交付与已接收的本片正文、采用方式、帧段或素材不一致",
        "核对本场交件及素材角色，演出变动后以新稿重新接件");
    }
    if (!referenceMatches) {
      return issue(draft.mode === "full_reference" ? "VISUAL_UNIT_PRIMARY_REFERENCE_MISSING" : "VISUAL_UNIT_REFERENCE_MAPPING_MISMATCH",
        "采用参考与本单元已接收的来源、用途或实际范围不一致", "核对接件采用方式和原片、本片区间");
    }
    if (!unit.restage || unit.restage.sourceMs !== receipt.sourceMs || unit.restage.projectFrame !== receipt.projectFrame
      || !hasFile(unit.restage.resourceId, receipt.comparisonSha256, true)) {
      return issue("VISUAL_UNIT_RESTAGE_MISSING", "缺少与接收回执一致的可解码实料试摆",
        "交回同版图片或视频对照及试摆帧位");
    }
    return [];
  });
}
