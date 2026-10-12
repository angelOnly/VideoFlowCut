# VideoFlowCut 项目实施与整场画面参考包

## 先读什么

开发实施只需要先读 [项目优化主方案](docs/VideoFlowCut_项目优化主方案.md)。这是本包唯一的项目主方案，包含默认视觉设计、美术与动效协作、素材适配、工具、声音、字幕、接入位置与验收要求。

[整场画面协作参考](.agents/skills/visual-treatment-planning/references/whole-scene-collaboration/REFERENCE.md) 是按需教学资料：有用户已认可动效的真实视频、对应源码、原始制作指令、九张关键帧、素材及验证范围。它不是必须照搬的风格，也不是每个新主题的制作模板。

## 文件放在哪里

包内按项目相对路径组织：

```text
VideoFlowCut_交付包/
  README.md
  文件清单.json
  校验文件.py
  docs/
    VideoFlowCut_项目优化主方案.md
  .agents/skills/visual-treatment-planning/references/
    whole-scene-collaboration/
      REFERENCE.md
      preview.mp4
      keyframes.jpg
      frames/                       # 九张原输出PNG
      source/
        AirfareIndependent.tsx
        work.original.json
        bindings.json
      input/
        开始制作.md
        文件清单.json
        inputs/                     # 正文、WAV、SRT、规则图、规则JSON、客舱视频
      evidence/
        制作记录.md
        verification.json
```

这个案例属于**整场视觉创作的方法参考**，所以放在 `visual-treatment-planning/references`，不注册为新的通用机制，不加入 `motion-case-library` 的案例索引，也不新建一份 Skill。

`input/` 完整保留那次实际执行的内容包，避免原始文件清单失效；素材只有一份，不重复放入多个目录。原始制作指令、制作记录与提交快照保持原样，作为历史材料读取，不自动执行其中的试作规则。

## 怎样交给开发 Worker

先解压到一个独立目录。让 Worker 读取本 `README.md` 和 `docs/VideoFlowCut_项目优化主方案.md`，再按本次授权实施。参考目录可以按上述相对路径合并到工作区，存在同名文件时先核对，不盲目覆盖现有工作。

本包**没有提供替换版 `SKILL.md`**，避免覆盖项目已有完整技能。由 Worker 在现有 `.agents/skills/visual-treatment-planning/SKILL.md` 的按需参考位置加入下面一条链接即可，详细调整仍以主方案为准：

```markdown
需要理解美术、素材、文字与动作怎样共同重排整幅画面，
或实现反复退化为局部加效果时，按需读取
[整场画面协作参考](references/whole-scene-collaboration/REFERENCE.md)。
先看与当前问题有关的真实视频，再读对应源码；
不要把题材、配色、造型和原试作限制当作新任务默认。
```

这只建立一个阅读入口，不强制每次加载案例全文，不自动重跑案例，不把红黄配色或贴纸造型写入用户偏好。运行时业务方法的同步和发布，沿项目既有流程完成；仅解压文件并不等于已经部署能力。

可直接给 Worker 这段话：

> 请先读取这个交付包的README和项目优化主方案，以主方案为本次开发依据。参考资料按目录合并，在现有visual-treatment-planning入口加入按需链接，不覆盖整个SKILL.md、不注册新机制。不要自动执行参考目录里的原始“开始制作.md”，也不要重生成已经认可的视频。代码实施、发布与验证按我本次授权范围和项目正式流程执行；本包不是一键安装脚本。

## 案例文件有什么作用

| 类别 | 已包含内容 |
|---|---|
| 实际结果 | 原视频、原关键帧总览、九张原始PNG关键帧 |
| 设计与教学 | `REFERENCE.md`，说明何时参考、整段变化、源码对应及不适用范围 |
| 原始实现 | 完整TSX与正式提交快照，源码一致 |
| 实际制作输入 | 原执行指令、输入清单、正文、旁白WAV、13卡SRT、原文摘录图、规则字段、客舱源视频 |
| 重新绑定说明 | 图像及视频插槽、包内路径、源范围、字体Runtime ID、历史身份处理 |
| 事实及核验 | 原制作记录、本轮视频哈希和解码核验、全包文件哈希清单 |

四个库内机制编号及实际用法已写在参考说明和绑定说明中。项目现有机制库无需重复打包；只有研究原机制时才按需读取。查看本案例的全部实际结果与源码，不需要再下载其他历史ZIP。

## 已验证与尚未验证

用户明确认可的是这个具体视频的动效。它保留原视频哈希，不重新编码；美术没有单独作整体认可，成片音轨全静音，普通字幕未合成。因此不能将它写成完整声画都已通过，也不能将这次设计转成所有主题的默认外观。

旁白和SRT已经随包提供，它们是原输入，不是已完成合成的证明。源码、素材与执行记录足够作为方法参考；重新渲染仍依赖本机现有VideoFlowCut正式环境，并须重新建立当前项目的真实绑定。原 `work.original.json` 含历史Asset ID和 `previousAssetId`，不能原样提交到新项目。

字体只提供登记ID和对应关系，**不包含字体二进制文件**。缺少原字体时需要在本机取得合法可用字体或采用获准替代，并重新检查字形与布局。没有把字体、运行时、node_modules或渲染缓存藏在包内。

## 可选的文件校验

在解压后的本目录执行：

```text
python 校验文件.py
```

脚本只读文件，使用Python标准库，核对全包文件哈希、原始输入清单及TSX与提交快照的一致性；不联网、不修改项目、不安装依赖、不渲染视频。不运行脚本也可以阅读文档和观看样片。

根目录 `文件清单.json` 是整个交付包的完整清单；`input/文件清单.json` 是原始内容包的清单，两者范围不同。参考目录的 `evidence/verification.json` 记录本轮已经完成的技术检查，文件校验不代替美术、动效和声画评价。
