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
| 源素材按需审阅 | `inspect_asset(asset_id, mode=overview|range|dense, source_start_frame?, source_end_frame?, contact_sheet_frames?)` | 只读返回原素材的连续声画、联系表、声音辅助证据、转写、Shot 与当前使用位置。overview 用于发现候选，range 用于连续范围，dense 只用于会改变高影响边界的最小窗口；派生文件是可重建缓存，不创建 Revision。 |
| 素材需求与候选 | `manage_asset_requirements(base_revision_id, action, ...)`；`search_media_candidates(base_revision_id, asset_request_id, provider, query)`；`inspect_media_candidate(asset_candidate_id)` | 搜索只写入 SearchIntent 与 Candidate；先看来源、授权、时长和过滤理由，候选本身不能进入 Scene 或 Timeline。 |
| 下载与本地化 | `acquire_media_asset(base_revision_id, asset_candidate_id, idempotency_key?)`；`track_job(job_id)`；`read_asset_provenance(asset_id)` | Worker 校验 MIME、文件头、内容哈希和 ffprobe 后才注册 Asset，并继续创建媒体分析任务；确认 ready 前不能视为可渲染素材。 |
| 导入本地素材 | `import_media(base_revision_id, file_path, role?, tags?, provenance?)` | `track_job(job_id)` 后用 `browse_assets` 或 `read_project` 确认 Asset、Hash、状态和来源。 |
| 转写 | `submit_transcription(asset_id, idempotency_key?)`；人工文本用 `apply_manual_transcript(base_revision_id, asset_id, text)` | Job 完成后 `read_script`；候选句不等于 SemanticUnit。 |
| 语义与脚本 | `apply_semantic_units(base_revision_id, units)`；再以新 Revision 调 `apply_script(base_revision_id, semantic_unit_ids)` | `read_script`、`read_impact_report`；根据 stale 范围重建声音和包装。 |
| Story 与语音 | `manage_story(base_revision_id, beats)`；`manage_voice_references(base_revision_id, asset_id)`；`submit_voice_synthesis(voice_reference_id? / voice_reference_asset_id?, speech_segment_ids?, idempotency_key?)` | `track_job`、`read_speech_asset`、`read_speech_timing`；旧 Timeline 必要时用 `rebuild_speech_timeline(base_revision_id)`。 |
| Explainer NarrativeMap | `manage_narrative_map(base_revision_id, viewer_question, promised_model, conclusion, beats)`；`read_narrative_map(project_id?)` | NarrativeMap 映射既有 Story Beat 的观众知识、问题与延迟披露；写入会让依赖的 Explainer Program 失效，写后读回对象、Revision、Impact 与 Preview。 |
| Vlog 事件与 Montage | `submit_vlog_analysis(base_revision_id, asset_ids, scene_threshold?, idempotency_key?)`；`manage_vlog_events(base_revision_id, action, ...)`；`manage_vlog_shot_selects(base_revision_id, action, ...)`；`compile_vlog_montage(base_revision_id, shot_select_ids, ...)`；`read_vlog_plan(project_id?)` | 分析只产生 Shot Boundary、源范围、变化分数和音轨事实；导演确认 Event/Select 后才编译 Montage。写后读回计划、Revision、Impact 和 Preview，不能把技术边界当作自动故事选择。 |
| 稳定字幕 | `read_captions(project_id?)`；单卡 `edit_captions(base_revision_id, caption_id, action=update|reset, text?, format?, emphasis?)`；原声批量版式 `edit_captions(base_revision_id, caption_ids, action=bulk_source_format, format)` | 单卡可修改当前 SpeechAsset 或已审计 source_audio 的屏幕呈现；批量版式只接受同一原声 A-roll 的明确 Card 集合。两者都不改 Script、SpeechSegment、声音、Card 边界或时间范围；`reset` 恢复来源文案和默认样式。`chunk_coarse` 不得按标点或字符伪拆/重定时。修改后读回 Revision、Impact 与 Caption，再渲染真实 Preview。 |
| BGM 与 SFX | `manage_audio(base_revision_id, action, audio_cue_id?, kind?, asset_id?, purpose?, start_frame?, end_frame?, source_start_frame?, source_end_frame?, loop?, gain_db?, fade_in_frames?, fade_out_frames?, event_frame?, onset_offset_frames?, ducking?)` | 只接受已就绪的独立本地音频，写入 `AudioCue` 与 BGM/SFX 专用 Item。BGM 可有限淡入淡出、循环和 Dialogue Duck；SFX 必须显式给出实际听见的 `event_frame` 和相对所选源片段的 `onset_offset_frames`。主线变化会停用并标 stale；写后读回 Project、Impact，再真实试听。 |
| Presenter 主线 | `assemble_presenter_track(base_revision_id, asset_ids)`；`compile_presenter_scenes(base_revision_id, scenes)`；`manage_actor_performance(base_revision_id, timeline_item_id, source, mask_mode, audio_mode?, mask_asset_id?, speech_asset_id?)` | 每步使用上一写入返回的 Revision，读回 Project、ActorPerformance 和 Impact。 |
| Avatar 能力与生成 | `read_actor_capabilities(project_id?)`；`manage_actor_capabilities(base_revision_id, action, ...)`；`submit_avatar_job(base_revision_id, capability_profile_id, reference_image_asset_id, generation_range, placement, ...)` | Capability Profile 只记录已确认能力；提交前 Worker 读取最新 Bridge Schema，当前生成只支持无 Mask 的前景降级与 Dialogue/静音声音模式。完成后 `track_job(job_id)` 并用 `read_actor_performances`、Revision、Impact 和 Preview 复核，不把提交或 Provider 成功伪装成口型、Mask、连续性或审美已通过。 |
| Scene 与 Effect | `create_scene(base_revision_id, type, title, purpose, start_frame, end_frame, asset_ids?)`；`manage_effect_cues(base_revision_id, scene_id, type, layer, start_frame, end_frame, ...)` | Effect 还应传入适用的 `narrative_purpose`、`audience_task`、`semantic_anchor`、`spatial_anchor`、`asset_bindings`、`props`、`motion`、`style_pack_id` 与 `quality_rules`；随后读 Impact。 |
| 视觉计划与 Cutaway | `manage_visual_treatment(base_revision_id, action, ...)`；`manage_cutaways(base_revision_id, action, ...)`；替换单条本地源素材用 `replace_scene_asset(base_revision_id, cutaway_id, asset_id, source_start_frame, source_end_frame)` | VisualTreatment 先说明为什么离开人物；Cutaway 只接受已就绪本地视频，原子写入 CutawayScene 和顶层 Item。主线变化后读取 Impact：系统会停用并标记 stale，必须重新确认相关性、进入和返回。 |
| 预览 | `render_preview_range(revision?, from_frame?, to_frame?, idempotency_key?)` | `track_job(job_id)` 成功后，`inspect_composed_frames(preview_job_id, frames?)` 会保存当前 Revision 的帧证据；仍须连续播放需要的范围。 |
| 审片与导出 | `start_production_run(loaded_skills, base_revision_id?)`；`record_editorial_quality_review(run_id, revision, passes, preview_evidence, findings)`；`run_render_preflight(revision?)`；`submit_export(revision?, purpose=draft|delivery, idempotency_key?)`；`track_export(job_id)`；`read_export_artifact(artifact_id)`；`record_export_artifact_review(artifact_id, passes, evidence, findings)`；`approve_export_artifact(artifact_id, note?)` | 审片必须含 audio_only、mute_visual、audiovisual、first_viewer、mode_specific 五个 Pass。Delivery 还须同 Revision 的 Preview、Editorial Review、Preflight 与目标 Artifact；导出后以 Job、最终文件、Artifact Review 和用户批准分别收口。 |

## 工具状态必须明确区分

## 平台修复协作命令

这些命令管理平台能力缺口，不是视频编辑命令。调用前仍以实时 Tool Schema 为准；它们不会创建或修改 Project Revision。

| 阶段 | MCP 命令与关键输入 | 允许的下一步 |
|---|---|---|
| 读取发行健康 | `read_runtime_release()` | 比较 `mcpReleaseId` 与 `runtime.releaseId`，并确认 API、媒体 Worker、渲染 Worker 均健康；不一致时不能确认部署或恢复。 |
| 剪辑阻断 | `report_editing_blocker(reported_revision, category, summary, reporter_id, idempotency_key, detail?, tool_name?, job_id?)` | 剪辑任务停在当前步骤；Ticket 保存 MCP 的 Release ID 和报告 Revision，不进入视频 Revision。Runtime 不可达时也可报告，不能因报障失败而伪造恢复。 |
| 修复接手与候选验证 | `list_repair_tickets(statuses?)`；`claim_repair_ticket(ticket_id, repairer_id)`；`mark_repair_candidate_ready(ticket_id, repairer_id, candidate_release_id, validation_summary)` | Repairer 只在隔离 Runtime/工作区验证根因修复与回归；候选 ID 必须是构建 Manifest 的 `release-<sha256>`，不能使用 latest 或口头版本。 |
| 正式切换 | `mark_repair_deployed(ticket_id, repairer_id, deployment_evidence)` | 该命令自行读取当前 MCP/Runtime Release ID；只有两者一致且等于已验证候选版才会写入 deployed。旧 MCP 或旧 Runtime 必须先重新部署/重连。 |
| 剪辑恢复 | `acknowledge_repair_deployment(ticket_id, editor_id, observed_revision)` | 原报告者重新连接新版 MCP、读回当前 Project 后确认。`observed_revision` 必须仍是当前 Revision；成功后才继续剪辑。 |

修复任务不得把修改正式视频、修改插件缓存、临时跳过失败、在生产工作区跑候选 Worker，作为完成 Ticket 的方式。需要放弃接手时使用 `release_repair_ticket(ticket_id, repairer_id, reason)`，保留复现事实给下一位修复者。

### 当前已实现，可按实时 Schema 调用

上表中的命令，以及 `read_story`、`read_impact_report`、`list_revisions`、`rollback_revision`、`update_asset_metadata`、`browse_scene_types`、`browse_effect_types`、`move_item`、`preview_timeline`、`record_creative_decision`、`complete_production_run`、`read_skill_execution_report`、`validate_project_graph`、`read_quality_report`、`get_editor_url` 与 `focus_editor_object`。

### 架构目标，当前不得伪造调用

`smooth_audio` 只可作为架构目标、计划或能力缺口描述；它没有进入当前 MCP Tool Schema。`run_render_preflight`、`read_export_artifact`、`read_actor_capabilities`、`submit_avatar_job` 与 `read_narrative_map` 已进入当前 MCP，必须按实时 Schema 调用，并继续区分确定性对象链、真实 Provider 验证与完整审美验证。

### 兼容入口，不作为正式主链

`create_presenter_timeline` 仍在 MCP 中用于旧客户端兼容，但它按素材数量临时分组。正式 Presenter 创作必须使用 `assemble_presenter_track` 再使用 `compile_presenter_scenes`，不能把兼容入口当作主线编译器。

## 失败与不确定结果

Revision 冲突、超时、连接中断或 Bridge 重启时，先读 Project、Impact、Job 和已生成 Asset；不能仅因响应未返回就重放提交。工具不存在时不把架构目标改写成成功结果，而是返回当前可执行的最小步骤、未实现部分和继续所需条件。

本合同由 `tests/skills-v5-integration.test.ts` 对照当前 MCP 注册表与关键输入字段校验。
