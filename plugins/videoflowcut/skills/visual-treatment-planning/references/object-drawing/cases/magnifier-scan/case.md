# 放大镜扫描（返修候选）

## 用途与来源

改编原参考的物件与动作方法。详细来源与许可见 [SOURCES.md](../../SOURCES.md)。当前不是正式推荐示范。

## 物件怎样造出来

Magnifier 的黑框、黄铜内圈和淡透明玻璃分别绘制，短弧高光不覆盖整片玻璃。镜框与柄的组合影向左下偏移，固定镜面高度对应固定偏移。Motion 中下方短行、符号和局部目标构成密度差异，属于几何示意而非真实资料，不实现光学放大。
六例共同使用 SceneFrame：纸底 Img 与 SVG 在960×540设计容器中统一等比缩放并居中，实例 ID 必须稳定且不同。

## 动作怎样发生

0.35 秒起进入，扫描轨迹使用 0.55/1.05 频率；1.70–1.96 秒纠偏，之后确认。
[本版预览](preview.mp4)：192 帧 / 60 fps，无声。

根层读取当前局部帧；直接使用时 startFrame 默认为零。外层 Sequence 已提供局部帧时，子组件 startFrame 传零，事件解析器使用外层偏移，避免画面重复减起点。

## 复现与改写指令

读取完整 source.tsx 作为 MotionSubmission.source，其余字段取 demo-props.json。纹理槽声明见 [resources.json](resources.json)，实际尺寸、SHA-256与来源见 [纹理清单](../../textures/manifest.json)。不携带生产项目 ID。
在仓库根运行 `npx tsx scripts/render-object-drawing.ts magnifier-scan`，沿现有受管编译与渲染器输出到隔离验证目录；齐套校验后整目录替换，替换失败回滚旧目录。改造型和尺寸时需重新检查接触、遮挡、转轴与承载关系。

正式作品先沿素材导入取得真实 Asset ID，再写 imageBindings，源码读取 props.assets；禁止手写 Props.assets、复制文件路径或编造素材 ID。隔离脚本校验图片字节后从快照注入 imageData。六例共用 paper_base，石雕另外需要 stone_head；合并场面共用纸底槽，与其他图片合计仍最多8槽。缺文件、缺槽、哈希或坐标不一致均停止本例生成，不改用色块。

## 验证与边界

仅恢复原扫描频率和阶段关系，不声称已完成原作同条件对照验收。
技术产物见 verification.json；版本观察见 reviews.json。静帧检查、哈希与编译不代表连续效果认可。新版渲染不能继承旧版认可，当前状态 rework。

本轮材质观察针对本版关键帧，已核看纸底、材质和主要接触关系。具体输入与预览哈希及观察帧见 reviews.json；旧观察仍保留，不能支持本版认可。
