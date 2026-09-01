---
name: visual-treatment-planning
description: Turn Narrative Beats into deliberate visual decisions: keep the current image, modify the current scene, use presenter effects, select B-roll/evidence, build an explainer scene, or intentionally remain quiet.
---


# 视觉处理规划

## 角色

本 Skill 为“哪里需要什么视觉处理，以及为什么”负责。它位于内容主线和具体 Remotion 实现之间，防止组件库反过来决定剪辑。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 整条视频主线稳定后规划视觉。
- 新增、重构或简化大量 Scene/Effect。
- 需要选择人物、B-roll、证据、MG 或安静区。
- 参考视频风格需要转化为通用视觉语法。

## 何时不使用

- 只调整单个已经确定的图形属性。
- Script 尚未稳定。
- 只做技术导出。

## 前置读取

- Story、NarrativeBeat、Script 和 SpeechTiming。
- 现有 Scene、Asset、StylePack 和 AttentionCurve。
- 人物能力、字幕策略和目标平台。
- 用户参考视频的分析结果。

## 必须掌握的证据

- 每个 Beat 的叙事功能和重要度。
- 当前画面能否承载信息。
- 可用证据、真实素材和生成素材。
- 前后视觉密度、重复的 Scene 语法和素材权利。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众这一刻需要理解、相信、感受还是行动？
- 保持当前画面能否成立？
- 需要解释、证明、具体化、情绪呼吸还是遮盖切口？
- 应该在当前 Scene 增加对象，还是建立新 Scene？
- 真实素材、证据、Remotion 图形和生成画面谁最合适？
- 是否超过注意力预算？
- 是否与前后 Scene 形成变化而不破坏统一？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 给 Beat 分类

常见功能：

- Hook；
- 主张；
- 解释；
- 对比；
- 分类；
- 流程；
- 数据；
- 证据；
- 例子；
- 情绪；
- 笑点；
- CTA；
- 结论。

### 2. 先评估保持原状

如果人物表情、真实动作或现有镜头已经足够，记录“保持”决定。视觉处理不是覆盖率竞赛。

### 3. 选择视觉任务

可选任务：

- 强化一个重点；
- 建立空间或对象；
- 显示关系；
- 逐步揭示结构；
- 提供真实证据；
- 将抽象概念具体化；
- 恢复注意力；
- 创造呼吸；
- 遮盖必要切口；
- 建立章节。

### 4. 选择表达层级

```text
当前画面不变
→ 当前 Scene 内轻处理
→ Presenter 前后景效果
→ B-roll / Evidence Cutaway
→ 全屏 ExplainerScene
→ VlogMontageScene
```

不要为小问题使用最重方案。

### 5. 选择视觉机制

优先考虑：

- 空间分组；
- 状态变化；
- 颜色语义；
- 物体关系；
- 数值变化；
- 路径；
- 遮罩；
- 镜头；
- 真实素材；
- 证据高亮；
- 字体排印。

不默认使用卡片。

### 6. 形成 AttentionCurve 和覆盖图

检查：

- 高、中、低密度；
- 连续安静时间；
- 连续高强度时间；
- Scene 语法重复；
- 同一时刻主注意力；
- 关键 Beat 是否得到处理；
- 普通 Beat 是否过度处理。

### 7. 输出 VisualTreatmentPlan

每项记录：

- Beat；
- 观众任务；
- 处理决定；
- Scene/Effect 类型；
- 资产需求；
- 时间锚点；
- 强度；
- StylePack；
- 验证方法；
- 不使用替代方案的原因。

## 禁止行为

- 按固定时间间隔添加变化。
- 把脚本名词逐一替换为库存素材。
- 所有 Beat 都创建新 Scene。
- 因组件可用就选择组件。
- 忽略“保持安静”作为正式决定。
- 用生成画面冒充证据。
- 连续重复同一种卡片或转场。

## 验证

- VisualTreatmentPlan 覆盖所有重要 Beat。
- 每个处理都有观众任务。
- AttentionCurve 有变化。
- 同一时刻主注意力明确。
- 资产需求可执行且权利边界清楚。
- 至少比较不处理方案。

## 退出条件

- 计划可被 Scene、Cutaway、Remotion 和素材 Skills 执行。
- 没有无目的效果。
- 主要信息得到视觉支持而普通信息不过载。
- 计划符合真实人物和工具能力。

## 按需读取的专业参考

- `references/narrative-to-visual.md`：从叙事功能到视觉任务和表达层级。
- `references/attention-budget.md`：视觉密度、安静区和一次一个主事件。
- `references/visual-mechanism-selection.md`：如何选择空间、状态、数据、证据、素材或字体机制。
