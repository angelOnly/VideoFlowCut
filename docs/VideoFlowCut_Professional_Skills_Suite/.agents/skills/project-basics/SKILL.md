---
name: project-basics
description: Operate VideoFlowCut projects safely using the shared Project, Story, Scene, Timeline, Revision, Job, Preview, and Quality model. Use before any project read or write so creative work remains revision-safe and inspectable.
---


# 项目与 Revision 基础

## 角色

本 Skill 负责项目对象、Revision、写后读回和证据边界。它不做审美判断，也不替代视频类型 Director。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 任何项目读写任务。
- 需要定位 Project、Scene、Timeline Item、EffectCue、Caption、Audio 或 Job。
- 发生 Revision 冲突、stale 对象或结果未知。

## 何时不使用

- 单纯讨论剪辑理论且不访问项目。
- 只研究外部参考视频，不产生项目状态。

## 前置读取

- 当前 MCP 工具描述。
- `../_shared/mcp-and-project-contract.md`。
- 项目的 CreativeBrief 与当前 Revision。

## 必须掌握的证据

- project_id、active_timeline_id、current_revision_id。
- 目标对象 ID、对象类型和所属 Scene。
- 相关 Job、Preview、QualityReport 和 ImpactReport。
- 写操作的 base revision 与幂等语义。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前要改的是源事实、Story、Scene 还是 Timeline 表现？
- 这个对象是否由上游对象派生，直接改它会不会被下一次重编译覆盖？
- 修改的最小原子范围是什么？
- 哪些下游对象会 stale、重算或保持？
- 是否需要先 dry-run / impact preview？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 明确项目目标

先定位 Project、Timeline 和当前 Revision。不要从聊天历史推断项目状态。

### 2. 区分对象层级

```text
Asset / Transcript      源事实
Story / SemanticUnit    内容与叙事
Scene / EffectCue       视觉表达
Timeline / Item         最终播放结构
Preview / Export        派生产物
```

修改源事实、创作决定和最终表现是不同命令。不得用 Timeline 临时变更假装修改了 Story。

### 3. 选择最小写入单元

优先提交能够表达用户真实意图的高层操作。例如：

- 删除一段最终口播：改 Script / SemanticUnit；
- 换一个 Scene 的视觉语法：改 Scene；
- 微调一个图形位置：改 EffectCue / Item；
- 换 B-roll：改 SceneAssetBinding。

### 4. 预估影响

重大结构修改前读取或请求 Impact 预览，确认：

- 自动重算；
- 跟随移动；
- 保持绝对位置；
- 失去锚点；
- 需要重新渲染；
- 需要人工复核。

### 5. 原子提交与读回

所有相关变更使用同一 EditTransaction。成功后读回：

- new revision；
- changed objects；
- stale objects；
- dirty ranges；
- preview / quality status。

### 6. 冲突处理

若 base revision 过期：

1. 停止写入；
2. 读取最新 Revision；
3. 对比目标对象是否已改变；
4. 重新判断；
5. 仅重放仍然成立的意图。

## 禁止行为

- 把聊天记录或本地临时 JSON 当项目唯一事实。
- 直接查数据库绕过 Application 层。
- 在不读取 Revision 的情况下写入。
- 对多个相关对象逐个写入造成半完成状态。
- 工具成功后不读回对象。
- 在结果未知时盲目重试同一写操作。

## 验证

- 目标对象和 Revision 可读回。
- ImpactReport 与真实变化一致。
- Web 和 MCP 看到同一状态。
- 结构变化后相关 Preview/Quality 被正确标记。

## 退出条件

- 项目目标和当前 Revision 已确认。
- 修改已原子提交或明确未提交。
- 没有未解释的 stale / conflict / unknown outcome。
- 下一专业 Skill 能从项目状态继续工作。

## 按需读取的专业参考

- `references/project-object-model.md`：各项目对象的语义边界和修改层级。
- `references/revision-and-impact.md`：Revision 冲突、ImpactReport、DirtyRange 与结果未知处理。
