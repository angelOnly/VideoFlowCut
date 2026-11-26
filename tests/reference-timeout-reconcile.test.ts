import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeRun } from "@videocut/bridge";
import { reconcileMediaJob } from "../apps/server/src/reconcile-media-job.js";

test("参考分析等待超时后只读取原运行，完成后幂等接回", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-reference-reconcile-"));
  const app = createApplication(root);
  try {
    const project = app.createProject({ name: "隔离分析" });
    const projectId = project.snapshot.project.id;
    const job = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: {}, idempotencyKey: "reference" });
    app.updateJob(job.id, { status: "failed", error: "等待超时", result: {
      diagnostic: { code: "BRIDGE_RUN_TIMEOUT" }, externalRuns: { reference: { status: "running", runId: "original", workflowId: "fixture", schemaVersion: "1" } }
    } });
    const bridge = new ComfyUIBridgeClient("http://127.0.0.1:1");
    let externalStatus: BridgeRun["status"] = "queued";
    const readIds: string[] = [];
    bridge.getRun = async id => { readIds.push(id); return { id, status: externalStatus, outputs: [] }; };
    const reconcile = () => reconcileMediaJob(app, projectId, job.id, () => bridge);
    assert.equal((await reconcile()).state, "waiting");
    externalStatus = "running";
    assert.equal((await reconcile()).state, "waiting");
    assert.equal(app.repository.listJobs(projectId).length, 1);
    externalStatus = "succeeded";
    const first = await reconcile();
    const second = await reconcile();
    assert.equal(first.state, "resuming");
    assert.equal(first.resumedJobId, second.resumedJobId);
    assert.equal(app.trackJob(first.resumedJobId!).payload.retryOfJobId, job.id);
    assert.deepEqual(readIds, ["original", "original", "original", "original"]);
    assert.equal(app.readProject(projectId).revision.number, project.revision.number);
  } finally {
    app.repository.close();
    await rm(root, { recursive: true, force: true });
  }
});
