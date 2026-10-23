# 人物生成、Mask与声音所有权

## 声音所有权和口型

`use_source_audio`、`use_dialogue_track`、`muted` 必须明确。使用 OmniVoice 替换声音时，人物视频原声要静音；已有数字人视频自带最终声音时，不再叠加 Dialogue。口型检查包括整体延迟、爆破音、句尾、长元音和明显嘴型错误。Cutaway 可以在短范围内遮盖小问题，但不能长期用 B-roll 掩盖整段口型失配。

## Mask 与前后景

Mask 需要检查分辨率、帧率、时长、头发、手指、快速动作、半透明边缘和背景泄露。一个静帧边缘正确不代表整段正确，必须播放完整运动路径。

无 Mask 或 Mask 不可靠时，降级顺序是增大图形与人物距离、使用左右安全区、减少穿插、使用普通前景 Overlay、切 Fullscreen、最后不使用。不能因为 EffectCue 支持 rear layer，就宣称真实后景遮挡成立。

## Provider Capability 应怎样描述

每个 Avatar Provider 的当前能力档案需要明确：接受文本还是最终音频；是否保留用户音色；是否输出 Alpha/Mask；支持的分辨率、帧率和时长；口型语言；表情、目光、手势和姿态；局部重生；随机性；隐私和数据处理。营销页说“支持手势”不等于能在某个词精确指向左下。

主工作流只选择真实支持的表演。Provider 只能生成自然说话人物时，不承诺精确产品互动；这限制真实表演与分层，不限制合成中的圆形、视频纸片、分屏和容器形态。没有精确手势仍可与材料共同编排，轮廓穿插需要可靠 Alpha／Mask。

## 人物生成的分段策略

人物生成供应当前分镜缺少的真实视频源，不决定最终布局。先按本批的台词、画面
与正式声音确定哪里需要人物，包括动态头像、剪贴、分屏、容器和进退过渡。
查看现有源，合用就复用，只为仍缺的必要连续范围裁音频并生成。

完整配音可持续用于全片，不自动触发全文人物视频。音频片段来自同一版正式声音，
不为人物显隐重新 TTS。语音段用于来源追溯，不要求人物生成覆盖整段；段内时间
使用真实证据。长段无人画面不并入，短时连续性和自然起止需要的余量据实保留。

人物方式可以在制作中继续改变，后来新增出镜也可补源。已经生成不等于必须用，
第一版分镜不限制后续创作。每个 Job 固定自己的声音、照片和参数，新的分镜不
篡改在途输入。完成后先交回源与实际限制，再按当前画面需要使用，不按旧位置自动上屏。

窗口、纸片与设备内框的移动和裁切交给视觉作品，不烧进人物生成视频。人物提示
描述具体的交流语气、自然动作和适合的取景，使用工作流实际支持的输入，不许诺
精确逐词手势。未知结果先查原 Job／Run，下载或登记失败优先恢复已有结果。

生成段与 SpeechSegment、场面、人物可见区间不要求一一对应，按连续表演、Provider 时长与合理余量规划；若源时间或口型变化，只处理真实受影响范围，不能用循环嘴型、冻结、错误变速或重复配音补齐缺口。

SpeechSegment 用于来源追溯，不要求生成完整语音段。仅合并同一正式声音、照片和表演要求下真正连续的需要；短时遮挡后返回可保留连续源，长段无人画面不并入大包络。自然起止与连续性余量按当前源和试听据实确定，不设全片统一显隐阈值。

## 当前执行

使用 `read_actor_performances` 检查已有绑定，用 `read_actor_capabilities` 读取项目中登记的 Provider、输入、Mask、音频驱动口型、局部重生成和隐私信息；用 `manage_actor_capabilities` 创建、更新或移除已确认的能力档案；用 `manage_actor_performance` 登记 Timeline Item、来源、MaskMode、AudioMode、MaskAsset 和 SpeechAsset。每次写入后读回 ActorPerformance、Revision、Impact 和 Preview。

新人物源使用 v2 合同；先读取本次 Runtime 的实际 Schema，安装端未发布时明确版本差异，不回退旧全文参数。当前正式调用链如下：

1. 用 `manage_visual_treatment` 在原 VisualTreatment 写入当前 `presenter_uses`。每项包含 `id`、`speech_asset_id`、`reference_image_asset_id`、`start_frame`、`end_frame`、`performance_note` 与 `timing_evidence:{kind:"aligned"|"audio_review",note}`。范围使用项目半开帧；时间证据来自真实对齐或局部试听，不按文字长度猜段内时间。已有使用沿原 ID 更新，空数组撤回本 Treatment 的全部使用。
2. 用只读 `prepare_avatar_sources`，传 `capability_profile_id`，按需传 `project_id`、`presenter_use_ids` 和 `prompt`。检查返回的 `reusable`、`groups` 与 `gaps`；已有合用源直接采用，缺真实时序或映射先补相应事实。`sourceGroupKey` 与 `planFingerprint` 来自返回，不能手造；查询不修改 Revision。
3. 只为缺口提交 `submit_avatar_job`：必填 `base_revision_id`、`contract_version:2`、`capability_profile_id`、`presenter_use_ids`，多组按返回的 `source_group_key` 分别提交，可带返回的 `plan_fingerprint` 和相同 `prompt`；`attempt`、`idempotency_key` 按当前恢复合同使用。新接口不接受旧 `generation_range`／`placement`。Worker 从固定真实声音文件按精确样本裁片，不能用音色样本代替；Bridge 参数仍以工作流实际 Schema 为准。
4. 用 `track_job` 读取原 Job。完成只登记真实人物源，不按提交时的位置自动上屏。先检查结果与当前需求，再用 `adopt_avatar_source` 传当前 `base_revision_id`、`presenter_use_id`、`asset_id`；可按实际需要传 `start_frame`、`end_frame` 与现有 `layout`。读回 Timeline、ActorPerformance、Revision 与影响；源视频静音，主声音继续使用 Dialogue。

`adopt_avatar_source` 只写合法源子区间和当前使用，不替视觉作者修改 TSX。圆形、纸片、分屏和容器仍由受管作品实现；源时钟与绑定使用真实采用结果。移动、缩短或撤回出镜通过原 VisualTreatment 的 `presenter_uses` 修改，旧使用会停用，源文件保留；重新使用时再按新范围采用并更新作品绑定。计划变化重新查询当前缺口，不篡改在途 Job 的固定声音、照片和参数。当前生成输出无 Mask 的人物视频，不承诺逐帧姿态、目光或手势追踪。

确定性合同测试只验证对象与范围关系；Provider 可用性、中文口型、真实 Mask、局部重生成连续性与完整审美必须由实际输出和 Preview 验证。Capability Profile 或参考音频存在不等于口型已通过；失败或结果未知时，不伪造生成成功，交回主工作流说明可执行降级和缺口。

## Avatar 输出作为候选人物素材审阅

Avatar Job 成功只证明 Provider 返回了文件。生成结果在成为正式 ActorPerformance 前，要像其它人物素材一样查看连续声画：检查句首延迟、爆破音、长元音、句尾闭嘴、身份、服装、背景、眨眼、表情、手部、姿态和镜头稳定；多段生成还要检查姿态复位、情绪跳变和人物尺度变化。

先用 `inspect_asset range` 查看完整生成段；口型、手部或短暂伪影会改变判断时，再用 `dense` 查看最小窗口。Provider 名称、输入中存在参考音频或 Capability Profile 中声明支持口型，都不能替代实际观看。Alpha/Mask 也必须由真实输出和边缘检查确认。

局部重生成完成后，比较新段与前后段的身份、光线、背景、目光、语速和情绪。只有生成源的真实音频、照片、范围和当前采用引用匹配，并检查 AudioMode、Mask、布局及实际 Preview 后，才把该人物段视为当前用途可用。无关素材回写导致全局 Revision 增长，不使仍匹配的源失效。

## 人物与音色、逐镜提示词

先用 `read_presenter_library` 读取照片、音色与默认；`import_presenter_media` 保存文件，`manage_presenter_library` 重命名、移除或设默认。主任务通过 `apply_presenter_selection(projectId?, baseRevision, photoId?, voiceId?)` 固定本片输入：本次明确选择优先，其次项目已选，最后工作台默认。照片、音色独立解析，名称不唯一时只补问缺项。全局修改不会回写旧项目。

导演负责每段表演和观看意图，人物专项把意图写成 LTX 正向提示词，主任务通过 `submit_avatar_job.prompt` 提交。描述身份延续、景别、视线、表情、动作强度、镜头与无预烧字幕，不把台词或音色样本写成动作提示。不能用提示词承诺精确手势、目光或逐帧控制。

正式口播工作流为 `videoflowcut-ltx23-avatar-v1`，公开图片、音频和可选正向提示词；未提供提示词时使用工作流的中性默认。原工作流只有图片和音频时可不传 prompt；作者明确提供 prompt 而 Schema 没有唯一正向字段时明确失败，不静默忽略。负向提示词由工作流配置维护，仅保留字幕、身份变形、画面缺陷等限制，不禁止看镜头、微笑或常见衣物。

换照片后重新核对当前人物使用；换音色后先重配正式声音并校准 Dialogue、字幕和声音接点，再按新音频检查源缺口。旧 Job 保留固定输入并可以回收源，不能自动采用到已换声音或照片的当前用途；相同文字也不能替代真实音频匹配。

## 失败与旧 Job 恢复

旧 Job 沿原合同与固定输入恢复，不补写 v2 字段、不改历史范围，也不因升级重新调用已完成的 LTX。已生成长源按真实来源核对后可复用；取消当前使用不自动删除源文件。新任务只使用 v2 源合同，不通过旧参数触发全文生成。

LTX 失败保留原始原因，绝不切 H3。`resume_avatar_job(job_id)` 对已知 Run 继续查询、下载和回收；只有明确失败或取消的 Run 才创建固定恢复任务。没有 Run ID 的未知提交、丢失且无本地文件的 Run 先对账，不盲目重提。普通素材视频的 H3 生成能力与本条链路无关。
