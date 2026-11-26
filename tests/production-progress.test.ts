import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApplication } from "@videocut/application";
import { probeMedia, runProcess } from "@videocut/speech";

test("整片状态只把主场作为制作单元，并按实际依赖继续其他场面", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-production-progress-"));
  const app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "隔离整片", profile: "visual_explainer" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    const scenes = Array.from({ length: 8 }, (_, index) => app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene",
      title: `主场 ${index + 1}`, purpose: "说明", startFrame: index * 100, endFrame: (index + 1) * 100 }).snapshot.scenes.at(-1)!);
    app.updateStory({ projectId, baseRevision: rev(), beats: scenes.map((_, index) => ({ title: `段落 ${index + 1}`, purpose: "说明" })) });
    const file = join(app.getProjectRoot(projectId), "assets", "source", "cutaway.mp4");
    await mkdir(join(app.getProjectRoot(projectId), "assets", "source"), { recursive: true });
    await runProcess("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=24:d=1", "-c:v", "libx264", file]);
    const asset = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "辅助镜头", kind: "video",
      managedPath: "assets/source/cutaway.mp4", sourceHash: createHash("sha256").update(await readFile(file)).digest("hex") }).asset;
    app.applyMediaAnalysis({ projectId, assetId: asset.id, metadata: await probeMedia(file) });
    for (let index = 0; index < 17; index++) {
      const host = scenes[index % scenes.length]!;
      const startFrame = host.startFrame + Math.floor(index / scenes.length) * 10;
      app.manageCutaway({ projectId, baseRevision: rev(), action: "create", hostSceneId: host.id, assetId: asset.id,
        mode: "fullscreen", fit: "contain", audioMode: "mute_source_audio", purpose: "辅助说明", audienceTask: "观察",
        sourceStartFrame: 0, sourceEndFrame: 8, startFrame, endFrame: startFrame + 8 });
    }
    const run = await app.startProductionRun({ projectId, baseRevision: rev(), intent: "full_creation", completionScope: { kind: "project" },
      operationId: "whole", loadedSkills: ["production-coordinator"] });
    let status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.equal(status.unitHandoffs?.length, 8);
    assert.equal(status.preparation?.issues.filter(issue => issue.code === "STORY_BEAT_SCENE_MISSING").length, 8);
    assert.ok(!status.preparation?.directWholeFilm?.issues.some(issue => issue.code === "DIRECT_WHOLE_FILM_RANGE_INVALID"));

    const beats = app.readProject(projectId).snapshot.story.beats;
    app.updateStory({ projectId, baseRevision: rev(), beats: beats.map((beat, index) => ({ ...beat, sceneIds: [scenes[index]!.id] })) });
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.ok(!status.preparation?.issues.some(issue => issue.code === "STORY_BEAT_SCENE_MISSING"));
    const job = app.repository.createJob({ projectId, kind: "motion_reference_analysis", payload: {}, idempotencyKey: "analysis" });
    let audit = await app.readSkillExecutionReport({ projectId, runId: run.id });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: audit.auditVersion, operationId: "watch",
      action: "watch_job", jobId: job.id, scope: { kind: "objects", objectIds: [scenes[0]!.id] }, required: true, nextAction: "接回参考" });
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.equal(status.progress?.state, "actionable");
    assert.ok(status.progress?.waiting.some(entry => entry.jobId === job.id));
    assert.ok(!status.progress?.actionable.some(entry => entry.sceneId === scenes[0]!.id));
    assert.ok(status.progress?.actionable.some(entry => entry.sceneId === scenes[1]!.id));
    app.updateJob(job.id, { status: "failed", error: "等待超时" });
    const resumed = app.retryJob(projectId, job.id);
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.ok(status.progress?.waiting.some(entry => entry.jobId === resumed.id && "originalJobId" in entry && entry.originalJobId === job.id));
    app.updateJob(resumed.id, { status: "succeeded", result: {} });
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.ok(status.progress?.actionable.some(entry => entry.code === "COLLECT_JOB" && entry.jobId === resumed.id));
    audit = await app.readSkillExecutionReport({ projectId, runId: run.id });
    await app.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: audit.auditVersion, operationId: "unwatch", action: "unwatch_job", jobId: job.id });
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.ok(!status.progress?.actionable.some(entry => entry.jobId === resumed.id));
    app.repository.commit(projectId, rev(), "制造主场重叠", snapshot => {
      snapshot.scenes.find(scene => scene.id === scenes[1]!.id)!.startFrame = 50;
    });
    status = await app.readProductionStatus(projectId, { runId: run.id });
    assert.ok(status.preparation?.directWholeFilm?.issues.some(issue => issue.code === "DIRECT_WHOLE_FILM_RANGE_INVALID"));
    await assert.rejects(app.startMotionAuthoring({ projectId, baseRevision: rev(), productionRunId: run.id,
      idempotencyKey: "overlapping-main-scenes", target: { action: "whole_film" }, openDesignRequest: { project: "isolated" } }),
    { code: "MOTION_AUTHORING_WHOLE_FILM_INVALID" });
  } finally {
    app.repository.close();
    await rm(root, { recursive: true, force: true });
  }
});
