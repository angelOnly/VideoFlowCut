import type { CreativeDecision, CreativeDeliveryRef, ProjectSnapshot, VisualTreatment } from "@videocut/contracts";

type Scene = ProjectSnapshot["scenes"][number];
type VisualTarget = { scene: Scene; beatId?: string; treatment?: VisualTreatment };

/** 场面、Beat 和视觉计划分别限定范围；整个场面的声明覆盖其中各项。 */
function coversTarget(snapshot: ProjectSnapshot, decision: Pick<CreativeDecision, "objectIds">, target: VisualTarget): boolean {
  const ids = decision.objectIds;
  if (ids.includes(snapshot.project.id) || ids.includes(target.scene.id)
    || !!target.beatId && ids.includes(target.beatId)
    || !!target.treatment && ids.includes(target.treatment.id)) return true;
  const scopedTreatments = snapshot.visualTreatments.filter(treatment => ids.includes(treatment.id)
    && (treatment.sceneId === target.scene.id || !treatment.sceneId && !!treatment.narrativeBeatId
      && target.scene.narrativeBeatIds.includes(treatment.narrativeBeatId)));
  if (scopedTreatments.some(treatment => !treatment.narrativeBeatId)) return true;
  // 整场视觉计划也会受到该场某个 Beat 或局部计划修订的影响。
  return !!target.treatment && !target.treatment.narrativeBeatId
    && (target.scene.narrativeBeatIds.some(id => ids.includes(id)) || scopedTreatments.length > 0);
}

function visualTargets(snapshot: ProjectSnapshot): VisualTarget[] {
  return snapshot.scenes.flatMap(scene => [
    { scene },
    ...scene.narrativeBeatIds.map(beatId => ({ scene, beatId })),
    ...snapshot.visualTreatments.filter(treatment => treatment.sceneId === scene.id
      || !treatment.sceneId && !!treatment.narrativeBeatId && scene.narrativeBeatIds.includes(treatment.narrativeBeatId))
      .map(treatment => ({ scene, beatId: treatment.narrativeBeatId, treatment }))
  ]);
}

export function visualScopeSceneIds(snapshot: ProjectSnapshot, objectIds: string[]): string[] {
  return [...new Set(visualTargets(snapshot).filter(target => coversTarget(snapshot, { objectIds }, target)).map(target => target.scene.id))].sort();
}

export function sameVisualDelivery(first: CreativeDeliveryRef | undefined, second: CreativeDeliveryRef | undefined): boolean {
  return !!first && !!second && first.manifestPath === second.manifestPath && first.manifestSha256 === second.manifestSha256
    && JSON.stringify([...first.sceneIds].sort()) === JSON.stringify([...second.sceneIds].sort());
}

export function visualDesignCovers(snapshot: ProjectSnapshot, decision: CreativeDecision, scene: Scene, treatment?: VisualTreatment): boolean {
  return coversTarget(snapshot, decision, { scene, beatId: treatment?.narrativeBeatId, treatment });
}

