<!-- topic-film-v2-production-coordinator:begin -->
<!-- material-scene-v3 -->
## 只有主题时：组织完整创作和材料交接

按 [主题到成片](../_shared/TOPIC_TO_FILM.md) 组织持续负责的导演和现有专项。缺少用户稿件、素材、参考或固定时长不是停工条件；普通创作选择在团队内完成，正式项目写入、任务追踪和版本对账仍由主任务集中执行。

涉及实际材料的关键场面，交给原作者的是原件可达入口、实际源范围、观察记录以及导演完整采用稿，使用 [素材到场面方法](../_shared/MATERIAL_TO_SCENE.md)。确认稿中写了源内具体对象与结合方式；只有“放手机素材再做动画”的摘要，回原导演或作者补设计，协调者不自行发明位置、细节或剧情。

定向媒体问题通过现有`analyze_media`的`depth=review`和`input.context`提交；index/discovery仅保存用途说明，不能误当该问题已送模型。读取真实覆盖、方法与未知，再交原负责人。坐标估计不能用模型输出包装成自动跟踪。

素材适配采用后，按实时Schema更新需求、采用范围、Scene/VisualTreatment和作品绑定；图片清空不适用的连续视频时长条件，保留真实许可与事实限制。作品返回并放置后，用`bind_media_adoption`关联准确的`motionImageSlot`或`motionVideoSlot`；外层`slot=motion`不能代替内部来源关联。读回相关版本，不按整条素材推定所有用途已审。

首个预览就检查作者和审片者能否取得同一实际媒体。关键混合场面的复核范围包含材料进入前、交接中途、发展后与下一画面；范围预览的文件毫秒与整片帧用返回composition映射。分别记录工程、设计、观看与声音状态。普通素材未命中继续适配；实际工具故障沿原Repair Ticket处理，不绕过MCP或要求用户重传已在项目中的材料。
<!-- topic-film-v2-production-coordinator:end -->