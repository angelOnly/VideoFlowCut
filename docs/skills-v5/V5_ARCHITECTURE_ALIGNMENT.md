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

V5 接入时新增 `visual-asset-sourcing`，当前总数仍为 24。Shader 不增加空 Skill；多机位已有有限 Runtime/工具，由现有主工作流按合同使用，当前没有独立 Multicam Skill。新增总案例 Skill 与四例属于[连续原创动效待评审方案](../VideoFlowCut_动效案例阅读包/完整开发方案.md)，本轮不把运行时总数改成 29。

## 4. 主工作流

`presenter-motion-director`、`visual-explainer-director`、`vlog-director` 自身都能独立解释从输入到交付的完整顺序，不是专项 Skill 目录。它们不复制每个工种的全部细节，而是明确为什么调用、进入条件、阶段结果、失效传播、验证和返回点。

`remotion-production` 是跨类型的完整 Motion Graphics 子工作流，既可被主工作流调用，也可响应单个 Scene/Effect 的局部任务。

## 5. 交接合同

每个专项 Skill 的正文包含：进入事实、阶段结果、失效传播、验证证据。使用自然语言说明，不设计僵硬 JSON 接口，也不重复 MCP Schema。

## 6. References

V5 初始资料为八份 Reference；2026-09-07 当前源码为九份 Reference、七份 Shared。Reference 应能独立构成专项章节，不拆成三五行短卡；主工作流 `SKILL.md` 不读取 Reference 也应能理解完整流程。

## 7. 当前运行时事实

V5 接入后不保留 `_shared/CURRENT_CAPABILITIES.md` 这类手工能力快照。运行时判断以实时 MCP Tool Schema、当前 Project/Revision、Contracts、Registry 和测试结果为准；根目录 `.agents/skills/_shared/MCP_EXECUTION_CONTRACT.md` 已覆盖后续字幕、作品、声音、审阅等调用合同，不再仅代表阶段一。当前与拟开发边界以[主架构文档](../ai_video_platform_architecture_development_plan.md)对应章节区分，本轮不修改运行时合同。

当前仓库没有 `.codex/config.toml`；源 Skill 唯一位于 `.agents/skills/`，插件通过 `.codex-plugin/plugin.json` 和 `.mcp.json` / launcher 发现，发行镜像由同步脚本生成。文档中的发现配置检查不应要求创建一个当前未使用的配置文件。
