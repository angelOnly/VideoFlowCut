---
name: semantic-continuity
description: 在删改、重排或生成口播时保护完整思想、重录选择、自然停顿和真实语义连续性。
---

# 语义连续性与口播编辑

## 使用范围

删除、保留、重排 SemanticUnit，清理口癖/停顿，或修改 TTS Script 前使用。它是 apply_script 前的内容质量门槛。

## 必须执行

1. 读取完整 Transcript、SemanticUnit、当前 Script、前后上下文和可用源音频。
2. 标出主张、前提、解释、例子、转折、结论、问答、列表、重录和有意重复。
3. 对每项删除或保留，比较保持原状、最小删改和更强压缩；保护完整思想而非 ASR 分块。
4. 通过 apply_script 提交已确认的 SemanticUnit 顺序，再读回 Script Revision 和影响范围。
5. 回听所有关键切口及完整声轨；文本通顺不等于听起来自然。

## 专业判断

- 因果、转折、对比、代词指向、列表、问题与回答必须成组判断。
- 重录不默认选择最后一次；比较完整度、清晰度、情绪、画面可用性和前后衔接。
- 停顿可能是呼吸、思考、情绪或笑点后的释放，不能按固定毫秒阈值全部删除。
- 不从不同残缺 Take 拼出说话者没有完整说过的话。

## 当前能力边界

当前 MCP 能按 SemanticUnit 更新 Script，但没有通用的源片剪切、重录标注或音频淡化写入能力。无法安全落实的切口必须作为建议或请求补充证据，不能报告已完成。

## 按需读取

- 完整思想与上下文：references/complete-thought-editing.md。
- 重录、重复、口癖和停顿：references/retakes-repetition-and-fillers.md。
- 文本与音频复核：references/semantic-audit.md。

## 退出条件

只听声音仍可理解主线；没有半句话、悬空转折、无指向代词或未经说明的重录拼接。
