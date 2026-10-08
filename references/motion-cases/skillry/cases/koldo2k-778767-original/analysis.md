# 012 复古拼贴与镜头穿越

## 适用场景

旅行或文化影像借物体窗口进入下一地点，使观众先看见目的地。

- 原片形态：固定视频

- 适用视频类型（迁移建议）：影像展示、品牌展示、空间导览

- 段落场景：跨场景接力、整体到局部、空间关系

- 原片实见素材：照片、插画、抽象图形

- 动效方法：下一景观提前进入孔洞、中心入口持续放大、边框离场接满幅

- 美术特点：低饱和景观、黑白旧物剪纸、中央入口

- 材料要求：需要足够清晰的景观图、带孔洞对象和可对齐入口。

- 迁移代价：不是实拍或无缝循环认证，持续穿越不适合长文字，放大受源图分辨率限制；原速观感与声音同步未认证。

## 推荐观看片段

- 5.00—10.00 秒：相机镜头内的沙漠提前可见，镜头扩大直至沙漠成为全幅

## 动效与美术拆解

观众跟随一个不断靠近的窗口穿过数个风景，怀表、相机、放大镜和手镜都能在自身孔洞里先显示下一世界。整片没有信息段落式文字，观看任务主要是辨认前后空间及下一入口。照片外观的背景与黑白剪纸共同形成超现实拼贴，不能仅凭景观断言实拍。

直接观察的重点区间为 5.000—10.000 秒。5秒旧相机在海湾中央，镜头内已可见沙漠、钥匙与下一放大镜；5—7秒相机逐步放大，外部海湾逐步被边框排挤。7—9秒圆形镜头继续扩展，内部沙丘和放大镜的大小也持续增长；9.6秒四角仍有镜头边缘，9.933秒边框几乎离场，10秒沙漠成为全幅。下一窗口提前出现在当前孔洞中，因此交接不是最后一刻突然换景。

美术的设计解释：背景用低饱和蓝灰、沙褐与雾绿，黑白旧物的薄白纸边让它们在写实背景里可读。相机颗粒表面与镜头铜灰边提供清晰尺度参照，沙丘横向纹理又帮助读出深入方向。外围鲸鱼、帽子和钥匙增加漂浮感，但主入口始终接近中央，避免观众在快速变化中找错目标。

迁移思考：适用于旅行、历史回顾与从资料进入局部观察。重点是提前在可辨窗口里显示下一内容、持续放大入口；不必全部采用复古物件。照片分辨率、遮罩边缘和内部景观对齐决定放大质量，长文字或新闻数据不适合持续穿越阅读。循环的最后与第一帧未逐帧核验，不能认证无缝。

资料身份与实现边界：公开输入给出较完整空间序列和制作方向，但生成资产、深度图、费用记录及源码未随输入提供；这些工程要求不是已实现证据。本轮公开仓库、详情页与输入核查中，未找到直接对应当前原作的固定源码；不能把Remake技术标签或需求中提及的工具当原作实现证据。本报告只解释可见关系，具体遮罩、曲线、图层及渲染方案若实施，属于新制作选择。核查范围见来源核查记录。

本报告实际查看整片约每秒一帧概览，以及关键区间的密集真实源帧；时间来自源PTS。基于带源时间图片序列，未核验原速观感，未试听，因此不认证整体流畅度、音乐拍点、对白连续或声音同步。概览不足以证明其他快速接续；300像素证据单帧中的小字、边缘精度仍需全尺寸核验。

## 实现建议（研究后写，未制作验证）

状态：研究者后写、未制作验证；不是作者原输入，不是原作源码，也未证明能够逐帧复刻。依据为拆解报告及其中列明的源帧证据。

选择几个有语义关系的影像空间，每个入口用本内容中自然存在的孔洞或物体窗口。先在当前画面建立入口，并在其中提前展示下一个景观和其下一入口；固定关注点靠近中央，外部物件随推进离开画幅，避免突然移轴。窗口逐渐放大至边缘完全出画，再以同一内部景观接为全幅。统一低饱和背景、剪纸边与柔阴影，逐帧检查接点、全幅覆盖和分辨率。

首版实施时先用本片真实内容、素材和画幅重新确认对象关系与阅读量，再拟时间；原片关键区间5—10秒只作观察参照，不强制套用其总时长或品牌。图层、遮罩和曲线可按新工程实现，参数不得标为作者原参数。完成后需原速查看、检查中间帧和全尺寸文字；有声音时另做试听及同步核对。

## 作者公开输入与来源

作者：@koldo2k。

[网站原作页](https://skillry.dev/ai-videos/opus-5-5/koldo2k-778767) · [作者原帖](https://x.com/koldo2k/status/2103129343253778767)

公开输入的完整性仍以作者发布范围为准；本库未确认对应原片的固定源码。

```text

Build a looping "infinite zoom" animation, After Effects style: the camera
travels from landscape to landscape by flying through vintage objects.

LOOK: vintage collage realistic photo landscapes + black & white newspaper
cutout objects (halftone, white paper border, soft shadow). Film grain,
vignette, light flicker.

WORLDS (loop): snowy mountains → pocket watch (swinging on its chain) →
sea cliffs → box camera lens → desert dunes → magnifying glass →
misty lake → hand mirror → back to start.
Extras: floating hat, phone, umbrella, gramophone, key; a 1950s man walking
toward the watch; a whale swimming across the cliffs sky.

HOW:
- Generate everything via the Magnific MCP (Seedream 5 Pro landscapes,
  GPT 2.5 transparent cutouts, depth maps, Kling 2.5 animation, Lyria 3
  music). List the generations + credit cost and wait for my OK first.
- Split each landscape into 3 depth layers from its depth map and fill the
  hidden areas. Parallax: layer scale = camera^Z, Z between 0.45 and 1.22.
- Each portal's glass holds the next world; cut seamlessly when it fills
  the frame.
- Constant speed: exponential zoom to a fixed point, each segment's duration
  proportional to log(zoom). Verify the cuts frame by frame.
- Man & whale: generate on pure green (#00B140), animate in place with
  Kling, key out every frame, build a seamless loop (ping-pong if needed).
- Cutouts animate at 15 fps (on twos).
- 20 s loop, 1920×1080, 30 fps. Music: 96 BPM, cut to exactly 8 bars = 20 s.

DELIVER: an interactive artifact (viewer, AE-style timeline, music +
MP4 download) and a rendered MP4 with music under 30 MB.
Show me screenshots before each expensive step.

```

## 观看与文件说明

网站原片，未重新编码。

本文依据整片源帧概览与列出的关键区间观察。原速观感、声音和后写实现建议未专业验证。研究过程文件另行本地归档。
