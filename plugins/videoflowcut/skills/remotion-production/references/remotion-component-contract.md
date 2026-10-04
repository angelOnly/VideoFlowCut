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

`submit_motion_work.work.videoBindings` 是可选的命名记录，最多四槽。新作品每槽为 `{assetId, sourceStartMs, sourceEndMs, startFrame, endFrame}`。源毫秒与作品帧均为半开区间；作品帧是从 0 开始的作品局部全局时钟，不是项目 Timeline 帧。Slot 使用小写字母开头的小写字母、数字或下划线，最长 40 字符；只接受 ready、有时长和字节哈希的项目源视频，不嵌套受管动效 Asset。源范围不超出素材且单槽最长 30 秒，作品范围不超出 `durationInFrames`。平台先按作品 fps 计算源选段预计帧数，要求与 `endFrame - startFrame` 相等；Worker 再以实际解码帧数复核。源身份、范围、哈希和权利随作品固定；改绑后提交新作品，不覆盖旧版本。

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

四路共同遵守原有作品预算：偶数画布宽高各 64～1920、整数 fps 15～60、2～900 帧、时长不超过 30 秒，width × height × durationInFrames 不超过 650000000。视频源文件合计最多 512 MB，解码结果合计最多 512 MB 与 650000000 像素帧；不是每槽分别获得一份预算。根据真实动作需要选源范围与合适画布，必要拆分时同时交付接点和源时刻。

作品范围和源范围帧数不符在提交前拒绝，不创建 Job；实际解码短缺、取帧越界、哈希变化、缓存不完整、解码失败或超限也保留明确错误，不用冻结、循环或补帧掩饰。旧 Job 仍按原引擎版本保留 `BoundVideo` 行为；新作品不得沿用它。原声如需保留，交 Timeline/Audio 明确范围与所有权，和画面在同一 Preview 复核。23.976、25、30 fps 与 VFR 的源时间换算由平台按真实时间戳完成；正确解码不代表交接、裁切、阅读与表现已通过。

## Natural Box

Registry Overlay 组件的根布局尽量对应可见内容自然盒；全屏 Scene 才占 `AbsoluteFill`。受管作品首版固定为目标画布大小的透明帧，内部定位和尺寸从源码/Props 修改后重渲染；Cue 不提供自然盒缩放，不假装通用空间参数已经生效。

## 字体、资源和确定性

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
