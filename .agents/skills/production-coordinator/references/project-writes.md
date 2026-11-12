# 项目提交、读回与恢复

主任务和受委派的工作台操作者，在执行对应正式操作前查本页。主任务安排写入范围和顺序，操作者按委派执行并交回保存结果。专业判断与完整交接沿[共同约定](../../_shared/PROJECT_REVISION_AND_HANDOFF.md)，各专项的具体字段以实时 MCP Schema和下方对应参考为准；这里不维护另一份完整工具清单。

## 一次提交的完整循环

先确认真实 Project、当前 Revision、目标对象与上下游依赖、未完成 Job，以及该修改是否已通过别处提交。对象选错时先查[项目模型](../../project-basics/references/project-model.md)，不把所有改动都塞进时间线。

主任务提交正式工具操作时，按原作者完整产物装配真实 ID 与参数。工作台操作者使用当前项目、版本和已确定目标完成获委派的调整，专业决定由原负责人负责。确定性项目写入携带当前 `base_revision_id`；异步接口按其真实合同使用 Asset、固定 revision 或幂等键，不能为形式一致虚构字段。新调用采用刚读回的版本，不能把新版本数字换进未重新确认的旧方案。

异步 Job 的依赖和后续动作按实时接口执行。OD 阶段制作由主任务通过 `start_motion_authoring` 预先委托明确目标，连接器核对依赖、自动登记及采用可用范围，沿[生产入口](../../opendesign-video-production/SKILL.md#调用与续接)接回固定版本；无需逐步搬运。独立作品生成仍可使用已明确目标的 `on_success`。主任务消费回执，通过工作台检查结果，只有需要文件时才明确提交预览。相关依赖变化交原负责人处理，不只替换版本号。互不依赖的研究、设计和生成继续并行。

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

`record_creative_decision` 使用 `phase`、`assignment_id`、实际 `input_revision`、明确 `object_ids` 和 `operation_id`。创意与机制研究分别使用 `creative_research`、`motion_research`，填写真实 `research_outcome` 和依据；部分结果或尚未核实使用 `pending`，完成研究用 `researched`，明确不适用用 `not_applicable`。实际研究的库参考以 `research_references` 记录类型、编号和来源指纹；视觉设计用 `input_decision_ids` 引用实际接收的研究，导演采用引用视觉设计并填写 `delivery_ref` 的 `manifest_path、manifest_sha256、scene_ids`。研究后未采用也记录真实结论。

导演完成主要采用判断后，主任务以 `manage_visual_treatment.adopted_decision_ref` 关联本次 ProductionRun 和决定，并写入本场实际采用素材。用当前版本和 `visual_treatment_ids` 启动制作。状态读回与续修按受影响范围处理，当前采用改变后核对 stale 和声音未完成项。

这些字段不能认证真实宿主调用，也不证明当前负责人已接任或实际看过媒体；接替与迟到结果按共同交接约定核对。旧报告作为审计资料读取，后续范围由新 Run 承接。
