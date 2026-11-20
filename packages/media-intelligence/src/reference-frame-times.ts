import { runProcess } from "@videocut/speech";
import { DomainError } from "@videocut/domain";

/** 返回起点正在显示的帧和区间内后续源帧；无关范围的缺失时间戳不阻断本次观察。 */
export async function referenceFrameTimes(path: string, range: { startMs: number; endMs: number }) {
  const data = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries",
    "format=start_time:stream=avg_frame_rate,time_base,start_pts,duration_ts:frame=best_effort_timestamp,best_effort_timestamp_time,pkt_duration", "-of", "json", path], 120_000));
  const origin = Number(data.format?.start_time ?? 0);
  const stream = data.streams?.[0];
  const [numerator, denominator] = String(stream?.time_base ?? "").split("/").map(Number);
  if (!Number.isFinite(origin) || !numerator || !denominator || !Array.isArray(data.frames)) throw new Error("原片缺少可用的视频时间信息");
  // 保留源流整数 PTS，避免 ffprobe 的小数秒精度改变帧边界。
  const pts: number[] = data.frames.map((frame: { best_effort_timestamp?: string | number }) => frame.best_effort_timestamp === undefined ? NaN : Number(frame.best_effort_timestamp));
  const times = pts.map(value => Number.isSafeInteger(value) ? value * numerator / denominator : NaN);
  const start = origin + range.startMs / 1000, end = origin + range.endMs / 1000;
  let leadingIndex = -1;
  for (let i = 0; i < times.length; i++) if (Number.isFinite(times[i]) && times[i] <= start + 0.0000001) leadingIndex = i;
  if (leadingIndex < 0) throw new DomainError(`参考画面缺失 ${(range.startMs).toFixed(3)}–${Math.min(range.endMs, ((times.find(Number.isFinite) ?? end) - origin) * 1000).toFixed(3)} 毫秒`, "MOTION_REFERENCE_VIDEO_COVERAGE_MISSING");
  let afterIndex = times.findIndex((time: number, index: number) => index > leadingIndex && Number.isFinite(time) && time >= end - 0.0000001);
  if (afterIndex < 0) afterIndex = times.length;
  const relevant = times.slice(leadingIndex, afterIndex);
  if (relevant.some((time: number) => !Number.isFinite(time))) throw new Error("所选范围的画面缺少时间戳，无法确认连续覆盖");
  const last = data.frames.at(-1);
  const lastPts = Number(last?.best_effort_timestamp), lastDuration = Number(last?.pkt_duration);
  const streamStart = Number(stream?.start_pts), streamDuration = Number(stream?.duration_ts);
  const frameEnd = Number.isFinite(lastPts) && lastDuration > 0 ? (lastPts + lastDuration) * numerator / denominator : NaN;
  const streamEnd = Number.isFinite(streamStart) && streamDuration > 0 ? (streamStart + streamDuration) * numerator / denominator : NaN;
  const coverageEnd = Math.max(...[frameEnd, streamEnd].filter(Number.isFinite));
  if (!Number.isFinite(coverageEnd) || end > coverageEnd + numerator / denominator / 2) {
    const missingStart = Number.isFinite(coverageEnd) ? Math.max(range.startMs, (coverageEnd - origin) * 1000) : range.startMs;
    throw new DomainError(`参考画面缺失或无法确认 ${missingStart.toFixed(3)}–${range.endMs.toFixed(3)} 毫秒`, "MOTION_REFERENCE_VIDEO_COVERAGE_MISSING");
  }
  return { origin, frameRate: data.streams?.[0]?.avg_frame_rate as string | undefined,
    timeBase: String(stream.time_base), coverageStart: times.find(Number.isFinite)!, coverageEnd, leadingPts: pts[leadingIndex]!, endPts: Math.ceil(end * denominator / numerator - 1e-7),
    timestamps: [times[leadingIndex] as number, ...relevant.slice(1).filter((time: number) => time > start + 0.0000001 && time < end - 0.0000001)] };
}
