import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join, resolve } from "node:path";
import { DomainError } from "@videocut/domain";
import type { ProjectSnapshot } from "@videocut/contracts";
import { resolveCompositionReachability } from "../../../packages/edit-domain/src/composition-reachability.js";
import { audioCueVolumeAt, plannedVoiceVolumeAt, resolveVideoSourceVolume, resolveVlogAmbientVolume } from "../../../packages/remotion-runtime/src/audio-semantics.js";
import { runMotionProcess } from "./motion-process.js";

/** 用 Player 的同一增益求值逐帧处理 PCM；流式读写，声音只在最终总线上混入一次。 */
export async function renderTimelineAudio(snapshot: ProjectSnapshot, from: number, to: number, directory: string, signal?: AbortSignal): Promise<string> {
  const gainDb = snapshot.audioMixGainDb ?? 0;
  if (!Number.isFinite(gainDb) || gainDb < -48 || gainDb > 24) throw new DomainError("整体混合增益必须在 -48 到 24 dB 之间", "INVALID_AUDIO_MIX_GAIN");
  const active = resolveCompositionReachability(snapshot), fps = snapshot.timeline.fps, rate = 48000;
  const outputs: string[] = [], delays: number[] = [];
  for (const item of snapshot.timeline.items) {
    if (!active.audioItemIds.has(item.id) && !active.videoItemIds.has(item.id)) continue;
    const asset = snapshot.assets.find(a=>a.id===item.assetId)!, track = snapshot.timeline.tracks.find(t=>t.id===item.trackId)!;
    if (!asset.metadata?.hasAudio || asset.motion || item.mediaAudioPolicy === "mute" || track.muted || item.endFrame <= from || item.startFrame >= to) continue;
    const video = track.kind === "video";
    const cue = snapshot.audioCues.find(c=>c.timelineItemId===item.id && c.status==="ready");
    const length = item.sourceEndFrame-item.sourceStartFrame;
    const crossfade = !video && cue?.loop ? cue.loopCrossfadeFrames ?? 0 : 0;
    const step = length-crossfade;
    if (length <= 0 || step <= 0) throw new Error("AUDIO_SOURCE_RANGE_INVALID");
    const offsets = !video && cue?.loop && crossfade > 0 ? Array.from({length:Math.ceil((item.endFrame-item.startFrame)/step)},(_,i)=>i*step) : [0];
    for (const offset of offsets) {
      const start = Math.max(from,item.startFrame+offset), end = Math.min(to,item.endFrame, crossfade ? item.startFrame+offset+length : Infinity);
      if (start >= end) continue;
      const looping = !video && cue?.loop && !crossfade;
      const path = join(directory,`audio-${outputs.length}.f32`);
      const filters = [`atrim=start=${item.sourceStartFrame/fps}:end=${item.sourceEndFrame/fps}`, "asetpts=PTS-STARTPTS", `aresample=${rate}`, "aformat=sample_fmts=flt:channel_layouts=stereo",
        ...(looping ? [`aloop=loop=-1:size=${Math.round(length/fps*rate)}`] : []),
        `atrim=start=${(start-item.startFrame-offset)/fps}:duration=${(end-start)/fps}`, "asetpts=PTS-STARTPTS", `apad=whole_len=${Math.round((end-start)/fps*rate)}`, `atrim=end_sample=${Math.round((end-start)/fps*rate)}`];
      const child = spawn("ffmpeg",["-v","error","-i",resolve(snapshot.project.rootPath,asset.managedPath),"-vn","-af",filters.join(","),"-ar",String(rate),"-ac","2","-f","f32le","pipe:1"],{windowsHide:true,stdio:["ignore","pipe","pipe"]});
      let stderr="", carry=Buffer.alloc(0), sample=0;
      child.stderr.on("data",b=>{stderr=(stderr+String(b)).slice(-4000);});
      const done=new Promise<void>((resolve,reject)=>{child.once("error",reject);child.once("close",code=>code===0?resolve():reject(new Error(`AUDIO_DECODE_FAILED: ${stderr}`)));});
      void done.catch(()=>{});
      const abort=()=>{child.kill();}; signal?.addEventListener("abort",abort,{once:true});
      if(signal?.aborted) abort();
      const timer=setTimeout(abort,30*60_000);
      const performance=snapshot.actorPerformances.find(p=>p.timelineItemId===item.id && p.status==="ready");
      const cutaway=snapshot.cutaways.find(c=>c.timelineItemId===item.id && c.status==="ready");
      const gainAt=(global:number)=>{
        const local=global-item.startFrame;
        if(video) return resolveVideoSourceVolume(snapshot,item,track,performance,cutaway)*plannedVoiceVolumeAt(snapshot,item,"source_speech",global);
        let gain=crossfade ? audioCueVolumeAt(snapshot,item,track,cue,local) : resolveVlogAmbientVolume(snapshot,item,track) ?? audioCueVolumeAt(snapshot,item,track,cue,local);
        if(crossfade) { const segment=local-offset; gain *= (offset ? Math.min(1,Math.max(0,segment/crossfade)):1) * (offset+step<item.endFrame-item.startFrame ? Math.min(1,Math.max(0,(length-segment)/crossfade)):1); }
        return gain;
      };
      let lastFrame=-1,gain=0;
      const transform=new Transform({transform(chunk:Buffer,_encoding,callback){
        const data=carry.length?Buffer.concat([carry,chunk]):chunk, count=data.length-data.length%8;
        for(let byte=0;byte<count;byte+=8){const frame=start+Math.floor(sample*fps/rate+1e-9);if(frame!==lastFrame){lastFrame=frame;gain=gainAt(frame);}data.writeFloatLE(data.readFloatLE(byte)*gain,byte);data.writeFloatLE(data.readFloatLE(byte+4)*gain,byte+4);sample++;}
        carry=Buffer.from(data.subarray(count));callback(null,data.subarray(0,count));
      }});
      try { await Promise.all([pipeline(child.stdout,transform,createWriteStream(path)),done]); signal?.throwIfAborted(); }
      finally { clearTimeout(timer); child.kill(); signal?.removeEventListener("abort",abort); }
      outputs.push(path);delays.push(Math.round((start-from)/fps*rate));
    }
  }
  const output=join(directory,"audio.wav"),duration=(to-from)/fps;
  const inputs=outputs.flatMap(path=>["-f","f32le","-ar",String(rate),"-ac","2","-i",path]);
  const filters=outputs.map((_,i)=>`[${i}:a]adelay=${delays[i]}S:all=1[a${i}]`);
  if(outputs.length) filters.push(`${outputs.map((_,i)=>`[a${i}]`).join("")}amix=inputs=${outputs.length}:normalize=0,volume=${gainDb}dB,apad=whole_len=${Math.round(duration*rate)},atrim=end_sample=${Math.round(duration*rate)}[out]`);
  await runMotionProcess("ffmpeg",["-y","-v","error","-filter_complex_threads","1",...inputs,...(outputs.length?["-filter_complex",filters.join(";"),"-map","[out]"]:["-f","lavfi","-i",`anullsrc=r=${rate}:cl=stereo`,"-t",String(duration)]),"-c:a","pcm_f32le",output],signal,30*60_000);
  return output;
}
