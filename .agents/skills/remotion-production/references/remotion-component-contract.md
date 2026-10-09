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

组件属性名称是数据键，不是全局变量读取。例如 `<RuleLine top={148}/>`、局部参数 `top` 和对象键 `{top:148}` 可以正常使用；`top={window.top}`、未绑定的 `{top}` 仍读取禁用全局。属性名称的放行不豁免属性值、对象展开、事件、HTML 注入或外部资源入口。源码校验拒绝包含 `work.source` 的行列与具体依据时，由原作者判断并修订；只有提交层明确给出无副作用和纠正许可才可提交一次。诊断误判不通过改名规避，已入队 Worker 失败不按参数纠正重放。

字体目录允许登记用户明确授权的商业字体，许可字段只保存来源信息，不作为OFL专属校验。字体原文件仍必须通过类型、内容哈希和首次挂载前的真实加载验证；授权确认不能代替字体文件或准确字款身份。

字体必须在 Player 和 Render Worker 中以相同方式加载并纳入 Preflight。动画不能依赖 `Date.now()`、未固定随机或网络时序。随机效果使用 Snapshot 中的 seed。图片和视频尺寸、加载失败和 Aspect Ratio 要有明确回退。

## Motion

Motion 的设计先给出大约的秒级起止范围与交叠，按[秒级初始节奏与预览修订](../../effect-timing/SKILL.md#秒级初始节奏与预览修订)完成首版并连续观看后调整，再以当次 fps 换算整数帧。确定帧数是每个渲染版本的执行要求，不把初稿节奏固化为所有后续版本的长度。

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

无参考原创是正常生产路径：段内构思后写 creativeBrief，通过受管 MCP 生成固定作品，再审阅与放置。平台组件注册服务全局 Runtime；单片设计不需要增加 Registry。源码、Props、设计说明、画布和绑定形成作品版本，审阅绑定该版本；换版不继承旧结论，旧 source.json 与缓存保持可读。相关教学见 [完整创作案例](remotion-component-contract.md)。

项目放置使用作品实际时长换算帧数，允许不同fps；透明帧按 floor(项目局部帧×作品fps/项目fps) 读取。作品内部源毫秒、绑定帧、源码及eventMap仍属于固定作品时钟，不因修改项目fps改写。升采样不产生新增运动细节，缺帧与越界继续明确失败。

## 实现依据素材发生的动画，而非动画前后插图

先读导演当前完整采用稿、真实材料和观察，按 [场面执行正文](../../_shared/SCENE_DESIGN_HANDOFF.md)、[素材到场面](../../production-director/references/asset-briefing.md) 与 [源坐标和时间](material-space-and-time.md) 核对实际输入。美术、运动、源码和局部修订由同一原作者负责，不让组件默认值替代已经选好的表达。

原创段先用 [场面美术与运动](../../visual-treatment-planning/references/art-direction.md) 确定主体造型、准确字样、入口、风险中途与阅读状态，再沿 [完整演出写法](../../motion-brief-writing/SKILL.md) 深化。同一内容需要局部试作时，按当前受管能力请求实际预排；主要表达要改回导演采用，局部坐标和曲线不逐项审批。

编写前明确源内目标、真实/原创身份、源范围、显示几何、依附内容与出口。原件、局部窗、轮廓、文字、边缘和阴影共享正确归属与变换；同源多窗共用取帧时钟。不能用没有可靠跟踪或抠像的画面假称取得了可分离对象，改稳定范围、诚实取景或当前示意。

把关联变化按本场行为求值：谁发起，什么到达或显露后结果才开始，哪些旧状态保留，新重点何时读清。不强制所有属性共用曲线或所有对象错相。保留准确定义的比较、数量与身份，不用物理形变暗示不存在的真实因果。风险中途在当前源码里实际渲染，不能只看起终两帧。

专业方法无案例也可用；合适参考可从构思及相关阶段借鉴，写明本片采用的关系与不继承内容，不让演员、物体、色板或时长形成默认模板。旧参考里现成动画不作为本次原创；比较好看与否须回到当前真实产物。

正式提交保留当前受管合同：素材从imageBindings/videoBindings进入，TimelineVideo按作品根时钟和绑定的startFrame/endFrame正常播放，内部Sequence只改变布局；源声在整片声音链中管理。四时钟、方向/SAR、decodeScale与实际画幅读回，不凭原视频帧号猜偏移。字体仍用实时登记身份与原有选择合同，不引入任意浏览器字体加载或额外全局状态。

源范围、焦点、文字或声音变了，原作者重做受影响构图、路径、标签与前后接口，再提交新作品。动画与resolveMotionEvents尽量共用命名时机，预算拆件保留出口状态和源时间，全文不静默截断。检查当前材料进入前、中途相互作用、阅读、出口和相邻声画；真实未知保留，技术问题不靠放宽沙箱或绕过MCP解决。

需要借鉴时用 [语义参考库](../../motion-case-library/SKILL.md) 理解当前问题、阅读候选资料，再写本片具体决定；不只依赖关键词命中，也不将检索变成制作前置门槛。

## 先区分项目创作与平台开发

单片原创是项目创作，通过受管 MCP 提交，不需增加全局 Registry。平台 API、依赖、隔离或通用组件实现的更改属于平台开发；剪辑任务不得修改源码、安装依赖或绕过 MCP。局部修改已有 Cue 时保持用户范围。

## 编码或选择组件前的输入

本段需要真实动作、动态窗口与解释性图形共同发展，或此前作品反复出现
“实拍两秒后退出、其余只剩图标”时，完整读取
[混合素材完整教学例](remotion-component-contract.md)。学习素材条件、观察尺度、相对坐标、
源时钟、准确指令、源码与修订怎样接在一起；它是教学示范，不是已验证新成片。
按当前题材重新设计，不要求每段都拍桌面或排列配件。

案例 Skill 是设计与实现教学，不是内置 Registry 组件的别名。读取产品扇开等
案例之后，先确认所选组件是否实际实现本段需要的内部关系变化，不能只因名称
相近，就把连续展开、聚合和回收替换成一张固定排列卡片的整体进出场。

现有组件能够完成简单强调或当前表达时继续使用。需要对象持续、观察尺度变化、
真实视频共同运动，而现有组件不能兑现时，沿受管原创作品路径实现。不要为了
修正这一差别，重做所有组件、强迫所有原片进入 Remotion 或新建动效引擎。

代表段交回实际采用的路径、对象／源码及预览。审阅核对内部过程、默认尺寸与
当前观看目标，而不只检查读过哪个 Skill；布局不适合时改构图，不补无关装饰。

必须知道：这个 MG 在剪辑中承担什么观众任务；准确文字、数字、媒体和事实；目标画幅、Scene 和放置范围；人物、实际字幕位置、证据与画幅；语音/动作/声音时机；Style 来源；需要暴露为 Props 的可编辑值；可用 Asset；当前 Registry 与 Runtime 能力。

只问会实质改变结果的高杠杆信息。若风格已经由 StylePack、参考视频或已接受组件确定，不要每个 MG 都重新询问。

## Style 对齐和代表性样例 Gate

无参考时依据当前内容、素材和受众自主确定视觉语言并记录到现有创作决定。样段是内部验证，正常完成后继续原任务，不逐段请求用户批准。

批量制作相关段落前，选一个真正体现本片主要表达方式的段落作代表样例。
如果成片需要实拍与图形共同发展，样例也使用实际视频、准确文字与当前声音，
而不是只验证一个纯图形片头。检查主要构图，也检查最关键的运动中途和交接；
再放进实际人物、字幕与前后镜头中连续观看。

样例确定可复用的字体层级、色彩关系、边界处理、材质和运动语气，不确定
全片必须复用一个布局。不同内容可以采用全画面实拍、局部观察、稳定比较、
透明标注或连续混合场面。并排关键帧用于美术比较，连续预览用于动作与接点，
整片声画用于节奏和密度，三者不能相互替代。

当前代码的 StylePack Runtime 消费仍有限，因此 Skill 可以要求一致性并通过 Props/现有组件实现，但不能声称一个 stylePackId 已自动控制全部字体、色彩和运动。真实 Preview 是最终证据。

## 主要构图与连续运动一起设计

用当前准确文字、实际素材和目标画幅，同时设计必要的主要构图与连接过程。
需要读字、比较或看反应时，安排稳定状态；正在靠近、展开或交换重点时，
关键画面可以位于运动中途。不要先设计一组互不相关的完成态，再统一添加进出场。

每个主要构图决定观众第一眼看什么、主体有多大、旧重点怎样保留或退让，
以及下一变化为何发生。尺寸由需要看清的内容决定：要看屏幕操作，就让操作区域
具有足够面积；要看物品之间的关系，就保留关系，而不是始终居中放一个小设备。
留白用于实际呼吸、运动、阅读或后续比较，不靠无关装饰填满画面。

连接两个构图时，同时决定共同父层、相对坐标、视点、路径、速度变化、遮挡、
注意转移和接续。起终点都漂亮而中途双影、跳位、丢失参照，仍然需要重做。
真实视频的内部动作和外部重构图共用明确的时间映射；缩成小窗后不能从头重播。

主体结构和美术要支持这些变化。票面日期应属于票面，屏幕内容属于界面，
产品标注属于其所指对象；让轮廓、排印、明暗、材质与运动一起成立。
并非所有层都运动：真实操作可以继续，外框稳定；正在阅读的条款可以稳定，
其他解释退让。动作多少与动画是否顺滑，都不能单独证明场面好看。

最重要的接点用实际材料先做连续试作。通过后沿用同一作者、同一对象结构
继续精修；不以占位矩形移动成功代替实际页面、人物或物品的合成验证。

## Registry、EffectCue 与真实素材

当前 Registry 包含 MetricBackdrop、ProductFan、GlowCTA、PortfolioWall、CommentCloud、EvidenceCard、CameraPunch、FullScreenMeme、DeviceShowcase、ContentCarousel、EndCard。

这些名称表示能力，不表示每条视频都要使用。ProductFan 必须绑定真实产品；PortfolioWall 使用实际封面；CommentCloud 使用真实评论；EvidenceCard 使用来源素材；DeviceShowcase 使用真实 UI/截图。没有 AssetBinding 时，应选择不依赖素材的机制或停止，不用占位图冒充完成。

`quality_rules` 当前只接受代码定义的枚举，创作理由写 narrative_purpose、audience_task 和 note，不把任意自由文本塞进质量规则。

## Props 设计

Props 应暴露用户可见且可能变化的内容：文字、数字、主色、强调色、图片/视频 Asset、布局选项、强度和必要 Motion。不要把内部实现细节全部暴露，也不要把内容硬编码进组件。

Props 需要默认值、合法范围、类型和回退。Asset 通过项目 Binding 传入，不在组件中硬写本地路径或远程 URL。组件不得自行联网或读取文件系统。

## 局部时间与 Remotion Sequence

声音需要绑定作品实际执行产生的事件。受管源码可导出 `resolveMotionEvents(props, {fps, durationInFrames})`，返回包含 id、meaning、startFrame 和可选 endFrame 的数组；画面与事件必须共用同一份时序常量或计算函数。渲染器在隔离浏览器读取并检查确定性、重复 ID 和范围，随作品固定 eventMap 版本。用 `read_motion_work`/Asset 读回实际事件，再交给 effect-timing 和 audio-finishing；不要另写一张与画面无关的手填时间表。持续动作交付起止范围，是否全程发声由 SoundPlan 决定。学习案例沿当前 [motion-case-library](../../motion-case-library/SKILL.md) 的共同参考与局部技法入口，配声版本另行生成，不改归档样例。

Cue 在整条 Composition 中可能从第 1000 帧开始，但绑定视频、内部动画和计数使用作品局部时钟。外层 `Sequence` 重置 Cue 时间，作品内再嵌套 `Sequence` 时，`useCurrentFrame()` 会再次从该序列零点计数。`TimelineVideo` 读取平台保存的作品局部全局帧，内部 Sequence 重置只影响视觉布局，不重置源片；跨序列仍从同一槽位连续取帧。

Timeline 范围必须容纳本作品实际采用的进入、主要变化、必要阅读与接出。不能用更短 Item 截断组件内部未完成动画；主线时长变化时，重新编译或调整 Cue，而不是依赖偶然裁切。

## Natural Box 与 Timeline Canvas

Registry Overlay 组件的自然 Asset Box 应紧密包围可见内容，便于定位；真正全屏 Scene 才占满画布。受管作品首版采用目标画布大小的透明缓存，因此内部排版由源码负责，不声称 Inspector 能直接移动可见对象的自然盒。

透明画布的 `full_frame` 只是作品坐标系，不等于遮挡全屏。作品内部的标题、说明、图形、封面文字和运动由源码设计，不统一套用标题栏或固定字幕保留带。平台不测量字幕安全区相交，不据此阻断或提示；PNG 透明效果与帧完整性校验继续保留。人物、字幕、进入退出和整片观感仍通过真实连续审片判断。

最终放置要结合目标帧、人物、字幕、证据和画幅。字幕默认位置不是其他内容的禁入区域；同一 Anchor 只有在观众任务和构图关系重复时才应复用。

## 批量生产和一致性

关键帧并排比较只验证美术；连续段验证动作与交接；完整成片检查重复、密度与声音。三类证据不能相互替代。

多个 MG 按采用的代表段与 Design Map 分组制作。并排比较主要构图的色板、字体与材质，连续观看关键动作中途和交接，再以整片声画核对节奏和密度。重复形式应来自重复任务；同一视觉语言不等于全片同一布局。

## 当前代码安全边界

生产使用已注册组件，或通过已发布 MCP 创建的受管作品。作品代码只在独立 Chromium OS sandbox 与 CSP opaque origin 中执行，网络默认拒绝；静态分析只是依赖和确定性约束，不代替隔离。禁止关闭 sandbox、访问宿主文件/凭据、临时安装依赖，或将未验证作品直接注入主工作台。

## Scene 组件与 Effect 组件

Effect 通常在已有 Scene 中短时增加变化；Scene 组件建立完整视觉模型。一个需要 8 秒展示流程的内容不应被强行作为人物旁边的小 Effect；一个只强调两秒数字的内容不需要新建全屏 Scene。

Registry 设计应让生产 Skill先选择层级：

- Presenter Overlay：人物保持主视觉；
- Presenter Rear/Front/Actor Effect：与人物空间协同；
- Fullscreen Scene：视觉接管；
- Global/EndCard：跨 Scene 或结尾；
- Derived Asset：先离线生成复杂静态组合，Runtime 只负责时序和轻运动。

## 媒体 Asset 处理

读取实时 Schema 后，视频绑定可按真实观察尺度选择 `decodeScale`（0–1 之间且不含0）；缺省缩入画布。源坐标以 Worker 读回的归一化显示尺寸为准，显式解码每边2–1920像素；全部源文件、全部解码像素帧及PNG字节分别受预算限制。缩短选段不能减少原文件字节。作品完成后使用 `bind_media_adoption` 的 `{effectCueId, motionVideoSlot}` 关联内部原片完整绑定范围；外层 `slot=motion` 是作品本身。旧作品缺摘要时生成新版本，不猜测历史源范围。内部视频静音，原声必须另沿真实声音用途关联。

受管作品内部图片以实时 Schema 的 `{effectCueId, motionImageSlot}` 关联采用依据，槽名对应 `work.imageBindings`，不能用外层 `slot=motion` 代替原图。平台核对原图哈希、固定作品版本与每次放置；旧作品缺图片摘要时，仅在显式关联中从同版成功 Job 核验恢复，不需要重新渲染。找不到原任务、版本不一致或槽位不存在时停止该关联，不凭 `sourceAssetIds` 猜测。局部观察仍不能批准未经裁切的整图使用。当前单张绑定图片原文件上限为 8 MiB，与画布像素帧预算分开；超过时由原作者按正式素材能力重新选择和复核实际载体，不外部压图绕过。

视频要持续承担动作时，优先保持一个有明确源时钟的实例，由共同外层完成
位置、尺度和裁切变化。跨 Sequence 或实例接管时显式处理局部帧偏移；
不要把“组件重新出现”当成“源动作接着播放”。采用 fit 前核对真实内容，
不能为了填满画布裁掉关键按钮、手部动作、条款条件或比较对象。

视频内的固定位置标注可以使用源坐标，与视频图像共用变换；物体本身移动时，
固定坐标不构成跟踪。没有真实轨迹就只在可靠停稳范围标注，或重新设计。
原声不在作品源码里播放；需要时沿现有音轨链明确保留范围并实际听审。

受管视频入口是 `submit_motion_work.work.videoBindings`，可省略，单作品最多四个命名 Slot。每槽写 `{assetId, sourceStartMs, sourceEndMs, startFrame, endFrame}`，可选decodeScale：源毫秒与作品帧均为正长度半开区间，不超出真实素材与作品；只绑定 ready、有真实时长与内容哈希的源视频，不能嵌套另一份 managed motion。平台保留源身份和范围，作品改绑或改范围需要新版本。新合同随managed-motion-12发布，正式剪辑仍先读取当前连接的版本与实时Schema，不把仓库源码等同已部署能力。

图片和视频必须来自项目受管 Asset。决定 `cover/contain` 前查看需要保护的文字、主体和动作；证据、UI 与海报不能因为填满窗口而裁掉必要内容。源码从 `@videoflowcut/motion` 导入 `TimelineVideo`，例如 `<TimelineVideo slot="footage" fit="cover" style={...} />`，用 slot 引用绑定源，不传外部 URL。`fit` 支持 cover、contain、fill，位置、尺度、遮罩与运动由确定性的源码布局实现；形变是否适合内容仍需实际观看。

`TimelineVideo`的视频帧由作品当前帧减去绑定的startFrame得出，实际输出帧数以endFrame-startFrame为准。源范围须覆盖正常速度播放所需时长，允许1毫秒取整及不足一个作品帧的选段余量，不向上取整多生成一帧。内部Sequence只控制显示和布局，不重置源时间，也不接受offsetInFrames。源按真实PTS以作品fps重采样，VFR按原有时间间隔显示，播放器始终静音；不把源原生帧号套到作品时钟。全屏转窗口沿用同一槽位；源不足、范围越界、哈希变化和解码失败报错，不人为冻结、循环或补帧。原声由Timeline/Audio明确归属，并在同一Preview复核。

画布宽高为64～1920偶数、fps为15～60整数，作品至少2帧；不按30秒、900帧或累计650000000像素帧要求导演拆件。平台按内容身份共享原片，有界取帧与回收解码缓存；原片大小、重复引用和累计解码量不再触发512MiB作品门槛。完整透明输出仍需要实际磁盘空间，Worker在解码前检查输出、代理、工作区和安全余量，渲染中持续检查；空间不足、源损坏和卡死明确报错，不降画质或丢片段。缓存配置属于平台运行配置，创作者按内容选择选段与画布，不通过缩短选段误以为减少原件字节。一个Job完成全部帧后才登记一个完整Asset，技术检查不代替艺术验收。

完整参数、跨 Sequence 时间接续示例与失败边界见[Remotion 组件合同](remotion-component-contract.md#受管动态视频)。技术回归只证明该输入能确定性执行；原专项仍需观看实际对象、源时刻、裁切、阅读与前后声画，不能将工程测试当成艺术验收。

## 性能和缓存

复杂 Scene 避免每帧重新解析大 JSON、计算重布局或创建大量 DOM。预处理封面墙、评论云和图表为 Derived Asset 可以减少 Runtime 压力，同时保留来源。缓存键应包含 Revision、Scene Props、Asset Version、Style、Cue 和 Runtime 版本。修改一个标签不应让整片全部失效。

## 反例：哲学口播套全部组件

“我一直把生活推到以后”不自动需要 ProductFan、CommentCloud、PortfolioWall 和 FullScreenMeme。可依据表演与语义选择短语排印、心理距离变化或关系 Scene，也可以在真实反应承担表达时保持人物；题材不预设强度上限。Registry Coverage 属于组件冒烟测试，不属于创作验收。

## 完整代码与生产案例

详细组件合同、Registry 设计和 Timeline 验证见：

- [组件与作品合同](remotion-component-contract.md)
- [完整创作案例](remotion-component-contract.md)

## 适合直接复用时

以下 Registry 案例在设计匹配时直接使用，不能作为所有原创任务的默认菜单。

## MetricBackdrop

适合数字是主要结论、规模或里程碑。背景先建立单位和语境，数字在语言落点稳定，人物仍是前景。错误：只显示巨大数值却没有单位与语境；数字一直跳动，观众无法读取。

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

只在笑点或中断明确时短暂使用，通常在包袱后。实际来源要清楚。梗图不能替代人物反应，也不能让严肃内容突然失调。

## GlowCTA

CTA 先有行动理由，按钮/入口与动词清楚。Glow 只是注意手段，不是内容。保持到观众知道怎样行动，不能一闪而过。

## EndCard

回收品牌、结论和下一步。不要在最后一秒塞所有信息。与开头承诺呼应，给行动和阅读足够时间，音乐有收束。

## 同一视觉语言，不同形式

一条视频可以让 Metric、Evidence、UI 和 EndCard 使用同一色板、字体、间距和运动语气，但形式由各自任务决定。全部用同一圆角卡片不是统一，而是模板化。


## 字体身份与实际字重

编写前查询当前 `read_motion_capabilities` 的真实目录。槽位通过 `fontBindings` 固定到实际文件，平台在首次挂载前验证哈希并完成加载，通过 `props.fonts` 注入 family、weight、style。文件粗细以原件为准，名称“常规”不保证400；同一家族不同文件也可能均标400。按真实字形选择，不制造CSS假字重。

用户确认的授权不替代文件身份和实际字重；新增字体由平台任务验证并发布 Runtime。原件缺失、变更、损坏或加载失败明确失败，不回退系统字体，不产生半件 Asset。实际文案检查中文、标点、缺字与换行；目录登记不能证明所有字形都有覆盖。缺失理想字体的推荐、工作台预览与聊天选择由协调者按项目写入参考执行。

## 随机与碰撞的任意帧重建

受管渲染可以跳帧、重复取同一帧或并发计算。随机分布和碰撞不能依赖“先播放过上一帧”才能得到当前正确状态。使用固定种子生成初始参数，并采用按时间可计算的轨迹、预计算状态或其他可复现方案；固定种子只固定初值，不能自动修复依赖可变播放历史的模拟。

保留落稳对象的身份与后续接触状态，远近细节变化不能改变几何身份。检查同一帧重复取样、乱序跳帧及连续播放得到的状态是否一致，并查看关键接触前后；数学一致不替代碰撞观感和遮挡的实际预览。
