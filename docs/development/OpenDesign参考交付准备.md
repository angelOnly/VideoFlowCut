# OpenDesign 参考交付准备

此工具辅助当前视觉作者准备和核验参考包，不创建 VFC 项目、Revision、Job 或 OpenDesign Run。它不读取生产数据库；创作决定、真实素材和当前 Revision 仍由作者通过正式接口确定。需要 Node.js、ffprobe 和 ffmpeg。

在隔离工作目录或当前作品授权目录创建输入 JSON，路径使用实际文件路径：

```json
{
  "projectId": "实际VFC项目ID",
  "revision": 1,
  "brief": "视觉导演指令文件路径",
  "timingPlan": "时间编排文件路径",
  "creative": [{"id":"001-c01", "sourceSha256":"实际创意库来源指纹", "purpose":"本片采用用途"}],
  "motion": [{"id":"001-m01", "sourceSha256":"实际机制库来源指纹", "purpose":"本片动作关系"}],
  "assets": [{"id":"实际素材ID", "path":"实际素材路径", "purpose":"本片材料作用", "sourceStartMs":0, "sourceEndMs":1000}]
}
```

只填写实际采用项；空数组可省略。来源指纹应使用读卡结果以检测资料变化。运行：

```powershell
node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录
```

程序通过现有读卡器沿当前索引收集创意正文、原片、片段、主分镜及正文中引用的媒体；动效读取实际机制正文、片段和分镜。库内相对目录保留，共用文件只复制一次并记录多项用途；未交付的正文上下文链接被标注。清单记录源文件和交付副本各自的哈希、MIME、文件大小、用途和适用源范围；视频探测时长与帧率并完整解码，图片解码一帧。缺失或解码失败写入诊断，命令返回失败。该阶段的 OD 可读状态始终为否。

原视觉作者使用已发布的 OpenDesign 文件交接，将准备目录内的文件按相同相对路径写入指定的隔离或作品项目，包括清单。取得该项目 `list_files` 的实际 `files` 响应，保存为 JSON；不能自己拼造本机路径。另准备核验输入：

```json
{
  "revision": 1,
  "odProjectId": "实际OpenDesign项目ID",
  "boundaries": {"mustKeep":"必须保留的事件、材料角色、顺序与时间范围", "freedom":"允许深化的美术与实现范围"}
}
```

```powershell
node scripts/opendesign-reference-package.mjs verify 输出目录/delivery-manifest.json OD文件清单.json 核验输入.json
```

核验需要本机文件清单返回的 `localPath`。程序重新核对输入 Revision、源文件与项目内文件哈希，并检查项目内媒体解码；任何缺口不生成请求文本。成功时生成 `verified-manifest.json` 与 `start-run-prompt.md`，其中点名文件、用途和导演边界。视觉作者仍须使用实际 MCP Schema 发起 Run 并保存请求、请求身份、Run、输入版本及同版产物；该工具不发送请求、不记录运行结果，也不能证明 OpenDesign 已观看或采用参考。远程项目若不提供可验证本机路径，需使用其实际发布的读取核验能力，不能将本工具的本机检查结果推定为远程读取。
