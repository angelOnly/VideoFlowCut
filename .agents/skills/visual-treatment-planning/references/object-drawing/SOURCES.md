# 物件案例来源与改编记录

本项目开发基线：d47c7d3b0608f84ec4511679b0710005d941f234；能力查询为 managed-motion-14。
参考仓库：[chuspeeism/dashi-animationstyle](https://github.com/chuspeeism/dashi-animationstyle/tree/aa620f3b859aa5d191b783b2eb0fb59263731c76)，固定提交 aa620f3b859aa5d191b783b2eb0fb59263731c76。
复用许可见 [LICENSE](LICENSE)，保留 Dashi AI Lab 版权。原作者口播、字体文件、完整外部工作流和渲染脚本不随案例分发。

## 原文件与哈希

- `styles/超现实拼贴/示例_Token.html`：`8e61e06c57c33f132d4fef2becfe3ddf27763b539db1a3f7bb10c5b7d725a566`
- `styles/超现实拼贴/模板.html`：`3c8cb367d45979b3fa3fb81339b03229c809cedf5492e535529e30513cb81fa5`
- `styles/超现实拼贴/风格卡.md`：`9ed93770a4c0dd9af9fb1ec6bcc0e3e7fb4da4862f85b5e09cc8d4ed1e868c62`
- `LICENSE`：`8d3ec07cef8d95927e659eb264afdb334c3cb8e82774899775c2ddaa02442184`

## 本地范围

- [scissors-cut](cases/scissors-cut/case.md)：scissors、drawScissors、drawStrip。双刀刃沿同一轴心反向旋转，橙色椭圆握柄与金属渐变刀刃独立。挂签附着左握柄，拥有独立衰减摆动；Paper 的四段保留图案身份，三处切口按刃口几何推进。
- [magnifier-scan](cases/magnifier-scan/case.md)：magnifier。黑框、黄铜内圈、透明青色镜片、高光和斜柄分层；每实例独立渐变 ID。底层点阵保持原位置，镜片不会替换数据。
- [domino-flip](cases/domino-flip/case.md)：domino、domState、drawStrip。采用原案例 124×218 正面和 15/9 厚度比例，左侧、顶面独立多边形；圆环身份跨两面保留。沿竖轴压缩至边缘再展开背面，属于二维投影示意。
- [cutaway-head](cases/cutaway-head/case.md)：headPath、HEADTEX、drawInterior、drawHead。HEAD_PATH 保留原侧脸贝塞尔轮廓和椭圆开口，StoneSurface 使用原 HEADTEX 的离线同源前后图集；后壁、内部石阶、骨牌、前缘依次绘制。前壁遮挡不是对象淡出。
- [bowl-receive](cases/bowl-receive/case.md)：本项目新设计。BowlBack 给出后缘与内腔；BowlFront 单独绘制弧形前壁、釉色渐变、双线装饰及圈足。Fruit 分离果身、果梗与叶片，独立旋转。
- [book-open](cases/book-open/case.md)：本项目新设计。书脊是所有开合的局部原点。刚性封面绕固定书脊旋转；两张有身份的页片使用32条等弧长曲面条带，正文与纸面共用投影。

前四项保留轮廓、厚度、结构和局部变换制法，将 Canvas 重绘为 React/SVG，重新设计不依赖题材的演示时序。本版恢复原 HEADTEX 离线像素材料，不迁入运行时 Canvas；前后两区来自同一份表面。
后两项是依据开口遮挡、铰接与翻面方法制造的新物件。六例实际引用纸底 PNG，石雕另引用图集 PNG；其余表面用 SVG。没有新增字体、原作者口播或视频资源。

## 使用状态

每例的实际渲染与观察范围见 case.md 和 verification.json。编译、渲染、静帧、连续观看、真实任务采用和宿主加载分别确认，不用代码存在代替后几项。


## 2026-10-16 返修范围

六例全部标为 rework，正式推荐为空。已取得固定上游版本的原页面对照帧，隔离证据位于 `.repair-validation/object-drawing/upstream/`。原作剪切时刻为 10.40 至 10.82 秒、间隔 0.07 秒共七次；当前为三次结构返修，并非同条件完整移植。不能据此声称造型或节奏已达到原作。

书籍连续参考候选：https://www.pexels.com/video/glancing-over-the-pages-of-a-book-5667416/ 。尚未取得连续观察，不作为本版已完成的制作依据或认可证据。

当前版本的观察与否定记录保存在各例 reviews.json，绑定输入及实际视频哈希。更改输入、视频或重新渲染后须重新核查；技术通过不产生推荐资格。

## 2026-10-16 最终材质方案实施

固定提交 aa620f3b859aa5d191b783b2eb0fb59263731c76：已读取示例与模板的 PAPER/GRAIN/makePiece/HEADTEX/scissors/magnifier/domino、石阶分层与风格卡。只把 PAPER、HEADTEX 及必要纯绘制辅助摘录到仓库 scripts/object-drawing-texture-source.js（保留 MIT 版权）；scripts/build-object-drawing-textures.ts 离线运行该摘录，新增同源前侧裁切及16像素透明隔离边。运行时不执行原页面。

paper-base.png：原1920×1080，种子5，两级斑驳、1100纤维与轻暗角。stone-head-atlas.png：原HB=(96,266)-(762,904)、s=2.4；取整1599×1532，两区合成3214×1532 RGBA。实际像素范围映射回局部坐标，完整/前侧比例与原点一致；动态图层不在图集中。

只参考 makePiece 的固有色与表面叠层方法，没有迁入太阳、胶带或碎纸装饰。书、碗为本项目新设计；书壳为SVG织纹，页面受光和动态投影由本例几何计算，不冒称原仓库已有完整书籍或陶瓷实现。

原页面实际时刻截图及GIF抽帧保存在隔离验证目录，前四例按相近尺度裁切对照。GIF与静帧只支持材料及姿态观察，不作为连续效果认可。六例仍为rework。
