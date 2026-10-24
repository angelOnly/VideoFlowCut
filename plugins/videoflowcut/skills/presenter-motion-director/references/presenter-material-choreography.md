# 人物与素材的连续编排

仅供已采用 presenter_motion 或明确 hybrid 人物范围读取。人物视频是带表演和源时钟约束的场景材料，不是默认底板或默认主视觉。先确定主要观看任务，再与真实材料、图形、文字共同选择人物形态、面积、层级和可见范围。

导演说明人物为何有用、真实原话与表演哪些必须保留；同一视觉作者负责整场构图与连续过程。准确台词、声音与当前视觉主体分别判断，不按句号、字幕卡、文件结束或定时配额切镜。效果判断见[人物效果特点](presenter-effect-targets.md)。

## 选择与组合

| 方法文件 | 主要用途 | 常见连接 |
|---|---|---|
| [avatar-window.md](presenter-compositions/avatar-window.md) | 圆形动态头像／简洁小窗陪读 | 人物主画面缩小、材料展开、随整组换场 |
| [paper-cutout.md](presenter-compositions/paper-cutout.md) | 视频纸片／轮廓剪贴参与同一美术场面 | 图形拼贴、标签接力、前后错层、整体切镜 |
| [split-screen.md](presenter-compositions/split-screen.md) | 人物和材料并置、比较与带读 | 分区重排、某区扩大接管、缩成头像 |
| [embedded-container.md](presenter-compositions/embedded-container.md) | 人物嵌入手机、屏幕或设计容器 | 整体移动、进入屏幕细节、退回设备整体 |
| [material-takeover.md](presenter-compositions/material-takeover.md) | 人物退出，素材与动态图形接管 | 同源放大、直接切镜、结果后接回人物 |
| [presenter-main.md](presenter-compositions/presenter-main.md) | 人物独立承担直接交流或表演 | 与花字形成重音、缩窗、分屏、切入材料 |

**使用方式：**看当前内容和材料，从集中索引直接选需要的方式，读取对应制法，结合原通用机制组合到当前场面。不存在固定轮换、随机分配或“每片用齐”的要求。表格不是互斥枚举；视频纸片可在分屏中使用，手机中的人物也可以整体缩成辅助窗口。

人物方式解决人物怎样进入画面；原机制库继续解决材料、图形、文字、背景和镜头怎样丰富地发展。两者共同使用，不因有人物就只搜头像、缩窗与口播花字，也不重做已经纳入当前代码的机制来源上下文。

## 共用制法

将所需几何与建层方法适配到本片 HTML/CSS/GSAP 源码。以下是制法参考，不是新增平台组件或固定成片模板。取景使用正向显示后的真实源尺寸；crop 是观察后的归一化范围，不是自动识别结果。

```javascript
// 先按实际取景同比例填满窗口，保留源画面比例。
function sourcePlane(source, box, crop) {
  if (crop.width<=0 || crop.height<=0 || crop.x<0 || crop.y<0 || crop.x+crop.width>1 || crop.y+crop.height>1) throw Error('取景范围无效');
  const cw = crop.width * source.width, ch = crop.height * source.height;
  const scale = Math.max(box.width / cw, box.height / ch);
  return {x:(box.width-cw*scale)/2-crop.x*source.width*scale,
    y:(box.height-ch*scale)/2-crop.y*source.height*scale,
    width:source.width*scale, height:source.height*scale};
}
function blendBox(a,b,progress) {
  const p=Math.max(0,Math.min(1,progress)), mix=(x,y)=>x+(y-x)*p;
  return {x:mix(a.x,b.x),y:mix(a.y,b.y),width:mix(a.width,b.width),height:mix(a.height,b.height)};
}
function placeBox(el,box) {
  Object.assign(el.style,{position:'absolute',left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
}
function PresenterWindow({id,slot,source,crop,box,radius=0}) {
  const window=document.createElement('div'), image=document.createElement('img');
  image.id=id;image.setAttribute('data-vfc-video-slot',slot);
  image.style.objectFit='fill';
  Object.assign(window.style,{overflow:'hidden',borderRadius:typeof radius==='number'?radius+'px':radius});
  const layout=next=>{placeBox(window,next);placeBox(image,sourcePlane(source,next,crop));};
  layout(box);window.append(image);return {element:window,layout};
}
```

在作者初始化中建立并加入 DOM，之后稳定保留视频元素 ID。运行时接管槽位、静音与根时钟。`object-fit:fill` 只用于已按源比例计算的内部平面，不把人物直接拉到任意窗口。动画可用共同状态驱动 layout，GSAP onUpdate 依据当前状态重新求值，不能累计上一帧。视频范围与 src 由平台负责，显隐不重播。

| 方法 | 本片实现与检查 |
|---|---|
| 动态头像 | PresenterWindow 的 box 等宽高、radius 为 50%，按真实脸部和肩部取景；检查圆周而非仅矩形范围 |
| 视频纸片 | 纸边、人物窗口、附着标签在共同父层，整体旋转和平移作用于父层；纸边尺寸与本片材料一致 |
| 分屏 | 同一进度分别计算人物与材料 blendBox，两区按新窗口重新取景；禁止直接压扁原画面 |
| 容器嵌入 | 设备外框和屏幕窗口共享父层局部坐标，外框有真实开口；整体移动不改变视频源时间 |
| 材料接管 | 人物按实际范围退出，材料在对应过程接管；主声音继续原 Dialogue/源声轨 |
| 人物主画面 | 使用当前主要构图与真实取景；缩窗只改几何并保留原 slot 与源时刻 |

需要组合时，纸片把窗口与 marks 附着到同一 DOM 父层；设备把屏幕和有开口的 shell 放在共同父层；分屏的状态函数同时布局人物与真实材料。背景、边缘、光影和动作均由本片美术决定，不在共用方法里固定。运动路径、轻重与收势继续采用原机制，blendBox 只是几何插值，不是唯一动画曲线。

## 与丰富动效组合

常见组合包括“人物主画面与花字形成重音后缩成头像，资料展开”“视频纸片与照片、标签共同重排”“分屏比较后由材料区放大接管”“手机中的人物随整组物件进入，随后转向屏幕细节”“材料完成后切回人物解释刚才的结果”。它们是组合方法，不是固定故事结构。

视觉作者先用原有方法考虑整场的主体、资料、图形、文字和观察，再把人物方式组合进去。某些场面也可以从人物形式出发启发整场构思，两者往返调整。没有人物的通用机制仍然可以用于人物片；不用按案例是否有人像做硬过滤。

人在说话时，重点文字不只是孤立弹出。可直接利用现有机制中的文字累积、短语接力、标记追加、空间让位与对象响应：先建立当前对象，在相应语言重点让字组形成可读形状，保留必要参照，再与下一个材料或画面共同处理。正式调用继续使用当前项目与检索结果，核读实际机制，不固定查询次数或机制编号。

## 文案与画面配合

**带观众看。** 台词引出一个对象时，让对象及时出现并达到可看状态；需要先说明条件时先说条件。不能只有“看这里”，画面却没有提供对象。

**接住看到的结果。** 台词评论、惊讶或澄清之前，结果已让观众辨认；人物可以稳定陪读，也可以在这个位置取得更多注意。不是在动画开始前把所有发现念完。

**一起形成重点。** 话语重音、花字和相关对象在同一段过程中加强当前含义。重点要在该看见时真正可见，不能在人物遮挡后动完，也不能与整段字幕同时抢读。

**共同离开和继续。** 人物、容器、文字和材料可以随同一组画面切镜，也可以分别让位。已经建立的对象和结果有用途时继续保留，不因进入下一条语音段就全部清空。

这些做法进入原声画稿与当前源码，制作时使用原有时序能力。创作者描述语义先后、可读条件与交叠，必要时给弹性时间尺度，正式声音就绪后换算真实时间；不新增联动事件数据库，不要求逐词打点，不把普通切镜变成必须无缝变形的工程问题。

## 交接与真实源

当前声画稿交清准确台词、观看任务、人物可见的语义范围、主画面与材料用途、进入／变化／落稳／出口及声音如何延续。初稿使用语义先后与必要的弹性时间尺度，正式声音及素材回来后再映射真实帧，不增加第二份分镜数据库或逐句表单。

人物在全屏、缩窗、分屏及进退过渡中可见时，必须有对应真实视频。源范围按当前需要、自然起止和 Provider 能力组织；完整配音不自动触发全文人物生成。人物返回使用当前嘴型，一段台词只保留一个有效讲述声源；普通字幕位于最终画布独立层，不随人物缩放。素材不足继续取材，不用长时间讲话掩盖缺材。源复用与补生成见[人物源交接](presenter-shot-plan.md)，源时钟和接管见[时间线操作](timeline-operations.md#人物绑定与源时钟)。
