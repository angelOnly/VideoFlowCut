---
name: transcription
description: Create and validate transcripts for source understanding and speech-led editing using the current FunASR HTTP workflow without inventing unavailable timestamps. Use for talking-head, interview, Vlog dialogue, imported speech, or TTS back-check.
---


# 转写与语音文本证据

## 角色

本 Skill 把语音识别结果当作可校验的编辑证据，而不是绝对真相。它负责正确调用 FunASR、保存 TranscriptText、建立必要的粗粒度时间块，并把文本交给语义构建。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 口播、访谈、课程、Vlog 对白或任何需要理解语音的素材。
- 需要核对生成语音是否说对文字。
- 需要从长素材定位语言内容。

## 何时不使用

- 纯音乐或明确无语音素材。
- 已经有可信 Transcript 且源音频未变化。
- 只需要分析画面，不涉及语言。

## 前置读取

- `docs/asr接入.md`。
- 当前 FunASR workflow detail、schemaVersion、fields、itemSlots 和 outputs。
- `../_shared/timing-precision.md`。
- 源音频技术信息和语言环境。

## 必须掌握的证据

- 原始音频或从视频提取的音频。
- FunASR 原始 text 输出和 Run 元数据。
- 语言、专有名词、说话者数量、噪声和混响。
- 需要时，本地 VAD 产生的真实时间块。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前识别结果是否足以支持内容判断？
- 哪些词可能因同音、口音、专名或噪声而错误？
- 是否需要切成更小的真实时间块重新识别？
- 识别错误会改变事实、因果或剪辑边界吗？
- 文本是源转写、最终 Script 还是字幕？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 动态读取工作流合同

每次正式调用前读取 FunASR workflow detail，使用实时返回的：

- schemaVersion；
- field ids；
- itemSlots；
- outputs；
- available / reason。

不得把文档示例中的版本和字段长期硬编码。

### 2. 提交与轮询

上传可解码音频，创建 Run，轮询到 succeeded 或 failed。成功时以 `kind=text` 的输出为准。

### 3. 保存原始证据

保存：

- 原始 TranscriptText；
- workflow id；
- schemaVersion；
- run id；
- 请求摘要；
- 输出原文；
- 音频 Asset；
- 识别时间；
- 质量备注。

不要在保存前静默改写原始识别。

### 4. 需要时间定位时先做真实切片

当前 FunASR 输出不含 Segment、Token 或 WordTiming。需要时间范围时：

1. 本地 VAD / 静音检测切出真实源区间；
2. 每块分别调用 FunASR；
3. 形成 TranscriptChunk；
4. 保留 chunk 的真实起止时间和识别文本。

### 5. 语义构建

把原始识别交给 SemanticUnit Builder，按完整句子、观点、因果、转折、列表和重录组织。ASR 的任意分块不能直接成为剪辑单位。

### 6. 质量校验

重点回听：

- 人名、书名、品牌、金额、日期；
- 否定词；
- 因果和转折；
- 相似发音；
- 低信心或逻辑不通的句子。

必要时标记 uncertainty，而不是自行“修正成合理句子”。

## 禁止行为

- 声称 FunASR 当前已经返回词级时间。
- 按字数平均分配时长并标注为精确时间。
- 把 TranscriptText 直接当最终 Script 或 Caption。
- 静默纠正可能的事实词。
- 识别失败后用模型猜测音频内容。
- 未保存原始输出和 Run 信息。

## 验证

- 原始 TranscriptText 可追溯。
- 需要时 TranscriptChunk 具有真实源时间。
- 关键专名和事实词完成回听。
- 时间精度声明正确。
- SemanticUnit Builder 获得明确输入。

## 退出条件

- 转写结果和来源已保存。
- 不可识别区间、歧义和置信风险可见。
- 没有虚假的 Segment/WordTiming。
- 下游能够区分 Transcript、Script、SpeechSegment 和 Caption。

## 按需读取的专业参考

- `references/funasr-http-contract.md`：FunASR Bridge 动态 Schema、任务和输出合同。
- `references/transcript-quality.md`：识别错误、专名、否定词与事实词的回听方法。
- `references/chunking-and-semantic-handoff.md`：VAD 粗时间块与 SemanticUnit Builder 的边界。
