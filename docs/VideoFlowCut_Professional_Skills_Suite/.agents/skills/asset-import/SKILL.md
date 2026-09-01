---
name: asset-import
description: Import, acquire, deduplicate, localize, and register media assets with readiness, provenance, and editorial suitability checks. Use for user uploads, external stock/evidence assets, generated media, or project library reuse.
---


# 素材导入、获取与就绪管理

## 角色

本 Skill 不只负责把文件放进素材库，还负责判断素材是否可用于正式剪辑：来源可追溯、权利状态明确、技术质量合格、内容适配、处理状态完整。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 用户上传或引用素材。
- Visual Treatment 需要外部 B-roll、证据、图片或生成画面。
- 需要从项目库复用或替换素材。
- 素材下载、生成或代理处理完成后注册。

## 何时不使用

- 只在讨论素材设想，尚未决定实际使用。
- 只调整已注册 Asset 在 Timeline 的位置。

## 前置读取

- AssetRequirement 或用户明确素材意图。
- 当前项目 Asset 列表和内容哈希。
- 外部来源的许可、作者和下载页。
- 生成媒体的工作流、提示词和来源标记。

## 必须掌握的证据

- 原始文件、来源页、作者、许可和署名要求。
- 画幅、分辨率、帧率、时长、声道、编码。
- 缩略图、代理、波形、ASR 和视觉分析状态。
- 内容相关性、构图、运动、可裁切范围和水印。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 项目是否已有同一内容或等价素材？
- 这个素材解决什么 Scene 任务？
- 是否有更真实、更相关或授权更清楚的候选？
- 竖屏/横屏裁切是否保护主体和文字？
- 素材是证据、说明、情绪还是装饰？
- 生成素材是否会被误解为真实证据？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 形成 AssetRequirement

在联网搜索或生成前，说明：

- 叙事用途；
- 主体；
- 动作；
- 情绪；
- 构图；
- 画幅；
- 时长；
- 排除条件；
- 权利要求。

禁止只用脚本原句做一个宽泛关键词搜索。

### 2. 按优先级寻找

```text
项目已有素材
→ Creative Library
→ 允许使用的 Stock / 开放授权素材
→ 官方网页或证据截图
→ MiniMax 等生成媒体
→ Remotion 原生图形替代
```

### 3. 候选比较

至少比较：

- 语义相关性；
- 构图和画幅；
- 镜头运动；
- 情绪；
- 清晰度；
- 水印 / Logo；
- 风格一致性；
- 授权；
- 可裁切性；
- 与项目现有素材的重复度。

### 4. 本地化与登记

真正使用的外部素材必须下载到项目受管目录，计算哈希并保存 Provenance。禁止 Timeline 长期引用搜索临时 URL。

### 5. 处理就绪

分别跟踪：

- 上传/下载完成；
- 媒体探测；
- 代理；
- 缩略图；
- 波形；
- ASR；
- 视觉分析；
- 权利检查。

只有 Scene 所需能力就绪后，才允许进入正式 Timeline。

### 6. 视觉适配检查

在 Scene 中预览真实裁切结果，不仅看素材缩略图。

## 禁止行为

- 从任意网页下载许可未知的视频。
- 使用带不可接受水印或 Logo 的素材。
- 把搜索缩略图或临时 URL 当正式 Asset。
- 用生成历史画面冒充真实档案。
- 因关键词相同就认为素材相关。
- 未就绪素材直接进入正式 Scene。
- 批量下载大量候选而不比较。

## 验证

- Asset 已本地化并有内容哈希。
- Provenance、许可和署名要求可读。
- 技术探测通过。
- 真实 Scene 裁切和构图已检查。
- 重复素材已处理。
- 生成素材已标注非证据属性。

## 退出条件

- 正式使用的 Asset 为 ready。
- 来源和权利状态不为 unknown。
- 素材确实解决明确叙事任务。
- Scene 可以稳定读取本地文件。

## 按需读取的专业参考

- `references/acquisition-and-ranking.md`：外部素材需求拆解、候选搜索和编辑性排序。
- `references/provenance-and-rights.md`：来源、授权、署名、生成内容与证据边界。
- `references/readiness-and-deduplication.md`：导入、处理状态、重复检测和正式可用门槛。
