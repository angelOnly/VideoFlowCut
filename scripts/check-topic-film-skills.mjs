/** Read-only checks: references, teaching/observed separation and topic-only entry.
 * Does not run a model, invoke MCP, grade beauty or certify a completed film.
 */
import {readFile, access, readdir} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rootFlag=process.argv.indexOf('--skills-root');
const root=rootFlag>=0?resolve(process.argv[rootFlag+1]):join(repoRoot,'.agents','skills');
const cases=['motion-case-mixed-scene-relay','motion-case-active-window-focus','motion-case-occlusion-condition-reveal','motion-case-context-detail-observation','motion-case-relation-unfold','motion-case-object-type-relay'];
const failures=[]; let checks=0;
function check(value,message){checks++;if(!value)failures.push(message);}
async function exists(p){try{await access(p);return true;}catch{return false;}}
const text=async p=>readFile(join(root,p),'utf8');
async function checkLinks(rel){
 const body=(await text(rel)).replace(/```[\s\S]*?```/g,'');
 for(const m of body.matchAll(/\]\(([^)]+)\)/g)){
  const target=m[1].split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;
  check(await exists(resolve(root,dirname(rel),decodeURIComponent(target))),`Broken link in ${rel}: ${target}`);
 }
}
const roleSkills=['production-coordinator','production-director','narration-writing','visual-explainer-director','visual-treatment-planning','scene-planning','visual-asset-sourcing','remotion-production','effect-timing','evidence-visualization','captions','voice-production','sound-asset-sourcing','audio-finishing','quality-verification','motion-case-library'];
for(const role of roleSkills){
 const file=role+'/SKILL.md';
 if(!await exists(join(root,file))){check(false,'Missing role: '+file);continue;}
 const body=await text(file);check(body.includes(`topic-film-v2-${role}:begin`),'Missing role integration: '+role);
 const region=body.split(`<!-- topic-film-v2-${role}:begin -->`)[1]?.split(`<!-- topic-film-v2-${role}:end -->`)[0]||'';
 check(!/19\.46|467\s*帧|768\s*[×x*]\s*1344/.test(region),'Test constants in active role block: '+role);
}
for(const rel of ['_shared/TOPIC_TO_FILM.md','_shared/SCENE_DESIGN_HANDOFF.md','remotion-production/references/scene-art-and-motion.md','effect-timing/references/pacing-by-completion.md','motion-case-library/references/r92-family-index.md']){
 check(await exists(join(root,rel)),'Missing shared reference: '+rel);
 if(await exists(join(root,rel))) await checkLinks(rel);
}
const topic=await text('_shared/TOPIC_TO_FILM.md');
check(topic.includes('用户只给一个视频主题'),'Topic-only entry is missing');
check(topic.includes('配音')&&topic.includes('正文')&&topic.includes('素材'),'Full production responsibilities incomplete');
const seen=new Set();
for(const id of cases){
 const md=await text(id+'/SKILL.md');const name=md.match(/^name:\s*(.+)$/m)?.[1].trim();
 check(name===id&&!seen.has(name),'Missing/duplicate skill name '+id);seen.add(name);
 check(/^description:\s*\S/m.test(md),'Missing description '+id);
 await checkLinks(id+'/SKILL.md');
 const config=await text(id+'/agents/openai.yaml');check(config.includes('allow_implicit_invocation: false'),'Case should be reference-only: '+id);
 const rec=JSON.parse(await text(id+'/case-record.json'));
 check(rec.teachingPrompt.isOriginalInputForObservedMedia===false,'Observed/new prompt conflated '+id);
 check(rec.teachingPrompt.status==='written_not_rendered','Unexpected baseline prompt validation status '+id);
 check(rec.validation.continuousMotionVerified===false,'Unverified continuous approval '+id);
 for(const item of [rec.media,rec.teachingPrompt]){
  const bytes=await readFile(join(root,id,item.path));
  check(createHash('sha256').update(bytes).digest('hex')===item.sha256,'Case file hash mismatch '+id+'/'+item.path);
 }
 check(rec.reproduction.newProjectRequiresNewBindings===true,'Missing binding warning '+id);
}
const library=await text('motion-case-library/SKILL.md');
check(library.includes('references/r92-family-index.md'),'Missing new index route');
check(!library.includes('本库只推荐用户于 2026-09-08 最终选定的以下六项'),'Closed six-only restriction remains');
for(const old of ['sim-paper','smooth-relay','ticket-phone','product-fan','cover-flow','comment-focus'])check(await exists(join(root,'motion-case-'+old,'SKILL.md')),'Historical case missing '+old);
// 素材分支沿原角色和案例入口读取；检查实际文件，不能只验证候选包里的正文。
const materialRoles=[...roleSkills.filter(role=>!['captions','voice-production','sound-asset-sourcing','audio-finishing'].includes(role)), 'vlog-director','cutaway-planning','depth-composition'];
for(const role of materialRoles){
 const rel=role+'/SKILL.md';
 const body=await text(rel);
 check(body.includes('material-scene-v3'),`缺少素材工作流接入：${role}`);
 await checkLinks(rel);
}
for(const rel of ['_shared/MATERIAL_TO_SCENE.md','_shared/SOURCE_REVIEW_METHOD.md','remotion-production/references/material-space-and-time.md','quality-verification/references/material-integration-review.md']){
 check(await exists(join(root,rel)),`缺少素材参考：${rel}`);
 if(await exists(join(root,rel)))await checkLinks(rel);
}
// 案例只保留实际作品；未生成的材料实验不再随教学发布。
for(const id of cases){
 for(const rel of ['material-branch-record.json','references/material-integration-prompt-v1.md']){
  check(!await exists(join(root,id,rel)),`未生成实验仍在案例目录：${id}/${rel}`);
 }
}
// 新方法沿原作者调用；案例原件、教学解释与新主题验证不得互相冒充。
const briefSkill='motion-brief-writing';
const attentionCase='motion-case-attention-programme';
for(const id of [briefSkill,attentionCase]){
 const body=await text(id+'/SKILL.md');
 check(body.match(/^name:\s*(.+)$/m)?.[1].trim()===id,`新增Skill身份错误：${id}`);
 check(/^description:\s*\S/m.test(body),`新增Skill缺少说明：${id}`);
 check((await text(id+'/agents/openai.yaml')).includes('allow_implicit_invocation: false'),`新增方法必须按阶段读取：${id}`);
}
async function checkDirectoryLinks(rel){
 for(const item of await readdir(join(root,rel),{withFileTypes:true})){
  const path=rel+'/'+item.name;
  if(item.isDirectory())await checkDirectoryLinks(path);
  else if(item.name.endsWith('.md'))await checkLinks(path);
 }
}
await checkDirectoryLinks(briefSkill);
await checkDirectoryLinks(attentionCase);
for(const rel of ['_shared/TOPIC_TO_FILM.md','_shared/SCENE_DESIGN_HANDOFF.md','remotion-production/SKILL.md']){
 check((await text(rel)).includes('motion-brief-writing/SKILL.md'),`演出方法未接入：${rel}`);
}
check(library.includes('motion-case-attention-programme/SKILL.md'),'案例库没有新案例入口');
const motion=await text('remotion-production/SKILL.md');
check(!motion.includes('材料不齐可以先设计美术、状态和动作'),'未看实际材料先定案的旧许可仍在');
check(!motion.includes('必须完整读取其 references/generation-prompt-v1.md'),'仍假定每个案例使用相同指令文件名');
const attention=JSON.parse(await text(attentionCase+'/case-record.json'));
check(attention.status.newTopicTransfer==='not_tested','历史片认可不得继承为新主题通过');



check(attention.missingDependencies.length>0&&attention.status.standaloneRerender==='not_available_from_this_package_alone','须保留独立重渲染缺口');

// 固定历史身份，避免连同来源账本一起重写后把新内容误认作旧案例。
const historicalIdentity={
 'assets/preview.mp4':'2e739a14560cf193d91cf9a02527210a10092f6e74c63c11306b9ada7db1ca72',
 'references/original-input.md':'8b004163c39a5f14676c7d26301d65058b7e73ebbd3c48d4e840134ec8e18965',
 'source/source.json':'45e9531c22df8fc3bb9f4607115621bd3a50f8f264e2257a1366ffeb7960de6d'
};
for(const [path,hash] of Object.entries(historicalIdentity)){
 check(createHash('sha256').update(await readFile(join(root,attentionCase,path))).digest('hex')===hash,`历史原件身份改变：${path}`);
}
for(const item of [attention.finalVideo,attention.finalSource,attention.originalInput]){
 check(historicalIdentity[item.path]===item.sha256,`案例入口与原件不一致：${item.path}`);
}
// 沿角色的真实引用图核验共同参考送达路径，不能用一句“已阅读”替代入口。
const sharedReferenceRoles=[...roleSkills,'presenter-motion-director','vlog-director','cutaway-planning','depth-composition','motion-brief-writing'];
async function reachable(entry){
 const visited=new Set();const pending=[resolve(root,entry)];
 while(pending.length){
  const path=pending.pop();if(visited.has(path))continue;visited.add(path);
  const body=(await readFile(path,'utf8')).replace(/```[\s\S]*?```/g,'');
  for(const match of body.matchAll(/\]\(([^)]+\.md)(?:#[^)]*)?\)/g)){
   if(/^[a-z]+:/i.test(match[1]))continue;
   const target=resolve(dirname(path),decodeURIComponent(match[1]));
   if(await exists(target))pending.push(target);
   else check(false,`引用缺失：${path} → ${match[1]}`);
  }
 }
 return visited;
}
for(const role of sharedReferenceRoles){
 const references=await reachable(role+'/SKILL.md');
 // 沿真实链接验证语义参考与完整演出能送达原作者，不把可达误报为已阅读或已采用。
 for(const target of ['motion-case-attention-programme/SKILL.md','motion-case-attention-programme/references/original-input.md','_shared/PROJECT_REVISION_AND_HANDOFF.md','motion-case-library/references/skillry-retrieval.md','motion-brief-writing/references/execution-brief-template.md']){
  check(references.has(resolve(root,target)),`角色无法取得共同参考或交接合同：${role} → ${target}`);
 }
}
// 唯一源及发行镜像逐字节比较；生成的 _shared 适配入口由 plugin:verify 单独核验。
const mirror=join(repoRoot,'plugins','videoflowcut','skills');
async function checkMirror(directory=''){
 for(const item of await readdir(join(root,directory),{withFileTypes:true})){
  const path=join(directory,item.name);
  if(item.isDirectory()){await checkMirror(path);continue;}
  const released=join(mirror,path);
  check(await exists(released),`发行镜像缺失：${path}`);
  if(await exists(released))check((await readFile(join(root,path))).equals(await readFile(released)),`发行镜像漂移：${path}`);
 }
}
await checkMirror();
const savedSource=JSON.parse(await text(attentionCase+'/source/source.json'));
check((await text(attentionCase+'/source/Motion.tsx'))===savedSource.source,'提取源码与固定输入不一致');
// 去掉派生副本后，仍核验实际绑定、素材和原始输入的对应关系。
const materials=JSON.parse(await text(attentionCase+'/source/materials.json'));
for(const item of materials.items){
 const binding=savedSource.imageBindings?.[item.slot]??savedSource.videoBindings?.[item.slot];
 check((typeof binding==='string'?binding:binding?.assetId)===item.assetId,`素材槽位与固定输入不一致：${item.slot}`);
 if(item.included){
  check(createHash('sha256').update(await readFile(join(root,attentionCase,item.casePath))).digest('hex')===item.hash,`素材原件改变：${item.casePath}`);
 }
}
const fonts=JSON.parse(await text(attentionCase+'/source/font-bindings.json'));
check(JSON.stringify(fonts.fontBindings)===JSON.stringify(savedSource.fontBindings),'字体槽位与固定输入不一致');
for(const font of fonts.boundFonts)check(savedSource.fontBindings[font.slot]===font.fontId,`字体身份不一致：${font.slot}`);
for(const frame of JSON.parse(await text(attentionCase+'/source/keyframes.json')))check(await exists(join(root,attentionCase,frame.file)),`关键帧缺失：${frame.file}`);
for(const id of [...cases,'motion-case-library'])await checkDirectoryLinks(id);
console.log(JSON.stringify({kind:'static_case_and_skill_contract',skillsRoot:root,checks,passed:checks-failures.length,failures,doesNotProve:'Model behavior, beauty, playback or complete runtime integration'},null,2));
process.exitCode=failures.length?1:0;
