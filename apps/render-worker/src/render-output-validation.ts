import { DomainError } from "@videocut/domain";
import { runMotionProcess } from "./motion-process.js";

/** FFmpeg 正常退出也可能提前读到源尾；不把不足帧的中间段发布为有效缓存。 */
export function assertEncodedFrameCount(actual: number | undefined, expected: number) {
  if (actual !== expected) throw new DomainError(`合成输出帧数不符：需要 ${expected} 帧，实际 ${actual ?? "未取得"} 帧。`, "RENDER_OUTPUT_INVALID");
}

/** 完整成片首次进入缓存前实际解码计数；后续命中仅校验缓存字节哈希。 */
export async function validateRenderOutput(path: string, expected: { width: number; height: number; fps: number; frameCount: number }, signal?: AbortSignal) {
  const probe = JSON.parse(await runMotionProcess("ffprobe", ["-v", "error", "-count_frames", "-show_streams", "-of", "json", path], signal, 30 * 60_000));
  const videos = (probe.streams ?? []).filter((stream: any) => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  const audio = (probe.streams ?? []).find((stream: any) => stream.codec_type === "audio");
  const video = videos[0];
  const [numerator, denominator] = String(video?.avg_frame_rate ?? "").split("/").map(Number);
  const fps = numerator / denominator, frameCount = Number(video?.nb_read_frames);
  if (videos.length !== 1 || video.width !== expected.width || video.height !== expected.height || !Number.isFinite(fps) || Math.abs(fps - expected.fps) > 1e-7) {
    throw new DomainError(`合成输出画幅或帧率不符：需要 ${expected.width}×${expected.height}、${expected.fps} fps。`, "RENDER_OUTPUT_INVALID");
  }
  assertEncodedFrameCount(frameCount, expected.frameCount);
  const audioDuration = Number(audio?.duration), duration = expected.frameCount / expected.fps;
  if (!(Number(audio?.nb_read_frames) > 0 && Number(audio?.sample_rate) > 0 && audio?.channels > 0) || !Number.isFinite(audioDuration) || Math.abs(audioDuration - duration) > Math.max(0.1, 1 / expected.fps)) {
    throw new DomainError("合成输出没有完整、可解码的声音流。", "RENDER_OUTPUT_INVALID");
  }
  return { frameCount, fps, width: video.width, height: video.height, audioDuration };
}
