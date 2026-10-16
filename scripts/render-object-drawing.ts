/** 开发案例只走现有受管编译和渲染器；不连接生产项目或队列。 */
import {readFile,writeFile,mkdir,mkdtemp,copyFile,cp,rename,rm} from 'node:fs/promises';
import {digest,buildObjectCatalog,type CaseEntry} from './object-drawing-catalog.js';
import {join,resolve} from 'node:path';
import {motionSubmissionSchema} from '../packages/motion-work/src/schema.js';
import {renderManagedMotion,motionFrameName} from '../apps/render-worker/src/motion-renderer.js';

const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing');
const index=JSON.parse(await readFile(join(root,'cases.json'),'utf8')) as CaseEntry[];
const requested=process.argv.slice(2);
if(requested.some(id=>!index.some(entry=>entry.id===id))) throw new Error('未知案例目录');

for(const entry of index.filter(entry=>!requested.length||requested.includes(entry.id))) {
  const directory=join(root,'cases',entry.id);
  const source=await readFile(join(directory,'source.tsx'),'utf8');
  const parameters=await readFile(join(directory,'demo-props.json'),'utf8');
  const work=motionSubmissionSchema.parse({...JSON.parse(parameters),source});
  // 同版输入固定到哈希目录，失败保留现场；只有成功渲染才刷新发行预览。
  const inputHash=digest(source+'\n'+parameters);
  const inputDirectory=resolve('.repair-validation/object-drawing',entry.id,inputHash);
  await mkdir(inputDirectory,{recursive:true});
  const output=await mkdtemp(join(inputDirectory,'run-'));
  await writeFile(join(output,'submission.json'),JSON.stringify(work,null,2));
  const result=await renderManagedMotion(work,output);
  const stage=await mkdtemp(join(root,'cases',`.${entry.id}-stage-`));
  await cp(directory,stage,{recursive:true});
  await rm(join(stage,'keyframes'),{recursive:true,force:true});
  await mkdir(join(stage,'keyframes'),{recursive:true});
  await copyFile(result.previewPath,join(stage,'preview.mp4'));
  const files:Record<string,string>={
    'source.tsx':digest(source),'demo-props.json':digest(parameters),
    'preview.mp4':digest(await readFile(result.previewPath))
  };
  for(const frame of entry.keyframes) {
    const name=motionFrameName(frame),destination=join(stage,'keyframes',name);
    await copyFile(join(output,'frames',name),destination);
    files[`keyframes/${name}`]=digest(await readFile(destination));
  }
  await writeFile(join(stage,'verification.json'),JSON.stringify({
    inputHash,engineVersion:result.engineVersion,sandbox:result.sandbox,
    width:work.width,height:work.height,fps:work.fps,durationInFrames:work.durationInFrames,
    resources:[],events:result.events,determinism:result.determinism,
    files,rendered:true,review:'已完成受管渲染、帧数与跳帧一致性技术检查；视觉观察另见 reviews.json，不由哈希推导审美结论。'
  },null,2)+'\n');
  // 核对齐套产物，再整目录切换；旧观察按旧哈希保留，不自动认可艺术效果。
  for(const [file,hash] of Object.entries(files)) {
    if(digest(await readFile(join(stage,file)))!==hash) throw new Error(`案例待发布产物不完整：${file}`);
  }
  if(await readFile(join(directory,'source.tsx'),'utf8')!==source || await readFile(join(directory,'demo-props.json'),'utf8')!==parameters) throw new Error('渲染期间输入已修改，请保留现场并重新渲染');
  const backup=join(output,'previous-case');
  await rename(directory,backup);
  try {await rename(stage,directory);} catch(error) {await rename(backup,directory);throw error;}
  await buildObjectCatalog(root);
  console.log(`${entry.id}：${result.frameHashes.length} 帧，${inputHash}`);
}
