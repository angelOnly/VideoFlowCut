---
name: cutaway-planning
description: 规划 B-roll、证据、UI、梗图和全屏插入的叙事目的、时机、时长与自然返回，而不把空镜当关键词装饰。
---

# Cutaway、B-roll 与全屏插入

## 使用范围

需要离开人物主画面以解释、证明、具体化、遮盖必要切口、制造情绪呼吸或展示 CTA 时使用。

## 必须执行

1. 读取 NarrativeBeat、主画面、声音、候选素材、前后 Scene 和来源/授权信息。
2. 先比较保持人物是否更好，再说明该 Cutaway 的唯一或主要叙事功能。
3. 判断应使用全屏、画中画、前景卡片、ExplainerScene 或 VlogMontage，并安排在完整语义或动作边界进入。
4. 检查识别与阅读所需时长，以及人物返回时的姿态、情绪、景别、方向和声音连续性。

## 当前能力边界

当前平台没有向任意视频轨插入、裁切或拼接 B-roll 的 MCP 写命令。create_scene 只创建 Scene 元数据，不会将素材剪进 Timeline。因此本 Skill 当前输出的是可审查的 Cutaway 计划；除非后续已有 Web 操作实际写入并读回，否则不得报告 Cutaway 已完成。

## 按需读取

- Cutaway 的功能选择：references/cutaway-functions.md。
- 素材相关性、裁切和时长：references/broll-selection-and-duration.md。
- J/L Cut、声音桥与返回：references/entry-exit-and-return.md。

## 退出条件

每个计划的 Cutaway 都有明确目的、可追溯素材要求、进入/退出方案和降级说明；没有无关空镜。
