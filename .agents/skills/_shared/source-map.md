# 专业知识来源与使用边界

## 项目内必读资料

```text
docs/chatcut视频剪辑工具拆解/
docs/chatcut视频剪辑工具拆解/官方Skill与插件译文/skills/
docs/asr接入.md
docs/导演与剪辑设计/                 若已复制到新项目
```

## ChatCut 资料提供什么

主要吸收：

- Skill 的组织方式；
- 基础 Skill 与专业 Skill 的分层；
- Script、Transcript、Timeline、Caption 的区分；
- 口播主线先于包装；
- Motion Graphic 的设计、放置和真实画面验证；
- 写后读回；
- 异步任务与完成条件；
- B-roll、字幕、声音和证据的边界。

不得直接复制：

- ChatCut 私有品牌；
- 不存在于 VideoFlowCut 的工具名；
- 后端字段；
- 付费服务合同；
- 未验证的运行时行为。

## 书籍与影视研究提供什么

主要提炼：

- 观众承诺；
- 完整语义与完整动作；
- 节奏、停顿、期待与释放；
- 注意力；
- 镜头、空间与动作连续性；
- 情绪推进；
- 声音和音乐；
- 文字设计；
- 反事实比较和整片复核。

书籍知识必须被改写为：

```text
可观察证据
→ 判断规则
→ 剪辑动作
→ 预期观众反应
→ 失败模式
→ 验证
```

不得只堆概念和名言。

## 参考视频拆解提供什么

参考视频用于提炼：

- Scene Grammar；
- Effect Grammar；
- AttentionCurve；
- StylePack；
- MotionTiming；
- Presenter 前后景层级；
- 视觉解释片的渐进式场景；
- 字幕与主视觉的注意力分工。

参考视频不是可随意截取使用的素材，除非拥有明确授权。

## API 文档提供什么

`docs/asr接入.md` 是 FunASR、OmniVoice 和 MiniMax H3 Bridge 接口的实现依据。每次正式调用前都应读取实时 workflow detail，不能长期硬编码 schemaVersion、field id、itemSlot 或 output。
