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
console.log(JSON.stringify({kind:'static_case_and_skill_contract',skillsRoot:root,checks,passed:checks-failures.length,failures,doesNotProve:'Model behavior, beauty, playback or complete runtime integration'},null,2));
process.exitCode=failures.length?1:0;
