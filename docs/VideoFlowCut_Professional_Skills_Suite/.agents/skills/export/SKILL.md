---
name: export
description: Export an exact approved VideoFlowCut revision with technical QC, rights and attribution checks, deterministic snapshotting, artifact validation, and non-destructive delivery.
---


# 导出、交付与产物校验

## 角色

本 Skill 只在成片已通过质量闸门后交付。它将一个明确 Revision 固定为不可变导出 Snapshot，并检查技术、权利、署名和文件完整性。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 用户明确要求导出或交付。
- 需要重新导出已批准 Revision。
- 需要生成平台规格版本。

## 何时不使用

- 仍在创作和审片。
- 阻塞质量问题未清零。
- 素材 rights_status 未确认。

## 前置读取

- 批准的 Revision 和 QualityReport。
- 目标平台、画幅、分辨率、帧率、编码和文件命名。
- AssetProvenance 与 AttributionManifest。
- 当前导出工具和 Remotion Snapshot。

## 必须掌握的证据

- Story/Scene/Timeline/Audio/Caption 的固定快照。
- 素材文件是否本地可用。
- 字体、组件、生成资产和缓存。
- 目标时长、音轨、黑帧、首尾和平台安全区。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 导出的确切 Revision 是什么？
- 所有 blocking 和 major 问题是否处理？
- 是否有未知许可、缺失署名或临时 URL？
- 目标平台是否需要单独构图而不是简单缩放？
- 导出完成后如何验证不是空文件或旧缓存？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 锁定 Revision

创建不可变 ExportSnapshot，记录：

- project；
- revision；
- timeline；
- composition hash；
- assets；
- fonts；
- style；
- target profile。

导出期间项目继续编辑也不能改变该 Snapshot。

### 2. 导出前闸门

必须通过：

- QualityReport；
- rights；
- attribution；
- assets local；
- jobs complete；
- no stale blocking；
- target profile valid。

### 3. 异步导出

提交 Job，使用幂等键，跟踪 queued、running、succeeded、failed。任务成功只代表渲染器完成，仍需文件 QC。

### 4. 文件校验

检查：

- 文件存在且非零；
- 容器和编码；
- 分辨率和帧率；
- 时长；
- 视频流和音轨；
- 声画长度；
- 黑帧/冻结帧；
- 首尾；
- 峰值和静音；
- 文件可播放。

### 5. 画面抽检

抽检：

- 开头；
- Scene 边界；
- 复杂 MG；
- 证据；
- 字幕；
- 结尾；
- 修订区间。

### 6. 交付清单

输出：

- Artifact；
- revision_id；
- profile；
- checksum；
- duration；
- attribution；
- known limitations。

### 7. 不覆盖项目

ExportArtifact 只引用 Revision。重新编辑产生新 Revision 和新 Artifact。

## 禁止行为

- 用户未明确交付就自动导出最终文件。
- 导出 current/latest 而不锁定 Revision。
- rights unknown 仍继续。
- 只看 Job succeeded，不校验文件。
- 用远程临时 URL 作为资产。
- 覆盖旧导出且没有版本记录。
- 简单缩放代替平台构图检查。

## 验证

- Snapshot 与批准 Revision 一致。
- 文件技术信息符合 profile。
- 声画完整、无黑帧和丢音。
- 关键画面抽检通过。
- AttributionManifest 完整。
- checksum 和路径可读。

## 退出条件

- ExportArtifact 可播放并可追溯。
- 交付说明包含 Revision、规格和限制。
- 项目仍保持可编辑。
- 失败任务不冒充成功交付。

## 按需读取的专业参考

- `references/export-readiness.md`：质量、权利、资产和 Snapshot 的导出前闸门。
- `references/technical-qc.md`：文件、流、时长、黑帧、音轨和抽检。
- `references/attribution-and-delivery.md`：署名、清单、校验和版本化交付。
