# VideoFlowCut 0.1.89 部署验证

日期：2026-10-15（Asia/Shanghai）。根据用户“部署最新插件”，构建当前工作区并沿官方安装流程部署。未提交 Git、回退已有改动或修改正式视频内容。

## 已完成

- 版本由 0.1.88 更新为 0.1.89，包含本轮技能精简与视觉演出优化。
- `npm run plugin:build` 成功：类型检查、Web、技能同步及发行 Runtime 构建完成。
- `npm run plugin:verify` 通过；构建保留现有 CommonJS/import.meta 警告，实际运行和渲染通过。
- `npm run plugin:e2e` 通过：独立安装目录、端口、工作区和 Bridge 地址；33 秒／792 帧渲染、24 帧人物视频绑定及最终合成验证通过。
- 使用桌面应用自带 Codex CLI 正式执行 `plugin add videoflowcut@videoflowcut --json`，安装到 `C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.89`，没有手改缓存。
- 已安装发行校验通过，运行文件、启动链与技能副本均与仓库发行一致。
- 现有宿主 MCP 注册只将启动路径从 0.1.88 改到 0.1.89，保留工作目录、环境与超时。
- 通过正式安装槽受管启动器切换服务，并从实际宿主注册建立新 MCP 连接。

## 实际连接

```text
pluginVersion: 0.1.89
releaseId: release-46859002c7b64184ad5143bafb5bd6512d3b509ae8bb1a846c38aec40b554e52
runtimeId: 56cf681c-806c-4b64-aff7-0c5be5016dae
新连接 Launcher / MCP / Runtime: 一致
runtime.status: ready
workers.media: true
workers.render: true
toolCount: 150
```

当前聊天的实际工具调用也已连接新 MCP 与 Runtime，但稳定启动器外壳仍报告 0.1.88 的 Release ID。新版技能需新开或重新载入聊天加载，不能把文件更新视为现有上下文已经刷新。

## 检查差异与限制

全局 npm CLI 最初因宿主新式 features 配置无法解析，随后改用桌面应用当前自带 CLI，正式安装成功，未修改该 features 配置。

严格宿主注册检查要求环境与插件声明完全相同，因此未通过：宿主另有既存代理和下载器环境，而插件声明仅包含音效根目录。没有删除这些有效设置。已使用宿主实际 command、args、cwd 和完整 env 建立新连接，验证三方 Release ID、Worker 和工具表，结果通过；不将原严格检查报告为通过。

切换前后 94 个正式项目的 Revision 全部相同，92 个快照摘要相同。另两份快照整份摘要不同；此前部署曾发现读取时生成兼容空对象导致摘要变化，本轮未重新定位这两份差异的全部字段，因此只确认 Revision 未变，不宣称其快照字节相同。部署脚本没有回写修改项目。未执行正式视频重制或成片审美验收。

## 文件与调用链

本轮修改插件版本 manifest、构建生成的 `plugins/videoflowcut/runtime/dist/`、宿主现有 MCP 启动路径及本记录；技能通过现有同步脚本发布。

调用链：仓库构建 → 隔离发行验收 → 官方插件安装 → 安装内容校验 → 受管启动器检查在途任务并切换 → 宿主配置新连接 → 实时发行与 Worker 核验。正式操作未知或队列未清空时沿既有受管恢复处理，不强制终止生产任务。

证据目录：`E:/ai/VideoCut/.cache/plugin-deploy-20261015/`，包含构建、隔离验收、安装、发行校验、切换及新连接结果。技能源码与行为验证边界见[技能实施记录](技能精简与视觉演出落地_实施与验证_20261015.md)。
