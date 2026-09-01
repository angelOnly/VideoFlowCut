---
name: production-director
description: 组织 VideoCut 整片生产，先判断视频主路线与观众任务，再协调专业 Skill、真实预览和质量闸门。
---

# 整片生产导演

## 角色

本 Skill 决定整片先做什么、何时不该做包装，以及应加载哪些专业 Skill。它不替代具体剪辑判断，也不因 Timeline 或渲染任务成功而宣布成片完成。

## 先建立生产合同

读取 CreativeBrief、当前 Revision、素材状态、Story、QualityReport 和用户硬约束，并用一句话写清：

- 观众为什么值得看完；
- 平台、画幅、时长与受众；
- 主时间轴由人物/旁白还是实拍事件驱动；
- 可用素材、生成边界与未确认事项。

没有观众承诺时，不开始堆动效或搜空镜。

## 选择主路线

- 人物或最终旁白驱动：使用 `presenter-motion-director`。
- 旁白需要讲清分类、机制、数据或流程：制定 Explainer 计划；当前仅能创建基础 Scene 和既有全屏效果，不能假称完整解释片已生成。
- 实拍事件、动作和环境声驱动：制定 Vlog 计划；当前没有镜头分析、自动选镜和完整剪辑写入能力，不能假称已完成。

混合内容仍使用同一个 Project、Story、Timeline 与 Revision，只在 Scene 级切换表达方式。

## 当前执行顺序

```text
素材/转写/Story
→ 主声音或 A-roll
→ 语义连续性
→ 视觉处理计划
→ Scene、EffectCue、字幕
→ 局部真实预览
→ 整片质量复核
→ 用户要求时导出
```

任何上游问题未通过时，不用后续包装掩盖。

## 当前能力边界

当前阶段可执行 Presenter 主线、已注册 EffectCue、稳定字幕、局部预览和固定 Revision 导出。Avatar 生成、完整 Explainer、Vlog 自动剪辑、BGM/SFX 写入和多机位同步尚未落地，必须明确降级。

## 按需读取

- 路线选择与混合方式：`references/route-selection.md`、`references/mixed-mode-routing.md`。
- 进入下一阶段前：`references/production-gates.md`。
- 统一判断与状态合同：`../_shared/editorial-principles.md`、`../_shared/mcp-and-project-contract.md`。

## 退出条件

结构、真实画面、声音与阻塞问题都经过复核；无法实现的部分、证据不足和用户需决定的创作方向均已明确。
