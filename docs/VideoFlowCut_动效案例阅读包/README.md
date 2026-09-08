# VideoFlowCut 动效案例阅读包

本目录保留素材理解、动效与声音的开发方案，并提供当前案例库的阅读入口。2026-09-08 按用户确认，案例资料统一为最新选定的六项：正文、视频、源码和参数只维护在根目录 `.agents/skills/`，本目录不再保存另一套案例副本。

本次统一只调整案例说明、目录和链接，不改变各开发方案的功能范围、审批状态或实现状态，也不修改运行时 Skill、源码、配置、服务或正式视频项目。

## 开发方案阅读顺序

1. [素材理解与多模态检索开发方案](素材理解与多模态检索开发方案.md)：第 1–3 章为现状与公共架构，第 4–10 章为外部模型、分段覆盖、多模态观察、检索、采用和任务，第 11–17 章为纠错、开发落点、声音依赖、验收与数字人 B-roll 示例。
2. [音效链路优化开发方案](音效链路优化开发方案.md)：第 3–5 章说明分工、在线选材和旁白前置设计；第 6–11 章说明共用模型/检索基础及声音数据、同步、混音和工具；第 12–15 章说明代码落点、失败处理、验收与完整案例。
3. [完整开发方案](完整开发方案.md)：0.3–0.4 节说明声音与素材理解联动，第 3–5 章为正常制作链路，第 7.11 节为声画合同，第 8 章为联合验收，第 9 章说明统一案例库，第 10 章汇总开发范围。
4. [主架构第 28 章](../ai_video_platform_architecture_development_plan.md#28-连续原创动效待评审需求与旧规则替代关系)、[第 29 章](../ai_video_platform_architecture_development_plan.md#29-在线声音链路待评审优化方案)与[第 30 章](../ai_video_platform_architecture_development_plan.md#30-通用素材理解与多模态检索待评审优化方案)：查看动效、声音与素材理解分别替代哪些旧规则，以及共用基础和实施依赖。历史代码基线、拟开发合同与当前发布能力分开阅读。

声音方案仍以在线查找为默认入口，项目保留实际采用原文件，不要求先建本地音效库；公共素材方案仍统一观察、覆盖、检索与采用依据。案例资料完成统一不代表这些方案已实施，也不代表案例已完成旁白、音效或数字人合成验收。

## 最新六个案例

[总案例 Skill：选型、共同原则与全部材料](../../.agents/skills/motion-case-library/SKILL.md)是唯一的案例总索引。下表仅提供快捷入口，生成方法、帧段、改写边界和验证说明直接阅读对应 Skill，不在文档包重复维护。

| 用户选定案例 | 案例说明与源码入口 | 选定视频 |
|---|---|---|
| 最早的 24 秒连续动效：SIM → 页面 → 撕纸 → 实拍 | [案例 Skill](../../.agents/skills/motion-case-sim-paper/SKILL.md) | [24 秒原版](../../.agents/skills/motion-case-sim-paper/assets/preview.mp4) |
| 认可的顺滑合集：SIM、QCI 与时钟 | [案例 Skill](../../.agents/skills/motion-case-smooth-relay/SKILL.md) | [19.23 秒合集](../../.agents/skills/motion-case-smooth-relay/assets/preview.mp4) |
| 机票价格 → 手机条款 → 日期 | [案例 Skill](../../.agents/skills/motion-case-ticket-phone/SKILL.md) | [8.6 秒](../../.agents/skills/motion-case-ticket-phone/assets/preview.mp4) |
| 产品扇开 | [案例 Skill](../../.agents/skills/motion-case-product-fan/SKILL.md) | [10 秒 v2](../../.agents/skills/motion-case-product-fan/assets/preview.mp4) |
| 封面滚动 | [案例 Skill](../../.agents/skills/motion-case-cover-flow/SKILL.md) | [10 秒](../../.agents/skills/motion-case-cover-flow/assets/preview.mp4) |
| 弹幕聚合 | [案例 Skill](../../.agents/skills/motion-case-comment-focus/SKILL.md) | [10 秒](../../.agents/skills/motion-case-comment-focus/assets/preview.mp4) |

六项不共用固定画幅、帧率或时长。24 秒案例包含外层实拍合成；19.23 秒是用户明确选定的三段合集，并保留分段视频、源码和交叠参数；其余四项为独立效果。各例 `fixture.json` 记录自身参数，不能按旧版“四个 14 秒无声案例”理解。24 秒容器含音轨也不等于已完成声音设计。

## 辅助资料与正式制作入口

- [停顿变顺滑的实际修订经验](../../.agents/skills/motion-case-library/references/timing-continuity.md)：区分空等、掉帧与同帧不一致，核对动作交叠及真实前后版本。
- [已观察机制与边界](../../.agents/skills/motion-case-library/references/observed-mechanisms.md)：核对历史研究依据，不把静帧或推导冒充完整动态观察。
- [Remotion 正式生产 Skill](../../.agents/skills/remotion-production/SKILL.md)：案例学习后回到段内设计、受管创作、合成与审片。正式接口以当前发布版本和实时 Schema 为准。

## 三处目录的维护关系

| 位置 | 职责 |
|---|---|
| `.agents/skills/` | 唯一案例维护源，包含总索引、六份案例 Skill 和对应素材。 |
| `plugins/videoflowcut/skills/` | 由现有同步脚本生成的发行副本，不单独编辑。 |
| `docs/VideoFlowCut_动效案例阅读包/` | 保留开发方案与阅读链接，不再放案例 Skill、视频、源码或参数副本。 |

旧阅读包（含旧四例与旧总索引）已保存为[统一前归档](../../.candidate/case-docs-unify-20260908/reading-package-before.zip)，仅供历史追溯，不作为当前推荐入口。当前链接依赖本仓库目录结构；只复制这个文档文件夹不再包含案例素材。文档入口更新不执行插件安装、MCP 部署或功能开发。
