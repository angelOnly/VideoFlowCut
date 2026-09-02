# 建议合并到根目录 AGENTS.md 的 Skills 规则

1. 完整视频任务先读取 `project-basics` 与 `production-director`，由后者只选择一个主要视频工作流。
2. 人物口播、解释片、Vlog 分别由 `presenter-motion-director`、`visual-explainer-director`、`vlog-director` 从输入负责到交付。
3. 主工作流到达具体阶段后才读取专项 Skill；专项结果必须以项目对象、失效范围和验证证据返回主工作流。
4. 局部字幕、声音、B-roll、单个 Remotion Scene 或遮挡任务可以直接进入对应专项 Skill，不重跑整片。
5. `.codex/config.toml` 登记表示可发现，不表示一次任务全部加载。
6. `loadedSkills`、SkillExecutionReport 和文件存在都不能代替实际交接、Preview 和审片。
7. 运行时 Skills 的唯一来源是根目录 `.agents/skills/`；`docs/` 只保存审阅稿，不保存第二棵可执行目录。
8. 引用的 MCP 工具必须从实时 Schema 获取；架构目标工具尚未实现时只形成计划，不伪造执行。
9. 代码能力、Skill、配置和路由/交接测试在同一 PR 更新。
10. 创作型 Skill 以连续专业解释和案例为主体，清单只用于执行和防漏。
