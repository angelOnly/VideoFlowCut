---
name: captions
description: 基于真实语音时序制作短句、可读且不抢主画面的字幕，并验证语义换行和安全区。
---

# 字幕与文字层级

## 使用范围

SpeechAsset 已生成，或 Script、旁白、画面密度变化后需要复核字幕时使用。

## 必须执行

1. 读取 read_speech_timing、read_captions、目标 Timeline 范围和 QualityReport。
2. 只使用实际返回的时间精度。当前默认稳定字幕和 segment_exact，不生成伪逐词高亮。
3. 逐卡检查完整短语、阅读时长、数字与单位、语义换行、人物嘴部和平台底部安全区。
4. 在主视觉复杂、证据或 Explainer 密度高时，让字幕保持稳定并降低强调强度。

## 专业判断

- 不拆开因果、转折、对比、数字与单位、人名身份和必要动宾结构。
- 每张字幕通常只强调一个真正重要词；优先用位置、字号、字重和对比，不默认发光、描边或弹跳。
- 字幕越动态，其他视觉越克制；主视觉越丰富，字幕越稳定。

## 当前能力边界

CaptionCard 当前只支持 stable 样式，且没有词级写入能力。若只有 segment_exact，短语内的时间只能作为预览候选，不能声称精确到词。

## 按需读取

- 卡片切分：references/caption-segmentation.md。
- 换行：references/semantic-line-breaking.md。
- 层级与安全区：references/typography-and-emphasis.md。
- 动态策略与时间门槛：references/dynamic-caption-strategy.md。

## 退出条件

字幕文字、段边界、精度和实际画面一致；没有持续不可读、遮挡或与主视觉抢注意力的问题。
