---
name: web-editor-operator
description: 通过 VideoCut Web 工作台定位对象、进行可验证的空间微调，并检查真实合成画面。
---

# Web 工作台操作与视觉微调

## 使用范围

当需要查看真实合成、定位 Scene/Item/EffectCue，或完成 MCP 当前无法表达的空间微调时使用。本 Skill 不重复提交已经由 MCP 完成的同一修改。

## 操作前

1. 执行 `project-basics`，读取当前 Revision、目标对象和目标帧。
2. 使用 `get_editor_url` 或 `focus_editor_object` 获取精确链接。
3. 用至少两个证据确认对象选中：URL 参数、Inspector、Timeline 高亮、Scene 卡或 Preview 选框。

## 调整原则

先解决主体是否清楚、信息是否可读、遮挡与安全区，再调整空间平衡、运动和最后的颜色材质。先做小幅、可逆变更，并比较原方案、调整方案和不使用该效果的方案。

涉及人物、字幕或前景时，检查进入帧、运动中间帧、稳定帧、退出帧及前后连续播放；不能只看一张静帧。

## 当前能力边界

Web 与 MCP 共享 Revision，但现有数据模型没有通用的位置、缩放或逐帧变换字段。若界面无法表达目标微调，应停止并说明缺少的项目能力，不在浏览器中绕过项目状态。

## 按需读取

- 精确定位与版本对比：`references/editor-navigation.md`。
- 构图、遮挡和稳定帧调整：`references/visual-adjustment.md`。
- 共同状态规则：`../_shared/mcp-and-project-contract.md`。

## 退出条件

目标对象、Revision、Inspector 值与真实合成预览一致；冲突、素材未就绪或任务失败时交给 `known-errors`。
