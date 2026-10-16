/** 开发案例只走现有受管编译和渲染器；不连接生产项目或队列。 */
import {readFile,writeFile,mkdir,mkdtemp,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {motionSubmissionSchema} from '../packages/motion-work/src/schema.js';
import {renderManagedMotion,motionFrameName} from '../apps/render-worker/src/motion-renderer.js';

const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing');
const index=JSON.parse(await readFile(join(root,'cases.json'),'utf8')) as {id:string;keyframes:number[]}[];
const requested=process.argv.slice(2);
if(requested.some(id=>!index.some(entry=>entry.id===id))) throw new Error('未知案例目录');
const digest=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
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
  await mkdir(join(directory,'keyframes'),{recursive:true});
  await copyFile(result.previewPath,join(directory,'preview.mp4'));
  const files:Record<string,string>={
    'source.tsx':digest(source),'demo-props.json':digest(parameters),
    'preview.mp4':digest(await readFile(result.previewPath))
  };
  for(const frame of entry.keyframes) {
    const name=motionFrameName(frame),destination=join(directory,'keyframes',name);
    await copyFile(join(output,'frames',name),destination);
    files[`keyframes/${name}`]=digest(await readFile(destination));
  }
  await writeFile(join(directory,'verification.json'),JSON.stringify({
    inputHash,engineVersion:result.engineVersion,sandbox:result.sandbox,
    width:work.width,height:work.height,fps:work.fps,durationInFrames:work.durationInFrames,
    resources:[],events:result.events,determinism:result.determinism,
    files,rendered:true,review:'已完成受管渲染、帧数与跳帧一致性技术检查；视觉观察另见 case.md，不由哈希推导审美结论。'
  },null,2)+'\n');
  console.log(`${entry.id}：${result.frameHashes.length} 帧，${inputHash}`);
}
