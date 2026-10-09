# 动效参考视频库

本目录保留120个参考视频和对应拆解，以及共用的分类与浏览入口。001–120全部完成机制化整理，共744条独立运动机制：每片有完整总览和64宫格，每个可复用机制有独立指令与真实源帧分镜。全部正式资料保存在项目内，实际覆盖范围也显示在机制检索页。

正文只描述可见运动、相对布局、先后交叠、保持、接续和运镜，不拆解题材、具体主体、美术或配色。机制以完整动作关系为单位，同片重复动作在总览中复用；静止保持和单帧硬切不凑独立卡。总览明确连续交接与直接切换的区别，不假定所有段落都由同一对象贯穿。

## 浏览与检索

从项目根目录运行 `python references/motion-cases/skillry/tools/preview_server.py`，然后打开 [参考库](http://127.0.0.1:8874/library/index.html) 或 [运动机制检索](http://127.0.0.1:8874/library/mechanisms.html)。服务只监听本机8874端口，已启动时直接打开即可。也可直接打开案例目录的视频或 Markdown。

整片首页保留原片形态、适用视频类型、段落场景和实见素材筛选。机制页按10类变化、动作特征、已有状态、保持条件和来源案例浏览；卡片依次显示标题、完整分镜图和简述。保留候选后进入 compare.html，可并排看分镜、排序、标记采用并复制恢复链接。清单直接保存在链接中，不新建数据库或生成资料副本。网页使用本地词表与文字匹配，复杂自然语言由当前 Codex 理解。原片秒点不作为新片时序要求。

机制筛选会按其他已选条件显示每个选项的匹配数，无匹配的新选项置灰；同组条件可直接更换，已选条件可逐项取消。保持条件和来源案例放在“更多筛选”。旧链接或关键词导致空结果时，保留原选择，提供最少取消哪些条件及对应恢复数量，由用户点击应用；不会自动放宽条件。筛选、翻页和清空筛选均保留已加入的候选。

## 每个案例的文件

- video.mp4：参考视频。第001条为解决浏览器黑屏而转换的播放版，其余119条为未重新编码的原片。来源与实际文件哈希统一记录在case-catalogue.json。
- overview.md：每片一份。按全片顺序说明运动发展与交接，链接各子机制，直接嵌入完整64宫格；重复机制可多次引用。
- storyboard.jpg：新版每片唯一的8×8总览图，含64张真实源帧；序号仅辅助阅读，不带精确秒点。
- mechanisms/m01.md、m01.jpg 等：每个完整运动机制一份指令、一张分镜组图，图片直接嵌在文档中。指令说明运动过程、交叠、保持、起止状态和组合调整，不要求固定秒数或对应格号，不拆解题材与美术。

整片分类卡中的原片实见素材与迁移用途分别标注。本库没有确认这些视频的固定对应源码；机制指令也是观察后的可迁移描述，不是作者原始指令或已验证的新片配方。整理依据真实源帧总览和必要局部序列核对运动顺序，源帧观察不等于原速连续播放或声音核验。正式机制分镜属于阅读资料，研究过程的密集抽帧不放在库内。

## 在项目中使用

调用项目的 [motion-case-library Skill](../../../.agents/skills/motion-case-library/SKILL.md)，例如：“让散开的多个元素依次填满一个区域，结束后保持整体，再接局部放大。”模型先读轻量机制摘要，以起始条件、运动关系和结束状态比较，再按需打开少量候选指令及分镜。组合时对齐前后状态与持续对象，无法直接接上的部分重新设计；需要原片上下文才读总览。不为每份机制单独注册 Skill。

机制 Markdown 是唯一正文和分类来源。网页、CLI 与 MCP 共用自动派生的 mechanism-index.json 和同一查询实现。正式剪辑由 Skill 调用 search_motion_mechanisms 和 read_motion_mechanism：按需求分阶段、当前状态、相似机制、前后接续查候选，读取采用清单后按需返回原文与分镜图片；只读操作不创建项目、Revision 或 Job。构建完成的新 MCP 需在宿主重连后才会出现在实时工具目录中。

允许本地资料脚本的开发环境可从仓库根只读查询：

```powershell
node references/motion-cases/skillry/tools/mechanisms.mjs --offset 0 --limit 20
node references/motion-cases/skillry/tools/mechanisms.mjs --ids 002-m05
node references/motion-cases/skillry/tools/mechanisms.mjs --request '{"query":"依次填满网格","entry":["外框"],"holds":["外框保持"],"limit":12}'
```

分页按 next_offset 续读，核对 source_sha256 一致。只读过部分摘要就只报告实际阅读范围，库已全部整理不代表本次检索已看完全部资料。索引 scope 自动汇总整理范围；整片参考使用下方卡片入口，其 analysis 字段指向实际总览文档，不固定拼接文件名。

允许执行只读资料脚本的宿主可从项目根目录分页读取卡片：

```powershell
node references/motion-cases/skillry/tools/read-case-cards.mjs --offset 0 --limit 20
node references/motion-cases/skillry/tools/read-case-cards.mjs --ids 12,60,71
```

全库读取按返回的next_offset续读，直到exhausted为true，并核对各批catalogue_sha256一致；输出截断须缩小批次重读，不能据此宣称已覆盖。按编号读取只用于准确定位，不代表全库覆盖。加载器只投影原字段，不排名、不读视频、不写文件，不维护第二套索引。未知编号、损坏索引和越界路径会失败退出，不静默省略条目。缺库或无合适参考时保留缺口，继续独立创作。

命令行也可从项目根目录运行：

```powershell
node references/motion-cases/skillry/tools/search-cases.mjs --query "手机 照片" --limit 5
```

## 维护

修改各例的 overview.md 和独立机制 Markdown。机制开头元数据使用 YAML 的单行 JSON 值子集：字符串加双引号、数组写成 JSON 数组；字段为 id、title、case_number、summary、purpose、relation、start_state、end_state、tags、retrieval。retrieval 含 categories、actions、entry、exit、holds、anchors 六组词表值，统一词表在 taxonomy.mjs。分类与动作不能为空；没有依据的状态或保持条件可留空，不能猜测补满。正文里的起止状态和关系仍是最终核读依据，粗分类只用于召回。每份机制必须嵌入同名 JPG；不重复保存图片。

第一版依据已有机制摘要、起止描述和关系补齐全库分类，前10例另外核对了分镜；本次分类工作不声称重新连续看完120条视频。检索会同时返回完整描述和条件，入围项由使用者继续核读。工具对过期索引、未知编号、路径越界和缺图明确报错。前后段结果只提示状态重合与连接缺口，不能证明动态连贯。候选链接失效或来源指纹变化时保留提示，不自动覆盖采用判断。

修改机制后从项目根目录重新生成并检查索引：

```powershell
node references/motion-cases/skillry/tools/mechanisms.mjs --build
node references/motion-cases/skillry/tools/mechanisms.mjs --check
```

每例只保留一份视频、总览、唯一64宫格、各机制文档和其必要分镜组图。已替换的合并拆解不保留在正式目录，不混入密集抽帧、额外截图、日志、临时报告、网页快照、重复源码包或压缩包。

研究过程原件已移到项目内被Git忽略的.local-archives/skillry-research-20261008，本次全库整理的密集帧、草稿、审计和旧稿位于同样被忽略的.local-archives/skillry-motion-restudy-20261009。本库运行不依赖这些工作目录，它们不上传；历史Git提交仍保留此前已提交的研究文件，本次整理只清理最新版本。

从项目根目录执行 `npm run test:motion-reference` 可核对索引与正文一致、加载器分页、数量、视频哈希、文件链接、关键词检索和 Skill 入口。这些检查不证明模型语义准确率、连续动作观感或声音质量。视频约578MB，当前使用普通Git保存，完整拉取需要下载这部分内容。
