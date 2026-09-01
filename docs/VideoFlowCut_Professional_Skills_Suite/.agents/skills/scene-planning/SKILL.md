---
name: scene-planning
description: Design, split, merge, and restructure SceneInstances so each scene has one coherent cognitive or emotional model, a deliberate internal progression, and a clear entry, settled state, and exit.
---


# Scene 规划与场景语法

## 角色

本 Skill 负责把 Story 变成可编辑 SceneDocument。Scene 是观众在一段时间内理解画面的主要单位，不等于一条素材，也不等于一个小动效。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 新增 Scene。
- 把零散效果重构成完整场景。
- 调整场景边界或合并/拆分 Scene。
- 为 Presenter、Explainer 或 Vlog 选择 Scene Type。

## 何时不使用

- 只微调 Scene 内一个 EffectCue。
- Story 尚未清楚。
- 只导入素材。

## 前置读取

- NarrativeBeat、前后 Scene、SpeechTiming。
- Scene Type Registry、StylePack 和可用 Asset。
- 目标画幅、人物/字幕布局和 AttentionCurve。

## 必须掌握的证据

- 这一段的认知或情绪任务。
- 哪些句子共享空间、对象或视觉模型。
- 当前 Scene 内对象、状态和递进顺序。
- 前后 Scene 的构图、声音和运动。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 一个 Scene 的统一模型是什么？
- 哪些 Beat 应共享它？
- 场景内信息如何递进？
- 何时当前场景完成任务？
- 新 Scene 是否真的需要新的视觉世界？
- 进入和退出如何帮助观众重新定位？
- 能否用更少 Scene 获得更强连续性？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 定义场景任务

用一句话描述：

> 观众在这个 Scene 结束时，应看懂或感受到什么？

如果一句话无法表达，场景可能承担过多任务。

### 2. 选择 Scene Type

根据任务选择 PresenterScene、ExplainerScene、VlogMontageScene、DocumentScene、UIShowcaseScene、CutawayScene 或 EndCardScene。

### 3. 确定共享范围

把共享以下内容的 Beat 放在同一 Scene：

- 空间；
- 对象；
- 比较框架；
- 文档；
- UI；
- 时间阶段；
- 情绪状态。

### 4. 设计内部状态

至少定义：

- Entry State；
- Progressive States；
- Settled State；
- Exit State。

场景不是一个静态模板，而是一段状态变化。

### 5. 设计边界

场景边界优先来自：

- 新认知模型；
- 新地点/时间；
- 新证据类型；
- 章节转折；
- 情绪改变；
- 主视觉承担者改变。

### 6. 保持跨 Scene 连续

检查：

- 声音桥；
- 颜色和 StylePack；
- 运动方向；
- 对象接管；
- 人物回归；
- 信息是否重复。

### 7. 编译到 Timeline

Scene 与内部 Items 同一 Revision 原子更新，保留语义归属。

## 禁止行为

- 一个字幕句就是一个 Scene。
- 把完整场景拆成大量贴纸。
- Scene 只保存素材链接而没有任务和状态。
- 多个完全不同认知模型硬塞在同一 Scene。
- 场景切换只依赖花哨转场。
- 不定义 Settled State。

## 验证

- 场景任务一句话可说明。
- Beat 与 Scene 归属合理。
- 场景内部状态递进清楚。
- Entry/Settled/Exit 均可预览。
- 跨 Scene 连续播放不迷失。

## 退出条件

- SceneDocument 能被 Timeline 和 Remotion 稳定编译。
- 没有无意义过度拆分。
- 每个 Scene 可单独预览和缓存。
- 整片 Scene 顺序兑现 Story。

## 按需读取的专业参考

- `references/scene-boundaries.md`：认知、空间、时间、证据和情绪边界。
- `references/internal-progression.md`：Entry、Progressive、Settled、Exit 状态设计。
- `references/scene-coherence.md`：减少场景碎片、保持对象和视觉模型连续。
