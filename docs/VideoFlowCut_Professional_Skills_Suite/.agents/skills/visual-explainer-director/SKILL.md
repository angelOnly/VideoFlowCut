---
name: visual-explainer-director
description: Direct narration-led visual explanation videos and full-screen explainer sections inside presenter projects. Use when the visual system must teach, compare, classify, prove, or progressively reveal information rather than merely decorate speech.
---


# 视觉解释片导演

## 角色

本 Skill 为旁白驱动的视觉解释负责。核心单位是 Scene 和场景内部的信息递进，而不是零散 Clip 或卡片。它协调解释动画、证据、真实素材、UI、图表和声音。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 旁白驱动知识解释片。
- 人物口播中需要全屏解释复杂机制。
- 内容包含分类、比较、流程、历史、数据、系统或证据。
- 参考视频的视觉语法需要被转化为 Scene。

## 何时不使用

- 主要价值来自人物表演而不是视觉解释。
- 实拍事件本身驱动故事。
- 只需一个小型人物旁效果。

## 前置读取

- Story、NarrativeMap、SpeechTiming 和 CreativeBrief。
- StylePack、可用 Scene Types、Asset Library。
- 参考视频分析中的 Scene Grammar 和 AttentionCurve。
- `../scene-planning/SKILL.md`、`../evidence-visualization/SKILL.md`。

## 必须掌握的证据

- 每个 NarrativeBeat 的功能和逻辑关系。
- 可用证据、真实素材、UI、图表和生成资产。
- 旁白长度、停顿和段级时间。
- 前后 Scene 的视觉模型、密度和 StylePack。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众需要建立什么心智模型？
- 哪些句子应共享同一个 Scene？
- 信息如何在场景内逐步出现？
- 应该用解释、证据还是现实素材？
- 一个场景何时已经完成任务，应切换到下一场景？
- 主视觉变化与字幕如何分工？
- 如何避免 PPT 和卡片堆叠？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立 NarrativeMap

将旁白拆为：

- Hook；
- 问题；
- 机制；
- 对比；
- 分类；
- 过程；
- 证据；
- 历史；
- 例子；
- 结论。

明确各 Beat 的因果和前后依赖。

### 2. 设计 Scene 结构

一个 Scene 应承载一个稳定认知模型，例如：

- 同一座舱中的舱位分类；
- 同一手机中的 OTA 产品层；
- 同一人物空间中的客户分组；
- 同一文件中的证据高亮。

通常让一个大场景持续数秒，并通过内部对象变化推动理解，而不是每句话更换背景。

### 3. 选择场景语法

优先从注册语法中选择：

- HeroReveal；
- ProgressiveClassification；
- ComparisonScene；
- RouteAndFlow；
- EvidenceDocument；
- UIWalkthrough；
- PeopleGrouping；
- LayerStack；
- DataConclusion；
- HistoryTimeline；
- RealityBroll。

### 4. 安排三类画面

合理交替：

- 解释画面：建立模型；
- 证据画面：建立可信度；
- 现实画面：建立生活经验和情绪。

不要让五分钟全是同一种 MG，也不要让所有解释都退化成库存素材。

### 5. 场景内渐进揭示

根据旁白顺序安排：

- 对象建立；
- 新类别出现；
- 状态变化；
- 关系线；
- 数值；
- 标签；
- 结论。

观众只在当前信息需要时看到下一层。

### 6. 字幕与主视觉分工

主视觉信息密度高时，字幕保持稳定和短句；不要同时使用全程逐词跳动字幕。

### 7. 场景级预览与缓存

逐 Scene 检查进入、稳定、递进和退出，再检查 Scene 之间的连续播放。

### 8. 整片 Visual QC

检查场景语法是否重复、是否有现实/证据呼吸、是否每段都像独立 PPT 页。

## 禁止行为

- 每句话创建一个新 Scene。
- 把旁白文字直接排成大字当作解释。
- 所有内容使用同一种卡片。
- 解释、证据和生成画面混淆。
- 复杂场景一次性展示全部信息。
- 主视觉高密度时再用高动态逐词字幕。
- 只验证单个 Scene，不看整片。

## 验证

- NarrativeMap 与 Scene 分段一致。
- 每个 Scene 有明确认知任务。
- 场景内部信息按旁白递进。
- 解释、证据和现实素材比例合理。
- Settled Frame 可读。
- Scene 间节奏和 StylePack 统一。

## 退出条件

- 整条旁白有完整视觉路径。
- 重要机制能够通过画面理解。
- 没有明显 PPT 化和模板重复。
- 真实预览和整片质量复核通过。

## 按需读取的专业参考

- `references/explainer-narrative-grammar.md`：旁白、问题、机制、证据和结论如何组织视觉叙事。
- `references/scene-grammar.md`：视觉解释片的通用 Scene 语法和适用边界。
- `references/explanation-evidence-reality.md`：解释、证据与现实素材的分工和交替。
- `references/progressive-reveal.md`：一个大场景内部的渐进式信息变化。
