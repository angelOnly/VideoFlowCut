---
name: audio-finishing
description: Shape dialogue continuity, room tone, silence, music, sound effects, audio bridges, ducking, fades, and final listening hierarchy after the editorial structure is stable.
---


# 声音、音乐与节奏收尾

## 角色

本 Skill 为听觉叙事和音频连续性负责。对白是 Anchor，音乐和音效服务内容结构，不以响度达标或“有 BGM”作为完成。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 主线稳定后处理声音。
- 口播切口、环境声、BGM、SFX 或章节声音需要优化。
- Cutaway、动效和镜头变化需要声音桥或强调。

## 何时不使用

- 内容结构仍在大幅变化。
- 只调用 OmniVoice 生成声音。
- 素材没有音频且用户不需要声音。

## 前置读取

- Dialogue/SpeechAsset、切点、Scene 和 MotionCue。
- 环境声、BGM、SFX 素材及授权。
- AttentionCurve、情绪结构和目标平台。

## 必须掌握的证据

- 对白音量、噪声、呼吸、切口和房间底噪。
- 音乐结构、强弱、节拍、调性和歌词。
- SFX onset、尾音和与视觉事件的关系。
- Scene 边界、Cutaway 和情绪变化。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这一段听觉主角是什么？
- 停顿应保留、压缩还是延长？
- 环境声能否帮助空间连续？
- 音乐承担节奏、情绪、章节还是只是填空？
- SFX 是否真正强化一个事件？
- 音频切口是否像自然说话？
- 安静是否比加音乐更有效？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 先只听对白

检查：

- 语义连续；
- 呼吸；
- 音节；
- 音色；
- 噪声；
- 音量；
- 段间停顿；
- 口播节奏。

### 2. 修复切口

可使用：

- 微型交叉淡化；
- room tone；
- 保留呼吸；
- 调整切点；
- L/J Cut；
- 重新生成局部语音。

不要把所有切口用同一淡化长度处理。

### 3. 建立声音角色

```text
Dialogue / Narration = Anchor
Natural Sound         = Space / Reality
BGM                   = Emotion / Structure
SFX                   = Event / Emphasis
```

### 4. 设计音乐

音乐应有：

- 入场理由；
- 章节关系；
- 强弱曲线；
- Duck；
- 结尾；
- 必要的安静区。

不默认全片铺满。

### 5. 设计 SFX

绑定明确事件：

- 数字完成；
- 产品进入；
- 切换；
- CTA；
- 笑点；
- 图表结论。

音效 onset 可能不在文件起点，需按真实听感对齐。

### 6. 声音桥

利用环境声或音乐连接 Scene，尤其是 Cutaway 和 Vlog。

### 7. 四种听法

1. 只听对白；
2. 对白 + 环境声；
3. 对白 + 音乐；
4. 完整声画。

### 8. 技术检查

检查峰值、响度、削波、声道、静音、结尾和编码，但技术达标不替代听感。

## 禁止行为

- 用 BGM 掩盖对白切口。
- 全片没有安静区。
- 所有转场都使用音效。
- SFX 只按 Item 起点对齐，不听 onset。
- 音乐强拍破坏语言和动作。
- 删除所有呼吸。
- 只看波形不听。

## 验证

- 对白连续自然。
- BGM 不长期压住语音。
- SFX 与事件同步且不过量。
- 环境声帮助空间和真实感。
- 安静、音乐和高潮有层级。
- 完整声画没有听觉疲劳。

## 退出条件

- 音频对象和角色关系清楚。
- blocking 级削波、丢音、不同步和对白不可懂问题为零。
- 音乐和 SFX 有创作理由。
- 最终导出前完成完整回听。

## 按需读取的专业参考

- `references/dialogue-continuity.md`：对白切口、呼吸、room tone 和局部重生成。
- `references/music-and-emotion.md`：音乐结构、情绪、节奏、Duck 和安静区。
- `references/sfx-and-sound-bridges.md`：事件音效、onset、环境声和 J/L Cut。
- `references/listening-and-technical-qc.md`：多轮听审与技术检查。
