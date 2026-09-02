# 静态和能力同步检查

## 文件结构

- 23 个 Skill 目录；
- 每个目录有 `SKILL.md`；
- Front Matter `name` 等于目录名；
- 所有相对 Reference 链接存在；
- Markdown 围栏完整；
- 没有空文件；
- 没有第二棵运行时 `.agents/skills`。

## 内容检查

创作型 Skill 应包含连续解释、至少一个完整案例、当前工具边界和最终检查。禁止只通过“证据/规则/动作/验证”标题存在来判定专业内容合格。

## 能力同步

- Skill 中的 MCP 名称存在于 `apps/server/src/mcp.ts`；
- Skill 中的对象字段存在于 Contracts，或明确标记为计划能力；
- Capability Manifest 的稳定/部分/计划与代码一致；
- FunASR/OmniVoice 不硬编码 schemaVersion；
- 兼容 `create_presenter_timeline` 不作为正式创作默认；
- 未有 word_exact 时不允许逐词自动同步；
- 未有 Audio MCP 时 audio-finishing 只能 plan/review。
