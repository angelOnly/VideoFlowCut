# 开顶石雕与内部承载

## 用途与来源

本项目移植改编。来源定位：headPath、HEADTEX、drawInterior、drawHead。版本、文件、许可与具体改编范围见 [SOURCES.md](../../SOURCES.md)。
本例演出不继承原题材、台词、固定品牌或原声；不能直接复制成本片的语义比喻。

## 物件怎样造出来

HEAD_PATH 保留原侧脸贝塞尔轮廓和椭圆开口，StoneHead 用固定种子斑块与颗粒重做石材；后壁、内腔、球体、前缘依次绘制。前壁遮挡不是对象淡出。
对应 [source.tsx](source.tsx) 中的 sceneState、StoneHead。固定实例前缀来自 Props.instanceId；同一 SVG 中组合多个实例时逐个传入不同且稳定的 ID。

## 动作怎样发生

0.7–2.5 秒球体落入内部，前缘遮挡球体下部；2.7–4.1 秒观察尺度温和推进。
完整片段：[preview.mp4](preview.mp4)，120 帧 / 24 fps = 5 秒，无声。
关键帧：[第 0 帧](keyframes/frame-00000.png)、[第 24 帧](keyframes/frame-00024.png)、[第 42 帧](keyframes/frame-00042.png)、[第 60 帧](keyframes/frame-00060.png)、[第 84 帧](keyframes/frame-00084.png)、[第 110 帧](keyframes/frame-00110.png)。
根层只读取一次 useCurrentFrame；sceneState 接收秒，子物件不再次减 Sequence 起点。
resolveMotionEvents 与画面使用同一时序，供需要声音时按本片真实节奏改写。

## 复现与改写指令

依据已核实侧脸路径制造石雕，保留眉骨、鼻梁、嘴唇、下颌和脖颈比例。以深浅斑块、细颗粒和固定光向呈现石材；开口有内外椭圆和厚度。球体落进开口后由前缘实际遮挡，随后靠近观察仍保留结构。

读取完整 source.tsx 和 demo-props.json，将 source 文件内容作为 MotionSubmission.source，其余字段保持 demo-props.json；不将文件路径作为源码提交。
本例不依赖图片、视频、字体或声音，无需资源绑定，不携带项目 ID。沿当前受管作品提交接口传入当前项目与 Revision，按返回原 Job 查询，不另造渲染器。
开发复现命令：在仓库根运行 `npx tsx scripts/render-object-drawing.ts cutaway-head`。它使用现有 validateMotionSource → compileMotion → renderManagedMotion 链路，输出临时帧到隔离目录 .repair-validation/object-drawing，成功后更新本目录预览、关键帧和 verification.json。
正式改写时复制必要组件、状态函数和依赖到本片受管 TSX，不使用本地模块导入。可改背景、颜色、物件身份与节奏；结构、归属、接触和结果关系必须对应本片内容重新检查。

## 验证与边界

当前源码、参数、预览和实际帧的 SHA-256 由 verification.json 关联；渲染器记录跳帧返回抽查结果。
静帧观察：第 60 帧。前壁沿完整石雕表面覆盖球体下部，轮廓与开口厚度已看；已移除首版不连续的材质带。 连续视觉效果尚未确认；当前会话没有连续视频感知输入，不能把抽帧记录写成整段审阅通过。无音轨，不声称完成声音验证或用户定稿。
采用 SVG 层和固定细节，不承诺原 Canvas 逐像素一致、真实光学或任意视角三维表现。5 秒是此演示的完整动作时间，不是日常视频的规定时长。

