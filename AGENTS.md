# AGENTS.md

## 开发原则

不要过度设计。优先选择满足当前需求的最简单、可靠、可维护方案，只实现明确需要的功能，不为假设中的未来需求增加复杂度。

当“简单方案有明确代价、复杂方案更完善但明显更臃肿”时，先简要说明取舍，并在开发前询问我是否接受该代价，不要默认选择复杂方案。

## 文档与产品决策

- 让我分析、解释、梳理时，只分析，不改文件；让我澄清、对齐或写入刚确认的结论时，只做解决当前问题的最小修改。
- 每次修改文档前，先简单说明本次准备解决什么、局部修改哪些地方、明确不改什么；等用户确认后再执行。
- 讨论过、有关联、顺手发现的新问题，都不等于本次要改；未经明确要求，不扩展到代码、配置、Skill、无关文档，也不重写或删除已有内容。
- 只是文字说不清时，自己找最少该改的位置；如果会改变产品决定、功能范围或已确认方案，先说清影响，等用户决定。
- 改完检查差异，撤回范围外改动，并告诉用户改了什么、为什么改、有什么代价或未处理事项。

## Skills 工作流规则

- 完整视频任务先读取 `project-basics` 与 `production-director`，由后者只选择一个主要视频工作流。
- 人物口播、视觉解释片和 Vlog 分别由 `presenter-motion-director`、`visual-explainer-director`、`vlog-director` 从输入负责到交付。
- 主工作流到达具体阶段后才读取专项 Skill；专项结果必须以项目对象、失效范围和验证证据返回主工作流。
- 局部字幕、声音、B-roll、单个 Remotion Scene 或遮挡任务可以直接进入对应专项 Skill，不重跑整片。
- `.codex/config.toml` 登记表示可发现，不表示一次任务全部加载。
- `loadedSkills`、SkillExecutionReport 和文件存在都不能代替实际交接、Preview 和审片。
- 运行时 Skills 的唯一来源是根目录 `.agents/skills/`；`docs/` 只保存架构、目录、评审与验收资料，不保存第二棵可执行 Skills 树。
- 引用 MCP 工具时必须读取实时 Schema；架构目标尚未实现时只形成计划，不伪造执行。
- 代码能力、Skill、配置和路由/交接测试必须在同一个 PR 更新。
- 创作型 Skill 以连续专业解释和案例为主体，清单只用于执行和防漏。

## 双任务剪辑与平台修复边界

- **剪辑任务**只通过当前 MCP Tool Schema 使用已发布能力完成视频创作；不得修改源码、`package.json`、插件启动器、发行产物、MCP 配置、服务进程或正式项目外的文件，也不得用 shell、浏览器脚本或临时代码绕过 MCP。
- 剪辑任务遇到工具缺失、工具错误、Runtime 故障或无法继续的工作流时，立即停止该步，调用 `report_editing_blocker` 写入独立 Repair Ticket；不得自行“修好”、猜测成功、重试不确定写入，或因为报障新建视频 Revision。
- **修复任务**只处理平台源码、测试、构建、候选 Runtime 与部署；不得创建、导入、删除或修改正式视频 Project、素材、Story、Scene、Timeline、Revision、Job 和 ExportArtifact。它可以读取 Repair Ticket 和必要的只读运行证据，但不能代替剪辑任务继续创作。
- 两个任务可共享同一源码目录，且不要求 Git 分支或 worktree；但生产 Runtime A 必须持续服务剪辑任务，候选版 B 只能用独立端口和独立工作区验证，绝不能与 A 共用生产 `app.sqlite` 的 Worker 队列。
- 修复必须找根因、补回归测试、构建 Release ID 并验证候选版。不得为了让当前任务通过而写临时补丁、硬编码、跳过校验、直接改插件缓存或把未验证构建称为已部署。
- 正式切换只在候选验证完成后进行：重新部署 Runtime/MCP，确认二者的 `releaseId` 相同且 API、媒体 Worker、渲染 Worker 健康；随后由原剪辑任务重新连接 MCP，读取当前 Revision，并调用 `acknowledge_repair_deployment` 后才能继续。旧 MCP 会话不能确认新版部署。
- Repair Ticket 只能放在 SQLite 的 `repair_tickets` 独立表，不得放进 `ProjectSnapshot`、视频 Revision、AgentWorkOrder 或素材目录；构建出的发行物只能放在 `plugins/videoflowcut/runtime/dist/`，不得手工覆盖 Codex 已安装插件缓存。

## 注意事项

- 关键代码添加精炼易懂的中文注释
- 所有的文档描述等都使用中文

## 完成后

简要说明实现内容、修改文件、主要调用链、失败处理和已知代价；
