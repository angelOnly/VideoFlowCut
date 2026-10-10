import { z } from "zod";
import type { CaptionCard, CaptionFormat } from "./index.js";

/** 只接收有限阴影参数，不允许任意 CSS 字符串。 */
export const captionTextShadowSchema = z.object({
  offsetX: z.number().min(-20).max(20),
  offsetY: z.number().min(-20).max(20),
  blur: z.number().min(0).max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/iu, "颜色必须是 #RRGGBB"),
  opacity: z.number().min(0).max(1)
}).strict();
export type CaptionTextShadow = z.infer<typeof captionTextShadowSchema>;

/** Player 与导出共用同一解释；旧字幕缺省不改变，显式关闭不能被默认值覆盖。 */
export function captionTextShadowCss(shadow: CaptionFormat["textShadow"]): string {
  if (shadow === undefined) return "0 3px 14px #000";
  if (shadow === null) return "none";
  const value = captionTextShadowSchema.parse(shadow);
  const alpha = Math.round(value.opacity * 255).toString(16).padStart(2, "0");
  return `${value.offsetX}px ${value.offsetY}px ${value.blur}px ${value.color}${alpha}`;
}

export const captionPlacementSchema = z.object({ leftPercent: z.number().min(0).max(95), topPercent: z.number().min(0).max(95), widthPercent: z.number().min(5).max(100) }).strict().refine(p => p.leftPercent + p.widthPercent <= 100, "字幕布局超出画布宽度");
export const captionDisplaySchema = z.object({ mode: z.enum(["shown", "hidden"]), ranges: z.array(z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict()).min(1).max(50).optional() }).strict();
export type CaptionPlacement = z.infer<typeof captionPlacementSchema>;
export type CaptionDisplay = z.infer<typeof captionDisplaySchema>;

/** 显示范围不改变声音或 token：使用时间线绝对帧的半开区间，只能收窄本卡。 */
export function validCaptionDisplay(card: Pick<CaptionCard, "startFrame" | "endFrame" | "display">): boolean {
  if (card.display === undefined) return true;
  if (!captionDisplaySchema.safeParse(card.display).success || card.display.mode === "hidden" && card.display.ranges !== undefined) return false;
  let end = card.startFrame;
  return (card.display.ranges ?? []).every(range => {
    const valid = range.startFrame >= end && range.endFrame > range.startFrame && range.endFrame <= card.endFrame;
    end = range.endFrame;
    return valid;
  });
}
export function captionDisplayRanges(card: Pick<CaptionCard, "startFrame" | "endFrame" | "display">): { startFrame: number; endFrame: number }[] {
  if (!validCaptionDisplay(card)) throw new Error("CAPTION_DISPLAY_INVALID");
  return card.display?.mode === "hidden" ? [] : card.display?.ranges ?? [{ startFrame: card.startFrame, endFrame: card.endFrame }];
}
export function captionIsDisplayed(card: Pick<CaptionCard, "startFrame" | "endFrame" | "display">, frame: number): boolean {
  return captionDisplayRanges(card).some(range => frame >= range.startFrame && frame < range.endFrame);
}
export function captionBoxWidthPercent(format: Pick<CaptionFormat, "placement" | "horizontalInsetPercent">): number {
  return format.placement?.widthPercent ?? 100 - 2 * format.horizontalInsetPercent;
}
