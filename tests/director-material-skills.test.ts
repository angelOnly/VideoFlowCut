import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(path), "utf8").replace(/\r\n/g, "\n");
const roles = ["motion-case-library/references/cases/motion-case-attention-programme/CASE.md", "motion-case-library/references/cases/motion-case-attention-programme/references/transfer-guide.md", "production-director/references/asset-briefing.md", "narration-writing/SKILL.md", "visual-treatment-planning/references/art-direction.md", "motion-brief-writing/references/performance-design.md", "visual-asset-sourcing/references/source-review.md", "_shared/SCENE_DESIGN_HANDOFF.md", "production-coordinator/references/task-routing.md", "quality-verification/references/professional-review.md"];

test("指定案例从首次取材进入真实角色交接，材料回来更新全文且获取继续执行", () => {
  const bodies = roles.map(path => read(`.agents/skills/${path}`));
  const [example, guide, director, writer, visual, motion, sourcing, handoff, coordinator, review] = bodies;
  assert.match(example, /首次写声画草稿和取材请求/);
  for (const title of ["读完整意思", "候选里能看见", "用方式倒推", "材料成组", "相近内容", "搜索起点"]) assert.ok(guide.includes(title) && director.includes(title), title);
  assert.match(read(".agents/skills/production-director/SKILL.md"), /直接进入对应 CASE/);
  assert.match(writer, /当前全文及对应句群声画说明/);
  assert.match(visual, /\]\(\.\.\/\.\.\/production-director\/references\/asset-briefing\.md\)/, "取材方法仍沿唯一导演参考");
  assert.match(director, /先与文案、原视觉作者把当前这段需要的画面说清/);
  assert.match(motion, /材料或范围改变时同步更新裁切、字位、路径、遮挡和声音/);
  assert.match(sourcing, /已有有效选段继续承接/);
  assert.match(sourcing, /没有观察时先了解全貌，再看可能采用的连续范围与必要前后文/);
  assert.match(handoff, /材料作者只推荐，最终采用由导演决定/);
  assert.match(coordinator, /导演已明确选择的材料继续取得和使用/);
  assert.match(review, /不借成片返修恢复素材资格审核/);
  assert.doesNotMatch(sourcing, /最高 720p|需求至少包含：|抽象机制通常优先 Remotion|不按拟用范围截取/);
  assert.match(read(".agents/skills/production-coordinator/SKILL.md"), /真实分派/); assert.match(coordinator, /followup_task/);
});

test("根 Skills 与发行副本保持同一份协作正文", () => {
  for (const path of roles) assert.equal(read(`plugins/videoflowcut/skills/${path}`), read(`.agents/skills/${path}`), path);
});

test("默认前期资料不直连历史案例，动画交接仍可到达机制方法与受管实现", () => {
  // 这里只核对资料路由，不把链接可达当成模型已按阶段执行。
  const links=(path:string)=>[...read(`.agents/skills/${path}`).matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(match=>match[1]!);
  for(const path of ["_shared/TOPIC_TO_FILM.md","production-director/references/asset-briefing.md",
    "production-director/references/story-and-shot-design.md","narration-writing/SKILL.md",
    "visual-treatment-planning/SKILL.md","production-coordinator/references/task-routing.md"]){
    assert.ok(!links(path).some(link=>link.includes('/references/cases/')||link.includes('validated-index.md')),path);
  }
  const motion=links('motion-brief-writing/SKILL.md');
  assert.ok(motion.includes('../motion-case-library/references/mechanism-retrieval.md'));
  assert.ok(motion.includes('../remotion-production/SKILL.md'));
  assert.ok(links('motion-case-library/SKILL.md').includes('references/validated-index.md'),'用户明确请求的历史分支仍保留');
});
