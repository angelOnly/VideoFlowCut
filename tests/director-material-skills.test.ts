import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const read = (path: string) => readFileSync(resolve(path), "utf8").replace(/\r\n/g, "\n");
const roles = ["production-director/SKILL.md", "production-director/references/story-and-shot-design.md", "production-director/references/asset-briefing.md",
  "visual-asset-sourcing/SKILL.md", "visual-asset-sourcing/references/source-review.md", "creative-sequence-design/SKILL.md", "creative-reference-to-sequence/SKILL.md",
  "visual-treatment-planning/SKILL.md", "visual-treatment-planning/references/art-direction.md", "motion-brief-writing/SKILL.md",
  "motion-brief-writing/references/performance-design.md", "motion-brief-writing/references/execution-brief-template.md", "opendesign-shot-brief/SKILL.md",
  "opendesign-shot-brief/references/shot-construction.md", "opendesign-video-production/SKILL.md", "production-coordinator/SKILL.md",
  "production-coordinator/references/task-routing.md", "_shared/TOPIC_TO_FILM.md", "_shared/SCENE_DESIGN_HANDOFF.md", "_shared/PROJECT_REVISION_AND_HANDOFF.md"];

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
  assert.match(writing, /人物解释类内容的文案由你完整创作[\s\S]*尊重用户明确保留的内容[\s\S]*presenter-writing\.md[\s\S]*准确新正文/);
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
  assert.ok(motion.includes('../opendesign-video-production/SKILL.md'));
  assert.ok(links('motion-case-library/SKILL.md').includes('references/validated-index.md'),'用户明确请求的历史分支仍保留');
});

test("素材和参考参与共同编排，完整指令及画面限制交到制作与返修", () => {
  const director=read('.agents/skills/production-director/SKILL.md');
  const creative=read('.agents/skills/creative-sequence-design/SKILL.md');
  const visual=read('.agents/skills/visual-treatment-planning/SKILL.md');
  const brief=read('.agents/skills/opendesign-shot-brief/SKILL.md');
  const production=read('.agents/skills/opendesign-video-production/SKILL.md');
  assert.match(director,/导演在确定主要视觉表现之前，必须结合实际素材/u);
  assert.match(director,/视觉作者从首轮开始查看实际材料/u);
  assert.match(creative,/将参考研究和本片迁移结论交给同一位视觉作者/u);
  assert.match(creative,/阶段性交回必须带真实参考 ID、来源指纹、原片路径、采用范围、实际观看方式/u);
  assert.match(visual,/禁止在视频画面中添加解释素材来源、案例属性、示意身份/u);
  assert.match(visual,/裁切或遮挡[\s\S]*检查处理后的实际画面/u);
  assert.match(brief,/参考研究[\s\S]*制作首版[\s\S]*素材/u);
  assert.match(production,/读取完整简报，打开采用的参考视频[\s\S]*再查看本片对应素材/u);
  assert.match(production,/opendesign_request\.continue_from_run_id/u);
});

test("视觉作者交导演稿，OD 制作首版并沿同一作品返修", () => {
  const visual=read('.agents/skills/visual-treatment-planning/SKILL.md');
  const creative=read('.agents/skills/creative-sequence-design/SKILL.md');
  const production=read('.agents/skills/opendesign-video-production/SKILL.md');
  const handoff=read('.agents/skills/_shared/SCENE_DESIGN_HANDOFF.md');
  const versions=read('.agents/skills/_shared/PROJECT_REVISION_AND_HANDOFF.md');
  assert.match(visual,/真实素材返回[\s\S]*可执行的视觉导演稿[\s\S]*第一版可播放画面由 OD 制作/u);
  assert.match(visual,/首版回来后[\s\S]*视觉返修并复查/u);
  assert.match(creative,/原片区间、观察方式和实际看到的过程[\s\S]*真实素材/u);
  assert.match(handoff,/导演确认后，OD 直接制作第一版画面/u);
  assert.match(production,/OD 是第一版可播放画面的制作作者/u);
  assert.match(versions,/第一次登记时记录真实 Work、Run、冻结版和根时钟/u);
});

test("完整新制的参考、素材和视觉并行续接，并以完整映射交给制作", () => {
  const routing=read('.agents/skills/production-coordinator/references/task-routing.md');
  const transfer=read('.agents/skills/creative-reference-to-sequence/SKILL.md');
  const brief=read('.agents/skills/opendesign-shot-brief/SKILL.md');
  const production=read('.agents/skills/opendesign-video-production/SKILL.md');
  const parallel=routing.split('## 完整新制的并行路由')[1]?.split('## 让材料与预览回到当前完整稿')[0];
  // 检查各作者与并行回溯能力，不把分派列表的书写顺序当成执行先后。
  assert.match(parallel!,/文案作者：[^\n]*narration-writing/);
  assert.match(parallel!,/apply_authored_script[\s\S]*read_script[\s\S]*read_impact_report/);
  assert.match(parallel!,/record_creative_decision[^\n]*assignment_id[^\n]*input_revision[^\n]*evidence/);
  assert.match(parallel!,/创意作者：[^\n]*creative-case-library[^\n]*creative-sequence-design/);
  assert.match(parallel!,/素材作者：visual-asset-sourcing/);
  assert.match(parallel!,/视觉作者：visual-treatment-planning[^\n]*creative-reference-to-sequence[^\n]*motion-case-library/);
  assert.match(parallel!,/素材不足时续接原素材作者；参考不足时续接原创意作者。两个任务可以并行/);
  assert.match(parallel!,/已就绪且不依赖缺口的范围可以继续推进/);
  assert.match(transfer,/创意卡 ID、来源指纹、原片路径和采用范围[\s\S]*本片真实素材 Asset ID[\s\S]*原参考对象与本片视觉角色的映射[\s\S]*本片完整画面构思/);
  assert.match(brief,/创意卡 ID[\s\S]*采用的完整源时间范围[\s\S]*本片真实素材[\s\S]*参考对象与本片角色映射[\s\S]*完整画面发展/);
  assert.match(production,/prepare_motion_handoff[\s\S]*base_revision_id[\s\S]*visualPlan/);
});
