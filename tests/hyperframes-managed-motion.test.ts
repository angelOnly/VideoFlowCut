import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import { probeMedia, runProcess } from "@videocut/speech";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";
import { hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHtml } from "./fixtures/hyperframes.js";
import { validateMotionSource } from "../packages/motion-work/src/compiler.js";
import { HYPERFRAMES_DEPENDENCIES } from "../packages/motion-work/src/hyperframes-contract.js";

test("HTML 合同拒绝旧入口和未绑定资源，错误在入队前可定位", () => {
  assert.throws(() => validateMotionSource("export default ()=>null"), /MOTION_SOURCE_INVALID/);
  assert.throws(() => validateMotionSource(motionHtml('<script src="https://cdn.test/a.js"></script>')), /MOTION_IMPORT_REJECTED/);
  assert.throws(() => validateMotionSource(motionHtml('<img id="actor" data-vfc-video-slot="missing">'), motionFixture), /MOTION_RESOURCE_INVALID/);
  assert.throws(() => validateMotionSource(motionHtml().replace('data-width="320"','data-width="400"'), motionFixture), /MOTION_COMPOSITION_MISMATCH/);
});

test("真实 HTML Job 保留字体、透明、图片与视频根时钟、事件、局部校样和缓存恢复", {timeout:120000}, async () => {
  const root = await mkdtemp(join(tmpdir(),"vfc-hyperframes-")), app = createApplication(root);
  try {
    const state=app.createProject({name:"HyperFrames 隔离接续"}), projectId=state.snapshot.project.id;
    const projectRoot=state.snapshot.project.rootPath;
    const videoPath=join(projectRoot,"assets/source/video.mp4"), imagePath=join(projectRoot,"assets/source/image.png");
    await mkdir(join(projectRoot,"assets/source"),{recursive:true});
    await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i","testsrc2=s=64x64:r=30:d=1","-c:v","libx264",videoPath]);
    await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i","color=red:s=16x16","-frames:v","1",imagePath]);
    const assets:Record<string,string>={};
    for(const [kind,path] of [["video",videoPath],["image",imagePath]] as const){
      const imported=app.registerImportedAsset({projectId,baseRevision:app.readProject(projectId).revision.number,name:kind,kind,managedPath:`assets/source/${kind}.${kind==='video'?'mp4':'png'}`,sourceHash:await hashMotionFile(path),provenance:{source:"local_import",acquiredAt:new Date().toISOString()}});
      app.applyMediaAnalysis({projectId,assetId:imported.asset.id,metadata:await probeMedia(path)});assets[kind]=imported.asset.id;
    }
    const config={width:320,height:320,fps:30,durationInFrames:12};
    const work={...motionFixture,...config,fontBindings:{title:"noto-sans-sc-bold"},imageBindings:{picture:assets.image},videoBindings:{actor:{assetId:assets.video,sourceStartMs:200,sourceEndMs:467,startFrame:2,endFrame:10}},
      source:motionHtml(`<img data-vfc-image-slot="picture" style="position:absolute;width:16px;height:16px;left:10px;top:10px">
<div id="group" style="position:absolute;left:40px;top:40px;width:64px;height:64px"><img id="actor" data-vfc-video-slot="actor" style="width:64px;height:64px"></div>
<img id="other" data-vfc-video-slot="actor" style="position:absolute;left:150px;top:40px;width:64px;height:64px">
<div id="title" style="position:absolute;left:20px;top:180px;color:white;font-size:28px;font-family:var(--vfc-font-title)">真实字体</div>`, `
if(!document.fonts.check('700 28px "'+vfc.fonts.title.family+'"'))throw Error('字体尚未就绪');
const picture=document.createElement('img');picture.setAttribute('data-vfc-image-slot','picture');picture.style.cssText='position:absolute;left:30px;top:10px;width:16px;height:16px';document.body.append(picture);
tl.set('#group',{visibility:'hidden'},4/config.fps).set('#group',{visibility:'visible',scale:1},7/config.fps);
tl.fromTo('#title',{x:0},{x:20,duration:config.durationInFrames/config.fps,ease:'none'},0);
tl.addLabel('show',2/config.fps);window.getVfcMotionEvents=()=>[{id:'show',meaning:'人物进入',startFrame:Math.round(tl.labels.show*config.fps),endFrame:10}];`,config)};
    app.repository.commit(projectId,app.readProject(projectId).revision.number,"隔离画布",snapshot=>Object.assign(snapshot.timeline,{width:320,height:320,fps:30,durationInFrames:12}));
    const revision=app.readProject(projectId).revision.number;
    const job=app.submitManagedMotion({projectId,baseRevision:revision,idempotencyKey:"whole",work});
    assert.equal(app.readProject(projectId).revision.number,revision);
    const result=await runMotionJob(app,job);const current=app.readProject(projectId),asset=current.snapshot.assets.find(a=>a.id===result.assetId)!;
    assert.equal(asset.motion!.eventMap!.events[0].startFrame,2);
    const dir=join(projectRoot,asset.motion!.framesDirectory,"..");
    const manifest=JSON.parse(await readFile(join(dir,"manifest.json"),"utf8"));
    assert.deepEqual(manifest.runtimeDependencies,HYPERFRAMES_DEPENDENCIES);assert.equal(manifest.determinism.status,"exact");
    assert.equal(await readFile(join(dir,"source.html"),"utf8"),work.source);
    const frame=PNG.sync.read(await readFile(join(dir,"frames/frame-00007.png")));
    const pixel=(x:number,y:number)=>[...frame.data.subarray((y*320+x)*4,(y*320+x)*4+4)];
    assert.equal(pixel(319,319)[3],0);assert.deepEqual(pixel(12,12),[...PNG.sync.read(await readFile(imagePath)).data.subarray(0,4)]);
    assert.deepEqual(pixel(32,12),pixel(12,12),"作者初始化创建的图片槽也完成绑定与解码");
    assert.deepEqual(pixel(60,60),pixel(170,60),"重新显露的窗口仍使用同一个源时刻");
    const before=app.readProject(projectId).revision.number;
    const proof=app.submitManagedMotion({projectId,baseRevision:before,idempotencyKey:"proof",work,frameRange:{startFrame:6,endFrame:9}});
    const pr=await runMotionJob(app,proof);assert.equal(pr.kind,"motion_proof");assert.equal(app.readProject(projectId).revision.number,before);
    const proofManifest=JSON.parse(await readFile(join(projectRoot,String(pr.sourcePath),"../manifest.json"),"utf8"));
    assert.deepEqual(proofManifest.frameHashes,manifest.frameHashes.slice(6,9));
    assert.equal((await runMotionJob(app,job)).assetId,asset.id,"完成缓存可恢复同一资产");
    const scene=app.createScene({projectId,baseRevision:before,type:"ExplainerScene",title:"接续",purpose:"隔离合成",startFrame:0,endFrame:12});
    const cue=app.createEffectCue({projectId,baseRevision:scene.revision.number,sceneId:scene.snapshot.scenes.at(-1)!.id,type:"ManagedMotion",layer:"fullscreen",startFrame:0,endFrame:12,assetBindings:[{slot:"motion",assetId:asset.id}]});
    assert.equal(cue.snapshot.effectCues.at(-1)!.assetBindings[0].assetId,asset.id);
  }finally{app.close();await rm(root,{recursive:true,force:true});}
});

test("真实运行失败保留 Job 诊断，动态出处与事件错误不登记资产", {timeout:60000}, async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-hf-failure-")),app=createApplication(root);
  try{
    const {snapshot}=app.createProject({name:"运行失败"}),projectId=snapshot.project.id;
    const work={...motionFixture,source:motionHtml('<div id="text"></div>',"document.querySelector('#text').textContent='来源：测试';")};
    const job=app.submitManagedMotion({projectId,baseRevision:1,idempotencyKey:"dynamic",work});
    await assert.rejects(runMotionJob(app,job),/来源|出处/);
    assert.equal(app.readProject(projectId).snapshot.assets.length,0);
    assert.ok(app.trackJob(job.id).result?.motionFailure);
    await assert.rejects(renderManagedMotion({...motionFixture,source:motionHtml('',"window.getVfcMotionEvents=()=>[{id:'bad',meaning:'越界',startFrame:99}];")},join(root,"events")),/MOTION_EVENT_RANGE_INVALID/);
  }finally{app.close();await rm(root,{recursive:true,force:true});}
});
