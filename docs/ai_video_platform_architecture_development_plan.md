# AI 视频创作与剪辑平台：架构与开发方案

> 文档状态：V6.2 Skills 主工作流编排增量优化开发基线  
> 核心方向：数字人口播 + 人物前后景 Remotion 动效 + 全屏视觉解释场景，并在同一工程内支持视觉解释片、Vlog 与混合视频  
> 工程约定：所有模块直接按本架构实现；项目状态由 Editing Application 统一持有；Codex 通过项目 Skills、统一 MCP 与浏览器操作完成视频生产；项目内 `docs/` 是实现外部能力和吸收 ChatCut 方法的必读资料  
> 本版边界：以 V6.1 为唯一底稿，保留其产品、领域、MCP、Web、Remotion、Job、Quality 和开发阶段设计；本次只调整 Skills 的主从关系、完整工作流责任、专项交接、路由测试与阶段验收，不重构 Editing Application，也不增加 Skill 调度服务或第二份项目状态

---

## 1. 文档目标

本文档用于直接指导项目开发，明确以下内容：

1. 产品中心、工程内核和完整生产链路；
2. 数字人口播、视觉解释片、Vlog 与混合视频如何共用一个工程；
3. Story、Scene、Timeline、Remotion 各自负责什么；
4. Codex、`.agents/skills`、`video-editor-mcp` 与 Web 工作台如何协同；
5. 哪些模块为内容质量、剪辑节奏和视觉效果负责；
6. FunASR、OmniVoice 如何由服务端直接调用 ComfyUI Bridge HTTP API，以及段级语音时序、数字人和 Remotion 如何协同；
7. 外部视觉素材如何通过受控检索、候选筛选、许可记录、本地化、缓存和生成降级进入项目；
8. Revision、EditTransaction、ImpactReport、局部预览和质量验证怎样闭环；
9. 如何区分素材可用、项目可编辑、局部可预览、最终文件已生成和完整声画已验收；
10. 如何由总导演 Skill 选择一个完整视频工作流，并由主工作流按阶段调用专项 Skills；
11. 开发阶段、模块边界、工具职责和验收标准。

本文档确定的是产品架构、领域边界、调用关系和质量闭环，不提前固定数据库字段或逐文件代码实现。具体类名和字段可以在编码中调整，但不得破坏以下原则：

- 项目状态只有一个事实源；
- Story、Scene、Timeline 和 Preview 使用同一个 Revision；
- Web、MCP 和后台 Worker 不重复实现业务规则；
- Codex 做创作判断，Application 做确定性执行，Remotion 做表现与合成；
- 所有自动生产结果必须可读回、可预览、可验证、可继续修改；
- `Asset ready`、`Job succeeded`、`Timeline 可播放`、`Preview 可见`、`Export 成功` 和 `完整审片通过` 不得合并成一个笼统的完成状态。

## 2. 项目资料、Agent 配置与开发约定

### 2.1 项目内 `docs/` 是必读实现依据

项目目录中的 `docs/` 保存产品拆解、官方 Skill 译文和已经可用的外部接口说明。开发 Agent 在实现对应模块前必须先读取这些资料，禁止凭记忆猜测接口，也禁止在架构文档中复制一份长期失效的字段表。

当前必须维护以下目录约定：

```text
docs/
├─ ARCHITECTURE.md
│  └─ 本文档在新项目中的正式位置
├─ chatcut视频剪辑工具拆解/
│  ├─ 产品、项目、Script、Timeline、MCP、验证和 Web 交互拆解
│  └─ 官方Skill与插件译文/
│     └─ skills/                     ChatCut 官方 Skills 译文
├─ asr接入.md
│  └─ ComfyUI-AppApi Bridge、FunASR、OmniVoice 及相关工作流 HTTP API
└─ asset-sourcing/
   ├─ provider-contracts.md          各素材 Provider 的查询、预览、下载和限流合同
   ├─ licensing-policy.md            项目的素材许可、署名、禁止和导出 Gate
   └─ provider-notes/                Pexels、Pixabay、Wikimedia 等官方文档核对记录
```

开发时的读取要求：

- 开发 Web 工作台、项目状态、编辑编译或交付链路前，至少读取：
  - `docs/chatcut视频剪辑工具拆解/01-产品全景与核心结论.md`；
  - `docs/chatcut视频剪辑工具拆解/03-从素材理解到成片的完整链路.md`；
  - `docs/chatcut视频剪辑工具拆解/05-Script-IR与口播语义剪辑.md`；
  - `docs/chatcut视频剪辑工具拆解/06-字幕音效背景音乐与MG动画.md`；
  - `docs/chatcut视频剪辑工具拆解/08-实测记录浏览器验证与字段样例.md`；
  - `docs/chatcut视频剪辑工具拆解/10-能力边界风险与可复用设计.md`；
  - `docs/chatcut视频剪辑工具拆解/11-Codex、ChatCut MCP 与 Web 编辑器交互链路.md`；
  - `docs/chatcut视频剪辑工具拆解/13-ChatCut从导演计划到可交付成片的四层状态机.md`；
  - `docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/` 中与 UI、文字稿、素材库、Timeline 和验证相关的资料；
- 编写项目 Skills 前，读取 `docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/`，提取方法、顺序、禁止行为和退出条件；
- 接入 FunASR 或 OmniVoice 前，读取 `docs/asr接入.md`，以运行时工作流详情接口返回的 `schemaVersion`、`fields`、`itemSlots` 和 `outputs` 为准；
- `docs/asr接入.md` 中的示例版本号和字段 ID 只用于说明，不得作为长期硬编码合同；
- 接入任何外部素材 Provider 前，先在 `docs/asset-sourcing/provider-notes/` 记录官方接口、当前限制、许可要求和最后核对日期；Provider 的接口、限流和许可条款不得只存在于代码注释；
- `docs/asset-sourcing/licensing-policy.md` 是导入和导出的正式策略来源，任何来源不明、许可未知或需要额外确认的素材都不得绕过它进入已批准 Revision；
- ChatCut 资料用于复用产品方法和交互逻辑，不直接复制其品牌、服务端字段或运行时工具名。

使用 ChatCut 调研结论时，必须保留其证据等级：

- **已实测**：当前样本完成了写入、读回以及与该能力相匹配的画面或声音验证；
- **工具 / Skill 合同明确**：对外合同说明了能力、输入或边界，但当前项目未必已经跑通；
- **合理推断**：只用于解释职责边界，不得写成 ChatCut 已公开的字段、服务或私有算法；
- **未验证**：不得转换成 VideoFlowCut 的既定事实，也不得据此宣称 ChatCut 有或没有某项能力。

VideoFlowCut 可以吸收被证据支持的产品边界，例如“素材可编辑不等于可渲染”“项目结构正确不等于成片审美通过”；不能因为调研文档使用了某个解释性名称，就机械新增同名数据库对象或服务。

`docs/asr接入.md` 当前确认的调用入口是：

```text
服务根地址：http://127.0.0.1:8188
API 根地址：http://127.0.0.1:8188/comfyui-bridge/v1
```

当前使用的工作流：

```text
FunASR 本地音频转文字
workflow_id = dd564543-d02d-4247-9e97-089417db9e7a

OmniVoice 自动音色克隆与语音合成
workflow_id = ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce
```

外部工作流调用的共同规则：

1. 先 `GET /workflows/{workflow_id}` 读取最新结构和 `schemaVersion`；
2. 再 `POST /workflows/{workflow_id}/runs` 创建任务；
3. 使用返回的 `run_id` 轮询 `GET /runs/{run_id}`；
4. 只有状态为 `succeeded` 才读取输出；
5. 音视频文件通过 `downloadUrl` 立即下载并注册成本地 Asset；
6. `failed` 必须保存外部错误，不能假装生成成功；
7. ComfyUI 重启后旧 `run_id` 可能不可查询，因此本项目必须持久化自己的 Job、请求摘要和已下载产物。

所有接口实现必须保存：

- 本项目 Job ID；
- workflow ID；
- 外部 run ID；
- 提交时解析到的 schemaVersion；
- 请求摘要；
- 外部原始状态与错误；
- 下载后的本地 Asset；
- 对应 Project、Revision、Script Revision 和幂等键。

### 2.2 Codex 项目指令与 Skills 目录

仓库根目录使用：

```text
AGENTS.md
```

它负责声明项目级开发原则、必读文档、测试要求、模块边界和禁止行为。

仓库内 Skills 放在：

```text
.agents/skills/<skill-name>/SKILL.md
```

每个 Skill 可以包含：

```text
.agents/skills/<skill-name>/
├─ SKILL.md
├─ references/          可选，放专项参考和本项目调用约定
├─ scripts/             可选，放确定性辅助脚本
├─ assets/              可选，放模板和示例资源
└─ agents/
   └─ openai.yaml       可选，放显示信息和工具依赖
```

根目录 `AGENTS.md` 必须要求 Codex：

1. 修改任何模块前先读本架构文档；
2. 实现 ChatCut 对应能力前先读拆解文档和官方 Skill 译文；
3. 实现 FunASR、OmniVoice 或其它 HTTP 服务前先读 `docs/` 中对应 API 文档；
4. 不把 Skill 写成数据库、业务状态或 MCP 实现；
5. 完整视频生产任务先读取 `project-basics` 与 `production-director`，由 `production-director` 选择一个主要视频工作流；
6. 人物口播、视觉解释片和 Vlog 分别由 `presenter-motion-director`、`visual-explainer-director`、`vlog-director` 对完整生产闭环负责；
7. 主工作流到达具体阶段后再按需读取专项 Skill，不能把一组平级 Skill 的“已加载”当成工作流已经成立；
8. 局部编辑任务可以直接读取 `project-basics`、对应专项 Skill 与必要的 `quality-verification`，不要求重跑整条主工作流；
9. `.codex/config.toml` 中显式登记 Skill 只表示可发现，不表示每个任务都应同时加载；
10. 完成开发后运行静态路由测试、专项交接测试、模块测试、契约测试和相关端到端样例。

#### Skills 的物理目录与逻辑层级

所有 Skill 仍平铺在 `.agents/skills/<skill-name>/`，便于 Codex 发现和专项复用。逻辑上则必须区分：

```text
项目运行合同
→ 跨类型总导演
→ 一个主要视频工作流
→ 按阶段调用的专项 Skill
→ 跨工作流质量门禁
```

物理平铺不代表职责平级。项目不开发独立 Skill Orchestrator 服务；所谓“主 Skill 调用专项 Skill”，是同一个 Codex Agent 在工作流到达相应阶段时读取另一份 playbook，并继续通过现有 MCP/Web 修改同一个 Project Revision。

### 2.3 用户、Codex、Web 与 MCP 的交互方式

用户只需要在 Codex 中描述目标、反馈问题和确认交付，不依赖用户亲自在 Web 中拖动时间线或调整参数。

Codex 有两种操作路径：

```text
结构化操作：
Codex → Skills → video-editor-mcp → Editing Application

界面操作与视觉验证：
Codex → Browser Operator → Web 剪辑工作台 → Editing Application
```

两条路径调用同一套 Application Commands，并共享同一个 Revision。使用边界：

- MCP 负责批量、语义化、可重复的读写；
- Browser Operator 负责空间性强的界面操作、预览检查、Inspector 调整和端到端 UI 验证；
- Codex 不得用两条路径同时提交同一个写操作；
- 用户只负责查看结果、提出反馈和批准交付；视频编辑操作由 Codex 完成；
- Web 第一阶段不设置 AI 聊天面板，所有自然语言交互留在 Codex。

#### 新会话、Worker 重启与项目交接

Project、Revision、Job 和已保存的创作结果是项目事实；Codex 对话、浏览器登录状态、已加载 Skill 上下文和某个 Worker 的内存状态不是项目事实。

Codex 新会话、MCP 重启或 Worker 恢复后，必须按以下顺序重新建立上下文：

```text
list_projects / target_project
→ 读取目标 Project、当前 Timeline/Sequence 和 Revision
→ 读取未完成 Job、失败任务和最近 ImpactReport
→ 读取当前素材就绪与外部 Bridge 健康状态
→ 读取 Story、Scene、Timeline、QualityReport
→ 再继续修改
```

不得因为 Web 仍然打开、旧 `run_id` 曾存在或上一次聊天声称“已经完成”，就跳过项目读回并直接写入。第一版不需要为此建立新的持久化 `ExecutionContext` 对象；项目定位、Revision 校验、Job 对账和服务健康查询已经足够。

### 2.4 产品范围与开发优先级

同一个工程支持：

- 数字人口播 / 真人口播；
- 视觉解释片；
- Vlog；
- 三者混合。

第一条完整闭环优先完成：

> 数字人口播为主线，结合人物前后景 Remotion 动效、稳定字幕、全屏解释场景、B-roll/Cutaway、声音克隆与 TTS。

这条链路能够同时验证 Story、Scene、Timeline、Voice、ActorPerformance、EffectCue、Remotion、Skills、MCP、Web、Revision 和质量复核。

## 3. 产品定位

产品定位为：

> 一个以 Story 和 Scene 为中心、由 Codex 驱动、使用 Remotion 统一预览和视频导出的 AI 视频创作平台。

核心产品能力：

1. 将脚本、旁白或实拍素材理解成可编辑的叙事结构；
2. 将叙事结构转化为可编辑场景，而不是直接压平成 MP4；
3. 为数字人物联合规划表演、动效和全屏插入画面；
4. 为知识解释内容自动规划视觉场景、证据、图表和 UI；
5. 为 Vlog 从镜头和事件中组织故事；
6. 由 Codex 持续修改同一份工程，用户通过自然语言反馈和审片结果控制迭代；
7. 所有导出均来自明确的 Revision，导出后项目仍可继续编辑。

---

## 4. 设计原则

### 4.1 项目状态是共同事实，聊天不是

Codex 的聊天记录不属于项目事实。

项目事实必须存储在：

- StoryDocument；
- SceneDocument；
- TimelineDocument；
- AssetLibrary；
- Revision；
- QualityReport；
- ExportArtifact。

Codex 会话丢失后，只要重新读取项目，就能继续工作。

### 4.2 Agent 决策与确定性执行分离

```text
Codex / Director Skills：
决定为什么剪、保留什么、哪里加什么效果

Application / Compiler：
计算帧、校验范围、更新依赖、生成 Revision

Remotion Runtime：
按确定状态渲染画面
```

Codex 不长期手算帧，不直接写底层渲染结构。

### 4.3 Scene 是主要创作单位，Timeline 是最终播放结构

参考视觉解释视频和人物动效视频都不是“若干独立贴纸”的简单集合。

一个 Scene 可能持续 5～20 秒，内部包含：

- 人物；
- 背景；
- 前景动效；
- 后景动效；
- 字幕；
- 镜头运动；
- 音效；
- 多个 Motion Cue。

Scene 保存创作意图和内部结构；Timeline 保存最终播放关系。两者同属于一个 EditDocument Revision，不能成为互相独立的真相。

### 4.4 同一个项目支持多种 Scene，不用三套编辑器

数字人口播、解释片和 Vlog 共享：

- Project；
- Asset；
- Story；
- Scene；
- Timeline；
- Caption；
- Audio；
- Revision；
- MCP；
- Remotion Runtime。

它们只在以下方面不同：

- 主时间轴由什么驱动；
- Director Skill；
- Scene Type；
- 素材选择方式；
- 质量判断规则。

### 4.5 效果必须由语义触发，不按固定间隔添加

禁止默认使用：

- 每三秒一个动画；
- 每句话一个弹窗；
- 每个关键词放大；
- 所有字幕逐字跳动。

效果的触发依据优先级：

```text
语义事件
>
语音重音
>
短句边界
>
镜头节奏
>
背景音乐节拍
```

### 4.6 一次只允许一个主注意力事件

同一时刻不应同时出现：

- 高动态字幕；
- 大数字计数；
- 产品飞入；
- 镜头快速推近；
- 背景评论滚动。

每个短语或 Beat 应明确一个主动作，其他元素保持稳定。

### 4.7 所有修改都产生 Revision

Web 和 MCP 的写入都必须：

- 基于明确 `base_revision`；
- 先校验；
- 原子提交；
- 生成新 Revision；
- 返回 ImpactReport；
- 标记 Dirty Range；
- 支持回退和比较。

### 4.8 可编辑、可预览、可导出和已验收必须分开

一条视频至少存在四种不同的完成证据：

1. **项目结构读回**：Story、Scene、Timeline、Caption、EffectCue 或 Audio 已被当前 Revision 保存；
2. **局部真实合成**：目标范围能够在 Web / Remotion 中预览，并检查了必要的进入、稳定、退出或连续播放；
3. **最终文件生成**：指定 Revision 已实际产生可读取的 MP4 / 音频文件，并通过时长、音轨、解码和黑帧等技术校验；
4. **完整声画验收**：整条或完整交付范围已经播放和试听，语义、切口、字幕、动效、声音、节奏和观众承诺成立。

上一层通过不能自动推出下一层通过。`MCP success`、`Job succeeded` 或 `Timeline 合法` 只证明对应技术状态，不能直接宣布成片完成。

### 4.9 素材就绪是按用途划分的能力状态

素材“存在”不代表所有下游能力都可用。系统至少要能区分：

```text
已登记为 Asset
→ 本地字节和基础元数据可读取
→ 可分析 / 可转写 / 可检视
→ 可被 Timeline 引用
→ 当前渲染链能够读取全部依赖
→ 来源和权利允许当前交付
```

这些状态可以由 Asset 元数据、Job 结果和导出前预检共同计算，不要求建立第二套 Asset 数据库，也不应被压缩成一个永久 `ready=true`。

### 4.10 主线稳定后再编译包装

Script、A-roll、Dialogue、Story 和 Scene 骨架决定观众实际听到和看到的主线。字幕、MG、B-roll、Cutaway、BGM、SFX 和显性镜头处理依赖主线的最终时间和语义。

正确顺序是：

```text
先建立可播放主线
→ 读回当前 Revision 和真实时长
→ 再按各自锚点加入字幕、MG、B-roll、音乐和音效
→ 主线变化后分别重投影、失效或复核
```

这只是 Editing Application 内部的责任顺序，不要求拆成两个微服务，也不要求所有包装对象具有相同的自动跟随行为。

### 4.11 Project 是共同事实，会话和工具上下文不是

Web、MCP 和 Codex 可以围绕同一个 Project 工作，但不应假设它们共享：

- 同一段聊天；
- 同一份推理过程；
- 同一个浏览器登录或 Worker 内存；
- 同一组已经加载的 Skill 上下文；
- 旧会话中尚未写入项目的临时计划。

需要跨会话继续使用的创作决定，应进入 CreativeBrief、Story、NarrativeBeat、Visual Treatment、AttentionCurve、Scene、Revision 或 QualityReport；不能只留在聊天中。

### 4.12 完整视频任务必须有一个主工作流负责人

一条整片任务不能由多个平级小 Skill 临时相加后无人收口。`production-director` 只负责识别主要视频类型、观众承诺和质量 Gate；随后必须选定一个主要工作流 Skill：

- 人物口播、访谈、课程、数字人主持：`presenter-motion-director`；
- 旁白驱动的机制、数据、证据和 UI 解释：`visual-explainer-director`；
- 实拍事件、动作、反应和现场声驱动：`vlog-director`。

主要工作流对从输入到交付的完整顺序负责，并在需要时调用 `semantic-continuity`、`captions`、`audio-finishing`、`cutaway-planning`、`remotion-production` 等专项 Skill。专项 Skill 对自己的专业判断、写入结果和验证证据负责，但完成后必须把结果交回主要工作流。

局部任务不受此约束。例如只调整字幕位置、只审查声音或只重做一个 Remotion Scene，可以直接进入对应专项 Skill；只有当任务范围扩展为整片重构时，才回到主工作流。

---

## 5. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│                            用户                              │
│          自然语言目标、参考视频、反馈、批准与导出要求         │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Codex Production Operator                  │
│                                                              │
│ project-basics：项目运行合同                                 │
│ production-director：选择一个主要视频工作流                   │
│ 主工作流：串联主线、包装、质量和交付                          │
│ 专项 Skills：在具体阶段提供深入判断与执行                     │
└──────────────────┬──────────────────────────┬────────────────┘
                   │                          │
                   │ 结构化读写               │ UI 操作与视觉验证
                   ▼                          ▼
┌────────────────────────────┐   ┌─────────────────────────────┐
│      video-editor-mcp      │   │      Browser Operator       │
│ Query / Command / Job      │   │ 打开 Web、选择对象、操作表单 │
└──────────────┬─────────────┘   └──────────────┬──────────────┘
               │                                ▼
               │                  ┌─────────────────────────────┐
               │                  │       Web 剪辑工作台         │
               │                  │ ChatCut 式功能分区与布局     │
               │                  │ 素材 / Script / 预览 / 时间线│
               │                  │ Inspector / QC / Revision   │
               │                  └──────────────┬──────────────┘
               └──────────────────────┬──────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    Editing Application                       │
│                    唯一业务状态中心                            │
│                                                              │
│ Project / Brief / ProductionProfile                          │
│ Asset / TranscriptChunk / SemanticUnit / SpeechSegment      │
│ VoiceReference / SpeechAsset / SpeechTiming / ActorPerformance│
│ Story / NarrativeBeat / NarrativeMap                         │
│ Scene / MotionCue / EffectCue / Cutaway                      │
│ Timeline / Track / Item / Caption / Audio                     │
│ StylePack / AttentionCurve / Revision / ImpactReport          │
└───────┬───────────────────┬──────────────────┬───────────────┘
        │                   │                  │
        ▼                   ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│ External        │ │ Director &      │ │ Persistence & Jobs   │
│ Integrations    │ │ Compiler Layer  │ │                      │
│                 │ │                 │ │ SQLite / Snapshots   │
│ ComfyUI Bridge  │ │ SemanticBuilder │ │ Job Queue / Outbox   │
│ ├─ FunASR       │ │ StoryCompiler   │ │ Asset / Cache        │
│ └─ OmniVoice    │ │ SceneCompiler   │ │ Preview / Export     │
│ Stock / Commons │ │ Asset Planner   │ │ Provenance / Credits │
│ Web Evidence    │ │ Timing / Impact │ │                      │
│ Avatar / Vision │ │                 │ │                      │
└────────┬────────┘ └────────┬────────┘ └──────────────────────┘
         └───────────────────┼──────────────────────────────────
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Remotion Scene Runtime                    │
│ Web 实时预览 / 场景动画 / 动态字幕 / 人物分层 / 局部预览       │
│ 视频、图片、文档、UI、MG 合成 / MP4 导出                      │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Quality System                         │
│ 技术校验 / 语义完整 / 画面相关 / 动效时机 / 遮挡 / 节奏       │
│ Presenter / Explainer / Vlog 专项质量规则                     │
└──────────────────────────────────────────────────────────────┘
```

外部素材能力不是 Codex 临时打开网页后把链接塞进 Timeline，而是正式的 `Asset Acquisition System`：

```text
Visual Treatment Plan
→ AssetRequest
→ Query Planner
→ Provider Adapters
→ AssetCandidate
→ Candidate Ranker / Codex 语义复核
→ Acquire / Evidence Capture / Generate
→ 本地 Asset + Provenance
→ Scene / Timeline
```

所有搜索、预览、下载、网页证据截取和 MiniMax 生成任务都由 Editing Application 持久化 Job。Scene、Timeline 和 Remotion 永远只引用已经本地化并登记来源的 Asset，不引用临时 CDN 或搜索结果 URL。

FunASR 和 OmniVoice 不加载到本项目进程内，也不各自建立一套 Provider SDK。服务端通过一个通用 `ComfyUIBridgeClient` 直接调用 `docs/asr接入.md` 描述的 HTTP API；领域层只接收归一化的 TranscriptText、SpeechAsset 和 JobResult。

### 5.1 Codex Production Operator 的实现位置

第一阶段的 Production Operator 由以下部分共同组成：

```text
Codex
+
根目录 AGENTS.md
+
.agents/skills
+
video-editor-mcp
+
Browser Operator
```

Skill 编排发生在同一个 Codex Agent 内部：

```text
project-basics
→ production-director
→ 选择一个主要工作流
   ├─ presenter-motion-director
   ├─ visual-explainer-director
   └─ vlog-director
→ 主工作流按阶段读取专项 Skills
→ quality-verification
```

`remotion-production` 是跨视频类型的完整 Motion Graphics 子工作流：既可以由主要工作流调用，也可以在用户只要求创建或修改某个 Scene/Effect 时独立进入。

以上关系不是新的 Agent 服务、后台状态机或固定代码流水线。聊天可以结束，但项目状态、任务状态和创作结果必须完整保存在 Editing Application 中；Skill 只提供当前任务的工作方法和判断边界。

### 5.2 Web、MCP 与 Browser Operator 的边界

```text
MCP 调用 ─────────────┐
                      ├→ 同一个 Command / Query Handler → Project Aggregate
Web UI 操作 ──────────┘
```

- MCP 只做项目查询、确定性命令和异步任务跟踪；
- Web 只做产品展示、编辑交互和预览；
- Browser Operator 只通过 Web 可见交互完成 UI 操作，不直接改数据库；
- 所有写操作都必须返回新 Revision 和 ImpactReport；
- Web 与 MCP 不得各自维护 Timeline、Scene 或 Job 状态。

### 5.3 MCP 与 Web 操作的选择原则

优先使用 MCP 的情况：

- 批量创建 Scene、EffectCue 或 Caption；
- 语义删改和 Script 重编译；
- 查询 Story、Asset、Revision 和 QualityReport；
- 提交 ComfyUI Bridge 工作流、Avatar、Preview 和 Export Job；
- 需要幂等、原子和可重复执行的操作。

优先使用 Web 的情况：

- 检查真实布局、遮挡和空间关系；
- 在 Inspector 中调整视觉参数；
- 操作时间线、拖动 Cue、比较 Revision；
- 检查 UI 工作流和用户可见结果；
- MCP 暂未覆盖但 Web 已具备的编辑能力。

### 5.4 从素材到交付的四阶段产品闭环视图

下面的四阶段只用于回答“视频当前做到哪一步、缺哪一种证据”，不替代前面的技术组件架构，也不对应四个新服务、四套数据库或四个独立 Agent：

```text
素材事实与证据
→ 创作判断与主线
→ 项目编译与包装
→ 最终文件与声画验收
```

它们与原技术组件的对应关系如下：

| 产品阶段 | 主要问题 | 仍由哪些既有模块负责 |
|---|---|---|
| 素材事实与证据 | 素材实际有什么、在哪段、当前能用于什么 | AssetLibrary、Transcript、Media Intelligence、Asset Acquisition、Provenance、Jobs |
| 创作判断与主线 | 观众听到什么、看见什么、为什么这样组织 | Codex、专业 Skills、CreativeBrief、Story、NarrativeBeat、Visual Treatment |
| 项目编译与包装 | 这些选择怎样成为 Scene、Timeline、Caption、EffectCue、BGM 和 SFX | Editing Application、Compiler、Revision、ImpactReport、Remotion |
| 最终文件与声画验收 | 当前 Revision 能否渲染、文件是否正确、整片是否成立 | Render Preflight、Preview、QualityReport、ExportJob、ExportArtifact、审片记录 |

这张辅助视图的价值是防止把“素材已上传”“Timeline 已有对象”或“导出任务成功”扩大为完整交付；实际代码仍按前面的模块化单体架构实现。

## 6. 核心领域模型

### 6.1 Project

Project 是完整视频工程，不是一次任务。

它拥有：

- CreativeBrief；
- ProductionProfile；
- StylePack；
- AssetLibrary；
- StoryDocument；
- SceneDocument；
- TimelineDocument；
- Revision 历史；
- Preview 和 Export 产物。

一个 Project 共享源素材、参考资料、Creative Library 和外部来源记录，但可以包含多个平行的成片版本，例如长版、60 秒短版、竖版和高光版。它们属于不同 `Timeline / Sequence`，不是同一 Timeline 的 Revision 历史：

```text
Timeline / Sequence
= 一个明确的成片目标和播放结构

Revision
= 该 Timeline / Sequence 内的连续修改历史
```

第一阶段可以只创建一个默认 Timeline / Sequence；但领域边界和 Web 路由不得把“创建短版”实现成覆盖当前长版，也不得把平行版本混入同一条 Revision 历史。

### 6.2 CreativeBrief

用于约束创作目标：

- 平台和画幅；
- 视频类型；
- 受众；
- 时长；
- 语气；
- 是否允许高密度动效；
- 字幕模式；
- 品牌和视觉风格；
- 用户要的是初剪还是高完成度成片。

它不是一次提示词，而是持久化项目对象。

### 6.3 ProductionProfile

项目默认生产模式：

```text
presenter_motion
visual_explainer
vlog
hybrid
```

Profile 只决定默认导演流程和默认工作区，不把整个项目锁死。每个 Scene 可使用不同 Scene Type。

### 6.4 Asset

Asset 是源素材或生成素材，不等于 Timeline 中的一次使用。

类型可以包括：

- 视频；
- 音频；
- 图片；
- 文档截图；
- 产品透明图；
- 数字人视频；
- 人物蒙版；
- 三维预渲染素材；
- Remotion 动效资产；
- BGM、SFX；
- Derived Asset。

同一个 Asset 可以被多个 Scene、多个 Timeline Revision 重复使用。

#### 6.4.1 AssetRequest

`AssetRequest` 表达某个 NarrativeBeat 或 Scene 缺少什么视觉内容。它不是单一关键词，至少应描述：

- 编辑目的：解释、证据、情绪、空间建立、过渡、遮盖跳切或节奏变化；
- 主体、动作、环境和关系；
- 媒体类型：视频、图片、文档、网页、UI、历史资料或生成画面；
- 镜头与构图：景别、运动、人物方向、留白、安全区、画幅和持续时间；
- 情绪、年代、地域和视觉风格；
- 排除条件：水印、错误 Logo、文字过多、错误人物、错误年代或商业摆拍感；
- 来源和许可策略；
- 找不到合适素材时允许的降级路径。

#### 6.4.2 SearchIntent

`SearchIntent` 是从 AssetRequest 编译出的 Provider 查询计划。一个 Request 可以生成多组中英文查询，不直接把完整旁白原句作为唯一搜索词。SearchIntent 必须保留：

- Provider；
- 查询词和语言；
- 画幅、媒体类型、最小时长和最小分辨率；
- 查询批次和去重键；
- 查询结果缓存时间；
- 对应 AssetRequest 和 Revision。

#### 6.4.3 AssetCandidate

远程搜索结果只能先成为 `AssetCandidate`。候选记录预览、媒体参数、来源页面、作者、许可信息、匹配理由、技术检查和当前决策状态。Candidate 未被 Acquire 前不能进入 Scene 或 Timeline。

#### 6.4.4 AssetProvenance 与 AttributionManifest

所有外部、证据和生成素材必须建立 `AssetProvenance`，至少记录 Provider、原始资产 ID、来源页面、作者、许可名称、许可地址、署名文本、抓取时间、原始下载地址、内容哈希、生成参数和后续变换。

每次导出生成 `AttributionManifest`。若来源要求在产品界面、视频描述、片尾或其它位置署名，Export Gate 必须确认相应文本已生成；来源未知不能被当作“免费可用”。

#### 6.4.5 AssetReadiness

`AssetReadiness` 是对某个 Asset 在当前运行环境中的能力读回，不是替代 Asset 的第二份状态。至少区分：

- `registered`：已经成为 Project Asset；
- `bytes_available`：受管文件仍存在并可读取；
- `metadata_ready`：时长、画幅、编码等基础信息可用；
- `analysis_ready`：代理、波形、转写或指定分析结果可用；无声音频可处于 `no_audio` 成功终态；
- `timeline_ready`：可以被当前 Timeline Item 引用；
- `render_ready`：当前 Remotion / FFmpeg / Browser Worker 能读取该 Asset 及其依赖；
- `rights_ready`：来源、许可和署名满足当前导出用途。

`render_ready` 可能受当前 Worker、编解码器、字体、Mask、代理文件和路径影响，因此应在预览或正式导出前重新检查，不应作为永远不变的布尔字段。

#### 6.4.6 EvidenceSlice

Agent 不需要一次性把整条视频和全部网页塞入上下文。对会影响内容选择、证据引用或切点的范围，系统可输出轻量 `EvidenceSlice`：

- 对应 Asset 和 Source Range；
- 模态：转写、画面、声音、元数据或网页证据；
- 实际观察到的内容；
- 用户提供的业务说明；
- 仍然存在的未知或替代解释；
- 当前素材就绪、来源和权利限制；
- 回到源素材和当前 Revision 的复核入口。

`EvidenceSlice` 可以只是 Query 结果或被采用决策的持久化引用，不要求第一版建设完整视频向量库。只有真正被 Story、Scene、证据展示或质量问题使用的片段，才需要进入长期可追溯状态。

### 6.5 TranscriptText、TranscriptChunk、SemanticUnit、SpeechSegment 与 SpeechTiming

`docs/asr接入.md` 中的当前 FunASR HTTP 工作流只公开完整文本输出，不公开可依赖的 Segment、Token 或词级时间。因此，文字理解、语义切分和时间定位必须由不同对象承担：

- `TranscriptText`：一次 FunASR 调用返回的完整文字、原始响应和对应音频 Asset；
- `TranscriptChunk`：可选的项目侧粗粒度切片。系统先通过 VAD / 静音检测切出已知源时间范围，再分别调用 FunASR；它只表示“这段音频范围大致说了什么”，不是词级时间；
- `SemanticUnit`：根据 TranscriptText、标点、上下文和叙事结构构建的完整句、观点、因果、转折、列表项、问答和重录候选；
- `SpeechSegment`：面向 OmniVoice 合成和动效编排的可独立朗读语义段，必须语义完整，并可将重要效果触发点放在段首或段尾；
- `SpeechTiming`：最终语音在成片中的时序映射；第一版以段级时序为主；
- `CaptionProgram`：最终屏幕字幕，不等于原始转写，也不等于 SpeechSegment 本身。

禁止把 ASR 的任意文本分块直接当作剪辑单位，也禁止通过“按字数平均分配时长”伪造词级时间。

`SpeechTiming` 必须声明精度和来源：

```text
segment_exact
由每个 OmniVoice SpeechSegment 的真实输出时长、拼接顺序和实际间隔计算；段首和段尾准确，段内没有词级时间

chunk_coarse
由本项目 VAD / 静音切片的源时间范围与该片段的 FunASR 文本组成；适合素材定位，不适合逐词卡点

word_exact
未来可选能力；只能来自真实公开词级时间戳的工作流或未来可选强制对齐服务

unavailable
当前没有可用时间信息
```

第一版允许基于 `segment_exact` 完成：

- 短句或短语级字幕；
- Scene 与 Cutaway 的进入和退出；
- 段首、段尾、停顿点上的 Remotion 动效；
- 通过 Browser Operator 预览后做少量帧级微调。

第一版不以 `word_exact` 作为前置依赖。若某个效果必须精确命中句中单词，系统应优先调整 SpeechSegment 边界，让该短语成为独立可朗读段；仍无法满足时，标记为需要人工式预览微调或降级为句级效果。

### 6.6 StoryDocument

StoryDocument 表达“讲什么”和“为什么按这个顺序讲”。

核心对象：

- Section；
- NarrativeBeat；
- Hook；
- Problem；
- Explanation；
- Comparison；
- Evidence；
- Joke；
- CTA；
- Conclusion。

Story 不直接决定每一帧怎么播放。

#### 6.6.1 当前有效的编排意图如何保存

本项目不额外创建一份与 Story、Scene、Timeline 重复的“大而全导演计划”。需要跨会话恢复的有效创作决定分散到最接近其职责的现有对象：

- `CreativeBrief`：版本目标、受众、观众承诺、平台、时长、硬约束和交付标准；
- `StoryDocument / NarrativeBeat`：主线顺序、选择理由、必须保护的前提、事实和反应；
- `Visual Treatment / AttentionCurve`：哪些 Beat 保持人物、使用解释、证据、B-roll 或安静区；
- `Scene / EffectCue / Cutaway`：已经确认并进入项目的视觉与时间意图；
- `QualityReport / Marker`：仍需修复、接受或复核的问题。

可选的 `SkillExecutionReport` 只记录某次 Codex 读取了什么、做了哪些尝试、调用了哪些工具和如何验证。它是任务审计日志，不参与 Scene、Timeline、Remotion 或 Export 编译，删除它不能改变成片。

### 6.7 SceneDocument

SceneDocument 表达“这段内容怎样被看见”。

核心 Scene 类型：

- PresenterScene；
- ExplainerScene；
- VlogMontageScene；
- DocumentScene；
- UIShowcaseScene；
- CutawayScene；
- EndCardScene。

每个 Scene 记录：

- 对应哪些 Narrative Beat；
- 叙事目的；
- 所用资产；
- Motion Cue；
- Style Pack；
- 质量要求；
- 在 Timeline 的位置。

### 6.8 TimelineDocument

Timeline 表达最终播放结构：

- Sequence；
- Track；
- Item；
- Caption；
- Audio；
- Scene 区间；
- 成片时间。

Timeline 是可播放状态，但不应丢失 Scene 和语义归属。

核心约束：

1. 每个 Timeline Item 属于某个 Scene 或 Global Layer；
2. Scene 与内部 Item 在同一个 Revision 原子更新；
3. 所有时间使用整数帧或整数 Tick；
4. 源素材时间和成片时间分开保存；
5. 不使用浮点秒作为主要事实。

#### 6.8.1 三套时间坐标

同一内容至少可能具有三种不同地址：

```text
Source Coordinate
原始 Asset 中的时间、采样或转写范围

Program Coordinate
当前 Timeline 中的整数帧或 Tick

Editorial Event Coordinate
某个语义落点、动作结果、动画稳定点、音效真实 onset 或音乐乐句
```

Timeline Item 连接 Source Coordinate 与 Program Coordinate；EffectCue、Caption、SFX 和 BGM 还需要保存自己服务的 Editorial Event。物理 Item 起点不必等于观众真正听到或看到事件发生的时刻，例如音效文件开头可能有静音，动画进入后也需要到稳定帧才完成表达。

### 6.9 VoiceReference、SpeechSegmentAsset、SpeechAsset 与 SpeechTiming

当前 OmniVoice HTTP 工作流不是“注册远端音色 ID，再调用 TTS”的接口。每次任务都直接接收：

```text
参考音频 Asset
+
待合成文本
```

工作流内部会使用 FunASR 自动识别参考音频文字，再完成音色克隆和语音合成。本项目不创建不存在的远端 Voice ID，也不把音色克隆和 TTS 拆成两个外部 API。

#### `VoiceReference`

表示一份可重复用于 OmniVoice 请求的本地参考声音，至少关联：

- 参考音频 Asset；
- 来源、授权和使用说明；
- 时长、采样率、声道和质量检查；
- 推荐的有效片段范围；
- 是否满足 3～15 秒、单人、清晰、低噪声等要求；
- 当前是否可用于 OmniVoice。

`VoiceReference` 是本项目对象，不对应 OmniVoice 中的远端 Voice Profile。

#### `SpeechSegment`

SpeechSegment 由最终 Script 编译而来，承担三个目的：

1. 保证一次 TTS 输入是自然、完整、可独立朗读的短句或短段；
2. 为局部重新生成提供最小稳定单元；
3. 让关键 MotionCue 尽量绑定在段首、段尾或段间停顿，而不依赖虚假的词级时间。

分段不能机械按字数切割。应优先使用完整句、转折边界、列表项、笑点、CTA 和重要视觉事件边界。相邻段之间的停顿策略由 Speech Plan 明确保存。

#### `SpeechSegmentAsset`

表示一次 OmniVoice HTTP Run 的本地化结果，至少关联：

- SpeechSegment；
- VoiceReference；
- workflow ID、run ID 和提交时使用的 schemaVersion；
- 原始请求摘要与原始响应；
- 下载后的音频 Asset；
- ffprobe 得到的真实时长、采样率、声道、MIME 和文件校验；
- 可选的 FunASR 回听文本与文本一致性检查。

#### `SpeechAsset`

表示将一组 SpeechSegmentAsset 按 Script 顺序拼接后的最终旁白资产，至少包含：

- Script Revision；
- Segment 顺序；
- 每段实际时长；
- 段间静音、交叉淡化或停顿设置；
- 最终合成音频 Asset；
- `segment_exact` SpeechTiming；
- 质量检查结果。

当前文档确认 OmniVoice 输出采样率为 24000 Hz；实际文件名和 MIME 必须以 Run 输出为准。每个成功输出都要立即下载并注册本地 Asset，不能长期依赖 Bridge 进程内的临时下载映射。

第一版的时间策略是：

```text
SpeechSegment 1 → OmniVoice → 真实时长 d1
SpeechSegment 2 → OmniVoice → 真实时长 d2
...
按顺序拼接并加入明确停顿
→ 得到每段在最终 SpeechAsset 中的精确起止时间
→ 生成 segment_exact SpeechTiming
```

该策略能可靠支持段级字幕、段落 Cutaway 和语义动效，但不声称知道段内每个词的真实时间。词级时间以后作为可选增强能力接入，不阻塞第一版。

### 6.10 ActorPerformance

数字人适配器不能只返回 MP4。

ActorPerformance 应至少关联：

- 人物视频；
- 人物音频；
- 透明通道或人物蒙版；
- SpeechTiming；
- 支持的表情和手势；
- 实际头部、身体、手部位置；
- 可安全放置动效的区域；
- 对应脚本、SpeechAsset 和 Revision。

### 6.11 PresenterScene

PresenterScene 是人物持续口播与动效结合的核心单位。

内部逻辑层：

```text
Background
Rear FX       人物背后数字、评论、装饰
Actor         数字人或真人口播
Actor FX      推近、表情切换、人物局部效果
Front FX      产品、卡片、封面墙、箭头
Cutaway       全屏 UI、梗图、解释动画、B-roll
Caption       稳定字幕
SFX / BGM
Camera
```

PresenterScene 可以持续 5～20 秒，内部包含多个 Effect Cue。

### 6.12 MotionCue / EffectCue

EffectCue 不是任意贴纸，而是一次有明确编辑目的的视觉事件。

它应表达：

- 叙事目的；
- 语义锚点；
- Effect Type；
- 前景、后景、人物效果或全屏；
- 空间锚点；
- 进入、稳定、退出时机；
- 所需资产；
- 强度；
- 质量规则。

### 6.13 AttentionCurve

AttentionCurve 用于控制整条视频的视觉强弱：

```text
高密度 Hook
→ 中密度说明
→ 安静区
→ 第二个高潮
→ 安静区
→ 收尾展示
```

它用于防止所有能力同时堆叠。

### 6.14 StylePack

StylePack 不是一个动画模板，而是一套统一视觉语言：

- 背景；
- 容器；
- 字体；
- 色彩语义；
- 字幕模式；
- 图表样式；
- 入场、稳定和退场语言；
- 音效倾向；
- 画幅安全区。

同一 Scene Type 可以套用不同 StylePack。

### 6.15 Revision

每次有效修改产生新 Revision。

Revision 统一覆盖：

- Story；
- Scene；
- Timeline；
- Style；
- Caption；
- Audio；
- ActorPerformance 引用。

不允许 Story、Scene 和 Timeline 各自独立版本而互相失配。

---

## 7. 三种视频模式如何共存

| 模式 | 主时间轴驱动 | 主要编辑单位 | 主要效果来源 |
|---|---|---|---|
| 数字人口播 / 真人口播 | 最终语音和人物表演 | SemanticUnit、PresenterScene、EffectCue | 前后景动效、稳定字幕、Cutaway、少量解释场景 |
| 视觉解释片 | 旁白和叙事结构 | NarrativeBeat、ExplainerScene、MotionCue | Remotion 场景、文档、UI、图表、素材和三维预制资产 |
| Vlog | 实拍镜头和事件 | Event、Shot、VlogMontageScene | 镜头选择、顺序、音乐节奏、环境声、少量标题和 MG |

混合视频可以这样组成：

```text
PresenterScene
→ ExplainerScene
→ PresenterScene
→ VlogMontageScene
→ PresenterScene
→ EndCardScene
```

不要创建三套 Project、三套 Timeline 或三套 MCP。

---

## 8. 数字人口播 + Remotion 动效完整链路

这是第一版最重要的垂直闭环。

```text
Creative Brief
      ↓
Script / Semantic Units / Narrative Beats
      ↓
Presenter Production Director
      ├─ Actor Performance Plan
      ├─ Visual Treatment Plan
      ├─ Attention Curve
      └─ Speech Segment Plan
      ↓
将最终 Script 编译为语义完整的 SpeechSegments
重要动效尽量落在段首、段尾或段间停顿
      ↓
对每个变更的 SpeechSegment 直接调用 OmniVoice HTTP API
参考音频 + 当前段文本
      ↓
逐段下载输出 + ffprobe 读取真实时长
      ↓
SpeechSegmentAssets
      ↓
按顺序拼接、加入明确停顿或短交叉淡化
      ↓
SpeechAsset + segment_exact SpeechTiming
      ↓
可选：FunASR 回听转写，用于核对合成文字，不用于伪造词级时间
      ↓
Avatar API
      ↓
ActorPerformance
人物视频 + SpeechAsset + Mask + SegmentTiming + Pose
      ↓
Derived Asset Factory
产品图、封面墙、评论云、截图卡片、手机 UI
      ↓
PresenterScene + EffectCues + Cutaways
      ↓
Motion Timing Compiler
      ↓
Remotion Preview
      ↓
Quality Report
      ↓
局部修改 / 新 Revision
      ↓
Codex 通过 MCP 或 Web 工作台继续修正
      ↓
MP4 导出
```

第一版不设置独立词级对齐步骤作为必经链路。Motion Timing Compiler 必须根据时序精度选择表现方式：

- `segment_exact`：允许短语级字幕、段首/段尾动画、Cutaway、Scene 切换、SFX 和 CTA 卡点；
- `chunk_coarse`：只用于导入素材的粗粒度定位、句级字幕和低频场景变化；
- `word_exact`：未来存在真实时间戳能力后，才允许严格逐词高亮和句中关键词精确卡点；
- `unavailable`：阻止任何依赖语音同步的正式效果。

如果一个重要效果必须命中句中的某个词，优先通过 Speech Segment Plan 调整可朗读边界；不能自然分段时，先使用段内相对进度生成候选，再由 Codex 在 Web 预览中进行帧级修正，不能伪装为自动获得了词级时间。

### 8.1 人物表演和动效必须联合规划

错误链路：

```text
先生成整条数字人
→ 再随便找位置加效果
→ 手势、构图和效果经常不匹配
```

正确链路：

```text
先分析脚本语义
→ 同时规划人物动作和视觉事件
→ 再生成数字人
→ 读取实际姿态和空间位置
→ 微调效果位置
→ 合成
```

示例：

| 语义 | 人物建议 | 视觉效果 |
|---|---|---|
| “送出 70 台平板” | 双手打开 | 产品从双手之间展开，数字在“70 台”稳定 |
| “点击参与” | 指向下方 | 下方发光 CTA |
| “做了这么多节目” | 摊手或询问 | 作品封面墙进入 |
| “弹幕里都会有” | 看向侧面或停顿 | 评论文字在人物背后逐步出现 |
| “声音和脸对不上” | 尴尬表情 | 快速推近或切换搞笑反应片段 |

### 8.2 Presenter 空间锚点

第一版支持逻辑锚点：

```text
behind_actor
actor_hands
actor_torso
actor_head
safe_left
safe_right
lower_center
upper_background
fullscreen
```

数字人生成后，将逻辑锚点转换为实际坐标，并检查：

- 是否挡脸；
- 是否挡嘴；
- 是否挡字幕；
- 是否超出安全区；
- 是否与另一个主效果竞争。

第一版人物构图可先标准化：

- 人物居中或偏一侧；
- 头部和字幕区固定；
- 左右留安全区；
- 手部活动范围有限。

### 8.3 Presenter Effect Registry

第一版优先实现参考人物视频中最有价值的效果：

| Effect Type | 作用 |
|---|---|
| `MetricBackdrop` | 人物背后大数字增长、里程碑 |
| `ProductFan` | 产品从人物附近出现并扇形展开 |
| `GlowCTA` | 点击、参与、关注等行动指引 |
| `PortfolioWall` | 历史作品或内容封面墙 |
| `CommentCloud` | 评论、弹幕、反馈逐步填充背景 |
| `EvidenceCard` | 人物前景展示截图、节目或证据 |
| `CameraPunch` | 轻微或快速推近，强调包袱或结论 |
| `ComicReaction` | 短促搞笑反应，第一版可用预生成片段 |
| `DeviceShowcase` | 手机、网页或 App 全屏展示 |
| `ContentCarousel` | 未来作品、案例或产品逐项出现 |
| `FullScreenMeme` | 极短梗图或中断画面 |
| `EndCard` | 品牌、搜索页、CTA 结尾 |

第一版不做任意实时人脸网格变形。需要搞笑反应时，可使用：

- 预生成数字人反应片段；
- 独立视频效果 Worker 预处理；
- Remotion 在笑点处切换。

### 8.4 字幕策略

人物动效丰富时，字幕必须稳定：

- 下方固定区域；
- 短句替换；
- 仅极少量关键词强调；
- 不全程逐字弹跳；
- 不与主视觉争夺注意力。

人物画面长期无其它效果时，才允许提高字幕动态程度。

---

## 9. 视觉解释片完整链路

视觉解释片不是“口播剪完以后补几个 MG”。

```text
旁白 / Script
→ Narrative Map
→ Scene 分段
→ Visual Treatment Plan
→ 选择场景语法
→ 检索或生成视觉资产
→ Motion Cue 编译
→ Remotion Scene
→ 场景级预览
→ 视觉质量复核
```

### 9.1 Explainer Scene Registry

第一批通用场景：

| Scene Type | 适用内容 |
|---|---|
| `HeroReveal` | 开场数字、极端结果、核心冲击 |
| `ProgressiveClassification` | 分类、等级、区域、用户分群 |
| `ComparisonScene` | 价格、方案、前后、正确与错误 |
| `EvidenceDocument` | 法规、论文、投诉、报告、合同 |
| `UIWalkthrough` | App、网页、软件、手机流程 |
| `PeopleGrouping` | 用户画像、阵营、人群分层 |
| `LayerStack` | 产品组成、成本、技术栈、中间层 |
| `RouteAndFlow` | 航线、流程、因果、迁移 |
| `DataConclusion` | 比例、趋势、投诉和结论 |
| `HistoryTimeline` | 历史节点和政策演变 |
| `QuotePortrait` | 人物、机构、观点引用 |
| `RealityBroll` | 现实素材、生活经验和证据补充 |

第一版不要求所有场景都由代码从零生成。可使用：

- 预制 Remotion 模板；
- 用户素材；
- 真实证据；
- 预生成三维资产；
- 图片或视频生成结果。

Remotion 负责叠加、时序和合成。

### 9.2 解释、证据、现实素材要交替

Visual Director 必须判断每个 Beat 属于：

- 解释；
- 举证；
- 举例；
- 对比；
- 历史；
- 结论。

不能发现关键词后统一套卡片模板。

---

## 10. Vlog 完整链路

Vlog 的故事通常存在于素材里，而不是先有完整旁白。

```text
导入大量素材
→ 镜头切分
→ 人物、地点、动作、环境声分析
→ 镜头质量评分
→ 事件聚类
→ Story 结构
→ Shot Selects
→ VlogMontageScene
→ 音乐与环境声
→ 少量标题和 MG
→ 质量复核
```

Vlog Director 重点：

- 事件是否真实发生；
- 镜头是否重复；
- 动作和空间是否连续；
- 情绪是否递进；
- 是否保留环境声；
- 音乐是否压过真实体验；
- 是否因为追求节奏切得过碎；
- MG 是否喧宾夺主。

Vlog 的效果核心是镜头和声音，不是大量 Remotion 动效。

---

## 11. Remotion Runtime 设计

### 11.1 职责

Remotion Runtime 负责：

- Web Player；
- Scene 内部动画；
- 动态字幕；
- 视频、图片、文档、UI、MG 合成；
- 人物前后景分层；
- 局部范围预览；
- 场景级缓存；
- 基础 MP4 导出。

Remotion 不负责：

- 判断为什么要加效果；
- 判断某句话是否重要；
- 选择证据是否真实；
- 决定叙事顺序；
- 自动解决所有剪辑审美问题。

### 11.2 同一份 Composition Snapshot

浏览器预览和导出必须读取同一份不可变 Snapshot：

```text
Project Revision
→ Composition Snapshot
→ Web Player
→ Render Worker
```

避免“网页看到的”和“导出结果”不一致。

### 11.3 场景级缓存

缓存单位优先使用 Scene，而不是整条视频。

缓存键至少由以下内容共同决定：

- Scene Revision；
- Scene Props；
- Asset Version；
- StylePack Version；
- MotionCue Version；
- Runtime Version。

修改一个价格标签时，只让对应 Scene 失效。

### 11.4 局部范围预览

一次修改后，Impact Engine 计算：

- 修改前区间；
- 修改后区间；
- 前后安全余量；
- 依赖对象区间。

简单编辑直接在浏览器反映；复杂场景只渲染 Dirty Range。

### 11.5 自定义 Remotion 代码安全

第一版优先使用：

```text
注册组件
+
JSON Props
+
StylePack
```

不要允许 Codex 将任意 JSX 直接在服务器执行。

后续开放代码型 MG 时必须：

- 静态分析；
- 组件和 API 允许列表；
- 文件和网络访问隔离；
- 构建超时；
- 沙箱运行；
- 产物注册后再进入 Timeline。

---

## 12. Media Intelligence、ComfyUI Bridge HTTP 接入与 Derived Asset Factory

### 12.1 `ComfyUIBridgeClient`

FunASR 和 OmniVoice 都由本项目服务端直接调用 `docs/asr接入.md` 描述的 ComfyUI-AppApi Bridge HTTP API。第一版不在本项目中加载模型，也不为两个工作流各写一套独立 SDK；实现一个可靠的通用 Client，再在其上建立薄业务服务。

`ComfyUIBridgeClient` 负责：

```text
health()
listWorkflows()
getWorkflow(workflowId)
createRun(workflowId, schemaVersion, fieldValues, files)
getRun(runId)
downloadOutput(downloadUrl)
```

调用约束：

1. 每次正式创建任务前读取 `GET /workflows/{workflow_id}`；
2. 检查 `available`，为 false 时保存 `reason` 并终止；
3. 使用详情返回的最新 `schemaVersion`；
4. 普通字段使用详情返回的 field ID；
5. 媒体字段使用 `file_{itemSlot.id}`；
6. 有媒体时使用 `multipart/form-data`，并包含名为 `request` 的 JSON 文本字段；
7. 将 Bridge 的 `queued / running / succeeded / failed` 映射到本项目 Job；
8. HTTP 409 时重新获取工作流详情，并基于新 Schema 重建请求；
9. 只有输出下载、文件校验和本地 Asset 注册全部完成，项目 Job 才能标记 `succeeded`；
10. 8188 端口默认只供本机访问，不直接暴露公网；
11. Bridge 重启可能丢失旧 run_id，因此本项目必须持久化请求摘要、幂等键和已下载结果。

工作流 ID 可以进入配置；schemaVersion、field ID、itemSlot ID、output ID 不能长期硬编码。

### 12.2 FunASR HTTP 服务

当前工作流：

```text
workflow_id = dd564543-d02d-4247-9e97-089417db9e7a
输入：一个音频文件
请求：multipart/form-data
普通 fieldValues：空对象
输出：kind = text
```

`FunASRService` 负责：

- 必要时通过 FFmpeg 从视频提取标准化音频；
- 读取最新工作流详情并识别音频 itemSlot；
- 提交音频、轮询 Run；
- 从 `outputs` 中读取 `kind=text` 的文字；
- 保存原始文本、Bridge run ID、schemaVersion、原始响应和错误；
- 写入 TranscriptText；
- 触发 SemanticUnit Builder；
- 不伪造 Segment、Token、WordTiming 或说话人信息。

FunASR 当前内部固定使用 `language=auto` 和 `use_itn=true`。若以后需要语言、ITN、说话人或时间戳，必须先在工作流中公开真实输入或输出，并同步更新 `docs/asr接入.md` 和契约测试。

#### 可选的粗粒度时间模式

对于导入的真人口播或 Vlog 素材，项目可以先在本地执行 VAD / 静音切片，再将每个已知源时间范围分别提交 FunASR：

```text
源音频
→ VAD / Silence Split
→ [start, end] Audio Chunk
→ FunASR Text
→ TranscriptChunk(start, end, text, precision=chunk_coarse)
```

这只提供片段级定位，不代表 FunASR 返回了词级时间。切片过短会破坏语义，必须以自然停顿和最小时长约束控制。

### 12.3 OmniVoice HTTP 服务

当前工作流：

```text
workflow_id = ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce
输入：参考音频 + 待合成文本
请求：multipart/form-data
输出：kind = audio
```

`OmniVoiceSegmentService` 负责：

- 读取最新工作流详情；
- 动态识别待合成文本 field 和参考音频 itemSlot；
- 对每个需要生成或重新生成的 SpeechSegment，直接提交同一个 VoiceReference 音频和该段文本；
- 轮询 Run；
- 从 `outputs` 中选择 `kind=audio`；
- 立即下载音频；
- 使用 ffprobe 校验文件、真实时长、采样率和声道；
- 注册 SpeechSegmentAsset；
- 保存 workflow ID、run ID、schemaVersion、请求摘要、原始响应和下载信息。

OmniVoice 工作流内部会自动转写参考音频，不存在需要调用方手动提交的 `reference_text`。当前接口也不产生可复用的远端 Voice Profile，因此不要实现 `create_voice_profile → clone_voice → tts` 三段式外部链路。

推荐调用链：

```text
VoiceReference Asset
+
SpeechSegment Text
→ OmniVoice HTTP Run
→ SpeechSegmentAsset
→ ffprobe Duration
```

当 Script 只修改一个段落时，只重新生成受影响的 SpeechSegments，未变化的 SegmentAsset 继续复用。

### 12.4 Speech Assembly 与第一版时序策略

`SpeechAssemblyService` 负责：

- 按 Script 顺序组合 SpeechSegmentAsset；
- 应用每段明确的前置/后置停顿；
- 必要时使用极短交叉淡化消除拼接爆点，但不能吞掉音节；
- 生成最终 SpeechAsset；
- 基于每段实际时长和拼接偏移生成 `segment_exact` SpeechTiming；
- 输出段级波形和可读回的段落边界。

第一版的核心能力边界：

```text
可以准确知道：
每个 SpeechSegment 在最终旁白中的开始和结束

不能自动声称知道：
该 Segment 内每个词、字或音节的真实时间
```

因此：

- 稳定短句字幕按 SpeechSegment 或 Caption Card 展示；
- Remotion 效果优先锚定段首、段尾、停顿和 Scene 边界；
- 需要句中精确落词的效果，优先调整 SpeechSegment 设计；
- 不能自然分段时，由 Browser Operator 根据真实预览微调帧偏移；
- 未来确有需求时，再接入提供真实词级时间的工作流或强制对齐服务，作为可选增强，不阻塞第一版。

### 12.5 FunASR 回听质量检查

OmniVoice 每段生成后可选调用 FunASR 对结果回听，用于检查：

- 是否漏读；
- 是否出现明显错读；
- 数字、英文和专有名词是否异常；
- 输出音频是否为空或严重截断。

FunASR 回听结果只用于文本一致性质量判断，不用于生成伪造词级时间。比较时应使用归一化文本和可容忍的标点、数字格式差异。

### 12.6 Media Intelligence

Media Intelligence 负责生成可查询证据：

- ffprobe；
- 代理视频；
- 缩略图；
- 波形；
- VAD、静音和响度；
- 镜头切分；
- 人物、人脸和姿态；
- 可选场景、动作和视觉分析；
- FunASR 产生的 TranscriptText / TranscriptChunk；
- SpeechAssembly 产生的 segment_exact SpeechTiming。

Python Worker 只提交分析结果，不直接修改 Story、Scene 或 Timeline。所有结果由 Application 校验后写入项目。

### 12.7 Derived Asset Factory

Derived Asset Factory 负责把项目已有内容转换成可直接用于视觉表现的素材：

- 视频封面墙；
- 评论文字云；
- 产品组合图；
- 手机 Mockup；
- 内容卡片；
- 对比图；
- 图表；
- 截图高亮图；
- 品牌结束页。

例如 `PortfolioWall`：

```text
查询内容库
→ 选择代表性封面
→ 自动排列
→ 生成 Derived Asset
→ Remotion 只负责进入、滚动和退出
```

Derived Asset 必须保留素材来源和生成过程，证据类内容不得使用无来源的伪造资产。

### 12.8 Asset Acquisition System：外部素材检索、授权、本地化与生成

用户不需要预先提供所有空镜、B-roll、网页截图、历史资料、产品画面和说明镜头。Visual Treatment Plan 发现素材缺口后，由 Codex 通过统一 `video-editor-mcp` 创建 `AssetRequest`，再由 `Asset Acquisition System` 完成查询、候选筛选、来源检查、下载、本地化、分析和生成降级。

它是正式产品链路，不是开发时人工打开浏览器临时补素材。核心规则：

1. Codex 决定“需要什么画面”和“候选是否支持当前叙事”；
2. Application 负责 Provider 调用、缓存、许可策略、下载、校验和状态；
3. 远程结果先成为 AssetCandidate，不直接进入 Timeline；
4. Scene、Timeline 和 Remotion 只引用本地受管 Asset；
5. 证据、现实 B-roll、官方品牌素材和生成画面必须明确区分；
6. 来源未知、许可未知、下载失败或文件损坏不能静默降级为“可用”；
7. 测试环境不依赖实时搜索，生产环境才允许真实联网。

完整链路：

```text
NarrativeBeat / Scene 存在视觉缺口
→ Visual Treatment Planner 创建 AssetRequest
→ Query Planner 生成 SearchIntent
→ Provider Registry 执行查询
→ 技术预过滤与 Candidate Enrichment
→ Codex 查看缩略图、联系表或短预览并做语义复核
→ 选中候选 / 拒绝候选 / 进入降级
→ Acquire、Evidence Capture 或 Generate Job
→ 下载到项目目录并计算哈希
→ ffprobe、代理、缩略图、水印和安全检查
→ 注册 Asset + AssetProvenance
→ 绑定 Scene / Cutaway
→ 局部预览与 Quality Gate
```

#### 12.8.1 素材用途与来源决策

不同用途不能共享一条无差别的“联网搜索”逻辑。

| 素材用途 | 首选顺序 | 是否允许生成替代 | 关键约束 |
|---|---|---|---|
| 现实空镜、环境、人物动作、生活 B-roll | 项目素材 → Creative Library → 可授权 Stock Provider → MiniMax | 可以 | 镜头动作、情绪、构图、画幅、时长、无水印 |
| 法规、论文、新闻、投诉、报告、产品规则等证据 | 用户资料 → 官方网页/文件 → 开放许可原始资料 | 不允许用 AI 伪造 | 保存来源、标题、抓取时间、证据范围和页面快照 |
| 产品、品牌、人物和用户历史内容 | 用户项目库 → 官方素材 → 用户授权内容 | 原则上不替代 | 不使用来源不明的 Logo、人物、产品截图和账号页面 |
| 抽象概念、机制、流程、比较和层级 | Remotion Scene → Creative Library → MiniMax | 可以 | 优先可编辑视觉解释，不为了“真实感”搜索无关空镜 |
| 历史照片、地图和公共资料 | Wikimedia Commons 等开放资料 → 官方档案 | 仅在明确标注为说明画面时允许 | 每个文件单独核对许可、作者、署名和相同方式共享要求 |
| 过渡和遮盖跳切 | 项目已有 B-roll → Stock → 简单 Remotion 转场 | 可以 | 先解决镜头连续性，不机械匹配名词 |

对一个 AssetRequest，系统必须允许“保持人物画面”作为合法决定。找不到合适素材时，不得为了填满画面而插入只匹配关键词的弱相关 Stock。

#### 12.8.2 Provider Registry 与第一版实现范围

所有来源实现同一 Provider Contract，至少包含：

```text
search(searchIntent)
inspect(candidateId)
acquire(candidateId, targetProfile)
refreshRights(candidateId)
health()
```

第一版 Provider：

| Provider | 作用 | 第一版要求 |
|---|---|---|
| `ProjectAssetProvider` | 当前项目已有素材 | 必须 |
| `CreativeLibraryProvider` | 已认证模板、B-roll、音效和视觉资产 | 必须 |
| `PexelsProvider` | 竖屏/横屏现实视频和图片搜索 | 必须 |
| `PixabayProvider` | 视频和图片补充来源 | 必须 |
| `WebEvidenceProvider` | 官方网页、文档和数据页面的证据截取 | 必须 |
| `MiniMaxGeneratedProvider` | 搜索失败后的解释性或情绪型视频生成 | 必须 |
| `MockAssetProvider` | CI 和固定回归测试 | 必须 |
| `WikimediaCommonsProvider` | 历史、地图、公共资料 | 第二阶段 |

当前官方接口核对基线：

- Pexels 视频搜索使用 `/v1/videos/search`，可按 `portrait`、`landscape` 或 `square` 筛选；搜索界面必须保留明显的 Pexels 来源入口，并尽可能保留作者信息；
- Pixabay 视频搜索使用 `/api/videos/`；查询响应应缓存，正式使用的文件下载到本地，禁止永久热链，也不能做系统性批量抓取；
- Wikimedia Commons 不能按“整站统一许可”处理，必须读取每个文件描述页中的具体许可、作者、署名、许可链接和可能的相同方式共享要求；
- Provider 条款和接口会变化，正式发布前必须重新读取官方文档并更新 `docs/asset-sourcing/provider-notes/` 的核对日期。

通用网页搜索只能用于发现官方证据页、公共档案或 Provider 入口，不能把任意网页的视频地址当作可下载剪辑素材。YouTube、抖音、新闻站和社交平台内容默认只可作为参考或证据入口，除非项目拥有明确授权和正式导入策略。

#### 12.8.3 AssetRequest 与查询计划

AssetRequest 应围绕叙事任务编写，而不是围绕单个名词。例如：

```text
用途：
表现“下班路上终于停下来看看天空”的安静瞬间

素材类型：
现实 B-roll 视频

主体与动作：
下班后的年轻人独自行走，短暂停下，抬头看天空

情绪：
安静、松弛、轻微疲惫，不要励志广告感

构图：
9:16；人物位于下半部；上方保留天空；无明显品牌

镜头：
固定或缓慢移动；4～6 秒；不需要快速转场

排除：
水印、字幕、明显摆拍、多人聚会、旅游打卡、错误季节

许可策略：
允许自动导入的 Stock；来源和作者可记录

降级：
MiniMax 生成安静城市黄昏空镜；仍失败则保留人物口播并使用轻微 CameraPunch
```

Query Planner 根据 AssetRequest 生成 3～6 组搜索意图：

- 主题词：人物、动作、地点和对象；
- 情绪词：quiet、reflective、tired、warm 等；
- 镜头词：close-up、wide、slow motion、static、tracking；
- 构图词：vertical、copy space、person on right；
- 排除词：watermark、crowd、commercial 等；
- 中英文和 Provider 支持的 locale；
- 先宽后窄的查询批次。

禁止把整段中文旁白直接作为唯一查询，也禁止只搜索“快乐”“自由”“意义”这类抽象词后随机选择画面。

#### 12.8.4 候选获取与 Candidate Ranker

搜索阶段优先获取缩略图、低码率预览、短预览区间和技术元数据，不先批量下载所有原始文件。

候选处理分两层：

**硬性过滤：**

- 来源或许可策略是否允许；
- 媒体是否可访问；
- 分辨率、时长、画幅和编码是否满足要求；
- 是否带明显水印、不可接受 Logo、字幕或黑边；
- 是否为重复文件或近似重复镜头；
- 是否包含不适合当前项目的敏感、错误人物或错误年代内容。

**软性评分：**

- 语义是否真正支持当前 NarrativeBeat；
- 主体动作是否匹配，而不只是名词相同；
- 情绪和节奏是否匹配；
- 9:16 或目标画幅裁切后是否仍成立；
- 镜头运动和前后 Scene 是否容易衔接；
- 主体方向、视线和留白是否适合字幕或人物构图；
- 清晰度、稳定性和可裁切连续时长；
- 与整片 StylePack 的一致性；
- 与已经使用素材的多样性，避免连续重复同一类 Stock。

技术层先将候选收敛到少量结果，Codex 再通过联系表、缩略图和预览做语义复核。Candidate Ranker 不能替代创作判断，也不能仅凭向量相似度自动选中最终素材。

#### 12.8.5 来源、许可与导出策略

每个 Candidate 和 Asset 都有 `rightsStatus`：

```text
auto_allowed
allowed_with_attribution
requires_user_confirmation
reference_only
blocked
unknown
```

规则：

- `unknown`、`blocked` 和 `reference_only` 不能进入可导出的正式 Scene；
- `requires_user_confirmation` 必须生成明确问题，不能由 Agent 自行假定获得授权；
- `allowed_with_attribution` 必须生成 AttributionManifest，并在要求的位置提供署名；
- 即使来源声称“免费”，仍保存来源页面、作者和当时许可说明；
- 版权许可之外的商标、肖像、隐私、人格权和地域限制仍需独立考虑；
- 产品只能执行项目政策，不能向用户承诺法律结论。

Web 的素材候选和 Asset Inspector 必须展示：来源 Provider、作者、来源页面、rightsStatus、署名文本、是否为生成资产、抓取时间和本地文件状态。

#### 12.8.6 Acquire、本地化与媒体处理

选中 Candidate 后创建 `AssetAcquireJob`：

```text
读取最新候选元数据与权利状态
→ 下载到临时目录
→ 校验 HTTP 状态、MIME、文件头和文件大小
→ 防止 HTML 错误页伪装成视频
→ 计算内容哈希并做跨项目去重
→ ffprobe 检查时长、分辨率、帧率、音轨和可解码性
→ 生成代理、缩略图、波形和可选镜头切分
→ 移入项目受管目录
→ 创建 Asset 与 AssetProvenance
→ 更新 AssetRequest 覆盖状态
```

Timeline、Scene 和 Remotion 不得长期引用 Provider URL。远程链接失效不能破坏已经完成的 Revision。下载后发现文件损坏、时长不足或画面不符时，Candidate 标记为 rejected，并继续选择下一候选。

#### 12.8.7 WebEvidenceProvider

证据素材与普通 Stock 分开处理。WebEvidenceProvider 负责：

- 打开官方页面、论文、报告、产品规则或用户指定链接；
- 保存页面标题、来源、抓取时间和目标证据范围；
- 截取完整页面环境和局部证据画面；
- 对关键文字建立高亮区域，而不是修改原文；
- 必要时保存原始 PDF、HTML 摘要或截图；
- 记录页面变化或无法访问状态。

证据 Scene 必须让观众区分“原始页面/文件”和“本项目增加的高亮、箭头、放大和字幕”。MiniMax、Remotion 或图像模型不得生成看起来像真实法规、投诉、论文、新闻和产品规则的伪证据。

#### 12.8.8 MiniMax H3 生成降级

`docs/asr接入.md` 已记录文生视频、图生视频、首尾帧生视频和多参考视频 HTTP 工作流。`MiniMaxGeneratedProvider` 复用 `ComfyUIBridgeClient`：

```text
AssetRequest
→ Shot Brief / Prompt Plan
→ 读取工作流最新 Schema
→ 创建 Bridge Run
→ 轮询
→ 下载输出
→ ffprobe 和质量检查
→ 注册 generated Asset + 生成参数 + seed + workflowVersion
```

生成资产适用于：

- 抽象或情绪型空镜；
- 搜索不到的非事实性过渡；
- 与 StylePack 一致的说明画面；
- 用户明确允许的创意镜头。

生成资产不替代：

- 真实历史事件；
- 法规、论文、新闻和投诉；
- 真实产品页面和品牌事实；
- 用户声称亲自拍摄或亲历的素材。

对于抽象概念，应先评估 Remotion 原生解释场景是否比生成视频更清楚、更可编辑；不能默认把所有缺口都交给视频生成模型。

#### 12.8.9 缓存、限流与可重复性

Asset Acquisition 必须实现：

- SearchIntent 级缓存；
- Provider 级速率限制和指数退避；
- 同一 Project 的查询去重；
- 内容哈希去重；
- 候选元数据快照；
- 已导入 Asset 的永久本地化；
- Provider 健康状态和熔断；
- 网络恢复后的 Job 重试；
- 取消任务和部分结果保留。

Pixabay 查询缓存不得短于其当前官方要求的 24 小时；其它 Provider 使用各自配置，不能把限流数值散落硬编码在业务代码中。

运行模式：

```text
deterministic_test
只使用 MockProvider、冻结响应和固定本地素材

staging_live
允许真实查询；缓存响应；需要人工检查候选和许可

production
真实 Provider + 限流 + 缓存 + 权利 Gate + 本地化

offline
仅项目素材、Creative Library 和已有缓存；不静默访问网络
```

#### 12.8.10 失败、降级与恢复

常见失败及处理：

| 失败 | 处理 |
|---|---|
| Provider 无结果 | 变更查询、换 Provider、Remotion 或 MiniMax 降级 |
| Provider 限流 | 缓存、退避、切换 Provider，不高频重试 |
| 候选来源未知 | 阻止自动导入，换候选或请求确认 |
| 下载 URL 失效 | 刷新 Candidate 后重试；不能继续引用旧 URL |
| 下载文件损坏 | 删除临时文件，标记 Candidate，选择下一项 |
| 搜索结果相关但构图不合适 | 尝试可接受裁切；否则换候选 |
| MiniMax 生成失败 | 重试受限次数，再降级为 Remotion 或保持人物画面 |
| 证据页无法访问 | 保留失败原因，请求用户资料或使用其它原始来源 |
| 已使用素材许可状态变化 | 标记 Project Warning；不静默删除旧 Revision，阻止新的受影响导出 |

#### 12.8.11 Codex 联网能力边界

用户体验上是“Codex 自动联网找素材”，工程上必须经过可测试的 MCP 和 Provider：

```text
Codex 识别视觉缺口
→ manage_asset_requirements
→ search_media_candidates
→ inspect_media_candidate
→ acquire_media_asset / generate_media_asset
→ read_asset_provenance
→ replace_scene_asset
→ preview_scene
```

Codex 不得：

- 在聊天中拿到一个 URL 后直接写进 Scene；
- 绕过 rightsStatus；
- 批量下载大量候选再决定；
- 把搜索缩略图当作最终素材；
- 使用未知授权的社交平台视频作为空镜；
- 把生成画面描述成真实证据；
- 在 Candidate 尚未本地化时宣布该 Scene 已完成。

#### 12.8.12 当前读书口播的素材策略示例

第一版固定 Presenter E2E 可使用以下视觉决策验证整个系统：

| 语义内容 | 视觉形式 | 预期来源 |
|---|---|---|
| “如果不用急着成为谁……” | 问题文字与留白 | Remotion |
| “读到《快乐的死》” | 书籍或封面展示 | 用户/公开书籍信息 + Remotion Mockup |
| “金钱才有资格谈自由” | 两侧对比 | Remotion ComparisonScene |
| “陌生的城市和海” | 城市、旅途、海边空镜 | Pexels/Pixabay 候选 |
| “所谓的以后越来越远” | 文字、日历或道路后退 | Remotion |
| “停下来问问自己的心” | 安静人物或黄昏城市 | Stock，失败时 MiniMax |
| “去远方、看天空、吃饭、睡觉” | 真实生活 B-roll 组合 | Stock Candidate Set |
| “安静的下午读书散步” | 窗边阅读和慢步行 | Stock，失败时 MiniMax |
| 最终祝愿 | 回到人物 + 结束排版 | PresenterScene + Remotion |

该示例必须证明系统会在人物、Remotion、现实 B-roll 和生成素材之间做有理由的选择，而不是把每一句旁白都替换成无关空镜。

## 13. 时间、锚点与依赖传播

### 13.1 时间模型

内部统一使用：

- 整数帧或整数 Tick；
- 有理数帧率；
- Source Time 与 Program Time 分离。

SpeechTiming 由毫秒或音频采样时长输入，再由 Timing Compiler 转为成片帧。每个 Timing 数据都必须携带 `precision` 和 `source`，不能把段级边界展示成词级精度。

### 13.2 时间精度

```text
segment_exact
TTS 分段输出的真实时长与最终拼接偏移；段边界准确

chunk_coarse
导入音频经 VAD 切片后得到的源时间范围；只适合片段定位

word_exact
未来由真实时间戳工作流或强制对齐服务提供

unavailable
没有可用时序
```

### 13.3 六类语义和时间锚点

```text
source_time
绑定源素材时间

timeline_absolute
绑定成片绝对帧，例如片头 Logo

item_relative
绑定某个 Item 内部位置

semantic_span
绑定某个 SpeechSegment、NarrativeBeat、观点、数字、笑点或 CTA

media_event
绑定可观察事件，例如动作完成、动画稳定、音效真实 onset、主要能量峰值或音乐乐句边界

sequence_global
绑定整条片或章节，例如 BGM
```

`media_event` 不替代物理 Timeline Item。它用于表达编辑意图与文件内部事件之间的偏移，例如“Ding 应在结论落点被听见”，而不是“音频文件必须从结论帧开始”。缺少真实 onset 或动作证据时，应先预览和测量，不能猜精确偏移。

Presenter 额外支持空间锚点：

```text
actor_head
actor_hands
actor_torso
safe_left
safe_right
behind_actor
fullscreen
```

### 13.4 Motion Timing Compiler

输入：

- Semantic Anchor；
- SpeechSegment Timing；
- 可选 WordTiming；
- 段间停顿；
- Attention Curve；
- 当前场景复杂度；
- 用户或 Browser Operator 已确认的帧偏移。

输出：

- 进入帧；
- 稳定帧；
- 退出帧；
- 主动作；
- 精度标记；
- 是否需要预览微调；
- 是否应保持静止。

第一版通用规则：

- Scene、Cutaway 和大部分 Presenter Effect 绑定 SpeechSegment 的开始、结束或段间停顿；
- 数字、产品、CTA 等效果可在段首开始，在段尾前稳定；
- 转折关系优先让第二个对象从下一个 SpeechSegment 开始；
- 笑点效果绑定 Joke Segment 结束后的短延迟；
- 文档先建立画面，再在同一 Segment 中以相对进度高亮；
- 没有 `word_exact` 时，不生成伪精确逐词动画；
- 段内相对进度只能作为候选，正式发布前必须经过真实预览检查；
- 若必须命中关键词，优先重构 SpeechSegment 边界，随后才考虑 Web 帧级微调。

### 13.5 ImpactReport

每次结构修改后返回：

- changed；
- moved；
- recomputed；
- stale；
- conflicts；
- dirty ranges；
- warnings。

典型传播：

| 对象 | 主线变化后的处理 |
|---|---|
| Caption 绑定 SpeechSegment | 按新 SegmentTiming 重新排布；若只具备段级时序，不伪造逐词精度 |
| EffectCue 绑定仍存在的语义 | 自动重定位到新的段边界或保留已确认偏移 |
| EffectCue 对应语句被删除 | 标记 stale，不自动换绑到相邻句 |
| SpeechSegment 文本变化 | 只重生成对应 SegmentAsset，并重算后续偏移 |
| SFX 绑定语义或 media_event | 重算物理 Item 起点与 onsetOffset，并进入实际试听复核 |
| 人物手势锚点变化 | 重新检查空间位置和完整运动路径 |
| Cutaway / B-roll 绑定句子 | 可以重定位，但必须重新判断素材相关性、进入和返回是否仍成立 |
| BGM 绑定整条 Sequence / 章节 | 重算裁切、循环、淡出、Duck 和章节关系 |
| Clip-bound 视觉效果 | 跟随目标 Item，但重新检查构图与有效时长 |
| 绝对时间效果或锁定 Override | 保持原位，不静默覆盖，并产生复核警告 |

### 13.6 主线编译与包装编译的责任顺序

V6 原有的 `SemanticBuilder / StoryCompiler / SceneCompiler / Timing / Impact` 继续保留，不新增两个服务。Editing Application 内部必须把两类责任区分清楚：

```text
主线编译：
Script / A-roll / Dialogue / Story / Scene 骨架
→ 得到当前观众实际听到和看到的可播放主线

包装编译：
Caption / EffectCue / Cutaway / BGM / SFX / Camera Treatment
→ 基于已稳定主线和各自锚点写入
```

这一区分的目的不是让所有包装都重新生成，而是让主线变化后，每类对象根据自身依赖进入“自动重算、保持、失效或复核”之一。应用层可以用两个 Command Handler、两个业务目录或同一事务中的两个步骤实现，不要求新进程和新数据库。

## 14. Revision 与 EditTransaction

所有修改统一经过 EditTransaction：

```text
读取当前 Revision
→ 构造操作
→ preview_edit_transaction
→ 校验
→ 原子提交
→ 新 Revision
→ ImpactReport
→ Dirty Range
→ Preview / QC
```

### 14.1 强制规则

- 每个写操作携带 `base_revision`；
- MCP 操作与 Browser Operator 操作并发时，陈旧写入必须拒绝；
- 批量操作要么全部成功，要么全部失败；
- 不允许 MCP 直接绕过 Application 写数据库；
- 导出绑定不可变 Revision Snapshot；
- Export Artifact 不覆盖项目。

### 14.2 Web 直接操作与 Scene 的关系

Story、Scene 和 Timeline 同属于一个 Revision。

Codex 通过 Browser Operator 在 Timeline 或 Inspector 中直接修改 Scene 内部对象时：

1. 能映射到 Scene Props 或 MotionCue 的，统一更新 Scene 和 Timeline；
2. 不能映射为注册属性的复杂修改，必须显式创建 `direct_override`；
3. `direct_override` 仍保留 Scene 归属、修改来源和操作摘要；
4. 后续自动重编译不得静默覆盖被锁定或已批准的 Override；
5. Browser Operator 完成操作后必须读取新 Revision 并验证 Preview。

### 14.3 平行成片版本与 Revision

长版、短版、横版、竖版或高光版属于不同 Timeline / Sequence；同一版本内部的连续修改才属于 Revision。

第一版若只支持一个默认 Sequence，也必须保证：

- “另做一个短版”不会覆盖当前版本；
- 从当前版本创建平行版本时共享 Asset，但复制 Story、Scene 和 Timeline Snapshot；
- 后续修改只影响目标 Sequence 的 Revision；
- ExportArtifact 明确绑定 Project、Sequence / Timeline 和 Revision。

这项边界不要求立刻实现复杂分支合并，只要求不要把平行成片目标误当成 Undo/Redo 历史。

---

## 15. Web 剪辑工作台

Web 第一版直接采用 ChatCut 已观察到的工作台骨架：顶部项目与导出区、左侧素材/文字稿工作区、中央真实预览、底部多轨 Timeline。项目在此基础上增加右侧 Inspector、Scene Strip、Revision/QC 和自动化定位能力，以满足 Codex 精确操作和 Remotion 场景编辑。

开发前必须读取：

```text
docs/chatcut视频剪辑工具拆解/01-产品全景与核心结论.md
docs/chatcut视频剪辑工具拆解/08-实测记录浏览器验证与字段样例.md
docs/chatcut视频剪辑工具拆解/11-Codex、ChatCut MCP 与 Web 编辑器交互链路.md
docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/
```

第一版不在 Web 中放 AI Chat。所有自然语言任务由用户在 Codex 中提出；Codex 通过 MCP 或 Browser Operator 操作工作台。

### 15.1 工作台整体布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 顶部项目栏：返回｜项目名｜保存状态｜Timeline｜Undo/Redo｜Revision｜预览｜导出 │
├──────┬──────────────────────┬────────────────────────────┬──────────────────┤
│ 左侧 │ 左侧内容面板          │ 中央预览                    │ 右侧 Inspector   │
│ 工具 │                      │                            │                  │
│ 栏   │ Assets              │ Remotion Player            │ Basic            │
│      │ Transcript / Script │ 真实合成画面                │ Layout           │
│      │ Captions            │ Playhead / 安全区 / 选框     │ Timing           │
│      │ Audio               │ 前景/人物/后景调试           │ Animation        │
│      │ Graphics            │                            │ Style / Audio    │
│      │ Scenes              │                            │ Anchor / Quality │
│      │ Jobs / QC / Revision│                            │                  │
├──────┴──────────────────────┴────────────────────────────┴──────────────────┤
│ Scene Strip：Presenter / Explainer / Vlog / Cutaway / EndCard               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 多轨 Timeline：时间尺、Playhead、Marker、Track、Item、字幕、波形、Cue         │
└──────────────────────────────────────────────────────────────────────────────┘
```

建议默认尺寸：

- 顶部项目栏：48～56 px，高度固定；
- 左侧工具栏：48～56 px；
- 左侧内容面板：默认 300 px，可在 240～420 px 调整；
- 右侧 Inspector：默认 340 px，可在 280～460 px 调整；
- 底部 Timeline：默认占工作区高度约 36%，可在 24%～62% 调整；
- 中央预览占据剩余空间，并始终优先保证画面可见。

布局规则：

- 顶栏固定；
- 左侧内容面板、右侧 Inspector 和 Timeline 可折叠、可拖拽调整；
- Timeline 不做成独立页面；
- Storyboard/Scene 与 Timeline 是同一项目的两种视图；
- 所有面板共享当前 Project、Timeline、Revision、Selection 和 Playhead；
- 任何面板写入后都由 Application 生成新 Revision，再通过 WebSocket 推送其它面板刷新。

### 15.2 顶部项目栏

功能板块：

- 返回项目列表；
- 项目名称、自动保存和连接状态；
- 当前 Timeline / Variant 选择；
- Undo / Redo；
- 当前 Revision、未保存变更和冲突状态；
- 预览质量；
- 画幅、帧率和时长摘要；
- 导出入口、导出预设和 Job 状态。

Undo/Redo、Revision 和导出必须作用于 Editing Application 的真实状态，不能只在浏览器内维护临时历史。

### 15.3 左侧工具栏与内容面板

左侧工具栏保持固定图标入口，内容面板随入口切换。

#### `Assets` 素材库

素材区采用同一面板中的三个视图：

```text
Project Assets
项目内已导入、已生成和已派生的正式素材

Search Candidates
由 AssetRequest 产生的外部候选、联系表和短预览

Provenance
来源、作者、rightsStatus、署名和本地化状态
```

必须支持：

- 项目视频、音频、图片、文档、数字人、SpeechAsset、Acquired Asset、Evidence Asset、Generated Asset 和 Derived Asset；
- 上传、导入、项目内搜索、标签和类型筛选；
- 从当前 NarrativeBeat 或 Scene 创建 AssetRequest；
- 显示 Provider、查询意图、候选缩略图、预览、时长、分辨率、画幅和匹配理由；
- 显示来源页面、作者、rightsStatus、署名要求、是否生成、抓取时间和本地文件状态；
- 候选的接受、拒绝、重新搜索、下载、本地化和替换；
- 代理、波形、FunASR、OmniVoice、Avatar、搜索、下载、证据截取和生成素材的 queued/running/failed 状态；
- 失败原因、限流、许可阻塞和重试入口；
- 只允许正式本地 Asset 拖入 Scene 或 Timeline；
- 生成或下载完成的素材直接进入 Project Assets，不另建孤立的“生成结果页面”。

在 `Assets` 面板中还必须区分：

- 已登记、字节可用、可分析、可上 Timeline、当前渲染链可读和权利可交付；
- render-ready 失败时显示具体依赖、Worker 和失败原因，不只显示一个笼统的 `failed`。

#### `Transcript / Script` 文字稿

同一面板中分层展示：

```text
TranscriptText / TranscriptChunk
SemanticUnit
Final Script
SpeechSegment
```

必须支持：

- 原始转写与最终 Script 对照；
- 删除、恢复、重排完整语义单元；
- 被删除文字以删除线或明确状态显示；
- 点击语句定位 Preview、Scene 和 Timeline；
- 从 Playhead 反向高亮当前语句；
- 显示 SpeechSegment、生成状态和 `segment_exact / chunk_coarse / unavailable`；
- Script 修改后清楚提示哪些语音、字幕、人物和 EffectCue 将失效。

#### `Captions` 字幕

- Caption Card 列表；
- 文案、换行、强调和样式；
- 段级时序来源和精度；
- 安全区、溢出和阅读速度问题；
- 点击 Card 定位到预览和 Timeline；
- 第一版以稳定短句字幕为主，不假装具备词级高亮。

#### `Audio` 音频

- Dialogue、BGM、SFX；
- VoiceReference；
- SpeechSegmentAsset 与最终 SpeechAsset；
- 每段 OmniVoice Job、实际时长和回听结果；
- 波形、增益、淡入淡出、Duck 和段间停顿；
- 选择一个 SpeechSegment 时同步定位其音频区间。

#### `Graphics / Creative` 图形与模板

- Remotion Scene Type；
- Presenter Effect Type；
- StylePack；
- 字体、模板、图标和 Derived Asset；
- 搜索、预览和适用场景说明；
- 拖入当前 Scene，或应用到当前 NarrativeBeat；
- 不允许直接在此执行未经审核的任意 JSX。

#### `Storyboard / Scenes`

- Scene 卡片、缩略图、Scene Type、时长和叙事目的；
- Presenter / Explainer / Vlog / Cutaway / EndCard 分类；
- MotionCue、Cutaway、缺失素材和 Quality 状态；
- Scene 顺序调整；
- 展开查看 Scene 内部的主要 Beat 和 Effect；
- 点击 Scene 同步定位 Preview、Scene Strip、Timeline 和 Inspector。

#### `Jobs / Quality / Revision`

- 阻塞问题、建议问题和已忽略问题；
- FunASR、OmniVoice、Speech Assembly、Avatar、外部搜索、候选下载、Evidence Capture、MiniMax、Derived Asset、Preview、Export Job；
- Provider 限流、来源未知、许可阻塞、候选 URL 过期、下载文件损坏、schemaVersion 冲突、run_id 丢失和输出缺失；
- AssetRequest 覆盖率、仍缺少素材的 Scene 和待署名项目；
- Revision 列表、修改摘要、比较、回退和 Marker。

`Jobs / Quality / Revision` 面板还应显示：

- 项目结构已写入、局部预览已验证、最终 Artifact 已生成和完整声画已审片之间的区别；
- 正式导出的目标 Timeline / Sequence、Revision、Render Preflight、文件技术检查和审片状态。

### 15.4 中央预览区

中央区域展示当前 Revision 的真实 Remotion Composition，不使用静态示意图代替。

必须包含：

- Fit / 25% / 50% / 100% 缩放；
- 播放、暂停、逐帧、范围循环；
- 当前时间码和帧号；
- 画幅、平台、标题和字幕安全区；
- 选中对象的边框、控制点和空间锚点；
- 人物 Mask、Rear FX、Actor、Front FX、Cutaway 分层调试开关；
- Preview Quality；
- 截取当前帧；
- 跳转到 EffectCue 的进入、稳定和退出帧；
- 与 Script、Scene 和 Timeline 双向同步。

预览中选中对象后，Timeline Item、EffectCue、Scene 卡片和右侧 Inspector 必须同步选中。

### 15.5 右侧 Inspector

右侧 Inspector 是在 ChatCut 主工作区骨架上的必要扩展，用于让 Codex 和开发者精确修改对象属性。它根据当前 Selection 切换，不为每种对象建立彼此独立的状态系统。

通用分组：

```text
Basic
Transform / Layout
Timing
Animation
Style
Audio
Caption
Anchor / Dependency
Quality
```

对象属性示例：

- Asset Item：源范围、裁切、位置、缩放、透明度、音量；
- 外部 Asset：Provider、来源页面、作者、rightsStatus、署名、内容哈希、导入时间和替换入口；
- AssetCandidate：预览、匹配理由、技术参数、许可状态、接受/拒绝/下载；
- Presenter Effect：Effect Type、Rear/Front/Actor 层、空间锚点、强度、进入/稳定/退出；
- Scene：叙事目的、Scene Type、StylePack、时长和资产绑定；
- Caption：文案、Card、样式、强调和安全区；
- Audio：角色、增益、淡入淡出、Duck、段间停顿；
- Cutaway：替换范围、人物声音是否保留、进入和退出方式。

每次提交必须携带 `base_revision`。成功后显示新 Revision；冲突时保留用户可见错误，不静默覆盖。

### 15.6 Scene Strip 与多轨 Timeline

#### Scene Strip

位于轨道上方，显示：

- PresenterScene；
- ExplainerScene；
- VlogMontageScene；
- CutawayScene；
- EndCardScene。

支持 Scene 选择、排序、缩放、折叠、状态标记和进入 Scene 内部时间线。

#### 默认轨道

```text
Cutaway / Fullscreen
Front FX
Actor FX
Actor / A-roll
Rear FX
Background
Captions
Dialogue
SFX
BGM
```

视觉解释片可用 Main Visual 轨道替代 Actor；Vlog 可显示 Main Video、B-roll、Ambient、Music 分组，但仍使用同一个 Timeline 内核。

时间线必须支持：

- 时间尺、Playhead、Marker；
- 缩放、吸附、帧级移动；
- Trim、Move、Split、Disable；
- Track 锁定、隐藏、静音；
- 视频缩略图和音频波形；
- Scene 边界、SpeechSegment 边界和 MotionCue 锚点；
- Dirty Range、stale、conflict 和 Job pending 提示；
- Selection 与 Preview、Script、Scene、Inspector 同步。

### 15.7 面板联动合同

所有主要操作必须形成可预测的联动：

| 操作入口 | 必须联动的结果 |
|---|---|
| 选择素材 | 素材详情进入 Inspector；若已在 Timeline 使用，高亮对应 Item |
| 点击文字稿语句 | Playhead 跳到对应 SpeechSegment / TranscriptChunk；高亮 Scene 与字幕 |
| 删除 Script 语句 | 显示删除线；预览、语音重生成范围、字幕和 stale EffectCue 更新 |
| 选择 Timeline Item | Preview 显示选框；Inspector 显示对象属性；Scene 卡片高亮 |
| 点击预览对象 | 反向选择 Timeline Item、Scene 和 EffectCue |
| 移动 Playhead | Script、Caption、Scene 和 EffectCue 状态随帧更新 |
| OmniVoice Job 完成 | Audio 面板和素材库出现 SegmentAsset；Speech Assembly 状态刷新 |
| Revision 切换 | 所有面板一次性切换到同一 Snapshot，不混用旧 Selection |

联动状态由服务端 Revision 和 WebSocket Event 驱动，不靠每个面板自行猜测。

### 15.8 Codex Browser Operator 合同

为了让 Codex 稳定模拟用户操作 Web，工作台必须提供：

- Project、Revision、Scene、Item、EffectCue、Marker、SemanticUnit、SpeechSegment 和 Job 的稳定 ID；
- URL 可定位 Project、Timeline、Scene、对象和帧；
- 关键按钮、标签、列表项和 Inspector 表单的稳定 `data-testid` 与可访问名称；
- Timeline 即使使用 Canvas，也要通过 DOM 或辅助语义层暴露对象、轨道、起止帧和选中状态；
- UI 写操作后显示新 Revision；
- queued、running、failed、conflict、stale 状态可被读取；
- 支持 `get_editor_url`、`focus_editor_object`、跳转帧、播放范围和截取合成帧；
- Browser Operator 操作后必须验证对象状态、Revision、Inspector 值和真实画面。

Web 和 MCP 使用同一对象 ID、同一 Command Handler 和同一 Revision，禁止形成 Web 私有时间线。

## 16. Skills 体系

### 16.1 Skills 的职责

```text
Codex Agent：理解用户目标、读取项目事实、选择工作流并做创作判断
Skill：提供完整工作方法、专业判断、工具边界、异常恢复和验证要求
MCP：提供确定性的项目查询、写入与异步任务入口
Editing Application：维护对象关系、业务规则、Revision 与 ImpactReport
Remotion / Worker：根据确定状态预览、合成、导出和技术校验
```

Skill 不保存项目状态，不替代 MCP，不直接实现数据库或渲染器。Skill 的“调用”也不是后台函数调用：同一个 Codex Agent 在任务进行到某一专业阶段时读取对应 Skill，再通过现有 MCP 或 Web 操作同一份 Project Revision。

当前 Skill 体系的主要问题不是数量多，而是平铺目录容易被误解为职责平级。完整视频生产必须有一份主工作流从头到尾负责，专项 Skill 则在需要时提供可复用的专业深度。

### 16.2 逻辑职责层级

Skill 物理上继续平铺，逻辑上分为五类。

#### 第一类：平台与确定性操作合同

```text
project-basics
web-editor-operator
asset-import
transcription
voice-production
export
known-errors
```

这类 Skill 负责项目定位、对象模型、工具调用、Revision、安全边界、异步任务、错误恢复和交付操作。它们可以以步骤、工具合同、状态表和检查表为主要表达方式。

`project-basics` 独立承担 ChatCut `chatcut-plugin-basics` 对应的完整平台合同，不再由 `production-director` 补一部分基础知识。

#### 第二类：跨视频类型总导演

```text
production-director
```

它只负责：

- 明确观众承诺、平台、时长、硬约束和交付目标；
- 判断主时间轴由语音语义、解释结构还是实拍事件驱动；
- 选择一个主要视频工作流；
- 在混合视频中确定哪个工作流为主、哪个只在部分 Scene 中参与；
- 管理主线、包装、质量和交付的先后关系；
- 判断何时应继续、回退、补证据或停止；
- 不在 Timeline、Preview 或单个 Job 成功时提前宣布成片完成。

它不重复讲 Project 对象、MCP 认证、字幕排版、B-roll 选择或 Remotion 代码细节。

#### 第三类：完整视频工作流

```text
presenter-motion-director
visual-explainer-director
vlog-director
```

这三份 Skill 分别对一类视频的完整生产链负责。

`presenter-motion-director` 虽然保留现有名称，但职责不再只限于“人物周围加动效”。它是人物口播、访谈、课程、教程、数字人主持和 Presenter 混合视频的完整工作流，承担 ChatCut `talking-head-guide` 对应角色。

`visual-explainer-director` 负责从旁白、问题、机制和证据到 Scene Grammar、视觉资产、Remotion、字幕、声音和整片验收的完整链路。

`vlog-director` 负责从镜头证据、事件、动作、反应和现场声到 Shot Selects、连续性、Montage、声音和整片验收的完整链路。

每个主工作流必须能够独立让 Codex 理解“这类视频从输入到交付怎样完成”；进入具体专业阶段时，再读取专项 Skill 获取更深入的判断和操作方法。

#### 第四类：跨类型完整子工作流与专业工种

```text
remotion-production
semantic-continuity
avatar-performance
visual-treatment-planning
scene-planning
effect-timing
depth-composition
visual-asset-sourcing
cutaway-planning
evidence-visualization
captions
audio-finishing
```

`remotion-production` 是一份完整 Motion Graphics 子工作流，对视觉任务、Style、Design Map、Settled Frame、Registry、Props、AssetBinding、局部时间、Timeline 放置、Player/Render 一致性和真实帧验证负责。

其余 Skill 是可复用专业工种。它们可以被多个主工作流调用，也可以处理用户明确提出的局部任务。

不再单独保留 `broll-selection`。B-roll 的“搜到素材”由 `visual-asset-sourcing` 负责；“是否使用、选择哪段、全屏还是 PiP、持续多久、声音怎样延续、何时返回主画面”由 `cutaway-planning` 负责，避免再次拆出无人统领的小 Skill。

#### 第五类：跨工作流质量门禁

```text
quality-verification
```

它读取项目结构、真实 Preview、最终 Artifact 和对应视频类型的验收规则，输出质量问题、修复优先级和是否允许进入交付。`web-editor-operator` 负责取得 Web、合成帧和连续播放证据；`quality-verification` 负责解释证据，而不是只确认页面能够打开。

### 16.3 物理目录与逻辑关系

推荐物理目录仍然平铺：

```text
.agents/skills/
├─ project-basics/
├─ web-editor-operator/
├─ production-director/
├─ asset-import/
├─ visual-asset-sourcing/
├─ transcription/
├─ voice-production/
├─ semantic-continuity/
├─ presenter-motion-director/
├─ avatar-performance/
├─ visual-treatment-planning/
├─ scene-planning/
├─ effect-timing/
├─ depth-composition/
├─ cutaway-planning/
├─ visual-explainer-director/
├─ evidence-visualization/
├─ vlog-director/
├─ captions/
├─ audio-finishing/
├─ remotion-production/
├─ quality-verification/
├─ export/
└─ known-errors/
```

平铺目录保证专项 Skill 可以被独立发现和复用；真正的主从关系由 `AGENTS.md`、Skill `description`、主工作流正文和路由测试共同约束。

人物口播的逻辑调用树：

```text
project-basics
└─ production-director
   └─ presenter-motion-director
      ├─ asset-import / transcription
      ├─ semantic-continuity
      ├─ voice-production
      ├─ avatar-performance
      ├─ visual-treatment-planning
      ├─ visual-asset-sourcing
      ├─ remotion-production
      │  ├─ scene-planning
      │  ├─ effect-timing
      │  └─ depth-composition
      ├─ cutaway-planning
      ├─ captions
      ├─ audio-finishing
      └─ quality-verification
         └─ web-editor-operator
```

视觉解释片的逻辑调用树：

```text
project-basics
└─ production-director
   └─ visual-explainer-director
      ├─ semantic-continuity
      ├─ visual-treatment-planning
      ├─ visual-asset-sourcing
      ├─ evidence-visualization
      ├─ remotion-production
      │  ├─ scene-planning
      │  ├─ effect-timing
      │  └─ depth-composition
      ├─ captions
      ├─ audio-finishing
      └─ quality-verification
```

Vlog 的逻辑调用树：

```text
project-basics
└─ production-director
   └─ vlog-director
      ├─ asset-import
      ├─ visual-asset-sourcing（只在确有补镜需要时）
      ├─ cutaway-planning
      ├─ semantic-continuity（存在对话或旁白时）
      ├─ captions（需要字幕时）
      ├─ audio-finishing
      ├─ remotion-production（只做必要包装）
      └─ quality-verification
```

### 16.4 路由规则

#### 完整视频生产

当用户要求“把这些素材剪成一条完整视频”“做一条 60 秒口播”“从这些 Vlog 素材做成片”时：

```text
project-basics
→ production-director
→ 只选择一个主要工作流
→ 主要工作流按当前阶段调用专项 Skill
→ 主要工作流重新收拢结果
→ quality-verification
→ export
```

不能把“同时加载了多个专项 Skill”当成完整工作流已经成立。

#### 局部编辑

当用户只要求：

- 调整字幕；
- 修复一处声音；
- 更换一个 B-roll；
- 重做一个 Remotion Scene；
- 检查某一段是否遮挡；

可以直接进入：

```text
project-basics
→ 对应专项 Skill
→ 必要的 quality-verification
```

局部任务不要求重新执行整条视频生产链，也不应因为主工作流很长而降低修改效率。

#### 混合视频

一个 Project 可以混合 PresenterScene、ExplainerScene 和 VlogMontageScene，但仍应选择一个主要工作流：

- 人物贯穿、解释场景只是局部插入：以 `presenter-motion-director` 为主；
- 旁白和认知模型贯穿、人物只承担开场或过渡：以 `visual-explainer-director` 为主；
- 实拍事件贯穿、人物或图形只承担补充：以 `vlog-director` 为主。

第二种工作流只在对应 Scene 范围内参与，避免三个完整工作流同时争夺主线。

#### 只审查或证据不足

Codex 可以只审查而不修改，也可以在证据不足时停止并请求补充素材、播放范围或用户约束。这是自然任务判断，不是固定的 `plan / review / execute / revise` 模式，不进入数据库，也不要求四套代码路径。

### 16.5 主工作流的共同责任

每个完整视频工作流必须详细说明：

1. 适用范围和不适用范围；
2. 缺少源素材、声音、Mask、证据或工具时怎样处理；
3. 这一类视频常见的任务分支；
4. 平台、画幅、时长、受众、语气和风格怎样改变剪辑；
5. 主线、包装和交付的依赖顺序；
6. 何时调用哪个专项 Skill；
7. 专项 Skill 应读取什么、返回什么；
8. 上游变化会使哪些下游结果失效；
9. 哪些节点需要真实预览、连续播放或完整试听；
10. 出错后回到哪个阶段，而不是从头全部重做；
11. 什么证据足以通过 Gate A、Gate B 和 Gate C；
12. 最终如何回到主工作流收口，而不是停在某个局部效果。

主工作流不需要复制专项 Skill 的全部知识，但必须解释完整生产链和交接关系。即使 Codex 尚未打开专项 Skill，只读主工作流，也应知道整条视频接下来要经过哪些阶段、每个阶段为什么存在、结果应交给谁。

### 16.6 专项 Skill 的交接合同

每个专项 Skill 除了专业知识，还必须明确四项交接信息：

```text
输入事实
→ 需要读取的当前 Revision、对象和证据

输出结果
→ 实际修改了什么对象，或形成了什么可执行决定

失效传播
→ 哪些下游对象需要重算、标记 stale 或重新审查

验证证据
→ 应读回哪些结构、看哪些画面、听哪些声音
```

第一版主要交接关系如下：

| 专项 Skill | 主要输入 | 必须输出 | 可能使哪些下游失效 | 验证 |
|---|---|---|---|---|
| `asset-import` | 文件、Project、来源与用途 | 受管 Asset、媒体分析 Job、Provenance、Readiness | 使用旧文件路径的计划 | 文件、元数据、状态和重复检查 |
| `transcription` | 已就绪音频 Asset | TranscriptText、候选句或 TranscriptChunk | 旧语义判断 | 原文、失败原因和必要回听 |
| `semantic-continuity` | Transcript、候选句、当前 Script | SemanticUnit、Script、删留/重排理由、停顿策略 | SpeechAsset、Caption、EffectCue、Cutaway | 只听声音和语义复核 |
| `voice-production` | 最终 SpeechSegment、VoiceReference | SegmentAsset、SpeechAsset、真实段级时序 | ActorPerformance、Caption、EffectTiming | 逐段试听、拼接和版本检查 |
| `avatar-performance` | SpeechAsset、人物素材或 Provider 能力 | ActorPerformance、Mask、版本和降级状态 | 人物空间效果、Preview | 口型、边缘、动作和音频所有权 |
| `visual-treatment-planning` | StoryBeat、人物/素材证据、Style | 每个 Beat 的视觉处理、安静区和 AttentionCurve | Scene、EffectCue、Cutaway | 方案取舍与整片密度检查 |
| `visual-asset-sourcing` | AssetRequest、画幅、构图和权利要求 | 本地 Asset、候选取舍、Provenance | Scene 素材绑定 | 来源、文件、构图、相关性和许可 |
| `scene-planning` | StoryBeat、Treatment、可用素材 | Scene 边界、内部状态与职责 | EffectCue、Caption、Cutaway | Scene 进入、稳定、退出和连续播放 |
| `effect-timing` | SpeechTiming、Scene、编辑事件 | EffectCue 时序与稳定点 | Preview、SFX、字幕注意力 | 进入/稳定/退出与语义落点 |
| `depth-composition` | 人物/主体、Mask、字幕和画幅 | 空间布局、安全区和层级约束 | EffectCue / Scene Layout | 完整运动路径和遮挡 |
| `cutaway-planning` | NarrativeBeat、人物画面、候选素材 | Cutaway 类型、素材、范围、声音延续和返回策略 | Timeline、Audio、Preview | 进入、停留、返回和语义相关性 |
| `captions` | 最终可播放语音与 Timing | Caption Card、布局、强调和精度声明 | Preview、Quality | 阅读速度、语义分卡、遮挡和同步 |
| `audio-finishing` | 稳定 Dialogue、Timeline 和情绪结构 | BGM、SFX、Duck、淡入淡出和试听结论 | Export、Quality | 只听声音与完整声画 |
| `remotion-production` | Treatment、Scene、StylePack、Asset | 可执行 Scene/EffectCue、Props、AssetBinding 和预览证据 | 对应 Preview / Quality | Player、Render Worker 和关键帧一致 |
| `evidence-visualization` | 主张、来源和 EvidenceSlice | 可追溯证据 Scene、引用和限制说明 | Story/Scene 信任关系 | 原文、条件、否定、数据和阅读时间 |
| `quality-verification` | 当前 Revision、Preview、Artifact 和模式规则 | Findings、必须修复项、通过/阻塞结论 | Export Gate | 四级验证证据 |

`loadedSkills` 只能证明文件被读取，不能证明交接已经完成。真实验收必须检查上表对应的输出、失效传播和验证证据。

### 16.7 核心 Skill 详细职责

#### `project-basics`

`project-basics` 是所有项目任务的运行基础，应达到完整平台操作手册的程度。它必须详细说明：

- 如何发现并连接当前 `video-editor-mcp`；
- 如何定位 Project、Timeline / Sequence 和 Revision；
- Project、Asset、Transcript、SemanticUnit、Story、Scene、TimelineItem、Caption、EffectCue、ActorPerformance、Job 和 ExportArtifact 的区别；
- Web 与 MCP 怎样读写同一份 Editing Application 状态；
- 写入为什么必须携带 `base_revision`；
- Revision 冲突、超时和结果未知时怎样先读回再决定是否重试；
- Job 成功、项目结构成功、Preview 成功和交付成功的区别；
- 修改后应读回 Project、ImpactReport、Job、Preview 或 Artifact 中的哪些事实；
- 哪些错误需要进入 `known-errors`，哪些属于创作判断而不是技术失败。

它不负责判断视频类型或选择剪辑风格。

#### `production-director`

触发：创建整条视频、跨多个专业阶段的自动生产、整片重构或混合视频制作。

它先读取 CreativeBrief、当前 Revision、素材状态、Story、QualityReport 和用户硬约束，写清观众承诺、主线驱动方式和交付目标，然后只选择一个主要工作流。

主要职责：

- 选择 `presenter-motion-director`、`visual-explainer-director` 或 `vlog-director`；
- 判断混合 Scene 的边界；
- 管理主线、包装和交付 Gate；
- 防止下游效果掩盖上游结构问题；
- 当质量问题来自某个专业阶段时，把任务退回对应主工作流或专项 Skill；
- 主工作流完成后检查是否具备最终审片和导出证据。

退出条件：主要工作流已完成本次任务范围，必要专项结果已回到项目，质量阻塞已处理，未实现能力和用户待决事项明确。

#### `presenter-motion-director`

触发：真人或数字人物持续承担主叙事，包括口播、访谈、播客、课程、教程、产品主持、个人经历、促销内容，以及 Presenter 与 Explainer/B-roll 的混合视频。

它直接承担 ChatCut `talking-head-guide` 对应的完整角色，而不是只负责添加人物周围效果。

必须详细覆盖：

- Cleanup、Highlight、Restructure、Hook / Short Version、Target Script 等语音主线任务；
- 真人原声、现有数字人视频、OmniVoice Dialogue 和纯视觉人物的不同声音所有权；
- A-roll / Script 为什么先于字幕、MG、B-roll、音乐和音效；
- 重录、完整思想、连接词、问题/回答、停顿和呼吸的判断；
- StoryBeat、PresenterScene、ActorPerformance 和 AttentionCurve 怎样协同；
- 人物何时是信息来源，何时是态度和真实性证据；
- 哲学读书、个人坦白、教程、促销和产品发布为何需要不同视觉密度；
- Rear、Front、Actor、Fullscreen 和保持人物之间怎样选择；
- 哪些位置应明确设计为安静区；
- 何时调用 `visual-asset-sourcing` 与 `cutaway-planning`；
- 字幕和声音何时开始，主线变化后怎样重新编译；
- 每个主要阶段的 Preview、听感检查和回退路径；
- 最终怎样进入 `quality-verification` 与交付。

完整人物口播任务的推荐顺序：

```text
项目与素材
→ 确定语音内容任务
→ A-roll / Script 主线
→ 主声音与人物版本
→ StoryBeat / PresenterScene
→ AttentionCurve 与 Visual Treatment
→ Remotion / B-roll / Cutaway
→ Captions
→ Audio Finishing
→ 局部预览与整片审片
→ Export
```

禁止：把所有专项 Skill 并列加载后让 Codex 自己猜顺序；每句话固定加效果；用 B-roll 或音乐掩盖语义和切口问题；做完一个局部效果后宣布整片完成。

#### `visual-explainer-director`

触发：旁白、文稿或讲解需要用分类、机制、对比、流程、数据、证据、UI 或现实素材建立认知模型。

它必须完整说明：

- 如何从旁白建立 Narrative Map 和 Scene 边界；
- 什么信息应继续留在同一大 Scene 内渐进揭示；
- 什么情况下使用 Comparison、Classification、RouteAndFlow、EvidenceDocument、UIWalkthrough 或 DataConclusion；
- 解释、真实证据和现实素材怎样交替；
- `visual-treatment-planning`、`evidence-visualization`、`visual-asset-sourcing` 与 `remotion-production` 的调用点；
- 字幕、旁白、音乐和主视觉怎样分工；
- 怎样避免把旁白逐句改成 PPT 卡片；
- Scene 变化后怎样保持认知对象和关系连续；
- 如何完成场景级与整片质量验证。

当前执行能力不完整时，它仍可生成清楚的 Narrative Map、Scene 计划和能力缺口，但不能声称 Timeline 和成片已经生成。

#### `vlog-director`

触发：实拍素材中的事件、动作、反应、地点、人物关系和现场声驱动故事。

它必须完整说明：

- 如何先建立素材证据、事件地图和 Shot Selects；
- 镜头应承担建立空间、推进动作、呈现细节、表现反应、转换或情绪中的什么功能；
- 如何保护动作相位、方向、视线、时间、情绪和环境声；
- 目标—尝试—变化—反应—结果怎样形成叙事；
- 何时保持长镜头，何时使用 Montage；
- 漂亮空镜为何不能替代事件；
- `cutaway-planning`、`audio-finishing`、`captions` 和必要 Remotion 包装怎样按需进入；
- 多机位和同步证据不足时怎样停止；
- 怎样进行整片事件、节奏和听觉连续性审查。

当前镜头分析和时间线写入能力不完整时，只能输出可执行计划和缺口，不得报告自动 Vlog 已完成。

#### `remotion-production`

触发：创建、修改或审查 Remotion Scene / Effect，或完整视频工作流需要 Motion Graphics 子流程。

它必须像 ChatCut `create-motion-graphics` 一样覆盖完整生产链：

- 编码或选择组件前需要的输入：观众任务、准确内容、目标画幅、放置范围、Style、人物/字幕关系和阅读时间；
- 何时使用现有 Registry，何时应开发并注册新组件；
- 批量生产前的视觉方向与代表性样例 Gate；
- Design Map 与 Settled Frame；
- 文字以外的视觉机制；
- StylePack、Props、AssetBinding、SpatialAnchor 和 Motion 的职责；
- Cue 内局部时间与 Remotion `Sequence`；
- 横竖屏、Natural Asset Box 和 Timeline Canvas；
- Component、Player 和 Render Worker 使用同一 Snapshot；
- 批量场景的一致性与非模板化；
- 新组件的代码安全、审查、注册和测试；
- Timeline 放置、修改已有 Cue、局部预览和失败恢复；
- 进入、中间、稳定、退出与连续播放验证。

视频生产任务默认只使用已注册组件。开发新组件属于代码开发任务，必须完成审查、Registry 登记和测试后才能被生产 Skill 调用。

#### `quality-verification`

触发：关键 Revision、专项 Skill 交接、Draft/Delivery 导出前，以及用户要求评价成片时。

它负责：

- 项目结构与依赖；
- 只听声音；
- 静音看画面；
- 完整声画；
- 首次观众视角；
- Presenter、Explainer、Vlog 专项 Rubric；
- 问题严重级别和根因；
- 将修复任务返回正确主工作流或专项 Skill；
- 区分局部 Preview、最终 Artifact 和完整审片证据；
- 决定是否允许进入正式交付。

它不能因为所有组件渲染成功、`loadedSkills` 完整或单张关键帧正确，就宣布视频质量通过。

### 16.8 其它专项与操作 Skill 的职责边界

#### `web-editor-operator`

负责通过稳定对象 ID、URL、`data-testid`、Inspector、Timeline 和 Preview 获取或修改 Web 可见状态。它提供证据，不替代视觉和剪辑判断。

#### `asset-import`

负责导入、去重、受管路径、媒体分析、AssetRole、Provenance 与 Readiness；不替 Agent 判断素材是否值得进入成片。

#### `visual-asset-sourcing`

负责将明确 AssetRequest 转换为项目素材、Creative Library、受控 Provider、网页证据或 MiniMax 候选，完成预览、筛选、本地化、来源和许可记录；不负责最终 Cutaway 时长与返回策略。

#### `transcription`

负责通过当前 FunASR Bridge 合同获得 TranscriptText，并在需要时生成具有真实源时间的 TranscriptChunk；不把标点候选或估算时间伪装成最终 SemanticUnit 或 `word_exact`。

#### `voice-production`

负责将最终 SpeechSegment 逐段提交 OmniVoice、下载并校验 SegmentAsset、使用真实时长组装 SpeechAsset，并保持 Script Revision 可追溯；不替代语义和表演判断。

#### `semantic-continuity`

负责完整思想、重录、口癖、连接组织、问答、因果、指代、停顿和自然听感；输出必须能被主工作流用于重新编译 Script 与下游对象。

#### `avatar-performance`

负责人物 Provider 能力、现有/生成人物、口型、表情、目光、动作、Mask、声音所有权和局部重生成；阶段 2 由 `presenter-motion-director` 统领开发和验收。

#### `visual-treatment-planning`

负责每个 NarrativeBeat 是保持人物、轻处理、Remotion 解释、证据、B-roll、Cutaway 还是安静区，并形成整片 AttentionCurve。

#### `scene-planning`

负责 Scene 的信息任务、边界、内部状态、进入、稳定和退出，不把完整认知过程拆成无关贴纸。

#### `effect-timing`

负责语义、动作、媒体事件和声音锚点，明确进入、稳定、阅读、退出和注意力冲突；时间精度不足时必须降级或预览微调。

#### `depth-composition`

负责人物、字幕、证据和 UI 的空间层级、安全区、Mask、运动路径和多画幅重排。

#### `cutaway-planning`

负责 B-roll、现实素材、UI、证据、梗图和全屏解释是否应该离开主画面，选择全屏/PiP、持续时间、声音延续、进入和返回策略。

#### `evidence-visualization`

负责主张与来源绑定、引用、页面建立—聚焦—高亮、条件和否定保护、数据诚信、不确定性与阅读时间。

#### `captions`

负责文本事实来源、Card 分段、语义换行、时间精度、强调 Span、排版、人物/UI 遮挡和与主视觉的注意力分工。

#### `audio-finishing`

负责主声音连续性、Room Tone、呼吸、音乐 Spotting、BGM 时长、Duck、J/L Cut、声音桥、SFX onset、静音和最终复听。

#### `export`

负责固定目标 Timeline / Sequence 与 Revision、Draft/Delivery 目的、Render Preflight、异步导出、最终文件验证、Attribution 和 Artifact 记录；不改变创作状态。

#### `known-errors`

负责 Revision 过期、素材未就绪、Bridge 409、`run_id` 丢失、输出缺失、浏览器解码、Remotion、Mask、导出和结果未知等确定性恢复。创作质量问题应退回对应主工作流或专业 Skill，不应全部归类为技术错误。

### 16.9 Skill 内容与 References 的写作标准

主工作流 `SKILL.md` 必须是一份可独立阅读的完整作业手册，而不是“请再读十个文件”的目录。它应使用连续段落讲清任务差异、依赖、判断、例外、失败表现和观看影响，并穿插真实正例、反例和边界案例。

References 只有在同时满足以下条件时才单独存在：

- 属于可选分支，不是主流程必须知识；
- 单独构成一个完整专业章节；
- 有自己的决策流程、案例、失败模式、工具映射和验证；
- 不会在每次执行主 Skill 时都必须全文读取。

不再保留“一个概念 + 几条 Bullet + 一个独立文件”的短 Reference。多个必须同时判断的概念应合并成围绕真实任务的完整章节。

基础操作型 Skill 可以主要使用步骤和状态表；创作型 Skill 必须以专业解释为主体，清单只用于执行和最终防漏。

代码能力变化时，相关 Skill、References、`AGENTS.md`、`.codex/config.toml` 和测试必须在同一个 PR 中更新。CI 至少检查：

- Skill 引用的 MCP 工具是否存在且未废弃；
- 主工作流引用的专项 Skill 是否存在；
- Reference 路径是否有效；
- `.codex/config.toml` 登记路径是否存在；
- 当前代码已经支持的字段没有被 Skill 描述为缺失；
- 当前代码尚未实现的能力没有被 Skill 声称为已完成。

### 16.10 SkillExecutionReport

可选 `SkillExecutionReport` 记录一次任务中：

- 选择了哪个主要工作流；
- 实际读取了哪些专项 Skill 和 Reference；
- 每个阶段形成了什么决定和项目对象；
- 哪些替代方案被拒绝；
- 调用了哪些 MCP；
- 查看了哪些 Preview 或声音范围；
- 质量问题怎样返回并修复。

它只用于审计“这一次 Codex 怎样完成任务”，不负责 Skill 路由，也不替代 CreativeBrief、Story、Scene、Timeline、Revision 或 QualityReport。删除它不能改变成片。

### 16.11 ChatCut 与 VideoFlowCut Skill 的对应关系

ChatCut 资料用于吸收产品工作方法、专业判断、工具边界和验证方式，但不复制其私有对象、品牌字段或运行时工具名。

| ChatCut Skill | VideoFlowCut 主 Skill | 按需调用的专项能力 |
|---|---|---|
| `chatcut-plugin-basics` | `project-basics` | 必要时由 `web-editor-operator` 获取 Web 证据；不再由 `production-director` 补基础合同 |
| `talking-head-guide` | `presenter-motion-director` | `semantic-continuity`、`voice-production`、`avatar-performance`、`visual-treatment-planning`、`visual-asset-sourcing`、`remotion-production`、`cutaway-planning`、`captions`、`audio-finishing`、`quality-verification` |
| `create-motion-graphics` | `remotion-production` | `visual-treatment-planning`、`scene-planning`、`effect-timing`、`depth-composition`、`quality-verification` |
| `verification` | `quality-verification` | `web-editor-operator` 负责取得真实画面、UI 和连续播放证据 |
| `asset-import` | `asset-import` | 根据任务再进入语义、人物、证据或 B-roll 流程 |
| `transcription` | `transcription` | 语义解释由 `semantic-continuity` 继续完成 |
| `voice` | `voice-production` | 与 `semantic-continuity`、`avatar-performance` 和 `audio-finishing` 协同 |
| `export` | `export` | 依赖 `quality-verification` 和交付门禁 |
| `known-errors` | `known-errors` | 被所有主工作流与操作型 Skill 调用 |
| `shader-gen` | 当前无对应 Skill | 真正实现 Shader Asset、Runtime、属性 Schema 和 Timeline 绑定后再增加 `shader-production` |
| `multicam-sync` | 当前无独立运行时 Skill | 多机位能力实际实现后，由 Presenter/Vlog 主工作流调用专项 Skill |

最重要的对应关系不是：

```text
ChatCut Skill = 多个平级 VideoFlowCut Skill 相加
```

而是：

```text
ChatCut 完整工作流
→ 一个 VideoFlowCut 主 Skill 负责从头到尾
→ 主 Skill 在具体阶段调用若干专项 Skill
→ 专项结果重新回到主工作流和质量门禁
```

## 17. MCP 架构

### 17.1 统一一个 MCP

Codex 只连接一个项目级 MCP：

```text
video-editor-mcp
```

MCP 内部可以按 Project、Asset、Voice、Story、Scene、Timeline、Preview、Quality 和 Export 分模块实现，但对 Codex 暴露统一工具面和统一 Revision 语义。

### 17.2 MCP 职责

MCP 负责：

- 查询项目事实；
- 提交确定性命令；
- 跟踪异步任务；
- 读回 Revision、Preview 和 QualityReport。

MCP 不负责：

- 审美判断；
- 自动挑选效果；
- 存储第二份状态；
- 直接调用数据库；
- 直接控制底层渲染帧；
- 执行任意 Remotion 代码。

### 17.3 写工具统一约束

所有写工具应支持或隐含：

- `project_id`；
- `base_revision_id`；
- 幂等键；
- 目标对象 ID；
- 原子批次；
- dry-run / preview；
- 新 Revision；
- ImpactReport。

长任务返回 Job ID，通过 `track_job` 或专项跟踪工具读取状态。

### 17.4 推荐 MCP 工具面

以下名称是推荐契约，可在编码中微调，但不得改变职责边界。

#### 项目与 Revision

| 工具 | 作用 | 阶段 |
|---|---|---|
| `list_projects` | 列出项目 | V1 |
| `create_project` | 创建项目和 Brief | V1 |
| `target_project` | 设置当前 Codex 项目上下文 | V1 |
| `read_project` | 读取项目概要、当前 Revision、状态 | V1 |
| `edit_project` | 修改 Brief、Profile、StylePack 引用 | V1 |
| `get_editor_url` | 返回 Web 工作台地址 | V1 |
| `focus_editor_object` | 返回定位 Scene、Item、Cue 或帧的编辑器地址 | V1 |
| `manage_markers` | 创建、读取、修改审片 Marker | V1 |
| `manage_revisions` | 列表、比较和回退同一 Timeline / Sequence 的 Revision | V1 |
| `manage_timeline_variants` | 创建、复制、命名和切换长版、短版、横竖版等平行 Timeline；第一版可只支持 default | 后续 / 需要平行版本时 |

#### 素材与任务

| 工具 | 作用 | 阶段 |
|---|---|---|
| `browse_assets` | 查询项目素材和处理状态 | V1 |
| `inspect_asset` | 读取素材元数据、代理、证据 | V1 |
| `read_asset_readiness` | 读取字节、分析、Timeline、当前渲染链和权利就绪状态 | V1 |
| `import_media` | 创建上传/导入任务 | V1 |
| `edit_asset` | 修改素材标题、标签、用途 | V1 |
| `submit_media_analysis` | 提交代理、波形、镜头等分析 | V1 |
| `submit_transcription` | 通过 FunASR HTTP 工作流提交音频转文字 | V1 |
| `find_transcript` | 按文本、人物或时间查询转写 | V1 |
| `manage_transcript` | 修正 TranscriptText 和语义文本；不伪造时间 | V1 |
| `browse_library` | 查询项目素材、Creative Library 和已缓存素材 | V1 |
| `manage_asset_requirements` | 创建、修改、读取和关闭 AssetRequest | V1 |
| `search_media_candidates` | 根据 AssetRequest 生成 SearchIntent 并查询 Provider | V1 |
| `list_asset_candidates` | 读取候选、技术预过滤、语义评分、来源和 rightsStatus | V1 |
| `inspect_media_candidate` | 查看候选联系表、短预览、媒体参数和来源信息 | V1 |
| `acquire_media_asset` | 下载、校验、本地化并注册正式 Asset | V1 |
| `generate_media_asset` | 通过 Remotion、Creative Library 或 MiniMax H3 生成允许生成的资产 | V1 |
| `read_asset_provenance` | 读取 Asset 的来源、许可、署名、生成参数和导入记录 | V1 |
| `read_asset_coverage` | 检查 NarrativeBeat / Scene 的素材需求覆盖和未解决缺口 | V1 |
| `replace_scene_asset` | 在保持 Scene 与 Cue 结构的情况下替换素材 | V1 |
| `submit_derived_asset_job` | 生成封面墙、评论云、图表等派生资产 | V1 |
| `track_job` | 跟踪搜索、下载、生成、Avatar、预览和导出任务 | V1 |

Provider 专用 API Key、页码、限流、下载 URL 和许可字段不直接暴露给 Codex。MCP 面向的是 AssetRequest、AssetCandidate、Asset 和 Provenance；Provider 差异由 Application Adapter 归一化。

#### Story 与 Script

| 工具 | 作用 | 阶段 |
|---|---|---|
| `read_script` | 读取最终观众会听到的 Script | V1 |
| `apply_script` | 应用语义删改、重排并更新项目 | V1 |
| `read_semantic_units` | 读取完整句、观点、转折和重录候选 | V1 |
| `manage_story` | 创建和修改 Section、NarrativeBeat | V1 |
| `read_narrative_map` | 读取 Hook、证据、笑点、CTA 等结构 | V1 |
| `manage_speech_segments` | 读取和调整可独立朗读的 SpeechSegment 与段间停顿 | V1 |
| `read_speech_timing` | 读取段级 SpeechTiming、精度和来源；词级为未来可选 | V1 |

#### Scene 与视觉处理

| 工具 | 作用 | 阶段 |
|---|---|---|
| `browse_scene_types` | 查询可用 Scene Type 和能力 | V1 |
| `create_scene` | 创建 Presenter/Explainer/Cutaway 等 Scene | V1 |
| `edit_scene` | 修改 Scene 目的、时长、Props 和资产 | V1 |
| `inspect_scene` | 读取 Scene、Cue、质量状态 | V1 |
| `browse_effect_types` | 查询 Presenter Effect 模板 | V1 |
| `manage_effect_cues` | 批量创建、修改、删除 EffectCue | V1 |
| `manage_cutaways` | 管理全屏 UI、B-roll、梗图和解释段 | V1 |
| `manage_visual_treatment` | 管理 Attention Curve 和整片效果计划 | V1 |
| `inspect_spatial_anchors` | 读取人物空间、安全区和遮挡信息 | V1 |
| `preview_scene` | 预览单个 Scene | V1 |

#### Timeline、字幕和音频

| 工具 | 作用 | 阶段 |
|---|---|---|
| `preview_timeline` | 读取指定范围的结构和播放状态 | V1 |
| `edit_track` | 创建、排序、锁定或禁用 Track | V1 |
| `edit_item` | 原子修改 Item 的位置、时长和属性 | V1 |
| `inspect_item` | 读取 Item 与 Scene、Asset、Anchor 关系 | V1 |
| `split_item` | 明确物理切点；不用于逐词剪口播 | V1 |
| `detach_audio` | 解除音画绑定 | 后续 |
| `smooth_audio` | 平滑语音切口 | V1 |
| `read_captions` | 读取 Caption Program | V1 |
| `edit_captions` | 修改字幕内容、Card、样式和强调 | V1 |
| `manage_audio` | 管理 Dialogue、BGM、SFX、Duck | V1 |

#### 声音、数字人与人物表演

| 工具 | 作用 | 阶段 |
|---|---|---|
| `manage_voice_references` | 选择、读取和校验本地参考音频 Asset | V1 |
| `submit_voice_synthesis` | 对变更的 SpeechSegments 批量调用 OmniVoice，并组装最终 SpeechAsset | V1 |
| `read_speech_asset` | 读取 SegmentAsset、最终 SpeechAsset、Bridge run、时序和质量信息 | V1 |
| `read_actor_capabilities` | 读取数字人 Provider 和人物能力 | V1 |
| `submit_avatar_job` | 使用 SpeechAsset 提交数字人生成 | V1 |
| `read_actor_performance` | 读取人物视频、Mask、SpeechTiming 和姿态 | V1 |
| `manage_actor_performance` | 替换、局部重生成、绑定 Scene | V1 |

#### Preview、Quality 与 Export

| 工具 | 作用 | 阶段 |
|---|---|---|
| `preview_edit_transaction` | 写入前查看影响 | V1 |
| `read_impact_report` | 读取重算、失效、冲突和 Dirty Range | V1 |
| `render_preview_range` | 渲染局部范围 | V1 |
| `inspect_composed_frames` | 读取进入、稳定、退出等关键帧 | V1 |
| `read_quality_report` | 读取技术和创作质量问题 | V1 |
| `record_editorial_review` | 记录绑定当前 Timeline / Sequence 与 Revision 的完整声画审片结果 | V1 |
| `run_render_preflight` | 检查目标 Revision 引用的素材、字体、Mask、组件、权利和渲染依赖 | V1 |
| `submit_export` | 固定 Timeline / Sequence 与 Revision，按 draft 或 delivery 用途提交导出 | V1 |
| `track_export` | 跟踪导出、最终文件技术检查和 Artifact 状态 | V1 |
| `read_export_artifact` | 读取最终文件、目标 Revision、技术验证、已知限制和批准状态 | V1 |

### 17.5 暂缓 MCP 能力

第一版不实现或不优先：

- 股票素材搜索；
- 通用网页浏览器；
- 任意 Shader；
- 自动音乐生成；
- 多机位；
- 视频翻译；
- 数字人商城；
- 任意代码型 MG；
- 用户摩擦遥测工具。

这些能力以后仍通过同一个 MCP 增加，不单独创建新 MCP 服务。

---

## 18. Codex、Skills、MCP 与 Web 协同流程

### 18.1 创建数字人口播视频

```text
用户在 Codex 提出目标并提供脚本、人物素材、参考视频或声音样本
→ Codex 读取 AGENTS.md 与 project-basics
→ target_project / read_project，确认当前 Revision、素材和未完成 Job
→ 读取 production-director
→ production-director 选择 presenter-motion-director 作为主要工作流
→ presenter-motion-director 判断本次属于 Cleanup、重组、现有数字人组装、声音替换、Motion Finishing 或完整生产
→ 需要时调用 transcription / semantic-continuity，稳定 A-roll / Script 主线
→ 需要时调用 voice-production
   ├─ manage_voice_references
   ├─ manage_speech_segments
   ├─ 每个变更 Segment 直接调用 OmniVoice HTTP API
   ├─ 下载并校验 SegmentAsset
   └─ 组装 SpeechAsset + segment_exact SpeechTiming
→ 需要时调用 avatar-performance，生成或登记 ActorPerformance
→ presenter-motion-director 编译 StoryBeat / PresenterScene 主线
→ 调用 visual-treatment-planning，决定人物、安静区、Remotion、B-roll 和 Cutaway
→ 需要外部素材时调用 visual-asset-sourcing，再由 cutaway-planning 决定实际使用方式
→ 需要 Motion Graphics 时调用 remotion-production
   ├─ scene-planning
   ├─ effect-timing
   └─ depth-composition
→ 调用 captions 与 audio-finishing
→ render_preview_range / inspect_composed_frames
→ quality-verification 执行局部和整片审查
→ 问题返回 presenter-motion-director 或对应专项 Skill 修复
→ Gate A、Gate B、Gate C 通过
→ export 固定 Revision 并提交交付
```

`presenter-motion-director` 对整条人物口播负责；专项 Skill 完成局部任务后必须把对象、失效范围和验证结果交回该主工作流。`submit_voice_synthesis` 的服务端实现仍直接调用 `ComfyUIBridgeClient`，不转发到另一个项目内 MCP，也不等待不存在的默认词级对齐步骤。

### 18.2 Codex 通过 Web 调整一个效果

```text
Codex 调用 get_editor_url / focus_editor_object
→ Browser Operator 打开 EffectCue 所在 Scene
→ 在 Timeline 或 Inspector 选中 EffectCue
→ 调整大小、位置、强度或时机
→ Web Command API 携带 base_revision
→ Application 校验并提交
→ 新 Revision + ImpactReport
→ Preview 更新
→ Browser Operator 检查稳定帧和遮挡
→ Codex 读取最新 Revision 与 QualityReport
```

这条链路由 Codex 完成，不要求用户亲自操作 Web。

### 18.3 Script 删除一句话

```text
Codex 通过 apply_script 提交语义删改
→ SemanticUnit / SpeechSegment 更新
→ 只将受影响的 SpeechSegmentAsset 标记为需要重新生成
→ submit_voice_synthesis
→ 重新组装 SpeechAsset，并基于真实段时长重算后续 SegmentTiming
→ ActorPerformance 标记局部或全部重生成
→ Caption 按新 SegmentTiming 重算
→ 绑定被删语义的 EffectCue 标记 stale
→ 后续 Cue 按新段边界重新定位
→ BGM 重算
→ ImpactReport
→ 只渲染受影响 Scene
→ Codex 检查预览并继续修正
```

### 18.4 MCP 与 Browser Operator 的 Revision 冲突

```text
MCP 基于 Revision 12 提交修改
但 Browser Operator 已经通过 Web 更新到 Revision 13
→ 后端拒绝陈旧写入
→ Codex read_project / inspect_scene
→ 重新判断
→ 基于 Revision 13 提交
```

任何冲突都必须重新读取项目，不能由客户端静默覆盖。

### 18.5 Codex 自动搜索并插入空镜

```text
主要视频工作流读取 Story、NarrativeBeat 和 Visual Treatment
→ read_asset_coverage
→ 为缺口调用 manage_asset_requirements
→ 调用 visual-asset-sourcing 生成查询计划
→ search_media_candidates
→ list_asset_candidates / inspect_media_candidate
→ Codex 比较语义、动作、构图、情绪、来源和 rightsStatus
→ acquire_media_asset
→ track_job
→ read_asset_provenance
→ replace_scene_asset 或 create_scene(CutawayScene)
→ render_preview_range
→ inspect_composed_frames / read_quality_report
→ 不合适则更换候选、改用 Remotion 或 generate_media_asset
→ 通过后关闭 AssetRequest，并生成新 Revision
```

该链路不要求用户提供全部空镜，也不要求用户亲自进入 Web 选择素材。用户只在来源需要额外授权、多个创作方向差异较大或 Quality Gate 无法自动决策时参与确认。

### 18.6 局部编辑任务

局部任务不必重跑整条生产流程：

```text
用户要求“把这一条字幕上移”
→ project-basics
→ captions
→ Web / Preview 检查遮挡
→ quality-verification
```

```text
用户要求“重做这一个全屏解释动画”
→ project-basics
→ remotion-production
→ scene-planning / effect-timing / depth-composition（按需）
→ Preview
→ quality-verification
```

```text
用户要求“更换第 20 秒的 B-roll”
→ project-basics
→ visual-asset-sourcing
→ cutaway-planning
→ Preview
→ quality-verification
```

只有当局部修改改变主线、Story、整体 AttentionCurve 或多个 Scene 时，才回到 `production-director` 与主要视频工作流。

### 18.7 新 Codex 会话、MCP 重启或 Worker 恢复

```text
重新建立 MCP 连接
→ list_projects / target_project
→ 确认当前 Timeline / Sequence 与 Revision
→ 读取未完成 Job、最近失败和 ImpactReport
→ 读取 AssetReadiness、Bridge 与 Render Worker 健康状态
→ 读取 Story、Scene、Timeline、QualityReport
→ 再决定继续、重试、回退或重新规划
```

恢复时只相信项目读回和任务终态。旧聊天中未写入项目的计划、旧浏览器选中状态和旧 Worker 内存不能作为继续执行的依据。

## 19. 代码与模块架构

采用模块化单体和独立 Job Worker。业务领域、Web、MCP、Asset Acquisition、ComfyUI Bridge HTTP Client 和 Remotion 在同一仓库维护；媒体算法、外部 Provider 查询、候选下载、外部工作流轮询和渲染使用后台任务执行。

```text
AGENTS.md

.agents/
└─ skills/
   └─ ...                         本文第 16 节定义的项目 Skills

docs/
├─ ARCHITECTURE.md
├─ chatcut视频剪辑工具拆解/
├─ asr接入.md
└─ asset-sourcing/
   ├─ provider-contracts.md
   ├─ licensing-policy.md
   └─ provider-notes/

apps/
├─ web/                           ChatCut 式 Web 剪辑工作台
├─ server/                        HTTP、WebSocket、MCP 和 Application 入口
├─ job-worker/                    Bridge、素材搜索/下载、Avatar、预览和导出任务
├─ render-worker/                 Remotion 局部预览与 MP4 导出
└─ media-worker-python/           FFmpeg、OpenCV、视觉、姿态和候选画面分析

packages/
├─ contracts/                     API、Command、Query、事件契约
├─ edit-domain/                   Project、Story、Scene、Timeline、Revision
├─ edit-application/              Handler、事务、Impact、Job 编排
├─ story-engine/                  Semantic Builder、Narrative Map、Script Compiler
├─ scene-engine/                  Scene Registry、Effect Registry、Timing Compiler
├─ asset-acquisition/             AssetRequest、Query Planner、Provider、Ranker、Provenance
│  └─ providers/                  Local、Pexels、Pixabay、Evidence、MiniMax、Mock
├─ remotion-runtime/              Player、Scene 组件、Composition Snapshot
├─ comfyui-bridge-client/         通用 Bridge HTTP Client 与契约
├─ speech-services/               FunASRService、OmniVoiceSegmentService、SpeechAssembler
├─ avatar-integrations/           数字人 API 与结果归一化
├─ creative-library/              StylePack、模板、Derived Asset
├─ quality-system/                技术、素材权利和模式专项质量检查
└─ mcp-tools/                     MCP Schema 与 Application 适配器
```

### 19.1 技术边界

推荐：

- TypeScript：Web、Server、领域模型、MCP、Remotion、Bridge Client、Provider Adapter、许可策略和任务编排；
- Python：媒体算法、OpenCV、VAD、视觉、姿态、候选镜头分析和可选水印检测；
- FFmpeg/ffprobe：探测、代理、波形、音频标准化、转码、截取预览和复用；
- SQLite：本地项目、Revision、Job、外部 run、SearchIntent、Candidate、Provenance 和索引；
- 本地项目目录：源素材、外部导入素材、证据、生成资产、代理、SpeechAsset、人物、派生素材、预览、缓存和导出。

FunASRService、OmniVoiceSegmentService、SpeechAssembler、Asset Provider、Python Worker 和 Avatar Integration 都不直接修改 Timeline，只提交标准化结果给 Editing Application。Provider 不持有第二份 Project 状态，也不决定最终候选。

### 19.2 运行方式

第一阶段默认在 Windows 本机运行：

- Node Server；
- Web 应用；
- Job Worker；
- Python Media Worker；
- Remotion Render Worker；
- SQLite；
- 本地文件系统；
- ComfyUI-AppApi Bridge：`http://127.0.0.1:8188/comfyui-bridge/v1`；
- 数字人 HTTP API；
- 外部素材 Provider API Key 由本地 Secret/环境变量管理；
- Provider 查询缓存、下载临时目录和网络访问策略。

不同进程通过 Application API、Job Queue 和受管文件路径协作。8188 端口不得直接暴露公网。

### 19.3 建议工作区

```text
workspace/
├─ app.sqlite
└─ projects/
   └─ <project-id>/
      ├─ assets/
      │  ├─ source/
      │  ├─ acquired/              已本地化的 Stock / Commons 素材
      │  ├─ evidence/              官方网页、文档和证据截图
      │  ├─ generated/             MiniMax 等生成资产
      │  ├─ proxy/
      │  ├─ voice-reference/
      │  ├─ speech/
      │  ├─ actor/
      │  └─ derived/
      ├─ manifests/
      │  └─ attribution/           来源、许可和署名清单
      ├─ previews/
      ├─ exports/
      └─ cache/
         ├─ provider-search/
         └─ candidate-preview/
```

项目索引、Revision、Job、VoiceReference、SpeechSegment、SpeechTiming、Bridge run、AssetRequest、SearchIntent、AssetCandidate 和 AssetProvenance 状态进入 SQLite；媒体文件、候选预览、来源清单和渲染产物保存在项目目录。

## 20. Job System

异步任务类型：

- 上传和媒体导入；
- 代理和分析；
- 外部素材搜索与 Candidate Enrichment；
- Candidate 预览、联系表和短预览生成；
- 外部素材下载、本地化、哈希和 Provenance 注册；
- Web Evidence 页面截取和证据范围保存；
- MiniMax 视觉素材生成；
- FunASR 文本转写；
- OmniVoice SpeechSegment 语音合成；
- SpeechAsset 拼接与段级时序计算；
- 数字人生成；
- Derived Asset；
- 局部预览；
- Render Preflight；
- 基础导出；
- 最终 Artifact 技术验证。

### 20.1 状态

```text
queued
running
succeeded
failed
unknown
cancelled
```

### 20.2 必要机制

- 幂等任务键；
- Worker lease；
- heartbeat；
- 超时；
- 重试策略；
- 结果未知后的对账；
- Bridge 409 后刷新 workflow detail；
- ComfyUI 重启导致 run_id 丢失时的重提交流程；
- Provider 级限流、缓存、退避、熔断和健康状态；
- Candidate 下载 URL 过期后的元数据刷新；
- 成功输出立即下载并注册本地 Asset；
- 下载文件的 MIME、文件头、内容哈希和 ffprobe 校验；
- 任务产物验证；
- 日志和事件。

不要把 Job 状态等同于项目 Revision。Job 可以失败，但项目状态不能半写。

同时不要把 `Job succeeded` 等同于“交付完成”：

- Preview Job 成功只证明对应预览产物已生成；
- Export Job 成功只证明产生了候选文件；
- 仍需验证文件可解码、时长、音轨、黑帧和目标 Revision；
- 正式交付还需要绑定当前 Artifact 的完整声画审片结果。

---

## 21. Quality System

质量系统分两层。

### 21.1 确定性技术检查

- 时间范围合法；
- 轨道冲突；
- 素材是否存在且已本地化；
- Scene / Timeline 是否仍引用远程临时 URL；
- AssetProvenance 是否完整；
- rightsStatus 是否允许当前导出；
- AttributionManifest 是否满足要求；
- 下载文件 MIME、文件头、时长和可解码性；
- Mask 是否可用；
- 字幕越界；
- 导出文件可读；
- 时长和音轨；
- 黑帧；
- 缺失帧；
- 渲染异常。

### 21.2 创作质量检查

由 Codex/视觉模型在 Skill 约束下读取真实合成帧和局部视频。

所有模式共享的外部素材检查：

- B-roll 是否真正支持当前语义和动作，而不是只匹配名词；
- 画幅裁切后主体、视线和留白是否仍成立；
- 情绪、镜头运动和前后 Scene 是否衔接；
- 是否连续使用近似 Stock，产生素材拼盘感；
- 证据是否来自原始页面，生成画面是否被明确标记；
- 外部素材是否抢走人物、字幕或主视觉的注意力；
- 搜索不到合适素材时，保持人物或使用 Remotion 是否更合理。

#### Presenter 专项

- 动效是否对应口播；
- 动效是否在正确语义段或目标短语上稳定；
- 人物动作与效果是否匹配；
- 前景是否挡脸、嘴和字幕；
- 后景遮挡是否正确；
- 是否连续高密度过久；
- 字幕是否与主视觉竞争；
- Cutaway 是否破坏口播连续；
- 评论、截图和产品是否真实相关。

#### Explainer 专项

- Scene 是否真正解释概念；
- 信息是否逐步递进；
- 证据是否可信；
- 是否使用同一模板重复整片；
- 阅读时间是否足够；
- 动画是否只是装饰。

#### Vlog 专项

- 镜头和事件是否连贯；
- 环境声是否自然；
- 情绪是否递进；
- 镜头是否重复；
- 音乐是否喧宾夺主；
- 是否为了节奏过度碎剪。

### 21.3 四级验证证据

质量系统对同一 Revision 分别记录以下证据，不能用一个布尔值互相替代：

| 级别 | 证明什么 | 典型证据 |
|---|---|---|
| 项目结构 | 对象已被当前 Revision 保存，依赖关系合法 | Project / Scene / Timeline / Caption / EffectCue 读回 |
| 局部合成 | 受影响范围的真实画面和必要声音可以被检查 | Remotion Preview、关键帧、局部连续播放 |
| 最终 Artifact | 指定 Revision 已产生真实文件且技术正确 | MP4 / 音频文件、解码、时长、音轨、黑帧和哈希 |
| 完整声画审片 | 语义、切口、字幕、动效、声音、节奏和观众承诺成立 | 绑定 Revision 与 Artifact 的 Editorial Review |

开发和快速审片可以提交 `draft` 导出；对外交付的 `delivery` 导出必须通过全部适用级别。第一版继续使用现有 `QualityReport + ExportJob + ExportArtifact` 保存这些结果，不新增独立的 Delivery 状态中心。

### 21.4 Quality Gate

导出前阻塞条件：

- 严重语义不完整；
- 素材缺失；
- 正式 Scene 仍引用远程临时 URL；
- 外部素材 rightsStatus 为 unknown、blocked 或 reference_only；
- 必需的 AttributionManifest 缺失；
- 证据使用生成或来源无法核对；
- 主体遮挡；
- 字幕不可读；
- ActorPerformance 与 Script 不一致；
- Scene 构建失败；
- 音频缺失；
- 技术渲染失败；
- 目标 Revision 的必要 Asset 未通过 Render Preflight；
- 正式 `delivery` 导出缺少最终文件技术校验；
- 正式 `delivery` 导出缺少绑定当前 Artifact 的完整声画审片记录。

建议级问题由 Codex 汇总给用户，用户可以接受或要求继续修改。用户批准必须绑定具体 Timeline / Sequence、Revision 和 ExportArtifact，不能只记录“当前项目已批准”。

---

## 22. 开发阶段

### 阶段 0：工程基线

实现：

- 根目录 `AGENTS.md`；
- `.agents/skills` 发现与最小示例；
- `docs/` 资料索引；
- Project / Revision；
- Asset、AssetReadiness、AssetRequest、AssetCandidate、AssetProvenance；
- Provider Contract、MockAssetProvider 和许可策略骨架；
- Story / Scene / Timeline 基础；
- SQLite 和项目目录；
- Web、Server、Worker 基础运行；
- `video-editor-mcp` 连接和项目定位；
- Browser Operator 的稳定对象定位与测试合同。

退出条件：

- 创建项目；
- 导入视频；
- 使用 MockAssetProvider 跑通 AssetRequest → Candidate → Acquire → Provenance；
- 建立一个 Scene；
- 保存、读取、回退 Revision；
- Web 和 MCP 读取同一状态；
- Codex 可以打开 Web 并定位到指定 Scene 或 Item。

### 阶段 1：语音、Presenter Motion 与第一条闭环

实现：

- Script、SemanticUnit 和 SpeechSegment；
- `ComfyUIBridgeClient`；
- FunASR HTTP 文本转写；
- 可选 VAD + TranscriptChunk 粗粒度定位；
- VoiceReference；
- OmniVoiceSegmentService；
- SpeechSegmentAsset；
- SpeechAssembler；
- `segment_exact` SpeechTiming；
- 导入或生成的数字人物视频和 Mask；
- PresenterScene；
- 稳定短句字幕；
- Asset Acquisition System 第一版；
- ProjectAssetProvider、CreativeLibraryProvider、PexelsProvider、PixabayProvider、WebEvidenceProvider、MiniMaxGeneratedProvider；
- Query Planner、Candidate Ranker、rightsStatus、下载本地化和 AttributionManifest；
- 第一批 Effect Registry；
- EffectCue；
- Remotion Player；
- 局部预览；
- Quality Report；
- MP4 导出；
- ChatCut 式 Web 布局和全部主要功能板块；
- `project-basics → production-director → presenter-motion-director → 专项 Skills → quality-verification` 的完整人物口播 Skill 路由与交接。

优先效果：

1. MetricBackdrop；
2. ProductFan；
3. GlowCTA；
4. PortfolioWall；
5. CommentCloud；
6. EvidenceCard；
7. CameraPunch；
8. FullScreenMeme；
9. DeviceShowcase；
10. ContentCarousel；
11. EndCard。

退出条件：

- 一条 45～60 秒人物口播能完成完整效果；

阶段 1 使用三个内部验收 Gate，但仍然属于同一个开发阶段：

#### Gate A：主线成立

- 素材来源和就绪状态可读回；
- Script、A-roll、Dialogue、Story 和 PresenterScene 骨架来自可回源证据；
- 只听主声音时语义完整，重录、停顿和切口自然；
- 主线修改不会依赖包装掩盖问题；
- `presenter-motion-director` 已明确接收 `semantic-continuity`、`voice-production` 和 `avatar-performance` 的结果，而不是只记录这些 Skill 被加载。

#### Gate B：包装成立

- 字幕、EffectCue、Cutaway、B-roll、BGM 和 SFX 在主线稳定后写入；
- 每个显性处理都有语义、动作、证据或节奏目的；
- 主线变化后能自动重算、保持、失效或进入复核；
- 有安静区，不以覆盖全部组件作为成片目标；
- 真实合成帧和局部连续播放通过；
- `presenter-motion-director` 能收拢 Visual Treatment、Remotion、B-roll、字幕和声音结果，并指出哪些 Beat 故意不使用包装。

#### Gate C：交付成立

- 目标 Revision 的 Render Preflight 通过；
- 实际生成最终 MP4 / 音频文件；
- 文件通过解码、时长、音轨、黑帧和目标 Revision 检查；
- 完整声画审片已记录，阻塞问题为零；
- 用户批准或交付状态绑定具体 ExportArtifact；
- `quality-verification` 发现问题时能返回正确主工作流或专项 Skill，而不是只输出一份无人处理的报告。

其余退出条件：
- 完整人物口播任务真实经过 `production-director → presenter-motion-director`，局部专项结果具有输入、输出、失效传播和验证证据；
- `loadedSkills`、SkillExecutionReport 或文件存在只能作为审计证据，不能代替实际项目对象、Preview 和 Editorial Review；
- Codex 能通过 Skills + MCP 生成和修改；
- Codex 能通过 Browser Operator 使用 Web 的素材、文字稿、Scene、Preview、Inspector 和 Timeline；
- FunASR 和 OmniVoice 均通过 `docs/asr接入.md` 定义的 HTTP 流程直接运行；
- 每次 Run 都动态读取最新 schemaVersion 和公开字段；
- 409、failed、输出缺失和 run_id 丢失都有可诊断处理；
- VoiceReference 不被误建模为远端 Voice ID；
- Script 局部修改只重生成受影响 SpeechSegments；
- SegmentAsset 下载、ffprobe 校验、SpeechAsset 拼接和段级时序可读回；
- 第一版字幕和动效不声称拥有词级精度；
- Codex 能从口播 NarrativeBeat 自动创建 AssetRequest，并通过 Provider 搜索、预览、下载和替换至少两条现实 B-roll；
- 搜索无结果时能按策略使用 Remotion 或 MiniMax 生成至少一个降级资产；
- 外部素材全部本地化，并能读回 Provider、作者、rightsStatus、许可和内容哈希；
- CI 使用 MockProvider，真实 Provider 只在 Staging/Production 开启；
- 导出后项目仍可继续生成新 Revision。

### 阶段 2：Avatar Adapter 与联合表演规划

阶段 2 由 `presenter-motion-director` 统领，`avatar-performance` 作为专项 Skill 负责人物能力与表演，不独立形成另一条生产流程。

实现：

- Actor Capability Profile；
- Avatar External Integration；
- 人物 Mask；
- 姿态和空间锚点；
- 局部重生成；
- 人物动作与效果联合规划。

退出条件：

- Script 修改后能明确重生成范围；
- 效果可绑定人物手部、两侧和后景；
- 遮挡检查有效；
- SpeechAsset 与 ActorPerformance 的版本关系明确。

### 阶段 3：视觉解释片

阶段 3 由 `visual-explainer-director` 作为完整主工作流统领；Remotion、证据、字幕、声音和素材获取仍通过现有专项 Skills 复用。

实现：

- Explainer Scene Registry；
- Narrative Map；
- Visual Treatment；
- EvidenceDocument；
- WikimediaCommonsProvider 与逐文件许可解析；
- Evidence Capture、页面高亮和证据快照；
- UIWalkthrough；
- Comparison；
- Classification；
- DataConclusion；
- 场景级缓存。

退出条件：

- 60～90 秒解释视频包含场景递进、证据和图表；
- 视觉形式随叙事任务变化；
- 可与 PresenterScene 混合。

### 阶段 4：Vlog

阶段 4 由 `vlog-director` 作为完整主工作流统领；镜头分析、事件聚类、环境声和 Montage 的专项结果必须回到该工作流并经过整片审查。

实现：

- 镜头分析；
- 事件聚类；
- Shot Selects；
- VlogMontageScene；
- 环境声；
- 音乐节拍；
- Vlog Quality Rules。

退出条件：

- 从多段实拍素材组织出有事件和情绪的短片；
- 允许插入 PresenterScene 和 ExplainerScene。

### 阶段 5：扩展能力

按产品需要继续增加：

- 受限代码型 Remotion Scene；
- 音乐生成；
- 更多视频生成 Provider 与复杂生成工作流；
- 多机位；
- Shader；
- 复杂三维资产；
- 更多声音和数字人 Provider；
- 真实词级时间戳工作流或强制对齐服务；
- Web 内的 Agent 交互。


## 23. 测试策略与固定素材基线

测试分为可重复的自动化测试和允许联网的人工端到端测试。CI、回归测试和 Golden Test 禁止依赖实时网页搜索、临时 CDN、每次重新生成的 AI 视频或不固定的第三方返回结果；运行时产品可以联网寻找素材，但测试必须冻结输入和期望结果。

### 23.1 测试素材目录

```text
tests/fixtures/
├─ presenter/
│  ├─ raw/                      固定人物口播原片
│  ├─ manifest.md               顺序、用途、已知问题和预期处理
│  ├─ transcript/               固定转写和人工核对文本
│  └─ expected/                 预期 Scene、Cue、字幕和质量结果
├─ explainer/
│  ├─ script.md
│  ├─ source-assets/            固定文档、UI、图表和 B-roll
│  ├─ reference-style/          参考视频拆解与 StylePack 规范
│  └─ expected/
├─ vlog/
│  ├─ cat/
│  ├─ swimming/
│  ├─ interview/
│  └─ expected/
├─ external-search/
│  ├─ requests/                 固定 AssetRequest 与 SearchIntent
│  ├─ provider-responses/       Pexels/Pixabay/Commons 的冻结响应
│  ├─ candidate-previews/       固定缩略图、联系表和短预览
│  ├─ cached-assets/            通过审核的本地化素材
│  ├─ provenance/               来源、许可、署名和内容哈希
│  └─ expected/                 候选排序、拒绝原因和覆盖结果
└─ golden/
   ├─ frames/
   ├─ audio/
   └─ project-snapshots/
```

每个固定素材必须记录：来源、内容哈希、时长、分辨率、帧率、音频参数、许可状态、测试用途和已知问题。测试运行不修改原始文件，只生成代理、缓存和输出目录。

### 23.2 当前人物口播素材基线

仓库测试包使用 `segment-01.mp4` 至 `segment-18.mp4` 的原始顺序作为第一套人物口播素材。它们具有统一人物、服装、背景和技术规格，但镜头距离、动作和道具存在变化，适合验证人物口播拼接、字幕、前后景动效、Cutaway、遮挡、跳切处理和音频衔接。

分层使用：

#### Smoke Test

使用 `segment-01` 至 `segment-06`，验证：

- 批量导入、哈希、ffprobe 和代理；
- 原顺序拼接；
- FunASR 转写；
- 静音裁切和音频平滑；
- PresenterScene；
- 稳定字幕；
- 一个 Rear FX、一个 Front FX、一个 Cutaway；
- Remotion 预览和基础导出。

#### Full Presenter E2E

使用全部 18 段，验证：

- 约三分钟项目的 Scene、Timeline、Revision 和缓存；
- 不同景别之间的跳切；
- 道具出现时的前景效果避让；
- 近景画面的字幕和人物安全区；
- 多轮 Codex 修改；
- 视觉效果密度曲线；
- 局部预览和最终导出。

#### Negative / Quality Test

- `segment-13` 用于验证明显人物/头发生成异常能否被 Quality Critic 标记，或能否通过 Cutaway、替换片段和缩短范围修复；
- `segment-16` 用于验证尾部缺少安全静音时，系统不会过度裁切音节，并能报告音频边界风险；
- 近景片段用于验证字幕、前景产品和 CTA 不遮挡眼睛、嘴和面部；
- 带书本道具的片段用于验证物体和效果层之间的遮挡与空间冲突。

这套素材可以作为第一版主要 E2E 素材，但不能单独覆盖视觉解释片和 Vlog。

### 23.3 参考视频如何进入工程

参考视频不是运行时可随意复用的 B-roll，也不直接拆成产品素材。它应被转换为“设计规范和测试基准”：

```text
docs/references/<reference-name>/
├─ reference-analysis.md        秒级拆解、语义事件和动效时机
├─ scene-map.json               Scene Type、时间范围和内部递进
├─ motion-cue-map.json          进入、稳定、退出和语义锚点
├─ style-pack.md                字体、颜色、字幕、构图和运动语言
├─ component-mapping.md         对应 Remotion Scene / Effect Type
└─ frame-samples/               仅用于内部分析的关键帧
```

项目根据拆解结果重新实现 Remotion Scene、Effect Registry 和 StylePack。Golden Test 比较的是本项目重建场景的固定帧，不把原参考视频画面复制到最终成片中。若参考视频仅用于内部研究，必须标记 `reference_only`，不能被 Asset Resolver 自动选入正式 Timeline。

### 23.4 视觉解释片固定测试包

建立一条 60～90 秒固定测试脚本，必须包含：

- 强数字 Hook；
- 对比；
- 三项分类；
- 因果或流程；
- 一份真实来源文件；
- 一个 UI 场景；
- 一个图表；
- 一个现实 B-roll；
- 总结。

固定资产包中提供：文档截图、UI 数据、图表数据、2～4 条本地 B-roll、图标和一套 StylePack。它用于验证视觉叙事和 Remotion，不依赖实时联网。

验收：

- 大场景持续且内部递进；
- 小视觉事件与语义同步；
- 解释、证据和现实素材交替；
- 一次只有一个主动作；
- 字幕不与主视觉竞争；
- 所有证据可追溯；
- 缺失素材有明确降级，不静默使用错误镜头。

### 23.5 Vlog 固定测试包

使用已有的猫咪原素材、游泳原素材和 Tim O’Reilly 访谈原素材建立三类测试：

- 猫咪：事件发现、动作连续、角色与情绪、镜头去重；
- 游泳：高速动作、镜头连续性、音乐节拍、环境声和慢动作；
- Tim O’Reilly 访谈：长素材转写、语义选择、完整观点和 B-roll/Cutaway。

Vlog 验收重点：故事清楚、镜头不重复、环境声自然、音乐不过度、MG 克制、人物和事件连续。

### 23.6 外部素材搜索测试

外部搜索使用四种运行模式：`deterministic_test`、`staging_live`、`production` 和 `offline`。CI 只使用第一种；真实 Provider 只能在显式开启的 Staging/Production 运行。

#### CI 契约测试

- 使用 MockAssetProvider 和固定 Provider Response；
- 测试 AssetRequest → SearchIntent → AssetCandidate → Acquire → AssetProvenance → Scene；
- 验证联系表、短预览、硬过滤、软评分和候选去重；
- 模拟无结果、限流、来源不明、rightsStatus 阻塞、下载 URL 过期、HTML 错误页伪装、文件损坏、重复文件和时长不足；
- 验证 unknown / blocked / reference_only 无法进入导出 Revision；
- 验证 AttributionManifest；
- 禁止访问真实网络。

#### Staging 联网 E2E

- 允许 Codex 调用 `search_media_candidates`；
- 使用固定 AssetRequest 和来源策略；
- 分别验证 PexelsProvider、PixabayProvider 和 WebEvidenceProvider；
- 首次成功导入后缓存 SearchIntent、原始响应、候选预览、本地 Asset 和 Provenance；
- 后续回归优先使用缓存，不要求实时搜索结果顺序完全一致；
- 人工检查语义相关性、动作、构图、许可、水印、作者和署名；
- Staging 结果不能自动写入 Golden，必须先经过人工批准。

#### 生成降级测试

- 搜索返回空结果后调用 `generate_media_asset`；
- 固定 MiniMax 提示词、参考图、工作流和随机种子；
- 验证生成素材带 `generated=true`、workflowVersion、seed 和 Prompt 摘要；
- 验证证据型 AssetRequest 禁止转入生成；
- 将首次通过人工审核的输出冻结为测试 Fixture；
- 后续 CI 不重复在线生成，只测试任务合同、缓存复用和 Scene 替换。

#### 当前读书口播固定 AssetRequest

第一版 Presenter E2E 至少冻结以下需求：

| ID | 语义 | 预期策略 | CI 固定结果 |
|---|---|---|---|
| `book-city-sea` | “去看陌生的城市和海” | 搜索现实 B-roll | 城市旅途 + 海边两条候选，选中一条 |
| `book-future` | “所谓的以后越来越远” | Remotion 优先 | 不调用外部 Provider |
| `book-pause-sky` | “停下来问问自己的心” | Stock，失败时 MiniMax | MockProvider 返回空，验证生成降级 |
| `book-daily-life` | “看天、吃饭、睡觉” | 多个生活 B-roll | 候选去重与多样性检查 |
| `book-reading-walk` | “安静下午读书散步” | Stock | 窗边阅读或慢步行镜头 |
| `book-final` | 最终祝愿 | Presenter + Remotion | 不搜索外部素材 |

验收：

- 至少两个 AssetRequest 通过 Stock Candidate 满足；
- 至少一个 Request 明确选择 Remotion，不进行无意义搜索；
- 至少一个非证据 Request 在无结果时通过 MiniMax 降级；
- 所有正式素材已本地化并具有 Provenance；
- 重新运行 Fixture 得到稳定的选择和覆盖结果；
- 替换单个 B-roll 只使对应 Scene / Dirty Range 失效。
### 23.7 单元测试

- SemanticUnit 合并；
- Script Compiler；
- Frame/Timebase；
- Scene 和 Cue 校验；
- Anchor 传播；
- ImpactReport；
- Dirty Range；
- Revision 冲突；
- Attention Curve；
- AssetRequest 校验；
- SearchIntent 编译、缓存键和查询去重；
- AssetCandidate 硬过滤、排序和近似去重；
- rightsStatus 状态机；
- Provenance 与 AttributionManifest 完整性；
- Provider 限流、缓存和退避；
- 搜索、Remotion 和 MiniMax 降级策略；
- Asset Coverage 计算。

### 23.8 契约测试

- Web API 和 MCP 调用同一 Handler；
- Browser Operator 的对象定位、表单操作和 Revision 读回；
- MCP Schema；
- ComfyUIBridgeClient：workflow detail、multipart、轮询、409 刷新和输出下载；
- FunASRService、OmniVoiceSegmentService 与 SpeechAssembler；
- SegmentTiming、局部重生成和拼接偏移；
- Avatar Integration；
- Project/Creative/Pexels/Pixabay/WebEvidence/MiniMax/Mock Provider Contract；
- Provider 缓存、限流、候选刷新和错误归一化；
- Asset 下载、MIME、文件头、哈希、ffprobe、本地化和 Provenance；
- AttributionManifest 与 Export Gate；
- Media Worker；
- Remotion Composition Snapshot；
- Job 状态和对账。

### 23.9 视觉 Golden Test

每个 Scene/Effect 保存：

- 进入帧；
- 稳定帧；
- 退出帧；
- 横屏和竖屏样例；
- 字幕安全区样例；
- 人物遮挡样例；
- 搜索素材与生成素材的来源标识样例。

视觉差异超过阈值时要求人工复核。

### 23.10 数字人口播验收脚本

固定脚本必须包含：

- 数字里程碑；
- 产品或实物；
- CTA；
- 历史内容；
- 评论；
- 幽默包袱；
- 证据截图；
- 未来计划；
- 结尾入口。

验收：

1. 完整任务经过 `production-director → presenter-motion-director`，专项结果能够返回主工作流；
2. 效果全部对齐语义；
3. 人物动作不与效果冲突；
4. 后景遮挡正确；
5. 前景不挡脸和字幕；
6. 有高低密度变化；
7. 字幕稳定；
8. Cutaway 衔接自然；
9. 至少两条外部 B-roll 通过受控检索、本地化和 Provenance 进入项目；
10. 至少一个无结果需求按策略选择 Remotion 或 MiniMax，且生成资产不冒充证据；
11. 外部素材真实相关，rightsStatus、作者、来源和署名可读回；
12. 风格统一，连续镜头不呈现廉价 Stock 拼盘感；
13. Codex 可通过 Web 或 MCP 局部替换素材并验证 Dirty Range。

### 23.11 Skill 路由与交接测试

#### 静态路由测试

- 完整人物口播请求必须路由到 `production-director → presenter-motion-director`；
- 完整视觉解释请求必须路由到 `production-director → visual-explainer-director`；
- 完整 Vlog 请求必须路由到 `production-director → vlog-director`；
- 只调整字幕、声音、B-roll 或单个 Remotion Scene 时，可以直接进入对应专项 Skill；
- 混合视频必须只有一个主要工作流，第二工作流只在对应 Scene 范围参与；
- 主工作流引用的专项 Skill、Reference 和 MCP 工具必须真实存在；
- `.codex/config.toml` 中登记全部 Skill 不得被测试解释为一次任务必须全部加载。

#### 专项交接测试

每个专项 Skill 至少验证：

```text
读取了正确的当前 Revision 与输入对象
→ 生成了明确项目对象或可执行决定
→ ImpactReport / stale 范围符合预期
→ 主工作流能够继续使用该结果
→ 对应结构、画面或声音完成验证
```

重点场景：

- Script 修改后，SpeechAsset、Caption、EffectCue 和 Cutaway 的失效关系清楚；
- Visual Treatment 完成后，Remotion 与素材获取不会各自重新猜一次视觉策略；
- B-roll 搜索完成后，`cutaway-planning` 仍负责是否使用、时长和返回人物；
- `quality-verification` 的问题能返回正确负责人；
- `SkillExecutionReport` 缺失时项目仍可编译、预览和导出；
- 只有 `loadedSkills` 而没有上述交接结果时，测试必须失败。

#### 真实视频路由验收

《快乐的死》人物口播 E2E 必须保存：

- 主要工作流为 `presenter-motion-director`；
- 实际使用的专项 Skill 和每个阶段产物；
- 至少一项被拒绝的无关视觉方案；
- 至少一段明确安静区；
- 主线、包装和质量问题的回退记录；
- 最终 Preview、Editorial Review 和 ExportArtifact。

真实验收比较“没有完整主工作流统领”和“由主工作流统领”的版本，重点观察主线连贯、动效选择、安静区、B-roll 相关性、字幕、声音和整片完成度。

### 23.12 从项目结构到交付的证据矩阵

每条端到端测试都应分别证明：

1. 项目对象已经写入并能读回；
2. 受影响范围的真实合成画面已经检查；
3. 最终文件实际生成并通过技术校验；
4. 需要交付的样本完成完整声音和画面审片。

不能用以下替代关系：

- `MCP success` 代替项目读回；
- 单张关键帧代替连续运动和完整节奏；
- Export Job `succeeded` 代替最终文件可用；
- 文件可播放代替“剪得好”。

阶段 1 的 Presenter 样本至少保留一份完整 `ExportArtifact + Editorial Review`；后续 Explainer 和 Vlog 也使用同一证据矩阵。

---

## 24. 风险与降级策略

### 24.1 主要风险

#### 数字人无法输出 Mask

降级顺序：

1. Provider 透明背景；
2. 纯色背景抠像；
3. 人像分割；
4. 无后景效果，只使用前景和 Cutaway。

#### 数字人手势不可控

Visual Director 读取 Capability 后，只选择兼容效果。不能假设所有数字人都能精准指向。

#### Scene 与 Timeline 双状态

通过同一 Revision、原子更新、Scene 归属和 `direct_override` 解决，禁止两套数据库分别保存。

#### Remotion 性能

使用代理素材、场景级缓存、Dirty Range、异步 Worker，不整片反复渲染。

#### 模板化严重

通过：

- Scene Type 和 StylePack 分离；
- Visual Treatment；
- Attention Curve；
- Quality Critic；
- 证据和真实素材优先；
- 禁止每句话套模板。

#### 外部搜索不可复现、Provider 变化和素材权利不清

风险包括：搜索排序变化、Candidate URL 过期、Provider 限流或下线、接口路径变化、许可条款变化、素材被删除、作者信息缺失、同一文件在不同来源出现不同许可，以及版权以外的商标、肖像和隐私限制。

处理原则：

- 实时搜索只用于 Staging/Production，不成为 CI 依赖；
- 所有远程结果先成为 AssetCandidate；
- 查询响应、候选元数据和许可说明保存快照；
- 正式使用素材必须下载到本地并计算哈希；
- Provider 规则集中在 Adapter 和 `docs/asset-sourcing/`，不散落到业务代码；
- unknown、blocked、reference_only 不能进入可导出 Revision；
- 无法确认来源时降级为用户确认、其它开放来源、Remotion 解释场景或带生成标记的 MiniMax 资产；
- 已使用素材的权利状态变化时保留历史 Revision，但阻止新的受影响导出并提示替换；
- 定期复核 Provider 官方文档、限流和许可要求。

#### 单一 `ready` 状态掩盖真实能力边界

素材已登记、可转写、可上 Timeline、当前渲染链可读和权利允许交付是不同条件。通过 `AssetReadiness` 和导出前 Render Preflight 解决；不能因为某个同名 Asset 在另一个版本可用，就推断当前 Timeline 的实际引用也可渲染。

#### 项目结构正确被误判为交付完成

Timeline、字幕和 EffectCue 已读回，只能证明可编辑状态。局部预览、最终 Artifact 和完整声画审片必须分别验证。正式导出不得因为 Job 成功而自动标记为用户已批准。

#### 主线变化后包装对象过期

字幕、MG、B-roll、SFX、BGM 和绝对时间效果具有不同锚点。通过 ImpactReport 的“重算、保持、stale、复核”策略处理，禁止统一 ripple，也禁止悄悄保留已失去语义关系的包装。

#### 当前 API 没有词级时间

FunASR 只返回文本，OmniVoice 只返回音频。第一版通过 SpeechSegment 分段生成和真实音频时长建立 `segment_exact` 时序，并在 Web 预览中微调需要更精确的效果。不得用按字数平均分配的方式伪造 WordTiming。未来只有在真实时间戳能力接入后，才开启逐词高亮和严格句中卡点。

#### 分段 TTS 的连贯性

SpeechSegment 过短会导致语气割裂，过长又会失去局部重生成和效果锚点优势。Speech Plan 必须使用完整语义、自然停顿和统一语气参数；SpeechAssembler 只允许轻量衔接，不靠大幅交叉淡化掩盖不自然语音。

#### 商业依赖

Remotion、数字人 Provider 和生成模型在正式商业发布前必须完成独立许可与成本评估。领域模型不得绑定单一 Provider。

---

## 25. 开发纪律

1. 先实现完整垂直闭环，不先铺几十个空接口；
2. 任何能力必须有：输入、状态、写入、读回、预览、质量验证；
3. MCP `success: true` 不等于功能完成；
4. Web 和 MCP 不得复制业务逻辑；
5. Skills 不得保存状态；
6. Codex 不得手算和持有大量绝对帧；
7. Remotion 不得承担创作判断；
8. Python Worker 不得直接修改 Project；
9. 任何自动重编译不得覆盖锁定对象、已批准 Scene 或显式 `direct_override`；
10. 远程 URL、搜索缩略图和许可未知素材不得进入正式 Scene；
11. 证据、现实素材、生成素材和参考素材必须使用不同 Asset 类型和 Quality Rule；
12. 新需求先判断属于 Story、Scene、Timeline、Asset Acquisition、Runtime 还是 Quality，不随意塞进大 Pipeline；
13. Skill 引用的工具、Registry 和当前能力发生变化时，代码与 Skill 必须在同一个 PR 中更新；
14. `Job succeeded`、项目结构读回、局部预览、最终 Artifact 和完整审片必须分别报告；
15. ChatCut 调研中的实测、合同、推断和未验证结论必须保留证据等级，不把解释性抽象直接复制成领域对象；
16. 完整视频生产必须只有一个主要工作流负责人，不能由多个平级专项 Skill 临时相加后无人收口；
17. 专项 Skill 必须声明输入、输出、下游失效和验证证据，完成后结果回到主要工作流；
18. `.codex/config.toml` 中登记 Skill 只代表可发现，不能把“全部登记”实现成“每次全部加载”；
19. 新增或重写 Skill 时优先补完整生产手册和交接关系，不以文件数量、标题数量或关键词覆盖率作为完成标准。

---

## 26. 第一版完成定义

第一版不是“能导出视频”，而是必须完成以下闭环：

```text
创建项目
→ 导入 Script、参考声音和人物素材
→ 将 Script 编译为语义完整的 SpeechSegments
→ 服务端直接调用 OmniVoice API 逐段生成
→ 下载并校验 SegmentAssets
→ 拼接 SpeechAsset，并生成 segment_exact SpeechTiming
→ Codex 读取 project-basics 与 production-director
→ production-director 选择 presenter-motion-director 作为主要工作流
→ presenter-motion-director 按阶段调用专项 Skills，并规划 Story、AttentionCurve、视觉、字幕和声音
→ 为现实 B-roll、证据和说明画面创建 AssetRequest
→ 自动查询项目素材、Creative Library、Pexels/Pixabay 和 Web Evidence
→ Codex 复核 Candidate，下载并注册本地 Asset；无结果时按策略使用 Remotion 或 MiniMax
→ 通过 MCP 创建 PresenterScene、EffectCue 和 Cutaway
→ Remotion 在 ChatCut 式 Web 工作台中真实预览
→ Codex 通过 MCP 或 Browser Operator 修改
→ 每次修改产生 Revision 和 ImpactReport
→ Quality System 检查语义、语音、动效、遮挡、字幕和节奏
→ 局部修改并重新预览
→ 对指定 Revision 运行 Render Preflight
→ 导出指定 Timeline / Sequence 与 Revision
→ 读取实际 ExportArtifact，完成时长、音轨、解码和黑帧检查
→ 完整播放和试听，记录绑定该 Artifact 的 Editorial Review
→ 批准后仍可继续创建新 Revision 或平行版本
```

同时满足：

- Web、Codex 和 MCP 操作同一个项目；
- 完整人物口播由一个 `presenter-motion-director` 主工作流从主线负责到交付，专项 Skills 有明确交接，不再依赖多个平级小 Skill 临时拼装；
- FunASR 和 OmniVoice 只通过 `docs/asr接入.md` 定义的 Bridge HTTP API 调用；
- 不存在伪造的远端 Voice Profile、隐含的词级时间或默认对齐服务；
- 人物前景、后景、Cutaway 和字幕关系正确；
- 动效由语义和 SpeechSegment 边界触发；
- 有安静区和效果密度变化；
- 用户不需要提供全部空镜，Codex 能通过 Asset Acquisition System 自动搜索、筛选、本地化、替换和生成降级；
- 外部素材具有 AssetRequest、Candidate、rightsStatus、Provenance 和 AttributionManifest 闭环；
- Web 具备素材库、候选搜索、来源/许可、文字稿、Scene、预览、Inspector、Timeline、Jobs/QC/Revision 完整工作区；
- 不是模板贴纸集合，也不是无关 Stock 拼接；
- 后续可无破坏地增加 word_exact、ExplainerScene 和 VlogMontageScene；
- 同一个 Project 可以安全保留长版、短版或横竖版等平行 Timeline，而不会混入同一条 Revision 历史；
- 项目结构、局部预览、最终 Artifact 和完整声画审片四级证据可分别读回。

## 27. 最终架构摘要

项目核心链路是：

```text
Creative Brief
→ Story / Semantic Units / SpeechSegments
→ project-basics + Production Director（Codex）
→ Presenter / Explainer / Vlog 主要工作流 Skill
→ 按阶段调用的专项 Skills
→ ComfyUI Bridge（FunASR 文本 / OmniVoice 分段语音）
→ SpeechAsset Assembly + segment_exact SpeechTiming
→ Avatar 与 Visual Treatment
→ Asset Acquisition（Local / Creative / Stock / Evidence / MiniMax）
→ 本地 Asset + Provenance
→ Presenter / Explainer / Vlog Director
→ Scene + Motion Cue + Asset
→ Timeline Revision
→ Remotion Preview
→ Render Preflight
→ ExportArtifact 技术校验
→ Quality Report + 完整声画审片
→ 局部修改、批准和持续迭代
```

统一部分：

```text
Project
StoryDocument
SceneDocument
TimelineDocument
Revision
AssetLibrary
Asset Acquisition System
AssetProvenance / AttributionManifest
StylePack
video-editor-mcp
Browser Operator
ChatCut 式 Web 工作台
Remotion Runtime
Quality System
```

差异部分：

```text
主要视频工作流 Skill
主时间轴驱动方式
专项 Skill 的调用组合
Scene Type
Effect Type
素材选择策略
质量判断规则
```

V6.2 相对 V6.1 只调整 Skills 编排：

```text
平级 Skill 列表
→ project-basics 公共合同
→ production-director 总路由
→ 一个主要视频工作流负责完整闭环
→ 专项 Skill 按阶段提供深度
→ quality-verification 统一收口
```

该调整发生在 Codex 与 Skills 层，不改变 Editing Application、MCP、Story、Scene、Timeline、Revision、Remotion、Job 或 Quality 的技术组件边界。

本版相对 V6 的新增边界集中在：

```text
素材不是一个笼统 ready
主线稳定后再编译包装
时间线位置与编辑事件位置分开
新会话必须从项目事实恢复
项目结构、局部预览、最终文件和完整审片分级验证
平行成片版本不混入同一 Revision 历史
```

这些是对原架构的补充，不改变 Codex、Skills、MCP/Web、Editing Application、Remotion、Job 和 Quality 的组件关系。

项目第一优先级应是：

> 先把“FunASR 直接 HTTP 文本转写 + OmniVoice 直接 HTTP 分段语音合成 + SpeechAsset 段级时序 + 数字人口播 + 人物前后景动效 + 自动联网搜索和本地化 B-roll + Remotion/MiniMax 降级 + 全屏解释场景 + 稳定字幕 + Codex 自动操作 ChatCut 式 Web/MCP”做成高质量完整闭环，再扩展真实词级时间、完整视觉解释片和 Vlog。
