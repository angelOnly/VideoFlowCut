import { RenderFileCache } from "./visual-range-cache.js";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readdir, stat, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ProjectSnapshot } from "@videocut/contracts";
import { buildRenderPlan, type RenderPlan, type RenderSpan } from "../../../packages/edit-domain/src/render-plan.js";
import { runMotionProcess } from "./motion-process.js";
import { renderTimelineAudio } from "./timeline-audio.js";
import { timelineAudioDependencies } from "../../../packages/edit-domain/src/timeline-audio-dependencies.js";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";
import { resolveCompositionReachability } from "../../../packages/edit-domain/src/composition-reachability.js";
import { resolveCaptionFormat } from "../../../packages/contracts/src/caption-presentation.js";
import { probeMotionVideoGeometry, type MotionVideoGeometry } from "./motion-video-geometry.js";
import { mediaSampling } from "./media-sampling.js";
import { assertEncodedFrameCount, validateRenderOutput } from "./render-output-validation.js";

const identity = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

const encoders = new Map<string, Promise<{ args: string[]; name: string; reason?: string }>>();
// 清单拼接要求各段流完全一致；NUT 保留精确帧时基，避免 MKV 毫秒时钟的接点误差。
function intermediateVideoArgs(fps: number) {
  return ["-an","-c:v","ffv1","-level","3","-pix_fmt","bgra","-r",String(fps),"-enc_time_base",`1:${fps}`,"-f","nut"];
}
/** 实际试编码后选择硬编；不可用的原因记录到执行报告。 */
export function selectTimelineEncoder(width = 1920, height = 1080, fps = 30) {
  const key = `${width}:${height}:${fps}`;
  if (encoders.has(key)) return encoders.get(key)!;
  const encoder = (async () => {
    try {
      await runMotionProcess("ffmpeg",["-v","error","-f","lavfi","-i",`color=s=${width}x${height}:r=${fps}`,"-frames:v","1","-c:v","h264_nvenc","-preset","p7","-tune","hq","-rc","vbr","-cq","18","-b:v","0","-pix_fmt","yuv420p","-f","null","-"],undefined,15_000);
      return { name:"h264_nvenc",args:["-c:v","h264_nvenc","-preset","p7","-tune","hq","-rc","vbr","-cq","18","-b:v","0"] };
    } catch(error) { return { name:"libx264",args:["-c:v","libx264","-preset","medium","-crf","18"],reason:String(error) }; }
  })();
  encoders.set(key, encoder);
  return encoder;
}

async function renderMediaSpan(snapshot: ProjectSnapshot, span: RenderSpan, path: string, captions: Map<string,string>, geometries: Map<string, MotionVideoGeometry>, signal?:AbortSignal) {
  const {width,height,fps}=snapshot.timeline, count=span.endFrame-span.startFrame;
  const args=["-y","-hide_banner","-nostats","-v","verbose","-filter_complex_threads","1","-f","lavfi","-i",`color=c=0x070914:s=${width}x${height}:r=${fps}`];
  const filters=["[0:v]format=rgba[base0]"];
  const sourceReads:Array<{assetId:string;inputIndex:number;sourceStartFrame:number;seekSeconds:number;decodedFrames?:number}>=[];
  let index=1,base=0;
  for(const layer of span.layers){
    const asset=snapshot.assets.find(a=>a.id===layer.assetId)!;
    const source=resolve(snapshot.project.rootPath,asset.motion?.output?.path??asset.managedPath);
    const sourceFrame=span.startFrame-layer.origin+layer.sourceStart;
    const sampling = asset.kind === "image" ? undefined : mediaSampling(geometries.get(asset.id)!.startTimeSeconds, fps, sourceFrame, 0, asset.motion ? "up" : "near",asset.motion?.fps);
    if(asset.kind==="image") args.push("-loop","1","-framerate",String(fps),"-i",source);
    else args.push(...sampling!.inputArgs,"-i",source);
    if(sampling) sourceReads.push({assetId:asset.id,inputIndex:index,sourceStartFrame:sourceFrame,seekSeconds:sampling.seekSeconds});
    const scale=layer.fit==="cover"?`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`:`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${layer.background??"0x00000000"}`;
    const clock = sampling ? `${sampling.filter},setpts=PTS-STARTPTS` : "setpts=PTS-STARTPTS";
    filters.push(`[${index}:v]${clock},format=rgba,${scale},setsar=1[v${index}]`);
    filters.push(`[base${base}][v${index}]overlay=shortest=1:format=auto[base${base+1}]`);
    index++;base++;
  }
  for(const id of span.captionIds){
    args.push("-loop","1","-framerate",String(fps),"-i",captions.get(id)!);
    filters.push(`[base${base}][${index}:v]overlay=shortest=1:format=auto[base${base+1}]`);index++;base++;
  }
  args.push("-filter_complex",filters.join(";"),"-map",`[base${base}]`,"-frames:v",String(count),...intermediateVideoArgs(fps),path);
  // 读取 FFmpeg 的实际输入解码总数；输出帧数不能证明没有从片头重复读取。
  let pending="", encodedFrames:number|undefined;
  const observe=(chunk:string)=>{
    pending+=chunk;
    const lines=pending.split(/\r?\n/);pending=lines.pop()??"";
    for(const line of lines){
      const match=/Input stream #(\d+):\d+ \(video\):.*?;\s*(\d+) frames decoded/.exec(line);
      if(match){const read=sourceReads.find(value=>value.inputIndex===Number(match[1]));if(read) read.decodedFrames=Number(match[2]);}
      const output=/Output stream #\d+:\d+ \(video\):\s*(\d+) frames encoded/.exec(line);
      if(output) encodedFrames=Number(output[1]);
    }
  };
  await runMotionProcess("ffmpeg",args,signal,30*60_000,undefined,observe);
  observe("\n");
  assertEncodedFrameCount(encodedFrames,count);
  return sourceReads;
}

export interface CompositeCallbacks {
  browserRange(snapshot:ProjectSnapshot,start:number,end:number,path:string):Promise<void>;
  caption(snapshot:ProjectSnapshot,frame:number,path:string):Promise<void>;
}

/** 预览和导出共用同一个取得结果入口；命中完整结果前不生成任何字幕或声音。 */
export async function compositeTimeline(snapshot:ProjectSnapshot,targetPath:string,callbacks:CompositeCallbacks,from=0,to=snapshot.timeline.durationInFrames,signal?:AbortSignal):Promise<RenderPlan> {
  signal?.throwIfAborted();
  const started=Date.now(), active=resolveCompositionReachability(snapshot);
  const used = active.assetIds;
  // 文件原地更新也必须失效；同一任务每个源只核对一次，不在每段重新计算哈希。
  snapshot = { ...snapshot, assets: await Promise.all(snapshot.assets.map(async asset=>used.has(asset.id)
    ? { ...asset, sourceHash: await hashMediaFile(resolve(snapshot.project.rootPath,asset.motion?.output?.path??asset.managedPath)) } : asset)) };
  const plan=buildRenderPlan(snapshot,from,to), cache=new RenderFileCache(snapshot.project.rootPath);
  const selected=await selectTimelineEncoder(snapshot.timeline.width,snapshot.timeline.height,snapshot.timeline.fps),fps=snapshot.timeline.fps;
  const visualKey=identity({version:5,spans:plan.spans.map(span=>span.cacheKey),encoder:selected.args});
  const audioKey=identity({version:1,audio:timelineAudioDependencies(snapshot,from,to)});
  const resultKey=identity({visualKey,audioKey,mux:"aac-320k-faststart-1"});
  await mkdir(dirname(targetPath),{recursive:true});
  const directory=await mkdtemp(join(dirname(targetPath),".composite-"));
  const timings:Array<Record<string,unknown>>=[];
  let peakWorkerRssBytes = process.memoryUsage().rss, peakWorkingDirectoryBytes = 0;
  const measure = async () => {
    peakWorkerRssBytes = Math.max(peakWorkerRssBytes, process.memoryUsage().rss);
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    const sizes = await Promise.all(entries.filter(e=>e.isFile()).map(e=>stat(join(e.parentPath,e.name)).then(s=>s.size)));
    peakWorkingDirectoryBytes = Math.max(peakWorkingDirectoryBytes,sizes.reduce((a,b)=>a+b,0));
  };
  const report = async (reuse: string) => writeFile(`${targetPath}.render-plan.json`,JSON.stringify({plan,visualKey,audioKey,resultKey,reuse,encoder:selected.name,encoderFallbackReason:selected.reason,timings,peakWorkerRssBytes,peakWorkingDirectoryBytes,measurementScope:"Worker RSS 与阶段结束时临时目录占用；不含浏览器或 FFmpeg 子进程 RSS",elapsedMs:Date.now()-started},null,2));
  try {
    const complete = await cache.restore(resultKey,"mp4",targetPath);
    timings.push({kind:"result",...complete});
    if (complete.hit) { signal?.throwIfAborted(); await report("complete"); return plan; }
    const video=join(directory,"previous.mp4"), reuseVideo=await cache.restoreVideo(visualKey,video);
    const audio=join(directory,"mixed.wav"),audioAt=Date.now();
    const getAudio = () => cache.obtain(audioKey,"wav",audio,async()=>{
      const generated=await renderTimelineAudio(snapshot,from,to,directory,signal);
      await import("node:fs/promises").then(fs=>fs.rename(generated,audio));
    });
    if (reuseVideo) {
      const audioResult=await getAudio();
      timings.push({kind:"audio",...audioResult,elapsedMs:Date.now()-audioAt});
      const at=Date.now();
      await runMotionProcess("ffmpeg",["-y","-v","error","-i",video,"-i",audio,"-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","aac","-b:a","320k","-movflags","+faststart",targetPath],signal,30*60_000);
      timings.push({kind:"video_stream_copy",elapsedMs:Date.now()-at});
    } else {
      const captions=new Map<string,string>(),geometries=new Map<string,MotionVideoGeometry>();
      // 先把所有命中段复制到本任务；后续发布新段即使触发回收，也不会淘汰尚未消费的命中。
      const restored=[];
      for(const [i,span] of plan.spans.entries()){
        signal?.throwIfAborted();const at=Date.now(),path=join(directory,`visual-${i}.nut`);
        const lookup=await cache.restore(span.cacheKey,"nut",path);
        restored.push({path,lookup,lookupElapsedMs:Date.now()-at});
      }
      await measure();
      // 缺失段才绘制字幕和主画面，不重复查找已经完成的缓存读取。
      for(const [i,span] of plan.spans.entries()){
        signal?.throwIfAborted();const at=Date.now(),{path,lookup,lookupElapsedMs}=restored[i]!;
        let result=lookup;
        if(!result.hit){
          if(span.kind==="media") {
            for (const id of span.captionIds) if (!captions.has(id)) {
              const caption=snapshot.timeline.captions.find(c=>c.id===id)!;
              const key=identity({version:1,caption,format:resolveCaptionFormat(snapshot.timeline,caption),width:snapshot.timeline.width,height:snapshot.timeline.height});
              const captionPath=join(directory,`caption-${captions.size}.png`);
              const result=await cache.obtain(key,"png",captionPath,()=>callbacks.caption({...snapshot,timeline:{...snapshot.timeline,captions:[caption]}},span.startFrame,captionPath));
              timings.push({kind:"caption",id,...result});captions.set(id,captionPath);
            }
            for (const layer of span.layers) {
              const asset=snapshot.assets.find(a=>a.id===layer.assetId)!;
              if(asset.kind!=="image"&&!geometries.has(asset.id)) geometries.set(asset.id,await probeMotionVideoGeometry(resolve(snapshot.project.rootPath,asset.motion?.output?.path??asset.managedPath)));
            }
            const sourceReads=await renderMediaSpan(snapshot,span,path,captions,geometries,signal);
            timings.push(...sourceReads.map(read=>({kind:"source_read",startFrame:span.startFrame,endFrame:span.endFrame,...read})));
          } else {
            const browserPath=join(directory,"browser.mp4");
            await callbacks.browserRange(snapshot,span.startFrame,span.endFrame,browserPath);
            const progress=await runMotionProcess("ffmpeg",["-y","-v","error","-progress","pipe:1","-i",browserPath,"-map","0:v:0","-vf",`settb=1/${fps},setpts=N,setsar=1`,"-frames:v",String(span.endFrame-span.startFrame),...intermediateVideoArgs(fps),path],signal,30*60_000);
            const frameCounts=[...progress.matchAll(/^frame=(\d+)\r?$/gm)];
            assertEncodedFrameCount(frameCounts.length?Number(frameCounts.at(-1)![1]):undefined,span.endFrame-span.startFrame);
            await rm(browserPath,{force:true});
          }
          if(!await cache.save(span.cacheKey,"nut",path)) result={hit:false,reason:"capacity"};
        }
        await measure();
        timings.push({kind:span.kind,cacheHit:result.hit,cacheReason:result.reason,startFrame:span.startFrame,endFrame:span.endFrame,lookupReason:lookup.reason,lookupElapsedMs,elapsedMs:lookupElapsedMs+Date.now()-at,reasons:span.reasons});
      }
      const at=Date.now(),audioResult=await getAudio();
      timings.push({kind:"audio",...audioResult,elapsedMs:Date.now()-at});
      const list=join(directory,"visual.ffconcat");
      await writeFile(list,"ffconcat version 1.0\n"+plan.spans.map((span,i)=>`file visual-${i}.nut\nduration ${(span.endFrame-span.startFrame)/fps}\n`).join(""));
      const encodeAt=Date.now();
      await runMotionProcess("ffmpeg",["-y","-v","error","-progress","pipe:1","-f","concat","-i",list,"-i",audio,"-map","0:v:0","-map","1:a:0","-vf",`setpts=N/(${fps}*TB),setsar=1`,...selected.args,"-pix_fmt","yuv420p","-r",String(fps),"-frames:v",String(to-from),"-c:a","aac","-b:a","320k","-movflags","+faststart",targetPath],signal,30*60_000);
      timings.push({kind:"video_encode",elapsedMs:Date.now()-encodeAt});
    }
    signal?.throwIfAborted();
    await measure();
    const validationAt=Date.now();
    const validation=await validateRenderOutput(targetPath,{...snapshot.timeline,frameCount:to-from},signal);
    timings.push({kind:"output_validation",...validation,elapsedMs:Date.now()-validationAt});
    const saved=await cache.save(resultKey,"mp4",targetPath,{visualKey});
    timings.push({kind:"result_publish",saved});
    await report(reuseVideo?"video_stream":"segments");return plan;
  } catch(error) { await rm(targetPath,{force:true});await rm(`${targetPath}.render-plan.json`,{force:true});throw error; }
  finally { await rm(directory,{recursive:true,force:true}); }
}
