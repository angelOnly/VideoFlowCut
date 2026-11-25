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
  assert.match(topic, /用户指定的素材、演法和任务范围随稿保留/);
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

test("创意从实料和原片获得观看关系，视觉按同一本片稿交 OD", () => {
  const director = read(".agents/skills/production-director/SKILL.md");
  const creative = read(".agents/skills/creative-sequence-design/SKILL.md");
  const visual = read(".agents/skills/visual-treatment-planning/SKILL.md");
  const brief = read(".agents/skills/opendesign-shot-brief/SKILL.md");
  const production = read(".agents/skills/opendesign-video-production/SKILL.md");
  const library = read(".agents/skills/creative-case-library/SKILL.md");
  assert.match(library, /整片视觉研究先于逐场查询[\s\S]*根据当前内容和材料写查询[\s\S]*read_creative_case[\s\S]*原速连续看原片/u);
  assert.match(creative, /creative-case-library\/SKILL\.md#根据当前内容和材料写查询/u);
  assert.match(creative, /先读取完整文案、主导演视觉基准和全片真实素材[\s\S]*选择能够承担完整视觉过程的参考[\s\S]*创意原稿交付/u);
  assert.doesNotMatch(creative + library, /完整照排指令|原样取出.*各拍/u);
  assert.match(director, /准确文案及当前锁定状态、整片主线与场面作用[\s\S]*同版时间计划[\s\S]*真实旁白/u);
  assert.match(visual, /整片。[\s\S]*场间。[\s\S]*场内。[\s\S]*同一范围的导演稿和时间计划/u);
  assert.match(visual, /explanation-design\.md#素材主导与图形规则/u);
  assert.match(visual, /「示例」「说明」「来源」「示意」等字样禁止出现在任何画面中/u);
  assert.match(visual, /换词后作用相同的标签/u);
  assert.match(visual, /检查实际使用的全部源段[\s\S]*裁切或遮挡/u);
  assert.match(brief, /首个可播放的动态作品/u);
  assert.match(production, /冻结导演稿、时间计划、采用参考和本片实际素材/u);
  assert.match(production, /opendesign_request\.continue_from_run_id/u);
});

test("完整原段的证据、实料试摆和出首版分别由原作者承接", () => {
  const creative = read(".agents/skills/creative-sequence-design/SKILL.md");
  const transfer = read(".agents/skills/creative-reference-to-sequence/references/full-reference-transfer.md");
  const visual = read(".agents/skills/visual-treatment-planning/SKILL.md");
  const production = read(".agents/skills/opendesign-video-production/SKILL.md");
  const versions = read(".agents/skills/_shared/PROJECT_REVISION_AND_HANDOFF.md");
  assert.match(creative, /full-reference-transfer\.md[\s\S]*创意原稿交付/u);
  assert.match(transfer, /原速看完采用段[\s\S]*干净原帧[\s\S]*按本片动作和旁白[\s\S]*同状态与连续过程双重对照/u);
  assert.match(visual, /首轮即打开本片已有实料[\s\S]*同版原稿[\s\S]*试最难的一次共存、接管或跨场接续/u);
  assert.match(production, /OD 是第一版可播放画面的制作作者/u);
  assert.match(versions, /第一次登记时记录真实 Work、Run、冻结版和根时钟/u);
});

test("独立派工、同稿回读和按任务逐步加载的教学入口均可达", () => {
  const routing = read(".agents/skills/production-coordinator/references/task-routing.md");
  const writes = read(".agents/skills/production-coordinator/references/project-writes.md");
  const visual = read(".agents/skills/visual-treatment-planning/SKILL.md");
  const creative = read(".agents/skills/creative-sequence-design/SKILL.md");
  const art = read(".agents/skills/visual-treatment-planning/references/art-direction.md");
  assert.match(routing, /文案作者：[^\n]*narration-writing/u);
  assert.match(routing, /素材作者：visual-asset-sourcing/u);
  assert.match(routing, /整片视觉导演基准原样发给创意与视觉作者[\s\S]*给创意作者[\s\S]*给视觉作者/u);
  assert.match(routing, /冻结的完整迁移稿[\s\S]*交给同一位视觉作者/u);
  assert.match(writes, /submit_draft[\s\S]*mode、body 和 assets[\s\S]*accept_draft[\s\S]*unitHandoffs[\s\S]*visualPlan\.units/u);
  assert.match(creative, /创意研究必读案例[\s\S]*首次研究的原速对照/u);
  assert.match(visual, /视觉创意研究必读案例[\s\S]*首次研究的原速对照[\s\S]*动效编排必读案例[\s\S]*首次编排的原速练习/u);
  assert.match(art, /用真实素材组织完整段落的案例[\s\S]*0\.1\.92[\s\S]*AiBrakes\.tsx/u);
});
