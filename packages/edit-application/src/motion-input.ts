import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve, isAbsolute } from "node:path";
import { z } from "zod";
import { motionSubmissionSchema, type MotionSubmission } from "../../motion-work/src/schema.js";
import { validateMotionSource } from "../../motion-work/src/compiler.js";

const digest = z.string().regex(/^[a-f0-9]{64}$/u);
const range = z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict()
  .refine(value => value.endFrame > value.startFrame, "范围必须非空");
export const authoredMotionManifestSchema = z.object({
  authorSubmissionId: z.string().min(1).max(160), sourceFile: z.string().min(1), sourceSha256: digest,
  work: z.record(z.unknown()), readyRanges: z.array(range).min(1),
  changedRanges: z.array(z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(), reason: z.string().min(1) }).strict())
}).strict();
const part = z.object({ sha256: digest, bytes: z.number().int().nonnegative() }).strict();
export const frozenMotionBundleSchema = z.object({
  receipt: z.object({ project: z.string().min(1), run_id: z.string().min(1), frozen_version: z.string().min(1), bundle_sha256: digest, source: part, manifest: part }).strict(),
  source_base64: z.string(), manifest_base64: z.string()
}).strict();
export type FrozenMotionBundle = z.infer<typeof frozenMotionBundleSchema>;
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
/** 跨服务固定顺序的内容身份，不使用可变文件名。 */
export function motionBundleHash(source: { sha256: string; bytes: number }, manifest: { sha256: string; bytes: number }): string {
  return hash(JSON.stringify({ source: { sha256: source.sha256, bytes: source.bytes }, manifest: { sha256: manifest.sha256, bytes: manifest.bytes } }));
}
function decode(value: string): Buffer {
  const decoded = Buffer.from(value, "base64");
  if (decoded.toString("base64") !== value) throw new Error("MOTION_BUNDLE_BASE64_INVALID");
  return decoded;
}
function checkedParts(bundle: FrozenMotionBundle) {
  const source = decode(bundle.source_base64), manifestBytes = decode(bundle.manifest_base64), receipt = bundle.receipt;
  if (source.length !== receipt.source.bytes || manifestBytes.length !== receipt.manifest.bytes || hash(source) !== receipt.source.sha256 || hash(manifestBytes) !== receipt.manifest.sha256 || motionBundleHash(receipt.source, receipt.manifest) !== receipt.bundle_sha256) throw new Error("MOTION_BUNDLE_IDENTITY_MISMATCH");
  const manifest = authoredMotionManifestSchema.parse(JSON.parse(manifestBytes.toString("utf8")));
  if (manifest.sourceSha256 !== receipt.source.sha256) throw new Error("MOTION_BUNDLE_SOURCE_MISMATCH");
  if ("source" in manifest.work || "previousAssetId" in manifest.work || "renderedAssetId" in manifest.work) throw new Error("MOTION_BUNDLE_AUTHOR_FIELD_INVALID");
  const work = motionSubmissionSchema.parse({ ...manifest.work, source: source.toString("utf8") });
  for (const item of [...manifest.readyRanges, ...manifest.changedRanges]) if (item.endFrame > work.durationInFrames || item.endFrame <= item.startFrame) throw new Error("MOTION_BUNDLE_RANGE_INVALID");
  validateMotionSource(work.source, work);
  return { source, manifestBytes, manifest, work };
}

/** 只保存受管输入；不创建素材、版本或生成任务。 */
export async function importMotionBundle(root: string, projectId: string, idempotencyKey: string, raw: unknown) {
  const bundle = frozenMotionBundleSchema.parse(raw), { source, manifestBytes } = checkedParts(bundle);
  const parent = join(root, "inputs", "motion"), requests = join(parent, ".requests");
  await mkdir(requests, { recursive: true });
  const requestPath = join(requests, `${hash(idempotencyKey)}.json`);
  const requestIdentity = JSON.stringify({ projectId, key: idempotencyKey, receipt: bundle.receipt });
  const requestTemporary = join(requests, `.request-${randomUUID()}`);
  try {
    await writeFile(requestTemporary, requestIdentity, { flag: "wx" });
    try { await link(requestTemporary, requestPath); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (await readFile(requestPath, "utf8") !== requestIdentity) throw new Error("MOTION_BUNDLE_IDEMPOTENCY_CONFLICT");
    }
  } finally { await rm(requestTemporary, { force: true }); }
  const name = bundle.receipt.bundle_sha256, destination = join(parent, name);
  let reused = false;
  let sourceReceipt = bundle.receipt;
  try {
    const oldSource = await readFile(join(destination, "source.html")), oldManifest = await readFile(join(destination, "manifest.json"));
    if (!oldSource.equals(source) || !oldManifest.equals(manifestBytes)) throw new Error("MOTION_BUNDLE_STORED_MISMATCH");
    sourceReceipt = frozenMotionBundleSchema.shape.receipt.parse(JSON.parse(await readFile(join(destination, "receipt.json"), "utf8")));
    reused = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const temporary = await mkdtemp(join(parent, ".motion-import-"));
    try {
      await writeFile(join(temporary, "source.html"), source);
      await writeFile(join(temporary, "manifest.json"), manifestBytes);
      await writeFile(join(temporary, "receipt.json"), JSON.stringify(bundle.receipt));
      try { await rename(temporary, destination); }
      catch (renameError) {
        if (!["EEXIST", "ENOTEMPTY", "EPERM"].includes((renameError as NodeJS.ErrnoException).code ?? "")) throw renameError;
        const oldSource = await readFile(join(destination, "source.html")), oldManifest = await readFile(join(destination, "manifest.json"));
        if (!oldSource.equals(source) || !oldManifest.equals(manifestBytes)) throw new Error("MOTION_BUNDLE_STORED_MISMATCH");
        sourceReceipt = frozenMotionBundleSchema.shape.receipt.parse(JSON.parse(await readFile(join(destination, "receipt.json"), "utf8")));
        reused = true;
      }
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
  return { project_id: projectId, bundle_path: `inputs/motion/${name}`, bundle_sha256: name, manifest_sha256: bundle.receipt.manifest.sha256, source_receipt: sourceReceipt, reused };
}

/** 在创建 Job 前固定字节并重新校验；后台不会读取后续变化的路径。 */
export async function readFrozenMotionWork(root: string, bundlePath: string, manifestSha256: string): Promise<{ work: MotionSubmission; readyRanges: Array<{ startFrame: number; endFrame: number }>; inputBundle: { bundlePath: string; bundleSha256: string; manifestSha256: string; source: { project: string; run_id: string; frozen_version: string } } }> {
  const name = bundlePath.replaceAll("\\", "/");
  if (!/^inputs\/motion\/[a-f0-9]{64}$/u.test(name)) throw new Error("MOTION_BUNDLE_PATH_INVALID");
  const directory = resolve(root, name), child = relative(resolve(root), directory);
  if (isAbsolute(child) || child.startsWith("..")) throw new Error("MOTION_BUNDLE_PATH_INVALID");
  const source = await readFile(join(directory, "source.html")), manifest = await readFile(join(directory, "manifest.json"));
  const receipt = frozenMotionBundleSchema.shape.receipt.parse(JSON.parse(await readFile(join(directory, "receipt.json"), "utf8")));
  const sourceInfo = { sha256: hash(source), bytes: source.length }, manifestInfo = { sha256: hash(manifest), bytes: manifest.length };
  if (manifestInfo.sha256 !== manifestSha256 || motionBundleHash(sourceInfo, manifestInfo) !== name.slice(-64) || receipt.bundle_sha256 !== name.slice(-64) || JSON.stringify(receipt.source) !== JSON.stringify(sourceInfo) || JSON.stringify(receipt.manifest) !== JSON.stringify(manifestInfo)) throw new Error("MOTION_BUNDLE_STORED_MISMATCH");
  const { work, manifest: parsed } = checkedParts({ receipt: { project: "verified", run_id: "verified", frozen_version: "verified", bundle_sha256: name.slice(-64), source: sourceInfo, manifest: manifestInfo }, source_base64: source.toString("base64"), manifest_base64: manifest.toString("base64") });
  return { work, readyRanges: parsed.readyRanges, inputBundle: { bundlePath: name, bundleSha256: receipt.bundle_sha256, manifestSha256, source: { project: receipt.project, run_id: receipt.run_id, frozen_version: receipt.frozen_version } } };
}
