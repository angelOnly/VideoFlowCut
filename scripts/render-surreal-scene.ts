/** 隔离案例验证，复用现有受管渲染器；不连接生产项目或任务队列。 */
import {readFile,writeFile,mkdir,mkdtemp,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {motionSubmissionSchema} from '../packages/motion-work/src/schema.js';
import {renderManagedMotion,motionFrameName} from '../apps/render-worker/src/motion-renderer.js';
import {bindMotionFonts,prepareMotionFonts} from '../packages/motion-work/src/fonts.js';
const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/managed');
const source=await readFile(join(root,'source.tsx'),'utf8'),params=await readFile(join(root,'demo-props.json'),'utf8');
const manifest=JSON.parse(await readFile(join(root,'resources.json'),'utf8')),assets:Record<string,string>={};
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
for(const r of manifest.resources){const bytes=await readFile(join(root,r.path));if(hash(bytes)!==r.sha256)throw new Error('材料哈希不匹配：'+r.path);assets[r.slot]='data:image/png;base64,'+bytes.toString('base64');}
const inputHash=hash(source+params+JSON.stringify(manifest)),work=motionSubmissionSchema.parse({...JSON.parse(params),source});
const base=resolve('.repair-validation/surreal-scene',inputHash);await mkdir(base,{recursive:true});const run=await mkdtemp(join(base,'run-'));
await writeFile(join(run,'submission.json'),JSON.stringify(work,null,2));
await writeFile(join(run,'resources.json'),JSON.stringify(manifest,null,2));
const result=await renderManagedMotion(work,run,assets,undefined,undefined,prepareMotionFonts(work,bindMotionFonts(work)));
if(hash(await readFile(join(root,'source.tsx')))!==hash(source)||await readFile(join(root,'demo-props.json'),'utf8')!==params)throw new Error('渲染期间输入发生变化，保留现场，不发布旧输入预览');
// 对照直接使用已有原生视频截段，不重新运行原动画；合成的两侧共用同一视频时钟。
execFileSync('ffmpeg',['-v','error','-ss','8.1','-i',join(root,'../完整场面_无声.mp4'),'-t','5.9','-map','0:v:0','-an','-c:v','libx264','-crf','18','-movflags','+faststart',join(run,'native-segment.mp4')]);
execFileSync('ffmpeg',['-v','error','-i',join(run,'native-segment.mp4'),'-i',result.previewPath,'-filter_complex','[0:v]scale=960:540[a];[1:v]scale=960:540[b];[a][b]hstack=inputs=2[v]','-map','[v]','-an','-c:v','libx264','-crf','18','-movflags','+faststart',join(run,'comparison.mp4')]);
// 渲染失败不覆盖旧视频；成功输出只代表技术通过。
await copyFile(result.previewPath,join(root,'preview.mp4'));await mkdir(join(root,'keyframes'),{recursive:true});
await copyFile(join(run,'native-segment.mp4'),join(root,'../native-segment.mp4'));
await copyFile(join(run,'comparison.mp4'),join(root,'../comparison.mp4'));
for(const f of [0,15,33,45,60,69,71,75,81,90,102,114,132,156,172,176])await copyFile(join(run,'frames',motionFrameName(f)),join(root,'keyframes',motionFrameName(f)));
await writeFile(join(root,'verification.json'),JSON.stringify({inputHash,previewHash:hash(await readFile(result.previewPath)),sourceHash:hash(source),engine:result.engineVersion,sandbox:result.sandbox,determinism:result.determinism,frames:result.frameHashes.length,sourceRange:[8.1,14],events:result.events,status:'rework',continuousApproval:false},null,2));
console.log(JSON.stringify({run,frames:result.frameHashes.length,preview:join(root,'preview.mp4')}));
