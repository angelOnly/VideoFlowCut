import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {searchCases} from '../search.mjs';
const root=new URL('../',import.meta.url);
const catalogue=JSON.parse(readFileSync(new URL('case-catalogue.json',root),'utf8'));
const cases=catalogue.cases;

test('120条索引覆盖来源清单，路径可搬迁且核心文本齐全',()=>{
  assert.equal(cases.length,120);assert.equal(new Set(cases.map(c=>c.slug)).size,120);
  for(const c of cases){
    for(const key of ['detail','analysis','brief','observation']){
      assert.ok(!c[key].includes(':')&&!c[key].startsWith('/'));assert.ok(existsSync(new URL(c[key],root)),`${c.case_number} ${key}`);
    }
    const observation=JSON.parse(readFileSync(new URL(c.observation,root),'utf8'));
    assert.equal(c.source_sha256,observation.source_sha256);
    for(const segment of c.recommended_segments)assert.ok(segment.start>=0&&segment.end>segment.start&&segment.end<=c.duration);
  }
});
test('素材和任务查询返回已核对的代表例，编号精确定位',()=>{
  assert.ok(searchCases(cases,{query:'手机 照片',limit:5}).some(c=>c.case_number===43));
  assert.ok(searchCases(cases,{query:'新闻 对照',limit:5}).some(c=>c.case_number===51));
  assert.ok(searchCases(cases,{query:'跨尺度'}).some(c=>c.case_number===71));
  assert.deepEqual(searchCases(cases,{query:'071'}).map(c=>c.case_number),[71]);
});
test('新闻用途不冒充人物实拍，多维筛选取交集',()=>{
  const found=searchCases(cases,{filters:{video_types:'新闻解读',materials:'人物视频'}});
  assert.ok(found.length>0);assert.ok(!found.some(c=>c.case_number===51));
  assert.ok(found.every(c=>c.video_types.includes('新闻解读')&&c.materials.includes('人物视频')));
  assert.equal(searchCases(cases,{query:'新闻 实拍'}).length,0);
});
test('方法与美术可局部搜索，无匹配不偷偷放宽条件',()=>{
  assert.ok(searchCases(cases,{filters:{methods:'遮挡'}}).length>0);
  assert.ok(searchCases(cases,{filters:{art:'纸'}}).length>0);
  assert.deepEqual(searchCases(cases,{query:'绝不存在的观看任务'}),[]);
  assert.deepEqual(searchCases(cases,{filters:{materials:'未确认的新闻现场'}}),[]);
});
test('Skill路由引用共用索引，保留历史案例入口及验证边界',()=>{
  const skill=readFileSync(new URL('../../../.agents/skills/motion-case-library/SKILL.md',root),'utf8');
  for(const text of ['case-catalogue.json','search.mjs','skillry-retrieval.md','motion-case-sim-paper','原片实见','后写输入未制作验证'])assert.ok(skill.includes(text),text);
  assert.ok(skill.includes('当前项目根目录'));
  assert.ok(!skill.includes('](../../../references/'),'发行副本不能按安装目录定位项目资料');
});
