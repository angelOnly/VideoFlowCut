# VideoFlowCut Professional Skills Suite

这是一套面向 VideoFlowCut 的完整专业 Skills 草案，覆盖架构文档中定义的 **23 个 Skills**。它不是只描述业务流程的占位文件，而是把剪辑、导演、声音、文字、视觉、动效、证据、素材和质量判断写成可执行的 Agent 方法。

## 目录

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

## 推荐阅读顺序

1. `.agents/skills/_shared/editorial-principles.md`
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

## 集成方式

将本包中的：

```text
.agents/skills/
```

复制到 VideoFlowCut 仓库根目录。先保留当前实现做对比，不建议未经审查直接覆盖。逐个检查：

- 实际 MCP 工具名；
- 项目对象名；
- Web 对象定位能力；
- 当前 Scene/Effect Registry；
- 运行中的 API 合同。

Skills 内没有直接查询数据库或实现 MCP。执行时始终以实时工具 Schema 和项目状态为准。

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
