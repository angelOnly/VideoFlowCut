# Skills V5 与架构 V6.2 的对应说明

## 1. 本版遵守的架构边界

V5 只调整 Codex Skills 的知识组织、主从关系、交接合同和验收，不新增 Skill Orchestrator、SkillInput/SkillOutput 数据库、第二份 Project 状态或新的后台流水线。所有 Skill 仍由同一个 Codex Agent 在适当阶段读取，并通过现有 MCP/Web 修改同一个 Project Revision。

## 2. 五层逻辑

```text
第一层：project-basics、web-editor-operator、asset-import、transcription、voice-production、export、known-errors
第二层：production-director
第三层：presenter-motion-director、visual-explainer-director、vlog-director
第四层：remotion-production 与其它专项工种
第五层：quality-verification
```

物理目录平铺，逻辑关系由 description、主工作流正文、AGENTS.md 和测试约束。

## 3. 24 个 Skill

本版新增 `visual-asset-sourcing`，因此总数为 24。Shader 与 Multicam 不增加空 Skill，只有真实 Runtime 和工具落地后再新增。

## 4. 主工作流

`presenter-motion-director`、`visual-explainer-director`、`vlog-director` 自身都能独立解释从输入到交付的完整顺序，不是专项 Skill 目录。它们不复制每个工种的全部细节，而是明确为什么调用、进入条件、阶段结果、失效传播、验证和返回点。

`remotion-production` 是跨类型的完整 Motion Graphics 子工作流，既可被主工作流调用，也可响应单个 Scene/Effect 的局部任务。

## 5. 交接合同

每个专项 Skill 的正文包含：进入事实、阶段结果、失效传播、验证证据。使用自然语言说明，不设计僵硬 JSON 接口，也不重复 MCP Schema。

## 6. References

只保留八份完整案例或代码合同，每份都能独立构成专项章节。没有三五行的短 Reference。主工作流 `SKILL.md` 不读取 Reference 也能理解完整流程。

## 7. 当前运行时事实

V5 接入后不保留 `_shared/CURRENT_CAPABILITIES.md` 这类手工能力快照。运行时判断以实时 MCP Tool Schema、当前 Project/Revision、Contracts、Registry 和测试结果为准；根目录 `.agents/skills/_shared/MCP_EXECUTION_CONTRACT.md` 只记录并测试当前阶段一的关键调用字段，以及当前工具、架构目标和兼容入口的明确边界。
