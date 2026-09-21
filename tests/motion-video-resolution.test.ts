import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { runProcess } from "@videocut/speech";
import { prepareMotionVideos, hashMotionFile } from "../apps/render-worker/src/motion-video.js";
import { motionDecodeDimensions, parseMotionVideoGeometry } from "../apps/render-worker/src/motion-video-geometry.js";
import { motionSubmissionSchema, boundMotionVideoSchema } from "../packages/motion-work/src/schema.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { motionHash } from "../packages/motion-work/src/compiler.js";
import { runMotionJob } from "../apps/render-worker/src/motion-job.js";

test("固定 Job 的公开比例和绑定比例不一致时先拒绝，不能进入解码", async () => {
  const work = motionSubmissionSchema.parse({ ...motionFixture, videoBindings: { footage: { assetId: "a", sourceStartMs: 0, sourceEndMs: 1000, decodeScale: 0.5 } } });
  const boundVideos = [{ slot: "footage", assetId: "a", managedPath: "source.mp4", hash: "a".repeat(64), rightsStatus: "cleared", sourceStartMs: 0, sourceEndMs: 1000, decodeScale: 0.75 }];
  const version = motionHash(work, [], "managed-motion-8", boundVideos);
  const app = { readProject: () => { throw new Error("不应读取或生成产物"); } } as any;
  await assert.rejects(runMotionJob(app, { kind: "motion_generation", payload: { work, boundVideos, boundImages: [], version, engineVersion: "managed-motion-8" } } as any), /MOTION_VIDEO_BINDING_MISMATCH/);
});

test("比例严格校验、不注入默认值且尺寸不会夹到边界",()=>{
  for (const decodeScale of [0,-1,1.01,NaN,Infinity]) {
    assert.equal(motionSubmissionSchema.safeParse({...motionFixture,videoBindings:{v:{assetId:"a",sourceStartMs:0,sourceEndMs:1000,decodeScale}}}).success,false);
    assert.equal(boundMotionVideoSchema.safeParse({slot:"v",assetId:"a",managedPath:"a",hash:"a".repeat(64),rightsStatus:"cleared",sourceStartMs:0,sourceEndMs:1000,decodeScale}).success,false);
  }
  const parsed=motionSubmissionSchema.parse({...motionFixture,videoBindings:{v:{assetId:"a",sourceStartMs:0,sourceEndMs:1000}}});assert.ok(!("decodeScale" in parsed.videoBindings!.v));
  assert.deepEqual(motionDecodeDimensions({displayWidth:1920,displayHeight:1080},{width:768,height:1344}),{width:768,height:432});
  assert.deepEqual(motionDecodeDimensions({displayWidth:1920,displayHeight:1080},{width:768,height:1344},0.75),{width:1440,height:810});
  assert.throws(()=>motionDecodeDimensions({displayWidth:3840,displayHeight:2160},motionFixture,1),/DIMENSION_BUDGET/);
  assert.throws(()=>motionDecodeDimensions({displayWidth:320,displayHeight:180},motionFixture,0.001),/DIMENSION_BUDGET/);
  assert.throws(()=>parseMotionVideoGeometry({streams:[{index:0,codec_type:"video",width:320,height:180,duration:1,tags:{rotate:45}}]}),/正交/);
});

test("实际旋转/SAR解码方向比例正确，旧版本恢复仍使用原算法",async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-geometry-"));
  try{
    const source=join(root,"source.mp4");
    await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i","color=black:s=320x180:r=30:d=1,drawbox=x=20:y=20:w=40:h=40:color=white:t=fill","-c:v","libx264",source]);
    for(const rotation of [0,90,180,270]) {
      const file=join(root,`r${rotation}.mp4`);
      await runProcess("ffmpeg",["-y","-v","error","-display_rotation",String(rotation),"-i",source,"-c","copy",file]);
      const binding={slot:"footage",assetId:"a",managedPath:`r${rotation}.mp4`,hash:await hashMotionFile(file),rightsStatus:"cleared",sourceStartMs:0,sourceEndMs:1000};
      const work={...motionFixture,width:rotation%180?180:320,height:rotation%180?320:180};
      const modern=await prepareMotionVideos(root,join(root,`new${rotation}`),work,[binding]);const frame=PNG.sync.read(await readFile(modern.footage.framePaths[0]));
      assert.equal(frame.width,work.width);assert.equal(frame.height,work.height);
      const expected=join(root,`expected${rotation}.png`);
      await runProcess("ffmpeg",["-y","-v","error","-i",file,"-frames:v","1","-pix_fmt","rgba",expected]);
      const reference=PNG.sync.read(await readFile(expected));assert.deepEqual(frame.data,reference.data);
      if(rotation===90){const legacy=await prepareMotionVideos(root,join(root,"legacy"),work,[binding],"managed-motion-7");assert.equal(legacy.footage.width,180);assert.equal(legacy.footage.height,100);}
    }
    const sar=join(root,"sar.mp4");await runProcess("ffmpeg",["-y","-v","error","-i",source,"-vf","setsar=2","-c:v","libx264",sar]);
    const binding={slot:"footage",assetId:"a",managedPath:"sar.mp4",hash:await hashMotionFile(sar),rightsStatus:"cleared",sourceStartMs:0,sourceEndMs:1000};
    const result=await prepareMotionVideos(root,join(root,"sar-new"),{...motionFixture,width:640,height:180},[binding]);assert.equal(result.footage.width,640);assert.equal(result.footage.height,180);assert.equal(result.footage.geometry?.sar,2);
  } finally{await rm(root,{recursive:true,force:true});}
});

test("多槽累计像素预算在任何解码前拒绝",async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-budget-"));
  try{
    const source=join(root,"source.mp4");await runProcess("ffmpeg",["-y","-v","error","-f","lavfi","-i","color=black:s=1920x1080:r=30:d=10","-c:v","libx264","-preset","ultrafast",source]);
    const b={slot:"left",assetId:"a",managedPath:"source.mp4",hash:await hashMotionFile(source),rightsStatus:"cleared",sourceStartMs:0,sourceEndMs:10000,decodeScale:0.75};
    await assert.rejects(prepareMotionVideos(root,join(root,"decode"),motionFixture,[b,{...b,slot:"right"}]),/699840000/);
    await assert.rejects(readFile(join(root,"decode/decoded-video/left/0.png")),/ENOENT/);
  } finally{await rm(root,{recursive:true,force:true});}
});
