import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {recommendable} from '../scripts/object-drawing-catalog.js';
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
  assert.ok((await compileMotion(work)).length>0);
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
  for(const required of ['source.tsx','demo-props.json','preview.mp4',...entry.keyframes.map(f=>`keyframes/frame-${String(f).padStart(5,'0')}.png`)]) {
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
 const plain=await renderManagedMotion(work,join(output,'plain'),{},undefined,undefined,[],undefined,{startFrame:71,endFrame:72});
 const nestedSource=source.replace("{useCurrentFrame,useVideoConfig}","{useCurrentFrame,useVideoConfig,Sequence}")
  .replace('export default function Motion','function ObjectCase')+
  '\nexport default function Nested(props:{instanceId?:string;background?:string}) {return <Sequence from={24}><ObjectCase {...props} startFrame={0}/></Sequence>;}';
 const nested=await renderManagedMotion({...work,source:nestedSource,durationInFrames:264,props:{...work.props,startFrame:24}},join(output,'nested'),{},undefined,undefined,[],undefined,{startFrame:95,endFrame:96});
 assert.deepEqual(nested.frameHashes,plain.frameHashes,'不能在子组件重复减外层起点');
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
