# 质量证据、四轮审片与交付

## 四级完成证据

一条视频至少有四个不同层级：项目结构已保存、局部真实合成可检查、最终文件已产生并技术正确、完整声画审片成立。前一层不能推出后一层。Timeline 合法不代表 Remotion 能读取所有 Asset；一张关键帧正确不代表动画和节奏正确；MP4 可播放不代表剪得好。

## 五轮审查

当前代码要求记录 audio_only、mute_visual、audiovisual、first_viewer、mode_specific 五类 Pass。它们分别回答：只听声音时语义和混音是否成立；静音时注意力、构图和视觉密度是否成立；声画同时播放时落点是否一致；首次观众是否知道为什么继续看和最后得到什么；Presenter/Explainer/Vlog 的专项任务是否完成。

审片结论必须绑定具体 Revision 和 Preview Evidence。没有看过或听过的范围写 `inconclusive`，不能自动写通过。

## 严重级别

- blocking：事实、权利、语义、声音、黑帧、丢失关键内容、错误 Revision 等必须修复；
- major：明显损害理解、节奏、注意力或完成度；
- minor：局部完成度问题；
- suggestion：可选风格尝试；
- inconclusive：证据不足。

问题记录应包含可观察证据、观看影响、可能根因、建议修复、对象或帧范围和复核方法。避免只写“这里不好看”。

## Draft 与 Delivery

Draft 用于内部审片、A/B 和调试，可以在完整 Editorial Review 前产生，但必须明确标记。Delivery 必须固定目标 Revision，具有真实 Preview Evidence、完整审片、技术验证和零 blocking。Remotion 失败不能静默交付只有主轨的降级文件。

用户批准必须对应具体 ExportArtifact。后续项目继续编辑不会改变已批准文件；用户说“这个版本可以”时，应记录其看到的 Revision/Artifact，而不是模糊的“当前项目”。

## 修复回路

质量问题应退回最接近根因的负责人：残句回到 semantic-continuity；人物声音和口型回到 voice/avatar；无关 B-roll 回到 visual-treatment 与 cutaway；字幕遮挡回到 captions/depth；动画像 PPT 回到 remotion/scene；整片主线错误回到主要视频工作流。Quality 不是无人处理的报告终点。
