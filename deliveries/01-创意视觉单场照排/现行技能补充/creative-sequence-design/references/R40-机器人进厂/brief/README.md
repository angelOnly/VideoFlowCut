# R40 历史首次交付资料

本目录保存 R40 历史首次交付原件，对应当时的 Revision 28，供来源追溯。成熟首版编排请阅读[《角色指令逐段拆解》](../角色指令逐段拆解.md)。新任务使用结合本片素材完成的当前导演稿。

[首次制作指令](../教学素材/02_原始指令与回执/04_交给OD的首次制作指令_原文.md)点名了下面六份文件。

| 当时要求读取的原件 | 用途 |
|---|---|
| [视觉导演稿](visual-director-brief.md) | 读七段旁白，以及 016、026、032 分别怎样进入本片。 |
| [配音与画面时间表](timing-plan.md) | 按七段配音找出素材和动作应出现的帧段。 |
| [交付文件核验清单](verified-manifest.json) | 按 deliveredPath 查找收到的文件，并用 sha256 核对内容。 |
| [动效源码制作规范](hyperframes-contract.md) | 核对画幅、素材槽、字体绑定与时间线的实现约定。 |
| [当时可用的字体与制作能力](motion-capabilities.json) | 确定当次运行环境提供哪些字体和素材绑定方式。 |
| [交给 OD 的逐项开工指令](start-run-prompt.md) | 逐项查看原片、分镜、源素材和旁白如何分配给制作。 |

原清单对应首次交接时的 Revision 28，案例成片是返修后的 R40。六份原件保留历史内容。清单中的 sourcePath 记录当时的机器路径，实际文件按 deliveredPath 从案例根目录查找。

## 清单里的素材、参考和旁白

下面的链接直接打开当时交给 OD 的文件。原始素材与旁白是完整源文件；剪进成片的区间另见[实际源段与使用位置](../教学素材/入片源段/README.md)。

| 项目用途 | 相对路径 |
|---|---|
| 历史视觉导演稿 | [brief/visual-director-brief.md](../brief/visual-director-brief.md) |
| 完整时间编排 | [brief/timing-plan.md](../brief/timing-plan.md) |
| 整场构图、素材接续及大字 | [references/skillry/cases/monokern-613142-original/creative/c01.md](../references/skillry/cases/monokern-613142-original/creative/c01.md) |
| 整场构图、素材接续及大字 | [references/skillry/cases/monokern-613142-original/video.mp4](../references/skillry/cases/monokern-613142-original/video.mp4) |
| 整场构图、素材接续及大字 | [references/skillry/cases/monokern-613142-original/storyboards/creative-c01.jpg](../references/skillry/cases/monokern-613142-original/storyboards/creative-c01.jpg) |
| 点阵扫描、散开与数字聚合 | [references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.md](../references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.md) |
| 点阵扫描、散开与数字聚合 | [references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.jpg](../references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.jpg) |
| 点阵扫描、散开与数字聚合 | [references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.mp4](../references/skillry/cases/jesscaroline7-955094-original/mechanisms/m07.mp4) |
| 画面越框扩张、回收和扫描 | [references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.md](../references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.md) |
| 画面越框扩张、回收和扫描 | [references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.jpg](../references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.jpg) |
| 画面越框扩张、回收和扫描 | [references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.mp4](../references/skillry/cases/zakisbuilding-495680-original/mechanisms/m09.mp4) |
| 主画面转小窗及换图 | [references/skillry/cases/monokern-613142-original/mechanisms/m02.md](../references/skillry/cases/monokern-613142-original/mechanisms/m02.md) |
| 主画面转小窗及换图 | [references/skillry/cases/monokern-613142-original/mechanisms/m02.jpg](../references/skillry/cases/monokern-613142-original/mechanisms/m02.jpg) |
| 主画面转小窗及换图 | [references/skillry/cases/monokern-613142-original/mechanisms/m02.mp4](../references/skillry/cases/monokern-613142-original/mechanisms/m02.mp4) |
| 多画面集合与交叉字带 | [references/skillry/cases/monokern-613142-original/mechanisms/m05.md](../references/skillry/cases/monokern-613142-original/mechanisms/m05.md) |
| 多画面集合与交叉字带 | [references/skillry/cases/monokern-613142-original/mechanisms/m05.jpg](../references/skillry/cases/monokern-613142-original/mechanisms/m05.jpg) |
| 多画面集合与交叉字带 | [references/skillry/cases/monokern-613142-original/mechanisms/m05.mp4](../references/skillry/cases/monokern-613142-original/mechanisms/m05.mp4) |
| 翻卷换底与线条接续 | [references/skillry/cases/monokern-613142-original/mechanisms/m07.md](../references/skillry/cases/monokern-613142-original/mechanisms/m07.md) |
| 翻卷换底与线条接续 | [references/skillry/cases/monokern-613142-original/mechanisms/m07.jpg](../references/skillry/cases/monokern-613142-original/mechanisms/m07.jpg) |
| 翻卷换底与线条接续 | [references/skillry/cases/monokern-613142-original/mechanisms/m07.mp4](../references/skillry/cases/monokern-613142-original/mechanisms/m07.mp4) |
| 黄色机械臂抓取蓝色构件 | [references/source-materials/asset_896d7f47-3aef-446a-b0ed-b67048bfda74/1794057762221-e1f2a8684b.mp4](../references/source-materials/asset_896d7f47-3aef-446a-b0ed-b67048bfda74/1794057762221-e1f2a8684b.mp4) |
| 汽车工厂机械臂与车身 | [references/source-materials/asset_2315f254-7b0f-4000-a2e1-7cd87dc35842/1794057796930-773cba4e18.mp4](../references/source-materials/asset_2315f254-7b0f-4000-a2e1-7cd87dc35842/1794057796930-773cba4e18.mp4) |
| 人员操作控制器 | [references/source-materials/asset_ac6098fa-ae9a-4019-8479-0b6505033028/1794057796960-df2c08770c.mp4](../references/source-materials/asset_ac6098fa-ae9a-4019-8479-0b6505033028/1794057796960-df2c08770c.mp4) |
| 工人、料箱与输送线 | [references/source-materials/asset_74e1f780-3b70-4d66-8d67-0b45b5981717/1794057796997-9724733940.mp4](../references/source-materials/asset_74e1f780-3b70-4d66-8d67-0b45b5981717/1794057796997-9724733940.mp4) |
| 机械臂抓取并放下托盘 | [references/source-materials/asset_2d107d16-dc70-4e94-85ba-c22267cdea7d/1794057797027-932c3e8671.mp4](../references/source-materials/asset_2d107d16-dc70-4e94-85ba-c22267cdea7d/1794057797027-932c3e8671.mp4) |
| Digit搬料箱近景、Digit与料箱全身 | [references/source-materials/asset_b213af67-179a-490f-bf98-7a88653b90f4/1794057797076-a1b9b380b6.mp4](../references/source-materials/asset_b213af67-179a-490f-bf98-7a88653b90f4/1794057797076-a1b9b380b6.mp4) |
| Figure人形机器人手部与工件 | [references/source-materials/asset_e5aecd48-6398-460d-9cd7-2cc86be12416/1794057797115-9bdd53c09e.mp4](../references/source-materials/asset_e5aecd48-6398-460d-9cd7-2cc86be12416/1794057797115-9bdd53c09e.mp4) |
| Atlas机器人持件对位与调整 | [references/source-materials/asset_278147ff-a6b6-4620-bfa2-80e34276355f/1794057797181-04ede5d675.mp4](../references/source-materials/asset_278147ff-a6b6-4620-bfa2-80e34276355f/1794057797181-04ede5d675.mp4) |
| 实际旁白供声音和时序观察，最终由VideoFlowCut独立合成 | [references/source-materials/asset_50a3a17a-83e5-47db-b0ad-1f39dc7d0b63/speech-job_12d46707-e84c-41ac-a3f0-ed9218f30cdd.wav](../references/source-materials/asset_50a3a17a-83e5-47db-b0ad-1f39dc7d0b63/speech-job_12d46707-e84c-41ac-a3f0-ed9218f30cdd.wav) |

## 首版之后看哪些文件

- [R32 返修前半抽帧](review-r32-frames-1.jpg)和[后半抽帧](review-r32-frames-2.jpg)是第三条返修反馈点名的两张图。
- [返修前源码](../返修前/motion/robot-reliability.html)与[返修前作者清单](../返修前/motion/author-manifest.json)对应收到反馈时的基线。
- [R40 返修后源码](../motion/robot-reliability.html)与[返修后作者清单](../motion/author-manifest.json)对应成片冻结版。要看播放效果，打开[R40 完整预览](../教学素材/成片/R40完整预览.mp4)。

合同里引用的[空间与时间](material-space-and-time.md)和[提交与恢复](submission-and-recovery.md)是本次补入的历史配套说明，两者与本次交接的六份原件分列。
