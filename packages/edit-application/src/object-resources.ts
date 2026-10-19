import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, join } from "node:path";
import type { Asset, JobRecord, ProjectSnapshot } from "@videocut/contracts";
import { assetById, createMediaAsset, now } from "@videocut/domain";
import type { EditingApplication } from "./index.js";
import { RevisionConflictError } from "./persistence/index.js";
import { rasterMime } from "../../media-intelligence/src/raster-decode.js";
import { OBJECT_RESOURCE_LIMITS as limits, ObjectResourceError, objectResourceHash, objectResourceLayoutSchema, prepareObjectResourcesSchema, validateObjectResourceSpec,
  type PrepareObjectResourcesInput, type ObjectResourceSpec, type ObjectResourceLayout } from "../../media-intelligence/src/object-resources/index.js";

type FrozenSource = { id: string; assetId: string; sourceHash: string; managedPath: string };
export type ObjectResourcePayload = { requestedRevision: number; inputDigest: string; spec: ObjectResourceSpec; sources: FrozenSource[] };

export async function readObjectResourceSource(snapshot: ProjectSnapshot, asset: Asset) {
  if (asset.status !== "ready" || !["image", "derived"].includes(asset.kind) || asset.motion) throw new ObjectResourceError("OBJECT_RESOURCE_ASSET_INVALID", `素材 ${asset.id} 不是就绪静态图片`);
  const root = await realpath(snapshot.project.rootPath);
  const path = await realpath(resolve(root, asset.managedPath));
  const within = relative(root, path);
  if (within.startsWith("..") || isAbsolute(within)) throw new ObjectResourceError("OBJECT_RESOURCE_PATH_INVALID", "源图片必须位于当前项目受管目录");
  const info = await stat(path);
  if (!info.isFile() || info.size > limits.maxSourceBytes) throw new ObjectResourceError("OBJECT_RESOURCE_BYTE_LIMIT", `源 ${asset.id} 超过单文件预算或不是文件`);
  const bytes = await readFile(path);
  if (bytes.length > limits.maxSourceBytes) throw new ObjectResourceError("OBJECT_RESOURCE_BYTE_LIMIT", `源 ${asset.id} 超过单文件预算`);
  if (!rasterMime(bytes)) throw new ObjectResourceError("OBJECT_RESOURCE_FORMAT", "只支持 PNG、JPEG、WebP 原始图片");
  // 动图没有一个稳定的源状态；必须先由作者取得明确静帧，不能随机烘焙当前帧。
  const mime = rasterMime(bytes);
  if (mime === "image/png") {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = bytes.readUInt32BE(offset), type = bytes.toString("ascii", offset + 4, offset + 8);
      if (type === "acTL") throw new ObjectResourceError("OBJECT_RESOURCE_ANIMATED_IMAGE", "APNG 请先明确选择并导入静帧");
      offset += size + 12;
    }
  } else if (mime === "image/webp") {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const type = bytes.toString("ascii", offset, offset + 4), size = bytes.readUInt32LE(offset + 4);
      if (type === "ANIM" || type === "ANMF") throw new ObjectResourceError("OBJECT_RESOURCE_ANIMATED_IMAGE", "动态 WebP 请先明确选择并导入静帧");
      offset += 8 + size + (size % 2);
    }
  }
  const hash = objectResourceHash(bytes);
  if (hash !== asset.sourceHash) throw new ObjectResourceError("OBJECT_RESOURCE_SOURCE_CHANGED", `源 ${asset.id} 字节与登记哈希不同；请沿正式导入登记新源`);
  return { bytes, path, hash };
}

export async function submitObjectResources(app: EditingApplication, value: PrepareObjectResourcesInput): Promise<JobRecord> {
  const input = prepareObjectResourcesSchema.parse(value);
  const spec = validateObjectResourceSpec({ sources: input.sources, parts: input.parts, atlas: input.atlas });
  const inputDigest = objectResourceHash(JSON.stringify(spec)), key = `object-resources:${input.idempotency_key}`;
  const previous = app.repository.listJobs(input.project_id).find(j => j.idempotencyKey === key);
  if (previous) {
    if (previous.kind !== "object_resource_preparation" || previous.payload.inputDigest !== inputDigest) throw new ObjectResourceError("OBJECT_RESOURCE_IDEMPOTENCY_CONFLICT", "同一幂等键的加工输入不同");
    return previous;
  }
  const state = app.readProject(input.project_id);
  if (state.revision.number !== input.base_revision_id) throw new RevisionConflictError(input.base_revision_id, state.revision.number);
  const sources: FrozenSource[] = [];
  let totalBytes = 0;
  for (const source of spec.sources) {
    const asset = assetById(state.snapshot, source.asset_id), read = await readObjectResourceSource(state.snapshot, asset);
    totalBytes += read.bytes.length;
    if (totalBytes > limits.maxInputBytes) throw new ObjectResourceError("OBJECT_RESOURCE_BYTE_LIMIT", "输入图片总字节超过公开预算");
    sources.push({ id: source.id, assetId: asset.id, managedPath: asset.managedPath, sourceHash: read.hash });
  }
  const current = app.readProject(input.project_id);
  if (current.revision.number !== input.base_revision_id) throw new RevisionConflictError(input.base_revision_id, current.revision.number);
  const payload: ObjectResourcePayload = { requestedRevision: input.base_revision_id, inputDigest, spec, sources };
  const job = app.repository.createJob({ projectId: input.project_id, kind: "object_resource_preparation", payload, idempotencyKey: key });
  if (job.payload.inputDigest !== inputDigest) throw new ObjectResourceError("OBJECT_RESOURCE_IDEMPOTENCY_CONFLICT", "并发请求占用了同一幂等键");
  app.publish({ projectId: input.project_id, revision: current.revision.number, type: "job" });
  return job;
}

export function objectResourceAssets(job: JobRecord, layout: ObjectResourceLayout, directory: string): Asset[] {
  const payload = job.payload as ObjectResourcePayload;
  return layout.pages.map(page => {
    const asset = createMediaAsset({ name: `物件资源 ${page.id}`, kind: "image", role: "generated_visual", managedPath: `${directory}/${page.id}.png`, sourceHash: page.contentHash,
      provenance: { source: "generated", provider: "object-resources", generationJobId: job.id, acquiredAt: now(),
        objectResources: { inputHash: layout.inputHash, processorVersion: layout.processorVersion, layoutPath: `${directory}/layout.json`, pageId: page.id,
          sources: payload.sources.map(s => ({ assetId: s.assetId, sourceHash: s.sourceHash })) } } });
    // 固定 ID 让事务已提交但 Job 回执丢失的恢复可定位同一整套资源。
    asset.id = `asset_object_${objectResourceHash(`${job.id}:${page.id}`).slice(0, 32)}`;
    asset.status = "ready"; asset.metadata = { width: page.width, height: page.height, durationMs: 0, hasAudio: false, mime: "image/png" };
    return asset;
  });
}

export async function completeObjectResources(app: EditingApplication, job: JobRecord, layoutValue: ObjectResourceLayout, directory: string) {
  const layout = objectResourceLayoutSchema.parse(layoutValue), payload = job.payload as ObjectResourcePayload;
  if (job.kind !== "object_resource_preparation" || directory !== `assets/object-resources/${job.id}`) throw new ObjectResourceError("OBJECT_RESOURCE_JOB_INVALID", "资源任务或输出目录不匹配");
  if (app.trackJob(job.id).status === "cancelled") throw new ObjectResourceError("OBJECT_RESOURCE_CANCELLED", "资源任务已取消");
  const current = app.readProject(job.projectId), assets = objectResourceAssets(job, layout, directory);
  for (const page of layout.pages) {
    if (page.assetId !== assets.find(a => a.provenance?.objectResources?.pageId === page.id)?.id) throw new ObjectResourceError("OBJECT_RESOURCE_LAYOUT_INVALID", "布局与资源身份不同");
    const bytes = await readFile(join(current.snapshot.project.rootPath, directory, `${page.id}.png`));
    if (objectResourceHash(bytes) !== page.contentHash) throw new ObjectResourceError("OBJECT_RESOURCE_OUTPUT_CORRUPT", "图集内容哈希不符");
  }
  const saved = objectResourceLayoutSchema.parse(JSON.parse(await readFile(join(current.snapshot.project.rootPath, directory, "layout.json"), "utf8")));
  if (JSON.stringify(saved) !== JSON.stringify(layout)) throw new ObjectResourceError("OBJECT_RESOURCE_LAYOUT_INVALID", "配套清单与发布结果不同");
  const existing = current.snapshot.assets.filter(a => assets.some(expected => expected.id === a.id));
  let state = current;
  if (existing.length) {
    if (existing.length !== assets.length || existing.some(a => a.sourceHash !== assets.find(expected => expected.id === a.id)!.sourceHash)) throw new ObjectResourceError("OBJECT_RESOURCE_OUTPUT_CORRUPT", "已登记资源不是完整同版结果");
  } else {
    for (const source of payload.sources) {
      const asset = assetById(current.snapshot, source.assetId), read = await readObjectResourceSource(current.snapshot, asset);
      if (read.hash !== source.sourceHash || asset.managedPath !== source.managedPath) throw new ObjectResourceError("OBJECT_RESOURCE_SOURCE_CHANGED", "加工期间源素材发生变化");
    }
    if (app.trackJob(job.id).status === "cancelled") throw new ObjectResourceError("OBJECT_RESOURCE_CANCELLED", "资源任务已取消");
    // 图片与配套清单齐套后，仅在请求版本上原子登记；并发变化必须显式处理。
    state = app.repository.commit(job.projectId, payload.requestedRevision, "登记物件资源图集与布局", (snapshot, impact) => {
      snapshot.assets.push(...assets); impact.changed.push(...assets.map(a => a.id));
    });
  }
  const result = { revision: state.revision.number, assetIds: assets.map(a => a.id), inputHash: layout.inputHash,
    layoutPath: join(current.snapshot.project.rootPath, directory, "layout.json"), layout };
  app.recordJobCheckpoint(job.id, result);
  app.publish({ projectId: job.projectId, revision: state.revision.number, type: "revision" });
  return result;
}
