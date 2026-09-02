---
name: transcription
description: 通过 FunASR 建立可追溯全文和标点候选，回听专名、数字、否定与逻辑词，并把候选交给 semantic-continuity；不把 ASR 标点和文本长度伪装成最终语义或词级时间。
---

# 转写与文本证据

> **V4 单文件原则**：本 Skill 已内置完成该任务所需的核心专业知识、案例、失败模式和验证方法。除项目级 `_shared` 合同与 `docs/asr接入.md` 等真正共享资料外，不依赖同目录 `references/`。


## 转写回答“说了什么”，不回答“保留什么”

FunASR 返回全文后，代码会按标点生成 `TranscriptSentenceCandidate`。这些候选方便阅读和后续组合，但它们不是最终 SemanticUnit。一个完整观点可能跨两句，一个标点句也可能只是重录的一半。只有 `semantic-continuity` 审阅上下文并调用 `apply_semantic_units` 后，系统才拥有可用于 Script 和 SpeechSegment 的完整语义。

## 调用合同

所有 FunASR 请求都以 `docs/asr接入.md` 和实时 Workflow Detail 为准。每次读取最新 schemaVersion、字段和媒体槽；提交后轮询 run_id；成功时以 outputs 中的 text 为准。Bridge 中示例字段和版本会变化，不能长期硬编码，详见项目 `docs/asr接入.md` 的通用调用流程。

当前接口只返回文本，不返回可靠词级时间。因此不能按字符长度均分时间，也不能把标点位置当自然停顿。时间信息来自现有 SpeechAsset、真实 VAD/分块、或未来的强制对齐。

## 高风险文字必须回听

自动识别对普通句子可能足够，但人名、机构、地名、产品、数字、日期、单位、否定、因果和转折会直接改变事实或责任。这些位置应回听最小范围，并保留 ASR、用户文稿、画内文字和音频之间的冲突。修正 Transcript 只修识别错误；若用户想让表达更通顺，那是 Script 编辑，不是转写修复。

## 当前执行

使用 `submit_transcription` 提交 FunASR，或在服务不可用/用户提供准确文稿时用 `apply_manual_transcript`。随后 `read_script` 读取候选和当前语义状态。不要在转写 Skill 中直接决定删除和重排；把候选、风险词和证据缺口交给 `semantic-continuity`。

---

## FunASR 接入与错误恢复

运行前先检查 Bridge Health 和 Workflow Detail。创建任务成功只代表 queued；必须轮询到 succeeded 或 failed。若 HTTP 409，重新读取 Workflow Detail；若 ComfyUI 重启导致 run_id 丢失，读取本地 Job 和 Bridge Audit，不重复提交直到确认没有结果。

输出文本应保存原始响应。工作流当前固定使用自动语言和 ITN，Skill 不应声称可以调整未公开参数。无声素材得到 no_audio 或空文本应被视为有效证据状态，而不是凭空生成字幕。

---

## 从转写候选到语义判断

标点候选只是机器建议的阅读边界。比如“我以前一直以为。只要赚够钱。就可以自由。”三个候选实际上属于一个因果观点；分别变成三个 SpeechSegment 会让语音和字幕机械。

相反，一句长 ASR 文本可能包含重录：“我想说的是钱能带来自由，不对，我后来发现真正缺的是时间。”这里需要识别 retake 和 conclusion，而不是保留为一个完整句。

SemanticUnit 的形成需要上下文、依赖、重录组、类型和停顿理由，这也是为什么转写完成不等于 Script 完成。

---

## 完整推演：转写正确却仍不能直接剪

假设 FunASR 返回：“我以前总觉得只要再赚多一点钱我就有资格休息但是这种想法最可怕的地方是以后会不断往后退。”从识别角度看，这段文本可能完全正确，但它仍然不是一个可直接执行的剪辑计划。标点候选可以把它分成两句，却不能自动判断第一句是人物坦白、第二句是机制解释，也不能确定“但是”之前的停顿是不是情绪落点。

正确流程是先把全文和音频范围交给 `semantic-continuity`。Agent 需要回听人物在“休息”后的停顿，观察它是否伴随低头、呼吸或语速下降，再决定把两句定义为两个相互依赖的 SemanticUnit。第一单元承担自我承认，第二单元承担认知转折。只有在这个判断完成后，Story、SpeechSegment、字幕和视觉处理才有可靠边界。ASR 的价值是建立可查证文本，不是替导演决定语义。

---

## 最终检查

- TranscriptText 与源 Asset 可回溯。
- 候选与 SemanticUnit 明确分开。
- 高风险词经过回听或被标记未知。
- 没有伪造词级时间。
- Bridge Audit 和失败原因可诊断。

## 项目级共享合同

执行时还应读取项目中真正共享、会独立变化的合同：

- `../_shared/CAPABILITY_MANIFEST.md`：当前代码实际能力；
- `../_shared/PROJECT_REVISION_AND_EXECUTION.md`：Project、Revision、MCP 和执行安全；
- `../_shared/EVIDENCE_AND_REALITY.md`：事实、证据、未知和生成内容边界；
- `../_shared/QUALITY_AND_DELIVERY.md`：技术、审美与交付门禁。

这些文件不替代本 Skill 的专业知识；本文件单独阅读应已经能完成专业判断。
