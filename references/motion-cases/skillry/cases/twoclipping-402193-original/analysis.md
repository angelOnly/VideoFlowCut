# 109 纯控件的连续状态变化

## 适用场景

在操作结果讲解中让同一窗口扩大容纳信息，再恢复为较小的控制状态。

- 原片形态：固定视频

- 适用视频类型（迁移建议）：产品介绍、操作教程

- 段落场景：前后变化、条件解释、空间关系

- 原片实见素材：桌面界面、图表、文字、抽象图形

- 动效方法：容器先分配内容空间、内容先退容器后收、选中位置连续迁移

- 美术特点：暖灰黑白控件、统一圆角与线宽、轻软影区分平面

- 材料要求：需真实或明确示意的界面状态、操作结果与数值；与视频材料融合需另设计外层构图。

- 迁移代价：纯控件演出与用户目标视频差距较大，只宜借局部容器关系；不证明真实产品或单DOM；原速与声音未认证。

## 推荐观看片段

- 5.00—10.00 秒：音量容器收成开关，再扩为时间标签与图表；图表内容淡退后容器收为搜索条。

## 动效与美术拆解

这条原作确实是纯UI状态演出，和真实视频材料融合的需求差距较大，但可从局部学习容器身份与内容先后。按钮经过加载、播放器、音量、开关、时间标签、图表、搜索和通知回到按钮，鼠标驱动每次改变。观众任务是观察同一位置的组件怎样承担不同功能，核心不在业务流程真假。公开输入说同一元素永不切断，画面可以支持轮廓与中心连续，却不能证明DOM节点就是一个。

5—10秒密集图组先看到长黑音量容器收短，白线消退同时圆形钮建立，5.5—6.2秒钮左右移动且黑灰底响应；6.3秒底扩大成白色长标签条，原圆钮转为黑色选中胶囊。指针随后点Week、Month，胶囊两侧不同步伸展，先前方推进再后边收住，形成类似液体拉伸的视觉。7.3秒白条向下长为图表面板，时间标签留在上沿，数字和曲线随后出现，指针读点后更换时间范围，9.8秒内容淡走，面板收为搜索条。容器先给空间，内容后入；退出时内容先退，容器再收。

暖灰画布、黑白组件和轻软影形成克制立体层次，颜色不抢状态变化。圆角半径、线宽、字体与图标重量近似一致，功能虽换仍像一个系统；播放器封面是少量彩色内容，容器本身保持黑白。每一场中心稳定，缩放让当前控件够大，可读数字成为图表重心而不是框边。白面板在浅灰底中靠阴影和细边辨认，不能把阴影拉得过重。布局尺度随内容变化，却保留边缘关系而不是每次随机重排。

可以迁移‘先分配空间再进入信息、先退信息再收容器’及选中位置的连续移动，但不要把主题片做成连续控件变形。真实手机屏幕可在一个窗口内讲动作结果，外层器物与原素材需要另行设计；这条不证明真人、新闻和UI的融合效果。指针、点击与数值为演示，若真实产品教程要忠于界面。公开指令要求循环和拍点，本轮未原速试听且未逐帧比首尾，不能认证这些质量目标已经实现。

本轮依据整片约每秒一帧概览，以及5.000—10.000秒的真实源帧密集序列。未原速播放核验流畅度，未试听核验声音同步；其余区间未密集审阅，源帧之间的运动不作逐帧认证。关于绘制对象、缓动曲线和代码组织的说法仅为复现建议，不能据画面证明原实现。

作者资料核对：公开资料含状态列表、拍点、美术、单HTML、时间函数、渲染和输入询问规则，是较完整制作指导；仍无原片固定完整源码，未给实际最终用户输入。 平台列出的“Remake built with”描述复刻版本，不能证明原作技术栈；本案例不声称已有原作者源码。

## 实现建议（研究后写，未制作验证）

研究者依据原作观察后写，非作者原始输入，未制作、未渲染验证。用于重新设计相同关系，不承诺复刻原片。

如当前内容确需讲状态变化，用一个中心容器贯穿，暖灰底、黑白功能和一致字形。容器先伸展到新内容需要的尺寸，旧信息先退，新信息晚于轮廓建立；收回时反向执行。选中块移动可让前后边不同时间到位，但维持真实指针操作因果。外层结构与内容必须可读，数值来自实际输入。仅迁移这种局部空间分配，不把全片强做UI；循环与拍点须在新作品中另验证。

实施时先完成关键构图，再制作接续，按真实输出核对阅读、遮挡、对象身份和空间方向。使用绝对时间控制并保存可编辑源码；这些是新制作要求，不能当成已取得的原工程。涉及事实、品牌、人物、数字和素材时需使用本片已核实输入。无声首版先看画面，再依据实际音轨安排声音。

## 作者公开输入与来源

作者：@twoclipping。

[网站原作页](https://skillry.dev/ai-videos/opus-5-5/twoclipping-402193) · [作者原帖](https://x.com/twoclipping/status/2103273003555402193)

公开输入的完整性仍以作者发布范围为准；本库未确认对应原片的固定源码。

```text

<inputs>
Ask me for: 8 to 12 UI states I want the shape to become (e.g. button, loader, player, slider, toggle, tabs, chart, command palette, toast), pure black and white or one accent color, and a royalty-free song around 120 BPM (e.g. Mixkit, free for commercial use).
</inputs>

<direction>
Dribbble-level UI motion. One shape, never cut: every state is the same element morphing its size, radius and color while its content swaps with a short blur. A cursor drives every change with real clicks and drags. Light warm-gray canvas, black and white components, one clean UI font (Geist). Springs everywhere, a tiny overshoot at most. The camera zooms so each state fills the frame. The last frame is the first frame, so it loops.
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, mismatched icon strokes, dead time, anything that looks like a template.
</direction>

<structure>
120 BPM, 7 bars, something happens on every beat.
Button → loader → check → dynamic island → music player with a play/pause morph → scrub the progress bar → it becomes a volume slider that stretches when dragged past max → a toggle flips on the beat → the knob becomes a liquid tab indicator → the tabs open into a chart that draws itself, with a tooltip on hover → it collapses into ⌘K → type to filter → enter → toast → back to the button.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style is computed from time inside seek(t): no CSS transitions, no timers, no state carried between frames.
2. Springs are closed-form step responses. A value that changes target many times is the sum of one spring per change, so it stays a pure function of time.
3. The tab indicator's two edges ride different springs, so the leading edge stretches ahead of the trailing one. Same trick for the toggle knob.
4. Drags are direct manipulation: while the cursor is held, the value is computed from its position. On release it springs back from wherever it was.
5. Analyze the song with numpy for the beat grid and start on a downbeat. Place every UI sound by its measured peak.
6. Render with Playwright: 4 subframes per frame, blended with ffmpeg tmix for motion blur at 60fps.
7. Render one frame per beat before the full render. Fix anything off the grid, cramped or hard to read.
</build>

<gotchas>
Never put will-change on anything the camera scales or the text renders blurry. Text that swaps inside a morphing container needs its own enter and exit timing or it overlaps. Make the last frame identical to the first, cursor position and speed included, or the loop stutters.
</gotchas>

<start>
Ask me for the inputs, then show me the state list on the beat grid before you write any code.
</start>

```

## 观看与文件说明

网站原片，未重新编码。

本文依据整片源帧概览与列出的关键区间观察。原速观感、声音和后写实现建议未专业验证。研究过程文件另行本地归档。
