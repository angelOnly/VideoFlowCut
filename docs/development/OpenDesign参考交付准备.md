# OpenDesign 参考交付准备

此工具辅助当前视觉作者准备和核验参考包，不创建 VFC 项目、Revision、Job 或 OpenDesign Run。它不读取生产数据库；创作决定、真实素材和当前 Revision 仍由作者通过正式接口确定。需要 Node.js、ffprobe 和 ffmpeg。

在隔离工作目录或当前作品授权目录创建输入 JSON，路径使用实际文件路径：

```json
{
  "projectId": "实际VFC项目ID",
  "revision": 1,
  "brief": "创意与视觉共同确定的完整制作简报文件路径",
  "timingPlan": "时间编排文件路径",
  "projectSnapshot": "当前read_project结果JSON路径",
  "creative": [{"id":"001-c01", "sourceSha256":"实际创意库来源指纹", "usage":"adopted", "purpose":"本片采用用途"}],
  "motion": [{"id":"001-m01", "sourceSha256":"实际机制库来源指纹", "usage":"study", "purpose":"学习动作关系"}],
  "references": [{"id":"art-01", "usage":"study", "purpose":"学习构图与排印", "files":[{"path":"实际参考文件路径", "deliveredPath":"references/art/layout.png"}]}],
  "assets": [{"id":"实际素材ID", "path":"实际素材路径", "purpose":"本片材料作用"}],
  "scenes": [{
    "sceneId":"scene-01", "status":"ready",
    "reference":{"creativeCaseId":"001-c01", "sourceSha256":"实际创意库来源指纹", "startMs":10000, "endMs":25000},
    "visualRoles":[{"role":"主要主体", "referenceFunction":"参考中的视觉作用", "assetIds":["实际素材ID"],
      "sourceRanges":[{"startMs":1000, "endMs":6000}], "usage":"本片中的具体使用方式"}],
    "process":"从开场、素材与文字变化到结果和接续的完整过程",
    "preserve":["需要保留的主要视觉关系"], "adapt":["可由制作作者深化的部分"]
  }]
}
```

填写需要 OD 学习或实际采用的参考，`usage` 必须为 `study` 或 `adopted`；空数组可省略。一般美术资料和完整参考视频使用 `references`，每个文件提供来源路径及 `references/` 下的相对交付路径；`assets` 只用于实际入片素材。来源指纹应使用读卡结果以检测资料变化。已选整片参考交付完整原片，局部切片不能替代。

`scenes` 只表达本次制作交接，不创建项目场面或第二套生命周期。完整制作简报仍是权威正文，`process` 写清当前场面的连续过程；`preserve`、`adapt` 分别写清主要创意和自主深化范围。采用创意参考时，场面中的创意卡必须同时在 `creative` 中标为 `adopted`，来源指纹和原片范围会与读卡及实际视频核对。同一场面采用多个参考时，以 `references` 数组替代 `reference`，每项另填写 `purpose` 说明该参考的场面用途，并在 `process` 写清连接；输出统一保存在场面的 `references` 列表。原创场面可以不填写参考。

包含已取得素材的场面需要先将当前 `read_project` 的完整结果保存为 `projectSnapshot`；程序核对项目、Revision、Asset 状态、Asset ID 和文件哈希，不把候选 ID 当作 Asset。快照只在本地用于核验，不交给 OpenDesign；它或源文件发生变化时需要重新准备。`assets` 中的路径指向实际受管文件或与之哈希一致的副本。视觉角色使用多个素材时，每个 `sourceRanges` 项还需填写对应的 `assetId`；静态图片不填时间范围。时间范围以交付素材文件的本地零点为准，程序检查实际时长；若取得记录带有原片截取起点，同时写出换算后的原片时间，避免混淆两种时钟。

同一交付包可以记录多个场面。尚在探索的场面使用 `pending`；声称 `ready` 但缺素材、文件不一致、范围无效或缺少连续过程的场面会标为 `incomplete` 并列出原因。至少一个场面就绪且本轮所需文件均通过核验时，可先制作就绪场面；仅由未就绪场面引用的参考或素材标记为 `requiredForRun: false`，保留缺口但不阻塞本轮，也不要求交付到制作项目。其他场面继续补充并重新准备。已有不涉及场面映射的交付仍可省略 `scenes` 和 `projectSnapshot`。准确文案、配音和声音资料同样通过 `references` 或 `assets` 指明实际文件与用途；音频会探测并完整解码，缺失或不可读不能生成请求。

运行：

```powershell
node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录
```

程序通过现有读卡器沿当前索引收集创意和动效的正文、原片、片段、分镜及正文中引用的媒体。库内相对目录保留，共用文件只复制一次并记录多项用途；未交付的正文上下文链接被标注。清单记录源文件和交付副本各自的哈希、MIME、文件大小、用途和资料源范围；视频探测时长与帧率并完整解码，音频完整解码，图片解码一帧。场面映射写入 `brief/scenes.json` 并同其他文件一起核验。本片采用的具体编排仍写在制作简报中。缺失或解码失败写入诊断，命令返回失败；没有任何就绪场面时也不生成制作请求。

原视觉作者使用已发布的 OpenDesign 文件交接，将清单中本轮需要且 `localReadable` 的文件按相同相对路径写入指定的隔离或作品项目，包括清单；不要把准备目录中的旧文件或仅供未就绪场面的文件当成本轮输入。取得该项目 `list_files` 的实际 `files` 响应，保存为 JSON；不能自己拼造本机路径。另准备核验输入：

```json
{
  "revision": 1,
  "odProjectId": "实际OpenDesign项目ID"
}
```

```powershell
node scripts/opendesign-reference-package.mjs verify 输出目录/delivery-manifest.json OD文件清单.json 核验输入.json
```

核验需要本机文件清单返回的 `localPath`。程序重新核对输入 Revision、项目快照、源文件与项目内文件哈希，并检查项目内媒体解码；实际交付文件有缺口时不生成请求文本。成功时生成 `verified-manifest.json` 与 `start-run-prompt.md`，其中点名文件、用途、资料源范围、就绪场面映射和制作要求，并明确未就绪场面不能作为本轮完成内容。

用户要求、事实条件和共同确定的本片编排写在完整制作简报中。视觉作者交回简报、可读资料路径和完整请求；主任务接回导演对当前范围的主要采用决定，核对当前项目、版本和采用目标，使用 `start_motion_authoring` 提交，并通过原 Job 接回实际作品。文件核验与作者实际观看分别记录。远程项目需要使用其实际发布的读取核验能力。
