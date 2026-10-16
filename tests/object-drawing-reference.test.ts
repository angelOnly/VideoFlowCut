import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,cp,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {PNG} from 'pngjs';
import {pathToFileURL} from 'node:url';
import {recommendable,readCaseInputs,calculateCaseInputHash,buildObjectCatalog} from '../scripts/object-drawing-catalog.js';
import {compileMotion,validateMotionSource} from '../packages/motion-work/src/compiler.js';
import {motionSubmissionSchema} from '../packages/motion-work/src/schema.js';
import {renderManagedMotion} from '../apps/render-worker/src/motion-renderer.js';

const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing');
const digest=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
test('六个物件案例可独立通过当前受管合同与编译，来源和本地索引完整',async()=>{
 const entries=JSON.parse(await readFile(join(root,'cases.json'),'utf8')) as {id:string;origin:string;functions:string[]}[];
 assert.equal(entries.length,6);
 assert.equal(new Set(entries.map(e=>e.id)).size,6);
 const reference=await readFile(join(root,'DEVELOPMENT.md'),'utf8');
 const sources=await readFile(join(root,'SOURCES.md'),'utf8');
 assert.match(await readFile(join(root,'LICENSE'),'utf8'),/Copyright \(c\) 2026 Dashi AI Lab/u);
 for(const entry of entries){
  assert.ok(reference.includes(`cases/${entry.id}/case.md`));
  assert.ok(sources.includes(entry.id));
  assert.ok(['adapted','original'].includes(entry.origin));
  const folder=join(root,'cases',entry.id),source=await readFile(join(folder,'source.tsx'),'utf8');
  const work=motionSubmissionSchema.parse({...JSON.parse(await readFile(join(folder,'demo-props.json'),'utf8')),source});
  validateMotionSource(source);
  assert.ok((await compileMotion(work,(await readCaseInputs(root,entry.id)).imageData)).length>0);
  for(const name of entry.functions) assert.ok(source.includes(name),`${entry.id} 缺少记录的函数 ${name}`);
  const instructions=await readFile(join(folder,'case.md'),'utf8');
  for(const heading of ['用途与来源','物件怎样造出来','动作怎样发生','复现与改写指令','验证与边界']) assert.ok(instructions.includes(heading));
 }
});
test('发行预览与关键帧绑定当前源码和参数，不接受过期验证记录',async()=>{
 const entries=JSON.parse(await readFile(join(root,'cases.json'),'utf8')) as {id:string;keyframes:number[]}[];
 for(const entry of entries){
  const folder=join(root,'cases',entry.id),v=JSON.parse(await readFile(join(folder,'verification.json'),'utf8'));
  assert.equal(v.rendered,true);
  assert.equal(v.inputHash,calculateCaseInputHash(await readCaseInputs(root,entry.id)));
  for(const required of ['source.tsx','demo-props.json','resources.json','preview.mp4',...entry.keyframes.map(f=>`keyframes/frame-${String(f).padStart(5,'0')}.png`)]) {
   assert.equal(digest(await readFile(join(folder,required))),v.files[required],`${entry.id}/${required} 已变化，应重新渲染`);
  }
 }
});

test('实际书页翻转在外层 Sequence 中只偏移一次，保持同一局部帧画面', {timeout:60_000},async()=>{
 const folder=join(root,'cases/book-open');
 const source=await readFile(join(folder,'source.tsx'),'utf8');
 const parameters=JSON.parse(await readFile(join(folder,'demo-props.json'),'utf8'));
 const work=motionSubmissionSchema.parse({...parameters,source});
 const parent=resolve('.repair-validation/object-drawing/time-regression');
 await mkdir(parent,{recursive:true});
 const output=await mkdtemp(join(parent,'run-'));
 const images=(await readCaseInputs(root,'book-open')).imageData;
 const plain=await renderManagedMotion(work,join(output,'plain'),images,undefined,undefined,[],undefined,{startFrame:94,endFrame:97});
 const nestedSource=source.replace("useCurrentFrame,","Sequence,useCurrentFrame,")
  .replace('export default function Motion','function ObjectCase')+
  '\nexport default function Nested(props:{instanceId?:string;background?:string}) {return <Sequence from={24}><ObjectCase {...props} startFrame={0}/></Sequence>;}';
 const nested=await renderManagedMotion({...work,source:nestedSource,durationInFrames:264,props:{...work.props,startFrame:24}},join(output,'nested'),images,undefined,undefined,[],undefined,{startFrame:118,endFrame:121});
 assert.deepEqual(nested.frameHashes,plain.frameHashes,'不能在子组件重复减外层起点');
 assert.equal(plain.determinism?.status,'exact');assert.ok(plain.determinism?.sampledFrames.includes(94));
 assert.deepEqual(nested.events,plain.events!.map(e=>({...e,startFrame:e.startFrame+24})));
});

const loadCase=async(id:string)=>import(pathToFileURL(join(root,'cases',id,'source.tsx')).href);
test('剪刃交点推进到纸张远缘后切口不可恢复，书页保持书脊与身份',async()=>{
 const scissors=await loadCase('scissors-cut');
 assert.equal(scissors.cutGeometry(22).progress,0);
 assert.equal(scissors.cutGeometry(0).progress,1);
 for(const c of scissors.CUTS) assert.equal(scissors.sceneState(c+.03).cutProgress[scissors.CUTS.indexOf(c)],1);
 const book=await loadCase('book-open');
 for(const turn of [0,.2,.5,.8,1]) {
  assert.deepEqual(book.pagePoint(0,40,turn),{x:0,y:40,z:20});
  let length=0;
  for(let i=1;i<=100;i++){const a=book.pagePoint((i-1)*2.1,0,turn),b=book.pagePoint(i*2.1,0,turn);length+=Math.hypot(b.x-a.x,b.z-a.z);}
  assert.ok(Math.abs(length-210)<.1);
 }
 assert.deepEqual(book.sceneState(0).sheets.map((s:any)=>s.id),book.sceneState(4).sheets.map((s:any)=>s.id));
 assert.ok(book.sceneState(4).sheets.every((s:any)=>s.side==='left'));
});
test('推荐必须匹配当前输入、视频及连续认可',()=>{
 const entry:any={status:'recommended'},v={inputHash:'i',files:{'preview.mp4':'p'}};
 const review:any={inputHash:'i',previewHash:'p',method:'continuous_video',verdict:'approved'};
 assert.equal(recommendable(entry,v,[review],'i','p'),true);
 for(const changed of [{method:'frames'},{verdict:'rejected'},{inputHash:'old'},{previewHash:'old'}]) assert.equal(recommendable(entry,v,[{...review,...changed}],'i','p'),false);
 assert.equal(recommendable(entry,v,[review],'new','p'),false);
 assert.equal(recommendable({...entry,status:'rework'},v,[review],'i','p'),false);
});

test('纹理字节、区域与实际引用参与身份；缺失损坏明确失败',async()=>{
 const parent=resolve('.repair-validation/object-drawing/resource-regression');await mkdir(parent,{recursive:true});const local=await mkdtemp(join(parent,'run-'));await cp(root,local,{recursive:true});
 const initial=await readCaseInputs(local,'book-open'),hash=calculateCaseInputHash(initial);
 const manifestPath=join(local,'textures/manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 const stone=join(local,'textures/stone-head-atlas.png'),oldStone=await readFile(stone);await writeFile(stone,Buffer.from('unreferenced change'));
 assert.equal(calculateCaseInputHash(await readCaseInputs(local,'book-open')),hash);
 await assert.rejects(readCaseInputs(local,'cutaway-head'),/纹理哈希不匹配/);await writeFile(stone,oldStone);
 const headHash=calculateCaseInputHash(await readCaseInputs(local,'cutaway-head'));
 manifest.resources[1].regions.front.x-=1;await writeFile(manifestPath,JSON.stringify(manifest));
 await assert.rejects(readCaseInputs(local,'cutaway-head'),/图集参数/);
 const paramsPath=join(local,'cases/cutaway-head/demo-props.json'),params=JSON.parse(await readFile(paramsPath,'utf8'));params.props.stoneAtlas.regions=manifest.resources[1].regions;await writeFile(paramsPath,JSON.stringify(params));
 assert.notEqual(calculateCaseInputHash(await readCaseInputs(local,'cutaway-head')),headHash);
 const paper=join(local,'textures/paper-base.png'),original=await readFile(paper);
 const decoded=PNG.sync.read(original);decoded.data[0]^=1;const validChanged=PNG.sync.write(decoded);manifest.resources[0].sha256=digest(validChanged);await writeFile(manifestPath,JSON.stringify(manifest));await writeFile(paper,validChanged);
 const newHash=calculateCaseInputHash(await readCaseInputs(local,'book-open'));assert.notEqual(newHash,hash);
 const review:any={inputHash:hash,previewHash:'preview',method:'continuous_video',verdict:'approved'};
 assert.equal(recommendable({status:'recommended'} as any,{inputHash:hash,files:{'preview.mp4':'preview'}},[review],newHash,'preview'),false);
 manifest.resources[0].sha256=digest(original);await writeFile(manifestPath,JSON.stringify(manifest));
 const changed=Buffer.from(original);changed[100]^=1;await writeFile(paper,changed);
 await assert.rejects(readCaseInputs(local,'book-open'),/纹理哈希不匹配/);
 manifest.resources[0].sha256=digest(changed);await writeFile(manifestPath,JSON.stringify(manifest));await assert.rejects(readCaseInputs(local,'book-open'),/PNG 无法解码/);
 await unlink(paper);await assert.rejects(readCaseInputs(local,'book-open'),/缺少纹理文件.*paper_base/);
 await buildObjectCatalog(local);assert.match(await readFile(join(local,'index.html'),'utf8'),/资源不可用.*paper_base/);
});
test('书页法线、最近接收面、边缘裁切和抬落投影',async()=>{
 const b=await loadCase('book-open'),receivers=b.receiverSurfaces(2.8);
 assert.deepEqual(b.pageNormal(50,0),{x:-0,y:0,z:1});
 const hit=b.projectShadow({x:100,y:0,z:100},receivers);assert.equal(hit.surface,'right');assert.equal(hit.point.z,20);
 assert.equal(b.projectShadow({x:100,y:0,z:100},receivers,{x:1,y:0,z:0}),undefined);
 assert.equal(b.projectShadow({x:100,y:0,z:100},receivers,{x:0,y:0,z:1}),undefined);
 for(const t of [0.4,94/60,2.6,3.5])for(const r of b.shadowRegions(t))for(const poly of r.polygons)for(const q of poly){assert.ok(b.inside(q,r.receiver.polygon));assert.ok(Math.abs(q.z-r.receiver.origin.z)<1e-5);}
 assert.notDeepEqual(b.shadowRegions(94/60),b.shadowRegions(3.5));
 assert.notEqual(b.shadePaper(105,0),b.shadePaper(105,.5));
});
test('同源图集前侧像素与完整表面一致，多实例混合图层和缺槽真实渲染', {timeout:90_000},async()=>{
 const input=await readCaseInputs(root,'cutaway-head'),atlas=PNG.sync.read(input.bytes.stone_head),meta=input.resources.find(r=>r.slot==='stone_head')!;
 const a=meta.regions!.full,b=meta.regions!.front;let count=0;
 for(let y=0;y<b.height;y+=7)for(let x=0;x<b.width;x+=7){const i=((b.y+y)*atlas.width+b.x+x)*4,j=((a.y+y)*atlas.width+a.x+x)*4;if(atlas.data[i+3]===255){assert.deepEqual(atlas.data.subarray(i,i+4),atlas.data.subarray(j,j+4));count++;}}
 assert.ok(count>1000);
 const work=motionSubmissionSchema.parse({...JSON.parse(input.parameters.toString()),source:input.source.toString()});
 const parent=resolve('.repair-validation/object-drawing/layer-regression');await mkdir(parent,{recursive:true});const output=await mkdtemp(join(parent,'run-'));
 const source=work.source.replace('export default function Motion','function ObjectCase')+`
export default function Pair(props){return <div>{[0,1].map(i=><div key={i} style={{position:'absolute',left:i*480,top:135,width:960,height:540,transform:'scale(.5)',transformOrigin:'0 0'}}><ObjectCase {...props} instanceId={'head-'+i}/></div>)}</div>;}`;
 await renderManagedMotion({...work,source},join(output,'pair'),input.imageData,undefined,undefined,[],undefined,{startFrame:135,endFrame:136});
 const png=PNG.sync.read(await readFile(join(output,'pair/frames/frame-00135.png')));
 // 两个不同位置的半尺寸图会有亚像素采样差；限制整体误差与明显差异占比。
 let error=0,large=0;const samples=480*270*3;
 for(let y=135;y<405;y++)for(let x=0;x<480;x++)for(let c=0;c<3;c++){const d=Math.abs(png.data[(y*960+x)*4+c]-png.data[(y*960+x+480)*4+c]);error+=d;if(d>8)large++;}
 assert.ok(error/samples<.1);assert.ok(large/samples<.003);
 await assert.rejects(renderManagedMotion(work,join(output,'missing'),{paper_base:input.imageData.paper_base},undefined,undefined,[],undefined,{startFrame:0,endFrame:1}),/stone_head/);
});
