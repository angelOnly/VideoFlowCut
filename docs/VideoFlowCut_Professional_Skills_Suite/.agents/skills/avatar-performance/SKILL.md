---
name: avatar-performance
description: Plan, generate, assess, and repair digital-avatar performances so speech, gesture, gaze, emotion, framing, mask quality, and downstream effect placement work as one composition.
---


# 数字人物表演

## 角色

本 Skill 为数字人“像一个表演者”负责，而不只检查口型同步。它根据 ActorCapability 规划可实现动作，并为后续 Remotion 合成提供人物视频、蒙版、空间锚点和表演状态。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 生成数字人口播。
- 替换人物表演或局部修复。
- 人物动作需要与产品、CTA、评论或 Cutaway 协同。
- 需要判断数字人能力降级。

## 何时不使用

- 真人原始口播且不生成 Avatar。
- 只调整已有人物画面的字幕或 BGM。

## 前置读取

- 最终 SpeechAsset、Script Revision 和表演计划。
- Avatar Provider 的实时能力说明。
- 人物形象、画幅、服装和背景要求。
- VisualTreatmentPlan 与空间锚点需求。

## 必须掌握的证据

- Provider 是否支持透明背景、手势、表情、视线、局部重生成。
- 人物视频、声音、蒙版和实际姿态。
- 头、嘴、手、身体位置和安全区。
- 口型、眨眼、微动、手部和背景稳定性。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 角色应该呈现什么情绪和可信度？
- 人物的景别和位置是否为动效留出空间？
- 所需手势是否在 Provider 能力范围内？
- 表演是否与语句情绪和节奏一致？
- 数字人不自然的地方应重生成、Cutaway 遮盖还是降低动作复杂度？
- 人物是否在高密度动效中仍保持视觉锚点？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立 ActorCapability

记录实际能力，不使用想象能力：

- 透明背景 / Mask；
- 坐姿 / 站姿；
- 允许的表情；
- 手势；
- 视线；
- 镜头构图；
- 最大时长；
- 局部重生成；
- 输出帧率和声音处理。

### 2. 表演分段

按 SpeechSegment 和 NarrativeBeat 规划表演。每段说明：

- 基础情绪；
- 强调词；
- 手势；
- 目光；
- 头部和身体姿态；
- 是否需要保持稳定给动效让位。

### 3. 构图预留

人物位置应支持目标 StylePack：

- 左右安全区；
- 头顶空间；
- 字幕区；
- 手部活动区；
- behind_actor 的背景空间。

### 4. 生成与归一化

生成后登记 ActorPerformance：

- 人物视频；
- 对应 SpeechAsset；
- Mask；
- SpeechTiming；
- 姿态和安全区；
- Provider 元数据；
- 质量状态。

### 5. 表演 QC

检查：

- 口型大范围同步；
- 眼睛和眨眼；
- 手指和手部异常；
- 身体漂移；
- 服装、脸和背景一致性；
- 表情是否与语义相反；
- 句间是否突然复位；
- 嘴部是否被图形遮挡。

### 6. 降级和修复

优先级：

1. 局部重生成；
2. 降低手势要求；
3. 改构图或效果空间；
4. 用自然 Cutaway 覆盖短问题；
5. 换 Provider 或改用真人/静态形象。

不得用大量 Cutaway 隐藏整条人物表演失败。

## 禁止行为

- 假设 Provider 支持不存在的手势或透明背景。
- 先生成整条人物后再规划动效。
- 只检查嘴型，不检查眼神、手部、身体和情绪。
- 用前景图形长期遮挡嘴部问题。
- 人物每段都做强手势。
- 局部问题导致无必要的整条重生成。

## 验证

- SpeechAsset 与人物画面对应。
- 蒙版边缘和空间锚点可用。
- 人物表演与语义、情绪一致。
- 关键手势和 EffectCue 的位置匹配。
- 连续播放无明显复位和形象漂移。

## 退出条件

- ActorPerformance 可被 PresenterScene 使用。
- 不支持能力已明确降级。
- 阻塞级口型、脸、手和蒙版问题已解决。
- 下游能读取真实空间锚点。

## 按需读取的专业参考

- `references/performance-direction.md`：数字人的角色、情绪、手势、目光和稳定表演。
- `references/capability-and-fallbacks.md`：Provider 能力建模和降级策略。
- `references/avatar-quality-review.md`：口型、蒙版、形象连续性和不自然问题检查。
