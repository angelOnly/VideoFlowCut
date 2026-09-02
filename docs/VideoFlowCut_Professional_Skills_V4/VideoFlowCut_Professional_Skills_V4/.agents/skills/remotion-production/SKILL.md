---
name: remotion-production
description: 将已批准的视觉处理转换为可编辑、可复用、可响应和可验证的 Remotion Scene/Effect；先建立 Design Map 与 Settled Frame，再设计运动、素材绑定、局部时间和批量一致性。
---

# Remotion 视觉生产与组件设计

> **V4 单文件原则**：本 Skill 已内置完成该任务所需的核心专业知识、案例、失败模式和验证方法。除项目级 `_shared` 合同与 `docs/asr接入.md` 等真正共享资料外，不依赖同目录 `references/`。


## Remotion 是表现运行时，不是导演

Remotion 能把 React 组件、视频、图片、文字和音频合成为画面，但它不知道为什么这里需要数字、为什么人物应保持安静，也不知道一个漂亮动画是否误导。进入本 Skill 前，`visual-treatment-planning` 应已经明确观众任务、叙事目的、语义锚点、素材和强度；`effect-timing` 已经定义进入、稳定、保持和退出关系。

当前代码拥有 11 种 Effect Type，EffectCue 也保存 `assetBindings`、`props`、`motion`、`spatialAnchor`、`stylePackId` 和 `qualityRules`。但 Runtime 对 SpatialAnchor、Motion Preset 和 StylePack 的完整消费仍是部分能力。因此，本 Skill 要区分当前可执行 Props 与未来计划，不因为字段存在就报告视觉系统已经完整实现。当前契约与 EffectCue 字段可从代码读回，执行时以 `packages/contracts/src/index.ts` 的当前契约为准。

## 先设计稳定画面

在写动画前先画 Settled Frame：动画结束、观众真正要阅读和理解的画面。如果稳定画面层级不清、信息过多、人物被挡、文字读不完，再漂亮的进入动画也没有价值。

Settled Frame 要回答：第一注意是什么？第二注意是什么？人物是否仍是锚点？哪些信息已经通过字幕表达，不需要重复？对象之间通过位置、大小、颜色和关系怎样说明意义？观众需要保持多久？

例如“金钱与自由”的对比，不应先选两个飞入卡片。先决定最终画面：人物是否还在、金钱和自由是左右对比还是因果路径、真正结论是差异还是时间控制。只有稳定模型清楚，运动才有方向。

## Design Map

每个 Scene/Effect 在编码前写一份小型 Design Map：内容、视觉机制、主次、资产、背景、画幅、稳定状态、运动阶段、可编辑 Props 和质量规则。Design Map 不需要成为复杂数据库，但必须在 ProductionRun 或 DirectorPlan 中可审查。

视觉机制优先于装饰。关系用路径和位置，分类用分组，变化用状态，数据用比例，证据用页面和高亮。只把脚本改成大字，通常仍是字幕，不是 MG。

## 代表性样例闸门

批量生产同一类型前，先用一个真实 Beat 做完整样例。检查内容、构图、Style、素材绑定、运动、Settled Frame、字幕和人物关系。样例通过后再批量生成同类，但共享的是视觉语言，不是把同一个模板替换文字。

例如 PortfolioWall 通过一个真实作品墙样例后，可以复用布局逻辑；下一段 DataConclusion 不应该也变成相同圆角墙。

## 资产必须真实绑定

ProductFan 需要产品透明图，EvidenceCard 需要真实证据，PortfolioWall 需要实际封面，DeviceShowcase 需要真实 UI。没有 Asset 时，不用占位卡冒充完成。可先返回 `plan`、生成 AssetRequest，或使用明确的低保真 Draft 标记，不能进入 Delivery。

视频绑定必须使用 Cue 局部时间。一个 Effect 在全片第 1000 帧出现时，绑定的短视频应从自己的第 0 帧开始，而不是使用全局 Composition Frame。所有资源要在 RenderPreflight 中确认可读取。

## Motion 是语义变化

运动阶段包括预进入、进入、落点、稳定、保持和退出。Motion Preset 不应只是名字；它应决定距离、速度、曲线、缩放和释放方式。对象质量、情绪和信息任务影响曲线：轻对象可更快，严肃证据应稳定，喜剧反应可短促，数据结论需要清晰落定。

Spring 不是默认高级感。持续浮动、Glow、Blur、Gradient 和 Shine 也不能代替内容理由。运动结束后要有足够静止时间供观众阅读。

## 响应式与多画幅

Remotion Component 应从 Composition 尺寸、Safe Area、人物区域和 Props 计算布局，避免写死只适合某个 9:16 测试画面的坐标。横版和竖版不必完全同构，但应共享内容和 Style 语义。

字幕、平台 UI、人物脸和手势是受保护区域。无自动姿态能力时，使用已有安全锚点并通过真实帧检查；不能假装 `spatialAnchor` 已自动识别人手。

## Anti-PPT

连续 Scene 若都是“标题 + 三个要点 + 圆角卡”，即使动画不同也仍像 PPT。检查是否存在真正的空间关系、状态变化、对象持续、现实素材、人物和证据；是否每句话都切新页；是否每项信息一开始全部出现。

一个 ExplainerScene 可以持续十秒，在同一空间内逐步增加对象。变化来自信息状态，而不是每句换模板。

## 当前 11 种 Effect 的边界

MetricBackdrop 只服务规模/里程碑；ProductFan 服务真实产品展示；GlowCTA 服务明确操作；PortfolioWall 展示真实内容资产；CommentCloud 需要真实评论语境；EvidenceCard 展示来源；CameraPunch 是短构图变化；FullScreenMeme 只用于真实笑点；DeviceShowcase 展示 UI；ContentCarousel 展示一组内容；EndCard 收束行动。

它们是 Registry 能力，不是每条视频都要覆盖。组件冒烟测试可以展示全部，正式创作只使用内容需要的少数。

## 真实帧验证

对每个代表性效果检查 Before、Motion 中间、Settled 和 Exit；播放前后语句；静音看层级；有声看落点。技术渲染成功不能证明效果专业。当前 `render_preview_range` 和 `inspect_composed_frames` 可以提供真实证据，执行时以 `apps/server/src/mcp.ts` 的当前工具合同为准。

---

## 从 Design Map 到 Settled Frame

Design Map 将叙事意图转为视觉合同：观众任务、信息、视觉机制、第一/第二注意、真实素材、背景、画幅、可编辑 Props、稳定状态、运动阶段和质量规则。

先绘制 Settled Frame。检查信息是否通过位置、比例、状态和关系被理解，而不是依赖动画过程。复杂 Scene 在稳定状态中不一定显示所有历史对象，但当前结论必须清楚。

当稳定画面不成立时，优先删减、重组和换机制，不先调 Easing。动画是从一个信息状态到另一个信息状态的路径。

---

## 代表性样例、批量生产与 Style

批量生产前选择一个真实、高频、能代表难度的 Beat 完成样例。样例要在最终人物、字幕和画幅中审查，而不是孤立组件截图。

通过后复用：字体角色、色彩语义、间距、运动语气、材质和组件逻辑。不要复用所有 Scene 的外形。批量后并排检查：信息层级是否一致、是否连续使用同一模板、密度是否单调、同类效果是否产生无意义差异。

修改 Style 时要知道影响范围。StylePack 改变视觉语言，不应隐式改变语义锚点和 Scene 内容。

---

## 运动句法、局部时间和响应式布局

每项运动有进入前状态、动作、落点、稳定和退出。对象从哪里来、到哪里去应与信息变化一致。没有语义方向时，简单淡入或硬切常优于夸张飞入。

嵌套视频、GIF 和动画资产必须使用局部时间。Cue 在全片后半段出现时，内部素材从自己的开始播放；循环、冻结和截取需显式定义。

布局从画幅、安全区、人物区域和内容长度计算。测试极短和极长文本、不同宽高比、无 Mask 和有 Mask。写死坐标只能作为样例，不是通用组件。

---

## Anti-PPT 与真实视觉机制

PPT 感通常来自：每句新页面、标题+要点、统一卡片、文字承担全部含义、对象没有持续、动画只是入场。解决方式不是换更炫的转场，而是选择合适的视觉机制。

比较用并置和差值，因果用路径和状态，分类用空间分组，时间用持续对象和阶段，证据用真实页面和聚焦，情绪用人物、环境和节奏。一个 Scene 可以在同一空间内逐步改变，让观众建立模型。

检查删除所有文字后，画面是否仍表达某种关系；若完全没有，可能只是排版字幕，而不是视觉解释。

---

## Effect Registry 的专业使用边界

Registry 是能力目录，不是成片需求。选择 Effect 前写清叙事目的、观众任务、真实 Asset、语义落点和不使用方案。

需要外部素材的效果没有绑定真实 Asset 时不能作为正式成片通过。CommentCloud 不是任意评论气泡，EvidenceCard 不是假文档线条，DeviceShowcase 不是手机形状占位。组件烟测可以使用 fixture，创作验收必须使用内容相关资产。

同一视频应根据内容只使用必要 Effect。哲学口播可能只用 CameraPunch、少量文字和 Explainer；促销口播可以使用数字、产品和 CTA。两者得到同一 11 效果组合说明导演层失效。

---

## 最终检查

- Design Map 和 Settled Frame 先于动画实现。
- Effect 有观众任务和真实素材。
- Props 可编辑且没有复制项目状态。
- Motion 有语义起终点和阅读保持期。
- 组件使用局部时间，不误用全局帧。
- 多画幅与安全区通过真实画面检查。
- Style 统一但不重复同一模板。
- 组件烟测与创作成片验收分开。
- Preview 与 Export 使用同一 Composition Snapshot。

## 项目级共享合同

执行时还应读取项目中真正共享、会独立变化的合同：

- `../_shared/CAPABILITY_MANIFEST.md`：当前代码实际能力；
- `../_shared/PROJECT_REVISION_AND_EXECUTION.md`：Project、Revision、MCP 和执行安全；
- `../_shared/EVIDENCE_AND_REALITY.md`：事实、证据、未知和生成内容边界；
- `../_shared/QUALITY_AND_DELIVERY.md`：技术、审美与交付门禁。

这些文件不替代本 Skill 的专业知识；本文件单独阅读应已经能完成专业判断。
