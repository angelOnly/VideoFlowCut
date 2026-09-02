# Skills V5 接入资料

本目录只保存 V5 的目录说明、架构对齐说明和验收规范，供开发与评审使用。

运行时唯一 Skills 来源是根目录 `.agents/skills/`。这里不保存第二棵可执行 `.agents/skills/`，也不保存手工维护的当前能力快照。

当前静态结构、主工作流路由、专项交接和 MCP 调用合同由 `tests/skills-v5-integration.test.ts` 校验；真实 Presenter 成片验收继续按 `evals/03_PRESENTER_REAL_E2E.md` 在后续 Gate A 执行。
