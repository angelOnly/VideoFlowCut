import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { EFFECT_TYPES } from "@videocut/contracts";
import { RevisionRenderer, validateExport } from "../apps/render-worker/src/exporter.js";
import { inspectComposedFrames } from "../apps/server/src/preview-inspection.js";
import { probeMedia } from "@videocut/speech";

/**
 * 这是 Effect Registry 的渲染冒烟测试，而不是产品创作效果测试。
 * 它故意直接建立最小 Project，用同一真实视频绑定所有组件，只验证 11 种
 * Remotion 组件可以被构建并合成。语义、Skill、MCP 与质量链路请运行
 * presenter-creative-agent.eval.ts。
 */
async function main(): Promise<void> {
  const fixturePath = join(process.cwd(), "videos", "数字人口播", "segment-01.mp4");
  if (!existsSync(fixturePath)) throw new Error(`缺少冒烟测试视频：${fixturePath}`);
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videocut-effect-registry-"));
  const application = createApplication(workspaceRoot);
  try {
    const created = application.createProject({ name: "Effect Registry Smoke" });
    const projectId = created.snapshot.project.id;
    const projectRoot = created.snapshot.project.rootPath;
    const relativePath = join("assets", "source", "effect-smoke.mp4");
    const managedPath = join(projectRoot, relativePath);
    await mkdir(join(projectRoot, "assets", "source"), { recursive: true });
    await copyFile(fixturePath, managedPath);
    const imported = application.registerImportedAsset({
      projectId,
      baseRevision: created.revision.number,
      name: "effect-smoke.mp4",
      kind: "video",
      managedPath: relativePath,
      originalPath: fixturePath,
      sourceHash: "effect-registry-smoke"
    });
    application.applyMediaAnalysis({ projectId, assetId: imported.asset.id, metadata: await probeMedia(managedPath) });
    const assembled = application.buildPresenterTimeline({
      projectId,
      baseRevision: application.readProject(projectId).revision.number,
      assetIds: [imported.asset.id],
      sceneSize: 1
    });
    const scene = assembled.snapshot.scenes[0];
    if (!scene) throw new Error("Effect Registry Smoke 缺少 PresenterScene");
    const rangeEnd = Math.min(scene.endFrame, assembled.snapshot.timeline.fps * 2);
    if (rangeEnd <= scene.startFrame) throw new Error("测试视频时长不足 2 秒");
    for (const type of EFFECT_TYPES) {
      const state = application.readProject(projectId);
      application.createEffectCue({
        projectId,
        baseRevision: state.revision.number,
        sceneId: scene.id,
        type,
        layer: type === "MetricBackdrop" ? "rear" : type === "CameraPunch" ? "actor" : type === "FullScreenMeme" || type === "EndCard" ? "fullscreen" : "front",
        startFrame: scene.startFrame,
        endFrame: rangeEnd,
        narrativePurpose: "验证已注册组件能合成",
        audienceTask: "冒烟验证",
        assetBindings: ["ProductFan", "PortfolioWall", "EvidenceCard", "DeviceShowcase", "ContentCarousel"].includes(type) ? [{ slot: "primary", assetId: imported.asset.id }] : [],
        props: type === "CommentCloud" ? { comments: ["真实项目评论 A", "真实项目评论 B"] } : {},
        note: `Smoke: ${type}`
      });
    }
    const snapshot = application.readProject(projectId).snapshot;
    assert.equal(new Set(snapshot.effectCues.map((cue) => cue.type)).size, EFFECT_TYPES.length, "11 个 EffectCue 必须全部存在");
    const outputPath = join(projectRoot, "previews", "effect-registry-smoke.mp4");
    // 冒烟测试只需证明组件可合成，单并发避免与开发中的 Render Worker 争抢浏览器资源。
    const renderer = new RevisionRenderer(undefined, 1);
    await renderer.renderRange(snapshot, scene.startFrame, rangeEnd, outputPath);
    const validation = await validateExport(outputPath, Math.round(((rangeEnd - scene.startFrame) / snapshot.timeline.fps) * 1000));
    const inspectedFrames = await inspectComposedFrames({
      projectRoot,
      previewPath: outputPath,
      revision: application.readProject(projectId).revision.number,
      fromFrame: scene.startFrame,
      toFrame: rangeEnd,
      fps: snapshot.timeline.fps
    });
    assert.equal(inspectedFrames.length, 3, "冒烟预览必须能抽取进入、稳定和退出三张真实合成帧");
    console.log(JSON.stringify({
      test: "effect-registry-smoke",
      effectTypes: EFFECT_TYPES,
      outputPath,
      durationMs: validation.durationMs,
      hasAudio: validation.hasAudio,
      inspectedFrames
    }, null, 2));
  } finally {
    application.close();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
