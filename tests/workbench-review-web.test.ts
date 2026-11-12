import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import puppeteer from "puppeteer-core";
import { createServer as createViteServer } from "vite";
import { createServer } from "../apps/server/src/app.js";
import { resolveRenderBrowser } from "../packages/remotion-runtime/src/browser.js";
import { runProcess } from "@videocut/speech";

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
    const timed = application.buildPresenterTimeline({ projectId, baseRevision: application.readProject(projectId).revision.number, assetIds: [asset.asset.id] });
    const run = await application.startProductionRun({ operationId: globalThis.crypto.randomUUID(), intent: "local_edit", completionScope: { kind: "project" }, projectId, baseRevision: timed.revision.number, loadedSkills: ["web-editor-operator"] });
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
    assert.equal(reviewAfterRetry?.findings.length, 1);
    assert.equal(reviewAfterRetry?.evidenceRecords?.length, 1);
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
    assert.equal(beforeRecheck?.resolutions?.length ?? 0, 0, "完成工作单不能自动关闭审阅问题");
    await page.reload({ waitUntil: "networkidle2" });
    assert.equal(new URL(page.url()).searchParams.get("productionRunId"), run.id);
    await page.click('[data-testid="workbench-review"] summary');
    await page.type('[aria-label="观察者"]', "审片者");
    await page.waitForFunction(revision => document.querySelector('[data-testid="revision"]')?.textContent === `R${revision}`, { timeout: 5000 }, latest.revision.number).catch(async error => {
      throw new Error(`切换到 R${latest.revision.number} 失败：${await page.$eval('[data-testid="revision"]', el => el.textContent)}；${page.url()}；${await page.$eval('.preview-controls .message', el => el.textContent)}；${projectReads.join("\n")}；${error}`);
    });
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="复查问题"] option').length > 1);
    await page.$$eval('[data-testid="workbench-review"] button', buttons => buttons.find(button => button.textContent === "在本版复查")!.click());
    await page.waitForFunction(() => (document.querySelector('[aria-label="审阅起帧"]') as HTMLInputElement)?.value === "5" && (document.querySelector('[aria-label="审阅结束帧"]') as HTMLInputElement)?.value === "14");
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
    assert.equal(review?.findings?.[0]?.severity, "major");
    assert.ok((await application.readSkillExecutionReport({ projectId, runId: run.id })).editorialReviewHistory?.length);
    assert.equal(review?.resolutions?.[0]?.findingId, order.reviewContext?.findingIds?.[0]);
    assert.equal(application.listJobs(projectId).filter(job => job.kind === "preview" || job.kind === "export").length, 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await vite?.close();
    await server.close(); application.close();
    if (previousApi === undefined) delete process.env.VITE_API_BASE; else process.env.VITE_API_BASE = previousApi;
    await rm(root, { recursive: true, force: true });
  }
});
