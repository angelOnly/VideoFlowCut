# HyperFrames 受管源码合同

以连接 Runtime 的 `read_motion_capabilities.html` 为实际能力依据；本版源码引擎为 `managed-hyperframes-4`，固定 HyperFrames 0.8.1、GSAP 3.14.2，正式源码容量为 2,000,000 字符。完整单页 HTML，CSS 与普通 JavaScript 内联。平台提供运行库，移除 CDN、模块导入、外部样式和原生音视频，不复制 OD 的预览播放器；未切换的 Runtime 不冒称支持本版接口。

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

## 作者交件与冻结输入

作者清单保留实际作品名、创意说明、画幅、帧率、完整时长、画面用途、Props 和图片/视频/字体槽的真实绑定，以及明确可检查范围；它不复制源码正文，不替作者推测素材角色。作者明确交件后由交件工具配对源码和清单，冻结时核对两者摘要与当前 Run 的真实归属。源码与清单的完整固定字节经正式导入入口交给 VFC，由 VFC 组装既有 work 并校验。冻结包只是受管输入，不是正式 Asset、预览或审阅。

`read_motion_capabilities` 的 `authoredManifestContract` 与正式交件准备结果的 `contract_version` 标识同一作者清单版本；两侧均提供时应一致。该合同只约束清单字段，具体作品、资源和源码仍由 VFC 动画引擎验证；版本缺失不能冒称已核对一致。

## 动作事件

可选 `window.getVfcMotionEvents()` 从同一时间线的标签或命名时序返回 `{id,meaning,startFrame,endFrame?}` 数组，最多 100 条。帧为根帧整数、ID 唯一、半开范围位于完整作品内。平台按现有规则生成 `MotionWork.eventMap`，不提交第二张手填事件表。正式范围媒体保留根事件坐标，按完整作品根帧、Cue 源入点及项目 fps 映射到声音；范围替换沿[提交合同](submission-and-recovery.md#同源局部校样与正式范围)同步现有绑定。真实时序变化后重新生成并校准声音；只改普通字幕、声音或制作说明不提交新 motion Job。

## 随机与碰撞的任意帧重建

任何时刻可独立求值，顺播、回跳和局部校样结果一致。随机数据在初始化时用固定种子确定；模拟使用按时间可重建或预计算状态。禁止依赖播放历史累计、真实时间或外部网络。CSS/Canvas/SVG 都须遵守根时钟，不能用无限自主计时绕开主时间线。逐帧身份使用规范化 RGBA 像素的 SHA-256（`frameHashKind=rgba-sha256`），正式媒体另验文件哈希；只保存少量检查 PNG。Worker 重新定位样本帧比较像素，差异继续按现有可见容差诊断，不降低阈值；技术通过不代替观看。

## 提交与恢复

主任务提交完整 HTML、Props、绑定与画布时长，沿原 Job、幂等键、资产完成和 Cue 放置。`frame_range` 使用作品根帧与完整根时钟，默认生成校样；显式 `output_intent=asset` 登记正式范围媒体，`proof_job_id` 可让新的正式 Job 采用同版成功校样而不重捕获，详见[局部提交](submission-and-recovery.md#同源局部校样与正式范围)。`Asset.motion.rootRange` 保存作品 fps 下的 startFrame/endFrame/fullDurationInFrames，`frameCount` 是实际媒体帧数；Cue 的源入点、出点按项目 fps 表示，不能混用。失败与未知结果读原 Job，资源变化不得悄悄覆盖冻结输入。旧 TSX 新提交被拒绝，已完成历史资产仍可读取；不提供双引擎回退或自动迁移。

静态检查覆盖 HTML 文本与已知 Props，Worker 检查实际 DOM；Canvas、路径绘字和素材内文字仍需实际审阅。技术成功不证明作品效果、连续观看或声音检查完成。
