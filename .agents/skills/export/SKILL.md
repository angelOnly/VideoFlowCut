---
name: export
description: 在质量门禁通过后导出指定 Revision，并核对生成文件是否可播放、时长正确且含有效音轨。
---

# 导出与交付校验

## 使用范围

仅在用户明确要求交付时使用。导出绑定明确 Revision，不用最新状态替代已批准版本。

## 必须执行

1. 读取批准 Revision、read_quality_report、素材状态和仍在运行的 Job。
2. 使用 submit_export 指定 Revision，再用 track_job 等待 succeeded 或 failed。
3. 读回任务的路径、渲染器、时长、音轨、持续黑帧检测和 warnings。
4. 对开头、重大修改区、字幕/效果复杂区和结尾做必要抽检。
5. 后续编辑继续产生新 Revision；不得把新编辑说成已包含在旧导出中。

## 当前能力边界

当前渲染器会固定 Revision 并验证可解码、有音轨、时长和黑帧，但尚未持久化 AttributionManifest、校验和、目标平台 Profile 或不可覆盖的 ExportArtifact。不得声称这些能力已完成；FFmpeg 降级时不得声称包含 Remotion 效果层和字幕。

## 按需读取

- 导出前门槛：references/export-readiness.md。
- 文件与画面抽检：references/technical-qc.md。
- 未来署名和可追溯交付要求：references/attribution-and-delivery.md。

## 退出条件

任务终态和实际文件校验成功；导出 Revision、规格、渲染器降级和已知限制均已说明。
