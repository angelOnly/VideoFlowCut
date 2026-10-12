import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { DEFAULT_CAPTION_FORMAT, type CaptionCard } from "@videocut/contracts";
import { runProcess } from "@videocut/speech";
import { bindMotionFonts } from "../packages/motion-work/src/fonts.js";
import { resolveRenderBrowser, RevisionRenderer, startProjectMediaServer } from "../apps/render-worker/src/exporter.js";
import { captionCanvasFont, resolveCaptionLayoutInput } from "../packages/remotion-runtime/src/caption-layout.js";
import { measureCaptionLayouts, measureCaptionTextInBrowser } from "../packages/quality-system/src/caption-measurement.js";

test("统一字幕按一行两行一行改变背景且底部固定，字体与质量测量一致，预览导出像素一致", { timeout: 240_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-caption-unified-"));
  const app = createApplication(root);
  const snapshot = structuredClone(app.createProject({ name: "全片字幕隔离验证" }).snapshot);
  snapshot.timeline.width = 480;
  snapshot.timeline.height = 320;
  snapshot.timeline.durationInFrames = 16;
  const { slot: _slot, ...font } = bindMotionFonts({ fontBindings: { caption: "noto-sans-sc-bold" } })[0]!;
  const format = { ...DEFAULT_CAPTION_FORMAT, fontId: font.fontId, font, fontSize: 24, fontWeight: 700,
    lineHeight: 1.5, maxLines: 2 as const, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: "#173955", borderRadius: 5, boxWidth: "full" as const, textShadow: null };
  snapshot.timeline.captionFormat = format;
  const card = (id: string, text: string, startFrame: number, endFrame: number): CaptionCard => ({ id, text, sourceText: text,
    startFrame, endFrame, style: "stable", precision: "word_exact", format: { ...DEFAULT_CAPTION_FORMAT, fontSize: 65, color: "#ff0000", bottomPercent: 50 },
    emphasis: { text: "普通", occurrence: 0, scale: 2, color: "#00ff00", fontWeight: 900 } });
  snapshot.timeline.captions = [
    card("short", "普通字幕", 0, 3),
    card("long", "普通字幕的第一行\n第二行准确文字", 3, 6),
    card("short-again", "普通字幕再次出现", 6, 9),
    card("wrapped", "普通字幕的较长句子需要按真实字体宽度换成两行", 12, 16)
  ];
  const media = await startProjectMediaServer(snapshot);
  const browser = await puppeteer.launch({ executablePath: await resolveRenderBrowser(), headless: true, pipe: true });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    let fontRequests = 0;
    let releaseFont!: () => void;
    let fontRequested!: () => void;
    const fontGate = new Promise<void>(resolve => { releaseFont = resolve; });
    const fontSeen = new Promise<void>(resolve => { fontRequested = resolve; });
    await page.setRequestInterception(true);
    page.on("request", request => {
      if (request.url().includes("/api/motion/fonts/") && request.method() === "GET") {
        fontRequests++;
        fontRequested();
        void fontGate.then(() => request.continue());
      } else void request.continue();
    });
    page.on("pageerror", error => errors.push(String(error)));
    await page.setViewport({ width: 600, height: 400 });
    await page.setContent('<div id="root"></div>');
    const bundled = await build({ stdin: { contents: `
      import React from 'react'; import {createRoot} from 'react-dom/client'; import {Player} from '@remotion/player';
      import {useCurrentFrame} from 'remotion'; import {ProjectComposition} from './packages/remotion-runtime/src/index';
      import {captionFontIsLoaded} from './packages/remotion-runtime/src/caption-font';
      const snapshot = ${JSON.stringify(snapshot)};
      window.captionReady = () => captionFontIsLoaded(snapshot.timeline.captionFormat.font, ${JSON.stringify(media.mediaBaseUrl)});
      const ref = React.createRef(); window.player = ref;
      const Scene = () => { const frame = useCurrentFrame(); return <><ProjectComposition snapshot={snapshot} mediaBaseUrl=${JSON.stringify(media.mediaBaseUrl)}/><div id="moving-scene" style={{position:'absolute',transform:'translateX('+frame*9+'px) scale('+(1+frame/20)+')',width:80,height:80,background:'red'}}/></>; };
      createRoot(document.getElementById('root')).render(<Player ref={ref} component={Scene} compositionWidth={480} compositionHeight={320} durationInFrames={16} fps={24} style={{width:480,height:320}}/>);
    `, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", define: { "process.env.NODE_ENV": '"production"' } });
    await page.addScriptTag({ content: bundled.outputFiles[0]!.text });
    await fontSeen;
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-caption-track]"))), false, "字体未载入前不绘制回退字形或空底板");
    releaseFont();
    await page.waitForSelector('[data-caption-layout="actual-1-lines"]');
    const loadedFontRequests = fontRequests;
    const geometry = () => page.evaluate(() => {
      const box = document.querySelector<HTMLElement>("[data-caption-layout]")!;
      const text = box.firstChild!;
      const range = document.createRange(); range.setStart(text, 0); range.setEnd(text, 1);
      const rect = box.getBoundingClientRect(), first = range.getBoundingClientRect(), style = getComputedStyle(box);
      return { x: rect.x, y: rect.y, bottom: rect.bottom, height: rect.height, width: rect.width, baselineTop: first.top, font: style.fontFamily,
        fontSize: style.fontSize, color: style.color, emphasized: box.children.length, moving: getComputedStyle(document.querySelector("#moving-scene")!).transform };
    });
    const first = await geometry();
    await page.evaluate(() => (window as unknown as { player: { current: { seekTo(frame: number): void } } }).player.current.seekTo(4));
    await page.waitForSelector('[data-caption-layout="actual-2-lines"]');
    const second = await geometry();
    await page.evaluate(() => (window as unknown as { player: { current: { seekTo(frame: number): void } } }).player.current.seekTo(7));
    await page.waitForSelector('[data-caption-layout="actual-1-lines"]');
    const third = await geometry();
    assert.deepEqual({ ...first, moving: "" }, { ...third, moving: "" }, "两行切回一行立即恢复同一底部、字号和背景高度");
    assert.equal(first.bottom, second.bottom, "向上扩展背景，底部不随行数移动");
    assert.equal(second.y, first.y - 36);
    assert.equal(second.height, 84);
    assert.equal(second.emphasized, 0);
    await page.evaluate(() => (window as unknown as { player: { current: { seekTo(frame: number): void } } }).player.current.seekTo(10));
    await page.waitForFunction(() => !document.querySelector("[data-caption-layout]"));
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-caption-track]"))), false, "无字幕时不保留底板");
    assert.equal(await page.evaluate(() => (window as unknown as { captionReady(): boolean }).captionReady()), true, "空档后再入场可同步判定字形已加载");
    await page.evaluate(() => (window as unknown as { player: { current: { seekTo(frame: number): void } } }).player.current.seekTo(13));
    await page.waitForSelector('[data-caption-layout="actual-2-lines"]');
    const wrapped = await geometry();
    assert.equal(wrapped.height, second.height, "长句自动换行与明确两行使用同一背景计算");
    assert.equal(wrapped.bottom, first.bottom);
    assert.equal(fontRequests, loadedFontRequests, "字体首次就绪后，换卡及空档后再显示不重复请求");
    assert.notEqual(first.moving, second.moving, "主画面确实发生平移与缩放");
    assert.equal(first.height, 48);
    assert.equal(first.font, font.family);
    assert.equal(first.fontSize, "24px");
    assert.equal(first.emphasized, 0, "局部强调和字号不能覆盖全片规范");
    const input = { text: "普通字幕", compositionWidth: 480, compositionHeight: 320, format };
    const cssFont = captionCanvasFont(resolveCaptionLayoutInput(input)!);
    const playerWidth = await page.evaluate(({ cssFont }) => {
      const context = document.createElement("canvas").getContext("2d")!;
      context.font = cssFont; return context.measureText("普通字幕").width;
    }, { cssFont });
    const widths = await measureCaptionTextInBrowser([{ font: cssFont, texts: [input.text], registeredFont: font }]);
    assert.equal(playerWidth, widths[0]![0], "Player 与独立质量浏览器消费同一登记字形");
    assert.deepEqual(errors, []);
    const [singleOverflow, shortFits, twoLineOverflow] = await measureCaptionLayouts([
      { ...input, text: "这是一条必须重新分卡不能缩字的长字幕内容", format: { ...format, maxLines: 1 } },
      { ...input, text: "短", compositionHeight: 80 },
      { ...input, text: "第一行\n第二行", compositionHeight: 80 }
    ]);
    assert.equal(singleOverflow!.ready, false);
    assert.equal(shortFits!.ready, true, "单行不能因预留不存在的第二行而误报越界");
    assert.equal(twoLineOverflow!.ready, false, "两行按实际高度阻止越界");
    await assert.rejects(measureCaptionTextInBrowser([{ font: cssFont, texts: [input.text], registeredFont: { ...font, hash: "0".repeat(64) } }]), /CAPTION_FONT_BINDING_INVALID/u);

    const renderer = new RevisionRenderer(undefined, 1);
    async function pixels(full: boolean) {
      const target = join(root, full ? "export.mp4" : "preview.mp4");
      if (full) await renderer.render(snapshot, target); else await renderer.renderRange(snapshot, 0, 16, target);
      const image = `${target}.png`;
      await runProcess("ffmpeg", ["-y", "-i", target, "-frames:v", "1", image]);
      const frames = `${target}.rgba`;
      await runProcess("ffmpeg", ["-y", "-i", target, "-f", "rawvideo", "-pix_fmt", "rgba", frames]);
      return { image: await readFile(image), frames: await readFile(frames) };
    }
    const previewPixels = await pixels(false);
    const exportPixels = await pixels(true);
    assert.deepEqual(previewPixels.frames, exportPixels.frames, "一行、两行、无字幕和自动换行在预览与导出的全部帧像素一致");
    const decoded = PNG.sync.read(previewPixels.image);
    let visibleGlyphPixels = 0;
    for (let i = 0; i < decoded.data.length; i += 4) {
      if (decoded.data[i]! > 220 && decoded.data[i + 1]! > 220 && decoded.data[i + 2]! > 220) visibleGlyphPixels++;
    }
    assert.ok(visibleGlyphPixels > 100, "异步字体等待完成后真实导出必须包含字幕字形，不能两条空画面互相比对通过");
    snapshot.timeline.captionFormat!.font!.hash = "0".repeat(64);
    snapshot.timeline.captionFormat!.font!.family = `VFC_${"0".repeat(64)}`;
    await assert.rejects(renderer.renderRange(snapshot, 0, 1, join(root, "font-failure.mp4")), /CAPTION_FONT_LOAD_FAILED/u);
  } finally {
    await browser.close(); await media.close(); app.close();
    await rm(root, { recursive: true, force: true });
  }
});
