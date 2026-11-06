import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importMotionBundle, motionBundleHash, readFrozenMotionWork } from "../packages/edit-application/src/motion-input.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { createServer } from "../apps/server/src/app.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AUTHORED_MOTION_MANIFEST_CONTRACT, parseAuthoredMotionManifest } from "../packages/contracts/src/authored-motion-manifest-v1.js";

const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
test("作者清单 v1 对多余字段和缺失修改原因给出具体位置", () => {
  const manifest = { authorSubmissionId: "a", sourceFile: "film.html", sourceSha256: "a".repeat(64), work: {}, readyRanges: [{ startFrame: 0, endFrame: 2 }], changedRanges: [] };
  assert.equal(AUTHORED_MOTION_MANIFEST_CONTRACT, "videoflowcut.authored-motion-manifest.v1");
  assert.deepEqual(parseAuthoredMotionManifest(manifest), manifest);
  assert.throws(() => parseAuthoredMotionManifest({ ...manifest, extra: true }), /不支持字段 extra/u);
  assert.throws(() => parseAuthoredMotionManifest({ ...manifest, changedRanges: [{ startFrame: 0, endFrame: 1 }] }), /changedRanges\[0\]\.reason/u);
});
test("跨服务包身份固定样例", () => assert.equal(motionBundleHash({ sha256: "a".repeat(64), bytes: 123 }, { sha256: "b".repeat(64), bytes: 45 }), "e5ecadbc707b9d600a2900e093a90dcb6840c716ac41aa25b5e94d43a2dc661e"));
function bundle(sourceInput = motionFixture.source, readyRanges = [{ startFrame: 0, endFrame: motionFixture.durationInFrames }]) {
  const { source: _source, ...work } = motionFixture, sourceBytes = Buffer.from(sourceInput);
  const manifestBytes = Buffer.from(JSON.stringify({ authorSubmissionId: "作者一", sourceFile: "output/film.html", sourceSha256: sha(sourceBytes), work, readyRanges, changedRanges: [] }));
  const sourcePart = { sha256: sha(sourceBytes), bytes: sourceBytes.length }, manifest = { sha256: sha(manifestBytes), bytes: manifestBytes.length };
  const bundleHash = motionBundleHash(sourcePart, manifest);
  return { receipt: { project: "od-project", run_id: "run-one", frozen_version: `run-one_${bundleHash}`, bundle_sha256: bundleHash, source: sourcePart, manifest }, source_base64: sourceBytes.toString("base64"), manifest_base64: manifestBytes.toString("base64") };
}
test("固定源码清单可幂等导入且恢复为同一真实作品", async () => {
  const root = await mkdtemp(join(tmpdir(), "motion-input-"));
  try {
    const original = bundle(), first = await importMotionBundle(root, "project-a", "same", original);
    assert.equal(first.reused, false);
    assert.equal((await importMotionBundle(root, "project-a", "same", original)).reused, true);
    const loaded = await readFrozenMotionWork(root, first.bundle_path, first.manifest_sha256);
    assert.deepEqual(loaded.work, motionFixture);
    assert.deepEqual(loaded.inputBundle.source, { project: "od-project", run_id: "run-one", frozen_version: original.receipt.frozen_version });
    await assert.rejects(importMotionBundle(root, "project-a", "same", { ...original, receipt: { ...original.receipt, run_id: "another" } }), /IDEMPOTENCY_CONFLICT/);
    await writeFile(join(root, first.bundle_path, "source.html"), "污染");
    await assert.rejects(readFrozenMotionWork(root, first.bundle_path, first.manifest_sha256), /MISMATCH/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test("正式 MCP 在隔离项目完整导入接近源码上限的中文字节并固定到 Job", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "motion-input-mcp-")), http = await createServer({ workspaceRoot: root }), app = http.application;
  const client = new Client({ name: "固定输入隔离验证", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(), env: { ...process.env as Record<string, string>, VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  try {
    const state = app.createProject({ name: "固定源码接口验证" }), projectId = state.snapshot.project.id;
    await client.connect(transport);
    const capabilities = await client.callTool({ name: "read_motion_capabilities", arguments: {} });
    assert.equal(JSON.parse((capabilities.content as Array<{ text: string }>)[0].text).authoredManifestContract, AUTHORED_MOTION_MANIFEST_CONTRACT);
    const longSource = motionFixture.source.replace("</body>", `<!--${"中".repeat(1_900_000)}--></body>`), input = bundle(longSource);
    const response = await client.callTool({ name: "import_motion_bundle", arguments: { project_id: projectId, idempotency_key: "大文件", bundle: input } });
    assert.notEqual(response.isError, true, JSON.stringify(response.content));
    const receipt = JSON.parse((response.content as Array<{ text: string }>)[0].text);
    const submitted = await client.callTool({ name: "register_motion_work", arguments: { project_id: projectId, base_revision_id: state.revision.number, idempotency_key: "正式作品", frozen_work: { bundle_path: receipt.bundle_path, manifest_sha256: receipt.manifest_sha256 } } });
    assert.notEqual(submitted.isError, true, JSON.stringify(submitted.content));
    const job = JSON.parse((submitted.content as Array<{ text: string }>)[0].text);
    const fixed = app.trackJob(job.id);
    assert.equal((fixed.payload.work as { source: string }).source, longSource);
    assert.deepEqual((fixed.payload.inputBundle as { source: unknown }).source, { project: "od-project", run_id: "run-one", frozen_version: input.receipt.frozen_version });
    assert.equal(app.readProject(projectId).revision.number, state.revision.number);
  } finally { await client.close(); await transport.close(); await http.app.close(); app.close(); await rm(root, { recursive: true, force: true }); }
});
test("拒绝截断、错误哈希及跨项目路径", async () => {
  const root = await mkdtemp(join(tmpdir(), "motion-input-invalid-"));
  try {
    const source = bundle();
    await assert.rejects(importMotionBundle(root, "project-a", "bad", { ...source, source_base64: source.source_base64.slice(4) }), /MISMATCH/);
    await assert.rejects(readFrozenMotionWork(root, "../other/inputs/motion/" + "a".repeat(64), "a".repeat(64)), /PATH_INVALID/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test("阶段交件只允许生成作者明确完成的范围", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "motion-input-stage-")), http = await createServer({ workspaceRoot: root }), app = http.application;
  const client = new Client({ name: "阶段范围验证", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", "apps/server/src/mcp.ts"], cwd: process.cwd(), env: { ...process.env as Record<string, string>, VIDEOCUT_WORKSPACE: root }, stderr: "pipe" });
  try {
    const state = app.createProject({ name: "阶段范围接口验证" }), projectId = state.snapshot.project.id;
    await client.connect(transport);
    const input = bundle(motionFixture.source, [{ startFrame: 0, endFrame: 9 }]);
    const imported = await client.callTool({ name: "import_motion_bundle", arguments: { project_id: projectId, idempotency_key: "stage-import", bundle: input } });
    assert.notEqual(imported.isError, true);
    const receipt = JSON.parse((imported.content as Array<{ text: string }>)[0].text);
    const frozen_work = { bundle_path: receipt.bundle_path, manifest_sha256: receipt.manifest_sha256 };
    const registered = await client.callTool({ name: "register_motion_work", arguments: { project_id: projectId, base_revision_id: state.revision.number, idempotency_key: "stage-register", frozen_work } });
    assert.notEqual(registered.isError, true, JSON.stringify(registered.content));
    const preparationId = JSON.parse((registered.content as Array<{ text: string }>)[0].text).id;
    const prepared = await runMotionJob(app, app.trackJob(preparationId));
    const work_id = String(prepared.workId), revision = app.readProject(projectId).revision.number;
    const bad = await client.callTool({ name: "submit_motion_work", arguments: { project_id: projectId, base_revision_id: revision, idempotency_key: "full-not-ready", work_id } });
    assert.equal(bad.isError, true);
    assert.match(JSON.stringify(bad.content), /MOTION_BUNDLE_RANGE_NOT_READY/);
    const good = await client.callTool({ name: "submit_motion_work", arguments: { project_id: projectId, base_revision_id: revision, idempotency_key: "stage", work_id, frame_range: { startFrame: 0, endFrame: 9 } } });
    assert.notEqual(good.isError, true, JSON.stringify(good.content));
    assert.deepEqual(app.trackJob(JSON.parse((good.content as Array<{ text: string }>)[0].text).id).payload.frameRange, { startFrame: 0, endFrame: 9 });
  } finally { await client.close(); await transport.close(); await http.app.close(); app.close(); await rm(root, { recursive: true, force: true }); }
});
