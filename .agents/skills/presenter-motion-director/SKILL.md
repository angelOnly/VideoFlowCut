---
name: presenter-motion-director
description: 围绕人物口播规划主线、动效、Cutaway、字幕和预览，让人物始终是可理解的视觉锚点。
---

# Presenter 动效导演

## 使用范围

真人或已有数字人口播需要前后景效果、稳定字幕或短全屏解释时使用。先稳定 Script、SpeechAsset 或 A-roll，再做包装。

## 必须执行

1. 执行 project-basics，读取 Script、SpeechTiming、Timeline、ActorPerformance、EffectCue 与 QualityReport。
2. 为每个重要 Beat 判断人物是否应保持安静，还是需要后景数字、前景产品、短 Cutaway 或全屏解释。
3. 人物主线尚未建立时，使用 create_presenter_timeline；需要人物合成关系时，使用 manage_actor_performance。
4. 仅使用 browse_effect_types 返回的 Registry 类型，通过 manage_effect_cues 创建 EffectCue，并使其位于所属 Scene 内。
5. 通过 render_preview_range 和 Web 真实检查进入、稳定、退出及前后连续播放。

## 专业判断

- 每个短句同一时刻只允许一个主视觉动作。高密度 Hook 后应留人物或稳定字幕的安静区。
- 先比较保持人物；小问题不用全屏，复杂机制不要硬塞人物旁边的小卡片。
- 后景适合规模、数字和氛围；前景适合产品、证据和 CTA；全屏只在需要完整阅读或建立新模型时使用。
- 人物偏左时优先把主要信息放右侧；手势、目光和表情比模板默认位置优先。

## 当前能力边界

当前没有 Avatar Provider、姿态控制、手部追踪或通用对象变换。无 Mask 时后景效果会降级为可见前景，不能伪造人物抠像或手部互动。

## 按需读取

- 密度与安静区：references/presenter-attention-curve.md。
- 后景、前景、人物自身和全屏的选择：references/presenter-effect-grammar.md。
- 人物表演与视觉协同：references/performance-and-motion-coordination.md。
- 遮挡和空间检查：../depth-composition/SKILL.md。

## 退出条件

PresenterScene、人物状态、EffectCue 与预览均属于同一 Revision；脸、嘴、手、字幕和主注意力均通过检查。
