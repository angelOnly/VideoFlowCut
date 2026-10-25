import type { EditingApplication } from "@videocut/application";
import type { MotionSubmission } from "../../packages/motion-work/src/schema.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProcess } from "@videocut/speech";

/** 非渲染单测显式声明正式输出；真实渲染测试仍由 Worker 探测登记。 */
export function completeMotionFixture(app: EditingApplication, input: Omit<Parameters<EditingApplication["completeManagedMotion"]>[0], "output">) {
  const job = app.trackJob(input.jobId), work = job.payload.work as MotionSubmission;
  const directory = `assets/derived/motion/${job.id}/${job.payload.version}`;
  return app.completeManagedMotion({ ...input, output: { kind: work.compositing === "opaque" ? "opaque_video" : "alpha_video",
    path: `${directory}/${work.compositing === "opaque" ? "output.mp4" : "output.mkv"}`, hash: input.sourceHash,
    codec: work.compositing === "opaque" ? "h264" : "ffv1", pixelFormat: work.compositing === "opaque" ? "yuv420p" : "bgra" },
    preview: { path: `${directory}/preview.mp4`, hash: input.sourceHash } });
}

/** 回归测试观察正式媒体，不再假设全部 PNG 常驻。 */
export async function readOutputFrame(path: string, frame: number): Promise<Buffer> {
  const directory = await mkdtemp(join(tmpdir(), "vfc-test-frame-"));
  try {
    const output = join(directory, "frame.png");
    await runProcess("ffmpeg", ["-v", "error", "-i", path, "-vf", `select=eq(n\\,${frame})`, "-frames:v", "1", "-pix_fmt", "rgba", output]);
    return await readFile(output);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
