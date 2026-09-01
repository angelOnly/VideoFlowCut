# 项目对象模型

## Asset

来源媒体或生成媒体。Asset 不等于 Timeline 中的一次使用。

## Transcript

源音频说了什么。可能存在识别错误，不等于最终 Script。

## SemanticUnit / Story

观众最终需要理解的内容、顺序和关系。

## Scene

一段内容如何被看见。Scene 可以包含多个 Timeline Item 和 MotionCue。

## Timeline Item

某个 Asset、Scene 输出或图形在最终成片的一次放置。

## CaptionProgram

最终屏幕显示的字幕。它不等于 Transcript，也不等于 Script 原文。

## EffectCue / MotionCue

具有明确叙事目的和语义锚点的视觉事件，不是任意贴纸。

## Preview

某个 Revision 的真实合成结果或范围缓存。不是项目唯一事实。

## ExportArtifact

固定 Revision 的交付文件。导出不会把项目压平成不可编辑状态。

## 修改层级原则

尽量在最接近用户意图的层级修改：

- “删掉这句” → Script；
- “这段换成对比动画” → Scene；
- “这个数字再往左一点” → EffectCue；
- “这段声音淡入” → Audio Item；
- “重新导出” → Export，不修改创作状态。
