# Skills V5 接入资料

本目录只保存 V5 的目录说明、架构对齐说明和验收规范，供开发与评审使用。

运行时唯一 Skills 来源是根目录 `.agents/skills/`。这里不保存第二棵可执行 `.agents/skills/`，也不保存手工维护的当前能力快照。

当前静态结构、主工作流路由、专项交接和 MCP 调用合同由 `tests/skills-v5-integration.test.ts` 校验；真实 Presenter 成片验收按 [03_PRESENTER_REAL_E2E.md](evals/03_PRESENTER_REAL_E2E.md) 执行，不能以接入测试代替。运行时已不局限于早期阶段一，当前实现及限制见[主架构文档](../ai_video_platform_architecture_development_plan.md)第 6–21 章。

2026-09-07 本轮仅对齐文档：源码目录核对为 24 个运行时 Skill、9 份 Reference、7 份 Shared，共 40 份 Markdown；旧静态报告保留其历史统计，未用本轮目录检查替换旧验收结论。发现入口是插件 manifest / MCP launcher，当前仓库没有 `.codex/config.toml`。

新增动效需求先读[主架构第 28 章](../ai_video_platform_architecture_development_plan.md#28-连续原创动效待评审需求与旧规则替代关系)与[完整方案](../VideoFlowCut_动效案例阅读包/完整开发方案.md)。无参考原创、中性作品审阅、多 Beat 覆盖与五份案例 Skill 尚待评审开发；本轮不改运行时 Skills、不执行视频验收，目录数量仍为 24。旧 Professional Skills 包与本目录的历史统计用于追溯，不能覆盖当前实现。
