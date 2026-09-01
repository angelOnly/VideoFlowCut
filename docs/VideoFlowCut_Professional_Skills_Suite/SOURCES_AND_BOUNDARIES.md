# Sources and Boundaries

## 主要来源

### ChatCut 原生 Skills 与项目拆解

用于吸收：

- Skill 主文件与 references 分层；
- 基础运行 Skill 不替代专业 Skill；
- 口播先主线、后字幕/B-roll/MG/音乐；
- Script、Transcript、Timeline、Caption 的区分；
- Motion Graphic 的观众任务、Design Map、Settled Frame、放置和真实画面验证；
- 结构读回 + 像素证据；
- 任务完成条件和异步边界。

项目内预期路径：

```text
docs/chatcut视频剪辑工具拆解/
docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/
```

### 旧项目导演与剪辑研究

用于补充：

- 观众承诺；
- 完整语义和动作；
- 节奏关系；
- 注意力预算；
- 空间、动作、视线和情绪连续性；
- 声音与静音；
- 字幕和文字层级；
- 反事实比较；
- 完整播放与内部审美复核。

### VideoFlowCut 架构文档

用于保持对象和链路一致：

- Project / Revision；
- Story / SemanticUnit；
- Scene / EffectCue；
- Timeline / Caption / Audio；
- Presenter / Explainer / Vlog；
- Remotion Runtime；
- Web Editor Operator；
- unified `video-editor-mcp`。

### HTTP API 文档

```text
docs/asr接入.md
```

用于：

- FunASR；
- OmniVoice；
- MiniMax H3；
- ComfyUI-AppApi Bridge；
- 动态 workflow detail、schemaVersion、fields、itemSlots、outputs。

## 明确边界

本 Skills Suite 不：

- 复制 ChatCut 私有运行时字段；
- 假设 VideoFlowCut 已存在某个具体 MCP 工具名；
- 直接修改数据库；
- 执行未审查的 Remotion 任意代码；
- 把书籍观点冒充项目事实；
- 把参考视频当成可直接使用的素材；
- 把生成画面冒充证据；
- 声称 FunASR 当前返回词级时间；
- 声称 OmniVoice 存在远端 VoiceProfile。

执行时必须读取实时 MCP 和 workflow Schema。
