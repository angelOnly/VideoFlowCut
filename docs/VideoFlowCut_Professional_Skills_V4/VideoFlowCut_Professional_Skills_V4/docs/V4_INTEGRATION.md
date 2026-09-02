# V4 接入说明

## 覆盖范围

整体替换仓库根目录 `.agents/skills/`。V4 保持现有 23 个 Skill 目录名，不要求修改 `.codex/config.toml` 中的 Skill 名称。

## 清理旧目录

删除每个 Skill 下旧的 `references/`。不要让 Codex 同时发现 V3 和 V4 两套内容。`docs/VideoFlowCut_Professional_Skills_V2`、`V3` 可以作为普通历史文档保留，但其中不能包含会被扫描的运行时 Skill 根。

## 接入后测试

1. Front Matter 和目录名一致；
2. Skill 中提到的 MCP 工具存在或明确标注为计划能力；
3. 所有 `_shared` 路径存在；
4. 哲学口播与促销口播产生明显不同的 Visual Treatment；
5. ProductionRun 记录实际加载 Skill、创作决定和真实 Preview Evidence；
6. Delivery 仍执行当前 Revision 的质量门禁。
