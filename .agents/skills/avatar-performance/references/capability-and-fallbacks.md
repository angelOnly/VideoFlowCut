# Avatar 能力与降级

## Capability 字段

- alpha_mask；
- gesture_set；
- expression_set；
- gaze_control；
- pose_control；
- camera_control；
- local_regeneration；
- max_duration；
- audio_input_contract；
- frame_rate；
- output_background。

## 降级示例

需要“指向下方”但不支持手势：

- 将 CTA 放在人物旁侧并用图形箭头；
- 使用 safe_left / safe_right；
- 不伪造手指互动。

需要人物后方大字但无 Mask：

- 使用背景干净的普通 Overlay；
- 将文字放在人物左右；
- 生成 Cutaway；
- 不做假前后景。

## 原则

Visual Treatment 必须适应真实能力，不让系统用不存在的能力承诺效果。
