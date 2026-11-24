import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import puppeteer from "puppeteer-core";
import { resolveRenderBrowser } from "../packages/remotion-runtime/src/browser.js";
import { createServer } from "../apps/server/src/app.js";
import { registerCreativeLibraryTools } from "../apps/server/src/creative-library-tools.js";
import { registerMotionLibraryTools } from "../apps/server/src/motion-library-tools.js";
import { loadCreativeIndex } from "../references/motion-cases/skillry/tools/creative-library.mjs";

test("独立案例库仍能复制实际库指纹并拖动视频", { timeout: 30_000 }, async () => {
  const script = `import functools,http.server,importlib.util,json,threading,urllib.request\n`+
    `spec=importlib.util.spec_from_file_location('preview',r'${resolve("references/motion-cases/skillry/tools/preview_server.py").replaceAll("\\", "\\\\")}')\n`+
    `mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)\n`+
    `server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(mod.PreviewHandler,directory=str(mod.ROOT)))\n`+
    `thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()\n`+
    `base='http://127.0.0.1:'+str(server.server_address[1])\n`+
    `info=json.load(urllib.request.urlopen(base+'/api/library/reference-info?kind=creative&id=002-c01'))\n`+
    `request=urllib.request.Request(base+'/library/cases/sab8a-475686-original/mechanisms/m03.mp4',headers={'Range':'bytes=0-99'})\n`+
    `response=urllib.request.urlopen(request);print(json.dumps({'info':info,'status':response.status,'bytes':len(response.read())}))\n`+
    `server.shutdown();server.server_close()\n`;
  const {stdout}=await promisify(execFile)("python",["-c",script],{windowsHide:true});
  const result=JSON.parse(stdout);
  assert.equal(result.info.source_sha256,loadCreativeIndex(resolve("references/motion-cases/skillry")).source_sha256);
  assert.equal(result.status,206);assert.equal(result.bytes,100);
});

const teachingVideos = ["/teaching/r40/R40完整预览.mp4", "/teaching/airfare/preview.mp4",
  "/teaching/ai-brakes/《AI的油门与刹车》R144原版成片.mp4"];

test("工作台教学媒体支持媒体范围请求", async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-teaching-range-"));
  const { app, application } = await createServer({ workspaceRoot: directory });
  try {
    for (const media of teachingVideos) {
      const bytes = await app.inject({ url: encodeURI(media), headers: { range: "bytes=32768-32867" } });
      assert.equal(bytes.statusCode, 206, media);
      assert.equal(bytes.rawPayload.length, 100, media);
    }
  } finally {
    await app.close(); application.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("工作台的 R40、机票退改与 0.1.92 教学可直接播放和定位", { timeout: 30_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-teaching-player-"));
  const browserExecutable = await resolveRenderBrowser();
  const previous = process.env.VIDEOFLOWCUT_RUNTIME_DIST;
  process.env.VIDEOFLOWCUT_RUNTIME_DIST = resolve("plugins/videoflowcut/runtime/dist");
  const { app, application } = await createServer({ workspaceRoot: directory });
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const origin = await app.listen({ host: "127.0.0.1", port: 0 });
    browser = await puppeteer.launch({ executablePath: browserExecutable, headless: true, pipe: true, args: ["--autoplay-policy=no-user-gesture-required"] });
    for (const media of teachingVideos) {
      const page = await browser.newPage();
      await page.goto(origin);
      const result = await page.evaluate(async (url: string) => {
        const video = document.createElement("video"); video.src = url; video.muted = true; document.body.append(video);
        await video.play(); await new Promise(resolve => setTimeout(resolve, 700));
        return { time: video.currentTime, ready: video.readyState };
      }, new URL(media, origin).href);
      assert.ok(result.time > 0 && result.ready >= 2, media);
      await page.close();
    }
  } finally {
    await browser?.close(); await app.close(); application.close();
    if (previous === undefined) delete process.env.VIDEOFLOWCUT_RUNTIME_DIST; else process.env.VIDEOFLOWCUT_RUNTIME_DIST = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test("两类读卡可重开选段，切片与原片共用源时间并返回连续帧", { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vfc-reference-player-"));
  const {app, application} = await createServer({workspaceRoot:directory});
  const server=new McpServer({name:"隔离参考库",version:"1"}),client=new Client({name:"隔离作者",version:"1"});
  const [local,remote]=InMemoryTransport.createLinkedPair();
  const previousOrigin=process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const origin=await app.listen({host:"127.0.0.1",port:0});
    process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN=origin;
    const root=resolve("references/motion-cases/skillry");
    registerMotionLibraryTools(server,root);registerCreativeLibraryTools(server,root);
    await server.connect(remote);await client.connect(local);
    const call=async(name:string,args:Record<string,unknown>)=>{
      const result=await client.callTool({name,arguments:args});
      assert.notEqual(result.isError,true,JSON.stringify(result.content));
      return result as { content: Array<{type:string;text?:string;data?:string}> };
    };
    const motion=JSON.parse((await call("read_motion_mechanism",{id:"001-m03",include_storyboard:false})).content[0]!.text!);
    const creative=JSON.parse((await call("read_creative_case",{id:"002-c01",range:{startMs:100,endMs:900},include_storyboard:false})).content[0]!.text!);
    assert.equal(motion.kind,"motion");assert.deepEqual(motion.range,{startMs:3850,endMs:5200});assert.equal(motion.clip_source_offset_ms,3850);
    assert.equal(creative.kind,"creative");assert.deepEqual(creative.range,{startMs:100,endMs:900});
    const fractional=JSON.parse((await call("read_creative_case",{id:"002-c01",range:{startMs:100.5,endMs:900.25},include_storyboard:false})).content[0]!.text!);
    assert.equal(new URL(fractional.preview_url).searchParams.get("startMs"),"100.5");
    assert.equal(new URL(fractional.preview_url).searchParams.get("endMs"),"900.25");
    for(const data of [motion,creative]){assert.equal(new URL(data.preview_url).origin,origin);assert.equal(new URL(data.preview_url).searchParams.get("source_sha256"),data.source_sha256);}
    const bytes=await app.inject({url:`/library/${motion.card.clip.path}`,headers:{range:"bytes=0-99"}});
    assert.equal(bytes.statusCode,206);assert.equal(bytes.rawPayload.length,100);assert.match(String(bytes.headers["content-range"]),/^bytes 0-99\//u);
    const frames=await call("inspect_motion_reference_frames",{id:"001-m03",source_sha256:motion.source_sha256,range:{startMs:3850,endMs:4050}});
    const summary=JSON.parse(frames.content[0]!.text!);
    assert.ok(summary.frame_count>1);assert.equal(frames.content.filter((part:any)=>part.type==="image").length,summary.frame_count);
    const labels=frames.content.filter((part:any)=>part.type==="text").slice(1).map((part:any)=>Number(part.text.match(/[\d.]+/u)[0]));
    assert.ok(labels[0]<=3850&&labels.every((time:number,index:number)=>time<4050&&(index===0||time>labels[index-1])));
    assert.equal(summary.first_source_ms,labels[0]);
    const whole=await call("inspect_motion_reference_frames",{id:"001-m03",source_sha256:motion.source_sha256,range:{startMs:3850,endMs:5200}});
    const wholeSummary=JSON.parse(whole.content[0]!.text!);
    assert.equal(whole.content.filter(part=>part.type==="image").length,wholeSummary.frame_count);
    assert.equal(wholeSummary.frame_count,33,"作者可核对完整源帧，不能误写成模型实际收到的帧数");

    browser=await puppeteer.launch({executablePath:await resolveRenderBrowser(),headless:true,pipe:true,args:["--autoplay-policy=no-user-gesture-required"]});
    const page=await browser.newPage();
    await page.goto(motion.preview_url);await page.waitForSelector("#segments video");
    await page.waitForFunction(()=>document.querySelector<HTMLVideoElement>("#segments video")!.readyState>=1);
    await page.evaluate(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;video.currentTime=0.4;});
    await page.waitForFunction(()=>document.querySelector("#segments .mechanism-clip p")?.textContent?.includes("4.250"));
    await page.evaluate(()=>{const select=document.querySelector<HTMLSelectElement>("#segments select")!;select.value="0.25";select.dispatchEvent(new Event("change"));});
    assert.equal(await page.$eval("#segments video",(video:HTMLVideoElement)=>video.playbackRate),0.25);
    await page.evaluate(()=>[...document.querySelectorAll<HTMLButtonElement>("#segments button")].find(button=>button.textContent==="查看完整原片")!.click());
    try { await page.waitForFunction(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;return video.src.endsWith("video.mp4")&&video.readyState>=1&&Math.abs(video.currentTime-4.25)<0.06;},{timeout:8000}); }
    catch (error) { throw new Error(`切回原片失败：${JSON.stringify(await page.$eval("#segments video",(video:HTMLVideoElement)=>({src:video.src,time:video.currentTime,ready:video.readyState,network:video.networkState,error:video.error?.message})))}；${String(error)}`); }
    assert.equal(await page.$eval("#segments video",(video:HTMLVideoElement)=>video.playbackRate),0.25);
    assert.match(await page.$eval("#segments .mechanism-clip p",node=>node.textContent||""),/3\.850–5\.200/);
    await page.evaluate(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;const loop=document.querySelector<HTMLInputElement>("#segments input[type=checkbox]")!;loop.click();video.playbackRate=1;video.currentTime=5.17;void video.play();});
    await page.waitForFunction(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;return !video.paused&&video.currentTime>=3.85&&video.currentTime<4.2;},{timeout:8000});
    await page.evaluate(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;video.pause();video.currentTime=4.25;});
    await page.evaluate(()=>[...document.querySelectorAll<HTMLButtonElement>("#segments button")].find(button=>button.textContent==="切回切片")!.click());
    await page.waitForFunction(()=>{const video=document.querySelector<HTMLVideoElement>("#segments video")!;return video.src.endsWith("m03.mp4")&&Math.abs(video.currentTime-0.4)<0.06;},{timeout:8000});
    await page.evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: function(value) { window.__referenceCopy = value; return Promise.resolve(); } } })`);
    await page.evaluate(()=>[...document.querySelectorAll<HTMLButtonElement>("#segments button")].find(button=>button.textContent==="复制当前选段")!.click());
    await page.waitForFunction(()=>Boolean((window as any).__referenceCopy),{timeout:5000});
    const copied=JSON.parse(await page.evaluate(()=>(window as any).__referenceCopy));
    assert.deepEqual(copied.range,{startMs:3850,endMs:5200});assert.equal(copied.source_sha256,motion.source_sha256);
    const second=await browser.newPage();await second.goto(copied.preview_url);await second.waitForSelector("#segments video");
    assert.match(await second.$eval("#segments .mechanism-clip p",node=>node.textContent||""),/3\.850–5\.200/);
    const wider=new URL(copied.preview_url);wider.searchParams.set("startMs","3500");wider.searchParams.set("endMs","5500");
    await second.goto(wider.href);await second.waitForSelector("#segments video");
    await second.waitForFunction(()=>document.querySelector<HTMLVideoElement>("#segments video")!.readyState>=1);
    await second.evaluate(()=>{document.querySelector<HTMLInputElement>("#segments input[type=checkbox]")!.click();[...document.querySelectorAll<HTMLButtonElement>("#segments button")].find(button=>button.textContent==="切回切片")!.click();});
    await second.waitForFunction(()=>document.querySelector<HTMLVideoElement>("#segments video")!.src.endsWith("m03.mp4"));
    assert.equal(await second.$eval("#segments input[type=checkbox]",(input:HTMLInputElement)=>input.checked),false);
    assert.match(await second.$eval("#segments .mechanism-clip p",node=>node.textContent||""),/3\.500–5\.500/);
    await second.goto(creative.preview_url);await second.waitForSelector(".creative-card video");
    assert.equal(await second.$eval(".creative-card .num",node=>node.textContent),"002-c01");
    assert.match(await second.$eval(".creative-card .mechanism-clip p",node=>node.textContent||""),/0\.100–0\.900/);
    await second.goto(fractional.preview_url);await second.waitForSelector(".creative-card video");
    assert.match(await second.$eval(".creative-card .mechanism-clip p",node=>node.textContent||""),/100\.5–900\.25 毫秒/);
    await second.goto(`${origin}/library/creative.html?card=002-c01`);await second.waitForSelector(".creative-card video");
    await second.evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: function(value) { window.__referenceCopy = value; return Promise.resolve(); } } })`);
    await second.evaluate(()=>[...document.querySelectorAll<HTMLButtonElement>(".creative-card button")].find(button=>button.textContent==="复制当前选段")!.click());
    await second.waitForFunction(()=>Boolean((window as any).__referenceCopy),{timeout:8000});
    assert.equal(JSON.parse(await second.evaluate(()=>(window as any).__referenceCopy)).source_sha256,creative.source_sha256);
  } finally {
    if(previousOrigin===undefined)delete process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN;else process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN=previousOrigin;
    await browser?.close();await client.close();await server.close();await app.close();application.close();await rm(directory,{recursive:true,force:true});
  }
});
