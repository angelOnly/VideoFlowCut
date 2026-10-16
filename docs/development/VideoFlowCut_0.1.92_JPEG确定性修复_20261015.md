# VideoFlowCut 0.1.92 JPEG 确定性修复

## 原因与范围

用户授权修复全新作品生成时的 `MOTION_NONDETERMINISTIC`。原工单为 `repair_ticket_9b835ed4-4542-4fbd-ad97-52da12bb6ce4`，正式项目为 `project_2d1b22d5-41c3-4867-ad7c-27d16d63ca1b`、R119。平台修复不修改该项目、配音、字幕、素材绑定或动画源码。

0.1.91 两次完整生成均在 3607 帧完成后，于第 1803 帧复查失败。肖像区域 176766 个像素有非零差异，最大通道差 3，超过既有门槛 2。该门槛不是 0.1.91 新增。旧作品曾成功生成；上一次 0.1.91 交付仅重新导出旧动画缓存，未重跑新片动画。

隔离实验只用原 JPEG 和普通图片元素即可精确复现：首次缩小可见得到原失败记录的 repeated 图；初始隐藏并解码后显示、自然尺寸绘制后缩小，得到 first 图。去除 transform、删除 ICC、关闭加速 JPEG 解码均未消除差异。固定全尺寸 PNG 后三条历史逐像素一致。这把根因定位到当前 Chromium 的 JPEG 解码／缩放结果受首次显示状态影响，未断言某个内部缓存实现。

## 修改与调用链

- `apps/render-worker/src/motion-images.ts`：复用现有 Chromium，在独立页面将 JPEG 原生解码到全尺寸 sRGB 画布，再编码为 PNG。解码前不挂入布局或缩小，保留 EXIF 方向与 ICC 转换。PNG、WebP 不变，不引入依赖。
- `apps/render-worker/src/motion-job.ts`：先校验并保存原件，再调用图片准备模块，向 `renderManagedMotion` 注入派生 PNG。Manifest 保存 `imageDecodes` 的原件／派生哈希、路径、尺寸、色彩空间与浏览器版本；缓存复用检查派生文件。
- `packages/motion-work/src/compiler.ts`：新生成身份升级为 `managed-motion-14`，不与旧图片解码缓存混用。历史已完成产物保留。
- 定向测试、发行端到端脚本和 `docs/development/motion-runtime.md` 同步；插件版本更新为 0.1.92。

调用链：`runMotionJob → prepareMotionImages → renderManagedMotion → verifyMotionDeterminism → 原有编码与素材登记`。首中末帧抽查和最大 2 色阶门槛未改。

## 验证

- 类型检查通过。
- 既有动画、字体、一致性定向回归 34 项通过。
- 新增 5 项测试通过：EXIF 旋转、非 sRGB ICC 转换、PNG/WebP 原字节保持；真实 JPEG 生成链与派生缓存损坏拒绝；三种显示历史的目标区域逐像素一致及卸载回跳；新缓存身份；损坏输入／已取消操作失败。
- 测试图片均为自建小素材。原 JPEG 对照在三种历史之间出现 134546 个通道不同、最大差 25；转换后完全一致。没有把浏览器缺陷必须持续存在写成长期断言。
- 完整失败输入已复制到 `.repair-validation/jpeg-fixed-20261015/input-project/`，4张图片和2段视频的字节哈希均与原提交一致，使用原动画源码、字体及3607帧时长。独立重放完成，首中末帧 `[0,1803,3606]` 均 `exact`、差异列表为空，完整编码和帧数检查通过，耗时1099.421秒（约18分19秒）。第1803帧与原失败记录的first图逐像素一致。
- 候选构建及发行校验通过；安装快照端到端验证通过，实际生成792帧／33秒作品、人物视频绑定及后续合成检查完成。第一轮因旧引擎编号断言未同步而失败；已修正断言重新验证，未更改实际输出或放宽质量条件。

## 失败处理与代价

解码错误、超时、取消沿原任务失败处理保留异常；不回退到 JPEG，不登记虚假成功素材。原始素材和来源不覆盖。含 JPEG 任务增加一次浏览器准备、全尺寸解码和 PNG 派生存储，无 JPEG 不启动额外浏览器。广色域输入转换到既定 sRGB 输出，不把色彩转换称为完全无损。

发行构建期间观察到另一路已存在的表达风格 Skills 变更；沿维护源同步，未回滚或改写这些无关变更，本修复不将其列为自身实现。

## 发行与交付状态

正式版本：0.1.92；Release：`release-d495ccd2294681e813f9e500c57ae8fcf615677794c6d87aee969c918a3383f6`。已使用 Codex 官方 `plugin add videoflowcut@videoflowcut --json` 安装，核对安装内容与候选一致；仅更新原宿主注册的启动器路径，其余配置不变。现有受管启动器完成正式切换，切换前后97个项目的版本和持久快照哈希完全相同。

新注册连接的 Launcher/MCP/Runtime 三方发行身份一致，Runtime 为 ready，媒体和渲染 Worker 健康，实际能力为 `managed-motion-14`。当前聊天业务 MCP 已热切新版；旧外层启动器仍报告0.1.91身份，未将其声称为已重启。原报告者通过当前业务MCP读回正式项目仍为R119，完成 `acknowledge_repair_deployment`，工单状态为 `acknowledged`。

本轮未重新提交正式视频生成任务，未创建正式完整动画素材或 ExportArtifact。开发重放视频仅为隔离验证，不当作用户的新片交付。

证据目录：`E:/ai/VideoCut/.repair-validation/jpeg-fixed-20261015/`。本记录只证明平台修复进展，不表示正式新片已生成、审片或交付。
