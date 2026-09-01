# 恢复矩阵

| 类型 | 先检查 | 可重试 | 必须阻断 |
|---|---|---|---|
| revision | 最新 Revision、目标对象 | 重新判断后 | 无法合并用户变更 |
| asset | 本地文件、hash、ready 状态 | 派生任务 | 权利 unknown |
| job | idempotency、状态、输出 | 确认未完成后 | 结果未知无法对账 |
| timing | timing precision | 降级/预览微调 | unavailable 且依赖同步 |
| avatar | capability、输出、mask | 局部重生成 | 人物身份/口型严重失败 |
| remotion | props、asset、font、build | 修复后局部渲染 | 任意代码风险 |
| export | snapshot、streams、file | 同一 snapshot 幂等重试 | rights/quality gate 未过 |

恢复必须记录原错误、动作和验证。
