# 项目提交、读回与恢复

主任务和受委派的工作台操作者，在执行对应正式操作前查本页。主任务安排写入范围和顺序，操作者按委派执行并交回保存结果。专业判断与完整交接沿[共同约定](../../_shared/PROJECT_REVISION_AND_HANDOFF.md)，各专项的具体字段以实时 MCP Schema和下方对应参考为准；这里不维护另一份完整工具清单。

## 一次提交的完整循环

先确认真实 Project、当前 Revision、目标对象与上下游依赖、未完成 Job，以及该修改是否已通过别处提交。对象选错时先查[项目模型](../../project-basics/references/project-model.md)，不把所有改动都塞进时间线。

主任务提交正式工具操作时，按原作者完整产物装配真实 ID 与参数。工作台操作者使用当前项目、版本和已确定目标完成获委派的调整，专业决定由原负责人负责。确定性项目写入携带当前 `base_revision_id`；异步接口按其真实合同使用 Asset、固定 revision 或幂等键，不能为形式一致虚构字段。新调用采用刚读回的版本，不能把新版本数字换进未重新确认的旧方案。

异步 Job 的依赖和后续动作按实时接口执行。OD 阶段制作由主任务通过 `start_motion_authoring` 预先委托明确目标，连接器核对依赖、自动登记及采用可用范围，沿[生产入口](../../opendesign-video-production/SKILL.md#调用与续接)接回固定版本；无需逐步搬运。独立作品生成仍可使用已明确目标的 `on_success`。主任务消费回执，通过工作台检查结果，只有需要文件时才明确提交预览。相关依赖变化交原负责人处理，不只替换版本号。互不依赖的研究、设计和生成继续并行。

完整无真人口播解说首版在导演采用后使用 `target: { action: "whole_film" }`，提交当前 Revision、ProductionRun、全部已采用的视觉计划 ID、制作项目和稳定幂等键。正文从同一份整片交付清单读取。用原 Job 的 `wait_motion_authoring` 回执接回各场实际可用帧段，跨场反馈使用该冻结版连续覆盖的项目帧范围。

写后读回对象与 ImpactReport，核对改变、重算、stale、冲突和需要重做的范围；不能只看 success。取得对应版本的真实预览或声音后回原作者，跨段影响交导演。作品生成、独立作品观察、合成观察和整片交付是不同结论；技术检查与实际观看不可互相替代。明确参数的局部修改只核对受影响范围，不重跑整片创意。

## 失败与不确定结果

先检查 `isError`，保存完整原始文本，再按实际内容解析 JSON。协议层拒绝可能只有文字，解析失败不能覆盖原始错误。以下情况分开处理：

辅助读取只有部分结果时保留已得结果和诊断，只恢复失败的读取，不自动改变素材、用途或其他项目对象。

| 状态 | 下一步 |
|---|---|
| Revision 冲突 | 重读项目、对象与 Impact，把实际差异交原作者确认；不自动替换版本重发 |
| 超时、断连、提交结果未知 | 查询原 Job、Revision、Asset与已有输出对账；不换幂等键重放，也不把未收到响应当成未执行 |
| 明确参数拒绝 | 只有 `stage=validation`、`sideEffects=none`、`safeToRetry=true`、`recovery=correct_input` 且有字段纠正依据，才按实时 Schema修订后提交一次；不原样重放，重复失败先核对原因，确认平台 Bug 阻断后才报障 |
| 协议层文本拒绝 | 核对实时 Schema和当前 Revision，确认未进入业务执行后才纠正；未知结果不获得重试许可 |
| 已创建或已失败的下载、生成 Job | 读取原任务及诊断，只走当前 MCP明确支持的恢复分支；不套用提交前参数纠正规则 |
| 服务未启动、连接失败或原因未知 | 先只读诊断并执行已有授权的恢复；没有证据不能认定平台 Bug |
| 普通素材不合适、搜索无结果、创意不成立 | 回原作者调整策略，不报平台故障；只暂停受影响依赖 |

素材搜索的窄例外：正式错误同时提供 `sideEffects="none"`、`safeToRetry=true` 和恢复依据，才按服务目录纠正参数或等待 `retryAfterMs` 后再搜索一次；重复失败先核对原因，确认平台 Bug 阻断后才报障，不扩展到下载、生成和未知写入。详细诊断查[参数拒绝与未知结果](../../known-errors/references/submission-errors.md)。

只有确认平台或服务自身 Bug 导致无法继续，才调用 `report_editing_blocker`，沿已有同根因工单补充证据；工单独立存储，不写入视频快照或新建视频 Revision，报障不授权自动修复。向用户说明问题并取得授权后才开展平台修复，修复结果交用户审核，部署按用户已授权范围执行，不能通过另建或委派修复任务绕过。项目操作使用已发布 MCP 或工作台持久化控件，平台修复沿根 AGENTS.md 的授权边界执行。其他无依赖工作继续；ComfyUI 的状态检查和指定启动方式沿根 AGENTS.md 的已有授权执行。

需要新版修复时，获授权的修复任务在隔离项目、目录、端口和队列中验证，发行物放在 `plugins/videoflowcut/runtime/dist/`，不手改已安装缓存；未验证构建不称为已部署。正式部署后，原剪辑任务重新连接 MCP，核对 `read_runtime_release` 的 Runtime/MCP releaseId、API 与 Worker 健康，再读当前 Project/Revision并调用 `acknowledge_repair_deployment`。旧会话不能确认新版。候选验证和部署细节见 `docs/development/motion-runtime.md`，剪辑任务不读取该开发流程代替正式工具。

## 按这次操作查对应资料

只读当前相关行，不要求全员预读全部参考。

| 本次操作 | 详细方法与合同 |
|---|---|
| 字体未收录、受管作品提交与完整范围放置 | [作品提交与恢复](../../opendesign-video-production/references/submission-and-recovery.md)：原视觉作者按该文件的字体可用性方法修订，主任务核验并提交；范围或源码拒绝回原作者 |
| 搜索、下载、采用与源范围观察 | [素材取得](../../visual-asset-sourcing/references/acquisition-operations.md)、[源素材审阅](../../visual-asset-sourcing/references/source-review.md) |
| 原创文稿、原话剪辑与配音 | [文稿操作](../../semantic-continuity/references/script-operations.md)、[配音放置](../../voice-production/references/synthesis-and-placement.md) |
| 字幕生成与显示修改 | [字幕操作](../../captions/references/caption-operations.md) |
| 视觉计划、场面与辅助镜头 | [场面写入](../../scene-planning/references/scene-operations.md#当前项目写入)、[辅助镜头](../../cutaway-planning/SKILL.md)；从已明确设计映射字段，计划保存不代替实际放置 |
| 声音候选、轨道与混音 | [声音取得](../../sound-asset-sourcing/references/acquisition-and-analysis.md)、[声音操作](../../audio-finishing/references/audio-operations.md) |
| 人物主线与人物生成 | [人物时间线](../../presenter-motion-director/references/timeline-operations.md)、[人物操作](../../avatar-performance/references/actor-operations.md) |
| 项目帧率 | [项目模型的帧率变更](../../project-basics/references/project-model.md#改帧率时才读) |
| 预览、导出与文件核验 | [技术交付](../../quality-verification/references/technical-delivery.md)、[导出](../../export/SKILL.md) |

## 保存审计时才读

ProductionRun与SkillExecutionReport记录实际工作过程，不参与动画编译，不是第二份成片状态。记录实际用到的能力、决定、对象、证据及未完成项，不能用已加载Skill或工作单代替真实宿主调用。

`start_production_run` 使用实际 `base_revision_id`、任务 `intent`、目标 `completion_scope` 和稳定 `operation_id`；`frames` 范围的 `start_frame` 包含、`end_frame` 不包含。宿主分派后通过 `update_production_run` 登记真实 agent_id、协调者生成的 assignment_id、职责、技能、范围和输入版本；创作职责以实际负责的 project、beats 或 objects 分派，帧范围用于观察。更新携带当前 `expected_audit_version`。同一操作重试复用 operation_id，读回可能包含后续追加的记录。

使用 `record_creative_decision` 登记真实 `assignment_id`、`input_revision`、`object_ids`、`operation_id`。创意与机制分别用 `creative_research` 和 `motion_research`。`research_references` 的每个采用依据写参考类型、编号、`source_sha256`、原片 `start_ms`、`end_ms` 和 `observed_relation`。`evidence` 写明实际观察方式、范围与出处。观察不足可保留 `pending`，其中已确证的具体关系仍可被本场使用。关键关系缺乏依据时退给研究负责人。`researched` 说明该研究范围已完成，`not_applicable` 需要实际考察和放弃理由。仅供学习的候选不算作本片采用。

整场创意研究完成时传 `research_coverage` 的 `overall_visual`、`scene_composition`、`motion_mechanisms` 和 `blocking_questions`；各不适用层次在 `not_applicable_reasons` 中给出对应理由。原创整体设计的依据写入 `evidence`。局部研究可以继续单独引用，正式采用必须关联完成覆盖的创意研究和已完成或有理由不适用的机制研究。

采用范围、覆盖结论和未完成项使用原作者实际交付内容。登记只补齐真实身份、版本及明确参数。遇到缺少专业判断或正文不一致时，按协调入口交回原作者处理后提交。

### 逐场交件的正式写入

完整解说新片中，主任务接回原创意作者选定的原段和画面采用依据时，通过 `record_creative_decision` 登记本次选片研究，按实际情况关联旁白段落或场面。续派换料时，从研究记录取出该单元登记的原片时刻和带标记原句，原样带入任务消息。作者交回替换项后，用 `handoff.action=submit_draft` 生成固定稿。按实际时间计划建立场面和关联段落后，换料和视觉接件沿用同一 ProductionRun。使用实际 Scene ID 和本场稳定的单元 ID，项目范围为包含起帧、排除结束帧的区间。正式写入时从 `read_skill_execution_report` 取得当前 `auditVersion`，以 `update_production_run` 的 `action=record_unit_handoff` 提交作者交件。外层沿用 `project_id`、`run_id`、`expected_audit_version` 和 `operation_id`。内层 `handoff` 按实时工具定义分别填写。

选片研究用 `research_references[].observed_relation` 逐拍登记完整原句，用 `【名称】` 标素材、文字和数值。每条填实际原片起止，各拍覆盖整个采用区间。完整动效机制承担主参考时，由该机制研究负责人按原创意作者看片确认的原句登记在对应机制研究决定中。选片研究中的 `decision` 和 `rationale` 记录用途、适用范围和理由。交正式稿前，确认该研究能覆盖当前 `sceneId`。早期研究若仅关联旁白而无法覆盖该场，按实际场面续记同一作者的研究决定，并引用早期决定。

只做到 OD 首版指令、尚无配音时，由视觉作者在正式复摆前依据文案段落与拟覆盖范围给出工作时间计划，先定场面及单元的暂估帧段。主任务沿现有 `create_scene` 建立实际场面，标明暂估帧段。提交和接收均使用已含该场及所用素材的实际输入版本，记录同一单元帧段。交付前按预定单元核对当前 `draft`、`receipt` 和制作正文。后续真实旁白改变场界或接点时，续接原作者复核受影响范围，并按当前帧段更新交件。

- `handoff.action=submit_draft` 交 `assignmentId`、`inputRevision`、`sceneId`、`unitId`、`startFrame`、`endFrame`、`creativeDecisionId`、原片 `reference` 和 `replacements`。`reference` 写存有原句的研究决定 ID、类型、参考 ID、库指纹及采用起止毫秒。`replacements` 每个名称填一次，`name` 写括号内名称。上屏文字与数值用 `kind: "text"` 和 `text`，真实素材用 `kind: "asset"` 和 `assetId`，视频另填受管文件内的 `sourceRange`。程序按原片时刻将替换项填进登记原句，生成固定正文和素材绑定。从返回的 `unitHandoffs` 取 `draft.id` 和 `draft.path`，连同原片、实际素材及按时刻注明的适配依据交视觉作者。
- `return_draft` 据视觉作者实际退回结果登记。交其 `assignmentId`、`inputRevision`、`draftId`、`sourceMs`、缺口 `gap` 和受影响步骤 `impact`。按缺口续接原创意作者。补完以后重新提交该单元正文，将新稿交视觉作者复摆。
- `accept_draft` 据视觉作者的实际试摆结果登记。交其 `assignmentId`、`inputRevision`、`draftId`、`sourceMs`、`projectFrame`、`comparisonPath` 和具体观察 `observation`。从返回的 `unitHandoffs` 取接收事件的 `id`。依靠 `read_production_status` 的 `unitHandoffs` 查看各单元当前稿、接件回执、缺口和负责人。

`handoff.action=submit_draft` 的采用区间与替换项取自原创意作者交回的同一单元。主任务可补录已确定文件的项目编号和时间单位。缺项、素材源段无效或原句范围不完整时，续接原作者处理对应时刻；该次提交在补完前保持待交。

`accept_draft` 的 `sourceMs`、`projectFrame` 取视觉作者实际对照的代表时刻，`comparisonPath` 指向呈现相应状态或过程的同版文件。`observation` 登记本片在对应时刻实际呈现的构图、动作或前后接续，以及它与所选原片同一处演出的对应关系。判断依赖前后变化时，在该观察中写清对应的前后时刻和可见变化，并使用展现该变化的一组状态合图或对应短片。若同时提供 HTML 总图版，回执指向实际的图片或视频文件。

视觉发现创意正文缺少决定性关系或承载素材时，使用 `return_draft` 登记作者指出的原片位置、缺口和影响。原创意作者补稿后以 `handoff.action=submit_draft` 重新提交，视觉作者按新的 `draftId` 接件。视觉自己的摆法需要修正时，先完成同稿复摆，再办理接收。

同一场内每个主要视觉单元均已有换料正文和有效接收回执，且视觉稿已确认时，主任务将它纳入 `prepare_motion_handoff` 的 `selected_scene_ids` 并传当前 `production_run_id`。在 `visualPlan.units[]` 填入对应 `creativeDecisionId`、`creativeDraftId`、`handoffReceiptId` 和 `restage`。将固定稿 `draft.path` 和接件所用的对照文件通过 `references[].files` 附入本场，资源 ID 写进同场 `resourceIds`。主参考映射精确对应接件所用区间，制作步骤使用 `sequence.unitId` 和对应的 `subjects` 关联素材角色。场面未齐时继续处理其缺口，已齐场面可以先完成正式资料准备。整片在全场齐备后使用同一份冻结清单启动 `whole_film`。

按[早期叙事记录与正式画面采用](../../production-director/SKILL.md#早期叙事记录与正式画面采用)登记各阶段决定。视觉 `input_decision_ids` 引用实际消费的研究。用 `prepare_motion_handoff` 固定就绪场面后，以 `visual_design` 登记 `delivery_ref` 和对应 `input_revision`。视觉作者确认制作稿、主导演确认文案、制作范围和规格后，记录 `adoption`，再用 `manage_visual_treatment` 的 `action=adopt` 将同次计划、素材和采用写入同一版本。项目或审计记录冲突时读回当前状态，只重新提交受影响的本场。涉及主要演出或必要素材的变化时，续接对应作者并取得当前版本的接件确认。

对应 `visualPlan.referenceMappings[]` 用 `researchDecisionId` 指向研究决定，`startMs` 和 `endMs` 选中该决定里实际采用的原片区间；每条就绪映射的 `targetRange` 单独写明本片场面内的非空项目半开帧范围。按类型、编号、来源指纹、原片区间核对场面参考、研究条目与保留关系。一份研究可以支撑多个场面和区间，同一卡分段使用可复用同一决定。切片时间先折算为原片时间。导演的 `adoption` 引用该 `visual_design` 与同一份冻结清单的 `manifest_path`、`manifest_sha256`、`scene_ids`。

导演完成主要采用判断后，主任务以 `manage_visual_treatment.adopted_decision_ref` 关联本次 ProductionRun 和决定，并写入本场实际采用素材。用当前版本和 `visual_treatment_ids` 启动制作。状态读回与续修按受影响范围处理，当前采用改变后核对 stale 和声音未完成项。

这些字段不能认证真实宿主调用，也不证明当前负责人已接任或实际看过媒体；接替与迟到结果按共同交接约定核对。旧报告作为审计资料读取，后续范围由新 Run 承接。
