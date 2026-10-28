import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {splitDocument,resolveLibraryLink} from '../document-format.mjs';
import {localFile} from './mechanisms.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=(message,code='CREATIVE_LIBRARY_INVALID')=>Object.assign(new Error(message),{code});
const fields=['id','case_number','title','summary','use_when','card','video','start_ms','end_ms','clip','storyboard','frame_times_ms'];
const observation='资料基于源帧抽样整理，未完成全量原速观看与听审，新题材迁移尚未验证；本工具只读取正文和文件，不播放或听取视频。';
export const creativeCard=card=>Object.fromEntries([...fields,'score'].filter(key=>card[key]!==undefined).map(key=>[key,card[key]]));

/** 消费现有索引和正文，不生成索引，也不把媒体存在当成动态观察。 */
export function loadCreativeIndex(root){
  const bytes=readFileSync(localFile(root,'creative-index.json')),index=JSON.parse(bytes.toString('utf8'));
  if(index.schema_version!==1)throw fail('不支持的创意索引版本');
  if(!Array.isArray(index.cards)||index.count!==index.cards.length||!Array.isArray(index.processed_cases)
    ||new Set(index.processed_cases).size!==index.processed_cases.length)throw fail('创意索引数量或覆盖范围不一致');
  const catalogueBytes=readFileSync(localFile(root,'case-catalogue.json'));
  const catalogue=JSON.parse(catalogueBytes.toString('utf8'));
  if(index.catalogue_case_count!==catalogue.cases.length)throw fail('来源视频总数与目录不一致');
  const sources=[hash(bytes),hash(catalogueBytes)],seen=new Set();
  const cards=index.cards.map(card=>{
    if(!/^\d{3}-c\d{2}$/.test(card.id)||seen.has(card.id)||card.id.split('-')[0]!==String(card.case_number).padStart(3,'0'))throw fail('创意编号无效或重复');
    seen.add(card.id);
    for(const field of ['title','summary','use_when','card','video','clip','storyboard'])if(typeof card[field]!=='string'||!card[field].trim())throw fail(`${card.id} 缺少 ${field}`);
    const parent=catalogue.cases.find(entry=>entry.case_number===card.case_number);
    if(!parent||!index.processed_cases.includes(card.case_number))throw fail(`${card.id} 来源不在已处理范围`);
    if(!Number.isSafeInteger(card.start_ms)||!Number.isSafeInteger(card.end_ms)||card.start_ms<0||card.end_ms<=card.start_ms
      ||(Number.isFinite(parent.duration)&&card.end_ms>Math.ceil(parent.duration*1000)))throw fail(`${card.id} 原片范围无效`);
    if(!Array.isArray(card.frame_times_ms)||card.frame_times_ms.some((time,i)=>!Number.isSafeInteger(time)||time<card.start_ms||time>=card.end_ms||(i>0&&time<card.frame_times_ms[i-1])))throw fail(`${card.id} 分镜源时间无效`);
    // 正文缺失属于无效资料；媒体缺失在 read 中逐项报告，仍允许读完整卡。
    const raw=readFileSync(localFile(root,card.card),'utf8'),{metadata,body}=splitDocument(raw);
    if(!metadata)throw fail(`${card.id} 缺少元数据`);
    for(const field of fields.filter(key=>!['card','video','clip','storyboard'].includes(key)))if(JSON.stringify(metadata[field])!==JSON.stringify(card[field]))throw fail(`${card.id} 索引与正文 ${field} 不一致`);
    for(const field of ['video','clip','storyboard']){
      const link=resolveLibraryLink(metadata[field],card.card);
      if(link?.kind!=='local'||link.path!==card[field])throw fail(`${card.id} ${field} 路径与正文不一致`);
    }
    sources.push([card.card,hash(raw)]);
    return {...card,body,raw};
  });
  if(index.processed_cases.some(number=>!cards.some(card=>card.case_number===number)))throw fail('已处理来源没有创意卡');
  return {...index,cards,source_sha256:hash(JSON.stringify(sources))};
}

export function assertCreativeSnapshot(index,source){
  if(source&&source!==index.source_sha256)throw fail('创意资料已变化，请重新查询当前来源并核读', 'CREATIVE_LIBRARY_STALE');
}
export function selectCreativeCards(index,{ids,query,offset=0,limit=20,source_sha256}={},ranked){
  assertCreativeSnapshot(index,source_sha256);
  if(ids&&query?.trim())throw fail('编号定位与语义查询不能混用');
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>50)throw fail('分页范围无效');
  let cards=index.cards;
  if(ids){
    if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw fail('创意编号无效或重复');
    cards=ids.map(id=>{const card=index.cards.find(card=>card.id===id);if(!card)throw fail(`未知创意卡：${id}`);return card;});
  }else if(ranked){
    const byId=new Map(index.cards.map(card=>[card.id,card]));
    cards=ranked.map(entry=>({...byId.get(entry.id),score:entry.score}));
  }
  const total=cards.length,selected=cards.slice(offset,offset+limit),next=offset+selected.length;
  return {source_sha256:index.source_sha256,catalogue_case_count:index.catalogue_case_count,processed_cases:index.processed_cases,
    library_count:index.count,total,offset,next_offset:next<total?next:null,exhausted:next>=total,cards:selected.map(creativeCard),observation};
}

function media(root,path){
  try{const file=localFile(root,path);if(!statSync(file).isFile())throw new Error('不是文件');return {path,absolute_path:file,available:true};}
  catch(error){return {path,available:false,reason:error.message};}
}
function imageMime(bytes){
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
  if(['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)))return 'image/gif';
  throw new Error('分镜不是支持的图片格式');
}
export function readCreativeCase(root,{id,source_sha256,include_storyboard=true}){
  const index=loadCreativeIndex(root);
  assertCreativeSnapshot(index,source_sha256);
  const card=index.cards.find(card=>card.id===id);
  if(!card)throw fail(`未知创意卡：${id}`);
  const resources=Object.fromEntries(['video','clip','storyboard'].map(key=>[key,media(root,card[key])]));
  // 卡内 ../ 按卡位置规范化，再由 localFile 核对真实路径是否仍在库内。
  const links=[...card.body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map(match=>{
    const link=resolveLibraryLink(match[1],card.card);
    return link?.kind==='local'?media(root,link.path):link??{href:match[1],available:false,reason:'链接不能解析到库内'};
  });
  let image;
  if(include_storyboard&&resources.storyboard.available){
    try{
      const bytes=readFileSync(localFile(root,card.storyboard));
      if(bytes.length>10*1024*1024)throw new Error('分镜超过10MiB');
      image={data:bytes.toString('base64'),mimeType:imageMime(bytes)};
    }catch(error){resources.storyboard={...resources.storyboard,available:false,reason:error.message};}
  }
  return {result:{card:creativeCard(card),source_sha256:index.source_sha256,body:card.raw,resources,links,
    frame_times_ms:card.frame_times_ms,clip_frame_times_ms:card.frame_times_ms.map(time=>time-(card.clip===card.video?0:card.start_ms)),
    clip_source_offset_ms:card.clip===card.video?0:card.start_ms,observation},image};
}
