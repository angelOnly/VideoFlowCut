import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {searchCases} from '../references/motion-cases/skillry/search.mjs';
const root=new URL('../references/motion-cases/skillry/',import.meta.url);
const catalogue=JSON.parse(readFileSync(new URL('case-catalogue.json',root),'utf8'));
const cases=catalogue.cases;
test('正式库恰有120个案例，每例只有视频和合并拆解',()=>{
  assert.equal(cases.length,120);assert.equal(new Set(cases.map(c=>c.slug)).size,120);
  assert.equal(readdirSync(new URL('cases/',root)).length,120);
  for(const c of cases){
    assert.deepEqual(readdirSync(new URL(c.directory+'/',root)).sort(),['analysis.md','video.mp4']);
    for(const k of ['media','analysis']){assert.ok(!c[k].includes(':')&&!c[k].startsWith('/'));assert.ok(existsSync(new URL(c[k],root)));}
    assert.equal(new URL(c.detail,'http://localhost/').pathname,'/detail.html');
    for(const s of c.recommended_segments)assert.ok(s.start>=0&&s.end>s.start&&s.end<=c.duration);
    const text=readFileSync(new URL(c.analysis,root),'utf8');
    for(const section of ['适用场景','动效与美术拆解','实现建议','作者公开输入与来源','观看与文件说明'])assert.ok(text.includes(section),`${c.case_number} ${section}`);
    for(const link of text.matchAll(/\]\(([^)]+)\)/g))assert.match(link[1],/^https?:\/\//,'拆解不依赖已归档文件');
  }
});
test('120个实际交付视频哈希正确，第001条明确转码身份',()=>{
  for(const c of cases){const data=readFileSync(new URL(c.media,root));assert.equal(data.length,c.media_bytes);assert.equal(createHash('sha256').update(data).digest('hex'),c.media_sha256);if(c.case_number!==1)assert.equal(c.media_sha256,c.source_sha256);}
  assert.match(cases[0].media_note,/转换/);assert.notEqual(cases[0].media_sha256,cases[0].source_sha256);
});
test('材料与用途检索保留代表例，并且无结果不擅自放宽',()=>{
  assert.ok(searchCases(cases,{query:'手机 照片',limit:5}).some(c=>c.case_number===43));
  assert.ok(searchCases(cases,{query:'新闻 对照',limit:5}).some(c=>c.case_number===51));
  assert.ok(searchCases(cases,{query:'跨尺度'}).some(c=>c.case_number===71));
  assert.deepEqual(searchCases(cases,{query:'071'}).map(c=>c.case_number),[71]);
  const found=searchCases(cases,{filters:{video_types:'新闻解读',materials:'人物视频'}});
  assert.ok(found.length>0&&!found.some(c=>c.case_number===51));
  assert.deepEqual(searchCases(cases,{query:'绝不存在的观看任务'}),[]);
});
test('共用入口有效，Skill使用合并拆解且不再依赖研究日志',()=>{
  for(const f of ['index.html','detail.html','detail.mjs','catalogue-ui.mjs','catalogue.css','search.mjs','README.md','tools/preview_server.py','tools/search-cases.mjs'])assert.ok(existsSync(new URL(f,root)));
  const skill=readFileSync(new URL('../.agents/skills/motion-case-library/SKILL.md',import.meta.url),'utf8');
  const guide=readFileSync(new URL('../.agents/skills/motion-case-library/references/skillry-retrieval.md',import.meta.url),'utf8');
  assert.ok(skill.includes('README.md')&&skill.includes('case-catalogue.json'));
  assert.ok(!guide.includes('sources/published-prompt.md')&&!guide.includes('不随Git传递'));
  const names=readdirSync(root);for(const forbidden of ['staging','sources','screenshots','related-sources','code-view','catalogue-parts','manifest.json'])assert.ok(!names.includes(forbidden));
  assert.ok(!names.some(n=>/\.(zip|png|jpg)$/.test(n)));
});
