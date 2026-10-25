import { createHash } from "node:crypto";
import { captionDisplayRanges, captionIsDisplayed, resolveCaptionFormat } from "../../../packages/contracts/src/caption-presentation.js";
import { compileVisualComposition, resolveCompositionReachability } from "../../../packages/edit-domain/src/composition-reachability.js";
import type { ProjectSnapshot } from "@videocut/contracts";

export interface MediaLayer { assetId: string; origin: number; sourceStart: number; fit: "cover" | "contain"; background?: string }
export interface RenderSpan { startFrame: number; endFrame: number; kind: "media" | "browser"; layers: MediaLayer[]; captionIds: string[]; reasons: string[]; cacheKey: string }
export interface RenderPlan { startFrame: number; endFrame: number; spans: RenderSpan[]; renderer: "ffmpeg" | "hybrid" }

/** 在所有有效内容边界切分；特殊效果以完整全局范围消费，字幕和声音不在局部片里重复叠加。 */
export function buildRenderPlan(snapshot: ProjectSnapshot, startFrame = 0, endFrame = snapshot.timeline.durationInFrames): RenderPlan {
  if (startFrame < 0 || endFrame <= startFrame || endFrame > snapshot.timeline.durationInFrames) throw new Error("INVALID_PREVIEW_RANGE");
  const active = resolveCompositionReachability(snapshot), visual = compileVisualComposition(snapshot, active);
  const items = snapshot.timeline.items.filter(i => active.videoItemIds.has(i.id));
  const cues = snapshot.effectCues.filter(c => active.effectCueIds.has(c.id));
  const scenes = snapshot.scenes.filter(s => snapshot.explainerPrograms.some(p => p.sceneId === s.id && active.explainerProgramIds.has(p.id)));
  const captions = snapshot.project.brief.captionMode === "none" ? [] : snapshot.timeline.captions.filter(c => captionDisplayRanges(c).length);
  const points = [...new Set([startFrame, endFrame, ...[...items, ...cues, ...scenes, ...captions.flatMap(c=>captionDisplayRanges(c))].flatMap(v => [v.startFrame, v.endFrame]).filter(f => f > startFrame && f < endFrame)])].sort((a,b) => a-b);
  const spans: RenderSpan[] = [];
  for (let n = 0; n < points.length - 1; n++) {
    const from = points[n]!, to = points[n+1]!;
    const live = <T extends { startFrame: number; endFrame: number }>(list: T[]) => list.filter(v => v.startFrame <= from && v.endFrame > from);
    const reasons: string[] = [], layers: MediaLayer[] = [];
    const visible = live(items).filter(i => !(visual.replacedActorRanges.get(i.id) ?? []).some(r => r.startFrame <= from && r.endFrame > from));
    const itemLayer = (item: typeof items[number]) => {
      const asset = snapshot.assets.find(a => a.id === item.assetId)!;
      const performance = snapshot.actorPerformances.find(p => p.timelineItemId === item.id && p.status === "ready");
      const cutaway = snapshot.cutaways.find(c => c.timelineItemId === item.id && c.status === "ready");
      if (performance?.maskMode === "alpha_asset" || asset.metadata?.hasAlpha && !asset.motion || cutaway?.mode === "pip") reasons.push(`空间效果:${item.id}`);
      if (asset.motion || !["video", "actor_video", "image"].includes(asset.kind)) reasons.push(`媒体表示:${item.id}`);
      layers.push({ assetId: item.assetId, origin: item.startFrame, sourceStart: item.sourceStartFrame, fit: cutaway?.fit ?? "cover", ...(cutaway ? { background: "black" } : {}) });
    };
    const cueLayer = (cue: typeof cues[number]) => {
      const asset = snapshot.assets.find(a => a.id === cue.assetBindings.find(b => b.slot === "motion")?.assetId);
      if (cue.type !== "ManagedMotion" || !asset?.motion?.output) { reasons.push(`浏览器效果:${cue.id}`); return; }
      layers.push({ assetId: asset.id, origin: cue.startFrame, sourceStart: 0, fit: "contain" });
    };
    const cutawayIds = new Set(snapshot.cutaways.filter(c => c.status === "ready").map(c => c.timelineItemId));
    visible.sort((a,b) => snapshot.timeline.tracks.find(t=>t.id===b.trackId)!.order - snapshot.timeline.tracks.find(t=>t.id===a.trackId)!.order || a.startFrame-b.startFrame);
    visible.filter(i=>!cutawayIds.has(i.id)).forEach(itemLayer);
    if (live(scenes).length) reasons.push("原生解释场景");
    const currentCues = live(cues), primary = new Set(visual.primaryCues.map(c=>c.id));
    const explainer = new Set(snapshot.scenes.filter(s=>s.type==="ExplainerScene").map(s=>s.id));
    currentCues.filter(c=>c.layer==="fullscreen" && explainer.has(c.sceneId) && !primary.has(c.id)).forEach(cueLayer);
    currentCues.filter(c=>primary.has(c.id)).forEach(cueLayer);
    visible.filter(i=>cutawayIds.has(i.id)).forEach(itemLayer);
    // rear 的人物遮挡仍由原 Composition 负责，不能把它错当最前层。
    if (currentCues.some(c=>c.layer==="rear")) reasons.push("人物后景遮挡");
    currentCues.filter(c=>c.layer==="actor" || c.layer==="front").forEach(cueLayer);
    currentCues.filter(c=>c.layer==="fullscreen" && !explainer.has(c.sceneId) && !primary.has(c.id)).forEach(cueLayer);
    const currentCaptions = live(captions).filter(c=>captionIsDisplayed(c,from));
    if (currentCaptions.length > 1) throw new Error("CAPTION_TIMELINE_OVERLAP: 同一帧只能显示一张字幕卡");
    for (const caption of currentCaptions) {
      if (!snapshot.timeline.captionFormat && (caption.emphasis || caption.precision === "word_exact")) reasons.push(`动态字幕:${caption.id}`);
    }
    const kind = reasons.length ? "browser" : "media";
    const dependency = kind === "browser" ? {
      profile: snapshot.project.profile, captionMode: snapshot.project.brief.captionMode, items: visible, cues: currentCues, scenes: live(snapshot.scenes),
      evidenceCaptures: snapshot.evidenceCaptures.filter(e=>snapshot.explainerPrograms.some(p=>live(scenes).some(s=>s.id===p.sceneId)&&p.evidenceCaptureId===e.id)),
      programs: snapshot.explainerPrograms.filter(p=>live(scenes).some(s=>s.id===p.sceneId)).map(({updatedAt,createdAt,disabled,...p})=>({...p,disabled:Boolean(disabled)})),
      assets: snapshot.assets.filter(a=>visible.some(i=>i.assetId===a.id) || currentCues.some(c=>c.assetBindings.some(b=>b.assetId===a.id)) || snapshot.explainerPrograms.some(p=>live(scenes).some(s=>s.id===p.sceneId)&&p.assetIds.includes(a.id)) || snapshot.actorPerformances.some(p=>visible.some(i=>i.id===p.timelineItemId)&&p.maskAssetId===a.id)), performances: snapshot.actorPerformances.filter(p=>visible.some(i=>i.id===p.timelineItemId)),
      cutaways: snapshot.cutaways.filter(c=>visible.some(i=>i.id===c.timelineItemId)), captions: currentCaptions,
      captionFormat: snapshot.timeline.captionFormat, speechAlignment: snapshot.speechAlignment, speechAsset: snapshot.speechAsset, script: snapshot.script
    } : { layers: layers.map(l=>({ ...l, asset: snapshot.assets.find(a=>a.id===l.assetId) })), captions: currentCaptions.map(c=>({ ...c, format: resolveCaptionFormat(snapshot.timeline,c) })) };
    const cacheKey = createHash("sha256").update(JSON.stringify({ version: 2, from, to, width:snapshot.timeline.width, height:snapshot.timeline.height, fps:snapshot.timeline.fps, dependency })).digest("hex");
    spans.push({ startFrame: from, endFrame: to, kind, layers, captionIds: currentCaptions.map(c=>c.id), reasons, cacheKey });
  }
  // 相邻特殊范围合并，维持跨边界效果的同一全局时钟。
  const merged: RenderSpan[] = [];
  for (const span of spans) {
    const last = merged.at(-1);
    if (last?.kind === "browser" && span.kind === "browser") { last.endFrame = span.endFrame; last.reasons = [...new Set([...last.reasons,...span.reasons])]; last.cacheKey = createHash("sha256").update(last.cacheKey+span.cacheKey).digest("hex"); }
    else merged.push(span);
  }
  return { startFrame, endFrame, spans: merged, renderer: merged.some(s=>s.kind==="browser") ? "hybrid" : "ffmpeg" };
}
