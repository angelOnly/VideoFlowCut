---
name: remotion-production
description: 作为跨视频类型的完整 Motion Graphics 子工作流，负责完整内容段的构思、关键画面、美术、运动、原创受管版本和合成验证；参考可选，在设计阶段按需学习连续动效案例。
---

# Remotion Motion Graphics 完整生产工作流

## 段内创作的完整流程

**职责与默认方式**

`remotion-production` 负责当前内容段落的视觉构思、美术、构图、运动编排、受管实现和合成验证。主要工作流决定整片承诺、段落任务、事实与上下文；本 Skill 在这些边界内自主完成设计。Remotion 库只负责实现，Skill 不能把“库不是导演”理解为自己只能执行上游已指定的组件。

不要求参考 URL。需要内容专属的连续表达时，正常进入受管原创作品流程。现有组件在能够完整保留设计时可以复用；选择发生在构思之后。只修改数字、颜色或一个既有 Cue 的任务按局部范围执行，不强制重做整段。

**第一步：读懂内容与真实合成环境。**

读取当前 Revision、相关 Beat、Script、真实旁白时间与精度、Scene、人物/字幕/证据范围、前后画面、已有作品和本片视觉语言。检查实际素材与可用 API。判断观众当前不知道什么、视觉要让他发现什么，以及结尾要留下什么。没有参考不构成缺口；必要事实或必需素材缺失时，先返回明确的素材需求或可保持任务的替代方案。

**第二步：提出内容对应的视觉构思。**

对承担核心解释或记忆的段落，内部比较两个有实质差异的表达构思，然后选一个实施。差异应在对象、关系、发现顺序或观看视角，不只是两种颜色。普通强调可以直接采用成熟表达，不为每个小元素重复方案评审。

说明为何这个构思适合当前内容、哪些关系会通过变化被看懂、真实素材承担什么作用、可能造成什么误读，以及它怎样进入和结束。比喻只能帮助理解已确认的事实，不能把不同机制硬套成相似图案。不要用“高级流畅科技风”代替具体构思，也不要把所有名词转换成图标。

**在构思与关键画面之间使用案例。**

按需读取 [案例学习与选型](../motion-case-library/SKILL.md)，由观看任务判断哪份案例能提供设计方法。先看该例选定效果，再读生成思路、源码与实际关键帧；能读取静态图片而不能播放本地视频时，如实区分静态观察、源码理解和已记录的动态结论。借鉴对象持续、构图、注意顺序与运动组织，重新设计当前文字、数值、素材、人物和时序。没有匹配案例仍可设计新机制，不强迫套用已有案例。正式提交前读取实时 Schema；当前候选合同支持创作说明与可选参考。

**第三步：形成关键画面与连续变化。**

先设计少量足以说明本段的关键画面：入口、重要变化、可读结论与出口；复杂段落按信息推进增加中间状态，不规定固定数量。每个状态说明第一重点、仍然存在的对象、发生变化的属性、真实中文、相对大小与位置、人物/字幕关系、需要停留的理由。保持身份的对象应让观众能够追踪；新对象在需要时建立，不反复清空重画。

为每两幅关键画面说明怎样到达：聚焦、展开、遮罩揭示、关系生长、视角转换、自然切镜或回收；选用什么由内容决定。写清起势、主要变化、落点与阅读时段。若对象需要持续运动跨件交接，明确边界状态与运动相位；若自然切镜更清楚，可以采用切镜，不强迫每段变形。

**第四步：完成美术与运动编排。**

用真实文字和素材设计关键构图，确认中文排印层级、颜色含义、主体尺度、留白、图片处理、材质与背景分离。整片共享视觉语言，但不同任务应有不同构图。停稳状态在目标观看尺寸下必须成立，不能依赖粒子、发光或漂浮掩盖画面空弱。

再确定动作顺序、空间路径、距离、速度变化、过冲与阅读停留。对象运动建立注意主次，背景与次要信息按阶段退让。需要声音的主要动作命名并给出局部帧；保持声音由现有 Audio 轨实现。内部可见变化、代码时序与交付的事件帧应一致。

**第五步：提交固定版本作品。**

采用当前 `submit_motion_work` 合同，提交源码、Props、画布、时长、图片绑定、权利和创作说明；只有实际使用参考时才附参考观察。所有执行都通过受管 MCP，不修改平台源码、不安装依赖、不绕过隔离。代码只使用已支持的确定性 API；实拍与声音通过现有合成链安排，不写入不支持的作品资源类型。

提交只创建 Job。通过 `track_job`、`read_motion_work` 和 `inspect_asset` 取得当前版本源码、产物与实际动态观察；未完成 Job 或无法检视的作品保留未审状态。需要修改时提交新作品并关联 `previousAssetId`，原版本和已使用的 Asset 不覆盖。

**第六步：审阅作品，再放回成片。**

先看真实作品是否表达了当前内容，是否实现选定设计，关键构图、运动和节奏是否成立；同时允许推翻一个已被正确实现但效果平淡的构思。用当前 `review_motion_work` 保存对应版本的实际结论。有参考时再检查所借鉴的关系，无参考时不填写虚构的匹配证明。作品审阅通过只是允许作为候选使用，不代表成片通过。

若无法脱离人物、字幕或 Cutaway 判断，或尚未取得足够连续观察，先登记 `inconclusive` 与明确原因，允许进入待审草稿取得真实合成证据，再复核结论。未观察不能写成通过；需要合成才能判断，也不应成为无法制作草稿的循环前置条件。

根据当前 Scene 与层级放置完整 ManagedMotion，绑定明确的覆盖 Beat；Cue 决定整体时间和归属，作品内部排版与运动不再套第二层统一进出场。替换原生主视觉时局部处理旧 Program，配合 Cutaway 的遮盖范围。只修改整体放置可更新原 Cue；改内部设计必须生成新作品，并复核相关声音事件。

在同 Revision 中渲染真实合成，播放前一句、完整变化、后一句，检查人物、字幕、证据、实拍、声音及前后状态。独立透明作品好看，但在人物或字幕下失去主次，仍需要修改。检查失败后定位到构思、美术、运动或合成接口，不统一用增加缓动解决。

**第七步：扩展并交回主工作流。**

一个代表性段落经过实际合成验证后，将已验证的风格规则应用到其它相关段落，并逐段根据新内容构思。复用色彩与运动语气，不复用固定出场表。交回作品版本、Cue/Scene、覆盖 Beat、内部事件、修改范围、实际证据、已知问题和下一步。内部样段通过后继续原有整片任务，整片最终审阅仍由当前主工作流收口。

## 先区分项目创作与平台开发

单片原创是项目创作，通过受管 MCP 提交，不需增加全局 Registry。平台 API、依赖、隔离或通用组件实现的更改属于平台开发；剪辑任务不得修改源码、安装依赖或绕过 MCP。局部修改已有 Cue 时保持用户范围。

## 受管作品生成和修改

`submit_motion_work` 的 `work` 包含名称、默认导出的 React/Remotion TSX、可编辑 Props、目标 width/height/fps/durationInFrames、非空 creativeBrief（最多 6000 字符）及权利依据；reference 可选，实际使用时填写 URL 与 layout/motion/rhythm/adaptation/evidence 观察说明。源码只用当前 Schema/校验器支持的 API。首版支持文字、CSS、SVG 和受管图片的帧驱动 2D 动效：`imageBindings` 将命名 Slot 对应到已就绪的项目图片 Asset ID，源码以 `<Img src={props.assets.logo} />` 消费对应图片。平台固定图片字节哈希并保守合并权利，不能自行覆盖 props.assets。不开放外部资源 URL、任意依赖、DOM/网络/文件访问、音视频隐式出声或 CSS 计时动画。需要这些能力时报告明确缺口，不能丢掉关键素材后仍声称效果已实现。

提交只创建固定输入的 Job，不改变 Timeline。`track_job` 完成后用 `read_motion_work` 读回源码、版本和 Asset，再通过 `inspect_asset` 审阅生成的动态代理。需要改字、调布局或节奏时提交新作品，并以 `previousAssetId` 关联旧版；旧源码、缓存和已使用版本不能覆盖。Job 失败保留诊断，不把安全拒绝改成绕过；同一幂等键不能提交不同输入。

用 `review_motion_work` 的 outcome、note 和 evidence 记录当前版本实际结论。passed 必须提供完整连续动态证据；frames、局部或仅音频不能通过。inconclusive 可用于待审草稿，failed 必须修订。reference_match 仅兼容历史无创作说明的参考作品，不能与 outcome 混用。通过并不代表合成审片通过。`manage_effect_cues` 使用 `type=ManagedMotion`，只绑定 `slot=motion` 的生成 Asset，明确所属 Scene、叙事目的、语义锚点与 covered_narrative_beat_ids；时长、画幅、fps 必须匹配。作品内部已经包含布局和进出场，Cue 只决定时间、层级及语义归属；省略 Props、Motion、空间锚点、强度和 StylePack 覆盖，修改这些内容必须生成新作品版本。

只修正已放置作品的语义归属、出场范围或换绑已审阅的新版本时，用 `manage_effect_cues(action=update, cue_id=已有ID, ...)` 就地更新，保留未指定字段和 Cue ID；不能借此更换 Scene、类型、层级或裁短固定作品。放弃这次使用时用 `action=remove`，只提交 Cue ID 与当前版本，不删除作品 Asset，也不回退整片。每次写后读回目标与 Impact，移动后同时复查原位置和新位置。

正式合成使用固定版本的透明 PNG 帧，不使用带背景的 MP4 审阅代理。源码与 Props 保留可编辑，修改后需等待局部渲染，这是缓存策略而非把代码焊死成视频。放入目标人物画面后再检查进入、运动中、停稳、退出及前后连续；结合声音审阅字幕竞争、阅读时间和语义落点。最终导出必须与同 Revision 的 Preview 一致。

作品要替换既有 ExplainerScene 的主视觉时，先读 `read_explainer_scene_programs`：换绑 Cue 不会自动关闭底层 Program。确需退出旧主视觉，用实时 Schema 中的 `set_explainer_program_enabled(base_revision_id, program_id, enabled=false)` 局部停用；它保留 Scene 语义、其它 Cue、字幕与音效，不是整批 `compile_explainer_scenes`。不要用额外不透明底板遮住仍运行的旧内容。停用后检查新作品透明处、退出及前后画面，并复听原音效是否仍匹配新视觉事件；保存音效对象不等于声音仍适宜。需要恢复旧画面时可启用，但 stale 内容不会因此修好。工具不可用则报平台阻断，不绕过 MCP。

## 可选的在线参考研究

仅在需要研究参考时进入本节；没有参考可以直接原创。


用 `browse_motion_sources` 进入 Onda、Jitter、RemotionLab 和 Mixkit。它们是在线视觉参考，不是需要搬到本地的全量模板仓库；AE、Jitter 工程或没有源码不妨碍选型。有合适授权的源码可复用，其他效果根据实际观察的视觉机制独立编写 Remotion，不要求安装 AE。不得把品牌、照片、音乐或会员源码的权利当作随视觉参考一起取得。

`inspect_motion_reference(source_url)` 先返回页面、公开链接和 preview 索引，再用该工具的 preview_index 参数查看同一项连续采样。页面截图只能证明页面存在；采样没有变化、资源被阻止或出现登录/验证页时，明确尚未看懂，不根据名称编造运动。采样不包含复听，也不提供精确语音时间。四个站点都可作为候选，不按源码格式排序。没有适合的参考时，不用弱相关特效填满视频。

先解释让效果成立的关系：静止时信息怎样排列，哪些对象先后进入，遮罩/位移/缩放怎样建立主次，停稳后观众有多久可以阅读，如何退出。随后决定哪些关系必须保留，哪些文字、配色、位置和时长需要适配真实中文、画幅、人物与字幕。这份短设计说明由剪辑者完成；用户只需描述观感，无须填写专业参数。

例如原站用“文字从遮罩后揭示→强调底色建立→安静停留”突出短句，应保留这个节奏和空间关系，不能实现成整个圆角卡片飞入就称作复现。换成较长中文时先调整信息结构和分行，不靠缩小字体硬塞；语音落点来自本项目的真实时序，不照搬参考秒数。跨多个效果共享排印与运动语气，不意味着所有 Scene 都套同一种容器。

## 编码或选择组件前的输入

必须知道：这个 MG 在剪辑中承担什么观众任务；准确文字、数字、媒体和事实；目标画幅、Scene 和放置范围；人物、字幕、证据和安全区；语音/动作/声音时机；Style 来源；需要暴露为 Props 的可编辑值；可用 Asset 和权利；当前 Registry 与 Runtime 能力。

只问会实质改变结果的高杠杆信息。若风格已经由 StylePack、参考视频或已接受组件确定，不要每个 MG 都重新询问。

## Style 对齐和代表性样例 Gate

无参考时依据当前内容、素材和受众自主确定视觉语言并记录到现有创作决定。样段是内部验证，正常完成后继续原任务，不逐段请求用户批准。

“高级、现代、专业”是目标，不是具体视觉语言。需要转成字体层级、色彩语义、间距、密度、材质、运动速度、边角和声音强度。多个相关 MG 在批量生产前应先做一个真实 Beat 的代表性样例，放入目标画面并检查 Settled Frame。样例确认的是视觉语言，不意味着所有 MG 都复用同一个卡片形式。

当前代码的 StylePack Runtime 消费仍有限，因此 Skill 可以要求一致性并通过 Props/现有组件实现，但不能声称一个 stylePackId 已自动控制全部字体、色彩和运动。真实 Preview 是最终证据。

## Design Map

涉及声音时，将作品内需要配合的动作命名并交付其局部帧，区分开始进入、主要攻击对应的动作和停稳；不要只提供整段起止。声音专项通过 `manage_audio` 的 effect_event 绑定放置后的 Cue 和当前视觉签名，不在作品源码内嵌音频。纯平移可以保留关系；改作品或内部时序后，读回 Impact 中的 stale AudioCue，并把新动作帧交回声音专项复核，而非继续套旧绝对帧。

批量或复杂 MG 前，为每个计划项写紧凑 Design Map：观众任务、准确内容、排印或非文字视觉机制、语义范围、进入/稳定/退出、Settled Frame、阅读时间、大小、构图关系、AssetBinding、Props、声画共同落点、是否与另一个 MG 有意重复、降级和验证。声音由 Audio 轨实现，作品不隐式出声。

Design Map 防止两个极端：所有内容都套同一圆角卡片；每个 MG 风格和运动完全不同。共享的是视觉语言，形式由内容任务决定。

## 先设计 Settled Frame

一件连续作品可以有多次变化与停留，关键状态包括入口、关系变化、可读结论与出口，不简化为统一入场—静止—退场。

动画最终停在哪里，比从哪里飞进来更重要。Settled Frame 应在静止状态下完成信息层级、空间关系、人物和字幕保护、阅读和风格。先完成稳定构图，再设计运动如何建立它。

如果一个画面只有持续漂浮、Glow 和粒子时才显得丰富，说明稳定状态可能没有信息结构。复杂文字不能通过缩小塞入；应简化、分阶段或改为全屏 Scene。

## 视觉机制而非文字容器

MG 可以使用空间分组、状态变化、路径、数量、层级、比较、时间和真实素材。短结论可以用排印；分类需要共同坐标；流程需要持续对象和路径；数字需要单位和基线；证据需要来源；产品展示需要真实 Asset。

默认 Glow、Glass、Gradient、Card、Spring、Sweep 和 Shine 都需要内容理由。它们不是“高级感”的同义词。

### 中文重点排印与人物同屏

重点短语可作为独立视觉对象，不必包在卡片里，也不必因为字幕已出现同样语义就被删掉。先用有限字级、字重、对比色、对齐与负空间建立主次；保留否定、单位和条件。基础字幕承担连续语言，动效承担注意与记忆，两者由 captions 协调。相关专业选择见 [人物剪辑语法](../presenter-motion-director/references/presenter-editing-grammar.md)，只在人物包装任务按需读取。

在真实中文与目标人物背景上设计停稳画面。揭示可用遮罩、紧凑位移或尺度收敛建立重点，动作的距离、缓动和过冲要与对象体量一致，随后停止运动供阅读。不能让每个字各自弹跳造成振动，也不能将有语义的主文字去掉后只剩难以识别的装饰线。边框、底板或阴影用于分离背景与阅读，强度来自实际对比需求，不默认所有内容同一卡片。

对比采用共同基线和持续对象，按语义逐步揭示或聚焦差异；短标签可以直接组成关系，不强制双框。逐帧确定性仍由 Remotion 局部 frame 驱动，不用 CSS 计时动画；作品进入时间线后，在正常播放和目标显示尺寸中复核显著性、停留与前后连接。单独透明作品漂亮，不代表叠入人物与字幕后成立。

## Registry、EffectCue 与真实素材

当前 Registry 包含 MetricBackdrop、ProductFan、GlowCTA、PortfolioWall、CommentCloud、EvidenceCard、CameraPunch、FullScreenMeme、DeviceShowcase、ContentCarousel、EndCard。

这些名称表示能力，不表示每条视频都要使用。ProductFan 必须绑定真实产品；PortfolioWall 使用实际封面；CommentCloud 使用真实评论；EvidenceCard 使用来源素材；DeviceShowcase 使用真实 UI/截图。没有 AssetBinding 时，应选择不依赖素材的机制或停止，不用占位图冒充完成。

`quality_rules` 当前只接受代码定义的枚举，创作理由写 narrative_purpose、audience_task 和 note，不把任意自由文本塞进质量规则。

## Props 设计

Props 应暴露用户可见且可能变化的内容：文字、数字、主色、强调色、图片/视频 Asset、布局选项、强度和必要 Motion。不要把内部实现细节全部暴露，也不要把内容硬编码进组件。

Props 需要默认值、合法范围、类型和回退。Asset 通过项目 Binding 传入，不在组件中硬写本地路径或远程 URL。组件不得自行联网或读取文件系统。

## 局部时间与 Remotion Sequence

声音需要绑定作品实际执行产生的事件。受管源码可导出 `resolveMotionEvents(props, {fps, durationInFrames})`，返回包含 id、meaning、startFrame 和可选 endFrame 的数组；画面与事件必须共用同一份时序常量或计算函数。渲染器在隔离浏览器读取并检查确定性、重复 ID 和范围，随作品固定 eventMap 版本。用 `read_motion_work`/Asset 读回实际事件，再交给 effect-timing 和 audio-finishing；不要另写一张与画面无关的手填时间表。持续动作交付起止范围，是否全程发声由 SoundPlan 决定。学习案例以当前 [motion-case-library](../motion-case-library/SKILL.md) 的六个固定案例为准，配声版本另行生成，不改归档样例。

Cue 在整条 Composition 中可能从第 1000 帧开始，但绑定视频、内部动画和计数通常需要从 Cue 局部第 0 帧开始。组件应使用局部 Frame 或在外层 `Sequence` 中重置时间，不能直接把全局 Composition Frame 当作素材内部帧，否则晚时间 Cue 可能从视频中间或末尾播放。

Timeline 范围必须容纳 Enter、Settled、Hold 和 Exit。不能用更短 Item 截断组件内部未完成动画；主线时长变化时，重新编译或调整 Cue，而不是依赖偶然裁切。

## Natural Box 与 Timeline Canvas

Registry Overlay 组件的自然 Asset Box 应紧密包围可见内容，便于定位；真正全屏 Scene 才占满画布。受管作品首版采用目标画布大小的透明缓存，因此内部排版由源码负责，不声称 Inspector 能直接移动可见对象的自然盒。

透明画布的 `full_frame` 只是坐标系，不等于遮挡全屏。Worker 从实际 PNG Alpha 逐帧测量可见像素外包区域；与同时段字幕安全预算不相交才可排除这项遮挡，相交仅表示待审，不等于字形已被挡。旧作品缺少测量时会明确提示未知，可重生成取得证据；无论测量结果如何，都不能代替人物、字幕、进入退出和整片观感的真实连续审片。

最终放置要结合目标帧、人物、字幕、证据和画幅。固定 Safe Zone 不是万能答案；同一 Anchor 只有在观众任务和构图关系重复时才应复用。

## Motion Grammar

运动表达信息状态：预进入建立期待，主要动作完成变化，Settled 提供阅读，退出为下一事件让路。速度、距离、Easing 和强度应匹配对象重量与内容语气。大产品、轻标签、严肃证据和喜剧反应不应共享同一 Spring。

MotionPreset 字段存在不代表 Runtime 已完整实现所有语法。当前组件实际消费什么必须通过代码和 Preview确认。`effect-timing` 负责语义落点，`depth-composition` 负责空间路径。

## 响应式与多画幅

组件应根据画布和安全区布局，而不是使用只对 1080×1920 有效的绝对坐标。9:16 与 16:9 可能需要不同对象排列、字体、行数和主体位置；不能简单缩放。至少保存代表性竖/横 Golden Frame，若第一版只支持主画幅，应明确降级。

## 批量生产和一致性

关键帧并排比较只验证美术；连续段验证动作与交接；完整成片检查重复、密度与声音。三类证据不能相互替代。

多个 MG 批量生成前比较 Design Map，先通过一个样例，再按组生产。完成后并排查看 Settled Frame：色板、字体、运动语气和材质应一致；重复形状、Anchor 和节奏应来自重复任务，而不是模板习惯。连续多个卡片式 Scene 应重新设计。

## 当前代码安全边界

生产使用已注册组件，或通过已发布 MCP 创建的受管作品。作品代码只在独立 Chromium OS sandbox 与 CSP opaque origin 中执行，网络默认拒绝；静态分析只是依赖和确定性约束，不代替隔离。禁止关闭 sandbox、访问宿主文件/凭据、临时安装依赖，或将未验证作品直接注入主工作台。

## 当前 EffectCue 写入合同

当前 `manage_effect_cues` 的核心字段可以理解为四组：

| 组 | 字段 | 作用 |
|---|---|---|
| 叙事 | `narrative_purpose`、`audience_task`、`note` | 为什么存在，观众要获得什么 |
| 绑定 | `scene_id`、`semantic_anchor`、`anchor_target_id` | 服务哪个 Scene/语义以及关系 |
| 表现 | `type`、`layer`、`spatial_anchor`、`asset_bindings`、`props`、`style_pack_id` | 使用什么组件、素材和构图 |
| 时间/质量 | `start_frame`、`end_frame`、`motion`、`quality_rules` | 物理范围、内部运动和可执行检查 |

原创作品的主示例（ID 与范围替换为当前项目真实值；18 帧仅演示合同）：

```json
{"action":"create","base_revision_id":42,"scene_id":"scene-explain","type":"ManagedMotion","layer":"front","start_frame":360,"end_frame":378,"covered_narrative_beat_ids":["beat-cause","beat-result"],"semantic_anchor":{"type":"narrative_beat","target_id":"beat-cause","relation":"land_on"},"asset_bindings":[{"slot":"motion","asset_id":"asset-work-v2"}],"narrative_purpose":"让原因到结果在同一对象上可追踪","audience_task":"理解两拍之间的关系"}
```

覆盖是内容声明，时间锚点负责放置；同 Scene 不自动覆盖全部 Beat。单件不能跨 Scene，长度、画幅和 fps 必须匹配固定作品。省略 Props、Motion 和空间参数；这些不会重写内部像素。

### 能完整保留设计时直接复用 Registry

在构思后通过 `browse_effect_types` 读取类型、Asset Slot 与参数。普通 Cue 可消费 Props、Motion 和 StylePack，按实际 Schema 选择。以下 EvidenceCard 示例说明来源与观看任务：

```json
{
  "base_revision_id": 42,
  "scene_id": "scene-claim",
  "type": "EvidenceCard",
  "layer": "fullscreen",
  "start_frame": 360,
  "end_frame": 510,
  "narrative_purpose": "让观众看到该主张来自官方原文，而不是主持人的个人概括",
  "audience_task": "确认来源并读清适用条件",
  "semantic_anchor": {
    "type": "narrative_beat",
    "target_id": "beat-evidence",
    "relation": "hold_through"
  },
  "spatial_anchor": "full_frame",
  "asset_bindings": [
    {"slot": "evidence", "asset_id": "asset-official-page"}
  ],
  "props": {
    "title": "官方规则",
    "highlight": "适用条件与费率"
  },
  "motion": {
    "enter_preset": "establish-then-focus",
    "hold_frames": 90,
    "exit_preset": "return-to-presenter"
  }
}
```

quality_rules 若需要填写，必须读取实时合法枚举。示例的重点是把“证据卡出现”写成可解释合同，而不是只给 type 和时间。

## Scene 组件与 Effect 组件

Effect 通常在已有 Scene 中短时增加变化；Scene 组件建立完整视觉模型。一个需要 8 秒展示流程的内容不应被强行作为人物旁边的小 Effect；一个只强调两秒数字的内容不需要新建全屏 Scene。

Registry 设计应让生产 Skill先选择层级：

- Presenter Overlay：人物保持主视觉；
- Presenter Rear/Front/Actor Effect：与人物空间协同；
- Fullscreen Scene：视觉接管；
- Global/EndCard：跨 Scene 或结尾；
- Derived Asset：先离线生成复杂静态组合，Runtime 只负责时序和轻运动。

## 媒体 Asset 处理

以下视频支持属于平台 Registry 组件。受管 TSX 当前只接受图片绑定、CSS、SVG 和文字，视频与声音走外层 Timeline/Cutaway/Audio；核心机制无法实现时明确报缺口，不静默删掉。

图片和视频必须来自 Project Asset Resolver。组件决定 `cover/contain` 前读取保护内容；证据、UI 和海报通常不能 cover 裁切文字。视频在 Cue 内使用局部时间，处理无音频、循环、结束和加载失败。若视频自身声音需要播放，音频归属由 Timeline/Audio 系统决定，组件不要隐式出声。

## 性能和缓存

复杂 Scene 避免每帧重新解析大 JSON、计算重布局或创建大量 DOM。预处理封面墙、评论云和图表为 Derived Asset 可以减少 Runtime 压力，同时保留来源。缓存键应包含 Revision、Scene Props、Asset Version、Style、Cue 和 Runtime 版本。修改一个标签不应让整片全部失效。

## 错误和恢复

- Props 校验失败：阻止创建或标记 Cue failed；
- Asset 缺失：使用定义好的降级或 blocking，不显示占位；
- 时长不足：压缩可压缩阶段或返回修改建议，不截断；
- 字体/媒体 Worker 差异：Preflight 和 Player/Render 对比；
- 布局越界：返回 depth/caption/scene 调整；
- 性能超时：减少对象、预渲染 Derived Asset 或拆 Scene；
- 新组件编译失败：停在开发任务，不把未注册代码用于生产。

## 项目写入流程

读取 Project/Revision、Beat、真实素材与时序 → Treatment 与 Scene 完整段交接 → 内容构思与关键状态 → 按需案例学习 → creativeBrief 与受管源码 → `submit_motion_work` → `track_job` / `read_motion_work` / `inspect_asset` → `review_motion_work` → `manage_effect_cues` 放置固定版本并声明覆盖 → `read_project` / `read_impact_report` → `render_preview_range` / `track_job` → 抽帧定位与连续声画观看 → 复核作品结论 → `quality-verification` → 回到主工作流完成整片。

`manage_effect_cues` 支持 create、update、remove；后两者指定 cue_id。每次写后读取新 Revision。结果未知先查原 Job/对象，幂等冲突不能换键盲重试。主线或覆盖内容变化后作品保持固定帧数并 stale；普通平移不能恢复旧失效。明确复核合法覆盖、或换绑新版本后才恢复，并检查相关 AudioCue。

## 验证

检查进入前、运动中、Settled、退出、前后语义、人物/字幕/证据、静音和有声。Player 与 Render Worker 必须使用同一 Revision Snapshot；浏览器好看而导出不同是 blocking。

## 案例：ProductFan

促销人物说“这次送出 70 台平板”。Design Map 的任务是让观众同时记住数量和产品。真实产品图绑定到 ProductFan，人物双手展开时对象从两侧进入，数字“70”在落音时稳定，字幕简化，结束后产品退场并回到人物 CTA。若没有真实产品 Asset 或手势证据，降级为安全区产品组或 Fullscreen，不用假图和假手互动。

## 反例：哲学口播套全部组件

“我一直把生活推到以后”不自动需要 ProductFan、CommentCloud、PortfolioWall 和 FullScreenMeme。可依据表演与语义选择短语排印、心理距离变化或关系 Scene，也可以在真实反应承担表达时保持人物；题材不预设强度上限。Registry Coverage 属于组件冒烟测试，不属于创作验收。

## 交接合同

输入是完整观看任务、Beat/Scene、真实时序与精度、素材、人物/字幕预算、本片视觉语言、前后接口及硬约束/候选设计。输出包含设计理由、creativeBrief、源码/Props 的固定版本、Asset/Cue/Scene、coveredNarrativeBeatIds、内部命名事件帧、Preview/审阅证据和剩余限制。内容、时序或作品换版影响 Cue/AudioCue 并需复核；输出写入既有对象与创作决定，不另建事实源。完成后回到主工作流。

## 完整代码与生产案例

详细组件合同、Registry 设计和 Timeline 验证见：

- [组件与作品合同](references/remotion-component-contract.md)
- [完整创作案例](references/motion-graphics-casebook.md)

## 真实素材绑定前的审阅与渲染验证

EffectCue 或 ExplainerScene 绑定图片、视频、产品、证据或 UI Asset 前，先查看该 Asset 的真实内容、构图、运动路径和可用范围。AssetBinding 缺少必需内容、源文件不可用或 Props 不能完成组件任务时，Cue/Program 应进入 invalid 或 not_ready，并由 Web 与 Quality 显示具体原因；Renderer 不应把调试占位、通用文案或固定品牌渲染进正式画面。

视频 Asset 在 Cue 或 Scene 内要使用局部时间，确保从所选 source range 的起点播放，而不是继承全局 Composition Frame。每个代表性样例至少检查 Entry、Progressive、Settled 和 Exit；Settled Frame 要真正给观众识别、阅读或比较时间。

人物、字幕、证据和动效同屏时只设一个第一注意目标。进入全屏 Scene、人物做关键手势或证据正在阅读时，CameraPunch、大字幕、背景运动和 SFX 要相应退让。横版和竖版分别检查主体、动作路径、负空间和信息层级。

同类 Scene 批量生产前，先完成包含铺垫、运动、阅读与恢复的代表性连续样段，比较当前、最小处理、更强处理或不使用的实际结果。除信息理解外，还检查注意、记忆、情绪与节奏；移除效果后事实不变，并不证明效果没有价值。只有收益不成立或代价更大时才重新设计或取消；与 SFX 配合的事件须检查实际混合声画，不能用无声代理代替整段验收。

## 平台维护分支

只有平台开发任务进入以下流程；单片原创不以注册组件为前提。

## 新组件代码开发流程

### 1. 写组件 Brief

说明观众任务、支持的内容结构、适用/不适用场景、Asset Slot、Props、画幅、运动、质量规则和降级。不要从视觉外观开始。

### 2. 设计静态状态

用固定 Fixture 做 Settled Frame，先验证信息层级、文本、资产、人物和画幅。没有稳定帧通过，不开始复杂动画。

### 3. 实现 TypeScript 组件

VideoFlowCut 当前 Runtime 使用 TypeScript/React/Remotion。推荐组件只依赖明确注入的 Props、Asset URL 和 Remotion API，保持纯函数式和确定性。示意：

```tsx
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

type MetricBackdropProps = {
  value: number;
  unit: string;
  label?: string;
  accent?: string;
};

export function MetricBackdrop(props: MetricBackdropProps) {
  const frame = useCurrentFrame(); // 在外层 Sequence 内是 Cue 局部帧
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, Math.round(fps * 0.3)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  return (
    <AbsoluteFill aria-label="metric-backdrop">
      {/* Settled Frame 的层级先成立，再让 progress 建立它 */}
    </AbsoluteFill>
  );
}
```

实际 Component 应从统一 Design Tokens、Asset Resolver 和安全工具库工作，避免每个组件复制字体加载、媒体错误和 Easing。

### 4. 注册 Props 与 Asset Slot

Props Schema 校验文本长度、数字范围、枚举和默认值；Asset Slot 指定 kind、required、数量和裁切策略。运行时缺必要 Asset 应产生明确 blocking 或降级，不渲染假卡片。

### 5. 测试

- 类型与 Schema；
- 最短/最长时长；
- 竖屏/横屏；
- 文本边界和中文/英文；
- Asset 缺失；
- Cue 在 Timeline 后半段的局部时间；
- Player 与 Render；
- Entry/Settled/Exit Golden；
- 性能与内存。

### 6. Registry 和版本

组件通过后加入 Registry，生产 Skill 才能发现。破坏性 Props 变化需要版本或迁移；不能让旧 Revision 因组件更新变得不可渲染。

## 修改已有组件还是新建组件

如果只是内容、颜色、强度、布局或时机变化，优先 Props/EffectCue；如果观众任务和信息结构相同，复用组件。若任务、结构和稳定画面完全不同，开发新组件或 Scene。共享色板不表示同一 Asset。

例如“展示三项分类”和“展示三款产品”都可能是三个对象，但前者需要比较坐标与类别关系，后者需要真实产品与视觉陈列；不应仅因数量相同复用一个通用 ThreeCards。
