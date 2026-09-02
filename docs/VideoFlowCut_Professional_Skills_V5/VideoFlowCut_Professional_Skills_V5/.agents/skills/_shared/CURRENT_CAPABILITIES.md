# 当前代码能力基线与架构目标

本文用于防止 Skill 把架构目标误写成已实现功能。基线为 `VideoFlowCut main@713821ebb7c32abeffc286e07506a806e6c6f287`。每次执行仍必须读取实时 MCP 工具描述；本文件只是审阅与降级依据，不是永久 Schema。

## 当前已经存在的核心能力

### Project、Revision 与项目对象

当前 MCP 已经提供项目创建、定位、读取、Story、Revision 列表和回退、ImpactReport、Web 定位链接以及 Project Graph 校验。所有写入仍应以当前 `base_revision_id` 为并发边界。当前 Project 只有默认 Timeline/Sequence 的实现基础；架构中的多平行 Sequence 仍属于后续能力，不能在 Skill 中假装已经可创建和切换。

### 素材与来源

当前代码支持本地媒体复制到受管目录、哈希去重、媒体分析 Job、AssetRole、标签与 AssetProvenance。可登记的来源包括本地、生成和 Provider；权利状态包括 unknown、cleared、attribution_required、restricted、rejected。当前尚未实现架构中的 Provider Registry、AssetRequest、Candidate Ranker、Pexels/Pixabay/Web Evidence/MiniMax 自动候选链，因此 `visual-asset-sourcing` 当前主要用于形成严格需求、审查已取得候选和明确缺口，不能声称自动联网流程已完成。

### 转写、语义与 Script

当前 FunASR 经 ComfyUI Bridge 提交，输出全文 TranscriptText。项目会产生 TranscriptSentenceCandidate，但这些候选只有在 `apply_semantic_units` 后才成为 SemanticUnit，并进一步生成 SpeechSegment。当前 SemanticUnit 已支持 statement、question、answer、cause、conclusion、contrast、list_item、setup、payoff、retake、intentional_repetition，以及依赖、上下文、重录组、置信度和带理由的前置停顿。

### VoiceReference、OmniVoice 与段级时序

当前可将已就绪本地音频登记为 VoiceReference，再按 SpeechSegment 调用 OmniVoice。SpeechAsset 由真实输出时长组装，并保存 `segment_exact`。系统不具备真实 `word_exact`，Skill 不得按字数、字符或标点平均分配时间来伪造逐词同步。

### Presenter 主线与人物表演

当前正式路径是：

```text
assemble_presenter_track
→ manage_story
→ compile_presenter_scenes
→ manage_actor_performance
```

`create_presenter_timeline` 只是兼容旧客户端的临时分组入口，正式创作不得默认使用。ActorPerformance 已能记录 imported/generated、Mask 模式、人物原声/Dialogue/静音的音频所有权、Mask Asset 和 SpeechAsset 关系。自动 Avatar Provider、自动 Mask、姿态、目光和手部锚点尚未落地。

### EffectCue 与 Remotion

当前 Effect Registry 包含：MetricBackdrop、ProductFan、GlowCTA、PortfolioWall、CommentCloud、EvidenceCard、CameraPunch、FullScreenMeme、DeviceShowcase、ContentCarousel、EndCard。

EffectCue 已支持叙事目的、观众任务、语义锚点、空间锚点、真实 AssetBinding、任意 JSON Props、进入/稳定/退出 Motion 参数、StylePack ID 和枚举化质量规则。不要再写“EffectCue 没有 Props 或外部素材绑定”。但 SpatialAnchor、MotionPreset 和 StylePack 对 Runtime 的消费仍不完整，复杂布局和运动必须以真实 Preview 为准，不能因为字段存在就声称组件已经理解人物姿态。

### Preview、质量和导出

当前可以固定 Revision 渲染局部预览，从成功 Preview 中抽取合成帧，并将该检查记录为 Preview Evidence。ProductionRun 可以记录实际加载的 Skills、创作决定、替代方案、安静区、MCP 命令和审片结果。EditorialQualityReview 要求 audio_only、mute_visual、audiovisual、first_viewer、mode_specific 五轮证据。

导出已经区分 `draft` 与 `delivery`。Delivery 必须关联目标 Revision 的真实 Preview 与 Editorial Review；Remotion 失败不会静默交付只含 A-roll 的 FFmpeg 降级文件。

## 当前部分实现

- Web 工作台已经具备基础素材、文字稿、Preview、Timeline 和 Inspector，但尚未达到架构文档中的全部候选搜索、来源、Sequence 和完整音频面板能力。
- Caption 当前主要是稳定段级字幕，精细 Card、Span、Kinetic Caption 和逐词强调尚未完整实现。
- BGM、SFX、Ducking、Room Tone、J/L Cut 和完整 Audio Finishing 主要处于专业计划或部分代码阶段。
- ExplainerScene、VlogMontageScene 在类型上存在，但完整 NarrativeMap、Scene Grammar、镜头分析、事件聚类和自动编译尚未完成。
- Cutaway 和外部 B-roll 的领域意图可以规划，自动搜索、候选、Acquire、精准裁切和声音交接链尚未完整实现。

## 架构目标但当前未完成

- `visual-asset-sourcing` 对应的 AssetRequest → SearchIntent → Candidate → Acquire → Provenance 自动链；
- 完整多 Sequence / Timeline Variant；
- 自动数字人 Provider、Mask、姿态、手部和目光；
- 完整 Explainer Scene Registry 与证据渲染；
- Vlog Shot Analysis、Event Map、Shot Selects 与多机位；
- 任意安全代码型 Remotion Scene；
- Shader Asset / WebGL/GLSL Runtime；
- 真实 word_exact 或强制对齐；
- 完整 BGM/SFX/混音执行。

## 使用原则

Skill 正文可以详细说明专业方法，但执行段必须遵守三个词：

- **可执行**：工具和对象真实存在，写入后必须读回；
- **可规划**：专业判断成立，但当前没有确定性写入能力；
- **需验证**：数据字段存在，但 Runtime 是否正确消费必须由真实声画证据确认。
