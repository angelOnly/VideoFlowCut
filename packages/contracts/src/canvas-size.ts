import { z } from "zod";

/** 与受管作品和 H.264 输出共用偶数像素规格。 */
export const canvasDimensionSchema = z.number().int().min(64).max(1920).multipleOf(2);
export const projectCanvasSizeSchema = z.object({
  width: canvasDimensionSchema,
  height: canvasDimensionSchema
}).strict().refine(({ width, height }) => width === height || width * 16 === height * 9 || width * 9 === height * 16,
  "项目画布须为9:16、16:9或1:1，宽高均为64至1920的偶数");

export function canvasAspectRatio(width: number, height: number): "9:16" | "16:9" | "1:1" {
  return width === height ? "1:1" : width < height ? "9:16" : "16:9";
}

export const PROJECT_CANVAS_SIZES = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 }
} as const;
