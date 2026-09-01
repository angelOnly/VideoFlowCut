---
name: avatar-performance
description: 在数字人能力接入后，规划、检查和修复人物的语音、表情、手势、视线、Mask 与画面合成关系。
---

# 数字人物表演

## 启用状态

此 Skill 已保留专业知识，但当前不在项目配置中自动启用。现阶段没有 Avatar Provider、能力读取或生成任务；系统只能登记已经存在的人物视频和 Mask。

## 后续使用原则

接入 Provider 后，先读取实际的 alpha_mask、手势、表情、视线、姿态、局部重生成、时长和音频输入能力，再决定视觉处理。人物动作和效果必须联合规划，不能让图形假装与不受控手势互动。

无 Mask 时，后景大字与复杂穿插必须降级为左右安全区、普通 Overlay 或 Cutaway。

## 当前允许的检查

对已登记 ActorPerformance，可检查人物与当前 SpeechAsset 的 Revision 一致性、Mask 可用性、脸嘴手字幕遮挡和预览中的形象稳定性；不得报告生成、修复或姿态控制已完成。

## 按需读取

- 能力协商与降级：references/capability-and-fallbacks.md。
- 角色、手势、目光与情绪：references/performance-direction.md。
- 人物与合成质量：references/avatar-quality-review.md。

## 退出条件

只有 Provider 与项目写入链路实际落地后，才能把表演计划转为生成或修复操作。
