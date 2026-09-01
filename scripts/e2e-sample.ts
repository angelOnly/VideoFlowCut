import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createApplication, type EditingApplication } from "@videocut/application";
import { runOneJob } from "../apps/job-worker/src/index.js";
import { runOneRenderJob } from "../apps/render-worker/src/index.js";
import { runProcess } from "@videocut/speech";

const sourceDirectory = join(process.cwd(), "videos", "数字人口播");
const workspaceRoot = process.env.VIDEOCUT_E2E_WORKSPACE ?? join(process.cwd(), "workspace", "e2e-sample");
const selectedIndexes = [0, 1, 4, 8, 12, 14]; // segment-01 / 02 / 05 / 09 / 13 / 15

const numericSegmentOrder = (left: string, right: string) => {
  const numberOf = (value: string) => Number(/segment-(\d+)/iu.exec(value)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return numberOf(left) - numberOf(right);
};

async function hashFile(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function importSourceVideo(application: EditingApplication, projectId: string, sourcePath: string): Promise<string> {
  const state = application.readProject(projectId);
  const sourceHash = await hashFile(sourcePath);
  const extension = extname(sourcePath).toLowerCase();
  const storedName = `${Date.now()}-${sourceHash.slice(0, 10)}${extension}`;
  const relativePath = join("assets", "source", storedName);
  await copyFile(sourcePath, join(state.snapshot.project.rootPath, relativePath));
  const imported = application.registerImportedAsset({
    projectId,
    baseRevision: state.revision.number,
    name: basename(sourcePath),
    kind: "video",
    managedPath: relativePath,
    originalPath: sourcePath,
    sourceHash
  });
  return imported.asset.id;
}

async function drainMediaJobs(application: EditingApplication, projectId: string): Promise<void> {
  while (await runOneJob(application)) {
    // Worker 会持续领取媒体分析、FunASR 与 OmniVoice 任务，直至该队列为空。
  }
  const failed = application.listJobs(projectId).filter((job) => job.status === "failed");
  if (failed.length > 0) throw new Error(`媒体任务失败：${failed.map((job) => `${job.kind}: ${job.error}`).join("；")}`);
}

async function createVoiceReference(application: EditingApplication, projectId: string, sourceVideoAssetId: string): Promise<string> {
  const state = application.readProject(projectId);
  const source = state.snapshot.assets.find((asset) => asset.id === sourceVideoAssetId);
  if (!source) throw new Error("找不到用于创建参考声音的素材");
  const relativePath = join("assets", "voice-reference", "sample-8s.wav");
  const targetPath = join(state.snapshot.project.rootPath, relativePath);
  await mkdir(join(state.snapshot.project.rootPath, "assets", "voice-reference"), { recursive: true });
  await runProcess("ffmpeg", ["-y", "-ss", "0", "-t", "8", "-i", join(state.snapshot.project.rootPath, source.managedPath), "-vn", "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", targetPath], 5 * 60_000);
  const imported = application.registerImportedAsset({
    projectId,
    baseRevision: state.revision.number,
    name: "segment-01-reference.wav",
    kind: "audio",
    managedPath: relativePath,
    sourceHash: await hashFile(targetPath)
  });
  await drainMediaJobs(application, projectId);
  return imported.asset.id;
}

async function main(): Promise<void> {
  const files = (await readdir(sourceDirectory)).filter((file) => extname(file).toLowerCase() === ".mp4").sort(numericSegmentOrder);
  if (files.length !== 18) throw new Error(`预期 videos/数字人口播 下有 18 条 MP4，实际为 ${files.length} 条`);

  const application = createApplication(workspaceRoot);
  try {
    const created = application.createProject({
      name: "全量数字人口播回归",
      profile: "presenter_motion",
      brief: { targetDurationSeconds: 60, captionMode: "stable" }
    });
    const projectId = created.snapshot.project.id;
    const assetIds: string[] = [];
    for (const file of files) assetIds.push(await importSourceVideo(application, projectId, join(sourceDirectory, file)));
    await drainMediaJobs(application, projectId);

    const analyzed = application.readProject(projectId);
    const readyVideos = analyzed.snapshot.assets.filter((asset) => asset.kind === "video" && asset.status === "ready");
    if (readyVideos.length !== 18) throw new Error(`媒体分析未完成：仅 ${readyVideos.length}/18 条视频就绪`);

    const presenterAssetIds = selectedIndexes.map((index) => assetIds[index]!);
    application.buildPresenterTimeline({
      projectId,
      baseRevision: analyzed.revision.number,
      assetIds: presenterAssetIds,
      sceneSize: 1
    });

    // 以场景边界触发少量、不同类型的视觉事件，保留安静区而不是按固定间隔堆动画。
    const effectPlan = ["MetricBackdrop", "ProductFan", "CommentCloud", "EvidenceCard", "FullScreenMeme", "EndCard"] as const;
    for (const [index, effectType] of effectPlan.entries()) {
      const state = application.readProject(projectId);
      const scene = [...state.snapshot.scenes].sort((left, right) => left.startFrame - right.startFrame)[index]!;
      const startFrame = scene.startFrame + Math.min(state.snapshot.timeline.fps, Math.max(0, scene.endFrame - scene.startFrame - state.snapshot.timeline.fps));
      application.createEffectCue({
        projectId,
        baseRevision: state.revision.number,
        sceneId: scene.id,
        type: effectType,
        layer: effectType === "FullScreenMeme" || effectType === "EndCard" ? "fullscreen" : "front",
        startFrame,
        endFrame: Math.min(scene.endFrame, startFrame + state.snapshot.timeline.fps * 3),
        note: `回归验证：${effectType}`
      });
    }

    const transcriptionJob = application.submitTranscription({ projectId, assetId: presenterAssetIds[0]! });
    await drainMediaJobs(application, projectId);
    if (application.trackJob(transcriptionJob.id).status !== "succeeded") throw new Error("FunASR 转写没有成功完成");

    const voiceReferenceAssetId = await createVoiceReference(application, projectId, presenterAssetIds[0]!);
    const afterTranscription = application.readProject(projectId);
    if (afterTranscription.snapshot.speechSegments.length === 0) throw new Error("FunASR 没有生成可朗读的 SpeechSegment");
    const voiceJob = application.submitVoiceSynthesis({ projectId, voiceReferenceAssetId });
    await drainMediaJobs(application, projectId);
    if (application.trackJob(voiceJob.id).status !== "succeeded") throw new Error("OmniVoice 合成没有成功完成");

    const beforeExport = application.readProject(projectId);
    if (!beforeExport.snapshot.speechAsset || beforeExport.snapshot.speechAsset.timing.precision !== "segment_exact") {
      throw new Error("SpeechAsset 或 segment_exact SpeechTiming 未生成");
    }
    const exportJob = application.submitExport({ projectId, revision: beforeExport.revision.number });
    if (!(await runOneRenderJob(application))) throw new Error("Render Worker 没有领取导出任务");
    const completedExport = application.trackJob(exportJob.id);
    if (completedExport.status !== "succeeded") throw new Error(`导出失败：${completedExport.error ?? "未知错误"}`);
    if (completedExport.result?.renderer !== "remotion") throw new Error(`导出未使用 Remotion：${String(completedExport.result?.renderer ?? "unknown")}`);

    console.log(JSON.stringify({
      projectId,
      revision: beforeExport.revision.number,
      importedVideoCount: readyVideos.length,
      presenterAssets: selectedIndexes.map((index) => files[index]),
      transcript: afterTranscription.snapshot.transcripts[0]?.text,
      speechTimingPrecision: beforeExport.snapshot.speechAsset.timing.precision,
      export: completedExport.result
    }, null, 2));
  } finally {
    application.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
