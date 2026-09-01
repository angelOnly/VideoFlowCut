# ChatCut Alignment

本套 Skills 不是把 ChatCut 工具名直接复制到 VideoFlowCut，而是保留 ChatCut 原生 Skills 的核心组织思想，再针对 VideoFlowCut 对象重写。

## 结构对齐

ChatCut 的重要结构特征：

1. 基础运行 Skill 只定义项目和工具边界；
2. 专业视频类型 Skill 负责内容和剪辑判断；
3. 复杂知识拆入 `references/` 按需加载；
4. 主线稳定后再做字幕、B-roll、Motion Graphics 和音乐；
5. 工具成功不等于真实画面通过；
6. Motion Graphics 编码前先明确内容、时段、角色、视觉语言、可编辑字段和目标帧；
7. 批量 MG 作为一个视觉系统，而不是每个项目独立随机设计；
8. 设计 Settled Frame，再设计入场和退出。

## VideoFlowCut 对应关系

| ChatCut 方向 | VideoFlowCut Skills |
|---|---|
| plugin basics | `project-basics`, `web-editor-operator` |
| asset import | `asset-import` |
| transcription | `transcription`, `semantic-continuity` |
| voice | `voice-production` |
| talking-head guide | `presenter-motion-director`, `semantic-continuity`, `cutaway-planning`, `captions`, `audio-finishing` |
| create motion graphics | `visual-treatment-planning`, `effect-timing`, `depth-composition`, `scene-planning`, `remotion-production` |
| verification | `quality-verification` |
| export | `export` |
| known errors | `known-errors` |

## VideoFlowCut 的新增专业层

为匹配当前产品目标，本套 Skills 增加：

- 人物表演与动效联合规划；
- AttentionCurve；
- Presenter 前后景深度语法；
- Visual Explainer Scene Grammar；
- Vlog 素材事件驱动；
- 素材来源与权利；
- 四轮整片审片；
- SkillExecutionReport；
- timing precision 降级；
- Remotion 安全和可编辑组件合同。

## 不直接复制的内容

- ChatCut 私有 MCP 工具名；
- ChatCut Web 特定布局假设；
- 付费服务和生成器；
- ChatCut 私有字段；
- 与 VideoFlowCut 当前 API 不一致的时间戳能力；
- 用户确认式 UI 交互（VideoFlowCut 当前主要由 Codex 自动操作和验证）。
