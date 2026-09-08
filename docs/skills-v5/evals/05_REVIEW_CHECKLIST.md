# 人工审阅本 Skills 包的检查表

## 写作

- 主工作流是否能独立读懂完整生产过程；
- 小标题后是否有足够解释，而不是一行关键词；
- 是否解释为什么、相似情况差异和错误观看感受；
- 清单是否只用于执行与防漏；
- Reference 是否足够完整且可选。

## 架构

- project-basics 是否独立承担平台合同；
- production-director 是否只做路由与 Gate；
- 三个主工作流是否真正收口；
- remotion-production 是否是完整子工作流；
- visual-asset-sourcing 与 cutaway-planning 是否分工；
- quality-verification 是否取得证据而非只看成功。

## 当前代码

- 当前工具和字段没有被描述为缺失；
- 架构目标没有被写成已经实现；
- 兼容 `create_presenter_timeline` 没有成为正式路径；
- EffectCue Props/AssetBinding/Motion/StylePack 被正确描述；
- draft/delivery 和 Preview Evidence 被正确描述。

## 本轮文档对齐与待评审需求

- 原声字幕、最终旁白字幕、对齐精度、受管作品、音效事件、有限多机位/音乐与修复隔离等已实现行为，是否以代码和实时 Schema 为准；
- 工具旧设计名称是否标出当前入口或未实现状态，是否误要求不存在的 `.codex/config.toml`；
- 单件参考文字审阅、项目 Preview 五轮、Artifact 技术检查、实际成片复核和用户批准是否分开；
- 参考可选、原创中性审阅、多 Beat 覆盖、完整段落交接是否标为待评审，并明确替代哪些旧规则；
- 是否保留导演、原创构思、美术/运动、版本/失效及两类成片验收的完整链路，未将本次需求缩成案例目录；
- 当前 24 个 Skill 与拟新增五份案例 Skill 是否分开，旧报告是否保留历史身份，未执行的测试是否仍明确为未执行。
