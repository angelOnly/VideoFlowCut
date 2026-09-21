import { motionDecodeDimensions, probeMotionVideoGeometry } from "./motion-video-geometry.js";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, realpath, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { PNG } from "pngjs";
import { probeMedia } from "@videocut/speech";
import type { BoundMotionVideo, DecodedMotionVideo, MotionSubmission } from "../../../packages/motion-work/src/schema.js";

export async function hashMotionFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

/** 正常速度按目标帧率重采样；VFR 的时间戳交给 FFmpeg，不能按源帧号猜测时间。 */
export async function prepareMotionVideos(root: string, directory: string, work: MotionSubmission, bindings: BoundMotionVideo[], engineVersion = "managed-motion-8"): Promise<Record<string, DecodedMotionVideo>> {
  const modern = engineVersion === "managed-motion-8";
  if (!modern && !["managed-motion-7", "managed-motion-6", "managed-motion-5", "managed-motion-4", "managed-motion-3"].includes(engineVersion)) throw new Error("MOTION_ENGINE_UNSUPPORTED");
  if (!modern && bindings.some(b => b.decodeScale !== undefined)) throw new Error("MOTION_LEGACY_SCALE_UNSUPPORTED: 请生成新版本");
  const result: Record<string, DecodedMotionVideo> = {};
  const plans: Array<{ binding: BoundMotionVideo; resource: string; width: number; height: number; count: number; geometry?: Awaited<ReturnType<typeof probeMotionVideoGeometry>> }> = [];
  let sourceBytes = 0, decodedBytes = 0, pixelFrames = 0;
  for (const binding of bindings) {
    const source = await realpath(resolve(root, binding.managedPath));
    const rel = relative(await realpath(root), source);
    if (isAbsolute(rel) || rel.startsWith("..")) throw new Error("MOTION_VIDEO_PATH_REJECTED");
    const info = await stat(source);
    sourceBytes += info.size;
    if (!info.isFile() || sourceBytes > 512 * 1024 * 1024) throw new Error(`MOTION_VIDEO_SOURCE_BUDGET: 槽位${binding.slot}文件${info.size}字节，合计${sourceBytes}超过512MB；缩短选段不会减少文件字节`);
    const resource = join(directory, "resources", `video-${binding.slot}`);
    await mkdir(join(directory, "resources"), { recursive: true });
    await copyFile(source, resource);
    if (await hashMotionFile(resource) !== binding.hash) throw new Error("MOTION_VIDEO_CHANGED");
    const geometry = modern ? await probeMotionVideoGeometry(resource) : undefined;
    const metadata = geometry ? { width: geometry.encodedWidth, height: geometry.encodedHeight, durationMs: geometry.durationMs } : await probeMedia(resource);
    if (!metadata.width || !metadata.height || !metadata.durationMs || binding.sourceEndMs > metadata.durationMs || binding.sourceEndMs <= binding.sourceStartMs) throw new Error("MOTION_VIDEO_SOURCE_RANGE: 源范围超出可播放视频");
    if (geometry && binding.sourceEndMs > geometry.durationMs + 0.01) throw new Error("MOTION_VIDEO_SOURCE_RANGE");
    const scale = Math.min(1, work.width / metadata.width, work.height / metadata.height);
    const { width, height } = geometry ? motionDecodeDimensions(geometry, work, binding.decodeScale) : { width: Math.max(2, Math.floor(metadata.width * scale / 2) * 2), height: Math.max(2, Math.floor(metadata.height * scale / 2) * 2) };
    const count = Math.ceil((binding.sourceEndMs - binding.sourceStartMs) * work.fps / 1000);
    pixelFrames += width * height * count;
    if (pixelFrames > 650_000_000) throw new Error(`MOTION_VIDEO_DECODE_BUDGET: 槽位${binding.slot} ${width}×${height}×${count}帧，合计${pixelFrames}超过650000000`);
    plans.push({ binding, resource, width, height, count, geometry });
  }
  // 所有槽位通过文件、范围、几何和累计预算后才开始解码。
  for (const { binding, resource, width, height, count, geometry } of plans) {
    const framesDir = join(directory, "decoded-video", binding.slot);
    await mkdir(framesDir, { recursive: true });
    const framePaths: string[] = [];
    const child = spawn("ffmpeg", ["-v", "error", "-nostdin", ...(modern ? ["-noautorotate"] : []), "-i", resource, ...(geometry ? ["-map", `0:${geometry.streamIndex}`] : []), "-an", "-sn", "-dn", "-vf", `trim=start=${binding.sourceStartMs / 1000}:end=${binding.sourceEndMs / 1000},setpts=PTS-STARTPTS,fps=${work.fps}:start_time=0:eof_action=pass,scale=${geometry && geometry.rotation % 180 ? height : width}:${geometry && geometry.rotation % 180 ? width : height},setsar=1${geometry?.rotation === 90 ? ",transpose=cclock" : geometry?.rotation === 180 ? ",hflip,vflip" : geometry?.rotation === 270 ? ",transpose=clock" : ""}`, "-frames:v", String(count), "-pix_fmt", "rgba", "-f", "rawvideo", "pipe:1"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "", timedOut = false;
    child.stderr.on("data", bytes => { stderr = (stderr + String(bytes)).slice(-4000); });
    const done = new Promise<void>((resolveDone, reject) => { child.once("error", reject); child.once("close", code => code === 0 ? resolveDone() : reject(new Error(timedOut ? "MOTION_VIDEO_DECODE_TIMEOUT" : `MOTION_VIDEO_DECODE_FAILED: ${stderr}`))); });
    void done.catch(() => undefined);
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 120_000);
    const frameBytes = width * height * 4;
    let pending = Buffer.alloc(0);
    try {
      // stdout 流式读取并受写盘背压约束，不把整段视频展开到内存。
      for await (const chunk of child.stdout) {
        pending = Buffer.concat([pending, chunk]);
        while (pending.length >= frameBytes) {
          if (framePaths.length >= count) throw new Error("MOTION_VIDEO_FRAME_COUNT");
          const png = new PNG({ width, height });
          png.data = pending.subarray(0, frameBytes);
          const bytes = PNG.sync.write(png, { colorType: 6, deflateLevel: 3 });
          pending = pending.subarray(frameBytes);
          decodedBytes += bytes.length;
          if (decodedBytes > 512 * 1024 * 1024) throw new Error("MOTION_VIDEO_DECODE_BUDGET: 解码帧超过512MB");
          const path = join(framesDir, `${framePaths.length}.png`);
          await writeFile(path, bytes, { flag: "wx" });
          framePaths.push(path);
        }
      }
      await done;
      if (timedOut) throw new Error("MOTION_VIDEO_DECODE_TIMEOUT");
      if (pending.length || framePaths.length !== count) throw new Error(`MOTION_VIDEO_SOURCE_SHORT: 需要${count}帧，实际${framePaths.length}帧，不自动冻结或循环`);
    } finally { clearTimeout(timer); child.kill(); await done.catch(() => undefined); }
    result[binding.slot] = { framePaths, width, height, ...(geometry ? { geometry } : {}), ...(binding.decodeScale !== undefined ? { decodeScale: binding.decodeScale } : {}) };
  }
  return result;
}
