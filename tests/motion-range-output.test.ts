import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "@videocut/application";
import { runProcess } from "@videocut/speech";
import { motionFixture } from "./fixtures/managed-motion.js";
import { frameHtml, sizeMotionFixture } from "./fixtures/hyperframes.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { compositeTimeline } from "../apps/render-worker/src/ffmpeg-compositor.js";
import { bindEffectAudioEvent } from "../packages/edit-application/src/effect-audio-events.js";
import { completeMotionFixture } from "./fixtures/motion-output.js";
import { motionPixelKey } from "../packages/motion-work/src/compiler.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createServer } from "../apps/server/src/app.js";
import { RevisionRenderer } from "../apps/render-worker/src/exporter.js";
import { motionMediaForCue } from "../packages/contracts/src/motion-work.js";
import { buildRenderPlan } from "../packages/edit-domain/src/render-plan.js";

test("局部自动采用允许未绑定声音的窗口外事件变化", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-range-precheck-")), app = createApplication(root);
  const previousWorkspace = process.env.VIDEOCUT_WORKSPACE;
  process.env.VIDEOCUT_WORKSPACE = root;
  try {
    const projectId = app.createProject({ name: "局部事件前检" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 30 }));
    const source = frameHtml('<div id="box" style="position:absolute;inset:0;background:red"></div>', "", "window.getVfcMotionEvents=()=>[{id:'outside',meaning:'后段动作',startFrame:20}];");
    const work = sizeMotionFixture({ ...motionFixture, source, width: 128, height: 128, durationInFrames: 24 });
    const originalJob = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "original", work });
    const original = await runMotionJob(app, originalJob);
    app.updateJob(originalJob.id, { status: "succeeded", result: original });
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "前检", purpose: "检查完整事件", startFrame: 100, endFrame: 124 }).snapshot.scenes[0]!;
    const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 100, endFrame: 124, workId: String(original.workId) }).snapshot.effectCues[0]!;
    const changed = { ...work, source: work.source.replace("startFrame:20", "startFrame:21") };
    const frameRange = { startFrame: 6, endFrame: 12 };
    const onSuccess = { action: "replace_range" as const, cueId: cue.id, targetRange: { startFrame: 106, endFrame: 112 }, audioPolicy: "rebind_unchanged_events" as const };
    const job = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "different-events", work: changed, frameRange, outputIntent: "asset", onSuccess });
    const before = rev();
    const result = await runMotionJob(app, job);
    assert.equal((result.continuation as { status: string }).status, "applied");
    assert.equal(rev(), before + 1);
    const cues = app.readProject(projectId).snapshot.effectCues;
    assert.deepEqual(cues.map(item => [item.startFrame, item.endFrame]), [[100, 106], [106, 112], [112, 124]]);
    assert.equal(cues[1].workId, result.workId);
  } finally {
    if (previousWorkspace === undefined) delete process.env.VIDEOCUT_WORKSPACE; else process.env.VIDEOCUT_WORKSPACE = previousWorkspace;
    app.close(); await rm(root, { recursive: true, force: true });
  }
});

test("跨替换范围的持续音效按实际动作范围核对并保持原子性", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-sustained-range-")), app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "持续声音隔离验证" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 320, height: 320, fps: 30 }));
    const complete = (key: string, endFrame: number) => {
      const job = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: key, work: { ...motionFixture, props: { key } } });
      return completeMotionFixture(app, { projectId, jobId: job.id, engineVersion: String(job.payload.engineVersion), sourceHash: key,
        metadata: { width: 320, height: 320, durationMs: 600, hasAudio: false },
        eventMap: { version: String(job.payload.version), fps: 30, frameCount: 18, events: [{ id: "move", meaning: "连续动作", startFrame: 3, endFrame }] } });
    };
    const old = complete("old", 15), changed = complete("changed", 14), unchanged = complete("unchanged", 15);
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "持续动作", purpose: "声音", startFrame: 0, endFrame: 18 }).snapshot.scenes[0];
    const cue = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 0, endFrame: 18, workId: old.motion!.workId! }).snapshot.effectCues[0];
    const sound = app.registerImportedAsset({ projectId, baseRevision: rev(), name: "持续声音", kind: "audio", managedPath: "assets/source/sound.wav" });
    app.applyMediaAnalysis({ projectId, assetId: sound.asset.id, metadata: { durationMs: 500, hasAudio: true } });
    const audio = app.manageAudio({ projectId, baseRevision: rev(), action: "create", kind: "sfx", assetId: sound.asset.id, purpose: "持续动作声",
      eventFrame: 3, onsetOffsetFrames: 0, sourceStartFrame: 0, sourceEndFrame: 12, design: { role: "sfx", durationFrames: 12 },
      effectEvent: { effectCueId: cue.id, eventId: "move", eventName: "连续动作", workVersion: old.motion!.version, localFrame: 3, endLocalFrame: 15 } }).snapshot.audioCues[0];
    const before = rev();
    assert.throws(() => app.replaceManagedMotionRange({ projectId, baseRevision: before, cueId: cue.id, workId: changed.motion!.workId!, startFrame: 6, endFrame: 12 }), /持续动作声.*move/);
    assert.equal(rev(), before);
    assert.equal(app.readProject(projectId).snapshot.effectCues.length, 1);
    const adopted = app.replaceManagedMotionRange({ projectId, baseRevision: before, cueId: cue.id, workId: unchanged.motion!.workId!, startFrame: 6, endFrame: 12 });
    assert.equal(adopted.snapshot.audioCues.find(item => item.id === audio.id)!.status, "ready");
    assert.equal(adopted.snapshot.audioCues.find(item => item.id === audio.id)!.eventFrame, 3);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("正式范围采用成功校样不重画，原子替换前中后并保持声音、非零源入点及项目帧率", { timeout: 120_000 }, async () => {
  const root=await mkdtemp(join(tmpdir(),"vfc-range-")),app=createApplication(root);
  try {
    const created=app.createProject({name:"正式局部输出隔离验证"}),projectId=created.snapshot.project.id,rev=()=>app.readProject(projectId).revision.number;
    app.repository.commit(projectId,rev(),"隔离画布",snapshot=>Object.assign(snapshot.timeline,{width:128,height:128,fps:30,durationInFrames:124}));
    const source=frameHtml('<div id="color" style="position:absolute;inset:0"></div>',`document.querySelector('#color').style.background='rgb('+((p.changed&&f>=6&&f<12)?230:40+f*4)+',20,30)';`,
      `window.getVfcMotionEvents=()=>[{id:'hit',meaning:'准确落点',startFrame:9}];`);
    const work=sizeMotionFixture({...motionFixture,source,props:{changed:false},width:128,height:128,durationInFrames:24,compositing:"opaque" as const});
    const oldJob=app.submitManagedMotion({projectId,baseRevision:rev(),idempotencyKey:"old",work});
    const oldResult=await runMotionJob(app,oldJob);app.updateJob(oldJob.id,{status:"succeeded",result:oldResult});
    const oldAsset=app.readProject(projectId).snapshot.assets.find(a=>a.id===oldResult.assetId)!;
    const scene=app.createScene({projectId,baseRevision:rev(),type:"ExplainerScene",title:"局部修订",purpose:"验证根时钟",startFrame:100,endFrame:124}).snapshot.scenes.at(-1)!;
    const placed=app.createEffectCue({projectId,baseRevision:rev(),sceneId:scene.id,type:"ManagedMotion",layer:"fullscreen",startFrame:100,endFrame:124,workId: oldAsset.motion!.workId!}),cue=placed.snapshot.effectCues[0];
    const soundPath=join(created.snapshot.project.rootPath,"assets/source/hit.wav");
    await runProcess("ffmpeg",["-v","error","-f","lavfi","-i","sine=frequency=440:duration=0.1",soundPath]);
    const imported=app.registerImportedAsset({projectId,baseRevision:rev(),name:"落点",kind:"audio",managedPath:"assets/source/hit.wav"});
    app.applyMediaAnalysis({projectId,assetId:imported.asset.id,metadata:{durationMs:100,hasAudio:true}});app.updateJob(imported.job.id,{status:"succeeded"});
    const audio=app.manageAudio({projectId,baseRevision:rev(),action:"create",kind:"sfx",assetId:imported.asset.id,purpose:"保持动作落点",eventFrame:109,onsetOffsetFrames:0,
      effectEvent:{effectCueId:cue.id,eventId:"hit",workVersion:oldAsset.motion!.version,eventName:"准确落点",localFrame:9}}).snapshot.audioCues[0];
    const changed={...work,props:{changed:true},previousAssetId:oldAsset.id},frameRange={startFrame:6,endFrame:12};
    assert.notEqual(motionPixelKey(changed,[],[],[],frameRange),motionPixelKey(changed,[],[],[],{startFrame:12,endFrame:18}));
    const proofJob=app.submitManagedMotion({projectId,baseRevision:rev(),idempotencyKey:"proof",work:changed,frameRange});
    const beforeProof=rev(),proof=await runMotionJob(app,proofJob);app.updateJob(proofJob.id,{status:"succeeded",result:proof});
    assert.equal(rev(),beforeProof);assert.equal(proof.kind,"motion_proof");
    const nextJob=app.submitManagedMotion({projectId,baseRevision:rev(),idempotencyKey:"adopt",work:changed,frameRange,outputIntent:"asset",proofJobId:proofJob.id});
    const result=await runMotionJob(app,nextJob,async()=>{assert.fail("采用成功同版校样不能重新捕获");});app.updateJob(nextJob.id,{status:"succeeded",result});
    assert.equal((result.metrics as {capturedFrames:number}).capturedFrames,0);
    const nextAsset=app.readProject(projectId).snapshot.assets.find(a=>a.id===result.assetId)!;
    assert.equal(nextAsset.motion!.frameCount,6);assert.deepEqual(nextAsset.motion!.rootRange,{...frameRange,fullDurationInFrames:24});assert.equal(app.readSourceMotionWork(projectId,nextAsset.motion!.workId!).work.eventMap!.events[0].startFrame,9);
    const partial = structuredClone(app.readProject(projectId).snapshot);
    partial.effectCues[0].workId = nextAsset.motion!.workId!;
    partial.effectCues[0].workDefinitionHash = nextAsset.motion!.definitionHash;
    const localPreview = join(root, "partial-preview.mp4"), renderer = new RevisionRenderer(undefined, 1);
    await renderer.renderRange(partial, 106, 112, localPreview);
    await assert.rejects(() => renderer.renderRange(partial, 105, 112, join(root, "outside.mp4")), /尚无覆盖选段的派生媒体/);
    const pixelsPath = join(root, "partial.rgb");
    await runProcess("ffmpeg", ["-v", "error", "-i", localPreview, "-vf", "scale=1:1", "-pix_fmt", "rgb24", "-f", "rawvideo", pixelsPath]);
    const partialPixels = await readFile(pixelsPath);
    assert.equal(partialPixels.length, 6 * 3);
    assert.ok([...Array(6).keys()].every(frame => Math.abs(partialPixels[frame * 3]! - 230) < 8));
    // 后景层触发 Remotion 合成，验证该路径也按同一局部范围选择媒体。
    partial.effectCues[0].layer = "rear";
    await renderer.renderRange(partial, 106, 112, join(root, "partial-browser.mp4"));
    const before=rev(),state=app.replaceManagedMotionRange({projectId,baseRevision:before,cueId:cue.id,workId: nextAsset.motion!.workId!,startFrame:106,endFrame:112});
    assert.equal(state.revision.number,before+1);
    assert.deepEqual(state.snapshot.effectCues.map(c=>[c.startFrame,c.endFrame,c.sourceStartFrame,c.sourceEndFrame]),[[100,106,0,6],[106,112,6,12],[112,124,12,24]]);
    const rebound=state.snapshot.audioCues.find(a=>a.id===audio.id)!;
    assert.equal(rebound.status,"ready");assert.equal(rebound.eventFrame,109);assert.equal(rebound.effectEvent!.localFrame,3);assert.equal(rebound.effectEvent!.effectCueId,state.snapshot.effectCues[1].id);
    assert.throws(()=>app.replaceManagedMotionRange({projectId,baseRevision:before,cueId:cue.id,workId: nextAsset.motion!.workId!,startFrame:100,endFrame:103}),/Revision|版本/);
    assert.equal(rev(),state.revision.number);
    const target=join(root,"local.mp4");
    await compositeTimeline(state.snapshot,target,{caption:async()=>assert.fail("没有字幕"),browserRange:async()=>assert.fail("普通视频范围不使用浏览器")},100,124);
    const pixels=join(root,"pixels.rgb");await runProcess("ffmpeg",["-v","error","-i",target,"-vf","scale=1:1","-pix_fmt","rgb24","-f","rawvideo",pixels]);
    const bytes=await readFile(pixels);assert.equal(bytes.length,24*3);
    for(let frame=0;frame<24;frame++) assert.ok(Math.abs(bytes[frame*3]!-((frame>=6&&frame<12)?230:40+frame*4))<8,`第${frame}帧根时钟或接点错误`);
    const fpsState=app.setProjectFrameRate({projectId,baseRevision:rev(),fps:60});
    assert.deepEqual(fpsState.snapshot.effectCues.map(c=>[c.startFrame,c.endFrame,c.sourceStartFrame,c.sourceEndFrame]),[[200,212,0,12],[212,224,12,24],[224,248,24,48]]);
    assert.equal(fpsState.snapshot.audioCues.find(a=>a.id===audio.id)!.eventFrame,218);
  } finally {app.close();await rm(root,{recursive:true,force:true});}
});

test("24→30正式范围非零选段的事件与采样相位，错误根网格原子拒绝", async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-range-clock-")),app=createApplication(root);
  try {
    const {snapshot}=app.createProject({name:"范围坐标合同"}),projectId=snapshot.project.id,rev=()=>app.readProject(projectId).revision.number;
    app.repository.commit(projectId,rev(),"隔离画布",s=>Object.assign(s.timeline,{width:128,height:128,fps:30,durationInFrames:140}));
    const work=sizeMotionFixture({...motionFixture,width:128,height:128,fps:24,durationInFrames:32});
    const complete=(key:string,range?:{startFrame:number;endFrame:number})=>{
      const job=app.submitManagedMotion({projectId,baseRevision:rev(),idempotencyKey:key,work,...(range?{frameRange:range,outputIntent:"asset" as const}:{})});
      return completeMotionFixture(app,{projectId,jobId:job.id,engineVersion:String(job.payload.engineVersion),sourceHash:key,metadata:{durationMs:(range?range.endFrame-range.startFrame:32)/24*1000,width:128,height:128,hasAudio:false},eventMap:{version:String(job.payload.version),fps:24,frameCount:32,events:[{id:"hit",meaning:"落点",startFrame:12}]}});
    };
    const old=complete("full"),local=complete("local",{startFrame:8,endFrame:16}),bad=complete("bad",{startFrame:9,endFrame:17});
    const scene=app.createScene({projectId,baseRevision:rev(),type:"ExplainerScene",title:"共用网格",purpose:"选段",startFrame:100,endFrame:140}).snapshot.scenes[0];
    const state=app.createEffectCue({projectId,baseRevision:rev(),sceneId:scene.id,type:"ManagedMotion",layer:"fullscreen",startFrame:100,endFrame:140,workId: old.motion!.workId!}),cue=state.snapshot.effectCues[0];
    const partial = structuredClone(state.snapshot);
    partial.assets = partial.assets.filter(asset => asset.id !== old.id && asset.id !== bad.id);
    assert.equal(motionMediaForCue(partial, cue, { startFrame: 110, endFrame: 120 })?.id, local.id);
    assert.equal(motionMediaForCue(partial, cue, { startFrame: 109, endFrame: 120 }), undefined);
    assert.equal(buildRenderPlan(partial, 110, 120).spans[0].layers[0].assetId, local.id);
    assert.equal(bad.motion!.workId, old.motion!.workId, "不同烘焙根范围不改变作品身份");
    assert.equal(rev(),state.revision.number);
    const replaced=app.replaceManagedMotionRange({projectId,baseRevision:rev(),cueId:cue.id,workId: local.motion!.workId!,startFrame:112,endFrame:118}),middle=replaced.snapshot.effectCues[1];
    assert.deepEqual([middle.sourceStartFrame,middle.sourceEndFrame],[12,18]);
    const binding=bindEffectAudioEvent(replaced.snapshot,{effectCueId:middle.id,eventId:"hit",workVersion:local.motion!.version,eventName:"落点",localFrame:3},115);
    assert.equal(binding.localFrame,3);
  } finally {app.close();await rm(root,{recursive:true,force:true});}
});

test("不同帧率下非整数相位的局部媒体按作品根帧预览", { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-partial-phase-")), app = createApplication(root);
  try {
    const projectId = app.createProject({ name: "局部帧相位验证" }).snapshot.project.id;
    const rev = () => app.readProject(projectId).revision.number;
    app.repository.commit(projectId, rev(), "隔离画布", snapshot => Object.assign(snapshot.timeline, { width: 128, height: 128, fps: 30, durationInFrames: 140 }));
    const source = frameHtml('<div id="frame" style="position:absolute;inset:0"></div>', "document.querySelector('#frame').style.background='rgb('+(30+f*6)+',20,30)';");
    const work = sizeMotionFixture({ ...motionFixture, source, width: 128, height: 128, fps: 24, durationInFrames: 32, compositing: "opaque" as const });
    const job = app.submitManagedMotion({ projectId, baseRevision: rev(), idempotencyKey: "partial", work, frameRange: { startFrame: 9, endFrame: 17 }, outputIntent: "asset" });
    const output = await runMotionJob(app, job); app.updateJob(job.id, { status: "succeeded", result: output });
    const scene = app.createScene({ projectId, baseRevision: rev(), type: "ExplainerScene", title: "范围", purpose: "帧相位", startFrame: 100, endFrame: 140 }).snapshot.scenes[0];
    const state = app.createEffectCue({ projectId, baseRevision: rev(), sceneId: scene.id, type: "ManagedMotion", layer: "fullscreen", startFrame: 100, endFrame: 140, workId: String(output.workId) });
    assert.equal(buildRenderPlan(state.snapshot, 112, 122).renderer, "hybrid");
    const preview = join(root, "phase.mp4"), raw = join(root, "phase.rgb");
    await new RevisionRenderer(undefined, 1).renderRange(state.snapshot, 112, 122, preview);
    await runProcess("ffmpeg", ["-v", "error", "-i", preview, "-vf", "scale=1:1", "-pix_fmt", "rgb24", "-f", "rawvideo", raw]);
    const pixels = await readFile(raw);
    assert.equal(pixels.length, 30);
    for (let index = 0; index < 10; index++) {
      const frame = Math.floor((12 + index) * 24 / 30);
      assert.ok(Math.abs(pixels[index * 3]! - (30 + frame * 6)) < 9, `项目第 ${112 + index} 帧应使用作品第 ${frame} 帧`);
    }
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test("真实 HTTP/MCP 使用同一正式范围合同，源选段和原子替换字段实际生效",{timeout:30_000},async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-range-api-")),http=await createServer({workspaceRoot:root}),app=http.application;
  const client=new Client({name:"正式范围接口回归",version:"1"}),transport=new StdioClientTransport({command:process.execPath,args:["--import","tsx","apps/server/src/mcp.ts"],cwd:process.cwd(),env:{...process.env as Record<string,string>,VIDEOCUT_WORKSPACE:root},stderr:"pipe"});
  try {
    const {snapshot}=app.createProject({name:"范围接口隔离项目"}),projectId=snapshot.project.id,rev=()=>app.readProject(projectId).revision.number;
    app.repository.commit(projectId,rev(),"隔离画布",s=>Object.assign(s.timeline,{width:128,height:128,fps:30}));
    const work=sizeMotionFixture({...motionFixture,width:128,height:128,durationInFrames:24});
    const fullJob=app.submitManagedMotion({projectId,baseRevision:rev(),idempotencyKey:"full",work});
    const full=completeMotionFixture(app,{projectId,jobId:fullJob.id,sourceHash:"full",engineVersion:String(fullJob.payload.engineVersion),metadata:{durationMs:800,width:128,height:128,hasAudio:false}});
    const scene=app.createScene({projectId,baseRevision:rev(),type:"ExplainerScene",title:"接口",purpose:"选段",startFrame:100,endFrame:124}).snapshot.scenes[0];
    const created=await http.app.inject({method:"POST",url:`/api/projects/${projectId}/effects`,payload:{baseRevision:rev(),sceneId:scene.id,type:"ManagedMotion",layer:"fullscreen",startFrame:100,endFrame:106,sourceStartFrame:4,sourceEndFrame:10,workId: full.motion!.workId!}});
    assert.equal(created.statusCode,200,created.body);const cue=app.readProject(projectId).snapshot.effectCues[0];assert.equal(cue.sourceStartFrame,4);
    await client.connect(transport);
    const tools=(await client.listTools()).tools,submit=tools.find(t=>t.name==="submit_motion_work")!,manage=tools.find(t=>t.name==="manage_effect_cues")!;
    assert.ok(submit.inputSchema.properties?.output_intent);assert.ok(submit.inputSchema.properties?.proof_job_id);assert.ok(manage.inputSchema.properties?.source_start_frame);
    const call=async(name:string,args:Record<string,unknown>)=>{const result=await client.callTool({name,arguments:{project_id:projectId,base_revision_id:rev(),...args}});assert.notEqual(result.isError,true,JSON.stringify(result.content));return JSON.parse((result.content as Array<{text:string}>)[0].text);};
    await call("manage_effect_cues",{action:"update",cue_id:cue.id,source_start_frame:5,source_end_frame:11});
    assert.equal(app.readProject(projectId).snapshot.effectCues[0].sourceStartFrame,5);
    const localJob=await call("submit_motion_work",{idempotency_key:"local",work_id:full.motion!.workId!,frame_range:{startFrame:6,endFrame:12},output_intent:"asset"});
    assert.equal(localJob.payload.outputIntent,"asset");
    const local=completeMotionFixture(app,{projectId,jobId:localJob.id,sourceHash:"local",engineVersion:String(localJob.payload.engineVersion),metadata:{durationMs:200,width:128,height:128,hasAudio:false}});
    const before=rev();await call("manage_effect_cues",{action:"replace_range",cue_id:cue.id,replacement_work_id:local.motion!.workId!,start_frame:102,end_frame:104});
    const after=app.readProject(projectId);assert.equal(after.revision.number,before+1);
    assert.deepEqual(after.snapshot.effectCues.map(c=>[c.startFrame,c.endFrame,c.sourceStartFrame,c.sourceEndFrame]),[[100,102,5,7],[102,104,7,9],[104,106,9,11]]);
    const conflict=await http.app.inject({method:"POST",url:`/api/projects/${projectId}/effects/${cue.id}/replace-range`,payload:{baseRevision:before,workId:local.motion!.workId!,startFrame:100,endFrame:101}});
    assert.equal(conflict.statusCode,409);assert.equal(rev(),after.revision.number);
  } finally {await client.close();await transport.close();await http.app.close();app.close();await rm(root,{recursive:true,force:true});}
});
