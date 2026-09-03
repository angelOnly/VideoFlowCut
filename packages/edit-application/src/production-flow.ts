import type { EditingApplication } from "./index";

/**
 * 视频生产的顶层阶段。它是给产品、编排层和日常开发阅读的导航，
 * 不保存第二份项目状态，也不替代导演作创作判断。
 */
export type VideoProductionStageKey = "materials" | "understanding" | "direction" | "production" | "delivery";

/** EditingApplication 的公开命令名；底层命令被删除或改名时，阶段说明会在类型检查中失效。 */
export type VideoProductionApplicationMethod = {
  [Key in keyof EditingApplication]: EditingApplication[Key] extends (...args: never[]) => unknown ? Key : never;
}[keyof EditingApplication];

export type VideoProductionStageEntry = Readonly<{
  /** 面向阅读者的动作名称。 */
  label: string;
  /** 实际委托的核心应用服务方法。 */
  applicationMethod: VideoProductionApplicationMethod;
  /** 这个入口负责什么，以及明确不负责什么。 */
  note: string;
}>;

export type VideoProductionStage = Readonly<{
  key: VideoProductionStageKey;
  title: string;
  goal: string;
  coreClass: "EditingApplication";
  entryPoints: readonly VideoProductionStageEntry[];
}>;

/**
 * 一屏可读的生产地图。
 *
 * `entryPoints` 既是用户阅读入口，也是与 EditingApplication 公开命令保持同步的类型合同；
 * 它不表示按顺序自动执行，具体素材选择、叙事和视觉判断仍由导演/调用方明确提供。
 */
export const VIDEO_PRODUCTION_STAGES = [
  {
    key: "materials",
    title: "1. 素材读取",
    goal: "建立项目，登记已受管的本地素材，并记录素材需求、来源和授权事实。",
    coreClass: "EditingApplication",
    entryPoints: [
      { label: "创建项目", applicationMethod: "createProject", note: "建立 Project 与第一版 Revision。" },
      { label: "登记素材", applicationMethod: "registerImportedAsset", note: "上层已安全导入文件后，登记素材并提交媒体分析。" },
      { label: "跟踪素材分析", applicationMethod: "trackJob", note: "确认媒体分析任务已完成；转写、镜头分析和同步只能使用已就绪素材。" },
      { label: "补充素材事实", applicationMethod: "updateAssetEditorialMetadata", note: "记录角色、标签、来源和授权状态，不替代内容判断。" },
      { label: "提出素材需求", applicationMethod: "manageAssetRequirement", note: "说明缺少什么素材和原因，不直接决定 Cutaway。" },
      { label: "记录搜索与候选", applicationMethod: "recordAssetSearch", note: "保存 Provider 返回的候选和过滤结果。" }
    ]
  },
  {
    key: "understanding",
    title: "2. 理解视频",
    goal: "把素材转为可追溯的转写、镜头或同步候选；候选不是自动创作结论。",
    coreClass: "EditingApplication",
    entryPoints: [
      { label: "提交转写", applicationMethod: "submitTranscription", note: "为已就绪且有声音的素材创建转写 Job。" },
      { label: "提交镜头分析", applicationMethod: "submitVlogAnalysis", note: "为 Vlog/Hybrid 素材创建可测量的镜头分析 Job。" },
      { label: "提交多机位同步", applicationMethod: "submitMulticamSync", note: "生成同步候选，后续仍需预览确认。" },
      { label: "跟踪理解任务", applicationMethod: "trackJob", note: "读取转写、镜头分析或同步任务的完成、失败与结果状态。" },
      { label: "读取当前事实", applicationMethod: "readProject", note: "从当前 Revision 读取素材、分析结果和状态。" }
    ]
  },
  {
    key: "direction",
    title: "3. 导演规划",
    goal: "由人或主工作流明确故事、语义、镜头与视觉意图，再写入当前 Revision。",
    coreClass: "EditingApplication",
    entryPoints: [
      { label: "更新故事", applicationMethod: "updateStory", note: "写入 StoryBeat 与叙事顺序，不根据关键词自行编故事。" },
      { label: "确认语义单元", applicationMethod: "applySemanticUnits", note: "将已审查的语义边界写入项目。" },
      { label: "确认脚本", applicationMethod: "applyScript", note: "以明确选择的 SemanticUnit 生成当前 Script。" },
      { label: "规划解释结构", applicationMethod: "manageNarrativeMap", note: "为视觉解释片写入 NarrativeMap。" },
      { label: "规划视觉处理", applicationMethod: "manageVisualTreatment", note: "写入保持人物、B-roll、Remotion 或安静区等决定。" },
      { label: "规划 Vlog 事件", applicationMethod: "manageVlogEvents", note: "把已分析的实拍证据组织成事件，而不是猜测不存在的动作。" },
      { label: "确认 Vlog 镜头选择", applicationMethod: "manageVlogShotSelects", note: "由导演明确镜头用途与连续性理由，不能按技术评分自动入选。" },
      { label: "确认多机位同步", applicationMethod: "verifyMulticamGroup", note: "只把已完成连续预览的同步候选写为可编译事实。" },
      { label: "规划多机位切换", applicationMethod: "manageMulticamCuts", note: "由导演明确机位和会话范围，不绕过已验证的同步偏移。" }
    ]
  },
  {
    key: "production",
    title: "4. 成片生产",
    goal: "把已经确认的导演计划编译为时间线、画面、字幕和声音；不在这里悄悄重写主线。",
    coreClass: "EditingApplication",
    entryPoints: [
      { label: "组装 Presenter 主线", applicationMethod: "assemblePresenterTrack", note: "将已经选择的 A-roll 组织为物理主画面，不自动生成叙事场景。" },
      { label: "编译 Presenter 场景", applicationMethod: "compilePresenterScenes", note: "只根据已确认的故事、语义和视觉计划编译 Presenter 场景。" },
      { label: "编译 Explainer", applicationMethod: "compileExplainerScenes", note: "将已确认的解释场景编译为 Scene Program。" },
      { label: "编译 Vlog", applicationMethod: "compileVlogMontage", note: "将已确认的镜头选择编译为 Montage。" },
      { label: "编译多机位", applicationMethod: "compileMulticamProgram", note: "只使用已验证的同步和人工确认的机位切换。" },
      { label: "放置视觉包装", applicationMethod: "manageCutaway", note: "按既定场景决定放置、替换或移除 Cutaway。" },
      { label: "编辑字幕", applicationMethod: "editCaptions", note: "只编辑当前稳定主线的字幕 Card，不改变 Script 或音频。" },
      { label: "制作 BGM / SFX", applicationMethod: "manageAudio", note: "写入明确的 AudioCue，不自动猜测声音落点。" }
    ]
  },
  {
    key: "delivery",
    title: "5. 预览与交付",
    goal: "先查看真实合成和预检，再导出、复核与批准具体 Artifact。",
    coreClass: "EditingApplication",
    entryPoints: [
      { label: "提交预览", applicationMethod: "submitPreview", note: "创建目标 Revision 的 Preview Job。" },
      { label: "提交交付预检", applicationMethod: "submitRenderPreflight", note: "检查目标 Revision 的文件、权限和运行时依赖。" },
      { label: "提交导出", applicationMethod: "submitExport", note: "区分 draft 与 delivery，不把导出当成批准。" },
      { label: "跟踪交付任务", applicationMethod: "trackJob", note: "读取 Preview、预检或导出 Job 的完成、失败与结果状态。" },
      { label: "登记成片复核", applicationMethod: "recordExportArtifactReview", note: "将五轮审片证据绑定到具体 delivery Artifact。" },
      { label: "批准交付", applicationMethod: "approveExportArtifact", note: "只批准已复核且未被替换的 delivery Artifact。" }
    ]
  }
] as const satisfies readonly VideoProductionStage[];

type ApplicationCommand<Method extends VideoProductionApplicationMethod> = Extract<
  EditingApplication[Method],
  (...args: never[]) => unknown
>;

type ApplicationInput<Method extends VideoProductionApplicationMethod> = Parameters<ApplicationCommand<Method>>[0];
type ApplicationResult<Method extends VideoProductionApplicationMethod> = ReturnType<ApplicationCommand<Method>>;

/** 素材读取阶段：只登记事实和异步分析入口，不决定素材在成片中的具体用法。 */
export class VideoProductionMaterials {
  constructor(private readonly application: EditingApplication) {}

  createProject(input: ApplicationInput<"createProject">): ApplicationResult<"createProject"> {
    return this.application.createProject(input);
  }

  registerImportedAsset(input: ApplicationInput<"registerImportedAsset">): ApplicationResult<"registerImportedAsset"> {
    return this.application.registerImportedAsset(input);
  }

  trackJob(input: ApplicationInput<"trackJob">): ApplicationResult<"trackJob"> {
    return this.application.trackJob(input);
  }

  updateAssetEditorialMetadata(input: ApplicationInput<"updateAssetEditorialMetadata">): ApplicationResult<"updateAssetEditorialMetadata"> {
    return this.application.updateAssetEditorialMetadata(input);
  }

  manageAssetRequirement(input: ApplicationInput<"manageAssetRequirement">): ApplicationResult<"manageAssetRequirement"> {
    return this.application.manageAssetRequirement(input);
  }

  recordAssetSearch(input: ApplicationInput<"recordAssetSearch">): ApplicationResult<"recordAssetSearch"> {
    return this.application.recordAssetSearch(input);
  }
}

/** 视频理解阶段：发起或读取可验证的分析，不把候选分析结果伪装成导演决定。 */
export class VideoProductionUnderstanding {
  constructor(private readonly application: EditingApplication) {}

  submitTranscription(input: ApplicationInput<"submitTranscription">): ApplicationResult<"submitTranscription"> {
    return this.application.submitTranscription(input);
  }

  submitVlogAnalysis(input: ApplicationInput<"submitVlogAnalysis">): ApplicationResult<"submitVlogAnalysis"> {
    return this.application.submitVlogAnalysis(input);
  }

  submitMulticamSync(input: ApplicationInput<"submitMulticamSync">): ApplicationResult<"submitMulticamSync"> {
    return this.application.submitMulticamSync(input);
  }

  trackJob(input: ApplicationInput<"trackJob">): ApplicationResult<"trackJob"> {
    return this.application.trackJob(input);
  }

  readProject(input: ApplicationInput<"readProject">): ApplicationResult<"readProject"> {
    return this.application.readProject(input);
  }
}

/** 导演规划阶段：调用方必须提供自己的创作结论，门面不会补全或推断这些结论。 */
export class VideoProductionDirection {
  constructor(private readonly application: EditingApplication) {}

  updateStory(input: ApplicationInput<"updateStory">): ApplicationResult<"updateStory"> {
    return this.application.updateStory(input);
  }

  applySemanticUnits(input: ApplicationInput<"applySemanticUnits">): ApplicationResult<"applySemanticUnits"> {
    return this.application.applySemanticUnits(input);
  }

  applyScript(input: ApplicationInput<"applyScript">): ApplicationResult<"applyScript"> {
    return this.application.applyScript(input);
  }

  manageNarrativeMap(input: ApplicationInput<"manageNarrativeMap">): ApplicationResult<"manageNarrativeMap"> {
    return this.application.manageNarrativeMap(input);
  }

  manageVisualTreatment(input: ApplicationInput<"manageVisualTreatment">): ApplicationResult<"manageVisualTreatment"> {
    return this.application.manageVisualTreatment(input);
  }

  manageVlogEvents(input: ApplicationInput<"manageVlogEvents">): ApplicationResult<"manageVlogEvents"> {
    return this.application.manageVlogEvents(input);
  }

  manageVlogShotSelects(input: ApplicationInput<"manageVlogShotSelects">): ApplicationResult<"manageVlogShotSelects"> {
    return this.application.manageVlogShotSelects(input);
  }

  verifyMulticamGroup(input: ApplicationInput<"verifyMulticamGroup">): ApplicationResult<"verifyMulticamGroup"> {
    return this.application.verifyMulticamGroup(input);
  }

  manageMulticamCuts(input: ApplicationInput<"manageMulticamCuts">): ApplicationResult<"manageMulticamCuts"> {
    return this.application.manageMulticamCuts(input);
  }
}

/** 成片生产阶段：仅把明确的计划交给既有编译命令，不在门面层实现剪辑业务规则。 */
export class VideoProductionCompilation {
  constructor(private readonly application: EditingApplication) {}

  assemblePresenterTrack(input: ApplicationInput<"assemblePresenterTrack">): ApplicationResult<"assemblePresenterTrack"> {
    return this.application.assemblePresenterTrack(input);
  }

  compilePresenterScenes(input: ApplicationInput<"compilePresenterScenes">): ApplicationResult<"compilePresenterScenes"> {
    return this.application.compilePresenterScenes(input);
  }

  compileExplainerScenes(input: ApplicationInput<"compileExplainerScenes">): ApplicationResult<"compileExplainerScenes"> {
    return this.application.compileExplainerScenes(input);
  }

  compileVlogMontage(input: ApplicationInput<"compileVlogMontage">): ApplicationResult<"compileVlogMontage"> {
    return this.application.compileVlogMontage(input);
  }

  compileMulticamProgram(input: ApplicationInput<"compileMulticamProgram">): ApplicationResult<"compileMulticamProgram"> {
    return this.application.compileMulticamProgram(input);
  }

  manageCutaway(input: ApplicationInput<"manageCutaway">): ApplicationResult<"manageCutaway"> {
    return this.application.manageCutaway(input);
  }

  editCaptions(input: ApplicationInput<"editCaptions">): ApplicationResult<"editCaptions"> {
    return this.application.editCaptions(input);
  }

  manageAudio(input: ApplicationInput<"manageAudio">): ApplicationResult<"manageAudio"> {
    return this.application.manageAudio(input);
  }
}

/** 预览交付阶段：所有命令仍由既有 Job 和 Artifact 门禁处理，门面不绕过任何校验。 */
export class VideoProductionDelivery {
  constructor(private readonly application: EditingApplication) {}

  submitPreview(input: ApplicationInput<"submitPreview">): ApplicationResult<"submitPreview"> {
    return this.application.submitPreview(input);
  }

  submitRenderPreflight(input: ApplicationInput<"submitRenderPreflight">): ApplicationResult<"submitRenderPreflight"> {
    return this.application.submitRenderPreflight(input);
  }

  submitExport(input: ApplicationInput<"submitExport">): ApplicationResult<"submitExport"> {
    return this.application.submitExport(input);
  }

  trackJob(input: ApplicationInput<"trackJob">): ApplicationResult<"trackJob"> {
    return this.application.trackJob(input);
  }

  recordExportArtifactReview(input: ApplicationInput<"recordExportArtifactReview">): ApplicationResult<"recordExportArtifactReview"> {
    return this.application.recordExportArtifactReview(input);
  }

  approveExportArtifact(input: ApplicationInput<"approveExportArtifact">): ApplicationResult<"approveExportArtifact"> {
    return this.application.approveExportArtifact(input);
  }
}

/**
 * 高层生产流程门面。
 *
 * 它只保存同一个 EditingApplication 引用；各阶段方法都一对一委托给原有公开命令。
 * 因此现有 Revision、Job、权限和交付门禁保持完全不变。
 */
export class VideoProductionFlow {
  /** 供界面或文档直接展示的五阶段导航。 */
  readonly stages = VIDEO_PRODUCTION_STAGES;
  readonly materials: VideoProductionMaterials;
  readonly understanding: VideoProductionUnderstanding;
  readonly direction: VideoProductionDirection;
  readonly production: VideoProductionCompilation;
  readonly delivery: VideoProductionDelivery;

  constructor(public readonly application: EditingApplication) {
    this.materials = new VideoProductionMaterials(application);
    this.understanding = new VideoProductionUnderstanding(application);
    this.direction = new VideoProductionDirection(application);
    this.production = new VideoProductionCompilation(application);
    this.delivery = new VideoProductionDelivery(application);
  }
}

/** 使用已有 EditingApplication 创建高层流程门面；不会创建额外仓储或项目状态。 */
export function createProductionFlow(application: EditingApplication): VideoProductionFlow {
  return new VideoProductionFlow(application);
}
