# 专项 Skill 交接验收

每个专项 Skill 都要验证四件事：读取正确 Revision 和输入对象；产生项目对象或明确可执行决定；Impact/stale 范围符合预期；主工作流使用结果并完成相应结构/画面/声音验证。

重点场景：

1. 修改 Script 后，旧 SpeechAsset、Caption、EffectCue、Cutaway 和 ActorPerformance 的影响可读；
2. Visual Treatment 已经决定保持人物后，素材搜索和 Remotion 不重新猜成高密度包装；
3. 搜索到 B-roll 后，Cutaway Planner 仍决定是否使用、全屏/PiP、时长、声音和返回；
4. EffectTiming 的段级精度不能被 Caption 或 Remotion 扩大为 word_exact；
5. Quality Finding 能退回正确负责人；
6. SkillExecutionReport 缺失时项目仍可编译；只有 loadedSkills 而没有对象/证据时测试失败。

第 6 项只说明报告不参与画面编译。正式生产收口和 delivery 仍需适用报告及五轮审阅证据，不能由“可编译”推导“可交付”。

## 现有修复的交接场景

- 原声剪辑通过 `edit_presenter_source` 保持源音画同步；字幕卡若被切穿，先使用真实 Provider token 重分屏。显示纠错保留原声时间，不能重写台词或伪造 word_exact；最终旁白字幕则绑定当前 SpeechAsset。
- 动效 SFX 保存局部事件、可听 onset 与偏移；Cue 纯平移跟随，作品/Props/时长/事件签名变化时 AudioCue stale 并禁用，重新复核后显式恢复，不能靠移动自动复活。
- 单件 `review_motion_work` 当前仍是 `referenceMatch` 文字审阅；成片 `record_editorial_quality_review` 校验当前 Revision 的真实媒体与范围，两者不得互相替代。inconclusive 可进入待审合成，不可交付。
- 审片问题跨 Run/Revision 保留，空 findings 不清除旧问题，resolutions 必须带新证据。Preview 五轮、导出技术检查、实际 Artifact 五轮复核和用户批准分别交接。
- 平台阻断返回独立 RepairTicket；修复任务在候选 Runtime 验证后发布，原剪辑任务重连并确认部署，修复任务不代替其操作正式项目。

## 待评审扩展

[完整动效方案](../../VideoFlowCut_动效案例阅读包/完整开发方案.md)拟增加完整段落交接、原创作品证据与多 Beat 覆盖。获准实现后验证非主锚点变化、固定时长保护及旧版本兼容；本轮未将它们当作当前能力或通过结果。
