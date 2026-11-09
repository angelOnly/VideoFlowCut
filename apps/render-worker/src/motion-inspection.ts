import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { JobRecord } from "@videocut/contracts";
import { readMotionDefinition } from "../../../packages/edit-application/src/motion-definition.js";
import { checkMotionSourceDisplay } from "../../../packages/edit-application/src/source-display-checks.js";
import { motionHashEngine } from "../../../packages/motion-work/src/compiler.js";
import { prepareMotionFonts } from "../../../packages/motion-work/src/fonts.js";
import { MotionDiagnostics } from "./motion-diagnostics.js";
import { prepareMotionImages } from "./motion-images.js";
import { inspectManagedMotionFrames } from "./motion-renderer.js";
import { prepareMotionVideos } from "./motion-video.js";
import { writeFile } from "node:fs/promises";

/** 诊断使用同一固定源码与资源；中断重领时只复用完整落盘的同版结果。 */
export async function runMotionInspectionJob(application: EditingApplication, job: JobRecord, signal?: AbortSignal): Promise<Record<string, unknown>> {
  if (job.kind !== "motion_inspection") throw new Error("MOTION_INSPECTION_JOB_INVALID");
  const revision = Number(job.payload.revision), workId = String(job.payload.workId);
  const { work } = application.readSourceMotionWork(job.projectId, workId, revision);
  if (work.version !== job.payload.workVersion || work.definitionHash !== job.payload.definitionHash) throw new Error("MOTION_VERSION_MISMATCH");
  const root = application.readProject(job.projectId, revision).snapshot.project.rootPath;
  const definition = readMotionDefinition(root, work);
  const frames = job.payload.frames as number[];
  if (!Array.isArray(frames) || !frames.length || frames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= work.frameCount
    || !work.readyRanges.some(range => range.startFrame <= frame && frame < range.endFrame))) throw new Error("MOTION_INSPECTION_RANGE_INVALID");
  const parent = join(root, "previews", "motion-inspection"), destination = join(parent, job.id);
  const readSaved = async () => {
    try {
      const saved = JSON.parse(await readFile(join(destination, "inspection.json"), "utf8"));
      if (saved.workId !== workId || saved.revision !== revision || saved.definitionHash !== work.definitionHash
        || JSON.stringify(saved.report.sampledFrames) !== JSON.stringify(frames)) throw new Error("MOTION_INSPECTION_RESULT_MISMATCH");
      return saved;
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  };
  const existing = await readSaved();
  if (existing) return existing;
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, ".inspect-"));
  const diagnostics = new MotionDiagnostics({ jobId: job.id, version: work.version });
  const activeSignal = signal ?? new AbortController().signal;
  let provider: Awaited<ReturnType<typeof prepareMotionVideos>> | undefined;
  try {
    activeSignal.throwIfAborted();
    if (definition.sourceDisplay) checkMotionSourceDisplay(definition.work.source, definition.work.props, definition.sourceDisplay);
    const canonicalRoot = await realpath(root);
    const images = Object.fromEntries(await Promise.all(definition.boundImages.map(async image => {
      const path = await realpath(resolve(root, image.managedPath));
      const child = relative(canonicalRoot, path);
      if (isAbsolute(child) || child.startsWith("..")) throw new Error("MOTION_IMAGE_PATH_REJECTED");
      const bytes = await readFile(path);
      if (createHash("sha256").update(bytes).digest("hex") !== image.hash) throw new Error("MOTION_IMAGE_CHANGED");
      return [image.slot, bytes];
    })));
    const { imageData } = await prepareMotionImages(images, join(temporary, "resources"), activeSignal, diagnostics);
    const hashEngine = motionHashEngine(definition.work, definition.boundImages, definition.version, definition.engineVersion, definition.boundVideos, definition.boundFonts, definition.sourceDisplay);
    provider = await prepareMotionVideos(root, temporary, definition.work, definition.boundVideos, hashEngine, activeSignal);
    const report = await inspectManagedMotionFrames(definition.work, temporary, frames, imageData, provider, activeSignal,
      prepareMotionFonts(definition.work, definition.boundFonts), diagnostics, definition.sourceDisplay);
    await provider.verifySources();
    if (JSON.stringify(report.events) !== JSON.stringify(work.eventMap?.events)) throw new Error("MOTION_EVENT_NONDETERMINISTIC: 指定帧检查的事件与固定版本不同");
    const result = { projectId: job.projectId, revision, workId, workVersion: work.version, definitionHash: work.definitionHash,
      evidencePath: `previews/motion-inspection/${job.id}`, report };
    await writeFile(join(temporary, "inspection.json"), JSON.stringify(result, null, 2));
    activeSignal.throwIfAborted();
    await rename(temporary, destination);
    return result;
  } finally {
    await provider?.close();
    await rm(temporary, { recursive: true, force: true });
  }
}
