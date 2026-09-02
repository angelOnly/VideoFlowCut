---
name: visual-asset-sourcing
description: 把明确的 AssetRequest 转换为项目素材、Creative Library、受控 Provider、网页证据或 MiniMax 候选，完成筛选、本地化、来源和权利记录；不决定最终 Cutaway 的使用方式。
---

# 视觉素材需求、搜索、候选与本地化

## 为什么要把“找素材”和“用素材”分开

搜到一条看起来相关的视频，不代表它应该进入成片。`visual-asset-sourcing` 只负责把视觉缺口转成高质量 AssetRequest，找到少量可审查候选，完成技术、来源和权利检查，并将被接受的候选本地化为 Project Asset。最终是否离开人物、用全屏还是 PiP、持续多久、怎样保留声音和何时返回，由 `cutaway-planning` 或对应 Scene 主工作流决定。

这种分离能防止两个常见问题：素材搜索 Agent 只看关键词自动选入；Cutaway Planner又重新搜索一次，产生两个互相矛盾的视觉策略。

## 先定义观众任务，而不是关键词

AssetRequest 应说明这段画面要做什么。例如“表现自由”几乎无法执行；“在人物解释时间长期被工作占据后，给观众一个现实生活的安静恢复，画面是下班后独自行走并抬头，竖屏上方有天空留白，4～6 秒，不要旅游广告感”才是可搜索需求。

需求至少包含：解释、证明、具体化、地点建立、情绪呼吸、跳切遮盖、笑点或 CTA 中的主要用途；主体和真实动作；环境、年代和情绪；画幅、景别、运动、主体方向和留白；可用时长；受保护内容；排除水印、错误品牌、摆拍感和错误人物；来源和许可；搜索失败时允许 Remotion、MiniMax 还是保持原画面。

抽象机制通常优先 Remotion，因为可编辑、可解释且不需要用泛化 Stock 强行象征。真实生活经验、地点和动作更适合项目素材或可授权 Stock。法规、论文、投诉和产品规则必须走真实证据来源，不能降级成 AI 生成。

## 当前能力与计划能力

当前最小 Asset Acquisition System 已提供 `manage_asset_requirements`、`search_media_candidates`、`inspect_media_candidate`、`acquire_media_asset` 和 `read_asset_provenance`。它会把需求、SearchIntent 与 Candidate 写入同一 Revision；Candidate 通过授权和技术硬过滤后，由 Worker 下载到受管目录、校验 MIME、文件头、内容哈希和 ffprobe，随后才注册为 Asset 并进入媒体分析。Candidate 永远不能直接写入 Scene 或 Timeline。

目前真实网络搜索只实现 Pexels，且仅在本地配置 `PEXELS_API_KEY` 时可发现；CI 用 Mock Provider 和固定本地媒体验证，不依赖网络。Pixabay、WebEvidence、Creative Library 和 MiniMax 仍是架构目标。无论 Provider 是否可用，Codex 都必须先查看候选来源、授权、时长、构图信息和过滤理由，再决定是否提交 `acquire_media_asset`；不能直接把网页 URL 写入 Scene。

## 查询计划

一个 AssetRequest 通常生成 3～6 组由宽到窄的搜索意图，组合主体、动作、地点、情绪、镜头、构图和排除词。完整旁白原句不适合作为唯一查询；“快乐、自由、意义”也不适合单独搜索。

例如“下班后停下来看看天空”可以分为：vertical tired commuter walking evening；person stops and looks at sky copy space；quiet city dusk lone pedestrian；slow tracking after work reflective。Provider 支持不同过滤能力，查询参数由 Adapter 负责，Skill 只保留语义和构图意图。

## 候选的两层筛选

硬过滤检查权利、访问性、媒体类型、画幅、分辨率、时长、编码、水印、黑边、错误品牌、敏感或错误年代。软判断再比较语义是否真正支持当前 Beat、动作是否匹配、情绪和镜头运动是否接得上、竖屏裁切后主体是否仍成立、字幕或人物需要的留白、与已用素材是否重复。

候选得分只帮助收窄，不能自动选中最终素材。Codex 应查看联系表、缩略图或短预览，必要时看完整范围。素材“漂亮”但让观众误解地点、行为或事实，应拒绝。

## 来源和权利

每个 Candidate 需要 Provider、来源页面、作者、许可、署名、抓取时间和 rightsStatus。YouTube、抖音、新闻站和社交平台视频默认只能作为参考或证据入口，除非项目拥有明确授权和正式导入策略。网页证据要保存页面环境与目标范围，让观众分辨原始内容和项目增加的高亮。

## Acquire 与本地化

被接受的 Candidate 必须先下载到临时目录，验证 HTTP、MIME、文件头、大小、哈希和 ffprobe，再移到项目受管目录并注册 Asset。HTML 错误页不能因扩展名 mp4 被接受。Timeline 和 Remotion 只能引用本地 Asset ID，不长期依赖 Provider URL。

## 搜索失败的降级

降级顺序根据用途变化：项目素材和 Creative Library 优先；现实 B-roll 可换 Provider；抽象机制改为 Remotion；非事实性情绪画面可使用 MiniMax 并标记 generated；仍无合适结果时保持人物或原镜头。为了填满画面插入弱相关 Stock 是失败，不是降级成功。

## 交接合同

输入是明确 AssetRequest、目标画幅、构图、用途和权利要求。输出是少量候选的取舍、被接受的本地 Asset、Provenance、Rights 和拒绝理由。下游 Scene 素材绑定可能失效。验证包括文件、来源、构图、动作、相关性、许可和本地可用性。最终使用方式交给 `cutaway-planning`、`evidence-visualization` 或主工作流。

## 可选完整案例

Provider、证据和降级案例见 `references/provider-and-rights-casebook.md`。

## 候选本地化后的真实内容复核

Provider 返回的标题、标签、缩略图和技术元数据只能帮助发现候选。候选通过硬过滤并由 `acquire_media_asset` 本地化为 Project Asset 后，还要查看真实画面与可用范围，才能交给 Cutaway 或 Explainer 工作流。

先用 `inspect_asset overview` 确认主体、动作、地点、画幅、镜头运动、字幕/品牌、水印和整体结构；再用 `range` 查看可能采用的连续范围，判断真实动作、构图、方向、留白、可用时长和进入/退出余量。只有短暂动作、主体越界或精确切口会改变选择时，才使用 `dense`。

搜索结果需要向主工作流交付三类信息：候选实际支持当前 AssetRequest 的证据；候选与需求不匹配或被拒绝的原因；被接受 Asset 的可用源范围、构图限制和来源信息。最终是否全屏、PiP、持续多久、保留哪一层声音以及何时返回主画面，仍由 `cutaway-planning` 或对应 Scene 主工作流决定。
