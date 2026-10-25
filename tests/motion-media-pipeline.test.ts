import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { runProcess } from "@videocut/speech";
import { motionFixture } from "./fixtures/managed-motion.js";
import { frameHtml, sizeMotionFixture } from "./fixtures/hyperframes.js";
import { readOutputFrame } from "./fixtures/motion-output.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { MotionFrameCache } from "../packages/media-intelligence/src/motion-frames.js";
import { motionPixelKey } from "../packages/motion-work/src/compiler.js";
import { compositeTimeline } from "../apps/render-worker/src/ffmpeg-compositor.js";
import { buildRenderPlan } from "../apps/render-worker/src/render-plan.js";
import { validateOutputFrameRate } from "../apps/render-worker/src/exporter.js";
import { renderTimelineAudio } from "../apps/render-worker/src/timeline-audio.js";
import { createMotionStreamEncoder } from "../apps/render-worker/src/motion-stream-encoder.js";

test("正式透明媒体无损往返、缓存淘汰重建、说明修改复用且混合合成不重复声音", { timeout: 120_000 }, async () => {
  const root=await mkdtemp(join(tmpdir(),"vfc-media-pipeline-")),app=createApplication(root);
  try {
    const state=app.createProject({name:"流式正式媒体隔离验证"}),projectId=state.snapshot.project.id,projectRoot=state.snapshot.project.rootPath;
    const work=sizeMotionFixture({...motionFixture,width:128,height:128,durationInFrames:8,compositing:"alpha" as const,
      source:frameHtml('<div id="a" style="position:absolute;inset:0;background:#bc832f"></div>',`document.querySelector('#a').style.opacity=String([0,.5,1,.25,.75,1,.5,0][f]);`)});
    const job=app.submitManagedMotion({projectId,baseRevision:1,idempotencyKey:"first",work});
    const result=await runMotionJob(app,job),asset=app.readProject(projectId).snapshot.assets.find(a=>a.id===result.assetId)!;
    assert.equal(asset.motion!.output!.kind,"alpha_video");assert.equal(asset.motion!.output!.pixelFormat,"bgra");assert.equal(asset.motion!.framesDirectory,undefined);
    const directory=join(projectRoot,asset.motion!.sourcePath,"..");
    assert.equal((await readdir(join(directory,"frames"))).length,3);
    const cache=new MotionFrameCache(1);
    for(const frame of [0,1,4,7,1]){
      const png=PNG.sync.read(await cache.get(projectRoot,asset,asset.sourceHash!,frame));
      assert.ok(Math.abs(png.data[3]!-[0,128,255,64,191,255,128,0][frame]!)<=1);
      if(frame===4) assert.deepEqual(png.data, PNG.sync.read(await readFile(join(directory,"frames/frame-00004.png"))).data, "FFV1 往返必须与原始捕获逐像素相同");
    }
    const modified={...work,name:"只改名称",creativeBrief:"只调整说明文字，不改变当前画面和内部时钟。"};
    assert.equal(motionPixelKey(work),motionPixelKey(modified));
    const repeat=app.submitManagedMotion({projectId,baseRevision:app.readProject(projectId).revision.number,idempotencyKey:"reuse",work:modified});
    const reused=await runMotionJob(app,repeat,async()=>{assert.fail("同版不得重复捕获");});assert.equal(reused.reused,true);
    assert.throws(()=>app.submitManagedMotion({projectId,baseRevision:app.readProject(projectId).revision.number,idempotencyKey:"wrong",work:{...work,props:{text:"改变"},renderedAssetId:asset.id}}),/相同源码/);
    app.repository.commit(projectId,app.readProject(projectId).revision.number,"隔离画布",snapshot=>Object.assign(snapshot.timeline,{width:128,height:128,fps:30,durationInFrames:8}));
    const scene=app.createScene({projectId,baseRevision:app.readProject(projectId).revision.number,type:"ExplainerScene",title:"透明叠加",purpose:"精确帧合成",startFrame:0,endFrame:8});
    const placed=app.createEffectCue({projectId,baseRevision:scene.revision.number,sceneId:scene.snapshot.scenes.at(-1)!.id,type:"ManagedMotion",layer:"fullscreen",startFrame:0,endFrame:8,assetBindings:[{slot:"motion",assetId:asset.id}]});
    const snapshot=structuredClone(placed.snapshot);Object.assign(snapshot.timeline,{width:128,height:128,fps:30,durationInFrames:8});
    const plan=buildRenderPlan(snapshot);assert.equal(plan.renderer,"ffmpeg");
    const target=join(root,"composed.mp4");
    await compositeTimeline(snapshot,target,{browserRange:async()=>{assert.fail("普通透明作品不需要浏览器");},caption:async()=>{assert.fail("没有字幕");}});
    await validateOutputFrameRate(target,30,8);
    const pixel=PNG.sync.read(await readOutputFrame(target,1)).data;
    assert.ok(Math.abs(pixel[0]!-98)<8,`半透明叠加颜色:${pixel[0]}`);
    const metadata=JSON.parse(await readFile(`${target}.render-plan.json`,"utf8"));assert.equal(metadata.plan.renderer,"ffmpeg");
    await writeFile(join(projectRoot,asset.managedPath),"损坏正式产物");
    await assert.rejects(cache.get(projectRoot,asset,asset.sourceHash!,1),/MOTION_OUTPUT_CHANGED/);
  } finally {app.close();await rm(root,{recursive:true,force:true});}
});

test("统一声音按全局时钟处理循环交叠、淡入、总增益与局部范围",{timeout:30_000},async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-timeline-audio-")),app=createApplication(root);
  try{
    const state=app.createProject({name:"声音隔离验证"}),snapshot=structuredClone(state.snapshot);
    Object.assign(snapshot.timeline,{fps:30,durationInFrames:12});
    const path=join(snapshot.project.rootPath,"assets/source/constant.wav");
    await runProcess("ffmpeg",["-v","error","-f","lavfi","-i","aevalsrc=0.25|0.25:s=48000:d=0.1","-c:a","pcm_f32le",path]);
    snapshot.assets.push({id:"sound",name:"确定幅度",tags:[],kind:"audio",status:"ready",managedPath:"assets/source/constant.wav",createdAt:new Date().toISOString(),metadata:{hasAudio:true,durationMs:100}});
    snapshot.timeline.tracks.push({id:"audio",name:"BGM",kind:"audio",order:0,hidden:false,muted:false,locked:false});
    snapshot.timeline.items.push({id:"sound-item",assetId:"sound",trackId:"audio",startFrame:0,endFrame:12,sourceStartFrame:0,sourceEndFrame:3,disabled:false});
    snapshot.audioCues.push({id:"loop",timelineItemId:"sound-item",status:"ready",loop:true,loopCrossfadeFrames:1,fadeInFrames:2,fadeOutFrames:2} as any);
    snapshot.audioMixGainDb=20*Math.log10(.5);
    for(const audioMixGainDb of [NaN,Infinity,-49,25]) await assert.rejects(renderTimelineAudio({...snapshot,audioMixGainDb},0,12,root),/整体混合增益/);
    const full=await renderTimelineAudio(snapshot,0,12,root);
    const raw=join(root,"full.f32");await runProcess("ffmpeg",["-v","error","-i",full,"-f","f32le",raw]);
    const data=await readFile(raw);
    const value=(frame:number)=>data.readFloatLE(frame*1600*8);
    assert.ok(Math.abs(value(0)-.0625)<1e-5);
    for(const frame of [1,2,3,6,10]) assert.ok(Math.abs(value(frame)-.125)<1e-5,`循环接点第${frame}帧不能音量翻倍或掉空`);
    assert.ok(Math.abs(value(11)-.0625)<1e-5);
    const part=await renderTimelineAudio(snapshot,5,9,root),partial=join(root,"part.f32");
    await runProcess("ffmpeg",["-v","error","-i",part,"-f","f32le",partial]);
    assert.deepEqual(await readFile(partial),data.subarray(5*1600*8,9*1600*8));
  }finally{app.close();await rm(root,{recursive:true,force:true});}
});

test("编码器提前退出或取消会释放写入并清除半成品",{timeout:15_000},async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-pipe-failure-"));
  try{
    const path=join(root,"bad.mkv"),encoder=createMotionStreamEncoder(motionFixture,path);
    await assert.rejects(async()=>{await encoder.write(Buffer.from("broken png"));await encoder.finish();});
    await encoder.cancel();
    const controller=new AbortController(),cancelled=createMotionStreamEncoder(motionFixture,join(root,"cancel.mkv"),controller.signal);
    controller.abort();await assert.rejects(cancelled.write(Buffer.alloc(100)));await cancelled.cancel();
    assert.deepEqual(await readdir(root),[]);
  }finally{await rm(root,{recursive:true,force:true});}
});

test("不透明声明拒绝透明帧，编码失败不登记素材且可取消",{timeout:60_000},async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-opaque-")),app=createApplication(root);
  try{
    const state=app.createProject({name:"不透明声明验证"}),projectId=state.snapshot.project.id;
    const work=sizeMotionFixture({...motionFixture,width:128,height:128,durationInFrames:2,compositing:"opaque" as const});
    const job=app.submitManagedMotion({projectId,baseRevision:1,idempotencyKey:"transparent",work});
    await assert.rejects(runMotionJob(app,job),/MOTION_OPACITY_MISMATCH/);
    assert.equal(app.readProject(projectId).snapshot.assets.length,0);
    const valid=sizeMotionFixture({...work,source:frameHtml('<div style="position:absolute;inset:0;background:#bc832f"></div>',"")});
    const next=app.submitManagedMotion({projectId,baseRevision:1,idempotencyKey:"opaque",work:valid});
    const result=await runMotionJob(app,next),asset=app.readProject(projectId).snapshot.assets.find(a=>a.id===result.assetId)!;
    assert.equal(asset.motion!.preview,undefined);assert.equal(asset.motion!.output!.kind,"opaque_video");
    await validateOutputFrameRate(join(state.snapshot.project.rootPath,asset.managedPath),30,2);
  }finally{app.close();await rm(root,{recursive:true,force:true});}
});

test("24→30帧局部接点保持全局时钟、单卡字幕、统一静音与局部缓存失效", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-hybrid-clock-")), app = createApplication(root);
  try {
    const { snapshot } = app.createProject({ name: "混合路径隔离验证" });
    Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 30, durationInFrames: 10 });
    const path = join(snapshot.project.rootPath, "assets/source/clock.mkv");
    const encoder = createMotionStreamEncoder({ ...motionFixture, width: 128, height: 128, fps: 24, compositing: "alpha" }, path);
    for (let f = 0; f < 8; f++) {
      const png = new PNG({ width: 128, height: 128 });
      for (let i = 0; i < png.data.length; i += 4) { png.data[i] = (f + 1) * 25; png.data[i + 3] = 255; }
      await encoder.write(PNG.sync.write(png));
    }
    await encoder.finish();
    const { hashMediaFile } = await import("../packages/edit-application/src/media-intelligence.js");
    const hash = await hashMediaFile(path);
    const asset = { id: "motion", name: "帧钟", kind: "video", status: "ready", managedPath: "assets/source/clock.mkv", sourceHash: hash, metadata: { width:128, height:128, hasAudio:false }, motion: { width:128,height:128,fps:24,frameCount:8,output:{path:"assets/source/clock.mkv",hash,kind:"alpha_video",codec:"ffv1",pixelFormat:"bgra"} } } as any;
    snapshot.assets.push(asset);
    snapshot.scenes.push({ id:"scene", type:"ExplainerScene", startFrame:0, endFrame:10, title:"混合", purpose:"时钟" } as any);
    snapshot.effectCues.push({ id:"motion-cue",type:"ManagedMotion",status:"ready",sceneId:"scene",layer:"fullscreen",startFrame:0,endFrame:10,assetBindings:[{slot:"motion",assetId:"motion"}],props:{},spatialAnchor:"full_frame",stylePackId:"managed-source",intensity:1,motion:{enterPreset:"none",settlePreset:"hold",exitPreset:"none",enterFrames:0,exitFrames:0,holdFrames:10} } as any);
    snapshot.effectCues.push({ id:"special",type:"CameraPunch",status:"ready",sceneId:"scene",layer:"front",startFrame:3,endFrame:6,assetBindings:[],props:{} } as any);
    snapshot.timeline.captions.push(...[{id:"a",startFrame:0,endFrame:2},{id:"b",startFrame:2,endFrame:10}].map(c=>({...c,text:c.id}) as any));
    snapshot.project.brief.captionMode = "stable";
    const cache = new MotionFrameCache(1);
    for (const frame of [0,1,2,3,4,5,6,7,2]) {
      const png = PNG.sync.read(await cache.get(snapshot.project.rootPath,asset,hash,frame));
      assert.equal(png.data[0],(frame+1)*25,`正式解码第 ${frame} 帧`);
    }
    let browserCalls = 0, captionCalls = 0;
    const callbacks = {
      browserRange: async (_state:any, from:number, to:number, target:string) => {
        browserCalls++; assert.deepEqual([from,to],[3,6]);
        // 刻意带一个错误中间音轨，最终只能消费本段画面。
        await runProcess("ffmpeg",["-v","error","-f","lavfi","-i","color=c=blue:s=128x128:r=30","-f","lavfi","-i","sine=frequency=2000:sample_rate=48000","-t",String((to-from)/30),"-c:v","libx264","-crf","0","-c:a","aac",target]);
      },
      caption: async (state:any,_frame:number,target:string) => {
        captionCalls++; assert.equal(state.timeline.captions.length,1,"每次只栅格化一张卡，不能把其他字幕重复烧入");
        const png=new PNG({width:128,height:128});
        for(let i=128*100*4;i<png.data.length;i+=4){png.data[i+1]=255;png.data[i+3]=128;}
        await writeFile(target,PNG.sync.write(png));
      }
    };
    const target=join(root,"hybrid.mp4");
    const plan=await compositeTimeline(snapshot,target,callbacks);
    assert.equal(plan.renderer,"hybrid");assert.equal(browserCalls,1);assert.equal(captionCalls,2);
    await validateOutputFrameRate(target,30,10);
    for(const f of [0,1,2,3,5,6,7,8,9]) {
      const png=PNG.sync.read(await readOutputFrame(target,f));
      if(f>=3&&f<6) assert.ok(png.data[2]!>240 && png.data[0]!<8,`浏览器接点 ${f}`);
      else assert.ok(Math.abs(png.data[0]!-(Math.floor(f*24/30)+1)*25)<8,`原生时钟 ${f}: ${png.data[0]}`);
      if(f===1 || f===2) assert.ok(Math.abs(png.data[(110*128)*4+1]!-128)<8,"字幕 alpha 不重复");
    }
    const raw=join(root,"final-audio.f32");await runProcess("ffmpeg",["-v","error","-i",target,"-vn","-f","f32le",raw]);
    const samples=await readFile(raw); for(let i=0;i<samples.length;i+=4) assert.equal(samples.readFloatLE(i),0,"中间音轨不能重复混入");
    snapshot.audioMixGainDb=-6;
    await compositeTimeline(snapshot,join(root,"reused.mp4"),callbacks);
    assert.equal(browserCalls,1,"全局音量变化不重绘局部画面");
    snapshot.effectCues.find(c=>c.id==="special")!.props={scale:1.2};
    await compositeTimeline(snapshot,join(root,"changed.mp4"),callbacks);
    assert.equal(browserCalls,2,"只重建视觉依赖变化的局部段");
    // 普通源视频先按同一源时间轴重采样，再裁显示范围；字幕边界不能重置采样相位。
    const ordinary=structuredClone(snapshot);ordinary.effectCues=[];
    ordinary.assets[0]!.motion=undefined;
    ordinary.timeline.tracks.push({id:"video",name:"Background",kind:"video",order:0,muted:false,hidden:false,locked:false});
    ordinary.timeline.items=[{id:"ordinary",trackId:"video",assetId:"motion",startFrame:0,endFrame:9,sourceStartFrame:1,sourceEndFrame:10,disabled:false}];
    ordinary.timeline.durationInFrames=9;ordinary.timeline.captions[1]!.endFrame=9;
    const plain=join(root,"ordinary.mp4"), unsplit=join(root,"ordinary-unsplit.mp4");await compositeTimeline(ordinary,plain,callbacks);
    const baseline=structuredClone(ordinary);baseline.timeline.captions=[];await compositeTimeline(baseline,unsplit,callbacks);
    for(const frame of [0,1,2,3,4,5,6,7,8]) {
      const pixel=PNG.sync.read(await readOutputFrame(plain,frame)).data[0]!;
      const expected=PNG.sync.read(await readOutputFrame(unsplit,frame)).data[0]!;
      assert.ok(Math.abs(pixel-expected)<8,`字幕分段不能改变普通源相位 ${frame}: ${pixel} / ${expected}`);
    }
  } finally { app.close(); await rm(root,{recursive:true,force:true}); }
});

test("局部视觉缓存损坏和淘汰只重建该段，失败不发布缓存", async () => {
  const { reuseVisualRange } = await import("../apps/render-worker/src/visual-range-cache.js");
  const { stat, utimes, mkdir } = await import("node:fs/promises");
  const root=await mkdtemp(join(tmpdir(),"vfc-visual-cache-"));
  try {
    const cache=join(root,".cache/visual-ranges");await mkdir(cache,{recursive:true});
    const pending=join(cache,`${"a".repeat(64)}.mp4.1234.pending`);await writeFile(pending,"中断");await utimes(pending,new Date(0),new Date(0));
    let calls=0;
    const generate=async()=>{calls++;await writeFile(join(root,"out.mp4"),Buffer.alloc(80,calls));};
    const request=(key:string)=>reuseVisualRange(root,key.repeat(64),join(root,"out.mp4"),generate,100);
    assert.equal(await request("a"),false);assert.equal(await request("a"),true);assert.equal(calls,1);
    await assert.rejects(stat(pending),{code:"ENOENT"});
    await writeFile(join(cache,`${"a".repeat(64)}.mp4`),"损坏");
    assert.equal(await request("a"),false);assert.equal(calls,2);
    assert.equal(await request("b"),false);await assert.rejects(stat(join(cache,`${"a".repeat(64)}.mp4`)),{code:"ENOENT"});
    await assert.rejects(reuseVisualRange(root,"c".repeat(64),join(root,"out.mp4"),async()=>{throw new Error("中途失败");},100),/中途失败/);
    await assert.rejects(stat(join(cache,`${"c".repeat(64)}.mp4`)),{code:"ENOENT"});
    assert.equal(await request("a"),false);assert.equal(calls,4);
  } finally { await rm(root,{recursive:true,force:true}); }
});
