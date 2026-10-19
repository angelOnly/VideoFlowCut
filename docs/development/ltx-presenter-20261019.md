# LTX 2.3 人物口播开发与验证记录

日期：2026-10-19。仓库：`E:\ai\VideoCut`。

## 本轮交付状态

已完成需求文档对应的代码、HTTP/MCP 接口、工作台、业务技能与发行副本修改，并完成隔离验证和候选包构建。没有更新正式插件版本、安装缓存或生产 Runtime；没有写入生产 ComfyUI 工作流，没有创建正式视频或生成真实 LTX 样片。

候选包沿用仓库基线版本 `0.1.94`，不是新版本部署证明。候选 Release：`release-7fd4946604729814d6afdfdceab56bb644c399e85693262c7e6b3921864bd5e1`，目录为 `E:\ai\VideoCut\plugins\videoflowcut\runtime\dist`。构建包含工作区原有未提交变更，没有回退或删除其他任务的修改，因此不将整个候选包归为本次独立差异。

## 功能与主要调用链

1. 工作台“人物与音色”或 MCP 保存照片、音色样本、名称与独立默认选择。
2. 新建人物项目捕获可用默认；已有项目通过“本片人物与音色”显式应用。明确指定优先于项目已选，再优先于全局默认。
3. 受管副本写入项目 Asset 和 VoiceReference，后续全局替换、移除、改默认不回写旧项目。
4. `submit_voice_synthesis` 使用本片固定 VoiceReference → OmniVoice 段音频 → 当前 SpeechAsset。人物配音缺音色时明确提示补齐，不使用隐藏默认冒充固定选择。
5. 导演确定人物可见范围和表演意图，人物专项编写可选 LTX 正向提示词，主任务提交 `submit_avatar_job`。
6. Avatar Worker 读取当前 Bridge Schema，以唯一图片和音频槽上传照片、按当前范围裁出的真实台词音频；可选 prompt 只绑定唯一公开正向字段。
7. 保存提交状态和原 Run → 下载并校验时长、编码、尺寸 → 登记 ActorPerformance 和人物时间线。Dialogue 保持唯一讲述声音。

照片更换使生成型人物失效，配音保留。音色更换清空旧段缓存和 SpeechAsset／Alignment，旧生成 Dialogue 停用，生成字幕移除，声音 Cue 和人物失效；声音输入版本使在途旧音色结果无法回写。后续按真实新时长校准字幕、素材、动画和声音接点，不自动重新规划整片或直接启动生成。

## 修改文件

下列路径相对仓库根目录，标明本次涉及的职责；部分已有文件还包含其他任务原有修改。

| 文件 | 本次修改 |
| --- | --- |
| `packages/contracts/src/presenter-library.ts`、`index.ts` | 独立照片／音色设置、项目固定选择、声音输入版本、LTX Provider 合同 |
| `packages/edit-application/src/presenter-library.ts` | 导入、探测、哈希、默认、项目副本及替换失效 |
| `packages/edit-application/src/index.ts` | 默认捕获、生成输入解析、旧音色拒绝、人物任务恢复 |
| `packages/edit-application/src/persistence/sqlite-project-repository.ts` | 复用 workspace_settings 保存人物库 |
| `packages/speech-services/src/index.ts` | 配音开始、组装与回写时检查声音输入版本 |
| `apps/job-worker/src/avatar-generation.ts` | LTX 请求、可选正向提示词、提交状态及原 Run 恢复；删除旧人物提示词和时长／画幅映射 |
| `apps/server/src/presenter-tools.ts`、`app.ts`、`mcp.ts` | HTTP 与 MCP 共用业务服务，人物失败恢复走专用逻辑 |
| `apps/web/src/PresenterLibraryPanel.tsx`、`App.tsx`、`api.ts`、`styles.css` | 全局管理与项目选择界面，媒体预览、上传、影响说明及工具栏换行 |
| `plugins/videoflowcut/scripts/configure-ltx-avatar.mjs`、`.d.mts` | 生成独立 LTX API 工作流与登记既有默认音色 |
| `.agents/skills/avatar-performance/`、`voice-production/`、`presenter-motion-director/references/presenter-shot-plan.md` | 配置选择、提示词责任、替换影响与失败恢复；发行技能副本同步 |
| `tests/presenter-library.test.ts`、`avatar-stage2.test.ts`、`voice-recovery.test.ts`、`skills-v5-integration.test.ts` | 新增核心回归、更新接口及默认声音测试场景 |
| `docs/VideoFlowCut_LTX2.3真人口播_需求与优化方案.md` | 补齐已确认提示词方案和实际入口 |

## 接口

新 MCP 工具：`read_presenter_library`、`import_presenter_media`、`manage_presenter_library`、`apply_presenter_selection`、`resume_avatar_job`。具体参数以运行时 Schema 为准；人物库工具使用共享的 camelCase 字段，已有 Avatar 工具继续使用原有 snake_case 字段。

HTTP：`/api/settings/presenter-library` 读取，后缀 `/import`、`/upload`、`/change` 管理，`/:id/media` 预览；`/api/projects/:projectId/presenter-selection` 应用。现有任务重试入口对 Avatar 转交 `resumeAvatarGeneration`。

照片和音色全局内容保存在工作区 `presenter-library/`；项目固定副本在项目的 `assets/presenter/`。相同内容的重新选用仅更新名称／来源，不无故重生。

## LTX 工作流配置

原保存图：`E:\ai\comfyui\ComfyUI-aki-v2\ComfyUI\user\default\workflows\ltx2.3\LTX2.3数字人文生图生自由切换版.app.json`。

已在隔离目录 `E:\ai\VideoCut\.cache\ltx-presenter-config-validation` 验证转换真实保存图：正向节点 `169`，负向节点 `165`。新工作流 ID 为 `videoflowcut-ltx23-avatar-v1`，生成 `.json` 执行图和 `.bridge.json` 清单，公开必填图片／音频和可选“正向提示词”。转换保持原保存图不变，并保留其他图参数和输出映射。

默认正向描述同一人物、服装、背景、自然说话、稳定镜头与不预烧字幕。负向移除看镜头、微笑、衣物等场景限制，保留身份变形、画面缺陷与字幕相关限制。逐镜 prompt 由人物专项编写，未提供时使用工作流默认；明确提供但接口未公开时失败，不静默丢弃。

部署阶段沿正式流程发布新插件后，再根据当前 Bridge 配置确认目录及现有默认音色图的真实路径，执行以下脚本入口；尖括号内容是必须核实的参数，不是本轮已执行的生产命令：

```powershell
node plugins/videoflowcut/scripts/configure-ltx-avatar.mjs workflow "<已保存的 LTX .app.json 路径>" "<当前 Bridge API 工作流目录>"
node plugins/videoflowcut/scripts/configure-ltx-avatar.mjs voice "<现有默认音色 API 图路径>" "<ComfyUI input 目录>" "<VideoFlowCut 服务地址>"
```

音色登记通过正式 HTTP 接口进行，已有用户默认时保持原选择，不批量修改历史项目。发布后须重新读取实际 Schema，登记 LTX 能力档案，核对 Runtime／MCP／Worker 版本和健康，再做独立真实样片。

## 失败处理

- 输入缺失、字段歧义、旧声音、过期 Revision、输出短缺／编码不支持均保留明确错误；不伪造成功，不切 H3。
- 提交前保存提交状态。提交后连接中断且没有 Run ID 时保留未知状态和原始原因，阻止自动重放。
- 有 Run ID 的查询或下载中断沿原 Job／Run 恢复。原 Run 丢失且无已核验本地文件时先对账。
- 原 Run 明确失败或取消后，显式恢复创建固定幂等恢复任务；不在 Worker 内自动换模型或重复提交。
- 普通素材视频的 H3 生成代码保持原能力，与人物生成无依赖。

## 实际验证

| 检查 | 结果与边界 |
| --- | --- |
| `npm run typecheck` | 通过 |
| 核心回归与技能合同 | 85／85 通过，包含 core、avatar-stage2、presenter-library、default-voice、voice-recovery、skills-v5-integration；不是全仓库测试声明 |
| 图片／音频输入及可选正向字段 | 模拟 Bridge 的确定性请求验证通过，原图片＋音频无文字字段也可执行 |
| 外部提交中断 | 无 Run 的未知提交不重放，已知 Run 查询中断恢复时不增加外部提交；失败原因可读 |
| 更换与持久化 | 全局文件替换／移除不改变旧项目，重启可读；照片更换保留声音，音色更换清除缓存并拒绝旧结果；缺失默认文件不留下半创建项目 |
| 正式接口 | HTTP 上传／媒体预览、默认音色登记、MCP 保存／读取／应用共享同一状态，接口回读通过 |
| 工作台浏览器操作 | 独立 3197 端口和 `.cache/ltx-presenter-ui-workspace`，无 Worker；验证面板、媒体控件、重命名、项目保留原选择、显式应用从 R2 到 R3。截图使用合成占位图片与测试音频，不是口播结果或音色效果验收 |
| 真实 LTX 图转换 | 只读原图并输出到隔离目录，未注册到生产 Bridge |
| `npm run build:web` | 通过，存在前端单包大小提示 |
| 技能同步、候选 Runtime 构建与 `npm run plugin:verify` | 通过；发行 MCP 导出 159 个工具。构建仍有既有字体／编译器 CJS import.meta 提示，未在本次范围扩展修复 |

自动测试日志：[ltx-focused-tests.log](ltx-presenter-20261019/ltx-focused-tests.log)。工作台截图：[工作台项目选择.png](ltx-presenter-20261019/工作台项目选择.png)。

## 未验收事项与代价

未生产部署、未生成真实人物样片、未连续审听中文口型或确认身份／姿态稳定，也未验证超长单段生成。后续样片应包含人物出镜、素材接管、人物返回，以及分别换照片和换音色。

每个项目固定一份照片和音色副本；移除全局条目不自动删除历史内容文件，因此会有少量额外磁盘占用。换照片需要重生人物，换音色还需要配音和时序校准。选用操作本身不承担自动制作或整片重排。
