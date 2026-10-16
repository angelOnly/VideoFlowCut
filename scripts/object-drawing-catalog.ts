import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export const digest=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
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
  const folder=join(root,'cases',e.id),source=await readFile(join(folder,'source.tsx'),'utf8'),params=await readFile(join(folder,'demo-props.json'),'utf8');
  const v=JSON.parse(await readFile(join(folder,'verification.json'),'utf8'));
  const reviews=JSON.parse(await readFile(join(folder,'reviews.json'),'utf8')) as EffectReview[];
  const input=digest(source+'\n'+params),preview=digest(await readFile(join(folder,'preview.mp4')));
  const good=recommendable(e,v,reviews,input,preview);if(good)eligible.push(e);
  const label=good?'可推荐':e.status==='todo'?'待制作':'待返修／待效果认可';
  const stale=input!==v.inputHash?'（视频仍是旧版）':'';
  cards.push(`<article><h2>${e.title}</h2><p class="status">${label}${stale}</p><video controls preload="metadata" src="cases/${e.id}/preview.mp4"></video><p><a href="cases/${e.id}/case.md">制作说明</a> · <a href="cases/${e.id}/source.tsx">源码</a> · <a href="cases/${e.id}/reviews.json">版本观察</a></p></article>`);
 }
 const links=eligible.map(e=>`- [${e.title}](cases/${e.id}/case.md)`);
 await writeFile(join(root,'RECOMMENDED.md'),'# 正式推荐\n\n'+(links.join('\n')||'当前没有通过本版连续效果认可的物件案例。请沿原视觉方法和其他有效参考制作；开发预览不能作为已验证示范。')+'\n');
 await writeFile(join(root,'DEVELOPMENT.md'),'# 开发记录：不得作为生产默认示范\n\n'+entries.map(e=>`- [${e.title}](cases/${e.id}/case.md)：${e.status==='todo'?'待制作':e.status==='rework'?'待返修':'须核对当前版本认可'}。`).join('\n')+'\n');
 await writeFile(join(root,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>物件案例返修预览</title><style>body{margin:40px auto;max-width:1200px;padding:0 24px;background:#f3efe5;color:#18302c;font:16px/1.7 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px}article{background:#fff;padding:20px;border-radius:10px}video{width:100%}.status{color:#9a4328}a{color:#176b76}</style><h1>物件案例 · 返修预览</h1><p>正式可推荐：${eligible.length} 个。下面是开发候选，可查看变化，不代表已通过效果认可。</p><p><a href="RECOMMENDED.md">正式推荐</a> · <a href="REFERENCE.md">使用边界</a></p><main>${cards.join('')}</main></html>\n`);
}
