import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createApplication, type EditingApplication } from "@videocut/application";
import { runOneJob } from "../apps/job-worker/src/index.js";
import { runOneRenderJob } from "../apps/render-worker/src/index.js";
import { runProcess } from "@videocut/speech";

const sourceDirectory = join(process.cwd(), "videos", "数字人口播");
const workspaceRoot = process.env.VIDEOCUT_E2E_WORKSPACE ?? join(process.cwd(), "workspace", "e2e-sample");
// 五段约十秒的完整口播，既能形成 45～60 秒的真实旁白，又保留每个 Scene 的安静区。
const selectedIndexes = [0, 1, 4, 8, 12]; // segment-01 / 02 / 05 / 09 / 13

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
  const ready = application.readProject(projectId);
  const registered = application.registerVoiceReference({
    projectId,
    baseRevision: ready.revision.number,
    assetId: imported.asset.id,
    label: "segment-01 本地参考声音",
    authorizationNote: "端到端样例使用项目内测试素材；正式项目需由项目负责人确认授权。",
    usageNote: "仅用于本项目 OmniVoice 回归测试。"
  });
  const reference = registered.snapshot.voiceReferences.find((candidate) => candidate.assetId === imported.asset.id);
  if (!reference || reference.source !== "local_asset" || "remoteVoiceId" in reference) {
    throw new Error("VoiceReference 必须是本地 Asset 对象，不能伪造远端 Voice ID");
  }
  return reference.id;
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

    // 先完成主声音，再添加效果。每个效果只占用一个短语窗口，避免“有 Timeline 就先堆动效”。
    const transcriptionJobs = presenterAssetIds.map((assetId) => application.submitTranscription({ projectId, assetId }));
    await drainMediaJobs(application, projectId);
    if (transcriptionJobs.some((job) => application.trackJob(job.id).status !== "succeeded")) {
      throw new Error("FunASR 转写没有全部成功完成");
    }

    const voiceReferenceId = await createVoiceReference(application, projectId, presenterAssetIds[0]!);
    const afterTranscription = application.readProject(projectId);
    if (afterTranscription.snapshot.speechSegments.length === 0) throw new Error("FunASR 没有生成可朗读的 SpeechSegment");
    const voiceJob = application.submitVoiceSynthesis({ projectId, voiceReferenceId });
    await drainMediaJobs(application, projectId);
    if (application.trackJob(voiceJob.id).status !== "succeeded") throw new Error("OmniVoice 合成没有成功完成");

    const afterVoice = application.readProject(projectId);
    if (!afterVoice.snapshot.speechAsset || afterVoice.snapshot.speechAsset.timing.precision !== "segment_exact") {
      throw new Error("SpeechAsset 或 segment_exact SpeechTiming 未生成");
    }
    const speechFile = afterVoice.snapshot.assets.find((asset) => asset.id === afterVoice.snapshot.speechAsset?.assetId);
    const speechDurationMs = speechFile?.metadata?.durationMs ?? 0;
    if (speechDurationMs < 45_000 || speechDurationMs > 60_000) {
      throw new Error(`阶段 1 端到端样例旁白必须为 45～60 秒，实际为 ${(speechDurationMs / 1000).toFixed(2)} 秒`);
    }
    const dialogueTrack = afterVoice.snapshot.timeline.tracks.find((track) => track.name === "Dialogue");
    const dialogueItems = afterVoice.snapshot.timeline.items.filter((item) => item.trackId === dialogueTrack?.id && item.assetId === afterVoice.snapshot.speechAsset?.assetId);
    if (dialogueItems.length !== 1) throw new Error("SpeechAsset 没有作为唯一的 Dialogue Timeline Item 写入");
    if (afterVoice.snapshot.timeline.captions.length !== afterVoice.snapshot.speechAsset.timing.segments.length || afterVoice.snapshot.timeline.captions.some((caption) => caption.style !== "stable" || caption.precision !== "segment_exact")) {
      throw new Error("稳定字幕或 segment_exact 字幕时序未完整生成");
    }

    const aligned = application.alignPresenterToSpeech({ projectId, baseRevision: afterVoice.revision.number });
    const alignedActorTrack = aligned.snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll");
    const alignedActorEnd = aligned.snapshot.timeline.items
      .filter((item) => item.trackId === alignedActorTrack?.id && !item.disabled)
      .reduce((latest, item) => Math.max(latest, item.endFrame), 0);
    if (alignedActorEnd !== dialogueItems[0]!.endFrame) throw new Error("Presenter 主画面未按 SpeechAsset 收齐");

    // 第一阶段允许没有 Mask 的显式前景降级，但必须登记人物，不能让渲染器猜测其层级关系。
    for (const item of aligned.snapshot.timeline.items.filter((candidate) => candidate.trackId === alignedActorTrack?.id)) {
      const current = application.readProject(projectId);
      application.registerActorPerformance({
        projectId,
        baseRevision: current.revision.number,
        timelineItemId: item.id,
        source: "imported",
        maskMode: "none",
        note: "端到端样例使用已导入人物视频；未提供 Mask 时按前景降级并在质量报告中提示。"
      });
    }

    // 每个效果只占用一个短语窗口；同一 Scene 内最多两个常规效果，最后一幕留给 EndCard。
    const effectPlan = [
      { type: "MetricBackdrop", layer: "rear", sceneIndex: 0, slot: "early" },
      { type: "ProductFan", layer: "front", sceneIndex: 0, slot: "middle" },
      { type: "GlowCTA", layer: "front", sceneIndex: 1, slot: "early" },
      { type: "PortfolioWall", layer: "front", sceneIndex: 1, slot: "middle" },
      { type: "CommentCloud", layer: "front", sceneIndex: 2, slot: "early" },
      { type: "EvidenceCard", layer: "front", sceneIndex: 2, slot: "middle" },
      { type: "CameraPunch", layer: "actor", sceneIndex: 3, slot: "early" },
      { type: "FullScreenMeme", layer: "fullscreen", sceneIndex: 3, slot: "middle" },
      { type: "DeviceShowcase", layer: "front", sceneIndex: 3, slot: "late" },
      { type: "ContentCarousel", layer: "front", sceneIndex: 4, slot: "early" },
      { type: "EndCard", layer: "fullscreen", sceneIndex: 4, slot: "end" }
    ] as const;
    const scenes = [...application.readProject(projectId).snapshot.scenes].sort((left, right) => left.startFrame - right.startFrame);
    for (const effect of effectPlan) {
      const state = application.readProject(projectId);
      const scene = scenes[effect.sceneIndex];
      if (!scene) throw new Error(`效果 ${effect.type} 缺少可用 PresenterScene`);
      const cueDuration = state.snapshot.timeline.fps * (effect.slot === "end" ? 3 : 2);
      const startFrame = effect.slot === "early"
        ? scene.startFrame
        : effect.slot === "middle"
          ? scene.startFrame + state.snapshot.timeline.fps * 4
          : effect.slot === "late"
            ? scene.startFrame + state.snapshot.timeline.fps * 7
            : scene.endFrame - cueDuration;
      if (startFrame < scene.startFrame || startFrame + cueDuration > scene.endFrame) {
        throw new Error(`效果 ${effect.type} 没有足够的 Scene 安全窗口`);
      }
      application.createEffectCue({
        projectId,
        baseRevision: state.revision.number,
        sceneId: scene.id,
        type: effect.type,
        layer: effect.layer,
        startFrame,
        endFrame: startFrame + cueDuration,
        note: `回归验证：${effect.type}`
      });
    }
    const plannedEffects = new Set(application.readProject(projectId).snapshot.effectCues.map((cue) => cue.type));
    if (plannedEffects.size !== effectPlan.length) throw new Error("第一批 11 种 EffectCue 未全部写入同一 Revision");

    const beforeExport = application.readProject(projectId);
    const speechAsset = beforeExport.snapshot.speechAsset!;
    if (beforeExport.snapshot.actorPerformances.length !== presenterAssetIds.length) throw new Error("所有 Presenter 主画面都必须登记人物层级");
    const previewCue = beforeExport.snapshot.effectCues[0];
    if (!previewCue) throw new Error("局部预览验证缺少 EffectCue");
    const previewJob = application.submitPreview({
      projectId,
      revision: beforeExport.revision.number,
      fromFrame: previewCue.startFrame,
      toFrame: Math.min(beforeExport.snapshot.timeline.durationInFrames, previewCue.endFrame + beforeExport.snapshot.timeline.fps)
    });
    if (!(await runOneRenderJob(application))) throw new Error("Render Worker 没有领取局部预览任务");
    const completedPreview = application.trackJob(previewJob.id);
    if (completedPreview.status !== "succeeded" || !completedPreview.result?.relativePath) {
      throw new Error(`局部预览失败：${completedPreview.error ?? "未知错误"}`);
    }
    const exportJob = application.submitExport({ projectId, revision: beforeExport.revision.number });
    if (!(await runOneRenderJob(application))) throw new Error("Render Worker 没有领取导出任务");
    const completedExport = application.trackJob(exportJob.id);
    if (completedExport.status !== "succeeded") throw new Error(`导出失败：${completedExport.error ?? "未知错误"}`);
    if (completedExport.result?.renderer !== "remotion") throw new Error(`导出未使用 Remotion：${String(completedExport.result?.renderer ?? "unknown")}`);

    // 导出固定的是旧 Revision；随后仍必须能继续编辑而不破坏已完成导出。
    const cue = beforeExport.snapshot.effectCues[0];
    if (!cue) throw new Error("导出后新 Revision 验证缺少 EffectCue");
    const afterEdit = application.updateEffectCue({
      projectId,
      baseRevision: beforeExport.revision.number,
      cueId: cue.id,
      intensity: cue.intensity >= 0.8 ? 0.7 : 0.85,
      note: `${cue.note}（导出后继续编辑验证）`
    });
    if (afterEdit.revision.number <= beforeExport.revision.number) throw new Error("导出后无法继续创建新 Revision");

    console.log(JSON.stringify({
      projectId,
      revision: afterEdit.revision.number,
      importedVideoCount: readyVideos.length,
      presenterAssets: selectedIndexes.map((index) => files[index]),
      transcriptCount: afterTranscription.snapshot.transcripts.length,
      speechDurationSeconds: Number((speechDurationMs / 1000).toFixed(2)),
      speechTimingPrecision: speechAsset.timing.precision,
      effectTypes: [...plannedEffects],
      preview: completedPreview.result,
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
