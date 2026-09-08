---
name: known-errors
description: 处理 Revision 过期、素材未就绪、Bridge 409、run_id 丢失、输出缺失、浏览器解码、Remotion、Mask、Preview、导出和结果未知等确定性错误；创作问题退回专业负责人。
---

# 已知错误、结果未知与可靠恢复

## 先区分技术错误和创作问题

技术错误有明确状态或合同，例如 Revision 冲突、Schema 409、文件损坏、Job 失败、Asset 不可读、Remotion 渲染异常。创作问题是语义不完整、B-roll 无关、节奏单调、字幕竞争和 Scene 像 PPT。不要把所有问题都放进 known-errors，也不要用重试处理审美问题。

## Revision 过期

症状：写入基于旧 `base_revision_id` 被拒绝。处理：重新 `read_project` 和目标对象，查看其它修改与 Impact，重新判断原操作是否仍成立，再基于新 Revision 提交。禁止简单替换 Revision 数字后重放。

## Project 未定位或对象不存在

先 `list_projects` / `target_project`。对象 ID 来自当前 Revision；旧 Scene、Cue 或 Item 可能已被删除。不要用名称猜 ID，也不要创建一个“差不多”的新对象掩盖引用失效。

## Asset 未就绪

区分文件不存在、元数据失败、无音轨、浏览器不支持、Render Worker 不可读、权利未知和角色错误。查看 Asset、Job 和 failureReason。无音轨对静音 B-roll可以合法，对 VoiceReference 不合法。不要把所有状态都标记为 failed。

## Bridge 409

工作流 Schema 已变化或不可用。重新读取 Workflow Detail，检查 available/reason，用新的 schemaVersion、fields 和 itemSlots 重建请求。不能只替换版本号而保留旧 field ID。

## run_id 丢失

ComfyUI 重启后旧 run 可能无法查询。检查本项目 Job、请求摘要、本地下载和目标 Asset。如果输出已下载并验证，不重复生成；没有副作用且任务无法恢复时，使用幂等策略重提。对生成内容要记录新 run 和结果差异。

## Job succeeded 但输出缺失

这是失败，不是成功。检查 outputs kind、downloadUrl、MIME、文件大小和本地注册。文本工作流读取 text，不寻找文件；音视频要下载并校验。HTML 错误页不能当媒体。

## Preview 抽帧失败

确认 Preview Job 属于当前 Project、Revision 和范围，文件存在且可解码。当前实现会先删除同名旧帧，防止误用历史证据。不要在抽帧失败时仍引用旧截图作为本次审片。

## 浏览器和 Render Worker 不一致

检查是否使用同一 Revision Snapshot、资源路径、字体、编解码器、画幅和 Runtime 版本。浏览器正常而导出失败时，不用浏览器截图冒充最终 Artifact；修复环境或资源。

## Mask 错误

检查 Mask Asset、时长、帧率、分辨率和边缘。无 Mask 时使用明确降级，不把 rear layer 当真实人物后景。Mask 失败属于人物/合成技术问题；“后景不该出现”属于视觉判断。

## Remotion 组件失败

候选渲染器对内部 index.html 的“but got no response”最多恢复两次：这是并发导航的 CDP 响应事件竞态，每次仍须完整渲染成功。持续失败保留 Job 诊断，不由剪辑任务重放写入；资源、安全、内容和外部生成错误不走该恢复。

先区分 Props/AssetBinding 错、组件 Bug、局部时间错误、资源不可读和布局问题。生产任务使用 Registry 或受管作品；平台组件开发失败不能绕过受管链执行未审核代码作为 Fallback。组件修复后需要 Registry/Golden/Player/Render 回归。

## Export 失败

Delivery 门禁失败时先查看 blocking 或 EditorialReview 缺失；Render 失败时查看日志和 Asset；文件技术验证失败时保留临时诊断但不发布。禁止静默交付只有 A-roll、缺字幕或缺动效的降级文件。

## 结果未知的通用规则

稳定 MCP 连接在已部署 Runtime 通过发行摘要与健康核验后，才会在两次调用之间切换业务进程。`MCP_TOOL_SCHEMA_CHANGED` 表示该次未执行：刷新实时工具表后重新判断参数；`MCP_CALL_CANCELLED` 表示排队期间取消、未执行。`MCP_CALL_OUTCOME_UNKNOWN` 不表示失败前没有写入，必须按下面的对账规则处理。部署切换后仍需重新读取当前 Project/Revision，并由原剪辑任务确认 Repair Ticket；保留了项目定位不等于保留了当前 Revision。

`Transport closed` 表示宿主到连接管理层本身已经断开，不能通过重复提交写操作恢复，也不能声称后台 Runtime 健康就代表这个任务已经接上。修复任务应使用宿主支持的会话恢复机制，并以原任务的真实调用作为恢复证据。

```text
先读 Job
→ 读 Project/Revision
→ 查目标对象和本地文件
→ 判断是否已有副作用
→ 只有确认没有时才重试
```

不要把“没有收到响应”当“没有执行”。

## 常见错误代码与归属示例

| 情况 | 首先检查 | 返回负责人 |
|---|---|---|
| `PROJECT_NOT_TARGETED` | Project ID / target_project | project-basics |
| Revision conflict | 当前 Revision 和并发修改 | 原专项重新判断 |
| `UNSUPPORTED_MEDIA` / media failed | 扩展、MIME、ffprobe、编码 | asset-import |
| Bridge 409 | Workflow Detail 与新 Schema | transcription / voice / provider |
| `PREVIEW_NOT_READY` | Job 类型、状态、Revision | web/quality |
| `COMPOSED_FRAME_EXTRACTION_FAILED` | Preview 文件、帧范围、ffmpeg | preview runtime |
| `PROJECT_GRAPH_INVALID` | 悬空 Story/Scene/Item/Cue | Application + 原负责人 |
| `EDITORIAL_REVIEW_REQUIRED` | 同 Revision Preview 与五轮 Review | quality-verification |
| `REMOTION_EXPORT_FAILED` | Runtime、Asset、字体、组件 | remotion/export |
| B-roll 无关 | 不是技术重试问题 | visual-treatment/cutaway |

具体错误名称以当前代码为准，表格用于分类思路。

## 日志和用户沟通

用户需要知道发生了什么、是否产生副作用、下一步是什么；不需要看到无法行动的长堆栈。内部日志保存 Project、Revision、Job、run_id、工具、错误码和资源，但避免泄露密钥和敏感本地内容。

## 不允许的恢复

- 删除数据库行让错误“消失”；
- 将 failed Job 改成 succeeded；
- 使用旧 Preview/帧冒充新证据；
- 跳过 Rights 或 Review；
- Remotion 失败时交付只含主轨文件；
- 工具缺失时伪造返回；
- 创作问题反复重试同一技术任务。

## 交接

技术错误恢复后返回原主工作流或专项 Skill，让其重新判断结果是否仍符合创作意图。已恢复不代表质量通过；必要时重新 Preview 和审片。
