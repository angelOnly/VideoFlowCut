---
name: visual-explainer-director
description: 作为旁白、机制、数据、证据和 UI 驱动视频的主要工作流，从 NarrativeMap、Scene Grammar、素材与证据一直负责到 Remotion、字幕、声音、质量和交付。
---

# 视觉解释片完整生产工作流

## 解释片的核心不是“旁白配动画”

视觉解释片的价值在于让观众看见关系、状态、空间、流程、比较和证据。旁白可以说明方向，但视觉应承担真实理解。如果每一句旁白都换成一个标题卡，观众只是在同时听和读同一内容，视频会像动态 PPT；如果只找泛化 B-roll，又会让复杂机制失去精度。

`visual-explainer-director` 是完整主工作流。它从 Script/旁白、问题和证据建立 NarrativeMap，规划 Scene 边界和内部状态，调用素材、证据、Remotion、字幕和声音专项 Skill，并负责整片认知连续和交付。现有 Scene 加受管 ManagedMotion 可以实现原创二维主视觉；通用自动编译仍不完整，实际生成与审阅必须执行。

## 适用范围

适合分类、机制、流程、数据、对比、政策、产品结构、UI 操作、历史演变、证据论证和知识解释。人物可以开场、过渡或提供信任，但若主要理解仍依赖视觉模型，主工作流是 Explainer。

不适合以人物坦白、访谈关系或实拍事件为主的视频；这些应由 Presenter 或 Vlog 统领，并在局部调用 ExplainerScene。

## Gate A：NarrativeMap 和主声音

### 从问题开始

先明确观众现在不知道什么，以及视频准备让他建立哪个模型。不是把 Script 按句号切 Scene，而是找问题—解释—证据—反例—结论的结构。一个优秀的 NarrativeMap 让每个 Scene 都有认知任务，并说明为什么下一 Scene 现在才出现。

### 信息账本

记录进入每个 Beat 时观众已知、当前问题、即将新增、暂缓信息和可能误读。视觉不能提前展示所有分类、完整流程或最终结论，否则旁白失去推进。

### 主声音

制作前用 `manage_sound_plans` 将每段的旁白表演、动作声音功能、音乐和留白共同确定。语音实际生成后才锁定物理时长。需要声音素材时进入 [sound-asset-sourcing](../sound-asset-sourcing/SKILL.md)（`sound-asset-sourcing`），默认在线搜索、原声理解、原文件采用与上下文比较，再交 audio-finishing。解释声音本身的段落使用 demonstration 主导区间，不能固定让旁白和音乐覆盖需要听辨的内容。

旁白应在没有画面的情况下仍能理解基本逻辑，但不需要把视觉中已经清楚的所有关系重复念一遍。若使用 OmniVoice，调用 `voice-production`；若来自原视频，调用 `transcription`/`semantic-continuity`。稳定主声音后再编译 Scene。

## Scene Grammar：选择视觉机制

以下语法是构思方法，不是封闭模板或 MCP 必选枚举；可组合、变形或另建适合当前关系的表达。

### HeroReveal

用于开场极端结果、关键数字或核心对象。先建立最少坐标，再给冲击，不让视觉夸大后文无法证明的承诺。

### ProgressiveClassification

用于分类、分层和用户群。先建立共同坐标，再逐项出现，最后显示差异或重点。不要每类一张新卡片。

### ComparisonScene

用于 A/B、前后、价格、方案和正确/错误。先建立比较维度，再出现双方，最后给差值或判断。不同尺度的数据不能用相同视觉长度误导。

### RouteAndFlow

用于流程、因果、路径、迁移和系统。对象和关系持续存在，随旁白推进；复杂流程分阶段揭示，不一次跑完。

### LayerStack

用于产品组成、成本、技术栈和结构层级。层的位置和顺序要有含义，不能只是叠卡片。

### EvidenceDocument

用于法规、论文、投诉、报告和合同。先建立页面与来源，再聚焦和高亮，保留条件、否定、单位和上下文。

### UIWalkthrough

用于 App、网页和操作。让观众看见真实界面状态变化、点击目标和结果；人物/旁白只解释必要内容。

### DataConclusion

用于趋势、比例和结论。数据来源、坐标、基线、样本和不确定性必须可读，动画不能改变比例事实。

### RealityBroll

用于现实经验、地点、行为和情绪。它提供“发生在哪里、是什么感受”，不替代机制解释。

### QuotePortrait / HistoryTimeline / EndCard

分别用于人物观点、历史演变和收束，但引语、日期和来源需要真实证据。

详细变体与案例见 `references/explainer-scene-grammar-casebook.md`。

## 大 Scene 内部渐进

一个 Scene 可以持续十几秒，内部通过 Progressive State 引导注意。比如解释“三类成本”：先出现总成本容器，随后固定成本、变量成本、机会成本依次加入，最后用一条关系显示为什么第三类经常被忽略。对象在同一空间中持续，观众不需每句话重新定位。

Scene 切换发生在观看任务改变时：从分类模型转到真实证据、从 UI 操作转到结果、从机制转到个人现实。动画结束或句号不是充分理由。

## 解释、证据和现实素材的分工

解释回答“它怎样运作”；证据回答“为什么相信”；现实素材回答“它发生在哪里、是什么体验”。同一段不应让三者同时争夺主视觉。机制应优先 Remotion；证据通过 `evidence-visualization`；现实素材通过 `visual-asset-sourcing` 和 `cutaway-planning`。

例如讲“平台抽成结构”，一段 LayerStack 解释比例关系，随后 EvidenceDocument 展示官方规则，最后现实 B-roll 展示创作者工作场景。只用三张抽象卡片会缺证据，只用工作场景又无法解释机制。

## 从 Script 到 NarrativeMap 的实际方法

第三遍得到的视觉模型是候选，由动效专项细化关键画面与变化；已确认事实和知识推进不变，语法名称不能直接锁定组件。

第一遍只读/听内容，标记问题、主张、解释、证据、例子、反例和结论。第二遍合并属于同一认知模型的语句，避免按句号切分。第三遍为每个模型选择最适合的视觉语法，并写清进入时观众已有知识和离开时新增知识。

例如一段旁白：

> 平台并不是直接把广告费全部给创作者。广告主先付给平台，平台扣除分成，再按照播放和规则结算给创作者。

它不是三张卡。可以是一个 RouteAndFlow Scene：广告主、平台、创作者三个对象持续存在，资金路径先到平台，抽成分支出现，最后结算到创作者。官方分成规则另建 EvidenceDocument，而不是把证据和解释混在同一视觉层。

## Scene 计划表

计划同时记录前后段入口/出口状态、共享对象、硬约束与允许调整的候选设计；它不是新增数据库字段要求。

每个 Scene 建议记录：

```text
scene purpose
entering knowledge / current question
primary visual object
persistent objects
progressive states
settled conclusion
voice range
caption role
asset/evidence requirements
audio role
exit and next-scene bridge
validation
```

这不是数据库字段要求，而是保证 Scene 能被主工作流、Remotion 和质量共同理解。

## 工具与当前落地

当前 MCP 已实现 `manage_story` 保存 Beat、`manage_narrative_map` 写入 NarrativeMap、`read_narrative_map` 读回当前 Revision 的问题/知识/递进与证据交接、`manage_visual_treatment` 保存主视觉决定、`create_scene` 创建基础 ExplainerScene 或 CutawayScene、`manage_cutaways` 将已就绪本地视频放入 Fullscreen/PiP、`submit_motion_work` 生成原创固定版本，`review_motion_work` 审阅，`manage_effect_cues` 放置，以及 `render_preview_range` 与 `inspect_composed_frames` 验证。当前 Scene Schema 没有独立 DocumentScene；文档、网页和证据只能作为已登记 Asset 进入已有 Scene。

这些对象和命令已有确定性 MCP/项目图测试，但不等于 Evidence Provider、完整 Scene Registry、复杂数据/文档组件或审美效果已经完成真实验证。每次写入 NarrativeMap 后读回对象、Revision、Impact 和 Preview；缺失组件不能用错误的通用卡片替代后声称完成。

不能为了“代码已支持 create_scene”就用一个空 Scene 声称 Explainer 成立；也不能把 Presenter Effect Registry 里的 ProductFan 强行当通用解释组件。

## 多 Scene 的整片结构

解释片需要在抽象与具体之间切换。一个常见节奏是：Hook/问题 → 简化模型 → 逐步解释 → 真实证据 → 现实例子或反例 → 回到模型修正 → 结论。不是每条视频都用同样顺序，但应让观众的 Question 和 Knowledge 持续更新。

证据段之后需要解释它证明什么，现实 B-roll之后需要回到模型或人物，不让视频变成三种素材的拼盘。声音桥、颜色和持续对象可以帮助过渡。

## 复杂信息的减法

当一张 Scene 有超过观众能同时比较的对象时，应分阶段、分组或拆 Scene。不要用更小字体、更多箭头和更快动画解决。旁白可以省略视觉已经表达的内容，视觉也不必显示所有旁白词语。

## 自主设计与可选参考

没有参考也正常推进，从知识关系和素材自主确定本片视觉语言。不是每份作品都要匹配网站样片。

参考视频用于提炼 Scene 持续时间、内部状态、字体层级、运动语气、证据切换和 AttentionCurve。不要逐镜复制素材和效果。Golden Test 比较的是本项目重建的代表性帧和运动，而不是原参考画面。

## Gate B：具体生产

`visual-treatment-planning` 确认当前观看任务、主要表达方式和整片 AttentionCurve；`scene-planning` 形成范围与前后接口；[原创动效专项](../remotion-production/SKILL.md)（`remotion-production`） 将完整解释段转成具体视觉构思、关键画面和连续运动。Scene Grammar 提供思考工具，不能把所有内容强行装入现有卡片或有限 Program。

原创主视觉可以由受管 Remotion 作品实现，并通过现有 ExplainerScene 与 ManagedMotion 放置。先确认素材与实现能力，再生成、审阅和合成。需要真实证据时由 `evidence-visualization` 提供可追溯素材；需要视频时由素材与 Cutaway 链路承担播放，不假定受管作品已经支持嵌入任意视频或声音。

作品替换现有 Program 时，明确谁承担主视觉，再对旧 Program 局部停用。不能用新的不透明背景把旧内容遮住后就宣称替换完成。结构上覆盖完整 Scene，只证明有可用主视觉；内部是否真的解释了内容，仍由真实连续观看验证。

## 字幕和声音

解释片的字幕不能重复整个主视觉。旁白已经读出、画面已经显示关系时，字幕可以简化或只保留无障碍短句。证据阅读时字幕应退让，避免遮原文。音乐提供章节和能量，不应在高信息段持续强拍；SFX 只绑定对象建立、状态改变或结论，不给每个元素入场都加声音。

## Gate C：质量和交付

场景级 Preview检查 Entry、内部推进、Settled、阅读和 Exit；整片静音看是否能理解视觉逻辑，完整声画看旁白与视觉是否互补而非重复，首次观众看是否知道当前在解释哪个问题。证据、数据、来源、权利和生成标记也必须通过。

质量问题应退回具体 Scene、证据、字幕、声音或 NarrativeMap。正式 delivery 遵循 `quality-verification` 与 `export`。

## 常见失败

- 旁白一句一页卡片；
- 全部信息一开始同时出现；
- 图形只是文字容器，没有关系或状态；
- 证据缩小到看不清；
- 生成截图冒充真实页面；
- 数据动画改变比例或缺基线；
- 同一模板重复整片；
- B-roll 只装饰、不解释；
- 每个对象都动，观众不知道先看哪里。

## 交接合同

原创交接必须带模型取舍、关键状态、固定作品版本、多 Beat 覆盖、命名事件帧与真实合成证据。代表段成立后继续全片，并用换题检查是否只是换标题。

本主工作流接收各专项结果并负责最终认知连续。完成条件包括 NarrativeMap 清楚、Scene 有任务和渐进、解释/证据/现实分工、声音与字幕不重复主视觉、真实 Preview 和五轮审片通过、能力缺口明确、Delivery 绑定目标 Revision。

## 真实素材进入 NarrativeMap 与 ExplainerScene 前的审阅

旁白、页面标题和文件名不能替代对真实证据、UI、产品或现场素材的查看。需要使用某段真实素材建立 NarrativeMap、EvidenceCapture 或 ExplainerScene 时，先读取 `inspect_asset overview`，再对实际引用范围使用 `range`。确认素材真实显示什么、不能证明什么、状态变化是否完整、页面或视频上下文是否足够，以及观众需要先看全貌还是先看局部。

Explainer 主工作流把审阅结果写入现有 EvidenceCapture、NarrativeMap、VisualTreatment 和 ExplainerSceneProgram。一个局部截图只有在来源、条件、否定、单位和页面关系仍可辨认时才是证据；否则应扩大范围、先建立页面全貌或明确标为示意。
