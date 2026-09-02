---
name: project-basics
description: 安全定位 VideoFlowCut Project、Revision 和对象，选择正确层级完成读写，并在每次修改后检查 Impact、Graph、真实画面和声音；防止聊天、Web、MCP 与 ProductionRun 形成多份状态。
---

# 项目、Revision 与对象安全

> **V4 单文件原则**：本 Skill 已内置完成该任务所需的核心专业知识、案例、失败模式和验证方法。除项目级 `_shared` 合同与 `docs/asr接入.md` 等真正共享资料外，不依赖同目录 `references/`。


## 为什么这项基础能力会直接影响成片

项目基础看起来像工程问题，但它会直接影响创作质量。Agent 如果拿错 Revision，就可能在用户已经修好的字幕上重新套用旧效果；如果把 StoryBeat 当成 Timeline Item，就会用移动片段的方式处理本该重新组织的观点；如果 Job 超时后重复提交，会产生两份旁白或两个相同 Asset。专业判断只有落在正确项目、正确对象和正确版本上才有意义。

VideoFlowCut 当前只有一个 Project 级 Snapshot，没有 V7 架构中计划的 Sequence 对象。因此，当前任务必须明确目标 Project 和 Revision；需要制作长版、短版或横竖不同版本时，先说明当前代码还不能把它们作为独立 Sequence 管理，避免把“另一个版本”误做成回退或覆盖现有版本。

## 先判断用户想改哪一层

用户说“把这句话删掉”时，真正目标是 SemanticUnit/Script，而不是在 Timeline 上任意切一刀。用户说“这段解释太长”可能涉及 StoryBeat 和 Scene，而不仅是缩短某个 Item。用户说“产品出现太早”才更接近 EffectCue 的语义锚点和时间范围。选择过低层级会让后续联动失去依据；选择过高层级又会重建过多内容。

当前对象可以这样理解：Asset 是媒体来源；TranscriptSentenceCandidate 是机器生成的句子候选；SemanticUnit 是经专业判断的完整思想；StoryBeat 是叙事目的；Scene 是一段连续的视觉或人物状态；TimelineItem 是实际播放范围；EffectCue 是为什么、何时、在哪里出现某种视觉处理；Caption 是最终屏幕文字；ActorPerformance 绑定人物视频、声音和 Mask；ProductionRun 记录为什么这样做。

## 标准读写循环

任何非平凡操作都从 `target_project` 和 `read_project` 开始。记录当前 Revision 后，再读取与问题最接近的对象和上下文。写入时使用明确 `base_revision_id`。写入成功后，不以工具返回 success 结束，而是重新读取新 Revision、`read_impact_report` 和目标对象；涉及跨对象关系时运行 `validate_project_graph`；视觉修改渲染 Preview，声音修改实际回听。

Revision 冲突不是普通网络错误。发生冲突后重新读取项目，理解用户或另一个 Agent 改了什么，再判断原决定是否仍成立。盲目重放命令可能覆盖刚完成的 Web 微调。

## Job 结果未知

Bridge、Preview、Export 和媒体分析都是异步任务。超时或断连时，先 `track_job`，再检查 Project 是否已经出现结果。Production Job 有幂等键，但幂等不能代替读回。尤其是 OmniVoice 或导出，重复提交既浪费时间，也可能形成多份产物和错误版本关系。

## ProductionRun 的边界

ProductionRun 不是第二份项目。它记录 Skills、References、创作决定、被拒绝方案、Preview Evidence 和 Editorial Review。真正播放什么仍以 Project Revision 为准。报告中不能保存一份独立 Timeline 并把它当作真相，也不能只因为报告写着“完成”就跳过 Project 和 Quality 检查。

---

## 对象层级与典型修改

判断修改层级时，先问用户希望改变的是“观众听到什么”“为什么这样组织”“这一段怎样被看见”还是“某个对象在第几帧播放”。这四个问题分别更接近 Semantic/Script、Story、Scene/Effect 和 Timeline。

例如用户说“删掉‘其实吧’”。若它只是填充，应由 `semantic-continuity` 修改 SemanticUnit 和 Script，让 Speech、Caption 和下游锚点得到影响报告。直接在 Timeline 上分割会丢失语义关系，并可能留下字幕和 EffectCue。

用户说“这一段从个人经历转到机制解释太突然”。根因是 Scene 关系，不是某个 Transition 的样式。应先看 StoryBeat 和 Visual Treatment，可能需要保留一句过渡、延后 Cutaway，或让人物先完成认知转折。只加一个更花哨的转场不会修复结构。

用户说“右边的产品挡脸”。这才是 EffectCue/布局问题。可以调整 spatialAnchor、素材或时机，不重建 Story。

---

## Revision 冲突、结果未知与恢复

Revision 冲突意味着项目在你读取后发生了变化。首先读取最新 Revision 和 Impact，判断变化是否触及同一个 StoryBeat、Scene、Item 或 Cue。若用户刚把一个效果锁定为 direct override，就不能把旧的自动布局再次写回。

结果未知发生在请求已经发送，但客户端没有收到明确结果。此时不要假定失败。先检查 Job 状态、Project Revision、输出 Asset 和 Bridge Audit。只有确认没有副作用，才用同一幂等键重试。若任务已成功但结果尚未注册，应修复结果接收，不重新生成内容。

---

## 完整推演：用户反馈的是旧导出，而项目已经继续修改

用户说“第 12 秒的卡片太快”，但当前项目 Revision 已经比他看到的 MP4 更新两次。此时不能直接在最新 Timeline 的第 12 秒修改，因为最新版本的时间和对象可能已经变化。正确做法是先确定用户看的 ExportArtifact、Sequence 和 Revision，从旧版本找到对应 Scene、SemanticAnchor 或 EffectCue，再判断同一问题是否仍存在于当前版本。

若当前版本已经重排，反馈的症状时间可能不再是根因位置。修改必须基于明确的 base Revision；否则看似修复了用户反馈，实际可能破坏后续已经通过的改动。

---

## 当前能力边界

执行前阅读 `_shared/CAPABILITY_MANIFEST.md` 和实时 MCP 描述。V3 中会讨论 DirectorPlan、Sequence、Primary/Finishing Compiler 等未来架构概念，但当前代码没有对应持久化对象和工具。可以在创作决定中表达这些计划，不能报告已经写入了不存在的对象。

## 最终检查

- Project ID 和 Revision 与用户实际基线一致。
- 选择了最接近意图的对象层级。
- 写入携带 base Revision。
- 新 Revision、Impact 和目标对象已读回。
- Graph 没有悬空引用。
- 视觉与声音修改经过对应验证。
- 结果未知时没有重复提交。
- ProductionRun 没有成为第二份项目状态。

## 项目级共享合同

执行时还应读取项目中真正共享、会独立变化的合同：

- `../_shared/CAPABILITY_MANIFEST.md`：当前代码实际能力；
- `../_shared/PROJECT_REVISION_AND_EXECUTION.md`：Project、Revision、MCP 和执行安全；
- `../_shared/EVIDENCE_AND_REALITY.md`：事实、证据、未知和生成内容边界；
- `../_shared/QUALITY_AND_DELIVERY.md`：技术、审美与交付门禁。

这些文件不替代本 Skill 的专业知识；本文件单独阅读应已经能完成专业判断。
