import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probeMedia, runProcess } from "@videocut/speech";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";
import { readCreativeCase } from "../../../references/motion-cases/skillry/tools/creative-library.mjs";
import { libraryVideo } from "../../../references/motion-cases/skillry/tools/library-store.mjs";
import { referenceFrameTimes } from "../../../packages/media-intelligence/src/reference-frame-times.js";

/** 仅按需解码短窗中的每个源帧，不把连续帧误写成模型实际输入。 */
export async function referenceFrames(root: string, request: { id: string; source_sha256: string; range: { startMs: number; endMs: number } }) {
  const { id, source_sha256, range } = request;
  if (range.endMs - range.startMs > 2000) throw new Error("连续帧核查一次最多 2 秒，请缩小范围");
  const creative = id.includes("-c") ? readCreativeCase(root, { id, source_sha256, include_storyboard: false }) : undefined;
  const path = creative ? (creative.result.resources as { video: { absolute_path?: string } }).video.absolute_path : libraryVideo(root, id, source_sha256);
  if (!path) throw new Error(`参考 ${id} 原片不可读取`);
  const metadata = await probeMedia(path);
  if (range.endMs > metadata.durationMs) throw new Error(`参考 ${id} 的范围超出原片`);
  const sourceHash = await hashMediaFile(path);
  const {origin, timestamps, frameRate, leadingPts, endPts} = await referenceFrameTimes(path, range);
  if (timestamps.length > 96) throw new Error("所选范围超过 96 帧，请缩小范围以逐帧核查");
  const directory = await mkdtemp(join(tmpdir(), "vfc-reference-frames-"));
  try {
    await runProcess("ffmpeg", ["-v", "error", "-nostdin", "-copyts", "-i", path, "-map", "0:v:0", "-vf",
      `trim=start_pts=${leadingPts}:end_pts=${endPts},scale=w='min(960,iw)':h=-2`, "-fps_mode", "passthrough", "-q:v", "4", join(directory, "%04d.jpg")]);
    const files = (await readdir(directory)).filter(name => /^\d{4}\.jpg$/u.test(name)).sort();
    if (files.length !== timestamps.length || await hashMediaFile(path) !== sourceHash) throw new Error("源帧与时间戳数量不一致或原片发生变化，请重新核查");
    const frames = await Promise.all(files.map(async (file, index) => ({ source_ms: Math.round((timestamps[index]! - origin) * 1_000_000) / 1000,
      data: (await readFile(join(directory, file))).toString("base64") })));
    return { id, source_sha256, source_hash: sourceHash, range, frame_count: frames.length,
      first_source_ms: frames[0]!.source_ms, last_source_ms: frames.at(-1)!.source_ms, frame_rate: frameRate,
      observation: "连续返回起点正在显示的源帧及区间内全部可解码源帧；首帧时间戳可能早于选段起点。此结果不代表模型看到这些帧，声音请在同范围播放原片核查。", frames };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
