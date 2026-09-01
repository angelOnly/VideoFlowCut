# AI 视频创作与剪辑平台：架构与开发方案

> 文档状态：V4 API 接入与 Web 工作台开发基线  
> 核心方向：数字人口播 + 人物前后景 Remotion 动效 + 全屏视觉解释场景，并在同一工程内支持视觉解释片、Vlog 与混合视频  
> 工程约定：所有模块直接按本架构实现；项目状态由 Editing Application 统一持有；Codex 通过项目 Skills、统一 MCP 与浏览器操作完成视频生产；项目内 `docs/` 是实现外部能力和吸收 ChatCut 方法的必读资料

---

## 1. 文档目标

本文档用于直接指导项目开发，明确以下内容：

1. 产品中心、工程内核和完整生产链路；
2. 数字人口播、视觉解释片、Vlog 与混合视频如何共用一个工程；
3. Story、Scene、Timeline、Remotion 各自负责什么；
4. Codex、`.agents/skills`、`video-editor-mcp` 与 Web 工作台如何协同；
5. 哪些模块为内容质量、剪辑节奏和视觉效果负责；
6. FunASR、OmniVoice 如何由服务端直接调用 ComfyUI Bridge HTTP API，以及段级语音时序、数字人和 Remotion 如何协同；
7. Revision、EditTransaction、ImpactReport、局部预览和质量验证怎样闭环；
8. 开发阶段、模块边界、工具职责和验收标准。

本文档确定的是产品架构、领域边界、调用关系和质量闭环，不提前固定数据库字段或逐文件代码实现。具体类名和字段可以在编码中调整，但不得破坏以下原则：

- 项目状态只有一个事实源；
- Story、Scene、Timeline 和 Preview 使用同一个 Revision；
- Web、MCP 和后台 Worker 不重复实现业务规则；
- Codex 做创作判断，Application 做确定性执行，Remotion 做表现与合成；
- 所有自动生产结果必须可读回、可预览、可验证、可继续修改。

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
└─ asr接入.md
   └─ ComfyUI-AppApi Bridge、FunASR、OmniVoice 及相关工作流 HTTP API
```

开发时的读取要求：

- 开发 Web 工作台前，至少读取：
  - `docs/chatcut视频剪辑工具拆解/01-产品全景与核心结论.md`；
  - `docs/chatcut视频剪辑工具拆解/08-实测记录浏览器验证与字段样例.md`；
  - `docs/chatcut视频剪辑工具拆解/11-Codex、ChatCut MCP 与 Web 编辑器交互链路.md`；
  - `docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/` 中与 UI、文字稿、素材库、Timeline 和验证相关的资料；
- 编写项目 Skills 前，读取 `docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/`，提取方法、顺序、禁止行为和退出条件；
- 接入 FunASR 或 OmniVoice 前，读取 `docs/asr接入.md`，以运行时工作流详情接口返回的 `schemaVersion`、`fields`、`itemSlots` 和 `outputs` 为准；
- `docs/asr接入.md` 中的示例版本号和字段 ID 只用于说明，不得作为长期硬编码合同；
- ChatCut 资料用于复用产品方法和交互逻辑，不直接复制其品牌、服务端字段或运行时工具名。

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
3. 实现 FunASR、OmniVoice 或其它 HTTP 服务 前先读 `docs/` 中对应 API 文档；
4. 不把 Skill 写成数据库、业务状态或 MCP 实现；
5. 完成开发后运行模块测试、契约测试和相关端到端样例。

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
│ 读取 AGENTS.md 与 .agents/skills                             │
│ 选择 Presenter / Explainer / Vlog 工作流                     │
│ 做内容、节奏、视觉和质量判断                                  │
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
│ External HTTP   │ │ Director &      │ │ Persistence & Jobs   │
│ Integration     │ │ Compiler Layer  │ │                      │
│                 │ │                 │ │ SQLite / Snapshots   │
│ ComfyUI Bridge  │ │ SemanticBuilder │ │ Job Queue / Outbox   │
│ ├─ FunASR       │ │ StoryCompiler   │ │ Asset / Cache        │
│ └─ OmniVoice    │ │ SceneCompiler   │ │ Preview / Export     │
│ Avatar API      │ │ Timing / Impact │ │                      │
│ FFmpeg / Vision │ │                 │ │                      │
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

它不是一个独立保存项目状态的 Agent 服务。聊天可以结束，但项目状态、任务状态和创作结果必须完整保存在 Editing Application 中。

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

### 13.3 五类语义和时间锚点

```text
source_time
绑定源素材时间

timeline_absolute
绑定成片绝对帧，例如片头 Logo

item_relative
绑定某个 Item 内部位置

semantic_span
绑定某个 SpeechSegment、观点、数字、笑点或 CTA

sequence_global
绑定整条片或章节，例如 BGM
```

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
| Caption 绑定 SpeechSegment | 按新 SegmentTiming 重新排布 |
| EffectCue 绑定仍存在的语义 | 自动重定位到新的段边界或保留已确认偏移 |
| EffectCue 对应语句被删除 | 标记 stale |
| SpeechSegment 文本变化 | 只重生成对应 SegmentAsset，并重算后续偏移 |
| 人物手势锚点变化 | 重新检查空间位置 |
| Cutaway 绑定句子 | 重新定位或失效 |
| BGM 绑定整条 Sequence | 重算裁切、循环和淡出 |
| 绝对时间效果 | 保持，但产生复核警告 |

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

- 项目视频、音频、图片、文档、数字人、SpeechAsset 和 Derived Asset；
- 上传、导入、搜索、标签和类型筛选；
- 缩略图、时长、分辨率和可用状态；
- 代理、波形、FunASR、OmniVoice、Avatar、生成素材的 queued/running/failed 状态；
- 失败原因与重试入口；
- 拖入 Scene 或 Timeline；
- 生成中的素材完成后直接出现在素材库，而不是另建一个“生成结果页面”。

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
- FunASR、OmniVoice、Speech Assembly、Avatar、Derived Asset、Preview、Export Job；
- schemaVersion 冲突、run_id 丢失、输出缺失和下载失败；
- Revision 列表、修改摘要、比较、回退和 Marker。

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
Agent：决定为什么这样剪
Skill：规定应该怎样完成这种任务
MCP：提供确定性项目读写能力
Application：保证状态和规则正确
Remotion：表现和导出
```

Skill 不保存项目状态，不替代 MCP，不包含数据库实现。

每个 Skill 应包含：

- 触发条件；
- 前置读取；
- 必须执行的步骤；
- 禁止行为；
- 验证方式；
- 退出条件。

### 16.2 推荐 Skills 结构

```text
.agents/skills/
├─ production-director/
├─ project-basics/
├─ web-editor-operator/
├─ asset-import/
├─ transcription/
├─ voice-production/
├─ semantic-continuity/
├─ presenter-motion-director/
├─ avatar-performance/
├─ visual-treatment-planning/
├─ effect-timing/
├─ depth-composition/
├─ cutaway-planning/
├─ visual-explainer-director/
├─ scene-planning/
├─ evidence-visualization/
├─ vlog-director/
├─ captions/
├─ audio-finishing/
├─ remotion-production/
├─ quality-verification/
├─ export/
└─ known-errors/
```

### 16.3 Skill 详细职责

#### `production-director`

触发：创建新视频、整片自动生产、跨模式混合制作。

必须：

- 读取 CreativeBrief 和当前 Revision；
- 判断默认生产模式；
- 选择 Presenter、Explainer 或 Vlog Director；
- 决定是否混合 Scene Type；
- 控制先后顺序；
- 不得在“Timeline 已生成”时提前结束；
- 必须经过 Preview 和 Quality Verification。

退出条件：Codex 已完成 Web 预览验证，用户可查看结果，且阻塞级质量问题清零。

#### `project-basics`

触发：任何项目读写任务。

必须：

- 先 target_project；
- 读取当前 Revision；
- 区分 Asset、Scene、Item、EffectCue；
- 所有写入携带 base revision；
- 写后读回。

禁止：把 Codex 聊天当项目状态。

#### `web-editor-operator`

触发：需要在 Web 工作台完成空间调整、Timeline 操作、Inspector 修改、Revision 对比或真实画面验证。

必须：

- 通过 `get_editor_url` 或 `focus_editor_object` 打开精确对象；
- 操作前读取当前 Revision 和选中对象；
- 只使用稳定的可访问名称、`data-testid`、对象 ID 和明确表单；
- 完成写操作后读取新 Revision；
- 检查 Preview、Inspector 值和 QualityReport；
- MCP 已提交同一修改时，不得在 Web 再次重复提交。

退出条件：目标对象已产生预期变化，Revision 已更新，实际画面和项目状态均验证通过。

#### `asset-import`

触发：用户要求上传、导入或引用素材，或 Codex 发现项目缺少所需素材。

必须：

- 检查重复；
- 跟踪上传和分析状态；
- 区分上传完成、代理完成、ASR 完成；
- 不让未就绪素材进入正式 Scene。

#### `transcription`

触发：口播、采访、素材理解，或需要核对生成语音文本。

必须先读取 `docs/asr接入.md`，并按照当前 FunASR HTTP 工作流执行：

- 获取最新 workflow detail；
- 上传音频并创建 Run；
- 轮询到 `succeeded` 或 `failed`；
- 从 `kind=text` 输出读取 TranscriptText；
- 不伪造 Segment、Token 和 WordTiming；
- 将完整文本交给 SemanticUnit Builder；
- 需要粗粒度时间时，先由本地 VAD 切出有真实源时间的 TranscriptChunk，再分别调用 FunASR；
- 区分 TranscriptText、TranscriptChunk、SemanticUnit、最终 Script、SpeechSegment 和 Caption。

禁止：声称当前 FunASR API 已返回词级时间，或把按字数估算的时间写成精确时间。

退出条件：TranscriptText 已保存；需要时 TranscriptChunk 可读取；SemanticUnit 可用；失败原因可诊断。

#### `voice-production`

触发：使用参考声音合成旁白、替换旁白或重新生成局部语音。

必须：

- 读取 `docs/asr接入.md`；
- 使用一个 VoiceReference 和明确的 Script Revision；
- 先将 Script 编译为语义完整的 SpeechSegments；
- 每个需要生成的 Segment 直接通过 OmniVoice HTTP 工作流提交“参考音频 + 当前段文本”；
- 不建立不存在的远端 VoiceProfile；
- 不拆成独立 VoiceCloneJob 和 TTSJob；
- 下载并校验每个 `kind=audio` 输出，保存 SpeechSegmentAsset；
- 使用 ffprobe 获取真实时长；
- 组装最终 SpeechAsset，并生成 `segment_exact` SpeechTiming；
- Script 局部变化时只重生成受影响 Segment；
- 可选使用 FunASR 回听核对文字，但不得据此伪造词级时间；
- 失败后按 HTTP 状态、Bridge 状态、输出完整性和文本一致性决定重试或终止。

退出条件：SpeechAsset 可播放、与 Script Revision 一致；全部 Segment 边界和质量状态可读回。

#### `semantic-continuity`

触发：任何语音删改、重排、A-roll 或 TTS Script 修改。

必须检查：

- 半句话；
- 悬空转折词；
- 主语缺失；
- 代词无指向；
- 列表断裂；
- 原因被删、只剩结论；
- 不同重录误拼接。

退出条件：最终听到的文本语义完整，并通过实际音频切口检查。

#### `presenter-motion-director`

触发：真人或数字人持续口播，并需要人物前后景动效。

执行顺序：

```text
读取 Script 和 Actor Capability
→ 划分 Narrative Beat
→ 设计 Attention Curve
→ 联合规划人物表演和视觉效果
→ 生成或读取 ActorPerformance
→ 创建 PresenterScene
→ 添加 EffectCue 和 Cutaway
→ 局部预览
→ 质量复核
```

禁止：每句话固定加效果；先做完数字人再无脑套模板。

#### `avatar-performance`

触发：生成、替换或修复数字人物表演。

必须：

- 检查 Provider Capability；
- 确定手势、表情、透明背景和局部重生成能力；
- 消费 SpeechAsset，并校验其 Script Revision；
- 复用最终 SpeechAsset 的 segment_exact SpeechTiming；
- 输出人物蒙版或明确降级策略；
- 人物动作与 Visual Treatment 协同。

#### `visual-treatment-planning`

触发：需要规划整条视频的视觉处理。

必须为每个 Beat 决定：

- 新 Scene；
- 当前 Scene 内增加对象；
- 前景、后景、人物效果或全屏；
- 使用证据、解释、现实素材或保持安静；
- 是否超过 Attention Curve 允许密度。

#### `effect-timing`

触发：创建或调整 MotionCue。

必须：

- 读取 SpeechSegment 与 SpeechTiming 精度；
- 优先绑定段首、段尾、段间停顿或 Scene 边界；
- 只有存在真实 `word_exact` 时才创建严格逐词卡点；
- 需要命中句中关键词时，先判断能否自然调整 SpeechSegment 边界；
- 不能自然分段时，生成候选相对偏移并在 Web 真实预览中微调；
- 计算进入、稳定、退出；
- 控制同时主动作数量；
- 写后预览关键帧和局部视频。

#### `depth-composition`

触发：效果需要位于人物前后或绑定身体区域。

必须检查：

- 人物蒙版；
- 头部、嘴、手和字幕安全区；
- 前后景遮挡；
- 横竖屏适配；
- 同一时刻是否有多个视觉中心。

#### `cutaway-planning`

触发：需要全屏 UI、B-roll、证据、梗图或解释场景。

必须：

- 说明 Cutaway 的叙事目的；
- 选择自然句子边界；
- 保证口播连续；
- 控制持续时长；
- 进入和退出后人物场景能自然恢复。

#### `visual-explainer-director`

触发：旁白驱动的知识解释片，或数字人口播中的全屏解释段。

执行：

```text
Narrative Map
→ Scene 分段
→ 场景语法选择
→ Asset Resolver
→ Motion Cue
→ Remotion Preview
→ Visual QC
```

#### `scene-planning`

触发：需要新增或重构 Scene。

必须：

- 先明确场景解决什么信息任务；
- 选择 Scene Type；
- 决定哪些句子共享一个场景；
- 设计场景内部递进；
- 不把完整场景拆成大量互不相关贴纸。

#### `evidence-visualization`

触发：法规、论文、投诉、网页、报表、截图。

必须：

- 保存来源；
- 不伪造内容；
- 页面先建立，再高亮；
- 给足阅读时间；
- 不用高密度动画干扰证据阅读。

#### `vlog-director`

触发：素材驱动的实拍故事。

必须：

- 镜头质量和事件聚类；
- 故事结构；
- 镜头连续性；
- 环境声；
- 音乐节奏；
- 少量必要 MG。

禁止：用大量模板动效掩盖镜头选择不足。

#### `captions`

触发：生成或修改字幕。

必须区分：

- 时间准确性；
- 文案准确性；
- Card 切分；
- 样式和布局。

人物动效丰富时优先稳定字幕。

#### `audio-finishing`

触发：主线稳定后的声音处理。

必须：

- 主声音是 Anchor；
- SFX 绑定编辑事件；
- BGM 绑定章节或全片；
- 检查音频切口；
- Duck、淡入淡出和结尾裁切。

#### `remotion-production`

触发：创建或修改 Remotion Scene/Effect。

必须：

- 优先使用注册组件；
- 使用 StylePack；
- 不直接执行未审查代码；
- 生成后预览进入帧、稳定帧和退出帧；
- Web 与导出使用同一 Snapshot。

#### `quality-verification`

触发：每次关键 Revision、导出前。

必须进行：

- 结构检查；
- 实际合成画面检查；
- 音频检查；
- 模式专项检查；
- 阻塞问题与建议问题分级。

#### `export`

触发：用户明确要求交付。

必须：

- 绑定具体 Revision；
- 异步提交；
- 跟踪完成；
- 校验文件、时长、音轨和黑帧；
- 导出不覆盖项目。

#### `known-errors`

负责统一处理：

- Revision 过期；
- 素材未就绪；
- Avatar Job 失败；
- 人物 Mask 缺失；
- Scene 构建失败；
- 浏览器解码失败；
- Remotion 渲染失败；
- 异步任务结果未知；
- Bridge workflow unavailable；
- schemaVersion 409 冲突；
- ComfyUI 重启导致 run_id 丢失；
- 输出缺失或下载失败；
- 导出产物不完整。

### 16.4 本地 ChatCut 文档与官方 Skills 的使用方式

实现项目 Skill 前，先读取：

```text
docs/chatcut视频剪辑工具拆解/
docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/
```

ChatCut 资料用于吸收以下内容：

- 工具之间的职责边界；
- Script、Transcript、Timeline 和 Caption 的区分；
- 先主线、后包装的执行顺序；
- Motion Graphic 的设计、放置和验证方法；
- 写后读回、真实画面验证和完成条件；
- 常见错误、降级路径和异步任务处理。

本项目 Skill 必须针对本项目对象和 `video-editor-mcp` 重写，不能把 ChatCut 工具名、字段或状态直接当作运行时合同。

| ChatCut Skill 方向 | 本项目 Skill |
|---|---|
| `chatcut-plugin-basics` | `project-basics` + `web-editor-operator` |
| `asset-import` | `asset-import` |
| `transcription` | `transcription` + `semantic-continuity` |
| `talking-head-guide` | `presenter-motion-director` |
| `create-motion-graphics` | `remotion-production` + `scene-planning` |
| `voice` | `voice-production` |
| `verification` | `quality-verification` |
| `export` | `export` |
| `known-errors` | `known-errors` |
| `multicam-sync` | 后续专项 Skill |
| `music` / `video-gen` / `shader-gen` | 对应能力接入后再新增专项 Skill |

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
| `manage_revisions` | 列表、比较、回退、创建变体 | V1 |

#### 素材与任务

| 工具 | 作用 | 阶段 |
|---|---|---|
| `browse_assets` | 查询项目素材和处理状态 | V1 |
| `inspect_asset` | 读取素材元数据、代理、证据 | V1 |
| `import_media` | 创建上传/导入任务 | V1 |
| `edit_asset` | 修改素材标题、标签、用途 | V1 |
| `submit_media_analysis` | 提交代理、波形、镜头等分析 | V1 |
| `submit_transcription` | 通过 FunASR HTTP 工作流提交音频转文字 | V1 |
| `find_transcript` | 按文本、人物或时间查询转写 | V1 |
| `manage_transcript` | 修正 TranscriptText 和语义文本；不伪造时间 | V1 |
| `browse_library` | 查询 Creative Library 和预制资产 | V1 |
| `submit_derived_asset_job` | 生成封面墙、评论云、图表等 | V1 |
| `track_job` | 跟踪媒体、Avatar、预览等异步任务 | V1 |

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
| `submit_export` | 固定 Revision 并提交基础导出 | V1 |
| `track_export` | 跟踪导出与文件验证 | V1 |

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
用户在 Codex 提出目标并提供脚本、参考素材或声音样本
→ Codex 读取 AGENTS.md 与 production-director Skill
→ target_project / read_project
→ 读取 CreativeBrief、Script 和 Provider Capability
→ transcription / voice-production / presenter-motion-director
→ manage_voice_references
→ manage_speech_segments
→ submit_voice_synthesis
   ├─ 每个变更 Segment 直接调用 OmniVoice HTTP API
   ├─ 下载 SegmentAsset
   ├─ ffprobe 读取真实时长
   └─ 组装 SpeechAsset + segment_exact SpeechTiming
→ read_speech_asset / read_speech_timing
→ submit_avatar_job → track_job → read_actor_performance
→ manage_story / manage_visual_treatment
→ create_scene(PresenterScene)
→ manage_effect_cues / manage_cutaways
→ render_preview_range
→ inspect_composed_frames / read_quality_report
→ Codex 通过 MCP 或 Browser Operator 修改问题
→ 生成新 Revision，直至 Quality Gate 通过
→ 用户审片并提出反馈或批准导出
→ submit_export
```

`submit_voice_synthesis` 的服务端实现直接调用 `ComfyUIBridgeClient`，不转发到另一个项目内 MCP，也不等待不存在的默认词级对齐步骤。

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

## 19. 代码与模块架构

采用模块化单体和独立 Job Worker。业务领域、Web、MCP、ComfyUI Bridge HTTP Client 和 Remotion 在同一仓库维护；媒体算法、外部工作流轮询和渲染使用后台任务执行。

```text
AGENTS.md

.agents/
└─ skills/
   └─ ...                         本文第 16 节定义的项目 Skills

docs/
├─ ARCHITECTURE.md
├─ chatcut视频剪辑工具拆解/
└─ asr接入.md

apps/
├─ web/                           ChatCut 式 Web 剪辑工作台
├─ server/                        HTTP、WebSocket、MCP 和 Application 入口
├─ job-worker/                    Bridge 工作流、Avatar、预览和导出任务
├─ render-worker/                 Remotion 局部预览与 MP4 导出
└─ media-worker-python/           FFmpeg、OpenCV、视觉和姿态分析

packages/
├─ contracts/                     API、Command、Query、事件契约
├─ edit-domain/                   Project、Story、Scene、Timeline、Revision
├─ edit-application/              Handler、事务、Impact、Job 编排
├─ story-engine/                  Semantic Builder、Narrative Map、Script Compiler
├─ scene-engine/                  Scene Registry、Effect Registry、Timing Compiler
├─ remotion-runtime/              Player、Scene 组件、Composition Snapshot
├─ comfyui-bridge-client/         通用 Bridge HTTP Client 与契约
├─ speech-services/               FunASRService、OmniVoiceSegmentService、SpeechAssembler
├─ avatar-integrations/           数字人 API 与结果归一化
├─ creative-library/              StylePack、模板、Derived Asset
├─ quality-system/                技术和模式专项质量检查
└─ mcp-tools/                     MCP Schema 与 Application 适配器
```

### 19.1 技术边界

推荐：

- TypeScript：Web、Server、领域模型、MCP、Remotion、Bridge Client 和任务编排；
- Python：媒体算法、OpenCV、VAD、视觉和姿态分析；
- FFmpeg/ffprobe：探测、代理、波形、音频标准化、转码和复用；
- SQLite：本地项目、Revision、Job、外部 run 和索引；
- 本地项目目录：源素材、代理、SpeechAsset、人物、派生素材、预览、缓存和导出。

FunASRService、OmniVoiceSegmentService、SpeechAssembler、Python Worker 和 Avatar Integration 都不直接修改 Timeline，只提交标准化结果给 Editing Application。

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
- 数字人 HTTP API。

不同进程通过 Application API、Job Queue 和受管文件路径协作。8188 端口不得直接暴露公网。

### 19.3 建议工作区

```text
workspace/
├─ app.sqlite
└─ projects/
   └─ <project-id>/
      ├─ assets/
      │  ├─ source/
      │  ├─ proxy/
      │  ├─ voice-reference/
      │  ├─ speech/
      │  ├─ actor/
      │  └─ derived/
      ├─ previews/
      ├─ exports/
      └─ cache/
```

项目索引、Revision、Job、VoiceReference、SpeechSegment、SpeechTiming 和 Bridge run 状态进入 SQLite；媒体文件和渲染产物保存在项目目录。

## 20. Job System

异步任务类型：

- 上传和媒体导入；
- 代理和分析；
- FunASR 文本转写；
- OmniVoice SpeechSegment 语音合成；
- SpeechAsset 拼接与段级时序计算；
- 数字人生成；
- Derived Asset；
- 局部预览；
- 基础导出。

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
- 成功输出立即下载并注册本地 Asset；
- 任务产物验证；
- 日志和事件。

不要把 Job 状态等同于项目 Revision。Job 可以失败，但项目状态不能半写。

---

## 21. Quality System

质量系统分两层。

### 21.1 确定性技术检查

- 时间范围合法；
- 轨道冲突；
- 素材是否存在；
- Mask 是否可用；
- 字幕越界；
- 导出文件可读；
- 时长和音轨；
- 黑帧；
- 缺失帧；
- 渲染异常。

### 21.2 创作质量检查

由 Codex/视觉模型在 Skill 约束下读取真实合成帧和局部视频。

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

### 21.3 Quality Gate

导出前阻塞条件：

- 严重语义不完整；
- 素材缺失；
- 主体遮挡；
- 字幕不可读；
- ActorPerformance 与 Script 不一致；
- Scene 构建失败；
- 音频缺失；
- 技术渲染失败。

建议级问题由 Codex 汇总给用户，用户可以接受或要求继续修改。

---

## 22. 开发阶段

### 阶段 0：工程基线

实现：

- 根目录 `AGENTS.md`；
- `.agents/skills` 发现与最小示例；
- `docs/` 资料索引；
- Project / Revision；
- Asset；
- Story / Scene / Timeline 基础；
- SQLite 和项目目录；
- Web、Server、Worker 基础运行；
- `video-editor-mcp` 连接和项目定位；
- Browser Operator 的稳定对象定位与测试合同。

退出条件：

- 创建项目；
- 导入视频；
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
- 第一批 Effect Registry；
- EffectCue；
- Remotion Player；
- 局部预览；
- Quality Report；
- MP4 导出；
- ChatCut 式 Web 布局和全部主要功能板块。

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
- Codex 能通过 Skills + MCP 生成和修改；
- Codex 能通过 Browser Operator 使用 Web 的素材、文字稿、Scene、Preview、Inspector 和 Timeline；
- FunASR 和 OmniVoice 均通过 `docs/asr接入.md` 定义的 HTTP 流程直接运行；
- 每次 Run 都动态读取最新 schemaVersion 和公开字段；
- 409、failed、输出缺失和 run_id 丢失都有可诊断处理；
- VoiceReference 不被误建模为远端 Voice ID；
- Script 局部修改只重生成受影响 SpeechSegments；
- SegmentAsset 下载、ffprobe 校验、SpeechAsset 拼接和段级时序可读回；
- 第一版字幕和动效不声称拥有词级精度；
- 导出后项目仍可继续生成新 Revision。

### 阶段 2：Avatar Adapter 与联合表演规划

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

实现：

- Explainer Scene Registry；
- Narrative Map；
- Visual Treatment；
- EvidenceDocument；
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
- 视频生成；
- 多机位；
- Shader；
- 复杂三维资产；
- 更多声音和数字人 Provider；
- 真实词级时间戳工作流或强制对齐服务；
- Web 内的 Agent 交互。


## 23. 测试策略

### 23.1 单元测试

- SemanticUnit 合并；
- Script Compiler；
- Frame/Timebase；
- Scene 和 Cue 校验；
- Anchor 传播；
- ImpactReport；
- Dirty Range；
- Revision 冲突；
- Attention Curve 规则。

### 23.2 契约测试

- Web API 和 MCP 调用同一 Handler；
- Browser Operator 的对象定位、表单操作和 Revision 读回；
- MCP Schema；
- ComfyUIBridgeClient：workflow detail、multipart、轮询、409 刷新和输出下载；
- FunASRService、OmniVoiceSegmentService 与 SpeechAssembler；
- SegmentTiming、局部重生成和拼接偏移；
- Avatar Integration；
- Media Worker；
- Remotion Composition Snapshot；
- Job 状态和对账。

### 23.3 视觉 Golden Test

每个 Scene/Effect 保存：

- 进入帧；
- 稳定帧；
- 退出帧；
- 横屏和竖屏样例；
- 字幕安全区样例；
- 人物遮挡样例。

视觉差异超过阈值时要求人工复核。

### 23.4 端到端样例一：数字人口播

脚本必须包含：

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

1. 效果全部对齐语义；
2. 人物动作不与效果冲突；
3. 后景遮挡正确；
4. 前景不挡脸和字幕；
5. 有高低密度变化；
6. 字幕稳定；
7. Cutaway 衔接自然；
8. 素材真实相关；
9. 风格统一；
10. Codex 可通过 Web 或 MCP 局部调整并验证。

### 23.5 端到端样例二：视觉解释片

脚本包含：

- 强数字 Hook；
- 对比；
- 分类；
- 因果；
- 文件证据；
- UI；
- 图表；
- 总结。

验收：

- 大场景持续且内部递进；
- 小视觉事件与语义同步；
- 解释、证据、现实素材交替；
- 一次只有一个主动作；
- 字幕不与主视觉竞争。

### 23.6 端到端样例三：Vlog

素材包含：

- 多地点；
- 重复镜头；
- 人物互动；
- 环境声；
- 一个完整事件；
- 情绪变化。

验收重点：

- 故事清楚；
- 镜头不重复；
- 环境声自然；
- 音乐不过度；
- MG 克制。

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
10. 新需求先判断属于 Story、Scene、Timeline、Runtime 还是 Quality，不随意塞进大 Pipeline。

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
→ Codex 按 Skills 规划 Story、Attention Curve 和视觉效果
→ 通过 MCP 创建 PresenterScene、EffectCue 和 Cutaway
→ Remotion 在 ChatCut 式 Web 工作台中真实预览
→ Codex 通过 MCP 或 Browser Operator 修改
→ 每次修改产生 Revision 和 ImpactReport
→ Quality System 检查语义、语音、动效、遮挡、字幕和节奏
→ 局部修改并重新预览
→ 导出指定 Revision
→ 导出后继续编辑
```

同时满足：

- Web、Codex 和 MCP 操作同一个项目；
- FunASR 和 OmniVoice 只通过 `docs/asr接入.md` 定义的 Bridge HTTP API 调用；
- 不存在伪造的远端 Voice Profile、隐含的词级时间或默认对齐服务；
- 人物前景、后景、Cutaway 和字幕关系正确；
- 动效由语义和 SpeechSegment 边界触发；
- 有安静区和效果密度变化；
- Web 具备素材库、文字稿、Scene、预览、Inspector、Timeline、Jobs/QC/Revision 完整工作区；
- 不是模板贴纸集合；
- 后续可无破坏地增加 word_exact、ExplainerScene 和 VlogMontageScene。

## 27. 最终架构摘要

项目核心链路是：

```text
Creative Brief
→ Story / Semantic Units / SpeechSegments
→ Production Director（Codex + .agents/skills）
→ ComfyUI Bridge（FunASR 文本 / OmniVoice 分段语音）
→ SpeechAsset Assembly + segment_exact SpeechTiming
→ Avatar 与视觉素材准备
→ Presenter / Explainer / Vlog Director
→ Scene + Motion Cue + Asset
→ Timeline Revision
→ Remotion Preview / Export
→ Quality Report
→ 局部修改和持续迭代
```

统一部分：

```text
Project
StoryDocument
SceneDocument
TimelineDocument
Revision
AssetLibrary
StylePack
video-editor-mcp
Browser Operator
ChatCut 式 Web 工作台
Remotion Runtime
Quality System
```

差异部分：

```text
Director Skill
主时间轴驱动方式
Scene Type
Effect Type
素材选择策略
质量判断规则
```

项目第一优先级应是：

> 先把“FunASR 直接 HTTP 文本转写 + OmniVoice 直接 HTTP 分段语音合成 + SpeechAsset 段级时序 + 数字人口播 + 人物前后景动效 + 全屏解释场景 + 稳定字幕 + Codex 自动操作 ChatCut 式 Web/MCP”做成高质量完整闭环，再扩展真实词级时间、完整视觉解释片和 Vlog。
