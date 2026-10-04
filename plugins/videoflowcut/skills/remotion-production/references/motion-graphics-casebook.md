# Motion Graphics 设计与生产案例库

以下示范沿用[秒级初始节奏与预览修订](../../_shared/EDITORIAL_FOUNDATIONS.md#秒级初始节奏与预览修订)：先给大约秒数与动作接续，做出完整首版，再按动作速度、阅读、旁白和前后画面调整各段与总长。示例时间不是必须填满的槽，用户锁定的声音和交付长度仍须保留。

## 完整案例：固定景别人物解释团队数量并返回

这是生产方法示范，不是已完成正式人物、字幕与声音合成的证据。输入任务是让观众理解“从一个人试用，到多人协作，最后查看配置”，主声音范围和人物上半身构图须从当前素材读取；不能把案例演示时长当作旁白实际长度。

内部比较两个构思：把配置逐条排在人物身旁，阅读直观但无法表达人数扩展；保持首件产品，从单件发展为可核对的阵列，再收回首件，让对象变化承担数量关系。选择后者的条件是有可用产品素材与足够阅读时间；仅谈配置差异时应改用共同坐标比较，不强套增殖。

可借鉴 [产品扇开案例](../../motion-case-product-fan/SKILL.md) 的身份保持和注意回收，但它只展示四件示意产品与独立数字，不是可核对的数量阵列；本节的阵列须为当前任务另外设计。入口让人物提出问题，首件落入实际可用区域；中段逐步建立数量并给出单位；结论停稳；出口将注意从阵列回收到单品和人物的行动句。复杂阵列可由全屏接管，但不固定人物必退场；没有 Mask 或指向动作证据，不设计产品穿过手掌。

初始节奏示意：约 0–1.2 秒首件进入；约 0.9–3.2 秒阵列与计数共同建立；约 2.8–4.5 秒单位和结论供阅读；约 4.1–5.6 秒回收到首件并交还人物。范围有意交叠；先完成动画并看实际人物、字幕、旁白与前后画面，再局部调整，不能把 5.6 秒固定为交付总长。

作品负责产品对象、美术、复制、计数与结尾局部状态；外层负责人物视频、字幕、Cutaway、声音和 Cue。先写 creativeBrief 与关键状态，经受管提交取得固定版本，待审可 inconclusive 放草稿，再在合成中观察真实人物与字幕。

一个具体失败与修订示范：原关键状态把阵列排在下方，独立效果清楚，合成后字幕盖住最后两行，数字先到达终值。此时不是再加缓动；应扩大可用主视觉范围、重新分配字幕预算，让可见数量与计数同步，并延长停稳。内部修改提交新版本，更新命名事件帧、复核 stale 声音，播放前后语句确认人物返回自然。若真实语音范围容不下，返回主流程调整表达范围，不能 fit 裁短结尾。

## 完整案例：读数与现实参照的解释及素材交接

这是方法示范，实际主题、旁白与素材必须来自当前任务。观看问题是“时钟读数变化，为什么不意味着天亮变早”。候选一是左右列出两个作息表，容易查数但需要观众自行推理；候选二是保留同一条日照基线，改变读数，再移动出门位置。选择后者，使制度读数与现实参照能够分别观察；若任务只有核对时刻，作息表反而更合适。

可以从 [顺滑接力案例](../../motion-case-smooth-relay/SKILL.md) 学习钟体保持和动作交叠；其中时钟只是包装演示，没有本节的日照与通勤模型。以下关系需另行构思和验证：入口建立钟面和日照基线；第二状态只改变读数，太阳参照保持；下一状态让通勤标记相对同一基线移动，保留原位；结论停留后，在自然稳定点切到已审阅的真实街景。换成汇率解释应使用同一购买物与单位基线重新构思，不能只把时钟标题换成汇率。

初始节奏示意：约 0–1.5 秒建立钟面与日照基线；约 1.2–3.0 秒只改读数；约 2.7–4.6 秒通勤标记相对基线移动；约 4.2–6.0 秒供比较并接入街景。接点与阅读时间通过完整首版预览再调，已讲清就提前交接，读不清则延长对应部分并重排后续画面，保留实际主声音。

受管源码实现二维刻度和标记，实拍通过外层 Cutaway 使用真实源范围。若需要官方制度依据，由证据专项提供真实来源图并 imageBindings 绑定，条件和单位保留；示意模型不冒充证据。跨两个 Beat 只建一件作品与一个 Cue，明确 covered_narrative_beat_ids；若预算必须拆件，优先在结论停稳处拆并核对接口。

失败与修订示范：第一次把钟面、日照条和通勤标记同时移动，虽逐帧平滑，观众失去稳定参照。修订先固定日照，再分阶段改变读数和行为，保持足够比较停留。另一种接口失败是实拍遮盖了关键移动：调整 Cutaway 入点或重做作品事件，不能让解释在背后播放完。重新审阅完整变化和切镜前后，单件 passed 不等于整片 passed。

## 完整案例：实拍物品逐步改变构图

**状态：** 以下素材、坐标与时序是假设条件，用于展示从任务到源码的完整方法。本轮没有取得对应实拍、运行这份 TSX 或生成新样片；不能把它标成已验证制作结果。正式试作必须替换为实际素材、真实观察和相应参数。

### 用户任务、素材条件与讲述

任务：用实际收拾物品的过程，讲清楚“这一次需要带走的是机身加配件的一整套”，不只依次显示电脑、电源和线材三个图标，不做缺少测量依据的重量或价格结论。

假设有一段固定机位的竖屏俯拍：桌面上先有笔记本，人依次放下这次确需携带的电源、转接头和线材，最后开始收纳。镜头本身连续，原画面包含后续配件的位置；不是靠生成模型补出原片未拍到的物品。物品放定后有短暂稳定范围，可供标签指认。

试排台词可以是：

> 只带一台电脑？先把电源放过来。还有转接头、这根线。刚才看的是机身，现在这次要装走的，是这一整套。

这不是所有笔记本的通用携带清单，也不是“这台产品必须搭配所有配件”的结论。实际素材只有电源，就删除不存在的配件；不是本片自己完成的操作，不写成“我实测／我带过”。讲述、来源和使用语境由文案作者与导演确认。

### 为什么不采用平铺卡片版

平铺版会先播电脑两秒，再切电源图标、转接头图标、线材图标，最后列一张清单。观众得到三个名词，但原片真实的手部动作、物品集合形成和收纳结果都被丢掉了。

本版让**同一段实拍持续发展**：开始主要看机身；配件接近原观察范围时，视野逐步扩大；标签只帮助认出当前物品；一条范围线由机身范围扩展到整套物品；最后图形退让，让真实收纳动作接管。构图由实际物品改变，而不是每句重新建立一张说明卡。

这里借鉴产品扇开的“集合形成和回收”、机票案例的“原对象留场和观察尺度变化”。没有照搬扇形、手机、历史配色或固定总秒数。

### 完整制作说明：可以交给本段作者继续实施

```text
本段采用固定机位俯拍实物，不给每件物品另外套卡片或发光边框。桌面保留原有
纹理、接触阴影和光向。片中共有的字体和强调色继续使用；标签一行一个名称，
主字幕在外层按当前项目处理，不将整段旁白再做一份大标题覆盖实物。

开场先让机身取得主要面积，保留足以判断它在桌上的空间。不是把横向电脑
硬拉长填满竖屏，而是在原素材允许的范围内选择观察区域；机身关键轮廓不可被裁掉。

手开始把第一件配件放入时，观察范围已经开始向配件将出现的位置扩展。
不要等物品先被裁掉，再突然拉远补救。机身始终留在画面里作为参照，新增物品
通过真实放置动作改变画面重心；不另造一份配件图标从天而降。

物品真正落定、手已离开主要观察区域后，沿实际位置接出短引线和名称。
先处理本次旁白正在说的物品，已看懂的标签降低存在感。标签沿用真实源坐标；
物品开始移动前退出，没有跟踪数据就不在运动中继续贴标签。所有文字必须在
目标观看尺寸可读，不以缩小字号解决位置冲突。

集合形成后，用一条轻的范围线从机身所占范围发展到本次全部物品的范围。
它表达“观察对象从机身变成整套物品”，不是精确测量，因此不添加面积、重量、
费用或数量结论。此时物品和整套关系是第一重点，引线和装饰让位。

收纳开始前，范围线和标签先自然退去；实拍继续，不让物体在画面冻结时被图形
假装收回。结尾停在真实装包／拿走动作的自然接点，让后一镜接住，不增加清单卡。

首版以已查看的源动作安排大约秒数。观察范围变化、标签建立和范围线展开可以
局部交叠；必须看清的真实动作与阅读保持。实际源范围或旁白更长时按内容调整，
不能为填满／压进某个样例总长而重复、冻结、循环或统一倍速。
```

### 首版时序：只示范怎样把变化落实，不当作永久时长

为便于讲解，下面假设实际选段恰好约 10 秒，30 fps。这个“10 秒”不是生产规则；真实收纳需要 15 秒时，不能仅为套用此表把它压成 10 秒。

| 参考范围 | 实拍中实际发生什么 | 画面与图形怎样配合 | 为什么这样安排 |
|---|---|---|---|
| 约 0—1.2 秒 | 机身已经可辨认，手准备带入配件 | 从允许裁切的观察区域认识机身，原桌面仍在 | 先建立明确对象，不先给全部清单 |
| 约 1.2—5.5 秒 | 配件依次进入并落定 | 同一视频持续播放，视野逐步扩大；标签在各物品确实放定后进入 | 真实动作形成集合，构图随着需要改变 |
| 约 5.5—7.5 秒 | 整套物品暂时稳定 | 保留机身参照，范围线从机身扩展至整套；其他标注退让 | 让“机身”到“整套”的关注变化可见，而不只换一句字幕 |
| 约 7.5—10 秒 | 开始实际收纳 | 图形在物品移动前退出，源片继续；结尾由真实动作完成 | 不用示意回收替代现实结果 |

实际计算标签的开始和结束，以原片观察为依据，不根据文案中“电源”一词猜测它已经落桌。若标签与手部冲突，先移动或推迟标签，而不是切掉真实动作。若旁白讲完了但收纳仍值得看，可以让原声接管，不把余下时间叫作“空等”。

### 坐标与源时钟怎样处理

把整个原画面当作一个“源坐标平面”：原视频、物品位置、范围线都在这个平面里。这个平面使用受管解码 manifest确定的、方向与宽高比正确的归一化显示坐标；不能把旋转前的编码宽高直接当作旋转后画面的坐标。观察范围改变时，只改变这个平面到作品画布的映射。标签可以通过字号补偿维持最终可读大小，但它与被指对象的归属不能漂移。

假设作品局部帧为 `F`，帧率为 `fps`，素材绑定的起点为 `sourceStartMs`。本例 `videoBindings.footage` 声明 `startFrame=0`、`endFrame=durationInFrames`，`TimelineVideo` 读取第 `F` 个已按作品 fps 重采样的源画面。对应的名义源时间为：

```text
sourceStartMs + 1000 × F / fps
```

该式用于理解映射，不把源 VFR 视频当作恒定原始帧号。真实取帧仍由平台按时间戳解码。改变画面位置和大小，不改变 `F`；素材不会因为缩放而从头播放。

固定坐标只适用于物体在已观察范围内确实停稳的情况。镜头平移、手持透视变化或物体继续运动时，本模板不提供自动跟踪，需要换素材范围、减少标注，或另行提出真实跟踪能力需求。

### 完整技术试作源码

以下源码展示同一视频实例、共同坐标、连续观察范围和定时标注的实现。**它是需要实际素材驱动的工程试作模板，不是顶级美术效果的自动保证，也不是可以不填参数直接提交的 MCP 请求。** 参数是普通作品 `props`，不是新平台字段；素材仍通过当前 `videoBindings.footage` 绑定。

```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';

type Box = {x: number; y: number; width: number; height: number};
type Mark = {
  id: string; text: string;
  x: number; y: number; labelX: number; labelY: number;
  startSec: number; endSec: number;
};
type Props = {
  sourceWidth: number; sourceHeight: number;
  viewBefore: Box; viewAfter: Box;
  cameraStartSec: number; cameraEndSec: number;
  scopeBefore: Box; scopeAfter: Box;
  scopeStartSec: number; scopeExpandedSec: number; scopeEndSec: number;
  marks: Mark[];
  background: string; ink: string; accent: string; labelFill: string;
};

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
function progress(t: number, a: number, b: number) {
  if (!(b > a)) throw new Error('Invalid time range');
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
function blendBox(a: Box, b: Box, p: number): Box {
  return {
    x: mix(a.x, b.x, p), y: mix(a.y, b.y, p),
    width: mix(a.width, b.width, p), height: mix(a.height, b.height, p),
  };
}
function visible(t: number, start: number, end: number) {
  if (!(end > start)) throw new Error('Invalid visible range');
  const fade = Math.min(0.2, (end - start) / 3);
  return progress(t, start, start + fade) *
    (1 - progress(t, end - fade, end));
}

// 使用与画面相同的参数计算事件。事件表仍不代替真实观看。
export function resolveMotionEvents(
  p: Props, c: {fps: number; durationInFrames: number}
) {
  const frame = (s: number) => Math.round(s * c.fps);
  return [
    {id: 'view-expands', meaning: '观察范围开始扩大',
      startFrame: frame(p.cameraStartSec), endFrame: frame(p.cameraEndSec)},
    {id: 'whole-set-visible', meaning: '范围线到达整套物品的观察范围',
      startFrame: frame(p.scopeExpandedSec)},
    {id: 'graphics-yield', meaning: '图形让位给后续真实收纳',
      startFrame: frame(p.scopeEndSec)},
  ];
}

export default function Motion(p: Props) {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const view = blendBox(p.viewBefore, p.viewAfter,
    progress(t, p.cameraStartSec, p.cameraEndSec));
  if (!(p.sourceWidth > 0 && p.sourceHeight > 0 &&
        view.width > 0 && view.height > 0)) throw new Error('Invalid geometry');
  const k = Math.min(width / view.width, height / view.height);
  const tx = (width - view.width * k) / 2 - view.x * k;
  const ty = (height - view.height * k) / 2 - view.y * k;
  const scope = blendBox(p.scopeBefore, p.scopeAfter,
    progress(t, p.scopeStartSec, p.scopeExpandedSec));
  const scopeOpacity = visible(t, p.scopeStartSec, p.scopeEndSec);

  return <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
    <div style={{
      position: 'absolute', left: 0, top: 0,
      width: p.sourceWidth, height: p.sourceHeight,
      transformOrigin: '0 0',
      transform: `translate(${tx}px, ${ty}px) scale(${k})`,
    }}>
      <div style={{position: 'absolute', inset: 0}}>
        <TimelineVideo slot="footage" fit="contain" />
      </div>
      <svg width={p.sourceWidth} height={p.sourceHeight}
        viewBox={`0 0 ${p.sourceWidth} ${p.sourceHeight}`}
        style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <rect x={scope.x} y={scope.y}
          width={scope.width} height={scope.height}
          rx={12 / k} fill="none" stroke={p.accent}
          strokeWidth={2 / k} opacity={scopeOpacity} />
        {p.marks.map((mark) => {
          const alpha = visible(t, mark.startSec, mark.endSec);
          // 标签尺寸在最终画布上保持；归属位置仍来自同一源坐标。
          const labelWidth = (mark.text.length * 30 + 28) / k;
          const labelHeight = 48 / k;
          return <g key={mark.id} opacity={alpha}>
            <path d={`M${mark.x} ${mark.y} L${mark.labelX} ${mark.labelY}`}
              stroke={p.ink} strokeWidth={2 / k} fill="none" />
            <circle cx={mark.x} cy={mark.y} r={4 / k} fill={p.accent} />
            <rect x={mark.labelX} y={mark.labelY - labelHeight / 2}
              width={labelWidth} height={labelHeight}
              rx={6 / k} fill={p.labelFill} />
            <text x={mark.labelX + 14 / k} y={mark.labelY + 10 / k}
              fontFamily="Microsoft YaHei, sans-serif" fontSize={30 / k}
              fontWeight={600} fill={p.ink}>{mark.text}</text>
          </g>;
        })}
      </svg>
    </div>
  </AbsoluteFill>;
}
```

**参数怎样填写，才能不是一份空源码：**

| 参数 | 取得依据与填写规则 |
|---|---|
| `sourceWidth / sourceHeight` | 当前素材用于画面观察的实际显示尺寸，核对旋转与宽高比；不是随意填一个理想尺寸 |
| `viewBefore / viewAfter` | 在完整源画面上选定的两个观察区域；保护机身和后续物品，按目标画幅验证，不把示例坐标当实际测量 |
| `cameraStartSec / cameraEndSec` | 当前选段局部秒数；配件接近原视野边缘时开始扩大，按实际动作与阅读调整 |
| `scopeBefore / scopeAfter` | 机身与整套物品的实际观察包围范围；只表达观察范围，不作为精确测量数据 |
| `scopeStartSec / scopeExpandedSec / scopeEndSec` | 物品稳定后开始说明整套关系；范围线建立、到达与退出的局部秒数；退出应先于无跟踪的物体移动 |
| `marks` | 每个标注的实际对象位置、文字位置、放定之后到再次移动之前的显示范围；可少于或多于教学假设，不编造对象 |
| 四个色彩参数 | 从本片视觉语言和实际桌面决定；保证可辨认，不强制历史案例的黑底荧光配色 |

纯几何调试时，可以用人为设定的源尺寸 `1080×1920`、入口视域 `{x:90,y:200,width:900,height:1600}`、出口视域 `{x:0,y:0,width:1080,height:1920}`，检查两者在 `720×1280` 画布上的映射。这些数值**不描述一份已取得的素材**。标注坐标、实际源 ID 和源时间必须等待对应材料；没有材料时停在教学／工程测试，不冒充正式作品。

提交前由作者检查：时间严格有序、各事件在当前帧数内；标注 ID 唯一；标签在完整运动中不越界、不挡物体和字幕；真实字体下文字宽度适用。源码用字符数估计标签宽度只是中文短标签的试作做法，不是通用排版测量；长文本和混排需要按实际字形另行安排。

本例只有一次根级 `TimelineVideo`，图形与视频共同变换；没有调用浏览器、网络、文件、音频或外部依赖。是否被当前平台校验器接受、是否达到预期观感，仍须实际提交与渲染测试。该案例源码仍需结合实际素材单独验证。

### 生成之后，怎样据实际问题改，而不只加缓动

| 实际观察到的问题 | 修改什么 | 复核什么 |
|---|---|---|
| 第一件配件进入时被裁在画面外 | 提前或重新定向扩大观察范围，调整入口视域 | 放入到落定的完整动作是否可见，机身是否仍可辨认 |
| 标签在手还遮着物品时出现 | 根据真实放定时刻推迟标签，或改标签位置 | 指认是否依附正确物品，手部动作有没有被遮挡 |
| 全部标签都在抢戏，整套关系不明显 | 已完成指认的标签提前退出；范围线阶段降低其他标注对比 | 观众是否能从单品切换到整套关系 |
| 拉远以后留白仍无用途 | 按实际物品调整出口视域与标签布局；必要时换更适合的素材构图 | 是否只是换了一个居中小框，还是实际对象改变了构图 |
| 放大后纹理或接口模糊 | 先核对原片细节与解码尺寸，再按当前视频绑定合同请求足够像素；必要时改观察范围 | 实际输出尺寸下细节是否恢复；不能以增大文字或锐化假装找回原像素 |
| 收纳时范围线与标签悬在空桌上 | 在实际物体移动前撤去图形，保留真实动作和原声 | 是否让现实过程完成结尾，而不是无根据的静态标注 |
| 台词结束得太早或重复解释动作 | 回文案作者调整准确台词，或让原声／动作接管 | 声画整体自然，不以冻结画面填满 TTS |

### 换成真实录屏时，迁移什么，不照搬什么

网页或软件题材可以保留共同坐标与源时钟，但不照搬物品集合的范围线：先让实际界面建立对象，靠近将操作的区域；点击和状态变化继续由原录屏演出；图形指认真实变化，再退回能核对结果的画面。

需要引入真实说明页时，可以让仍有参照价值的录屏缩退，实际说明页取得主要阅读面积，再回到相关结果。是否两者同屏取决于阅读负荷，不固定使用左右分栏。原页面文字、高亮和视域共用坐标；没有原文截图时不能绘制一个看似官方的页面冒充来源。

这种迁移重新设计主要画面、阅读时机与出口，不只是把源码标签“电源”改成“设置”。

## 适合直接复用时

以下 Registry 案例在设计匹配时直接使用，不能作为所有原创任务的默认菜单。

## MetricBackdrop

适合数字是主要结论、规模或里程碑。背景先建立单位和语境，数字在语言落点稳定，人物仍是前景。错误：只显示巨大 70，没有“台平板”与活动语境；数字一直跳动，观众无法读取。

## ProductFan

真实产品 Asset 通过 Binding 进入。适合多件产品或方案展开，构图与人物手势/安全区协同。没有真实产品、画幅太窄或人物正在做关键手势时，改为全屏展示或单产品，不用三张文字卡占位。

## PortfolioWall

展示真实作品封面，选择代表性而不是全部堆满。入口可以从少到多，Settled Frame 保留层级和可识别封面。若封面数量过多，分组或轮播；不要用 A/B/C 方块冒充。

## CommentCloud

评论必须来自真实项目内容或明确示意。它常作为环境/社会反馈而非主证据。人物仍是重点时降低对比和速度；需要阅读具体评论时切全屏或 Evidence。滚动过快只造成噪声。

## EvidenceCard

显示真实截图、来源和重点。卡片只适合短证据；完整文档切 EvidenceDocument。高亮与旁白落点同步，保护条件和否定。漂亮假横线不是证据。

## CameraPunch

用于包袱、结论、反应或构图变化，强度短且有落点。不要每句话推近；焦点应落在有效表情或对象。长慢推可以建立接近感，但需要从环境到人物的叙事理由。

## DeviceShowcase

真实 UI/截图绑定设备框。设备不是装饰，应让操作和状态可见。复杂步骤使用 UIWalkthrough，不把整页缩在人物旁边。竖屏视频中的手机框要避免“竖中竖”过小。

## ContentCarousel

用于案例、产品或作品逐项出现。每项需要足够识别，数量和顺序有理由。若旁白逐项解释，可渐进；若只是快速展示，音乐和运动保持简单。不要为了填满空间放无关卡片。

## FullScreenMeme / ComicReaction

只在笑点或中断明确时短暂使用，通常在包袱后。来源和权利要清楚。梗图不能替代人物反应，也不能让严肃内容突然失调。

## GlowCTA

CTA 先有行动理由，按钮/入口与动词清楚。Glow 只是注意手段，不是内容。保持到观众知道怎样行动，不能一闪而过。

## EndCard

回收品牌、结论和下一步。不要在最后一秒塞所有信息。与开头承诺呼应，给行动和阅读足够时间，音乐有收束。

## 同一视觉语言，不同形式

一条视频可以让 Metric、Evidence、UI 和 EndCard 使用同一色板、字体、间距和运动语气，但形式由各自任务决定。全部用同一圆角卡片不是统一，而是模板化。
