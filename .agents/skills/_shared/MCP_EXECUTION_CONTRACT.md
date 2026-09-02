# MCP 实时输入与调用链合同

本文件不是运行时“当前能力快照”，也不替代实时 MCP Tool Schema。它只记录已经由代码和测试共同约束的阶段一调用方式，帮助 Skill 在自然语言工作流中使用正确的工具名、字段名和读回点。工具 Schema、当前 Project 状态、Contracts、Registry 与测试结果冲突时，始终以实时事实为准，并在同一个 PR 更新本文件和测试。

## 共同输入规则

- 先用 `target_project(project_id)` 定位项目；之后大多数工具可省略 `project_id`，但跨项目或恢复会话时应显式传入。
- 会创建或改写 Project Revision 的命令携带最新 `base_revision_id`。调用成功后立刻读取返回的 Revision；下一次写入不得继续使用旧 Revision。
- 异步 Job 不伪造 `base_revision_id`：转写和语音以源 Asset/VoiceReference 为输入，预览和导出以固定 `revision` 为输入，并可使用 `idempotency_key` 防止不确定结果下的重复提交。
- 只读工具不修改 Project；`track_job(job_id)` 只能说明异步任务状态，不能代替对象读回、Preview 或审片。

## 已实现的阶段一主链

| 阶段 | 当前 MCP 命令与关键输入 | 写后读回 / 下一步 |
|---|---|---|
| 项目定位 | `list_projects()`；`target_project(project_id)`；`read_project(project_id?)` | 记录 Project ID、当前 Revision、Job 与素材状态。 |
| 素材需求与候选 | `manage_asset_requirements(base_revision_id, action, ...)`；`search_media_candidates(base_revision_id, asset_request_id, provider, query)`；`inspect_media_candidate(asset_candidate_id)` | 搜索只写入 SearchIntent 与 Candidate；先看来源、授权、时长和过滤理由，候选本身不能进入 Scene 或 Timeline。 |
| 下载与本地化 | `acquire_media_asset(base_revision_id, asset_candidate_id, idempotency_key?)`；`track_job(job_id)`；`read_asset_provenance(asset_id)` | Worker 校验 MIME、文件头、内容哈希和 ffprobe 后才注册 Asset，并继续创建媒体分析任务；确认 ready 前不能视为可渲染素材。 |
| 导入本地素材 | `import_media(base_revision_id, file_path, role?, tags?, provenance?)` | `track_job(job_id)` 后用 `browse_assets` 或 `read_project` 确认 Asset、Hash、状态和来源。 |
| 转写 | `submit_transcription(asset_id, idempotency_key?)`；人工文本用 `apply_manual_transcript(base_revision_id, asset_id, text)` | Job 完成后 `read_script`；候选句不等于 SemanticUnit。 |
| 语义与脚本 | `apply_semantic_units(base_revision_id, units)`；再以新 Revision 调 `apply_script(base_revision_id, semantic_unit_ids)` | `read_script`、`read_impact_report`；根据 stale 范围重建声音和包装。 |
| Story 与语音 | `manage_story(base_revision_id, beats)`；`manage_voice_references(base_revision_id, asset_id)`；`submit_voice_synthesis(voice_reference_id? / voice_reference_asset_id?, speech_segment_ids?, idempotency_key?)` | `track_job`、`read_speech_asset`、`read_speech_timing`；旧 Timeline 必要时用 `rebuild_speech_timeline(base_revision_id)`。 |
| Presenter 主线 | `assemble_presenter_track(base_revision_id, asset_ids)`；`compile_presenter_scenes(base_revision_id, scenes)`；`manage_actor_performance(base_revision_id, timeline_item_id, source, mask_mode, audio_mode?, mask_asset_id?, speech_asset_id?)` | 每步使用上一写入返回的 Revision，读回 Project、ActorPerformance 和 Impact。 |
| Scene 与 Effect | `create_scene(base_revision_id, type, title, purpose, start_frame, end_frame, asset_ids?)`；`manage_effect_cues(base_revision_id, scene_id, type, layer, start_frame, end_frame, ...)` | Effect 还应传入适用的 `narrative_purpose`、`audience_task`、`semantic_anchor`、`spatial_anchor`、`asset_bindings`、`props`、`motion`、`style_pack_id` 与 `quality_rules`；随后读 Impact。 |
| 预览 | `render_preview_range(revision?, from_frame?, to_frame?, idempotency_key?)` | `track_job(job_id)` 成功后，`inspect_composed_frames(preview_job_id, frames?)` 会保存当前 Revision 的帧证据；仍须连续播放需要的范围。 |
| 审片与导出 | `start_production_run(loaded_skills, base_revision_id?)`；`record_editorial_quality_review(run_id, revision, passes, preview_evidence, findings)`；`submit_export(revision?, purpose=draft|delivery, idempotency_key?)` | 审片必须含 audio_only、mute_visual、audiovisual、first_viewer、mode_specific 五个 Pass。Delivery 还须同 Revision 的 Preview 与 Editorial Review；导出后以 `track_job` 和最终文件检查收口。 |

## 工具状态必须明确区分

### 当前已实现，可按实时 Schema 调用

上表中的命令，以及 `read_story`、`read_impact_report`、`list_revisions`、`rollback_revision`、`update_asset_metadata`、`read_captions`、`browse_scene_types`、`browse_effect_types`、`move_item`、`preview_timeline`、`record_creative_decision`、`complete_production_run`、`read_skill_execution_report`、`validate_project_graph`、`read_quality_report`、`get_editor_url` 与 `focus_editor_object`。

### 架构目标，当前不得伪造调用

`manage_visual_treatment`、`manage_cutaways`、`replace_scene_asset`、`edit_captions`、`manage_audio`、`smooth_audio`、`run_render_preflight`、`read_export_artifact`、`read_actor_capabilities`、`submit_avatar_job` 与 `read_narrative_map` 只可作为架构目标、计划或能力缺口描述；它们没有进入当前 MCP Tool Schema。

### 兼容入口，不作为正式主链

`create_presenter_timeline` 仍在 MCP 中用于旧客户端兼容，但它按素材数量临时分组。正式 Presenter 创作必须使用 `assemble_presenter_track` 再使用 `compile_presenter_scenes`，不能把兼容入口当作主线编译器。

## 失败与不确定结果

Revision 冲突、超时、连接中断或 Bridge 重启时，先读 Project、Impact、Job 和已生成 Asset；不能仅因响应未返回就重放提交。工具不存在时不把架构目标改写成成功结果，而是返回当前可执行的最小步骤、未实现部分和继续所需条件。

本合同由 `tests/skills-v5-integration.test.ts` 对照当前 MCP 注册表与关键输入字段校验。
