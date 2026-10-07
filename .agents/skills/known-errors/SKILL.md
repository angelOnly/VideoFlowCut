---
name: known-errors
description: 处理 Revision 过期、素材未就绪、Bridge 409、run_id 丢失、输出缺失、浏览器解码、Remotion、Mask、Preview、导出和结果未知等确定性错误；创作问题退回专业负责人。
---

# 已知错误、结果未知与可靠恢复

## 协调者、创意负责人和修复任务的边界

主任务按[协调入口](../production-coordinator/SKILL.md)只读核对当前 Project、Revision、Job 和副作用。创意方案是否仍成立交回原子代理判断；本 Skill 中的“重新判断”不授权主任务补做创意。剪辑任务遇到工具或 Runtime 故障时停止该步并提交独立 Repair Ticket，环境和源码修复交独立修复任务。本 Skill 后文的重提、修复和恢复方法均受[运行合同](../_shared/MCP_EXECUTION_CONTRACT.md)约束：需要部署修复时，原剪辑任务重新连接并确认部署后，才由主任务基于重新读取的事实提交；没有副作用本身不构成重试许可，结果未知不得重放。

素材搜索错误以结构化 `code`、`stage`、`recovery` 和副作用信息定位。`ASSET_PROVIDER_UNKNOWN` 是名称无效，先读 `list_asset_providers`；`ASSET_PROVIDER_NOT_CONFIGURED` 才是已知服务未启用。只有 `sideEffects="none"` 与 `safeToRetry=true` 同时成立且有具体纠正依据时，主任务可纠正参数或等待限流时间后再搜索一次，同因再次失败即报障。`ASSET_NETWORK_TIMEOUT` 等环境故障仍交修复任务，不能在剪辑中改代理配置。部分候选的 `diagnostics.complete=false` 不等于空结果；保留已得候选和警告，不复用其作为完整搜索结论。

## 先区分技术错误和创作问题

`inspect_asset` 返回 `diagnostics.status=partial|unavailable` 是带有效证据与缺口的正常审阅结果，不按通用工具报错停工。依据 `diagnostics.recovery` 分流：`diagnostics.recovery=inspect_available_evidence` 把实际图片、代理与失败位置交原素材作者决定下一步；`diagnostics.recovery=select_another_candidate` 暂不采用当前候选，继续正常搜索与获取；`diagnostics.recovery=report_platform_failure` 才停止受影响步骤并报修，其他无依赖工作继续。`issues[].owner=source|capability|unknown` 分别表示该素材/范围不可用、解码能力限制、原因尚不确定；空输出与超时不能证明原视频损坏。未生成连续代理的 range/dense 不得凭截图宣称正式选段审阅通过。`sideEffects=review_cache_only` 如实表示缓存写入，不是下载/生成重试许可，不改 Asset 状态或视频 Revision。`not_ready` 等待媒体分析；真正的工具调用错误、非法输入和未知写入结果仍沿原合同处理。

理想字体未收录是用户选择问题，不报告平台工单。主任务控制，原视觉作者推荐最多3款库内字体，通过`get_editor_url(panel="fonts",font_preview=...)`提供实际文案预览，等待用户在聊天选择后续接原作者修订。未回复不自动替代，其他无依赖工作继续。`submit_motion_work`仅在返回`code=MOTION_FONT_UNKNOWN`、`stage=validation`、`sideEffects=none`、`safeToRetry=true`、`recovery=select_registered_font`时允许按选择纠正，这是createJob之前的拒绝，不重放原输入；不能扩大到生成失败或未知结果。已登记字体原件损坏、读取/加载失败仍报平台故障。

素材获取故障修复并确认部署后，先读回候选和旧 Job；仅明确 `failed` 且未登记素材时，可通过 `acquire_media_asset` 使用新幂等键恢复原候选。平台重新核验当前技术条件，旧失败 Job 不改写；执行中或结果未知时不得恢复提交，人工拒绝也不能用此路径覆盖。

技术错误有明确状态或合同，例如 Revision 冲突、Schema 409、文件损坏、Job 失败、Asset 不可读、Remotion 渲染异常。创作问题是语义不完整、B-roll 无关、节奏单调、字幕竞争和 Scene 像 PPT。不要把所有问题都放进 known-errors，也不要用重试处理审美问题。

## Revision 过期

项目默认24fps不再表示无法改成30fps。先读实时工具表与 `timeline.fps`，使用 `preview_project_frame_rate_change` 核对报告，再经 `set_project_frame_rate` 正式提交。`PROJECT_FPS_PENDING_JOB` 要求对账相关未终态任务；`PROJECT_FPS_RANGE_COLLAPSED` 等错误定位实际短范围和切口，不偷偷丢片段或修改原件。分数帧率尚未支持，需明确规格范围。`OUTPUT_FRAME_RATE_MISMATCH` 表示实际 Preview/Export 的帧率或帧数不符合固定Revision，按平台工单处理，不用旧文件冒充新输出。

症状：写入基于旧 `base_revision_id` 被拒绝。处理：重新 `read_project` 和目标对象，查看其它修改与 Impact，重新判断原操作是否仍成立，再基于新 Revision 提交。禁止简单替换 Revision 数字后重放。

## Project 未定位或对象不存在

先 `list_projects` / `target_project`。对象 ID 来自当前 Revision；旧 Scene、Cue 或 Item 可能已被删除。不要用名称猜 ID，也不要创建一个“差不多”的新对象掩盖引用失效。

## Asset 未就绪

区分文件不存在、元数据失败、无音轨、浏览器不支持、Render Worker 不可读和角色错误。查看 Asset、Job 和 failureReason。无音轨对静音 B-roll可以合法，对 VoiceReference 不合法。不要把所有状态都标记为 failed。

## Bridge 409

工作流 Schema 已变化或不可用。重新读取 Workflow Detail，检查 available/reason，用新的 schemaVersion、fields 和 itemSlots 重建请求。不能只替换版本号而保留旧 field ID。

## run_id 丢失

ComfyUI 重启后旧 run 可能无法查询。检查本项目 Job、请求摘要、本地下载和目标 Asset。如果输出已下载并验证，不重复生成；没有副作用且任务无法恢复时，使用幂等策略重提。对生成内容要记录新 run 和结果差异。

## Job succeeded 但输出缺失

这是失败，不是成功。检查 outputs kind、downloadUrl、MIME、文件大小和本地注册。文本工作流读取 text，不寻找文件；音视频要下载并校验。HTML 错误页不能当媒体。

## Preview 抽帧失败

确认 Preview Job 属于当前 Project、Revision 和范围，文件存在且可解码。当前实现会先删除同名旧帧，防止误用历史证据。不要在抽帧失败时仍引用旧截图作为本次审片。

`inspect_asset` 对同项目帧率的受管作品使用精确 motion.frameCount，半开完整范围为 `[0, frameCount)`。整数毫秒可能少于精确帧时长，不能自行减掉末帧后宣称完整审阅；跨帧率素材仍使用返回的项目 FPS 源范围。边界或末帧解码出错时提交工单，修复后重新取得完整代理。

## 模型推理成功但观察无效

Bridge succeeded 只表示推理结束。读取原文、输入哈希、分析版本与模态覆盖，不能据此标记声音适配或采用通过。结构恢复不补定位、人声或音乐的未知条件；未定位描述继续缺少连续采用范围证据。

解析失败会保留原文与已知 run ID。工单部署确认后，`retry_media_job` 可在新的显式恢复任务中重算已经结束但被拒绝的输出，原任务证据仍保留；同一次恢复不重复 POST。观察版本变更时也不能把旧输出重新标成新版。正在运行或提交结果未知的检查点必须先继续读取/对账，不会为换版本自动重放提交。

## 浏览器和 Render Worker 不一致

检查是否使用同一 Revision Snapshot、资源路径、字体、编解码器、画幅和 Runtime 版本。浏览器正常而导出失败时，不用浏览器截图冒充最终 Artifact；修复环境或资源。

## Mask 错误

检查 Mask Asset、时长、帧率、分辨率和边缘。无 Mask 时使用明确降级，不把 rear layer 当真实人物后景。Mask 失败属于人物/合成技术问题；“后景不该出现”属于视觉判断。

## Remotion 组件失败

受管字体先查询 `read_motion_capabilities`，使用 `fontBindings` 与平台注入的 `props.fonts`。`MOTION_IMPORT_REJECTED: useEffect/useState/delayRender/continueRender` 若来自字体加载代码，由原作者按已发布合同改写；不能只删第一个导入后继续使用浏览器全局。`MOTION_FONT_UNKNOWN` 先核对实际目录；已登记文件缺失、变化、加载失败或超时属于平台修复范围，失败不替换绑定字体、不生成半件 Asset。`MOTION_FONT_CACHE_CORRUPT` 表示完整作品字体副本或绑定损坏，不静默重生覆盖。没有字体文件加载错误，不应把字形覆盖或排版问题扩大成Runtime崩溃。

新受管视频按videoBindings源毫秒半开范围、作品startFrame/endFrame及fps检查，帧数以endFrame-startFrame为准，允许1毫秒取整与不足一帧余量；不匹配时Schema拒绝创建Job。调整选段或作品范围后提交经确认的新版本，不加源码偏移掩盖差值。MOTION_VIDEO_SOURCE_SHORT保留实际源证据，由修复任务核查PTS与边界，不冻结末帧。TimelineVideo读取作品根时钟，Sequence只改变显示与布局。历史产物可读，旧引擎重新生成返回MOTION_ENGINE_UPGRADE_REQUIRED，须按新合同提交。MOTION_DISK_SPACE检查真实空间与安全余量；MOTION_VIDEO_WORKING_SET检查单块工作区配置，不以累计解码512MiB要求导演拆件。MOTION_VIDEO_CHANGED会使解码缓存失效，防止恢复原片后误用错误帧；剪辑任务仍沿Repair Ticket报障，不自行修改平台。

动画Job失败时读取track_job.error与result.diagnostic的实际错误码和信息；成功后读取Asset、固定版本及videoDecodes，不把缓存统计或临时帧当成可交付作品。候选实现新增track_job.result.motionProgress的stage、currentFrame、lastCompletedFrame和lastProgressAt；必须核对实际部署后读取，不能从updatedAt续租心跳推断进展。失败报告在result.motionFailure中保留首次异常栈、附加错误、浏览器事件、退出状态和reportPath，运行诊断独立于素材和Revision。

`MOTION_NONDETERMINISTIC` 先读取 `track_job.result.motionDiagnostics`：其中 `reportPath` 指向包含具体帧号、可见差异幅度和区域的 JSON，`differences[].paths` 相对于报告目录，分别保存首次画面、重复截图和放大差异图。失败证据独立保留，临时帧缓存清理，不创建作品 Asset 或视频 Revision。哈希不同会继续比较黑、白背景上的合成像素；每个通道最多两个色阶的差异标为 `tolerated` 并允许生成待审代理，超过则失败。不能只看全图平均差异忽略局部丢字，也不能把 tolerated 当作审美通过；缓存文件完整性仍要求哈希完全一致。剪辑任务遇到失败仍提交独立 Repair Ticket，由修复任务依据对比证据定位，不重放写入或自行放宽检查。

候选渲染器对内部 index.html 的“but got no response”最多恢复两次：这是并发导航的 CDP 响应事件竞态，每次仍须完整渲染成功。持续失败保留 Job 诊断，不由剪辑任务重放写入；资源、安全、内容和外部生成错误不走该恢复。

先区分 Props/AssetBinding 错、组件 Bug、局部时间错误、资源不可读和布局问题。生产任务使用 Registry 或受管作品；平台组件开发失败不能绕过受管链执行未审核代码作为 Fallback。组件修复后需要 Registry/Golden/Player/Render 回归。

## Export 失败

导出条件失败时先查看该 purpose 的技术阻挡；AI 审阅缺失或待复核不阻挡制作和导出。Render 失败时查看日志和 Asset；文件技术验证失败时保留临时诊断但不发布。禁止静默交付只有 A-roll、缺字幕或缺动效的降级文件。

## 结果未知的通用规则

稳定 MCP 连接在已部署 Runtime 通过发行摘要与健康核验后，才会在两次调用之间切换业务进程。新连接按输入、输出与行为合同检查变化；说明文字仍发送目录更新通知，但不把说明变化误当参数变化。输入约束、默认值、输出结构和 readOnly 等行为提示变化仍须刷新。

`MCP_TOOL_SCHEMA_CHANGED` 表示该次未执行：有宿主工具刷新能力时重新读取实时表并判断参数；没有刷新能力或实际重读后仍是旧表时，报告独立 Repair Ticket，由修复任务处理兼容发行或连接更新，不能反复发同一写入。结束活动轮再续办不保证刷新，已运行旧连接的外壳代码也不会因安装新版自动替换。不能只因 Release 同版就认定工具表已刷新，也不能为通过而跳过实质参数保护。`MCP_CALL_CANCELLED` 表示排队期间取消、未执行；`MCP_CALL_OUTCOME_UNKNOWN` 不表示失败前没有写入，必须按下面的对账规则处理。部署切换后仍需重新读取当前 Project/Revision，并由原剪辑任务确认 Repair Ticket；保留了项目定位不等于保留了当前 Revision。

`Transport closed` 表示宿主到连接管理层本身已经断开，不能通过重复提交写操作恢复，也不能声称后台 Runtime 健康就代表这个任务已经接上。修复任务应使用宿主支持的会话恢复机制，并以原任务的真实调用作为恢复证据。

```text
先读 Job
→ 读 Project/Revision
→ 查目标对象和本地文件
→ 判断是否已有副作用
→ 只有确认没有时才重试
```

不要把“没有收到响应”当“没有执行”。

## 常见错误代码与归属示例

| 情况 | 首先检查 | 返回负责人 |
|---|---|---|
| `PROJECT_NOT_TARGETED` | Project ID / target_project | project-basics |
| Revision conflict | 当前 Revision 和并发修改 | 原专项重新判断 |
| `UNSUPPORTED_MEDIA` / media failed | 扩展、MIME、ffprobe、编码 | asset-import |
| Bridge 409 | Workflow Detail 与新 Schema | transcription / voice / provider |
| `PREVIEW_NOT_READY` | Job 类型、状态、Revision | web/quality |
| `COMPOSED_FRAME_EXTRACTION_FAILED` | Preview 文件、帧范围、ffmpeg | preview runtime |
| `PROJECT_GRAPH_INVALID` | 悬空 Story/Scene/Item/Cue | Application + 原负责人 |
| 旧版 `EDITORIAL_REVIEW_REQUIRED` | 当前发行已取消 AI 审阅导出依赖；核对 Runtime/MCP 版本 | 平台修复 |
| `REMOTION_EXPORT_FAILED` | Runtime、Asset、字体、组件 | remotion/export |
| B-roll 无关 | 不是技术重试问题 | visual-treatment/cutaway |

具体错误名称以当前代码为准，表格用于分类思路。

## 日志和用户沟通

历史 Repair Ticket 先按工具、错误码、Release、Job 和根因审计；没有 Job 关联不等于平台缺陷，Job 后来成功也不等于原报告已经处理。平台缺陷沿候选验证、正式部署、原报告剪辑任务重连确认的路径收口。正确输入拒绝、重复报告或宿主外部恢复，由修复者接手后调用 `resolve_repair_ticket_without_deployment`，明确分类和证据；不能以此替代真正需要部署的修复，也不能批量按状态猜测关闭。

用户需要知道发生了什么、是否产生副作用、下一步是什么；不需要看到无法行动的长堆栈。内部日志保存 Project、Revision、Job、run_id、工具、错误码和资源，但避免泄露密钥和敏感本地内容。

## 不允许的恢复

- 删除数据库行让错误“消失”；
- 将 failed Job 改成 succeeded；
- 使用旧 Preview/帧冒充新证据；
- 伪造审阅通过；
- Remotion 失败时交付只含主轨文件；
- 工具缺失时伪造返回；
- 创作问题反复重试同一技术任务。

## 交接

技术错误恢复后返回原主工作流或专项 Skill，让其重新判断结果是否仍符合创作意图。已恢复不代表质量通过；必要时重新 Preview 和审片。


## 参数拒绝与原始错误证据

调用结果先检查 `isError`，保存完整文本后再按实际内容解析 JSON；协议层 Schema 拒绝可能只有文本，解析失败不得覆盖原始错误。参数拒绝、业务冲突、运行故障和写入结果未知分别记录。仅明确 `stage=validation`、`sideEffects=none`、`safeToRetry=true`、`recovery=correct_input` 并指出字段纠正依据的参数拒绝，允许按实时 Schema 纠正后提交一次；不重放原请求，同因再次拒绝报障。协议层文本拒绝必须核对实时 Schema 和当前 Revision，确认未进入业务执行后才能纠正。此例外不允许重试已创建的下载、生成 Job、运行失败或结果未知，不更换幂等键绕过。字体选择继续遵守人工选择合同。
