import { runProcess } from "@videocut/speech";

/** 返回起点正在显示的帧和区间内后续源帧；无关范围的缺失时间戳不阻断本次观察。 */
export async function referenceFrameTimes(path: string, range: { startMs: number; endMs: number }) {
  const data = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries",
    "format=start_time:stream=avg_frame_rate:frame=best_effort_timestamp_time", "-of", "json", path], 120_000));
  const origin = Number(data.format?.start_time ?? 0);
  if (!Number.isFinite(origin) || !Array.isArray(data.frames)) throw new Error("原片缺少可用的视频时间信息");
  const times = data.frames.map((frame: { best_effort_timestamp_time?: string }) => frame.best_effort_timestamp_time === undefined ? NaN : Number(frame.best_effort_timestamp_time));
  const start = origin + range.startMs / 1000, end = origin + range.endMs / 1000;
  let leadingIndex = -1;
  for (let i = 0; i < times.length; i++) if (Number.isFinite(times[i]) && times[i] <= start + 0.0000001) leadingIndex = i;
  if (leadingIndex < 0) throw new Error("参考起点没有正在显示的源帧，请调整范围");
  let afterIndex = times.findIndex((time: number, index: number) => index > leadingIndex && Number.isFinite(time) && time >= end - 0.0000001);
  if (afterIndex < 0) afterIndex = times.length;
  const relevant = times.slice(leadingIndex, afterIndex);
  if (relevant.some((time: number) => !Number.isFinite(time))) throw new Error("所选范围的画面缺少时间戳，无法确认连续覆盖");
  return { origin, frameRate: data.streams?.[0]?.avg_frame_rate as string | undefined,
    timestamps: [times[leadingIndex] as number, ...relevant.slice(1).filter((time: number) => time > start + 0.0000001 && time < end - 0.0000001)] };
}
