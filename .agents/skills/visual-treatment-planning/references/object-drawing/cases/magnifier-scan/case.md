# 放大镜扫描

## 用途与来源

本项目移植改编。来源定位：magnifier。版本、文件、许可与具体改编范围见 [SOURCES.md](../../SOURCES.md)。
本例演出不继承原题材、台词、固定品牌或原声；不能直接复制成本片的语义比喻。

## 物件怎样造出来

黑框、黄铜内圈、透明青色镜片、高光和斜柄分层；每实例独立渐变 ID。底层点阵保持原位置，镜片不会替换数据。
对应 [source.tsx](source.tsx) 中的 sceneState、Magnifier。固定实例前缀来自 Props.instanceId；同一 SVG 中组合多个实例时逐个传入不同且稳定的 ID。

## 动作怎样发生

0.6–3.2 秒镜框沿点阵扫描；3.2–3.65 秒停止并描出异常点，保持到结束。
完整片段：[preview.mp4](preview.mp4)，120 帧 / 24 fps = 5 秒，无声。
关键帧：[第 0 帧](keyframes/frame-00000.png)、[第 24 帧](keyframes/frame-00024.png)、[第 48 帧](keyframes/frame-00048.png)、[第 77 帧](keyframes/frame-00077.png)、[第 100 帧](keyframes/frame-00100.png)。
根层只读取一次 useCurrentFrame；sceneState 接收秒，子物件不再次减 Sequence 起点。
resolveMotionEvents 与画面使用同一时序，供需要声音时按本片真实节奏改写。

## 复现与改写指令

用黑框、黄铜内圈、透明镜片、窄高光与黑柄制造放大镜，让它越过保持身份的数据点阵，在异常点停住并指认。保持底层数据坐标和镜片通透，不把它写成真实光学放大。

读取完整 source.tsx 和 demo-props.json，将 source 文件内容作为 MotionSubmission.source，其余字段保持 demo-props.json；不将文件路径作为源码提交。
本例不依赖图片、视频、字体或声音，无需资源绑定，不携带项目 ID。沿当前受管作品提交接口传入当前项目与 Revision，按返回原 Job 查询，不另造渲染器。
开发复现命令：在仓库根运行 `npx tsx scripts/render-object-drawing.ts magnifier-scan`。它使用现有 validateMotionSource → compileMotion → renderManagedMotion 链路，输出临时帧到隔离目录 .repair-validation/object-drawing，成功后更新本目录预览、关键帧和 verification.json。
正式改写时复制必要组件、状态函数和依赖到本片受管 TSX，不使用本地模块导入。可改背景、颜色、物件身份与节奏；结构、归属、接触和结果关系必须对应本片内容重新检查。

## 验证与边界

当前源码、参数、预览和实际帧的 SHA-256 由 verification.json 关联；渲染器记录跳帧返回抽查结果。
静帧观察：第 100 帧。镜框、内圈、透明镜片和异常点指认已看；没有光学放大。 连续视觉效果尚未确认；当前会话没有连续视频感知输入，不能把抽帧记录写成整段审阅通过。无音轨，不声称完成声音验证或用户定稿。
采用 SVG 层和固定细节，不承诺原 Canvas 逐像素一致、真实光学或任意视角三维表现。5 秒是此演示的完整动作时间，不是日常视频的规定时长。

