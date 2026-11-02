import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import type { Asset } from "@videocut/contracts";
import { MotionFrameCache } from "../packages/media-intelligence/src/motion-frames.js";
import { createMotionStreamEncoder } from "../apps/render-worker/src/motion-stream-encoder.js";
import { motionFixture } from "./fixtures/managed-motion.js";
import { hashMediaFile } from "../packages/edit-application/src/media-intelligence.js";
import { readOutputFrame } from "./fixtures/motion-output.js";

test("播放器原生帧服务在24fps非零起点与淘汰重读时不跳过毫秒PTS帧",async()=>{
  const root=await mkdtemp(join(tmpdir(),"vfc-native-frame-"));
  try {
    const path=join(root,"output.mkv"),encoder=createMotionStreamEncoder({...motionFixture,width:64,height:64,fps:24,compositing:"alpha"},path);
    for(let frame=0;frame<9;frame++){
      const image=new PNG({width:64,height:64});
      for(let i=0;i<image.data.length;i+=4){image.data[i]=frame%2?240:10;image.data[i+1]=frame*23;image.data[i+3]=255;}
      await encoder.write(image.data);
    }
    await encoder.finish();const hash=await hashMediaFile(path);
    const asset={id:"motion",sourceHash:hash,motion:{frameCount:9,fps:24,width:64,height:64,output:{path:"output.mkv",hash}}} as Asset;
    const cache=new MotionFrameCache(1);
    for(const frame of [2,5,8,1,7]) assert.deepEqual(PNG.sync.read(await cache.get(root,asset,hash,frame)).data,PNG.sync.read(await readOutputFrame(path,frame)).data,`原生帧${frame}必须与从头解码一致`);
  } finally {await rm(root,{recursive:true,force:true});}
});
