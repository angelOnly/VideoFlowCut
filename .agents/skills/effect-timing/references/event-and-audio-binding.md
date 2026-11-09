# 事件、起音与音频Item映射

## Event Anchor 与物理 Item 的区别

同一范围事件可选起势或落定的单次声音：不填写 endLocalFrame，localFrame 使用实际起点或终点（作品末尾按最后一帧）；需要完整持续声时才同时绑定起止范围。不要因为视觉动作持续三秒就强制所有音效也持续三秒。

受管作品有 eventMap 时，声音绑定提供 eventId 与 workVersion；事件 startFrame/endFrame 保持完整作品的根坐标，按 eventMap.fps 换到项目帧率。事件从 MotionWork 读取，先换到项目 fps 再减 Cue 的完整作品源入点、加目标起点；派生媒体根偏移只由媒体层扣除；Cue 源入点、出点采用项目 fps。先选动作开始、落定或维持中的听觉锚点，再设置相对视觉偏移。持续声音显式填写时长或已复核的循环，不用一个短声音的起点冒充整段声音结构。作品平移可以跟随。明确采用新版本时，可用 on_success 委托平台对实际事件ID、含义、起止根帧、映射及声音偏移做同事务核对；不变事件自动重绑，相关变化返回 needs_reconfirmation 并保持原画面与音轨。自动重绑不表示重新听过；内部节奏变化交原负责人明确落点。

“Ding 应在结论被听见时发生”是 Event Anchor。SFX Item 可能要更早开始，因为文件前导；动画也可能要更早进入，让稳定帧在结论落音。把所有 Item startFrame设为语义帧会导致观众实际感知错位。

当前 `manage_audio` 保存 media_event、onsetOffset 与可选 effect_event。声音需要与某次画面动作同步时，使用真实 Cue、作品版本、事件身份、根帧和已确认的声音偏移完成绑定。具体参数按当前 Schema 填写。

画面返修前，查看被改动的动作是否已经绑定音效或其他声音。没有声音绑定的动作，由视觉与制作作者按授权调整。已经绑定声音且动作时刻或含义发生变化时，由原声音作者重新安排对应声音的落点，再复看声画。动作及绑定关系未变时，沿既有采用流程核对并更新作品版本。正式采用返回 `needs_reconfirmation` 时，按回执定位实际受影响的绑定，由原负责人处理后继续提交。作品、Cue 和音轨的采用结果以正式回执为准。

冲突需要重排时，声音与视觉作者先确定新落点。主任务保存旧绑定，通过 `manage_audio(effect_event=null)` 解除受影响关联，再按最新 Revision 使用 `manage_effect_cues(action=adopt_work)` 采用已登记的新作品。随后依据新 Cue 的实际事件和版本更新声音时刻及绑定，复看声画。每步保留回执，失败后从已完成位置继续。

事件时序不变的正式局部采用走[原子范围替换](../../opendesign-video-production/references/submission-and-recovery.md#同源局部校样与正式范围)：平台同时更新前、中、后 Cue 和已有声音事件引用，边界事件按半开区间归属，不复制声音。写后读回真实绑定并复核接点；仅改音量或普通字幕不提交新 motion Job，缓存命中不代表听审通过。

## 当前写入和验证

普通 Registry Cue 可修改 Motion；ManagedMotion 内部时序由源码/Props 固定，需重新生成版本。整体平移只改变 Cue 时间，内部重定时必须重新交付事件帧、读回 stale AudioCue 并复核。

使用 `manage_effect_cues` 写入 start/end、semantic_anchor、motion 和 quality_rules。当前 MotionLayoutCompiler 已消费 `spatial_anchor`、进入/稳定/退出预设与 `style_pack_id`；不同组件的实际曲线、素材布局和人物关系仍必须以 Preview 验证。写后读取 Impact，渲染目标范围，检查进入、中间、Settled、退出和前后完整语句。

### 将感知落点转换为音频范围

统一使用项目帧率，把所选源片段开头定义为零点。设可听起音相对偏移为 O，主要攻击相对偏移为 P，希望攻击对齐的视觉帧为 V，则音频 Item 起点为 V−P，可听起音事件帧为 V−P+O。当前 `manage_audio` 的 `onset_offset_frames` 填 O，`event_frame` 填可听起音事件帧；不能把攻击峰值偏移误称起音偏移。对于没有明显渐强的短音效，O 与 P 可能接近，但仍需实际确认。

这只是定位方法，不是自动检测能力。预进入、主要攻击与尾音的数值来自所选文件与源范围，不能用示例数值或统一零偏移。若计算越过 Timeline/Scene 的可用范围，选择更短攻击的候选或重新设计事件，不截掉必要起势后声称同步完成。
