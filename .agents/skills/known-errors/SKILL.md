---
name: known-errors
description: 诊断 VideoCut 的 Revision、素材、Bridge、渲染、质量和导出失败，并在不重复副作用的前提下恢复或降级。
---

# 已知错误、降级与恢复

## 使用范围

任意 MCP、Web、Worker、Bridge、预览或导出任务失败、冲突、超时或结果未知时使用；也用于“能渲染但不好看”的创作失败路由。

## 必须执行

1. 保存原始错误、项目与 Revision、对象、Job/run_id、幂等键、请求摘要、输出和观察时间。
2. 先分类为 contract、revision、job、asset、timing、scene、remotion、quality、export 或 unknown。
3. 超时或断连时先读回 Revision、对象和 Job，确认是否已产生副作用后再重试。
4. 每次恢复后写后读回，并只重验受影响范围和必要的连续播放。

## 常见处理

- Revision 冲突：重新读取最新状态、重新判断，不静默覆盖。
- Bridge Run 丢失、失败或缺输出：保留诊断，检查当前 Schema、输出种类和源媒体，再决定是否重试。
- QUALITY_GATE_BLOCKED：修复阻塞状态，不绕过导出门禁。
- 动效像 PPT、B-roll 无关、字幕抢画面、音乐压对白：路由到对应专业 Skill，而不是把创作问题伪装成 HTTP 错误。

## 禁止行为

- 看到 500 或超时就重复提交。
- 删除对象或错误证据来掩盖问题。
- 用静默降级掩盖当前能力缺失。
- 将技术恢复当作审美通过。

## 按需读取

- 错误域的重试、降级和阻断：references/recovery-matrix.md。
- Bridge HTTP 状态：references/bridge-and-api-errors.md。
- 创作失败症状路由：references/creative-failure-patterns.md。

## 退出条件

错误已恢复、明确降级或明确阻断；项目没有结果未知的半写状态，下一步和代价可被用户理解。
