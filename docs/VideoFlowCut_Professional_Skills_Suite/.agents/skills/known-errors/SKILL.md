---
name: known-errors
description: Diagnose and recover from VideoFlowCut project, Bridge, asset, timing, avatar, Remotion, browser, revision, quality, and export failures without hiding capability gaps or corrupting project state.
---


# 已知错误、降级与恢复

## 角色

本 Skill 是统一故障路由，不只处理异常码，也处理常见“技术成功但成片失败”的质量症状。它要求先分类、保留证据、最小恢复，再决定重试、降级或阻断。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 任何 Job、MCP、Web、Bridge、Asset、Avatar、Remotion 或导出失败。
- 结果未知、Revision 冲突或素材 stale。
- 成片出现语义、遮挡、时序、过度动效、单调或 PPT 化症状。

## 何时不使用

- 尚未执行任何操作，只在讨论理论。
- 用户明确提出新的创作方向而非错误。

## 前置读取

- 错误原文、HTTP 状态、Job、Run 和日志。
- 当前 Revision、幂等键和目标对象。
- 相关 Preview、QualityReport 和 Asset 状态。
- 实时 workflow/tool schema。

## 必须掌握的证据

- 失败发生在哪一层：输入、状态、能力、任务、输出、合成、质量或权利。
- 请求是否可能已经提交。
- 当前项目是否仍一致。
- 重试是否会重复写入。
- 是否存在安全降级。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这是技术错误、能力缺失还是创作错误？
- 失败是否可重试？
- 需要重新读取 Schema/Revision 吗？
- 是否应只重跑局部派生任务？
- 降级会损失什么观众效果？
- 何时必须阻断而不是继续生成？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 分类

```text
contract
revision
job
asset
rights
speech
avatar
timing
scene
remotion
browser
quality
export
unknown
```

### 2. 保存原始证据

保留：

- error；
- status；
- request summary；
- idempotency key；
- run/job id；
- revision；
- logs；
- output list；
- time；
- screenshots。

不要先改写错误再报告。

### 3. 判断是否已产生副作用

超时或断连时先对账：

- Revision 是否变化；
- 对象是否存在；
- Job 是否完成；
- 输出是否已本地化。

### 4. 选择恢复策略

- 重新读取 Schema；
- 重新读取 Revision；
- 重跑失败派生任务；
- 局部重生成；
- 换素材；
- 换 Scene 语法；
- 降级时间精度；
- 改用稳定字幕；
- 改成 Cutaway；
- 阻断并请求最小补充。

### 5. 创作失败诊断

常见症状：

- 视频能剪但无聊；
- 动效很多但像 PPT；
- 语义不完整；
- 字幕和 MG 竞争；
- B-roll 无关；
- 人物和效果不匹配；
- 节奏均匀；
- 音乐压对白。

这些不是“渲染成功”能解决的问题，应路由到对应专业 Skill。

### 6. 验证恢复

任何恢复后都重新读回状态，并只验证受影响范围和必要完整播放。

## 禁止行为

- 看到 500 就无条件重试。
- 结果未知时重复写入。
- 修改数据库修复业务状态。
- 用静默降级隐藏能力缺失。
- 把技术错误和审美问题混为一谈。
- 删除失败证据。
- 用包装掩盖语义或表演问题。

## 验证

- 错误分类和根因有证据。
- 项目状态没有半写。
- 恢复策略没有重复副作用。
- 降级影响已记录。
- 修复后完成写后读回和真实预览。

## 退出条件

- 错误已恢复、明确降级或明确阻断。
- 不存在结果未知。
- 用户/开发者能从报告理解原因和下一步。
- 项目可安全继续。

## 按需读取的专业参考

- `references/recovery-matrix.md`：各错误域的重试、对账、降级和阻断。
- `references/bridge-and-api-errors.md`：FunASR、OmniVoice、MiniMax Bridge 状态和 Schema 错误。
- `references/creative-failure-patterns.md`：能渲染但语义、节奏、画面和声音失败的症状路由。
