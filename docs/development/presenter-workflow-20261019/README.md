# 人物解说制作链路开发与验证

日期：2026-10-19。需求来源：`docs/VideoFlowCut_presenter_workflow_optimization.md`。代码基线：`24c7a351057215dbf238f3614f54bc900d4c1914`，插件版本 `0.1.96`。

本轮完成代码、Skills、调用方和隔离验证，并构建候选发行物。没有安装或切换生产插件，没有修改正式视频项目，没有制作新题材正式成片。

## 实现与删除范围

1. 在既有 ManagedMotion Cue 上增加人物主画面接管声明。从快照统一派生有效主场面、被接管范围、剩余原生人物可见范围与冲突；播放与质量检查共用结果。接管只隐藏人物像素，保持原媒体挂载、源时间和声音所有权。新主场面位于原主视觉之后、Cutaway、普通 front 与字幕之前。
2. VisualTreatment 记录已采用的展示资料。制作对账沿有效 Cue、Cutaway、Program 及作品实际图片、视频来源查找连接；视频槽按作品帧率投影，与相关语句范围相交。绑定可达和实际看清分别报告。
3. Run 收口必须声明整片、指定 Beat 或指定对象范围。结构缺项产生具名阻塞并返回 `incomplete`，局部字幕修改不承担无关的全片视觉计划。导出继续使用原技术与用途检查，不增加审美硬门禁。
4. 保持人物、视觉解说、Vlog 与 hybrid 的路线边界。人物导演首轮落实取材和整场视觉，人物生成范围不等于最终露脸范围。删除人物剪辑参考中重复的完整生命周期、Gate A/B 入口和固定比例要求，指向人物导演唯一主入口。
5. 删除 `PRESENTER_SPEECH_VISUAL_DURATION_MISMATCH` 的原生人物末尾与首条 Dialogue 末尾比较，改查有效主视觉缺口和原生可见人物所需 Dialogue 覆盖；保留自然停顿容差。合法材料或 MG 可以接续无脸结尾，装饰不能填补主画面缺口。

## 接口与清除语义

| 入口 | 新合同 | 更新语义 |
| --- | --- | --- |
| `manage_effect_cues` | `visual_composition: {role: "primary", replaces_actor_item_ids: [...]}` | 省略保持，`null` 清除；仅合法 fullscreen ManagedMotion 可声明 |
| `manage_visual_treatment` | `adopted_material_asset_ids` | 省略保持，空数组取消采用；保存去重的合法展示资源引用 |
| `complete_production_run` | 必填 `completion_scope` | `project`、`beats + beat_ids` 或 `objects + object_ids`；保存到既有 Run 审计 |

HTTP Cue POST/PATCH、VisualTreatment POST 同步接通对应 camelCase 字段。新字段沿既有快照和审计存储，没有新增数据库表或兼容回退。候选构建的 MCP catalog 已核对上述字段及必填项；运行中的旧插件尚不支持新合同。

## 修改模块与调用链

| 文件或目录 | 职责 |
| --- | --- |
| `packages/contracts/src/index.ts` | 三项合同与结构对账结果 |
| `apps/server/src/mcp.ts`、`app.ts` | 正式工具和 HTTP 入参 |
| `packages/edit-application/src/index.ts` | 写入、保持/清除、范围收口与审计 |
| `packages/edit-application/src/motion-dependencies.ts` | 真实资源与人物源映射变化的依赖失效 |
| `packages/edit-domain/src/composition-reachability.ts`、`index.ts` | 统一接管编译、引用/区间/空间冲突与图校验 |
| `packages/remotion-runtime/src/index.tsx`、`composition-reachability.ts` | 像素抑制、共享层序、按当前可见人物消费 Mask |
| `packages/quality-system/src/index.ts`、`editorial-review.ts` | 主画面覆盖、声音检查、实际资料连接及范围对账 |
| `.agents/skills/` 与同步后的 `plugins/videoflowcut/skills/` | 人物主入口、素材与视觉职责、交接及收口规则 |
| `tests/presenter-visual-composition*.test.ts` | 正式写入、范围对账和真实合成回归 |
| 既有 core、creative-delegation、skills-v5 测试及四个调用脚本 | 同步显式收口合同；Vlog 夹具使用真实哈希并增加纯 Vlog 模式 |

主要链路：MCP/HTTP → 应用层正式写入 → 快照图校验 → `compileVisualComposition` → Player/Render 与质量检查。收口链路：`complete_production_run` → 明确 scope → `productionReconciliation` → 结构 blockers → Run 审计。

接管引用、重叠和人物空间冲突在正式采用时拒绝；未兑现的结构工作保留 `incomplete`，由协调者续接相应作者。真实源哈希、状态或人物源映射变化使相关作品 Cue 失效；仅调整接管声明或说明不触发人物重生成。作品内人物继续执行既有口型版本依赖检查。

## 验证结果

- 14 个相关测试文件，共 **112 项通过、0 失败**，耗时约 29.7 秒；原始记录见 `tests.log`。覆盖人物接管、旧解释片、Vlog/hybrid、正式 HTTP、资料对账、不同帧率和局部 Run 收口。
- 真实 ManagedMotion 与完整 Preview 合成验证：缩窗/返回的源帧连续、透明区域无双人物、实际材料绑定、front/字幕层序、裁切与增益下原声接管前中后连续、Dialogue 不叠加人物原声、muted 实际静音。使用 FFmpeg 构造媒体夹具，未调用人物生成 Provider。临时渲染文件测试后清理。
- `npm run test:stage4-vlog` 通过：4 秒 hybrid，解释与 Vlog 各一段，3 个 Ambient；见 `hybrid.log`。
- `npm run test:stage4-vlog -- --vlog-only` 通过：3 秒纯 Vlog，无解释 Scene，3 个 Ambient；见 `vlog.log`。
- `npm run typecheck`、`npm run plugin:build`、`npm run plugin:verify` 通过；构建包括 Skills 同步和 Runtime/Web 发行物。日志保存在本目录。
- `git diff --check` 通过。

相关文档引用检查尚有 **7 项基线缺失**：`skill-reference-routing`、`topic-film-skills` 涉及 upstream README 所引用的 GIF 不存在于 HEAD，未补造资源或降低检查。目录为 `.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/upstream/docs/`，文件为 `1_立体卡通.gif`、`2_黑底科技.gif`、`3_超现实拼贴.gif`、`4_复古剪纸.gif`、`5_复古报刊.gif`、`6_扁平流程图.gif`、`7_手绘笔记.gif`。完整回归范围不能报告为全部通过。

## 候选与生产状态

- 候选目录：`E:\ai\VideoCut\plugins\videoflowcut\runtime\dist\`。
- 候选 Release：`release-1d826fc8fee4ff1a785f76ba26705f066304a01337993d86e95837736ad2c720`，插件版本仍为 `0.1.96`。
- 最后只读核对生产 MCP、Runtime 与 Launcher 均为 `release-3afe9d3789c0bf9090828d5b230debb6ac4bc8583e75a9805eb70d280d0c8b65`，`ready`、`aligned=true`，media/render Worker 健康；原始响应见 `production-runtime.json`。
- 未安装候选、未切换生产、未升级版本号。候选构建通过不能作为部署完成的证据。

## 已知代价与剩余边界

隐藏的原生人物媒体保持挂载和解码，以维持已有声音与时间连续性，仍有解码成本。调用 Run 完成接口的调用方必须提供明确范围。绑定与技术合成测试不能证明素材真正可读、审美成立或新人物 Provider 的生成效果。新题材正式制作、连续声画审阅和生产部署属于后续验证范围，本轮不宣称完成这些结果。
