# Remotion Production 验收

## 组件冒烟与创作测试分开

组件冒烟允许在展示视频中覆盖全部 Registry，验证 Props、AssetBinding、局部时间、横竖屏、进入/稳定/退出和 Render。创作测试只使用内容真正需要的组件。

## 代表性样例 Gate

对一组 MG 先创建一个真实 Beat 样例，检查 Design Map、Settled Frame、人物/字幕、Style 和时机。样例通过后才能批量生产。

## 局部时间

创建一个在 Timeline 后半段出现、绑定短视频 Asset 的 Cue，验证其内部视频从局部第 0 帧播放，而非 Composition 全局帧。

## Player/Render 一致

同一 Revision 的 Web Player、局部 Preview 和最终导出在关键帧上的布局、字体、Asset 和时序一致。

## Anti-PPT

解释片至少有一个持续大 Scene 内部渐进；同一视频中不同观众任务不应都使用相同圆角卡片和相同 spring。
