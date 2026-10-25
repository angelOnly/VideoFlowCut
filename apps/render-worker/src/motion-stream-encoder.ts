import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import type { MotionSubmission } from "../../../packages/motion-work/src/schema.js";

/** 单帧写入完成才允许捕获下一帧；管道背压限制内存，进程退出释放等待者。 */
export function createMotionStreamEncoder(input: MotionSubmission, path: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const alpha = input.compositing !== "opaque";
  const child = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-vcodec", "png", "-framerate", String(input.fps), "-i", "pipe:0", "-an",
    ...(alpha ? ["-c:v", "ffv1", "-level", "3", "-pix_fmt", "bgra"] : ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart"]), path],
  { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
  let stderr = "", failure: Error | undefined;
  child.stderr.on("data", data => { stderr = (stderr + String(data)).slice(-8000); });
  child.stdin.on("error", error => { failure ??= error; });
  const done = new Promise<void>((resolve, reject) => {
    child.once("error", error => { failure = error; reject(error); });
    child.once("close", code => code === 0 ? resolve() : reject(failure ??= new Error(`MOTION_ENCODER_FAILED: ${code} ${stderr}`)));
  });
  // 捕获期间的提前退出也要被消费，下一次写入/关闭仍抛出原错误。
  void done.catch(() => {});
  const abort = () => { failure ??= new Error("MOTION_CANCELLED"); child.kill(); };
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const bounded = async <T>(operation: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => { child.kill(); reject(new Error("MOTION_ENCODER_STALLED")); }, 120_000); })]); }
    finally { if (timer) clearTimeout(timer); }
  };
  return {
    async write(png: Buffer) {
      signal?.throwIfAborted();
      if (failure) throw failure;
      await bounded(Promise.race([new Promise<void>((resolve, reject) => child.stdin.write(png, error => error ? reject(error) : resolve())), done.then(() => { throw new Error("MOTION_ENCODER_EARLY_EXIT"); })]));
    },
    async finish() { child.stdin.end(); await bounded(done); signal?.throwIfAborted(); signal?.removeEventListener("abort", abort); },
    async cancel() { child.stdin.destroy(); child.kill(); await done.catch(() => {}); signal?.removeEventListener("abort", abort); await rm(path, { force: true }); }
  };
}
