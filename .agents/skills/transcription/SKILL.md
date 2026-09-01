---
name: transcription
description: 通过 FunASR Bridge 生成可追溯全文转写与语义单元，并保护真实时间精度边界。
---

# 转写与语音文本证据

## 使用范围

需要理解有声素材、建立 Script、识别重录候选或核对生成旁白文字时使用。

## 必须执行

1. 阅读 `docs/asr接入.md`，执行 `project-basics`，确认 Asset 已就绪且含音频。
2. 使用 `submit_transcription`，再用 `track_job` 等待终态。
3. 读回 Project 中的 TranscriptText、SemanticUnit、Script Revision 与 Bridge 诊断。
4. 高风险专名、数字、否定词、因果词、转折词和中英文混说必须回听源音频，不根据语言模型猜测改字。

## 时间边界

当前工作流只可靠提供全文和项目已有的语义单元，不提供词级时间。不得按字数估算 WordTiming，也不得把 ASR 分块当最终剪辑单位。

若任务需要真实粗粒度时间，当前 MCP 尚未提供 VAD Chunk 创建能力；说明该限制或等相应能力实现后再继续，不伪造精确时间。

## 按需读取

- FunASR 动态 Schema、Run 与失败处理：`references/funasr-http-contract.md`。
- 真实切片与 SemanticUnit 交接：`references/chunking-and-semantic-handoff.md`。
- 专名、否定词和逻辑异常回听：`references/transcript-quality.md`。

## 退出条件

全文、语义单元与最新 Revision 可读回；失败时保留错误码、run_id、请求摘要和未完成的时间精度限制。
