# HyperFrames 受管源码合同

以 `read_motion_capabilities.html` 为实际能力依据。当前引擎 `managed-hyperframes-1`，固定 HyperFrames 0.8.1、GSAP 3.14.2；正式源码容量为 2,000,000 字符。完整单页 HTML，CSS 与普通 JavaScript 内联。平台提供运行库，移除 CDN、模块导入、外部样式和原生音视频，不复制 OD 的预览播放器。

## 入口、初始化与时间

一个根元素声明 `data-composition-id`、`data-start="0"`、`data-width`、`data-height`、`data-duration`。尺寸与 work 相同，duration 为 `durationInFrames/fps` 秒。嵌套层可自行编排，但根时间线必须以根 ID 注册到 `window.__timelines`，保持暂停，其 `totalDuration()` 与作品时长一致。

平台按图片与实际字体就绪 → 作者脚本 → 主时间线注册 → HyperFrames ready → 根时间求值 → 视频注帧 → 绘制稳定的顺序运行。作者的普通内联脚本按文档顺序执行，此时 DOM 和绑定资源已就绪；直接初始化，不等待 DOMContentLoaded。使用 `gsap.timeline({paused:true})`，动作、回调与事件使用共同时间依据。制作初稿不要求逐镜秒表；正式源码和提交使用本轮最终确定的时长。

平台注入 `window.vfc`：

- `props`：提交的 JSON，额外保留 `assets` 和 `fonts`；提交者不能覆盖这两个字段。
- `config`：`width`、`height`、`fps`、`durationInFrames`。
- `assets[slot]`：图片的受管地址，等同于 `props.assets[slot]`。
- `fonts[slot]`：实际 `family`、`weight`、`style`，等同于 `props.fonts[slot]`。
- `geometry`：原有 `fitSource`、`focusCover`、`sourcePoint`、`parentPoint`、`frameMapping`、`previewRange` 纯函数，参数见[空间与时间](material-space-and-time.md)。

## 图片与受管动态视频

图片沿 `imageBindings` 绑定真实 Asset；`<img data-vfc-image-slot="photo">` 或 SVG `<image data-vfc-image-slot="photo">` 由平台填充资源。背景与遮罩使用 `var(--vfc-image-photo)`，其值已是 `url(...)`；脚本可用 `vfc.assets.photo`。不得同时在槽元素上填写 src/href/srcset，不保留 OD 临时文件路径。图片按原有解码与资源预算处理。

视频沿 `videoBindings` 固定 Asset、哈希、源毫秒范围和作品根帧范围。使用稳定 ID 的 `<img id="presenter" data-vfc-video-slot="actor">`，CSS `object-fit` 与容器处理取景。平台设置 timed-media 的 data-start/data-duration，每个根帧由原 MotionVideoProvider 提供静音画面；区间外隐藏。多个窗口可使用同一槽位、不同稳定 ID，源时刻一致。容器移动、缩放、显隐和嵌套不重新开始源视频；不要改写平台控制的 src 和范围。

`sourceStartMs/sourceEndMs` 是源毫秒，`startFrame/endFrame` 是作品根帧，均为半开区间；按 fps 正常速度重采样并静音。时长匹配允许 1 毫秒取整与不足一帧余量，不能变速或冻结末帧补齐。所有槽元素须在作者初始化结束前建立，后续动画保持同一 DOM 元素。

原声、旁白、音乐、音效和普通字幕在原正式链路中合成。透明叠加不画不透明底；完整主画面明确外层像素接管范围，不能把观察 MP4 当成正式透明资产。

构图由本片内容决定，不强加统一标题栏或固定字幕保留带；普通字幕按全片规范置于最终合成独立层。

## 字体身份与实际字重

`fontBindings` 映射已登记 fontId。平台验证实际文件并在作者初始化前加载。CSS 使用 `font-family:var(--vfc-font-title)`，实际字重与样式使用 `vfc.fonts.title.weight/style`。字形测量应在作者脚本执行时进行。字体选择与缺失处理见[提交与恢复](submission-and-recovery.md#字体可用性与替代)。

字体原件哈希、实际字重和样式进入作品身份；已绑定字体加载失败不回退系统字体，沿原 Job 保存诊断。

## 动作事件

可选 `window.getVfcMotionEvents()` 从同一时间线的标签或命名时序返回 `{id,meaning,startFrame,endFrame?}` 数组，最多 100 条。帧为根帧整数、ID 唯一、半开范围位于完整作品内。平台按现有规则生成 `Asset.motion.eventMap`，不提交第二张手填事件表。源码或真实时序变化后重新生成并校准声音；文字说明修改不触发渲染。

## 随机与碰撞的任意帧重建

任何时刻可独立求值，顺播、回跳和局部校样结果一致。随机数据在初始化时用固定种子确定；模拟使用按时间可重建或预计算状态。禁止依赖播放历史累计、真实时间或外部网络。CSS/Canvas/SVG 都须遵守根时钟，不能用无限自主计时绕开主时间线。Worker 会重新定位样本帧并比较实际 PNG，失败保留差异诊断，不降低原阈值。

## 提交与恢复

主任务提交完整 HTML、Props、绑定与画布时长，沿原 Job、幂等键、资产完成和 Cue 放置。局部 `frame_range` 使用完整源码与根时钟，只生成校样，不登记正式资产。失败与未知结果读原 Job，资源变化不得悄悄覆盖冻结输入。旧 TSX 新提交被拒绝，已完成历史资产仍可读取；不提供双引擎回退或自动迁移。

静态检查覆盖 HTML 文本与已知 Props，Worker 检查实际 DOM；Canvas、路径绘字和素材内文字仍需实际审阅。技术成功不证明作品效果、连续观看或声音检查完成。
