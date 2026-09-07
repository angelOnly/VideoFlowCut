import { join } from "node:path";
import type { MotionVisibility } from "@videocut/contracts";
import { runProcess } from "@videocut/speech";

/** 用真实 PNG 的 Alpha 测量，不相信生成代码的 DOM 边界或自报“透明”。 */
export function parseMotionVisibility(output: string, frameCount: number, width: number, height: number): MotionVisibility {
  if (![frameCount, width, height].every((value) => Number.isInteger(value) && value > 0)) throw new Error("MOTION_VISIBILITY_INVALID");
  const frames: MotionVisibility["frames"] = [];
  const blocks = output.split(/(?=^frame:\d+)/mu).filter((block) => /^frame:/u.test(block));
  for (const block of blocks) {
    // RGB/RGBA 切换会重建 FFmpeg 滤镜并重置其 frame 计数；PTS 才是连续的输入帧身份。
    const frame = Number(/^frame:\d+\s+pts:\s*(-?\d+)(?:\s|$)/u.exec(block)?.[1]);
    if (frame !== frames.length || frame >= frameCount || !/^motion_alpha_frame=1\r?$/mu.test(block)) throw new Error("MOTION_VISIBILITY_INVALID");
    const entries = [...block.matchAll(/^lavfi\.bbox\.(x1|y1|w|h)=(.*)\r?$/gmu)];
    const values = Object.fromEntries(entries.map((match) => [match[1], Number(match[2])]));
    if (entries.length !== Object.keys(values).length || !Object.values(values).every((value) => Number.isInteger(value) && value >= 0)) throw new Error("MOTION_VISIBILITY_INVALID");
    if (Object.keys(values).length === 0) { frames.push(null); continue; }
    const { x1: x, y1: y, w, h } = values;
    if (Object.keys(values).length !== 4 || x === undefined || y === undefined || !w || !h || x + w > width || y + h > height) throw new Error("MOTION_VISIBILITY_INVALID");
    frames.push({ x, y, width: w, height: h });
  }
  if (frames.length !== frameCount) throw new Error("MOTION_VISIBILITY_INCOMPLETE");
  return { method: "png_alpha_bbox_v1", alphaThreshold: 1, frames };
}

export async function measureMotionVisibility(directory: string, frameCount: number, width: number, height: number): Promise<MotionVisibility> {
  // bbox 使用严格大于阈值；min_val=0 才包含 Alpha=1 的微弱可见像素。
  // 显式固定 image2 时间基准，使 PTS 0、1、2… 对应源 PNG 序号，而非业务播放时长。
  const output = await runProcess("ffmpeg", ["-hide_banner", "-v", "error", "-framerate", "1", "-i", join(directory, "frames", "frame-%05d.png"), "-vf", `trim=end_frame=${frameCount},format=rgba,alphaextract,metadata=mode=add:key=motion_alpha_frame:value=1,bbox=min_val=0,metadata=print:file=-`, "-an", "-f", "null", "-"], 120_000);
  return parseMotionVisibility(output, frameCount, width, height);
}
