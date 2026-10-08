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

调用项目的motion-case-library Skill，例如：“为新闻解释片找3—5个文章对照的参考，给出视频、推荐秒段和迁移代价。”Skill与网页共用case-catalogue.json和search.mjs，选出候选后只读对应analysis.md。

命令行也可从项目根目录运行：

```powershell
node references/motion-cases/skillry/tools/search-cases.mjs --query "手机 照片" --limit 5
```

## 维护

修改对应analysis.md与case-catalogue.json即可，页面直接读取，不生成120份重复网页。每例保留一个video.mp4，不再混入抽帧、截图、日志、临时报告、网页快照、重复源码包或压缩包。

研究过程原件已移到项目内被Git忽略的.local-archives/skillry-research-20261008，本库运行不依赖它。它不上传；历史Git提交仍保留此前已提交的研究文件，本次整理只清理最新版本。

从项目根目录执行 `node --test tests/motion-reference-library.test.mjs` 可核对数量、视频哈希、文件链接、检索和Skill入口。视频约578MB，当前使用普通Git保存，完整拉取需要下载这部分内容。
