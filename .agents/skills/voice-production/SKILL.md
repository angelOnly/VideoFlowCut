---
name: voice-production
description: 将最终 SpeechSegment 与本地 VoiceReference 交给 OmniVoice，下载并校验段级音频，使用真实时长组装 SpeechAsset 和 segment_exact；同时审查语速、重音、句尾与相邻段连续性。
---

# OmniVoice 旁白生产、组装与听感

## 为什么按语义段生产

整条旁白一次生成看似简单，但 Script 只改一句就要全部重做，也难以把段首、段尾和视觉事件绑定到真实时间。把文本机械切成很短的句子又会让语气每段重置，听起来像拼接。`voice-production` 的核心是在“完整自然表达”和“可局部重生成”之间选择合理 SpeechSegment。

SpeechSegment 应优先沿完整句、转折、列表项、问题/回答、笑点、CTA 和重要视觉边界切分。不能拆开主谓、否定与对象、数字与单位、专名和一次自然呼吸内的短语。长句可在真实语义和停顿处拆，不按固定字数。

## VoiceReference

参考音频应获得授权，通常选择 3～15 秒、单人、清晰、低噪、音色稳定且与目标角色接近的范围。强背景音乐、多人说话、严重混响和情绪极端的片段会降低一致性。当前 VoiceReference 是本项目本地对象，不存在远端 Voice ID。

使用 `manage_voice_references` 登记已就绪本地音频，并保存授权与用途说明。不能因为同一音频以前生成成功，就忽略新的目标语气和语言差异。

## 表演计划

TTS 不只是把文字念出来。每段至少考虑语速、重音、句尾、停顿、情绪和与相邻段的关系。解释复杂图形时旁白可稳定一些；个人坦白和反思需要自然呼吸；促销 CTA 可以更明确，但不能每句都保持同一高能语调。

如果一个段落进入时还在承接上一句，就不应生成成完全独立的开场语气。相邻段的情绪、响度、节奏和句尾应在完整播放中比较，而不是逐段听都“清楚”就算通过。

## 当前调用链

```text
read_script / read_speech_asset
→ 确认最终 SpeechSegment 与 Script Revision
→ 选择 VoiceReference
→ submit_voice_synthesis（只提交 stale/changed 段）
→ track_job
→ 下载每个 SegmentAsset
→ ffprobe 检查真实时长、采样率、声道和文件
→ 组装 SpeechAsset
→ read_speech_timing 得到 segment_exact
```

每次 OmniVoice 调用前重新读取 Workflow Detail。当前 HTTP 输入只有参考音频和待合成文本，工作流内部会自动转写参考音频；不要提交不存在的 reference_text。

## 组装和停顿

SpeechAssembler 按 Script 顺序拼接真实段级文件，并应用明确的前置/后置停顿。极短交叉淡化只用于消除爆点，不能吞掉辅音或掩盖错误切口。每段真实时长加上停顿形成最终 `segment_exact`，它能支持段级字幕、Scene 和段首/段尾效果，但不能被描述为逐词时间。

## 四轮回听

自然 SpeechSegment 不等于一屏字幕。声音组装稳定后交给 `captions`，用当前 `generate_speech_captions` 从最终 SpeechAsset 的真实音频取得分屏时间；不要为排版溢出重新拆碎或重生已经自然的配音。

第一轮对照文本，查漏读、错读、专名、数字和否定；第二轮不看文本，判断自然性、语气和机械感；第三轮连续听相邻段，查音色、音量、语速、情绪和拼接；第四轮与人物、字幕、BGM 和 Cutaway 一起看，检查口型、听感和注意力。

### 常见问题

每段同一语调通常来自过度短分段或文本没有承接；句尾总是下落可能因为每段都被当成独立结束；相邻音色变化可能来自不同参考范围或生成不稳定；错读专名应修该段文本并局部重生，不需要重做整条。音乐和 EQ 不能修复错误的表演逻辑。

## 音频所有权

人物视频原声、OmniVoice Dialogue 和静音必须明确三选一。使用 Dialogue 时 Actor 视频应静音；数字人视频若已包含最终声音，不再叠加 SpeechAsset；纯视觉人物可以 muted。当前质量系统会检查重复 Dialogue，但主工作流仍要主动选择。

## SpeechSegment 的长度与自然性

过短 Segment 会让每段都有新的起音、呼吸和句尾；过长 Segment 又会让局部重生昂贵，并难以在段首/段尾布置视觉事件。合理长度取决于语义和表演，而不是固定字符数。通常完整短句、转折后的新主张、列表项、笑点和 CTA 是自然边界；同一句内部只有为了关键视觉落点且朗读自然时才拆。

拆分前应大声读一遍。若单独朗读听起来像半句，TTS 也很可能不自然。合并后又要检查是否导致过长和情绪变化不足。

## 标点、文本与 TTS 表演

标点会影响停顿和句尾，但不能用大量省略号、感叹号和特殊符号强迫模型表演。先写自然可读文本，再通过 Segment、pauseBefore/After 和必要的文本微调控制。数字、英文和专名可用适合模型的读法，但最终 Script/字幕需要保持观众理解和事实。

## 参考声音的一致使用

同一 SpeechAsset 的 Segment 应尽量使用同一个 VoiceReference 和可比参数。更换参考范围会改变音色和空间。若某段需要明显不同情绪，先判断能否通过文本和表演实现；频繁更换参考会让人物身份不稳定。

## 局部重生决策

只重生：错读、漏读、明显音色异常、句尾不自然、情绪错误或 Script 变更的 Segment。不要因一个段错误重做所有已通过段。重生后真实时长变化会移动后续 Timing，因此必须重新组装 SpeechAsset并让 Caption/Effect 复核。

## Speech 与人物时长不一致

声音长于人物画面时，不能默认拉伸人物或裁掉句尾。比较：重生更短自然版本、调整 Script、生成更长人物、插入合适 Cutaway、使用静态/循环人物是否可接受。声音短于人物时可以安全裁主画面，但已有 Cue/direct override 时要审查。

## 技术质量

每个 SegmentAsset 检查非零文件、MIME、可解码、采样率、声道、真实时长、头尾静音和峰值。最终 Assembly 检查无重复段、顺序、空白、爆点和目标时长。技术通过后仍要四轮听感。

## 示例：列表

“第一，先确认目标；第二，再选择素材；最后，完成审片。”可以三个 Segment，但每段的语调应保持列表承接，前两项不要像完整结论，最后一项才收束。若模型每段都下落，需要合并或调整文本，而不是只缩短停顿。

## 交接合同

输入是最终 SpeechSegment、Script Revision、VoiceReference 和表演意图。输出是 SegmentAsset、SpeechAsset、真实 `segment_exact`、质量结论和失败段。它会使 ActorPerformance、Caption 和 EffectTiming 需要重建或复核。验证是逐段、拼接、只听声音和声画检查。完成后结果回到 Presenter/Explainer 主工作流。
