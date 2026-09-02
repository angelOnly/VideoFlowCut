---
name: quality-verification
description: 读取当前 Revision 的项目结构、真实 Preview、最终 Artifact 和视频类型规则，执行五轮审片、定位根因、分派修复并决定 draft/delivery 是否允许；不把工具成功或单帧正确当作成片通过。
---

# 质量验证、根因诊断与交付门禁

## Quality 不是最后打分

质量验证贯穿专项交接和最终交付。它既要检查确定性错误，也要解释真实观看证据，并把问题退回正确负责人。一个 EffectCue 存在、Remotion 渲染成功、MP4 可播放，都不说明观众理解、节奏和审美成立。

`quality-verification` 不直接代替 Director 决定如何创作，也不靠模型想象画面。它读取当前 Revision、Project Graph、Preview、合成帧、声音和最终 Artifact；没有看过的范围写 inconclusive。

## 四级证据

### 项目结构

读回 Story、Scene、Timeline、Caption、EffectCue、Speech、Actor、Asset、Revision 和 Impact，检查引用和状态。当前 `validate_project_graph` 与 `read_quality_report` 提供确定性证据。

### 局部真实合成

`render_preview_range` 产生固定 Revision 的 Preview，`inspect_composed_frames` 抽取帧并记录检查。还需要连续播放，单张图不能检查运动、时机和听感。

### 最终 Artifact

导出文件要验证解码、时长、画幅、音轨、黑帧、缺帧、哈希和目标 Revision。Job succeeded 只是候选文件产生。

### 完整声画审片

整片的语义、节奏、注意力、声音、视觉、模式切换、开头承诺和结尾兑现需要完整播放。用户批准绑定具体 Artifact。

## 五轮审片

### audio_only

闭眼听。检查残句、错读、段间拼接、音量、Room Tone、呼吸、音乐结构、SFX 和静音。若声音本身不成立，不应用画面分散注意力。

### mute_visual

静音看。检查第一注意目标、Scene 理解、人物、字幕、证据、动效密度、遮挡、重复和 PPT 感。看不懂视觉不一定是失败，但若视觉声称承担解释任务，就必须在静音下基本可追随。

### audiovisual

声画一起看。检查语义落点、人物手势、字幕换卡、B-roll 进入、SFX onset、音乐和 Scene 交接是否一致。声和画各自正确却互相竞争，也是问题。

### first_viewer

像第一次看一样判断：前三秒为什么继续；当前问题是否清楚；哪里迷失；哪些信息被提前泄露；结尾是否回答和留下记忆；CTA 是否有理由。

### mode_specific

Presenter 检查人物信任、安静区、前后景、Cutaway 和字幕；Explainer 检查认知任务、渐进、证据和数据；Vlog 检查事件、动作、空间、反应和现场声。详细规则见 `references/mode-specific-rubrics.md`。

## 严重级别与问题写法

blocking 包括事实/权利错误、严重语义断裂、重复人声、关键内容遮挡、黑帧、缺音轨、错误 Revision 和 Delivery 缺审片；major 显著损害理解、节奏或完成度；minor 是局部问题；suggestion 是可选尝试；inconclusive 表示证据不足。

每条问题写可观察证据、观看影响、可能根因、对象/范围、建议修复和复核方法。不要只写“节奏不好、画面不高级”。

## 根因而不是症状

用户说“12 秒无聊”，原因可能在 8 秒时观众问题已经回答，或主声音重复，或全片视觉同一密度。解决不一定是在 12 秒加动画。先比较：删减内容、提前转折、改变 Scene、增加现实证据、调整音乐、保留人物或添加效果。

问题分派：语义回 semantic-continuity；声音生成回 voice-production；人物回 avatar-performance；视觉计划回 visual-treatment-planning；MG 回 remotion-production；B-roll 回 cutaway/asset sourcing；字幕回 captions；音频回 audio-finishing；整片结构回主要工作流。

## A/B/不使用

高影响视觉和声音问题应比较当前、最小修复和不使用。只要删除效果后更清楚，就不应因为已经开发了组件而保留。质量系统不以效果数量和覆盖率为分数。

## 确定性技术检查矩阵

| 域 | 需要检查的事实 | 典型负责人 |
|---|---|---|
| Project Graph | Story、Scene、Item、Cue、Caption、Speech、Actor 是否悬空 | Application / project-basics |
| 时间 | start/end、Scene 边界、局部时间、SpeechTiming 精度 | effect-timing / Application |
| Asset | 文件、Hash、元数据、可解码、Binding、来源 | asset-import / sourcing |
| 权利 | rightsStatus、署名、生成/证据区分 | sourcing / evidence / export |
| 人物 | AudioMode、Mask、Speech/Script 版本 | avatar-performance |
| 字幕 | 文本一致、时序、越界、画幅 | captions |
| Remotion | Registry、Props、Asset、字体、Player/Render | remotion-production |
| 音频 | Dialogue 唯一、音轨、缺音、头尾 | audio-finishing / export |
| Artifact | Revision、时长、画幅、音轨、黑帧、哈希 | export |

Quality Skill 应读取这些结果，但不能把可由代码确定的错误全推给视觉模型。

## Presenter 质量的深入问题

- 观众是在听一个人说话，还是在观看模板不断覆盖人物？
- 人物的表情、停顿和手势是否被当作证据；
- 视觉离开人物时是否发生了观看任务变化；
- 哲学、促销、教程和访谈是否得到不同 Treatment；
- 安静区是否真实存在，是否只是在没有实现效果时被动空白；
- B-roll 是解释/证明/具体化还是关键词联想；
- 前后景是否依赖真实 Mask；
- 字幕、人物和 Effect 是否有清楚第一重点；
- 主声音版本、口型和 AudioMode 是否一致。

## Explainer 质量的深入问题

- 观众能否在每个 Scene 结束时复述新建立的模型；
- 对象是否持续、关系是否渐进；
- 画面是否只把旁白换成卡片文字；
- 证据是否在来源环境中展示，限定是否完整；
- 数据比例、坐标和基线是否诚实；
- 现实 B-roll 是否让机制落地，而不是装饰；
- Scene 切换是否来自任务改变，而不是句号。

## Vlog 质量的深入问题

- 事件是否有目标、行动、变化、结果和反应；
- Shot 功能是否重复；
- 动作、方向、时间和空间是否可跟随；
- 环境声是否建立现场；
- 音乐是否把所有素材变成 MV；
- 外部素材是否被误认为用户拍摄；
- 长镜头和 Montage 是否由事件决定。

## 修复优先级

先修事实、权利、语义和声音；再修 Story/Scene 和主视觉；再修字幕、B-roll、Motion 和混音；最后才是小材质和 suggestion。若上游改变导致下游 stale，应重新生成/复核，而不是只修表面症状。

## Review 的版本约束

EditorialReview 只适用于它绑定的 Revision。新 Revision 即使只改一个 Cue，也至少需要重新检查 Dirty Range；如果改变 Style、主声音、Story、Scene 长度或音乐结构，还需要更大范围甚至整片。旧 Artifact 的 Review 不能自动用于新导出。

## 无法判断时

证据不足使用 inconclusive，并写需要的最小补充：哪一段连续播放、哪一个源素材范围、是否要听声音、是否要查看横/竖版或最终文件。不要为了“完整”重复分析整片，也不要在未看时写通过。

## 当前工具流程

整片任务通常已有 ProductionRun。通过 `read_quality_report` 查看技术问题，渲染/检查 Preview，随后使用 `record_editorial_quality_review` 提交五个 Pass、Preview Evidence 和 Findings。修复后生成新 Revision，旧 Review 不自动适用于新版本；需要重新检查受影响范围和必要整片。

`complete_production_run` 固定最终 Revision 和审计，但不能代替 Delivery Gate。当前导出代码会为 delivery 要求同一 Revision 的 Preview Evidence、audiovisual 和 first_viewer 审查。

## 自动修订的边界

允许有限循环：发现 blocking/major → 返回负责人 → 修复 → 局部复核 → 必要整片。不要无限追求所有 suggestion，也不要通过删除 Issue 或降低严重级别宣布完成。涉及用户风格偏好且多个方案都成立时，给出清楚取舍供用户决定。

## 交接合同

输入是当前 Revision、结构、Preview、Artifact 和模式规则。输出是 Findings、负责人、必须修复项、通过/阻塞、复核范围和 Delivery 建议。它可能使 Export Gate 阻塞。验证本身就是四级证据和五轮审片。
