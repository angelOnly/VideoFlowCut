---
name: scene-planning
description: 以认知或情绪任务规划、创建和复核 Scene，避免把每句话或每张卡片误当成一个独立场景。
---

# Scene 规划与场景语法

## 使用范围

新增、合并、拆分或重构 Scene，以及选择 PresenterScene、ExplainerScene、VlogMontageScene、CutawayScene 或 EndCardScene 时使用。

## 必须执行

1. 用一句话定义：观众在本 Scene 结束时应理解或感受到什么。
2. 读取相邻 Beat、Scene、SpeechTiming、目标画幅、字幕与人物/素材状态。
3. 只在认知模型、地点/时间、证据类型、章节或情绪明显改变时切新 Scene。
4. 当前可创建的基础 Scene 使用 create_scene；写后读取 Project 与 ImpactReport。
5. 预览入口、稳定状态、信息递进和退出，确认跨 Scene 连续播放不迷失。

## 专业判断

同一空间、对象、比较框架、文件、UI 或情绪状态的多个 Beat 应尽量共享 Scene，通过逐步增加对象、标签、关系或状态推进，而不是每句话换背景。

## 当前能力边界

项目 Scene 目前只持久化类型、标题、目的、范围和素材引用，不保存 Entry/Progressive/Settled/Exit 状态，也没有完整 Scene 编译器。它们可写入本次计划和预览检查，不能伪造为项目字段。

## 按需读取

- 何时切场景：references/scene-boundaries.md。
- 场景内递进：references/internal-progression.md。
- 对象连续与信息上限：references/scene-coherence.md。

## 退出条件

每个 Scene 有明确任务和合理边界；现有能力实际创建的 Scene 与预览结果保持一致。
