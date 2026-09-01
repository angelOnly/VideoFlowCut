---
name: depth-composition
description: Compose presenter, background, rear effects, actor, actor effects, foreground graphics, cutaways, captions, and sound into a clear depth hierarchy with safe occlusion and a single dominant attention target.
---


# 人物前后景与空间合成

## 角色

本 Skill 为图层深度、人物遮挡、空间锚点和构图层级负责。它不只是检查“有没有挡脸”，而是判断前后景关系是否帮助观众理解和保持人物存在感。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 效果需要位于人物前后。
- 需要绑定头、手、身体或安全区域。
- 人物 Mask、透明背景或画面裁切参与合成。
- 多个图层产生注意力或遮挡问题。

## 何时不使用

- 纯全屏 Explainer 且无人物层。
- 只做声音处理。

## 前置读取

- ActorPerformance、Mask、姿态和空间锚点。
- 目标画幅、字幕区和 StylePack。
- Scene 图层、EffectCue 和 Preview 帧。

## 必须掌握的证据

- 人物头、眼、嘴、手、身体轮廓。
- 关键物体和文字完整区域。
- 字幕安全区和平台 UI 遮挡区。
- 图层运动范围和视差。
- 背景复杂度、对比度和颜色。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 哪个对象在前，为什么？
- 遮挡是否表达空间关系还是只是技术效果？
- 人物被遮挡后仍能保持身份和表情吗？
- 背后信息被人物遮挡后是否仍可读？
- 前景对象是否与手势产生可信关系？
- 画面是否有一个清楚主视觉中心？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立深度层

默认逻辑：

```text
Background
→ Rear FX
→ Actor
→ Actor FX
→ Front FX
→ Cutaway / Fullscreen
→ Captions / Global UI
```

这是语义层，不要求实现完全相同的物理轨道。

### 2. 确定空间锚点

支持：

- behind_actor；
- actor_hands；
- actor_torso；
- actor_head；
- safe_left；
- safe_right；
- lower_center；
- upper_background；
- fullscreen。

逻辑锚点应根据实际姿态转换为坐标。

### 3. 保护区域

优先保护：

1. 眼睛和嘴；
2. 关键表情；
3. 手势；
4. 字幕；
5. 主要信息；
6. 平台 UI 安全区。

### 4. 遮挡要有目的

人物遮挡背景大字可以增加层次，但关键信息不能全部落在人物后。前景产品靠近手部可建立互动，但不应穿过身体或漂浮无支撑。

### 5. 视觉层级

通过以下方式建立层级：

- 尺寸；
- 位置；
- 对比；
- 清晰度；
- 运动；
- 前后关系；
- 留白。

不要仅靠阴影和发光。

### 6. 运动范围检查

检查动画的整个路径，而不是只看 Settled Frame。入场物体可能撞脸，退出可能扫过字幕。

### 7. 多画幅

竖屏和横屏不能仅等比缩放。重新判断：

- 人物位置；
- 字幕；
- 左右安全区；
- 前景对象；
- 平台控件。

## 禁止行为

- 所有图形都放人物前面。
- 为了层次强行抠像。
- Mask 质量差仍使用细小穿插。
- 只看稳定帧，不看运动路径。
- 把关键文字放在人物后方中央。
- 忽略平台 UI 和字幕区。
- 多个大对象形成多个视觉中心。

## 验证

- 进入、稳定、退出帧均无不可接受遮挡。
- 人物脸、嘴和手势被正确保护。
- 背景信息在遮挡后仍可理解。
- 前景对象与人物空间关系可信。
- 画面主视觉中心清楚。

## 退出条件

- 深度合成在目标画幅成立。
- Mask 和锚点状态可读。
- 没有 blocking 级遮挡或越界。
- 真实连续播放通过。

## 按需读取的专业参考

- `references/occlusion-and-safe-zones.md`：人脸、嘴、手势、字幕和平台安全区。
- `references/foreground-background-grammar.md`：前景、后景与人物互动的视觉语义。
- `references/composition-and-attention.md`：视觉层级、主视觉中心和多对象冲突。
