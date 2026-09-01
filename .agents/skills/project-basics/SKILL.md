---
name: project-basics
description: 在 VideoCut 中安全读取和修改同一份 Project Revision；适用于任何项目读写、任务提交和导出前。
---

# 项目基础与 Revision 安全

## 角色

本 Skill 是所有项目操作的共同入口。它只使用 Editing Application 与 `video-editor-mcp` 的当前状态，不把对话、旧响应或本地文件名当作项目事实。

## 每次写入前

1. 阅读 `AGENTS.md`，用 `list_projects`、`target_project` 或显式 `project_id` 确认项目。
2. 调用 `read_project`，记录当前 Revision、目标对象及其上下文。
3. 区分 Asset、Transcript、SemanticUnit、Story、Scene、Timeline Item、Caption、EffectCue、ActorPerformance 与 Job。
4. 以当前 `base_revision_id` 提交写入；同一修改不得同时由 MCP 和 Web 重复提交。

## 写后验证

1. 重新读取 Project 或受影响对象。
2. 读取 `read_impact_report`，确认新 Revision、脏区和失效对象。
3. 视觉改动还要交给预览或 `web-editor-operator` 检查真实合成，而不只检查结构。

## 专业判断

- 修改要落在最接近用户意图的对象上：删一句改 Script，换视觉模型改 Scene，微调效果改 EffectCue，重新导出不改创作状态。
- Revision 冲突、超时或结果未知时，先读回 Revision、对象和 Job 再判断是否重试；不得覆盖或重复写入。
- SkillExecutionReport 只作为本次任务的可读报告，不创建第二份项目状态。

## 按需读取

- 修改对象层级时读 `references/project-object-model.md`。
- 冲突、影响范围或脏区判断时读 `references/revision-and-impact.md`。
- 所有创作判断遵守 `../_shared/editorial-principles.md`、`../_shared/mcp-and-project-contract.md` 与 `../_shared/decision-record.md`。

## 退出条件

目标对象、最新 Revision 与影响范围均可读回；未知副作用、冲突或阻塞错误没有被隐藏。
