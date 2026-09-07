import { DEFAULT_CAPTION_FORMAT, type EffectCue, type ProjectSnapshot } from "@videocut/contracts";
import { CAPTION_LINE_HEIGHT, CAPTION_BACKGROUND_VERTICAL_PADDING_EM } from "../../remotion-runtime/src/caption-layout.js";

/**
 * full_frame 是受管作品的坐标系，不代表有色像素占满画面。
 * Alpha 外包矩形与字幕保守区域不相交可排除遮挡；相交只表示待审，不能冒称已遮挡。
 */
export function motionCaptionSafety(snapshot: ProjectSnapshot, cue: EffectCue): "clear" | "review" | "unknown" {
  const captions = snapshot.timeline.captions.filter((card) => card.startFrame < cue.endFrame && card.endFrame > cue.startFrame);
  if (!captions.length) return "clear";
  const motion = snapshot.assets.find((asset) => asset.id === cue.assetBindings.find((binding) => binding.slot === "motion")?.assetId)?.motion;
  const visibility = motion?.visibility;
  if (!motion || !visibility || visibility.method !== "png_alpha_bbox_v1" || visibility.alphaThreshold !== 1
    || !Array.isArray(visibility.frames) || visibility.frames.length !== motion.frameCount || motion.frameCount !== cue.endFrame - cue.startFrame
    || motion.width !== snapshot.timeline.width || motion.height !== snapshot.timeline.height || motion.fps !== snapshot.timeline.fps) return "unknown";
  const { width, height } = snapshot.timeline;
  for (const box of visibility.frames) {
    if (box !== null && (!box || typeof box !== "object" || ![box.x, box.y, box.width, box.height].every(Number.isInteger)
      || box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0 || box.x + box.width > width || box.y + box.height > height)) return "unknown";
  }
  for (const card of captions) {
    const format = { ...DEFAULT_CAPTION_FORMAT, ...card.format };
    const scale = Math.max(1, card.emphasis?.scale ?? 1);
    // 预留两行、强调字缩放、底板与阴影；它是安全预算，不是伪造的字体实测。
    const bottom = height * (1 - format.bottomPercent / 100) + 18;
    const top = height * (1 - format.bottomPercent / 100) - format.fontSize * scale * (2 * CAPTION_LINE_HEIGHT + CAPTION_BACKGROUND_VERTICAL_PADDING_EM) - 18;
    const left = width * format.horizontalInsetPercent / 100 - 18;
    const right = width - left;
    for (let frame = Math.max(card.startFrame, cue.startFrame); frame < Math.min(card.endFrame, cue.endFrame); frame++) {
      const box = visibility.frames[frame - cue.startFrame];
      if (box && box.x < right && box.x + box.width > left && box.y < bottom && box.y + box.height > top) return "review";
    }
  }
  return "clear";
}
