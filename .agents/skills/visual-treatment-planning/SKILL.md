---
name: visual-treatment-planning
description: 将 Narrative Beat 转为有理由的画面决定：保持人物、轻处理、动效、Cutaway、证据或安静区。
---

# 视觉处理规划

## 使用范围

主线稳定后，新增、重构或简化 Scene 和 EffectCue 前使用。它防止组件库或固定时间间隔反过来决定剪辑。

## 必须执行

1. 读取 Story、Script、SpeechTiming、现有 Scene/EffectCue、素材、人物状态、字幕策略和目标画幅。
2. 为每个重要 Beat 写清观众此刻需要理解、相信、感受还是行动。
3. 先判断保持当前画面是否足够，再在轻处理、人物前后景、B-roll/证据、全屏 Explainer 间选择最小充分方案。
4. 指定每段的主注意力对象、强度、所需素材、时间锚点、验证方式和不采用方案的原因。
5. 仅将当前平台能表达的决定交给 create_scene 或 manage_effect_cues；其余保留为可审查计划。

## 专业判断

- 重要 Beat 应得到视觉支持，普通 Beat 不应过度处理。
- 同一时刻只有一个主注意力事件；安静区是正式设计决定。
- 解释优先关系、状态、空间和路径；证据必须真实可追溯；现实素材用于地点、情绪、行为和体验。

## 当前能力边界

AttentionCurve 和 VisualTreatmentPlan 当前不是项目持久化对象。本 Skill 在本次任务报告中记录它们，不创建第二份项目状态，也不把规划当成已经写入时间线。

## 按需读取

- 叙事功能到画面任务：references/narrative-to-visual.md。
- 注意力预算与安静区：references/attention-budget.md。
- 视觉机制选择：references/visual-mechanism-selection.md。

## 退出条件

每项视觉处理都有观众任务、替代方案、能力边界和可验证方式；没有为覆盖率而增加的无目的效果。
