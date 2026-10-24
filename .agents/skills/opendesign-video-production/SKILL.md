---
name: opendesign-video-production
description: 在已连接的本机 OpenDesign MCP 上制作、修订视觉作品，由原视觉作者使用当前镜头指令，传送所需制法与资源，取回同版源码和预览，并交回 VideoFlowCut 正式渲染与合成。
---

# OpenDesign 制作、返修与交回

继续负责同一作品。先执行[镜头指令](../opendesign-shot-brief/SKILL.md)，
取得当前完整制作正文；局部修订沿用有效稿并更新受影响范围。
主任务负责 VFC 正式登记、提交和放置，OpenDesign Run 属于你的作品制作过程。

## 发送前准备实际可读输入

核对你实际能调用 OpenDesign MCP，沿用本机成功的视频技能与模型配置。
读取本机工具 Schema；skill/skills 只填写 list_skills 返回的 OD 已注册 ID，
不能把 VFC 的镜头 Skill 名称或路径当作 OD 技能参数。

先确认本作品的 OD 项目：新作品先用 create_project 取得 project ID，
返修复用现有项目与源码，再准备并传送以下资料。

将当次镜头正文直接用于 start_run.prompt。
较长的采用制法、必要参考代码、关键画面和真实资源，放到 OD 项目能读取的位置。
文本可用 write_file 写入任务资料目录，大文件沿现有授权文件交接；
保留预览资源与 VFC 实际资产的对应，不把私有路径或缺失文件当已交付。

在正文中明确：随附哪些方法是本次制作要求，应用于哪些主体和动作，
哪些参考只提供结构或外观依据。关键保持项直接写入正文，不只说“看附件”。
只传当前采用部分与必要依赖，不整库复制，也不让旧案例的主题、数值和时间进入本片。

读[项目源码规范](references/hyperframes-contract.md)及 read_motion_capabilities，
附本轮已经发布的输出约定。规范尚未发布时，可在 OD 制作观察，但不声称已接回 VFC。
明确交回项目中可读取的完整源码入口，不假定默认 artifact 就是 HTML 源文件。

## 调用与续接

调用 start_run 前生成并保存本次 requestId 和完整请求，返回后记录 runId；
请求使用已确认的 project ID、当前正文与实际已注册的视频技能。
相同调用结果未知时核对原 Run，重试复用同一请求，不重复发起制作。
按返回状态读取结果；只有解释或计划而无作品文件时继续原任务，不能报告制作完成。

一次性核对成功路线实际采用的 Skill 与模板默认。明确按本片美术与连续演出制作，
不采用与本任务冲突的固定切镜、统一幻灯片或无关结尾结构。
使用 OD 内部适用的制作指南深化实现；实际是否遵循，以作品和源码为准。
不因等待制作而由外层作者绕过 OD 另写一份替代成品。

## 观察与返修

沿镜头 Skill 的[同一制作与检查方法](../opendesign-shot-brief/references/shot-construction.md)
检查当前真实预览。发现缺设计、漏实现或接入差异时反馈到对应对象和过程，
同一作品继续修订，保留已成立部分。未观察的动态或声音如实说明。
已有预览优先复用，按问题补充必要观察，不增加固定样片或逐镜审批。

## 交回原项目

首轮允许伴随 MP4 供观察，正式交接保留同版 HyperFrames HTML/CSS/GSAP 源码。
按已发布规范整理依赖、真实图片/视频/字体对应、作品职责、实际时长与帧率、
同源动作事件及已观察范围。必要时适配资源与入口，保留原美术和动作。
透明叠加保留 alpha，完整主画面明确外层哪些内容由它接管。

普通字幕、旁白、原声、音乐和音效继续原流程；预览参考声音不重复烧入正式画面。
由主任务完成正式提交与时间线放置，再把真实合成反馈交回你继续修订。
时序或材料变化时更新受影响的事件与声音，设计变化写回当前稿；
只修改说明不触发重渲，源码和真正影响画面的输入改变才更新相应资产。

需要补设计时沿原[整场美术](../visual-treatment-planning/references/art-direction.md)、[演出方法](../motion-brief-writing/references/performance-design.md)与[执行稿](../motion-brief-writing/references/execution-brief-template.md)继续；人物范围按[人物剪辑语法](../presenter-motion-director/references/presenter-editing-grammar.md)处理。素材取景读[空间与源时钟](references/material-space-and-time.md)，正式写入读[提交与恢复](references/submission-and-recovery.md)，责任边界读[共用交接](../_shared/PROJECT_REVISION_AND_HANDOFF.md)。
