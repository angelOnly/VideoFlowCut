import { join } from "node:path";
import type { MediaSource, SourceTimeRange } from "@videocut/contracts";
import { deriveMediaInput } from "./derive.js";
import { detectSceneBoundaries } from "./structure.js";
import { measureAudioWindow } from "./acoustics.js";

/** 对真实文件的局部硬切和单次声音起点测量，歧义时保留未知。 */
export async function measureAudioVisualTiming(source: MediaSource, range: SourceTimeRange, directory: string) {
  if (source.kind !== "video" || !source.hasAudio || !source.composition?.fps) throw new Error("声画测量需要有音轨的固定成片或预览");
  const clip = await deriveMediaInput(source, join(directory, "video"), range);
  const cuts = (await detectSceneBoundaries(clip.path)).filter(item => item.seconds > 0)
    .map(item => ({ timeMs: range.startMs + item.seconds * 1000, score: item.score }));
  const audio = await measureAudioWindow(source, range, join(directory, "audio"));
  const attacks = audio.attackCandidates.map(item => ({ timeMs: range.startMs + item.sample * 1000 / audio.sampleRate, strength: item.strength }));
  const unique = cuts.length === 1 && attacks.length === 1;
  const videoTimeMs = unique ? cuts[0].timeMs : undefined;
  const audioTimeMs = unique ? attacks[0].timeMs : undefined;
  return {
    status: unique ? "measured" as const : "inconclusive" as const,
    videoTimeMs, audioTimeMs, offsetMs: videoTimeMs !== undefined && audioTimeMs !== undefined ? audioTimeMs - videoTimeMs : undefined,
    videoResolutionMs: 1000 / source.composition.fps, audioStepMs: audio.hopSamples * 1000 / audio.sampleRate,
    cutCandidates: cuts, audioCandidates: attacks, clipPath: clip.path, mapping: clip.mapping,
    note: unique ? "差值为声音起点减画面切点，正值表示声音较晚；候选事件仍需确认身份。"
      : "未能唯一确定切点与声音起点，请缩小范围或由原作者辨认。"
  };
}
