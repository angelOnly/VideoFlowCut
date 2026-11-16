import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadIndex,localFile} from './mechanisms.mjs';
import {queryMechanisms} from '../mechanism-search.mjs';
import {taxonomy} from '../taxonomy.mjs';
import {media,imageMime} from './creative-library.mjs';
import {referencePreview} from './reference-preview.mjs';
export function searchLibrary(root,request={}){return {...queryMechanisms(loadIndex(root),request),taxonomy};}
export {loadIndex as loadLibraryIndex};
export function searchLibraryIndex(index,request={},semantic={}){return {...queryMechanisms(index,request,semantic),taxonomy};}
export function libraryVideo(root,id,source_sha256){
  const index=loadIndex(root),card=queryMechanisms(index,{ids:[id],source_sha256}).cards[0];
  return localFile(root,card.document.split('/mechanisms/')[0]+'/video.mp4');
}
export function readLibraryMechanism(root,{id,part='mechanism',source_sha256,include_storyboard=true,range,preview_origin}){
  if(!/^\d{3}-m\d{2}$/.test(id)||!['mechanism','overview'].includes(part))throw new Error('资料编号或范围无效');
  const index=loadIndex(root);
  const card=queryMechanisms(index,{ids:[id],...(source_sha256?{source_sha256}:{})}).cards[0];
  const parent=JSON.parse(readFileSync(localFile(root,'case-catalogue.json'),'utf8')).cases.find(entry=>entry.case_number===card.case_number);
  if(range&&Number.isFinite(parent?.duration)&&range.endMs>Math.ceil(parent.duration*1000))throw new Error(`${id} 原片范围超出视频时长`);
  const document=part==='overview'?card.overview:card.document;
  const storyboard=part==='overview'?card.overview.replace(/overview\.md$/,'storyboard.jpg'):card.storyboard;
  const body=readFileSync(localFile(root,document),'utf8');
  const video=card.document.split('/mechanisms/')[0]+'/video.mp4';
  const resources={video:media(root,video),clip:card.clip?media(root,card.clip.path):{available:false,reason:'未提供机制切片'},storyboard:media(root,storyboard)};
  if(card.clip&&resources.clip.available){
    try{
      if(statSync(resources.clip.absolute_path).size!==card.clip.bytes)throw new Error('切片文件大小与资料记录不一致');
    }catch(error){resources.clip={...resources.clip,available:false,reason:error.message};}
  }
  const selected=range??(card.clip?{startMs:card.clip.start_ms,endMs:card.clip.end_ms}:Number.isFinite(parent?.duration)?{startMs:0,endMs:Math.ceil(parent.duration*1000)}:undefined);
  const result={id,kind:'motion',card,source_sha256:index.source_sha256,range:selected,part,document,body,resources,
    clip_source_offset_ms:card.clip?.start_ms??0,
    preview_url:referencePreview({origin:preview_origin,kind:'motion',id,source_sha256:index.source_sha256,range:selected,detail:card.detail}),
    video_path:resolve(root,video),
    observation:'媒体可用状态仅表示文件检查，本工具没有播放或听取视频。'};
  let image;
  if(include_storyboard&&resources.storyboard.available){
    try{
      const bytes=readFileSync(localFile(root,storyboard));
      if(bytes.length>10*1024*1024)throw new Error('分镜超过10MiB');
      image={data:bytes.toString('base64'),mimeType:imageMime(bytes)};
    }catch(error){resources.storyboard={...resources.storyboard,available:false,reason:error.message};}
  }
  return {result,image};
}
