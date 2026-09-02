---
name: export
description: 将明确 Revision 以 Draft 或 Delivery 目的导出，检查素材可渲染、权利、Remotion 成功、最终文件时长/画幅/音轨/黑帧和完整审片；导出文件不等于项目，也不等于自动批准。
---

# 导出、最终文件与交付

> **V4 单文件原则**：本 Skill 已内置完成该任务所需的核心专业知识、案例、失败模式和验证方法。除项目级 `_shared` 合同与 `docs/asr接入.md` 等真正共享资料外，不依赖同目录 `references/`。


## 导出固定一个确切版本

导出必须绑定 Project 和明确 Revision。不能用“最新版本”作为长期交付指针，因为项目可能继续变化。当前代码的 `submit_export` 可以指定 Revision，Remotion 失败会使正式任务失败，不再静默交付只有 A-roll 的降级文件，执行时以 `apps/server/src/mcp.ts` 的当前工具合同为准。

导出成功只说明渲染器产生文件。它还没有证明文件内容正确、审美通过或用户批准。

## Draft 与 Delivery

产品层应区分 Draft 和 Delivery。当前代码还没有完整 `purpose`、DeliveryCandidate 和 Approval 对象，因此 V3 Skill 先以行为门禁执行：开发预览可以作为 Draft；只有完成预检、当前 Revision Editorial Review、权利检查和最终文件审片后，才可以向用户描述为可交付版本。

Draft 应在文件名、报告或回复中明确，不让用户误以为已完成。Delivery 必须记录 Revision、规格、文件哈希、已知限制和审片证据。

## 导出前预检

检查当前 Revision 实际引用的素材，而不是素材库中“有同名文件”：受管路径存在、视频音频可解码、Mask/字体/图片可读、SpeechAsset 与 Script Revision 一致、Effect 绑定 Asset 存在、外部素材 Rights 可用、署名清单完整。

当前代码尚未有正式 RenderPreflight MCP，需要通过 `read_project`、`validate_project_graph`、`read_quality_report`、素材状态和 Preview 结果完成等价检查；缺项时不能宣称预检通过。

## 最终文件技术检查

导出 Job succeeded 后，检查：文件存在且非零、容器可解码、时长接近 Timeline、画幅/帧率正确、主音轨存在、无持续黑帧、无意外静音、无重复人声、首尾完整。最好抽取开头、中间、结尾和关键 Scene 帧。

测试导出或局部 Preview 不能冒充最终完整文件。最终 MP4 必须以自身为审片证据。

## 完整声画审片

按照 `quality-verification` 完成只听声音、静音画面、完整声画、首次观众和模式专项。当前 Revision 的 Editorial Review 应引用最终 Export 或与其同源的 Composition Snapshot。若导出后发现字体、编码、音轨或浏览器渲染差异，应修复并重新导出。

## 权利与署名

外部素材 `rightsStatus` 为 unknown、restricted 或 rejected 时不作为 Delivery。attribution_required 需要形成清单，并按来源要求出现在描述、片尾或交付说明中。生成画面和示意性证据应保留标记。

## Artifact 与后续编辑

导出文件应视为不可变 Artifact。后续修改创建新 Revision 和新文件，不覆盖已经批准的文件。当前代码尚未完整持久化 ExportArtifact/Approval，至少在 ProductionRun 和交付清单中记录路径、Revision、哈希、时间和审片结论。

## 失败处理

Remotion 失败时任务失败，不创建“成功但缺效果”的交付。若只需要检查主轨，可以生成明确标记的调试 Draft，但与 Delivery 分开。任务超时或结果未知时先读取 Job 和文件，不重复提交造成多份产物。

---

## 从 Revision 到最终文件

先固定 Revision，完成项目图和素材检查，确保当前 Preview 与目标版本一致，再提交 Export。任务结束后读取结果文件，而不是只读 Job 状态。记录路径、大小、哈希、时长、规格和来源 Revision。

当前系统尚未完整实现 DeliveryCandidate/Approval，因此 Skill 需要在 ProductionRun 中记录审片和批准事实。未来代码落地后，应由正式对象替代临时报告，而不是形成第二套状态。

---

## 最终媒体技术与内容 QC

技术检查包括容器、编码、时长、画幅、帧率、音轨、黑帧、静音、文件完整性。内容检查包括字幕、Effect、Cutaway、声音、首尾和关键 Scene 是否与 Preview 一致。

抽帧不能代替完整播放。音频异常也可能不在抽帧中出现。至少完整播放一次 Delivery，复杂项目再分段复核。

---

## 权利、署名与生成内容

本地文件存在不代表有权交付。每个外部素材读取 Provenance、License 和 rightsStatus。需要署名时汇总作者、来源和许可；未知或受限时阻止 Delivery 或请求用户确认合法来源。

生成媒体要保存 Provider、工作流、提示、参考素材和生成时间。它可以作为创意画面，不得冒充真实证据、历史记录、新闻、法规或人物当时行为。

---

## 完整推演：为什么“成功生成 MP4”仍不能交付

Render Worker 返回 succeeded，只能证明生成了一个文件。正式交付前仍要确认它来自用户批准的 Sequence 和 Revision，所有外部素材的许可与署名已经满足，文件可以从头到尾解码，时长、画幅和音轨正确，没有持续黑帧、重复人声或缺失字幕。随后还要完整观看最终文件，因为 Preview 正确不保证最终编码、音频复用和片尾都正确。

Draft 可以允许审片尚未完成，但文件和界面必须明确标记为 Draft。Delivery 则必须绑定当前 Revision 的 Editorial Review，并记录用户批准的是哪个 ExportArtifact。用户批准旧 MP4 后继续编辑项目，不得让旧批准自动覆盖新 Revision。

---

## 最终检查

- 导出绑定明确 Revision。
- 当前引用素材、Rights 和 Graph 已检查。
- Remotion 完整 Composition 成功。
- 最终文件技术 QC 通过。
- 五轮 Editorial Review 完成。
- blocking 为零。
- Draft/Delivery 状态清楚。
- 文件 Revision、哈希、路径和已知限制被记录。
- 后续编辑不覆盖旧交付物。

## 项目级共享合同

执行时还应读取项目中真正共享、会独立变化的合同：

- `../_shared/CAPABILITY_MANIFEST.md`：当前代码实际能力；
- `../_shared/PROJECT_REVISION_AND_EXECUTION.md`：Project、Revision、MCP 和执行安全；
- `../_shared/EVIDENCE_AND_REALITY.md`：事实、证据、未知和生成内容边界；
- `../_shared/QUALITY_AND_DELIVERY.md`：技术、审美与交付门禁。

这些文件不替代本 Skill 的专业知识；本文件单独阅读应已经能完成专业判断。
