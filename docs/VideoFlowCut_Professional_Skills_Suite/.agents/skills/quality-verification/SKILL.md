---
name: quality-verification
description: Verify VideoFlowCut revisions with structural evidence, real composed frames, audio playback, whole-film editorial review, mode-specific quality criteria, and a bounded correction loop before completion or export.
---


# 结构验证、审片与成片质量复核

## 角色

本 Skill 同时承担“是否真实生效”和“视频是否成立”的终审，但必须把技术验证与审美判断分开记录。它不会因为工具成功、时间线合法或文件存在就通过成片。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 每个关键 Revision。
- 局部大改完成后。
- 用户审片前。
- 导出前。
- 参考视频复刻或风格接近度检查。

## 何时不使用

- 仅讨论未执行的创意方案。
- 仍处于明显中间状态且上游明确未完成。

## 前置读取

- CreativeBrief、观众承诺和当前 Revision。
- Story、Scene、Timeline、Caption、Audio 和 AssetProvenance。
- Preview、关键帧和完整候选。
- 已加载 Skills 和 SkillExecutionReport。

## 必须掌握的证据

- 结构读回、ImpactReport 和 DirtyRange。
- 进入、稳定、退出帧。
- 完整音频和声画。
- 目标平台、参考视频和模式专项标准。
- 上一轮 QualityReport 与修复结果。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 修改是否真实生效？
- 语义、事实和结构是否正确？
- 观众注意力是否被正确引导？
- 节奏是否存在关系和张弛？
- 画面是否帮助理解而不是重复旁白？
- 声音是否有层级？
- StylePack 是否统一且不过度模板化？
- 完整视频是否兑现观众承诺？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 结构验证

检查：

- Revision；
- 对象；
- Scene/Timeline 归属；
- 时间范围；
- Asset；
- Caption；
- Audio；
- stale/conflict；
- rights；
- Job 状态。

### 2. 像素和画面验证

对视觉变更检查：

- 进入帧；
- 中间动作；
- Settled Frame；
- 退出帧；
- 前后连续播放；
- 目标设备和画幅。

工具 success 不等于画面正确。

### 3. 四轮审片

#### 第一轮：只听声音

检查语义、拼接、呼吸、节奏、音乐和音效。

#### 第二轮：静音看画面

检查注意力、构图、场景连续、视觉密度、字幕和 PPT 化。

#### 第三轮：完整声画

检查语义与画面同步、音效落点、字幕竞争、情绪和节奏。

#### 第四轮：首次观众视角

检查开头承诺、方向感、理解门槛、结论和记忆点。

### 4. 模式专项检查

#### Presenter

- 人物是锚点；
- 表演和动效协调；
- 前后景遮挡；
- 安静区；
- Cutaway 回归。

#### Explainer

- Scene 认知模型；
- 渐进揭示；
- 解释/证据/现实分工；
- 非 PPT；
- 证据可读。

#### Vlog

- 事件真实；
- 镜头功能；
- 空间/动作/情绪连续；
- 环境声；
- 音乐不过度支配。

### 5. 问题分级

按 shared quality vocabulary 标记 blocking、major、minor、suggestion。

### 6. 有界修订循环

默认只执行一次自动修订循环：

1. 选择最重要、最可验证的问题；
2. 提交最小修订；
3. 重新验证 DirtyRange；
4. 重新完整播放关键段落；
5. 防止修订引入新问题。

更多循环需要明确收益和成本，不自动无限自修。

### 7. 完成声明

只有证据支持时才声明通过。无法验证则返回 inconclusive，并明确缺什么。

## 禁止行为

- 把 MCP success、Timeline 合法、类型检查或 MP4 存在当作质量通过。
- 只检查局部，不完整播放。
- 同时修改大量问题后无法判断因果。
- 无限自动修正。
- 把审美偏好包装成客观错误。
- 忽略素材权利和证据真实性。
- 只看截图不听声音。

## 验证

- 结构状态和真实画面一致。
- 只听、静音、声画和首次观众四轮完成。
- 模式专项检查完成。
- 问题有时间范围、证据和严重级别。
- 修订后无新增 blocking。

## 退出条件

- blocking 问题为零。
- major 问题已修复或明确接受。
- 观众承诺得到兑现。
- QualityReport 与 Revision 绑定。
- SkillExecutionReport 记录验证证据。

## 按需读取的专业参考

- `references/four-pass-review.md`：只听声音、静音画面、完整声画和首次观众四轮审片。
- `references/mode-specific-rubrics.md`：Presenter、Explainer、Vlog 的专项质量标准。
- `references/severity-and-fix-loop.md`：问题分级、根因、最小修复和有界循环。
- `references/reference-comparison.md`：参考视频比较时提炼语法而不是像素模仿。
