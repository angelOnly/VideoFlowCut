# 动效参考视频库

本目录保留120个参考视频和对应拆解，以及共用的分类与浏览入口。当前10例完成新版机制化，共94条独立机制：每片有完整总览和64宫格，每个可复用运动机制有独立指令与分镜。其余110例仍为旧版。全部正式资料保存在项目内，实际覆盖范围也显示在机制检索页。

已转换编号：001、002、007、012、032、043、051、060、071、106。本批新增8例、65条机制，覆盖前景保持与换底、中心穿越、框内外接管、局部外提、列表重排、连续输入、跨尺度运动和同轴合拢。同片重复动作在总览中复用，不按重复次数增加卡片。

## 浏览与检索

从项目根目录运行 `python references/motion-cases/skillry/tools/preview_server.py`，然后打开 [参考库](http://127.0.0.1:8874/library/index.html) 或 [运动机制检索](http://127.0.0.1:8874/library/mechanisms.html)。服务只监听本机8874端口，已启动时直接打开即可。也可直接打开案例目录的视频或 Markdown。

整片首页保留原片形态、适用视频类型、段落场景和实见素材筛选，用于定位原片。机制页按运动描述、标签、变化目的和来源案例过滤；点击结果直接阅读该机制的指令和分镜，也可返回原片总览。网页执行文字过滤，不自动调用模型进行语义检索。旧版推荐秒段与收藏功能保留。

## 每个案例的文件

- video.mp4：参考视频。第001条为解决浏览器黑屏而转换的播放版，其余119条为未重新编码的原片。来源与实际文件哈希统一记录在case-catalogue.json。
- overview.md：已转换案例提供。按全片顺序说明运动发展与交接，链接各子机制，直接嵌入完整64宫格；重复机制可多次引用。
- storyboard.jpg：新版每片唯一的8×8总览图，含64张真实源帧；序号仅辅助阅读，不带精确秒点。
- mechanisms/m01.md、m01.jpg 等：每个完整运动机制一份指令、一张分镜组图，图片直接嵌在文档中。指令说明运动过程、交叠、保持、起止状态和组合调整，不要求固定秒数或对应格号，不拆解题材与美术。
- analysis.md：其余110例保留旧版合并拆解，尚未转换。

旧版的原片实见素材与迁移用途分别标注。本库没有确认这些视频的固定对应源码；新机制指令也是观察后的可迁移描述，不是作者原始指令或已验证的新片配方。新版依据密集源帧序列核对运动顺序，源帧观察不等于原速连续播放或声音核验。正式机制分镜属于阅读资料，研究过程的密集抽帧不放在库内。

## 在项目中使用

调用项目的 [motion-case-library Skill](../../../.agents/skills/motion-case-library/SKILL.md)，例如：“让散开的多个元素依次填满一个区域，结束后保持整体，再接局部放大。”模型先读轻量机制摘要，以起始条件、运动关系和结束状态比较，再按需打开少量候选指令及分镜。组合时对齐前后状态与持续对象，无法直接接上的部分重新设计；需要原片上下文才读总览。不为每份机制单独注册 Skill。

机制 Markdown 是唯一正文。网页和 Skill 共用从元数据自动生成的 mechanism-index.json，不手工维护第二份说明。只读查询示例：

```powershell
node references/motion-cases/skillry/tools/mechanisms.mjs --offset 0 --limit 20
node references/motion-cases/skillry/tools/mechanisms.mjs --ids 002-m05
```

分页按 next_offset 续读，核对 source_sha256 一致。只读过部分摘要就只报告实际覆盖范围。索引 scope 自动汇总已整理案例，不能将部分范围视为全部120例；整片参考和未转换案例仍使用下方卡片入口，其 analysis 字段指向实际文档，不固定拼接 analysis.md。

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

旧例修改 analysis.md，新例修改 overview.md 和独立机制 Markdown。机制开头元数据使用 YAML 的单行 JSON 值子集：字符串加双引号、数组写成 JSON 数组；字段为 id、title、case_number、summary、purpose、relation、start_state、end_state、tags。每份机制必须嵌入同名 JPG。case-catalogue.json 记录原片入口与机制编号，页面直接读取，不生成重复网页。

修改机制后从项目根目录重新生成并检查索引：

```powershell
node references/motion-cases/skillry/tools/mechanisms.mjs --build
node references/motion-cases/skillry/tools/mechanisms.mjs --check
```

每例只保留一份视频；新版另有总览、唯一64宫格、各机制文档和其必要分镜组图。不混入密集抽帧、额外截图、日志、临时报告、网页快照、重复源码包或压缩包。

研究过程原件已移到项目内被Git忽略的.local-archives/skillry-research-20261008，本次样例的密集帧与制作记录位于同样被忽略的.local-archives/skillry-motion-restudy-20261009。本库运行不依赖这些工作目录，它们不上传；历史Git提交仍保留此前已提交的研究文件，本次整理只清理最新版本。

从项目根目录执行 `npm run test:motion-reference` 可核对索引与正文一致、加载器分页、数量、视频哈希、文件链接、关键词检索和 Skill 入口。这些检查不证明模型语义准确率、连续动作观感或声音质量。视频约578MB，当前使用普通Git保存，完整拉取需要下载这部分内容。
