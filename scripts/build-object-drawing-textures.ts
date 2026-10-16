/** 仅构建静态材料；固定摘录在相邻源文件，运行不抓取网络或加载原演出。 */
import {readFile,writeFile,mkdir,mkdtemp,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import puppeteer from 'puppeteer-core';
import {resolveRenderBrowser} from '../packages/remotion-runtime/src/browser.js';
import {digest} from './object-drawing-catalog.js';
const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing');
const source=await readFile(resolve('scripts/object-drawing-texture-source.js'),'utf8');
const browser=await puppeteer.launch({executablePath:await resolveRenderBrowser(),headless:true});
try {
 const page=await browser.newPage();
 await page.setRequestInterception(true);page.on('request',r=>void r.abort());
 const result=await page.evaluate(source) as {paper:string;stone:string;width:number;height:number;regions:unknown;local:unknown};
 const stage=await mkdtemp(join(root,'.textures-stage-'));
 const sourceRecord={commit:'aa620f3b859aa5d191b783b2eb0fb59263731c76',file:'styles/超现实拼贴/示例_Token.html',generatorVersion:1,generatorHash:digest(source),parameters:{paper:{gridSizes:[90,22],fibers:1100},stone:{HB:{x0:96,y0:266,x1:762,y1:904},scale:2.4,softBlotches:140,grains:5200,rimGrains:1200,atlasGap:16}},seeds:{paper:5,stone:31},license:'../LICENSE'};
 const resources=[];
 for(const [id,file,data,width,height] of [ ['paper_base','paper-base.png',result.paper,1920,1080],['stone_head','stone-head-atlas.png',result.stone,result.width,result.height] ] as const){
  const bytes=Buffer.from(data.split(',')[1],'base64');await writeFile(join(stage,file),bytes);
  resources.push({id,path:file,mime:'image/png',width,height,sha256:digest(bytes),...(id==='stone_head'?{regions:result.regions,local:result.local,lighting:'固定原 HEADTEX 朝向；仅平移和等比缩放，不能转头'}:{}),source:sourceRecord});
 }
 await writeFile(join(stage,'manifest.json'),JSON.stringify({version:1,resources},null,2)+'\n');
 const archive=resolve('.repair-validation/object-drawing/textures');await mkdir(archive,{recursive:true});
 const run=await mkdtemp(join(archive,'run-'));let old=false;
 try {await rename(join(root,'textures'),join(run,'previous'));old=true;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 try {await rename(stage,join(root,'textures'));}catch(e){if(old)await rename(join(run,'previous'),join(root,'textures'));throw e;}
 console.log(resources.map(r=>({id:r.id,width:r.width,height:r.height,sha256:r.sha256})));
} finally {await browser.close();}
