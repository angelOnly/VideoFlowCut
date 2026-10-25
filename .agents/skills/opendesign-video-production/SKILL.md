---
name: opendesign-video-production
description: 在已连接的本机 OpenDesign MCP 上制作、修订视觉作品，由原视觉作者使用场景创作简报，传入质量目标与真实资源，取得同版源码或正式媒体，并交回 VideoFlowCut 正式渲染与合成。
---

# OpenDesign 制作、返修与交回

继续负责同一作品。先执行[场景创作简报](../opendesign-shot-brief/SKILL.md)，
取得表达目的、可见事件和必要边界；局部修订沿用有效稿并更新受影响范围。
主任务负责 VFC 正式登记、提交和放置，OpenDesign Run 属于你的作品制作过程。

## 发送前准备实际可读输入

核对你实际能调用 OpenDesign MCP，沿用本机成功的视频技能与模型配置。
读取本机工具 Schema；skill/skills 只填写 list_skills 返回的 OD 已注册 ID，
不能把 VFC 的镜头 Skill 名称或路径当作 OD 技能参数。

先确认本作品的 OD 项目：新作品先用 create_project 取得 project ID，
返修复用现有项目与源码，再准备并传送以下资料。

将场景创作简报直接作为 start_run.prompt 主体。
准确正文、素材、声音、必要参考和运行规范实际放到 OD 可读取位置，
并在 prompt 中点名文件及其用途；私有路径和缺失文件不能当作已交付。
文本可用 write_file，大文件沿现有授权文件交接，保留与 VFC 资产的对应。

将本次适用的物件、美术、排印、动作因果、层次、运镜与接续标准短写为质量目标，
实际传入并点名遵守。质量目标说明应达到的效果，不预定唯一拍法。
区分必须保持的准确内容、用户锁定项与可调整的初步构思。
参考提供可选方法，不把旧详细执行稿整体当作质量标准重新发送。
只传当前有效决定和必要依赖，历史稿保留在记录，不让旧题材与旧时间进入当前依据。

读[项目源码规范](references/hyperframes-contract.md)及 read_motion_capabilities，
附本轮已经发布的输出约定。规范尚未发布时，可在 OD 制作观察，但不声称已接回 VFC。
明确交回项目中可读取的完整源码入口，不假定默认 artifact 就是 HTML 源文件。

## 调用与续接

调用 start_run 前生成并保存本次 requestId 和完整请求，返回后记录 runId；
请求使用已确认的 project ID、当前正文与实际已注册的视频技能。
相同调用结果未知时核对原 Run，重试复用同一请求，不重复发起制作。
普通返修复用同项目和当前源码，使用新的 requestId；resume:true 不是普通续修开关。
不添加未发布的 sourceOnly、render:false 或 profile 参数。
按返回状态读取结果；只有解释或计划而无作品文件时继续原任务，不能报告制作完成。

核对实际运行采用的 Skill、任务路由、加载规则和产物。
默认由 OD 交源码、VFC 生成正式媒体；沿 OD 正式技能与任务配置入口消除
motion-design 的 HTML+MP4 双交付冲突，保留适用的美术与动效指南。
HyperFrames 源码交付 profile 不等于已注册 Skill ID；存在配置文件不证明路由激活。
记录实际采用路线和交付结果；仅一句“不渲染”或 video-hyperframes 名称不能证明生效，
不修改 OD 私有工作副本伪装永久配置。明确按本片美术与连续演出制作，
不采用与本任务冲突的固定切镜、统一幻灯片或无关结尾结构。
使用 OD 内部适用的制作指南深化实现；实际是否遵循，以作品和源码为准。
不因等待制作而由外层作者绕过 OD 另写一份替代成品。

## 观察与返修

沿镜头 Skill 的[同一制作与检查方法](../opendesign-shot-brief/references/shot-construction.md)
检查当前真实预览。发现缺设计、漏实现或接入差异时反馈到对应对象和过程，
同一作品继续修订，保留已成立部分。未观察的动态或声音如实说明。
已有预览优先复用，按问题补充必要观察，不增加固定样片或逐镜审批。

## 交回原项目

一件作品只确定一个正式渲染责任方，默认交回 HyperFrames HTML/CSS/GSAP 源码，由 VFC 生成正式媒体。
仅收到源码时先交主任务生成，再观察同版产物；不为补“预览”要求 OD 额外完整导出。
已有 OD 视频只在来源、源码、Props、实际绑定与源区间、字体、画幅、帧率、帧数和输出用途
均有可验证的同版身份时采用；无播放器、重复字幕或声音。登记路径按实时 Schema 核对，
当前 renderedAssetId 只接受已有同 pixelKey 的正式受管作品，不把普通导入视频宣称为已验证缓存。
按已发布规范整理依赖、真实图片/视频/字体对应、作品职责、实际时长与帧率、
同源动作事件及已观察范围。必要时适配资源与入口，保留原美术和动作。
透明叠加保留 alpha，完整主画面明确外层哪些内容由它接管。

普通字幕、旁白、原声、音乐和音效继续原流程；预览参考声音不重复烧入正式画面。
由主任务完成正式提交与时间线放置，再把真实合成反馈交回你继续修订。
时序或材料变化时更新受影响的事件与声音，设计变化写回当前稿；
只修改说明不触发重渲，源码和真正影响画面的输入改变才更新相应资产。

需要补设计时沿原[整场美术](../visual-treatment-planning/references/art-direction.md)、[演出方法](../motion-brief-writing/references/performance-design.md)与[执行稿](../motion-brief-writing/references/execution-brief-template.md)继续；人物范围按[人物剪辑语法](../presenter-motion-director/references/presenter-editing-grammar.md)处理。素材取景读[空间与源时钟](references/material-space-and-time.md)，正式写入读[提交与恢复](references/submission-and-recovery.md)，责任边界读[共用交接](../_shared/PROJECT_REVISION_AND_HANDOFF.md)。
