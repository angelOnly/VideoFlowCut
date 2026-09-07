import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { z } from "zod";
import { validateMotionSource } from "../packages/motion-work/src/compiler.js";

/** 仅渲染随仓库审阅的教学源码；不连接 MCP、数据库或正式视频项目。 */
const root = process.cwd();
const casesRoot = join(root, ".agents/skills/motion-case-library/assets/cases");
const outputRoot = join(root, "previews/motion-cases");
const fixtureSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().min(64).max(1920),
  height: z.number().int().min(64).max(1920),
  fps: z.number().int().min(15).max(60),
  durationInFrames: z.number().int().min(2).max(900),
  props: z.record(z.unknown()).default({}),
  reviewFrames: z.array(z.number().int().nonnegative()).min(1),
}).superRefine((value, context) => {
  if (value.width % 2 || value.height % 2 || value.durationInFrames / value.fps > 30) {
    context.addIssue({ code: "custom", message: "案例必须使用偶数画布尺寸，且不超过 30 秒" });
  }
  if (value.reviewFrames.some((frame) => frame >= value.durationInFrames)) {
    context.addIssue({ code: "custom", message: "审阅帧超出作品长度" });
  }
});

const args = process.argv.slice(2);
const stillsOnly = args.includes("--stills");
const offline = args.includes("--offline");
const names = args.filter((arg) => arg !== "--stills" && arg !== "--offline");
const available = (await readdir(casesRoot)).filter((file) => file.endsWith(".tsx")).map((file) => file.slice(0, -4)).sort();
if (!available.length) throw new Error("案例源码目录为空");
if (names.some((name) => !available.includes(name))) throw new Error(`支持的案例：${available.join(", ")}`);
const selected = names.length ? available.filter((name) => names.includes(name)) : available;
const cases = await Promise.all(selected.map(async (id) => {
  const source = await readFile(join(casesRoot, `${id}.tsx`), "utf8");
  if (source.length > 60_000) throw new Error(`${id} 超出 MotionWork 源码大小限制`);
  validateMotionSource(source);
  const fixture = fixtureSchema.parse(JSON.parse(await readFile(join(casesRoot, `${id}.fixture.json`), "utf8")));
  return { id, ...fixture };
}));

await mkdir(join(root, ".candidate"), { recursive: true });
await mkdir(outputRoot, { recursive: true });
const working = await mkdtemp(join(root, ".candidate/motion-cases-"));
const entryPoint = join(working, "root.tsx");
const imports = cases.map((item, index) => `import Case${index} from ${JSON.stringify(resolve(casesRoot, `${item.id}.tsx`))};`).join("\n");
const compositions = cases.map((item, index) => `<Composition id=${JSON.stringify(item.id)} component={Case${index}} width={${item.width}} height={${item.height}} fps={${item.fps}} durationInFrames={${item.durationInFrames}} defaultProps={${JSON.stringify(item.props)}} />`).join("\n");
await writeFile(entryPoint, `import React from 'react';\nimport {Composition,registerRoot} from 'remotion';\n${imports}\nregisterRoot(()=> <>${compositions}</>);\n`);

try {
  // 无本地 HTTP 服务的开发预览，同样运行真实 Remotion Player。
  // 仅允许上面枚举的仓库教学源码；不是受管作品的生产隔离或入库通道。
  if (offline) {
    const browser = await openBrowser("chrome", { logLevel: "warn" });
    try {
      for (const item of cases) {
        const directory = join(outputRoot, item.id);
        await mkdir(directory, { recursive: true });
        const frameDirectory = join(working, item.id);
        await mkdir(frameDirectory);
        const playerEntry = `import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import {Player} from '@remotion/player';import Motion from ${JSON.stringify(resolve(casesRoot, `${item.id}.tsx`))};
const ref=React.createRef();flushSync(()=>createRoot(document.getElementById('root')).render(React.createElement(Player,{ref,component:Motion,inputProps:${JSON.stringify(item.props)},durationInFrames:${item.durationInFrames},fps:${item.fps},compositionWidth:${item.width},compositionHeight:${item.height},controls:false,autoPlay:false,style:{width:${item.width},height:${item.height}}})));
window.seek=async frame=>{ref.current.seekTo(frame);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await document.fonts.ready;};`;
        const built = await build({ stdin: { contents: playerEntry, loader: "tsx", resolveDir: root }, bundle: true, write: false, platform: "browser", format: "iife", minify: true, define: { "process.env.NODE_ENV": '"production"' } });
        const js = built.outputFiles[0].text.replace(/<\/script/giu, "<\\/script");
        const html = `<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';img-src data:;font-src data:;media-src data:;connect-src 'none'"><style>html,body{margin:0;overflow:hidden;background:#edf0eb}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
        const errors: string[] = [];
        const page = await browser.newPage({ context: () => null, logLevel: "warn", indent: false, pageIndex: 0, onBrowserLog: (message) => { if (message.type === "error") errors.push(message.text); }, onLog: () => undefined });
        try {
          await page.setViewport({ width: item.width, height: item.height, deviceScaleFactor: 1 });
          await page.goto({ url: `data:text/html;base64,${Buffer.from(html).toString("base64")}`, timeout: 30_000 });
          const frames = stillsOnly ? item.reviewFrames : Array.from({ length: item.durationInFrames }, (_, index) => index);
          for (const frame of frames) {
            await page.evaluate(`window.seek(${frame})`);
            if (errors.length) throw new Error(errors.join("\n"));
            const result = await page._client().send("Page.captureScreenshot", { format: "png", fromSurface: true });
            const bytes = Buffer.from(result.value.data, "base64");
            if (!stillsOnly) await writeFile(join(frameDirectory, `${String(frame).padStart(5, "0")}.png`), bytes);
            if (item.reviewFrames.includes(frame)) await writeFile(join(directory, `frame-${String(frame).padStart(4, "0")}.png`), bytes);
          }
        } finally { await page.close(); }
        if (!stillsOnly) {
          const target = join(outputRoot, `${item.id}.mp4`);
          await new Promise<void>((done, reject) => {
            const child = spawn("ffmpeg", ["-y", "-v", "error", "-framerate", String(item.fps), "-i", join(frameDirectory, "%05d.png"), "-frames:v", String(item.durationInFrames), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", target], { stdio: "inherit" });
            child.once("error", reject);
            child.once("exit", (code) => code === 0 ? done() : reject(new Error(`ffmpeg 退出码 ${code}`)));
          });
        }
        console.log(`${item.id}：离线 ${stillsOnly ? "审阅帧" : "MP4 与审阅帧"} 已生成`);
      }
    } finally { await browser.close({ silent: true }); }
  } else {
    const serveUrl = await bundle({ entryPoint, outDir: join(working, "bundle"), publicDir: null });
    const browser = await openBrowser("chrome", { logLevel: "warn" });
    try {
      for (const item of cases) {
        const directory = join(outputRoot, item.id);
        await mkdir(directory, { recursive: true });
        const composition = await selectComposition({ serveUrl, id: item.id, inputProps: item.props, puppeteerInstance: browser });
        for (const frame of item.reviewFrames) {
          await renderStill({ serveUrl, composition, inputProps: item.props, frame, imageFormat: "png", output: join(directory, `frame-${String(frame).padStart(4, "0")}.png`), puppeteerInstance: browser, logLevel: "warn" });
        }
        console.log(`${item.id}：${item.reviewFrames.length} 张审阅帧已生成`);
        if (!stillsOnly) {
          const outputLocation = join(outputRoot, `${item.id}.mp4`);
          await renderMedia({ serveUrl, composition, inputProps: item.props, codec: "h264", pixelFormat: "yuv420p", crf: 18, outputLocation, concurrency: 3, puppeteerInstance: browser, logLevel: "warn" });
          console.log(`${item.id}：${outputLocation}`);
        }
      }
    } finally {
      await browser.close({ silent: true });
    }
  }
} finally {
  await rm(working, { recursive: true, force: true });
}
