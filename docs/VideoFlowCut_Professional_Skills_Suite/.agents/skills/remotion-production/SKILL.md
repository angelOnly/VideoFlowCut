---
name: remotion-production
description: Design, author, patch, place, preview, and validate Remotion scenes and effects as a coherent visual system with editable properties, meaningful motion, settled-frame quality, and safe code execution.
---


# Remotion 动效与场景生产

## 角色

本 Skill 将已经确定的视觉任务实现为 Remotion。它不是模板调用说明，而是视觉设计与运动设计合同：先决定观众任务和 Settled Frame，再写组件和动画。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 创建或修改 Remotion Scene/Effect。
- 实现 Presenter 前后景、解释场景、字幕、图表或 UI。
- 将 StylePack 应用到可复用组件。
- 需要建立新的 Scene/Effect Blueprint。

## 何时不使用

- 尚未决定视觉任务和时机。
- 真实素材或证据已经足够，不需要图形。
- 只做项目状态读取。

## 前置读取

- VisualTreatmentPlan、Scene、EffectCue 和 MotionTiming。
- StylePack、目标画幅、人物和字幕安全区。
- 当前 Component/Scene Registry。
- 目标合成帧和参考视频分析。

## 必须掌握的证据

- 观众任务、内容、持续范围和层级。
- Settled Frame 应呈现的完整信息。
- 入场、稳定、阅读和退出。
- 可编辑字段、自然尺寸、资产和字体。
- 代码安全和允许组件。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这个 MG 帮助观众更快理解什么？
- 文字以外的视觉机制是什么？
- 为什么运动、材质和构图适合内容？
- 动画稳定后画面是否单独成立？
- 它与整条视频的视觉系统是否一致？
- 是否有更简单的图形或真实素材方案？
- 组件是否可编辑和可复用而不僵化？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 编写 Design Map

编码前明确：

- audience task；
- exact content；
- visual mechanism beyond text；
- timeline span；
- overlay / full-frame；
- settled frame；
- reading time；
- natural size；
- composition；
- motion beats；
- editable properties；
- StylePack。

### 2. 先设计 Settled Frame

先做静态构图，确认：

- 信息层级；
- 字体；
- 留白；
- 对齐；
- 人物/字幕安全；
- 颜色语义；
- 完整性。

如果稳定画面像普通 PPT，动画不会自动救它。

### 3. 选择视觉机制

可使用：

- 空间；
- 状态；
- 颜色；
- 数据；
- 路径；
- 遮罩；
- 物体；
- 镜头；
- 字体；
- 图像/视频；
- 三维预制素材。

不要默认卡片。

### 4. 设计运动句法

为每个对象定义：

```text
pre-entry
→ active motion
→ settle
→ hold
→ exit
```

运动速度和方向必须有语义或注意力理由。

### 5. 组件和代码

优先使用注册组件与 StylePack。新增组件应：

- props 可序列化；
- 尺寸明确；
- 不依赖本地临时服务器；
- 资产可定位；
- 字体可用；
- 确定性渲染；
- 无未审查任意代码执行。

### 6. 反默认设计检查

主动质疑：

- Glow；
- Glass；
- Blur；
- Gradient；
- Shine；
- Sweep；
- Spring；
- 圆角卡片；
- 持续漂浮。

只有内容需要时使用。

### 7. 放置与合成

基于真实目标帧决定位置、大小和前后景。不要只在透明画布中预览。

### 8. 验证

检查：

- 进入帧；
- 中间动作；
- Settled Frame；
- 退出；
- 完整合成；
- 连续播放；
- Web 与导出 Snapshot 一致。

## 禁止行为

- 未明确内容、时段和角色就开始写 JSX。
- 把所有 MG 做成同一种卡片。
- 用发光、玻璃、渐变和 spring 假装高级。
- 只看透明组件，不看最终合成。
- 只验证工具返回成功。
- 在服务器执行任意未审查代码。
- 组件属性不可编辑。
- 动画持续运动没有稳定阅读期。

## 验证

- Settled Frame 单独成立。
- 文字以外存在真实视觉机制。
- 运动与语义和 AttentionCurve 一致。
- 实际合成无遮挡和冲突。
- 组件可编辑、可复用、可确定性渲染。
- 进入、保持和退出完整。

## 退出条件

- Remotion Scene/Effect 已注册或安全创建。
- Web Preview 和导出使用同一 Snapshot。
- 没有 blocking 级设计、代码或合成问题。
- 完整声画复核通过。

## 按需读取的专业参考

- `references/design-map-and-settled-frame.md`：编码前 Design Map 与稳定画面设计。
- `references/visual-mechanisms.md`：超越文字卡片的视觉机制。
- `references/motion-grammar.md`：方向、速度、停顿、期待和释放。
- `references/anti-ppt-and-style-system.md`：反 PPT、反默认材质与统一视觉语法。
- `references/remotion-code-contract.md`：可序列化 props、确定性渲染和安全执行。
