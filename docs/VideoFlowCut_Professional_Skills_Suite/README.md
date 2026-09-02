# VideoFlowCut Professional Skills Suite（历史评审资料）

这里保留早期 23 个 Skills 的评审、目录和来源资料。其可执行 `.agents/skills/` 已由 V5 接入根目录并移除，避免与当前运行时 Skills 形成第二个权威来源。

## 已归档的原始结构

```text
.agents/skills/
├── _shared/
└── 23 个项目 Skills
```

每个专业 Skill 默认包含：

- `SKILL.md`：触发、证据、专业判断、执行流程、禁止行为、验证和退出条件；
- `references/`：按需加载的专业知识，避免把所有内容塞进主文件；
- 与项目 MCP 的职责边界；
- 对真实合成画面和完整声画的验证要求。

## 当前推荐阅读顺序

1. `.agents/skills/_shared/EDITORIAL_FOUNDATIONS.md`
2. `.agents/skills/production-director/SKILL.md`
3. 当前主模式：
   - 人物口播：`presenter-motion-director`
   - 视觉解释：`visual-explainer-director`
   - Vlog：`vlog-director`
4. 专项 Skills：
   - `semantic-continuity`
   - `visual-treatment-planning`
   - `remotion-production`
   - `captions`
   - `audio-finishing`
   - `quality-verification`
5. `SKILLS_CATALOG.md`
6. `SKILL_EVALS.md`

## 当前使用

运行时唯一来源是根目录 `.agents/skills/`。V5 的结构、主工作流、交接合同和 MCP 输入约束以 `docs/skills-v5/`、根目录 `AGENTS.md`、`.agents/skills/_shared/MCP_EXECUTION_CONTRACT.md` 及其静态测试为准。

## 本套 Skills 的设计原则

- 以 ChatCut 原生 Skills 的结构和专业工作流为主要参考；
- 以旧项目影视与剪辑书籍研究补充导演、节奏、注意力、连续性、声音和文字判断；
- 以两条参考视频拆解补充视觉解释片和人物前后景动效语法；
- 以 VideoFlowCut 当前 Story、Scene、Timeline、Revision、Remotion 和 MCP 架构为运行对象；
- 区分技术验证与审美通过；
- 每个重要决定要求证据、替代方案、观众效果和验证。

## 文件规模

- Skills：23
- Markdown 文件：104
- 专业知识与说明行数：约 6921
