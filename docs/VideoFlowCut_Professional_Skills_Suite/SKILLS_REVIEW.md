# VideoFlowCut 全量专业 Skills 审阅稿

本文把 23 个 Skill 主文件和全部专业 references 合并到一份文档中，便于逐章审阅。实际开发时仍建议保留分目录结构，让 Agent 按需加载。

## 共同原则

### `_shared/editorial-principles.md`

# VideoFlowCut 专业剪辑共同原则

本文件是所有创作型 Skill 的共同判断底座。它不替代具体视频类型的专业方法，也不包含数据库、MCP 或渲染实现。

## 1. 先保护真实，再追求顺滑

剪辑不能用“更顺”“更戏剧化”或“更好看”的表达替换素材不支持的事实。必须区分：

- 用户明确提供的事实；
- 素材中可直接观察的事实；
- 合理但仍需标注的解释；
- 尚未确认的推断；
- 纯粹的视觉隐喻。

证据型画面、历史画面、新闻画面和真实数据尤其不能由生成素材冒充。

## 2. 观众承诺优先于局部技巧

每个视频都应有一句清楚的观众承诺：

> 观众为什么值得继续看完，以及看完后应理解、感受或完成什么。

局部漂亮的镜头、音效、字幕或动效，如果破坏整体承诺，就不应保留。任何处理都应回答：

1. 它解决了什么观众问题？
2. 不做会发生什么？
3. 是否有更简单、更清楚的方案？
4. 它是否让真正重要的信息更突出？

## 3. 冲突时的判断优先级

当多个目标冲突时，默认优先保护：

1. 事实、授权与用户硬约束；
2. 意义、情绪、表演和动作完整；
3. 观众理解与可读性；
4. 节奏、注意力和连续性；
5. 风格一致性；
6. 实现便利与技术炫技。

这不是机械评分公式，而是冲突时的思考顺序。

## 4. 完整语义和完整动作单位

句号、ASR 分段、静音、镜头边界和音乐节拍都只是证据，不自动等于剪辑边界。

语言切点必须保护：

- 必要前提；
- 主语、宾语和代词指向；
- 因果、转折与列表结构；
- 结论前的铺垫；
- 笑点的设置与落点；
- 自然呼吸和情绪停顿。

画面切点必须保护：

- 动作准备；
- 动作关键相位；
- 动作结果；
- 反应；
- 必要的前后余量；
- 空间方向和视线关系。

## 5. 最小充分处理

先比较“不处理”能否成立。只有当某项处理解决明确的：

- 叙事问题；
- 信息问题；
- 注意力问题；
- 连续性问题；
- 节奏问题；
- 空间问题；
- 情绪问题；
- 证据呈现问题；

才使用它。

“系统会做”不是使用理由，“参考视频里有”也不是使用理由。

## 6. 节奏是关系，不是固定时长

节奏来自以下关系：

- 信息出现与理解所需时间；
- 语言速度与停顿；
- 动作、视线与反应；
- 镜头长度的对比；
- 音乐与静音；
- 期待与释放；
- 视觉密度的高低变化；
- 场景之间的张弛。

禁止使用固定规则代替判断，例如：

- 每三秒切一次；
- 每句话一个动效；
- 所有落点都卡音乐强拍；
- 所有停顿压成同一长度；
- 所有镜头保持同一节奏。

## 7. 注意力预算

同一时刻观众能处理的信息有限。对白、人物动作、字幕、标题、音乐重音、音效、镜头运动和动态图形不能同时争夺主导地位。

每个时间段应明确：

- 当前主要注意力对象；
- 次要辅助对象；
- 应保持稳定的对象；
- 是否需要安静区。

原则上一次只允许一个主注意力事件。

## 8. 连续性服务理解

动作、视线、方向、空间、声音、色调和情绪连续性，目的是帮助观众保持方向和理解。

可以有意打破连续性，但必须明确：

- 观众会失去什么；
- 打破后会获得什么；
- 是否用于冲击、跳跃、喜剧或主观感受；
- 是否仍能在下一镜头重新建立方向。

## 9. 风格来自有限语法

专业感通常来自有限而一致的：

- 标题层级；
- 字体系统；
- 色彩语义；
- 构图规则；
- 运动语言；
- 转场方式；
- 音效强度；
- 字幕策略；
- 场景类型。

不是尽可能多地调用素材包、滤镜或动画。

## 10. 证据不足时不猜精确细节

不要依据稀疏截图、粗粒度 ASR 或高层描述，猜测：

- 快速动作的精确切点；
- 微表情；
- 语气；
- 句中单词的真实时间；
- 人物手部的准确位置；
- 素材的许可状态；
- 文件未展示的内容。

应明确缺少什么证据、需要检查哪个时间范围，以及补充证据会改变什么判断。

## 11. 关键决定必须做反事实比较

重要决定至少比较一个替代方案：

- 不使用；
- 提前；
- 延后；
- 减弱；
- 换素材；
- 换场景语法；
- 保持原状。

没有比较，就容易把第一个可行方案误当作最佳方案。

## 12. 完整播放优先于局部预览

局部切点、标题或音效单独成立，不代表连续播放仍然成立。

任何专业输出都必须回到完整有声视频中检查：

- 前后因果；
- 视觉密度；
- 音乐结构；
- 动效重复；
- 字幕疲劳；
- 情绪推进；
- 结尾是否兑现开头承诺。

## 13. 技术通过不等于审美通过

以下只证明技术状态：

- MCP 返回成功；
- 项目对象存在；
- Timeline 合法；
- Remotion 成功渲染；
- 文件编码正常；
- 响度达到技术阈值。

审美通过仍需判断：

- 语义是否清楚；
- 节奏是否自然；
- 注意力是否正确；
- 画面是否帮助理解；
- 声音是否有层级；
- 风格是否统一；
- 视频是否值得继续看。

## 14. 修改绑定确切版本

反馈必须绑定用户实际看到的 Revision 和导出版本。反馈时间码是感知问题出现的位置，不一定是根因位置。

修订应：

- 找到根因；
- 最小化无关变化；
- 说明受影响范围；
- 比较修订前后；
- 重新完成必要的整片检查。


### `_shared/decision-record.md`

# 创作决策记录规范

任何会明显影响语义、节奏、视觉、声音或成片风格的决定，都应能被复核。建议在 SkillExecutionReport 中记录以下结构。

## 决策问题

用一句话描述当前真正要解决的问题，而不是描述工具动作。

错误：

> 给 12 秒处加一个 MG。

正确：

> 12 秒处出现抽象的因果关系，现有人物画面无法帮助理解，是否需要全屏解释场景？

## 可观察证据

只列真实读取到的证据：

- Script / SemanticUnit；
- 源画面或合成帧；
- 音频片段；
- 人物姿态；
- 当前 AttentionCurve；
- 已存在的字幕、MG、B-roll；
- 参考风格；
- 素材授权与来源；
- 当前 Revision。

## 候选方案

至少包括：

1. 保持原状；
2. 最小处理；
3. 更强处理。

说明每个方案的收益、风险和成本。

## 选择与理由

说明：

- 选择哪一种；
- 为什么适合当前观众任务；
- 为什么没有选择其他方案；
- 依赖哪些假设；
- 哪些地方仍不确定。

## 预期观众反应

例如：

- 更快理解两者差异；
- 在结论前形成期待；
- 感受到人物犹豫；
- 获得阅读证据的时间；
- 注意力从人物转向数字；
- 视觉密度得到恢复。

## 验证

至少说明：

- 检查哪些帧；
- 播放哪个时间范围；
- 是否需要只听声音；
- 是否需要静音看画面；
- 哪些问题会触发返工。


### `_shared/quality-vocabulary.md`

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


### `_shared/timing-precision.md`

# 时间精度合同

所有依赖语音时间的 Skill 必须先确认时间精度，不得将估算冒充精确数据。

## segment_exact

来源：每个 OmniVoice SpeechSegment 的真实输出时长、拼接顺序和实际段间停顿。

可用于：

- 句级或短语级字幕；
- 段首、段尾动效；
- Cutaway 进入和退出；
- Scene 切换；
- 段级 SFX 和 CTA；
- 局部预览后做帧级微调。

不可声称：

- 已知道段内每个词的真实时间；
- 可自动完成严格逐词卡点。

## chunk_coarse

来源：项目侧 VAD / 静音切片的真实源时间范围，加上每个片段的 FunASR 文本。

可用于：

- 素材定位；
- 粗粒度句级字幕；
- 低频 Scene 变化；
- 查找可能的重录和停顿。

不适合：

- 句中关键词动效；
- 逐词高亮；
- 精确嘴型同步判断。

## word_exact

只能来自真实公开词级时间戳的工作流或专门对齐能力。

可用于：

- 逐词字幕；
- 句中关键词精确卡点；
- 音节级动效候选；
- 精细口型/音效对齐。

## unavailable

没有可用时间信息时：

- 阻止正式语音同步效果；
- 允许纯视觉静态草稿；
- 要求补充转写或声音时间证据。

## 降级原则

效果需要命中句中词语但只有 segment_exact 时：

1. 先判断能否自然拆成独立 SpeechSegment；
2. 若不能，使用段内相对进度生成候选；
3. 在真实预览中手动式帧级微调；
4. 报告中标注该时间点经过预览修正，而不是自动精确对齐。


### `_shared/skill-execution-report.md`

# SkillExecutionReport 规范

每次整片生产或重要修订应输出一份可读报告，让审查者无需阅读实现代码，也能确认 Skills 是否真实参与判断。

## 基本信息

- project_id
- base_revision_id
- final_revision_id
- production_profile
- task_goal
- target_platform
- target_duration

## 加载记录

- loaded_skills
- loaded_references
- skipped_skills_and_reasons

## 关键创作判断

至少记录：

- 观众承诺；
- 主时间轴驱动方式；
- 保留、删除和重排内容的理由；
- AttentionCurve；
- 哪些区间保持人物或原画面；
- 哪些区间使用 Cutaway、B-roll、MG 或全屏 Explainer；
- 哪些区间有意保持安静；
- 字幕策略；
- 音乐和声音策略。

## 证据

每个关键判断关联：

- SemanticUnit / NarrativeBeat；
- Source range；
- Preview frame；
- Audio range；
- Existing Scene；
- Asset provenance；
- Reference style。

## 工具和项目修改

- 使用的 MCP 能力；
- EditTransaction；
- ImpactReport；
- DirtyRange；
- Job；
- Web Operator 操作；
- 写后读回结果。

## 验证

- 结构验证；
- 真实合成帧验证；
- 只听声音；
- 静音画面；
- 完整声画；
- 模式专项质量检查；
- 阻塞问题和修复循环。

## 未解决问题

明确列出：

- 证据不足；
- 当前能力降级；
- 尚未验证；
- 用户需要确认的审美选择。


### `_shared/mcp-and-project-contract.md`

# MCP 与项目状态共同合同

## 1. Skill 不实现业务状态

Skill 只负责观察、比较、判断、执行策略和验证。它不：

- 直接查询数据库；
- 维护第二份项目状态；
- 猜测表字段；
- 绕过 Application Command；
- 直接修改渲染缓存。

## 2. 使用实时工具描述

执行前读取当前 `video-editor-mcp` 工具描述和参数 Schema。不得因为旧文档或示例而猜字段。

## 3. 读后再写

任何写入前至少确认：

- 当前 Project；
- 当前 Revision；
- 目标对象；
- 相关上下文；
- 目标对象是否 stale；
- 受影响的 Scene / Timeline / Caption / Audio。

## 4. Revision 安全

写入必须基于明确 base revision。冲突时：

- 不强行覆盖；
- 重新读取最新状态；
- 重新判断；
- 只重放仍然成立的操作。

## 5. 写后读回

工具返回 success 只说明命令被接受。必须读回：

- 新 Revision；
- 目标对象；
- ImpactReport；
- DirtyRange；
- Preview / Quality 状态。

## 6. 视觉修改必须查看真实合成

结构正确不等于画面正确。对字幕、MG、B-roll、遮挡、构图、转场和动画，必须检查：

- 进入帧；
- 运动中间帧；
- Settled Frame；
- 退出帧；
- 前后连续播放。

## 7. 不重复提交

同一修改已经通过 MCP 提交时，不应再用 Web 重复提交；Web Operator 主要用于空间微调、真实预览和当前 MCP 无法表达的交互。


### `_shared/source-map.md`

# 专业知识来源与使用边界

## 项目内必读资料

```text
docs/chatcut视频剪辑工具拆解/
docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/
docs/asr接入.md
docs/导演与剪辑设计/                 若已复制到新项目
```

## ChatCut 资料提供什么

主要吸收：

- Skill 的组织方式；
- 基础 Skill 与专业 Skill 的分层；
- Script、Transcript、Timeline、Caption 的区分；
- 口播主线先于包装；
- Motion Graphic 的设计、放置和真实画面验证；
- 写后读回；
- 异步任务与完成条件；
- B-roll、字幕、声音和证据的边界。

不得直接复制：

- ChatCut 私有品牌；
- 不存在于 VideoFlowCut 的工具名；
- 后端字段；
- 付费服务合同；
- 未验证的运行时行为。

## 书籍与影视研究提供什么

主要提炼：

- 观众承诺；
- 完整语义与完整动作；
- 节奏、停顿、期待与释放；
- 注意力；
- 镜头、空间与动作连续性；
- 情绪推进；
- 声音和音乐；
- 文字设计；
- 反事实比较和整片复核。

书籍知识必须被改写为：

```text
可观察证据
→ 判断规则
→ 剪辑动作
→ 预期观众反应
→ 失败模式
→ 验证
```

不得只堆概念和名言。

## 参考视频拆解提供什么

参考视频用于提炼：

- Scene Grammar；
- Effect Grammar；
- AttentionCurve；
- StylePack；
- MotionTiming；
- Presenter 前后景层级；
- 视觉解释片的渐进式场景；
- 字幕与主视觉的注意力分工。

参考视频不是可随意截取使用的素材，除非拥有明确授权。

## API 文档提供什么

`docs/asr接入.md` 是 FunASR、OmniVoice 和 MiniMax H3 Bridge 接口的实现依据。每次正式调用前都应读取实时 workflow detail，不能长期硬编码 schemaVersion、field id、itemSlot 或 output。


# 23 个 Skills

# 1. `production-director`

## SKILL.md

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


## `production-director/references/mixed-mode-routing.md`

# 混合模式路由

## Scene 级切换，不做系统级分叉

项目保持同一个 Story、SceneDocument、Timeline 和 Revision。模式只决定某段内容使用哪一种导演逻辑。

## 常见结构

### 人物—解释—人物

适合：

- 人物提出问题；
- 全屏 Explainer 展开机制；
- 人物回来解释意义或 CTA。

切换规则：

- Explainer 应在完整语义边界开始；
- 人物退出前保留清楚的交接句；
- 回到人物时避免重复解释刚刚已经可视化的内容。

### 人物—现实证据—人物

适合：

- 人物说出主张；
- Vlog/B-roll 证明真实使用情境；
- 人物总结或反应。

关键是保留原环境声或使用 J/L Cut，使 Cutaway 不像无关插图。

### Vlog—解释—Vlog

适合：

- 实拍中出现复杂系统、地点、路线或数据；
- Explainer 暂时帮助观众建立模型；
- 再回到现场继续事件。

解释 Scene 不应过长到破坏现场感。

## 密度控制

不同模式切换本身就是视觉事件。模式切换前后应减少其他强动效，给观众重新定位的时间。

## 风格统一

统一：

- 字体；
- 色彩语义；
- 字幕策略；
- 音效强度；
- Scene 入场语言。

允许不同：

- 画面机制；
- 素材质感；
- 镜头运动；
- 信息密度。

统一不等于所有 Scene 都放进同一种圆角卡片。


## `production-director/references/production-gates.md`

# 生产阶段质量闸门

## Gate 1：Brief 可执行

通过条件：

- 观众承诺清楚；
- 平台、画幅、时长和受众明确；
- 参考视频被拆成方法而不是模板；
- 权利与生成边界明确；
- 不确定项已列出。

## Gate 2：内容主线成立

通过条件：

- 最终 Script / Story 无半句话、跳跃和无指向代词；
- Hook 与后文兑现；
- 重复有明确作用或已删除；
- 结论有前提；
- 只听声音可以理解。

## Gate 3：时间与表演可用

通过条件：

- SpeechTiming 精度声明真实；
- 声音切口自然；
- 数字人或人物表演与 Script Revision 一致；
- 需要的手势、蒙版和安全区可用；
- 不可用能力已降级。

## Gate 4：Visual Treatment 有理由

通过条件：

- 每个 Beat 有明确的“保持 / 处理”决定；
- 所有 MG、B-roll、Cutaway 都有叙事目的；
- AttentionCurve 有高低变化；
- 一次一个主注意力事件；
- 素材来源和授权可追溯。

## Gate 5：真实画面成立

通过条件：

- 进入、稳定、退出帧正确；
- 人物、字幕和图形不冲突；
- 证据可读；
- 场景不是卡片堆叠；
- Web Preview 与导出 Snapshot 一致。

## Gate 6：整片成立

通过条件：

- 完整有声播放通过；
- 开头承诺得到兑现；
- 视觉密度、音乐和字幕无持续疲劳；
- 模式切换自然；
- Blocking 问题为零；
- 必要修订已完成一次复核。


## `production-director/references/route-selection.md`

# 生产路线选择

## 核心问题：谁在驱动观众的时间体验？

### Presenter 路线

选择条件：

- 观众主要通过人物说话获得信息或情感；
- 主声音和人物表演决定镜头长度；
- Remotion 动效围绕人物出现；
- Cutaway 的任务是解释、证明、遮盖跳切或恢复注意力。

主要失败风险：

- 语义被切碎；
- 人物画面单调；
- 动效与表演冲突；
- 字幕、人物和 MG 同时抢注意力。

### Visual Explainer 路线

选择条件：

- 旁白可独立成立；
- 视觉场景承担主要理解任务；
- 信息包含分类、比较、流程、数据、证据、历史或系统关系；
- 大场景内部需要渐进式状态变化。

主要失败风险：

- 变成 PPT；
- 每句话换一张卡片；
- 画面只重复旁白；
- 证据、解释和真实素材混为一谈。

### Vlog 路线

选择条件：

- 故事藏在实拍镜头和事件里；
- 素材中的动作、地点、反应和环境声比旁白更重要；
- 音乐和蒙太奇组织体验；
- 需要保留现场感。

主要失败风险：

- 过度依赖脚本而忽略真实事件；
- 用模板动效掩盖素材选择不足；
- 空间和动作方向混乱；
- 环境声被全部抹平。

## 混合路线

混合不是平均分配。先指定主路线，再把其他模式作为具有明确任务的 Scene：

- Presenter 讲主线，Explainer 解释机制；
- Presenter 建立信任，Vlog 作为真实证据；
- Vlog 建立体验，Presenter 总结；
- Explainer 展开复杂信息，Presenter 恢复人格和情绪。

每次切换模式都应回答：

1. 为什么当前模式不足？
2. 新 Scene 解决什么问题？
3. 切换何时开始和结束？
4. 观众如何重新定位？


# 2. `project-basics`

## SKILL.md

---
name: project-basics
description: Operate VideoFlowCut projects safely using the shared Project, Story, Scene, Timeline, Revision, Job, Preview, and Quality model. Use before any project read or write so creative work remains revision-safe and inspectable.
---


# 项目与 Revision 基础

## 角色

本 Skill 负责项目对象、Revision、写后读回和证据边界。它不做审美判断，也不替代视频类型 Director。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 任何项目读写任务。
- 需要定位 Project、Scene、Timeline Item、EffectCue、Caption、Audio 或 Job。
- 发生 Revision 冲突、stale 对象或结果未知。

## 何时不使用

- 单纯讨论剪辑理论且不访问项目。
- 只研究外部参考视频，不产生项目状态。

## 前置读取

- 当前 MCP 工具描述。
- `../_shared/mcp-and-project-contract.md`。
- 项目的 CreativeBrief 与当前 Revision。

## 必须掌握的证据

- project_id、active_timeline_id、current_revision_id。
- 目标对象 ID、对象类型和所属 Scene。
- 相关 Job、Preview、QualityReport 和 ImpactReport。
- 写操作的 base revision 与幂等语义。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前要改的是源事实、Story、Scene 还是 Timeline 表现？
- 这个对象是否由上游对象派生，直接改它会不会被下一次重编译覆盖？
- 修改的最小原子范围是什么？
- 哪些下游对象会 stale、重算或保持？
- 是否需要先 dry-run / impact preview？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 明确项目目标

先定位 Project、Timeline 和当前 Revision。不要从聊天历史推断项目状态。

### 2. 区分对象层级

```text
Asset / Transcript      源事实
Story / SemanticUnit    内容与叙事
Scene / EffectCue       视觉表达
Timeline / Item         最终播放结构
Preview / Export        派生产物
```

修改源事实、创作决定和最终表现是不同命令。不得用 Timeline 临时变更假装修改了 Story。

### 3. 选择最小写入单元

优先提交能够表达用户真实意图的高层操作。例如：

- 删除一段最终口播：改 Script / SemanticUnit；
- 换一个 Scene 的视觉语法：改 Scene；
- 微调一个图形位置：改 EffectCue / Item；
- 换 B-roll：改 SceneAssetBinding。

### 4. 预估影响

重大结构修改前读取或请求 Impact 预览，确认：

- 自动重算；
- 跟随移动；
- 保持绝对位置；
- 失去锚点；
- 需要重新渲染；
- 需要人工复核。

### 5. 原子提交与读回

所有相关变更使用同一 EditTransaction。成功后读回：

- new revision；
- changed objects；
- stale objects；
- dirty ranges；
- preview / quality status。

### 6. 冲突处理

若 base revision 过期：

1. 停止写入；
2. 读取最新 Revision；
3. 对比目标对象是否已改变；
4. 重新判断；
5. 仅重放仍然成立的意图。

## 禁止行为

- 把聊天记录或本地临时 JSON 当项目唯一事实。
- 直接查数据库绕过 Application 层。
- 在不读取 Revision 的情况下写入。
- 对多个相关对象逐个写入造成半完成状态。
- 工具成功后不读回对象。
- 在结果未知时盲目重试同一写操作。

## 验证

- 目标对象和 Revision 可读回。
- ImpactReport 与真实变化一致。
- Web 和 MCP 看到同一状态。
- 结构变化后相关 Preview/Quality 被正确标记。

## 退出条件

- 项目目标和当前 Revision 已确认。
- 修改已原子提交或明确未提交。
- 没有未解释的 stale / conflict / unknown outcome。
- 下一专业 Skill 能从项目状态继续工作。

## 按需读取的专业参考

- `references/project-object-model.md`：各项目对象的语义边界和修改层级。
- `references/revision-and-impact.md`：Revision 冲突、ImpactReport、DirtyRange 与结果未知处理。


## `project-basics/references/project-object-model.md`

# 项目对象模型

## Asset

来源媒体或生成媒体。Asset 不等于 Timeline 中的一次使用。

## Transcript

源音频说了什么。可能存在识别错误，不等于最终 Script。

## SemanticUnit / Story

观众最终需要理解的内容、顺序和关系。

## Scene

一段内容如何被看见。Scene 可以包含多个 Timeline Item 和 MotionCue。

## Timeline Item

某个 Asset、Scene 输出或图形在最终成片的一次放置。

## CaptionProgram

最终屏幕显示的字幕。它不等于 Transcript，也不等于 Script 原文。

## EffectCue / MotionCue

具有明确叙事目的和语义锚点的视觉事件，不是任意贴纸。

## Preview

某个 Revision 的真实合成结果或范围缓存。不是项目唯一事实。

## ExportArtifact

固定 Revision 的交付文件。导出不会把项目压平成不可编辑状态。

## 修改层级原则

尽量在最接近用户意图的层级修改：

- “删掉这句” → Script；
- “这段换成对比动画” → Scene；
- “这个数字再往左一点” → EffectCue；
- “这段声音淡入” → Audio Item；
- “重新导出” → Export，不修改创作状态。


## `project-basics/references/revision-and-impact.md`

# Revision 与影响传播

## Revision 是统一版本

同一 Revision 应同时描述：

- Story；
- Scene；
- Timeline；
- Caption；
- Audio；
- Style；
- ActorPerformance 引用。

禁止 Story、Scene 和 Timeline 独立漂移。

## ImpactReport 应回答

- 什么被直接修改；
- 什么被自动重算；
- 什么跟随移动；
- 什么保持绝对位置；
- 什么锚点失效；
- 哪些区间需要重新预览；
- 哪些问题必须重新审片。

## DirtyRange

脏区间应合并：

- 旧对象范围；
- 新对象范围；
- 转场和音频尾巴；
- 前后安全余量。

## 结果未知

写请求超时但可能已经提交时：

1. 用幂等键查询；
2. 读取当前 Revision；
3. 查找目标对象；
4. 对账后再决定是否重试。

盲目重试可能产生重复 Item 或重复 Job。


# 3. `web-editor-operator`

## SKILL.md

---
name: web-editor-operator
description: Use the VideoFlowCut Web editor as a precise inspection and adjustment surface. Use for object-focused UI edits, spatial tuning, timeline manipulation, revision comparison, and visual verification that cannot be safely inferred from structured state alone.
---


# Web 工作台操作与视觉验证

## 角色

本 Skill 让 Codex 像严谨的剪辑助理一样操作 Web，而不是随机点击。它主要承担定位、空间微调和真实画面检查，不负责凭空发明创意方向。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 需要检查真实合成画面。
- 需要调整位置、大小、层级、时长、曲线或 Inspector 属性。
- 需要比较 Revision、播放局部范围或检查 Timeline。
- MCP 已完成结构修改但必须通过 Web 验证。

## 何时不使用

- 已有结构化工具能完整表达修改且不需要视觉判断。
- 只需读取项目文本状态。
- 需要做宏观创作判断但尚未加载专业 Skill。

## 前置读取

- 当前 Project、Revision、目标对象 ID。
- 目标对象所属 Scene 和 Timeline 范围。
- 对应专业 Skill 的视觉或声音判断。
- Web 对象定位合同。

## 必须掌握的证据

- 稳定 URL、对象 ID、data-testid、可访问名称。
- Preview 当前帧与播放范围。
- Inspector 当前值。
- Timeline 选中状态、轨道和区间。
- 写入后的新 Revision。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前操作是在实现哪个已经确定的创作意图？
- 需要改结构还是只改表现？
- 应该观察进入、稳定、退出中的哪一帧？
- 调整后是否产生遮挡、越界或注意力冲突？
- 是否需要回到完整播放检查？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 精确定位

优先使用项目提供的对象深链接或 focus 能力。打开后确认：

- Project；
- Revision；
- Scene；
- 对象；
- Playhead；
- Inspector。

### 2. 操作前建立基线

记录：

- 当前属性；
- 当前截图或合成帧；
- 当前时间范围；
- 当前 Revision；
- 预期变化。

### 3. 执行最小调整

一次只修改一组相关属性。空间调整通常按：

```text
尺寸
→ 位置
→ 对齐
→ 层级
→ 安全区
→ 动画范围
```

避免同时大幅修改位置、时长、动画和样式，导致无法判断哪个变化产生效果。

### 4. 检查关键状态

视觉对象至少检查：

- 进入帧；
- 运动中间；
- Settled Frame；
- 退出帧；
- 前后连续播放。

音频调整至少播放切点前后。

### 5. 读回 Revision

确认 UI 显示的新 Revision、对象属性和 Quality 状态。若 MCP 已经提交同一修改，不重复提交。

### 6. 回到专业判断

Browser 操作只证明画面变化。最终是否“更好”由对应 Director / Quality Skill 判断。

## 禁止行为

- 依赖像素坐标盲点，不使用稳定对象标识。
- 在未确认选中对象时修改 Inspector。
- MCP 已提交后在 UI 再次重复写入。
- 只看单帧，不播放进入和退出。
- 为了让自动化容易而改变创作意图。
- 把 UI 显示成功当作审美通过。

## 验证

- 对象属性与预期一致。
- Revision 已变化且可读回。
- 关键帧没有遮挡、裁切或安全区问题。
- 局部连续播放无跳变。
- 必要时完整播放确认上下文。

## 退出条件

- 目标对象修改完成。
- 结构状态和真实画面一致。
- 没有重复提交或未确认冲突。
- 截图/播放证据已写入 SkillExecutionReport。

## 按需读取的专业参考

- `references/editor-navigation.md`：精确定位对象、Timeline 和 Revision 的操作协议。
- `references/visual-adjustment.md`：构图、空间和动画微调的观察顺序。


## `web-editor-operator/references/editor-navigation.md`

# 编辑器定位协议

## 深链接优先

链接应尽可能包含：

- project；
- timeline；
- scene；
- object；
- frame；
- revision。

## 选中确认

执行写操作前，通过至少两项确认选中对象：

- Inspector 显示对象 ID；
- Timeline 高亮；
- Preview 选框；
- Scene 卡片高亮；
- URL 参数。

## Canvas Timeline

若 Timeline 使用 Canvas，必须通过辅助 DOM 或对象面板读到：

- 轨道；
- 起止帧；
- 对象 ID；
- 选中状态；
- 锁定状态。

## Revision 对比

对比两个版本时保持相同：

- Playhead；
- 缩放；
- Preview 尺寸；
- 音量；
- 画幅。

否则视觉差异可能来自查看条件。


## `web-editor-operator/references/visual-adjustment.md`

# 视觉微调顺序

## 先解决层级，再解决美化

1. 主体是否清楚；
2. 主要信息是否可读；
3. 元素是否遮挡；
4. 安全区是否正确；
5. 空间是否平衡；
6. 动画是否自然；
7. 最后才是颜色、阴影和材质。

## 调整幅度

先做小幅可逆变化。每轮修改后比较：

- 原方案；
- 当前方案；
- 不使用该效果。

## Settled Frame

动画稳定后的画面应单独成立：

- 信息完整；
- 文字可读；
- 视觉层级清楚；
- 不依赖持续晃动才能有存在感。

## 连续播放

静态构图正确后，再检查：

- 入场是否撞到人物；
- 停留是否够读；
- 退出是否过早；
- 下一个对象是否抢在当前信息读完前出现。


# 4. `asset-import`

## SKILL.md

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


## `asset-import/references/acquisition-and-ranking.md`

# 素材需求与候选排序

## AssetRequirement 示例

```text
用途：表现下班后短暂停下来观察天空
类型：B-roll video
主体：年轻通勤者、街道、抬头
情绪：安静、松弛、轻微疲惫
构图：9:16，上方保留天空
运动：缓慢移动或静止
时长：4–6 秒
排除：水印、明显品牌、商业摆拍、快动作
权利：允许二次剪辑和发布
```

## 搜索词生成

把中文语义转换为多组视觉搜索词，不只直译原句：

- 主体 + 动作；
- 场景 + 时间；
- 情绪 + 镜头；
- 构图 + vertical；
- 排除项。

## 排序不是只看语义

建议综合：

1. 内容相关性；
2. 构图可用性；
3. 动作与前后镜头衔接；
4. 情绪；
5. 技术质量；
6. 权利；
7. 风格；
8. 可裁切长度；
9. 重复度。

素材“意思差不多”但动作、方向和情绪不合适，仍然不是好候选。

## 空镜使用原则

空镜应承担：

- 建立地点或生活经验；
- 提供情绪呼吸；
- 证明现实情境；
- 遮盖必要切口；
- 让抽象概念落到具体生活。

禁止把每个名词都替换成库存素材。


## `asset-import/references/provenance-and-rights.md`

# 来源与权利

每个外部 Asset 至少保存：

- source_provider；
- source_page；
- original_asset_id；
- creator；
- license；
- attribution_text；
- downloaded_at；
- content_hash；
- generated / captured / stock / user-owned；
- rights_status。

## 权利状态

- cleared：已确认允许当前用途；
- attribution_required：允许但必须署名；
- restricted：仅限特定用途；
- unknown：禁止进入正式导出；
- rejected：不可使用。

## 证据与生成内容

生成画面可以表达：

- 抽象情绪；
- 概念隐喻；
- 非特定生活空镜；
- 风格化说明。

生成画面不得冒充：

- 真实历史事件；
- 新闻现场；
- 某个人物真实行为；
- 官方文件；
- 真实数据证据。

## 导出

需要署名的素材应进入 AttributionManifest。任何 rights_status=unknown 的正式使用素材应阻断导出。


## `asset-import/references/readiness-and-deduplication.md`

# 就绪与去重

## 去重层级

- 文件哈希完全相同；
- 代理或转码版本相同；
- 视觉内容近似；
- 同一来源不同下载尺寸；
- 同一镜头不同裁切。

不应因为文件名不同就重复导入。

## 状态拆分

上传成功不等于可剪：

```text
registered
→ transferred
→ probed
→ proxy_ready
→ thumbnail_ready
→ optional_asr_ready
→ optional_visual_analysis_ready
→ rights_ready
→ ready
```

Scene 只要求它实际依赖的状态，但必须显式说明。

## 失败恢复

单个派生任务失败时保留原 Asset，不重复上传原文件。只重跑失败派生任务。


# 5. `transcription`

## SKILL.md

---
name: transcription
description: Create and validate transcripts for source understanding and speech-led editing using the current FunASR HTTP workflow without inventing unavailable timestamps. Use for talking-head, interview, Vlog dialogue, imported speech, or TTS back-check.
---


# 转写与语音文本证据

## 角色

本 Skill 把语音识别结果当作可校验的编辑证据，而不是绝对真相。它负责正确调用 FunASR、保存 TranscriptText、建立必要的粗粒度时间块，并把文本交给语义构建。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 口播、访谈、课程、Vlog 对白或任何需要理解语音的素材。
- 需要核对生成语音是否说对文字。
- 需要从长素材定位语言内容。

## 何时不使用

- 纯音乐或明确无语音素材。
- 已经有可信 Transcript 且源音频未变化。
- 只需要分析画面，不涉及语言。

## 前置读取

- `docs/asr接入.md`。
- 当前 FunASR workflow detail、schemaVersion、fields、itemSlots 和 outputs。
- `../_shared/timing-precision.md`。
- 源音频技术信息和语言环境。

## 必须掌握的证据

- 原始音频或从视频提取的音频。
- FunASR 原始 text 输出和 Run 元数据。
- 语言、专有名词、说话者数量、噪声和混响。
- 需要时，本地 VAD 产生的真实时间块。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 当前识别结果是否足以支持内容判断？
- 哪些词可能因同音、口音、专名或噪声而错误？
- 是否需要切成更小的真实时间块重新识别？
- 识别错误会改变事实、因果或剪辑边界吗？
- 文本是源转写、最终 Script 还是字幕？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 动态读取工作流合同

每次正式调用前读取 FunASR workflow detail，使用实时返回的：

- schemaVersion；
- field ids；
- itemSlots；
- outputs；
- available / reason。

不得把文档示例中的版本和字段长期硬编码。

### 2. 提交与轮询

上传可解码音频，创建 Run，轮询到 succeeded 或 failed。成功时以 `kind=text` 的输出为准。

### 3. 保存原始证据

保存：

- 原始 TranscriptText；
- workflow id；
- schemaVersion；
- run id；
- 请求摘要；
- 输出原文；
- 音频 Asset；
- 识别时间；
- 质量备注。

不要在保存前静默改写原始识别。

### 4. 需要时间定位时先做真实切片

当前 FunASR 输出不含 Segment、Token 或 WordTiming。需要时间范围时：

1. 本地 VAD / 静音检测切出真实源区间；
2. 每块分别调用 FunASR；
3. 形成 TranscriptChunk；
4. 保留 chunk 的真实起止时间和识别文本。

### 5. 语义构建

把原始识别交给 SemanticUnit Builder，按完整句子、观点、因果、转折、列表和重录组织。ASR 的任意分块不能直接成为剪辑单位。

### 6. 质量校验

重点回听：

- 人名、书名、品牌、金额、日期；
- 否定词；
- 因果和转折；
- 相似发音；
- 低信心或逻辑不通的句子。

必要时标记 uncertainty，而不是自行“修正成合理句子”。

## 禁止行为

- 声称 FunASR 当前已经返回词级时间。
- 按字数平均分配时长并标注为精确时间。
- 把 TranscriptText 直接当最终 Script 或 Caption。
- 静默纠正可能的事实词。
- 识别失败后用模型猜测音频内容。
- 未保存原始输出和 Run 信息。

## 验证

- 原始 TranscriptText 可追溯。
- 需要时 TranscriptChunk 具有真实源时间。
- 关键专名和事实词完成回听。
- 时间精度声明正确。
- SemanticUnit Builder 获得明确输入。

## 退出条件

- 转写结果和来源已保存。
- 不可识别区间、歧义和置信风险可见。
- 没有虚假的 Segment/WordTiming。
- 下游能够区分 Transcript、Script、SpeechSegment 和 Caption。

## 按需读取的专业参考

- `references/funasr-http-contract.md`：FunASR Bridge 动态 Schema、任务和输出合同。
- `references/transcript-quality.md`：识别错误、专名、否定词与事实词的回听方法。
- `references/chunking-and-semantic-handoff.md`：VAD 粗时间块与 SemanticUnit Builder 的边界。


## `transcription/references/chunking-and-semantic-handoff.md`

# 真实切片与语义交接

## VAD Chunk 的作用

VAD Chunk 提供粗粒度真实时间范围，帮助：

- 定位内容；
- 找长停顿；
- 发现可能重录；
- 分段调用 ASR；
- 生成句级字幕候选。

VAD 边界不是最终剪辑边界。

## SemanticUnit Builder

应把多个 TranscriptChunk 重新组织为：

- 完整句；
- 完整观点；
- 问题与回答；
- 因果对；
- 转折对；
- 列表项；
- 重录候选；
- 章节。

## 交接内容

交给下游时保留：

- 原始文本；
- Chunk 时间；
- 语义合并关系；
- 歧义；
- 回听修正；
- 来源音频范围。

不能只给一个被清洗过、失去来源的文本。


## `transcription/references/funasr-http-contract.md`

# FunASR HTTP 合同

实现以 `docs/asr接入.md` 和实时 workflow detail 为准。

## 调用原则

1. GET workflow detail；
2. 读取最新 schemaVersion、fields、itemSlots、outputs；
3. 用 multipart/form-data 上传音频；
4. POST 创建 Run；
5. 轮询 Run；
6. succeeded 后读取 `kind=text` 输出；
7. failed 时保存 error 并停止下游正式编辑。

## 当前能力边界

当前工作流主要输出完整文本，不公开：

- 词级时间；
- Token 时间；
- 说话者分离；
- 置信度数组。

因此任何更细时间信息必须来自项目侧真实切片或未来正式对齐能力。

## 409

schemaVersion 冲突时重新读取 workflow detail，不重用旧版本。

## ComfyUI 重启

Run 映射在进程重启后可能丢失。项目侧 Job 必须保存请求和本地化输出；成功输出应立即登记。


## `transcription/references/transcript-quality.md`

# 转写质量审查

## 高风险词

优先回听：

- 人名、地名、书名；
- 品牌和产品；
- 数字、价格、比例、年份；
- 否定词“不、没、无、未”；
- 因果词“因为、所以”；
- 转折词“但是、却、反而”；
- 专业术语；
- 中英文混说。

## 逻辑异常不是自动纠错许可

一句话不合逻辑可能来自：

- ASR 错误；
- 说话者口误；
- 上下文缺失；
- 故意反讽；
- 剪辑前存在重录。

应回听音频，而不是把文本改成模型认为合理的句子。

## 标点

标点可辅助阅读，但不能据此推断精确语气和切点。长句应结合音频停顿和完整思想构建 SemanticUnit。

## 多说话者

当前接口若没有说话者分离，不应自动给文本分配人物身份。需要视觉、声纹或人工证据。


# 6. `voice-production`

## SKILL.md

---
name: voice-production
description: Plan, synthesize, assemble, and review cloned-voice narration using the current OmniVoice HTTP workflow. Use for full narration, local replacements, voice reference changes, or script revisions that require new speech assets.
---


# 声音克隆、TTS 与旁白表演

## 角色

本 Skill 同时管理技术调用和旁白表演质量。它不把 TTS 当作“文本转文件”，而是把 Script 编译为可自然朗读、可局部重生成、可为剪辑提供真实段级时间的 SpeechSegments。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 使用参考音色生成旁白。
- 修改 Script 后重生成局部语音。
- 替换 VoiceReference。
- 需要创建 SpeechAsset 和 segment_exact SpeechTiming。

## 何时不使用

- 已有通过质量审查且 Script Revision 未变化的 SpeechAsset。
- 只做现有音频的混音或切口处理。

## 前置读取

- `docs/asr接入.md`。
- 当前 OmniVoice workflow detail。
- 最终 Script Revision。
- VoiceReference 质量和使用权。
- `../_shared/timing-precision.md`。

## 必须掌握的证据

- 参考音频的时长、单人/噪声、采样率和有效区间。
- 最终 Script、语义结构和期望语气。
- 段落、转折、列表、笑点和 CTA。
- 每个输出的真实时长、采样率和回听结果。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 如何分段才能保持完整语义和自然表演？
- 哪些停顿是语法停顿，哪些是情绪停顿？
- 哪些词需要重读，哪些句子需要放慢？
- VoiceReference 是否真的代表期望角色？
- 生成声音是否存在金属感、吞字、错误重音或语气漂移？
- 局部重生成如何与相邻段落保持音色和节奏连续？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 检查 VoiceReference

优先选择：

- 3–15 秒；
- 单人；
- 清晰；
- 低噪声；
- 无音乐；
- 情绪和语速接近目标；
- 授权明确。

若参考声音质量差，先解决参考问题，不要通过后期包装掩盖。

### 2. 编译 SpeechSegments

分段依据：

- 完整句；
- 转折边界；
- 列表项；
- 情绪和呼吸；
- 笑点设置与落点；
- CTA；
- 重要视觉事件；
- 局部重生成稳定性。

禁止机械按字数切割。

### 3. 编写表演计划

每段至少说明：

- 语气；
- 速度；
- 强调词；
- 句尾走向；
- 段前/段后停顿；
- 与下一段的情绪关系。

当前 API 未必直接支持显式表演参数时，也应通过分段、标点、文本措辞和后续间隔实现有限控制，并清楚标注能力边界。

### 4. 动态调用 OmniVoice

每段提交：

```text
参考音频
+
当前 SpeechSegment 文本
```

实时读取 workflow detail，不建立不存在的远端 VoiceProfile，不拆成独立 VoiceClone API 和 TTS API。

### 5. 本地化与测量

每个成功输出立即下载、登记，并用 ffprobe 获取真实：

- 时长；
- 采样率；
- 声道；
- MIME；
- 文件完整性。

### 6. 组装 SpeechAsset

按 Script 顺序拼接，明确：

- 段间停顿；
- 交叉淡化；
- 呼吸余量；
- 章节停顿；
- 最终 segment_exact 时间。

### 7. 回听质量

至少检查：

- 文本是否完整；
- 发音和专名；
- 重音；
- 段落语气；
- 相邻段音色一致性；
- 拼接感；
- 不自然静音；
- 呼吸和结尾。

局部 Script 修改只重生成受影响 Segment，但组装后必须回听前后邻段。

## 禁止行为

- 把 OmniVoice 当作远端 Voice ID 服务。
- 长期硬编码 schemaVersion 和字段 ID。
- 按固定字符数分段。
- 忽略真实输出时长而按文本长度估算。
- 每段单独听起来正常就不检查拼接。
- 用 BGM 掩盖语音瑕疵。
- 未经许可克隆声音。

## 验证

- 每段输出和 Run 可追溯。
- 真实时长已测量。
- 文本一致性完成回听或可选 FunASR 回查。
- 相邻段落连续。
- SpeechAsset 的 segment_exact 时间正确。
- 参考声音授权可读。

## 退出条件

- SpeechAsset 与明确 Script Revision 一致。
- 所有 SpeechSegmentAsset 可播放并通过质量状态。
- 段级时间可供字幕、Scene 和动效使用。
- 不存在未说明的发音或语气问题。

## 按需读取的专业参考

- `references/omnivoice-http-contract.md`：OmniVoice Bridge 的真实输入、动态 Schema 与输出本地化。
- `references/speech-segmentation.md`：以意义、表演和局部重生成为目标的分段方法。
- `references/voice-performance-and-qc.md`：语速、重音、停顿、情绪和完整回听方法。


## `voice-production/references/omnivoice-http-contract.md`

# OmniVoice HTTP 合同

## 当前真实模型

每次请求直接提供：

```text
VoiceReference 音频
+
待合成文本
```

工作流内部使用 FunASR 获取参考文本，再完成声音克隆和语音生成。

不要创建不存在的远端 VoiceProfile，也不要要求用户手工提供 reference_text。

## 动态调用

每次正式调用前读取 workflow detail。使用实时：

- schemaVersion；
- 文本 field id；
- 参考音频 itemSlot；
- audio output。

## 输出

成功后筛选 `kind=audio`，立即下载并登记。文件名和 MIME 以实际 outputs 为准。

## 失败

- 400：字段或文件合同错误；
- 409：重新读取 schemaVersion；
- failed：保存 error；
- Run 丢失：从项目 Job 和本地文件对账；
- 无 audio 输出：任务视为失败，不能继续组装。

## 参考音频

推荐 3–15 秒、单人、清晰、低噪声。项目应保存推荐有效区间和权利说明。


## `voice-production/references/speech-segmentation.md`

# SpeechSegment 分段

## 分段目标

同时满足：

- 语义完整；
- 自然朗读；
- 表演可控；
- 重要视觉事件落在可用边界；
- 局部重生成不会牵连整篇。

## 优先边界

- 完整句；
- 明确转折；
- 列表项；
- 问题与回答；
- 笑点设置/落点；
- CTA；
- 章节；
- 情绪改变；
- 需要 Cutaway 或 Scene 切换的位置。

## 不宜分割

- 主语和谓语之间；
- “不是……而是……”中间；
- “因为……所以……”只留一半；
- 代词与指代对象分开；
- 数字和单位分开；
- 笑点设置未完成；
- 情绪句被切成机械短句。

## 长度不是唯一标准

短句不一定自然，长句也不一定不能生成。先保护语义和语气，再根据生成稳定性调整。


## `voice-production/references/voice-performance-and-qc.md`

# 旁白表演与回听

## 表演维度

- 语速；
- 音高走向；
- 强调；
- 停顿；
- 情绪；
- 句尾收束；
- 相邻段关系；
- 角色稳定性。

## 停顿

- 普通逗号：短；
- 完整句：中；
- 章节：长；
- 结论前：可有期待停顿；
- 笑点后：给反应时间；
- 强烈情绪：不应被机械压缩。

## 回听四遍

1. 对照文本，检查漏字、错字、专名；
2. 不看文本，听自然性和语气；
3. 连续听相邻段，检查拼接；
4. 配合画面和 BGM，检查可懂度。

## 常见失败

- 每句同一语调；
- 句尾全部下落；
- 强调错误；
- 数字读错；
- 长句后半变快；
- 相邻段音色或响度突变；
- 过度消除停顿导致没有呼吸。


# 7. `semantic-continuity`

## SKILL.md

---
name: semantic-continuity
description: Protect complete thoughts, rhetorical relationships, referents, retakes, emotional intention, and natural audio continuity whenever speech is cut, reordered, rewritten, or regenerated.
---


# 语义连续性与口播编辑

## 角色

本 Skill 是所有语言删改的专业门槛。它不只查语法，而是判断观众最终听到的思想是否完整、自然、可信，并防止不同重录被机械拼成假句子。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 删除、保留、重排口播或旁白。
- 清理口癖、停顿、重复和重录。
- 改写 TTS Script。
- 从长素材建立 A-roll。

## 何时不使用

- 只调整画面位置且声音和 Script 不变。
- 只做技术转写，不决定最终内容。

## 前置读取

- Transcript、源音频和最终 Script。
- SemanticUnit、重录候选和源时间范围。
- CreativeBrief、观众承诺和目标时长。
- 需要时 `../transcription/SKILL.md`。

## 必须掌握的证据

- 完整上下文，不只看目标句。
- 转折、因果、列表、指代和问题/回答关系。
- 停顿、语气、呼吸、表情和动作。
- 重复是否来自口误、重录、强调或结构。
- 相邻音频切口和背景声。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 一个完整思想从哪里开始、到哪里结束？
- 被删内容是冗余还是必要前提？
- 后一次重录是否真的更好？
- 重复是在修正、强调还是制造节奏？
- 停顿是卡顿还是思考、情绪或包袱？
- 重排后代词、时态、因果和语气是否仍成立？
- 只听声音时是否像真实说话而不是机器拼接？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 构建语义结构

把内容标记为：

- 主张；
- 前提；
- 解释；
- 例子；
- 转折；
- 结论；
- 列表项；
- 问题；
- 回答；
- 重录；
- 有意重复；
- 口癖。

### 2. 识别完整单位

剪辑单位优先为：

- 完整句；
- 完整想法；
- 完整回答；
- 完整步骤；
- 完整笑点；
- 完整情绪动作。

ASR Segment、停顿或关键词都不能单独决定边界。

### 3. 处理重录

比较不同 Take：

- 信息完整度；
- 表达清晰度；
- 情绪和表演；
- 语速；
- 画面可用性；
- 与前后内容的衔接。

不默认“最后一次最好”，也不从多个残缺 Take 拼出说话者从未完整说过的句子，除非这是明确的重构创作并经过事实审查。

### 4. 处理停顿和口癖

先判断功能：

- 无意义卡顿；
- 搜索词语；
- 呼吸；
- 转折；
- 情绪；
- 结论前期待；
- 笑点后释放。

无意义停顿可压缩；承担叙事作用的停顿保留或轻微调整。

### 5. 重排检查

重排后逐项检查：

- 主语；
- 代词；
- 时态；
- 地点；
- 因果；
- 列表编号；
- 问题和回答；
- 结论前提；
- 情绪连续性。

### 6. 音频实听

应用 Script 后，不能只读文本。播放所有切口前后，检查：

- 音节被切断；
- 呼吸被截；
- 环境声跳变；
- 音量和音色变化；
- 两句贴得过紧；
- 语气突然改变。

### 7. 完整声轨复核

最后只听声音，从头到尾确认逻辑和自然性。

## 禁止行为

- 把 ASR 分段当完整语义。
- 只因句子较长就拆开。
- 默认删除所有口癖和停顿。
- 默认最后一次重录最好。
- 把不同 Take 的半句话拼成不存在的完整表达。
- 为节奏压缩必要前提。
- 只看文字不听音频。

## 验证

- 最终 Script 无半句话、悬空转折、无指向代词和列表断裂。
- 原因、例子和结论关系完整。
- 重录选择有可解释理由。
- 所有音频切口实听。
- 完整声轨自然且符合人物语气。

## 退出条件

- 只听声音可以理解整条主线。
- 语义、事实和人物意图得到保护。
- 压缩后仍有自然呼吸和节奏变化。
- 所有删改可追溯到源范围和理由。

## 按需读取的专业参考

- `references/complete-thought-editing.md`：完整思想、修辞关系和上下文依赖。
- `references/retakes-repetition-and-fillers.md`：重录、重复、口癖与停顿的专业判断。
- `references/semantic-audit.md`：应用 Script 后的文本与音频审查清单。


## `semantic-continuity/references/complete-thought-editing.md`

# 完整思想编辑

## 完整思想不等于一个句号

一个想法可能跨越多个 ASR Segment，也可能包含：

- 前提；
- 主张；
- 对比；
- 例子；
- 结论。

例如“不是……而是……”必须作为关系整体判断。

## 上下文依赖

高风险结构：

- 但是 / 所以 / 因为 / 反而；
- 这 / 那 / 它 / 他们；
- 第一 / 第二 / 最后；
- 上面说到；
- 这就是为什么；
- 回答前一个问题；
- 省略主语的口语句。

删除前一句可能让后一句语法仍通顺，但意义失去指向。

## 剪辑动作

- 保留必要前提；
- 将冗长铺垫压缩为最短充分上下文；
- 将重复解释保留最清楚的一版；
- 结论前留足理解时间；
- 不把抽象大词连续堆叠而没有例子。


## `semantic-continuity/references/retakes-repetition-and-fillers.md`

# 重录、重复、口癖与停顿

## 重录比较

不要只看时间顺序。比较：

- 是否完整；
- 是否准确；
- 是否自然；
- 是否有真实情绪；
- 是否与镜头动作匹配；
- 是否与前后语气一致。

## 重复类型

### 错误重启
前半句放弃并重新开始。通常保留完整后一次。

### 同义重录
两次完整表达相同观点。选择更清楚、自然的一次。

### 有意强调
重复本身承担情绪或修辞，不应机械删除。

### 结构回环
开头提出、后面再次回应。两处功能不同。

## 口癖

“嗯、然后、就是说”等不一定全部删除：

- 若只是填充，压缩；
- 若承担犹豫、真实感或转折，可保留；
- 删除后检查音频是否突然、人物表情是否不匹配。

## 停顿

判断停顿前后关系，不用固定毫秒阈值。连续快速信息后应保留恢复节拍。


## `semantic-continuity/references/semantic-audit.md`

# 语义审查

## 文本审查

- 是否有半句话；
- 是否有悬空转折；
- 主语是否消失；
- 代词是否无指向；
- 因果是否倒置；
- 列表是否从第二项开始；
- 结论是否没有前提；
- 问题是否被删只剩回答；
- 时态和地点是否跳变；
- 不同 Take 是否误拼。

## 音频审查

- 音节是否完整；
- 呼吸是否自然；
- 背景噪声是否跳变；
- 两句间距是否过紧；
- 情绪是否突然改变；
- 句尾是否被截；
- 是否需要 room tone 或短交叉淡化。

## 整体审查

只听声音回答：

1. 我能复述视频的核心观点吗？
2. 每段为什么接下一段？
3. 哪句话感觉像机器拼接？
4. 哪个停顿帮助理解？
5. 哪段虽然正确但多余？


# 8. `presenter-motion-director`

## SKILL.md

---
name: presenter-motion-director
description: Direct talking-head or digital-presenter videos where the person remains the visual anchor and Remotion effects, cutaways, captions, and sound are coordinated around the performance.
---


# 人物口播与动效导演

## 角色

本 Skill 为“人物持续口播 + Remotion 动效”负责。它同时规划人物表演、前后景效果、Cutaway、字幕和效果密度，而不是先生成整条人物视频再随机套动画。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 真人或数字人持续口播。
- 人物画面需要前景、后景、人物自身或全屏动效。
- 需要从 Script 建立 PresenterScene。
- 需要在人物口播中混入 Explainer 或 Vlog Cutaway。

## 何时不使用

- 纯旁白视觉解释片。
- 主要由实拍事件驱动的 Vlog。
- 只做单个现有效果的技术微调。

## 前置读取

- CreativeBrief、Script、NarrativeBeat 和 SpeechTiming。
- ActorCapability、ActorPerformance 或原始人物素材。
- StylePack、当前 Scene 和 AttentionCurve。
- `../semantic-continuity/SKILL.md`、`../visual-treatment-planning/SKILL.md`。

## 必须掌握的证据

- 人物构图、姿态、手势、表情、目光和可用蒙版。
- 语义 Beat、笑点、数字、CTA、证据和情绪变化。
- 字幕占用区域、现有前后景对象和声音事件。
- 参考人物动效视频的 Scene/Effect Grammar，而非固定模板。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 此刻人物应该是主注意力，还是应让位给视觉解释？
- 效果应位于人物前、人物后、人物自身还是全屏？
- 人物动作是否支持所选效果？
- 这句话需要效果，还是保持人物画面更有力量？
- 高密度段与安静段如何交替？
- 效果是解释、证据、幽默、CTA、遮盖切口还是纯装饰？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立人物视频的观众关系

先明确人物在视频中的作用：

- 主讲者；
- 可信来源；
- 情绪陪伴；
- 品牌人格；
- 叙事主持；
- 仅作为声音和形象锚点。

不同角色决定人物应占据多少画面和何时退出。

### 2. 划分 Narrative Beats

优先识别：

- Hook；
- 里程碑数字；
- 产品/对象；
- 问题；
- 解释；
- 证据；
- 笑点；
- 反应；
- 未来计划；
- CTA；
- 情绪收束。

### 3. 设计 AttentionCurve

不是均匀加效果。建立：

```text
高密度 Hook
→ 中密度说明
→ 安静人物段
→ 第二高潮
→ 恢复段
→ 结尾展示
```

连续高强度后必须给恢复时间。

### 4. 联合规划人物与视觉事件

对每个重要 Beat 同时决定：

- 人物表情和手势；
- 相机景别；
- Effect Type；
- 前后景层级；
- 空间锚点；
- 进入、稳定和退出；
- SFX；
- 是否需要 Cutaway。

例：说“送出 70 台平板”时，人物双手打开，产品从手部附近展开，数字在“70 台”落音时稳定。

### 5. 创建 PresenterScene

一个 PresenterScene 可持续 5–20 秒，并包含多个 EffectCue。不要把每个小元素拆成互不相关 Scene。

### 6. 安排安静区

以下情况优先保持人物：

- 需要建立信任；
- 情绪坦白；
- 复杂句需要听清；
- 刚结束高密度效果；
- 人物有重要表情或手势；
- 结论需要面对观众。

### 7. 预览和调整

检查：

- 进入、稳定、退出；
- 人物遮挡；
- 字幕冲突；
- 视觉中心；
- 效果密度；
- Cutaway 后回到人物的连续性；
- 完整声画节奏。

## 禁止行为

- 每句话固定添加效果。
- 全程高动态字幕加大量 MG。
- 人物动作和效果独立规划。
- 在人物重要表情时用前景卡片遮挡。
- 用强特效掩盖口播内容或表演不足。
- 把所有效果做成同一种圆角卡片。
- 没有安静区。

## 验证

- 只看人物层：表演是否自然。
- 静音看画面：视觉中心是否清楚。
- 完整声画：效果是否与语义同步。
- 检查人物前后景遮挡和安全区。
- 检查 AttentionCurve 的高低变化。
- 检查 Cutaway 回归自然。

## 退出条件

- PresenterScene 能连续播放。
- 所有 EffectCue 有明确叙事目的和语义锚点。
- 人物、字幕、MG 和声音没有长期竞争。
- 安静区和高潮段都存在。
- QualityReport 无阻塞问题。

## 按需读取的专业参考

- `references/presenter-attention-curve.md`：人物口播的视觉密度、安静区和高潮组织。
- `references/presenter-effect-grammar.md`：人物前后景、人物自身效果与全屏 Cutaway 的语法。
- `references/performance-and-motion-coordination.md`：人物动作、构图与 Remotion 效果联合规划。


## `presenter-motion-director/references/performance-and-motion-coordination.md`

# 人物表演与动效协调

## 联合规划表

每个 Beat 同时写：

- 口播文本；
- 情绪；
- 人物动作；
- 目光；
- 空间锚点；
- 效果；
- 进入/稳定/退出；
- 失败降级。

## 手势与效果

- 双手打开：适合产品或列表展开；
- 指向下方：适合 CTA；
- 摊手：适合问题或多选项；
- 看向侧面：适合评论、截图或对象出现；
- 正视镜头：适合结论和承诺。

若 Avatar 不支持精确手势，效果应改用 safe_left、safe_right 或 fullscreen，不得假装与手部互动。

## 构图

人物偏左时，主要信息优先放 safe_right；人物居中时，使用 behind_actor 或上下安全区。不要因为模板默认位置忽略实际人物。

## 动效与表情

笑点通常在包袱落下后触发；解释型效果可在关键词前预进入，并在关键词落音时稳定。


## `presenter-motion-director/references/presenter-attention-curve.md`

# Presenter AttentionCurve

## 为什么需要曲线

人物口播的视觉变化如果均匀发生，会显得机械；全程高密度则让观众疲劳。视觉强度应服务内容结构。

## 强度层级

### 0：安静人物

只有人物和稳定字幕。适合：

- 情绪坦白；
- 重要结论；
- 建立信任；
- 高密度后的恢复。

### 1：轻处理

- 轻微 Punch-in；
- 小型关键词；
- Lower Third；
- 稳定 B-roll 画中画。

### 2：中处理

- 人物后方数字；
- 前景产品；
- 评论云；
- 封面墙；
- 短 Cutaway。

### 3：高处理

- 开场 Hero；
- 全屏解释；
- 笑点中断；
- 强 CTA；
- 重要数据高潮。

## 曲线规则

- 高强度不能连续太久；
- 一个高潮后至少给一段理解或情绪恢复；
- 强度提升必须对应内容价值提升；
- 结尾不一定更强，很多结尾需要收束；
- 同一短句只设一个主视觉动作。


## `presenter-motion-director/references/presenter-effect-grammar.md`

# 人物动效语法

## Rear FX：人物背后

适合：

- 大数字；
- 评论；
- 装饰图形；
- 背景状态；
- 章节氛围。

要求人物蒙版可靠，背景信息不能在人物遮挡后失去关键含义。

## Front FX：人物前景

适合：

- 产品；
- 证据卡片；
- 封面墙；
- CTA；
- 物体互动。

避免遮挡脸、嘴和关键手势。

## Actor FX：人物自身

适合：

- Punch-in；
- 轻微构图变化；
- 表情反应版本；
- 短暂喜剧效果。

必须短而有落点。长期人物变形会破坏信任。

## Cutaway：全屏替换

适合：

- UI；
- 证据；
- 复杂解释；
- B-roll；
- 梗图；
- 作品预告。

它不是前景卡片放大版，而是暂时改变主视觉模型。

## 选择顺序

1. 保持人物能否成立？
2. Rear/Front FX 能否在不打断关系的情况下解决？
3. 是否需要 Cutaway 才能看清？
4. 是否需要全屏 Explainer 才能理解？


# 9. `avatar-performance`

## SKILL.md

---
name: avatar-performance
description: Plan, generate, assess, and repair digital-avatar performances so speech, gesture, gaze, emotion, framing, mask quality, and downstream effect placement work as one composition.
---


# 数字人物表演

## 角色

本 Skill 为数字人“像一个表演者”负责，而不只检查口型同步。它根据 ActorCapability 规划可实现动作，并为后续 Remotion 合成提供人物视频、蒙版、空间锚点和表演状态。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 生成数字人口播。
- 替换人物表演或局部修复。
- 人物动作需要与产品、CTA、评论或 Cutaway 协同。
- 需要判断数字人能力降级。

## 何时不使用

- 真人原始口播且不生成 Avatar。
- 只调整已有人物画面的字幕或 BGM。

## 前置读取

- 最终 SpeechAsset、Script Revision 和表演计划。
- Avatar Provider 的实时能力说明。
- 人物形象、画幅、服装和背景要求。
- VisualTreatmentPlan 与空间锚点需求。

## 必须掌握的证据

- Provider 是否支持透明背景、手势、表情、视线、局部重生成。
- 人物视频、声音、蒙版和实际姿态。
- 头、嘴、手、身体位置和安全区。
- 口型、眨眼、微动、手部和背景稳定性。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 角色应该呈现什么情绪和可信度？
- 人物的景别和位置是否为动效留出空间？
- 所需手势是否在 Provider 能力范围内？
- 表演是否与语句情绪和节奏一致？
- 数字人不自然的地方应重生成、Cutaway 遮盖还是降低动作复杂度？
- 人物是否在高密度动效中仍保持视觉锚点？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立 ActorCapability

记录实际能力，不使用想象能力：

- 透明背景 / Mask；
- 坐姿 / 站姿；
- 允许的表情；
- 手势；
- 视线；
- 镜头构图；
- 最大时长；
- 局部重生成；
- 输出帧率和声音处理。

### 2. 表演分段

按 SpeechSegment 和 NarrativeBeat 规划表演。每段说明：

- 基础情绪；
- 强调词；
- 手势；
- 目光；
- 头部和身体姿态；
- 是否需要保持稳定给动效让位。

### 3. 构图预留

人物位置应支持目标 StylePack：

- 左右安全区；
- 头顶空间；
- 字幕区；
- 手部活动区；
- behind_actor 的背景空间。

### 4. 生成与归一化

生成后登记 ActorPerformance：

- 人物视频；
- 对应 SpeechAsset；
- Mask；
- SpeechTiming；
- 姿态和安全区；
- Provider 元数据；
- 质量状态。

### 5. 表演 QC

检查：

- 口型大范围同步；
- 眼睛和眨眼；
- 手指和手部异常；
- 身体漂移；
- 服装、脸和背景一致性；
- 表情是否与语义相反；
- 句间是否突然复位；
- 嘴部是否被图形遮挡。

### 6. 降级和修复

优先级：

1. 局部重生成；
2. 降低手势要求；
3. 改构图或效果空间；
4. 用自然 Cutaway 覆盖短问题；
5. 换 Provider 或改用真人/静态形象。

不得用大量 Cutaway 隐藏整条人物表演失败。

## 禁止行为

- 假设 Provider 支持不存在的手势或透明背景。
- 先生成整条人物后再规划动效。
- 只检查嘴型，不检查眼神、手部、身体和情绪。
- 用前景图形长期遮挡嘴部问题。
- 人物每段都做强手势。
- 局部问题导致无必要的整条重生成。

## 验证

- SpeechAsset 与人物画面对应。
- 蒙版边缘和空间锚点可用。
- 人物表演与语义、情绪一致。
- 关键手势和 EffectCue 的位置匹配。
- 连续播放无明显复位和形象漂移。

## 退出条件

- ActorPerformance 可被 PresenterScene 使用。
- 不支持能力已明确降级。
- 阻塞级口型、脸、手和蒙版问题已解决。
- 下游能读取真实空间锚点。

## 按需读取的专业参考

- `references/performance-direction.md`：数字人的角色、情绪、手势、目光和稳定表演。
- `references/capability-and-fallbacks.md`：Provider 能力建模和降级策略。
- `references/avatar-quality-review.md`：口型、蒙版、形象连续性和不自然问题检查。


## `avatar-performance/references/avatar-quality-review.md`

# 数字人质量检查

## 视觉

- 脸部身份稳定；
- 嘴型没有大范围错位；
- 牙齿、舌头异常；
- 眼睛和眨眼自然；
- 手指、手掌和手腕；
- 衣服纹理和边缘；
- 身体漂移；
- 背景闪烁；
- Mask 毛边和半透明问题。

## 表演

- 情绪与句子一致；
- 重音处有适当动作或稳定；
- 句间不突然复位；
- 视线有合理变化；
- 不一直微笑；
- 不过度点头。

## 合成

- 图形不穿过脸和手；
- Mask 不切掉头发；
- 字幕不压嘴；
- 背后图形被人物遮挡后仍可读；
- Cutaway 出入不暴露形象跳变。


## `avatar-performance/references/capability-and-fallbacks.md`

# Avatar 能力与降级

## Capability 字段

- alpha_mask；
- gesture_set；
- expression_set；
- gaze_control；
- pose_control；
- camera_control；
- local_regeneration；
- max_duration；
- audio_input_contract；
- frame_rate；
- output_background。

## 降级示例

需要“指向下方”但不支持手势：

- 将 CTA 放在人物旁侧并用图形箭头；
- 使用 safe_left / safe_right；
- 不伪造手指互动。

需要人物后方大字但无 Mask：

- 使用背景干净的普通 Overlay；
- 将文字放在人物左右；
- 生成 Cutaway；
- 不做假前后景。

## 原则

Visual Treatment 必须适应真实能力，不让系统用不存在的能力承诺效果。


## `avatar-performance/references/performance-direction.md`

# 数字人表演指导

## 先定义角色关系

人物可能是：

- 专家；
- 朋友；
- 主持人；
- 讲解者；
- 体验者；
- 品牌代表。

不同角色影响：

- 语速；
- 表情强度；
- 直视镜头比例；
- 手势数量；
- 构图距离；
- 是否允许喜剧变形。

## 手势不是每句标配

手势应出现在：

- 数字或对象被提出；
- 对比；
- 列表；
- CTA；
- 反问；
- 情绪转折。

复杂解释时，人物可以更稳定，让观众把注意力放在图形上。

## 目光

- 正视镜头：承诺、结论、CTA；
- 轻微侧看：引导旁侧对象；
- 下看：谨慎使用，容易显得失去联系；
- 持续固定无微动：容易不自然。

## 情绪连续性

相邻段落的情绪变化应有原因。不要每个 Segment 独立重置成中性微笑。


# 10. `visual-treatment-planning`

## SKILL.md

---
name: visual-treatment-planning
description: Turn Narrative Beats into deliberate visual decisions: keep the current image, modify the current scene, use presenter effects, select B-roll/evidence, build an explainer scene, or intentionally remain quiet.
---


# 视觉处理规划

## 角色

本 Skill 为“哪里需要什么视觉处理，以及为什么”负责。它位于内容主线和具体 Remotion 实现之间，防止组件库反过来决定剪辑。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 整条视频主线稳定后规划视觉。
- 新增、重构或简化大量 Scene/Effect。
- 需要选择人物、B-roll、证据、MG 或安静区。
- 参考视频风格需要转化为通用视觉语法。

## 何时不使用

- 只调整单个已经确定的图形属性。
- Script 尚未稳定。
- 只做技术导出。

## 前置读取

- Story、NarrativeBeat、Script 和 SpeechTiming。
- 现有 Scene、Asset、StylePack 和 AttentionCurve。
- 人物能力、字幕策略和目标平台。
- 用户参考视频的分析结果。

## 必须掌握的证据

- 每个 Beat 的叙事功能和重要度。
- 当前画面能否承载信息。
- 可用证据、真实素材和生成素材。
- 前后视觉密度、重复的 Scene 语法和素材权利。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众这一刻需要理解、相信、感受还是行动？
- 保持当前画面能否成立？
- 需要解释、证明、具体化、情绪呼吸还是遮盖切口？
- 应该在当前 Scene 增加对象，还是建立新 Scene？
- 真实素材、证据、Remotion 图形和生成画面谁最合适？
- 是否超过注意力预算？
- 是否与前后 Scene 形成变化而不破坏统一？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 给 Beat 分类

常见功能：

- Hook；
- 主张；
- 解释；
- 对比；
- 分类；
- 流程；
- 数据；
- 证据；
- 例子；
- 情绪；
- 笑点；
- CTA；
- 结论。

### 2. 先评估保持原状

如果人物表情、真实动作或现有镜头已经足够，记录“保持”决定。视觉处理不是覆盖率竞赛。

### 3. 选择视觉任务

可选任务：

- 强化一个重点；
- 建立空间或对象；
- 显示关系；
- 逐步揭示结构；
- 提供真实证据；
- 将抽象概念具体化；
- 恢复注意力；
- 创造呼吸；
- 遮盖必要切口；
- 建立章节。

### 4. 选择表达层级

```text
当前画面不变
→ 当前 Scene 内轻处理
→ Presenter 前后景效果
→ B-roll / Evidence Cutaway
→ 全屏 ExplainerScene
→ VlogMontageScene
```

不要为小问题使用最重方案。

### 5. 选择视觉机制

优先考虑：

- 空间分组；
- 状态变化；
- 颜色语义；
- 物体关系；
- 数值变化；
- 路径；
- 遮罩；
- 镜头；
- 真实素材；
- 证据高亮；
- 字体排印。

不默认使用卡片。

### 6. 形成 AttentionCurve 和覆盖图

检查：

- 高、中、低密度；
- 连续安静时间；
- 连续高强度时间；
- Scene 语法重复；
- 同一时刻主注意力；
- 关键 Beat 是否得到处理；
- 普通 Beat 是否过度处理。

### 7. 输出 VisualTreatmentPlan

每项记录：

- Beat；
- 观众任务；
- 处理决定；
- Scene/Effect 类型；
- 资产需求；
- 时间锚点；
- 强度；
- StylePack；
- 验证方法；
- 不使用替代方案的原因。

## 禁止行为

- 按固定时间间隔添加变化。
- 把脚本名词逐一替换为库存素材。
- 所有 Beat 都创建新 Scene。
- 因组件可用就选择组件。
- 忽略“保持安静”作为正式决定。
- 用生成画面冒充证据。
- 连续重复同一种卡片或转场。

## 验证

- VisualTreatmentPlan 覆盖所有重要 Beat。
- 每个处理都有观众任务。
- AttentionCurve 有变化。
- 同一时刻主注意力明确。
- 资产需求可执行且权利边界清楚。
- 至少比较不处理方案。

## 退出条件

- 计划可被 Scene、Cutaway、Remotion 和素材 Skills 执行。
- 没有无目的效果。
- 主要信息得到视觉支持而普通信息不过载。
- 计划符合真实人物和工具能力。

## 按需读取的专业参考

- `references/narrative-to-visual.md`：从叙事功能到视觉任务和表达层级。
- `references/attention-budget.md`：视觉密度、安静区和一次一个主事件。
- `references/visual-mechanism-selection.md`：如何选择空间、状态、数据、证据、素材或字体机制。


## `visual-treatment-planning/references/attention-budget.md`

# 注意力预算

## 主事件

每个 Beat 指定一个主事件：

- 人物表情；
- 字幕关键词；
- 数字；
- 产品；
- 图表；
- 镜头运动；
- 音效；
- 证据高亮。

其他元素保持辅助或稳定。

## 冲突组合

谨慎同时使用：

- 逐词字幕 + 大数字计数；
- 人物强手势 + 前景产品；
- 文档高亮 + 快速镜头；
- B-roll + 大段 MG；
- 音乐强拍 + 重要对白 + SFX。

## 安静区

安静不是缺少设计，而是：

- 给观众理解；
- 建立人物关系；
- 恢复注意力；
- 突出下一高潮；
- 保留真实情绪。

## 密度审查

静音看整片，标出视觉变化。若每一秒都在变化，通常没有层级；若长时间没有语义或画面变化，可能单调。


## `visual-treatment-planning/references/narrative-to-visual.md`

# 叙事到视觉

## Hook

目标：快速建立问题、结果或反差。

可选：HeroReveal、强数字、具体对象、短证据。

禁忌：与后文无关的纯炫技。

## 解释

目标：让观众建立模型。

可选：分类、流程、比较、层级、渐进式 Scene。

禁忌：只把旁白重写成大字。

## 证据

目标：让观众相信。

可选：真实页面、文件、截图、数据、实拍。

禁忌：生成“看起来像证据”的画面。

## 情绪

目标：让观众感受和停留。

可选：人物、空镜、环境声、运动节奏、留白。

禁忌：用无关悲伤/励志素材机械煽情。

## 结论

目标：让信息收束并被记住。

可选：人物正视、简洁字体、前文视觉模型的最终状态。

禁忌：结尾突然换一套新视觉系统。


## `visual-treatment-planning/references/visual-mechanism-selection.md`

# 视觉机制选择

## 空间分组

适合分类、人群、阵营、结构。

## 状态变化

适合前后、开关、库存、进度、结果。

## 数值变化

适合价格、比例、里程碑、损失和增长。

## 路径与关系

适合流程、因果、路线、传递。

## 证据聚焦

适合文件、网页、表格、投诉、论文。

## 真实素材

适合地点、生活经验、动作、情绪和现场证明。

## 字体排印

适合短结论、金句、章节，不适合承载复杂机制。

## 镜头运动

推近缩短心理距离，拉远扩大人物与环境关系；速度变化表达期待、冲击和释放。运动必须回应内容，而不是持续漂移。


# 11. `effect-timing`

## SKILL.md

---
name: effect-timing
description: Place MotionCues, captions, SFX, cutaways, and camera changes on meaningful semantic, speech, visual, and musical beats using only the timing precision actually available.
---


# 动效时机与运动句法

## 角色

本 Skill 决定效果何时开始、何时稳定、停留多久、何时退出。它把运动当作句子和节奏关系，而不是按固定秒数或默认 spring 参数自动播放。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 创建或调整 MotionCue、EffectCue、字幕强调、SFX、Cutaway 或镜头变化。
- 需要让 Remotion 动效与语音、动作或音乐对齐。
- 需要在 segment_exact、chunk_coarse、word_exact 之间选择策略。

## 何时不使用

- 只创建静态无时间关系的素材。
- 时间证据 unavailable 且效果依赖同步。

## 前置读取

- SpeechTiming 精度。
- SemanticUnit / NarrativeBeat。
- 人物动作或源画面事件。
- 音乐 BeatMap 和现有效果。
- `../_shared/timing-precision.md`。

## 必须掌握的证据

- 段首、段尾、停顿、关键词或动作时间。
- 进入前的视觉状态和退出后的下一个事件。
- 动画的 Settled Frame 和阅读时间。
- 当前 AttentionCurve 和同时发生的声音事件。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 效果真正的语义落点是什么？
- 应该提前预入场还是落点后反应？
- 稳定帧需要在什么词或动作上完成？
- 观众需要多少时间读完和理解？
- 退出是否为下一事件让路？
- 音乐是否只是微调，还是当前内容确实由音乐驱动？
- 时间精度是否足以支持该效果？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 确定锚点优先级

默认：

```text
语义事件
>
语音重音
>
短句边界
>
画面动作 / 切点
>
音乐节拍
```

Vlog 或音乐蒙太奇可以提高动作/音乐优先级，但不得破坏语义和动作完整。

### 2. 把动画写成运动句子

每个效果包含：

```text
准备 / 预进入
→ 主动作
→ 稳定
→ 阅读 / 理解
→ 退出 / 释放
```

没有稳定和停留的动画通常只是噪声。

### 3. 选择时机类型

- 预示型：关键词前开始，关键词落音时稳定；
- 反应型：笑点或结果之后立即触发；
- 解释型：对象先建立，再逐步揭示；
- 证据型：页面先建立，再高亮；
- CTA 型：动作词出现时进入，行动语句期间持续；
- 转场型：句子边界或场景逻辑改变时完成。

### 4. 根据时间精度降级

- segment_exact：段首/段尾、Scene、Cutaway、句级字幕；
- chunk_coarse：粗定位和低频变化；
- word_exact：句中关键词和逐词字幕；
- unavailable：阻止正式同步效果。

### 5. 运动强度分层

慢推建立期待，快速动作形成冲击，停住让信息被看见。连续匀速往往像电子相册。

弱段小幅慢动，高潮才使用大幅冲击。

### 6. 控制并发

同一时刻最多一个主动作。若人物强手势、字幕变化和音效已经承担落点，其他图形应减弱或延后。

### 7. 关键帧和连续播放验证

检查进入、峰值、Settled Frame、退出，以及前后至少数秒的完整播放。

## 禁止行为

- 每三秒一个动画。
- 所有效果使用同一时长和 easing。
- 所有落点都卡音乐强拍。
- 只有进入没有稳定和阅读时间。
- 时间精度不足却声称逐词准确。
- 多个效果同一帧同时启动。
- 用运动填满所有静止时间。

## 验证

- 主动作落在正确语义或动作事件。
- Settled Frame 在信息需要被理解时可见。
- 阅读时间足够。
- 退出不打断当前信息。
- 并发注意力可控。
- 音乐关闭后运动仍有内容理由。

## 退出条件

- 所有 MotionCue 记录锚点、精度、进入、稳定、退出和验证。
- 没有依赖虚假时间数据。
- 局部预览和完整播放均通过。

## 按需读取的专业参考

- `references/semantic-beat-timing.md`：预示、反应、解释、证据和 CTA 的时机模型。
- `references/motion-phrasing.md`：运动的准备、冲击、停留和释放，以及速度的情绪语义。
- `references/timing-without-word-exact.md`：没有词级时间时的句级策略和预览微调。


## `effect-timing/references/motion-phrasing.md`

# 运动句法

## 建立 → 靠近 → 峰值 → 释放

运动的情绪来自前后关系，而不是单个关键帧。

- 慢推：建立期待、缩短心理距离；
- 快冲：冲击、强调；
- 停住：句号、让信息被看见；
- 拉远：扩大人物与世界的距离、收束；
- 横移：关系、发现、转移注意力。

## 运动要有动机

人物抬头时推近、转身时横移、结论出现时停住，动作才像画面在回应内容。

## 强度

全程强会让高潮失效。运动幅度、速度、模糊和音效都应分层。


## `effect-timing/references/semantic-beat-timing.md`

# 语义节拍时机

## 数字

数字动画的完成点通常对齐数字落音，而不是从数字说完后才开始。

## 对比

A 先建立，转折词时 B 进入，差值在两者都可见后出现。

## 列表

每一项随着对应语句出现，不要一开始展示全部后再逐项重复。

## 因果

起点先出现，关系词时路径或箭头开始，结果词处完成。

## 笑点

包袱前保持克制，落点后触发短反应，给观众释放时间。

## 证据

页面先建立 300–600ms，随后才高亮。否则观众不知道自己在看什么。

## CTA

行动动词出现时进入，在完整行动语句期间保持，不应刚出现就退出。


## `effect-timing/references/timing-without-word-exact.md`

# 没有词级时间时

## 可用做法

- 将重要短语独立成 SpeechSegment；
- 动画绑定段首或段尾；
- 句级字幕；
- 段内使用相对进度生成候选；
- Web 预览后微调帧；
- 将精确关键词效果降级为段级效果。

## 不可用做法

- 按字符均分时间；
- 根据文本长度推断音节；
- 将模型猜测标成 word_exact；
- 在未回听情况下精确同步 SFX。

## 记录

微调后的帧可保存为正式 MotionCue，但必须记录它来自预览校正，而不是自动时间戳。


# 12. `depth-composition`

## SKILL.md

---
name: depth-composition
description: Compose presenter, background, rear effects, actor, actor effects, foreground graphics, cutaways, captions, and sound into a clear depth hierarchy with safe occlusion and a single dominant attention target.
---


# 人物前后景与空间合成

## 角色

本 Skill 为图层深度、人物遮挡、空间锚点和构图层级负责。它不只是检查“有没有挡脸”，而是判断前后景关系是否帮助观众理解和保持人物存在感。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 效果需要位于人物前后。
- 需要绑定头、手、身体或安全区域。
- 人物 Mask、透明背景或画面裁切参与合成。
- 多个图层产生注意力或遮挡问题。

## 何时不使用

- 纯全屏 Explainer 且无人物层。
- 只做声音处理。

## 前置读取

- ActorPerformance、Mask、姿态和空间锚点。
- 目标画幅、字幕区和 StylePack。
- Scene 图层、EffectCue 和 Preview 帧。

## 必须掌握的证据

- 人物头、眼、嘴、手、身体轮廓。
- 关键物体和文字完整区域。
- 字幕安全区和平台 UI 遮挡区。
- 图层运动范围和视差。
- 背景复杂度、对比度和颜色。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 哪个对象在前，为什么？
- 遮挡是否表达空间关系还是只是技术效果？
- 人物被遮挡后仍能保持身份和表情吗？
- 背后信息被人物遮挡后是否仍可读？
- 前景对象是否与手势产生可信关系？
- 画面是否有一个清楚主视觉中心？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立深度层

默认逻辑：

```text
Background
→ Rear FX
→ Actor
→ Actor FX
→ Front FX
→ Cutaway / Fullscreen
→ Captions / Global UI
```

这是语义层，不要求实现完全相同的物理轨道。

### 2. 确定空间锚点

支持：

- behind_actor；
- actor_hands；
- actor_torso；
- actor_head；
- safe_left；
- safe_right；
- lower_center；
- upper_background；
- fullscreen。

逻辑锚点应根据实际姿态转换为坐标。

### 3. 保护区域

优先保护：

1. 眼睛和嘴；
2. 关键表情；
3. 手势；
4. 字幕；
5. 主要信息；
6. 平台 UI 安全区。

### 4. 遮挡要有目的

人物遮挡背景大字可以增加层次，但关键信息不能全部落在人物后。前景产品靠近手部可建立互动，但不应穿过身体或漂浮无支撑。

### 5. 视觉层级

通过以下方式建立层级：

- 尺寸；
- 位置；
- 对比；
- 清晰度；
- 运动；
- 前后关系；
- 留白。

不要仅靠阴影和发光。

### 6. 运动范围检查

检查动画的整个路径，而不是只看 Settled Frame。入场物体可能撞脸，退出可能扫过字幕。

### 7. 多画幅

竖屏和横屏不能仅等比缩放。重新判断：

- 人物位置；
- 字幕；
- 左右安全区；
- 前景对象；
- 平台控件。

## 禁止行为

- 所有图形都放人物前面。
- 为了层次强行抠像。
- Mask 质量差仍使用细小穿插。
- 只看稳定帧，不看运动路径。
- 把关键文字放在人物后方中央。
- 忽略平台 UI 和字幕区。
- 多个大对象形成多个视觉中心。

## 验证

- 进入、稳定、退出帧均无不可接受遮挡。
- 人物脸、嘴和手势被正确保护。
- 背景信息在遮挡后仍可理解。
- 前景对象与人物空间关系可信。
- 画面主视觉中心清楚。

## 退出条件

- 深度合成在目标画幅成立。
- Mask 和锚点状态可读。
- 没有 blocking 级遮挡或越界。
- 真实连续播放通过。

## 按需读取的专业参考

- `references/occlusion-and-safe-zones.md`：人脸、嘴、手势、字幕和平台安全区。
- `references/foreground-background-grammar.md`：前景、后景与人物互动的视觉语义。
- `references/composition-and-attention.md`：视觉层级、主视觉中心和多对象冲突。


## `depth-composition/references/composition-and-attention.md`

# 构图与注意力

## 主视觉中心

通过尺寸、对比、运动和位置确定一个主中心。次要信息应稳定、弱化或延后。

## 留白

留白是为：

- 图形进入；
- 字幕；
- 目光方向；
- 呼吸；
- 视觉层级。

不是“空着浪费”。

## 非对称

人物偏一侧可以为信息让出空间。不要每个元素都居中叠放。

## 画面平衡

平衡不是左右完全相同，而是视觉重量、方向和运动得到控制。


## `depth-composition/references/foreground-background-grammar.md`

# 前后景语法

## 背后效果

功能：

- 建立规模；
- 环境状态；
- 评论氛围；
- 章节感；
- 深度。

它应让人物仍是锚点。

## 前景效果

功能：

- 展示产品；
- 提供证据；
- 建立互动；
- CTA；
- 封面墙。

前景对象必须有清楚支撑关系，否则像贴纸。

## 人物自身效果

功能：

- 反应；
- 短 Punch-in；
- 构图变化；
- 喜剧落点。

长期使用会损害人物可信度。

## 全屏

当信息需要完整阅读或复杂解释时，全屏优于把小卡片硬塞在人物旁边。


## `depth-composition/references/occlusion-and-safe-zones.md`

# 遮挡与安全区

## 绝对优先保护

- 眼睛；
- 嘴；
- 关键表情；
- 对话中重要手势；
- 字幕；
- 证据文字；
- 平台按钮区域。

## 可接受遮挡

- 大型背景数字被人物部分遮挡；
- 装饰图形；
- 非关键信息；
- 有意制造空间关系的产品边缘。

## Mask 降级

Mask 边缘不稳定时：

- 增大人物与图形间距；
- 使用左右安全区；
- 降低细小穿插；
- 改成全屏 Cutaway；
- 不使用头发/手指复杂遮挡。

## 运动路径

在动画每个阶段检查安全区，尤其是入场和退出。


# 13. `cutaway-planning`

## SKILL.md

---
name: cutaway-planning
description: Plan B-roll, evidence, UI, full-screen explainers, memes, documents, generated shots, and other cutaways so they serve a precise editorial function and return naturally to the main scene.
---


# Cutaway、B-roll 与全屏插入

## 角色

本 Skill 决定何时离开主画面、离开多久、看什么、如何进入和如何回来。它防止空镜成为关键词插图，也防止 Cutaway 破坏人物关系和语义连续性。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 人物画面需要遮盖跳切。
- 需要具体化抽象内容。
- 需要展示证据、UI、地点、动作或情绪。
- 需要全屏 Explainer、梗图或作品预告。

## 何时不使用

- 当前人物表情或真实动作本身更重要。
- 素材只是装饰，不能解决具体问题。
- 用户只要求保持原画面。

## 前置读取

- NarrativeBeat、主画面、声音和切点。
- 候选 B-roll / Evidence / Generated Asset。
- 前后 Scene 和返回人物的状态。
- 素材来源与许可。

## 必须掌握的证据

- Cutaway 的叙事目的。
- 自然句子、停顿和动作边界。
- 候选素材的实际内容、构图、动作和时长。
- 主声音是否持续、环境声是否保留。
- 进入前和退出后的构图、姿态和情绪。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 离开主画面的必要性是什么？
- Cutaway 是证明、解释、具体化、情绪、遮盖还是笑点？
- 全屏、画中画还是短叠加最合适？
- 应该先听到声音还是先看到画面？
- 观众需要多长时间识别和理解素材？
- 返回主画面时人物状态是否跳变？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 明确叙事功能

每个 Cutaway 只能以至少一个清楚理由存在：

- 真实证明；
- 机制解释；
- 具体例子；
- 地点/时间建立；
- 情绪呼吸；
- 遮盖必要切点；
- 视觉笑点；
- CTA / 作品展示。

### 2. 检查主画面是否更好

人物的表情、动作或坦白可能比任何 B-roll 更有力量。先比较保持主画面。

### 3. 选择形式

- 全屏：需要完整阅读或沉浸；
- PiP：需要同时保留人物反应；
- 前景卡片：短证据或对象；
- ExplainerScene：复杂关系；
- VlogMontage：多个真实镜头共同表达。

### 4. 选择时机

优先在完整语义边界进入。可以使用：

- J-cut：先听到下一场声音；
- L-cut：画面切走但保留人物声音；
- 音效桥；
- 动作匹配；
- 构图匹配。

### 5. 控制持续时间

素材要足够让观众识别、读懂和感受，但不应在信息完成后继续占据画面。

### 6. 返回主画面

返回时检查：

- 人物姿态；
- 景别；
- 情绪；
- 语句；
- 画面方向；
- 音量；
- 是否暴露数字人段落复位。

### 7. 实际合成检查

比较源素材和成片裁切，确保文字、Logo、主体和动作没有被错误裁掉。

## 禁止行为

- 按脚本关键词机械搜索空镜。
- 每句话切一次 B-roll。
- 用无关库存素材假装丰富。
- 只看缩略图不看完整候选。
- Cutaway 过短无法识别。
- Cutaway 过长导致人物关系丢失。
- 返回人物时不检查姿态和声音。
- 使用许可未知素材。

## 验证

- Cutaway 的叙事功能明确。
- 素材与语义、情绪和动作相关。
- 进入、持续和退出自然。
- 主声音和环境声关系合理。
- 返回主画面无明显跳变。
- 真实裁切和授权通过。

## 退出条件

- 每个 Cutaway 可解释、可追溯、可替换。
- 不存在无关装饰性空镜。
- 主线理解和节奏得到改善。
- 完整播放通过。

## 按需读取的专业参考

- `references/cutaway-functions.md`：证明、解释、情绪、遮盖、笑点等不同功能。
- `references/broll-selection-and-duration.md`：候选素材判断、镜头长度和裁切。
- `references/entry-exit-and-return.md`：J/L Cut、声音桥和回到人物的连续性。


## `cutaway-planning/references/broll-selection-and-duration.md`

# B-roll 选择与时长

## 候选判断

- 画面真正发生什么；
- 是否对应旁白的具体含义；
- 动作方向；
- 情绪；
- 构图；
- 画幅；
- 可用连续时长；
- 是否含水印或文字；
- 与前后镜头的运动关系。

## 时长

先给观众识别主体，再给理解或感受时间。快速闪过的复杂画面没有信息价值。

## 裁切

9:16 裁切必须保护：

- 人脸；
- 动作；
- 文字；
- Logo；
- 视线方向；
- 重要环境。

## 反例

“自由”不等于随便找一段海边；先判断这段内容需要生活经验、情绪还是概念解释。


## `cutaway-planning/references/cutaway-functions.md`

# Cutaway 的编辑功能

## 证明

展示真实产品、现场、文件或行为。要求来源可信。

## 解释

展示流程、分类、数据、UI。必要时用 ExplainerScene，不强塞小卡片。

## 具体化

把抽象词落到可感知生活情境，如下班路、餐桌、海边。

## 情绪

提供呼吸、环境和氛围。必须符合段落情绪，不机械煽情。

## 遮盖切点

隐藏重录或数字人段落跳变。素材仍需与内容相关。

## 笑点

短、精准，在包袱落下后出现。不要持续解释笑点。

## CTA / 展示

让观众看清要执行的动作、产品或作品。


## `cutaway-planning/references/entry-exit-and-return.md`

# Cutaway 的进入、退出与返回

## J-cut

下一场声音先出现，帮助观众预期画面变化。

## L-cut

画面离开人物但保留其声音，保持叙事连续和人物关系。

## 声音桥

环境声、动作声或音乐可连接两种画面，但不能压住对白。

## 返回人物

尽量在：

- 完整句边界；
- 人物新姿态建立；
- 情绪逻辑一致；
- 景别变化有理由；

时返回。

若数字人 Segment 间姿态跳变，可让 Cutaway 覆盖过渡，但应修复根本问题，而不是全片依赖遮盖。


# 14. `visual-explainer-director`

## SKILL.md

---
name: visual-explainer-director
description: Direct narration-led visual explanation videos and full-screen explainer sections inside presenter projects. Use when the visual system must teach, compare, classify, prove, or progressively reveal information rather than merely decorate speech.
---


# 视觉解释片导演

## 角色

本 Skill 为旁白驱动的视觉解释负责。核心单位是 Scene 和场景内部的信息递进，而不是零散 Clip 或卡片。它协调解释动画、证据、真实素材、UI、图表和声音。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 旁白驱动知识解释片。
- 人物口播中需要全屏解释复杂机制。
- 内容包含分类、比较、流程、历史、数据、系统或证据。
- 参考视频的视觉语法需要被转化为 Scene。

## 何时不使用

- 主要价值来自人物表演而不是视觉解释。
- 实拍事件本身驱动故事。
- 只需一个小型人物旁效果。

## 前置读取

- Story、NarrativeMap、SpeechTiming 和 CreativeBrief。
- StylePack、可用 Scene Types、Asset Library。
- 参考视频分析中的 Scene Grammar 和 AttentionCurve。
- `../scene-planning/SKILL.md`、`../evidence-visualization/SKILL.md`。

## 必须掌握的证据

- 每个 NarrativeBeat 的功能和逻辑关系。
- 可用证据、真实素材、UI、图表和生成资产。
- 旁白长度、停顿和段级时间。
- 前后 Scene 的视觉模型、密度和 StylePack。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众需要建立什么心智模型？
- 哪些句子应共享同一个 Scene？
- 信息如何在场景内逐步出现？
- 应该用解释、证据还是现实素材？
- 一个场景何时已经完成任务，应切换到下一场景？
- 主视觉变化与字幕如何分工？
- 如何避免 PPT 和卡片堆叠？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立 NarrativeMap

将旁白拆为：

- Hook；
- 问题；
- 机制；
- 对比；
- 分类；
- 过程；
- 证据；
- 历史；
- 例子；
- 结论。

明确各 Beat 的因果和前后依赖。

### 2. 设计 Scene 结构

一个 Scene 应承载一个稳定认知模型，例如：

- 同一座舱中的舱位分类；
- 同一手机中的 OTA 产品层；
- 同一人物空间中的客户分组；
- 同一文件中的证据高亮。

通常让一个大场景持续数秒，并通过内部对象变化推动理解，而不是每句话更换背景。

### 3. 选择场景语法

优先从注册语法中选择：

- HeroReveal；
- ProgressiveClassification；
- ComparisonScene；
- RouteAndFlow；
- EvidenceDocument；
- UIWalkthrough；
- PeopleGrouping；
- LayerStack；
- DataConclusion；
- HistoryTimeline；
- RealityBroll。

### 4. 安排三类画面

合理交替：

- 解释画面：建立模型；
- 证据画面：建立可信度；
- 现实画面：建立生活经验和情绪。

不要让五分钟全是同一种 MG，也不要让所有解释都退化成库存素材。

### 5. 场景内渐进揭示

根据旁白顺序安排：

- 对象建立；
- 新类别出现；
- 状态变化；
- 关系线；
- 数值；
- 标签；
- 结论。

观众只在当前信息需要时看到下一层。

### 6. 字幕与主视觉分工

主视觉信息密度高时，字幕保持稳定和短句；不要同时使用全程逐词跳动字幕。

### 7. 场景级预览与缓存

逐 Scene 检查进入、稳定、递进和退出，再检查 Scene 之间的连续播放。

### 8. 整片 Visual QC

检查场景语法是否重复、是否有现实/证据呼吸、是否每段都像独立 PPT 页。

## 禁止行为

- 每句话创建一个新 Scene。
- 把旁白文字直接排成大字当作解释。
- 所有内容使用同一种卡片。
- 解释、证据和生成画面混淆。
- 复杂场景一次性展示全部信息。
- 主视觉高密度时再用高动态逐词字幕。
- 只验证单个 Scene，不看整片。

## 验证

- NarrativeMap 与 Scene 分段一致。
- 每个 Scene 有明确认知任务。
- 场景内部信息按旁白递进。
- 解释、证据和现实素材比例合理。
- Settled Frame 可读。
- Scene 间节奏和 StylePack 统一。

## 退出条件

- 整条旁白有完整视觉路径。
- 重要机制能够通过画面理解。
- 没有明显 PPT 化和模板重复。
- 真实预览和整片质量复核通过。

## 按需读取的专业参考

- `references/explainer-narrative-grammar.md`：旁白、问题、机制、证据和结论如何组织视觉叙事。
- `references/scene-grammar.md`：视觉解释片的通用 Scene 语法和适用边界。
- `references/explanation-evidence-reality.md`：解释、证据与现实素材的分工和交替。
- `references/progressive-reveal.md`：一个大场景内部的渐进式信息变化。


## `visual-explainer-director/references/explainer-narrative-grammar.md`

# 视觉解释片叙事语法

## Hook

优先给出：

- 具体结果；
- 数字；
- 反差；
- 问题；
- 真实证据载体。

Hook 不是单独花哨片头，它必须建立后文要解释的承诺。

## 建立问题

让观众知道：

- 什么现象；
- 为什么奇怪；
- 与自己有什么关系；
- 需要解释什么。

## 建立模型

通过稳定 Scene 逐步加入对象、分类、路径或状态，让观众获得可以跟随后文的心智模型。

## 提供证据

在关键主张后使用真实文件、UI、数据或现实素材。证据不应与解释画面混为一体。

## 扩展和反例

展示模型适用范围、不同情况或用户分类，避免过度简化。

## 收束

回到最初问题，用已经建立的视觉模型呈现最终状态，而不是突然引入新概念。


## `visual-explainer-director/references/explanation-evidence-reality.md`

# 解释、证据与现实素材

## 解释

回答“它是怎么运作的”。可以使用图形、空间、状态和动画。

## 证据

回答“为什么相信它”。必须来自真实可追溯来源。

## 现实

回答“它在生活中是什么感觉、发生在哪里”。使用实拍或可信 B-roll。

## 常见交替

```text
抽象解释
→ 真实证据
→ 现实画面
→ 回到模型继续解释
```

这种交替能避免全片都是动态图形，也避免库存素材无法解释机制。

## 禁止替换

- 生成“历史档案”不能替代真实档案；
- 漂亮空镜不能替代数据；
- 大段文字不能替代机制解释；
- 图表不能在没有来源时冒充证据。


## `visual-explainer-director/references/progressive-reveal.md`

# 渐进式揭示

## 为什么

观众需要按语言顺序建立模型。一次展示全部信息会造成阅读竞争。

## 结构

1. 建立基础场景；
2. 第一个对象/类别；
3. 第二个对象/类别；
4. 关系；
5. 数值或规则；
6. 最终结论。

## 场景持续与微变化

大场景可以持续 6–15 秒；内部小变化可随短句每 0.8–2 秒发生，但不是固定规则。

## 何时切新 Scene

- 心智模型改变；
- 空间、时间或证据类型改变；
- 当前场景无法清楚承载新关系；
- 情绪或章节明显转折。

不要仅因为旁白进入下一句就切场景。


## `visual-explainer-director/references/scene-grammar.md`

# Explainer Scene Grammar

## HeroReveal

对象 → 数字/结果 → 后果。适合 Hook。

## ProgressiveClassification

同一空间逐组着色、标签和价格。适合分类、等级、库存和产品套餐。

## ComparisonScene

A → B → 同屏 → 差值 → 结论。适合成本、前后、方案。

## RouteAndFlow

起点 → 路径 → 节点 → 终点。适合流程、因果、路线、资金流。

## EvidenceDocument

页面建立 → 聚焦 → 高亮 → 结论。适合论文、法规、投诉和报告。

## UIWalkthrough

完整界面建立 → 滚动/进入 → 关键区域 → 操作或结果。

## PeopleGrouping

人物出现 → 聚类 → 标签 → 分流。适合用户群、客户分类、角色关系。

## LayerStack

基础对象 → 逐层叠加 → 总结构。适合技术栈、服务层、成本构成。

## DataConclusion

图表容器 → 数据变化 → 标签 → 结论。

## RealityBroll

现实素材承担地点、情绪、行为或真实感，不用于解释复杂机制。


# 15. `scene-planning`

## SKILL.md

---
name: scene-planning
description: Design, split, merge, and restructure SceneInstances so each scene has one coherent cognitive or emotional model, a deliberate internal progression, and a clear entry, settled state, and exit.
---


# Scene 规划与场景语法

## 角色

本 Skill 负责把 Story 变成可编辑 SceneDocument。Scene 是观众在一段时间内理解画面的主要单位，不等于一条素材，也不等于一个小动效。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 新增 Scene。
- 把零散效果重构成完整场景。
- 调整场景边界或合并/拆分 Scene。
- 为 Presenter、Explainer 或 Vlog 选择 Scene Type。

## 何时不使用

- 只微调 Scene 内一个 EffectCue。
- Story 尚未清楚。
- 只导入素材。

## 前置读取

- NarrativeBeat、前后 Scene、SpeechTiming。
- Scene Type Registry、StylePack 和可用 Asset。
- 目标画幅、人物/字幕布局和 AttentionCurve。

## 必须掌握的证据

- 这一段的认知或情绪任务。
- 哪些句子共享空间、对象或视觉模型。
- 当前 Scene 内对象、状态和递进顺序。
- 前后 Scene 的构图、声音和运动。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 一个 Scene 的统一模型是什么？
- 哪些 Beat 应共享它？
- 场景内信息如何递进？
- 何时当前场景完成任务？
- 新 Scene 是否真的需要新的视觉世界？
- 进入和退出如何帮助观众重新定位？
- 能否用更少 Scene 获得更强连续性？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 定义场景任务

用一句话描述：

> 观众在这个 Scene 结束时，应看懂或感受到什么？

如果一句话无法表达，场景可能承担过多任务。

### 2. 选择 Scene Type

根据任务选择 PresenterScene、ExplainerScene、VlogMontageScene、DocumentScene、UIShowcaseScene、CutawayScene 或 EndCardScene。

### 3. 确定共享范围

把共享以下内容的 Beat 放在同一 Scene：

- 空间；
- 对象；
- 比较框架；
- 文档；
- UI；
- 时间阶段；
- 情绪状态。

### 4. 设计内部状态

至少定义：

- Entry State；
- Progressive States；
- Settled State；
- Exit State。

场景不是一个静态模板，而是一段状态变化。

### 5. 设计边界

场景边界优先来自：

- 新认知模型；
- 新地点/时间；
- 新证据类型；
- 章节转折；
- 情绪改变；
- 主视觉承担者改变。

### 6. 保持跨 Scene 连续

检查：

- 声音桥；
- 颜色和 StylePack；
- 运动方向；
- 对象接管；
- 人物回归；
- 信息是否重复。

### 7. 编译到 Timeline

Scene 与内部 Items 同一 Revision 原子更新，保留语义归属。

## 禁止行为

- 一个字幕句就是一个 Scene。
- 把完整场景拆成大量贴纸。
- Scene 只保存素材链接而没有任务和状态。
- 多个完全不同认知模型硬塞在同一 Scene。
- 场景切换只依赖花哨转场。
- 不定义 Settled State。

## 验证

- 场景任务一句话可说明。
- Beat 与 Scene 归属合理。
- 场景内部状态递进清楚。
- Entry/Settled/Exit 均可预览。
- 跨 Scene 连续播放不迷失。

## 退出条件

- SceneDocument 能被 Timeline 和 Remotion 稳定编译。
- 没有无意义过度拆分。
- 每个 Scene 可单独预览和缓存。
- 整片 Scene 顺序兑现 Story。

## 按需读取的专业参考

- `references/scene-boundaries.md`：认知、空间、时间、证据和情绪边界。
- `references/internal-progression.md`：Entry、Progressive、Settled、Exit 状态设计。
- `references/scene-coherence.md`：减少场景碎片、保持对象和视觉模型连续。


## `scene-planning/references/internal-progression.md`

# Scene 内部递进

## Entry

让观众先识别空间、对象或证据载体。

## Progressive States

每次只增加当前旁白需要的信息：

- 新对象；
- 新颜色；
- 新标签；
- 新关系；
- 新数据；
- 新状态。

## Settled State

当前 Scene 的完整结论画面，应有足够停留时间。

## Exit

可以：

- 当前对象缩小让下一对象接管；
- 通过声音桥过渡；
- 由共同颜色/形状连续；
- 直接切换，但在内容边界上完成。

退出不是为了展示转场，而是帮助认知切换。


## `scene-planning/references/scene-boundaries.md`

# Scene 边界

## 应切新 Scene

- 新地点或时间；
- 新心智模型；
- 从解释切到证据；
- 从人物关系切到全屏信息；
- 章节或情绪明显改变；
- 当前空间无法容纳新关系。

## 不必切

- 新一句话；
- 新关键词；
- 同一模型增加一个类别；
- 同一 UI 增加一张卡片；
- 同一文档高亮下一行；
- 只需局部构图变化。

## 边界风险

切得过多会像 PPT；切得过少会让场景负担过重。判断标准是观众是否需要重新建立“我在看什么”。


## `scene-planning/references/scene-coherence.md`

# 场景一致性

## 对象持续

同一对象在 Scene 内应保持身份、颜色和位置逻辑。不要每句重新生成一张不一致的图。

## 状态可追踪

观众应看得出从上一状态到下一状态发生了什么。

## 视觉机制一致

一个 Scene 内以一个主要机制为主，例如分类、比较或路径。不要同时混用过多机制。

## 信息上限

若 Settled Frame 无法清楚阅读，拆 Scene 或减少信息，而不是缩小字体。


# 16. `evidence-visualization`

## SKILL.md

---
name: evidence-visualization
description: Present documents, webpages, reports, charts, screenshots, complaints, tables, and other evidence with source integrity, readable focus, honest scale, and sufficient viewing time.
---


# 证据、文档与数据可视化

## 角色

本 Skill 为“观众看到的证据是否真实、可读、没有被视觉处理误导”负责。它不把证据变成装饰，也不允许生成画面冒充事实。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 法规、论文、报告、投诉、网页、表格、截图、数据或官方页面。
- 需要在 Explainer 或 Presenter Cutaway 中证明主张。
- 需要图表或数据动画。

## 何时不使用

- 纯概念隐喻，没有证据主张。
- 只展示用户自己的普通图片且不作为事实证明。

## 前置读取

- 原始来源、页面、文件或数据。
- 主张与证据的对应关系。
- 许可、引用和署名要求。
- 目标画幅、字幕和阅读时间。

## 必须掌握的证据

- 原始完整页面或数据，不只裁切片段。
- 来源页、作者、日期、单位、口径和上下文。
- 高亮内容与旁白。
- 图表轴、基线、比例、颜色和标签。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这段证据证明什么，不能证明什么？
- 观众是否先看懂证据载体，再看高亮？
- 裁切是否移除了会改变含义的上下文？
- 图表比例和动画是否夸大变化？
- 阅读时间是否足够？
- 生成或重绘后是否仍忠于原始数据？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 绑定主张

每个 EvidenceScene 记录：

- claim；
- source；
- relevant excerpt / data；
- limitations；
- attribution。

证据不能只是“看起来相关”。

### 2. 先建立页面

先让观众识别：

- 这是什么文件/网页；
- 来源是谁；
- 大致结构；
- 日期或标题。

然后再推近、高亮或框选。

### 3. 聚焦阅读顺序

使用：

- 推近；
- 滚动；
- 高亮；
- 框选；
- 模糊非重点；
- 箭头；
- 逐行揭示。

动作应控制阅读顺序，不追求热闹。

### 4. 裁切和上下文

保留足够上下文避免误导。若只显示一段，引导观众知道它来自哪里。

### 5. 数据与图表

明确：

- 单位；
- 时间范围；
- 样本；
- 比例；
- 基线；
- 数据源；
- 是否为估算。

动画应帮助理解变化过程，不改变数据关系。

### 6. 阅读时间

复杂证据画面需要更长 Settled Time。主视觉高密度时字幕应减弱。

### 7. 真实性复核

对照原始页面/数据和最终合成帧，确认内容、数字和高亮完全一致。

## 禁止行为

- 伪造或改写证据。
- 用生成新闻画面、文件或图表冒充真实来源。
- 只展示裁切结论，隐藏相反上下文。
- 页面刚出现就立刻高亮或切走。
- 用夸张比例误导数据。
- 高密度动画干扰阅读。
- 缺少来源和日期。

## 验证

- 证据与主张一一对应。
- 原始来源可追溯。
- 页面建立、聚焦和阅读顺序清楚。
- 数字、单位、轴和高亮准确。
- Settled Frame 可读。
- 许可和署名满足要求。

## 退出条件

- 观众能理解证据是什么、证明什么和限制是什么。
- 没有事实、数据或视觉误导。
- 最终帧与原始来源一致。
- QualityReport 无 rights/semantic blocking。

## 按需读取的专业参考

- `references/evidence-integrity.md`：主张、来源、上下文和生成内容边界。
- `references/document-reading-order.md`：页面建立、推近、高亮和阅读时间。
- `references/data-and-chart-ethics.md`：比例、基线、单位、动画和数据诚信。


## `evidence-visualization/references/data-and-chart-ethics.md`

# 数据与图表诚信

## 必须展示

- 单位；
- 时间；
- 范围；
- 数据源；
- 口径；
- 必要基线。

## 动画

图表容器先建立，数据再变化，最后出现结论。动画不能通过改变轴或比例制造夸张。

## 颜色

颜色表达语义时保持一致，例如风险/损失、收益/选中。不要仅为美观随机换色。

## 不确定性

估算、区间或样本不足应被可见标注，不要生成精确到个位的假数字。


## `evidence-visualization/references/document-reading-order.md`

# 文档阅读顺序

## 三步法

1. 建立：完整页面或标题；
2. 聚焦：移动、推近或弱化其他区域；
3. 高亮：在旁白引用时标记具体内容。

## 阅读速度

复杂段落不要快速滚动。高亮后应保留足够时间，让观众读到核心词。

## 画幅

竖屏中可重排为：

- 标题；
- 来源；
- 局部正文；
- 高亮；
- 旁白字幕。

不能简单缩小整页到无法阅读。


## `evidence-visualization/references/evidence-integrity.md`

# 证据完整性

## 证据层级

- 原始文件/官方页面；
- 可信二手来源；
- 用户提供截图；
- 模型解释；
- 视觉隐喻。

不同层级不得混为一谈。

## 裁切

裁切不能移除：

- 否定词；
- 条件；
- 日期；
- 单位；
- 样本；
- 来源；
- 反例；
- 限定范围。

## 生成内容

生成内容只能作为说明或隐喻，必须与真实证据明确区分。

## 引用

项目应保存来源 URL、页面标题、作者、日期、获取时间和必要署名。


# 17. `vlog-director`

## SKILL.md

---
name: vlog-director
description: Direct footage-led Vlogs and real-world stories by discovering events, selecting shots, preserving spatial/action/emotional continuity, shaping montage rhythm, and using graphics only where they add real value.
---


# Vlog 与实拍故事导演

## 角色

本 Skill 从实拍素材中发现故事。它优先保护事件、动作、反应、空间和现场声音，不把 Vlog 变成配音加库存素材或大量模板动效。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 大量实拍素材需要自动选择和编排。
- 旅行、生活、活动、体验、过程记录。
- 素材中的事件和镜头而非旁白驱动主时间轴。

## 何时不使用

- 旁白解释是主内容。
- 只有单一人物口播。
- 素材不足以建立任何事件或空间关系。

## 前置读取

- Asset、Shot、Scene detection、音频和视觉分析。
- CreativeBrief、目标时长和情绪方向。
- 人物、地点、时间、事件和素材来源。
- 音乐、环境声和可用旁白。

## 必须掌握的证据

- 镜头技术质量、主体、动作、反应、地点和时间。
- 事件先后、动作连续、视线和运动方向。
- 环境声、对白、笑声、脚步、交通等现场声音。
- 镜头重复和真实情绪。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 素材中真正发生了什么？
- 哪个事件值得成为故事节点？
- 哪一个镜头提供信息、动作、情绪或反应？
- 哪个镜头虽漂亮但不推进故事？
- 空间和动作如何保持方向？
- 什么时候快切，什么时候停留？
- 音乐是否支持事件而不是替代事件？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 建立素材地图

按时间、地点、人物和事件聚类。识别：

- 建立镜头；
- 动作；
- 细节；
- 反应；
- 转场素材；
- 环境；
- 结果；
- 失败或意外；
- 重复镜头。

### 2. 构建事件故事

从真实素材中寻找：

```text
目标 / 出发
→ 尝试
→ 变化 / 阻碍
→ 反应
→ 结果
→ 余韵
```

不要先写一个与素材无关的完整故事再强行找镜头填充。

### 3. 选镜头

每个镜头至少承担一种功能：

- 建立空间；
- 推进行动；
- 提供关键信息；
- 表现反应；
- 建立情绪；
- 连接时间/地点。

漂亮但重复的镜头应删。

### 4. 连续性

检查：

- 动作相位；
- 运动方向；
- 视线；
- 人物位置；
- 轴线；
- 光线和时间；
- 环境声；
- 情绪状态。

### 5. Montage 节奏

镜头长度依据：

- 动作完成；
- 信息读取；
- 反应；
- 音乐结构；
- 情绪张力。

不是每个强拍切一次。

### 6. 声音优先

保留重要现场声，用 J/L Cut 连接。音乐不是铺满全部空白。

### 7. 少量图形

标题、地点、时间、路线和数据可使用 Remotion。不要用 MG 掩盖素材选择不足。

### 8. 完整观看

静音看空间和动作；只听声音检查现场感；完整声画检查情绪推进。

## 禁止行为

- 只按技术清晰度选镜头。
- 每个音乐节拍切一次。
- 把环境声全部删除。
- 用大量字幕和动效掩盖故事不清。
- 忽略反应镜头。
- 漂亮 B-roll 重复堆叠。
- 打乱时间和空间却不重新建立方向。

## 验证

- 故事节点来自真实素材。
- 镜头选择有功能。
- 动作、方向和空间可跟随。
- 环境声和音乐有层级。
- 情绪有递进和停留。
- 图形使用克制。

## 退出条件

- 完整 Vlog 在没有解释文字时仍能大致跟随。
- 不存在明显空间/动作断裂。
- 素材真实性得到保护。
- 成片不是模板蒙太奇。

## 按需读取的专业参考

- `references/event-and-story-structure.md`：从素材中发现目标、变化、反应和结果。
- `references/shot-selection.md`：镜头功能、技术质量、重复和反应镜头。
- `references/spatial-action-emotional-continuity.md`：空间、动作、视线、时间和情绪连续性。
- `references/montage-and-natural-sound.md`：蒙太奇节奏、音乐与现场声。


## `vlog-director/references/event-and-story-structure.md`

# Vlog 事件与故事

## 事件不是地点列表

“到了机场、吃饭、回酒店”只是行程。故事需要：

- 想做什么；
- 遇到什么；
- 发生什么变化；
- 人怎么反应；
- 得到什么结果。

## 真实发现

素材没有冲突时，不应凭空制造戏剧。可以通过：

- 期待与现实；
- 第一次体验；
- 小意外；
- 选择；
- 情绪变化；
- 过程细节；

形成真实推进。

## 结构

短 Vlog 可用：

```text
结果/瞬间 Hook
→ 建立地点和目标
→ 过程
→ 变化或发现
→ 反应
→ 收束
```


## `vlog-director/references/montage-and-natural-sound.md`

# 蒙太奇与现场声

## 节奏

快切适合：

- 行动压缩；
- 能量；
- 多个细节；
- 重复过程。

长镜头适合：

- 反应；
- 地点感；
- 情绪；
- 重要动作完整性。

## 环境声

脚步、门、交通、人群、餐具、风、笑声能建立现场。不要全部被音乐覆盖。

## 声音桥

用下一镜头的声音提前进入，或让当前环境声延续到下一镜头，能保持连续。

## 音乐

音乐可以组织段落和情绪，但不能强迫真实动作错误卡拍。


## `vlog-director/references/shot-selection.md`

# 镜头选择

## 功能优先

镜头功能：

- establish；
- action；
- detail；
- reaction；
- transition；
- atmosphere；
- result。

同一功能的重复镜头只保留最有效的。

## 技术质量

清晰度、曝光和稳定性重要，但真实反应可能比技术完美更有价值。

## 反应镜头

事件的意义经常在反应中完成。不要只剪动作，没有人物感受。

## 动作余量

保留动作开始前和完成后的必要余量，避免所有镜头像被截断。


## `vlog-director/references/spatial-action-emotional-continuity.md`

# 连续性

## 空间

先建立地点，再使用细节。若改变方向或轴线，给观众重新定位的镜头。

## 动作

切在动作中可产生流畅，但必须匹配动作相位和方向。

## 视线

人物看向画外后，下一镜头应提供合理对象或有意制造悬念。

## 时间

跳时可用光线、声音、字幕或建立镜头说明。

## 情绪

不要从兴奋突然切到平静而没有过渡。反应、环境或音乐可承担情绪桥。


# 18. `captions`

## SKILL.md

---
name: captions
description: Create and revise captions as a semantic, typographic, timing, and attention system. Use for speech captions, dynamic keyword emphasis, titles, and caption-safe integration with presenter or explainer visuals.
---


# 字幕、换行与文字层级

## 角色

本 Skill 为最终屏幕文字负责。字幕不是 ASR 文本直接贴上去，也不是所有视频都应该逐字跳动。它协调语义切分、时间精度、可读性、人物/动效冲突和 StylePack。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 生成或修改字幕。
- 需要动态关键词、金句或标题。
- Script、SpeechAsset 或画幅变化后重排字幕。
- 需要检查字幕与人物/MG 安全区。

## 何时不使用

- 只修正源 Transcript，尚未决定最终屏幕文字。
- 纯无对白段不需要字幕。

## 前置读取

- 最终 Script、SpeechTiming 精度和 CaptionProgram。
- 目标平台、画幅、StylePack、人物和视觉布局。
- 当前 Scene 的视觉密度和 AttentionCurve。

## 必须掌握的证据

- 字幕文案、语义短语、段级或词级时间。
- 阅读速度、行数、字符长度和屏幕停留。
- 人物脸、嘴、手、UI 和 MG 区域。
- 语言、标点、专名和强调词。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 观众需要读完整句还是抓关键词？
- 应按语义短语还是逐词显示？
- 换行是否保留语义单元？
- 当前主视觉是否已经足够动态？
- 哪些词值得强调，强调是否改变含义？
- 字幕是否在移动、切换或消失时仍可读？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 区分四类问题

- 文案准确性；
- 时间准确性；
- Caption Card 切分；
- 视觉样式和布局。

不要用改样式解决文案错误，也不要改 Transcript 代替最终字幕修订。

### 2. 选择字幕模式

#### 稳定短句

适合视觉解释片、人物周围动效丰富、证据阅读。

#### 短语级动态

适合普通人物口播，segment_exact 可支持。

#### 逐词高亮

只在真实 word_exact 存在且视觉画面相对克制时使用。

#### 重点句排印

少量 Hook、金句或结论，作为独立视觉事件。

### 3. 语义切分

Caption Card 应尽量保持：

- 短语完整；
- 修饰关系；
- 数字与单位；
- 否定结构；
- 人名和头衔；
- 并列项。

换行不能把意义拆坏。

### 4. 阅读时间

根据：

- 文字长度；
- 语言；
- 复杂度；
- 主视觉；
- 画幅；
- 是否同时有动作；

决定停留。复杂证据段字幕应更短更稳。

### 5. 视觉层级

控制：

- 字号；
- 行数；
- 对比；
- 字重；
- 颜色；
- 背景；
- 安全区；
- 关键词强调。

强调必须稀缺，不能每句多个彩色词。

### 6. 与画面协同

人物动效丰富时优先稳定字幕；字幕需要成为主视觉时，其他图形减弱。

### 7. 全片检查

检查换行重复、跳动频率、视觉疲劳、字幕丢失和前后风格。

## 禁止行为

- 把 ASR 分块直接当字幕卡。
- 没有 word_exact 却逐词高亮。
- 所有关键词放大或变色。
- 换行拆开数字和单位、否定结构或专名。
- 字幕与 MG 同时高动态。
- 字号缩小来容纳过长句。
- 只看静态截图不播放。

## 验证

- 文案与最终 Script 一致。
- 时间精度声明正确。
- 换行语义完整。
- 目标设备可读。
- 人物、平台 UI 和 MG 不遮挡。
- 完整播放无频繁闪烁和视觉疲劳。

## 退出条件

- CaptionProgram 可读、可编辑、可追溯。
- 字幕模式符合视频类型和视觉密度。
- blocking 级可读性和时序问题为零。

## 按需读取的专业参考

- `references/caption-segmentation.md`：字幕卡切分、语义短语和阅读时间。
- `references/semantic-line-breaking.md`：中文换行、数字、否定、专名和列表。
- `references/typography-and-emphasis.md`：层级、对比、关键词强调和安全区。
- `references/dynamic-caption-strategy.md`：稳定、短语级、逐词和重点排印的选择。


## `captions/references/caption-segmentation.md`

# Caption Card 切分

## 优先单位

- 完整短语；
- 一个简单句；
- 一个列表项；
- 一组数字和单位；
- 一个问题或回答。

## 避免

- 过长三行以上；
- 卡片切换过快；
- 同一句被拆得像逐字电报；
- 前一张未读完就替换；
- 一张卡承担多个复杂关系。

## segment_exact

可将一个 SpeechSegment 再按文本语义拆成视觉短语，但时间只能做候选分配并通过预览调整，不能宣称词级精确。


## `captions/references/dynamic-caption-strategy.md`

# 动态字幕策略

## 稳定短句

视觉区复杂时使用。字幕只负责听读同步。

## 短语级动态

适合人物口播，2–5 个词/短语为一组，避免每字跳动。

## 逐词

需要真实 word_exact。画面应相对稳定，否则注意力冲突。

## 重点排印

适合 Hook、金句、章节或结论。它是独立视觉事件，不应与普通字幕长期同时高强度运行。

## 判断

字幕越动态，其他视觉越克制；主视觉越丰富，字幕越稳定。


## `captions/references/semantic-line-breaking.md`

# 语义换行

## 不拆开

- 不但 / 而且；
- 不是 / 而是；
- 因为 / 所以；
- 数字 + 单位；
- 人名 + 身份；
- 动词 + 必要宾语；
- 固定术语；
- 引号中的短句。

## 可在这些位置换行

- 语法停顿；
- 并列项；
- 主题与补充；
- 结果前；
- 对比两侧；
- 视觉节奏允许的短语边界。

换行应让观众一眼看出句子结构。


## `captions/references/typography-and-emphasis.md`

# 字幕文字层级

## 层级手段

优先顺序：

1. 位置和字号；
2. 字重；
3. 对比；
4. 颜色；
5. 动画。

不要一开始就用发光、描边和弹跳。

## 强调

每个 Caption Card 通常只强调一个真正重要词。强调可以是：

- 字重；
- 颜色；
- 尺寸；
- 延迟出现；
- 独立排版。

颜色应具有全片语义，不随机。

## 安全区

考虑：

- 平台底部按钮；
- 人物嘴和手；
- 前景图形；
- 横竖屏裁切；
- 移动设备小屏。


# 19. `audio-finishing`

## SKILL.md

---
name: audio-finishing
description: Shape dialogue continuity, room tone, silence, music, sound effects, audio bridges, ducking, fades, and final listening hierarchy after the editorial structure is stable.
---


# 声音、音乐与节奏收尾

## 角色

本 Skill 为听觉叙事和音频连续性负责。对白是 Anchor，音乐和音效服务内容结构，不以响度达标或“有 BGM”作为完成。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 主线稳定后处理声音。
- 口播切口、环境声、BGM、SFX 或章节声音需要优化。
- Cutaway、动效和镜头变化需要声音桥或强调。

## 何时不使用

- 内容结构仍在大幅变化。
- 只调用 OmniVoice 生成声音。
- 素材没有音频且用户不需要声音。

## 前置读取

- Dialogue/SpeechAsset、切点、Scene 和 MotionCue。
- 环境声、BGM、SFX 素材及授权。
- AttentionCurve、情绪结构和目标平台。

## 必须掌握的证据

- 对白音量、噪声、呼吸、切口和房间底噪。
- 音乐结构、强弱、节拍、调性和歌词。
- SFX onset、尾音和与视觉事件的关系。
- Scene 边界、Cutaway 和情绪变化。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这一段听觉主角是什么？
- 停顿应保留、压缩还是延长？
- 环境声能否帮助空间连续？
- 音乐承担节奏、情绪、章节还是只是填空？
- SFX 是否真正强化一个事件？
- 音频切口是否像自然说话？
- 安静是否比加音乐更有效？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 先只听对白

检查：

- 语义连续；
- 呼吸；
- 音节；
- 音色；
- 噪声；
- 音量；
- 段间停顿；
- 口播节奏。

### 2. 修复切口

可使用：

- 微型交叉淡化；
- room tone；
- 保留呼吸；
- 调整切点；
- L/J Cut；
- 重新生成局部语音。

不要把所有切口用同一淡化长度处理。

### 3. 建立声音角色

```text
Dialogue / Narration = Anchor
Natural Sound         = Space / Reality
BGM                   = Emotion / Structure
SFX                   = Event / Emphasis
```

### 4. 设计音乐

音乐应有：

- 入场理由；
- 章节关系；
- 强弱曲线；
- Duck；
- 结尾；
- 必要的安静区。

不默认全片铺满。

### 5. 设计 SFX

绑定明确事件：

- 数字完成；
- 产品进入；
- 切换；
- CTA；
- 笑点；
- 图表结论。

音效 onset 可能不在文件起点，需按真实听感对齐。

### 6. 声音桥

利用环境声或音乐连接 Scene，尤其是 Cutaway 和 Vlog。

### 7. 四种听法

1. 只听对白；
2. 对白 + 环境声；
3. 对白 + 音乐；
4. 完整声画。

### 8. 技术检查

检查峰值、响度、削波、声道、静音、结尾和编码，但技术达标不替代听感。

## 禁止行为

- 用 BGM 掩盖对白切口。
- 全片没有安静区。
- 所有转场都使用音效。
- SFX 只按 Item 起点对齐，不听 onset。
- 音乐强拍破坏语言和动作。
- 删除所有呼吸。
- 只看波形不听。

## 验证

- 对白连续自然。
- BGM 不长期压住语音。
- SFX 与事件同步且不过量。
- 环境声帮助空间和真实感。
- 安静、音乐和高潮有层级。
- 完整声画没有听觉疲劳。

## 退出条件

- 音频对象和角色关系清楚。
- blocking 级削波、丢音、不同步和对白不可懂问题为零。
- 音乐和 SFX 有创作理由。
- 最终导出前完成完整回听。

## 按需读取的专业参考

- `references/dialogue-continuity.md`：对白切口、呼吸、room tone 和局部重生成。
- `references/music-and-emotion.md`：音乐结构、情绪、节奏、Duck 和安静区。
- `references/sfx-and-sound-bridges.md`：事件音效、onset、环境声和 J/L Cut。
- `references/listening-and-technical-qc.md`：多轮听审与技术检查。


## `audio-finishing/references/dialogue-continuity.md`

# 对白连续性

## 切点

检查音节、辅音尾、呼吸和句尾。过紧的切点会产生“机关枪”感。

## Room Tone

源片环境不同或删掉停顿后，可使用短 room tone 填补，但不能制造明显循环。

## 呼吸

保留自然呼吸能维持人物存在。只删除过长、重复或明显干扰理解的呼吸。

## 重新生成

TTS 局部段落若音色、语速或重音异常，优先重生成该 Segment，而不是过度 EQ 修复。


## `audio-finishing/references/listening-and-technical-qc.md`

# 听审与技术 QC

## 听审

- 耳机；
- 普通扬声器；
- 手机音量；
- 低音量；
- 从头到尾不看画面；
- 完整声画。

## 技术

- 峰值和削波；
- 综合响度；
- 声道；
- 静音段；
- 音画长度；
- 结尾截断；
- 编码。

技术指标应适合目标平台，但不能替代主观可懂度。


## `audio-finishing/references/music-and-emotion.md`

# 音乐与情绪

## 音乐任务

- 建立氛围；
- 组织章节；
- 推进行动；
- 提供期待；
- 收束结尾。

## 不铺满

安静可以：

- 提高重要对白权重；
- 建立真实感；
- 让高潮更强；
- 给观众恢复。

## Duck

Duck 应根据对白实际需要和音乐频段，而不是固定大幅抽低。重要情绪音乐可在对白间隙恢复。

## 结构

音乐段落变化应与 Story/Scene 变化相关，不为卡拍随意切断完整句子。


## `audio-finishing/references/sfx-and-sound-bridges.md`

# SFX 与声音桥

## SFX

一个音效应绑定一个事件，而不是一个时间点：

- 对象落定；
- 数字完成；
- 页面打开；
- 关系连接；
- 笑点；
- CTA。

检查真实 onset 和尾音。

## 声音桥

- 下一 Scene 声音提前；
- 当前环境声延续；
- 音乐持续跨场；
- 动作声连接相似运动。

声音桥可以让直接切换比花哨转场更自然。


# 20. `remotion-production`

## SKILL.md

---
name: remotion-production
description: Design, author, patch, place, preview, and validate Remotion scenes and effects as a coherent visual system with editable properties, meaningful motion, settled-frame quality, and safe code execution.
---


# Remotion 动效与场景生产

## 角色

本 Skill 将已经确定的视觉任务实现为 Remotion。它不是模板调用说明，而是视觉设计与运动设计合同：先决定观众任务和 Settled Frame，再写组件和动画。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 创建或修改 Remotion Scene/Effect。
- 实现 Presenter 前后景、解释场景、字幕、图表或 UI。
- 将 StylePack 应用到可复用组件。
- 需要建立新的 Scene/Effect Blueprint。

## 何时不使用

- 尚未决定视觉任务和时机。
- 真实素材或证据已经足够，不需要图形。
- 只做项目状态读取。

## 前置读取

- VisualTreatmentPlan、Scene、EffectCue 和 MotionTiming。
- StylePack、目标画幅、人物和字幕安全区。
- 当前 Component/Scene Registry。
- 目标合成帧和参考视频分析。

## 必须掌握的证据

- 观众任务、内容、持续范围和层级。
- Settled Frame 应呈现的完整信息。
- 入场、稳定、阅读和退出。
- 可编辑字段、自然尺寸、资产和字体。
- 代码安全和允许组件。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这个 MG 帮助观众更快理解什么？
- 文字以外的视觉机制是什么？
- 为什么运动、材质和构图适合内容？
- 动画稳定后画面是否单独成立？
- 它与整条视频的视觉系统是否一致？
- 是否有更简单的图形或真实素材方案？
- 组件是否可编辑和可复用而不僵化？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 编写 Design Map

编码前明确：

- audience task；
- exact content；
- visual mechanism beyond text；
- timeline span；
- overlay / full-frame；
- settled frame；
- reading time；
- natural size；
- composition；
- motion beats；
- editable properties；
- StylePack。

### 2. 先设计 Settled Frame

先做静态构图，确认：

- 信息层级；
- 字体；
- 留白；
- 对齐；
- 人物/字幕安全；
- 颜色语义；
- 完整性。

如果稳定画面像普通 PPT，动画不会自动救它。

### 3. 选择视觉机制

可使用：

- 空间；
- 状态；
- 颜色；
- 数据；
- 路径；
- 遮罩；
- 物体；
- 镜头；
- 字体；
- 图像/视频；
- 三维预制素材。

不要默认卡片。

### 4. 设计运动句法

为每个对象定义：

```text
pre-entry
→ active motion
→ settle
→ hold
→ exit
```

运动速度和方向必须有语义或注意力理由。

### 5. 组件和代码

优先使用注册组件与 StylePack。新增组件应：

- props 可序列化；
- 尺寸明确；
- 不依赖本地临时服务器；
- 资产可定位；
- 字体可用；
- 确定性渲染；
- 无未审查任意代码执行。

### 6. 反默认设计检查

主动质疑：

- Glow；
- Glass；
- Blur；
- Gradient；
- Shine；
- Sweep；
- Spring；
- 圆角卡片；
- 持续漂浮。

只有内容需要时使用。

### 7. 放置与合成

基于真实目标帧决定位置、大小和前后景。不要只在透明画布中预览。

### 8. 验证

检查：

- 进入帧；
- 中间动作；
- Settled Frame；
- 退出；
- 完整合成；
- 连续播放；
- Web 与导出 Snapshot 一致。

## 禁止行为

- 未明确内容、时段和角色就开始写 JSX。
- 把所有 MG 做成同一种卡片。
- 用发光、玻璃、渐变和 spring 假装高级。
- 只看透明组件，不看最终合成。
- 只验证工具返回成功。
- 在服务器执行任意未审查代码。
- 组件属性不可编辑。
- 动画持续运动没有稳定阅读期。

## 验证

- Settled Frame 单独成立。
- 文字以外存在真实视觉机制。
- 运动与语义和 AttentionCurve 一致。
- 实际合成无遮挡和冲突。
- 组件可编辑、可复用、可确定性渲染。
- 进入、保持和退出完整。

## 退出条件

- Remotion Scene/Effect 已注册或安全创建。
- Web Preview 和导出使用同一 Snapshot。
- 没有 blocking 级设计、代码或合成问题。
- 完整声画复核通过。

## 按需读取的专业参考

- `references/design-map-and-settled-frame.md`：编码前 Design Map 与稳定画面设计。
- `references/visual-mechanisms.md`：超越文字卡片的视觉机制。
- `references/motion-grammar.md`：方向、速度、停顿、期待和释放。
- `references/anti-ppt-and-style-system.md`：反 PPT、反默认材质与统一视觉语法。
- `references/remotion-code-contract.md`：可序列化 props、确定性渲染和安全执行。


## `remotion-production/references/anti-ppt-and-style-system.md`

# 反 PPT 与视觉系统

## PPT 征兆

- 每页标题 + 三个要点；
- 连续相同圆角卡片；
- 只有文字入场；
- 所有元素从下方弹入；
- 场景之间没有对象或运动连续；
- 缺少状态、空间和关系；
- 信息一次性全部展示。

## 解决

- 使用一个稳定场景逐步变化；
- 用对象、空间、状态和路径表达；
- 让前一个对象接管或变形为下一个；
- 限制运动语法；
- 让关键场景更独特，普通场景更克制。

## StylePack

统一字体、颜色语义、背景、字幕、运动语言和音效，不等于所有 Scene 一模一样。


## `remotion-production/references/design-map-and-settled-frame.md`

# Design Map 与 Settled Frame

## Design Map

每个 MG 在编码前回答：

- 观众任务；
- 精确内容；
- 视觉机制；
- 同步对象；
- 角色：overlay/full-frame；
- 稳定帧；
- 阅读时间；
- 尺寸和构图；
- 可编辑字段；
- StylePack；
- 失败降级。

## Settled Frame

稳定帧是观众真正理解信息的状态。必须检查：

- 主要信息一眼可见；
- 次要信息有层级；
- 字体可读；
- 空间不拥挤；
- 人物和字幕被保护；
- 不依赖持续动画保持吸引。

先通过静态设计，再加运动。


## `remotion-production/references/motion-grammar.md`

# Motion Grammar

## 方向

- 向上：提升、增长；
- 向下：落定、下降；
- 横向：转移、对比、过程；
- 推近：强调、亲近；
- 拉远：收束、环境；
- 旋转：转化或对象展示，慎用。

语义不是绝对规则，应结合场景。

## 速度

慢 → 期待和观察；
快 → 冲击和变化；
停 → 阅读和句号。

## Easing

选择 easing 的理由应来自对象质量和情绪，不是所有对象都 spring。

## 同步

运动峰值可以对齐语义、动作或声音事件。音乐只做微调，除非视频本身由音乐驱动。


## `remotion-production/references/remotion-code-contract.md`

# Remotion 代码合同

## Props

- 可序列化；
- 有默认值；
- 命名表达内容；
- 允许修改文字、数字、颜色、资产、时长和强度；
- 不把项目 ID 或本地绝对路径写死。

## 时间

使用帧和 VideoConfig；避免依赖真实时间和不确定异步状态。

## 资产

使用受管 Asset，确保 Web Preview 和服务端渲染可访问。

## 确定性

相同 Snapshot 应得到相同输出。随机性必须显式 seed。

## 安全

- 只允许注册组件或通过审查的代码；
- 禁止任意网络请求；
- 禁止访问未知文件；
- 禁止执行系统命令；
- 构建失败时保留原 Revision。

## 验证

组件单测不能替代合成帧和连续播放。


## `remotion-production/references/visual-mechanisms.md`

# 视觉机制

## 关系

箭头、路径、连接和相对位置。

## 分类

空间分组、颜色、区域和标签。

## 比较

并置、差值、状态切换。

## 数据

数字变化、图表、比例和标尺。

## 层级

叠加、缩进、深度和逐层展开。

## 状态

开关、进度、库存、选中、错误/正确。

## 时间

Timeline、阶段、前后对照。

## 证据

真实页面、文件和截图聚焦。

## 文字

字体排印适合短结论，不是复杂机制的万能替代。


# 21. `quality-verification`

## SKILL.md

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


## `quality-verification/references/four-pass-review.md`

# 四轮审片

## 1. 只听声音

不看画面，从头到尾听：

- 能否理解；
- 是否像真实连续说话；
- 停顿是否有层级；
- 音乐是否压对白；
- SFX 是否过量；
- 情绪是否突然。

## 2. 静音画面

不听声音，看：

- 主视觉中心；
- 字幕可读；
- Scene 是否像 PPT；
- 是否长时间无变化；
- 是否变化过密；
- 人物和图形是否竞争；
- 空间和动作能否跟随。

## 3. 完整声画

检查：

- 动效与语义落点；
- Cutaway 与口播关系；
- 音效与动作；
- 字幕与主视觉；
- 高低密度；
- 情绪和音乐。

## 4. 首次观众

假设不知道制作过程，回答：

- 前三秒为什么继续看？
- 我知道视频在讲什么吗？
- 中间有没有迷失？
- 结尾回答了开头吗？
- 最后记住什么？


## `quality-verification/references/mode-specific-rubrics.md`

# 模式专项 Rubric

## Presenter

- 人物是否建立信任；
- 人物是否持续占据应有地位；
- 动效是否围绕语义而非固定间隔；
- 人物前后景空间可信；
- 字幕是否稳定；
- Cutaway 是否有目的；
- 安静区是否存在。

## Visual Explainer

- 每个 Scene 是否有认知任务；
- 大场景内部是否渐进；
- 画面是否表达关系而不只重复文字；
- 证据、解释和现实画面是否区分；
- 图表和文档是否可读；
- Scene 语法是否重复。

## Vlog

- 故事来自真实事件；
- 镜头选择是否有功能；
- 反应是否保留；
- 空间、动作和方向可跟随；
- 环境声是否存在；
- 音乐是否服务事件；
- 动效是否克制。


## `quality-verification/references/reference-comparison.md`

# 参考视频比较

## 比较什么

- 观众承诺；
- Scene 长度；
- 小变化频率；
- AttentionCurve；
- 字幕策略；
- 运动语言；
- 解释/证据/现实比例；
- 人物与动效层级；
- 声音结构。

## 不比较什么

不要求逐像素、逐素材复制，也不复制：

- 品牌；
- 未授权画面；
- 具体文案；
- 人物形象；
- 独占模板。

## 结论

写出：

- 保留的语法；
- 替换的内容；
- 未达到的机制；
- 技术差异；
- 观众效果差异。


## `quality-verification/references/severity-and-fix-loop.md`

# 严重级别与修复循环

## 根因

反馈发生在某个时间码，不代表根因就在该帧。例如：

- 字幕太快可能源于 Script 分段；
- 动效遮挡可能源于人物构图；
- 结尾无力可能源于开头承诺；
- BGM 抢对白可能源于音乐选择而非 Duck。

## 修复优先级

1. 事实、权利、语义；
2. 声画同步和可懂度；
3. 注意力与遮挡；
4. 节奏；
5. 风格细节。

## 最小修复

修改最少对象，保留已经满意的区域。通过 ImpactReport 确认影响。

## 有界循环

默认一次自动修订。若仍有 blocking，可继续；审美探索需用户或明确评价标准。


# 22. `export`

## SKILL.md

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


## `export/references/attribution-and-delivery.md`

# 署名与交付

## AttributionManifest

包含：

- Asset；
- Creator；
- Source；
- License；
- Required text；
- Placement requirement；
- Access date。

## 交付信息

- 文件名；
- Revision；
- 导出 Profile；
- 时长；
- checksum；
- 生成时间；
- 署名；
- 已知限制。

## 版本

不要覆盖用户已审片文件。使用可追踪名称或 Artifact ID。


## `export/references/export-readiness.md`

# 导出就绪

## 必须为真

- 明确 revision_id；
- Quality blocking=0；
- 使用素材 rights_status 可交付；
- 需要署名的素材已进入 manifest；
- 所有 Asset 本地可读；
- 字体和组件可用；
- 没有未完成 Job；
- Preview 与 Snapshot 一致；
- 输出 Profile 明确。

## 需要用户确认

- 多个创作方向未选择；
- 仍有 major 审美问题；
- 许可限制当前平台；
- 平台裁切会改变构图；
- 生成媒体需要明确标注。


## `export/references/technical-qc.md`

# 导出技术 QC

## Probe

读取：

- container；
- codec；
- width/height；
- frame rate；
- duration；
- audio codec；
- sample rate；
- channels。

## 检查

- 文件非零；
- 视频/音频流存在；
- 声画长度接近；
- 无开头/结尾异常黑帧；
- 无长时间冻结；
- 无全程静音；
- 无削波；
- 字幕和安全区正确；
- 实际设备可播放。

## 抽检

至少抽开头、25%、50%、75%、结尾以及所有重大修改区间。


# 23. `known-errors`

## SKILL.md

---
name: known-errors
description: Diagnose and recover from VideoFlowCut project, Bridge, asset, timing, avatar, Remotion, browser, revision, quality, and export failures without hiding capability gaps or corrupting project state.
---


# 已知错误、降级与恢复

## 角色

本 Skill 是统一故障路由，不只处理异常码，也处理常见“技术成功但成片失败”的质量症状。它要求先分类、保留证据、最小恢复，再决定重试、降级或阻断。

本 Skill 必须遵守：

- `../_shared/editorial-principles.md`
- `../_shared/mcp-and-project-contract.md`
- `../_shared/decision-record.md`

## 何时使用

- 任何 Job、MCP、Web、Bridge、Asset、Avatar、Remotion 或导出失败。
- 结果未知、Revision 冲突或素材 stale。
- 成片出现语义、遮挡、时序、过度动效、单调或 PPT 化症状。

## 何时不使用

- 尚未执行任何操作，只在讨论理论。
- 用户明确提出新的创作方向而非错误。

## 前置读取

- 错误原文、HTTP 状态、Job、Run 和日志。
- 当前 Revision、幂等键和目标对象。
- 相关 Preview、QualityReport 和 Asset 状态。
- 实时 workflow/tool schema。

## 必须掌握的证据

- 失败发生在哪一层：输入、状态、能力、任务、输出、合成、质量或权利。
- 请求是否可能已经提交。
- 当前项目是否仍一致。
- 重试是否会重复写入。
- 是否存在安全降级。

证据不足时不得伪造精确判断。应指出缺失内容、最小补充方式以及它会改变什么决定。

## 专业判断问题

- 这是技术错误、能力缺失还是创作错误？
- 失败是否可重试？
- 需要重新读取 Schema/Revision 吗？
- 是否应只重跑局部派生任务？
- 降级会损失什么观众效果？
- 何时必须阻断而不是继续生成？

每个重要决定至少比较“保持原状”与一种替代方案。

## 工作方法

### 1. 分类

```text
contract
revision
job
asset
rights
speech
avatar
timing
scene
remotion
browser
quality
export
unknown
```

### 2. 保存原始证据

保留：

- error；
- status；
- request summary；
- idempotency key；
- run/job id；
- revision；
- logs；
- output list；
- time；
- screenshots。

不要先改写错误再报告。

### 3. 判断是否已产生副作用

超时或断连时先对账：

- Revision 是否变化；
- 对象是否存在；
- Job 是否完成；
- 输出是否已本地化。

### 4. 选择恢复策略

- 重新读取 Schema；
- 重新读取 Revision；
- 重跑失败派生任务；
- 局部重生成；
- 换素材；
- 换 Scene 语法；
- 降级时间精度；
- 改用稳定字幕；
- 改成 Cutaway；
- 阻断并请求最小补充。

### 5. 创作失败诊断

常见症状：

- 视频能剪但无聊；
- 动效很多但像 PPT；
- 语义不完整；
- 字幕和 MG 竞争；
- B-roll 无关；
- 人物和效果不匹配；
- 节奏均匀；
- 音乐压对白。

这些不是“渲染成功”能解决的问题，应路由到对应专业 Skill。

### 6. 验证恢复

任何恢复后都重新读回状态，并只验证受影响范围和必要完整播放。

## 禁止行为

- 看到 500 就无条件重试。
- 结果未知时重复写入。
- 修改数据库修复业务状态。
- 用静默降级隐藏能力缺失。
- 把技术错误和审美问题混为一谈。
- 删除失败证据。
- 用包装掩盖语义或表演问题。

## 验证

- 错误分类和根因有证据。
- 项目状态没有半写。
- 恢复策略没有重复副作用。
- 降级影响已记录。
- 修复后完成写后读回和真实预览。

## 退出条件

- 错误已恢复、明确降级或明确阻断。
- 不存在结果未知。
- 用户/开发者能从报告理解原因和下一步。
- 项目可安全继续。

## 按需读取的专业参考

- `references/recovery-matrix.md`：各错误域的重试、对账、降级和阻断。
- `references/bridge-and-api-errors.md`：FunASR、OmniVoice、MiniMax Bridge 状态和 Schema 错误。
- `references/creative-failure-patterns.md`：能渲染但语义、节奏、画面和声音失败的症状路由。


## `known-errors/references/bridge-and-api-errors.md`

# Bridge 与 API 错误

## 400

字段 ID、文件字段、请求类型或必传媒体错误。重新读取 workflow detail，按实时 fields/itemSlots 构造。

## 404

workflow、run 或 output 不存在。检查 ID；ComfyUI 重启后旧 Run 可能丢失。

## 409

schemaVersion 变化或 workflow unavailable。重新读取 detail，不重用旧 Schema。

## 413

请求或文件过大。切分、压缩或使用受管文件策略。

## 500 / failed

保存 error，检查 ComfyUI 控制台和工作流。不要下载不存在的 output。

## succeeded 但缺输出

按失败处理。状态成功不能替代预期 output kind。

## Run 丢失

项目侧根据请求、Job、已下载文件和 hash 对账，不能凭空声明失败或成功。


## `known-errors/references/creative-failure-patterns.md`

# 创作失败症状

## 能剪但无聊

路由：production-director、visual-treatment-planning、对应模式 Director。

检查：观众承诺、Beat、AttentionCurve、Scene 任务、安静与高潮。

## 动效很多但像 PPT

路由：remotion-production、scene-planning。

检查：卡片重复、文字替代视觉机制、缺少状态变化、Settled Frame。

## 语义断裂

路由：semantic-continuity。

检查：完整思想、重录、转折、指代、音频切口。

## B-roll 无关

路由：asset-import、cutaway-planning。

检查：AssetRequirement、真实画面、叙事功能和素材来源。

## 人物与效果不匹配

路由：avatar-performance、presenter-motion-director、depth-composition。

## 字幕抢画面

路由：captions、visual-treatment-planning。

## 节奏均匀

路由：effect-timing、audio-finishing、模式 Director。

## 音乐压对白

路由：audio-finishing。


## `known-errors/references/recovery-matrix.md`

# 恢复矩阵

| 类型 | 先检查 | 可重试 | 必须阻断 |
|---|---|---|---|
| revision | 最新 Revision、目标对象 | 重新判断后 | 无法合并用户变更 |
| asset | 本地文件、hash、ready 状态 | 派生任务 | 权利 unknown |
| job | idempotency、状态、输出 | 确认未完成后 | 结果未知无法对账 |
| timing | timing precision | 降级/预览微调 | unavailable 且依赖同步 |
| avatar | capability、输出、mask | 局部重生成 | 人物身份/口型严重失败 |
| remotion | props、asset、font、build | 修复后局部渲染 | 任意代码风险 |
| export | snapshot、streams、file | 同一 snapshot 幂等重试 | rights/quality gate 未过 |

恢复必须记录原错误、动作和验证。


# Evals

# Skill Evals

这些场景用于验证 Skills 是否真的产生专业判断，而不只是文件存在或能调用 MCP。每个 Eval 应保存输入、加载的 Skill/References、关键决定、项目修改、Preview 证据和最终判定。

## `asset-import`

**场景：** 需要一段竖屏“下班路上抬头看天空”的 B-roll。

**必须表现：**
- 形成 AssetRequirement
- 比较多个候选的动作、构图、情绪和许可
- 下载到本地并登记来源
- 在真实裁切中检查

**失败判据：**
- 直接用第一个关键词结果
- 长期引用临时 URL
- 使用许可未知或带水印素材

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `audio-finishing`

**场景：** 口播删停顿后出现明显拼接，BGM 长期盖住对白。

**必须表现：**
- 只听对白定位切口
- 保留呼吸或 room tone
- 调整切点/交叉淡化
- 设计 Duck 和安静区

**失败判据：**
- 用更大 BGM 掩盖
- 删除所有呼吸

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `avatar-performance`

**场景：** Provider 不支持指向下方，也没有透明背景。

**必须表现：**
- 读取真实能力
- 将 CTA 改到安全侧区或 Cutaway
- 明确无 Mask 的降级
- 检查表演和口型

**失败判据：**
- 假装支持手势
- 强行做人物后景穿插

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `captions`

**场景：** 视觉解释片主视觉很丰富，只有 segment_exact。

**必须表现：**
- 使用稳定短句字幕
- 按语义换行
- 保护数字与单位
- 避免逐词高亮
- 检查平台安全区

**失败判据：**
- 所有词跳动
- 缩小字号塞三行

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `cutaway-planning`

**场景：** 数字人两段姿态跳变，旁白提到城市和海。

**必须表现：**
- 选择相关城市/海 B-roll覆盖切点
- 使用 L-cut 保留旁白
- 控制时长
- 自然返回人物

**失败判据：**
- 用无关空镜
- 每句都切走人物

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `depth-composition`

**场景：** 大数字在人物背后，产品从双手附近展开。

**必须表现：**
- 检查 Mask、手部、嘴和字幕
- 让数字遮挡后仍可读
- 检查整个运动路径
- 保持一个主中心

**失败判据：**
- 产品穿过身体
- 只检查稳定帧

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `effect-timing`

**场景：** “不是信息，而是判断力”需要对比动效，但只有 segment_exact。

**必须表现：**
- 优先自然拆分 SpeechSegment或做句级候选
- 在“而是”后建立第二对象
- 预览微调
- 记录非 word_exact

**失败判据：**
- 按字符均分时间
- 声称逐词精确

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `evidence-visualization`

**场景：** 旁白引用法规中的一条退款规定。

**必须表现：**
- 先建立文件标题和来源
- 再推近高亮对应条款
- 保留条件和日期
- 给足阅读时间

**失败判据：**
- 只裁结论
- 生成假的法规页面
- 夸张动画干扰阅读

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `export`

**场景：** 用户批准 Revision 27，项目已继续编辑到 29。

**必须表现：**
- 锁定 27 的 ExportSnapshot
- 检查 rights/quality
- 异步导出并 probe 文件
- 记录 checksum和署名

**失败判据：**
- 导出 latest 29
- Job succeeded 后不验文件

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `known-errors`

**场景：** OmniVoice POST 超时，项目不知道任务是否创建。

**必须表现：**
- 保存请求、幂等键和错误
- 查询 Run/Job/本地输出对账
- 确认副作用后再重试
- 报告结果未知或恢复

**失败判据：**
- 立即重复提交
- 删除原错误
- 假装成功

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `presenter-motion-director`

**场景：** “马上 500 万粉丝，送 70 台平板，点击参与”数字人口播。

**必须表现：**
- 设计高密度 Hook
- 数字放人物后、产品放前景、CTA 放下方
- 人物动作与效果联合规划
- 之后安排安静段

**失败判据：**
- 每句话同样弹字
- 字幕、数字、产品和镜头同时强动

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `production-director`

**场景：** 用户提供 18 段数字人口播、一本书的文案、两条参考视频，希望生成 90 秒成片。

**必须表现：**
- 识别 Presenter 为主路线、Explainer 为局部路线
- 加载语义、人物动效、视觉规划、字幕、声音、Remotion 和质量 Skills
- 先稳定主声音，再做包装
- 在质量复核前不宣布完成

**失败判据：**
- 只生成 Timeline 就结束
- 强制调用 Vlog Director
- 未建立观众承诺

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `project-basics`

**场景：** Web 已将项目从 Revision 12 改到 13，Codex 基于 12 想修改一个 EffectCue。

**必须表现：**
- 拒绝陈旧写入
- 读取 Revision 13 和目标对象
- 重新判断后提交
- 读回 ImpactReport

**失败判据：**
- 强行覆盖
- 把聊天中的旧对象当最新状态

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `quality-verification`

**场景：** 候选视频技术渲染成功，但用户感觉效果一般。

**必须表现：**
- 做四轮审片
- 区分技术与审美
- 按模式检查
- 找根因并做一次最小修订
- 绑定 Revision

**失败判据：**
- 因 MP4 存在就通过
- 只看局部截图
- 无限自修

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `remotion-production`

**场景：** 需要表现“金钱不是自由，但可以购买时间”。

**必须表现：**
- 先写 Design Map
- 用关系/状态而非文字卡片
- 设计 Settled Frame
- 运动有准备、稳定和保持
- 真实合成验证

**失败判据：**
- 默认玻璃卡片+Glow+Spring
- 只看组件透明画布

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `scene-planning`

**场景：** 同一手机 UI 需要展示三个渠道的价格和附加服务。

**必须表现：**
- 共享一个 UIWalkthrough Scene
- 逐项 Reveal
- 定义 Entry/Settled/Exit
- 只在认知模型变化时切 Scene

**失败判据：**
- 每张价格卡单独 Scene
- 没有稳定状态

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `semantic-continuity`

**场景：** 原话有两次重录：第一次情绪好但中间卡顿，第二次完整但平淡。

**必须表现：**
- 比较完整度、情绪、前后衔接和画面
- 不默认后一次最好
- 保留完整思想
- 实听切口

**失败判据：**
- 从两个残缺 Take 拼出从未说过的句子
- 删除所有停顿

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `transcription`

**场景：** 3 分钟口播需要转写和定位重录。

**必须表现：**
- 动态读取 FunASR workflow detail
- 保存原始 text
- 需要时间时先做 VAD 真切片
- 不伪造词级时间
- 回听专名和否定词

**失败判据：**
- 按字数估算 WordTiming
- 把 ASR 分块直接当剪辑单位

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `visual-explainer-director`

**场景：** 解释不同票价、舱位与退票规则。

**必须表现：**
- 使用稳定座舱模型
- 逐组着色、标签、价格和规则
- 在模型、真实素材和证据间交替
- 字幕稳定

**失败判据：**
- 每句话一页 PPT
- 一次展示全部信息

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `visual-treatment-planning`

**场景：** 读书口播包含“金钱与自由、城市和海、把快乐推迟到以后”。

**必须表现：**
- 分别判断对比 MG、真实 B-roll、Remotion 时间隐喻和保持人物
- 建立 AttentionCurve
- 记录不处理方案

**失败判据：**
- 每个名词找库存素材
- 所有句子做卡片

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `vlog-director`

**场景：** 旅行素材包含出发、迷路、找到目的地、人物反应和夜景。

**必须表现：**
- 按事件聚类
- 保留迷路和反应形成变化
- 维护方向和环境声
- 夜景用于收束

**失败判据：**
- 只选最漂亮镜头
- 全按音乐强拍切
- 用 MG 代替故事

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `voice-production`

**场景：** 使用 8 秒参考音频克隆声音，Script 中一处改写。

**必须表现：**
- 按语义分 SpeechSegments
- 只重生成受影响 Segment
- 下载每段并 ffprobe
- 组装 segment_exact 时间
- 连续回听相邻段

**失败判据：**
- 创建远端 VoiceProfile
- 按字符数切段
- 用文本长度估算时长

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `web-editor-operator`

**场景：** 产品图在人物前景稍微挡住嘴，需要微调。

**必须表现：**
- 用对象 ID 定位
- 记录原位置和 Revision
- 小幅调整并检查进入/稳定/退出
- 读回新 Revision

**失败判据：**
- 随机拖动
- 只看静态一帧
- MCP 已写入后重复提交

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告
