# Stable Audio 3 音效指令与提交

## 当前模型与接口边界

使用已部署的 `stable-audio-3-medium-v1`，由项目现有 Bridge 客户端调用。工作流使用后训练 Medium，接收英文声音描述，不进行二次提示词扩写。声音作者不安装模型、不修改工作流或服务依赖；真实能力和字段范围以当次 Schema 为准。

当前工作流只公开 `prompt`、`duration_seconds`、`seed`，音频输出槽为 `audio`。`duration_seconds` 范围为 1–120 秒，表示最大时长，结果可能更短；一秒是当前接口最小生成窗口，不代表一次点击必须响一秒。`seed` 为 0–9007199254740991 的整数。实际音轨、时长和可用范围仍须从返回文件读取。

模型主要以英文描述训练，适合声音效果；它不会识别当前视频的运动或保证某一下严格发生在指定帧。官方推理说明中，独立 `negative_prompt` 和 CFG 调整只对相应 base 模型有效，当前后训练工作流也未公开它们。不要借未发布参数承诺去除人声、音乐或精确时间控制。

## 从中文要求到提交参数

先写中文声音设计，明确声源、动作、起音与衰减、空间和检查重点，再写英文 prompt。旁白避让、目标动画事件和最终增益保留在既有声音意图、需求与交接稿中，不传给模型当控制参数。

由主任务调用 `submit_sfx_generation`，提交前读取当前项目版本和音频需求。`request_id` 必须指向有效、未关闭的 audio / sfx 需求，并关联当前声音意图。该工具只生成候选，不自动新建 AudioCue 或修改时间线。

| 项目工具参数 | 用途 |
| --- | --- |
| `project_id` | 目标项目；省略时沿工具的当前项目解析规则 |
| `base_revision_id` | 初次提交的当前 Revision |
| `request_id` | 当前音效需求 |
| `prompt` | 实际送入模型的英文声音描述 |
| `max_duration_seconds` | 映射为工作流 `duration_seconds`，不是强制填满的长度 |
| `seed` | 可选；比较不同候选时显式选不同种子，恢复同一候选沿用原实际种子 |
| `idempotency_key` | 当前候选请求的幂等键；结果未知不换键重发 |

以下是替换真实引用后才可提交的示例，数值仅表示候选设计，未声称生成或听审通过：

```json
{
  "project_id": "实际项目ID",
  "base_revision_id": 12,
  "request_id": "当前音效需求ID",
  "prompt": "TrackType: SFX. One isolated soft wooden tap with a crisp attack, warm compact body and very short decay, close and dry studio recording.",
  "max_duration_seconds": 1,
  "seed": 4101,
  "idempotency_key": "当前候选的唯一幂等键"
}
```

先检查返回 `isError`，保存原始响应；已建立 Job 用 `track_job` 继续跟踪。取得候选 Asset 后回到[原文件检查](../../sound-asset-sourcing/SKILL.md#同一上下文比较并交接)。不同候选使用独立请求；恢复同一候选不得为了获得新结果而改变提示词、种子或最大时长。

## 提示词示例与检查重点

这些是待生成验证的声音设计示例，不是已经验证的预设，不按画面对象名称机械套用。

| 中文声音设计 | 英文 prompt | 最大时长建议 | 真实候选检查 |
| --- | --- | --- | --- |
| 轻巧落定，清楚但不沉重 | `TrackType: SFX. One isolated soft wooden tap with a crisp attack, warm compact body and very short decay, close and dry studio recording.` | 1 秒 | 是否单次、攻击清楚、主体不过重；没有多余旋律 |
| 厚纸展开，连续摩擦后轻微拍动 | `TrackType: SFX. One thick paper card unfolding in a smooth outward sweep, crisp papery friction followed by a light final flap, close and dry recording, short clean decay.` | 2 秒 | 是否一次连贯动作、中间有无断开、末端拍动是否太重 |
| 空气扫动，逐渐加速而柔和停止 | `TrackType: SFX. A single short airy swish accelerating smoothly, with a light textured body and a soft clean stop, close and dry sound, restrained low end.` | 2 秒 | 运动趋势、是否多出重击、收尾是否侵入下一句话 |

时长按本次动作和自然尾音调整，不把示例值固化。整段声音无法同时适配两个严格落点时，可以改为运动声与单次落定声分别编排；不要大幅拉伸来掩盖不适配。多个数字分别强调时，可以生成一个合适的孤立短声再按事件放置，不要求模型在一句提示词里保证三个精确时间。

## 候选反馈与调整

| 实际结果 | 调整方式 |
| --- | --- |
| 要一下却生成一串 | 更明确单次、孤立和短衰减，合理缩短生成窗口；存在完整可用单击时先检查选段 |
| 多个候选都变成音乐 | 减少容易引向配乐的抽象风格词，改成具体发声动作；明确 SFX 并检查真实文件 |
| 太重、太像预告片 | 减轻低频主体、攻击和混响描述；不只把不合适的声音调得极小 |
| 声音正确，前面空白 | 记录真实起音，调整源范围和摆放，不必重新生成 |
| 尾音太长 | 选择短衰减候选，允许自然短淡出，不硬截主体 |
| 连续声不够长 | 重新设计生成范围或换素材；只有允许且听过接缝时才显式循环 |
| 有人声、旋律或多余噪声 | 排除不适配范围，改写或换来源；文字排除条件不是已验证结论 |
| 一直不合适 | 根据主要问题作有限迭代，再换声源或回到现成素材分支，不无限抽样 |

种子用于记录和比较，不保证不同提示词得到相同音色，也不保证跨模型版本完全复现。采用的原文件必须保留，不能只保存提示词后期待重生成必然一致。

## 实测交接与失败恢复

生成参数只表达请求。候选选择回传真实 Asset、需求与计划版本、原文件可用范围、可听起音、主要攻击、尾音和观察方法；不能用请求时长代替实际长度。没有听觉输入时保留待听，不用波形或模型描述冒充实际听审。

已有 Job / Run 继续原任务，远端成功但下载失败只恢复下载。POST 结果未知且没有 Run ID 时，由主任务按正式恢复合同核对，不能换种子再生成；创作结果不好听则修改候选方案，不报成平台故障。素材选择和动画绑定后仍需在旁白、音乐及真实画面中试听。

## 官方依据

- [Stable Audio 3 提示词指南](https://kb.stability.ai/knowledge-base/stable-audio-3-prompt-guide)：声源、动作、空间与音效标记。
- [模型概览](https://github.com/Stability-AI/stable-audio-3/blob/main/docs/guides/model-overview.md)：英文输入与模型边界。
- [推理说明](https://github.com/Stability-AI/stable-audio-3/blob/main/docs/workflows/inference.md)：种子、音频生成及后训练模型与 base 模型的控制区别。
