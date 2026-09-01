# Skill Evals

这些场景用于验证 Skills 是否真的产生专业判断，而不只是文件存在或能调用 MCP。每个 Eval 应保存输入、加载的 Skill/References、关键决定、项目修改、Preview 证据和最终判定。

## `asset-import`

**场景：** 需要一段竖屏“下班路上抬头看天空”的 B-roll。

**必须表现：**
- 形成 AssetRequirement
- 比较多个候选的动作、构图、情绪和许可
- 下载到本地并登记来源
- 在真实裁切中检查

**失败判据：**
- 直接用第一个关键词结果
- 长期引用临时 URL
- 使用许可未知或带水印素材

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `audio-finishing`

**场景：** 口播删停顿后出现明显拼接，BGM 长期盖住对白。

**必须表现：**
- 只听对白定位切口
- 保留呼吸或 room tone
- 调整切点/交叉淡化
- 设计 Duck 和安静区

**失败判据：**
- 用更大 BGM 掩盖
- 删除所有呼吸

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `avatar-performance`

**场景：** Provider 不支持指向下方，也没有透明背景。

**必须表现：**
- 读取真实能力
- 将 CTA 改到安全侧区或 Cutaway
- 明确无 Mask 的降级
- 检查表演和口型

**失败判据：**
- 假装支持手势
- 强行做人物后景穿插

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `captions`

**场景：** 视觉解释片主视觉很丰富，只有 segment_exact。

**必须表现：**
- 使用稳定短句字幕
- 按语义换行
- 保护数字与单位
- 避免逐词高亮
- 检查平台安全区

**失败判据：**
- 所有词跳动
- 缩小字号塞三行

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `cutaway-planning`

**场景：** 数字人两段姿态跳变，旁白提到城市和海。

**必须表现：**
- 选择相关城市/海 B-roll覆盖切点
- 使用 L-cut 保留旁白
- 控制时长
- 自然返回人物

**失败判据：**
- 用无关空镜
- 每句都切走人物

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `depth-composition`

**场景：** 大数字在人物背后，产品从双手附近展开。

**必须表现：**
- 检查 Mask、手部、嘴和字幕
- 让数字遮挡后仍可读
- 检查整个运动路径
- 保持一个主中心

**失败判据：**
- 产品穿过身体
- 只检查稳定帧

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `effect-timing`

**场景：** “不是信息，而是判断力”需要对比动效，但只有 segment_exact。

**必须表现：**
- 优先自然拆分 SpeechSegment或做句级候选
- 在“而是”后建立第二对象
- 预览微调
- 记录非 word_exact

**失败判据：**
- 按字符均分时间
- 声称逐词精确

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `evidence-visualization`

**场景：** 旁白引用法规中的一条退款规定。

**必须表现：**
- 先建立文件标题和来源
- 再推近高亮对应条款
- 保留条件和日期
- 给足阅读时间

**失败判据：**
- 只裁结论
- 生成假的法规页面
- 夸张动画干扰阅读

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `export`

**场景：** 用户批准 Revision 27，项目已继续编辑到 29。

**必须表现：**
- 锁定 27 的 ExportSnapshot
- 检查 rights/quality
- 异步导出并 probe 文件
- 记录 checksum和署名

**失败判据：**
- 导出 latest 29
- Job succeeded 后不验文件

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `known-errors`

**场景：** OmniVoice POST 超时，项目不知道任务是否创建。

**必须表现：**
- 保存请求、幂等键和错误
- 查询 Run/Job/本地输出对账
- 确认副作用后再重试
- 报告结果未知或恢复

**失败判据：**
- 立即重复提交
- 删除原错误
- 假装成功

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `presenter-motion-director`

**场景：** “马上 500 万粉丝，送 70 台平板，点击参与”数字人口播。

**必须表现：**
- 设计高密度 Hook
- 数字放人物后、产品放前景、CTA 放下方
- 人物动作与效果联合规划
- 之后安排安静段

**失败判据：**
- 每句话同样弹字
- 字幕、数字、产品和镜头同时强动

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `production-director`

**场景：** 用户提供 18 段数字人口播、一本书的文案、两条参考视频，希望生成 90 秒成片。

**必须表现：**
- 识别 Presenter 为主路线、Explainer 为局部路线
- 加载语义、人物动效、视觉规划、字幕、声音、Remotion 和质量 Skills
- 先稳定主声音，再做包装
- 在质量复核前不宣布完成

**失败判据：**
- 只生成 Timeline 就结束
- 强制调用 Vlog Director
- 未建立观众承诺

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `project-basics`

**场景：** Web 已将项目从 Revision 12 改到 13，Codex 基于 12 想修改一个 EffectCue。

**必须表现：**
- 拒绝陈旧写入
- 读取 Revision 13 和目标对象
- 重新判断后提交
- 读回 ImpactReport

**失败判据：**
- 强行覆盖
- 把聊天中的旧对象当最新状态

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `quality-verification`

**场景：** 候选视频技术渲染成功，但用户感觉效果一般。

**必须表现：**
- 做四轮审片
- 区分技术与审美
- 按模式检查
- 找根因并做一次最小修订
- 绑定 Revision

**失败判据：**
- 因 MP4 存在就通过
- 只看局部截图
- 无限自修

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `remotion-production`

**场景：** 需要表现“金钱不是自由，但可以购买时间”。

**必须表现：**
- 先写 Design Map
- 用关系/状态而非文字卡片
- 设计 Settled Frame
- 运动有准备、稳定和保持
- 真实合成验证

**失败判据：**
- 默认玻璃卡片+Glow+Spring
- 只看组件透明画布

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `scene-planning`

**场景：** 同一手机 UI 需要展示三个渠道的价格和附加服务。

**必须表现：**
- 共享一个 UIWalkthrough Scene
- 逐项 Reveal
- 定义 Entry/Settled/Exit
- 只在认知模型变化时切 Scene

**失败判据：**
- 每张价格卡单独 Scene
- 没有稳定状态

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `semantic-continuity`

**场景：** 原话有两次重录：第一次情绪好但中间卡顿，第二次完整但平淡。

**必须表现：**
- 比较完整度、情绪、前后衔接和画面
- 不默认后一次最好
- 保留完整思想
- 实听切口

**失败判据：**
- 从两个残缺 Take 拼出从未说过的句子
- 删除所有停顿

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `transcription`

**场景：** 3 分钟口播需要转写和定位重录。

**必须表现：**
- 动态读取 FunASR workflow detail
- 保存原始 text
- 需要时间时先做 VAD 真切片
- 不伪造词级时间
- 回听专名和否定词

**失败判据：**
- 按字数估算 WordTiming
- 把 ASR 分块直接当剪辑单位

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `visual-explainer-director`

**场景：** 解释不同票价、舱位与退票规则。

**必须表现：**
- 使用稳定座舱模型
- 逐组着色、标签、价格和规则
- 在模型、真实素材和证据间交替
- 字幕稳定

**失败判据：**
- 每句话一页 PPT
- 一次展示全部信息

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `visual-treatment-planning`

**场景：** 读书口播包含“金钱与自由、城市和海、把快乐推迟到以后”。

**必须表现：**
- 分别判断对比 MG、真实 B-roll、Remotion 时间隐喻和保持人物
- 建立 AttentionCurve
- 记录不处理方案

**失败判据：**
- 每个名词找库存素材
- 所有句子做卡片

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `vlog-director`

**场景：** 旅行素材包含出发、迷路、找到目的地、人物反应和夜景。

**必须表现：**
- 按事件聚类
- 保留迷路和反应形成变化
- 维护方向和环境声
- 夜景用于收束

**失败判据：**
- 只选最漂亮镜头
- 全按音乐强拍切
- 用 MG 代替故事

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `voice-production`

**场景：** 使用 8 秒参考音频克隆声音，Script 中一处改写。

**必须表现：**
- 按语义分 SpeechSegments
- 只重生成受影响 Segment
- 下载每段并 ffprobe
- 组装 segment_exact 时间
- 连续回听相邻段

**失败判据：**
- 创建远端 VoiceProfile
- 按字符数切段
- 用文本长度估算时长

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告

## `web-editor-operator`

**场景：** 产品图在人物前景稍微挡住嘴，需要微调。

**必须表现：**
- 用对象 ID 定位
- 记录原位置和 Revision
- 小幅调整并检查进入/稳定/退出
- 读回新 Revision

**失败判据：**
- 随机拖动
- 只看静态一帧
- MCP 已写入后重复提交

**建议证据：**
- SkillExecutionReport
- 目标 Revision 与写后读回
- 关键 Preview 帧或播放范围
- QualityReport / 错误报告
