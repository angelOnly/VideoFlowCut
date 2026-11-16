import {appendReferencePlayer} from './reference-player.mjs';

/** 切片与原片使用同一播放器和原片时间。 */
export function appendMechanismClip(parent,m,durationMs){
  if(!m.clip&&!durationMs)return false;
  return appendReferencePlayer(parent,{id:m.id,kind:'motion',clip:m.clip?.path,video:m.document.split('/mechanisms/')[0]+'/video.mp4',
    offset:m.clip?.start_ms??0,startMs:m.clip?.start_ms??0,endMs:m.clip?.end_ms??durationMs,poster:m.storyboard,detail:m.detail});
}
