---
name: quality-verification
description: 结合结构读回、真实合成预览、完整听看和模式专项标准，验证 VideoCut Revision 是否真正成立。
---

# 质量验证与整片审片

## 使用范围

关键 Revision、声音/字幕/人物/效果修改后、用户审片前和导出前使用。技术成功不是成片通过。

## 必须执行

1. 执行 project-basics，读取 read_quality_report、目标对象、ImpactReport 与最新 Revision。
2. 对改动范围使用 render_preview_range，检查进入、运动中间、稳定、退出和连续播放。
3. 完成四轮审片：只听声音、静音看画面、完整声画、首次观众视角。
4. 按 Presenter、Explainer 或 Vlog 的实际主路线执行专项检查；当前无法完整实现的模式应给出 inconclusive，而非通过。
5. 先修复最高优先级的根因，再做一次有界复核，不无限自动修改。

## 问题记录

当前 QualityReport 只能持久化 blocking 和 warning。major、minor、suggestion 可写入本次 SkillExecutionReport，必须附 Revision、时间范围、可观察证据、影响、建议修复和验证方式，不能伪造成系统已检测结果。

## 按需读取

- 四轮审片：references/four-pass-review.md。
- 模式专项标准：references/mode-specific-rubrics.md。
- 问题严重级别与最小修复：references/severity-and-fix-loop.md。
- 参考视频只提炼语法：references/reference-comparison.md。

## 退出条件

结构与真实画面一致，blocking 为零；未验证、能力降级、major 审美取舍和用户需决定事项都已明确。
