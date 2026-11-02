---
name: production-coordinator
description: 作为 VideoFlowCut 主任务的协调入口，真实分派导演、创意专项与审片子代理，排序项目写入并回传版本和预览；完整视频、局部创意和明确参数的机械修改均从这里确定执行边界。
---

# 视频生产协调

先用 [项目基础](../project-basics/SKILL.md) 定位当前 Project、Revision、目标对象与未结束 Job；尚无项目就如实交接，不编造标识。主任务负责沟通、事实、真实分派、确定性提交、技术核对与交付。

## 按任务继续

完整视频分派导演前，必须先读取 [视频类型路由](references/video-type-routing.md)，综合本次用户要求、完整稿及需求补充、当前项目和明确有效的已有采用决定；关键类型、说话人、原声或改稿权限仍不明时，由主任务向用户询问最小必要问题，未确认前不创建依赖该选择的正式生产任务。类型明确后才分派主导演，并在每次 `spawn_agent`、`followup_task`、接替和结果续接中传递主类型、人物／声音来源、编辑权限、当前范围及真实 Revision。下游不得自行改片型。

完整视频用宿主 `spawn_agent` 启动持续负责的导演，让其读取 [production-director](../production-director/SKILL.md) 并沿已采用类型进入相应主视频流程。局部创意直接交相应专项，完整参数的机械修改可直接执行。准备派发、续接或接替时读取 [任务路由](references/task-routing.md)，按依赖和当前名额安排；Skill 数量不等于代理数量。

`visual_explainer` 与 `presenter_motion` 的完整解释沿[主题入口](../_shared/TOPIC_TO_FILM.md)并行共创；完整新制或主要视觉重做接入[创意统筹](../creative-sequence-design/SKILL.md)和[视觉入口](../visual-treatment-planning/SKILL.md)。职责、同一当前稿、范围接回和返修沿[唯一交接约定](../_shared/PROJECT_REVISION_AND_HANDOFF.md)，不为每项规则再创建代理。

实际写入、生成、渲染、审计、字体选择或恢复时读取 [项目写入](references/project-writes.md) 对应章节，核对实时 Schema，按唯一顺序提交并读回版本、影响与结果。主任务只补真实 ID 和无歧义参数，不补创意。结果未知先对账原 Job，不能换幂等键重放。

## 交回结果

返回当前稿、实际对象与版本、已完成范围、确定缺失、观察未知、原作者续接结果及真实可用文件。技术条件允许时可继续生成预览或导出；已确定的设计缺失、实现遗漏和必需表现未兑现仍由主任务续接原负责人处理，不能以“已导出”结束制作。感知能力不足只保留对应观察未知，其他已授权工作继续，不伪造通过，也不无限盲改。技术输出、创作完成与用户认可分别报告。角色接替、版本和事实传递遵循[唯一交接约定](../_shared/PROJECT_REVISION_AND_HANDOFF.md)。

`presenter_motion` 完整解释首轮同步落实人物导演、材料探索与整场视觉责任；人物源返回后继续接回材料、作品、绑定及合成。`vlog` 由事件导演按真实原片决定是否补材和增加视觉工作，不强制主题研究或改写旁白。收口明确 `completion_scope`：整片用 project，内容范围用 beats / beat_ids，对象修改用 objects / object_ids；按结构缺项续接原作者，观察未知另记。

当前范围采用 OpenDesign 时，由原视觉作者沿[场景简报](../opendesign-shot-brief/SKILL.md)与[生产入口](../opendesign-video-production/SKILL.md)继续同一作品，正式任务按共同约定接回。
