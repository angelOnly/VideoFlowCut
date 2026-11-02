import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { JobRecord, MotionEventMap, MotionWork } from "@videocut/contracts";
import { boundMotionFontSchema, boundMotionImageSchema, boundMotionVideoSchema, motionSubmissionSchema } from "../../motion-work/src/schema.js";
import { motionHashEngine, MOTION_ENGINE_VERSION } from "../../motion-work/src/compiler.js";
import { frozenSourceDisplaySchema } from "../../contracts/src/source-display-policy.js";

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

export function motionDefinitionFromPayload(payload: JobRecord["payload"]) {
  const work = motionSubmissionSchema.parse(payload.work);
  const boundImages = boundMotionImageSchema.array().parse(payload.boundImages ?? []);
  const boundVideos = boundMotionVideoSchema.array().parse(payload.boundVideos ?? []);
  const boundFonts = boundMotionFontSchema.array().parse(payload.boundFonts ?? []);
  const sourceDisplay = payload.sourceDisplay === undefined ? undefined : frozenSourceDisplaySchema.parse(payload.sourceDisplay);
  motionHashEngine(work, boundImages, payload.version, payload.engineVersion, boundVideos, boundFonts, sourceDisplay);
  const readyRanges = (payload.readyRanges as MotionWork["readyRanges"] | undefined) ?? [{ startFrame: 0, endFrame: work.durationInFrames }];
  for (const range of readyRanges) if (!Number.isInteger(range.startFrame) || !Number.isInteger(range.endFrame) || range.startFrame < 0 || range.endFrame <= range.startFrame || range.endFrame > work.durationInFrames) throw new Error("MOTION_BUNDLE_RANGE_INVALID");
  return { work, boundImages, boundVideos, boundFonts, sourceDisplay, readyRanges, version: String(payload.version), engineVersion: MOTION_ENGINE_VERSION };
}

/** 原子保存完整固定输入；快照只引用此文件，阶段包和 Job 是来源审计。 */
export function storeMotionDefinition(root: string, job: JobRecord, eventMap?: MotionEventMap): MotionWork {
  const definition = motionDefinitionFromPayload(job.payload);
  const { work, version } = definition;
  const bytes = JSON.stringify(definition), definitionHash = digest(bytes);
  const path = `inputs/motion-work/${definitionHash}.json`;
  mkdirSync(join(root, "inputs/motion-work"), { recursive: true });
  try {
    if (readFileSync(join(root, path), "utf8") !== bytes) throw new Error("MOTION_DEFINITION_CHANGED");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const temporary = join(root, `inputs/motion-work/.${randomUUID()}.json`);
    try { writeFileSync(temporary, bytes, { flag: "wx" }); renameSync(temporary, join(root, path)); }
    finally { rmSync(temporary, { force: true }); }
  }
  const bundle = job.payload.inputBundle as { source?: MotionWork["author"]; readyRanges?: MotionWork["readyRanges"] } | undefined;
  return { id: `motion_work_${definitionHash}`, version, name: work.name, jobId: job.id, engineVersion: definition.engineVersion,
    definitionPath: path, definitionHash, width: work.width, height: work.height, fps: work.fps,
    frameCount: work.durationInFrames, compositing: work.compositing ?? "alpha", creativeBrief: work.creativeBrief,
    imageSources: definition.boundImages, videoSources: definition.boundVideos, fontSources: definition.boundFonts,
    sourceDisplay: definition.sourceDisplay, eventMap,
    readyRanges: definition.readyRanges, author: bundle?.source };
}

export function readMotionDefinition(root: string, work: MotionWork) {
  const bytes = readFileSync(join(root, work.definitionPath));
  if (digest(bytes) !== work.definitionHash) throw new Error("MOTION_DEFINITION_CHANGED");
  if (work.engineVersion !== MOTION_ENGINE_VERSION) throw new Error("MOTION_ENGINE_UPGRADE_REQUIRED");
  const definition = motionDefinitionFromPayload(JSON.parse(bytes.toString("utf8")));
  if (`motion_work_${digest(bytes)}` !== work.id || definition.version !== work.version) throw new Error("MOTION_VERSION_MISMATCH");
  return definition;
}
