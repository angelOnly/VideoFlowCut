---
name: remotion-production
description: 作为跨视频类型的完整 Motion Graphics 子工作流，从视觉任务、Style 对齐、Design Map、代表性样例、Registry/组件、Props、AssetBinding、局部时间和 Timeline 放置一直负责到 Player/Render 真实验证。
---

# Remotion Motion Graphics 完整生产工作流

## Remotion 在系统中的位置

Remotion 是表现与合成层，不是导演。它可以用 React、CSS、SVG、视频、图片、文字和已注册组件表达 Scene 与 EffectCue，但“为什么要加、用哪种视觉机制、什么时候出现、是否值得离开人物”来自主要工作流、Visual Treatment、Scene Planning 和专业证据。

`remotion-production` 对一次 Motion Graphics 子流程从输入到真实合成负责。它既可被 Presenter、Explainer、Vlog 调用，也可在用户只要求创建或修改一个 Scene/Effect 时独立进入。它必须像完整工程手册一样说明：选择现有 Registry 或开发组件、编码前输入、Style、Design Map、Settled Frame、Props、AssetBinding、局部时间、放置、更新、批量一致性、安全和验证。

## 先确认任务是生产还是代码开发

### 使用现有 Registry

视频生产默认使用 `browse_effect_types` 中的已注册类型和当前 Scene Runtime。通过 `manage_effect_cues` 创建带叙事目的、观众任务、语义锚点、空间锚点、AssetBinding、Props、Motion、StylePack 和质量规则的 Cue。这条路径可以直接进入 Project Revision。

### 开发新组件

用户需要现有 Registry 无法表达的新视觉机制时，这是代码开发任务，不是普通视频生产。必须设计组件合同、实现、注册、测试、Golden Frame、Player/Render 一致性和安全检查，完成后才能被生产 Skill调用。当前项目不允许 Codex 在生产任务中把任意 JSX 直接写入服务器执行。

### 修改现有组件

若问题来自组件实现，先区分是某个 Cue 的 Props/布局，还是所有使用该组件的 Runtime 代码。修改组件会影响多个 Project/Revision，应走代码评审和回归；修改单个 Cue 只影响当前项目。

## 编码或选择组件前的输入

必须知道：这个 MG 在剪辑中承担什么观众任务；准确文字、数字、媒体和事实；目标画幅、Scene 和放置范围；人物、字幕、证据和安全区；语音/动作/声音时机；Style 来源；需要暴露为 Props 的可编辑值；可用 Asset 和权利；当前 Registry 与 Runtime 能力。

只问会实质改变结果的高杠杆信息。若风格已经由 StylePack、参考视频或已接受组件确定，不要每个 MG 都重新询问。

## Style 对齐和代表性样例 Gate

“高级、现代、专业”是目标，不是具体视觉语言。需要转成字体层级、色彩语义、间距、密度、材质、运动速度、边角和声音强度。多个相关 MG 在批量生产前应先做一个真实 Beat 的代表性样例，放入目标画面并检查 Settled Frame。样例确认的是视觉语言，不意味着所有 MG 都复用同一个卡片形式。

当前代码的 StylePack Runtime 消费仍有限，因此 Skill 可以要求一致性并通过 Props/现有组件实现，但不能声称一个 stylePackId 已自动控制全部字体、色彩和运动。真实 Preview 是最终证据。

## Design Map

批量或复杂 MG 前，为每个计划项写紧凑 Design Map：观众任务、准确内容、非文字视觉机制、语义范围、进入/稳定/退出、Settled Frame、阅读时间、大小、构图关系、AssetBinding、Props、是否与另一个 MG 有意重复、降级和验证。

Design Map 防止两个极端：所有内容都套同一圆角卡片；每个 MG 风格和运动完全不同。共享的是视觉语言，形式由内容任务决定。

## 先设计 Settled Frame

动画最终停在哪里，比从哪里飞进来更重要。Settled Frame 应在静止状态下完成信息层级、空间关系、人物和字幕保护、阅读和风格。先完成稳定构图，再设计运动如何建立它。

如果一个画面只有持续漂浮、Glow 和粒子时才显得丰富，说明稳定状态可能没有信息结构。复杂文字不能通过缩小塞入；应简化、分阶段或改为全屏 Scene。

## 视觉机制而非文字容器

MG 可以使用空间分组、状态变化、路径、数量、层级、比较、时间和真实素材。短结论可以用排印；分类需要共同坐标；流程需要持续对象和路径；数字需要单位和基线；证据需要来源；产品展示需要真实 Asset。

默认 Glow、Glass、Gradient、Card、Spring、Sweep 和 Shine 都需要内容理由。它们不是“高级感”的同义词。

## Registry、EffectCue 与真实素材

当前 Registry 包含 MetricBackdrop、ProductFan、GlowCTA、PortfolioWall、CommentCloud、EvidenceCard、CameraPunch、FullScreenMeme、DeviceShowcase、ContentCarousel、EndCard。

这些名称表示能力，不表示每条视频都要使用。ProductFan 必须绑定真实产品；PortfolioWall 使用实际封面；CommentCloud 使用真实评论；EvidenceCard 使用来源素材；DeviceShowcase 使用真实 UI/截图。没有 AssetBinding 时，应选择不依赖素材的机制或停止，不用占位图冒充完成。

`quality_rules` 当前只接受代码定义的枚举，创作理由写 narrative_purpose、audience_task 和 note，不把任意自由文本塞进质量规则。

## Props 设计

Props 应暴露用户可见且可能变化的内容：文字、数字、主色、强调色、图片/视频 Asset、布局选项、强度和必要 Motion。不要把内部实现细节全部暴露，也不要把内容硬编码进组件。

Props 需要默认值、合法范围、类型和回退。Asset 通过项目 Binding 传入，不在组件中硬写本地路径或远程 URL。组件不得自行联网或读取文件系统。

## 局部时间与 Remotion Sequence

Cue 在整条 Composition 中可能从第 1000 帧开始，但绑定视频、内部动画和计数通常需要从 Cue 局部第 0 帧开始。组件应使用局部 Frame 或在外层 `Sequence` 中重置时间，不能直接把全局 Composition Frame 当作素材内部帧，否则晚时间 Cue 可能从视频中间或末尾播放。

Timeline 范围必须容纳 Enter、Settled、Hold 和 Exit。不能用更短 Item 截断组件内部未完成动画；主线时长变化时，重新编译或调整 Cue，而不是依赖偶然裁切。

## Natural Box 与 Timeline Canvas

Overlay 组件的自然 Asset Box 应紧密包围可见内容，便于定位；真正全屏 Scene 才占满画布。把所有 MG 都做成全画布透明组件，会让 Inspector、碰撞和布局难以理解。

最终放置要结合目标帧、人物、字幕、证据和画幅。固定 Safe Zone 不是万能答案；同一 Anchor 只有在观众任务和构图关系重复时才应复用。

## Motion Grammar

运动表达信息状态：预进入建立期待，主要动作完成变化，Settled 提供阅读，退出为下一事件让路。速度、距离、Easing 和强度应匹配对象重量与内容语气。大产品、轻标签、严肃证据和喜剧反应不应共享同一 Spring。

MotionPreset 字段存在不代表 Runtime 已完整实现所有语法。当前组件实际消费什么必须通过代码和 Preview确认。`effect-timing` 负责语义落点，`depth-composition` 负责空间路径。

## 响应式与多画幅

组件应根据画布和安全区布局，而不是使用只对 1080×1920 有效的绝对坐标。9:16 与 16:9 可能需要不同对象排列、字体、行数和主体位置；不能简单缩放。至少保存代表性竖/横 Golden Frame，若第一版只支持主画幅，应明确降级。

## 批量生产和一致性

多个 MG 批量生成前比较 Design Map，先通过一个样例，再按组生产。完成后并排查看 Settled Frame：色板、字体、运动语气和材质应一致；重复形状、Anchor 和节奏应来自重复任务，而不是模板习惯。连续多个卡片式 Scene 应重新设计。

## 当前代码安全边界

生产只使用已注册组件。未来开放代码型 MG 时必须：静态分析、允许 Import/API、禁止文件/网络访问、构建超时、沙箱、Props Schema、注册和测试。不要在 Skill 中提供一个“生成失败就手写任意 JSX”的后门。

## 当前 EffectCue 写入合同

当前 `manage_effect_cues` 的核心字段可以理解为四组：

| 组 | 字段 | 作用 |
|---|---|---|
| 叙事 | `narrative_purpose`、`audience_task`、`note` | 为什么存在，观众要获得什么 |
| 绑定 | `scene_id`、`semantic_anchor`、`anchor_target_id` | 服务哪个 Scene/语义以及关系 |
| 表现 | `type`、`layer`、`spatial_anchor`、`asset_bindings`、`props`、`style_pack_id` | 使用什么组件、素材和构图 |
| 时间/质量 | `start_frame`、`end_frame`、`motion`、`quality_rules` | 物理范围、内部运动和可执行检查 |

示意 Payload（字段必须以实时 Schema 为准）：

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
  },
  "quality_rules": ["protect_text_readability", "require_asset_binding"]
}
```

不能复制这个示例的 quality rule 字符串；当前代码使用枚举，必须读取实时列表。示例的重点是把“证据卡出现”写成可解释合同，而不是只给 type 和时间。

## Scene 组件与 Effect 组件

Effect 通常在已有 Scene 中短时增加变化；Scene 组件建立完整视觉模型。一个需要 8 秒展示流程的内容不应被强行作为人物旁边的小 Effect；一个只强调两秒数字的内容不需要新建全屏 Scene。

Registry 设计应让生产 Skill先选择层级：

- Presenter Overlay：人物保持主视觉；
- Presenter Rear/Front/Actor Effect：与人物空间协同；
- Fullscreen Scene：视觉接管；
- Global/EndCard：跨 Scene 或结尾；
- Derived Asset：先离线生成复杂静态组合，Runtime 只负责时序和轻运动。

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

## 媒体 Asset 处理

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

```text
read_project / preview_timeline / inspect目标画面
→ visual-treatment-planning / scene-planning
→ browse_effect_types
→ 建 Design Map 和代表性样例
→ manage_effect_cues
→ read_project / read_impact_report
→ render_preview_range
→ track_job
→ inspect_composed_frames
→ Browser 连续播放
→ quality-verification
```

当前 `manage_effect_cues` 可以直接创建 Cue，但没有完整编辑/删除批量 Tool 时，应使用现有 Application/Web 能力或明确缺口。不要因为代码层可改就绕过项目 Revision。

## 验证

检查进入前、运动中、Settled、退出、前后语义、人物/字幕/证据、静音和有声。Player 与 Render Worker 必须使用同一 Revision Snapshot；浏览器好看而导出不同是 blocking。

## 案例：ProductFan

促销人物说“这次送出 70 台平板”。Design Map 的任务是让观众同时记住数量和产品。真实产品图绑定到 ProductFan，人物双手展开时对象从两侧进入，数字“70”在落音时稳定，字幕简化，结束后产品退场并回到人物 CTA。若没有真实产品 Asset 或手势证据，降级为安全区产品组或 Fullscreen，不用假图和假手互动。

## 反例：哲学口播套全部组件

“我一直把生活推到以后”不需要 ProductFan、CommentCloud、PortfolioWall 和 FullScreenMeme。可能最合适的是人物安静表达，随后一个全屏“以后不断后退”的简单关系 Scene。Registry Coverage 属于组件冒烟测试，不属于创作验收。

## 交接合同

输入是 Visual Treatment、Scene、Style、Asset、人物/字幕关系和时机。输出是可执行 Scene/EffectCue、Props、Binding、Motion、注册/代码状态和 Preview Evidence。它会影响 Preview/Quality。完成后回到调用它的主工作流。

## 完整代码与生产案例

详细组件合同、Registry 设计和 Timeline 验证见：

- `references/remotion-component-contract.md`
- `references/motion-graphics-casebook.md`
