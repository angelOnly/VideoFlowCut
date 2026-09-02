# VideoFlowCut 当前能力清单

> 代码基线：`VideoFlowCut main@70063767d11fb3175d68ef6a7ce83d599af16545`。本文件描述当前可执行能力，不是永久事实。代码变化后应重新从 Contracts、MCP Tool Registry、Effect Registry 和 JobKind 生成。

## 当前真实项目模型

当前 Project Snapshot 已包含 Project、Story、Asset、TranscriptText、TranscriptSentenceCandidate、SemanticUnit、Script、SpeechSegment、SpeechAsset、ActorPerformance、Scene、EffectCue、Timeline、Caption 和 Marker。所有对象通过不可变 Revision 共同版本化；`SkillExecutionReport` 是 ProductionRun 审计，不复制 Project Snapshot。

当前代码尚未实现 V7 架构中计划的 Sequence/EditVariant、DirectorPlanDocument、EvidenceSlice、PrimaryCutCompiler、FinishingCompiler、TemporalAnchor/ProjectionPolicy、RenderPreflight、DeliveryCandidate 和 DeliveryApproval。因此，涉及这些概念的 Skill 只能把它们当作专业计划语言和未来对象边界，不能调用不存在的工具或报告已持久化。

## 当前稳定 MCP

### 项目与版本

`list_projects`、`create_project`、`target_project`、`read_project`、`read_story`、`manage_story`、`read_impact_report`、`list_revisions`、`rollback_revision`、`validate_project_graph`。

### Web 定位

`get_editor_url`、`focus_editor_object`。

### 素材

`browse_assets`、`import_media`、`update_asset_metadata`。Asset 支持 A-roll、B-roll、Mask、Voice Reference、Evidence、Cutaway、Style Reference 和 Generated Visual 角色，也支持 Provenance 与 RightsStatus。

当前没有完整的联网 Provider Registry、候选排名和自动下载闭环。外部素材搜索只能在计划层描述需求，或先通过其它受控方式取得本地文件，再使用 `import_media` 登记。

### 转写、语义与语音

`submit_transcription`、`apply_manual_transcript`、`read_script`、`apply_semantic_units`、`apply_script`、`read_speech_asset`、`manage_voice_references`、`read_speech_timing`、`rebuild_speech_timeline`、`submit_voice_synthesis`。

FunASR 产生全文和标点候选，不产生真实词级时间。OmniVoice 通过 VoiceReference + SpeechSegment 逐段生成，最终只能可靠形成 `segment_exact`。

### Presenter 与场景

`assemble_presenter_track` 只负责明确选择的 A-roll 物理拼接；`compile_presenter_scenes` 根据已建立的 Story 和视觉计划创建 PresenterScene。`create_presenter_timeline` 只是旧客户端兼容入口，不用于正式创作。

`align_presenter_to_speech`、`read_actor_performances`、`manage_actor_performance`、`browse_scene_types`、`create_scene`。

### Effect 与时间线

`browse_effect_types`、`manage_effect_cues`、`move_item`、`preview_timeline`。EffectCue 已支持叙事目的、观众任务、语义锚点、空间锚点、真实素材绑定、Props、Motion、StylePack 和质量规则。

但当前 Runtime 对 SpatialAnchor、MotionPreset 和 StylePack 的消费仍有限。Skill 可以规划和审片，不能因字段存在就宣称复杂人物锚点和完整风格编译已实现。

### ProductionRun、质量与导出

`start_production_run`、`record_creative_decision`、`record_editorial_quality_review`、`complete_production_run`、`read_skill_execution_report`、`read_quality_report`、`render_preview_range`、`inspect_composed_frames`、`submit_export`、`track_job`。

当前导出固定 Revision，Remotion 失败不会静默交付仅主轨文件。代码仍未将“当前 Revision 已完成完整 Editorial Review”强制为独立 Delivery Export 门槛，因此 `quality-verification` 与 `export` 必须主动阻止未审片版本被描述成可交付成片。

## 使用规则

执行任何 Skill 前先读取实时 MCP 描述。如果实时工具与本文件冲突，以实时工具和当前 Contracts 为准。工具不存在时转为 `plan` 或 `review`；不得用自然语言假装已经执行。
