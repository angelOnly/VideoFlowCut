# 动效参考视频库

本目录只有120个视频、120份合并拆解，以及共用的分类与浏览入口。视频和文字全部随Git提交，完整拉取仓库后可在本地使用。

## 浏览与检索

从项目根目录运行 `python references/motion-cases/skillry/tools/preview_server.py`，然后打开 [参考库](http://127.0.0.1:8874/library/index.html)。服务只监听本机8874端口，已启动时直接打开即可。也可直接打开案例目录的video.mp4或analysis.md。

可按原片形态、适用视频类型、段落场景、实见素材筛选，或搜索动效和美术短词。点击推荐秒段即可播放；段尾暂停后可继续观看全片。收藏保存在当前浏览器，不会因清空筛选而消失。

## 每个案例只有两个文件

- video.mp4：参考视频。第001条为解决浏览器黑屏而转换的播放版，其余119条为未重新编码的原片。来源与实际文件哈希统一记录在case-catalogue.json。
- analysis.md：用途、材料要求、美术与动效拆解、推荐秒段、实现建议、作者公开输入及来源，合在同一份文档中。

原片实见素材与迁移用途分别标注。后写实现建议不是作者原始指令，未制作验证；本库没有确认这些视频的固定对应源码。原研究基于整片源帧概览与关键区间观察，未完成全部原速与声音专业核验。

## 在项目中使用

调用项目的 [motion-case-library Skill](../../../.agents/skills/motion-case-library/SKILL.md)，例如：“希望一笔总额的组成逐步出现，但始终保留同一个总额参照。”当前模型先读取完整案例卡片集合，按观看关系和实际条件比较，再深入候选analysis.md与必要视频范围，返回本片怎样借鉴、缺口及真实观察范围。资料与网页共用case-catalogue.json；网页与旧CLI仍按关键词检索，不自动调用模型。

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

修改对应analysis.md与case-catalogue.json即可，页面直接读取，不生成120份重复网页。每例保留一个video.mp4，不再混入抽帧、截图、日志、临时报告、网页快照、重复源码包或压缩包。

研究过程原件已移到项目内被Git忽略的.local-archives/skillry-research-20261008，本库运行不依赖它。它不上传；历史Git提交仍保留此前已提交的研究文件，本次整理只清理最新版本。

从项目根目录执行 `npm run test:motion-reference` 可核对加载器、真实库分页、数量、视频哈希、文件链接、关键词检索和Skill入口。这些检查不证明模型语义准确率、连续动作观感或声音质量。视频约578MB，当前使用普通Git保存，完整拉取需要下载这部分内容。
