---
name: voice-production
description: 使用本地 VoiceReference 与 OmniVoice 生成、组装并回听段级旁白，保持语义完整和真实 segment_exact 时序。
---

# 旁白生产与表演回听

## 使用范围

需要合成、替换或局部重生成旁白时使用。VoiceReference 只关联项目内本地 Asset，不创建或声称存在远端 Voice Profile。

## 必须执行

1. 阅读 `docs/asr接入.md`，执行 `project-basics`，读取 Script、SpeechSegment、VoiceReference 与 SpeechTiming。
2. 用 `manage_voice_references` 登记已授权且就绪的参考音频。
3. 只提交 pending 或 stale 的受影响 SpeechSegment：使用 `submit_voice_synthesis`，再用 `track_job` 等待终态。
4. 用 `read_speech_asset`、`read_speech_timing` 读回段资产、真实时长、SpeechAsset、Dialogue Item 与稳定字幕。
5. 连续回听相邻段，而不只逐段试听；发现漏字、重音、音色、停顿或拼接异常时，优先局部重生成。

## 专业判断

SpeechSegment 优先按完整句、转折、列表项、问答、CTA、情绪变化和需要切换 Scene 的位置划分，不能把主谓、因果、对比、数字与单位拆开。

`segment_exact` 只能支持段级字幕和动效，不可声称逐词同步。

## 按需读取

- OmniVoice 当前 HTTP 合同：`references/omnivoice-http-contract.md`。
- 语义分段与局部重生成：`references/speech-segmentation.md`。
- 语速、停顿、重音和四轮回听：`references/voice-performance-and-qc.md`。

## 退出条件

SpeechAsset 可播放、Script Revision 一致、Dialogue 与字幕边界可读回；失败输出和未解决的表演问题不被隐藏。
