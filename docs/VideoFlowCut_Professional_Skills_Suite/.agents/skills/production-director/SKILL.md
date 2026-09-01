---
name: production-director
description: Route and govern whole-film production for Presenter, Visual Explainer, Vlog, or hybrid projects. Use when creating a new video, producing a full cut, changing production mode, or coordinating multiple specialist Skills through preview and quality gates.
---


# 整片生产导演

## 角色

本 Skill 是整片生产的路由器、依赖管理器和质量闸门。它不替代专业剪辑判断；它负责让正确的专业 Skill 在正确阶段被加载，并确保项目不会在“能渲染”时过早宣布完成。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 创建新视频或从素材生成完整成片。
- 整片重构、跨模式混合制作或重大 Revision。
- 需要在 Presenter、Visual Explainer、Vlog 之间选择主路线。
- 需要判断哪些专业 Skills 必须参与本次生产。

## 何时不使用

- 只修改一个已明确对象的局部属性时。
- 只做素材上传、下载或单次技术排错时。
- 只要求读取项目信息且不产生创作决定时。

## 前置读取

- CreativeBrief、ProductionProfile、当前 Revision 与用户硬约束。
- 项目已有 Story、Scene、Timeline、Speech、Asset 和 QualityReport。
- 当前 `video-editor-mcp` 工具描述。
- 需要时读取 `../project-basics/SKILL.md`。

## 必须掌握的证据

- 目标平台、画幅、时长、受众和观看场景。
- 用户提供的参考视频、素材可用性和授权状态。
- 主时间轴由语音、旁白叙事还是实拍事件驱动。
- 当前能力真实可用范围：ASR、声音、数字人、Remotion、素材来源。
- 上一 Revision 的阻塞问题和未解决假设。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 一句话的观众承诺是什么？
- 主要生产模式是什么，是否需要局部混合其他 Scene Type？
- 当前视频首先失败在内容、表演、视觉、声音还是技术？
- 哪些专业 Skill 是必需，哪些会造成无意义的流程膨胀？
- 哪些环节应先稳定，哪些包装必须等待主线完成？
- 什么证据足以进入下一生产阶段？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立生产合同

先把 Brief 压缩为：

- 观众承诺；
- 主要受众；
- 目标平台与画幅；
- 目标时长；
- 主要视频类型；
- 允许的素材和生成边界；
- 期望完成度；
- 用户明确不接受的风格。

没有观众承诺时，禁止直接开始加动效或搜素材。

### 2. 选择主路线

按主时间轴驱动方式选择：

```text
最终语音 / 人物表演驱动 → presenter-motion-director
旁白 / 知识结构驱动       → visual-explainer-director
实拍事件 / 镜头素材驱动   → vlog-director
```

混合视频仍需指定一条主路线，其余模式作为 Scene 级子路线，不创建多套 Project 或 Timeline。

### 3. 组装专业 Skills

基础依赖按实际问题加载，不为了“流程完整”强制调用：

- 内容删改：`semantic-continuity`
- 数字人：`avatar-performance`
- 视觉处理：`visual-treatment-planning`
- 动效时机：`effect-timing`
- 人物前后景：`depth-composition`
- 全屏插入：`cutaway-planning`
- Scene 建设：`scene-planning`
- 证据：`evidence-visualization`
- 字幕：`captions`
- 声音：`audio-finishing`
- Remotion：`remotion-production`
- 审片：`quality-verification`

### 4. 管理阶段依赖

默认生产顺序：

```text
Brief 与观众承诺
→ 素材 / 转写 / Story
→ 主声音或 A-roll
→ 语义与节奏复核
→ AttentionCurve 与 Visual Treatment
→ Scene / Cutaway / Caption / Audio
→ 真实预览
→ 整片质量复核
→ 必要修订
→ 导出
```

某一阶段没有通过门槛时，不能用后续包装掩盖问题。

### 5. 保留阶段性产物

每个阶段应产生可读状态，而不是只有“任务成功”：

- ProductionRoute；
- Story / Script Revision；
- AttentionCurve；
- VisualTreatmentPlan；
- SceneDocument；
- QualityReport；
- SkillExecutionReport。

### 6. 完成前的反事实检查

至少比较：

- 保持当前版本；
- 减少处理；
- 加强处理；
- 换主路线或 Scene 语法。

确认最终方案不是因为“已经实现了某个组件”而被选择。

## 禁止行为

- 把 Timeline、MCP success、Remotion render success 或单个 MP4 当作成片完成。
- 在主声音和语义尚未稳定时批量生成所有字幕、MG、B-roll 和音乐。
- 为展示能力而强制调用所有 Skills。
- 让多个 Director 同时改写同一主时间轴而没有明确主从关系。
- 把用户的参考视频当作可直接复制的固定模板。
- 绕过 Revision、ImpactReport 和真实预览。

## 验证

- 确认正确的主 Director 和专项 Skills 已加载。
- 检查每个阶段的退出证据，而非只看任务状态。
- 检查真实合成 Preview 与 QualityReport。
- 至少完整有声播放一次候选成片。
- 确认阻塞问题为零，重大问题有明确处理或用户接受记录。
- 生成 SkillExecutionReport，说明关键创作判断。

## 退出条件

- 成片对应明确 Revision。
- 观众承诺能够从开头、主体和结尾得到兑现。
- 主要专业 Skill 已完成自己的退出条件。
- Codex 已检查真实 Web 预览和完整声画。
- 阻塞级问题为零；剩余不确定性已明确。
- 用户可以查看、比较并决定是否导出。

## 按需读取的专业参考

- `references/route-selection.md`：如何根据主时间轴、素材状态和观众任务选择 Presenter、Explainer、Vlog 或混合路线。
- `references/production-gates.md`：各生产阶段的专业退出门槛，防止技术完成冒充创作完成。
- `references/mixed-mode-routing.md`：同一视频中混合 PresenterScene、ExplainerScene 与 VlogMontageScene 的规则。
