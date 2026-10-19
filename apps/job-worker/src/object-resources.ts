import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import type { EditingApplication } from "@videocut/application";
import type { JobRecord } from "@videocut/contracts";
import { assetById } from "@videocut/domain";
import { probeMedia } from "@videocut/speech";
import { completeObjectResources, objectResourceAssets, readObjectResourceSource, type ObjectResourcePayload } from "../../../packages/edit-application/src/object-resources.js";
import { decodeRasterImages } from "../../../packages/media-intelligence/src/raster-decode.js";
import { OBJECT_RESOURCE_LIMITS as limits, ObjectResourceError, objectResourceCapabilities, objectResourceLayoutSchema, prepareObjectResourcePixels,
  type NormalizedObjectSource } from "../../../packages/media-intelligence/src/object-resources/index.js";

export async function runObjectResources(app: EditingApplication, job: JobRecord, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const payload = job.payload as ObjectResourcePayload;
  const state = app.readProject(job.projectId), directory = `assets/object-resources/${job.id}`;
  const target = join(state.snapshot.project.rootPath, directory);
  signal?.throwIfAborted();
  const published = await stat(target).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return undefined; throw error; });
  if (published) {
    // 发布后崩溃继续读取原目录，校验整套结果；不覆盖已有产物。
    const layout = objectResourceLayoutSchema.parse(JSON.parse(await readFile(join(target, "layout.json"), "utf8")));
    return completeObjectResources(app, job, layout, directory);
  }
  const images: Record<string, Buffer> = {}, hashes: Record<string, string> = {};
  let totalPixels = 0, totalBytes = 0;
  for (const source of payload.sources) {
    signal?.throwIfAborted();
    const asset = assetById(state.snapshot, source.assetId);
    const read = await readObjectResourceSource(state.snapshot, asset);
    if (read.hash !== source.sourceHash || asset.managedPath !== source.managedPath) throw new ObjectResourceError("OBJECT_RESOURCE_SOURCE_CHANGED", "源图已改变，不能重放旧加工输入");
    // 在浏览器分配解码画布之前探测真实原图，不能只相信导入时的 metadata。
    const metadata = await probeMedia(read.path);
    const pixels = (metadata.width ?? 0) * (metadata.height ?? 0);
    totalPixels += pixels; totalBytes += read.bytes.length;
    if (!pixels || pixels > limits.maxSourcePixels || totalPixels > limits.maxTotalSourcePixels || totalBytes > limits.maxInputBytes) throw new ObjectResourceError("OBJECT_RESOURCE_PIXEL_LIMIT", "真实源图尺寸或总输入超过公开预算");
    images[source.id] = read.bytes; hashes[source.id] = read.hash;
  }
  const decoded = await decodeRasterImages(images, signal, limits.maxSourcePixels);
  const normalized: Record<string, NormalizedObjectSource> = {};
  for (const [id, item] of Object.entries(decoded)) {
    const png = PNG.sync.read(item.bytes);
    normalized[id] = { width: png.width, height: png.height, data: png.data, sourceHash: hashes[id]!, normalization: `${objectResourceCapabilities.normalization}:${item.decoder}` };
  }
  signal?.throwIfAborted();
  try {
    const output = prepareObjectResourcePixels(payload.spec, normalized);
    const assets = objectResourceAssets(job, output.layout, directory);
    for (const page of output.layout.pages) page.assetId = assets.find(a => a.provenance?.objectResources?.pageId === page.id)!.id;
    const temporary = `${target}.pending`;
    // 临时目录仅属于这个 Job；齐套写入后同文件系统原子发布。
    await rm(temporary, { recursive: true, force: true });
    await mkdir(temporary, { recursive: true });
    try {
      for (const page of output.pages) await writeFile(join(temporary, `${page.id}.png`), page.bytes);
      await writeFile(join(temporary, "layout.json"), JSON.stringify(output.layout, null, 2));
      signal?.throwIfAborted();
      await rename(temporary, target);
    } finally { await rm(temporary, { recursive: true, force: true }); }
    return await completeObjectResources(app, job, output.layout, directory);
  } catch (error) {
    if (error instanceof ObjectResourceError) app.recordJobCheckpoint(job.id, { objectResourceFailure: { code: error.code, message: error.message, ...error.details } });
    throw error;
  }
}
