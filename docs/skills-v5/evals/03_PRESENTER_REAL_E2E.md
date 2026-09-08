# 《快乐的死》人物口播真实 E2E

## 目标

比较“平级专项 Skill 临时拼装”和“presenter-motion-director 主工作流统领”两个版本，验证主线、安静区、视觉选择、B-roll、字幕、声音和完整交付。

本例保留原 V5 对比任务，以下是执行规范，不是本轮实测报告。已导入原声视频和需要新语音的制作使用不同主线分支，不能为了满足产物清单统一重做语音或人物。

## 必需产物

- 主工作流选择记录；
- SemanticUnit 与最终 Script；
- 新语音分支：SpeechAsset / 真实 segment_exact；原声分支：源素材、同步保留范围与真实字幕对齐证据；
- A-roll、StoryBeat、PresenterScene；
- 每个重要 Beat 的 Visual Treatment；
- 至少一个明确安静区；
- 至少一个被拒绝的无关方案，例如“自由=海边”；
- 使用的真实 Asset/Provenance；
- EffectCue/Caption/Audio；
- Preview Evidence 与五轮 Editorial Review；
- draft 与 delivery Artifact。

## 预期创作结果

人物坦白和停顿保持人物；“钱”不机械做促销数字；“以后不断后退”可以进入机制解释；现实 B-roll 只在具体生活和情绪恢复时使用；全片不覆盖 11 个 Registry；字幕稳定；音乐在关键人物段退让。

## 失败条件

- 只记录 loadedSkills；
- 每句话一个效果；
- ProductFan、CommentCloud、Meme 等无关组件被强行使用；
- 无真实 Asset 的占位卡；
- 没有安静区；
- 只检查单张帧；
- Export succeeded 代替完整审片。

## 当前执行与交付边界

原声分支用 `edit_presenter_source` 的源帧 keep_ranges 同步剪音画，字幕按真实 token 重分屏并检查切口；新语音分支保留自然 SpeechSegment，用实际音频时长组装，必要时使用已实现的 Provider 字幕或强制对齐，不把估算升级为词级。现有人物素材的声音、Mask 和构图按能力事实交接，不能默认重新生成人物。

先保存当前 Revision 完整 Preview 的五轮审阅，再提交 delivery；生成后核验文件并对该 Artifact 登记五轮实际复核，用户批准绑定具体文件。草稿保留技术/权利门禁，审阅不足不应冒称正式通过。验收项目使用候选独立工作区，不写入正式剪辑项目。

## 连续原创动效待评审扩展

新需求另按[完整方案第 8 章](../../VideoFlowCut_动效案例阅读包/完整开发方案.md#8-开发顺序与验收)验证：无用户参考、无四站访问时仍能提交新作品；先真实代表段，再人物与解说各一条完整成片，并换题复验。人物段重点看同屏、全屏接管与返回，解说段看视觉模型、证据和素材衔接；二者都核对创作说明、当前作品版本和实际声画。

六组十二段案例迁移对照保留为独立待评审验收要求，不替代两类完整成片。本轮未开发这些新合同，未生成对照结果，也未新增空的 `07_CONTENT_DRIVEN_MOTION_REAL_E2E.md` 通过报告；后续实施时记录真实输入、版本、问题、修订与结论。
