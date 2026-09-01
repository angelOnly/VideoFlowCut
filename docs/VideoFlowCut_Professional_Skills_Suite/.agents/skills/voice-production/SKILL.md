---
name: voice-production
description: Plan, synthesize, assemble, and review cloned-voice narration using the current OmniVoice HTTP workflow. Use for full narration, local replacements, voice reference changes, or script revisions that require new speech assets.
---


# 声音克隆、TTS 与旁白表演

## 角色

本 Skill 同时管理技术调用和旁白表演质量。它不把 TTS 当作“文本转文件”，而是把 Script 编译为可自然朗读、可局部重生成、可为剪辑提供真实段级时间的 SpeechSegments。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 使用参考音色生成旁白。
- 修改 Script 后重生成局部语音。
- 替换 VoiceReference。
- 需要创建 SpeechAsset 和 segment_exact SpeechTiming。

## 何时不使用

- 已有通过质量审查且 Script Revision 未变化的 SpeechAsset。
- 只做现有音频的混音或切口处理。

## 前置读取

- `docs/asr接入.md`。
- 当前 OmniVoice workflow detail。
- 最终 Script Revision。
- VoiceReference 质量和使用权。
- `../_shared/timing-precision.md`。

## 必须掌握的证据

- 参考音频的时长、单人/噪声、采样率和有效区间。
- 最终 Script、语义结构和期望语气。
- 段落、转折、列表、笑点和 CTA。
- 每个输出的真实时长、采样率和回听结果。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 如何分段才能保持完整语义和自然表演？
- 哪些停顿是语法停顿，哪些是情绪停顿？
- 哪些词需要重读，哪些句子需要放慢？
- VoiceReference 是否真的代表期望角色？
- 生成声音是否存在金属感、吞字、错误重音或语气漂移？
- 局部重生成如何与相邻段落保持音色和节奏连续？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 检查 VoiceReference

优先选择：

- 3–15 秒；
- 单人；
- 清晰；
- 低噪声；
- 无音乐；
- 情绪和语速接近目标；
- 授权明确。

若参考声音质量差，先解决参考问题，不要通过后期包装掩盖。

### 2. 编译 SpeechSegments

分段依据：

- 完整句；
- 转折边界；
- 列表项；
- 情绪和呼吸；
- 笑点设置与落点；
- CTA；
- 重要视觉事件；
- 局部重生成稳定性。

禁止机械按字数切割。

### 3. 编写表演计划

每段至少说明：

- 语气；
- 速度；
- 强调词；
- 句尾走向；
- 段前/段后停顿；
- 与下一段的情绪关系。

当前 API 未必直接支持显式表演参数时，也应通过分段、标点、文本措辞和后续间隔实现有限控制，并清楚标注能力边界。

### 4. 动态调用 OmniVoice

每段提交：

```text
参考音频
+
当前 SpeechSegment 文本
```

实时读取 workflow detail，不建立不存在的远端 VoiceProfile，不拆成独立 VoiceClone API 和 TTS API。

### 5. 本地化与测量

每个成功输出立即下载、登记，并用 ffprobe 获取真实：

- 时长；
- 采样率；
- 声道；
- MIME；
- 文件完整性。

### 6. 组装 SpeechAsset

按 Script 顺序拼接，明确：

- 段间停顿；
- 交叉淡化；
- 呼吸余量；
- 章节停顿；
- 最终 segment_exact 时间。

### 7. 回听质量

至少检查：

- 文本是否完整；
- 发音和专名；
- 重音；
- 段落语气；
- 相邻段音色一致性；
- 拼接感；
- 不自然静音；
- 呼吸和结尾。

局部 Script 修改只重生成受影响 Segment，但组装后必须回听前后邻段。

## 禁止行为

- 把 OmniVoice 当作远端 Voice ID 服务。
- 长期硬编码 schemaVersion 和字段 ID。
- 按固定字符数分段。
- 忽略真实输出时长而按文本长度估算。
- 每段单独听起来正常就不检查拼接。
- 用 BGM 掩盖语音瑕疵。
- 未经许可克隆声音。

## 验证

- 每段输出和 Run 可追溯。
- 真实时长已测量。
- 文本一致性完成回听或可选 FunASR 回查。
- 相邻段落连续。
- SpeechAsset 的 segment_exact 时间正确。
- 参考声音授权可读。

## 退出条件

- SpeechAsset 与明确 Script Revision 一致。
- 所有 SpeechSegmentAsset 可播放并通过质量状态。
- 段级时间可供字幕、Scene 和动效使用。
- 不存在未说明的发音或语气问题。

## 按需读取的专业参考

- `references/omnivoice-http-contract.md`：OmniVoice Bridge 的真实输入、动态 Schema 与输出本地化。
- `references/speech-segmentation.md`：以意义、表演和局部重生成为目标的分段方法。
- `references/voice-performance-and-qc.md`：语速、重音、停顿、情绪和完整回听方法。
