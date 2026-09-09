---
name: presenter-motion-director
description: 作为人物口播、访谈、课程、教程、数字人主持和 Presenter 混合视频的主要工作流，从源素材和语音主线一直负责到 Remotion、B-roll、字幕、声音、质量与交付。
---

# 人物口播与 Presenter 完整生产工作流

## 这份 Skill 为什么是主工作流

人物口播不是“先把视频拼起来，再每几秒加一个动画”。它的核心优势是人物关系：观众通过脸、目光、声音、停顿、手势和态度判断内容是否可信、是否与自己有关。Remotion、B-roll、字幕、音乐与音效可以帮助理解、证明、具体化，也可以建立注意重音、视觉记忆、情绪和节奏。人物是叙事锚点，不表示每个时刻都必须是唯一视觉重点。

因此 `presenter-motion-director` 不只是人物周围动效的设计师，而是整个人物口播的负责人。它承担 ChatCut `talking-head-guide` 对应角色：识别这次是 Cleanup、Highlight、Restructure、Hook、Target Script、现有数字人组装、声音替换、Motion Finishing 还是从零完整生产；安排 A-roll、声音、人物、Story、视觉、字幕、音频和交付的依赖；调用专项 Skill 后重新收拢结果。

只加载一组平级专项 Skill 不会自动形成工作流。即使尚未打开任何专项 Skill，读完本文件也应知道一条 Presenter 视频从输入到交付怎样完成、每一阶段为何存在、失败后回到哪里。

## 适用范围和边界

适用：真人单人口播、双人或多人访谈中的主讲段、播客视频、课程与教程、数字人主持、产品发布、促销口播、个人经历、读书反思，以及人物贯穿、局部插入 Explainer/B-roll 的混合视频。

不适用：旁白只是导航、认知模型和图表承担主要理解的整片，应由 `visual-explainer-director`；故事主要存在于实拍行动、地点、反应和现场声，应由 `vlog-director`。没有人物画面但用户要求从零生成数字人时，可以由本工作流统领，但实际 Provider 能力交给 `avatar-performance`；当前代码尚无完整 Avatar 生成能力时只做计划或使用用户已提供的人物视频。

## 开始前先判断任务分支

### Cleanup / 内容清理

用户想保留原结构，只去掉口癖、错误重启、长等待和重复。主工作流先调用 `transcription`/`semantic-continuity`，主声音通过后再检查字幕和必要跳切遮盖。不要为了“看起来做了很多”自动加入全套效果。

### Highlight / 精彩片段

从长访谈、课程或播客选择完整观点。要保护问题—回答、例子—结论和说话者身份；视觉包装应服务选中观点，而不是把多个关键词命中片段拼成一条快剪。

### Restructure / 重组

当内容有价值但顺序不清，先重建 Story 和观众问题。重组可能导致大范围声音、字幕和 Effect 失效，因此应在包装前完成。

### Hook / Short Version

为短视频建立真实承诺和更紧的结构。Hook 不等于第一个大数字；它可以是人物直视镜头提出的问题、一个具体结果或真实反差。短版应创建平行版本而不是覆盖长版；当前代码若尚未支持 Sequence，应明确限制。

### Target Script / 对齐文稿

用户给定准确 Script 时，检查源素材是否能真实覆盖。真人 A-roll 无法组成的句子不能跨 Take 拼造；数字人/TTS 可以按最终 Script 生成，但仍需自然 SpeechSegment 和表演计划。

### Existing Avatar Assembly

表演承载力不足时可以由完整解释段承担关系变化，实际素材的构图、手势和 Mask 是硬边界，增加小效果不能修复弱表达。

已有数字人视频和最终声音时，重点是 AudioMode、段间连续、Scene、字幕、前后景和 Cutaway。不要重复调用 OmniVoice 或再次叠加 Dialogue。

若用户要求完整成片，而非仅组装或清理，还要判断源人物的表现承载力：语音韵律、眼神、手势、姿态与构图是否实际提供变化。表演弱、景别固定的素材，需要通过语义重音、对比组织、动机性重构图和声音标点补足表达；不能凭“数字人”一词虚构表情证据，也不能自动套高密度效果。

### Motion Finishing

主线已经稳定，只需要视觉包装。先读取当前 Revision、Story、SpeechTiming、人物状态和已有效果，禁止顺手改 Script。若发现上游语义问题，退回 Gate A，而不是继续用包装遮盖。

## 影响剪辑的关键变量

平台和画幅改变构图与字幕；目标时长改变内容选择而不是只改变播放速度；受众和语气决定解释深度；人物角色决定目光、手势和视觉密度；声音来源决定口型和时间；Style 决定视觉语言但不决定每个 Beat 的效果。“高完成度”既要求真实预览和完整审片，也要求观众实际感知重点、跟随关系、感受节奏并记住结论，不能仅以流程完整代替观看结果。

在开始前应写清：目标平台、画幅、时长、受众、人物角色、主声音来源、是否允许重组、B-roll/Explainer 比例、字幕策略、风格、权利边界和交付目标。只有会实质改变结果的缺失信息才需要询问；其它可以做明确假设并记录。

## 短视频完整制作的专业默认

当任务是数字人或人物知识、观点、读书类短视频的完整制作，或用户希望改善平淡的观看效果时，进入视觉规划前读取 [人物短视频剪辑语法](references/presenter-editing-grammar.md)。这份资料说明语义重音排印、对比调度、动机性重构图、视觉标点、声画重音和密度对比的选择依据与完整案例；不是每条视频必选的效果清单。纯 Cleanup、只换字幕或保留原貌的任务不自动加载整套包装。

先判断这次需要怎样的表达，再检查能否执行。主工作流为高价值 Beat 建立视觉与声音的共同落点，包含观众应发现什么、谁承担重点、人物保留何种作用、音乐/SFX 的动作与释放，以及无效时返回哪一阶段。实现选择交给专项，不要求用户给字号、缓动、音效名或固定频率。

## 总体生产顺序

视觉阶段按完整段交接任务与人物/字幕预算，内部生成代表段、审阅合成后再扩展其它段落；正式字幕和混音继续沿原有链。

```text
项目和素材确认
→ 识别任务分支
→ 转写与语义/A-roll 主线
→ 最终声音与 SpeechTiming
→ StoryBeat / PresenterScene 骨架
→ 人物版本和 AudioMode
→ AttentionCurve / Visual Treatment
→ 素材需求、Remotion、Cutaway
→ Captions
→ Audio Finishing
→ 局部 Preview 与专项修复
→ 五轮审片
→ Draft / Delivery Export
```

这个顺序不是形式主义。下游对象依赖主线的最终内容、时长和语义位置。主线变化后，字幕、声音、EffectCue 和 Cutaway必须按 ImpactReport 重新编译或复核。

## Gate A：主线成立

### Gate A 前的原素材审阅

人物口播不能只从 Transcript 选内容。转写可以帮助定位观点、问题和重录，但两次文字完全相同的 Take，仍可能在准确性、可信感、语气、眼神、手势、呼吸、环境声、可用余量和前后衔接上明显不同。人物承担信任或情绪时，表情和停顿本身就是内容证据；教程和产品演示中，UI、对象和操作画面则可能比人物更重要。

先用 `browse_assets` 确认候选 A-roll，再用 `inspect_asset overview` 了解素材结构。对可能采用的 Take 使用 `range` 查看完整声画；当决定取决于句首句尾、停顿、微表情、手势、跨 Take 切口或人物反应时，再对最小短窗口使用 `dense`。审阅完成后才进入 transcription、semantic-continuity 与 `assemble_presenter_track`。

主工作流对每个高影响 Take 至少记录：为什么选它；另一个 Take 为什么被拒绝；是否为了表演、呼吸或环境声保留了额外余量；切口是否需要 B-roll、CameraPunch、声音桥或保持原样；选择在只听声音、静音看画面和完整声画播放中是否都成立。

个人坦白、读书反思和价值判断通常优先保护人物的眼神、呼吸和停顿；促销或教程可能更重视产品、数字、UI 和动作清晰度。判断来自当前观众任务，而不是固定认为“最后一次重录最好”或“人物超过五秒就应该离开”。

### 源素材和 A-roll

先使用 `asset-import` 将明确 A-roll 进入项目，查看来源、状态、画面和声音。正式组装使用 `assemble_presenter_track`，不要用按素材数量猜 Scene 的兼容 `create_presenter_timeline`。真人口播需要选择完整 Take、自然表情和可用切口；已有数字人段落需要检查角色、姿态和音频是否连续。

### 语义内容

调用 `semantic-continuity` 区分任务模式，建立 SemanticUnit 和最终 Script。人物口播的内容必须先于字幕和视觉。只听声音时，观众应能理解主张、问题、转折、例子和结论，不能有半句、悬空指代、错误重录和统一机械停顿。

### 最终声音

人物表演与动效制作前，用 `manage_sound_plans` 确定段落主声音、旁白重音/停顿、动作功能、音乐走向和留白；计划不替代实际生成音频。实际语音稳定后再核对时长与动作。需要音乐或音效时进入 [sound-asset-sourcing](../sound-asset-sourcing/SKILL.md)（`sound-asset-sourcing`），默认在线取得有限候选与原文件采用依据，再交 audio-finishing 完成合成。人物进入全屏动效再返回时，旁白所有权保持唯一；如果段内演示声音需要被听见，计划明确主导区间，让音乐退让。

真人原声、人物视频自带最终声音、OmniVoice Dialogue 或纯视觉人物必须明确。需要 TTS 时调用 `voice-production`，使用真实 SegmentAsset 时长生成 `segment_exact`。没有 word_exact 时，不把句中每个词当作精确动效锚点。

### Story 与 PresenterScene

StoryBeat 不是每两个视频一组。它应对应一个问题、观点、证据、转折、例子、CTA 或结论。使用 `manage_story` 保存 Beat，再用 `compile_presenter_scenes` 让 A-roll Item 被明确 Scene 覆盖。Scene 边界应跟随认知、人物状态或视觉模式变化，不只跟随素材边界。

### 人物表演

先读回 Project，确认目标 A-roll Item 已归属 PresenterScene，再调用 `avatar-performance` 登记或审查 ActorPerformance。尚未归属 Scene 时先完成 `compile_presenter_scenes`，不能直接重试人物登记。当前实际工具 `manage_actor_performance` 能保存 imported/generated、MaskMode、AudioMode、MaskAsset、SpeechAsset 和 note；自动姿态和手势仍是后续能力。没有 Mask 时，后景穿插不能伪装成立，应降级到左右安全区、前景或 Fullscreen。

Gate A 通过的证据：来源和主线可回溯；Script 与人物/声音版本一致；只听声音成立；A-roll、StoryBeat 和 PresenterScene 有真实关系；包装尚未被用来掩盖问题。

## 人物为什么通常是视觉锚点

人物不仅传递文字。个人坦白时，眼神、呼吸和停顿是真实性证据；专家解释时，人物建立责任和信任；产品主持时，人物提供尺度、指向和行动关系；幽默内容中，反应可能比梗图更重要。因此不能仅因为人物画面持续了五秒，就自动切 B-roll。

离开人物前应判断观众任务是否已经从“相信/感受人物”转为“理解机制、查看证据、观察对象或执行操作”。当人物说“我以前总觉得，只要再赚一点就有资格休息”，如果人物低头停顿，人物本身是主画面；“钱”和“休息”不是自动大数字和海边。下一句转向“为什么以后会不断后退”的机制解释时，才适合让全屏 Remotion Scene 接管。

相反，教程中人物说“点这里打开设置”，真正证据是 UI 操作，人物可以退为旁白或 PiP；促销中说“送出 70 台平板”，数字和产品是承诺内容，可以通过前后景与手势协同增强。视频类型和语义任务共同决定视觉中心。

## Gate B：视觉和声音包装成立

### Visual Treatment 和 AttentionCurve

调用 `visual-treatment-planning`，为每个 Beat 比较保持人物、轻处理、Remotion、证据、B-roll、Cutaway 和安静区；确认后用 `manage_visual_treatment` 写入当前 Revision。整片形成高—中—低—恢复的 AttentionCurve。安静区应被记录为主动决定，例如个人反思、关键结论、高密度后恢复和人物反应。

高密度不等于所有元素一起动。人物做关键手势时，字幕、前景对象、CameraPunch 和音乐重音应退让；一个 Scene 模式切换本身已经是强事件，进入后不应立刻再叠第二个主动作。

同一语义事件的文字揭示、构图变化和短音效可以协同形成一个声画重音；冲突来自各自争夺不同重点或峰值错位，不是“同时出现”本身。安静段要有可观察的表演、阅读或恢复价值；相邻多个转折都只剩相同人物与小字幕时，重新检查表达是否不足。

### 人物层级：Rear、Actor、Front、Fullscreen

Rear FX 适合规模、背景状态、评论环境和章节，但需要可靠 Mask，强度不应压过脸。Actor FX 适合短 Punch、表情落点和有理由的构图变化，不能持续 Zoom 造成不安。Front FX 适合产品、证据、CTA 和封面，需要与手势、视线和空间支撑关系一致。Fullscreen 适合复杂解释、完整证据、UI、现实 B-roll 和强中断，并需要清楚的离开与返回。

### Remotion

当一段内容需要比较、状态变化、关系解释、重点排印或视觉记忆时，把完整观看任务交给 [原创动效专项](../remotion-production/SKILL.md)（`remotion-production`）。输入包括实际旁白范围与精度、相关 Beat、人物构图与可用动作、字幕预算、真实素材、本片视觉语言和前后画面；不要先拆成逐句独立效果清单，也不将 Registry 名称当作既定设计。

段内可以保持人物同屏，也可以让图形接管画面，再返回人物。动效专项先设计关键画面、对象变化和交接，再选择受管原创作品或能够完整实现设计的现有组件。需要独特连续表达的段落直接进入原创作品流程，不要求先找网站参考或遍历组件作为前置门槛。

人物与全屏的选择须由内容和真实构图决定。不能固定每段都执行“人物—全屏—人物”，也不能因为人物是叙事锚点，就将核心图形缩到角落。没有可靠 Mask 或手势证据时，使用可实现的同屏构图与全屏交接，不能假装人物能够把图形拿在手里。

交接主画面控制权时，记录离开人物前的状态、解释段起始状态、关键变化和返回人物的句子/姿态。若连续对象需要贯穿这些阶段，先共同设计其身份、位置和尺度，再按当前 Scene、层级与作品时长约束实施；语义上同一段设计，不代表一个 Cue 已经支持任意跨 Scene。

### 外部素材和 Cutaway

先由 `visual-asset-sourcing` 把明确需求变成本地 Asset，再由 `cutaway-planning` 判断是否值得离开人物、全屏还是 PiP、哪段可用、声音是否延续和何时返回。确认后用 `manage_cutaways` 原子写入 CutawayScene 和顶层播放 Item；单条源素材替换只能使用 `replace_scene_asset`。搜索素材的 Agent不能因为候选相关就决定最终放置。

### 字幕

调用 `captions`。人物动效丰富时默认稳定短句字幕，避免逐字弹跳和主视觉竞争。字幕分卡跟随完整短语，不拆开否定、条件、数字单位和专名。没有 word_exact 时不制作伪精确逐词高亮。

基础字幕承担完整语言，重点排印承担视觉重音，二者分工不等于禁止大字。先决定重点应留在 Caption 中静态强调，还是交给 Remotion 成为独立视觉对象，再由字幕专项保持语言可读。不能为了不重复字幕而删掉动效的语义主体，只留下难以识别的细线或点。

### Audio Finishing

用户允许线上音效时，把 `browse_sound_sources` 与本地音效包一同交给声音专项作为候选，不预选固定提示声。交接到具体 Cue 内的动作（例如标题进入还是结论落定），由 `audio-finishing` 用 effect_event 绑定当前视觉版本；视觉作品换版后读回 stale 音效并重新选音/定位。整片声画 Spotting 不能由“加了几条音轨”代替，须检查每个重点是否实际得到预期强化。

调用 `audio-finishing`，保持 Dialogue 清楚、人物声音唯一，处理 Room Tone、停顿、BGM、SFX 和 Cutaway 的声音连接。音乐不能填满所有空白；个人坦白和关键证据可能需要音乐退出。SFX 绑定视觉或叙事事件，不能给每个动画都加 Whoosh。

声音意图在 Visual Treatment 阶段就与视觉联合 Spotting，混音在稳定画面后收口。给音频专项交付的是事件及其感知落点、希望的音色与包络、后续阅读/语句空间，而不只是“加点音效”。优先审阅用户提供的音效候选，区分预示型、落定型、反应型与连接型功能；同一声音族形成一致语气，变化由事件承担。检查过弱而无感、攻击压字、尾音拖入下一句和重复使用疲劳，不能把低音量当作声音设计完成。

Gate B 通过的证据：高价值 Beat 的重点与声画落点在正常播放中可感知；保持段有成立的观看理由；人物、字幕、视觉和声音主次清楚；当前 Visual Treatment 已落实到有效 Scene/Cue/Caption/Audio，而非仅有计划或 stale 对象；代表性连续段已检查铺垫、动作、阅读和恢复。样段通过后还须扩展并审阅整片，不能把样段或无声作品当作整片完成。

任务恢复或完成一个样段后，重新读当前 Project、未完成 Job、`read_quality_report` 与原 ProductionRun。沿 `productionReconciliation` 检查每拍的计划和明确绑定的有效对象，再结合 `editorial.openFindings`、逐轮 coverage 决定下一步；不能从聊天里“已经到字幕精修”推断视觉和声音都完成。stale 计划、未放置作品与未复核声音都保留为待办，不改称主动留白。既有原声与已完成去重不属于包装返工范围，除非新的真实证据证明主线仍有问题。

先把一个连续代表段做完整，检验构图、重点排印、基础字幕与声音之间的关系，成立后再将同一设计判断贯彻到尚未兑现的 Beat，最后检查整片的重复、密度变化和收束。局部结果通过只返回它覆盖的范围；不因样段好看而关闭后半片的问题。若原素材近景没有可用空间，先在真实样段比较现有布局；只有确定现有能力无法实现所需构图，才向修复任务报告具体能力缺口，不要求用户补专业参数。

## 不同 Presenter 类型的具体策略

### 哲学、读书与个人反思

人物和声音承担信任；认知反转、反问和核心判断可以用鲜明的排印、空间对比与声画标点建立记忆，不需要先变成复杂机制图。真实眼神、呼吸和停顿成立时保护它们；源人物缺少这些变化时，不能用题材标签为单调辩护。B-roll 应是具体生活经验或情绪呼吸，不能“自由=海边、压力=夜景”。音乐与 SFX 的密度来自情绪弧线，可在论证处支持、在坦白处退让、在结论处形成有分寸的落点。全屏与人物同屏的选择由阅读空间和叙事任务决定。

### 促销、产品发布与 CTA

信息密度可以提高，数字、产品、作品墙和 CTA 具备真实任务。人物手势可以与对象协同，但无姿态证据时使用标准安全区。高强度效果应落在真正承诺和行动上，中间仍需人物恢复，避免全片像广告模板。所有产品、评论和作品必须绑定真实 Asset。

### 教程和课程

屏幕、操作和步骤常是主要证据。人物可以作为开场、解释、过渡或 PiP；已登记的 UI、文档或截图素材应在 `ExplainerScene` 或 `CutawayScene` 中呈现，不能把 `DocumentScene` 当作当前可创建类型。字幕不能遮界面；镜头和动画应让观众看到状态变化，不只重复口播。错误反馈和关键按钮要留足阅读时间。

### 访谈和播客

问题和回答关系优先，反应镜头必须真实属于语境。B-roll 不应覆盖重要表情和思考；重组要保护人物知情和问答。多机位能力未实现时，不假装已同步；可以制定切换计划并说明缺口。

### 幽默和吐槽

包袱前保持信息清楚，笑点后短促反应、Punch 或梗图；不要在包袱前用字幕或动效提前泄露。人物表情常是最强反应，FullScreenMeme 只有在真正增强而不是解释笑点时使用。

## 详细工具工作流与读回点

### 1. 项目和素材

先执行 `project-basics`。`browse_assets` 检查人物视频、音频、Mask、VoiceReference、证据和 B-roll 的 Role、状态和来源。新文件通过 `asset-import`。不要让“项目里所有 ready 视频”自动成为主线。

需要转写时 `submit_transcription`，跟踪完成后 `read_script`。人工文稿通过 `apply_manual_transcript` 进入，但仍需要语义判断。每一步记录当前 Revision，异步 Job 本身不改变最终 Script。

### 2. 语义和 Story

`semantic-continuity` 通过 `apply_semantic_units` 和 `apply_script` 形成最终听觉内容。随后 `manage_story` 建立稳定 Beat ID、目的和 SemanticUnit 关系。Beat 的名称不应只是“场景一、场景二”，而要能解释当前任务，例如“旧信念”“书中触发”“以后不断后退”“回到当下”。

### 3. 语音

`manage_voice_references` 登记参考音频；`submit_voice_synthesis` 只生成需要的 Segment；`read_speech_asset` 和 `read_speech_timing` 读回真实时长。若旧项目 Timeline 缺 SpeechAsset，可使用 `rebuild_speech_timeline` 修复，不能重新调用 OmniVoice造成声音变化。

### 4. A-roll 与 Scene

`assemble_presenter_track` 只接收明确 Asset ID。主声音比人物画面短时，可在安全条件下 `align_presenter_to_speech`；该工具拒绝自动改写时必须尊重保护。`compile_presenter_scenes` 使用明确 start/end 和 Beat ID，使每个主画面 Item 被 Scene 覆盖。

### 5. 人物

`manage_actor_performance` 为每个主画面 Item 绑定 source、mask_mode、audio_mode、Mask 和 SpeechAsset。写后 `read_actor_performances` 检查音频所有权和版本。没有人物 Provider 工具时不能调用架构目标接口。

### 6. 视觉和 Remotion

读取完整段、人物与字幕预算，先内部构思并选关键画面。原创链为 `submit_motion_work`（creativeBrief、可选 reference）→ `track_job` / `read_motion_work` / `inspect_asset` → `review_motion_work` → `manage_effect_cues` 绑定固定版本与覆盖 Beat。待审用 inconclusive 放草稿取合成证据；不能只改 Cue Props 试图修改作品内部。设计适合现有组件时直接复用 Registry。每次读回 Revision/Impact，在同版本合成中检查前一句、完整变化和返回人物。

### 7. 预览和质量

`preview_timeline` 查看受影响结构，`render_preview_range` 固定 Revision，`track_job` 等待，`inspect_composed_frames` 取帧。帧之外还要通过 Web 连续播放。`record_creative_decision` 保存关键取舍，`record_editorial_quality_review` 保存五轮审查。

## Effect 选择的具体问题

### MetricBackdrop

数字是否是这一拍观众必须记住的核心？有无单位和比较语境？人物是否仍应是主视觉？如果数字只是铺垫，不使用；如果是里程碑，可后景或全屏。哲学内容中的“更多钱”未必需要具体 Metric。

### ProductFan / PortfolioWall / ContentCarousel

是否有真实素材？观众是需要看数量、类别还是单个细节？多对象应有选择和排序，不是把全部 Asset 堆满。人物是否做了可配合的手势？没有则用安全区或全屏。

### CommentCloud

评论是社会反馈环境、具体证据还是装饰？若需要阅读具体评论，背景云不够；若只是表达“反馈很多”，低对比后景可能适合。虚构评论不可当真实证据。

### EvidenceCard / DeviceShowcase

内容能否在人物旁边读清？复杂页面和操作应 Fullscreen。来源、条件和 UI 状态必须真实。

### CameraPunch / FullScreenMeme

Punch 是否对应人物表情、包袱或结论；Meme 是否在笑点后增强，而不是提前解释。频繁使用会消耗信任。

### GlowCTA / EndCard

观众是否已经知道为什么和怎样行动？CTA 应在行动语句内保持，EndCard 需要收束而不是塞入新信息。

## 人物画面变化与跳切

真人 A-roll 的跳切可以通过选择更好的 Take、适量 Punch、Cutaway 或画面重构处理，但不应每个切点都用 B-roll。数字人段落的姿态重置更明显，可能需要重新生成、在自然语义边界切换 Scene、使用 Fullscreen 解释，或让人物保持标准构图。

当两个 A-roll Clip 景别差异过小、人物位置跳变时，硬切会显得失误；可以改变到明显不同景别、在动作上切、用 Cutaway、或保留一次有意义的 Punch。Transition 通常不是第一解决方案。

## 自主风格设计与可选参考

无参考时根据本片内容、受众和真实人物自主建立排印、色彩、构图尺度与运动语气。有参考时再拆解成视觉密度、人物占比、背景/前景语法、字幕角色、Scene 切换、运动语气和声音结构。不要直接复制其品牌、素材或每秒效果。先用一个代表性 Beat 验证 Style，再批量。

例如参考视频每 2～3 秒变化，但原因可能是信息点密集、人物动作和产品演示；把同样频率应用到哲学口播会错误。复用的是“价值变化触发视觉变化”，不是固定秒数。

## 主线变化后的返工范围

- Script 文本变：相关 SpeechSegment、SpeechAsset、Caption、语义 Effect、Cutaway 和人物可能 stale；
- 只改 Voice 音色：人物口型、Dialogue、Timing 和音频审查受影响，Story不一定变；
- 只换 B-roll：Cutaway Scene、声音交接、Preview 和 Rights受影响；
- 改 Effect Props：目标 Cue、布局和局部 Preview受影响；
- 改全片 Style：多个 Scene 和 Golden 需要复核；
- 改 Story 顺序：主线和全部语义绑定包装可能需要重投影。

不要“为了保险全部重做”，也不要假设下游自动正确。

## 从空项目到交付的示范路线

下列路线中，原创 Remotion 在写 Cue 前必须完成 creativeBrief、`submit_motion_work`、Job/版本读回和 `review_motion_work`；参考可省略。放置后按实际内部事件协调声音，连续播放前后语句，再扩展其余段落。组件 Cue 分支只用于设计可直接复用时。

```text
create_project(profile=presenter_motion)
→ import_media(人物 A-roll / VoiceReference / 必要素材)
→ track_job 并确认 Asset
→ submit_transcription 或 apply_manual_transcript
→ apply_semantic_units / apply_script
→ manage_story
→ manage_voice_references / submit_voice_synthesis
→ read_speech_asset / read_speech_timing
→ assemble_presenter_track
→ compile_presenter_scenes
→ manage_actor_performance
→ manage_visual_treatment，为关键 Beat 写入 Visual Treatment 和安静区
→ 获取/导入真实视觉资产
→ manage_cutaways / replace_scene_asset（仅在 Cutaway 计划成立时）
→ manage_effect_cues
→ Caption 与 Audio 收尾
→ render_preview_range / inspect_composed_frames
→ 五轮审片和修复
→ submit_export(purpose=draft)
→ 最终审片
→ submit_export(purpose=delivery)
```

工具缺失时不能跳过后声称成功；应记录当前走到哪一阶段、哪个项目对象已存在、哪一项只能计划。

## 用户可见的完成报告

报告应以观看结果为中心，而不是列工具：主线做了哪些删改、声音来源、哪些 Beat 保持人物、哪些使用解释/B-roll、为什么拒绝了哪些效果、当前质量问题、最终 Revision 和 Artifact。内部 ID 只在需要定位时提供。

## 局部 Preview 和五轮审片

每个重要视觉处理先渲染受影响范围，检查进入前、运动中、Settled、退出和人物返回。随后由 `quality-verification` 完成 audio_only、mute_visual、audiovisual、first_viewer 和 Presenter mode_specific。问题返回对应阶段，不从头全部重做。

完整声画审片要看：开头承诺是否清楚；中段信息和视觉是否有变化；安静区是否真实；效果是否重复；人物是否仍是关系中心；结尾是否兑现并给 CTA 足够时间。

## Gate C：交付

先确保当前 Revision 的 Project Graph、Preview Evidence 和 EditorialReview 完整。可以先由 `export` 生成 draft 做最终审片；delivery 必须固定 Revision 并通过当前代码的门禁。导出文件存在后仍需解码、时长、音轨和黑帧检查，批准绑定具体 Artifact。

## 专项交接总表

MG 交回设计依据、固定作品版本、覆盖 Beat、局部事件帧、入口/出口状态、当前证据和限制。人物同屏或全屏接管由内容与真实构图决定，不固定交替比例。

| 阶段 | 调用 Skill | 主工作流应接收什么 |
|---|---|---|
| 素材 | asset-import / transcription | 就绪 Asset、Transcript、失败和精度 |
| 内容 | semantic-continuity | SemanticUnit、Script、停顿、Impact |
| 声音 | voice-production | SpeechAsset、segment_exact、听感结论 |
| 人物 | avatar-performance | ActorPerformance、AudioMode、Mask 与降级 |
| 视觉计划 | visual-treatment-planning | 每 Beat Treatment、AttentionCurve、安静区 |
| 素材缺口 | visual-asset-sourcing | 本地 Asset、来源、候选取舍 |
| MG | remotion-production | Scene/EffectCue、Props、Preview Evidence |
| Cutaway | cutaway-planning | 使用范围、模式、声音、返回策略 |
| 字幕 | captions | Caption Program、布局和精度 |
| 声音收尾 | audio-finishing | Dialogue/BGM/SFX 关系和试听结论 |
| 质量 | quality-verification | Findings、负责人、通过/阻塞 |

## 常见失败

- 同时加载所有专项 Skill，却没有主流程决定顺序；
- 使用兼容 Timeline Builder 按素材数量猜 Scene；
- 主线没通过就开始堆效果；
- 所有 Script 使用同一组 11 种 Effect；
- 无 Mask 仍承诺 behind_actor；
- B-roll 只匹配关键词；
- 人物原声与 Dialogue 同时播放；
- 字幕、手势、产品和 CameraPunch 同时成为主动作；
- 局部 Preview 正确就宣布整片完成；
- `loadedSkills` 代替实际交接和项目对象。

## 完成标准

本工作流完成时，A-roll/Script/声音/人物版本一致；StoryBeat 与 PresenterScene 有真实关系；每个重要 Beat 有保持或处理决定；安静区存在；视觉和声音经过真实预览；五轮审片通过；质量问题已修复或明确接受；Delivery 绑定当前 Artifact。

## 可选完整案例

更多哲学口播、促销、教程、访谈和幽默案例见 `references/talking-head-casebook.md`。
