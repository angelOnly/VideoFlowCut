import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {PNG} from 'pngjs';
import {MOTION_ENGINE_VERSION} from '../packages/motion-work/src/compiler.js';

export const digest=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
export interface Resource {slot:string;resourceId:string;sha256:string;mime:string;width:number;height:number;regions?:Record<string,{x:number;y:number;width:number;height:number}>;local?:{x:number;y:number;width:number;height:number;scale:number}}
const canonical=(value:any):string=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])):value);
export function calculateCaseInputHash(input:{source:Buffer;parameters:Buffer;resources:Resource[]},engineVersion=MOTION_ENGINE_VERSION){
 return digest(canonical({version:2,engineVersion,sourceHash:digest(input.source),parametersHash:digest(input.parameters),resources:[...input.resources].sort((a,b)=>a.slot.localeCompare(b.slot))}));
}
/** 文件字节是身份依据，清单只是核对合同；不使用未引用的纹理。 */
export async function readCaseInputs(root:string,caseId:string){
 const folder=join(root,'cases',caseId),source=await readFile(join(folder,'source.tsx')),parameters=await readFile(join(folder,'demo-props.json'));
 const mapping=JSON.parse(await readFile(join(folder,'resources.json'),'utf8')).images as Record<string,string>;
 const manifest=JSON.parse(await readFile(join(root,'textures/manifest.json'),'utf8'));
 const resources:Resource[]=[],bytes:Record<string,Buffer>={},imageData:Record<string,string>={};
 for(const [slot,id] of Object.entries(mapping).sort()){
  if(!/^[a-z][a-z0-9_]{0,39}$/u.test(slot))throw new Error(`资源槽名称无效：${slot}`);
  const r=manifest.resources.find((v:any)=>v.id===id);if(!r)throw new Error(`缺少纹理清单：${slot}/${id}`);
  const base=resolve(root,'textures'),file=resolve(base,r.path),rel=relative(base,file);
  if(isAbsolute(r.path)||rel.startsWith('..')||isAbsolute(rel))throw new Error(`纹理路径越界：${id}`);
  let data:Buffer;try{data=await readFile(file);}catch{throw new Error(`缺少纹理文件：${slot}/${id} (${r.path})`);}
  if(digest(data)!==r.sha256)throw new Error(`纹理哈希不匹配：${slot}/${id}`);
  let png:PNG;try{png=PNG.sync.read(data,{checkCRC:true});}catch{throw new Error(`PNG 无法解码：${id}`);}
  if(r.mime!=='image/png'||png.width!==r.width||png.height!==r.height)throw new Error(`纹理尺寸或类型不匹配：${id}`);
  if(r.regions){
   for(const rect of Object.values(r.regions) as any[])if(rect.x<0||rect.y<0||rect.width<=0||rect.height<=0||rect.x+rect.width>r.width||rect.y+rect.height>r.height)throw new Error(`图集区域越界：${id}`);
   const atlas=JSON.parse(parameters.toString()).props?.stoneAtlas;
   if(canonical(atlas)!==canonical({width:r.width,height:r.height,regions:r.regions,local:r.local}))throw new Error(`图集参数与资源清单不一致：${id}`);
  }
  resources.push({slot,resourceId:id,sha256:r.sha256,mime:r.mime,width:r.width,height:r.height,...(r.regions?{regions:r.regions,local:r.local}:{})});
  bytes[slot]=data;imageData[slot]=`data:image/png;base64,${data.toString('base64')}`;
 }
 if(!mapping.paper_base)throw new Error('缺少必需资源槽：paper_base');
 if(caseId==='cutaway-head'&&!mapping.stone_head)throw new Error('缺少必需资源槽：stone_head');
 return {source,parameters,resources,bytes,imageData};
}
export interface CaseEntry {id:string;title:string;status:'todo'|'rework'|'recommended';origin:string;functions:string[];keyframes:number[]}
export interface EffectReview {inputHash:string;previewHash:string;method:'frames'|'continuous_video';verdict:'approved'|'rejected'|'inconclusive';note:string}
/** 只有当前输入与实际输出对应的连续效果认可，才支持正式推荐。渲染不会写认可。 */
export function recommendable(entry:CaseEntry,verification:any,reviews:EffectReview[],inputHash:string,previewHash:string) {
 return entry.status==='recommended' && verification.inputHash===inputHash && verification.files['preview.mp4']===previewHash
  && [...reviews].reverse().find(r=>r.method==='continuous_video'&&r.inputHash===inputHash&&r.previewHash===previewHash)?.verdict==='approved';
}
export async function buildObjectCatalog(root:string) {
 const entries=JSON.parse(await readFile(join(root,'cases.json'),'utf8')) as CaseEntry[];
 const eligible:CaseEntry[]=[];const cards:string[]=[];
 for(const e of entries){
  const folder=join(root,'cases',e.id);
  let input:string;
  try{input=calculateCaseInputHash(await readCaseInputs(root,e.id));}catch(error){cards.push(`<article><h2>${e.title}</h2><p class="status">资源不可用：${String(error).replaceAll('&','&amp;').replaceAll('<','&lt;')}</p></article>`);continue;}
  const v=JSON.parse(await readFile(join(folder,'verification.json'),'utf8'));
  const reviews=JSON.parse(await readFile(join(folder,'reviews.json'),'utf8')) as EffectReview[];
  const preview=digest(await readFile(join(folder,'preview.mp4')));
  const good=recommendable(e,v,reviews,input,preview);if(good)eligible.push(e);
  const label=good?'可推荐':e.status==='todo'?'待制作':'待返修／待效果认可';
  const stale=input!==v.inputHash?'（视频仍是旧版）':'';
  cards.push(`<article><h2>${e.title}</h2><p class="status">${label}${stale}</p><video controls preload="metadata" src="cases/${e.id}/preview.mp4"></video><p><a href="cases/${e.id}/case.md">制作说明</a> · <a href="cases/${e.id}/source.tsx">源码</a> · <a href="cases/${e.id}/reviews.json">版本观察</a></p></article>`);
 }
 const links=eligible.map(e=>`- [${e.title}](cases/${e.id}/case.md)`);
 await writeFile(join(root,'RECOMMENDED.md'),'# 正式推荐\n\n'+(links.join('\n')||'当前没有通过本版连续效果认可的物件案例。请沿原视觉方法和其他有效参考制作；开发预览不能作为已验证示范。')+'\n');
 await writeFile(join(root,'DEVELOPMENT.md'),'# 开发记录：不得作为生产默认示范\n\n'+entries.map(e=>`- [${e.title}](cases/${e.id}/case.md)：${e.status==='todo'?'待制作':e.status==='rework'?'待返修':'须核对当前版本认可'}。`).join('\n')+'\n');
 await writeFile(join(root,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>物件案例返修预览</title><style>body{margin:40px auto;max-width:1200px;padding:0 24px;background:#f3efe5;color:#18302c;font:16px/1.7 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px}article{background:#fff;padding:20px;border-radius:10px}video{width:100%}.status{color:#9a4328}a{color:#176b76}</style><h1>物件案例 · 返修预览</h1><p>正式可推荐：${eligible.length} 个。下面是开发候选，可查看变化，不代表已通过效果认可。</p><p><a href="RECOMMENDED.md">正式推荐</a> · <a href="REFERENCE.md">使用边界</a></p><p><a href="full-scenes/surreal-collage-token/index.html">超现实拼贴完整场面 · Token 原作</a>：独立 Canvas 完整参考，存在字体差异，待用户确认。</p><main>${cards.join('')}</main></html>\n`);
}
