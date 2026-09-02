# MCP、Revision 与真实审片合同

Project Revision 是当前代码中的唯一工程事实。聊天、SkillExecutionReport、Web 本地状态和渲染缓存都不能成为第二份 Timeline。所有写操作应先读取当前 Revision，以 `base_revision_id` 提交，随后读回新 Revision、ImpactReport 和目标对象。

Revision 冲突不是简单重试错误。发生冲突后必须重新读取项目，理解用户或其它 Agent 改了什么，再判断原决定是否仍成立。盲目把同一命令重放到新版本，可能覆盖用户刚完成的手工调整。

ProductionRun 用于记录“为什么这样剪”，但它不能复制 Project Snapshot。报告应记录实际加载的 Skills、关键证据、被拒绝方案、不处理决定、MCP 操作和真实预览结论。

视觉修改必须经过真实合成验证。至少观察进入前、运动中间、稳定状态和退出，并播放前后语句。声音修改必须实际回听。QualityReport 中没有 Editorial Review 时，不得把它解释成审美通过。
