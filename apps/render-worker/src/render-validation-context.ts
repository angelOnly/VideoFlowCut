import { createHash } from "node:crypto";
import type { ExportPurpose, ProjectSnapshot } from "@videocut/contracts";
import { readRuntimeConfig } from "@videocut/project-overview";
import { probeMedia, runProcess } from "@videocut/speech";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";

export interface ValidationContext {
  schemaVersion: 1;
  identity: string;
  probes: Record<string, Awaited<ReturnType<typeof probeMedia>>>;
  reusedProbeCount: number;
  reusedFromJobId?: string;
}
/** 跨Job只复用实际内容和探测环境一致的媒体结果；用途和质量条件仍实时计算。 */
export async function createValidationContext(snapshot: ProjectSnapshot, revision: number, purpose: ExportPurpose, previous?: ValidationContext): Promise<ValidationContext> {
  const versions = await Promise.all([runProcess("ffprobe", ["-version"]), runProcess("ffmpeg", ["-version"])]);
  const identity = createHash("sha256").update(JSON.stringify({ projectId: snapshot.project.id, revision, purpose,
    snapshot, releaseId: readRuntimeConfig().runtime.releaseId, node: process.version, versions })).digest("hex");
  return { schemaVersion: 1, identity, probes: previous?.schemaVersion === 1 && previous.identity === identity ? { ...previous.probes } : {}, reusedProbeCount: 0 };
}

export async function probeWithContext(path: string, hashes: Map<string, string>, context: ValidationContext) {
  const hash = hashes.get(path) ?? await hashMediaFile(path), key = path + ":" + hash;
  const saved = context.probes[key];
  if (saved) { context.reusedProbeCount++; return saved; }
  const metadata = await probeMedia(path);
  context.probes[key] = metadata;
  return metadata;
}
