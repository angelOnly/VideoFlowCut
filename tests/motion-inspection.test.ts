import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { runMotionInspectionJob } from "../apps/render-worker/src/motion-inspection.js";
import { frameHtml } from "./fixtures/hyperframes.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("指定帧使用真实浏览器回跳并保留差异，不创建媒体或编辑版本", { timeout: 90_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-motion-inspection-")), app = createApplication(root);
  try {
    const project = app.createProject({ name: "指定帧隔离检查" }), projectId = project.snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const source = frameHtml('<div id="bg" style="position:absolute;inset:0"></div>', "if(f>0)visited=true;document.querySelector('#bg').style.background=visited?'white':'black';", "let visited=false;");
    const registration = app.registerMotionWork({ projectId, baseRevision: rev(), idempotencyKey: "prepare", work: { ...motionFixture, source } });
    const prepared = await runMotionJob(app, registration);
    app.updateJob(registration.id, { status: "succeeded", result: prepared });
    const workId = String(prepared.workId), fixedRevision = rev();
    const job = app.submitMotionInspection({ projectId, revision: fixedRevision, workId, frames: [17, 0, 9, 0], idempotencyKey: "inspect" });
    assert.equal(app.submitMotionInspection({ projectId, revision: fixedRevision, workId, frames: [0, 9, 17], idempotencyKey: "inspect" }).id, job.id);
    assert.throws(() => app.submitMotionInspection({ projectId, revision: fixedRevision, workId, frames: [18], idempotencyKey: "invalid" }), { code: "MOTION_INSPECTION_RANGE_INVALID" });
    const result = await runMotionInspectionJob(app, job) as { evidencePath: string; report: { status: string; sampledFrames: number[]; failedFrames: number[]; visitOrder: { samePageReverse: number[]; cleanPageReverse: number[] } } };
    assert.equal(result.report.status, "failed");
    assert.deepEqual(result.report.sampledFrames, [0, 9, 17]);
    assert.ok(result.report.failedFrames.includes(0));
    assert.deepEqual(result.report.visitOrder.samePageReverse, [17, 9, 0]);
    assert.deepEqual(result.report.visitOrder.cleanPageReverse, [17, 9, 0]);
    const evidence = join(project.snapshot.project.rootPath, result.evidencePath);
    assert.ok((await readFile(join(evidence, "frames", "frame-00000.png"))).length > 0);
    assert.ok((await readFile(join(evidence, "diagnostics", "same-page", "frame-00000-diff.png"))).length > 0);
    assert.ok(!(await readdir(evidence)).some(name => /\.(mp4|mkv)$/u.test(name)));
    assert.equal(rev(), fixedRevision);
    assert.equal(app.readProject(projectId).snapshot.assets.length, 0);
    assert.deepEqual(await runMotionInspectionJob(app, job), result);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});
