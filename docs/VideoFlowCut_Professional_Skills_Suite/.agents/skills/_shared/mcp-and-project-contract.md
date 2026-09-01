# MCP 与项目状态共同合同

## 1. Skill 不实现业务状态

Skill 只负责观察、比较、判断、执行策略和验证。它不：

- 直接查询数据库；
- 维护第二份项目状态；
- 猜测表字段；
- 绕过 Application Command；
- 直接修改渲染缓存。

## 2. 使用实时工具描述

执行前读取当前 `video-editor-mcp` 工具描述和参数 Schema。不得因为旧文档或示例而猜字段。

## 3. 读后再写

任何写入前至少确认：

- 当前 Project；
- 当前 Revision；
- 目标对象；
- 相关上下文；
- 目标对象是否 stale；
- 受影响的 Scene / Timeline / Caption / Audio。

## 4. Revision 安全

写入必须基于明确 base revision。冲突时：

- 不强行覆盖；
- 重新读取最新状态；
- 重新判断；
- 只重放仍然成立的操作。

## 5. 写后读回

工具返回 success 只说明命令被接受。必须读回：

- 新 Revision；
- 目标对象；
- ImpactReport；
- DirtyRange；
- Preview / Quality 状态。

## 6. 视觉修改必须查看真实合成

结构正确不等于画面正确。对字幕、MG、B-roll、遮挡、构图、转场和动画，必须检查：

- 进入帧；
- 运动中间帧；
- Settled Frame；
- 退出帧；
- 前后连续播放。

## 7. 不重复提交

同一修改已经通过 MCP 提交时，不应再用 Web 重复提交；Web Operator 主要用于空间微调、真实预览和当前 MCP 无法表达的交互。
