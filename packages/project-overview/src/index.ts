import { join } from "node:path";

/**
 * 这是面向项目维护者的单一阅读入口：只保留配置、顶层流程、关键类名和 MCP 能力目录。
 * 具体的 HTTP、数据库、渲染和 Provider 实现仍留在各自模块，避免把内部细节重复维护一份。
 */

export const RUNTIME_CONFIG_DEFAULTS = {
  workspaceDirectoryName: "workspace",
  serverHost: "127.0.0.1",
  serverPort: 3100,
  webOrigin: "http://127.0.0.1:5173",
  logLevel: "info",
  bridgeApiBaseUrl: "http://127.0.0.1:8188/comfyui-bridge/v1",
  maxAssetDownloadBytes: 512 * 1024 * 1024,
  maxWikimediaDownloadBytes: 256 * 1024 * 1024,
  maxGeneratedVideoBytes: 512 * 1024 * 1024,
  runtimeId: "manual"
} as const;

export type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * 运行时真正使用的 Node 配置。调用 readRuntimeConfig() 时才读取环境变量，
 * 因此测试或插件启动器在导入模块后修改环境变量仍保持原先的行为。
 */
export interface RuntimeConfig {
  workspace: {
    root: string;
  };
  http: {
    host: string;
    port: number;
    webOrigin: string;
    serveWeb: boolean;
    logLevel: string;
  };
  bridge: {
    apiBaseUrl: string;
  };
  providers: {
    pexelsApiKey?: string;
  };
  downloads: {
    maxAssetBytes: number;
    maxWikimediaBytes: number;
    maxGeneratedVideoBytes: number;
  };
  runtime: {
    distributionDirectory?: string;
    runtimeToken?: string;
    runtimeId: string;
    webRoot?: string;
    remotionEntry?: string;
    nodeModules?: string;
    renderSourceRoot?: string;
    remotionContractsEntry?: string;
  };
}

export interface ReadRuntimeConfigOptions {
  /** 供测试注入；生产默认读取 process.env。 */
  environment?: RuntimeEnvironment;
  /** 供测试注入；生产默认读取 process.cwd()。 */
  cwd?: string;
}

/** 集中读取所有 Node 端运行配置，不在这里校验 Provider 或启动外部服务。 */
export function readRuntimeConfig(options: ReadRuntimeConfigOptions = {}): RuntimeConfig {
  const environment = options.environment ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  return {
    workspace: {
      root: environment.VIDEOCUT_WORKSPACE ?? join(cwd, RUNTIME_CONFIG_DEFAULTS.workspaceDirectoryName)
    },
    http: {
      host: environment.HOST ?? RUNTIME_CONFIG_DEFAULTS.serverHost,
      port: Number(environment.PORT ?? RUNTIME_CONFIG_DEFAULTS.serverPort),
      webOrigin: environment.WEB_ORIGIN ?? RUNTIME_CONFIG_DEFAULTS.webOrigin,
      serveWeb: environment.SERVE_WEB === "true",
      logLevel: environment.LOG_LEVEL ?? RUNTIME_CONFIG_DEFAULTS.logLevel
    },
    bridge: {
      apiBaseUrl: environment.COMFYUI_BRIDGE_URL ?? RUNTIME_CONFIG_DEFAULTS.bridgeApiBaseUrl
    },
    providers: {
      pexelsApiKey: environment.PEXELS_API_KEY?.trim() || undefined
    },
    downloads: {
      maxAssetBytes: Number(environment.VIDEOCUT_MAX_ASSET_DOWNLOAD_BYTES ?? RUNTIME_CONFIG_DEFAULTS.maxAssetDownloadBytes),
      maxWikimediaBytes: Number(environment.VIDEOCUT_MAX_WIKIMEDIA_DOWNLOAD_BYTES ?? RUNTIME_CONFIG_DEFAULTS.maxWikimediaDownloadBytes),
      maxGeneratedVideoBytes: Number(environment.VIDEOCUT_MAX_GENERATED_VIDEO_BYTES ?? RUNTIME_CONFIG_DEFAULTS.maxGeneratedVideoBytes)
    },
    runtime: {
      distributionDirectory: environment.VIDEOFLOWCUT_RUNTIME_DIST,
      runtimeToken: environment.VIDEOFLOWCUT_RUNTIME_TOKEN,
      runtimeId: environment.VIDEOFLOWCUT_RUNTIME_ID ?? RUNTIME_CONFIG_DEFAULTS.runtimeId,
      webRoot: environment.VIDEOFLOWCUT_WEB_ROOT,
      remotionEntry: environment.VIDEOFLOWCUT_REMOTION_ENTRY,
      nodeModules: environment.VIDEOFLOWCUT_NODE_MODULES,
      renderSourceRoot: environment.VIDEOFLOWCUT_RENDER_SOURCE_ROOT,
      remotionContractsEntry: environment.VIDEOFLOWCUT_REMOTION_CONTRACTS_ENTRY
    }
  };
}

/**
 * 插件发行 Runtime 才需要补齐三条发行路径。集中在这里可让启动入口不再散落
 * process.env 读写；未设置时严格保持原来的“不覆盖调用方显式配置”行为。
 */
export function applyReleaseRuntimeDefaults(
  releaseDirectory?: string,
  environment: RuntimeEnvironment = process.env
): RuntimeConfig {
  const distributionDirectory = environment.VIDEOFLOWCUT_RUNTIME_DIST ?? releaseDirectory;
  if (distributionDirectory) {
    environment.VIDEOFLOWCUT_RUNTIME_DIST ??= distributionDirectory;
    environment.VIDEOFLOWCUT_WEB_ROOT ??= join(distributionDirectory, "web");
    environment.VIDEOFLOWCUT_REMOTION_ENTRY ??= join(distributionDirectory, "remotion", "render-entry.cjs");
  }
  return readRuntimeConfig({ environment });
}

/** 用户只需按这个顺序理解整条业务调用链；每一步内部实现由对应应用层封装。 */
export const CORE_PRODUCTION_FLOW = [
  {
    step: 1,
    name: "素材读取",
    responsibility: "创建项目、导入受管素材、登记来源与媒体分析。",
    entryPoints: [
      { name: "EditingApplication", kind: "项目应用类" },
      { name: "AssetProviderRegistry", kind: "素材 Provider 类" },
      { name: "ProjectRepository", kind: "持久化类" }
    ]
  },
  {
    step: 2,
    name: "理解视频",
    responsibility: "转写、素材审阅、Vlog 事件分析或多机位同步，形成可追溯事实。",
    entryPoints: [
      { name: "FunASRService", kind: "转写服务类" },
      { name: "EditingApplication", kind: "项目应用类" }
    ]
  },
  {
    step: 3,
    name: "导演规划",
    responsibility: "由主工作流组织故事、场景、人物、视觉处理和素材需求。",
    entryPoints: [{ name: "EditingApplication", kind: "项目应用类" }]
  },
  {
    step: 4,
    name: "成片生产",
    responsibility: "编译时间线、语音、字幕、音频、效果、人物或生成素材。",
    entryPoints: [
      { name: "EditingApplication", kind: "项目应用类" },
      { name: "OmniVoiceSegmentService", kind: "语音服务类" },
      { name: "ComfyUIBridgeClient", kind: "Bridge 客户端类" },
      { name: "RevisionRenderer", kind: "渲染器类" }
    ]
  },
  {
    step: 5,
    name: "预览与交付",
    responsibility: "真实预览、质量审查、渲染预检、导出 Artifact 与批准。",
    entryPoints: [
      { name: "EditingApplication", kind: "项目应用类" },
      { name: "evaluateQuality", kind: "质量函数" },
      { name: "RevisionRenderer", kind: "渲染器类" }
    ]
  }
] as const;

/** 只列真实公开类、函数或 SDK 入口，帮助阅读，不把用户带入内部文件或具体算法。 */
export const KEY_APPLICATION_ENTRIES = [
  { name: "EditingApplication", kind: "项目类", responsibility: "项目 Revision、创作对象和业务命令的统一门面", module: "@videocut/application" },
  { name: "VideoProductionFlow", kind: "流程门面类", responsibility: "按五个顶层阶段组织 EditingApplication 的公开调用，不复制业务状态", module: "@videocut/application" },
  { name: "createProductionFlow", kind: "函数", responsibility: "从既有 EditingApplication 创建五阶段流程门面", module: "@videocut/application" },
  { name: "ProjectRepository", kind: "持久化类", responsibility: "SQLite 项目、Revision、任务与导出记录的持久化", module: "@videocut/application" },
  { name: "AssetProviderRegistry", kind: "素材 Provider 类", responsibility: "素材搜索、候选审阅和受管下载 Provider 的目录", module: "@videocut/acquisition" },
  { name: "ComfyUIBridgeClient", kind: "Bridge 客户端类", responsibility: "动态读取 ComfyUI Workflow Schema 并提交 Bridge 任务", module: "@videocut/bridge" },
  { name: "FunASRService", kind: "转写服务类", responsibility: "转写与时间信息的服务边界", module: "@videocut/speech" },
  { name: "OmniVoiceSegmentService", kind: "语音服务类", responsibility: "段级语音合成与真实音频时长校验", module: "@videocut/speech" },
  { name: "RevisionRenderer", kind: "渲染器类", responsibility: "Preview、Render Preflight 与导出渲染", module: "Render Worker" },
  { name: "evaluateQuality", kind: "函数", responsibility: "质量规则、审片结论与交付门禁", module: "@videocut/quality" },
  { name: "McpServer", kind: "SDK 类", responsibility: "为 Codex 注册工具的协议适配层", module: "@modelcontextprotocol/sdk/server/mcp.js" }
] as const;

export interface McpCapabilityGroup {
  id: string;
  name: string;
  description: string;
  tools: readonly string[];
}

/** MCP 的连接入口只保留协议和公开名称；业务工具的内部实现不在总览展开。 */
export const MCP_SERVER_DESCRIPTOR = {
  name: "video-editor-mcp",
  transport: "stdio",
  entry: "video-editor-mcp 模块",
  overviewTool: "read_project_overview"
} as const;

/**
 * MCP 的用户可读能力目录。工具仍在 mcp.ts 注册；新增工具必须同时归入这里，
 * tests/project-overview.test.ts 会静态比对，防止目录悄悄过期。
 */
export const MCP_CAPABILITY_GROUPS: readonly McpCapabilityGroup[] = [
  {
    id: "overview",
    name: "项目总览",
    description: "读取本文件汇总的配置、流程、关键入口和 MCP 目录。",
    tools: ["read_project_overview"]
  },
  {
    id: "project",
    name: "项目与协作",
    description: "创建和定位项目、读取 Revision 与故事、打开工作台、管理 Codex 工作单。",
    tools: [
      "open_web_workbench", "list_projects", "create_project", "target_project", "read_project", "read_story", "manage_story",
      "get_editor_url", "focus_editor_object", "read_impact_report", "list_revisions", "read_agent_work_orders",
      "claim_agent_work_order", "complete_agent_work_order", "release_agent_work_order", "rollback_revision"
    ]
  },
  {
    id: "assets",
    name: "素材与来源",
    description: "浏览、导入、检验、搜索、获取素材，并保留来源、许可和需求事实。",
    tools: [
      "browse_assets", "inspect_asset", "manage_asset_requirements", "search_media_candidates", "inspect_media_candidate",
      "acquire_media_asset", "read_asset_provenance", "import_media", "update_asset_metadata"
    ]
  },
  {
    id: "speech",
    name: "转写、语音与声音",
    description: "处理转写、语义脚本、语音合成与对齐、字幕、对白和 BGM/SFX。",
    tools: [
      "submit_transcription", "apply_manual_transcript", "read_script", "apply_semantic_units", "apply_script",
      "read_speech_asset", "manage_voice_references", "read_speech_timing", "submit_speech_alignment",
      "read_speech_alignment", "rebuild_speech_timeline", "submit_voice_synthesis", "submit_dialogue_processing",
      "select_dialogue_processing_variant", "read_captions", "edit_captions", "manage_audio"
    ]
  },
  {
    id: "presenter",
    name: "人物口播主线",
    description: "组装 A-roll、人物场景和人物语音时间线。",
    tools: ["assemble_presenter_track", "compile_presenter_scenes", "create_presenter_timeline", "align_presenter_to_speech"]
  },
  {
    id: "explainer",
    name: "视觉解释片",
    description: "管理叙事地图、证据采集和 Explainer Scene 程序。",
    tools: [
      "read_narrative_map", "manage_narrative_map", "read_evidence_capture", "manage_evidence_capture",
      "read_explainer_scene_programs", "compile_explainer_scenes"
    ]
  },
  {
    id: "vlog_multicam",
    name: "Vlog 与多机位",
    description: "分析实拍事件、镜头选择与音乐节拍，并同步、验证和编译多机位节目。",
    tools: [
      "read_vlog_plan", "submit_vlog_analysis", "manage_vlog_events", "manage_vlog_shot_selects", "compile_vlog_montage",
      "manage_vlog_music_beats", "read_multicam_plan", "submit_multicam_sync", "create_manual_multicam_group",
      "verify_multicam_group", "manage_multicam_cuts", "compile_multicam_program"
    ]
  },
  {
    id: "generation_actor",
    name: "生成与人物能力",
    description: "提交音乐、视频与数字人物任务，并管理可验证的人物能力和表演记录。",
    tools: [
      "submit_music_generation", "submit_video_generation", "read_actor_performances", "read_actor_capabilities",
      "manage_actor_capabilities", "manage_actor_performance", "submit_avatar_job"
    ]
  },
  {
    id: "timeline_visuals",
    name: "场景、视觉与时间线",
    description: "创建场景、管理视觉处理、Cutaway、效果和时间线位置，并请求轻量预览。",
    tools: [
      "browse_scene_types", "create_scene", "manage_visual_treatment", "manage_cutaways", "replace_scene_asset",
      "browse_effect_types", "manage_effect_cues", "move_item", "preview_timeline"
    ]
  },
  {
    id: "production_quality",
    name: "生产与质量",
    description: "记录创作决定，运行生产流程，读取技能交接、图结构和连续预览审片证据。",
    tools: [
      "start_production_run", "record_creative_decision", "record_editorial_quality_review", "complete_production_run",
      "read_skill_execution_report", "validate_project_graph", "read_quality_report", "render_preview_range",
      "inspect_composed_frames"
    ]
  },
  {
    id: "delivery",
    name: "交付与异步任务",
    description: "提交导出、执行渲染预检、读取和审核 Artifact、批准交付并跟踪任务。",
    tools: [
      "submit_export", "run_render_preflight", "track_export", "read_export_artifact", "record_export_artifact_review",
      "approve_export_artifact", "track_job"
    ]
  }
];

/** Node 服务、Worker 与发行 Runtime 的环境变量目录；敏感值只展示“是否已配置”。 */
export const NODE_RUNTIME_CONFIGURATION_CATALOG = [
  { key: "VIDEOCUT_WORKSPACE", group: "工作区", description: "项目数据库、素材与导出目录", defaultValue: "<cwd>/workspace" },
  { key: "HOST", group: "HTTP", description: "Server 与 Runtime 监听地址", defaultValue: RUNTIME_CONFIG_DEFAULTS.serverHost },
  { key: "PORT", group: "HTTP", description: "Server 与 Runtime 监听端口", defaultValue: String(RUNTIME_CONFIG_DEFAULTS.serverPort) },
  { key: "WEB_ORIGIN", group: "HTTP", description: "开发态 Web 工作台地址", defaultValue: RUNTIME_CONFIG_DEFAULTS.webOrigin },
  { key: "SERVE_WEB", group: "HTTP", description: "Server 是否托管静态 Web 产物", defaultValue: "false" },
  { key: "LOG_LEVEL", group: "HTTP", description: "Fastify 日志级别", defaultValue: RUNTIME_CONFIG_DEFAULTS.logLevel },
  { key: "COMFYUI_BRIDGE_URL", group: "Bridge", description: "ComfyUI Bridge HTTP API 根地址", defaultValue: RUNTIME_CONFIG_DEFAULTS.bridgeApiBaseUrl },
  { key: "PEXELS_API_KEY", group: "Provider", description: "启用 Pexels 素材 Provider 的密钥", sensitive: true },
  { key: "VIDEOCUT_MAX_ASSET_DOWNLOAD_BYTES", group: "下载限制", description: "普通 Provider 素材下载上限", defaultValue: String(RUNTIME_CONFIG_DEFAULTS.maxAssetDownloadBytes) },
  { key: "VIDEOCUT_MAX_WIKIMEDIA_DOWNLOAD_BYTES", group: "下载限制", description: "Wikimedia Commons 下载上限", defaultValue: String(RUNTIME_CONFIG_DEFAULTS.maxWikimediaDownloadBytes) },
  { key: "VIDEOCUT_MAX_GENERATED_VIDEO_BYTES", group: "下载限制", description: "Bridge 生成视频下载上限", defaultValue: String(RUNTIME_CONFIG_DEFAULTS.maxGeneratedVideoBytes) },
  { key: "VIDEOFLOWCUT_RUNTIME_DIST", group: "发行 Runtime", description: "插件发行运行时目录" },
  { key: "VIDEOFLOWCUT_WEB_ROOT", group: "发行 Runtime", description: "静态 Web 产物目录" },
  { key: "VIDEOFLOWCUT_REMOTION_ENTRY", group: "发行 Runtime", description: "发行版 Remotion 入口" },
  { key: "VIDEOFLOWCUT_NODE_MODULES", group: "发行 Runtime", description: "Remotion 打包时额外查找的 node_modules 目录" },
  { key: "VIDEOFLOWCUT_RENDER_SOURCE_ROOT", group: "发行 Runtime", description: "开发态 Render Worker 源码根目录" },
  { key: "VIDEOFLOWCUT_REMOTION_CONTRACTS_ENTRY", group: "发行 Runtime", description: "开发态 Remotion Contracts 入口" },
  { key: "VIDEOFLOWCUT_RUNTIME_TOKEN", group: "发行 Runtime", description: "Runtime 内部控制接口令牌", sensitive: true },
  { key: "VIDEOFLOWCUT_RUNTIME_ID", group: "发行 Runtime", description: "Runtime 实例标识", defaultValue: RUNTIME_CONFIG_DEFAULTS.runtimeId }
] as const;

/**
 * 浏览器配置只在 Vite 构建或浏览器运行时读取。它列在总览中供维护者查看，
 * 但 project-overview 不会被 Web 打包入口导入，避免把 Node 依赖带进浏览器。
 */
export const WEB_CONFIGURATION_CATALOG = [
  {
    key: "VITE_API_BASE",
    group: "Web API",
    scope: "浏览器构建时环境变量",
    source: "apps/web/src/api.ts",
    description: "Web 工作台请求 API 的基础地址；开发态默认 http://127.0.0.1:3100，生产态默认当前页面来源。"
  },
  {
    key: "DEV",
    group: "Web API",
    scope: "Vite 内置浏览器标记",
    source: "apps/web/src/api.ts",
    description: "判断当前是否为 Vite 开发态；它不是用户设置的环境变量。"
  },
  {
    key: "vite.server.host",
    group: "Vite 开发服务",
    scope: "固定开发配置",
    source: "apps/web/vite.config.ts",
    description: "Vite 开发服务监听地址；当前不是环境变量。",
    defaultValue: "127.0.0.1"
  },
  {
    key: "vite.server.port",
    group: "Vite 开发服务",
    scope: "固定开发配置",
    source: "apps/web/vite.config.ts",
    description: "Vite 开发服务监听端口；当前不是环境变量。",
    defaultValue: "5173"
  }
] as const;

/** 插件启动器自己的配置不会传给浏览器，也不会改变 Server 的 HOST / PORT 含义。 */
export const PLUGIN_LAUNCHER_CONFIGURATION_CATALOG = [
  {
    key: "VIDEOFLOWCUT_REPO_ROOT",
    group: "插件启动器",
    scope: "Node 启动器环境变量或 --repo-root 参数",
    source: "plugins/videoflowcut/scripts/runtime-launcher.mjs",
    description: "定位宿主仓库；未设置时依次尝试发行指针和插件相对目录。"
  },
  {
    key: "VIDEOFLOWCUT_PORT",
    group: "插件启动器",
    scope: "Node 启动器环境变量或 --port 参数",
    source: "plugins/videoflowcut/scripts/runtime-launcher.mjs",
    description: "插件 Runtime 端口，必须是 1024 到 65535 的整数。",
    defaultValue: "3100"
  },
  {
    key: "NODE_PATH",
    group: "插件启动器",
    scope: "Node 继承环境变量",
    source: "plugins/videoflowcut/scripts/repo-root.mjs",
    description: "发行 Runtime 与 MCP 启动器用于定位宿主仓库 node_modules；会保留原有路径并追加仓库依赖路径。"
  }
] as const;

/** 真实服务不会读取该变量；它只用于手工触发阶段 1 live E2E 的隔离工作区。 */
export const EVALUATION_CONFIGURATION_CATALOG = [
  {
    key: "VIDEOCUT_LIVE_WORKSPACE",
    group: "本地 E2E",
    scope: "scripts/presenter-stage1-live.e2e.ts",
    source: "scripts/presenter-stage1-live.e2e.ts",
    description: "阶段 1 live E2E 的临时工作区；未设置时脚本自行创建临时目录。"
  }
] as const;

/**
 * 全仓库显式环境变量和固定 Web 配置的唯一可读目录。
 * 静态测试会将实际访问的 process.env / import.meta.env 名称与该目录逐项比对。
 */
export const RUNTIME_CONFIGURATION_CATALOG = [
  ...NODE_RUNTIME_CONFIGURATION_CATALOG,
  ...WEB_CONFIGURATION_CATALOG,
  ...PLUGIN_LAUNCHER_CONFIGURATION_CATALOG,
  ...EVALUATION_CONFIGURATION_CATALOG
] as const;

/** 返回给 MCP 的安全总览：可读配置不泄漏密钥，且不会执行任何剪辑、转写或渲染。 */
export function getProjectOverview(options: ReadRuntimeConfigOptions = {}) {
  const config = readRuntimeConfig(options);
  return {
    title: "VideoFlowCut 项目总览",
    configuration: {
      workspaceRoot: config.workspace.root,
      http: config.http,
      bridge: config.bridge,
      downloads: config.downloads,
      providers: { pexelsConfigured: Boolean(config.providers.pexelsApiKey) },
      runtime: {
        distributionDirectory: config.runtime.distributionDirectory,
        runtimeId: config.runtime.runtimeId,
        webRoot: config.runtime.webRoot,
        remotionEntry: config.runtime.remotionEntry,
        nodeModulesConfigured: Boolean(config.runtime.nodeModules),
        renderSourceRoot: config.runtime.renderSourceRoot,
        remotionContractsEntry: config.runtime.remotionContractsEntry,
        runtimeTokenConfigured: Boolean(config.runtime.runtimeToken)
      }
    },
    configurationCatalog: {
      all: RUNTIME_CONFIGURATION_CATALOG,
      nodeRuntime: NODE_RUNTIME_CONFIGURATION_CATALOG,
      web: WEB_CONFIGURATION_CATALOG,
      pluginLauncher: PLUGIN_LAUNCHER_CONFIGURATION_CATALOG,
      evaluation: EVALUATION_CONFIGURATION_CATALOG
    },
    coreProductionFlow: CORE_PRODUCTION_FLOW,
    keyApplicationEntries: KEY_APPLICATION_ENTRIES,
    mcpServer: MCP_SERVER_DESCRIPTOR,
    mcpCapabilityGroups: MCP_CAPABILITY_GROUPS
  };
}
