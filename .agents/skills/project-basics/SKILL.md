---
name: project-basics
description: 在任何 VideoFlowCut 项目读写前建立完整运行合同：发现 MCP、定位 Project/Timeline/Revision、理解对象边界、处理并发与结果未知，并把结构、预览、最终文件和交付状态分开。
---

# 项目基础与 Revision 安全

## 这份 Skill 解决什么

`project-basics` 是所有 VideoFlowCut 任务的共同入口。它不负责决定视频要不要加 B-roll、字幕应该什么颜色，也不负责选择人物口播还是 Vlog；它负责保证后续任何专业判断都落在正确的 Project、正确的 Timeline/Sequence、正确的 Revision 和正确的领域对象上。

在视频系统里，“看起来像同一件事”的对象往往不在同一层。用户说“把这句话删掉”，可能需要修改 SemanticUnit 和 Script，而不是直接剪掉一个 Timeline Item；用户说“这个效果往后一点”，可能只改 EffectCue，也可能因为它绑定一个语义落点而应该由上游重新投影。只要对象选错，后续 ImpactReport、局部预览和质量检查就会失去意义。因此，本 Skill 的核心不是记住一串工具名，而是建立可靠的项目认知。

## 启动与项目定位

先确认 `video-editor-mcp` 是否真实可用。项目配置中启用 MCP 只表示宿主会尝试启动，不代表当前会话已经拥有工具。若工具列表为空或调用返回连接错误，应先进入 `known-errors`，不要凭架构文档伪造工具结果。

项目定位使用稳定 ID，而不是聊天中的称呼、文件夹名或浏览器仍打开的页面。完整流程是：

```text
list_projects
→ target_project 或每次显式传 project_id
→ read_project
→ 记录当前 Revision、Profile、Timeline/Sequence 和未完成 Job
```

当前代码以一个默认 Timeline 为主，架构已经预留平行长版、短版和横竖版。若用户要求“另做一个短版”，而当前代码尚未实现多 Timeline/Sequence，不得用 rollback 或覆盖当前 Revision 冒充新版本；应明确缺口，保留当前版本，并形成可执行的后续计划。

新 Codex 会话、MCP 重启、浏览器刷新或 Worker 恢复后，都必须重新执行项目定位。旧聊天里“已经做到 Revision 83”、旧浏览器的 Selection、旧 Bridge `run_id` 和已加载 Skill 上下文都不是项目事实。可靠事实只来自当前 Project、Revision、Job 和已保存对象。

## 对象模型：修改应落在哪里

### Project 与 CreativeBrief

Project 是完整工程和共享素材容器。CreativeBrief 保存平台、画幅、目标时长、受众、语气、风格和交付标准。改变“这条视频要给谁看、做多长、是否允许高密度动效”属于 Brief，而不是某个 EffectCue。

### Asset 与 Asset 在 Timeline 中的一次使用

Asset 是源文件、生成文件或派生文件。TimelineItem 是该 Asset 在某一轨道和时间范围中的一次使用。同一 Asset 可以被多次使用，因此“换素材源文件”和“只替换本次使用”是不同修改。Asset 还保存 Role、Provenance、Rights 和处理状态，不能只根据文件存在判断可交付。

### Transcript、SemanticUnit、Script 与 SpeechSegment

TranscriptText 记录识别结果；TranscriptSentenceCandidate 只是按标点产生的候选；SemanticUnit 是经上下文确认的完整思想；Script 决定观众最终听到哪些 SemanticUnit 和顺序；SpeechSegment 是 TTS、字幕和段级时序的生产单位。删除内容通常应从 SemanticUnit/Script 开始，而不是直接在音轨上挖掉一段。

### Story、Scene 与 Timeline

Story 解释讲什么以及为什么按这个顺序。Scene 解释这段内容如何被看见；Timeline 保存最终物理播放关系。改变论证顺序先改 Story，改变视觉模型先改 Scene，微调物理位置才直接改 Timeline。三者属于同一 Revision，不能各自有一份互不一致的“真相”。

### EffectCue、Caption、Audio 与 ActorPerformance

EffectCue 保存叙事目的、语义锚点、层级、素材、Props 和运动；Caption 是屏幕文字程序；Audio 包含 Dialogue、BGM 和 SFX；ActorPerformance 关联人物视频、声音所有权、Mask 和 SpeechAsset。一个视觉问题不能默认通过移动 EffectCue 解决：若根因是人物构图、字幕过大或 Scene 类型错误，应回到对应对象。

### Job、ProductionRun、Quality 和 ExportArtifact

Job 是异步执行记录，不是创作状态。ProductionRun/SkillExecutionReport 是“这次 Agent 如何工作”的审计，不是第二份 Project Snapshot。QualityReport 与 EditorialReview 保存检查结论。ExportArtifact 是固定 Revision 的真实文件记录；重新编辑 Project 不会自动改变旧 Artifact。

## 写入前的标准判断

每次写入前应能回答：目标对象是什么；当前 Revision 是多少；该对象的上游和下游是什么；是否存在未完成 Job；这次修改是否已经通过另一条表面提交；预计哪些对象会 stale；是否需要先做预览差异。

例如，用户要求把一条人物口播删掉。如果直接移动 Timeline Item，SpeechAsset、字幕和后续动效可能仍按旧语义存在。正确路径通常是读取 Script 和 SemanticUnit，应用新的 Script，再根据 ImpactReport 重新生成受影响声音、字幕和效果。反过来，用户只要求把一个已确认的前景产品向右移动，就不应重建 Story。

## 确定性写入与读回

会创建或修改 Project Revision 的确定性写操作携带当前 `base_revision_id`。当前实际工具包括 `manage_story`、`apply_semantic_units`、`apply_script`、`assemble_presenter_track`、`compile_presenter_scenes`、`manage_actor_performance`、`create_scene`、`manage_effect_cues`、`manage_audio`、`move_item` 等；转写、语音、预览和导出等异步 Job 使用各自的 `asset_id`、`revision` 或 `idempotency_key`。具体参数以实时 Tool Schema 和 [_shared/MCP_EXECUTION_CONTRACT.md](../_shared/MCP_EXECUTION_CONTRACT.md) 为准。

写入成功后不能只看工具返回的 success。至少：

```text
read_project 或对应 Query
→ read_impact_report
→ 必要时 validate_project_graph
→ 视觉改动 render_preview_range
→ inspect_composed_frames 或 Browser Operator 连续播放
→ 声音改动实际试听
```

ImpactReport 应告诉主工作流哪些对象变化、移动、重算、stale、冲突以及哪些范围需要重新渲染。若代码没有表达某类传播，Skill 应记录能力缺口，而不是假设“一切自动跟随”。

## 并发、冲突与结果未知

Revision 冲突表示当前项目在你读取后已经变化。不要自动用新 Revision 重发同一 Payload，因为其它修改可能已经改变原判断。先重新读取项目和目标对象，识别冲突修改，再决定保留、合并或放弃。

异步任务超时或网络断开时，不能仅因为没有收到响应就重复提交。先读取 `track_job`、最新 Revision、Asset 和本地输出；Bridge 重启可能让旧 `run_id` 失效，但本项目自己的 Job、请求摘要和已下载产物仍应可对账。只有确认无副作用时才创建新任务。

## MCP 与 Web 的边界

MCP 适合批量、语义化、幂等和可重复的项目修改。Web 适合观察真实合成、空间微调、Timeline 拖动和 Inspector 参数调整。两者调用同一 Editing Application；同一修改不得先由 MCP 提交、又在 Web 中重复操作。

Browser Operator 不是绕开模型的快捷方式。DOM 临时样式、浏览器内未提交的状态和 Canvas 上看见的内容，都必须通过 Application 产生新 Revision 才属于项目事实。

## 当前 MCP 表面怎样阅读

以下是代码基线中已存在的主要工具分组。它们不是要背诵的固定清单，执行时仍以实时 Schema 为准；这里的价值在于理解每组工具改变哪一层事实。

### 项目、版本和定位

- `list_projects`、`create_project`、`target_project`、`read_project`：建立当前项目上下文；
- `read_story`、`manage_story`：修改叙事结构，不直接改变 Timeline；
- `list_revisions`、`rollback_revision`、`read_impact_report`：查看和恢复同一项目历史；
- `get_editor_url`、`focus_editor_object`：得到 Web 中可定位对象和帧的入口。

`rollback_revision` 不是“切换到旧状态继续写”，而是基于当前 base Revision 恢复旧 Snapshot并产生新的 Revision。因此历史仍然保留，后续对象和 Artifact 也必须按新 Revision 重新判断。

### 素材、转写和语音

- `browse_assets`、`import_media`、`update_asset_metadata`；
- `manage_asset_requirements`、`search_media_candidates`、`inspect_media_candidate`、`acquire_media_asset`、`read_asset_provenance`；
- `submit_transcription`、`apply_manual_transcript`、`read_script`；
- `apply_semantic_units`、`apply_script`；
- `manage_voice_references`、`submit_voice_synthesis`、`read_speech_asset`、`read_speech_timing`、`rebuild_speech_timeline`。

注意 `read_script` 同时返回候选句、SemanticUnit、Script 和 SpeechSegment，但它们仍是不同对象。工具为了方便一次读回，不表示职责合并。

### Presenter、Scene 和 Effect

- `assemble_presenter_track`：物理组装明确 A-roll；
- `compile_presenter_scenes`：根据已确定的 Beat/计划创建叙事 Scene；
- `create_presenter_timeline`：兼容入口，不用于正式创作；
- `align_presenter_to_speech`：只有在安全条件满足时让人物主线与 SpeechAsset 对齐；
- `read_actor_performances`、`manage_actor_performance`；
- `browse_scene_types`、`create_scene`、`manage_visual_treatment`、`manage_cutaways`、`replace_scene_asset`、`browse_effect_types`、`manage_effect_cues`；
- `move_item`、`preview_timeline`。

若 `align_presenter_to_speech` 因已有 Cue、缺画面或 direct override 拒绝自动修改，这是正确保护，不应通过直接改数据库绕过。主工作流需要重新决定补 Cutaway、重生人物、裁声音还是保留差异。

### BGM、SFX 与声音包装

- `manage_audio`：将已就绪的独立本地音频写成可追溯的 `AudioCue` 与 BGM/SFX 专用 Timeline Item；
- BGM 可设置有限淡入淡出、循环与 Dialogue Duck；SFX 必须显式给出观众实际听见的 `event_frame` 和相对所选源片段的 `onset_offset_frames`，不能猜测能量峰值；
- `move_item` 不可直接移动受管 BGM/SFX，主线、Script、Scene 或旁白时长改变时旧声音包装会被停止并标 `stale`，要通过 `manage_audio(action=update)` 重新确认。

声音写入后先读回 `AudioCue`、关联 Item 和 Impact，再用真实 Preview 进行只听声音复核。当前不支持自动配乐、自动 onset 检测、Room Tone 生成、EQ/降噪或通用 DAW 编辑。

### 审计、预览、质量和导出

- `start_production_run`、`record_creative_decision`、`complete_production_run`、`read_skill_execution_report`；
- `record_editorial_quality_review`；
- `validate_project_graph`、`read_quality_report`；
- `render_preview_range`、`inspect_composed_frames`；
- `submit_export`、`track_job`。

这些工具建立的证据层级不同。ProductionRun 解释过程，Project Graph 验证引用，Preview 给画面证据，EditorialReview 给专业判断，Export 给文件。不能用其中一个替代其它。

## 当前状态与架构目标的区别

当前阶段已实现 `manage_asset_requirements`、`search_media_candidates`、`inspect_media_candidate`、`acquire_media_asset` 与 `read_asset_provenance`：候选经检查和 Worker 本地化后才会成为 Asset。`manage_visual_treatment` 可以保存每个 Beat/Scene 的主视觉决定；`manage_cutaways` 只能将已就绪、本地化的视频写成 Fullscreen/PiP Cutaway，并同步 CutawayScene、顶层 Item 与声音策略；`replace_scene_asset` 只替换单条 Cutaway 的本地源素材和源范围。`edit_captions` 已可编辑当前 SpeechAsset 的稳定字幕 Card，但不支持逐词时间、逐词高亮或任意 CSS。`manage_audio` 已支持最小 BGM/SFX、有限淡入淡出、循环、Dialogue Duck 和显式 SFX onset，但不支持自动配乐、自动 onset 检测或通用混音。真实 Pexels 查询仍需要本地配置 `PEXELS_API_KEY`；CI 使用 Mock Provider，不依赖网络。`smooth_audio`、`run_render_preflight`、`read_export_artifact` 等仍是架构目标。Skill 在讲专业工作流时可以说明这些目标，但执行时必须先查工具表；工具不存在时只能输出可执行的最小步骤和能力缺口，不能把架构表格当成已连接 API。

## 三个完整写入示例

### 例一：删除一句口播

```text
read_project / read_script
→ semantic-continuity 判断删除的是完整 SemanticUnit
→ apply_script(base_revision_id, semantic_unit_ids)
→ read_impact_report
→ read_speech_asset / read_captions / preview_timeline
→ 重新生成 stale SpeechSegment
→ 重新预览和审片
```

错误做法是直接移动/缩短 Timeline Item，因为下游语义关系不会自动正确。

### 例二：添加一个产品效果

```text
read_project / read_story / preview_timeline
→ Visual Treatment 证明产品应成为当前主视觉
→ browse_effect_types
→ manage_effect_cues(scene_id, narrative_purpose, semantic_anchor, asset_bindings, props, motion)
→ read_impact_report
→ render_preview_range
→ inspect_composed_frames + 连续播放
```

错误做法是只传 type 和 frame，然后用工具成功代替内容和视觉验证。

### 例三：正式交付

```text
read_project / read_quality_report
→ 确认目标 Revision 的 Preview Evidence 和 Editorial Review
→ submit_export(revision, purpose=delivery)
→ track_job
→ 检查最终文件与目标 Revision
→ 完整播放并绑定批准
```

错误做法是导出最新 Revision 而不确认用户实际批准哪一版。

## Project Graph 和 stale 思维

图校验不仅查 ID 是否存在，还应让主工作流思考语义关系是否仍成立。当前确定性代码可以发现悬空引用，但“B-roll 仍绑定存在的句子却已经不相关”属于专业 stale，需要 `cutaway-planning` 复核。反之，Quality Skill不能把所有关系问题留给人工；可以确定的 ID、范围、版本和资源错误应由 Application 阻止。

## 交接合同

进入任何专项 Skill 前，本 Skill 应交付：明确 Project ID、当前 Timeline/Sequence、当前 Revision、任务对象、相关 Job、关键 Readiness、现有 Quality/Impact 和当前能力边界。

本 Skill 自身不会修改创作内容。它完成的证明是：目标对象和版本明确，工具真实存在，未知副作用没有被隐藏，后续 Skill 知道应从哪一个 Revision 开始以及写后必须怎样验证。

## 常见错误案例

### 用文件名代替 Asset ID

用户说“用 intro.mp4”，项目里可能存在两个同名文件或一个已经被重新导入的版本。应先 `browse_assets`，依据 ID、Hash、状态、Role 和来源确认。

### Job succeeded 就宣布完成

FunASR Job 成功只表示有 TranscriptText；还没有 SemanticUnit、最终 Script 和听感验证。Preview Job 成功只表示产生了局部媒体；还没有人实际看过。Export Job 成功只表示文件生成；还需要技术校验和完整声画审片。

### 把局部任务升级成整片重构

用户只要求字幕上移，应直接进入 `captions` 和必要的 `quality-verification`。重新运行 production-director、重建声音和全部 Scene 不但浪费，也可能破坏用户已经认可的内容。

## 最终检查

- 当前 Project、Timeline/Sequence 和 Revision 是否明确；
- 修改落在最接近意图的对象层；
- 实时 MCP Schema 已确认；
- 写入携带 base Revision；
- 写后已读回目标对象和 Impact；
- 视觉、声音或最终文件获得相应证据；
- 冲突、结果未知、stale 和能力缺口没有被隐藏。

## 共同资料

执行时读取 `_shared/PROJECT_REVISION_AND_HANDOFF.md` 和 `_shared/MCP_EXECUTION_CONTRACT.md`；涉及素材时读取 `_shared/EVIDENCE_RIGHTS_AND_READINESS.md`；涉及交付时读取 `_shared/QUALITY_EVIDENCE_AND_DELIVERY.md`。不要读取手工维护的“当前能力快照”：实际能力由实时 MCP Schema、当前 Project 状态、Contracts、Registry 和测试结果共同决定。
