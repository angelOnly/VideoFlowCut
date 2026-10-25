import { readRuntimeConfig } from "@videocut/project-overview";
const MiB = 1024 * 1024;
export const MOTION_DISK_RESERVE_BYTES = 1024 * MiB;

/** 预算覆盖正式媒体与固定样本；透明无损输出仍按最坏 RGBA 体积预留。 */
export function motionOutputBudget(width: number, height: number, frames: number, compositing: "opaque" | "alpha" = "alpha", fps = 30): number {
  if (![width, height, frames].every(value => Number.isSafeInteger(value) && value > 0)
    || !Number.isSafeInteger(width * height * frames * 4)) {
    throw new Error("MOTION_RENDER_BUDGET: 尺寸无效或输出体积超过安全整数范围");
  }
  // 只估算磁盘体积；累计像素帧不代表同时驻留内存。
  const budget = compositing === "opaque"
    ? Math.ceil(frames / fps * 50_000_000 / 8) + width * height * 4 * 6
    : Math.ceil(width * height * frames * 4 * 1.05) + Math.ceil(frames / fps * 50_000_000 / 8) + width * height * 4 * 6;
  if (!Number.isSafeInteger(budget)) throw new Error("MOTION_RENDER_BUDGET: 输出体积超过安全整数范围");
  return budget;
}

export function checkMotionOutputBudget(bytes: number, budget: number): void {
  if (bytes > budget) throw new Error(`MOTION_OUTPUT_BUDGET: 正式输出已用 ${bytes} 字节，预算 ${budget} 字节`);
}

export function checkMotionDiskSpace(availableBytes: number, budget: number, temporaryBytes = 0): void {
  const required = budget + temporaryBytes + readRuntimeConfig().motion.diskReserveBytes;
  if (availableBytes < required) throw new Error(`MOTION_DISK_SPACE: 可用 ${availableBytes} 字节，需要 ${required} 字节（含预览及余量）`);
}
