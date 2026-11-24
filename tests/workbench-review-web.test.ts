import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import puppeteer from "puppeteer-core";
import { createServer as createViteServer } from "vite";
import { createServer } from "../apps/server/src/app.js";
import { resolveRenderBrowser } from "../packages/remotion-runtime/src/browser.js";
import { runProcess } from "@videocut/speech";
import { assignVisualResponsibilities } from "./fixtures/production-run.js";

test("工作台固定版本、按范围循环时不创建预览文件或切换新版本", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-workbench-review-"));
  const previousApi = process.env.VITE_API_BASE;
  const { app: server, application } = await createServer({ workspaceRoot: root });
  let vite: Awaited<ReturnType<typeof createViteServer>> | undefined;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const created = application.createProject({ name: "工作台范围审阅" });
    const projectId = created.snapshot.project.id;
    const mediaPath = join(created.snapshot.project.rootPath, "assets/source/review.mp4");
    await mkdir(dirname(mediaPath), { recursive: true });
    await runProcess("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=24:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", mediaPath]);
    const asset = application.registerImportedAsset({ projectId, baseRevision: created.revision.number, name: "review.mp4", kind: "video", managedPath: "assets/source/review.mp4" });
    application.applyMediaAnalysis({ projectId, assetId: asset.asset.id, metadata: { durationMs: 2000, width: 64, height: 64, fps: 24, hasAudio: false, videoCodec: "h264" } });
    const timeline = application.buildPresenterTimeline({ projectId, baseRevision: application.readProject(projectId).revision.number, assetIds: [asset.asset.id] });
    const sceneState = application.createScene({ projectId, baseRevision: timeline.revision.number, type: "ExplainerScene", title: "参考场面", purpose: "连续展示", startFrame: 0, endFrame: 24 });
    const sceneId = sceneState.snapshot.scenes[0]!.id;
    const run = await application.startProductionRun({ operationId: globalThis.crypto.randomUUID(), intent: "local_edit", completionScope: { kind: "project" }, projectId, baseRevision: sceneState.revision.number, loadedSkills: ["web-editor-operator"] });
    await application.updateProductionRun({ projectId, runId: run.id, expectedAuditVersion: run.auditVersion, operationId: "assign-review-director", action: "add_assignment",
      assignment: { assignmentId: "review-director", agentId: "/fixture/director", responsibilities: ["director"], skillIds: ["production-director"],
        scope: { kind: "project" }, inputRevision: sceneState.revision.number } });
    const sourceSha256 = "a".repeat(64);
    const manifestPath = join(created.snapshot.project.rootPath, "delivery-manifest.json");
    const manifest = JSON.stringify({ projectId, revision: sceneState.revision.number, selectedSceneIds: [sceneId], files: [
      { deliveredPath: "assets/source/review.mp4", localReadable: true }
    ], scenes: [{ sceneId, references: [{ kind: "creative", id: "fixture-reference", sourceSha256, video: "assets/source/review.mp4", startMs: 100, endMs: 900,
      purpose: "局部借用" }], visualPlan: { referenceMappings: [{ referenceId: "fixture-reference", referenceKind: "creative", startMs: 100, endMs: 900,
        targetRole: "主体", preserveRelation: "窗口接管时保留文字", targetRange: { startFrame: 5, endFrame: 12 } }] } }] });
    await writeFile(manifestPath, manifest);
    const adoption = (await application.recordCreativeDecision({ projectId, runId: run.id, operationId: "reference-adoption", category: "visual",
      phase: "adoption", assignmentId: "review-director", inputRevision: sceneState.revision.number, objectIds: [sceneId], decision: "测试参考", rationale: "验证工作台逐项审阅",
      deliveryRef: { manifestPath, manifestSha256: createHash("sha256").update(manifest).digest("hex"), sceneIds: [sceneId] } })).creativeDecisions.at(-1)!;
    const timed = application.repository.commit(projectId, sceneState.revision.number, "登记测试采用", snapshot => {
      const date = new Date().toISOString();
      snapshot.visualTreatments.push({ id: "fixture-treatment", sceneId, mode: "b_roll", intensity: "medium",
        primaryAttention: "主体", narrativePurpose: "连续展示", status: "ready", createdAt: date, updatedAt: date,
        adoptedDecisionRef: { productionRunId: run.id, decisionId: adoption.id } });
    });
    await assignVisualResponsibilities(application, projectId, run.id, { kind: "project" }, [projectId]);
    application.updateStory({ projectId, baseRevision: timed.revision.number, title: "更新后的版本" });
    const apiUrl = await server.listen({ host: "127.0.0.1", port: 0 });
    process.env.VITE_API_BASE = apiUrl;
    vite = await createViteServer({ configFile: resolve("apps/web/vite.config.ts"), server: { host: "127.0.0.1", port: 0 }, logLevel: "silent" });
    await vite.listen();
    const port = (vite.httpServer!.address() as { port: number }).port;
    browser = await puppeteer.launch({ executablePath: await resolveRenderBrowser(), headless: true, pipe: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors: string[] = [];
    const projectReads: string[] = [];
    page.on("pageerror", error => errors.push(String(error)));
    page.on("response", response => { if (response.request().method() === "GET" && response.url().includes(`/api/projects/${projectId}`)) projectReads.push(`${response.status()} ${response.url()}`); });
    const itemId = timed.snapshot.timeline.items[0]!.id;
    await page.goto(`http://127.0.0.1:${port}/?projectId=${encodeURIComponent(projectId)}&productionRunId=${encodeURIComponent(run.id)}&revision=${timed.revision.number}&itemId=${encodeURIComponent(itemId)}&fromFrame=5&toFrame=12`, { waitUntil: "networkidle2" });
    await page.waitForSelector('[data-testid="workbench"]');
    assert.equal(await page.$eval('[data-testid="revision"]', el => el.textContent), `R${timed.revision.number}`);
    assert.equal(await page.$eval('[aria-label="审阅起帧"]', el => (el as HTMLInputElement).value), "5");
    assert.equal(await page.$eval('[aria-label="审阅结束帧"]', el => (el as HTMLInputElement).value), "12");
    await page.$$eval("button", buttons => buttons.find(button => button.textContent === "播放范围")!.click());
    await page.waitForFunction(() => {
      const text = document.querySelector(".preview-toolbar span:last-child")?.textContent ?? "";
      const match = /F(\d+)/u.exec(text);
      return Boolean(match && Number(match[1]) > 5 && Number(match[1]) < 12);
    });
    const observed = await page.evaluate(() => new Promise<number[]>(resolve => {
      const frames: number[] = [];
      const element = document.querySelector(".preview-toolbar span:last-child")!;
      const observer = new MutationObserver(() => { const match = /F(\d+)/u.exec(element.textContent ?? ""); if (match) frames.push(Number(match[1])); });
      observer.observe(element, { childList: true, characterData: true, subtree: true });
      setTimeout(() => { observer.disconnect(); resolve(frames); }, 800);
    }));
    assert.ok(new Set(observed).size >= 2, "范围播放必须真的推进而非只完成一次定位");
    assert.ok(observed.every(frame => frame >= 5 && frame < 12), `范围播放越界：${observed.join(",")}`);
    application.updateStory({ projectId, baseRevision: application.readProject(projectId).revision.number, title: "播放期间的新版本" });
    await page.waitForSelector('[data-testid="show-latest-revision"]');
    assert.equal(await page.$eval('[data-testid="revision"]', el => el.textContent), `R${timed.revision.number}`);

    // 从历史版提出问题后，工作单应保留观察版本，修改版还要由人明确复查。
    await page.click('[data-testid="workbench-review"] summary');
    await page.type('[aria-label="观察者"]', "审片者");
    await page.waitForFunction(() => document.body.textContent?.includes("已对照 fixture-reference"));
    await page.$$eval('[data-testid="workbench-review"] details summary', items => items.find(item => item.textContent?.includes("fixture-reference"))!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.equal(await page.$eval('a[href*="#t=0.1,0.9"]', link => link.textContent), "打开这段参考");
    await page.evaluate(() => {
      const label = [...document.querySelectorAll("label")].find(item => item.textContent?.includes("已对照 fixture-reference"));
      label?.querySelector("input")?.click();
    });
    await page.select('[aria-label="观察方式"]', "continuous_video");
    await page.type('[aria-label="实际观察"]', "连续观看参考与本片");
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "保存参考审阅")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("请逐条填写"));
    await page.type('[aria-label="原片关系 fixture-reference"]', "主体与文字共同变化");
    await page.type('[aria-label="本片实现 fixture-reference"]', "主体接管时文字随之移动");
    await page.type('[aria-label="缺失或偏差 fixture-reference"]', "无");
    await page.select('[aria-label="审阅结论 fixture-reference"]', "confirmed");
    for (const role of ["创意", "动效机制", "美术视觉"]) {
      const selector = `[aria-label="${role}复核依据"]`;
      await page.waitForFunction(target => (document.querySelector(target) as HTMLSelectElement | null)?.options.length === 2, {}, selector);
      const value = await page.$eval(selector, element => (element as HTMLSelectElement).options[1]!.value);
      await page.select(selector, value);
      await page.type(`[aria-label="${role}实际观察"]`, `${role}已检查`);
      await page.select(`[aria-label="${role}复核结论"]`, "confirmed");
    }
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "保存参考审阅")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("已保存实际观察"));
    const referenceEvidence = (await application.readEditorialQualityReview({ projectId, revision: timed.revision.number }))!.evidenceRecords![0];
    assert.deepEqual(referenceEvidence.responsibilityReviews?.map(item => item.responsibility), ["creative_research", "motion_research", "visual_design"]);
    assert.deepEqual(referenceEvidence.referenceReviews?.[0], { productionRunId: run.id, decisionId: adoption.id, sceneId,
      referenceKind: "creative", referenceId: "fixture-reference", sourceSha256: "a".repeat(64), targetRole: "主体", startMs: 100, endMs: 900,
      originalRelation: "主体与文字共同变化", actualImplementation: "主体接管时文字随之移动", difference: "无", outcome: "confirmed" });
    await page.evaluate(() => [...document.querySelectorAll("label")].find(item => item.textContent?.includes("已对照 fixture-reference"))?.querySelector("input")?.click());
    await page.type('[aria-label="实际观察"]', "窗口没有接管");
    await page.type('[aria-label="原片关系 fixture-reference"]', "窗口放大接管");
    await page.type('[aria-label="本片实现 fixture-reference"]', "窗口保持原大小");
    await page.type('[aria-label="缺失或偏差 fixture-reference"]', "缺少窗口接管");
    await page.select('[aria-label="审阅结论 fixture-reference"]', "issue");
    await page.type('[aria-label="问题影响 fixture-reference"]', "参考的核心关系缺失");
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "保存参考审阅")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("登记必修问题"));
    const referenceIssue = (await application.readEditorialQualityReview({ projectId, revision: timed.revision.number }))!.findings[0];
    assert.equal(referenceIssue.severity, "major");
    assert.equal(referenceIssue.referenceReview?.referenceId, "fixture-reference");
    await page.$eval('[data-testid="workbench-review"] .workbench-finding', article => [...article.querySelectorAll("button")].find(button => button.textContent === "在本版复查")!.click());
    await page.waitForSelector('[aria-label="审阅结论 fixture-reference"]');
    await page.type('[aria-label="实际观察"]', "复查窗口已接管");
    await page.type('[aria-label="本片实现 fixture-reference"]', "窗口放大接管");
    await page.type('[aria-label="缺失或偏差 fixture-reference"]', "已修复");
    await page.select('[aria-label="审阅结论 fixture-reference"]', "confirmed");
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "保存观察并关闭已解决问题")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("已保存观察并复查该问题"));
    await page.type('[aria-label="实际观察"]', "第 5 至 11 帧文字被遮挡");
    await page.type('[aria-label="问题影响"]', "影响阅读");
    await page.select('[aria-label="严重程度"]', "major");
    await page.evaluate(() => {
      const originalFetch = window.fetch.bind(window);
      let dropped = false;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (!dropped && String(args[0]).includes("/workbench-observations")) {
          dropped = true;
          throw new Error("模拟响应丢失");
        }
        return response;
      };
    });
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "记录问题")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("模拟响应丢失"));
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "记录问题")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("已记录问题"));
    const reviewAfterRetry = await application.readEditorialQualityReview({ projectId, revision: timed.revision.number });
    assert.equal(reviewAfterRetry?.findings.length, 2);
    assert.equal(reviewAfterRetry?.evidenceRecords?.length, 4);
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "准备返修")!.click());
    await page.waitForSelector('[data-testid="create-agent-work-order"]');
    await page.click('[data-testid="create-agent-work-order"]');
    await page.waitForFunction(() => document.body.textContent?.includes("返修工作单已创建"));
    const createdOrderState = application.readProject(projectId);
    const order = createdOrderState.snapshot.agentWorkOrders.at(-1)!;
    assert.equal(order.reviewContext?.revision, timed.revision.number);
    assert.deepEqual(order.reviewContext?.frameRange, { startFrame: 5, endFrame: 12 });
    assert.equal(order.reviewContext?.findingIds?.length, 1);
    assert.deepEqual(order.relatedObjectIds, [itemId]);
    assert.equal(await page.$eval('[data-testid="revision"]', el => el.textContent), `R${timed.revision.number}`);
    const agentId = "隔离测试接手者";
    const claimed = application.claimAgentWorkOrder({ projectId, baseRevision: createdOrderState.revision.number, workOrderId: order.id, agentId });
    await page.click('[data-testid="show-latest-revision"]');
    await page.waitForFunction(revision => document.querySelector('[data-testid="revision"]')?.textContent === `R${revision}`, {}, claimed.state.revision.number);
    await page.$$eval('[data-testid="inspector"] button', buttons => buttons.find(button => button.textContent === "后移 1 帧")!.click());
    await page.waitForFunction(revision => Number(document.querySelector('[data-testid="revision"]')?.textContent?.slice(1)) > revision, {}, claimed.state.revision.number);
    const edited = application.readProject(projectId);
    assert.equal(edited.snapshot.timeline.items.find(item => item.id === itemId)!.startFrame, 1);
    const latest = application.completeAgentWorkOrder({ projectId, baseRevision: edited.revision.number, workOrderId: order.id, agentId, completionKind: "edited", completionSummary: "测试将片段移动一帧。" }).state;
    const beforeRecheck = await application.readEditorialQualityReview({ projectId, revision: latest.revision.number });
    assert.ok(!beforeRecheck?.resolutions?.some(item => item.findingId === order.reviewContext?.findingIds?.[0]), "完成工作单不能自动关闭审阅问题");
    await page.reload({ waitUntil: "networkidle2" });
    assert.equal(new URL(page.url()).searchParams.get("productionRunId"), run.id);
    await page.click('[data-testid="workbench-review"] summary');
    await page.type('[aria-label="观察者"]', "审片者");
    await page.waitForFunction(revision => document.querySelector('[data-testid="revision"]')?.textContent === `R${revision}`, { timeout: 5000 }, latest.revision.number).catch(async error => {
      throw new Error(`切换到 R${latest.revision.number} 失败：${await page.$eval('[data-testid="revision"]', el => el.textContent)}；${page.url()}；${await page.$eval('.preview-controls .message', el => el.textContent)}；${projectReads.join("\n")}；${error}`);
    });
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="复查问题"] option').length > 1);
    await page.$$eval('[data-testid="workbench-review"] .workbench-finding', articles => {
      const finding = articles.find(article => article.textContent?.includes("第 5 至 11 帧文字被遮挡"));
      [...finding!.querySelectorAll("button")].find(button => button.textContent === "在本版复查")!.click();
    });
    await page.waitForFunction(() => (document.querySelector('[aria-label="审阅起帧"]') as HTMLInputElement)?.value === "5" && (document.querySelector('[aria-label="审阅结束帧"]') as HTMLInputElement)?.value === "14", { timeout: 5000 }).catch(async error => {
      throw new Error(`复查范围不符：${await page.$eval('[aria-label="审阅起帧"]', el => (el as HTMLInputElement).value)}–${await page.$eval('[aria-label="审阅结束帧"]', el => (el as HTMLInputElement).value)}；${await page.$eval('[data-testid="workbench-review"]', el => el.textContent)}；${error}`);
    });
    assert.equal(await page.$eval('[aria-label="观察方式"]', el => (el as HTMLSelectElement).value), "continuous_video");
    await page.$$eval("button", buttons => buttons.find(button => button.textContent === "播放范围")!.click());
    await page.waitForFunction(() => {
      const match = /F(\d+)/u.exec(document.querySelector(".preview-toolbar span:last-child")?.textContent ?? "");
      return Boolean(match && Number(match[1]) > 5 && Number(match[1]) < 14);
    });
    await page.type('[aria-label="实际观察"]', "连续复查该范围及运动，遮挡已消失");
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "保存观察并关闭已解决问题")!.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="workbench-review"] [role="status"]')?.textContent?.includes("已保存观察并复查该问题"), { timeout: 5000 }).catch(async error => {
      throw new Error(`复查失败：${await page.$eval('[data-testid="workbench-review"] [role="status"]', el => el.textContent)}；${error}`);
    });
    const review = await application.readEditorialQualityReview({ projectId, revision: latest.revision.number });
    assert.equal(review?.findings?.find(item => item.id === order.reviewContext?.findingIds?.[0])?.severity, "major");
    assert.ok((await application.readSkillExecutionReport({ projectId, runId: run.id })).editorialReviewHistory?.length);
    assert.ok(review?.resolutions?.some(item => item.findingId === order.reviewContext?.findingIds?.[0]));
    assert.equal(application.listJobs(projectId).filter(job => job.kind === "preview" || job.kind === "export").length, 0);
    assert.deepEqual(errors, []);

    const exportJob = application.repository.createJob({ projectId, kind: "export",
      payload: { revision: timed.revision.number }, idempotencyKey: "historical-reference-export" });
    const bytes = await readFile(mediaPath);
    const artifact = application.registerExportArtifact({ id: "historical-reference-export", projectId, revision: timed.revision.number,
      jobId: exportJob.id, purpose: "delivery", relativePath: "assets/source/review.mp4", fileHash: createHash("sha256").update(bytes).digest("hex"),
      fileSizeBytes: bytes.length, preflight: {} as never, sourceManifest: {} as never, createdAt: new Date().toISOString(),
      validation: { durationMs: 2000, fps: 24, frameCount: 48, hasAudio: false, blackSegments: [] } });
    const current = application.repository.commit(projectId, latest.revision.number, "后续取消原采用", snapshot => {
      snapshot.visualTreatments[0]!.adoptedDecisionRef = undefined;
    });
    assert.deepEqual(await application.readRevisionReferenceComparisons(projectId, current.revision.number, { startFrame: 5, endFrame: 12 }), []);
    const historical = await application.readProductionStatus(projectId, { referenceArtifactId: artifact.id });
    assert.equal(historical.referenceArtifact?.revision, timed.revision.number);
    assert.equal(historical.referenceComparisons?.[0]?.identity.decisionId, adoption.id);
    const referenceReview = referenceEvidence.referenceReviews![0]!;
    const artifactReview = { projectId, artifactId: artifact.id, operationId: "artifact-reference-review", observer: "测试审阅者",
      observations: [{ check: "reference" as const, required: true, method: "continuous_video" as const, outcome: "confirmed" as const,
        startFrame: 5, endFrame: 12, note: "对照成片与导出版本的参考", referenceReviews: [referenceReview] }] };
    await assert.rejects(application.recordExportArtifactReview({ ...artifactReview,
      observations: [{ ...artifactReview.observations[0]!, startFrame: 13, endFrame: 20 }] }), { code: "EDITORIAL_ADOPTION_INVALID" });
    const saved = await application.recordExportArtifactReview(artifactReview);
    assert.equal(saved.artifactReview?.observations?.[0]?.referenceReviews?.[0]?.decisionId, adoption.id);
  } finally {
    await browser?.close();
    await vite?.close();
    await server.close(); application.close();
    if (previousApi === undefined) delete process.env.VITE_API_BASE; else process.env.VITE_API_BASE = previousApi;
    await rm(root, { recursive: true, force: true });
  }
});
