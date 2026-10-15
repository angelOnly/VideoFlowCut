# VideoFlowCut 0.1.88 部署验证

日期：2026-10-14（Asia/Shanghai）。依据用户“部署最新插件”，发布当前工作区源码和技能；保留已有未提交改动，没有执行 Git 提交或拉取其他分支。

## 类型分流与公共能力

已核对现有 `project.profile` 及协调、导演入口：

- `presenter_motion`：人物口播，数字人与真人作为人物来源分支。
- `visual_explainer`：视觉解说，保留既有主题、材料、文案与整场视觉路线。
- `vlog`：事件、动作和现场原声主导。
- `hybrid`：仅在明确采用不同子范围路线时使用。

分流采用已有 profile 和技能路由，没有新增第二套分类系统。公共能力通过现有字幕、声音、素材、Remotion、质量验证等技能和技术模块复用；人物专属资源和口型条件仅按人物范围使用。该结论不表示所有自然语言路线规则都有程序级硬校验。

定位：`E:/ai/VideoCut/.agents/skills/production-coordinator/references/video-type-routing.md`、`E:/ai/VideoCut/.agents/skills/production-director/SKILL.md`、`E:/ai/VideoCut/apps/server/src/app.ts`。

## 构建与安装

- 插件版本由 `0.1.87` 更新为 `0.1.88`，修改 `E:/ai/VideoCut/plugins/videoflowcut/.codex-plugin/plugin.json`。
- `npm run plugin:build` 完成类型检查、Web 构建、维护源 Skills 同步及 Runtime 构建；发行物位于 `E:/ai/VideoCut/plugins/videoflowcut/runtime/dist/`。
- `npm run plugin:verify` 通过。
- 73 项相关测试通过，覆盖人物、解说、Vlog、字幕、音效及技能引用/同步。本轮没有重跑全部测试套件。
- `npm run plugin:e2e` 通过：隔离安装、独立项目/端口/Bridge 地址、33 秒/792 帧真实视频渲染、24 帧人物视频绑定作品及最终合成。
- 使用桌面应用当前自带的 Codex CLI 执行正式 `plugin add videoflowcut@videoflowcut --json`。
- 实际安装路径：`C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.88`。没有手改安装缓存。
- `verify-installed-release.mjs` 通过，已安装 Runtime、启动链、314 个 Skills/参考文件与仓库发行一致。
- 宿主 MCP 配置仅将启动入口从安装槽 `0.1.87` 改为 `0.1.88`，保留原工作目录、环境和超时配置。

## 正式运行验证

调用链：正式安装槽启动器 → 受管 Runtime 切换（检查异步队列）→ 新建 MCP 协议连接并刷新工具表 → `read_runtime_release` → Worker 健康与项目 Revision 核对。

```text
releaseId: release-6dbf6d69f047f01021bd81f13ad2a0f8b7d7d37ff3efa3d8350b992789fc8bc7
runtimeId: 943114f3-12f9-4f3b-844f-ed3bae82508d
pluginVersion: 0.1.88
MCP / Launcher / Runtime: 新连接三者一致
runtime.status: ready
workers.media: true
workers.render: true
toolCount: 150
```

原运行版本为 `release-85ddad91453b69e379a5ce4b13d951f68cdef375f5ad173f28490801cb140af9`。正式切换通过已有受管启动器完成，没有手工终止未知进程或改写失败 Job。

94 个正式项目的 Revision 全部保持不变，92 个项目的 API 快照摘要完全相同。另两份旧测试项目在读取时通过现有兼容逻辑临时补空 Ambient 轨道或空 Story，并产生随机 ID；连续两次只读也会出现这些 ID 差异，因此无法用整份 API JSON 摘要证明这两份相等。该核查没有回写修复旧项目。

当前已打开聊天的稳定外壳仍报告旧 `launcherReleaseId`，但其内部 MCP 和 Runtime 已切到新 Release；已通过另建协议连接验证新安装槽三者一致。宿主注册已指向新安装槽，新开/重新载入聊天时加载新版启动器与技能。没有把旧外壳报告冒充同版验证。

## 字幕 Bridge 与后续边界

本次插件包含此前更新的逐段字幕校订技能。ComfyUI 的字幕比较修复仍保存在独立 Bridge 候选中，本次没有安装或重启 ComfyUI，因此不能声称原字幕故障已在生产服务修复。

后续状态：同日用户另行授权后，Bridge 已正式安装、重启并通过原完整音频和机票对照的真实 HTTP 验证，详见[字幕服务部署记录](E:/ai/VideoCut/docs/development/ComfyUI_字幕服务修复部署_20261014.md)。上段保留插件部署当时的操作边界。

本次没有修改正式视频内容，也没有重新生成原视频或确认成片。构建仍有现有的 CommonJS/import.meta 警告，发行包实际启动和渲染已通过。

原始构建、测试、安装、发行校验、新连接状态及项目核对记录在 `E:/ai/VideoCut/.cache/plugin-deploy-20261014/`。
