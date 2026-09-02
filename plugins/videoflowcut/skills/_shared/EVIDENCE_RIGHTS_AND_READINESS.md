# 素材证据、来源、权利与就绪状态

## 素材不是文件名

Agent 不能只凭文件名、缩略图或搜索标题判断内容。会影响 Story、Cutaway、证据引用和切点的素材必须能回到具体 Asset 和 Source Range，说明实际看见、听见或读取了什么，以及哪些仍是推断。完整视频无需一次性全部塞进上下文，但被采用的范围需要可复核。

证据分为：素材直接可观察事实、用户明确业务说明、基于多项证据的专业解释、未知或替代解释。生成画面和视觉隐喻不能冒充真实证据。

## Readiness 不是一个 ready

素材至少经历：已登记、本地字节可读、元数据可用、可分析/转写/检视、可被 Timeline 引用、当前 Remotion/FFmpeg/Browser Worker 可读取、权利允许当前交付。一个文件可以能转写但不能渲染，也可以能预览但许可不允许 Delivery。

当前代码仍以部分状态字段表达这些能力。Skill 应在需要时综合 Asset、Job、Provenance、Preview 和导出前检查，不把某个 `status=ready` 扩大为所有用途可用。

## Provenance 和权利

任何外部、证据或生成素材都应保存 Provider、来源页面、作者、许可、署名、抓取/生成时间、原始 ID 和内容哈希。unknown、restricted、rejected 不进入正式交付；attribution_required 必须进入 AttributionManifest。版权之外的商标、肖像、隐私和地域限制仍需要独立风险提示，产品不能替用户作法律保证。

## Stock、证据和生成素材的区别

现实 B-roll 可以来自可授权 Stock；法规、论文、投诉、新闻、产品规则等证据优先来自用户资料和官方原始页面，不能用 MiniMax 伪造；抽象机制优先考虑可编辑 Remotion Scene，而不是搜索只匹配名词的空镜；搜索失败时，非事实性情绪或过渡画面可以生成，但必须标记 generated。

## 候选选择

AssetRequest 应描述叙事用途、主体动作、环境、构图、画幅、时长、情绪、排除项和权利要求。候选先做技术硬过滤，再由 Codex结合上下文判断语义、动作、构图、方向、留白、情绪和前后 Scene。向量相似度和关键词命中不能替代创作判断。

## 本地化

Timeline 和 Remotion 不长期引用远程 URL、搜索缩略图或临时 CDN。候选被接受后先下载到临时目录，检查 HTTP、MIME、文件头、大小、内容哈希和 ffprobe，再移入受管目录并注册 Asset/Provenance。下载失败或文件不符时拒绝候选，不把错误页当视频。
