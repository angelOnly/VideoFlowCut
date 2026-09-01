---
name: web-editor-operator
description: Use the VideoFlowCut Web editor as a precise inspection and adjustment surface. Use for object-focused UI edits, spatial tuning, timeline manipulation, revision comparison, and visual verification that cannot be safely inferred from structured state alone.
---


# Web 工作台操作与视觉验证

## 角色

本 Skill 让 Codex 像严谨的剪辑助理一样操作 Web，而不是随机点击。它主要承担定位、空间微调和真实画面检查，不负责凭空发明创意方向。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 需要检查真实合成画面。
- 需要调整位置、大小、层级、时长、曲线或 Inspector 属性。
- 需要比较 Revision、播放局部范围或检查 Timeline。
- MCP 已完成结构修改但必须通过 Web 验证。

## 何时不使用

- 已有结构化工具能完整表达修改且不需要视觉判断。
- 只需读取项目文本状态。
- 需要做宏观创作判断但尚未加载专业 Skill。

## 前置读取

- 当前 Project、Revision、目标对象 ID。
- 目标对象所属 Scene 和 Timeline 范围。
- 对应专业 Skill 的视觉或声音判断。
- Web 对象定位合同。

## 必须掌握的证据

- 稳定 URL、对象 ID、data-testid、可访问名称。
- Preview 当前帧与播放范围。
- Inspector 当前值。
- Timeline 选中状态、轨道和区间。
- 写入后的新 Revision。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前操作是在实现哪个已经确定的创作意图？
- 需要改结构还是只改表现？
- 应该观察进入、稳定、退出中的哪一帧？
- 调整后是否产生遮挡、越界或注意力冲突？
- 是否需要回到完整播放检查？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 精确定位

优先使用项目提供的对象深链接或 focus 能力。打开后确认：

- Project；
- Revision；
- Scene；
- 对象；
- Playhead；
- Inspector。

### 2. 操作前建立基线

记录：

- 当前属性；
- 当前截图或合成帧；
- 当前时间范围；
- 当前 Revision；
- 预期变化。

### 3. 执行最小调整

一次只修改一组相关属性。空间调整通常按：

```text
尺寸
→ 位置
→ 对齐
→ 层级
→ 安全区
→ 动画范围
```

避免同时大幅修改位置、时长、动画和样式，导致无法判断哪个变化产生效果。

### 4. 检查关键状态

视觉对象至少检查：

- 进入帧；
- 运动中间；
- Settled Frame；
- 退出帧；
- 前后连续播放。

音频调整至少播放切点前后。

### 5. 读回 Revision

确认 UI 显示的新 Revision、对象属性和 Quality 状态。若 MCP 已经提交同一修改，不重复提交。

### 6. 回到专业判断

Browser 操作只证明画面变化。最终是否“更好”由对应 Director / Quality Skill 判断。

## 禁止行为

- 依赖像素坐标盲点，不使用稳定对象标识。
- 在未确认选中对象时修改 Inspector。
- MCP 已提交后在 UI 再次重复写入。
- 只看单帧，不播放进入和退出。
- 为了让自动化容易而改变创作意图。
- 把 UI 显示成功当作审美通过。

## 验证

- 对象属性与预期一致。
- Revision 已变化且可读回。
- 关键帧没有遮挡、裁切或安全区问题。
- 局部连续播放无跳变。
- 必要时完整播放确认上下文。

## 退出条件

- 目标对象修改完成。
- 结构状态和真实画面一致。
- 没有重复提交或未确认冲突。
- 截图/播放证据已写入 SkillExecutionReport。

## 按需读取的专业参考

- `references/editor-navigation.md`：精确定位对象、Timeline 和 Revision 的操作协议。
- `references/visual-adjustment.md`：构图、空间和动画微调的观察顺序。
