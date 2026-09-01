---
name: remotion-production
description: 使用已注册的 VideoCut Remotion 效果设计可读的稳定画面、有效运动和真实合成验证，不把模板当作创作理由。
---

# Remotion 动效与场景生产

## 使用范围

需要创建或调整当前 Registry 中的 Presenter EffectCue，或审查其视觉机制、运动与合成效果时使用。

## 必须执行

1. 先读取视觉处理计划、Scene、EffectCue、目标画幅、字幕安全区和人物状态。
2. 在创建效果前写清观众任务、精确内容、视觉机制、覆盖还是全屏、稳定帧、阅读时间、强度和验证帧。
3. 使用 browse_effect_types 确认可用 Registry，再用 manage_effect_cues 写入。
4. 使用 render_preview_range 检查进入、中间、稳定、退出和完整合成；组件单测或工具成功不能替代预览。

## 专业判断

- 先设计稳定帧：信息层级、留白、人物/字幕安全和阅读时间成立后再做运动。
- 用关系、分类、状态、数据、路径或真实证据表达内容；短结论才适合纯排印。
- 不默认用发光、玻璃、渐变、圆角卡片、持续漂浮或同一种 spring。

## 当前能力边界

当前只允许既有 Effect Registry，EffectCue 也没有任意 props、外部资产绑定或安全的自定义 JSX 写入能力。不得编写或执行未审查的 Remotion 代码，更不能承诺未注册的新组件已经进入项目。

## 按需读取

- Design Map 与稳定帧：references/design-map-and-settled-frame.md。
- 可用视觉机制：references/visual-mechanisms.md。
- 运动方向、速度与停留：references/motion-grammar.md。
- 反 PPT 与风格系统：references/anti-ppt-and-style-system.md。
- 未来自定义组件的安全合同：references/remotion-code-contract.md。

## 退出条件

效果使用现有 Registry 可确定性渲染，稳定帧可独立阅读，真实合成没有遮挡或注意力冲突。
