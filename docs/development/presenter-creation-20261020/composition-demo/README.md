# 六类人物编排制法：隔离技术示范

这是开发验证资产。画面中的运动测试图案代替人物，不能据此判断真人取景、交流、表演、口型或成片审美。

- [带测试音的视频](six-methods.mp4)：18 秒，480 × 270，15 fps，904,242 字节。
- [受管动效原始静音输出](six-methods-silent.mp4)。
- [完整测试源](source-clock.mp4)：20 秒，240 × 240，15 fps，带源帧号、时间、运动和 440 Hz 测试音。
- [18 张关键帧总览](keyframes-contact.png)与 [关键帧目录](keyframes/)。
- [实际提交源码](PresenterMethodsDemo.tsx)、[复现脚本](render-demo.ts)、[验证记录](verification.json)。

| 时间 | 具体验证 |
|---|---|
| 0–3 秒 | 先选源取景再裁圆，头像与材料空间重新分配 |
| 3–6 秒 | 纸边、视频、附着标记在同一父层平移和旋转 |
| 6–9 秒 | 分屏使用同一进度重新分配空间，源内部保持等比取景 |
| 9–12 秒 | 设备外框与屏幕内视频共同旋转、移动和缩放 |
| 12–15 秒 | 人物退出后只绘制材料，原作品时钟继续 |
| 15–18 秒 | 人物从当前源帧返回，再由主画面缩为小窗 |

复现时，从仓库根目录执行：

```powershell
node --import tsx docs/development/presenter-creation-20261020/composition-demo/render-demo.ts
node --import tsx --test tests/presenter-composition-methods.test.ts
```

脚本读取维护源 `presenter-material-choreography.md` 的两段完整 TSX，拼入本示范场面。没有另建运行时人物组件库。使用项目已有 `createApplication → submitManagedMotion → runMotionJob` 链，独立临时目录与数据库直接执行开发 Job，不连接生产 Runtime 或队列。需要已有 Node 依赖、FFmpeg、可用 Chromium；测试源帧标使用 Windows 自带 Arial。

受管动效产物保持静音。审阅版由 FFmpeg 将原测试源的 1–19 秒音轨附回，仅方便观察持续时间；这一步不等同于平台 Dialogue 合成或真人口型检查。完整源、实际源码和视频都保存在本目录；临时项目位置记录于 `verification.json`，无需该临时项目即可播放交付视频。

本次 4 个回归测试通过：直接运行参考原文几何、父变换、分屏关系，以及真实视频隐藏后换位置返回。后者通过现有渲染链生成 6 帧，与原视频当前帧逐像素比较。18 秒示范的返回帧另行验证：作品 F225 对应源 F240，F237 对应源 F252，RGB 平均绝对误差分别约 1.886 和 2.153（编码容差上限 12），没有从片头重播。

已检查 18 张关键帧总览的形态、内外框与主要阶段。视频完成 270 帧渲染和技术核验；这里没有把关键帧检查称为连续人工观片，没有调用 LTX，也没有真人口型或审美验收结论。完整人物成片及原解说创作回归仍须使用实际内容单独验证。
