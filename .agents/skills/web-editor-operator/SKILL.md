---
name: web-editor-operator
description: 通过 VideoFlowCut Web 工作台定位对象、观察真实合成、完成可持久化的微调并采集 Preview 证据；不绕过 Revision，也不替代专业质量判断。
---

# Web 工作台操作与视觉证据

## Web Operator 的角色

MCP 能准确修改项目对象，却不能仅凭结构判断视觉是否成立；Web 能显示真实 Remotion Composition、人物、字幕、前后景和 Timeline，但浏览器画面本身也不能替代领域状态。`web-editor-operator` 的任务，是把这两部分连起来：在正确 Revision 上定位对象，使用可持久化的 UI 操作，随后取得真实帧和连续播放证据。

它不是独立剪辑师。是否应加一个效果由主工作流和专项 Skill 判断；Web Operator 负责证明该效果放在真实画面里是否挡脸、是否可读、是否与人物动作冲突，以及 UI 修改是否真的生成了新 Revision。

## 定位之前先确认事实

调用 `get_editor_url` 或 `focus_editor_object` 前，先通过 `project-basics` 确认 Project、Revision、Scene/Item/EffectCue ID。打开页面后至少用两个信号确认定位：URL 参数与 Inspector ID、Timeline 高亮、Scene 卡片、Preview 选框或当前帧。不能因为页面看起来像目标场景就开始编辑。

若 Web 显示的 Revision 与 MCP 读回不同，应停止写入并刷新项目；不要让浏览器把旧 Selection 或旧表单值提交到新 Revision。

## 如何看一个效果

单张稳定帧只能回答构图，不能回答运动。对 EffectCue 至少检查四个时刻：进入前的原画面、运动中的中间状态、信息完整的 Settled Frame、退出和下一事件的交接。随后播放“前一句—完整效果—后一句”，确认画面不是局部正确、连续观看却突兀。

Settled Frame 应单独成立。观众应该能迅速识别第一重点，文字可以读完，人物的脸、嘴、手和字幕安全，证据没有被裁掉，画面在运动停止后仍然有构图。若效果只有不停漂浮时才显得“丰富”，通常是稳定画面本身没有设计好。

## 如何做微调

调整顺序从高到低是：事实和内容、主体与证据、字幕和平台安全区、第一注意目标、阅读时间、空间平衡、运动、颜色和材质。不要先改 Glow、阴影和圆角来掩盖对象位置错误。

微调应尽量落在当前数据模型能持久化的属性，例如 EffectCue 的 SpatialAnchor、Props、Motion、StylePack 或 Inspector 中注册的布局参数。如果 Web 只能通过临时 CSS 获得结果，说明能力尚未进入项目模型；此时记录缺口，不声称修改完成。

## A/B/不使用比较

重要视觉决定至少看三种：当前方案、最小调整方案、禁用效果。比较哪一个更快被理解、哪一个更保护人物、哪一个更符合整片视觉语言、哪一个注意力成本更低。主工作流可能发现最好的结果是不使用该效果；这不是失败，而是最小充分处理。

## 证据记录

局部预览可通过 `render_preview_range` 固定 Revision，成功后用 `inspect_composed_frames` 抽取帧。当前代码会把检查记录为 Preview Evidence。Browser Operator 还应记录播放范围、检查目的和观察结果，并将其交给 `quality-verification`，而不是只说“页面能打开”。

## 常见场景

### 字幕上移

先确认是 Caption 对象还是整个 Scene 的构图问题。上移后检查嘴、手势、产品、平台 UI 和下一张 Caption 的位置。只检查当前一句可能遗漏后续近景遮挡。

### 产品前景变大

不能只看产品是否显眼。还要检查人物是不是正在做重要手势、产品是否遮嘴、字幕是否被挤压、进入路径是否穿过脸，以及竖屏和横屏是否都可接受。

### 证据卡片

先看完整来源和页面坐标，再看高亮。证据需要足够时间阅读；如果为了保持人物可见把页面缩得无法辨认，应切全屏，而不是继续缩小。

## ChatCut 式工作区的联动检查

选择 Transcript/SpeechSegment 后，Playhead、Scene、Caption 和 Timeline 应定位到同一范围；选择 Timeline Item 后，Preview 选框、Inspector 和 Scene 高亮；选择 Preview 对象后反向找到 Cue/Item。Browser Operator 应验证这些联动，而不仅是按钮能点击。

## Timeline Canvas 的可访问性

若 Timeline 使用 Canvas，页面仍需通过 DOM/辅助语义层暴露 Track、Item ID、起止帧、选中和状态，供自动化定位。不要根据像素坐标盲拖。拖动后读取 Inspector 数值和新 Revision。

## Job 和状态观察

queued、running、failed、stale、conflict 和 blocking 应在 UI 可见。Browser Operator 可以等待状态，但不能将页面 Spinner 消失当 Job succeeded；仍需通过 API/MCP读回。

## Revision 比较

视觉 A/B 应明确 Revision，不在同一页面临时改 CSS截图。切换 Revision 时所有面板和 Selection 应一次切换，避免 Preview来自旧版、Inspector来自新版。

## 失败恢复

页面控件不存在可能是当前版本未实现、对象类型不支持、权限/连接问题或定位错。先确认 DOM和 Revision，不重复随机点击。需要代码能力时返回开发缺口，不用浏览器脚本直接修改后端状态。

## 交接合同

进入时应有：目标 Project/Revision、对象 ID、预期观察问题、需要比较的方案。输出是：持久化的新 Revision（若有修改）、真实 Preview/Frame 证据、发现的问题和是否需要退回某个专业 Skill。Web Operator 不自行给出“成片通过”结论。

## 停止条件

对象定位不一致、页面 Revision 过期、目标属性无法持久化、Preview 不是目标 Revision、素材未就绪或问题需要改变上游 Story/Scene 时停止。此时把任务退回 `project-basics` 或对应主工作流。
