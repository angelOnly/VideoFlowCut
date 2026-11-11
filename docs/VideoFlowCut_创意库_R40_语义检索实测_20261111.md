# 创意库 R40 语义检索实测

日期为 2026 年 11 月 11 日。R40 是“机器人进厂”48.8 秒样片，原制作资料中采用 016-c01 组织多来源画面。前三条查询取自 R40 当时的实际创意检索原文，第四条根据该样片的多素材、大字和画框关系编写。另编写四条更具体的查询。

本记录反映删减案例前的历史测试。按用户要求，已移除被删案例的候选和相关分析；保留的排名仍是当时的排名，并非当前库的重新检索结果。

测试通过隔离项目中的 MCP 创意检索入口、实际 Job 和 Worker，调用本机 ComfyUI Bridge 与 Qwen3-Embedding-0.6B。旧库为 236 张卡，新库为 247 张卡，同一组对照查询使用相同模型、工作流、任务指令及查询向量。分数为向量相似度，排序按得分从高到低。

正式工具读回的新库指纹为 `a710a0aed76f4da343d43267cf2576b3812c920bcc8d157abbf65e6161ee617c`。旧库对照指纹为 `9b38997bb0d002ad748c15cfd32628b443614c639adccde5615394b9e3fa9d04`。

## 结果判断

- “异常影响后续流程”在当时的前五名没有直接呈现工序依赖和等待的候选。改写为具体生产线后，004-c03 排第 5，展示乘车中断和界面暂停，能够借鉴局部状态表达。
- R40 实际采用的 016-c01 在“固定工作与跨场景工作”同条件对照中从旧库第 5 降到新库第 32；在“不同来源画面的整体组织”查询中从第 8 降到第 60。两条进一步描述画框集合的查询分别排第 13 和第 12。
- 036-c01 在四条初始查询中有三条排第 1。它的作品集式多媒介接力能提供部分形式参考，对异常导致后续等待的因果过程匹配较弱。
- “多个实景汇成作品墙”查询的第 1 名 007-c02 展示同一人物的多张生成结果。R40 的机器人素材来自不同型号，采用这种统一主体的表达时需要核对素材事实。

这些判断基于 R40 资料、卡片正文和部分候选的分镜。尚未连续播放候选并完成声画审阅。八条查询用于本案例检查，结果不能代表全库整体准确率。

## 新旧库同条件对照

| 查询 | 016-c01 旧库排名及分数 | 016-c01 新库排名及分数 | 036-c01 旧库排名及分数 | 036-c01 新库排名及分数 |
| --- | --- | --- | --- | --- |
| 重复与结果变化 | 45（0.5259） | 113（0.4863） | 33（0.5472） | 4（0.6332） |
| 异常影响后续流程 | 29（0.5098） | 90（0.4548） | 5（0.5632） | 1（0.6393） |
| 固定工作与跨场景工作 | 5（0.5905） | 32（0.5158） | 12（0.5426） | 1（0.6643） |
| 不同来源画面的整体组织 | 8（0.5593） | 60（0.4884） | 5（0.5716） | 1（0.6497） |

同一模型与查询下，同一张卡的新旧得分发生变化，说明卡片检索文本变化影响了这些查询的相似度。库的候选集合也有变化，最终名次由全部候选共同决定。仅凭这些结果无法确定各段正文对得分变化的具体贡献。

## 初始查询中保留的历史候选

### 重复与结果变化

> 同一动作或物件反复出现，数量逐渐累积，原本让人放心的结果逐步发生变化，并揭示意料之外的整体结果。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 2 | [004-c04 让人物、观众与图表轮流承载相反判断](../references/motion-cases/skillry/cases/anabology-491441-original/creative/c04.md) | 0.6383 |
| 4 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6332 |

### 异常影响后续流程

> 一个步骤的异常让后续工作相继等待，画面通过多个对象的运动和停顿呈现整个流程如何受到影响。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 1 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6393 |
| 3 | [112-c01 把多种视觉实验整理成一条作品进度](../references/motion-cases/skillry/cases/levabashidze-184909-original/creative/c01.md) | 0.6013 |
| 5 | [004-c18 让人物走过一组名词，再将目光交给场所边界](../references/motion-cases/skillry/cases/anabology-491441-original/creative/c18.md) | 0.5869 |

### 固定工作与跨场景工作

> 用多个连续画面对比重复固定的工作和可以更换场景的灵活工作，同一主题跨越不同材料与场景。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 1 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6643 |
| 2 | [117-c01 让同一画框中的图形实验逐项接力](../references/motion-cases/skillry/cases/ghinaiya-nirmal-308943-original/creative/c01.md) | 0.5966 |
| 5 | [057-c02 从同一句话的语言变化扩展到不同画面样例](../references/motion-cases/skillry/cases/itisrazak-332386-original/creative/c02.md) | 0.5869 |

### 不同来源画面的整体组织

> 多个不同来源的工厂或机器人视频，以统一的大字、深浅背景与连接线组成连续完整的解释场面；画面在全屏和多个窗口之间转换，并让共同主题贯穿。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 1 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6497 |
| 2 | [063-c01 从纸面文字到粒子，再让场景围绕同一视觉核心](../references/motion-cases/skillry/cases/ajith-io-562538-original/creative/c01.md) | 0.5997 |
| 3 | [005-c03 用同一个时间线说明人物与其他画面的三种组合](../references/motion-cases/skillry/cases/drrickio-009558-original/creative/c03.md) | 0.5897 |
| 4 | [004-c18 让人物走过一组名词，再将目光交给场所边界](../references/motion-cases/skillry/cases/anabology-491441-original/creative/c18.md) | 0.5841 |
| 5 | [117-c01 让同一画框中的图形实验逐项接力](../references/motion-cases/skillry/cases/ghinaiya-nirmal-308943-original/creative/c01.md) | 0.5831 |

## 进一步改写中保留的历史候选

### 独立画框汇成集合

> 把多个真实影像片段分别做成独立画框，在统一的配色和字体中依次展示，最后把四个画框缩小并列成集合，前景用文字带交叉穿过，底层画面继续可见。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 1 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6642 |
| 2 | [117-c01 让同一画框中的图形实验逐项接力](../references/motion-cases/skillry/cases/ghinaiya-nirmal-308943-original/creative/c01.md) | 0.6597 |
| 3 | [115-c01 从时间示意进入各类作品，最后并列一组实验](../references/motion-cases/skillry/cases/blue-clarity-449603-original/creative/c01.md) | 0.6513 |
| 4 | [116-c01 从平面阵列切换到透视画框，再转到材质特写](../references/motion-cases/skillry/cases/samuel-spitz-503053-original/creative/c01.md) | 0.6506 |
| 5 | [005-c03 用同一个时间线说明人物与其他画面的三种组合](../references/motion-cases/skillry/cases/drrickio-009558-original/creative/c03.md) | 0.6463 |

### 重复动作扩张失控

> 一开始重复复制同一个物件，复制出来的对象各自执行相同工作，数量越来越多占满空间，原本轻松的局面逐渐失去控制。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 2 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.6500 |
| 5 | [004-c18 让人物走过一组名词，再将目光交给场所边界](../references/motion-cases/skillry/cases/anabology-491441-original/creative/c18.md) | 0.6205 |

### 工序中断与后续等待

> 一条连续生产线分成多个相互依赖的工序，上游操作发生中断，后面的物件停止前进并逐渐排队，画面保持全局让连锁影响可见。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 3 | [036-c01 让同一运动主题穿过字体、立体对象、手机和编辑画面](../references/motion-cases/skillry/cases/sahildesigner23-307120-original/creative/c01.md) | 0.5786 |
| 4 | [112-c01 把多种视觉实验整理成一条作品进度](../references/motion-cases/skillry/cases/levabashidze-184909-original/creative/c01.md) | 0.5628 |
| 5 | [004-c03 让乘车中断同时出现在人物处境和界面状态里](../references/motion-cases/skillry/cases/anabology-491441-original/creative/c03.md) | 0.5375 |

### 多个实景汇成作品墙

> 同一主题串联几段不同的真实人物画面，每一段先单独占满屏幕，再逐步缩为窗格，最终与其他片段共同构成作品墙。

| 排名 | 创意卡 | 相似度 |
| ---: | --- | ---: |
| 1 | [007-c02 让不同描述产生多张人物结果，最后扩展成整面肖像墙](../references/motion-cases/skillry/cases/l3d1c-752011-original/creative/c02.md) | 0.6944 |
| 2 | [093-c01 让多个运动实验先各自成立，再并列成一张作品墙](../references/motion-cases/skillry/cases/dannnnnok-716687-original/creative/c01.md) | 0.6577 |
| 3 | [011-c02 保留同一图像的身份，让屏幕里的喜好变成手中的画框](../references/motion-cases/skillry/cases/twoclipping-496100-original/creative/c02.md) | 0.6415 |
| 4 | [005-c03 用同一个时间线说明人物与其他画面的三种组合](../references/motion-cases/skillry/cases/drrickio-009558-original/creative/c03.md) | 0.6349 |
| 5 | [022-c01 先以作品墙展示能力，再把它接到一次终端操作](../references/motion-cases/skillry/cases/viktoroddy-402509-original/creative/c01.md) | 0.6231 |

## 执行与观察范围

新库首次冷缓存查询的 Worker 耗时 622 秒，完成 247 张卡和 1 条查询的向量编码。其余查询复用已编码卡片，单次 Worker 耗时约 4—7 秒。以上是本次隔离环境实测，正式运行环境的首次耗时取决于其缓存与服务状态。

已逐卡检查正式索引、正文与媒体可读性，并对新增切片时长、案例总览链接及典型交接包作核验。检索效果判断仍需在实际创作任务中结合原片和本片素材继续验证。
