import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import puppeteer from "puppeteer-core";
import { ensureBrowser } from "@remotion/renderer";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ensureRuntime, findAvailablePort, stopRuntime } from "../plugins/videoflowcut/scripts/runtime-launcher.mjs";

// 验收只启动独立目录、端口和队列；素材导入到作品提交全部经过发行 MCP。
const repoRoot = resolve("."), pluginRoot = join(repoRoot, "plugins/videoflowcut");
const output = resolve(process.argv[2] ?? "docs/development/object-resources-20261018");
const workspaceRoot = join(repoRoot, ".candidate", `object-resources-${createHash("sha256").update(output).digest("hex").slice(0, 12)}`);
await mkdir(output, { recursive: true });
const options = { pluginRoot, repoRoot, workspaceRoot, port: await findAvailablePort(), bridgeUrl: "http://127.0.0.1:18199" };
const audit = await readFile(join(output, "mcp-audit.json"), "utf8").then(JSON.parse).catch(error => { if (error.code === "ENOENT") return []; throw error; });
const previousResult = name => {
  const saved = audit.find(item => item.name === name && !item.response.isError);
  return saved ? JSON.parse(saved.response.content.find(c => c.type === "text").text) : undefined;
};
let transport;
try {
  const runtime = await ensureRuntime(options);
  transport = new StdioClientTransport({ command: process.execPath, args: [join(pluginRoot, "scripts/mcp-launcher.mjs")], cwd: repoRoot, stderr: "pipe",
    env: { ...process.env, VIDEOFLOWCUT_REPO_ROOT: repoRoot, VIDEOCUT_WORKSPACE: workspaceRoot, VIDEOFLOWCUT_PORT: String(options.port), COMFYUI_BRIDGE_URL: options.bridgeUrl } });
  const client = new Client({ name: "object-resource-release-verification", version: "1.0.0" });
  await client.connect(transport);
  const call = async (name, args = {}) => {
    const raw = await client.callTool({ name, arguments: args }, undefined, { timeout: 120000 });
    audit.push({ name, input: args, response: raw });
    await writeFile(join(output, "mcp-audit.json"), JSON.stringify(audit, null, 2));
    const value = raw.content?.find(c => c.type === "text")?.text;
    assert.notEqual(raw.isError, true, value); assert.equal(typeof value, "string");
    return JSON.parse(value);
  };
  const wait = async id => {
    const deadline = Date.now() + 240000;
    while (Date.now() < deadline) {
      const job = await call("track_job", { job_id: id });
      if (job.status === "succeeded") return job;
      assert.ok(!["failed", "cancelled", "unknown"].includes(job.status), JSON.stringify(job));
      await new Promise(resolve => setTimeout(resolve, 750));
    }
    throw new Error(`任务超时，保留原 Job：${id}`);
  };
  const listed = await client.listTools();
  for (const name of ["prepare_object_resources", "read_object_resource_capabilities"]) assert.ok(listed.tools.some(t => t.name === name));
  const release = await call("read_runtime_release"); assert.equal(release.aligned, true);
  const capability = await call("read_object_resource_capabilities"); assert.equal(capability.available, true);
  await writeFile(join(output, "release.json"), JSON.stringify({ release, capability, runtime: { port: options.port, workspaceRoot } }, null, 2));

  // 本验收原创的罗盘部件；不是原案例换标签，针和表盘分别保留可控结构。
  const ticks = Array.from({ length: 72 }, (_, i) => `<path d="M220 ${i % 6 ? 81 : 74}v${i % 6 ? 8 : 18}" transform="rotate(${i * 5} 220 220)" stroke="#334749" stroke-width="${i % 6 ? 1 : 2}"/>`).join("");
  const screws = [45, 135, 225, 315].map(angle => `<g transform="rotate(${angle} 220 220)"><circle cx="220" cy="51" r="6" fill="#f4db91" stroke="#67451b"/><path d="M216 51h8" stroke="#67451b"/></g>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="440"><defs><linearGradient id="brass" x2="1" y2="1"><stop stop-color="#f2d896"/><stop offset=".25" stop-color="#8e672b"/><stop offset=".47" stop-color="#e5bd64"/><stop offset=".72" stop-color="#6c481d"/><stop offset="1" stop-color="#dbc083"/></linearGradient><radialGradient id="face"><stop stop-color="#fff8db"/><stop offset=".8" stop-color="#ebe1ba"/><stop offset="1" stop-color="#bbad83"/></radialGradient></defs><circle cx="220" cy="224" r="190" fill="#3b2a17"/><circle cx="220" cy="220" r="188" fill="url(#brass)" stroke="#efd99f" stroke-width="2"/><circle cx="220" cy="220" r="175" fill="none" stroke="#654922"/><circle cx="220" cy="220" r="155" fill="url(#face)" stroke="#382f20" stroke-width="7"/><circle cx="220" cy="220" r="105" fill="none" stroke="#b7aa84"/>${ticks}${screws}<g fill="#203c3e" font-family="Georgia" font-size="24" text-anchor="middle"><text x="220" y="119">N</text><text x="220" y="337">S</text><text x="111" y="228">W</text><text x="329" y="228">E</text></g><path d="M220 134l9 77 77 9-77 9-9 77-9-77-77-9 77-9z" fill="#b2b69d" opacity=".5"/><circle cx="220" cy="220" r="30" fill="none" stroke="#b2a374"/><g transform="translate(650 20)"><path d="M80 30L103 200 80 182 57 200Z" fill="#9c3428" stroke="#63261d"/><path d="M80 30v152l23 18z" fill="#d96647"/><path d="M57 200L80 370 103 200 80 218Z" fill="#42575a" stroke="#25383b"/><path d="M80 218v152l23-170z" fill="#91a7a6"/><circle cx="80" cy="200" r="13" fill="url(#brass)" stroke="#694a23"/><circle cx="80" cy="200" r="5" fill="#e7d89e"/></g></svg>`;
  await writeFile(join(output, "compass-original.svg"), svg);
  const browserPath = await ensureBrowser({ logLevel: "error" });
  const browser = await puppeteer.launch({ executablePath: browserPath.path, headless: true, args: ["--disable-background-networking"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 900, height: 440 });
    await page.setContent(`<style>body{margin:0;background:transparent}</style>${svg}`);
    await page.screenshot({ path: join(output, "compass-original.png"), omitBackground: true });
  } finally { await browser.close(); }
  const project = previousResult("create_project") ?? await call("create_project", { name: "通用物件制造隔离验收：罗盘与雨伞", profile: "visual_explainer" });
  const projectId = project.snapshot.project.id;
  const state = () => call("read_project", { project_id: projectId });
  const imported = previousResult("import_media") ?? await call("import_media", { project_id: projectId, base_revision_id: project.revision.number, file_path: join(output, "compass-original.png"), role: "generated_visual" });
  await wait(imported.job.id);
  const request = { project_id: projectId, base_revision_id: (await state()).revision.number, idempotency_key: "compass-parts-v1",
    sources: [{ id: "drawing", asset_id: imported.asset.id }], parts: [
      { id: "dial", source_id: "drawing", source_rect: { x: 0, y: 0, width: 440, height: 440 }, trim_transparent: true, local_rect: { x: -220, y: -220, width: 440, height: 440 } },
      { id: "needle", source_id: "drawing", source_rect: { x: 650, y: 0, width: 160, height: 440 }, trim_transparent: true, local_rect: { x: -80, y: -220, width: 160, height: 440 } }
    ], atlas: { enabled: true, max_side: 1024, max_pages: 1 } };
  const prepared = await wait((await call("prepare_object_resources", request)).id);
  const layout = prepared.result.layout;
  assert.equal(layout.pages.length, 1); assert.equal(layout.parts.length, 2);
  await writeFile(join(output, "compass-layout.json"), JSON.stringify(layout, null, 2));
  const compass = `import React from 'react';import {AbsoluteFill,Img,useCurrentFrame} from 'remotion';
function Part(p){const a=p.layout.parts.find(v=>v.id===p.id),pg=p.layout.pages.find(v=>v.id===a.pageId),sx=a.localRect.width/a.sourceSize.width,sy=a.localRect.height/a.sourceSize.height;return <div style={{position:'absolute',left:a.localRect.x+a.trimOffset.x*sx,top:a.localRect.y+a.trimOffset.y*sy,width:a.atlasRect.width*sx,height:a.atlasRect.height*sy,overflow:'hidden'}}><Img src={p.src} style={{position:'absolute',maxWidth:'none',width:pg.width*sx,height:pg.height*sy,left:-a.atlasRect.x*sx,top:-a.atlasRect.y*sy}}/></div>}
export default function Compass(p){const t=useCurrentFrame()/30,angle=t<.5?65:65*Math.exp(-(t-.5)*1.9)*Math.cos((t-.5)*5.3);return <AbsoluteFill style={{background:'#102b30',color:'#efe5c5'}}><div style={{position:'absolute',left:76,top:75,fontSize:16,letterSpacing:5,fontFamily:p.fonts.text.family}}>方向 · 找到稳定</div><div style={{position:'absolute',left:76,top:122,fontSize:42,fontFamily:p.fonts.text.family}}>一次偏转之后</div><div style={{position:'absolute',left:76,top:190,width:260,fontSize:21,lineHeight:1.6,fontFamily:p.fonts.text.family}}>针围绕轴心摆动，\n表盘仍保留方向参照。</div><div style={{position:'absolute',left:660,top:285,transform:'scale(.92)'}}><div style={{position:'absolute',left:-180,top:166,width:360,height:28,borderRadius:'50%',background:'#07191b',filter:'blur(12px)'}}/><Part layout={p.layout} id="dial" src={p.assets.atlas}/><div style={{position:'absolute',transform:'rotate('+angle+'deg)'}}><Part layout={p.layout} id="needle" src={p.assets.atlas}/></div></div><div style={{position:'absolute',bottom:28,left:76,fontFamily:p.fonts.text.family,fontSize:18,color:'#91aaa9'}}>固定表盘 / 独立指针 / 同一局部轴心</div></AbsoluteFill>}`;
  const umbrella = `import React from 'react';import {AbsoluteFill,useCurrentFrame} from 'remotion';
export default function Umbrella(p){const t=useCurrentFrame()/30,q=Math.max(0,Math.min(1,(t-.6)/1.4)),open=1-Math.pow(1-q,3),theta=.11+1.01*open,r=232*Math.sin(theta),top=150,y=top+232*Math.cos(theta),slider=top+134.56*Math.cos(theta)+Math.sqrt(145*145-Math.pow(r*.58,2));return <AbsoluteFill style={{background:'#edf1e7',color:'#233d40',fontFamily:p.fonts.text.family}}><div style={{position:'absolute',left:64,top:60,fontSize:18,letterSpacing:4}}>结构 · 撑开一片空间</div><div style={{position:'absolute',left:64,top:108,width:335,fontSize:38}}>同一个支点，<br/>不同的展开</div><svg width="960" height="540" style={{position:'absolute'}}><defs><linearGradient id="shaft" x2="1"><stop stopColor="#334448"/><stop offset=".5" stopColor="#bed0c8"/><stop offset="1" stopColor="#46595b"/></linearGradient></defs><ellipse cx="660" cy="492" rx={r*.74} ry="9" fill="#d3dacb"/><path d="M660 143V430q0 40 28 40t26-35" fill="none" stroke="url(#shaft)" strokeWidth="9" strokeLinecap="round"/>{[-1,-.5,0,.5,1].map((k,i)=><path key={'rib'+i} d={'M660 '+slider+'L'+(660+k*r*.58)+' '+(top+(y-top)*.58)+'L'+(660+k*r)+' '+y} fill="none" stroke="#6f827c" strokeWidth="3"/>)}{[-1,-.5,0,.5].map((k,i)=>{const x1=660+k*r,x2=660+(k+.5)*r;return <path key={'fabric'+i} d={'M660 '+top+'Q'+x1+' '+top+' '+x1+' '+y+'Q'+((x1+x2)/2)+' '+(y-22*open)+' '+x2+' '+y+'Q'+x2+' '+top+' 660 '+top+'Z'} fill={['#ce5b45','#ed9b65','#e3b263','#577c72'][i]} stroke="#304e4c" strokeWidth="2"/>})}<path d={'M660 '+(top-9)+'V'+(top+2)} stroke="#263e40" strokeWidth="5" strokeLinecap="round"/><rect x="652" y={slider-6} width="16" height="17" rx="4" fill="#445957"/>{Array.from({length:18},(_,i)=>{const x=450+(i*83)%420,yy=(t*115+i*47)%400;const blocked=open>.85&&yy>top&&yy<y+140&&Math.abs(x-660)<r;return <path key={'rain'+i} d={'M'+x+' '+yy+'l-4 14'} stroke="#91adb0" strokeWidth="2" opacity={blocked?0:.65}/>})}</svg><div style={{position:'absolute',left:64,top:235,width:270,fontSize:21,lineHeight:1.7}}>滑套上行，支撑杆推开伞骨。\n布面跟随骨架展开，留出遮雨的空间。</div><div style={{position:'absolute',bottom:28,left:64,fontSize:18,color:'#637c73'}}>布面、伞骨与滑套共用展开状态</div></AbsoluteFill>}`;
  const outputs = [];
  for (const [name, source, imageBindings, props] of [["罗盘_资源组合", compass, { atlas: layout.pages[0].assetId }, { layout }], ["雨伞_代码绘制", umbrella, {}, {}]]) {
    await writeFile(join(output, `${name}.tsx`), source);
    const work = { name, source, props, imageBindings, fontBindings: { text: "noto-sans-sc-bold" }, width: 960, height: 540, fps: 30, durationInFrames: 120,
      creativeBrief: "开发隔离验证，自主选择新主体；罗盘以黄铜壳、纸面刻度和红蓝指针建立材料差别，针围绕共同轴心摆动。雨伞以独立布面、伞骨和滑套建立展开关系。仅验证两种制造路径和结构状态，不登记审美、连续观看或声音通过。" };
    const submitted = await call("submit_motion_work", { project_id: projectId, base_revision_id: (await state()).revision.number, idempotency_key: `${name}-${createHash("sha256").update(JSON.stringify(work)).digest("hex").slice(0, 20)}`, work });
    const completed = await wait(submitted.id);
    const read = await call("read_motion_work", { project_id: projectId, job_id: submitted.id });
    const asset = read.asset;
    const sourceVideo = join(project.snapshot.project.rootPath, asset.managedPath);
    const video = join(output, `${name}.mp4`); await copyFile(sourceVideo, video);
    await promisify(execFile)("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"], { windowsHide: true });
    for (const frame of [0, 45, 90]) await copyFile(join(project.snapshot.project.rootPath, asset.motion.framesDirectory, `frame-${String(frame).padStart(5,"0")}.png`), join(output, `${name}-${frame}.png`));
    outputs.push({ name, projectId, jobId: submitted.id, result: completed.result, assetId: asset.id, video });
  }
  await writeFile(join(output, "result.json"), JSON.stringify({ release, outputs, layout, scope: "发行 MCP 正式链路与两个新主体技术输出；未登记用户认可、完整声画或连续观看通过。" }, null, 2));
  console.log(JSON.stringify({ output, projectId, videos: outputs.map(o=>o.video) }));
} finally {
  await transport?.close().catch(() => undefined);
  await stopRuntime(options, { force: true });
}
