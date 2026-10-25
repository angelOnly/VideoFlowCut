import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { runProcess } from "@videocut/speech";
import type { Asset } from "@videocut/contracts";

/** 服务和离线合成共用：正式文件按帧解码，PNG 仅在有界 LRU 中存活。 */
export class MotionFrameCache {
  private memory = new Map<string, Buffer>();
  private bytes = 0;
  private verified = new Map<string, string>();
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly maximumBytes = 64 * 1024 * 1024) {}
  get(root: string, asset: Asset, hash: string, frame: number): Promise<Buffer> {
    const task = this.queue.then(() => this.read(root, asset, hash, frame));
    this.queue = task.catch(() => {});
    return task;
  }
  clear() { this.memory.clear(); this.bytes = 0; this.verified.clear(); }
  private async read(root: string, asset: Asset, hash: string, frame: number): Promise<Buffer> {
    const motion = asset.motion, output = motion?.output;
    if (!motion || !output || hash !== output.hash || !Number.isInteger(frame) || frame < 0 || frame >= motion.frameCount) throw new Error("MOTION_FRAME_RANGE_INVALID");
    const path = resolve(root, output.path), rel = relative(resolve(root), path);
    if (isAbsolute(rel) || rel.startsWith("..")) throw new Error("MOTION_MEDIA_PATH_INVALID");
    const info = await stat(path), identity = `${info.size}:${info.mtimeMs}:${info.ctimeMs}:${hash}`;
    if (this.verified.get(path) !== identity) {
      const digest = createHash("sha256");
      for await (const chunk of createReadStream(path)) digest.update(chunk);
      if (digest.digest("hex") !== hash) throw new Error("MOTION_OUTPUT_CHANGED");
      this.verified.set(path, identity);
      if (this.verified.size > 128) this.verified.delete(this.verified.keys().next().value!);
    }
    const key = `${hash}:${frame}`;
    const hit = this.memory.get(key);
    if (hit) { this.memory.delete(key); this.memory.set(key, hit); return hit; }
    // 窗口工作集最多 32 MiB；结束即删除临时盘，不形成永久图片仓库。
    const count = Math.min(motion.frameCount - frame, Math.max(1, Math.min(8, Math.floor(32 * 1024 * 1024 / (motion.width * motion.height * 4)))));
    const directory = await mkdtemp(join(tmpdir(), "vfc-motion-frames-"));
    try {
      await runProcess("ffmpeg", ["-v", "error", "-threads", "1", "-ss", String(frame / motion.fps), "-i", path, "-map", "0:v:0", "-an", "-frames:v", String(count), "-pix_fmt", "rgba", "-start_number", String(frame), join(directory, "%d.png")], 120_000);
      let result!: Buffer;
      for (let f = frame; f < frame + count; f++) {
        const bytes = await readFile(join(directory, `${f}.png`));
        if (f === frame) result = bytes;
        const id = `${hash}:${f}`;
        const old = this.memory.get(id);
        if (old) this.bytes -= old.length;
        this.memory.delete(id);
        while (this.bytes + bytes.length > this.maximumBytes && this.memory.size) {
          const oldest = this.memory.keys().next().value!;
          this.bytes -= this.memory.get(oldest)!.length; this.memory.delete(oldest);
        }
        if (bytes.length <= this.maximumBytes) { this.memory.set(id, bytes); this.bytes += bytes.length; }
      }
      return result;
    } finally { await rm(directory, { recursive: true, force: true }); }
  }
}
