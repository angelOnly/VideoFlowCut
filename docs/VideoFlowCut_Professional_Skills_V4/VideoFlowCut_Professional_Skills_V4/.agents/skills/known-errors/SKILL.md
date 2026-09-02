---
name: known-errors
description: 对 VideoFlowCut 的 Revision、媒体、Bridge、Speech、Actor、Scene、Preview、Remotion、Quality 与交付故障进行分层诊断；先确认是否已有副作用，再重试，区分技术失败与创作失败。
---

# 已知错误、诊断与恢复

> **V4 单文件原则**：本 Skill 已内置完成该任务所需的核心专业知识、案例、失败模式和验证方法。除项目级 `_shared` 合同与 `docs/asr接入.md` 等真正共享资料外，不依赖同目录 `references/`。


## 先判断失败发生在哪一层

不要把所有问题都归为“渲染失败”或“效果不好”。故障可能发生在项目定位、Revision、媒体导入、外部工作流、语音组装、人物、对象图、预览、最终导出、权利或创作判断。正确恢复从确定层级和现有副作用开始。

技术错误有代码、Job、路径和状态；创作失败则表现为内容无聊、效果无关、节奏机械、字幕拥挤、视频像 PPT。后者不能通过重启 Worker 解决，必须回到对应专业 Skill。

## Revision 冲突

错误表现为 base_revision 过期。不要强制覆盖。重新读取项目，找出 Web、Codex 或其它流程的新修改，判断原决定是否仍成立，再基于最新版本重做必要操作。冲突涉及同一对象时需要专业重新判断，而不是机械重放。

## Job 超时或结果未知

网络断开、Bridge 重启或客户端超时不代表任务没执行。先 `track_job`、读取 Project、查本地 Asset、Bridge Audit 和输出路径。只有确认没有副作用后才用相同幂等键重试。重复生成可能产生多份声音、素材或导出。

## Bridge Schema 变化与 run_id 丢失

ComfyUI 工作流保存后 schemaVersion 和字段 ID 可能变化。每次调用前读取 Workflow Detail；HTTP 409 后刷新，不重复使用旧 Schema。Bridge 的 run 记录只在进程内，重启后旧 run_id 可能无法查询，因此本项目必须保存请求摘要、Schema、外部 ID 和已下载输出。该合同来自项目 API 文档，详见项目 `docs/asr接入.md` 的通用调用流程。

## 媒体导入和分析失败

检查路径、权限、文件头、MIME、编解码器、ffprobe、缩略图步骤和磁盘。HTML 错误页不能当视频。Asset `failed` 时输出 failureReason，不把它放入 Timeline。素材能分析也不必然可由 Remotion 渲染，当前没有正式 RenderPreflight 时需通过实际 Preview 证明。

## FunASR 与语义问题

FunASR failed 是技术问题；转写文本错误是质量问题；把标点候选当 SemanticUnit 是流程错误。人工修正用 `apply_manual_transcript`，语义组合用 `apply_semantic_units`。不能通过重新 ASR 无限制解决专业名词，需要回听和人工证据。

## OmniVoice 与 SpeechAsset

常见问题：参考音频不清、Segment 失败、相邻段音色变化、组装时长错误、Script Revision 失配、双重人声。先确定是生成、组装、AudioMode 还是表演问题。局部重生受影响 Segment，不默认重做全部。

## Actor、Mask 和声音所有权

无 Mask 时 Rear FX 应降级；Mask 边缘抖动是视觉问题；ActorPerformance stale 表示 Script/Speech 变化。`use_source_audio` 和 `use_dialogue_track` 同时可听是 blocking。不要用 Cutaway 长期遮盖人物生成质量问题。

## Project Graph 与悬空引用

`validate_project_graph` 失败时停止导出，读取缺失 Scene、Item、Cue、Caption、Speech 或 Actor 引用。不要直接删除报错对象；先判断是上游对象被删除、重编译未传播还是旧 Revision 数据。修复后重新验证并读取 Impact。

## Preview 与合成帧

Preview failed 时检查目标 Revision、资源、Remotion、字体和路径。Preview succeeded 但 `inspect_composed_frames` 无法读取时，检查文件、范围和 Job 归属。抽帧成功只能证明指定帧，不证明整段。

## 正式导出

当前 Remotion 失败会使正式 Export 失败，不应降级为缺字幕/动效的成功文件，执行时以 `apps/server/src/mcp.ts` 的当前工具合同为准。 若只需要诊断主轨，使用明确 Draft，不称为 Delivery。Export succeeded 后仍需最终文件 QC。

## 创作失败模式

### 技术正确但效果无关

根因通常是固定模板、关键词匹配、全部 Registry 覆盖或 Skills 未真实参与。回到 DirectorPlan、Visual Treatment 和真实素材，不重渲染同一方案。

### 全片过满

检查 AttentionCurve、字幕、Effect、SFX 和 Cutaway。删除次要变化，建立安静区，不把“网感”理解为持续刺激。

### 像 PPT

检查 Scene 是否每句新卡片、视觉是否只有文字、对象是否没有持续和状态。回到 Scene Grammar 和 Remotion Production。

### B-roll 相关但空泛

重新判断观众任务。抽象词不自动搜索象征性 Stock；可能需要人物、具体生活行为或视觉解释。

### Review 为空却被称为通过

未记录审片就保持 not_recorded。不能用空 Findings 表示无问题。

## 诊断顺序

1. 确认 Project、Revision、对象和 Job；
2. 读取错误代码和 failureReason；
3. 检查是否已有副作用；
4. 区分技术、数据、能力、权利和创作；
5. 选择恢复、降级、重新规划或请求证据；
6. 写后读回并验证；
7. 不隐藏已知限制。

---

## 分层诊断与结果未知

故障先按 Context、Revision、Asset、External Job、Domain Graph、Preview、Export、Rights、Editorial 分类。不要看到用户说“失败”就立即重试。

结果未知时，检查 Job、本地文件、Revision 和外部审计，判断任务是否已经完成。幂等键只能防止部分重复，不能替代读回。若当前 Revision 已前进，旧 Job 结果不能静默写入最新状态。

---

## Bridge、媒体和渲染故障

Bridge 409 通常表示 Schema 变化或应用不可用，应重新读取 Workflow Detail。run_id 丢失常来自 ComfyUI 重启；依赖本地 Job Audit 和已下载输出恢复。

媒体失败检查路径、权限、文件头、编码、时长和磁盘。能被 ffprobe 读取不保证 Chromium/Remotion 可用，必须通过 Preview 或未来 RenderPreflight。

正式 Export 失败不能返回只有主轨的成功文件。诊断 Draft 与 Delivery 分开。

---

## 常见创作失败与根因

“无聊”可能来自内容重复、观众问题消失、声音平、视觉长期不变或高密度后没有恢复。不要默认加 Effect。

“像 PPT”来自每句新卡、文字承担全部含义、对象不持续和模板重复。需要重做 Scene Grammar，不只是换转场。

“素材相关但廉价”来自关键词联想，没有承担解释、证明、体验或情绪任务。重新写 Asset Requirement。

“动效很多但没记住”说明第一注意、稳定画面和阅读时间失败。减少同时变化，明确 Settled Frame。

---

## 最终检查

- 失败层级明确。
- 重试前确认副作用与幂等。
- Revision 冲突不强制覆盖。
- Bridge 使用最新 Schema。
- 媒体和权利状态真实。
- 创作问题交给专业 Skill，而非只重跑 Job。
- 恢复后检查 Project Graph、Preview、Quality 和必要完整播放。

## 项目级共享合同

执行时还应读取项目中真正共享、会独立变化的合同：

- `../_shared/CAPABILITY_MANIFEST.md`：当前代码实际能力；
- `../_shared/PROJECT_REVISION_AND_EXECUTION.md`：Project、Revision、MCP 和执行安全；
- `../_shared/EVIDENCE_AND_REALITY.md`：事实、证据、未知和生成内容边界；
- `../_shared/QUALITY_AND_DELIVERY.md`：技术、审美与交付门禁。

这些文件不替代本 Skill 的专业知识；本文件单独阅读应已经能完成专业判断。
