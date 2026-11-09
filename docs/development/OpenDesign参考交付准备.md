# OpenDesign 参考交付准备

此工具辅助当前视觉作者准备和核验参考包，不创建 VFC 项目、Revision、Job 或 OpenDesign Run。它不读取生产数据库；创作决定、真实素材和当前 Revision 仍由作者通过正式接口确定。需要 Node.js、ffprobe 和 ffmpeg。

在隔离工作目录或当前作品授权目录创建输入 JSON，路径使用实际文件路径：

```json
{
  "projectId": "实际VFC项目ID",
  "revision": 1,
  "brief": "创意与视觉共同确定的完整制作简报文件路径",
  "timingPlan": "时间编排文件路径",
  "creative": [{"id":"001-c01", "sourceSha256":"实际创意库来源指纹", "usage":"adopted", "purpose":"本片采用用途"}],
  "motion": [{"id":"001-m01", "sourceSha256":"实际机制库来源指纹", "usage":"study", "purpose":"学习动作关系"}],
  "references": [{"id":"art-01", "usage":"study", "purpose":"学习构图与排印", "files":[{"path":"实际参考文件路径", "deliveredPath":"references/art/layout.png"}]}],
  "assets": [{"id":"实际素材ID", "path":"实际素材路径", "purpose":"本片材料作用", "sourceStartMs":0, "sourceEndMs":1000}]
}
```

填写需要 OD 学习或实际采用的参考，`usage` 必须为 `study` 或 `adopted`；空数组可省略。一般美术资料和完整参考视频使用 `references`，每个文件提供来源路径及 `references/` 下的相对交付路径；`assets` 只用于实际入片素材。来源指纹应使用读卡结果以检测资料变化。已选整片参考交付完整原片，局部切片不能替代。运行：

```powershell
node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录
```

程序通过现有读卡器沿当前索引收集创意和动效的正文、原片、片段、分镜及正文中引用的媒体。库内相对目录保留，共用文件只复制一次并记录多项用途；未交付的正文上下文链接被标注。清单记录源文件和交付副本各自的哈希、MIME、文件大小、用途和资料源范围；视频探测时长与帧率并完整解码，图片解码一帧。本片采用的具体范围写在制作简报中。缺失或解码失败写入诊断，命令返回失败。

原视觉作者使用已发布的 OpenDesign 文件交接，将准备目录内的文件按相同相对路径写入指定的隔离或作品项目，包括清单。取得该项目 `list_files` 的实际 `files` 响应，保存为 JSON；不能自己拼造本机路径。另准备核验输入：

```json
{
  "revision": 1,
  "odProjectId": "实际OpenDesign项目ID"
}
```

```powershell
node scripts/opendesign-reference-package.mjs verify 输出目录/delivery-manifest.json OD文件清单.json 核验输入.json
```

核验需要本机文件清单返回的 `localPath`。程序重新核对输入 Revision、源文件与项目内文件哈希，并检查项目内媒体解码；任何缺口不生成请求文本。成功时生成 `verified-manifest.json` 与 `start-run-prompt.md`，其中点名文件、用途、资料源范围和制作要求。

用户要求、事实条件和共同确定的本片编排写在完整制作简报中。视觉作者交回简报、可读资料路径和完整请求；主任务接回导演对当前范围的主要采用决定，核对当前项目、版本和采用目标，使用 `start_motion_authoring` 提交，并通过原 Job 接回实际作品。文件核验与作者实际观看分别记录。远程项目需要使用其实际发布的读取核验能力。
