# VideoFlowCut：超现实拼贴完整场面案例入库、学习与制作接入

本文规定三件事：案例资料如何归档和发现，现有视觉技能如何指导学习，以及学习结果如何进入当前作品。第六部分是独立的“桌面整理”迁移测试任务，其题材和材料限制只用于该次测试。

**2026-10-16 接入实施：技能正文已写入唯一维护源，六个旧案例及专用维护链已删除，发行副本与官方安装目录已同步。** 第三部分直接链接实际指令，不再维护双份正文。完整场面原源码、资源、视频和验证历史保持不变；独立“桌面整理”测试已跑通正式制作与待审导出，效果观察边界另记。

## 一、接入目标与已有产物

### 1. 目标

让当前视觉作者能够通过已有入口找到完整参考，理解其美术、主体和连续演出的关系，再根据不同内容制作新的场面。学习结果要落实到当前“画面与演出”正文、同一作品源码和真实输出中。

保留原作者已完成的 Canvas 原生复现和现有受管片段。六个旧物件案例退出案例库，其目录、专用资源和维护链一并删除，范围见第五部分。本次接入不重制原动画，不开发任意文案生成器，不改变既有导演、文案、配音、字幕和生产渲染架构。

### 2. 已有产物与边界

核对基线：VideoFlowCut `6f9468703a75b1e645a1269b706238b8860ce952`；原参考固定版本 `aa620f3b859aa5d191b783b2eb0fb59263731c76`。

| 已有产物 | 作用 | 范围与限制 |
|---|---|---|
| 原生完整视频与 Canvas 源码 | 完整美术、物件、场面发展与连续动作的学习依据 | 视频约 21.20 秒，公开及插件版本无声；本机字体与作者环境有差异 |
| React/SVG 受管片段 | 了解原作画法怎样在本项目中实现 | 仅覆盖原作 8.10—14.00 秒，5.90 秒、177 帧、30 fps；包含纸条飞入、镜头进入、连剪、翻落、命名和接出 |
| 原生／受管同阶段对照 | 定位迁移中的美术、动作和空间差异 | 比较同一动作阶段；不能据此声称原生全片已迁移 |
| 参数、资源、来源和验证记录 | 定位依赖、复核输出与了解实现代价 | 当前固定八单元，部分卡片和页眉为静态贴片；换内容需要重新设计与适配 |

### 3. 分别说明采用、验证与发布状态

原作参考的采用沿用户已有明确反馈执行。已采用的参考可以继续用于本片，不因受管示范仍待返修而反复要求确认或重做原参考。

受管代码的覆盖范围、技术结果和效果观察，以对应版本的 `managed/reviews.json`、`managed/verification.json` 为准。当前记录仍为待返修、未正式推荐，正常速度连续观看尚未记录完成。采用原作不自动改变这些记录，也不证明其代码可以任意换内容使用。

新作品另按自身输出判断效果。上述三种状态在入口中分别陈述，避免用一句“案例通过／未通过”概括。

公开及发行材料保持无声；合法的带原声本地研究副本继续留在忽略目录，不进入插件同步。音频限制和已发现的 Git 历史风险统一指向案例 [README](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/README.md) 与发布记录；历史重写或强制推送须先报告并取得明确授权。

## 二、案例目录、资料用途与发现方式

### 1. 保留现有案例目录

```text
.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/
```

本案例作为独立的完整场面参考保留在该目录，目录位置无需迁移。删除六例及其专用推荐表、开发目录和播放器后，风格页与通用物件方法直接链接此完整场面；不留下空案例表或兼容跳转页。

| 资料 | 回答的问题 | 读取时机 |
|---|---|---|
| [README.md](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/README.md) | 案例是什么、来源与许可是什么、原生与受管分别覆盖哪里 | 首次发现案例时 |
| [index.html](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/index.html)、`完整场面_无声.mp4` | 整部作品如何组织美术和观看发展 | 建立整体认识时 |
| [LEARNING.md](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/LEARNING.md) | 具体关系如何成立，哪些可以迁移，哪些必须重设计 | 选择本片借鉴范围时 |
| [scene/index.html](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/scene/index.html)、`scene/timeline.js` | 原作实际怎样绘制和安排时间 | 核对所选画法与动作时 |
| [managed/source.tsx](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/managed/source.tsx)、`demo-props.json`、`resources.json`、`resources/` | 受管片段怎样组织几何、状态、资源和时间 | 实现本片相关表现时 |
| [comparison.html](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/comparison.html)、`comparison.mp4`、`native-segment.mp4`、`managed/preview.mp4` | 同阶段有哪些已实现表现和差异 | 判断可借范围或排查实现偏差时 |
| `managed/reviews.json`、`managed/verification.json`、`verification/` | 哪版输出做过哪些检查，还有哪些未知或差异 | 采用受管实现和报告状态时 |
| `upstream/` | 原作者说明、许可和脚本依据 | 核查来源、依赖或运行方式时 |

原作者说明以 `upstream/SOURCE_SKILL.md` 存档，仅作参考资料，不作为新增生产 Skill 自动加载。来源固定到[原仓库版本](https://github.com/chuspeeism/dashi-animationstyle/tree/aa620f3b859aa5d191b783b2eb0fb59263731c76)，优先使用本地归档。

### 2. 两个发现入口

采用超现实拼贴的全片或连续范围时，视觉作者从 `visual-treatment-planning/SKILL.md` 进入 `references/surreal-collage.md`，再直接打开完整案例与学习拆解。这是完整场面的主要入口，不要求先产生“需要画剪刀”的需求。

只需要物件结构或画法时，从 `references/object-drawing/REFERENCE.md` 进入相应资料。局部借用物件制法不自动继承整套拼贴配色、版式或叙事。

本次接入采用本地完整场面入口。现有机制搜索使用自己的数据源，增加 Markdown 链接不等于已登记到 `search_motion_mechanisms`。仍按现有机制库方法处理本片未解决的观看与动作问题，已有有效参考和观察可以复用，不为已选案例重搜全库。

## 三、已接入的具体技能指令

具体指令由以下文件唯一维护，直接打开即可查看完整正文：

| 维护源 | 已实施内容 | 消费者 |
|---|---|---|
| [风格页：从完整场面参考制作本片](../.agents/skills/visual-treatment-planning/references/surreal-collage.md) | 先确定本片行为与主体；按问题读完整参考；制造能完成行为的物件；共同设计美术和动作；适配依赖；按同源输出返修 | 当前持续负责的视觉作者 |
| [完整案例学习正文](../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/LEARNING.md) | 原作完整时间线、纸/金属/石材/骨牌/排印、对应源码函数和资源、支点与接触、翻面与镜头、换内容时的重设计 | 视觉作者按当前采用范围读取 |

原审阅稿 A、B 已分别写入上述位置，同义段落已合并。风格页保留既有配色、材料和排印方法，案例正文保留原作版本与来源依据。本文件只维护接入说明和实施记录，不复制活动技能树。

## 四、现有技能入口与项目制作链路

### 1. 阅读与创作链路

```text
当前导演稿、准确内容、材料和相邻画面
→ 同一视觉作者进入 visual-treatment-planning
→ 已采用拼贴：surreal-collage.md → 完整作品与 LEARNING.md
→ 确定本片借用关系，按问题定位原函数、受管实现和资源
→ 将具体采用与新设计写回当前“画面与演出”
→ 按需取得正式资源绑定，在同一受管源码中形成实际预排
→ 主任务提交作品、放入真实场景并生成项目预览
→ 原视觉作者检查美术、动态和接续，沿同一作品返修
```

导演负责内容和跨段含义，视觉作者持续负责美术与演出，主任务协调正式项目写入与异步结果。声音、字幕和审阅沿当前项目职责继续，不因引用案例重新分类整片或新建一条生产路线。

### 2. 实现与正式提交

实现细节以[受管组件合同](../.agents/skills/remotion-production/references/remotion-component-contract.md)和[提交与恢复](../.agents/skills/remotion-production/references/submission-and-recovery.md)为准。以下是调用导航，执行时读取连接 Runtime 的实时 Schema、能力及当前 Revision。

| 环节 | 当前路径 | 应接回的真实结果 |
|---|---|---|
| 核对能力与素材 | `read_motion_capabilities`；本地纹理沿 [asset-import](../.agents/skills/asset-import/SKILL.md) 的 `import_media` 等现有接口导入并读回 | 真实可用的字体、就绪素材及来源 |
| 形成作品 | 视觉作者完成本片 TSX、Props、画布、时钟和事件；图片用 `imageBindings`，字体用 `fontBindings` | 与当前稿相符的源码及绑定，分别消费 `props.assets`、`props.fonts` |
| 生成与读回 | 主任务 `submit_motion_work` → `track_job` → `read_motion_work`／`inspect_asset` | 固定输入的 Job、作品版本、Asset 和实际动态代理；提交本身不等于已放入 Timeline |
| 放置与合成 | `manage_effect_cues` 放置 ManagedMotion → 读回 Project、Revision 与 Impact → `render_preview_range`／`track_job` | 实际 Scene 中与素材、字幕、声音和相邻画面共同出现的同版预览 |
| 观察与返修 | 同一视觉作者按实际输出修订，主任务按现有合同提交新版本；按需用 `review_motion_work` 保存观察 | 与固定版本对应的效果结论、差异和未观察范围；只有证据满足当前合同才记录通过 |

案例的 `managed/source.tsx` 提供画法和状态组织参考。取用时将必要组件及依赖整合进本片源码，使用本片字体、内容、坐标和事件；不复制旧项目 Asset ID、本机路径或固定实例 ID。

当前隔离对照直接注入多张图片，其成功不证明整包资源已通过正式提交。只取本片实际需要的材料，重复纹理复用绑定，按当前合同处理槽位和输入大小；不把某一版本的限额写成长期学习原则。内容或数量变化时，同步更新字宽、边界、裁切、落点、身份和时序，不能只替换字符串。

案例开发脚本 `prepare-surreal-scene.ts`、`render-surreal-scene.ts` 用于原案例的材料准备和隔离对照。新作品走上述正式链路，不用这些脚本重跑参考冒充迁移测试，也不直接执行原 Canvas 作为生产提交。

### 3. 出现问题时回到对应责任

| 实际问题 | 处理位置 |
|---|---|
| 主体不适合内容，画面关系无法解释当前事情 | 视觉作者重选载体；涉及主要含义或跨段关系时续接导演 |
| 主体辨识、材质、部件、遮挡或动作结果缺失 | 同一视觉作者修造型、局部坐标、状态和资源，不用名称块或通用入场替代 |
| 资源未就绪、字段拒绝、版本冲突、Job 失败或结果未知 | 主任务按既有提交与恢复合同处理，保存原诊断；未知结果继续查原任务，不盲目换键重放 |
| 缺连续观看或听审能力 | 保留已知与未知，交实际视频；不伪填通过，也不循环重渲等待能力出现 |

新输出的问题在新输出中修，保留已采用参考。无需为解决当前场面扩大改造案例库或生产渲染器。

## 五、具体文件修改、发行同步与接入验证

### 1. 接入实施的文件责任

下表范围已实施，2026-10-16 完成源文件修改、发行同步和官方安装核对。

| 文件 | 调整内容 | 保留边界 |
|---|---|---|
| `surreal-collage-token/README.md` | 整理资料导航，分别陈述原作采用、受管覆盖与验证状态、公开无声和本地研究副本 | 保留来源、许可、运行依赖、历史风险及实际差异 |
| `surreal-collage-token/LEARNING.md` | 写入已审阅的具体教学正文，统一完整场面、源码、资源和实际适配方法 | 保留版本与来源依据，不嵌入一次性测试任务 |
| `references/surreal-collage.md` | 在适用范围后写入已审阅的实际学习指令，同义段落合并 | 保留现有配色、材料与排印方法，不复制案例拆解 |
| `references/object-drawing/REFERENCE.md` | 移除六例推荐、开发记录和播放器入口；直接链接完整场面、学习正文和对照，统一无声与验证状态描述 | 保留通用物件制法及上游技能引用 |
| `surreal-collage-token/index.html` | 整理原作、拆解和对照导航，分别陈述原作采用与受管片段状态 | 保留完整场面播放器；旧六例播放器及生成脚本按下节删除 |
| 当前 `docs` 文档 | 维护接入目标、职责、文件改动、消费链路和验证任务 | 不维护第二份完整学习正文，不将计划写成执行结果 |

`visual-treatment-planning/SKILL.md` 已有风格与物件入口，无需追加重复路由；`motion-case-library` 与 `remotion-production` 继续承接原职责。本次不新增顶层 Skill、第二套渲染器或新的强制生产步骤。

第三部分的实际指令已写入对应唯一维护源，本文中的指令草稿已收束为链接与变更记录。通用技术合同继续引用原维护位置，测试题材、旁白和材料范围仅留在第六部分。完整场面的预览、绘制源码、参数和验证历史保留，六例清理不影响其内容。

### 2. 删除六个旧案例及其专用维护链

用户已明确不再采用这六例；它们从活动案例库移除，不继续作为待返修候选保留。以下六例、专用资源、索引、脚本和测试均已删除；同步目录和官方安装目录也已清理。

以下目录位于 `.agents/skills/visual-treatment-planning/references/object-drawing/`：

| 删除的案例目录 | 原案例 |
|---|---|
| `cases/scissors-cut/` | 剪刀切割 |
| `cases/magnifier-scan/` | 放大镜扫描 |
| `cases/domino-flip/` | 纸片翻面与骨牌落定 |
| `cases/cutaway-head/` | 开顶石雕与内部承载 |
| `cases/bowl-receive/` | 碗接住果实 |
| `cases/book-open/` | 书籍展开与翻页 |

六例专用的 `textures/`、`cases.json`、`DEVELOPMENT.md`、`RECOMMENDED.md`、`index.html`、`SOURCES.md` 及根部 `LICENSE` 随之移除。这些文件属于六例及其摘录材料；完整场面的 `managed/resources/` 和 `upstream/LICENSE` 独立保留。

删除以下专用脚本与测试，避免继续生成已经退出的案例和索引：

```text
scripts/render-object-drawing.ts
scripts/object-drawing-catalog.ts
scripts/build-object-drawing-textures.ts
scripts/object-drawing-texture-source.js
tests/object-drawing-reference.test.ts
```

保留 `object-drawing/REFERENCE.md` 的通用方法与全部 `full-scenes/surreal-collage-token/`。保留 `scripts/prepare-surreal-scene.ts`、`scripts/render-surreal-scene.ts`、`tests/surreal-scene-motion.test.ts`、`tests/surreal-reference-publication.test.mjs` 和发布检查脚本。它们使用完整场面自己的源码和资源，不依赖六例维护链。

清理活动技能中的失效入口；旧开发文档、隔离验证记录和 Git 历史保留，不随活动案例清理。当前 `package.json` 没有六例专用命令；`pngjs`、`puppeteer-core` 等仍有其他用途，不随案例删除。

已先修改唯一维护源，再通过既有同步脚本清理发行副本，通过官方安装命令更新宿主缓存。活动技能、脚本和测试中已无六例及专用脚本引用；完整场面资料和发布检查保留。

### 3. 沿既有方式同步发行

运行时 Skills 的唯一维护源是 `.agents/skills/`。接入文件修改并检查后，在仓库根使用已有命令：

```powershell
npm run plugin:sync-skills
npm run plugin:verify
```

同步链将源目录写入 `plugins/videoflowcut/skills/`；现有发布检查在同步前后与插件验证时检查本案例音频和视频。检查失败时保留诊断并修对应发布材料，不关闭检查或将研究副本放回发行树。

发行副本验证后，沿既有插件发布／安装流程提供给制作任务，核对执行视觉作者实际读取的版本和文件内容。源文件修改、发行副本同步、宿主读取更新是不同结果；不手改已安装缓存，不把同步成功称为已部署。仅更新学习资料不要求修改生产 Runtime。

### 4. 分项验证并分别报告

| 验证项 | 实际检查 | 能证明的结果 |
|---|---|---|
| 案例可发现 | 从风格入口、物件入口能到达正确的完整作品、拆解、源码和范围说明；本地链接可用 | 案例已接入本地参考入口 |
| 方法可消费 | 视觉作者实际读到更新后的技能与案例；采用决定落在当前稿和同一作品源码 | 学习方法进入本次设计，而非只有主任务知道参考存在 |
| 正式链路可运行 | 新作品的资源、字体、作品提交、场景放置及项目预览均有实际结果 | 正式生产路径可以承接本次实现 |
| 新作品效果成立 | 检查主体、美术、正常速度动态、关键中途和前后声画；记录实际观察范围 | 在已观察范围内判断迁移效果，未满足项继续返修或待审 |

文件同步和渲染成功各自只证明对应事项。只有附录的新内容测试真实执行后，才能报告其生产和效果结果；技术成功不自动使新作品进入正式案例推荐。

### 5. 本轮实施记录

2026-10-16 已完成上述源文件修改和删除。类型检查通过，完整场面动作与无声发布共 3 项回归通过，发行同步与插件验证通过。官方安装仍为 0.1.92，四个实际入口/教学文件与维护源哈希一致，安装目录无旧六例。生产 Runtime 未改。

完整场面 116 文件的前后核查只发现三份说明/入口文件改变，原视频、绘制源码、资源、参数和验证历史未变。本文及活动教学入口共 45 个本地 Markdown 文件链接检查通过。详细证据与独立测试片结果见[本轮开发与制作验证记录](development/2026-10-16_超现实拼贴学习接入验证.md)。

## 六、附录：桌面整理迁移测试任务

本附录用于接入完成后的独立制作验证，不属于长期技能规则。用户已批准本轮开发和测试，本任务已启动。执行时按已有正常制作流程建立新的 `visual_explainer` 项目，保留现有项目和成片。

### 1. 固定输入

**最终旁白，逐字使用：**

> 整理桌面，不是把东西全部藏起来。经常用的，留在顺手的位置；暂时不用的，放进抽屉。拿出来，用完，再放回去。好的收纳，不是只让桌面空一次，而是让下一次使用也同样顺手。

规格：1920×1080、30 fps，采用超现实拼贴美术；语气自然、清楚，观看感受具体、轻快、有条理。沿本片声音与字幕流程制作，先取得实际旁白时间再校准动画，不固定总长。

本片用自己的可识别主体和行为解释内容，形成连续观看。道具、构图和场面由现有视觉作者决定；不预设逐镜答案，不采用严肃调查或恐慌包装。

### 2. 本次材料与执行范围

可直接复用案例 `managed/resources/paper.png`、`grain.png`，需要笔触时再用 `brush0.png`；新主体由本片源码制作。以上限定仅针对本次测试，不形成全局素材配额，也不要求整包迁移原案例的图片。

不移用原品牌、聊天截图、Token 文字、石雕和骨牌叙事。可以借鉴纸面、印刷感、材料对照和动作经验；合适的普通物件按本片内容选择。

视觉作者从既有技能入口实际取得方法和案例，形成新主体与场面，再按需读取源码。主任务依第四部分导入和绑定资源、提交作品、放置与预览。使用当前作品的同源预排继续实现，不重渲原案例，不把原 5.9 秒拉长填满旁白。

测试使用原导演、视觉、配音、声音与审阅职责，不为“学习案例”另设代理、审批或固定小样流程。出现实际问题再局部返修。

### 3. 效果观察

| 面向 | 新作品应体现什么 | 典型返修位置 |
|---|---|---|
| 新主体 | 轮廓、结构和材料能够辨认，主要行为由主体完成 | 名称方块、整图漂浮：回到载体和结构 |
| 空间与身份 | 放置、取出、使用和归位有可追踪的前后关系 | 穿壁、消失或身份变化：修遮挡、状态与接点 |
| 材料与光影 | 承载面和实体有区别，纹理附着，受光与投影支持姿态 | 统一高光噪点、固定底影：修材料和接收面 |
| 动作与节奏 | 准备、主要动作、跟随、收势和结果辨认各有作用 | 全程慢缓动或全部弹跳：分别重排阶段 |
| 整片美术 | 材料、色彩权重、字形、主体和留白组织同一次观看 | 每句一页、居中摆件或装饰堆积：修主次与场面发展 |
| 学习生效 | 能从当前稿、源码及输出定位借鉴关系和新设计，相关依赖完整 | 只写“已参考”或只搬代码：补实际选择及缺失实现 |
| 正式制作 | 真实声音、字体、资源、字幕与画面在项目预览中共同成立 | 只有孤立无声小样或专用脚本结果：完成正式集成 |

只检查本片实际采用的行为与材料，不强制所有物件都有关节、碰撞或音效。看关键中途和正常速度完整输出，有声音时检查声画；无法完成的观察明确记为未观察，不填通过。

### 4. 交付与完成判断

交付新内容完整视频、源码与实际资源位置、项目及作品版本，并简述借用了哪些参考关系、怎样用于新主体，以及实际检查结果和未确认项。沿现有工作记录保留来源与采用依据，不新建追踪系统。

接入工作按第五部分分别报告；测试片另报告正式链路和效果结果。效果不理想时回到对应主体、美术、动作或声画环节修订，保持待返修或待审状态；未经用户认可的新作品不自动加入正式案例库。
