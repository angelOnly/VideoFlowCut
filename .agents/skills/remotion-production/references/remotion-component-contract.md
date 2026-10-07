# VideoFlowCut Remotion 组件与 Registry 合同

## 生产组件与代码组件

平台组件仍通过 Registry、类型检查、渲染测试和 Golden Frame 发布。项目独有作品可经 `submit_motion_work` 保存固定源码/Props 并隔离渲染，不改平台 Registry、不重新部署服务；只有改变运行能力和全局组件才属于平台开发。剪辑任务不能直接改源码文件或绕过 MCP 执行 JSX。

## 组件输入

组件输入应来自不可变 Composition Snapshot。不得自行读取数据库、文件系统、环境变量或网络。Asset 通过项目解析后的本地可访问 URL/路径和 Binding 传入；文本、数字、颜色、枚举、Boolean 和布局参数通过 Props。

Props 应避免 `Record<string, any>` 无约束扩散。即使 EffectCue 当前允许 JSON props，具体组件仍需在 Registry 中校验。用户可见且可能修改的值公开；内部计算、临时状态和设计常量不公开。

## 局部时间

外层将 Cue 放入 Remotion `Sequence` 或传入 `localFrame = globalFrame - startFrame`。内部动画使用该局部时间；新受管视频由平台保存作品全局局部帧，内部 `Sequence` 不重置源片时间。Registry 组件按自身合同处理范围外不渲染及所需动作阶段；视频取帧越界会失败，不能借降级隐藏错误。

示意：

```tsx
<Sequence from={cue.startFrame} durationInFrames={cue.endFrame - cue.startFrame}>
  <RegisteredEffect cue={cue} assets={bindings} />
</Sequence>
```

组件内部用 `useCurrentFrame()` 得到局部 Frame（在 Sequence 中），不要再减全局 start。若 Runtime 不是 Sequence 重置，必须在统一 Adapter 计算，不能每个组件各自猜。

## 受管动态视频

这里说明当前代码已实现的合同，正式剪辑先核对所连接 Runtime/MCP 版本与实时 Schema；字段缺失或旧会话不能按本文猜测调用。工程回归证明受管执行能力，作品是否实现分镜、是否好看和声画是否成立仍由原专项根据实际媒体观察。

`submit_motion_work.work.videoBindings`为可选命名记录，最多四槽。每槽为`{assetId,sourceStartMs,sourceEndMs,startFrame,endFrame}`及可选decodeScale。源毫秒与作品帧均为半开区间；作品帧使用从0开始的作品根时钟，不是项目Timeline帧。Slot小写字母开头，可含大小写字母、数字和下划线，最长40字符。只接受ready、有真实时长和内容哈希的项目源视频，不嵌套受管动效Asset。源范围不超出素材、作品范围不超出durationInFrames；所需帧数以endFrame-startFrame为准。源范围须覆盖播放时长，允许1毫秒取整及不足一帧的选段余量，Worker按PTS复核。源身份、范围与哈希固定，改绑提交新版本。

源码通过 `import {TimelineVideo} from '@videoflowcut/motion'` 引用新合同，以 `slot` 选择素材。`fit` 可为 cover、contain、fill，默认 cover；`style` 负责受管画布内的静态或帧驱动布局。它以源时间戳按作品 fps 正常速度重采样并静音，不接受任意外部视频 URL，不隐式播放原声。素材内的关键文字、主体与动作决定裁切方式，不能仅为填满窗口而破坏证据。

`TimelineVideo` 由平台读取作品帧 `F`，取绑定源的第 `F - startFrame` 帧。内部 `Sequence` 只控制显示时段，不改变这次源片取帧。一次素材从全屏转入窗口时沿用同一槽位与声明，不再手写偏移。例如 30 fps、120 帧作品使用 `startFrame=0, endFrame=120`，源范围必须预计提供 120 帧；窗口的实际美术与运动另按本片分镜设计：

```tsx
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';

export default function Motion() {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={60}>
        <TimelineVideo slot="footage" fit="cover" />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <div style={{position: 'absolute', left: '55%', top: '20%', width: '40%', height: '50%', overflow: 'hidden'}}>
          <TimelineVideo slot="footage" fit="contain" />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}
```

画布宽高64～1920偶数、fps15～60整数、作品至少2帧；不设30秒、900帧或累计像素帧门槛。原片按内容身份共享，不按槽复制。平台按需取帧，分块缓存按驻留量回收；原片与累计解码量不受512MiB作品门槛限制。完整输出按无损体积提前检查真实磁盘空间，失败不发布半件。运行配置VIDEOFLOWCUT_MOTION_FRAME_CACHE_MIB默认256、VIDEOFLOWCUT_MOTION_SCRATCH_MIB默认512、VIDEOFLOWCUT_MOTION_DISK_RESERVE_MIB默认1024、VIDEOFLOWCUT_MOTION_FRAME_TIMEOUT_MS默认12000；缓存限额不是整个进程内存上限，不用于静默降画质。

源范围与作品范围不匹配在提交前拒绝，不创建Job；实际源短缺、越界、哈希变化或解码失败明确报错，不用冻结、循环或补帧掩饰。解码缓存损坏可从固定源重建，正式作品产物损坏则报错。历史作品产物保持可读，旧Job重新生成返回MOTION_ENGINE_UPGRADE_REQUIRED，按当前合同提交新版本；不提供两套生成入口。原声交Timeline/Audio明确范围与所有权，在同一Preview复核。新合同随managed-motion-12发布；源码与Skill存在不代表连接Runtime已经部署。正确解码不代表交接、裁切、阅读与表现已通过。

## Natural Box

Registry Overlay 组件的根布局尽量对应可见内容自然盒；全屏 Scene 才占 `AbsoluteFill`。受管作品首版固定为目标画布大小的透明帧，内部定位和尺寸从源码/Props 修改后重渲染；Cue 不提供自然盒缩放，不假装通用空间参数已经生效。

## 字体、资源和确定性

Runtime 0.1.63的受管字体目录含得意黑原生窄斜与猫啃网烟波宋七个实际文件，以及既有Noto黑体/宋体。先读当前`read_motion_capabilities`，按真实ID建立`fontBindings`，使用平台注入的`props.fonts[槽位].family/weight/style`。得意黑为400 italic；烟波宋R原件字重200，不能因名称“常规”擅改为400。使用的是猫啃网开放版烟波宋，不能称为字魂同名字款。支持发行内OTF与TTF原件，不下载、不转换、不读系统字体。目录只约束字体身份，不规定颜色、描边或动效；作者按本次内容独立编写帧驱动动作，不需要选择花字模板。未核实完整名称或分发许可的参考字款不能冒充已登记能力。

字体目录允许登记用户明确授权的商业字体，许可字段只保存来源信息，不作为OFL专属校验。字体原文件仍必须通过类型、内容哈希和首次挂载前的真实加载验证；授权确认不能代替字体文件或准确字款身份。

Runtime 0.1.64另接入用户提供的22份原件，目录共34份文件：Aa剑豪体、Aa厚底黑、Leefont蒙黑体、Muyao-Softbrush、PF频凡胡涂体、滑油字JP_N/JP_S/SC/TC、三极力量体简-粗、三极泼墨体、云峰飞云体、仓耳与墨W01–W04、仓耳舒圆体W01–W05、仓耳非白W01。只登记实际文件，云峰静龙行书缺文件暂不登记；来源与授权信息随NOTICE-UserFonts.txt发行。各版本独立固定哈希，仓耳不同粗细虽内部字重都是400仍按对应文件选择；Leefont蒙黑体为900，其余新增原件为400 normal。文件名可为发行改用ASCII，字体字节与内部元数据不变。这里仍只扩充受管动画字体，不加入字幕模板或固定动效。

字体必须在 Player 和 Render Worker 中以相同方式加载并纳入 Preflight。动画不能依赖 `Date.now()`、未固定随机或网络时序。随机效果使用 Snapshot 中的 seed。图片和视频尺寸、加载失败和 Aspect Ratio 要有明确回退。

## Motion

Motion 的设计先给出大约的秒级起止范围与交叠，按[秒级初始节奏与预览修订](../../_shared/EDITORIAL_FOUNDATIONS.md#秒级初始节奏与预览修订)完成首版并连续观看后调整，再以当次 fps 换算整数帧。确定帧数是每个渲染版本的执行要求，不把初稿节奏固化为所有后续版本的长度。

组件提供明确的 Motion Preset 或受控参数。按本次实际采用的进入、主要变化、阅读与接出处理短时长；无法完成时调整设计或明确拒绝，不允许必要动作尚未完成就被裁掉。Easing、距离和强度应由组件语义定义，不用一个通用 spring 覆盖全部。

## 安全

受管作品使用 AST/Import allowlist、帧驱动约束、独立 Chromium sandbox、响应级 CSP sandbox、网络拒绝、执行超时和输出限额。它只在渲染环境执行，主工作台读取已验证透明帧。AST 扫描并非安全沙箱；失败返回诊断，不能关闭隔离或手写 Shader 绕过。

## Registry 条目建议

```ts
interface EffectDefinition {
  type: string;
  version: string;
  component: React.ComponentType<EffectProps>;
  propsSchema: ZodSchema;
  assetSlots: AssetSlotDefinition[];
  supportedLayers: Array<'rear'|'actor'|'front'|'fullscreen'>;
  supportedAspectRatios: string[];
  defaultMotion: MotionPreset;
  qualityRules: EffectQualityRule[];
  previewFixture: string;
}
```

具体代码结构可以调整，但职责必须清楚。

## 更新与兼容

组件版本变化可能改变旧 Revision 的渲染。Snapshot 应保存 Registry/Runtime 版本，或通过迁移保持旧 Props 可解释。破坏性更新需要 Golden 回归和旧项目兼容策略。

## 原创项目作品与版本

无参考原创是正常生产路径：段内构思后写 creativeBrief，通过受管 MCP 生成固定作品，再审阅与放置。平台组件注册服务全局 Runtime；单片设计不需要增加 Registry。源码、Props、设计说明、画布和绑定形成作品版本，审阅绑定该版本；换版不继承旧结论，旧 source.json 与缓存保持可读。相关教学见 [完整创作案例](motion-graphics-casebook.md)。

项目放置使用作品实际时长换算帧数，允许不同fps；透明帧按 floor(项目局部帧×作品fps/项目fps) 读取。作品内部源毫秒、绑定帧、源码及eventMap仍属于固定作品时钟，不因修改项目fps改写。升采样不产生新增运动细节，缺帧与越界继续明确失败。
