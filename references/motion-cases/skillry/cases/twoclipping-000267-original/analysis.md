# 003 人物视频墙与手机展示

## 适用场景

从一组用户或新闻短片选出重点，再在旁边解释处理结果。

- 原片形态：固定视频

- 适用视频类型（迁移建议）：产品介绍、新闻解读、影像展示

- 段落场景：集合聚焦、成果展示

- 原片实见素材：人物视频、手机界面、桌面界面、图表、文字

- 动效方法：曲面媒体墙横移、中央素材提到前景、操作板转为结果

- 美术特点：黑底留白、橙品牌与绿状态、左右双区

- 材料要求：需要多条可裁切人物素材、明确所选片段和有来源的结果数据。

- 迁移代价：曲面透视和拖影降低小卡细节，内部镜头会换，不能宣称同一影像一直未变；原速观感与声音同步未认证。

## 推荐观看片段

- 9.00—14.00 秒：媒体墙选出手机片段，再建立右侧控制与结果面板

## 动效与美术拆解

把真实人物短视频编排成一个从输入到筛选、生产、投放、结果的产品故事。前段浅底单一输入，中段黑底媒体集合，后段精选媒体与指标并列，最后以短词与品牌收束。

直接观察的重点区间为 9.000—14.000 秒。9秒曲面视频阵列已建立，中央卡片宽、两侧窄且有地面倒影。10.417—11.167秒阵列沿水平方向快速换位，中间帧可见拖影。11.75秒一条人物视频在阵列前景变大，11.917秒手机轮廓明确、其余卡片暗下去；12.083秒右侧控制面板进入。12.833秒按钮转绿，13.167秒手机里的镜头更换、右侧面板侧向旋转，13.333秒结果页正面出现，随后数字与曲线建立。保持的是手机与右侧板的位置关系，内部视频镜头并未一直相同。

美术的设计解释：深黑背景让真实肤色与白字自然成为亮点，橙色品牌、绿按钮占据小面积并分别承担身份和动作状态。曲面排列与倒影把素材集合组织成空间，手机边框又把输出从集合中提炼。结果阶段保持左右两栏，避免同时移动人脸、读数与图表。

迁移思考：适用于素材筛选、案例展示、新闻素材集合到一个重点片段。应借鉴‘集合—精选—解释’关系，而非照搬手机或夸张结果数字。真实媒体变化需要选片和裁切，曲面透视、拖影与播放器内部字样可能降低可读性；指标必须重新核实。

资料身份与实现边界：公开输入含较详细分镜和工程方向，但需要另问产品与真实素材；它不是本轮所见原作的完整源码。Remake技术标签不证明Original实现。本轮公开仓库、详情页与输入核查中，未找到直接对应当前原作的固定源码；不能把Remake技术标签或需求中提及的工具当原作实现证据。本报告只解释可见关系，具体遮罩、曲线、图层及渲染方案若实施，属于新制作选择。核查范围见来源核查记录。

本报告实际查看整片约每秒一帧概览，以及关键区间的密集真实源帧；时间来自源PTS。基于带源时间图片序列，未核验原速观感，未试听，因此不认证整体流畅度、音乐拍点、对白连续或声音同步。概览不足以证明其他快速接续；300像素证据单帧中的小字、边缘精度仍需全尺寸核验。

## 实现建议（研究后写，未制作验证）

状态：研究者后写、未制作验证；不是作者原输入，不是原作源码，也未证明能够逐帧复刻。依据为拆解报告及其中列明的源帧证据。

建立一组真实竖版素材的暗色曲面展墙，中央为重点，外围退暗。先让素材沿曲面横移一次，再把选中项沿原中央位置提到前景，并落入手机或适合本内容的窗口；其他卡片同步退场。窗口移到左侧，右侧加入简洁操作板；按钮状态变化后右板转向结果页，主体窗口保持位置。结果先出现标签，再增长关键数值，最后绘出趋势。保留充足黑色空区，每段只承担一个阅读任务。

首版实施时先用本片真实内容、素材和画幅重新确认对象关系与阅读量，再拟时间；原片关键区间9—14秒只作观察参照，不强制套用其总时长或品牌。图层、遮罩和曲线可按新工程实现，参数不得标为作者原参数。完成后需原速查看、检查中间帧和全尺寸文字；有声音时另做试听及同步核对。

## 作者公开输入与来源

作者：@twoclipping。

[网站原作页](https://skillry.dev/ai-videos/opus-5-5/twoclipping-000267) · [作者原帖](https://x.com/twoclipping/status/2102554209166000267)

公开输入的完整性仍以作者发布范围为准；本库未确认对应原片的固定源码。

```text

<inputs>
Ask me for: the product name and a one-line promise, 3 to 5 UI moments to show, one accent color, 10 to 20 real vertical clips I own, and a royalty-free song with a clear drop (e.g. Mixkit, free for commercial use).
</inputs>

<direction>
High-end minimal. One idea per shot, lots of empty space, one accent color, one clean sans (Geist or Inter) with tight tracking. Masked type reveals, match cuts, one smooth camera language. Real footage only, never placeholder cards. No full stops in on-screen text.
Banned: shockwave rings, particle bursts, RGB split, camera shake, lens flares, neon glows, grid floors, flashing backgrounds, bouncy easing.
</direction>

<structure>
10 bars at 120 BPM, 2 seconds each.
Bar 1: the hook lands word by word on the beats.
Bar 2: one hook word morphs into the product UI. A cursor types and clicks.
The drop: a circle opens out of the button into a dark scene.
Then one move per bar: a wall of real clips with a scan line and 3 winners, the key output as big type, a 3D carousel of real videos with floor reflections and a motion-blurred whip onto one hero clip, the hero in a phone next to a panel that flips into results, big stats on push cuts, a 3-word ticker, a logo reveal, a fade to black.
</structure>

<build>
1. One HTML file at 1920x1080. Every style is computed from time inside 
http://
window.seek(t): no CSS animations, no timers, no state between frames.
2. Real video: extract clips to 30fps JPEG sequences with ffmpeg and swap img sources per frame. seek awaits the image decodes.
3. Analyze the song with numpy: tempo, beat grid, energy per bar, the drop. Calibrate the grid to the real kick hits. Every cut sits on a downbeat, every UI hit on a beat.
4. Render with Playwright: 3 subframes per frame at t minus, at, and plus 1/240s, then blend with ffmpeg tmix for real motion blur at 60fps.
5. Place each sound effect so its measured peak, not its file start, lands on the event. Keep the effects quiet under the music. Loudnorm to -14 LUFS.
6. Probe 20 or more frames before the full render. Fix anything cluttered, overlapping or hard to read.
</build>

<gotchas>
Never set opacity or filter on a preserve-3d element, because it flattens and both faces show. Fade its wrapper instead. Measure element positions at runtime for match cuts. Only use music and sound effects whose license allows commercial use.
</gotchas>

<start>
Ask me for the inputs, then show me a storyboard with every timing on the beat grid before you write any code.
</start>

```

## 观看与文件说明

网站原片，未重新编码。

本文依据整片源帧概览与列出的关键区间观察。原速观感、声音和后写实现建议未专业验证。研究过程文件另行本地归档。
