# 当前时间线操作与依赖

## 主线变化后的返工范围

沿当前口播和分镜派发人物源缺口，不遍历全文语音段生成人物。范围已明确的部分
可以先做，后续增加或改分镜仍走原流程。调用实际发布的 v2 源生成和使用合同，
读回真实素材及当前引用；不重新组织整片主线，也不把旧 Job 的位置覆盖回新画面。

从零数字人先由 `apply_authored_script` 保存准确台词，完成正式 SpeechAsset 与真实时序，再按[声画交接](presenter-shot-plan.md)准备当前出镜需要、查询可复用源并只提交缺口。当前出镜范围保存在原 VisualTreatment 的 `presenter_uses`，使用 `prepare_avatar_sources` 查询复用与缺口、`submit_avatar_job` 的 `contract_version:2` 提交缺口，再用 `adopt_avatar_source` 按最新范围采用；具体字段沿[人物执行操作](../../avatar-performance/references/actor-operations.md#当前执行)。源生成不预设成片位置；源返回后再安排 Scene、人物与作品绑定。`apply_script` 仅从已有语义单元选择和排序，不承载新写正文。无需为生成源编造 A-roll 或先锁定整片 Scene；结果交原视觉作者继续制作。已有真人原片则沿文末的 assemble／compile 路线，不套用生成输入要求。

撤回或修改范围时更新同一 VisualTreatment 的 `presenter_uses`；空数组清除该 Treatment 的人物使用，原源文件保留。已有 Item 停用不自动修改 TSX，原视觉作者继续调整作品绑定、显隐与场面接管。

人物进入受管作品时，`videoBindings` 直接引用真实 `actor_video`。需要接管外层人物像素时沿本页[主场面接管](#主场面接管)使用已发布 `visual_composition`，透明与不透明作品都明确可见责任，不靠背景盖住外层人物。核查前后未覆盖范围及真实 Item ID，保留源裁切、时钟与声音；不能禁用整个原 Item 而误删获准原声。普通字幕保持最终画布层。安装版本不支持时记录实际差异，不写入拟定字段。

- Script 文本变：相关 SpeechSegment、SpeechAsset、Caption、语义 Effect、Cutaway 和人物可能 stale；
- 只改 Voice 音色：人物口型、Dialogue、Timing 和音频审查受影响，Story不一定变；
- 只换 B-roll：Cutaway Scene、声音交接、Preview 受影响；
- 改 Effect Props：目标 Cue、布局和局部 Preview受影响；
- 改全片 Style：多个 Scene 和 Golden 需要复核；
- 改 Story 顺序：主线和全部语义绑定包装可能需要重投影。

不要“为了保险全部重做”，也不要假设下游自动正确。

## 用户可见的完成报告

报告应以观看结果为中心，而不是列工具：主线做了哪些删改、声音来源、哪些 Beat 保持人物、哪些使用解释/B-roll、为什么拒绝了哪些效果、当前质量问题、最终 Revision 和 Artifact。内部 ID 只在需要定位时提供。

## Gate C：交付

先核对当前 Revision 的 Project Graph、文件技术条件，按 `export` 生成目标文件，保留已有辅助审阅及未审范围。AI 审阅缺失不阻挡 draft 或 delivery 导出；文件完成后检查解码、时长、音轨和哈希，人工定稿绑定用户确认的具体 Artifact。

## 专项交接总表

给视觉作者本段完整句群、实际人物和字幕占用、要看的素材过程，以及返回
人物时的下一句与姿态。作者可选择同屏辅助或由素材／解释暂时接管，不能
为了始终保留人物，把主要操作缩到看不清。接管和返回都在实际声画里检查。
无可靠 Mask 或动作证据，不设计物体穿过手掌、躲到人物身后等假交互。

MG 交回设计依据、固定作品版本、覆盖 Beat、局部事件帧、入口/出口状态、当前证据和限制。人物同屏或全屏接管由内容与真实构图决定，不固定交替比例。

| 阶段 | 调用 Skill | 主工作流应接收什么 |
|---|---|---|
| 原创解说 | narration-writing | 完整朗读正文、逐段声画稿、事实与材料依据、修订差异 |
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

## 完成标准

本工作流完成时，A-roll/Script/声音/人物版本一致；StoryBeat 与 PresenterScene 有真实关系；各重要 Beat 的保持或处理有明确作用；视觉、声音与相关上下文取得实际预览，并记录已审范围、修订与未知。五轮按需要提供专业观察，AI 未审或未关闭审美意见不构成导出禁令；技术与用途沿当前合同检查，最终用户批准绑定具体 Artifact。


`create_presenter_timeline` 是兼容入口，不作为正式主链；它按素材数量临时分组。正式人物主线使用 `assemble_presenter_track` 后接 `compile_presenter_scenes`，再登记人物。`align_presenter_to_speech` 因已有效果、缺画面或直接覆盖拒绝调整时，不绕过保护；交导演决定补画面、重生人物、修声音或保留差异。

## 人物绑定与源时钟

`videoBindings` 使用 `assetId`、`sourceStartMs`、`sourceEndMs`、`startFrame`、`endFrame` 及可选 `decodeScale`，范围为作品坐标，正常速度且静音。作品与项目 fps 相同时，作品局部帧为项目当前帧减 Cue 起点；源毫秒为 sourceStartMs 加 (作品局部帧减 startFrame) × 1000 / 作品 fps。fps 不同时先按秒换算，不直接相减帧号。仅在绑定有效半开范围读取；移动、缩放、裁切和暂时不可见不重置源时间，真实新 Take 使用自己的绑定。不得补造 offsetInFrames 或变速对齐台词。

## 主场面接管

先核对当前 Runtime Schema 已发布 `visual_composition`。仅人物范围需要接管时，在 fullscreen ManagedMotion Cue 传 `{role:"primary", replaces_actor_item_ids:[实际ItemID]}`，范围复用 Cue 半开区间；无外层人物可传空数组。更新省略保持、null 清除。Cue 仍只有唯一 motion 绑定，人物和资料用作品内真实 imageBindings/videoBindings。

接管只隐藏外层人物像素，保留源裁切、时钟与声音；TimelineVideo 静音，use_source_audio 仍走原 Item，use_dialogue_track 仍走唯一 Dialogue。作品可完全不显示人。主作品在 Cutaway、普通 front 与字幕下方；CameraPunch、头手锚点及人物 Mask 效果冲突时合并进同一作品或调整范围，不能沿旧坐标继续。

用当前对象和实际合成核查源帧、声音与层序。adopted_material_asset_ids 只登记已采用展示资料，[] 取消采用，省略保持；对账绑定不能证明可读性。未发布接口时不得写入拟定字段；先报告版本差异并沿已发布能力处理。
