const MiB = 1024 * 1024;
export const MOTION_DISK_RESERVE_BYTES = 1024 * MiB;

/** PNG 是逐帧落盘的无损输出，不是同时驻留内存；预算应覆盖合法画幅的 RGBA 最坏体积。 */
export function motionOutputBudget(width: number, height: number, frames: number): number {
  if (![width, height, frames].every(value => Number.isSafeInteger(value) && value > 0)
    || width * height * frames > 650_000_000) {
    throw new Error("MOTION_RENDER_BUDGET: 本次像素帧总量超过上限或尺寸无效");
  }
  // 每行滤波字节、无损压缩最坏膨胀和 PNG 块开销均计入；最大合法作品仍小于 3GiB。
  return Math.max(512 * MiB, Math.ceil((width * 4 + 1) * height * frames * 1.01) + frames * 1024);
}

export function checkMotionOutputBudget(bytes: number, budget: number): void {
  if (bytes > budget) throw new Error(`MOTION_OUTPUT_BUDGET: 透明帧已用 ${bytes} 字节，预算 ${budget} 字节`);
}

export function checkMotionDiskSpace(availableBytes: number, budget: number): void {
  const required = budget + MOTION_DISK_RESERVE_BYTES;
  if (availableBytes < required) throw new Error(`MOTION_DISK_SPACE: 可用 ${availableBytes} 字节，需要 ${required} 字节（含预览及余量）`);
}
