import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionSmoke, assertRuntimeReady } from "../scripts/verify-plugin-deployment.mjs";

const releaseId = "release-current";
const projectId = "isolated-project";
const switchedAt = Date.parse("2026-01-01T00:00:00Z");

test("VideoFlowCut 与 Worker 就绪时，OD 旧版仍阻断部署", () => {
  const report = {
    aligned: true, launcherReleaseId: releaseId, mcpReleaseId: releaseId,
    runtime: { releaseId, status: "ready", workers: { media: true, render: true } },
    openDesign: { status: "release_mismatch", releaseId: "release-old" }
  };
  assert.throws(() => assertRuntimeReady(report, releaseId), /OD 未就绪.*release_mismatch.*release-old/);
  report.openDesign = { status: "ready", releaseId };
  assert.doesNotThrow(() => assertRuntimeReady(report, releaseId));
});

test("OD Run 结束但没有接回阶段作品时不能通过，实际回件和同版预览可通过", () => {
  const authoring = {
    id: "authoring-job", kind: "motion_authoring", projectId, status: "succeeded",
    createdAt: "2026-01-01T00:01:00Z", updatedAt: "2026-01-01T00:02:00Z",
    result: { authoring: { status: "incomplete", receipts: [] } }
  };
  const preview = {
    id: "preview-job", kind: "preview", projectId, status: "succeeded", createdAt: "2026-01-01T00:03:00Z",
    result: { revision: 7, releaseId, fromFrame: 0, toFrame: 12, sourceHash: "preview-hash" }
  };
  assert.throws(() => assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId), /缺少已接回/);
  authoring.result.authoring = { status: "succeeded", receipts: [{
    runId: "run", frozenVersion: "frozen", workId: "work", revision: 7, ranges: [{ startFrame: 0, endFrame: 12 }]
  }] };
  assert.equal(assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId).frozenVersion, "frozen");
  preview.result.releaseId = "release-old";
  assert.throws(() => assertProductionSmoke(authoring, preview, projectId, switchedAt, releaseId), /渲染 Worker/);
});
