import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const read = (path: string) => readFileSync(resolve(path), "utf8").replace(/\r\n/g, "\n");
const roles = ["motion-case-library/references/cases/motion-case-attention-programme/CASE.md", "motion-case-library/references/cases/motion-case-attention-programme/references/transfer-guide.md", "production-director/references/asset-briefing.md", "narration-writing/SKILL.md", "visual-treatment-planning/references/art-direction.md", "motion-brief-writing/references/performance-design.md", "visual-asset-sourcing/references/source-review.md", "_shared/SCENE_DESIGN_HANDOFF.md", "production-coordinator/references/task-routing.md", "quality-verification/references/professional-review.md"];

test("两类完整解释直达同一主干，人物表达正文仍可读取，旧生命周期冲突已移除", () => {
  const skill = (path: string) => read(`.agents/skills/${path}`);
  for (const entry of ["production-director/SKILL.md", "presenter-motion-director/SKILL.md", "production-coordinator/SKILL.md"]) {
    const links = [...skill(entry).matchAll(/\]\(([^)#]+)/g)].map(match => resolve(".agents/skills", dirname(entry), match[1]!));
    assert.ok(links.includes(resolve(".agents/skills/_shared/TOPIC_TO_FILM.md")), entry);
  }
  const presenter = skill("presenter-motion-director/SKILL.md");
  for (const reference of ["presenter-editing-grammar", "presenter-material-choreography", "presenter-shot-plan", "timeline-operations"]) {
    assert.ok(presenter.includes(`references/${reference}.md`), reference);
  }
  const grammar = skill("presenter-motion-director/references/presenter-editing-grammar.md");
  // 防止合并生命周期时误删仍用于完整制作的六项专业方法。
  for (const heading of ["语义重音排印", "对比式视觉组织", "动机性重构图", "视觉标点", "声画重音协同", "密度对比"]) {
    const section = grammar.split(`## ${heading}`)[1]?.split("\n## ")[0];
    assert.ok(section && section.trim().split("\n\n").length >= 2, heading);
  }
  for (const path of ["production-coordinator/references/task-routing.md", "presenter-motion-director/SKILL.md",
    "presenter-motion-director/references/presenter-editing-grammar.md", "scene-planning/SKILL.md"]) {
    assert.doesNotMatch(skill(path), /仅 `visual_explainer` 按|完整制作以本入口为唯一业务生命周期|但人物通常持续/);
  }
});

test("静态范围合同区分完整新稿、完整锁稿、原片局部和Vlog，不将权限当制作范围", () => {
  const routing = read(".agents/skills/production-coordinator/references/video-type-routing.md");
  const writing = read(".agents/skills/narration-writing/SKILL.md");
  const topic = read(".agents/skills/_shared/TOPIC_TO_FILM.md");
  // 只核对已发布指令及阅读入口；不冒充模型已按这些场景执行创作。
  assert.match(writing, /原创成稿或获准实质改写[\s\S]*writing-methods\.md#人物化讲述[\s\S]*准确新正文/);
  assert.match(topic, /完整解释[\s\S]*正文或正式声音锁定[\s\S]*整场设计与连续制作仍完整执行/);
  assert.match(routing, /只有委托本身是原片清理、选段或局部修改才按局部调用/);
  assert.match(routing, /Vlog 保持事件和原声主线/);
  assert.match(topic, /不强制人物项目建立 NarrativeMap[\s\S]*或 ExplainerProgram[\s\S]*不向纯解说增加人物输入/);
});

test("主题路由把材料探索接入首轮，并保留导演采用与实际媒体观察边界", () => {
  const director = read(".agents/skills/production-director/SKILL.md");
  const coordinator = read(".agents/skills/production-coordinator/SKILL.md");
  const source = read(".agents/skills/visual-asset-sourcing/references/source-review.md");
  const topic = read(".agents/skills/_shared/TOPIC_TO_FILM.md");
  assert.ok(director.includes("../_shared/TOPIC_TO_FILM.md"));
  assert.ok(director.includes("references/asset-briefing.md"));
  assert.ok(coordinator.includes("../_shared/TOPIC_TO_FILM.md"));
  assert.match(coordinator, /spawn_agent/);
  assert.match(coordinator, /followup_task/);
  assert.doesNotMatch(coordinator, /导演提出专项范围后再派发/);
  assert.match(source, /网页线索不冒称已看过视频/);
  assert.match(topic, /只有用户明确改任务/);
  assert.doesNotMatch(director, /直接进入对应 CASE/);
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
  // 检索先按当前缺口分流；验证真实两跳目标，避免强迫入口重复链接全部专业正文。
  const library = motion.find(link => resolve('.agents/skills/motion-brief-writing', link) === resolve('.agents/skills/motion-case-library/SKILL.md'));
  assert.ok(library, '演出入口可进入机制分流');
  const libraryPath = resolve('.agents/skills/motion-brief-writing', library);
  assert.ok(links('motion-case-library/SKILL.md').some(link =>
    resolve(dirname(libraryPath), link) === resolve('.agents/skills/motion-case-library/references/mechanism-retrieval.md')));
  assert.ok(motion.includes('references/performance-design.md'), '演出核心可直接读取');
  assert.ok(motion.includes('../remotion-production/SKILL.md'));
  assert.ok(links('motion-case-library/SKILL.md').includes('references/validated-index.md'),'用户明确请求的历史分支仍保留');
});
