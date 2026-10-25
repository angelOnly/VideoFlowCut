import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createApplication } from "@videocut/application";
import { runProcess } from "@videocut/speech";
import { motionSubmissionSchema } from "../packages/motion-work/src/schema.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { RevisionRenderer, validateOutputFrameRate } from "../apps/render-worker/src/exporter.js";
import { selectTimelineEncoder } from "../apps/render-worker/src/ffmpeg-compositor.js";

/** 固定短夹具在独立临时仓库运行，不连接生产 Runtime 或 OpenDesign。 */
const output = resolve(process.argv[2] ?? "docs/development/opendesign-media-20261024");
await mkdir(output, { recursive: true });
const root = await mkdtemp(join(tmpdir(), "vfc-media-measurement-"));
const app = createApplication(root);
const source = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<main data-composition-id="main" data-start="0" data-duration="2" data-width="320" data-height="180" style="position:relative;width:320px;height:180px;background:linear-gradient(110deg,#172033,#647c8b);overflow:hidden">
<div style="position:absolute;left:20px;top:34px;font-family:var(--vfc-font-title);font-size:28px;color:white">中文细线与渐变</div>
<div id="line" style="position:absolute;left:20px;top:95px;width:260px;height:1px;background:#ffffff"></div>
<div id="dot" style="position:absolute;left:20px;top:120px;width:24px;height:24px;border-radius:50%;background:#ffc455"></div>
</main><script>const {props,config}=window.vfc;const tl=gsap.timeline({paused:true});document.querySelector('#dot').style.background=props.accent;tl.to('#dot',{x:240,duration:2,ease:'none'},0);window.__timelines.main=tl;</script></body></html>`;
try {
  const created=app.createProject({name:"流式正式媒体性能隔离夹具"}),projectId=created.snapshot.project.id;
  const work=motionSubmissionSchema.parse({name:"首次生成",creativeBrief:"固定中文、细线、渐变与移动圆点，仅验证编码和合成，不代表创作验收。",source,props:{accent:"#ffc455"},width:320,height:180,fps:30,durationInFrames:60,compositing:"alpha",fontBindings:{title:"noto-sans-sc-bold"}});
  const runs: Array<Record<string,unknown>>=[];
  const generate=async(label:string,input:typeof work)=>{
    const started=Date.now();
    const job=app.submitManagedMotion({projectId,baseRevision:app.readProject(projectId).revision.number,idempotencyKey:label,work:input});
    const result=await runMotionJob(app,job);
    const asset=app.readProject(projectId).snapshot.assets.find(a=>a.id===result.assetId)!;
    runs.push({label,elapsedMs:Date.now()-started,reused:result.reused,capturedFrames:result.reused?0:(result.metrics as any).capturedFrames,metrics:result.reused?undefined:result.metrics,outputBytes:(await stat(join(created.snapshot.project.rootPath,asset.managedPath))).size,samplePngCount:(await readdir(join(created.snapshot.project.rootPath,dirname(asset.motion!.sourcePath),"frames"))).length});
    return asset;
  };
  const first=await generate("首次生成",work);
  const same=await generate("纯说明变更",{...work,name:"只改说明",creativeBrief:"仅改说明，画面、真实素材和时钟保持完全相同。"});
  assert.equal(first.sourceHash,same.sourceHash);
  const changed=await generate("局部视觉变更",{...work,props:{accent:"#5ee6ba"}});
  assert.notEqual(first.sourceHash,changed.sourceHash);
  const renderer=new RevisionRenderer();
  for(const [label,asset] of [["首次导出",first],["同版再次导出",same],["局部修改后导出",changed]] as const){
    const snapshot=structuredClone(app.readProject(projectId).snapshot);
    Object.assign(snapshot.timeline,{width:320,height:180,fps:30,durationInFrames:60});
    snapshot.scenes=[{id:"measure",type:"ExplainerScene",status:"ready",startFrame:0,endFrame:60,title:"测量",purpose:"技术测量"} as any];
    snapshot.effectCues=[{id:"measure",type:"ManagedMotion",status:"ready",sceneId:"measure",layer:"fullscreen",startFrame:0,endFrame:60,assetBindings:[{slot:"motion",assetId:asset.id}],props:{},spatialAnchor:"full_frame",stylePackId:"managed-source",intensity:1,motion:{enterPreset:"none",settlePreset:"hold",exitPreset:"none",enterFrames:0,exitFrames:0,holdFrames:60}} as any];
    const target=join(output,`${label}.mp4`),started=Date.now();
    await renderer.render(snapshot,target);
    const renderMs=Date.now()-started,validationAt=Date.now();
    await validateOutputFrameRate(target,30,60);
    const report=JSON.parse(await readFile(`${target}.render-plan.json`,"utf8"));
    runs.push({label,renderMs,validationMs:Date.now()-validationAt,outputBytes:(await stat(target)).size,report});
  }
  const original=join(created.snapshot.project.rootPath,first.managedPath),selected=await selectTimelineEncoder(320,180,30);
  const comparisons=[];
  for(const setting of [{name:"libx264",args:["-c:v","libx264","-preset","medium","-crf","18"]},...(selected.name==="h264_nvenc"?[selected]:[])]){
    const target=join(output,`${setting.name}.mp4`),started=Date.now();
    await runProcess("ffmpeg",["-y","-v","error","-i",original,"-an",...setting.args,"-pix_fmt","yuv420p",target]);
    const encodeMs=Date.now()-started;
    const quality=await runProcess("ffmpeg",["-i",original,"-i",target,"-filter_complex","[0:v]settb=1/30,setpts=N,format=yuv420p,split=2[r1][r2];[1:v]settb=1/30,setpts=N,split=2[c1][c2];[r1][c1]ssim;[r2][c2]psnr","-f","null","-"]);
    comparisons.push({encoder:setting.name,encodeMs,bytes:(await stat(target)).size,ssim:quality.match(/SSIM Y:.*$/m)?.[0],psnr:quality.match(/PSNR y:.*$/m)?.[0]});
  }
  await copyFile(original,join(output,"reference.mkv"));
  await writeFile(join(output,"source.html"),source);
  await writeFile(join(output,"validation.json"),JSON.stringify({date:new Date().toISOString(),scope:"320×180、30fps、60帧隔离技术夹具；未调用 OD，未人工连续审片；不是309秒生产作品的提速保证",formalCaptureRuns:2,descriptionReuseRuns:1,runs,comparisons,encoder:selected,resourceScope:"RSS 仅 Worker；临时磁盘为阶段结束采样，不含子进程峰值；正式媒体已复制到报告目录"},null,2));
  console.log(JSON.stringify({output,runs:runs.map(({label,elapsedMs,renderMs,validationMs,capturedFrames})=>({label,elapsedMs,renderMs,validationMs,capturedFrames})),comparisons},null,2));
} finally { app.close(); await rm(root,{recursive:true,force:true}); }
