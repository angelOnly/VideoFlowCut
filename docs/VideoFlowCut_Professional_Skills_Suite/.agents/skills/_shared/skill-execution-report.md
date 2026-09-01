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
