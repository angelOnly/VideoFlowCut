---
name: effect-timing
description: 按真实语义、语音、动作和音乐事件安排 EffectCue、Cutaway 与字幕变化的进入、停留和退出。
---

# 动效时机与运动句法

## 使用范围

创建或调整 EffectCue、Cutaway、字幕强调、SFX 候选或镜头变化前使用。

## 必须执行

1. 读取 SpeechTiming 精度、SemanticUnit/StoryBeat、现有效果和目标 Scene。
2. 先选语义事件，再考虑语音重音、短句边界、画面动作与音乐节拍。
3. 为每项效果定义预进入、主动作、稳定阅读、停留和退出；验证当前范围没有与其他主动作冲突。
4. 当前可写的 EffectCue 仅使用 manage_effect_cues；时间微调通过现有 Web Inspector 完成后，读取新 Revision 并渲染局部预览。

## 时间精度边界

- segment_exact：适合段首、段尾、场景切换和段级效果。
- chunk_coarse：只能做粗定位与低频变化。
- word_exact：才允许逐词效果；当前不得伪造。
- unavailable：阻止依赖同步的正式效果。

没有词级时间时，优先调整自然的 SpeechSegment 边界；否则给出候选帧并以真实预览校正，明确它不是自动逐词对齐。

## 按需读取

- 不同语义事件的时机：references/semantic-beat-timing.md。
- 速度、峰值、停留和释放：references/motion-phrasing.md。
- 无词级时序时的降级：references/timing-without-word-exact.md。
- 共同精度合同：../_shared/timing-precision.md。

## 退出条件

效果落在有意义的事件上，稳定帧有阅读时间，退出为下一事件让路；局部预览和连续播放均通过。
