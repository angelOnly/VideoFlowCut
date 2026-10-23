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

将所需函数内联到本片受管 TSX，不增加未允许的本地模块 import。以下为方法参考代码，不是新增平台组件；语法与几何验证不代表已经完成项目运行和画面验收。

源尺寸使用正向显示后的实际宽高；`crop` 为作者观察后确定的归一化取景，不是模型自动识别或跟踪结果。以下几何先选取景，再按比例填满窗口，避免把人脸拉宽。`TimelineVideo` 的正式 slot、静音与根时钟仍由现有绑定管理。

```tsx
import React from 'react';
import {TimelineVideo} from '@videoflowcut/motion';

type Box = {x: number; y: number; width: number; height: number};
type Crop = Box; // 归一化到 0..1 的真实源画面，不是像素坐标。
type SourceSize = {width: number; height: number};

function sourcePlane(source: SourceSize, box: Box, crop: Crop): Box {
  const values = [source.width, source.height, box.x, box.y, box.width,
    box.height, crop.x, crop.y, crop.width, crop.height];
  if (values.some(v => !Number.isFinite(v)) || source.width <= 0 ||
      source.height <= 0 || box.width <= 0 || box.height <= 0 ||
      crop.width <= 0 || crop.height <= 0 || crop.x < 0 || crop.y < 0 ||
      crop.x + crop.width > 1 + 1e-9 || crop.y + crop.height > 1 + 1e-9) {
    throw new Error('人物源尺寸、窗口或取景范围无效');
  }
  const cw = crop.width * source.width;
  const ch = crop.height * source.height;
  const s = Math.max(box.width / cw, box.height / ch);
  return {
    x: (box.width - cw * s) / 2 - crop.x * source.width * s,
    y: (box.height - ch * s) / 2 - crop.y * source.height * s,
    width: source.width * s,
    height: source.height * s,
  };
}

function PresenterWindow({slot, source, crop, box, radius = 0,
  opacity = 1, rotateDeg = 0}: {
  slot: string; source: SourceSize; crop: Crop; box: Box;
  radius?: number | string; opacity?: number; rotateDeg?: number;
}) {
  const p = sourcePlane(source, box, crop);
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y,
      width: box.width, height: box.height, overflow: 'hidden',
      borderRadius: radius, opacity,
      transform: `rotate(${rotateDeg}deg)`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', left: p.x, top: p.y,
        width: p.width, height: p.height}}>
        <TimelineVideo slot={slot} fit="fill"
          style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  );
}

function blendBox(a: Box, b: Box, progress: number): Box {
  const p = Math.max(0, Math.min(1, progress));
  const mix = (x: number, y: number) => x + (y - x) * p;
  return {x: mix(a.x, b.x), y: mix(a.y, b.y),
    width: mix(a.width, b.width), height: mix(a.height, b.height)};
}
```

`fit="fill"` 只用于上面已经按源宽高同比例计算的内部视频平面，不用于把人物直接拉伸到任意窗口。圆形取景应检查圆周裁切，不能只看矩形框是否包含头部。外框、阴影、背景与花字从本片美术取值，不在共用组件中强制一种外观。

具体组合可以直接这样落实，所有 `layout` 坐标和进度均为本场内部变量，不是新 MCP 字段：

| 方法 | 最小实现对应 |
|---|---|
| 动态头像 | `PresenterWindow` 使用方形 `box`、实际 `crop` 和 `radius="50%"`；外层可随所属画面组移动 |
| 视频纸片 | 共同父层包含纸边、`PresenterWindow`、附着标签；旋转和平移施加给父层，而不是各层单独猜位置 |
| 分屏 | 用同一进度分别计算 `blendBox(actorA, actorB, p)` 与 `blendBox(materialA, materialB, p)`；两区内部重新取景，不横向压缩源 |
| 容器嵌入 | 外框与屏幕在共同父层；屏幕用局部 `box` 放置 `PresenterWindow`，共同变换不改变内部视频时间 |
| 材料接管 | 人物层按本片实际出镜区间绘制或退出，材料层完成接管；Dialogue 不随人物层卸载 |
| 人物主画面 | 使用本场主构图 `box/crop`；需要缩窗时只改变几何，使用原 slot 和当前时间 |

以下三个组合函数可与上面的共用代码放在同一份作品源码中，分别作为纸片、分屏和容器方法的最小实现。窗口、边缘与人物源是参数，具体外观和动作由本片设计提供；这不是三个固定成片模板。`renderMaterial` 返回本片真实材料的绘制结果，不是新的平台回调接口。

```tsx
type PresenterSource = {slot: string; source: SourceSize; crop: Crop};

function PaperPresenter({actor, box, inset, paperStyle, transform, marks}: {
  actor: PresenterSource; box: Box; inset: number;
  paperStyle: React.CSSProperties; transform: string; marks?: React.ReactNode;
}) {
  return <div style={{...paperStyle, position: 'absolute', left: box.x,
    top: box.y, width: box.width, height: box.height, transform}}>
    <PresenterWindow {...actor} box={{x: inset, y: inset,
      width: box.width - 2 * inset, height: box.height - 2 * inset}} />
    {marks}
  </div>;
}

function SplitPresenter({actor, actorFrom, actorTo, materialFrom, materialTo,
  progress, renderMaterial}: {
  actor: PresenterSource; actorFrom: Box; actorTo: Box;
  materialFrom: Box; materialTo: Box; progress: number;
  renderMaterial: (box: Box) => React.ReactNode;
}) {
  return <>
    {renderMaterial(blendBox(materialFrom, materialTo, progress))}
    <PresenterWindow {...actor}
      box={blendBox(actorFrom, actorTo, progress)} />
  </>;
}

function EmbeddedPresenter({actor, outer, screen, radius, transform, shell}: {
  actor: PresenterSource; outer: Box; screen: Box; radius: number;
  transform: string; shell: React.ReactNode;
}) {
  return <div style={{position: 'absolute', left: outer.x, top: outer.y,
    width: outer.width, height: outer.height, transform}}>
    <PresenterWindow {...actor} box={screen} radius={radius} />
    {shell}
  </div>;
}
```

`marks` 是依附纸片的标签，`shell` 是屏幕有开口的外框与装饰，两者使用共同父层的局部坐标。不要传入实心外框遮住整个屏幕。分屏过程中材料可以据新窗口重新取景和排布，不能只把原内容压扁。动态头像用 `PresenterWindow` 的圆形窗口直接实现；主画面使用其较大取景；材料接管时收回人物层即可，主声音不放在这些组件里。

运动的轻重、路径、交叠和收势继续使用原动效机制，不把 `blendBox` 当作唯一动画曲线。不要为方便维护，把所有方法重新封装成只接受 `x/y/w/h`、固定圆角与海边背景的万能人物框。

## 与丰富动效组合

常见组合包括“人物主画面与花字形成重音后缩成头像，资料展开”“视频纸片与照片、标签共同重排”“分屏比较后由材料区放大接管”“手机中的人物随整组物件进入，随后转向屏幕细节”“材料完成后切回人物解释刚才的结果”。它们是组合方法，不是固定故事结构。

视觉作者先用原有方法考虑整场的主体、资料、图形、文字和观察，再把人物方式组合进去。某些场面也可以从人物形式出发启发整场构思，两者往返调整。没有人物的通用机制仍然可以用于人物片；不用按案例是否有人像做硬过滤。

人在说话时，重点文字不只是孤立弹出。可直接利用现有机制中的文字累积、短语接力、标记追加、空间让位与对象响应：先建立当前对象，在相应语言重点让字组形成可读形状，保留必要参照，再与下一个材料或画面共同处理。正式调用继续使用当前项目与检索结果，核读实际机制，不固定查询次数或机制编号。

## 文案与画面配合

**带观众看。** 台词引出一个对象时，让对象及时出现并达到可看状态；需要先说明条件时先说条件。不能只有“看这里”，画面却没有提供对象。

**接住看到的结果。** 台词评论、惊讶或澄清之前，结果已让观众辨认；人物可以稳定陪读，也可以在这个位置取得更多注意。不是在动画开始前把所有发现念完。

**一起形成重点。** 话语重音、花字和相关对象在同一段过程中加强当前含义。重点要在该看见时真正可见，不能在人物遮挡后动完，也不能与整段字幕同时抢读。

**共同离开和继续。** 人物、容器、文字和材料可以随同一组画面切镜，也可以分别让位。已经建立的对象和结果有用途时继续保留，不因进入下一条语音段就全部清空。

这些做法进入原声画稿与当前源码，制作时使用原有时序能力。创作者用秒描述自然时机，正式声音就绪后换算真实时间；不新增联动事件数据库，不要求逐词打点，不把普通切镜变成必须无缝变形的工程问题。

## 交接与真实源

当前声画稿交清准确台词、观看任务、人物可见的语义范围、主画面与材料用途、进入／变化／落稳／出口及声音如何延续。初稿可用语义和秒级时序，正式声音及素材回来后再映射真实帧，不增加第二份分镜数据库或逐句表单。

人物在全屏、缩窗、分屏及进退过渡中可见时，必须有对应真实视频。源范围按当前需要、自然起止和 Provider 能力组织；完整配音不自动触发全文人物生成。人物返回使用当前嘴型，一段台词只保留一个有效讲述声源；普通字幕位于最终画布独立层，不随人物缩放。素材不足继续取材，不用长时间讲话掩盖缺材。源复用与补生成见[人物源交接](presenter-shot-plan.md)，源时钟和接管见[时间线操作](timeline-operations.md#人物绑定与源时钟)。
