import { reuseVisualRange } from "./visual-range-cache.js";
import { mkdtemp, mkdir, readdir, stat, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ProjectSnapshot } from "@videocut/contracts";
import { buildRenderPlan, type RenderPlan, type RenderSpan } from "./render-plan.js";
import { runMotionProcess } from "./motion-process.js";
import { renderTimelineAudio } from "./timeline-audio.js";

const encoders = new Map<string, Promise<{ args: string[]; name: string; reason?: string }>>();
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

async function renderMediaSpan(snapshot: ProjectSnapshot, span: RenderSpan, path: string, captions: Map<string,string>, signal?:AbortSignal) {
  const {width,height,fps}=snapshot.timeline, count=span.endFrame-span.startFrame;
  const args=["-y","-v","error","-filter_complex_threads","1","-f","lavfi","-i",`color=c=0x070914:s=${width}x${height}:r=${fps}`];
  const filters=["[0:v]format=rgba[base0]"];
  let index=1,base=0;
  for(const layer of span.layers){
    const asset=snapshot.assets.find(a=>a.id===layer.assetId)!;
    const source=resolve(snapshot.project.rootPath,asset.motion?.output?.path??asset.managedPath);
    const sourceFrame=span.startFrame-layer.origin+layer.sourceStart;
    if(asset.kind==="image") args.push("-loop","1","-framerate",String(fps),"-i",source);
    else args.push("-i",source);
    const scale=layer.fit==="cover"?`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`:`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${layer.background??"0x00000000"}`;
    const clock = asset.motion?.output
      ? `settb=1/${asset.motion.fps},setpts=N,fps=${fps}:round=up,trim=start_frame=${span.startFrame-layer.origin},setpts=PTS-STARTPTS`
      : asset.kind === "image" ? `setpts=PTS-STARTPTS`
      : `setpts=PTS-STARTPTS,fps=${fps}:round=near,trim=start_frame=${sourceFrame},setpts=PTS-STARTPTS`;
    filters.push(`[${index}:v]${clock},format=rgba,${scale},setsar=1[v${index}]`);
    filters.push(`[base${base}][v${index}]overlay=shortest=1:format=auto[base${base+1}]`);
    index++;base++;
  }
  for(const id of span.captionIds){
    args.push("-loop","1","-framerate",String(fps),"-i",captions.get(id)!);
    filters.push(`[base${base}][${index}:v]overlay=shortest=1:format=auto[base${base+1}]`);index++;base++;
  }
  args.push("-filter_complex",filters.join(";"),"-map",`[base${base}]`,"-frames:v",String(count),"-an","-c:v","ffv1","-level","3","-pix_fmt","bgra",path);
  await runMotionProcess("ffmpeg",args,signal,30*60_000);
}

export interface CompositeCallbacks {
  browserRange(snapshot:ProjectSnapshot,start:number,end:number,path:string):Promise<void>;
  caption(snapshot:ProjectSnapshot,frame:number,path:string):Promise<void>;
}
export async function compositeTimeline(snapshot:ProjectSnapshot,targetPath:string,callbacks:CompositeCallbacks,from=0,to=snapshot.timeline.durationInFrames,signal?:AbortSignal):Promise<RenderPlan> {
  const started=Date.now(),plan=buildRenderPlan(snapshot,from,to);
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
  try {
    const captions=new Map<string,string>();
    for(const span of plan.spans.filter(s=>s.kind==="media")) for(const id of span.captionIds) if(!captions.has(id)){
      const path=join(directory,`caption-${captions.size}.png`);
      await callbacks.caption({ ...snapshot, timeline: { ...snapshot.timeline, captions: snapshot.timeline.captions.filter(c=>c.id===id) } },span.startFrame,path); captions.set(id,path);
    }
    const paths:string[]=[];
    for(const span of plan.spans){
      signal?.throwIfAborted();const at=Date.now(),path=join(directory,`visual-${paths.length}.${span.kind==="media"?"mkv":"mp4"}`);
      let cacheHit = false;
      if(span.kind==="media") await renderMediaSpan(snapshot,span,path,captions,signal);
      else cacheHit = await reuseVisualRange(snapshot.project.rootPath,span.cacheKey,path,()=>callbacks.browserRange(snapshot,span.startFrame,span.endFrame,path));
      await measure();
      paths.push(path);timings.push({kind:span.kind,cacheHit,startFrame:span.startFrame,endFrame:span.endFrame,elapsedMs:Date.now()-at,reasons:span.reasons});
    }
    const audioAt=Date.now(),audio=await renderTimelineAudio(snapshot,from,to,directory,signal);
    timings.push({kind:"audio",elapsedMs:Date.now()-audioAt});
    await measure();
    const selected=await selectTimelineEncoder(snapshot.timeline.width,snapshot.timeline.height,snapshot.timeline.fps),fps=snapshot.timeline.fps;
    const filters=paths.map((_,i)=>`[${i}:v]setpts=N/(${fps}*TB),setsar=1,format=yuv420p[v${i}]`);
    filters.push(`${paths.map((_,i)=>`[v${i}]`).join("")}concat=n=${paths.length}:v=1:a=0[out]`);
    await runMotionProcess("ffmpeg",["-y","-v","error","-progress","pipe:1","-filter_complex_threads","1",...paths.flatMap(p=>["-i",p]),"-i",audio,"-filter_complex",filters.join(";"),"-map","[out]","-map",`${paths.length}:a:0`,...selected.args,"-pix_fmt","yuv420p","-r",String(fps),"-frames:v",String(to-from),"-c:a","aac","-b:a","320k","-movflags","+faststart",targetPath],signal,30*60_000);
    await writeFile(`${targetPath}.render-plan.json`,JSON.stringify({plan,encoder:selected.name,encoderFallbackReason:selected.reason,timings,peakWorkerRssBytes,peakWorkingDirectoryBytes,measurementScope:"Worker RSS 与阶段结束时临时目录占用；不含浏览器或 FFmpeg 子进程 RSS",elapsedMs:Date.now()-started},null,2));
    return plan;
  } catch(error) { await rm(targetPath,{force:true});await rm(`${targetPath}.render-plan.json`,{force:true});throw error; }
  finally { await rm(directory,{recursive:true,force:true}); }
}
