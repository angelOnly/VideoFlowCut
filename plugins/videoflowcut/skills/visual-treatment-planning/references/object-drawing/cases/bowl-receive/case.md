# 碗接住果实（返修候选）

## 用途与来源

本项目新设计。详细来源与许可见 [SOURCES.md](../../SOURCES.md)。当前不是正式推荐示范。

## 物件怎样造出来

BowlBack/BowlFront 使用宽柔器形明暗、窄反光、前后口沿与圈足暗部。Fruit 的表皮纹理随局部角度转动，受光留在平移父坐标内并由已转动轮廓裁切；亮面克制，保留固有色。果实间与碗内接触暗部随实际间距出现，地面方向影与圈足接触影分开。
六例共同使用 SceneFrame：纸底 Img 与 SVG 在960×540设计容器中统一等比缩放并居中，实例 ID 必须稳定且不同。

## 动作怎样发生

三次接触在 0.72、1.37、2.05 秒；接触后 0.45 秒内反弹滚动落定。
[本版预览](preview.mp4)：204 帧 / 60 fps，无声。

根层读取当前局部帧；直接使用时 startFrame 默认为零。外层 Sequence 已提供局部帧时，子组件 startFrame 传零，事件解析器使用外层偏移，避免画面重复减起点。

## 复现与改写指令

读取完整 source.tsx 作为 MotionSubmission.source，其余字段取 demo-props.json。纹理槽声明见 [resources.json](resources.json)，实际尺寸、SHA-256与来源见 [纹理清单](../../textures/manifest.json)。不携带生产项目 ID。
在仓库根运行 `npx tsx scripts/render-object-drawing.ts bowl-receive`，沿现有受管编译与渲染器输出到隔离验证目录；齐套校验后整目录替换，替换失败回滚旧目录。改造型和尺寸时需重新检查接触、遮挡、转轴与承载关系。

正式作品先沿素材导入取得真实 Asset ID，再写 imageBindings，源码读取 props.assets；禁止手写 Props.assets、复制文件路径或编造素材 ID。隔离脚本校验图片字节后从快照注入 imageData。六例共用 paper_base，石雕另外需要 stone_head；合并场面共用纸底槽，与其他图片合计仍最多8槽。缺文件、缺槽、哈希或坐标不一致均停止本例生成，不改用色块。

## 验证与边界

为按接触点编排的轨迹，并非通用碰撞求解；改容器和果实尺寸必须重做接触关系。
技术产物见 verification.json；版本观察见 reviews.json。静帧检查、哈希与编译不代表连续效果认可。新版渲染不能继承旧版认可，当前状态 rework。

本轮材质观察针对本版关键帧，已核看纸底、材质和主要接触关系。具体输入与预览哈希及观察帧见 reviews.json；旧观察仍保留，不能支持本版认可。
