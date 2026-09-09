---
name: quality-verification
description: 读取当前 Revision 的项目结构、真实 Preview、最终 Artifact 和视频类型规则，执行五轮审片、定位根因、分派修复并决定 draft/delivery 是否允许；不把工具成功或单帧正确当作成片通过。
---

# 质量验证、根因诊断与交付门禁

## Quality 不是最后打分

质量验证贯穿专项交接和最终交付。它既要检查确定性错误，也要解释真实观看证据，并把问题退回正确负责人。一个 EffectCue 存在、Remotion 渲染成功、MP4 可播放，都不说明观众理解、节奏和审美成立。

`quality-verification` 不直接代替 Director 决定如何创作，也不靠模型想象画面。它读取当前 Revision、Project Graph、Preview、合成帧、声音和最终 Artifact；没有看过的范围写 inconclusive。

原声裁剪会保留 `disabled` 的旧 Timeline Item 和 `stale` 的人物表演作为审计记录。这些记录不参与合成，不要求为了交付重新绑定、补 Mask 或伪改为 ready；有效片段仍接受完整人物质量检查，重新启用旧片段也会恢复检查。引用的 Item 真正丢失仍是图结构错误。若禁用审计记录仍触发人物 blocking，应报告平台问题，不通过修改旧记录或权限消除提示。

## 四级证据

### 项目结构

读回 Story、Scene、Timeline、Caption、EffectCue、Speech、Actor、Asset、Revision 和 Impact，检查引用和状态。当前 `validate_project_graph` 与 `read_quality_report` 提供确定性证据。

### 局部真实合成

原创作品的审阅依据是当前内容、创作说明、实际素材与可观察输出。分别判断“设计是否值得采用”和“输出是否实现设计”。同一模型写出的设计说明，不构成效果通过的证据；渲染成功、语义覆盖完整、审阅字段齐全也不构成审美通过。

Presenter 检查人物与图形是否有明确主次交换，同屏和全屏的选择是否有内容理由，返回人物时语句、姿态与视觉尾部是否衔接。Explainer 检查对象身份、比较基线与关系推进是否可跟随，来源阅读与图解/实拍切换是否保持理解。两类都检查重复构图、视觉尺度、运动轻重、停留与声音落点，不以动效数量或始终运动为目标。

一份作品覆盖多个 Beat 时，对账接受合法的显式覆盖关系；专业审阅仍需要看作品是否实际处理了这些内容。时间覆盖和共同 Scene 不能代替内容兑现。只看完一个代表段，不能关闭其它段落或新 Revision 的问题。

根据已确认方向进行必要修改是正常内部流程，不默认要求用户逐段审批。已有重大问题应修复并复核；可选建议不导致无限重渲染。超出当前能力或感知证据不足时保留具体阻断/未知，报告已完成的可检验范围，不能降低严重级别或虚报观看结果来收口。

`render_preview_range` 产生固定 Revision 的 Preview，`inspect_composed_frames` 抽取帧并记录检查；frames 每次最多 12 帧，更多关键帧分批只读检查。宿主把 Schema 简写成 Array<number> 时仍须遵守此上限。还需要连续播放，单张图不能检查运动、时机和听感。

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

图形不能说明关系或比喻误导：退回 Remotion 构思，任务错误回 Treatment。静帧小散平：重做主体尺度与排印构图。静帧成立但动态跳变/争抢：改运动与 event timing。独立成立而合成失败：主流程协调人物、空间、字幕、Cutaway 与声音，观看问题范围前后完整语句复核。

用户说“12 秒无聊”，原因可能在 8 秒时观众问题已经回答，或主声音重复，或全片视觉同一密度。解决不一定是在 12 秒加动画。先比较：删减内容、提前转折、改变 Scene、增加现实证据、调整音乐、保留人物或添加效果。

问题分派：语义回 semantic-continuity；声音生成回 voice-production；人物回 avatar-performance；视觉计划回 visual-treatment-planning；MG 回 remotion-production；B-roll 回 cutaway/asset sourcing；字幕回 captions；音频回 audio-finishing；整片结构回主要工作流。

## A/B/不使用

`preview_sound_alternatives` 固定当前段落与旁白，比较少量方案及无该音效；候选比较不替代正式混合证据。正式 Preview 成功后通过 `review_sound_mix` 保存真实听审/声画复核，系统校验当前依赖签名、实际文件哈希与覆盖；改稿后旧结果失效。最终 Artifact 完整解码并测量 LUFS、true peak、静音区间；技术达标与是否遮蔽旁白分别判断。没有听觉输入的结论保持 inconclusive，不把模型或测试模拟的 passed 写成真实效果验收。

高影响视觉和声音问题应比较当前、最小修复、更强处理或不使用。比较理解、注意、记忆、情绪和节奏，以及阅读、表演与连续性的代价；删除效果后事实信息没变，不代表效果没有价值。实际收益不足或代价更大时重新设计或取消，不因为已开发而保留，也不因为最少处理最容易通过技术校验就默认采用。质量系统不以效果数量和覆盖率为分数。

## 表现不足与未兑现计划

对于完整制作的短视频，正常速度与目标观看尺寸下，重点是否自然进入注意、转折是否被感知、对比是否可追随、结论是否留下记忆，与不挡脸、无错误同样需要检查。连续多个高价值 Beat 只有同样的大近景与基础字幕，人物表演也没有承担变化；核心图形必须暂停放大才能识别；对比只是两个文本框但关系仍靠朗读；或音效在独奏时存在、混入 Dialogue 后没有可感知作用，均是具体失败线索。结合任务目标与实际范围判断 major/minor，不按动画数量自动定级。

安静区的理由必须由真实表演、阅读或前后密度对比支持。对当前重要 Beat 对账 VisualTreatment 与实际有效 Scene、EffectCue、Caption、Audio：计划未放置、对象 stale、Job 未完成或工具阻断不能计为主动留白。保留合法 disabled/stale 历史审计记录，不要求清空历史；检查的是当前承诺有没有被有效对象兑现。

声音审查分别核实功能、音色/包络、可听起音、主攻击落点、尾音释放、对白遮蔽与重复疲劳。可测音轨和波形不替代听感；没有音频输入时对这些听觉结论写 inconclusive，并保留需要复听的范围。不能以无声动效代理通过，代表整段声画已经通过。

代表段必须包含铺垫、主要事件、阅读与恢复，再检查放入整片后的分布。短样段通过只支持该范围，不覆盖全片、后续 Revision 或最终导出。用户普通观感要求由导演转成专业验收，用户不需要逐项补充字号、缓动或音效参数。

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
- 在需要强调的 Beat 上，排印、构图与声音是否足够可感知，而非一律退让；
- 数字人物是否根据实际表演承载力获得适当 Treatment，而非借用不存在的眼神/手势；
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

音效与动效关联的检查分两层：结构上读 AudioCue.effectEvent、对应 Cue、localFrame、syncOffsetFrames、作品版本签名及实际 Item；听感上复核选中的动作是否正是需要强化的动作、攻击是否相合、尾音是否干扰下一句。纯平移自动跟随不代表混音仍成立，stale 声音被停用也不代表原声音需求已兑现。源文件、动作前后语境和完整混合声画需要分别检查；检测指标或外部模型描述只作为辅助证据，未实际完成相应感知输入时仍保留 inconclusive。

EditorialReview 只适用于它绑定的 Revision。新 Revision 即使只改一个 Cue，也至少需要重新检查 Dirty Range；如果改变 Style、主声音、Story、Scene 长度或音乐结构，还需要更大范围甚至整片。旧 Artifact 的 Review 不能自动用于新导出。

## 无法判断时

证据不足使用 inconclusive，并写需要的最小补充：哪一段连续播放、哪一个源素材范围、是否要听声音、是否要查看横/竖版或最终文件。不要为了“完整”重复分析整片，也不要在未看时写通过。

## 当前工具流程

整片任务通常已有 ProductionRun。先读 `read_quality_report` 的 `productionReconciliation`、`editorial.openFindings` 和 `editorial.coverage`：分别回答计划有没有实际对象、旧问题是否仍待修、哪些范围还没以正确方式审过。对账里的场景音效/字幕只是实际使用线索，共用长 Scene 不能证明每拍都已实施；对象关联完整也不能证明设计兑现，需要回到观看结果。

`record_editorial_quality_review` 可以只提交本阶段实际执行的一个或多个 Pass，不必为了保存一个局部发现虚填五轮。`observations` 逐条写成功 Preview Job、成片 start/end（end 排他）、pass、method 与实际观察，服务端验证版本、文件哈希、真实时长和音轨。frames 只支持静态观察；audio_only 使用 audio，mute_visual 使用 continuous_video，其余轮次使用 audiovisual。播放器启动、音轨存在、波形或 Contact Sheet 都不证明模型真正看过、听过；没有对应感知输入，记录具体范围的 inconclusive，继续可验证的专项，不虚报该轮。

问题保存后使用返回的 Finding ID 持续跟进。新 Revision 或新 Run 不会清除旧问题；空 findings 只是没有新增发现。修复后先登记当前范围的新观察，再用 `resolutions` 引用返回的 evidenceIds，说明怎样复核原问题。跨版本复核跟随当前对象范围；未关联可定位对象时要求整片，不能任选一小段关闭旧问题。关闭保留原始发现，文件丢失或替换会使对应证据和关闭资格失效。

`complete_production_run` 和 delivery 要求当前 Revision 的五轮连续审阅覆盖完整时间线，first_viewer 必须一次连续看完整片；阶段证据可累积，但抽帧、旧版、局部范围和自由文字不补足全片门禁。未关闭的 blocking、major、inconclusive 阻挡收口，仍允许编辑和草稿预览。只改局部时先验证局部；准备最终收口再做当前版本的整片审阅。最终 Artifact 仍须独立复核和批准，不以 ProductionRun 代替交付。

## 自动修订的边界

允许有限循环：发现 blocking/major → 返回负责人 → 修复 → 局部复核 → 必要整片。不要无限追求所有 suggestion，也不要通过删除 Issue 或降低严重级别宣布完成。涉及用户风格偏好且多个方案都成立时，给出清楚取舍供用户决定。

## 交接合同

输入是当前 Revision、结构、Preview、Artifact 和模式规则。输出是 Findings、负责人、必须修复项、通过/阻塞、复核范围和 Delivery 建议。它可能使 Export Gate 阻塞。验证本身就是四级证据和五轮审片。

## 源素材选择质量审查

质量复核除了检查项目结构、渲染和字幕，还要回到具体源素材选择。对高影响范围检查：选中的口播 Take 是否比被拒绝候选更适合当前观众承诺；是否截断完整思想、动作准备、结果或反应；B-roll 是否真实支持当前 Beat，而非只命中关键词；Vlog Event 是否来自实际动作与现场声；Explainer 证据是否保留来源、条件和限制；Avatar 段是否通过实际口型与连续性检查。

这类问题不使用统一审美总分。Finding 要引用 Project 对象、Asset、源范围、成片范围和可观察证据，并把修复退回正确负责人。若问题来自选错 Take，应退回 Presenter/Vlog 主工作流；若来自 Cutaway 使用方式，退回 cutaway-planning；若来自信息模型，退回 VisualTreatment 或 Explainer Scene；若来自声音处理，退回 audio-finishing。

最终继续使用五轮审片：只听声音、静音看画面、完整声画、首次观众、交付文件。Contact Sheet、单帧、技术测试和质量规则只能帮助定位，不能替代连续观看和真实听感。
