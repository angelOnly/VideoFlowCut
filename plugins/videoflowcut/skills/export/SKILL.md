---
name: export
description: 固定目标 Timeline/Sequence 与 Revision，区分 draft/delivery，检查质量和权利门禁，异步导出并验证最终 Artifact；导出不修改创作状态，也不等同于用户批准。
---

# Draft、Delivery 与最终文件

## 导出是固定版本的交付动作

Export 读取一个不可变 Revision Snapshot，把它交给 Remotion Render Worker，并记录最终文件。它不应该在导出过程中自动修 Story、替换素材或调整效果。若质量门禁不通过，应返回负责人修复后产生新 Revision，再重新导出。

## Draft 与 Delivery

Draft 用于内部审片、A/B、技术调试和分享候选。它可以在完整 Editorial Review 前产生，但必须明确是草稿。Delivery 用于正式交付，当前代码要求目标 Revision 已有真实 Preview、完整声画和首次观众复核，并且 blocking 为零。

不要为了快速拿到文件把 Delivery 改成 Draft 后对外宣称完成。用途属于 Artifact 元数据和用户沟通的一部分。

## 导出前

确认 Project、目标 Timeline/Sequence、Revision、画幅、帧率、时长和编码规格。读取 QualityReport、EditorialReview、Preview Evidence、Asset/Provenance 和 Attribution；使用 `run_render_preflight` 检查当前 Revision 的所有实际引用是否本地存在、可解码、字体/Mask/组件可用、Speech 与 Script 一致、权利允许。Preflight 通过不替代真实 Preview、审片和最终文件验证。

Delivery 阻塞包括：语义/结构 blocking、未知权利、缺署名、远程临时 URL、人物/声音版本错、关键遮挡、缺音频、Remotion 失败、缺 Preview/Review。

## 提交和跟踪

使用 `submit_export`，明确 revision 和 purpose，保存 Job ID，再 `track_job` 到终态。旧 Job 没有 purpose 时当前代码按 delivery 处理，防止绕过门禁。Remotion 失败会使正式导出失败，不会自动返回只有主轨的 FFmpeg 文件。

Job succeeded 后用 `track_export` 读取导出状态，并用 `read_export_artifact` 读取结果、目标 Revision、依赖和路径；随后以 `record_export_artifact_review` 记录成片复核，只有用户对具体 Artifact 调用 `approve_export_artifact` 后才是批准。不能只凭文件名猜目标 Revision，也不能把 Job succeeded 当作批准。

## 最终文件验证

检查文件存在且非零、容器可解码、视频时长与 Timeline 合理、画幅/帧率、音轨、头尾黑帧、缺帧、静音、关键画面和哈希。播放最终文件而不只播放 Web Preview，因为浏览器和 Render Worker 可能存在字体、解码和资源差异。

完整 Delivery 还要完成整片声画审片，并让批准绑定具体 Artifact。项目后续新 Revision 不改变旧 Artifact；重新导出产生新的文件和记录。

## 权利和署名

Attribution Required 的素材必须进入描述、片尾或约定位置。证据、生成内容和外部素材的来源状态需要随 Artifact 保存。产品只执行项目政策，不向用户作法律结论。

## Render Preflight 的检查范围

`run_render_preflight` 从目标 Revision 的 Timeline 反向遍历所有实际引用：源媒体、SpeechAsset、Mask、Effect AssetBinding、字体、Style、组件版本和署名。素材库里存在同名可用文件不能证明当前引用正确。

Preflight 是当前 MCP 的独立步骤；仍需通过 Project/Asset/Quality/Preview 和最终导出试验覆盖其不能判断的语义、审美和完整观看风险。Preflight 结果、Artifact Review 和用户批准分别持久化，不能相互替代。

## 可重复性

Artifact 应记录 Project、Timeline/Sequence、Revision、Runtime/组件版本、规格、文件 Hash、时长、音轨和生成时间。对于生成/外部素材，还应关联 Provenance 和 Attribution。这样后续能解释用户批准的是哪一个文件。

## 导出规格

画幅、帧率、分辨率、编码、码率、音频采样率和声道由目标平台决定。第一版可以提供少量预设，不让 Agent自由组合未经测试的参数。预设也不能改变项目画幅而不重新检查布局。

## 失败后的行为

质量门禁失败不提交 Render；Render 失败保留日志但不发布临时文件；验证失败将 Job/Artifact标为失败或 degraded draft，不写“导出成功”；用户取消保留 Project，不删除已通过的旧 Artifact。

## 交接合同

输入是目标 Project/Timeline/Revision、purpose、规格、Quality、Preview 和 Rights。输出是 Job、固定 Revision 的 ExportArtifact、技术验证和已知限制。它不使 Story/Scene 失效。验证是最终文件技术检查、完整播放和批准记录。
