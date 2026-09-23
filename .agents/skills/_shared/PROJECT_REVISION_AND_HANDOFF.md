# Project、Revision、Skill 交接与执行安全

<!-- topic-film-v2-shared-handoff:begin -->
## 主题驱动整片的交接正文

用户只给主题的原创生产，按 [主题到成片](TOPIC_TO_FILM.md) 与 [场面执行正文](SCENE_DESIGN_HANDOFF.md) 组织。导演给完整当前稿和观看过程；作者给美术、准确文字、路径、时间用途和实现参数；协调者只装配真实对象并回传完整版本。

这些文档是现有交接内容的写法，不新增Project对象、API参数或用户表单。完整深化稿正常回导演形成统一采用稿，再交原作者实现。案例是按任务选读的内部参考，不要求用户提供视频或截图。
<!-- topic-film-v2-shared-handoff:end -->

## 一个事实源

Project Revision 是视频工程的唯一事实。Codex 对话、已加载 Skill、浏览器选中状态、临时 JSON、ProductionRun 报告和 Worker 内存都不能成为第二份 Story、Scene 或 Timeline。新会话恢复时必须重新定位 Project，读取当前 Revision、未完成 Job、最近 ImpactReport、素材就绪、Story、Scene、Timeline 和 Quality，再决定继续做什么。

当前第一版可以只有一个默认 Timeline/Sequence，但架构上必须区分平行成片版本和同一版本的 Revision。做短版、竖版或高光版不能通过覆盖长版或回退历史来实现。代码尚未支持多 Sequence 时，Skill 应明确这一能力缺口，不伪造版本对象。

## 技术检查、辅助审阅与人工定稿

技术检查验证文件、引用、版本、范围、渲染和对应用途的素材许可；失败只阻挡相关操作。AI/子代理审阅用于提示疑似错字、遮挡、节奏、声音和表达问题，不作为放置、修改、继续制作、ProductionRun 完成或导出文件的前提。未审、failed、inconclusive、静帧修复后尚未连续复核及未关闭 Findings 均保留真实状态与严重程度，不伪造 passed，也不导致整片停工。缺少宿主感知能力时暂停该项辅助审阅，交付可观看文件让用户判断，继续其他已授权制作。

专业判断仍交真实导演/专项/审片子代理；最终效果和是否定稿由用户把控。用户反馈驱动修订；修改后旧结论不自动覆盖新版本。ProductionRun completed 只表示本轮制作完成；Export Job succeeded 只表示文件生成并经技术校验。人工定稿用 `approve_export_artifact` 绑定指定 Artifact、file_hash 和 confirmed_by_user=true，必须已有用户对该文件的明确确认，不能把沉默、生成成功或 AI 结论当作确认。

`draft` 表示内部审阅，`delivery` 表示对外交付用途；两者都按技术与用途许可导出，不要求 AI 五轮审阅。`read_quality_report.exportReadiness` 分别返回两种用途的阻挡原因。许可不明确时不能因“内部使用”直接放行；只有真实依据允许的范围才能登记到 provenance.usage_rights，派生动效继承来源限制。导出文件和人工定稿分别报告，保留未审范围供用户参考。

## 代理角色与交接

主任务读取 `project-basics` 与 `production-coordinator`，负责沟通、事实准备、真实分派、版本管理、确定性提交、技术检查与交付；导演子代理读取 `production-director` 和唯一主要视频工作流，负责观众承诺、主线、整体风格、阶段安排和跨段协调；专项子代理负责完整范围的创意产物与修订；审片子代理负责实际声画的专业判断。文中“主工作流”指导演的专业职责，不指协调主任务。

主任务通过当前宿主 `spawn_agent` 真实分派，通过 `followup_task` 续接原负责人。已授权子代理直接完成创作并按需读取相关 Skills，不递归分派；导演和专项需要其它负责人时返回工作请求，由主任务调度。案例和共享资料由当前创意子代理读取，不因文件数量增加代理。

输入与输出沿用现有 Project 对象、CreativeDecision 和报告，不新增第二套 Story、Scene 或 Timeline。每次交接至少包含：

| 进入事实 | 子代理返回 |
|---|---|
| 分派标识、角色、任务范围、验收要求 | 完成范围、剩余事项和原分派标识 |
| Project、输入 Revision、对象 ID、源与成片范围 | 依据的输入版本、产物与现有对象的对应 |
| 用户硬约束、事实素材、时序精度、整片风格与前后接口 | 完整文稿、源码、素材选择或参数，选择理由与限制 |
| 已有 Preview、源素材、声音与质量证据 | 实际观察及证据引用，待获取的素材或 Preview 请求 |
| 当前依赖、Job、Impact 与 stale | 影响范围、待提交步骤、需重建或重新审阅的下游 |

主任务保存宿主返回的真实 agent ID 与分派标识的对应，收到完整创意产物后才装配项目命令。它可补真实项目/对象 ID 和无歧义参数，不能补写文稿、构图、时机或源码。产物不完整时返回原代理补全；等待素材或预览不算完成。专业 Skills 正文中的执行和写入步骤由主任务落实，子代理不直接提交正式项目、生成 Job、审计或审阅记录。

### 负责人接替与结果接收

原负责人是否可续接，先以宿主 `list_agents` 和实际 `followup_task` 结果判断；`completed` 和 `interrupt_agent` 均不证明释放名额。满额时优先复用现有职责合适的空闲代理；没有合适负责人则等待该项依赖，不能用创建更多代理处理名额不足。具体分支见[协调入口](../production-coordinator/SKILL.md#名额不足时续接与接替)。

每个工作范围在主任务交接记录中只保留一个当前负责人，复用现有 assignmentId、agentId、inputRevision，不新增项目调度对象或视频 Revision。接替时记录旧分派与接替原因，为接任者分配新的 assignmentId 并使用宿主返回的真实 agentId；将用户约束、原稿/源码/参数、已提交对象与版本、最新预览及范围、未完成事项一起传递。接任者先确认输入版本与范围，明确接受或列出缺失请求；交接未确认不算该范围已经恢复。

接任后，主任务核对回复中的 assignmentId、实际发送代理、inputRevision 与当前负责人记录。旧负责人迟到回复不自动成为待提交命令，保留为历史材料；仍有用的内容交当前负责人重新判断。当前负责人基于旧输入返回的结果也须对照真实变化确认后才能提交。尚未取得宿主真实返回标识或尚无 Project 时，仅对应的缺失字段保持未建立，不能为了记录而编造。

### 事实交接与能力核验

主任务在首次分派时提供完成当前范围所需的事实，并标明读取工具、读取时的 Project/Revision 及原始结果引用；不是只发送“自行读取项目”。首次与续接后的子代理均检查本轮实际工具表，区分工具不可见、Schema 不匹配、调用失败、结果已返回但材料不足。仅在工具实际存在时做必要的只读调用；主任务转交参数定义不等于子代理获准或能够调用该工具。

| 必要输入 | 交接要求 |
|---|---|
| 版本与对象 | Project、读取时的 Revision、相关对象 ID、源与成片范围；尚未建项时明确未知 |
| 产物与执行事实 | 原方案、完整源码/Props/参数、已提交对象与 Job 状态；失败或未知结果如实保留 |
| 实际观察材料 | 源媒体或 Preview/帧/音频的可访问路径、所属对象、版本与范围；接收者实际打开所需材料 |
| 接口与约束 | 本次相关的实时 MCP Schema、用户硬约束、前后接口和时序精度 |
| 差异与请求 | Impact、stale、输入变化和缺失项；子代理按具体对象、版本、范围请求补充 |

上述内容只是宿主消息中的事实交接，来源仍是正式 Project 与工具结果，不落成第二套可编辑 Timeline。子代理工具缺失先报告，由主任务用自己可用的正式只读 MCP 补充；这不认证子代理工具访问已恢复。主任务也缺能力则保留该项阻断。新读取发现版本变化时回传差异，接收者确认后使用，不只替换包内版本号；主任务不能用自己的观感替代接收者对真实材料的观察。

所有正式写入、生成与渲染提交、审计保存由主任务排序。会在完成时回写项目的异步 Job 纳入写入安排：依赖它的写入必须等待终态，再读回 Revision、目标对象和 Impact。输入对象或上下文变化时，把差异交原负责人重新确认，不能只换 `base_revision_id` 重发旧产物。独立设计和资料审阅可并行，正式项目不能让多个代理同时写入。

主任务将实际版本与可访问的真实声画证据交回原代理，通过“产物 → 提交 → 读回 → 预览 → 修订”闭环收口。技术核验归主任务，表达、节奏、自然度与审美归子代理。跨段分歧交导演，最终专业审片由审片子代理承担；代理的文字描述、播放器已启动和工具成功不证明真实观看。缺能力或工具阻断由主任务沿 Repair Ticket 流程处理，不默默退回主线程创作。

## 读—判断—写—读回

所有确定性写入都遵循同一循环：

```text
确认 Project 和当前 Revision
→ 读取目标对象、上下文和依赖
→ 创意子代理专业判断并交付完整方案（明确参数的机械修改可直接执行）
→ 主任务核对输入与依赖，使用 base_revision_id 原子写入
→ 读取新 Revision 和目标对象
→ 读取 ImpactReport / stale / Dirty Range
→ 主任务回传实际视觉或声音证据，原子代理审阅修订
→ 将结果交回导演子代理中的主工作流
```

MCP 返回 success 只证明命令执行，不证明对象关系、画面和听感正确。Web 和 MCP 不得同时提交同一个修改；Browser Operator 可通过可见 UI 观察并回传证据，正式剪辑写入由主任务使用已发布 MCP 完成，不用浏览器脚本或临时代码绕过。

## 实时 MCP 输入合同

工具名、字段名和枚举以当前会话的 MCP Tool Schema 为准；本项目已验证的阶段一调用链和关键字段见 [MCP 执行合同](MCP_EXECUTION_CONTRACT.md)。该合同会被静态测试对照 `apps/server/src/mcp.ts`，不是需要人工维护的能力快照。

会创建或修改 Project Revision 的确定性命令必须携带刚读回的 `base_revision_id`。提交转写、语音、预览和导出等异步 Job 则使用其自身的 `asset_id`、`revision` 或 `idempotency_key`，不能为了形式统一伪造 `base_revision_id`。每次写入返回新 Revision 后，下一次写入必须以新 Revision 为起点。

## 剪辑阻断与平台修复交接

视频创作与平台修复有两个不同事实源：Project/Revision 记录成片事实；SQLite `repair_tickets` 记录剪辑任务无法继续时的能力缺口、修复、发行切换和恢复确认。Repair Ticket 不进入 `ProjectSnapshot`，因此报告、接手或部署工单绝不能制造视频 Revision 或改变 Timeline。

剪辑 Agent 只用已发布 MCP 能力。遇到阻断时读取当前 Project 和 Revision，使用 `report_editing_blocker(reported_revision, category, summary, reporter_id, idempotency_key, ...)` 记录可复现事实并暂停；不能改源码、重启服务、切换插件缓存或以临时绕过继续写入项目。`reported_revision` 是当时所见的历史事实，不因其他任务后来产生新 Revision 而失真。

修复 Agent 接手 `open` Ticket 后只改平台源码和隔离候选环境；它不能编辑正式视频项目。候选版必须在独立端口、独立工作区验证，不能让 A/B 两个 Runtime 同时消费生产 `app.sqlite` 的 Job。通过复现和回归后，以构建 Manifest 的 `releaseId` 调用 `mark_repair_candidate_ready`。只有重部署后新版 MCP 与 Runtime 的 `read_runtime_release` 都返回相同、健康的 `releaseId`，原接手者才能调用 `mark_repair_deployed`。

最后由**原报告阻断的剪辑 Agent**重新连接 MCP，读取当前 Project，确认仍能看到当前 Revision，再调用 `acknowledge_repair_deployment(observed_revision, ...)`。这个确认不产生 Revision，但防止旧 MCP 会话或其它 Agent 把部署写成已恢复。Release ID 不一致、Worker 未健康、候选版与部署版不一致、Reporter/Repairer 角色不匹配时一律停下并读取工单状态，不猜测成功。

## 对象选择

用户意图应落到最接近的对象：删一句改 SemanticUnit/Script；修改叙事顺序改 Story；改变一段怎样被看见改 Scene/Visual Treatment；微调某个动画改 EffectCue；替换 Effect 绑定改 AssetBinding；替换单条 Cutaway 源素材改 `replace_scene_asset`；移动物理播放范围改 TimelineItem；重新导出不修改创作状态。

把所有问题都塞进 Timeline 会丢失语义；把所有微调都写回 Story 又会让上层对象承载物理细节。选择错误层级会导致 Impact 传播不可靠。

## 专项 Skill 的交接合同

视觉输入带完整任务、范围、约束/候选与前后接口；输出带创作决定、固定作品版本、覆盖 Beat、事件帧和实际证据。沿用当前对象与 CreativeDecision，不新增第二份事实源；写后读取 Revision/Impact，主线内容变化使作品与声音复核失效。

“输入”和“输出”不是函数 Schema，而是阶段交接：

- **进入事实**：当前 Revision 中哪些对象和证据已经稳定；
- **阶段结果**：实际修改了哪些项目对象，或形成了什么当前无法执行但可审查的决定；
- **失效传播**：哪些下游需要重算、stale、review 或重新生成；
- **验证证据**：读回什么结构、看哪些画面、听哪些声音。

专项子代理完成后必须把这四项经主任务交回导演的主要工作流；局部任务直接交回协调者按原范围收口。只记录 `loadedSkills`、只写一句“字幕已处理”或只产生一个 Job ID，都不算完成交接。

## Revision 冲突和结果未知

发生 Revision 冲突时不覆盖。主任务重新读取最新 Project，确认其它修改改变了什么，把受影响输入交原子代理重新判断，不能自动替换版本重发。超时、断连或 Bridge 重启时，停止该步并报告阻断，先检查 Job、Revision、Asset 和已下载输出；未确认结果前不重试写入。幂等键用于防止重复任务，不用于掩盖状态不清。

## ProductionRun

ProductionRun 和 SkillExecutionReport 用于审计：选择了哪个主工作流、实际读了哪些 Skill、做了什么决定、拒绝了什么方案、调用了什么 MCP、查看了哪些 Preview。它们不参与 Remotion 编译，删除报告不能改变成片。

CreativeDecision 可带 delegation 记录真实分派对应的 agentId、assignmentId、role 和 inputRevision，产物与证据沿用 objectIds/evidence。平台核验输入 Revision 属于该 Project，不要求历史输入版本等于写入后的当前版本；主任务仍负责提交前的依赖确认。来源字段只作追溯，不能认证真实宿主调用。旧报告没有 delegation 时继续可读，不能倒填虚构代理或把旧报告当成已完成创意子代理验收。
