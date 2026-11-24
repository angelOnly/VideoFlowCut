import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type { CreativeAdoptionRef, CreativeDeliveryRef, ProjectSnapshot, ReferenceReviewRef, SkillExecutionReport } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { missingReviewRanges } from "../../quality-system/src/editorial-review.js";
import type { EditingApplication } from "./index.js";
import { readFrozenAuthorRequest, type ReferenceManifest } from "./opendesign-reference-package.mjs";
import { requiresVisualReferenceUnits, visualReferenceUnitCoverage } from "./production-coordination.js";
import { sameVisualDelivery } from "./visual-design-revisions.js";
import { unitHandoffDeliveryIssues } from "./production-unit-handoff.js";

type FrameRange = { startFrame: number; endFrame: number };
const overlapsReferenceRange = (a: FrameRange, b: FrameRange) => a.startFrame < b.endFrame && b.startFrame < a.endFrame;

/** 从固定清单和原决定派生对照。多次观察保留各自源区间。 */
export async function readReferenceDecision(app: EditingApplication, report: SkillExecutionReport, decisionId: string, includeAuthorRequest = false) {
  const decisions = new Map(report.creativeDecisions.map(decision => [decision.id, decision]));
  const decision = decisions.get(decisionId);
  if (!decision || (decision.phase !== "visual_design" && decision.phase !== "adoption")) {
    throw new DomainError("参考对照需要本次任务的视觉设计或导演采用决定", "REFERENCE_COMPARISON_DECISION_INVALID");
  }
  const delivery = decision.deliveryRef;
  if (!delivery) return { referenceComparisons: [] };
  const manifest = await readReferenceManifest(report.projectId, delivery);
  const projectRoot = app.getProjectRoot(report.projectId);
  const snapshot = app.readProject(report.projectId, manifest.revision).snapshot;
  const designs = decision.phase === "visual_design" ? [decision]
    : (decision.inputDecisionIds ?? []).flatMap(id => {
      const design = decisions.get(id);
      return design?.phase === "visual_design" && sameVisualDelivery(design.deliveryRef, delivery) ? [design] : [];
    });
  let request;
  if (includeAuthorRequest) {
    const current = app.readProject(report.projectId).snapshot;
    const assignments = designs.flatMap(design => design.assignmentId ? [design.assignmentId] : []);
    const usable = !requiresVisualReferenceUnits(report, current) || delivery.sceneIds.every(sceneId => {
      const scene = current.scenes.find(item => item.id === sceneId);
      const delivered = manifest.scenes?.find(item => item.sceneId === sceneId && item.status === "ready");
      return scene && delivered && !unitHandoffDeliveryIssues(report, current, manifest, scene, delivered, assignments).length;
    });
    if (usable) request = await readFrozenAuthorRequest(manifest, delivery.manifestPath);
  }
  const referenceUnitCoverage = requiresVisualReferenceUnits(report, snapshot)
    ? (manifest.scenes ?? []).filter(scene => delivery.sceneIds.includes(scene.sceneId)).flatMap(delivered => {
      const scene = snapshot.scenes.find(item => item.id === delivered.sceneId);
      return scene ? visualReferenceUnitCoverage({ report, snapshot, manifest, scene, delivered, designs,
        adoptionOperationId: decision.phase === "adoption" ? decision.operationId : undefined }).map(unit => ({
          ...unit, ready: unit.issues.length === 0,
          ...(unit.creativeDraftPath ? { creativeDraftPath: resolve(dirname(delivery.manifestPath), unit.creativeDraftPath) } : {}),
          ...(unit.restage ? { restage: { ...unit.restage, localPath: resolve(dirname(delivery.manifestPath), unit.restage.deliveredPath) } } : {})
        })) : [];
    }) : [];
  const referenceComparisons = (manifest.scenes ?? []).filter(scene => delivery.sceneIds.includes(scene.sceneId)).flatMap(scene => {
    const projectScene = snapshot.scenes.find(item => item.id === scene.sceneId);
    if (!projectScene) return [];
    const plan = scene.visualPlan;
    return (scene.references ?? []).flatMap(reference => (plan?.referenceMappings ?? []).flatMap(mapping => {
      if (mapping.referenceId !== reference.id || (mapping.referenceKind && mapping.referenceKind !== reference.kind)
        || mapping.startMs !== reference.startMs || mapping.endMs !== reference.endMs || !mapping.targetRole) return [];
      const research = mapping.researchDecisionId ? decisions.get(mapping.researchDecisionId) : undefined;
      const observations = [];
      const pending = research ? [research.id] : [];
      const seen = new Set<string>();
      for (const id of pending) {
        if (seen.has(id)) continue;
        seen.add(id);
        const observed = decisions.get(id);
        if (!observed || (observed.phase !== "creative_research" && observed.phase !== "motion_research")) continue;
        for (const source of observed.researchReferences ?? []) {
          if (source.kind !== reference.kind || source.id !== reference.id || source.sourceSha256 !== reference.sourceSha256) continue;
          observations.push({ decisionId: id, decision: observed.decision, rationale: observed.rationale,
            startMs: source.startMs, endMs: source.endMs, observedRelation: source.observedRelation });
        }
        pending.push(...(observed.inputDecisionIds ?? []));
      }
      const file = manifest.files.find(entry => entry.deliveredPath === reference.video && entry.localReadable);
      const localPath = file && resolve(dirname(delivery.manifestPath), file.deliveredPath);
      const path = localPath && relative(projectRoot, localPath);
      const mediaUrl = path && !isAbsolute(path) && path !== ".." && !path.startsWith(".." + sep)
        ? "/media/" + [report.projectId, ...path.split(sep)].map(encodeURIComponent).join("/") : undefined;
      const card = manifest.files.find(entry => entry.localReadable && entry.uses?.some(use =>
        use.kind === reference.kind && use.id === reference.id && use.fileKind === "card"));
      const identity: ReferenceReviewRef = { productionRunId: report.id, decisionId, sceneId: scene.sceneId,
        referenceKind: reference.kind, referenceId: reference.id, sourceSha256: reference.sourceSha256,
        targetRole: mapping.targetRole, startMs: reference.startMs, endMs: reference.endMs };
      return [{ identity, observations, mediaUrl, mediaPath: localPath,
        ...(mapping.unitId ? { unitId: mapping.unitId, use: mapping.use } : {}),
        cardPath: card && resolve(dirname(delivery.manifestPath), card.deliveredPath),
        purpose: reference.purpose, targetRange: mapping.targetRange ?? {
        startFrame: projectScene.startFrame, endFrame: projectScene.endFrame },
        ...(research ? { selection: { decisionId: research.id, decision: research.decision, rationale: research.rationale } } : {}),
        assets: (scene.visualRoles?.find(role => role.role === mapping.targetRole)?.assets ?? []).map(asset => ({
          ...asset, name: snapshot.assets.find(item => item.id === asset.assetId)?.name
        })),
        preserveRelation: mapping.preserveRelation, treatment: mapping.treatment,
        sequence: (plan?.sequence ?? []).filter(step => !mapping.unitId || step.unitId === mapping.unitId),
        locked: plan?.odBoundaries?.locked ?? [], adjustable: plan?.odBoundaries?.adjustable ?? [] }];
    }));
  });
  return { referenceComparisons, referenceUnitCoverage, ...(request ? { authorRequest: { ...request, ...delivery } } : {}) };
}

export type ReferenceComparison = Awaited<ReturnType<typeof readReferenceDecision>>["referenceComparisons"][number];

async function readReferenceManifest(projectId: string, delivery: CreativeDeliveryRef) {
  try {
    const bytes = await readFile(delivery.manifestPath);
    if (createHash("sha256").update(bytes).digest("hex") !== delivery.manifestSha256) throw new Error("清单已变化");
    const manifest = JSON.parse(bytes.toString("utf8")) as ReferenceManifest;
    if (manifest.projectId !== projectId || !manifest.selectedSceneIds || delivery.sceneIds.length !== manifest.selectedSceneIds.length
      || delivery.sceneIds.some(id => !manifest.selectedSceneIds!.includes(id))) throw new Error("项目或场面不一致");
    return manifest;
  } catch (error) {
    throw new DomainError(`参考交付清单 ${delivery.manifestPath} 不可用：${error instanceof Error ? error.message : String(error)}`, "REFERENCE_COMPARISON_DELIVERY_INVALID");
  }
}

/** 工作台以被审修订中的固定 Cue 为准，最终文件以导出修订的采用为准。 */
export async function referenceComparisonsForRevision(app: EditingApplication, snapshot: ProjectSnapshot,
  range: FrameRange, source: "workbench" | "artifact") {
  const refs: Array<{ ref: CreativeAdoptionRef; sceneId: string; sourceRange: FrameRange }> = [];
  for (const scene of snapshot.scenes.filter(scene => overlapsReferenceRange(scene, range))) {
    let remaining: FrameRange[] = [scene];
    if (source === "workbench") {
      const fixedCues = snapshot.effectCues.filter(cue => cue.sceneId === scene.id && cue.status === "ready" && cue.authoringInputs?.length);
      for (const cue of fixedCues.filter(cue => overlapsReferenceRange(cue, range))) {
        for (const input of cue.authoringInputs ?? []) refs.push({ ref: input.adoptedDecisionRef, sceneId: scene.id, sourceRange: cue });
      }
      remaining = missingReviewRanges(fixedCues, scene.startFrame, scene.endFrame).filter(gap => overlapsReferenceRange(gap, range));
    }
    for (const treatment of snapshot.visualTreatments) {
      if (treatment.adoptedDecisionRef && (treatment.sceneId === scene.id || !treatment.sceneId
        && treatment.narrativeBeatId && scene.narrativeBeatIds.includes(treatment.narrativeBeatId))) {
        for (const sourceRange of remaining) refs.push({ ref: treatment.adoptedDecisionRef, sceneId: scene.id, sourceRange });
      }
    }
  }
  const reports = new Map<string, Promise<SkillExecutionReport>>();
  const comparisons = new Map<string, Promise<ReferenceComparison[]>>();
  const result = new Map<string, ReferenceComparison>();
  for (const { ref, sceneId, sourceRange } of refs) {
    const key = JSON.stringify(ref);
    let entries = comparisons.get(key);
    if (!entries) {
      let report = reports.get(ref.productionRunId);
      if (!report) {
        report = app.readSkillExecutionReport({ projectId: snapshot.project.id, runId: ref.productionRunId });
        reports.set(ref.productionRunId, report);
      }
      entries = readReferenceDecision(app, await report, ref.decisionId).then(result => result.referenceComparisons);
      comparisons.set(key, entries);
    }
    for (const entry of await entries) {
      if (entry.identity.sceneId !== sceneId) continue;
      const targetRange = { startFrame: Math.max(sourceRange.startFrame, entry.targetRange.startFrame),
        endFrame: Math.min(sourceRange.endFrame, entry.targetRange.endFrame) };
      if (targetRange.startFrame >= targetRange.endFrame || !overlapsReferenceRange(targetRange, range)) continue;
      result.set(JSON.stringify([entry.identity, targetRange]), { ...entry, targetRange });
    }
  }
  return [...result.values()];
}
