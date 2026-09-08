# 静态路由与结构验收

## 目录

- 精确存在 24 个运行时 Skill；
- `visual-asset-sourcing` 存在；
- 不存在空的 `shader-production` 或 `multicam-sync`；
- 所有 Front Matter `name` 与目录一致；
- 主工作流引用的专项 Skill 存在；
- Reference 链接存在且每份是完整章节，不是短知识卡；
- 当前插件 `.codex-plugin/plugin.json` 的 Skills 入口、`.mcp.json` 和 launcher 路径存在，源目录与同步镜像关系正确；仓库当前没有 `.codex/config.toml`，只有以后实际使用时才检查其登记。

当前 24 个 Skill 是现状断言。阅读包中的五份案例 Skill 尚未接入运行时；获准开发并完成同步后，才按实际范围更新数量、非 Markdown 案例材料及路由测试，不能先把断言写成 29。本轮只更新验收文档，未执行接入测试。

## 路由

- 完整人物口播：`project-basics → production-director → presenter-motion-director`；
- 完整解释片：`project-basics → production-director → visual-explainer-director`；
- 完整 Vlog：`project-basics → production-director → vlog-director`；
- 局部字幕：`project-basics → captions → quality-verification`；
- 局部 Remotion：`project-basics → remotion-production → quality-verification`；
- 混合视频只有一个主要工作流，第二工作流仅处理明确 Scene。

测试必须拒绝“同时加载很多专项 Skill 就算完整工作流”的实现。
