---
name: captions
description: Create and revise captions as a semantic, typographic, timing, and attention system. Use for speech captions, dynamic keyword emphasis, titles, and caption-safe integration with presenter or explainer visuals.
---


# 字幕、换行与文字层级

## 角色

本 Skill 为最终屏幕文字负责。字幕不是 ASR 文本直接贴上去，也不是所有视频都应该逐字跳动。它协调语义切分、时间精度、可读性、人物/动效冲突和 StylePack。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 生成或修改字幕。
- 需要动态关键词、金句或标题。
- Script、SpeechAsset 或画幅变化后重排字幕。
- 需要检查字幕与人物/MG 安全区。

## 何时不使用

- 只修正源 Transcript，尚未决定最终屏幕文字。
- 纯无对白段不需要字幕。

## 前置读取

- 最终 Script、SpeechTiming 精度和 CaptionProgram。
- 目标平台、画幅、StylePack、人物和视觉布局。
- 当前 Scene 的视觉密度和 AttentionCurve。

## 必须掌握的证据

- 字幕文案、语义短语、段级或词级时间。
- 阅读速度、行数、字符长度和屏幕停留。
- 人物脸、嘴、手、UI 和 MG 区域。
- 语言、标点、专名和强调词。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众需要读完整句还是抓关键词？
- 应按语义短语还是逐词显示？
- 换行是否保留语义单元？
- 当前主视觉是否已经足够动态？
- 哪些词值得强调，强调是否改变含义？
- 字幕是否在移动、切换或消失时仍可读？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 区分四类问题

- 文案准确性；
- 时间准确性；
- Caption Card 切分；
- 视觉样式和布局。

不要用改样式解决文案错误，也不要改 Transcript 代替最终字幕修订。

### 2. 选择字幕模式

#### 稳定短句

适合视觉解释片、人物周围动效丰富、证据阅读。

#### 短语级动态

适合普通人物口播，segment_exact 可支持。

#### 逐词高亮

只在真实 word_exact 存在且视觉画面相对克制时使用。

#### 重点句排印

少量 Hook、金句或结论，作为独立视觉事件。

### 3. 语义切分

Caption Card 应尽量保持：

- 短语完整；
- 修饰关系；
- 数字与单位；
- 否定结构；
- 人名和头衔；
- 并列项。

换行不能把意义拆坏。

### 4. 阅读时间

根据：

- 文字长度；
- 语言；
- 复杂度；
- 主视觉；
- 画幅；
- 是否同时有动作；

决定停留。复杂证据段字幕应更短更稳。

### 5. 视觉层级

控制：

- 字号；
- 行数；
- 对比；
- 字重；
- 颜色；
- 背景；
- 安全区；
- 关键词强调。

强调必须稀缺，不能每句多个彩色词。

### 6. 与画面协同

人物动效丰富时优先稳定字幕；字幕需要成为主视觉时，其他图形减弱。

### 7. 全片检查

检查换行重复、跳动频率、视觉疲劳、字幕丢失和前后风格。

## 禁止行为

- 把 ASR 分块直接当字幕卡。
- 没有 word_exact 却逐词高亮。
- 所有关键词放大或变色。
- 换行拆开数字和单位、否定结构或专名。
- 字幕与 MG 同时高动态。
- 字号缩小来容纳过长句。
- 只看静态截图不播放。

## 验证

- 文案与最终 Script 一致。
- 时间精度声明正确。
- 换行语义完整。
- 目标设备可读。
- 人物、平台 UI 和 MG 不遮挡。
- 完整播放无频繁闪烁和视觉疲劳。

## 退出条件

- CaptionProgram 可读、可编辑、可追溯。
- 字幕模式符合视频类型和视觉密度。
- blocking 级可读性和时序问题为零。

## 按需读取的专业参考

- `references/caption-segmentation.md`：字幕卡切分、语义短语和阅读时间。
- `references/semantic-line-breaking.md`：中文换行、数字、否定、专名和列表。
- `references/typography-and-emphasis.md`：层级、对比、关键词强调和安全区。
- `references/dynamic-caption-strategy.md`：稳定、短语级、逐词和重点排印的选择。
