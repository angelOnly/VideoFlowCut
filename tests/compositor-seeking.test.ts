import { motionWorkFixture } from "./fixtures/motion-output.js";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { createApplication } from "@videocut/application";
import type { ProjectSnapshot } from "@videocut/contracts";
import { runProcess } from "@videocut/speech";
import { compositeTimeline } from "../apps/render-worker/src/ffmpeg-compositor.js";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";

const width=64,height=64,fps=30;
const transparentCaption=PNG.sync.write(new PNG({width,height}));
const callbacks={
  browserRange:async()=>{assert.fail("普通视频与正式作品媒体应直接合成，不进入浏览器");},
  caption:async(_snapshot:ProjectSnapshot,_frame:number,path:string)=>{await writeFile(path,transparentCaption);}
};

async function pixels(path:string, output:string, filters?:string) {
  await runProcess("ffmpeg",["-y","-v","error","-copyts","-i",path,...(filters?["-vf",filters]:[]),"-an","-pix_fmt","rgb24","-fps_mode","passthrough","-f","rawvideo",output]);
  return readFile(output);
}

function compareFrames(actual:Buffer,expected:Buffer,count:number,label:string) {
  const frameBytes=width*height*3;
  assert.equal(actual.length,frameBytes*count,`${label} 实际输出帧数`);
  assert.equal(expected.length,actual.length,`${label} 基线帧数`);
  // 每个源帧具有不同整幅颜色；取中心像素允许最终 H.264 的少量色彩量化。
  for(let f=0;f<count;f++) for(let c=0;c<3;c++) {
    const i=f*frameBytes+(32*width+32)*3+c;
    assert.ok(Math.abs(actual[i]!-expected[i]!)<=7,`${label} 第 ${f} 帧通道 ${c}: ${actual[i]} / ${expected[i]}`);
  }
}

async function sourceSnapshot(snapshot:ProjectSnapshot,path:string,managed:boolean,origin:number,sourceStart:number,duration:number) {
  const relative=`assets/source/${managed?"managed.mkv":"ordinary.mp4"}`,hash=await hashMediaFile(path);
  Object.assign(snapshot.timeline,{width,height,fps,durationInFrames:origin+duration});
  snapshot.project.brief.captionMode="stable";
  snapshot.assets.push({id:"source",name:"准确定位源",tags:[],kind:"video",status:"ready",managedPath:relative,sourceHash:hash,createdAt:new Date().toISOString(),metadata:{width,height,hasAudio:false},
    ...(managed?{motion:{width,height,fps:24,frameCount:72*24,output:{path:relative,hash,kind:"alpha_video",codec:"ffv1",pixelFormat:"bgra"}}}:{})} as any);
  if(managed) {
    snapshot.assets.at(-1)!.motion!.workId = "source-work";
    snapshot.motionWorks = [motionWorkFixture({ id: "source-work", width, height, fps: 24, frameCount: 72 * 24 })];
    snapshot.scenes.push({id:"scene",type:"ExplainerScene",title:"定位验证",purpose:"保留作品时钟",startFrame:origin,endFrame:origin+duration} as any);
    snapshot.effectCues.push({id:"cue",type:"ManagedMotion",status:"ready",sceneId:"scene",layer:"fullscreen",startFrame:origin,endFrame:origin+duration,sourceStartFrame:sourceStart,workId:"source-work",assetBindings:[],props:{},spatialAnchor:"full_frame",stylePackId:"managed-source",intensity:1,motion:{enterPreset:"none",settlePreset:"hold",exitPreset:"none",enterFrames:0,exitFrames:0,holdFrames:duration}} as any);
  } else {
    snapshot.timeline.tracks.push({id:"video",name:"视频",kind:"video",order:0,hidden:false,muted:false,locked:false});
    snapshot.timeline.items.push({id:"video-item",assetId:"source",trackId:"video",startFrame:origin,endFrame:origin+duration,sourceStartFrame:sourceStart,sourceEndFrame:sourceStart+duration,disabled:false});
  }
}

test("长视频尾部的普通与正式作品合成保持24→30相位，真实输入解码量不随源前缀增长",{timeout:90_000},async t=>{
  for(const managed of [false,true]) await t.test(managed?"正式作品按固定作品帧号取样":"普通视频按非零PTS取样",async()=>{
    const root=await mkdtemp(join(tmpdir(),"vfc-compositor-seek-")),app=createApplication(join(root,"workspace"));
    try {
      const {snapshot}=app.createProject({name:"长视频尾部隔离验证"});
      const path=join(snapshot.project.rootPath,`assets/source/${managed?"managed.mkv":"ordinary.mp4"}`);
      // 72秒、1728帧的小画布源既能区分相邻帧，也不需要正式视频或生产队列。
      const pattern="nullsrc=s=64x64:r=24:d=72,geq=r='32+mod(N,8)*28':g='32+mod(floor(N/8),8)*28':b='32+mod(floor(N/64),8)*28'";
      await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i",pattern,...(managed?["-c:v","ffv1","-level","3","-g","24","-pix_fmt","bgra"]:["-vf","setpts=PTS+7/TB","-c:v","libx264","-crf","0","-g","48","-bf","0","-pix_fmt","yuv444p"]),path]);
      const origin=83,sourceStart=5,sourceFrame=2017,from=origin+sourceFrame-sourceStart,count=26;
      await sourceSnapshot(snapshot,path,managed,origin,sourceStart,72*fps-sourceStart);
      snapshot.timeline.captions.push(...[0,5,11].map((offset,i)=>({id:`caption-${i}`,text:String(i),startFrame:from+offset,endFrame:from+([5,11,count][i]!)} as any)));
      const target=join(root,"tail.mp4"),plan=await compositeTimeline(snapshot,target,callbacks,from,from+count);
      assert.equal(plan.spans.length,3,"必须经过字幕切分而不是只验证单段");
      const base=managed?"settb=1/24,setpts=N,fps=30:round=up":"setpts=PTS-7/TB,fps=30:round=near";
      const expected=await pixels(path,join(root,"expected.rgb"),`${base},trim=start_frame=${sourceFrame}:end_frame=${sourceFrame+count},setpts=PTS-STARTPTS`);
      compareFrames(await pixels(target,join(root,"actual.rgb")),expected,count,managed?"ManagedMotion":"普通视频");
      const report=JSON.parse(await readFile(`${target}.render-plan.json`,"utf8"));
      const reads=report.timings.filter((row:any)=>row.kind==="source_read");
      assert.equal(reads.length,3);
      for(const read of reads) {
        assert.ok(read.seekSeconds>60,"必须真实执行非零输入定位");
        assert.ok(Number.isInteger(read.decodedFrames)&&read.decodedFrames>0,"必须报告FFmpeg真实输入解码帧数");
        assert.ok(read.decodedFrames<120,`尾部短段不应解码前面1600余帧：${JSON.stringify(read)}`);
      }
      assert.ok(reads.reduce((sum:number,row:any)=>sum+row.decodedFrames,0)<300);
      console.log(JSON.stringify({source:managed?"managed-24fps":"ordinary-24fps-offset7s",sourceFrames:72*24,outputFrames:count,reads:reads.map(({sourceStartFrame,seekSeconds,decodedFrames}:any)=>({sourceStartFrame,seekSeconds,decodedFrames}))}));
    } finally {app.close();await rm(root,{recursive:true,force:true});}
  });
});

test("普通VFR长停顿在字幕分段与非零时间线起点保持同一源画面",{timeout:30_000},async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-compositor-vfr-")),app=createApplication(join(root,"workspace"));
  try {
    const {snapshot}=app.createProject({name:"VFR时间网格隔离验证"});
    const path=join(snapshot.project.rootPath,"assets/source/ordinary.mp4");
    await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i","nullsrc=s=64x64:r=24:d=7,geq=r='32+mod(N,8)*28':g='32+mod(floor(N/8),8)*28':b='32+mod(floor(N/64),8)*28'","-vf","select='eq(n,0)+eq(n,120)+eq(n,144)'","-fps_mode","vfr","-c:v","libx264","-crf","0","-bf","0",path]);
    const origin=91,sourceStart=3,sourceFrame=75,from=origin+sourceFrame-sourceStart,count=30;
    await sourceSnapshot(snapshot,path,false,origin,sourceStart,180-sourceStart);
    snapshot.timeline.captions.push({id:"split",text:"切分",startFrame:from+13,endFrame:from+count} as any);
    const target=join(root,"gap.mp4");await compositeTimeline(snapshot,target,callbacks,from,from+count);
    const expected=await pixels(path,join(root,"expected.rgb"),`setpts=PTS-STARTPTS,fps=30:round=near,trim=start_frame=${sourceFrame}:end_frame=${sourceFrame+count},setpts=PTS-STARTPTS`);
    compareFrames(await pixels(target,join(root,"actual.rgb")),expected,count,"VFR停顿");
  } finally {app.close();await rm(root,{recursive:true,force:true});}
});
