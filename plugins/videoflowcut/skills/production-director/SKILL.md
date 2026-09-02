---
name: production-director
description: 为完整视频任务建立观众承诺、识别主时间轴驱动方式，只选择一个主要视频工作流，并管理主线、包装、质量和交付 Gate；不重复专项知识。
---

# 跨类型整片生产导演

## 为什么需要总导演

完整视频不能由十几个平级 Skill 各自做一小段，然后期待 Agent 自动把它们拼成一条好片。语义、声音、人物、B-roll、字幕、Remotion 和质量之间有严格依赖：主线未稳定时做包装会返工，视觉和声音同时追求高潮会争夺注意力，局部效果完成也不等于整片兑现承诺。

`production-director` 只承担跨类型的总导演职责。它决定用户要做的是人物口播、视觉解释片还是 Vlog；混合视频谁是主流程、谁只是局部 Scene；当前应继续、回退、补证据还是停止。它不讲字幕具体换行、不写 Remotion 组件代码，也不补 `project-basics` 的平台合同。

## 先把用户目标转成生产合同

开始前读取 CreativeBrief、当前 Revision、素材和 Readiness、Story、Quality、未完成 Job 与用户硬约束。然后用连续文字写清四件事：这条视频为什么值得目标观众看完；最后应获得什么理解、情绪或行动变化；哪一种证据驱动主时间轴；什么内容、风格、权利和交付边界不能被破坏。

“做得高级一点、节奏快一点”不是生产合同。需要把它转成可观察目标，例如：竖屏 60 秒知识口播，人物建立信任，视觉只在机制解释和证据出现时接管；前三秒提出“为什么赚得更多仍然不敢休息”，结尾回收到可执行的时间选择；不使用夸张促销效果。

如果现有素材不能兑现承诺，应在此处停止或缩小目标，而不是通过音乐、B-roll 和大字制造一个素材不支持的故事。

## 判断主时间轴由什么驱动

### 人物或最终语音驱动

当观众主要通过一个人的语言、态度和表演获得内容，选择 `presenter-motion-director`。访谈、课程、数字人主持、产品口播和个人经历都可能属于这一类。即使插入 ExplainerScene 和 B-roll，只要人物关系贯穿，它仍是 Presenter 主工作流。

### 解释结构驱动

当旁白只是导航，真正的理解由分类、比较、流程、数据、证据、UI 或认知模型完成，选择 `visual-explainer-director`。人物可以在开场或过渡出现，但不能因为有人说话就错误归类为 Presenter。

### 实拍事件驱动

当故事存在于镜头中的目标、行动、变化、反应、地点和现场声，选择 `vlog-director`。有旁白不自动变成口播；旁白可能只是帮助连接事件。

### 混合视频

混合不是三个主工作流同时运行。判断整片中哪种证据决定主要顺序。例如人物贯穿、解释场景局部插入，仍由 Presenter 负责；实拍旅程贯穿、人物口播只作开场，仍由 Vlog 负责。第二工作流只在明确的 Scene 范围参与，完成后返回主流程。

## 三个生产 Gate

### Gate A：主线成立

这一阶段回答“观众实际听到和看到的主线是否成立”。Presenter 要稳定 A-roll/Script、主声音、人物版本和 StoryBeat；Explainer 要稳定旁白、NarrativeMap 和 Scene 认知任务；Vlog 要稳定事件地图、Shot Selects 和现场声。主线只听声音或只看原始事件都应能理解，不能依赖包装掩盖残句、重复、错误顺序和薄弱素材。

### Gate B：包装成立

只有 Gate A 通过，才允许大规模进入字幕、MG、B-roll、Cutaway、BGM、SFX 和显性镜头处理。包装对象需要语义、动作、证据或节奏目的；主线变化后要根据自身关系重算、stale 或复核。整片必须有安静区，不能以覆盖所有 Effect Registry 为目标。

### Gate C：交付成立

局部 Preview、最终 Artifact 和完整声画审片都通过，才进入 Delivery。当前代码已经区分 draft 与 delivery；Delivery 需要目标 Revision 的 Preview Evidence 和 EditorialReview。质量问题要退回正确负责人，而不是只生成一份没人处理的报告。

## 如何调用主要工作流

完整人物口播：

```text
project-basics
→ production-director
→ presenter-motion-director
→ 该主工作流按阶段调用专项 Skills
→ quality-verification
→ export
```

视觉解释和 Vlog 同理。专项 Skill 完成后，主工作流必须接收它修改的对象、失效范围和验证证据，再决定下一阶段。仅仅在 ProductionRun 里看到一串 loadedSkills 不表示生产链成立。

## 局部任务不经过完整路由

用户只要求换一个 B-roll、修一句字幕、调整一个 EffectCue 或检查一处声音时，不应重跑整片。使用 `project-basics → 对应专项 Skill → 必要的 quality-verification`。只有当局部修改改变 Story、主线、多个 Scene 或整体 AttentionCurve，才回到本 Skill。

## 质量问题如何退回

- 残句、错误重录、听感机械：`semantic-continuity`；
- 声音错读、段间不连续：`voice-production`；
- 人物口型、Mask、音频所有权：`avatar-performance`；
- 不知道哪里应加视觉：`visual-treatment-planning`；
- 找不到合适素材：`visual-asset-sourcing`；
- B-roll 使用方式错误：`cutaway-planning`；
- MG 像 PPT、组件或放置错误：`remotion-production`；
- 整个 Scene 认知模型错误：主工作流或 `scene-planning`；
- 整片承诺、顺序和结尾不成立：退回主要视频工作流，而不是局部加效果。

## 路由决策矩阵

| 判断问题 | Presenter 主工作流 | Explainer 主工作流 | Vlog 主工作流 |
|---|---|---|---|
| 谁决定最终顺序 | 完整语义、问题/回答、人物表达 | 问题、机制、证据、认知步骤 | 事件、动作、地点、反应 |
| 最重要的源证据 | 说话内容、人物声音与表演 | 文稿、数据、页面、关系模型 | 实拍镜头与现场声 |
| 主线通过怎样验证 | 只听声音仍成立 | 只读旁白和 NarrativeMap 成立 | 不靠旁白也能跟随事件 |
| 最大风险 | 过度清理、包装抢人物 | 逐句 PPT、假证据 | 漂亮镜头无事件、音乐吞现场 |
| 局部混合 | Explainer/Cutaway 插入 | Presenter/Reality B-roll 插入 | Presenter/标题/地图插入 |

### 不能用素材数量路由

一个项目有十条人物视频不一定是 Presenter，也可能是 Vlog 中的人物行动；一条旁白不一定是 Explainer，也可能只是 Vlog 的连接；大量 Remotion 不自动让视频成为解释片。路由看主时间轴的因果权，而不是素材格式。

## 用户对齐发生在哪里

总导演只询问高杠杆方向：目标受众和平台、交付时长、主要版本、不可改变内容、是否允许重组、视觉强度、权利和事实边界。具体字幕颜色、MG 位置和 B-roll 时长不在这里逐一询问，除非会改变整体方向。

当用户给了明确参考视频，先抽象为：人物/视觉占比、Scene Grammar、AttentionCurve、字体和运动语气、B-roll 密度和声音结构。不要把参考视频的每个效果当需求清单。

## 主工作流的阶段交接

总导演选择主工作流后，不在每个专项阶段重新夺回控制。主要工作流负责：

1. 确认进入某专项前上游已经稳定；
2. 告诉专项当前问题和所需证据；
3. 接收专项修改的对象、新 Revision、Impact、验证和未知；
4. 判断 Gate 是否通过；
5. 决定下一专项或回退。

例如 Presenter 调用 `semantic-continuity` 后，不能只得到“语义已优化”；必须得到最终 Script、新 SpeechSegment、删留理由和下游失效。随后 Presenter 才决定进入 Voice，而不是 production-director 直接同时启动 Voice、Caption 和 Remotion。

## 混合视频的控制权

混合 Scene 应定义入口和出口。Presenter 主流程进入 ExplainerScene 前说明哪一个问题需要认知模型；Explainer 完成后返回人物哪一句、哪种状态。Vlog 插入人物口播时，人物用于解释还是反应；结束后怎样回到事件。没有这些交接，混合会变成素材拼盘。

## 反馈与修订

用户说“动效太少”不一定等于需要更多 Effect。总导演先检查参考目标、观众承诺、AttentionCurve 和成片类型；可能是 Scene 变化不足、素材不具体、字幕平、音乐平或主线重复。用户说“看起来太花”也可能来自字幕、B-roll 和音效同时竞争，而不只是 Remotion 数量。

整片反馈由当前主工作流诊断；只有明确局部问题才直接分派专项。修订范围需要保护用户已经认可的对象，避免一次“优化节奏”把声音、字幕和全部 Scene 都重做。

## 生产审计

对于整片自动生产，使用 `start_production_run`，记录选择的主工作流、关键创作决定、被拒绝方案、安静区、Preview 和质量修复。记录应解释为什么这样做，而不是复制所有 Project 状态。

## 退出条件

本 Skill 完成不是“选出了 Presenter”就结束，而是主要工作流已经收拢本次范围、适用 Gate 通过、质量问题已有负责人、不能实现的能力和用户待决事项明确。正式交付还必须由 `quality-verification` 与 `export` 完成。

## 可选案例库

复杂路由案例见 `references/routing-casebook.md`。

## 素材证据进入导演选择的门槛

总导演不替 Presenter、Explainer 或 Vlog 主工作流逐镜选片，但必须确认当前主线建立在足够的素材证据上。文件名、转写关键词、Shot 技术分数、Provider 标题和一张缩略图只能用于发现候选，不能直接成为 Story、Event 或 Select 的事实依据。

主工作流进入包装前，需要能够回答五个问题：当前主线依赖哪些源素材事实；哪些候选已经查看过连续声画；哪些精确边界经过必要的密集复核；哪些判断仍属于专业解释或未知；哪些候选被采用、拒绝或保留为备选，以及它们怎样改变观众的已知、问题、预期、情绪和注意力。

建立主线时使用观众承诺、事实时间线、观看时间线、故事脊椎、信息账本、Stringout、Selects 和节拍链。它们是导演工作方法，不要求新增同名数据库对象。最终采用结果继续写入现有的 SemanticUnit、StoryBeat、NarrativeMap、VlogEvent、ShotSelect、VisualTreatment、Scene 和 Timeline；关键选择与拒绝理由可以写入 Creative Decision 或 SkillExecutionReport 作为审计。

若当前证据只足以发现候选，却不足以判断快速动作、微表情、真实反应或声音切口，总导演应让主工作流补看具体源范围，再继续选择。若素材本身无法兑现观众承诺，应缩小承诺或更换主线，而不是依赖音乐、B-roll 和动效制造素材不支持的故事。
