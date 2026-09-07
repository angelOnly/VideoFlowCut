# VideoFlowCut Remotion 组件与 Registry 合同

## 生产组件与代码组件

平台组件仍通过 Registry、类型检查、渲染测试和 Golden Frame 发布。项目独有作品可经 `submit_motion_work` 保存固定源码/Props 并隔离渲染，不改平台 Registry、不重新部署服务；只有改变运行能力和全局组件才属于平台开发。剪辑任务不能直接改源码文件或绕过 MCP 执行 JSX。

## 组件输入

组件输入应来自不可变 Composition Snapshot。不得自行读取数据库、文件系统、环境变量或网络。Asset 通过项目解析后的本地可访问 URL/路径和 Binding 传入；文本、数字、颜色、枚举、Boolean 和布局参数通过 Props。

Props 应避免 `Record<string, any>` 无约束扩散。即使 EffectCue 当前允许 JSON props，具体组件仍需在 Registry 中校验。用户可见且可能修改的值公开；内部计算、临时状态和设计常量不公开。

## 局部时间

外层将 Cue 放入 Remotion `Sequence` 或传入 `localFrame = globalFrame - startFrame`。绑定视频和内部动画使用局部时间。组件必须处理范围外不渲染、进入、稳定、退出和短时长降级。

示意：

```tsx
<Sequence from={cue.startFrame} durationInFrames={cue.endFrame - cue.startFrame}>
  <RegisteredEffect cue={cue} assets={bindings} />
</Sequence>
```

组件内部用 `useCurrentFrame()` 得到局部 Frame（在 Sequence 中），不要再减全局 start。若 Runtime 不是 Sequence 重置，必须在统一 Adapter 计算，不能每个组件各自猜。

## Natural Box

Registry Overlay 组件的根布局尽量对应可见内容自然盒；全屏 Scene 才占 `AbsoluteFill`。受管作品首版固定为目标画布大小的透明帧，内部定位和尺寸从源码/Props 修改后重渲染；Cue 不提供自然盒缩放，不假装通用空间参数已经生效。

## 字体、资源和确定性

字体必须在 Player 和 Render Worker 中以相同方式加载并纳入 Preflight。动画不能依赖 `Date.now()`、未固定随机或网络时序。随机效果使用 Snapshot 中的 seed。图片和视频尺寸、加载失败和 Aspect Ratio 要有明确回退。

## Motion

组件提供明确的 Motion Preset 或受控参数。Enter/Settle/Hold/Exit 必须能在短时长下压缩或拒绝，不允许退出尚未完成就被裁掉。Easing、距离和强度应由组件语义定义，不用一个通用 spring 覆盖全部。

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
