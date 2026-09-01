# 质量问题分类与严重级别

## 问题域

### semantic
事实、语义、因果、上下文、观点完整性。

### editorial
内容选择、结构、重复、Hook、段落推进、结论兑现。

### pacing
镜头长度、语言停顿、信息密度、张弛和节奏关系。

### visual
构图、连续性、遮挡、素材相关性、画面层级。

### motion
动效时机、运动语义、入场/稳定/退出、视觉冲突。

### typography
字幕、标题、换行、层级、可读性和安全区。

### audio
对白连续性、BGM、SFX、环境声、静音和响度层级。

### style
StylePack 一致性、模板重复、风格混杂。

### rights
来源、许可、署名和生成内容标注。

### technical
解码、同步、渲染、文件、Revision 和任务状态。

## 严重级别

### blocking

必须修复后才能继续：

- 事实错误；
- 语义断裂；
- 无权使用的素材；
- 声画严重不同步；
- 黑帧、丢音轨；
- 关键内容被遮挡；
- 导出不对应批准 Revision。

### major

显著影响观看或理解：

- Hook 不兑现；
- 重要切点伤害表演或动作；
- MG 与语义错位；
- 字幕持续不可读；
- 音乐长期压住对白；
- 大段视觉单调或过载；
- 证据高亮错误。

### minor

局部影响完成度：

- 单次字幕换行不佳；
- 小幅构图偏差；
- 个别音效稍早或稍晚；
- 某个转场略显重复。

### suggestion

风格优化，不阻塞交付：

- 可以更克制；
- 可尝试另一种颜色；
- 可在后续版本测试不同密度。

## 结论格式

每条问题应包括：

- issue_id；
- domain；
- severity；
- revision_id；
- time_range；
- observable_evidence；
- why_it_matters；
- recommended_fix；
- verification_method。
