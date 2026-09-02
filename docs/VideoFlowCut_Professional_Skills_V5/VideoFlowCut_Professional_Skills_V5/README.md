# VideoFlowCut Professional Skills V5

> 对齐文档：`ai_video_platform_architecture_development_plan_v61.md`（文档状态 V6.2）  
> 代码能力基线：`VideoFlowCut main@713821ebb7c32abeffc286e07506a806e6c6f287`  
> 写作目标：主工作流达到 ChatCut `talking-head-guide` / `create-motion-graphics` 那种“完整作业手册”的可读性；专项 Skill 明确交接，但不把专业知识压缩成关键词清单。

## 本版解决的问题

V2～V4 最大的问题不是 Skill 名称错，而是知识被压缩成了索引。一个标题后只有一两句话，能提醒 Agent “注意停顿、安静区、Settled Frame”，却没有解释这些判断为什么成立、相似场景怎样区分、错误处理会让观众感受到什么，也没有把当前 MCP 的写入、读回、失效传播和验证连成完整工作流。

V5 按架构 V6.2 重建为五层逻辑：

```text
项目运行合同
→ 跨类型总导演
→ 一个主要视频工作流
→ 按阶段调用专项 Skill
→ 跨工作流质量门禁
```

物理目录仍平铺，便于 Codex 发现和局部任务直接调用；逻辑上不再把所有 Skill 当成同级插件。完整人物口播由 `presenter-motion-director` 收口，视觉解释片由 `visual-explainer-director` 收口，Vlog 由 `vlog-director` 收口。`remotion-production` 是跨类型的完整 Motion Graphics 子工作流，不只是几个动效原则。

## 目录

```text
.agents/skills/
├─ _shared/
├─ project-basics/
├─ web-editor-operator/
├─ production-director/
├─ asset-import/
├─ visual-asset-sourcing/
├─ transcription/
├─ voice-production/
├─ semantic-continuity/
├─ presenter-motion-director/
├─ avatar-performance/
├─ visual-treatment-planning/
├─ scene-planning/
├─ effect-timing/
├─ depth-composition/
├─ cutaway-planning/
├─ visual-explainer-director/
├─ evidence-visualization/
├─ vlog-director/
├─ captions/
├─ audio-finishing/
├─ remotion-production/
├─ quality-verification/
├─ export/
└─ known-errors/
```

共 24 个 Skill。`visual-asset-sourcing` 是架构 V6.2 中新增的独立专业工种，负责从明确的 AssetRequest 到 Candidate、Acquire、本地 Asset、Provenance 和 Rights；它不替代 `cutaway-planning` 对“是否使用、用多久、怎样离开和返回主画面”的判断。

## 如何阅读

第一次审阅建议按以下顺序：

```text
_shared/CURRENT_CAPABILITIES.md
project-basics/SKILL.md
production-director/SKILL.md
presenter-motion-director/SKILL.md
semantic-continuity/SKILL.md
visual-treatment-planning/SKILL.md
remotion-production/SKILL.md
cutaway-planning/SKILL.md
captions/SKILL.md
audio-finishing/SKILL.md
quality-verification/SKILL.md
```

随后再阅读视觉解释片、Vlog 和其它专项 Skill。每个主工作流 `SKILL.md` 自身已经能讲清完整生产顺序；References 只保存真正可选、足够完整的案例库或代码合同，不再保留三五行的知识碎片。

## 当前能力与架构目标

Skill 不能把架构文档中的推荐工具误写成当前已实现能力。执行前先读取 `_shared/CURRENT_CAPABILITIES.md`，再读取实时 MCP Tool Schema。当前实现与架构目标存在差异时：

- 当前工具真实存在：可以执行，写后读回；
- 领域对象存在但 Runtime 只部分消费：可以规划和有限执行，必须预览验证；
- 架构文档已设计但代码尚未实现：只形成可执行计划和缺口，不声称已写入；
- 工具名或字段发生变化：以实时 Schema 为准，并在同一个 PR 更新 Skill。

## 接入

1. 备份仓库现有 `.agents/skills/`。
2. 使用本包中的 `.agents/skills/` 整体替换。
3. 将 `integration/config.skills-v5.fragment.toml` 合并进 `.codex/config.toml`，尤其补上 `visual-asset-sourcing`、三个完整主工作流和未来能力 Skill 的可发现配置。
4. 项目重新加载后，运行 `evals/` 中的静态路由、交接合同和真实 Presenter 验收。
5. `docs/` 中可以保留本包的合并审阅稿，但不要复制第二棵可运行的 `.agents/skills/`。

## 重要边界

- Skill 是同一个 Codex Agent 的 playbook，不是后台调度服务。
- “主 Skill 调用专项 Skill”表示到达阶段后读取另一份 Skill，再通过同一个 MCP/Web 修改同一 Project Revision。
- 输入与输出是交接合同，不是新的 `SkillInput` / `SkillOutput` 数据表。
- `loadedSkills` 只证明文件被读过，不能证明交接完成。
- Shader 当前不加入运行时 Skill。VideoFlowCut 尚未实现 Shader Asset、GLSL Runtime、属性 Schema 和 Timeline 绑定；简单 Zoom、Blur、Glow、Mask 仍归 Remotion Registry。
