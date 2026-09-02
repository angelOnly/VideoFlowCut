# VideoFlowCut Professional Skills V4

V4 是单文件专业 Skills 版本。每个 Skill 目录只保留一个 `SKILL.md`；核心专业知识、完整解释、案例、反例、执行边界和最终检查全部内置。

## 为什么从 V3 改成 V4

V3 的专业正文已经比早期版本完整，但仍把许多只有几段内容的知识拆进 `references/`。这会让知识碎片化、增加遗漏概率，并让人工审阅和后续维护变得困难。V4 保留 23 个 Skill 名称和当前代码能力合同，但将同一专业任务的知识重新合并为一篇连续手册。

## 目录

```text
.agents/skills/
├─ _shared/                         少量真正跨 Skill 的合同
├─ production-director/SKILL.md
├─ presenter-motion-director/SKILL.md
└─ ... 共 23 个单文件 Skill
```

## 接入

1. 备份项目当前 `.agents/skills/`。
2. 用本包的 `.agents/skills/` 整体覆盖。
3. 不再保留 V2/V3 的 `references/` 目录。
4. 不在 `docs/` 中保留第二棵可运行 `.agents/skills/`。
5. 重新加载受信任项目并运行静态检查、Skill 行为 Eval 和真实 Presenter 验收。

## 基线

- VideoFlowCut：`main@70063767d11fb3175d68ef6a7ce83d599af16545`
- FunASR、OmniVoice、MiniMax H3：以项目 `docs/asr接入.md` 和每次运行时 Workflow Detail 为准。
