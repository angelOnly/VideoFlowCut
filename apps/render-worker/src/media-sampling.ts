/** 沿用视频供应器的绝对 PTS 网格；定位只减少读取量，不重置选段的采样相位。 */
export function mediaSampling(startTime: number, fps: number, startFrame: number, phase = 0, round: "up" | "near" = "up", sourceFps?: number) {
  const origin = startTime + phase / (fps * 1000);
  // near 需要目标前的一帧参与舍入，避免关键帧恰在取段起点时改变选择。
  const seekSeconds = Math.max(startTime, origin + (startFrame - (round === "near" ? 1 : 0)) / fps);
  // 正式作品的帧钟由作品规格定义；Matroska 的毫秒时间戳先还原成整数源帧。
  const clock = sourceFps ? `settb=1/${sourceFps},setpts=PTS-(${origin*sourceFps})` : `setpts=PTS-(${origin})/TB`;
  return {
    seekSeconds,
    inputArgs: ["-copyts", "-noaccurate_seek", "-seek_timestamp", "1", "-ss", String(seekSeconds)],
    // start_time 会先舍入到输入时基，near 的半帧可能因此换帧；先沿绝对网格采样，再按输出PTS裁切。
    filter: `${clock},fps=${fps}:round=${round}:eof_action=pass,trim=start_pts=${startFrame}`
  };
}
