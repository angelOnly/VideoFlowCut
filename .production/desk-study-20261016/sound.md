# 桌面整理学习测试：声音稿

## 当前依据与职责

本片为 1920×1080、30fps 的视觉解释片，默认 OmniVoice 旁白，连续桌面与抽屉场面。声音采用本片新制作材料，不搬用原作者音频。声音作者按安装版 sound-asset-sourcing、sfx-prompt-writing、audio-finishing 方法工作；正式计划、需求、生成、放置和预览由主任务提交。

当前尚未收到实际旁白、动作源码或候选音频。下述是声音设计及候选请求，不是已试听采用的结果。

## 听觉发展

1. 开场“整理桌面，不是把东西全部藏起来”：只保留旁白，让否定与转折完整成立，不给画面元素入场配点声。
2. “经常用的……暂时不用的……”：旁白继续主导；抽屉建立内外空间时，用一段近距离、克制的木质滑动作为候选，形成实际动作触感。若视觉滑动范围与素材不适配，先调整源选段或换候选，不拉长动画等待声音。
3. “拿出来，用完，再放回去”：让拿取与使用可看清；笔实际归位时可用一次短促轻接触强调动作结果。用笔过程不逐笔响，不安排电子提示音。
4. 结论与下一次取用：语言主导，保留句尾和画面完成的余韵。下一次取笔不机械重复归位声；动作还未发生不提前制造落桌声。

本片不铺 BGM，也不添加 Room Tone：这里是图形场面的观察视点，没有需要伪造的实拍房间。导演已明确采用此取舍，让语言转折和物件因果清楚；使用笔划与结尾再次取笔也主动留白，待实际组合后复核。

## 首轮有限候选请求

先生成两个独立候选，不把多个严格时间点塞进一个音频。需要主任务先创建相应 SoundIntent 与 audio/sfx 需求，保留实际 plan、intent、request、Job 和 Asset 引用。

### 候选 A：抽屉滑动

- 功能：demonstration。表现抽屉沿轨道滑动的材料阻力，具体开/关动作待视觉作者确认。
- 声音：轻木质抽屉的一次短滑动，近而干，柔和摩擦，中低频不过重，没有夸张撞击。候选用于连续运动，不把最大峰值当作唯一同步点。
- 英文 prompt：`TrackType: SFX. One small wooden desk drawer sliding smoothly along its runners, a short gentle wooden friction sound with a soft clean stop, close and dry recording.`
- `max_duration_seconds: 2`，`seed: 101601`。
- 需求建议：`role: sfx`，`media_kind: audio`，`fallback_plan: omit_audio`；`sound.material: 木质抽屉和轨道`，`energy: 轻且克制`，`attack: 柔和启动`，`tail: 短而自然的停止`，`excludeSpeech: true`，`excludeMusic: true`，`maxDurationMs: 2000`。声音意图和需求 ID 使用主任务实际创建值。
- 检查：是否单次连贯滑动；是否额外开关两次、柜门撞击、吱嘎过响或多余环境；真实源长、起止、声体发展与实际动画持续范围。

### 候选 B：笔归位

- 功能：settle。橙色漆面金属笔落到浅托盘的实际接触。视觉作者已确认木桌/抽屉、金属笔和青绿色涂漆木质浅托盘。
- 声音：单支金属笔轻放木质浅托盘，短攻击，小而实，短尾，保持旁白清楚。
- 英文 prompt：`TrackType: SFX. A single metal pen gently placed in a shallow wooden desk tray, one light compact tap with a faint metallic edge and very short decay, close and dry recording.`
- `max_duration_seconds: 1`，`seed: 101602`。
- 需求建议：`role: sfx`，`media_kind: audio`，`fallback_plan: omit_audio`；`sound.material: 金属笔与木质浅托盘`，`energy: 轻巧`，`attack: 清楚的单次接触`，`tail: 很短的自然衰减`，`excludeSpeech: true`，`excludeMusic: true`，`maxDurationMs: 1000`。
- 检查：单次还是滚动/多次敲击；攻击与尾音；是否更像键盘或电子提示音；笔接触材质是否与画面一致。

## 后续正式采用与复核

拿到原文件后记录实际 Asset、原文件范围、真实起音和尾音，不从生成窗口推算长度。旁白稳定后更新计划秒数和帧范围，动作源码提供事件名与当地帧，按事件与所选源起点换算 AudioCue；没有真实事件前不编造绑定。

固定同一旁白与画面，比较有声、减弱以及无该声版本，再由导演选择采用或留白。正式预览检查开场、否定词、接触落点、抽屉范围、结尾及语音可懂度。声音不适配则换源或改声，不用整体压低掩盖材料错误。

实际听觉输入尚未建立：音色、遮蔽、情绪和完整声画听感目前均为待听。波形和模型分析可提供事实辅助，不能称为人工连续试听。

## 实际候选检查（2026-10-16）

项目：`project_3938c8ef-553f-416b-ba35-7ec9696e4162`。SoundPlan：`sound_plan_3d15bd74-7ca6-4826-acb5-f3b980a54475`，意图 `drawer` / `pen`。正式生成及恢复由主任务执行，以下检查只读取已生成文件。

| 项目 | 抽屉候选 | 笔归位候选 |
| --- | --- | --- |
| Asset | `asset_aefe63fd-485c-4db6-a8a3-c7656e0ee89a` | `asset_94cd2043-63a2-4097-9c5d-9039e8674567` |
| 真实长度 | 1244.853 毫秒 | 208.526 毫秒 |
| 格式 | FLAC、44100 Hz、双声道 | FLAC、44100 Hz、双声道 |
| 完整源范围检查 | inspect_asset 0–37 帧，响应实际范围 0–1245 毫秒，complete | inspect_asset 0–6 帧，响应实际范围 0–209 毫秒，complete |
| 全文件样本 RMS | -27.72 dBFS | -32.74 dBFS |
| 样本峰值及时间 | -1.76 dBFS，989.23 毫秒 | -6.30 dBFS，8.30 毫秒 |
| 技术包络观察 | 约 100 毫秒后能量增加，中段持续变化；980–1020 毫秒显著瞬态，之后衰减 | 能量集中于前 44 毫秒；主要攻击在第 1 帧内，之后迅速衰减 |
| 原生听审 | inconclusive | inconclusive |

读取使用正式 inspect_asset 与 FFmpeg 全文件解码，阈值和 10 毫秒包络数据保存在 `sound-source-measurements.json`。样本峰值不是 true peak，RMS 不是 LUFS，技术阈值不是已确认可听起音。没有原生听觉输入，声源材质、人声/音乐排除、细微尾音和语音遮蔽目前未知。

草稿混合建议：笔保留完整源 0–6 帧，`onset_offset_frames: 0`、`gain_db: -6`、关闭 Duck、不淡入，绑定实际 `pen.home` 接触帧。此增益是待上下文试听的起点；不以它证明可懂度或合适。

抽屉需先核对实际动作范围。候选的停止瞬态位于原文件约第 30 帧，完整源约 37 帧；只在完整滑动与视觉范围相称时使用。不能把它塞进短开合或拉长动画等待声音；必要时只选实际结束轻扣，明确这是终点声，或另取候选。具体源范围和绑定待动作事件回传后确认。

## 模型辅助观察与首版具体放置建议

两项原文件专项分析 Job 均成功：抽屉 `job_e8a839d0-fbe7-4de8-a874-c986b2ecb803`，笔 `job_d17d037d-0b5f-4eff-909a-d9570a14659a`。完整原始观察分别保存在 `sound-observation-drawer.json` 与 `sound-observation-pen.json`。

抽屉模型观察为快速拖拽或拉动、摩擦、约一秒，材质、环境和语言均仍不确定，且没有可靠事件源范围。笔模型观察为底噪与平稳声音，但“无明显攻击”与实际前 5–10 毫秒攻击以及平台自身 `attackCandidates` 矛盾；保留原结果，不将模型文本改写成通过，也不以此断言原文件没有瞬态。没有更改或重试分析来逼出期望答案。

导演与视觉已采用 432 帧／14.40 秒完整场面。旁白起点 0、3.00、6.933、9.667 秒，源长 2.40、3.29、1.98、4.16 秒，不变速。抽屉开启 3.75–4.43 秒，关闭 6.40–6.85 秒；笔归位接触约 9.28 秒。以下需主任务取最终事件表和版本后提交：

| 意图 | 首版源选段与参数 | 绑定与待验证事项 |
| --- | --- | --- |
| drawer | `source_start_frame: 29`、`source_end_frame: 36`；即 966.7–1200 毫秒，保留约 989 毫秒瞬态；`onset_offset_frames: 0`、`gain_db: -10`、`fade_out_frames: 1`，不循环、不 Duck | 只作为 `drawer.closed` 到位终点声，省略 end_local_frame，不冒充完整持续滑动。最终帧约 206，以源码事件为准。完整滑开留白，导演已确认采用这一草稿取舍。 |
| pen | `source_start_frame: 0`、`source_end_frame: 6`；`onset_offset_frames: 0`、`gain_db: -6`，不淡入、不循环、不 Duck | 点绑定 `pen.home` 最终帧 278，以当前作品事件为准。 |

两个 `onset_review.status` 均为 `inconclusive`；注释说明是源文件技术起音候选，没有原生听审。这是可追溯草稿混合建议，不是已确认音色、准确同步或成片混合通过。进入真实预览后复核，尤其抽屉到位声尾与 6.933 秒旁白起点相邻、笔归位处的句尾关系。

导演已明确采用上述两处终点声进入首版合成；原声听感、材质与精确 onset 继续待听。若实际听感不符，优先移除或替换候选，不牵制视觉动作。

## R26 整片电平检查与修订建议

正式预览：`job_4a73b0fe-491d-48ee-af3a-7e5223672d59`，`previews/revision-26-0-432.mp4`。FFmpeg ebur128 全文件解码复测为 -30.0 LUFS、true peak -11.9 dBFS、LRA 3.8 LU。实际 Dialogue 总轨 `assets/speech/speech-placement-job_d2037d84-97b6-4891-88ec-36162c16e36d.wav` 独立完整解码为 -29.9 LUFS、true peak -11.0 dBFS、LRA 3.8 LU。低电平来自旁白原轨，不是被两个短音效压低。详细响应保存于 `sound-r26-loudness.json`。

建议用已发布 `set_audio_mix_gain` 将最终混合绝对增益设为 +8 dB；保留两个短音效当前 -10／-6 dB、事件与源范围。当前没有原生听审证据表明轨间比例错误，不独立抬高音效，也不为绕开合成语音合同改写源文件或新增旁白 Item。整片 +8 dB 预测约 -22 LUFS／true peak -3.9 dBFS，属于计算预期，须最终正式预览重新完整测量；不将预测写成已达标。原 Dialogue +8 dB 的峰值余量约 3 dB，比无依据使用 +10 dB 更稳妥。本次不需要压限、EQ、降噪或重做旁白。

音色、语气、辅音遮蔽和最终连续听感仍为 inconclusive；电平修订只解决已测量的整体偏低，不代替听觉复核。
