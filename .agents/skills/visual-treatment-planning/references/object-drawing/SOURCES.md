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

- [scissors-cut](cases/scissors-cut/case.md)：scissors、drawScissors、drawStrip。双刀刃沿同一轴心反向旋转，橙色椭圆握柄与金属渐变刀刃独立。挂签附着左握柄，拥有独立衰减摆动；Paper 的两个半片保留各自颜色与圆点身份。
- [magnifier-scan](cases/magnifier-scan/case.md)：magnifier。黑框、黄铜内圈、透明青色镜片、高光和斜柄分层；每实例独立渐变 ID。底层点阵保持原位置，镜片不会替换数据。
- [domino-flip](cases/domino-flip/case.md)：domino、domState、drawStrip。采用原案例 124×218 正面和 15/9 厚度比例，左侧、顶面独立多边形；圆环身份跨两面保留。沿竖轴压缩至边缘再展开背面，属于二维投影示意。
- [cutaway-head](cases/cutaway-head/case.md)：headPath、HEADTEX、drawInterior、drawHead。HEAD_PATH 保留原侧脸贝塞尔轮廓和椭圆开口，StoneHead 用固定种子斑块与颗粒重做石材；后壁、内腔、球体、前缘依次绘制。前壁遮挡不是对象淡出。
- [bowl-receive](cases/bowl-receive/case.md)：本项目新设计。BowlBack 给出后缘与内腔；BowlFront 单独绘制弧形前壁、釉色渐变、双线装饰及圈足。Fruit 分离果身、果梗与叶片，独立旋转。
- [book-open](cases/book-open/case.md)：本项目新设计。书脊是所有开合的局部原点。封面、右侧页块、左侧页块和单页分开，页块底边三条细线呈现厚度；开合使用二维投影，页片提升和剪切模拟弯曲。

前四项保留轮廓、厚度、结构和局部变换制法，将 Canvas 重绘为 React/SVG，重新设计不依赖题材的演示时序。石材不用原离屏像素缓存，采用固定种子的 SVG 斑块和颗粒；外观与密度仍需实际观察，不声称逐像素等效。
后两项是依据开口遮挡、铰接与翻面方法制造的新物件。示例均不使用图片、字体、视频和声音，资源清单为空；后续加入真实材料时仍走原绑定合同。

## 使用状态

每例的实际渲染与观察范围见 case.md 和 verification.json。编译、渲染、静帧、连续观看、真实任务采用和宿主加载分别确认，不用代码存在代替后几项。

