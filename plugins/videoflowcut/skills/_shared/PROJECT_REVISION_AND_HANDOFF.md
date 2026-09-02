# Project、Revision、Skill 交接与执行安全

## 一个事实源

Project Revision 是视频工程的唯一事实。Codex 对话、已加载 Skill、浏览器选中状态、临时 JSON、ProductionRun 报告和 Worker 内存都不能成为第二份 Story、Scene 或 Timeline。新会话恢复时必须重新定位 Project，读取当前 Revision、未完成 Job、最近 ImpactReport、素材就绪、Story、Scene、Timeline 和 Quality，再决定继续做什么。

当前第一版可以只有一个默认 Timeline/Sequence，但架构上必须区分平行成片版本和同一版本的 Revision。做短版、竖版或高光版不能通过覆盖长版或回退历史来实现。代码尚未支持多 Sequence 时，Skill 应明确这一能力缺口，不伪造版本对象。

## 读—判断—写—读回

所有确定性写入都遵循同一循环：

```text
确认 Project 和当前 Revision
→ 读取目标对象、上下文和依赖
→ 专业判断并比较方案
→ 使用 base_revision_id 原子写入
→ 读取新 Revision 和目标对象
→ 读取 ImpactReport / stale / Dirty Range
→ 视觉或声音验证
→ 将结果交回主工作流
```

MCP 返回 success 只证明命令执行，不证明对象关系、画面和听感正确。Web 和 MCP 不得同时提交同一个修改；Browser Operator 只通过可见 UI 和同一 Application Command 做空间性操作。

## 实时 MCP 输入合同

工具名、字段名和枚举以当前会话的 MCP Tool Schema 为准；本项目已验证的阶段一调用链和关键字段见 [MCP 执行合同](MCP_EXECUTION_CONTRACT.md)。该合同会被静态测试对照 `apps/server/src/mcp.ts`，不是需要人工维护的能力快照。

会创建或修改 Project Revision 的确定性命令必须携带刚读回的 `base_revision_id`。提交转写、语音、预览和导出等异步 Job 则使用其自身的 `asset_id`、`revision` 或 `idempotency_key`，不能为了形式统一伪造 `base_revision_id`。每次写入返回新 Revision 后，下一次写入必须以新 Revision 为起点。

## 对象选择

用户意图应落到最接近的对象：删一句改 SemanticUnit/Script；修改叙事顺序改 Story；改变一段怎样被看见改 Scene/Visual Treatment；微调某个动画改 EffectCue；替换 Effect 绑定改 AssetBinding；替换单条 Cutaway 源素材改 `replace_scene_asset`；移动物理播放范围改 TimelineItem；重新导出不修改创作状态。

把所有问题都塞进 Timeline 会丢失语义；把所有微调都写回 Story 又会让上层对象承载物理细节。选择错误层级会导致 Impact 传播不可靠。

## 专项 Skill 的交接合同

“输入”和“输出”不是函数 Schema，而是阶段交接：

- **进入事实**：当前 Revision 中哪些对象和证据已经稳定；
- **阶段结果**：实际修改了哪些项目对象，或形成了什么当前无法执行但可审查的决定；
- **失效传播**：哪些下游需要重算、stale、review 或重新生成；
- **验证证据**：读回什么结构、看哪些画面、听哪些声音。

专项 Skill 完成后必须把这四项交回主要工作流。只记录 `loadedSkills`、只写一句“字幕已处理”或只产生一个 Job ID，都不算完成交接。

## Revision 冲突和结果未知

发生 Revision 冲突时不覆盖。重新读取最新 Project，确认其它修改改变了什么，再判断原决定是否仍成立。超时、断连或 Bridge 重启时，先检查 Job、Revision、Asset 和已下载输出；只有确认没有副作用才重试。幂等键用于防止重复任务，不用于掩盖状态不清。

## ProductionRun

ProductionRun 和 SkillExecutionReport 用于审计：选择了哪个主工作流、实际读了哪些 Skill、做了什么决定、拒绝了什么方案、调用了什么 MCP、查看了哪些 Preview。它们不参与 Remotion 编译，删除报告不能改变成片。
