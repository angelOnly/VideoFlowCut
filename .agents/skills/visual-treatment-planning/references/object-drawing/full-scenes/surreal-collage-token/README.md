# 超现实拼贴完整场面 · Token 原作试用参考

[播放完整视频](完整场面.mp4) · [预览页](index.html) · [原页面](scene/index.html) · [核对记录](verification/provenance.json)

## 来源与状态

作者：Dashi AI Lab（《大师的AI小灶》）。
来源：https://github.com/chuspeeism/dashi-animationstyle/tree/aa620f3b859aa5d191b783b2eb0fb59263731c76

2026-10-16 核对远端 main，固定 commit `aa620f3b859aa5d191b783b2eb0fb59263731c76`。
这是直接运行作者 Canvas 完整示例得到的独立场面，未重画物件，未修改动画、美术、字幕或声音设计。
未进入正式推荐，等待用户观看确认；不覆盖现有六个物件案例，也未修改生产渲染器。

## 视频

1920×1080、30 fps、636 帧，原时间线 21.17 秒，按完整帧取整后视频 21.20 秒。
H.264 + AAC，使用作者默认 JPEG 截帧、CRF 18、原口播和原字幕。文件大小 23,490,819 字节。

## 真实差异

当前 Windows 仅安装了源码指定字体中的 Montserrat；缺 Hoefler Text、思源宋体 SC、Songti SC、Avenir Next、PingFang SC、HanziPen SC、Hannotate SC。
未改源码字体栈，使用作者原有通用字体回退；标题字形、手写批注和部分文本宽度与仓库 macOS 静帧存在差异。
因此这是原源码在本机的完整输出，不能称为字体与原参考完全一致。精确复现仍需具备原字体的合法运行环境。

## 文件与依赖

- `完整场面.mp4`：全片视频。
- `scene/`：作者新建作品脚本生成的可运行完整目录，含 Canvas 页面、时间线、动效部件、字幕、分镜及口播。
- `upstream/`：从固定 Git commit 原样导出的 pipeline、Token 示例、超现实拼贴风格目录、README、SKILL 与 LICENSE。
- `upstream-source.zip`：上述原始文件的 Git archive，保留原字节。
- `verification/`：渲染日志、媒体探测、解码检查、静帧与 SHA-256 清单。

渲染只需 Node 22+、Chrome、ffmpeg / ffprobe，不需要 npm 包。本次 Node 24.14.0、Chrome 155.0.8059.40、ffmpeg 8.1。
浏览器、Node、ffmpeg 和商业字体不打包进案例目录；这是源码与内容依赖归档，不承诺脱离这些外部运行环境即可离线重渲染。

## 复现方式

在本案例目录打开 PowerShell，确保 Node、ffmpeg、ffprobe 在 PATH 中：

```powershell
node ./upstream/pipeline/render.mjs ./scene/index.html --chrome 'C:/Program Files/Google/Chrome/Application/chrome.exe' --out ./完整场面.mp4
```

初次组装使用作者命令：`node ./upstream/pipeline/新建作品.mjs ./scene --style 超现实拼贴 --example token`。
调用链：新建作品 → 生成 timeline → 原页面 seek(t) → 原 render.mjs / Chrome 逐帧截图 → ffmpeg 合并原口播。
没有新增渲染器，也没有修改原作者脚本。Windows 通过作者已有 `--chrome` 参数指定浏览器。

作者脚本遇页面错误或编码失败会退出并清理半成品。本机退出清理阶段的 Unix `ps -axo` 报不支持，原脚本已捕获该错误；视频完成、返回码为 0、全片解码通过。未为消除此提示而改原脚本。

## 检查与用途限制

已核对原页面、动效部件、原音频字节完全一致；作者脚本重新生成的时间线仅 CRLF/LF 换行不同，规范换行后文本逐字一致，已完成媒体探测和全片解码。
已查看五个时刻静帧，并与原仓库 7.60 秒静帧对照；连续观看效果和最终认可仍待用户确认。

代码及文档遵循原 [MIT LICENSE](upstream/LICENSE)。**作者本人口播不属于 MIT，仅供试用此 skill**；本视频保留声音用于原作试用参考，不作为可复用配音素材，也不自动进入插件发行物或生产作品。
