# 超现实拼贴完整场面 · 公开无声参考

[原生完整视频](完整场面_无声.mp4) · [同阶段对照](comparison.html) · [案例学习说明](LEARNING.md) · [受管源码](managed/source.tsx)

## 本轮实际状态

原生复现已经完成，本轮未重制原动画，也未修改原 Canvas 绘制逻辑。
公开目录与插件发行目录只含无声视频。原带声音试用材料已移入仓库外部发布树之外的本地忽略目录。
受管首段为原作 8.10–14.00 秒：纸条飞入 → 镜头钻入 → 七连切 → 八片翻面落地 → 轻跳命名 → 纸条遮挡接出。
177 帧，1920×1080、30 fps；不是孤立的剪刀组件演示。

**受管状态：待返修，未进入正式推荐。** 技术渲染与静帧对照已完成；正常速度连续观看未完成，具体差异见 [本版观察](managed/reviews.json)。

## 来源、署名与使用边界

作者：Dashi AI Lab（《大师的AI小灶》）。
固定来源：https://github.com/chuspeeism/dashi-animationstyle/tree/aa620f3b859aa5d191b783b2eb0fb59263731c76
原 HTML：[scene/index.html](scene/index.html)，原代码与文档遵循 [MIT LICENSE](upstream/LICENSE)。
作者口播不属于 MIT，只供试用该 skill。公开版本移除 `scene/口播.wav`、`upstream/examples/token/口播.wav`、带原声全片与包含原声的 ZIP。
原作者代码仍可公开参考，但声音不得随本案例复用或发行。

原 `SKILL.md` 原字节保存为 `upstream/SOURCE_SKILL.md`，避免参考归档被技能发现器当成新增生产技能。
公开的两个 `作品.json` 去掉音频配置，修改默认输出为无声参考；其它原绘制逻辑没有改变。

## 本地研究副本与历史风险

本地完整带原声研究副本：
`E:\ai\VideoCut\.local-archives\surreal-collage-token\original-with-voice-531deb3\case`
该目录由既有 `.local-archives/` 忽略规则排除；原始下载缓存也已加入定向忽略。插件只同步 `.agents/skills/`，不读取研究副本。

2026-10-16 检查确认，含原声文件的提交 `531deb39b5cb9f70a6b066b9fe092a4ca3dc8515` 已是 `origin/main` 的远端提交。
当前工作树删除不能删除 Git 历史；旧提交和已有下载仍可取得旧文件。**本轮没有重写历史、强制推送、提交或推送。** 历史清理须另行确认范围后处理。
详情见 [发布核查](verification/publication.json)。

## 公开文件

- `完整场面_无声.mp4`：已有 21.20 秒原生视频直接去音轨封装，画面不重编码。
- `native-segment.mp4`：从已有视频截取原作 8.10–14.00 秒用于对照，不重新运行原动画。
- `managed/preview.mp4`：当前受管源码真实输出，177 帧。
- `comparison.mp4`：左原生、右受管，两个实际视频同速并排，177 帧。
- `managed/source.tsx`、`demo-props.json`、`resources.json`：受管源码、参数、材料及其来源哈希。
- `managed/resources/`：由原 Canvas 的静态材料生成函数导出的纸底、石材、色纸、颗粒、笔刷等；没有核心动画帧序列。
- `scene/`、`upstream/`：原源码、时间线、分镜和渲染脚本，排除受限口播；附原作者许可与说明。
- `LEARNING.md`：场面发展、美术与材料、对象行为、关键中途、函数映射和不同内容的适配方法。
- `verification/`、`managed/verification.json`、`managed/reviews.json`：当前文件哈希、无音轨检查、阶段截图、技术验证与未通过项。

## 重现与主要调用链

在仓库根运行：

```powershell
npx tsx scripts/prepare-surreal-scene.ts
npx tsx scripts/render-surreal-scene.ts
npm run plugin:sync-skills
```

第一步只从未修改的原页面导出静态材料、字宽和几何数据，使用本机 Chrome；不会生成原作全片。
第二步校验材料哈希 → `motionSubmissionSchema` → 现有 `renderManagedMotion` → 同源预览与确定性检查 → 从已有原生视频截段并生成同步对照；使用既有受管字体绑定 `noto-serif-sc-black`。
第三步在同步前后检查此案例，拒绝音频文件、压缩包和含音轨视频；插件验证也检查源与发行副本。同步与验证需要 PATH 中可用的 ffprobe，本机已具备。
本次仅同步 Skills 文件，没有构建或切换生产 Runtime，没有改动既有六例。

失败时不以旧视频冒充新预览：材料缺失或哈希不符直接停止；受管渲染失败保留隔离现场，不覆盖当前成功视频。当前观察与输入哈希、视频哈希绑定，重新渲染不自动认可。

原生需要重跑时可使用作者脚本 `node upstream/pipeline/render.mjs scene/index.html --no-audio --chrome <Chrome路径> --out 完整场面_无声.mp4`；本轮没有执行此命令。公开归档省略了口播，原作者 `--example token` 新建命令会因缺音频而失败；公开无声复现直接使用现有 scene，不把缺失音频重新下载进公开目录。

## 限制与实际代价

原生本机缺少部分 macOS 字体；受管版本改用已有 Noto Serif SC Black，手写字体仍有差异，不能宣称逐像素复现。
入场卡片与页眉是静态参考贴片，其内部演出若要编辑需继续拆解。当前八单元位置和原词固定，换成不同内容需重新量字、分配切口和落点，不是任意内容自动生成器。
Node、Chrome、ffmpeg、现有受管渲染依赖和字体由运行环境提供，不将这些程序或商业字体复制进案例。
浏览器安全策略阻止本轮打开本地 file:// 页面，因此正常速度连续观看未完成；不以阶段截图代替完整效果认可。
