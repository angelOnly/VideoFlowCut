# 知识与合同来源

## 架构文档

`docs/ai_video_platform_architecture_development_plan.md` 是 Skills 主从关系、交接合同、产品边界和阶段验收的唯一架构依据。V6.2 只调整 Skills 层，不增加 Skill Orchestrator 或第二份项目状态。

## ChatCut 调研与官方 Skill 译文

`docs/chatcut视频剪辑工具拆解/` 用于吸收完整工作流、工具边界、写后读回和真实验证方法。重点参考 `chatcut-plugin-basics`、`talking-head-guide`、`create-motion-graphics`、`asset-import`、`verification`、`export`、`known-errors`。不得复制 ChatCut 品牌、私有字段、Hosted Worker 或当前项目不存在的工具。

## 旧 DavinciVideoMcp 导演知识

旧项目的导演、视觉、声音、文字和素材理解资料用于补充观众状态、事实与观看时间线、故事脊椎、信息账本、节拍链、听觉视点、发现顺序和反事实判断。DaVinci/Resolve、旧 MCP 和旧字段不能进入新合同。

## 外部 HTTP API

FunASR、OmniVoice 和四个 MiniMax H3 业务应用以 `docs/asr接入.md` 和运行时 Workflow Detail 为准。每次创建任务前重新读取 `schemaVersion`、fields、itemSlots 和 outputs；文档中的示例 ID 不作为永久字段合同。

## 当前代码

实际可执行能力以 MCP Tool Schema、Contracts、Application 和 Remotion Runtime 为准。代码与 Skill 冲突时先修正文档和测试，不让 Agent依赖过期自然语言。
