---
name: audio-finishing
description: 在音频编辑能力接入后，围绕对白处理切口、环境声、音乐、音效、静音、声音桥和最终听感。
---

# 声音、音乐与节奏收尾

## 启用状态

此 Skill 已保留知识，暂不自动启用。当前平台能生成和检查 Dialogue，但没有添加/裁切 BGM、SFX、淡化、Duck、交叉淡化或环境声混音的 MCP 写入能力。

## 后续工作原则

对白/旁白是 Anchor；自然声建立空间和真实感；BGM 服务情绪与章节；SFX 绑定明确事件。先只听对白，再处理切口、呼吸、room tone、音乐层级、声音桥和完整声画。

安静区是创作选择，不能用持续音乐掩盖切口，也不能删除所有呼吸。SFX 需对齐真实 onset 与事件，而不是只对齐 Timeline Item 起点。

## 当前允许的产出

可通过预览报告对白自然性、音乐压对白或声音缺失等问题，并建议最小修复；不能报告混音、Duck 或音效已经写入。

## 按需读取

- 对白切口与 room tone：references/dialogue-continuity.md。
- 音乐、Duck 与安静区：references/music-and-emotion.md。
- SFX、环境声和声音桥：references/sfx-and-sound-bridges.md。
- 听审与技术检查：references/listening-and-technical-qc.md。

## 退出条件

音频轨编辑和混音命令落地后再自动启用；当前结论须标注为审查或建议。
