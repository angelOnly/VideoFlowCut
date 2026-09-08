# Remotion Production 验收

## 组件冒烟与创作测试分开

组件冒烟允许在展示视频中覆盖全部 Registry，验证 Props、AssetBinding、局部时间、横竖屏、进入/稳定/退出和 Render。创作测试只使用内容真正需要的组件。

当前还支持受管 ManagedMotion 作品，需与 Registry 组件分开验收：四站参考必填、受限 TSX 提交、Job 固定快照、Asset 固定版本、参考审阅、Cue 放置与真实合成。passed/inconclusive 可放置，failed 不可；inconclusive 仅待审，不能直接交付。本轮是规范对齐，不是上述测试的运行报告。

## 代表性样例 Gate

对一组 MG 先创建一个真实 Beat 样例，检查 Design Map、Settled Frame、人物/字幕、Style 和时机。样例通过后才能批量生产。

## 局部时间

创建一个在 Timeline 后半段出现、绑定短视频 Asset 的 Cue，验证其内部视频从局部第 0 帧播放，而非 Composition 全局帧。

上例适用于支持视频绑定的 Registry 组件。受管 TSX 当前只支持其 Schema 允许的图片等资源，不能把 Registry 的视频能力推给 ManagedMotion；后者验证透明帧按 Cue 局部帧寻址、固定画布/时长/FPS、代理与 Alpha 合成，实拍和声音由正常素材轨承载。

## Player/Render 一致

同一 Revision 的 Web Player、局部 Preview 和最终导出在关键帧上的布局、字体、Asset 和时序一致。

## Anti-PPT

解释片至少有一个持续大 Scene 内部渐进；同一视频中不同观众任务不应都使用相同圆角卡片和相同 spring。

## 固定作品与事件

修改源码、Props 或绑定内容应生成新作品版本；审阅不跨版本继承。当前 Cue 保持一个宿主 Scene，变更内部内容不能用 Inspector 随意改参数代替生成。检查 Rear/Actor/Front/Fullscreen 与字幕的真实层序、透明合成及连续播放，完整时间覆盖只证明结构。

作品绑定 SFX 时，纯平移跟随局部事件；换版或时长等签名变化导致旧音效 stale 并禁用，须明确复核。当前单件参考审阅只有文字结果，不能冒称已完成合成 Preview 的媒体证据校验。

## 待评审的新合同验收

按[完整方案第 7–8 章](../../VideoFlowCut_动效案例阅读包/完整开发方案.md#7-代码与接口调整)，后续开发验证 `creativeBrief` 与可选 reference、新审阅 outcome/版本/evidence、旧 Job/哈希兼容、显式多 Beat 覆盖和非主锚点失效。保留已有真实 Alpha/隔离回归；无参考原创必须完成真实代表段和合成审阅。以上尚未开发，本轮不将静态案例或单帧改名为“连续原创通过”。
