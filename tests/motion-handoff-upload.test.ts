import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { deliverMotionHandoff, projectRangeToWorkRoot, verifyMotionStageVideoSources } from "../apps/runtime/src/motion-authoring.js";
import type { ReferenceManifest } from "../packages/edit-application/src/opendesign-reference-package.mjs";

test("按固定清单向 OD 补齐文件，长路径和失败重试均可用", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-handoff-upload-"));
  const source = join(root, "source"), destination = join(root, "od");
  const longPath = `handoffs/a/${Array.from({ length: 5 }, (_, index) => `目录${index}${"a".repeat(40)}`).join("/")}/参考.md`;
  const content = new Map([["handoffs/a/brief.md", "导演稿"], ["handoffs/a/clip.mp4", "真实素材"], ["handoffs/a/timing.md", "时间安排"], [longPath, "原片参考"]]);
  const uploaded = new Map<string, number>();
  let failTiming = true;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_request, options) => {
    if (!options?.method || options.method === "GET") {
      const files = [];
      for (const path of content.keys()) {
        const localPath = join(destination, path);
        if (await readFile(localPath).then(() => true, () => false)) files.push({ path, localPath });
      }
      return Response.json({ files });
    }
    const form = options.body as FormData, path = String(form.get("name"));
    uploaded.set(path, (uploaded.get(path) ?? 0) + 1);
    if (path.endsWith("timing.md") && failTiming) return new Response("临时失败", { status: 503 });
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("缺少上传文件");
    const localPath = join(destination, path);
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, Buffer.from(await file.arrayBuffer()));
    return Response.json({ file: { path } });
  }) as typeof fetch;
  try {
    for (const [path, value] of content) {
      await mkdir(dirname(join(source, path)), { recursive: true });
      await writeFile(join(source, path), value);
    }
    await mkdir(join(destination, "handoffs", "a"), { recursive: true });
    await writeFile(join(destination, "handoffs/a/brief.md"), content.get("handoffs/a/brief.md")!);
    await writeFile(join(destination, "handoffs/a/clip.mp4"), "旧内容");
    const manifest: ReferenceManifest = { projectId: "project", revision: 1, packageRoot: source, diagnostics: [],
      files: [...content].map(([path, value]) => ({ sourcePath: join(source, path), deliveredPath: path,
        sha256: createHash("sha256").update(value).digest("hex"), localReadable: true, uses: [] })) };
    const endpoint = { url: "http://isolated-od.invalid" };
    await assert.rejects(deliverMotionHandoff(endpoint, "od", manifest, new AbortController().signal), /503/);
    failTiming = false;
    const result = await deliverMotionHandoff(endpoint, "od", manifest, new AbortController().signal);
    assert.equal(result.files.length, 4);
    assert.equal(uploaded.get("handoffs/a/brief.md"), undefined);
    assert.equal(uploaded.get("handoffs/a/clip.mp4"), 1);
    assert.equal(uploaded.get("handoffs/a/timing.md"), 2);
    assert.equal(await readFile(join(destination, "handoffs/a/clip.mp4"), "utf8"), content.get("handoffs/a/clip.mp4"));
    assert.equal(await readFile(join(destination, longPath), "utf8"), "原片参考");
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});

test("阶段回执把非零成片起点换算为作品根帧", () => {
  const target = { startFrame: 100, endFrame: 150, sourceStartFrame: 0, sourceEndFrame: 50 };
  assert.deepEqual(projectRangeToWorkRoot({ startFrame: 100, endFrame: 125 }, target, 25, 25), { startFrame: 0, endFrame: 25 });
  assert.deepEqual(projectRangeToWorkRoot({ startFrame: 125, endFrame: 150 }, target, 25, 50), { startFrame: 50, endFrame: 99 });
});

test("阶段素材只在实际发布的目标范围内核对导演采用的源段", () => {
  const target = { startFrame: 100, endFrame: 125, sourceStartFrame: 0, sourceEndFrame: 25 };
  const work = { fps: 25, videoBindings: {
    actor: { assetId: "actor", startFrame: 0, endFrame: 25, sourceStartMs: 1000 },
    later: { assetId: "other-scene", startFrame: 25, endFrame: 50, sourceStartMs: 0 }
  } };
  const scenes: NonNullable<ReferenceManifest["scenes"]> = [{ sceneId: "scene", status: "ready",
    visualRoles: [{ role: "主体", assets: [{ assetId: "actor", sourceHash: "hash", sourceRanges: [{ startMs: 1000, endMs: 2000 }] }] }] }];
  verifyMotionStageVideoSources(work, [{ startFrame: 0, endFrame: 50 }], target, 25, scenes);
  scenes[0].visualRoles![0].assets[0].sourceRanges[0].endMs = 1800;
  assert.throws(() => verifyMotionStageVideoSources(work, [{ startFrame: 0, endFrame: 50 }], target, 25, scenes),
    { code: "MOTION_VIDEO_SOURCE_RANGE" });
  scenes[0].visualRoles![0].assets[0].sourceRanges[0].endMs = 2000;
  assert.throws(() => verifyMotionStageVideoSources(work, [{ startFrame: 0, endFrame: 50 }],
    { ...target, endFrame: 150, sourceEndFrame: 50 }, 25, scenes), { code: "MOTION_VIDEO_SOURCE_RANGE" });
});

test("损坏的大素材按原路径重传，已经核验的文件不删除", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-large-handoff-")), path = "handoffs/test/large.mp4";
  const source = join(root, "source"), target = join(root, "od", path);
  const bytes = Buffer.alloc(21 * 1024 * 1024, 7);
  const originalFetch = globalThis.fetch;
  let deletes = 0, uploads = 0;
  try {
    await mkdir(dirname(join(source, path)), { recursive: true });
    await mkdir(dirname(target), { recursive: true });
    await writeFile(join(source, path), bytes); await writeFile(target, "未完成的旧内容");
    globalThis.fetch = (async (url, options) => {
      if (options?.method === "DELETE") { deletes++; await rm(target); return Response.json({ ok: true }); }
      if (options?.method === "POST") {
        uploads++;
        const form = options.body as FormData, file = form.get("files") as File;
        assert.equal(form.get("dir"), "handoffs/test");
        assert.ok(String(url).endsWith("/upload"));
        await writeFile(target, Buffer.from(await file.arrayBuffer()));
        return Response.json({ files: [{ path }] });
      }
      const exists = await readFile(target).then(() => true, () => false);
      return Response.json({ files: exists ? [{ path, localPath: target }] : [] });
    }) as typeof fetch;
    const manifest: ReferenceManifest = { projectId: "project", revision: 1, packageRoot: source, diagnostics: [], files: [{
      sourcePath: join(source, path), deliveredPath: path, sha256: createHash("sha256").update(bytes).digest("hex"), localReadable: true, uses: [] }] };
    await deliverMotionHandoff({ url: "http://isolated-od.invalid" }, "od", manifest, new AbortController().signal);
    await deliverMotionHandoff({ url: "http://isolated-od.invalid" }, "od", manifest, new AbortController().signal);
    assert.equal(deletes, 1); assert.equal(uploads, 1);
    assert.deepEqual(await readFile(target), bytes);
  } finally { globalThis.fetch = originalFetch; await rm(root, { recursive: true, force: true }); }
});
