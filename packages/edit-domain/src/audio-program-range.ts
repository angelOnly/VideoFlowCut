import type { ProjectSnapshot } from "@videocut/contracts";
import { resolveCompositionReachability } from "./composition-reachability";

/** 声音跟随实际可播放画面；空 Scene、旁白和包装声音均不能撑长主线。 */
export function resolveAudioProgramEndFrame(snapshot: ProjectSnapshot): number {
  const reachable = resolveCompositionReachability(snapshot);
  const assets = new Map(snapshot.assets.map(asset => [asset.id, asset]));
  const scenes = new Map(snapshot.scenes.map(scene => [scene.id, scene]));
  const validRange = (start: number, end: number) => Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start;
  const readyAsset = (id: string) => {
    const asset = assets.get(id);
    return asset?.status === "ready" && Boolean(asset.managedPath?.trim());
  };
  let endFrame = 0;
  for (const item of snapshot.timeline.items) {
    const asset = assets.get(item.assetId);
    if (reachable.videoItemIds.has(item.id) && readyAsset(item.assetId) && !asset?.motion
      && (asset?.kind === "video" || asset?.kind === "actor_video" || asset?.kind === "image") && validRange(item.startFrame, item.endFrame)) {
      endFrame = Math.max(endFrame, item.endFrame);
    }
  }
  for (const cue of snapshot.effectCues ?? []) {
    const scene = scenes.get(cue.sceneId);
    if (reachable.effectCueIds.has(cue.id) && scene && scene.status !== "stale"
      && validRange(cue.startFrame, cue.endFrame) && cue.startFrame >= scene.startFrame && cue.endFrame <= scene.endFrame
      && cue.assetBindings.every(binding => readyAsset(binding.assetId))) {
      // CameraPunch 只改变既有画面的镜头，不能独自生成主画面。
      if (cue.type !== "CameraPunch") endFrame = Math.max(endFrame, cue.endFrame);
    }
  }
  for (const program of snapshot.explainerPrograms ?? []) {
    const scene = scenes.get(program.sceneId);
    if (reachable.explainerProgramIds.has(program.id) && scene && validRange(scene.startFrame, scene.endFrame)
      && program.assetIds.every(readyAsset)) endFrame = Math.max(endFrame, scene.endFrame);
  }
  return endFrame;
}
