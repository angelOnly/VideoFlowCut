# VideoFlowCut 制作链路架构优化：问题盘点、职责分工与开发细则

日期：2026-10-30（北京时间）  
状态：方案基线已形成对应代码及候选验证；实际开发范围、测试与未部署事项见[开发与验收记录](E:/ai/VideoCut/docs/development/制作链路架构优化_20261030/开发与验收记录.md)。本文保留设计要求，不把源码接口称为当前已连接服务的Schema。  
适用范围：VideoFlowCut 与 OpenDesign Cloud / Local Codex 协作的完整制作链，重点使用本次纯旁白解释片验证。其他视频类型继续保留自己的内容、原声和人物权限。  
主文档位置：E:/ai/VideoCut/docs/VideoFlowCut_制作链路架构优化_问题盘点与开发细则_20261030.md

## 0. 阅读约定与实施边界

这份文档同时回答四个问题：

1. 三小时里哪些重复确实存在，哪些只是看起来重复？
2. 每种决定和状态归谁负责，哪些责任不能交给程序猜？
3. 具体改哪些接口、字段、函数、事务、任务和技能条款？
4. 怎样逐批做出可工作的版本，并验证没有以降低质量换取速度？

证据分为三种：**本片已发生**、**当前源码或规则确认**、**仍需隔离复现/核查调用者**。静态代码冲突不自动等于本片实际触发，也不能直接折算为节省分钟数。

本文中标为“拟新增”“拟调整”的类型、字段、动作和函数都是设计，不是已发布 MCP Schema。开发者必须同时修改接口、应用、执行、调用方和测试后才能使用。代码块展示目标合同与关键算法，不是可直接复制替换现有工程的完整补丁。

当前仓库 HEAD 为 9e91eacfdf4ef395e2760048447f13aa29a67e6d，但存在此前已形成、尚未提交的源码及发行物修改。**HEAD 不等于本次运行代码。** 开发开始时记录实际工作树差异及发行摘要，保留无关修改，不回退整个目录。

本片审计采用的已部署基线为 VideoFlowCut 0.1.105：

~~~text
release-91418a0cc286a7b8a1f76c2671cfc0ddc070a9c5a491bc6b56f73ab7aac68630
~~~

本方案不新增第二时间线、第二项目状态库、通用流程编排服务或另一套渲染器。优先复用 EditingApplication、现有 SQLite 仓储、Job、Worker、缓存、Review 和技能同步脚本。确已废弃的执行路径直接删除，不增加兼容分支或静默回退。

开发验证使用独立项目、目录、端口和队列；正式项目仅作为只读取证来源。方案编写、代码完成、隔离验证、发行构建、生产部署和作品交付分别报告。

先看 §1—§4 可以理解为什么慢、谁该负责；§5—§12 是具体接口和执行规则；§13—§19 是修改清单、开发顺序和验收。文中的几个术语可按下面理解：

| 术语 | 大白话 |
|---|---|
| Revision | 工程第几版，说明此刻采用了什么画面、声音和字幕 |
| Job / Worker | 一张执行工单，以及实际领单干活的程序 |
| Cue / Asset | 时间线上怎么用一段内容，以及被使用的实际素材 |
| 冻结包 | 作者明确交出的固定文件，后面继续改稿也不会改变这一包 |
| 依赖指纹 | 把“这项工作真正依赖哪些内容”算成可比较的身份，用来区分无关改动和必须重新确认的改动 |
| 短事务 | 必须一起成功的数据库修改一次提交；中途失败就一起撤销，不能留下只换了画面没接上声音的半成品 |
| 幂等 | 同一次请求重复送达仍只做一次；新的决定使用新的请求身份 |

## 1. 实际基线：优化的目标是整条制作链

### 1.1 本片与主要时间

项目：project_ba08e336-c27d-464e-9b4b-8e28764cfd59。最终 Revision 123，1920×1080、30 fps、2488 帧，约 82.93 秒。开始于 14:43:54，正式导出完成于 17:44:57，最终交付回复于 17:52:30，总历时约 3 小时 9 分钟。

| 连续时段 | 约耗时 | 主要内容 |
|---|---:|---|
| 14:44—15:30 | 46 分钟 | 取材、配音与修订、连接误判及配置启动问题 |
| 15:30—16:03 | 33 分钟 | 首版画面制作；实际生产 Run 为 31 分 12 秒 |
| 16:03—16:16 | 13 分钟 | 备注修改、剪辑服务恢复、首次渲染 |
| 16:16—16:57 | 41 分钟 | 透明边缘排查、相关修改、校样及主会话中断 |
| 16:57—17:20 | 23 分钟 | 首次全片、声音采用、合成和问题汇总 |
| 17:20—17:41 | 21 分钟 | 约 12 分钟集中返修、再次全片及最终预览 |
| 17:41—17:52 | 11 分钟 | 输出检查、定向复核、导出和交付记录 |

以上时段不重叠，但各时段内部有并行工作，不可把整段都计为一个动作的净耗时。

| 主要正式任务 | 实际执行时间 |
|---|---:|
| 首轮失败动画 | 81.727 秒 |
| 三次局部校样合计 | 10.408 秒 |
| 首次成功整片画面 | 247.700 秒 |
| 首次有声预览 | 111.832 秒 |
| 最终整片画面 | 252.134 秒 |
| 最终有声预览 | 76.629 秒 |
| 最终导出 | 7.826 秒 |
| 上述九个任务合计 | 788.256 秒，约 13 分 08 秒 |

这些任务排队均不到 2 秒。最终导出命中完整文件复用；不能把合成器内部约 43 毫秒冒称完整导出耗时。

音频辅助分析约 36 分 47 秒，与返修、生成和导出重叠；它完成晚于导出，不能直接算作可节省的 37 分钟。主会话三次容量报错到续接间隔合计 22 分 07 秒，其中最长一次约 19 分钟与故障排查重叠；该间隔不证明服务全程不可用。

首版和末轮 Local Codex 已使用原会话续接，首个模型调用缓存读取比例约 80% 和 94%。不把“加会话续接、加提示缓存”再次列成尚未实现的功能。

### 1.2 已完成与未完成的质量事实

本片已完成正式文件输出、技术核验、定向静帧复核；完整连续动态、正常速度全片阅读和原生完整听审未确认，用户未登记定稿。优化对照不能把旧片假定为“已完整审查通过”的质量基准。

末轮修订已集中处理 5 处证据裁切、3 处遮挡、1 处制作备注，不是每个问题各跑了一轮。必要返修不能作为无效工作删除。

### 1.3 证据入口

- [实际制作状态](E:/ai/VideoCut/workspace/projects/project_ba08e336-c27d-464e-9b4b-8e28764cfd59/production/20261030/当前制作状态.json)
- [Local Codex 实际调用记录](E:/ai/VideoCut/workspace/projects/project_ba08e336-c27d-464e-9b4b-8e28764cfd59/production/20261030/visual/OpenDesign实际调用记录.json)
- [最终交付说明](E:/ai/VideoCut/deliveries/20261030/交出工作_制作说明.md)
- [最终导出执行计划](E:/ai/VideoCut/workspace/projects/project_ba08e336-c27d-464e-9b4b-8e28764cfd59/exports/revision-123/delivery-export_artifact_f46c87be-0cd4-4a4a-8420-dd471f9c828e.mp4.render-plan.json)
- [此前渲染优化实测](E:/ai/VideoCut/docs/development/时间线性能优化_实现与验证_20261029.md)
- [透明边缘原因与处理](E:/ai/VideoCut/docs/development/透明运动边缘修复_20261030/诊断结论.md)

## 2. 二十二项问题与实施对应表

优先级含义：P1 为当前制作链应优先处理；P2 为有条件收益或依赖前项；P3 为维护清理。优先级不代表所有问题都已在本片触发。

| 编号 | 问题、证据等级与影响 | 唯一归属及修改要点 | 具体细则 | 优先级 |
|---|---|---|---|---|
| P01 | 共同分工/交接规则散落多份技能；规则确认，增加重复读取与维护风险 | 共享交接文件维护共同规则；业务技能只保留专项方法和入口 | §4、§13 | P1 |
| P02 | 外层视觉与 Local Codex 都参与设计；边界需明确，但未证实本片设计两遍 | 外层统筹观看目的、材料和连续性；内层深化构图、动作与实现；不另写竞争稿 | §4、§6、§13 | P1 |
| P03 | 字体错误提示要求用户选，技能允许未锁定字体由作者选；规则冲突 | 作者决定合法替代，平台校验实际字体；用户锁定才回询 | §6.5、§13 | P1 |
| P04 | 通用指南要求 HTML+MP4，VFC 要源码；指南冲突，本片未双渲染 | 正式交付路由明确唯一渲染方，保留独立视频路线 | §6.5 | P2 |
| P05 | 简报文件与 prompt 全文重复；本片已发生且技能要求 | 简报为权威文件，调用传用途、身份、关键限制及差异 | §6.1、§13 | P1 |
| P06 | 作者同时维护 HTML、work.source 和哈希；本片已发生 | 作者维护源码和创作参数，程序冻结并组包 | §6.2—§6.4 | P1 |
| P07 | 小写入返回完整项目，任务详情反复携带完整源码；本片响应约 0.5 MB | MCP 返回必要回执，应用持有工程事实，按需读取完整内容 | §5 | P1 |
| P08 | 手写“当前状态”多处维护；本片当前 Run 字段仍指首版 | 基于真实引用生成只读状态，不抄写第二份运行状态 | §14.1 | P1 |
| P09 | 生成、采用、重绑、预览由主会话多轮接力；本片已发生 | 主任务明确委托，应用和现有 Worker 接续确定步骤 | §7 | P1 |
| P10 | Web/MCP 对同类失败任务使用不同恢复身份；源码确认，重复执行待复现 | 应用层统一恢复；入口删除独立重试业务分支 | §8 | P1 |
| P11 | 字幕 Job 与整版 Revision 耦合，规则要求期间停写 | 冻结实际识别输入，回收时比较真正依赖和人工修改 | §9 | P1 |
| P12 | 多 Beat 画面拆分后照搬覆盖声明，与逐段校验冲突；代码确认待复现 | 现有范围替换按真实半开区间计算覆盖、保留语义和声音 | §10 | P1 |
| P13 | 声音计划添加独立意图也要求既有 Cue 重新对账；本片有同步操作 | 原计划事务比较实际依赖；未变关联自动同步版本 | §11.1 | P1 |
| P14 | 纯听音和声画复核共用过宽依赖；无关素材也可能导致过期 | 同一复核机制按方法、实际范围计算依赖 | §11.2 | P1 |
| P15 | 画面换版后事件不变的音效仍逐条重绑；本片已发生 | 采用事务核对事件、语义和时钟，满足条件才一起重绑 | §7、§10、§11.3 | P1 |
| P16 | 整件生成后才集中看到布局/裁切问题；本片已发生 | 同源阶段版本、适当范围校样、有声预览及集中反馈 | §6.3、§12.1 | P1 |
| P17 | 单 speech 请求也先跑多模态；代码确认。本片请求 audio+speech | 能力按问题分流，严格同音源条件下复用已有转写 | §12.2 | P2 |
| P18 | 分析上下文混入期待答案，模型回声后需纠正；本片已发生 | 中性问题与事后比对分离，结果绑定真实窗口和证据 | §12.2 | P1 |
| P19 | 多人局部观察重叠而完整看听未确认；本片已发生 | 共享检查材料，明确观察责任，合并问题；不删必要审看 | §4、§12.1 | P1 |
| P20 | 独立预检、导出预检、渲染输入校验存在交叉；收益待测 | 相同依赖时复用确定检查，每次保留当前可用性与最终输出验证 | §12.3 | P2 |
| P21 | 五阶段门面主要转发；仓内未见生产实例化，外部调用待查 | 业务只归 EditingApplication；确认无用后删转发层和镜像测试 | §15 | P3 |
| P22 | 已停用字幕/VAD 执行类及抛错别名残留；当前源码确认 | 删除废弃执行，保留历史记录读取和现行对齐服务 | §15 | P3 |

### 2.1 不应误删的“重复”

Project Revision、Job、ProductionRun、ExportArtifact、真实 Review、用户批准分别代表工程、执行、工作记录、文件、观察和授权事实。它们不是一份状态的六个副本。

源码工作件、不可变提交输入和历史版本各有用途；成片/视频流/音频/分段缓存是不同粒度。素材作者核实原件与视觉作者检查上屏裁切也不是同一检查。

技能维护源 .agents/skills 与仓库发行目录 plugins/videoflowcut/skills 本轮核对 445 个文件一致，发行副本由脚本生成，不能作为两套手工维护删除。原生续接、提示缓存、局部 proof、同源 proof 采用、渲染复用均已存在，应复用。

### 2.2 哪些要改架构，哪些不用

职责/状态的归属问题主要是 P01、P02、P05、P06、P08、P09；需要明确唯一负责人、权威输入与确定执行边界。P10—P15 主要落在恢复、事务和依赖建模，通常是在现有模块中改一条业务链。P03、P04、P18、P19 有相当部分是规则和操作方法；P12 是具体范围算法缺陷；P21、P22 是维护清理。不能把它们全部包装成重建平台的理由。

下面补列不完全属于“重复/职责不清”的其他耗时与故障，避免只解决 22 项就宣称全部时间问题已解决：

| 编号 | 事实与责任 | 最小修改与实际位置 | 验收与收益边界 |
|---|---|---|---|
| B01 作者制作时间 | 首版 31分12秒、末轮约11分55秒；具体模型生成、思考、文件操作占比尚未拆清 | 原视觉作者减少重复交付，按 §6 阶段发布；Local Codex Run 事件补文件就绪/模型请求/工具耗时，复用原会话和已有提示缓存 | 用真实同类制作记录判断；不承诺换模型提速，不把全部创作时间算浪费 |
| B02 Windows 长正文写入 | 前述排查涉及长命令写文件失败，独立耗时未分离；不与历史 FFmpeg ENAMETOOLONG 混称同一根因 | 作者文件写入使用既有 write_file/文件 API，或脚本文件加标准输入；不把整份 HTML/JSON 拼进命令行。正式交接走 §6 机器传递；不改渲染器来解决作者写文件问题 | 原始调用诊断随实施复现留存；中文、引号与长源码写入前后字节一致，写失败不发布半件，不计未测净收益 |
| B03 平面运动透明边缘 | 已隔离复现小数 translate3d 与文字触发当前 Chromium 非不透明边缘；不是所有三维都错 | 本片原作者已按真实二维用途采用 GSAP force3D:false；方法落入适用的制作合同/已知错误说明。平台保留 alpha、opaque 和合法三维语义 | 复用已存在最小复现及同源 proof；不再立项重复修“全平台透明”，真正三维案例另按真实缺陷定位 |
| B04 每帧捕获与解码 | 两次整片画面各约4分多；已有计时字段，尚不能把整段归因于PNG | 先读取 motion-renderer.ts 的 seekMs/screenshotMs/pixelDecodeMs/pipeWriteMs 和 motion-video-provider.ts 解码/缓存计数；只对实测最大项做小型隔离对照，复用现有浏览器/编码器能力 | 保持帧、alpha、颜色、事件和确定性；不默认换截图格式、删检查或增加并发。已有0.1.105优化不重新算新增收益 |
| B05 配音百分号漏读及返工 | 当前稿记录已支持百分比实际漏读，曾最小修订并只重配相关单元 | 文案在 voice-production 前明确百分比的朗读文本；画内显示仍保留23%/1%。沿现有分段配音和检查点仅重做变化段，再更新真实时钟/字幕，不另建TTS服务 | 专名/数字高风险范围先听查，ASR作辅助；声音变化后的时序必须复核，不假称替换文本无需重对齐 |
| B06 连接、启动与容量中断 | 工具可见性、配置错误、服务状态和模型容量是不同问题；有并行重叠 | 按 §14 并行做真实能力/启动诊断并沿原任务恢复；启动失败及时终态，实际未执行的参数错误可纠正，不重建全套任务 | 报真实原因、保留原Job/Run；不把中断间隔全算服务故障，也不承诺架构能消除供应侧容量限制 |

这几项在开发批次中分别归 A0/A1、A2、C2 和 D 的对应专项，已有修复只做回归。B04 没有量测出新瓶颈前只补报告和对照，不提前更换技术栈。

## 3. 目标架构与必须保持的约束

### 3.1 从“聊天逐步搬运”到“明确委托后确定性执行”

~~~mermaid
flowchart TD
    U["用户范围与约束"] --> C["主任务：沟通、调度、正式委托"]
    C --> D["导演与文案：当前稿、主要取舍"]
    C --> M["素材作者：分批取得真实材料"]
    C --> V["创意与外层视觉：观看目的、连续性"]
    C --> Q["声音作者：声音意图、配音与采用"]
    D -->|"已确定的正文和范围"| A["同一 Local Codex 作者：具体画面与源码"]
    M -->|"已具备的材料"| A
    V -->|"可开始的场面"| A
    Q -->|"真实时钟及相关声音决定"| A
    A --> F["作者明确交件：冻结源码与创作清单"]
    F --> S["VFC 正式入口：组包、真实依赖核验"]
    C --> S
    S --> J["现有 Job 与 Worker：生成并校验"]
    J --> T["应用层短事务：采用、相关声音、版本、预览入队"]
    T --> P["现有合成器：有声预览"]
    P --> R["实际观察：范围、方法、问题"]
    R -->|"画面实现问题"| A
    R -->|"声音问题"| Q
    R -->|"主线或事实问题"| D
    P --> E["固定版本导出与技术检查"]
    E --> O["只读交付视图：文件、看听覆盖、用户确认"]
~~~

创意选择、主要素材采用、构图、动作设计和声音判断仍由负责人作出。系统只执行已明确的作品、范围、绑定和后续操作，不因生成成功自动宣称效果通过。

四条专业分支并行提供真实部分结果，不设“全部交齐才准开工”的总闸门。正式交出的某个范围必须具备该范围需要的真实时钟、关键证据和绑定；未完成的独立材料或声音不阻塞其他范围。所有分支共同修订同一稿，由一位原视觉作者修改同一作品，不表示多人同时写同一源码文件。

### 3.2 每类数据只有一个事实来源

| 数据 | 权威来源 | 可生成的视图 | 禁止另行维护 |
|---|---|---|---|
| 当前创作正文/主要采用 | 本任务已有当前声画稿，导演负责主要取舍 | 各作者的相关段落视图 | 角色各有一份可独立生效的“最终稿” |
| 可编辑视觉实现 | 同一 Local Codex 项目内当前源码 | 差异、预排 | 外层另写竞争成品 |
| 一次提交的视觉输入 | 不可变源码+清单；VFC Job 冻结完整 work/真实绑定 | 请求回执、身份摘要 | 渲染中再读取变化的工作路径 |
| 正式工程与时钟 | VFC Project Revision | 工作台/只读概览 | 手写 JSON 时间线 |
| 任务运行/恢复 | 各自系统原 Run/Job 与 attempt/检查点 | 合并进度 | 手写 running/succeeded 替代真实任务 |
| 动作事件 | 作者源码产生；VFC 实际执行后登记的 eventMap | 自动静态索引仅供诊断 | 第二张手填正式事件时间表 |
| 观察 | 实际文件、版本、范围、方法对应的 Review | 适用范围汇总 | 缓存命中、ASR 或技术成功伪造看听通过 |
| 最终文件与批准 | ExportArtifact、文件哈希、明确用户确认 | 交付卡片 | 由制作 completed 推导人工定稿 |

### 3.3 版本与并发原则

长任务使用固定输入执行；正式工程提交只在短事务内排序。最终提交不能直接把旧 baseRevision 替换为最新数字：必须先比较目标的真实依赖。无关变化允许继续；相关变化保留产物并交回具体冲突。

首批不实现任意 HTML 的自动影响推断，不新增微服务、通用 DAG 编辑器或全局依赖数据库。细分依赖在各业务模块内实现，复用现有字段和签名函数。

## 4. 职责分工的具体调整

### 4.1 决策、产物、接回条件

| 责任方 | 最终负责什么 | 必须交回 | 什么时候回上游 | 不再承担 |
|---|---|---|---|---|
| 主任务 | 用户范围、真实分派、正式操作排序、结果与交付沟通 | 真实对象引用、执行结果、合并问题及待决事项 | 用户权限不明确或需要真实新选择时 | 手抄全量源码/状态、替作者补设计、逐个转述确定步骤 |
| 导演 | 事实含义、主线、主要采用及跨段取舍 | 同一当前稿的采用或实际修改 | 用户锁定范围外的变化 | 规定全部像素参数；重做每个局部修正 |
| 文案 | 研究、实际文字与必要朗读修订 | 准确当前正文、事实限定、真实差异 | 改主线/立场/锁稿 | 为视觉小改无理由重写全文 |
| 素材作者 | 来源、真实文件、可用源范围与用途建议 | 可访问材料、来源/范围、未知 | 主要材料无法成立需改变讲法 | 自动决定最终构图；因换角色重跑相同概览 |
| 创意负责人 | 观看动机、主意、发展和回报 | 当前稿中的可见事件及材料作用 | 涉及主线和主要采用 | 第二份逐镜实现说明、独立工程 |
| 外层视觉负责人 | 整场意图、素材角色、连续性、制作交代及返修判断 | 同一简报、实际观察、定位到对象/范围的问题 | 主创意、事实或跨段含义变化 | 完整编码后让内层再编码；只转发通用规则 |
| Local Codex 原作者 | 具体美术、构图、动作、源码及同作品修订 | 完整可运行源码、创作参数、明确可检查范围 | 缺事实/素材/主要创意决定 | 猜 VFC ID、手算哈希、维护另一时间线、重复导出 VFC 负责的视频 |
| 声音作者 | 意图、选声、采用、落点、混音及真实听感 | 已采用/留白/未完成结论和准确参数 | 需要改变讲述或主要观看设计 | 把技术响度或转写当听审 |
| 审片者 | 指定文件/范围/方法的真实观察 | 具体问题、依据、严重度、未知 | 跨专业判断或无法感知 | 复制作者报告冒充独立观察、重复生成已存在截图 |
| 应用层/Worker | 固定输入、事务、任务、绑定、检查点与技术执行 | 可复查机器结果 | 实际依赖冲突或需创作选择 | 自行决定创意、采用新材料、用户批准 |

角色可由同一代理兼任，不按每个技能增加代理。兼任不意味着取消某项产物；每项问题只指定一个当前返修负责人。其他作者给观察，不各自改出一份竞争版本。

### 4.2 交接必须与可选信息

一次交接至少说明：实际工作范围、验收目的、用户锁定项、当前权威文件、相关真实材料、对象/版本引用、变化和未完成事项。简单局部任务不携带全项目 Story、所有历史 Job 或全部技能正文。

反馈按“对象/范围—观察—希望改善的结果—保持项”组织。主任务合并同版同问题的观察，再交原作者；事实冲突回导演，画面实现回原作者，声音落点回声音作者。局部已明确修正不再经过一轮全片创意审批。

## 5. MCP/HTTP 回执与读取合同

### 5.1 现状和改动范围

apps/server/src/mcp.ts 的多项写入直接序列化 ProjectState；本片 final-cue-update-response.json 为 506,663 字节，两次音效重绑响应也约 505 KB。track_job 对部分 Job 返回完整 payload，其中可能包含源码。

应用层仍可返回完整 ProjectState 给内部代码；**在面向调用者的接口层做明确投影**。不为精简通信删除底层数据，也不创建另一份状态存储。

拟在现有合同包增加可复用的回执类型，在服务器增加一个小型投影模块（建议名 command-receipt.ts；拟新增）：

~~~ts
// 拟新增的通用字段；具体命令保留继续工作必需的类型化结果。
type CommandReceipt<T> = {
  projectId: string;
  revision: number;
  changedIds: string[];
  staleIds: string[];
  dirtyRanges: Array<{ startFrame: number; endFrame: number; reason: string }>;
  warnings: string[];
  result: T;
};
~~~

约束：

1. 新建对象必须返回真实 ID；使用范围、状态、作品版本等继续工作必需字段不可省。
2. result 按各命令具体定义，不用任意大对象重新塞回整个 snapshot。
3. 记录审阅但不增加 Revision 时，返回真实当前版本和新观察引用，不虚增版本。
4. isError、错误代码、实际副作用、冲突版本、失败阶段和恢复提示保留。
5. read_project 保留完整读取；现有专项 read 工具按原职责读取。track_jobs 继续用于快速批量进度；track_job 返回诊断/产物摘要，完整作品由 read_motion_work 等实际入口取得。
6. 若现有专项读取缺少必要对象，扩展该业务读取的对象范围，不新增全量状态镜像服务。
7. HTTP 和 MCP 可以有不同呈现，但不得有不同业务判定。实际使用完整响应的 Web 调用点同步改为消费回执并按需刷新；未使用该响应的调用点不无故修改。
8. 本次发行直接更新所有拥有的调用方与 Schema，不引入新旧回执双模式兼容层。

### 5.2 验收

相同操作的新回执可继续下一步；新对象引用、真实影响、错误不丢失。记录响应字节与额外读取次数，避免精简后反而多次补查。测试语义字段与真实 Revision，不锁死 JSON 排版或任意字节阈值。

## 6. 简报、源码、冻结版本与自动组包

### 6.1 权威简报

保留当前声画稿和 Local Codex 项目 inputs 内的实际简报文件。调用传文件引用、内容身份、任务目的、关键锁定项及本次差异；作者实际读取完整文件后工作。删除要求同版本全文既写文件又粘贴 prompt 的规则。

文件不存在、内容变更或不可读取时返回具体缺口，不以短摘要替代未读全文。换源、换稿和事实修订仍交完整受影响正文；不只换版本数字。

### 6.2 作者清单与机器数据的边界

作者决定：name、creativeBrief、compositing、width/height/fps/durationInFrames、props、imageBindings、videoBindings、fontBindings、适用参考和 sourceDisplayScopeId。素材/字体使用当前项目真实 ID；视频选段保留源毫秒和作品根帧。

主任务决定正式 project、baseRevision、idempotencyKey、输出范围/用途、proof_job_id 以及采用目标。运行时计算真实文件哈希、绑定资源身份、作品 version、pixelKey 和引擎身份。

拟议作者清单如下；它不包含整份 HTML 的复制字段：

~~~ts
// 拟新增；与现有 MotionSubmission 共享结构定义，避免复制维护整个 schema。
type AuthoredMotionManifest = {
  authorSubmissionId: string;
  sourceFile: string;
  sourceSha256: string;
  work: Omit<MotionSubmission, "source" | "renderedAssetId" | "previousAssetId">;
  readyRanges: Array<{ startFrame: number; endFrame: number }>;
  changedRanges: Array<{ startFrame: number; endFrame: number; reason: string }>;
};
~~~

readyRanges 表示作者明确交出的可检查范围，不是整片质量通过；changedRanges 是作者判断，不是机器已证明范围外像素不变。渲染输入仍要求完整合法单页 HTML 和作品根时钟。事件由源码实际生成，清单不再维护第二张正式事件表。

authorSubmissionId 和 sourceSha256 由交件辅助函数在作者明确确认“这份清单对应这份源码”时生成并写入清单，不由模型手算。作者仍负责参数与实现的语义一致，哈希只能证明字节身份。冻结只接受已经声明的源码/清单配对，不能临时给旧清单补上当前源码哈希，再当成作者交出的新版。

### 6.3 冻结与传输的准确实现

当前 Local Codex 的 get_file/get_artifact 读取项目文件：前者按当前路径和行数读取，后者存在文本裁剪上限；已有单 HTML 历史版本与结束时 artifact 扫描不能当作跨源码、清单的原子冻结接口。VFC 的 import_media 和 /assets/upload 走媒体识别、Asset 注册和分析，并不支持 HTML/JSON 源码包，不能借这两个入口伪装媒体导入。

本方案选定三个拟议正式接口，均需开发发布后才能调用。先实现完整双文件的一次读取/一次导入，不增加永久传输会话、分块队列或压缩包协议；以本项目及既有最大作品验证真实工具消息容量，正文由宿主代码转发，不进入模型上下文。接口必须明确完整长度；若实测超过能力范围，返回未导入及明确大小限制，不截断、不静默接受半包，该容量问题未解决前不能宣称此输入路径可用。

~~~ts
// Local Codex 拟新增：只冻结作者明确声明的成套输入。
type FreezeProjectWorkInput = {
  project: string;
  run_id: string;
  source_path: string;
  manifest_path: string;
  source_sha256: string;
  manifest_sha256: string;
};
type FrozenWorkReceipt = {
  project: string;
  run_id: string;
  frozen_version: string;
  bundle_sha256: string;
  source: { sha256: string; bytes: number };
  manifest: { sha256: string; bytes: number };
};
// freeze_project_work(input) -> FrozenWorkReceipt
// read_frozen_work({ project, frozen_version }) -> 下列完整字节包；不读工作件。
type FrozenWorkBytes = {
  receipt: FrozenWorkReceipt;
  source_base64: string;
  manifest_base64: string;
};
// VFC 拟新增，不改 Project Revision，也不登记 Asset/生成 Job。
type ImportMotionBundleInput = {
  project_id: string;
  idempotency_key: string;
  bundle: FrozenWorkBytes;
};
// import_motion_bundle(input) ->
// { project_id, bundle_path, bundle_sha256, manifest_sha256, reused }
~~~

操作顺序：

1. 作者完成配套源码与清单，明确 readyRanges。在既有文件版本模块增加小函数 prepareAuthoredWorkSubmission：按作者交件动作读取选定字节、计算源码摘要、写 authorSubmissionId/sourceSha256，并原子保存清单，返回两份摘要供正式冻结调用。它不推断清单内容是否正确，也不靠 mtime/心跳自动发布。
2. freeze_project_work 沿现有项目文件约束把选定内容读到受管临时目录，同时核对两份外部声明摘要和清单内 sourceSha256。摘要不匹配直接拒绝，不等待当前文件碰巧稳定后接受；冻结阶段不重写清单。
3. 校验完整 HTML、清单结构、根时钟和范围；核对 run_id 确属该项目及作者此次提交。VFC 资产就绪仍由 VFC 正式入口判断。
4. 对冻结字节复算两份摘要；bundle_sha256 使用固定字段顺序/编码的 source、manifest 摘要与字节数组合计算。清单不含自身摘要，避免循环哈希；身份计算函数只维护一份并提供跨端固定样例。
5. 在同一文件系统原子发布完整目录，已发布版本不可覆盖；中断产生的临时目录不作为正式版本。现有 Run 产物索引保存 frozen_version、配对身份和范围；目录已发布而索引尚未落下时，原请求验证目录后补登记，不生成另一份身份。
6. 主任务在宿主工具编排中调用 read_frozen_work，再将原始字节包直接交 import_motion_bundle；逐次检查 isError、完整长度和回执，只向模型回传身份与结果。禁止模型重新输出/重写 base64，也不让 VFC 服务器读取 Local Codex 的可变工作路径。两服务不直接互相调用 MCP。
7. VFC 在项目 inputs/motion 的临时目录解码，核对两份长度/哈希、bundle 身份和清单内源码引用；完成后同文件系统原子发布到 inputs/motion/<bundleHash>/。同键不同内容拒绝；丢回执重发同一包返回既有引用，不能覆盖不同内容。幂等元数据放在受管输入记录内，不新建业务状态库。
8. 回传 bundle_path 和 manifest_sha256，主任务按 §6.4 正式提交；正式 Job 仍固定完整 work、资源和运行环境。传输失败重读原 frozen_version，原工作件后来改变不影响此轮。

首批先支持 Run 已结束后的固定交件；滚动制作再扩展为运行中的作者显式发布阶段版本。跨文件冻结必须验证可用后才宣称支持边写边看。

传输只包含 HTML 和创作清单；真实图片、视频、字体仍由现有 VFC Asset/字体绑定解析，不因有源码包就假定材料已一起到位。VFC 输入目录不是正式 Asset、Timeline 或另一状态库。此路径的维护代码分别归 Local Codex 文件版本模块和 VFC motion-input.ts；现有目录/文件访问函数复用，不重写通用文件管理器。

### 6.4 正式提交入口的拟议调整

保留现有完整 work 输入供直接程序调用；新增受管冻结引用用于文件交接。两种输入都是有效用途，统一后只走一套校验与执行，不建立两种渲染实现。

~~~ts
// 拟议 MCP 输入：work 与 frozen_work 严格二选一。
type MotionInput =
  | { work: MotionSubmission; frozen_work?: never }
  | {
      work?: never;
      frozen_work: {
        bundle_path: string;       // 相对当前项目受管输入根目录
        manifest_sha256: string;
      };
    };
~~~

服务器读取受管冻结包并复验源码、清单字节，组装完整 work；沿 motionSubmissionSchema → submitManagedMotion → 真实图片/视频/字体绑定 → motionHash/motionPixelKey → 原 motion_generation Job。

重要细则：

- 不接受源码 URL 或任意可变文件路径作为后台动态输入；Job 中继续固定完整规范化 work 和真实绑定。
- bundle_path 只定位受管输入；实际路径解析和现有权限规则继续使用，不能越过所属项目读取另一作品。
- 主任务提供 previousAssetId/renderedAssetId 时，沿现有身份校验；作者清单不能私自指定正式旧素材采用。
- sourceDisplayScopeId 不授予新的来源展示权限。
- 作者声称的哈希只用于比对，最终作品身份仍由现有 compiler 依据实际输入生成。
- 同一幂等键必须比较归一化 work、范围、用途、proof、采用指令，不能仅比较输入文件路径。
- 组包失败发生在创建正式 Job 前；错误返回缺失资源、版本或内容位置，不提交半包。

### 6.5 字体与唯一交付路线

字体错误应返回错误代码、请求的 fontId/字重、实际字体目录读取入口及目录已有信息。当前 packages/motion-work/src/fonts.ts 目录包含名称、字重和文件身份，没有逐字覆盖字段；MOTION_FONT_UNKNOWN 不能凭未知 ID 生成“缺少哪些中文字”的结论。未做真实字形检查就标覆盖未知；若产品需要逐字检查，再为实际字体文件增加查询与核心用例，不能只改提示词就宣称有该能力。删除“所有情况必须等用户选字体”的提示。未被用户锁定时由原视觉作者选择合法 fontId 并记录；用户锁定且不能满足时回询。**运行时字体加载失败不能静默回退系统字体。**

Local Codex 官方任务配置应明确两种交付用途：VFC 源码交付，以及独立视频交付。VFC 路线由 VFC 正式渲染，交源码/清单/冻结引用；独立路线仍交实际视频。通过其正式路由/配置模块实施，运行记录必须能核对实际采用用途。不能在未发布的接口中偷偷传 sourceOnly、render:false 等字段，也不通过修改私有工作副本假装能力已部署。

实际修改路径与顺序（以下以 E:/ai/open-design 为根）：

1. 核对 plugins/_official/scenarios/od-next-strategy/open-design.json 的 taskProfiles 及 references/task-profile-mapping.md；当前 hyperframes 与 motion-design 是不同路由，不能笼统把两者当成同一交付。
2. 先验证现有 hyperframes 源码 profile 能否完整承载 VFC 合同，按需要引用 motion 工艺；若满足就直接采用，不新造 profile。
3. 必须调整交付要求时，修改 packages/contracts/src/plugins/deliverable-skills.ts 的实际声明，以及对应 mapping/registry/recipe 与公开 skills/motion-design/SKILL.md。独立 motion-design 的 HTML+MP4 用途继续保留，VFC 源码用途明确不再要求重复导视频。
4. apps/daemon/src/plugins/strategy-package.ts 从正式声明加载并计算包身份；沿该链验证实际选择的 profile、规则和包摘要。根据该场景 AGENTS.md，motion-design 场景资产由公开技能生成，修改源后使用现有同步脚本，不手改生成副本。
5. 用两条独立样例验收：VFC 源交付得到可正式组包的源码/清单且只有 VFC 渲染；独立视频用途仍产出真实 MP4。不是仅在 prompt 中写“忽略 MP4”就算路由改好。

## 7. 确定性采用与预览接续

### 7.1 首批范围与业务输入

首批在已有 Cue 的完整换版场景打通端到端，适合本片隔离副本；第二批接入局部 replace_range。新建 Scene/Cue 仍由原负责人给准确参数并走现有正式 create 操作，不自动猜分镜。未要求任何人先批准整片审美，采用只是可逆的制作操作。

拟扩展现有 submit_motion_work，增加可选 on_success；省略时仍是独立生成，proof 仍只做校样。这些是不同业务用途，不是保留废弃实现。

~~~ts
// 拟新增：字段均由主任务明确提交，不能由生成器猜测。
type MotionOnSuccess =
  | {
      action: "replace_cue_and_preview";
      cueId: string;
      previewRange: { fromFrame: number; toFrame: number };
      audioPolicy: "rebind_unchanged_events";
    }
  | {
      action: "replace_range_and_preview";
      cueId: string;
      targetRange: { startFrame: number; endFrame: number };
      previewRange: { fromFrame: number; toFrame: number };
      audioPolicy: "rebind_unchanged_events";
    };

// 服务端冻结到现有 Job.payload；复用 requestedRevision，不另存第二基础版本。
type FrozenMotionContinuation = {
  request: MotionOnSuccess;
  targetDependencyHash: string;
};

// 现有 Job.result 内新增采用结果；生成与预览状态仍各归其 Job。
type MotionContinuationResult =
  | { status: "applied"; assetId: string; appliedRevision: number; previewJobId: string }
  | {
      status: "needs_reconfirmation";
      assetId: string;
      conflicts: Array<{ objectId: string; reason: string }>;
    };
~~~

全件替换首版保持原 Cue 的 Scene、范围、层级、主画面职责及源时间含义，只更换明确的新作品及可证明不变的事件引用。画幅、作品总时长、fps、内容覆盖或声音事件发生相关变化时停止自动采用。需要结构修改则交原作者提供明确编排，不能由该动作顺手扩大。

局部动作要求正式范围素材；targetRange 和媒体根范围映射符合现有帧网格。on_success 只允许解析后的 outputIntent=asset；现有 frame_range 请求省略 output_intent 时默认 proof，因此局部接续必须显式传 output_intent=asset。省略而解析成 proof、或显式 proof 均拒绝，不隐式升级校样用途。采用成功 proof 仍沿 output_intent=asset 和 proof_job_id 的严格同源合同。

全件声音重绑需要真正改实现：当前 updateEffectCue 后的 reconcileEffectAudioEvents 会因作品版本/绑定签名变化把旧声音置为 stale 并停用，并不会自动修正。新采用逻辑先比较新旧实际 eventMap 的 ID、meaning、起止根帧、映射、音源偏移与持续范围；全部相关事件不变时，先在候选快照内按新 workVersion 和真实落点重绑，再统一 reconcile。任一相关事件不一致，整次采用返回 needs_reconfirmation，原 Cue 和音轨不变；不能先替画面、静默禁音后让用户发现。

### 7.2 依赖指纹

targetDependencyHash 由服务器从 requestedRevision 计算，客户端不可填“已验证”。至少包含：

- 目标 Cue 的身份、范围、源入出、Scene/主画面职责、旧素材/作品身份；
- 影响目标的 Story Beat、语义、Scene 范围、画幅、fps、相关语音映射；
- 该动作涉及的音效绑定、事件、来源、落点和持续范围；
- 会改变采用含义的显式用户约束及素材身份。

相关判定复用 motion-dependencies、effect-audio-events 等实际逻辑，抽取小型纯函数供提交和回收共同调用，不复制两套规则。无关新素材和无关区域修改不进入指纹。普通字幕改变是否影响采用与是否影响预览分别处理：不必阻止纯主画面替换，但预览必须使用实际采用后确定的 Revision，审查范围相应更新。

### 7.3 调用链与短事务

~~~mermaid
sequenceDiagram
    participant M as 主任务
    participant A as VFC 应用层
    participant W as 现有渲染 Worker
    participant DB as 现有 SQLite
    M->>A: 固定作品 + 采用目标 + 预览范围 + 幂等键
    A->>DB: 保存完整输入和采用依赖
    A-->>M: 原 motion Job 回执
    W->>DB: 领取原 Job
    W->>W: 生成、校验、保存受管媒体和 manifest
    W->>A: 完成画面，尝试已委托采用
    A->>DB: 短事务重读当前工程与真实依赖
    alt 依赖符合
        A->>DB: Asset + Cue/声音 + Revision + Preview Job + 采用检查点
        A-->>W: 返回同一采用结果
    else 相关依赖改变
        A->>DB: 保存未采用 Asset 与具体冲突
        A-->>W: 生成成功，采用待重新确认
    end
    W->>DB: 结束当前生成尝试
    W->>DB: 另行领取 Preview Job
    W-->>M: 可读取真实预览及各自状态
~~~

当前 completeManagedMotion 只登记 Asset；repository.commit 只提交 Revision。不能直接顺序调用这两个方法加 submitPreview 后就声称原子。

拟开发一个窄的应用模块 motion-adoption.ts，抽出既有 Asset 登记、Cue 编辑与事件绑定的纯修改逻辑。仓储增加一个受控事务方法（建议名 commitMotionResult；拟新增），在一个 SQLite 事务中：

1. 检查原 Job 是否取消、是否已有采用结果；
2. 读取当前 Revision 和实际依赖，不在事务外读完后盲写；
3. 对事务前已验证并持久保存的媒体/manifest 身份作短核对，登记同 Job 唯一 Asset；
4. 通过既有编辑函数更新目标、声音与影响，再跑统一 reconcile 和工程校验；
5. 写入新 Revision；
6. 为这个准确 Revision 和范围插入现有 preview Job；
7. 在父 Job.result 保存 appliedRevision、Asset、Preview ID。

外部生成、文件复制、大文件哈希、媒体解码、FFmpeg 和模型调用均在事务前完成，不放进 SQLite 写锁。事务只读取持久身份、任务状态和当前依赖；受管媒体被外部改变时，在实际使用前核验并报错，不能因数据库有旧哈希就信任当前字节。长任务不持有项目写锁。发布给 Web 的通知发生在事务提交之后，不把内存事件当成持久事实。

如果相关依赖冲突：不改原 Cue 和音轨；允许登记已验证但未采用的 Asset，在同一持久结果中写 needs_reconfirmation。不创建预览，不把生成 succeeded 显示为整链完成。

### 7.4 幂等、崩溃与人工续接

| 故障位置 | 恢复要求 |
|---|---|
| 生成尚未开始/外部结果未知 | 继续读原 Job/Run；沿原恢复合同，不换键重发 |
| 文件生成完成，采用事务前退出 | 从已保存 manifest/文件哈希核对原成果，再尝试采用；不得因未写终态就直接重画 |
| 采用事务中失败 | Revision、引用、预览入队和采用检查点共同回滚；完整媒体保留 |
| 事务已提交，父 Job 尚未写 succeeded 时退出 | 重领原 Job，优先读 applied 结果并返回原引用，不再采用或创建预览 |
| 采用冲突 | 父生成任务可成功，采用状态为待重确认；显式重新采用已有 Asset，禁止隐式重新生成 |
| 预览失败 | 处理该 Preview Job；保留已采用版本与画面，不重新生成或回滚无关编辑 |
| 重复请求 | 同键同完整输入返回原任务；同键不同内容/目标明确拒绝 |

Preview 幂等身份由父 Job、已采用 Revision 和范围稳定派生；事务内检查同身份 payload 一致，不仅相信 createJob 会去重。

冲突后，主任务读取新依赖并明确决定，再调用拟新增的 manage_effect_cues(action=adopt_work_and_preview)。它创建一个明确的短任务 motion_adoption，复用现有 jobs 表和渲染 Worker，读取已有 Asset，调用首次采用的同一事务；**不创建新的 motion_generation，不调用外部生成，不新增调度器**。确定实现如下：

~~~ts
// 拟新增入口合同；公共字段继续沿现有 MCP 命名。
type AdoptWorkAndPreviewInput = {
  project_id: string;
  base_revision_id: number;
  idempotency_key: string;
  asset_id: string;
  target: MotionOnSuccess;
};
// 服务端创建 motion_adoption Job：
// payload = { assetId, requestedRevision, continuation: { request, targetDependencyHash } }
// result.continuation = MotionContinuationResult，与首次生成后的采用结果相同。
~~~

具体接入点：

1. packages/contracts/src/index.ts 的 JobKind 加 motion_adoption；不为该类型另建表，现有 jobs.kind 是文本字段。
2. 应用入口核对现有 Asset 身份与输出用途，计算当前目标指纹，以稳定幂等键创建 Job。接口返回短 Job 回执，不声称已经改完项目。
3. apps/render-worker/src/index.ts 的 RENDER_JOB_KINDS 和 createRenderJobProcessor 同时增加该分支，由现有领取循环消费，调用 motion-adoption.ts。
4. 短事务核对原任务与依赖，原子保存新 Revision、Preview Job 和采用结果；已登记 Asset 只验证并引用，不再登记一份。
5. track_job/track_jobs 可读短任务和预览；成功给出真实新版本与 Preview ID，冲突保留 Asset/原工程和具体原因。失败、取消及结果未知按 §8 分类恢复；事务已提交则优先回原结果。
6. 不修改原生成 Job 的固定 payload。新的明确决定拥有新的采用请求身份，历史冲突和当时输入保持可追溯。

Worker 的通用终态写回不得覆盖事务已经保存的 continuation/产物检查点：提交前重读或按已保存字段合并，并用故障注入验证这个窗口。

## 8. 统一 Web/MCP 任务恢复

### 8.1 现状

Web POST /api/jobs/:jobId/retry 的通用分支以时间戳生成恢复身份；MediaIntelligenceApplication.retry 对相同类别使用固定 media-retry 身份。不同入口对同一恢复责任持有两套逻辑。

### 8.2 修改

在 EditingApplication 层提供唯一恢复入口 retryJob(projectId, sourceJobId)（拟新增）；Web 和 MCP 只做参数转换、访问约束和结果呈现。由应用层按实际任务类型分派现有配音、数字人、字幕、媒体分析、SFX、预览等恢复方法，保留它们不同的外部 Run 和检查点要求。

统一恢复规则：

~~~text
原任务 A 明确失败 → 恢复 A 创建 B，身份 retry:A
再次恢复 A       → 返回同一个 B
B 明确失败      → 明确恢复 B 创建 C，身份 retry:B
再次恢复 B       → 返回同一个 C
unknown          → 先对账原外部 Run，不创建未知副作用的重复任务
queued/running   → 返回当前任务信息，不另建恢复任务
succeeded        → 返回成功结果或明确“不需重试”，不重新生成
~~~

来源任务状态检查、恢复子任务检查/创建在同一事务中完成；返回 latestRecoverableJobId 或等价明确引用，避免调用方永远对 A 重放又误以为产生新尝试。

删除 Web 路由内创建同类任务和 Date.now 身份的重复分支。专用服务需要续接原 Run 时，不强制创建外部新 Run。不能为了统一入口把所有失败都视为可重发。

预览、字幕等任务的固定输入过期应返回真实依赖冲突；不只检查整版号，也不随意采用新输入替换旧 Job。终态历史只读，修复重试链不篡改旧状态。恢复类型表须显式接入 preview 和拟新增 motion_adoption；当前媒体分析恢复入口没有这两类能力，不能只改 Web 路由就称统一完成。已完成采用先返回已持久结果；预览失败恢复预览自身，不生成新画面。

## 9. 字幕任务：从“整项目停写”改为“核对真实目标”

### 9.1 具体修改位置

- packages/edit-application/src/index.ts：generateSpeechCaptions、原声字幕提交、completeSourceAudioCaptionAlignment。
- packages/speech-services/src/index.ts：SourceCaptionAlignmentService.extractArollAudio 和结果接回。
- 相应合同、captions/references/caption-operations.md、现有字幕工作流测试。

现状 Worker 检查当前 Revision 必须等于 requestedRevision，完成仍以原版提交；技能因此要求识别期间暂缓其他项目写入。

### 9.2 冻结输入与提交前条件

拟为 source_caption_alignment payload 增加由服务端计算的 targetFingerprint，实际固定输入继续复用已有字段：

| 依赖类别 | 必须包括 |
|---|---|
| 声音 | Asset ID、实际内容哈希、音频可用状态和使用音轨 |
| 映射 | Timeline Item、源入出、项目入出、fps、真实时间映射 |
| 旁白 | SpeechAsset、Script Revision/真实文本、语义与段关联 |
| 原声 | 对应原声 Item、声音来源/use_source_audio、相关人物表演源 |
| 写入目标 | 将被替换的 Alignment/Program/Caption 身份、范围及人工修改状态 |
| 用户编辑 | 用户 SRT、人工正文、纠错、显示范围及实际受保护内容 |

字幕统一样式不参与语音识别本身。若完成逻辑只是继承当前合法统一样式，可以用当前样式；若变化影响本次覆写或已有人工显示语义，则应作为冲突处理。不要因无关样式变动重复调用 ASR，也不要覆盖人工处理。

“固定音频”必须有可复读的受管原始文件或不可变输入副本，不能只有 Asset ID。提交保存实际字节身份与选段；启动截音前核验，识别回来后再次核验原输入及已截取文件的真实身份。即使项目版本没变，文件被替换也不能继续冒用旧结果。

### 9.3 执行和回收算法

~~~text
提交：
  验证当前目标 → 固定音频与目标指纹 → 创建原对齐 Job
运行：
  验证固定文件身份 → 按固定源范围截音 → 复用现有 Bridge 提交/对账
外部结果到达：
  保存 provider 原始全文/JSON、解析段/token、精度、真实输入范围及 Bridge audit
  在原 Job 的既有检查点中登记结果引用与哈希，再进入工程提交
回收（单事务）：
  若该外部 Run 的对齐结果已正式采用，返回已有结果
  读当前工程 → 重算目标依赖
  若声音/时间/文本/人工字幕等相关内容变化：
      保留原检查点并记录未采用冲突，不覆盖、不重识别
  否则：
      使用现有段/范围校验，原子写 Alignment + Program + Caption
      继承当前可安全使用的统一格式，记录真实提交 Revision
~~~

删除启动前仅因全局 Revision 不同而拒绝的条件，替换为真实依赖比较；保留音频身份、来源范围和外部未知结果保护。

当前 SourceCaptionAlignmentService.align 读取输出后直接调用 completeSourceAudioCaptionAlignment，必须在两者之间补结果持久化。具体复用 application.recordJobCheckpoint：新增 result.sourceCaptionAlignmentResult，记录原 Run、音频身份、provider 原文/解析内容的受管文件引用与哈希、tokenPrecision、输入范围和提交状态；大结果原文写入该 Job 现有 cache/source-caption-alignment 目录，不塞进精简轮询回执。结果文件原子写完后再登记检查点。恢复时先验证检查点，再复用结果；若在保存前退出，从原 Run 取回，不再次发起识别；Run 已丢失且无本地结果就明确未知，不能假造。

保留 requestedRevision 的“提交时输入版本”含义，另外记录实际 committedRevision，不能把原字段改成当前版号。已被同一 Run 正式采用的情况先对账返回已有 Alignment/Program/Caption，不能因后来有人工编辑又覆盖一次。

技能把“整个 Job 期间暂停其他项目写入”改为“目标声音、时间和人工字幕编辑需要协调；无关工作可继续”。不把同一次字幕写入与生成窗口的冲突混为一件事。

## 10. 局部替换：覆盖、时钟、语义和声音一起正确

### 10.1 覆盖声明修正

motion-range-replacement.ts 当前 structuredClone 原 Cue 后切分，照搬 coveredNarrativeBeatIds；assertEffectCoverage 要求每个声明与子段相交。拟修正每个新增子段：

~~~ts
// 拟议算法；沿现有 effectBeatRanges，不另估 Beat 时间。
function coveredIdsForPart(snapshot, originalCue, part) {
  if (originalCue.coveredNarrativeBeatIds === undefined) return undefined;
  return originalCue.coveredNarrativeBeatIds.filter(id =>
    effectBeatRanges(snapshot, id, originalCue.sceneId).some(range =>
      range.startFrame < part.endFrame && range.endFrame > part.startFrame
    )
  );
}
~~~

原 undefined 必须保持 undefined；显式集合过滤为空时保留 []，不能删除字段让 motion-dependencies 回退到整个 Scene。没有真实语音时间时，effectBeatRanges 可能返回宿主 Scene 下界，必须保留这个精度事实，不宣称精确到具体台词。

### 10.2 语义锚点

semanticAnchor 表示内容关联，不是自动生成的新切点。保留原明确语义和有效对象；不把锚点机械改成“最近的 Beat”。若拆分使语义关系不能成立且现有检查无法证明，应返回需要作者明确的范围/锚点，不能为了通过结构校验删必要关联。

调用方同时修改：packages/quality-system/src/editorial-review.ts 的 productionReconciliation 已区分显式数组与 undefined，但 completionReconciliationBlockers 的对象范围判断仍无条件 OR semanticAnchor。统一为“显式 coveredNarrativeBeatIds 权威；仅 undefined 才回退原锚点”，并用 effectBeatRanges 检查目标 Beat 与该子段的真实交集；不能让 [] 又被旧锚点算作覆盖。抽取这一小段共用判定，两个入口一起调用。

现有拆分保留第一段原 Cue ID，其他段产生新 ID。采用结果返回旧 ID 到各子段 ID/范围的映射，供现有问题、对象范围和审阅引用对账；保留原观察的版本/范围，只有实际覆盖且依赖不变才引用。不能把挂在原 ID 上的全段通过自动继承给新增子段，无法证明的部分保留未知。

### 10.3 保留与加强的原合同

保留原画幅、作品 fps、整件时长、事件图、主时钟、源入出和跨 fps 共同采样网格约束。局部替换不物理重编码旧前后段、不重启持续声音、不变成另一时间线。

两个接点采用半开区间；落在接点的事件只有一个归属。声音引用通过现有 bindEffectAudioEvent 计算，确认 ID、meaning、根事件时刻、源偏移及持续终点不变后才重绑。若持续事件跨切点不能在现有单 Cue 模型中无歧义表示，返回明确限制并由作者扩大替换范围或明确编排，不切成两次起音。

### 10.4 源码变化与复用

motionPixelKey 包含完整源码及绑定，源码变了就不能声称旧 proof 仍是同一版本。作者明确局部改动时可以生成新版指定范围并替换，保留旧版未改范围；但必须检查共享样式、字体、材料、全局时钟和跨段对象影响。无法确认则扩大范围。

首批不开发任意源码自动依赖分析。现有合成分段缓存键含素材身份和分段位置，拆分后不保证缓存命中；先测实际代价，再决定是否细化现有缓存的可信范围身份。不得为“命中缓存”放松内容身份。

## 11. 声音计划、事件和复核依赖

### 11.1 SoundPlan 更新

现状：任意 SoundPlan 更新 version+1，版本不匹配加入 impact.stale；只有计划/意图消失才真正设 cue.status=stale 并禁用。文档和实现不能把版本差一概描述为音轨已失声。

拟在现有 manageSoundPlan/reconcileSoundDesign 事务内，逐个关联 Cue 比较其真实计划依赖：

- 所属计划范围、旁白/音乐方向、dominantRole；
- 与 Cue 相交的主导范围；
- 该意图完整内容、requestId/motionEventId 等引用；
- 实际音轨/源范围、事件时钟及必要跨段关系。

无关意图新增且相关依赖逐字段相同：同事务更新 Cue.planVersion，保留其原状态；原审听证据仍保留原版本和观察来源，不改成新听过。

相关内容改变：记录具体影响和待复核原因，沿既有语义处理；删除意图/计划时继续停用对应 Cue。不能只比 intentId，也不能以文案相似度判断等价。不新增每个意图独立版本数据库。

### 11.2 复核签名按方法和实际范围计算

拟调整现有 soundDependencySignature(snapshot) 为带明确方法、范围和渲染环境的输入；数据保存在原 Review 记录，增加 dependencySchemaVersion 标识签名含义，不增加新审查系统。

~~~ts
// 拟议函数签名。
soundDependencySignature({
  snapshot,
  method: "audio" | "audiovisual",
  range: { fromFrame: number, toFrame: number },
  renderIdentity
});
~~~

| 方法 | 纳入的实际依赖 | 不应直接纳入 |
|---|---|---|
| audio | 实际可听轨、源哈希/选段/映射、音量/淡化/包络/循环/Duck、起音与事件、总增益、声道采样和混音实现 | 未使用素材、纯画面布局、无关字幕文字、非声音性的说明 |
| audiovisual | audio 依赖，以及范围内画面、字幕、素材/作品、位置、时间、画幅和相关渲染实现 | 与该范围及共享依赖无关的候选材料 |

必须包含影响窗口的前后声音状态，例如跨边界尾音、淡化、Duck 的 attack/hold/release。全局增益、fps、共享时钟等变化扩大影响。优先复用现有 timeline-audio 的实际使用计算，避免另写一套与混音器不一致的选轨规则。

先核对实际听/看文件哈希。旧观察仅能在新依赖证明相同后作为“引用旧版某范围的有效观察”展示，不得篡改成新版重新完整听过。旧粗签名不解释为新签名；有足够原始快照可计算适用性，没有则保留历史范围和未知，不自动补 passed。

同步所有消费者：sound-review、质量评估、声音比较等，不能只改签名生成而漏掉判断入口。

逐条 Review 计算自己的 method、fromFrame/toFrame 和真实输入签名。packages/quality-system/src/index.ts 当前一次算全局签名再用于全部条目，需改成按条目核对；packages/edit-application/src/sound-review.ts、apps/server/src/sound-tools.ts 同步输入和展示。apps/render-worker/src/sound-comparison.ts 不只改基线签名：每个候选的真实音源、参数、范围和同源渲染身份都要参与。候选试听记录与正式混音复核保持区别。

旧记录保留 dependencySchemaVersion 和原文件证据；能恢复原始快照时，可按其原方法/范围重新计算适用性，不能批量把旧记录字段改成新版 passed。不同区间分别合并覆盖，局部 failed 不能被另一条旧版或不相交范围的 passed 掩盖。

### 11.3 画面换版与音效

全件替换和局部替换共用核对逻辑。作品 version 变化本身不证明事件变化；也不能因作者说“39 个事件不变”就跳过验证。比较实际运行 eventMap、meaning、时刻、时钟映射和声音原文件/源偏移；满足才原子更新绑定签名和 workVersion。onsetReview/loopReview 的真实性单独处理，自动重绑不等于重新听审通过。

## 12. 检查、分析与输出验证

### 12.1 阶段交件与观察分工

同一作者发布可检查的冻结版本后，主任务按真实问题提交范围校样或有声预览。校样只证明主视觉窗口，不能作为有字幕/旁白/音乐的成片观察。素材登记、绑定和当前 Revision 合成正确后，才能检查声画竞争。

不要求每句、每个镜头固定生成一份样片，也不新增逐镜用户审批。一次检查可覆盖多个相关问题；已有同版截图/预览共享给各负责人。作者修改效果，独立审片补内容与成片观察，声音作者负责听感；主任务合并反馈并明确每项返修负责人。

问题记录沿现有审阅机制保存对象、范围、实际版本、观察方法、问题和状态。修改后复看受影响连续范围及接点；全局字体/时长/混音变化扩大范围。最终文件与已审预览同内容身份时可引用真实观察，不强制重看两遍同文件；完整动态/声音没看听过的部分仍是未知。

### 12.2 媒体理解与转写分流

apps/job-worker/src/media-understanding.ts 当前每个窗口先调多模态，再按 speech 调 FunASR。拟改为显式按 modalities 构造本窗口的必要工作：

~~~text
只有 speech：
    读取固定音频窗口 → 严格符合条件则复用已有转写，否则调用当前 ASR
有 audio/video/image 等观察：
    调用对应实际模型，保留输入范围和来源
同时有 speech：
    独立取得 ASR；与观察分开保存，不互相冒充
~~~

复用条件包括文件哈希、源范围、必要音频变换、模型/Schema、时间映射及精度。纯旁白的对齐不能冒充加入音乐音效后的混音核听。字幕生成与混音分析的对象可能不同，不能因为都叫转写就合并。

把 review 输入拆成两个明确字段/阶段：observationQuestions 是中性观察问题，comparisonReference 是期待台词、计划音乐时间等比对资料。只有前者进入多模态提示；后者交后处理和作者比较，进入自己的比对结果，不混成模型观察事实。沿现有分析 Schema、应用输入及 analysisPrompt 同步修改，删除当前把整段混合 context 直接送入模型的路径，不新增“能自动识别所有期待答案”的分类器。

保存模型原结果、实际输入窗口、时间映射和 unknowns；没有真实音频/时间依据的文字只能是推测或未知。窗外断言和已识别回声沿现有 correct_media_observation 纠正并保留原文；不能声称仅靠结构校验就识别了所有幻觉。

纯 speech 分支用真实 ASR Run、Schema、窗口、音频身份与 token 精度构造合法 MediaObservation 和覆盖状态，不制造多模态 response/runId。当前 parsed.facts 前置检查已排除纯 speech，但后续 observation 身份、版本和窗口仍取多模态 response，末尾还检查 facts；这些消费者需一起改。纯 speech 的 facts 来自转写，成功、失败和 unknown 分别保存，原窗口时间不可丢失；组合请求继续分别保留两种真实来源。

本片 audio+speech 任务不属于“只需 ASR 却多跑模型”的实例，也不在最终导出关键路径。窗口并发先测 GPU/模型资源争用，首批只做分流，不盲目增加并发。

### 12.3 预检与验证复用

现有独立预检与导出是两个 Job，apps/render-worker/src/exporter.ts 分别调用 runRenderPreflight。无提前诊断需要时，只运行导出内预检；确需提前诊断时，拟给导出提交增加 preflight_job_id，引用已成功的原预检结果。不能用“共享内存”解释两个进程/任务如何复用。

预检 Job 将可复用的逐项结果及依赖身份保存在现有 Job.result/检查点：项目、Revision、purpose、实际内容身份和渲染环境。导出从现有仓储读取该 Job，逐项核对后构造本次内存 ValidationContext，传给现有预检/渲染函数。引用不存在、结果缺失或条件改变时重做相应检查并记录原因，不把它当作输入文件本身出错，不建立第二验证服务或永久“已安全”标记。

可复用：相同固定 Revision、用途、实际文件内容身份、渲染器/FFmpeg/字体/组件环境下的重复媒体探测与固定依赖解析。

每次仍确认：实际引用、用途条件、文件存在可读、内容身份未变、必要缓存完整性。路径/mtime 相同不能代替可外部修改文件的内容核验。环境、purpose 或输入变化，只重做对应检查。独立预检结果不能自动免除最终文件的解码、帧数、画幅、音轨与响度核验。

技能中无提前诊断需要时，可由导出内预检承担该职责；不再机械要求每次先单独跑一遍同版预检。代码与技能同步调整，记录命中项和重新验证原因。

## 13. Skills 逐文件修改细则

只修改 .agents/skills 维护源，发行副本沿现有脚本同步。docs 不另建活动技能树。

| 文件/范围 | 保留 | 删除或替换的具体条款 |
|---|---|---|
| _shared/PROJECT_REVISION_AND_HANDOFF.md | 唯一共同职责、版本/交接、真实观察与授权边界 | 按 §4 明确程序接续已委托操作；不让主任务逐项搬运固定数据 |
| production-coordinator/SKILL.md | 根入口、类型和范围确认、真实分派、正式提交 | 共同协议正文改短引用；接收回执和自动准备预览结果 |
| production-coordinator/references/task-routing.md | 分派/接替/依赖等待的触发条件 | 删除与共享协议重复的长篇职责；明确一问题一返修负责人和统一清单 |
| production-coordinator/references/project-writes.md | 幂等、冲突、未知与实际副作用检查 | 替换“每个机械动作必须经模型重新拼装”的隐含流程；使用新正式业务动作 |
| _shared/TOPIC_TO_FILM.md | 同稿共创、并行取材/文案/视觉/声音、连续发展 | 共同角色条款引用唯一来源；加入稳定阶段交件入口，不加全片前置表格 |
| production-director/SKILL.md | 事实、主线、主要采用和跨段决定 | 不重复项目操作协议，不扩大到所有局部参数批准 |
| creative-sequence-design、creative-reference-to-sequence | 观看主意、真实材料作用、参考迁移 | 不另要求第二份逐镜实现稿；决定写回当前稿并引用 |
| visual-treatment-planning/SKILL.md | 原作者持续负责，整幅美术与演出质量 | 清楚区分外层统筹与 Local Codex 实现；阶段版本可检查但不等于整片完成 |
| opendesign-shot-brief/SKILL.md | 目的、具体场面、材料角色、锁定项、接续 | 不把全部实现参数变成开工前置，不再复制同义简报 |
| opendesign-video-production/SKILL.md | 同项目续接、实际来源、唯一渲染责任和真实观察 | 全文 prompt 改为权威文件+差异；作者复制 work.source 改为冻结包 |
| opendesign-video-production/references/hyperframes-contract.md | 完整根时钟、真实素材字体、事件由源码产生 | 增加已发布后的冻结/组包合同；删除手工哈希、重复正式事件表要求 |
| opendesign-video-production/references/submission-and-recovery.md | 同源 proof、范围采用、真实恢复 | 同步新采用动作；字体未锁定由原作者选；不使用未发布字段 |
| captions/references/caption-operations.md | 真实对齐、人工校订保护、统一样式 | 整 Job 暂停其他写入改为协调真实依赖目标 |
| audio-finishing/SKILL.md、effect-timing/references/event-and-audio-binding.md | 真实选声、起音、事件、听感 | 使用原子不变事件重绑和依赖差异；不将版本同步当听审 |
| quality-verification 及 professional-review/evidence-status | 观察范围、方法、实际作品和独立判断 | 同版材料共享，变化驱动复核；不增加全片重复审阅或统一审美门禁 |
| export/SKILL.md | 固定版本、用途、技术验证、用户明确批准 | 删除无目的的重复独立预检前置；显示实际看听覆盖与未知 |

共同协议只加载适用章节；每个作者首次需要的完整材料仍应读取。技能注册不等于已经读过，不能仅凭“已加载”标记跳过新版本内容。保留必要领域方法，不以总字数压缩专业标准。

字体工具错误文案、技能和测试同时改，不允许工具继续要求用户选择而技能写自主选择。Local Codex 通用 motion-design 的 VFC 路由要求也要通过其正式配置与技能入口更新，独立视频用途继续有效。

## 14. 状态展示、运行恢复与可观测性

### 14.1 只读状态汇总

扩展现有项目概览/ProductionRun 引用来关联 OD project/run/frozenVersion 和 VFC Job/Revision/Artifact，保留引用而不复制可变状态。缺少关联时明确“未知”，不扫描文件名猜当前版本。

统一显示四行：

1. 作品：源码/正式画面及具名未完成事项；
2. 文件：预览/导出是否完成、对应版本与技术结果；
3. 观察：实际已看/已听范围、方法、已关闭和未知；
4. 用户：是否明确批准该具体 Artifact/哈希。

“当前制作状态.json”如需交付，只生成带生成时间的只读快照；不再作为下一步写入的依据。历史原始响应、创作决定和观察说明保留。

### 14.2 服务和错误

任务开始时与独立资料工作并行核对真实 MCP 能力、Runtime 版本、可用服务和制作进程启动配置。工具未出现在聊天表中、服务不可达、Schema 不符、子进程启动失败分别报告。

Local Codex 子进程启动失败应及时落为明确失败终态并带原因；沿原请求/Run恢复。服务状态文件丢失先查拥有模块和真实原因，再走现有受控恢复入口；不删认证状态、不接管身份不明进程。

本片二维透明边缘问题按真实二维用途采用已验证方式；不全局禁止三维、不放宽 opaque 检查。模型容量不足保留原任务成果，恢复后接回；不自动换模型或重发所有生成。

### 14.3 计时与资源

沿现有 Job attempt、Run 事件及检查点补足关联 ID 和阶段时间：请求、首次响应、文件就绪、采用提交、预览就绪、作者接回、返修提出/关闭。记录等待对象和原因，分别计算墙钟、队列、执行和交接间隔，不把心跳当进展。

不新增遥测平台。媒体两条消费循环和渲染单消费循环先保留；本片主要渲染排队不到 2 秒，不能把增并发当主要方案。阶段校样合并实际相关问题，防止碎片任务占满队列；只有真实排队/资源数据支持时才调整既有调度。

## 15. 删除范围与维护清理

| 旧逻辑 | 替代 | 删除条件及保留边界 |
|---|---|---|
| 多份技能共同职责正文 | 共享交接唯一规则+专项入口 | 同步修链接和行为测试，不删专业方法 |
| 全文简报重复粘贴 | 可读权威文件+任务差异 | 确认作者实际获取完整输入后切换 |
| 作者同步 HTML 副本与哈希 | 正式冻结输入、机器组包 | 历史 Job 固定输入和历史源码仍保留 |
| 手写当前技术状态 | 真实引用生成只读摘要 | 创意判断、原始响应和历史状态保留 |
| 小写入默认全量项目回传 | 类型化短回执、按需读 | 所有拥有的调用方随发行更新，不留双模式 |
| Web 独立时间戳重试分支 | 应用统一恢复 | 专用 Run 对账和 unknown 保护保留 |
| 字幕整版相等及识别期间全局停写 | 固定目标依赖和结果事务 | 人工字幕、用户 SRT、音频身份检查保留 |
| 范围替换照搬全 Beat 覆盖 | 子段相交声明 | 原语义、精度和完整覆盖责任保留 |
| 音频复核绑定全部项目素材 | 按方法和真实范围签名 | 旧观察不可伪装新版完整通过 |
| 单 speech 的无关多模态调用 | 直接当前 ASR 路径 | audio+speech 两种真实需求均保留 |
| 无意义重复预检 | 目的明确预检、固定结果引用与同次证据共享 | 当前输入检查和最终产物验证保留 |
| 无生产用途的五阶段转发门面 | EditingApplication 及现有导航说明 | 先查 public 导出、发行与外部使用；仍有真实用途的能力保留后再简化 |
| 停用 VAD/字幕服务、抛错别名 | 现行 SourceCaptionAlignmentService | 删除废弃执行与专属测试；历史 Job 读取、共享有效函数保留 |

五阶段门面与旧字幕清理不计入本片主要提速收益。公开工具目录若仍宣传停用自动分组等旧入口，也需按实际调用核查后同步移除，不增加另一种兼容实现。

## 16. 逐文件开发清单

下列相对路径均以 E:/ai/VideoCut 为根；“拟新增”不表示文件现在已存在。不要借本次改造整体拆解九千行应用入口，只抽本次需要的具体职责。

| 文件/模块 | 具体修改 | 对应问题 |
|---|---|---|
| packages/contracts/src/index.ts 及适当子模块 | 回执、冻结引用、continuation/采用结果、motion_adoption JobKind、按方法签名版本；不重复现有基准版本 | P06—P15 |
| apps/server/src/mcp.ts | 短回执；采用短任务/恢复入口；export的preflight_job_id；状态和审阅提示一致 | P03、P07—P10、P15、P20 |
| apps/server/src/motion-tools.ts | work/frozen_work 二选一、import_motion_bundle、on_success、错误字段与字体职责 | P03、P06、P09 |
| apps/server/src/app.ts | Web 恢复转发统一应用；同步受影响响应消费者 | P07、P10 |
| apps/server/src/motion-library-output.ts | 各类 Job 摘要与按需全文，保留诊断 | P07 |
| apps/server/src/command-receipt.ts（拟新增） | 唯一接口结果投影，不持有工程状态 | P07 |
| packages/motion-work/src/schema.ts、compiler.ts | 复用完整 work 与像素身份；新增外部输入归一化合同，不复制编译器 | P06、P12 |
| packages/motion-work/src/fonts.ts | MotionFontUnknownError 与工具提示同步；返回现有目录事实，不虚构字形覆盖 | P03 |
| packages/edit-application/src/motion-input.ts（拟新增） | 完整双文件导入、长度/身份核验、原子发布、幂等回执；读受管包并组装现有 work | P06 |
| packages/edit-application/src/motion-adoption.ts（拟新增） | 目标依赖比较、全件/局部采用、事件重绑、预览参数 | P09、P12、P15 |
| packages/edit-application/src/index.ts | 集成新模块；字幕提交/完成；调用既有正式注册、引用、预览机制 | P06、P09、P11 |
| packages/edit-application/src/persistence/sqlite-project-repository.ts | 窄事务完成登记/采用/预览/检查点；统一恢复去重事务 | P09、P10 |
| apps/render-worker/src/motion-job.ts | 检查点恢复、完成后采用、避免已生成成果重画 | P09、P15 |
| apps/render-worker/src/index.ts | RENDER_JOB_KINDS 与 createRenderJobProcessor 接入 motion_adoption，复用既有领取循环和采用事务 | P09 |
| packages/job-runtime/src/index.ts | 仅在有需要时修终态合并不覆盖已持久结果；不新增通用工作流引擎 | P09 |
| packages/edit-application/src/media-intelligence.ts | 恢复路由共用入口、分析能力选择及真实来源 | P10、P17、P18 |
| packages/speech-services/src/index.ts | 固定真实音频、原始识别结果先持久化再提交、冲突重用，清理确认废弃类 | P11、P22 |
| packages/edit-application/src/motion-range-replacement.ts、motion-dependencies.ts | 半开范围覆盖、语义/时钟与真实影响比较 | P12 |
| packages/quality-system/src/editorial-review.ts | 覆盖与对象scope共用显式数组优先/真实相交判定，旧问题引用按拆分结果对账 | P12 |
| packages/edit-application/src/sound-design.ts | 未变意图同步 planVersion，真实变化准确对账 | P13 |
| packages/media-intelligence/src/sound-signature.ts、edit-application/src/sound-review.ts | audio/AV 范围签名、旧观察引用与所有消费者一致 | P14 |
| packages/quality-system/src/index.ts、apps/server/src/sound-tools.ts、apps/render-worker/src/sound-comparison.ts | 每条Review按自身方法/范围核对；基线与各声音候选分别取真实输入身份 | P14 |
| packages/edit-application/src/effect-audio-events.ts | 复用真实 eventMap 与落点判定；不无条件继承 | P15 |
| apps/job-worker/src/media-understanding.ts 及现有分析输入Schema | speech直通且补全真实Run/窗口审计；中性问题与比对资料分开，更新response相关消费者 | P17、P18 |
| packages/edit-application/src/index.ts 的 submitExport/submitRenderPreflight、apps/render-worker/src/exporter.ts | 接收原preflight Job引用，持久化逐项依赖；跨Job核对后构造本次ValidationContext；最终输出核验保留 | P20 |
| packages/project-overview/src/index.ts、apps/web/src/App.tsx、api.ts | 派生状态、回执消费、任务待确认/预览状态；不复制业务规则 | P07、P08、P09、P19 |
| packages/edit-application/src/production-flow.ts 及导出/引用 | 核查使用后删纯转发门面和镜像测试，导航保留适当入口 | P21 |
| .agents/skills/ 对应文件 | 按 §13 修改；同步发行副本，禁止手改缓存 | P01—P05、P08—P20 |
| plugins/videoflowcut/scripts 与 runtime/dist | 沿现有 build/sync/verify 构建候选，禁止额外维护一套发行逻辑 | 全部 |

Local Codex 跨仓改动根目录为 E:/ai/open-design，单独开发和验证：

| 现有位置 | 具体职责 |
|---|---|
| apps/daemon/src/mcp.ts | 注册freeze_project_work/read_frozen_work，绑定现有项目/Run访问和同一应用函数，返回明确长度而非截断内容 |
| apps/daemon/src/run-html-version-snapshots.ts、project-file-versions.ts | 复用版本能力，补源码+清单组合原子冻结；单 HTML 历史不冒充整包 |
| apps/daemon/src/project-work-bundles.ts（拟新增的小模块） | prepareAuthoredWorkSubmission、成套身份校验、冻结原子发布和只读完整字节；不持有第二工程状态 |
| apps/daemon/src/run-artifact-fs.ts | 与冻结产物关联，保留已有扫描历史，避免读取工作中文件作为已交件 |
| plugins/_official/scenarios/od-next-strategy/open-design.json、references/task-profile-mapping.md | 核对现有taskProfiles及实际用途映射，优先采用满足需求的源码路由 |
| packages/contracts/src/plugins/deliverable-skills.ts、apps/daemon/src/plugins/strategy-package.ts | 交付声明、正式加载和包身份与实际用途一致 |
| skills/motion-design/SKILL.md 及既有同步脚本 | 公共源修改后生成场景副本；保留独立视频交付，只调整VFC源交付职责 |

上述文件已定位到现有加载链；实施时仍核对真实注册引用，不能创建无人读取的配置文件。现有源码快照与 Run 结构不足时在原模块扩展，不新开守护服务。跨仓分别记录代码完成、候选构建与实际部署，不能单端完成就启用未发布的合同。

## 17. 开发批次、依赖与可交付结果

### 17.1 可执行的开发顺序

| 批次 | 工作内容 | 前置 | 每批完成时可实际验证 |
|---|---|---|---|
| A0 基线与问题复现 | 固定现有工作树、发行、隔离片；复现恢复入口、字幕冲突、声音依赖和范围问题 | 无 | 真实旧行为、无生产变更的对照输入 |
| A1 职责与协议 | 共享职责去重、字体冲突修正、短回执、明确源交付路由 | A0 | 原流程仍可完成；返回充分且精简、职责无相反指令 |
| A2 固定作品交接 | 完成后冻结、VFC 受管输入和机器组包；同步对应技能 | A1及跨端接口开发，可与B1并行 | 同一作品完整work与机器包等价，作者不再复制源码 |
| B1 完整换版执行 | 先用已有完整work打通生成→原子采用/声音→预览；motion_adoption与统一恢复 | A1，不依赖A2 | 主任务一次明确委托接回真实预览；断线不重复执行；A2完成后接同一链 |
| B2 局部修改 | 修复覆盖声明、接点/事件，接入同源proof采用和局部接续 | B1 | 本片一处裁切可局部返修并与全片重渲对照 |
| C1 真实依赖 | 字幕并行接回、SoundPlan关联与音频/AV签名 | A1，可与B并行 | 无关编辑不阻断，相关变化不覆盖人工工作 |
| C2 阶段观察 | 作者运行中明确冻结范围、前移校样/有声检查、统一问题接回 | A2及已有proof；自动有声接续接B1、局部采用接B2 | 同一作品边推进边检查，实际减少晚返工 |
| D 分析与清理 | speech分流、检查证据共享、旧代码清理 | 对应模块基线和调用核查 | 必要能力保留，重复调用及维护面实际减少 |

不是等全部改完才第一次试视频。A1 保持现有生成链；B1 直接用已发布的完整 work 输入先端到端处理主画面换版，A2 的跨端冻结并行开发，完成后只替换输入组装方式；B2 再加入范围；C2 最后验证阶段交件能否缩短关键路径。已使用的完整 work 与冻结引用各有明确用途，共用同一业务实现，不需要为跨端接口等待整条链。

### 17.2 不在首批扩大

- 不自动判断任意 HTML 的全部影响范围。
- 不按镜头数量无限分派作者，不新增提示词转换代理。
- 不调整默认模型或以更低画质/更少素材换耗时。
- 不先增加 Worker/GPU 并发；有争用证据再测。
- 不把未完成审美观察变成全平台禁止导出的新门禁。
- 不为了兼容已停用代码增加迁移层；历史数据读取和有效能力分别保留。

## 18. 测试与验收矩阵

测试从简，优先扩展已有高价值测试文件，不给每个转发函数写一份镜像测试。

| 编号 | 核心行为与失败注入 | 应有结果 | 建议位置 |
|---|---|---|---|
| T01 | 写入回执、错误、对象创建和按需读取 | 必需数据充分，版本/影响正确，不反复补查全项目 | 现有 HTTP/MCP 集成测试 |
| T02 | 源码与旧清单错配、冻结中变动、中文完整传输、缺资源、摘要/长度不符、丢响应 | 不发布混合版/半包；源后来改变不影响冻结版，同身份恢复；完整work与组包等价 | motion 输入/跨端集成测试 |
| T03 | 完整换版、事件完全不变/相关变化、proof/默认proof携带on_success；显式重新采用 | 不变声音先重绑后对账；变化时原Cue/音轨保持；proof拒绝自动采用；motion_adoption被真实消费 | 受管 motion 集成测试 |
| T04 | 文件完成后、事务前、事务后终态前退出；重复领取生成与采用Job | 不重复生成/采用/入队；终态合并不覆盖权威结果；读回同一 Asset/Revision/Preview | Job/仓储恢复测试 |
| T05 | 同键同输入/不同输入；A失败→B失败→C；Web/MCP交叉恢复；unknown | 同请求去重、不同请求拒绝，恢复链正确，不重复外部提交 | 现有恢复测试 |
| T06 | 无关/相关编辑、人工字幕/SRT、音频实际字节变化；识别后保存前/提交前崩溃 | 无关可继续；相关不覆盖；原Run/已持久结果可恢复；输入身份变化拒绝，保留请求与提交两个版本 | source-caption-worker、恢复测试 |
| T07 | 六Beat拆分、显式[]与旧锚点、对象scope、原ID与新ID问题映射、跨fps/持续声 | 覆盖判定一致；历史审阅不冒充新段通过；根时钟/唯一事件正确，拒绝时事务不变 | tests/motion-range-output.test.ts及编辑审阅测试 |
| T08 | 声音计划增无关意图、改相关方向、删意图 | 未变关联同步；真实变化准确对账/停用，不凭版本假静音 | sound-plan-contract、sound-design-chain |
| T09 | 多个不同区间的audio/AV、相关/无关变化、候选与正式混音；局部failed及旧passed | 逐条适用性正确；失败不被另一范围通过掩盖；旧观察保原身份，不伪造新通过 | 声音/质量测试 |
| T10 | speech及audio+speech成功/失败/unknown；中性问题与期待资料分离 | 只调所需能力；纯ASR可形成真实观察/覆盖，Run与原窗口完整，错误可纠正而非保证自动识别全部幻觉 | media understanding 测试 |
| T11 | 跨Job预检引用、旧结果缺失、丢/改文件、换用途/环境 | 引用有真实证据；缺失/失效项重查；实际输入和最终产物核验保留 | exporter/cache 测试 |
| T12 | 同冻结作品完整重渲与局部拼装、真实观看/听感 | 生成帧/alpha/颜色/时钟/事件/接点符合，阅读与声画成立 | 隔离真实片对照 |

T12 不把压缩后文件字节完全相同当作所有局部拼接的必要条件；比较应选择适当的原始生成帧、编码结果和音频时间证据，区分编码差异与实际画面错误。真实连续观察另记录方法和范围，感知能力不足不能写通过。

已有相位、事件、proof采用测试继续复用，只补未覆盖的多Beat/冲突/恢复用例。技能静态测试保留链接、发行同步、必要路由与反向条款检查，不用重复关键字出现代替真实流程验证。

### 18.1 效率指标

| 指标 | 统计口径 |
|---|---|
| 端到端交付时间 | 用户开始到可交付结果，用户等待/服务中断单列，不从总数消失 |
| 首次可检查时间 | 第一份固定版本真实校样/预览就绪，不能用简报完成代替 |
| 人工模型接力次数 | 为搬运状态/参数发生的往返，与真正创意判断分开 |
| 重复输入/返回体积 | 同内容简报/源码/项目快照的实际次数与字节，不能假定全部进入模型上下文 |
| 重复生成 | 哪个版本/范围因什么原因重画，失败与必要设计修改分开 |
| 队列与执行 | 现有attempt开始结束；并行任务按墙钟与累计分别记录 |
| 返修 | 发现时机、真实问题、合并批次、关闭证据和重复发现原因 |
| 质量覆盖 | 连续画面、正常速度文字、声音、事实及未知范围 |

用户提出的“正常情况下，一小时以内”落实为**设计与验收目标**：对本片同类的约80—90秒解释片，从用户给定稿到形成经过真实声画检查的可交付候选，目标为正常情况下不超过60分钟；不是只计最后导出，也不是目前已经达到。未完成必要看听的粗稿不算目标达成，用户最终批准另行记录，不伪造或代替。

验收分两组：固定素材/源码的执行链对照，测机器处理和恢复是否变好；同类完整制作，测作者、交接、返修与实际审查的总墙钟。记录每次全部用时、样本数、成功/失败数、≤60分钟比例和P50/P90，小样本分位只作描述，不能包装成稳定承诺。故障、队列和用户等待保留在实际总耗时并单列；可另报等待剔除后的诊断值，但不能排除常见故障来制造达标。未达目标说明真正瓶颈，再决定对应修改。

不承诺任何条件下一小时硬上限，不按未验证收益相加。此前 35.8→6.4 分钟为另一长片合成阶段，不作整条制作链的速度倍数。

## 19. 构建、部署与完成判据

1. 开发阶段仅改本次对应代码、合同、技能和必要测试，记录原有差异；隔离验证不写正式片。
2. 先完成对应核心测试和类型检查，运行已有技能同步与发行构建/验证脚本；产物留在 plugins/videoflowcut/runtime/dist。
3. Local Codex 与 VFC 的新冻结/路由合同须双端实际验证；一端配置存在不等于另一端已能调用。
4. 部署按现有入口与已授权范围执行，不手改已安装缓存；切换前核对队列和真实运行版本。
5. 制作会话重新连接，核对 MCP/Runtime releaseId、Schema、API和Worker，读回原项目无无关变化；相关工单沿既有部署确认机制收口。
6. 发布说明逐项映射 P01—P22：已实现、验证通过、仍待复现、明确未实施。不得把方案文件、构建成功、生产部署和视频交付混称完成。

整项优化完成需要同时具备：职责/规则不再冲突，自动交接与接续能实际运行，范围/依赖/恢复保持正确，同任务对照证明重复劳动减少，声画质量与真实观察范围得到说明；同时报告 §18.1 一小时目标的实际达成情况。没有完成的范围明确列出，目标未达不能称整项效率验收通过，不能以技术导出成功替代。

### 19.1 明确代价与保留限制

- 冻结输入和原始识别结果会多占受管磁盘；原工作件、提交输入和正式媒体职责不同，不能靠删唯一输入省空间。清理沿现有保留规则，仍被Job/历史记录引用的文件不提前删除。
- base64 传输约比原字节增加三分之一体积，目的是机器交接和中文完整性，不是压缩；完整消息容量必须实测，不能把字节量下降等同于全部模型时间下降。
- 内容核验与短事务也有成本；大文件工作在锁外，事务只做必要工程变化。记录新增校验耗时和占锁时间，不能用取消身份检查换速度。
- 增加 motion_adoption 会多一张短工单，复用现有队列可能等待其他渲染；本片当前排队很短，先保留现有调度并测量，不为可能等待就新建服务。
- Local Codex 与 VFC 的冻结合同需要双端维护和发布；已有完整 work 路径可独立完成业务，因此不把跨端开发变成其他优化的强制前置。
- 复用观察、声音绑定和局部画面都要求真实依赖成立；证明不了就保留未知或扩大必要检查范围。方案减少机械重复，不保证取消创作试错、供应侧排队或必要返修。

## 附录 A：关键源码与规则证据

行号以 2026-10-30 审计时为定位参考，实施前以当前函数名和真实代码为准。

| 证据 | 当前入口 |
|---|---|
| 小写入返回完整工程 | [mcp.ts](E:/ai/VideoCut/apps/server/src/mcp.ts:2590)；本片 final-cue-update-response.json |
| Web恢复与应用恢复不同 | [app.ts](E:/ai/VideoCut/apps/server/src/app.ts:1351)、[media-intelligence.ts](E:/ai/VideoCut/packages/edit-application/src/media-intelligence.ts:46) |
| 作品提交与完成 | [EditingApplication](E:/ai/VideoCut/packages/edit-application/src/index.ts:2507)、[motion-job.ts](E:/ai/VideoCut/apps/render-worker/src/motion-job.ts:201) |
| 当前事务只提交Revision | [sqlite-project-repository.ts](E:/ai/VideoCut/packages/edit-application/src/persistence/sqlite-project-repository.ts:451) |
| 字幕全局版本检查 | [speech-services](E:/ai/VideoCut/packages/speech-services/src/index.ts:1054)、[字幕完成](E:/ai/VideoCut/packages/edit-application/src/index.ts:4467) |
| 局部替换照搬与覆盖校验 | [motion-range-replacement.ts](E:/ai/VideoCut/packages/edit-application/src/motion-range-replacement.ts:24)、[effectBeatRanges](E:/ai/VideoCut/packages/edit-domain/src/index.ts:1320) |
| 声音计划与签名 | [sound-design.ts](E:/ai/VideoCut/packages/edit-application/src/sound-design.ts:67)、[sound-signature.ts](E:/ai/VideoCut/packages/media-intelligence/src/sound-signature.ts:5) |
| 实际声音事件绑定 | [effect-audio-events.ts](E:/ai/VideoCut/packages/edit-application/src/effect-audio-events.ts:34) |
| 分析每窗的调用顺序 | [media-understanding.ts](E:/ai/VideoCut/apps/job-worker/src/media-understanding.ts:139) |
| 像素身份包含完整源码 | [compiler.ts](E:/ai/VideoCut/packages/motion-work/src/compiler.ts:69) |
| 技能要求简报全文进prompt | [opendesign-video-production](E:/ai/VideoCut/.agents/skills/opendesign-video-production/SKILL.md:21) |
| 字体决策冲突 | [motion-tools.ts](E:/ai/VideoCut/apps/server/src/motion-tools.ts:36)、[submission-and-recovery](E:/ai/VideoCut/.agents/skills/opendesign-video-production/references/submission-and-recovery.md:135) |
| 五阶段门面 | [production-flow.ts](E:/ai/VideoCut/packages/edit-application/src/production-flow.ts:425) |
| 单HTML历史与结束时扫描 | [run-html-version-snapshots.ts](E:/ai/open-design/apps/daemon/src/run-html-version-snapshots.ts:78)、[run-artifact-fs.ts](E:/ai/open-design/apps/daemon/src/run-artifact-fs.ts:205) |
| 发行技能同步 | [sync-skills.mjs](E:/ai/VideoCut/plugins/videoflowcut/scripts/sync-skills.mjs) |

## 附录 B：问题到开发、验收的追踪

| 问题 | 主要开发批次 | 关键验收 |
|---|---|---|
| P01、P02 | A1 | 共享规则唯一维护；同稿交接与真实作者职责一致 |
| P03、P04 | A1/A2 | 字体授权一致；实际路由只承担相应交付责任 |
| P05、P06 | A2 | T02；作者完整取得输入，源码不再人工复制 |
| P07 | A1 | T01；信息充分与通信减少同时成立 |
| P08 | A1/B1 | 真实Run/Job引用生成视图，无手写当前状态漂移 |
| P09、P15 | B1/B2 | T03、T04、T05、T07 |
| P10 | B1 | T05及未知结果不重复外部提交 |
| P11 | C1 | T06及真实字幕对齐保持 |
| P12 | B2 | T07、T12 |
| P13、P14 | C1 | T08、T09 |
| P16、P19 | C2 | T12及真实观察范围/返修时机 |
| P17、P18 | D | T10及来源/窗口/纠正历史 |
| P20 | D | T11及真实输出验证 |
| P21、P22 | D | 调用核查、有效能力回归、历史只读仍可用 |

本方案的开发落实与验证结果见上述《开发与验收记录》。生产切换、正式片重做与整条制作链的一小时目标另行验证，不以代码或隔离样片代替。
