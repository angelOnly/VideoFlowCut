# 素材就绪、观察证据与交付状态

观察与返修方法只维护在[专业观看与返修](professional-review.md)。本页只说明证据归属、覆盖与状态。没有实际看过或听过的范围记 inconclusive。

## 四级证据

结构已保存、真实合成可检查、最终文件技术正确、完整声画观察成立分别记录，前一层不能推出后一层；也不要求每一层另做完整观看。

### 项目结构

读回 Story、Scene、Timeline、Caption、EffectCue、Speech、Actor、Asset、Revision 和 Impact，检查引用和状态。当前 `validate_project_graph` 与 `read_quality_report` 提供确定性证据。

### 局部真实合成

`render_preview_range` 固定 Revision 与项目全局范围，`inspect_composed_frames` 只证明实际抽取帧；每次最多 12 帧。`submit_motion_work(frame_range)` 固定完整作品输入与根时钟，只产生局部校样，不创建完整 Asset，也不证明全片或声音。

Motion/Sound 审阅独立于创作快照，保存后不产生新 Revision。作品审阅绑定 asset/version 与真实文件；混音审阅绑定声音依赖签名与 Preview 哈希。旧观察保留原始身份，不因修订升级为新版观看。局部问题按可验证的对象时钟映射和必要接点复查；无法定位时扩大范围。

### 最终 Artifact

导出文件要验证解码、时长、画幅、音轨、黑帧、缺帧、哈希和目标 Revision。Job succeeded 只是候选文件产生。

### 完整声画审片

整片的语义、节奏、注意力、声音、视觉、模式切换、开头承诺和结尾兑现需要完整播放。用户批准绑定具体 Artifact。

浏览器播放或宿主原生听觉不可用时，仍可通过已接入的 MiniCPM HTTP 分析真实声画，不能据此声称项目没有音频理解能力。主任务使用 `analyze_media` 的 `exportArtifactId` 或 `previewJobId`，`depth="review"`，把原审片负责人的具体问题放进 `context`；此时问题会实际送入模型，`promptText` 保存真正指令。素材初看使用 index/discovery，其 context 仍只作备注以免预设答案诱导。只听声音时请求 audio，逐字转写另加 speech（由 FunASR 执行）；Qwen3-Embedding 只编码文字用于检索。

读取 `read_media_observations`，将固定文件哈希、composition 版本与偏移、实际窗口、模型及指令原文交原负责人判断。range 从所选文件起点计毫秒，局部 Preview 映射回成片时加 composition.fromFrame；不重新导入导出文件、不为分析创建视频 Revision。问题要指出实际需要辨别的现象，不能只请求笼统好坏。模型观察是有效的辅助复核，但概述、未覆盖或约 1fps 抽样不证明精确同步和快速动画已通过；不冒充人工听审或首次观众连续体验。观察及其限制可以通过 `record_export_artifact_review` 保存至对应导出，不能填成不存在的连续观看证据。

## 无法判断时

证据不足使用 inconclusive，并写需要的最小补充：哪一段连续播放、哪一个源素材范围、是否要听声音、是否要查看横/竖版或最终文件。不要为了“完整”重复分析整片，也不要在未看时写通过。

## 严重程度与文件批准

问题按 blocking、major、minor、suggestion 记录；inconclusive 表示证据不足。技术/用途条件与专业意见分别处理，AI 记录不等于用户批准具体 Artifact。独立完整观看可在最终 Artifact 一次完成，同时观察整体体验和交付文件，不再额外要求同版全片 Preview 重复观看。作者自查、导演采用与独立审阅仍分别归属真实负责人。

字体选择与替代沿[单一操作方法](../../remotion-production/references/submission-and-recovery.md#字体可用性与替代)，原视觉作者交回实际采用与排印变化，主任务提交。交付时从实际creativeBrief和创意决策记录汇总原计划字体、采用字体ID、用途与替代原因，按原计划字体去重提示是否希望后续扩充；只有发生替代时提示，不把扩充设为本次交付前置条件。字体库浏览、复制和静态字样不证明视频已采用或动态审片通过。

# 素材证据、来源与就绪状态

## 素材不是文件名

Agent 不能只凭文件名、缩略图或搜索标题判断内容。会影响 Story、Cutaway、证据引用和切点的素材必须能回到具体 Asset 和 Source Range，说明实际看见、听见或读取了什么，以及哪些仍是推断。完整视频无需一次性全部塞进上下文，但被采用的范围需要可复核。

证据分为：素材直接可观察事实、用户明确业务说明、基于多项证据的专业解释、未知或替代解释。生成画面和视觉隐喻不能冒充真实证据。

## Readiness 不是一个 ready

素材至少经历：已登记、本地字节可读、元数据可用、可分析/转写/检视、可被 Timeline 引用、当前 Remotion/FFmpeg/Browser Worker 可读取。一个文件可以能转写但不能渲染，预览可播放也不能代替最终文件检查。

当前代码仍以部分状态字段表达这些能力。Skill 应在需要时综合 Asset、Job、Provenance、Preview 和导出前检查，不把某个 `status=ready` 扩大为所有用途可用。

## Provenance

外部、证据或生成素材保存 Provider、来源页面、作者、抓取/生成时间、原始 ID 和内容哈希。平台不验证素材权限、使用权、版权或署名条件，不要求授权证明，不查询许可页，也不据此阻止获取、采用、生成或导出。

## Stock、证据和生成素材的区别

现实 B-roll 可以来自Stock；法规、论文、投诉、新闻、产品规则等证据优先来自用户资料和官方原始页面，不能用 MiniMax 伪造；抽象机制优先考虑可编辑 Remotion Scene，而不是搜索只匹配名词的空镜；搜索失败时，非事实性情绪或过渡画面可以生成，但必须标记 generated。

## 候选选择

AssetRequest 应描述叙事用途、主体动作、环境、构图、画幅、时长、情绪和排除项。候选先做技术硬过滤，再由 Codex结合上下文判断语义、动作、构图、方向、留白、情绪和前后 Scene。向量相似度和关键词命中不能替代创作判断。

## 本地化

Timeline 和 Remotion 不长期引用远程 URL、搜索缩略图或临时 CDN。候选被接受后先下载到临时目录，检查 HTTP、MIME、文件头、大小、内容哈希和 ffprobe，再移入受管目录并注册 Asset/Provenance。下载失败或文件不符时拒绝候选，不把错误页当视频。
