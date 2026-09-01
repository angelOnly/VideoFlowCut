---
name: effect-timing
description: Place MotionCues, captions, SFX, cutaways, and camera changes on meaningful semantic, speech, visual, and musical beats using only the timing precision actually available.
---


# 动效时机与运动句法

## 角色

本 Skill 决定效果何时开始、何时稳定、停留多久、何时退出。它把运动当作句子和节奏关系，而不是按固定秒数或默认 spring 参数自动播放。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 创建或调整 MotionCue、EffectCue、字幕强调、SFX、Cutaway 或镜头变化。
- 需要让 Remotion 动效与语音、动作或音乐对齐。
- 需要在 segment_exact、chunk_coarse、word_exact 之间选择策略。

## 何时不使用

- 只创建静态无时间关系的素材。
- 时间证据 unavailable 且效果依赖同步。

## 前置读取

- SpeechTiming 精度。
- SemanticUnit / NarrativeBeat。
- 人物动作或源画面事件。
- 音乐 BeatMap 和现有效果。
- `../_shared/timing-precision.md`。

## 必须掌握的证据

- 段首、段尾、停顿、关键词或动作时间。
- 进入前的视觉状态和退出后的下一个事件。
- 动画的 Settled Frame 和阅读时间。
- 当前 AttentionCurve 和同时发生的声音事件。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 效果真正的语义落点是什么？
- 应该提前预入场还是落点后反应？
- 稳定帧需要在什么词或动作上完成？
- 观众需要多少时间读完和理解？
- 退出是否为下一事件让路？
- 音乐是否只是微调，还是当前内容确实由音乐驱动？
- 时间精度是否足以支持该效果？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 确定锚点优先级

默认：

```text
语义事件
>
语音重音
>
短句边界
>
画面动作 / 切点
>
音乐节拍
```

Vlog 或音乐蒙太奇可以提高动作/音乐优先级，但不得破坏语义和动作完整。

### 2. 把动画写成运动句子

每个效果包含：

```text
准备 / 预进入
→ 主动作
→ 稳定
→ 阅读 / 理解
→ 退出 / 释放
```

没有稳定和停留的动画通常只是噪声。

### 3. 选择时机类型

- 预示型：关键词前开始，关键词落音时稳定；
- 反应型：笑点或结果之后立即触发；
- 解释型：对象先建立，再逐步揭示；
- 证据型：页面先建立，再高亮；
- CTA 型：动作词出现时进入，行动语句期间持续；
- 转场型：句子边界或场景逻辑改变时完成。

### 4. 根据时间精度降级

- segment_exact：段首/段尾、Scene、Cutaway、句级字幕；
- chunk_coarse：粗定位和低频变化；
- word_exact：句中关键词和逐词字幕；
- unavailable：阻止正式同步效果。

### 5. 运动强度分层

慢推建立期待，快速动作形成冲击，停住让信息被看见。连续匀速往往像电子相册。

弱段小幅慢动，高潮才使用大幅冲击。

### 6. 控制并发

同一时刻最多一个主动作。若人物强手势、字幕变化和音效已经承担落点，其他图形应减弱或延后。

### 7. 关键帧和连续播放验证

检查进入、峰值、Settled Frame、退出，以及前后至少数秒的完整播放。

## 禁止行为

- 每三秒一个动画。
- 所有效果使用同一时长和 easing。
- 所有落点都卡音乐强拍。
- 只有进入没有稳定和阅读时间。
- 时间精度不足却声称逐词准确。
- 多个效果同一帧同时启动。
- 用运动填满所有静止时间。

## 验证

- 主动作落在正确语义或动作事件。
- Settled Frame 在信息需要被理解时可见。
- 阅读时间足够。
- 退出不打断当前信息。
- 并发注意力可控。
- 音乐关闭后运动仍有内容理由。

## 退出条件

- 所有 MotionCue 记录锚点、精度、进入、稳定、退出和验证。
- 没有依赖虚假时间数据。
- 局部预览和完整播放均通过。

## 按需读取的专业参考

- `references/semantic-beat-timing.md`：预示、反应、解释、证据和 CTA 的时机模型。
- `references/motion-phrasing.md`：运动的准备、冲击、停留和释放，以及速度的情绪语义。
- `references/timing-without-word-exact.md`：没有词级时间时的句级策略和预览微调。
