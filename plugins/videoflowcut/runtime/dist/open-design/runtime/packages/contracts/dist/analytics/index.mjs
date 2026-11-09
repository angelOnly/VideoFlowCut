// src/api/artifact-focus-marker.ts
var MAX_ARTIFACT_FOCUS_SHOW = 8;
var MAX_FOCUS_PATH_LENGTH = 1024;
var MAX_FOCUS_PATH_SEGMENTS = 32;
var WRAPPING_RE = /^[`"'“”‘’\[(<]+|[`"'“”‘’\])>]+$/g;
function normalizeArtifactFocusPath(raw) {
  if (typeof raw !== "string") return null;
  let value = raw.trim().replace(WRAPPING_RE, "").trim();
  if (!value) return null;
  if (value.length > MAX_FOCUS_PATH_LENGTH) return null;
  if (value.includes("\0")) return null;
  value = value.replace(/\\/g, "/");
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (value.startsWith("/") || /^[A-Za-z]:\//.test(value)) return null;
  const segments = [];
  for (const segment of value.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") return null;
    segments.push(segment);
  }
  if (segments.length === 0) return null;
  if (segments.length > MAX_FOCUS_PATH_SEGMENTS) return null;
  return segments.join("/");
}
function parseArtifactFocusPathList(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const piece of raw.split(/[,\r\n]/)) {
    const normalized = normalizeArtifactFocusPath(piece);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= MAX_ARTIFACT_FOCUS_SHOW) break;
  }
  return out;
}
var DEPENDENCY_EXTENSIONS = /* @__PURE__ */ new Set([
  "js",
  "mjs",
  "cjs",
  "jsx",
  "ts",
  "tsx",
  "mts",
  "cts",
  "css",
  "scss",
  "sass",
  "less",
  "styl",
  "svg",
  "json",
  "jsonc",
  "map",
  "lock",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "ico"
]);
var MEDIA_EXTENSIONS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "bmp",
  "tif",
  "tiff",
  "mp4",
  "mov",
  "webm",
  "m4v",
  "avi",
  "mkv",
  "mp3",
  "wav",
  "ogg",
  "oga",
  "m4a",
  "flac",
  "aac"
]);
function fileExtension(pathLike) {
  const basename = pathLike.replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = basename.lastIndexOf(".");
  if (dot <= 0 || dot === basename.length - 1) return "";
  return basename.slice(dot + 1).toLowerCase();
}
function artifactDeliveryRole(pathLike) {
  const ext = fileExtension(typeof pathLike === "string" ? pathLike : "");
  if (DEPENDENCY_EXTENSIONS.has(ext)) return "dependency";
  if (MEDIA_EXTENSIONS.has(ext)) return "media";
  return "deliverable";
}
function pickPrimaryArtifacts(files) {
  const roleOf = (file) => artifactDeliveryRole(file.path || file.name || "");
  const deliverables = files.filter((file) => roleOf(file) === "deliverable");
  if (deliverables.length > 0) return deliverables;
  return files.filter((file) => roleOf(file) === "media");
}

// src/analytics/artifact-focus.ts
function buildArtifactFocusTelemetry(input) {
  const written = (Array.isArray(input?.writtenPaths) ? input.writtenPaths : []).filter((path) => typeof path === "string" && path.length > 0).map((path) => ({ name: path, path }));
  const declared = parseArtifactFocusPathList(
    (Array.isArray(input?.declared) ? input.declared : []).join(",")
  );
  const primary = pickPrimaryArtifacts(written);
  return {
    declared_artifact_focus: declared.length > 0,
    declared_count: declared.length,
    fallback_picked_count: declared.length > 0 ? 0 : primary.length,
    wrote_only_dependencies: written.length > 0 && primary.length === 0
  };
}

// src/analytics/events/ui-click.ts
var TRACKING_HANDOFF_TARGET_IDS = [
  // editors / file managers (HostEditorId)
  "cursor",
  "vscode",
  "windsurf",
  "zed",
  "qoder",
  "antigravity",
  "webstorm",
  "idea",
  "xcode",
  "finder",
  "explorer",
  "file-manager",
  "terminal",
  "warp",
  // code-agent CLIs (HandoffButton CLI_ORDER; qoder / antigravity already above)
  "amr",
  "claude",
  "codex",
  "opencode",
  "cursor-agent",
  "gemini",
  "qwen",
  "copilot",
  "grok-build",
  "deepseek",
  "kimi",
  "hermes",
  "devin",
  "kiro",
  "kilo",
  "vibe",
  "aider",
  "trae-cli",
  "pi",
  "reasonix"
];
function handoffTargetIdToTracking(id) {
  return TRACKING_HANDOFF_TARGET_IDS.includes(id ?? "") ? id : "other";
}

// src/api/projects.ts
var HYPERFRAMES_VIDEO_MODEL = "hyperframes-html";

// src/analytics/events/mappers.ts
function sessionModeToTracking(mode) {
  if (mode === "design") return "design";
  if (mode === "plan") return "plan";
  return "ask";
}
function isMobileSurface(hints) {
  const mobile = (target) => target === "mobile-ios" || target === "mobile-android";
  if (mobile(hints?.platform)) return true;
  return (hints?.platformTargets ?? []).some(mobile);
}
function projectKindToTracking(kind, videoModel, hints) {
  switch (kind) {
    case "prototype":
      if (hints?.intent === "web-clone") return "web_clone";
      if (hints?.intent === "live-artifact") return "live_artifact";
      if (hints?.fidelity === "wireframe") return "wireframe";
      if (isMobileSurface(hints)) return "mobile";
      return "prototype";
    case "deck":
      return "slide_deck";
    case "template":
      return "template";
    case "other":
      return hints?.intent === "document" ? "document" : "other";
    case "image":
      return "image";
    case "video":
      return videoModel === HYPERFRAMES_VIDEO_MODEL ? "hyperframes" : "video";
    case "audio":
      return "audio";
    case "brand":
      return "brand";
    case "orbit":
      return "orbit";
    case "live-artifact":
    case "live_artifact":
      return "live_artifact";
    case "web-clone":
    case "web_clone":
      return "web_clone";
    default:
      return null;
  }
}
function projectKindFromMetadataToTracking(metadata) {
  return projectKindToTracking(metadata?.kind, metadata?.videoModel, {
    fidelity: metadata?.fidelity,
    intent: metadata?.intent,
    platform: metadata?.platform,
    platformTargets: metadata?.platformTargets
  });
}
function projectKindFromMetadataToTrackingOrLegacyDefault(metadata) {
  const tracked = projectKindFromMetadataToTracking(metadata);
  if (tracked) return tracked;
  return metadata?.kind == null ? "prototype" : "other";
}
function createTabToTracking(tab) {
  switch (tab) {
    case "prototype":
      return "prototype";
    case "deck":
      return "slide_deck";
    case "template":
      return "from_template";
    case "live-artifact":
      return "live_artifact";
    case "image":
    case "video":
    case "audio":
      return "media";
    case "other":
      return "other";
    default:
      return "prototype";
  }
}
function fidelityToTracking(fidelity) {
  if (fidelity === "wireframe") return "wireframe";
  if (fidelity === "high-fidelity") return "high_fidelity";
  return "not_applicable";
}
function executionModeToTracking(mode) {
  return mode === "daemon" ? "local_cli" : "byok";
}
function modelIdForTracking(model) {
  const trimmed = typeof model === "string" ? model.trim() : "";
  return trimmed.length > 0 ? trimmed : "default";
}
function agentIdToTracking(agentId) {
  switch (agentId) {
    case "claude":
      return "claude_code";
    case "codex":
      return "codex_cli";
    case "devin":
      return "devin_for_terminal";
    case "gemini":
      return "gemini_cli";
    case "opencode":
      return "opencode";
    case "hermes":
      return "hermes";
    case "kimi":
      return "kimi_cli";
    case "cursor-agent":
      return "cursor_agent";
    case "qwen":
      return "qwen_code";
    case "qoder":
      return "qoder_cli";
    case "copilot":
      return "github_copilot_cli";
    case "pi":
      return "pi";
    case "kilo":
      return "kilo";
    case "kiro":
      return "kiro";
    case "vibe":
      return "vibe";
    case "amp":
      return "amp";
    case "aider":
      return "aider";
    case "trae-cli":
      return "trae_cli";
    case "grok-build":
      return "grok_build";
    case "antigravity":
      return "antigravity";
    case "codebuddy":
      return "codebuddy";
    case "reasonix":
      return "reasonix";
    case "mimo":
      return "mimo";
    case "atomcode":
      return "atomcode";
    case "byok-opencode":
      return "byok_opencode";
    case "deepseek":
      return "deepseek";
    case "deepseek-harness":
      return "deepseek_harness";
    case "amr":
      return "amr";
    default:
      return "other";
  }
}
function feedbackAgentProviderIdToTracking(agentId) {
  switch (agentId) {
    case "anthropic-api":
      return byokProtocolToTracking("anthropic") ?? "other";
    case "openai-api":
      return byokProtocolToTracking("openai") ?? "other";
    case "azure-openai-api":
      return byokProtocolToTracking("azure") ?? "other";
    case "google-gemini-api":
      return byokProtocolToTracking("google") ?? "other";
    case "ollama-cloud-api":
      return byokProtocolToTracking("ollama") ?? "other";
    case "senseaudio-api":
      return byokProtocolToTracking("senseaudio") ?? "other";
    default:
      return agentIdToTracking(agentId);
  }
}
function byokProtocolToTracking(protocol) {
  switch (protocol) {
    case "anthropic":
      return "anthropic";
    case "openai":
      return "openai";
    case "azure":
    case "azure_openai":
      return "azure_openai";
    case "google":
    case "google_gemini":
      return "google_gemini";
    case "ollama":
    case "ollama_cloud":
      return "ollama_cloud";
    case "senseaudio":
      return "senseaudio";
    case "aihubmix":
      return "aihubmix";
    case "bedrock":
      return null;
    default:
      return null;
  }
}
function settingsSectionToTracking(section) {
  switch (section) {
    case "execution":
      return "configure_execution_mode";
    case "instructions":
      return "instructions";
    case "media":
      return "media_providers";
    case "language":
      return "language";
    case "appearance":
      return "appearance";
    case "pet":
      return "pets";
    case "about":
      return "about";
    case "composio":
    case "integrations":
    case "connectors":
      return "connectors";
    case "mcpClient":
      return "external_mcp";
    case "mcp_server":
      return "mcp_server";
    case "orbit":
      return "orbit";
    case "skills":
      return "skills";
    case "designSystems":
      return "design_systems";
    case "critiqueTheater":
      return "design_review";
    case "projectLocations":
      return "project_locations";
    case "memory":
      return "memory";
    case "privacy":
      return "privacy";
    case "labs":
      return "labs";
    case "notifications":
      return "notifications";
    case "externalMcp":
      return "external_mcp";
    default:
      return "configure_execution_mode";
  }
}
function artifactKindToTracking(args) {
  const { rendererId, fileKind } = args;
  if (rendererId === "html" || rendererId === "deck-html" || rendererId === "react-component") {
    return "html";
  }
  if (rendererId === "markdown") return "markdown";
  if (rendererId === "svg") return "image";
  if (fileKind === "image" || fileKind === "sketch") return "image";
  if (fileKind === "video") return "video";
  if (fileKind === "audio") return "audio";
  if (fileKind === "pdf" || fileKind === "document" || fileKind === "presentation" || fileKind === "spreadsheet") {
    return "doc";
  }
  return "unknown";
}
function fileSizeBucketToTracking(bytes2) {
  const mb = bytes2 / (1024 * 1024);
  if (mb < 1) return "0_1mb";
  if (mb < 10) return "1_10mb";
  if (mb < 100) return "10_100mb";
  return "100mb_plus";
}
function fileTypeToTracking(args) {
  if (args.isFolder) return "folder";
  if (args.isZip) return "zip";
  const m = args.mime ?? "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  return "other";
}
function deriveConfigureGlobals(input) {
  const agents = input.agents ?? [];
  const cliAgents = agents.filter((a) => a.id !== "amr");
  const hasAvailableCli = cliAgents.some((a) => a.available === true);
  const selectedAgent = input.agentId ? agents.find((a) => a.id === input.agentId) : void 0;
  const selectedAgentAvailable = selectedAgent?.available === true;
  const byokConfigured = input.byokConfigured === true;
  const amrAuthorized = input.amrAuthorized === true;
  const byokSignal = byokConfigured || input.mode === "api";
  let configureType;
  if (hasAvailableCli && byokSignal) {
    configureType = "both";
  } else if (hasAvailableCli) {
    configureType = "local_cli";
  } else if (byokSignal) {
    configureType = "byok";
  } else if (amrAuthorized) {
    configureType = "amr";
  } else {
    configureType = "none";
  }
  let configureAvailability;
  if (input.mode === "daemon") {
    configureAvailability = selectedAgentAvailable ? "available" : "unavailable";
  } else if (input.mode === "api") {
    configureAvailability = byokConfigured ? "available" : "unavailable";
  } else if (hasAvailableCli || byokConfigured || amrAuthorized) {
    configureAvailability = "available";
  } else {
    configureAvailability = "unknown";
  }
  let runtimeType;
  if (input.mode === "api") {
    runtimeType = "byok";
  } else if (input.agentId === "amr") {
    runtimeType = "amr_cloud";
  } else if (input.mode === "daemon" && selectedAgentAvailable) {
    runtimeType = "local_cli";
  } else if (hasAvailableCli) {
    runtimeType = "local_cli";
  } else if (byokSignal) {
    runtimeType = "byok";
  } else if (amrAuthorized) {
    runtimeType = "amr_cloud";
  } else {
    runtimeType = "none";
  }
  return {
    has_available_configure_cli: hasAvailableCli,
    configure_type: configureType,
    configure_availability: configureAvailability,
    runtime_type: runtimeType,
    // Independent per-path runnable flags (no cascade masking — see
    // AnalyticsConfigureGlobals). `cli_runnable` mirrors
    // `has_available_configure_cli`; `byok_runnable` uses the actually-saved
    // key signal (not the `mode === 'api'` fallback, which can be true with no
    // key yet); `amr_runnable` is sign-in.
    cli_runnable: hasAvailableCli,
    byok_runnable: byokConfigured,
    amr_runnable: amrAuthorized
  };
}
function normalizeCustomReason(text) {
  return (text ?? "").trim();
}
function odNextBlockedAnalyticsFromStrategyTask(strategyTask) {
  if (strategyTask?.terminal !== true) return {};
  if (strategyTask.outcome !== "blocked") return {};
  const primary = strategyTask.blockedContext?.reasonCodes?.[0];
  return typeof primary === "string" && primary ? { od_next_blocked_reason_code: primary } : {};
}
function harnessAnalyticsFromRolloutDecision(decision) {
  if (!decision || typeof decision.effectiveMode !== "string") return {};
  if (decision.effectiveMode === "active") return { harness: "od_next" };
  return {
    harness: "ordinary",
    ...typeof decision.primaryReasonCode === "string" && decision.primaryReasonCode ? { harness_fallback_reason: decision.primaryReasonCode } : {}
  };
}

// src/analytics/events/design-system-helpers.ts
function designSystemLengthBucket(text) {
  const length = (text ?? "").trim().length;
  if (length === 0) return "0";
  if (length <= 50) return "1_50";
  if (length <= 200) return "51_200";
  if (length <= 500) return "201_500";
  return "500_plus";
}
function designSystemFolderCountBucket(count2) {
  if (count2 === null || count2 === void 0 || !Number.isFinite(count2)) {
    return "unknown";
  }
  if (count2 <= 0) return "0";
  if (count2 <= 10) return "1_10";
  if (count2 <= 50) return "11_50";
  if (count2 <= 200) return "51_200";
  return "200_plus";
}
function designSystemTotalSizeBucket(bytes2) {
  if (bytes2 === null || bytes2 === void 0 || !Number.isFinite(bytes2)) {
    return "unknown";
  }
  const mb = bytes2 / (1024 * 1024);
  if (mb < 1) return "0_1mb";
  if (mb < 10) return "1_10mb";
  if (mb < 50) return "10_50mb";
  return "50mb_plus";
}
function designSystemModuleSlug(header) {
  const trimmed = (header ?? "").trim().replace(/^#+\s*/, "");
  if (!trimmed) return "unknown";
  return trimmed.toLowerCase().replace(/[^a-z0-9\s-]+/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "unknown";
}
function questionsFormTrackingId(raw) {
  const slug = (raw ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return slug || "unknown";
}
function designSystemModuleType(slug) {
  const s = (slug ?? "").toLowerCase();
  if (!s) return "other";
  if (/(typography|type|font)/.test(s)) return "typography";
  if (/(color|palette)/.test(s)) return "colors";
  if (/(spacing|layout|grid|radius|shadow|elevation)/.test(s)) {
    return "spacing";
  }
  if (/(component|button|input|form|icon|widget)/.test(s)) return "components";
  if (/(brand|asset|logo|image|illustration)/.test(s)) return "brand_assets";
  return "other";
}
function designSystemRepoHostFromUrl(url) {
  const raw = (url ?? "").trim();
  if (!raw) return "unknown";
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host === "github.com" || host.endsWith(".github.com")) return "github";
    if (host === "gitlab.com" || host.endsWith(".gitlab.com")) return "gitlab";
    return "other";
  } catch {
    return "unknown";
  }
}

// src/analytics/public-params.ts
var EVENT_SCHEMA_VERSION = 4;
var ANALYTICS_HEADER_DEVICE_ID = "x-od-analytics-device-id";
var ANALYTICS_HEADER_SESSION_ID = "x-od-analytics-session-id";
var ANALYTICS_HEADER_CLIENT_TYPE = "x-od-analytics-client-type";
var ANALYTICS_HEADER_LOCALE = "x-od-analytics-locale";
var ANALYTICS_HEADER_REQUEST_ID = "x-od-analytics-request-id";
var ANALYTICS_HEADER_ENTRY_SURFACE = "x-od-analytics-entry-surface";
var ANALYTICS_HEADER_HOST_PRODUCT = "x-od-analytics-host-product";
var ANALYTICS_HEADER_EXTERNAL_PLUGIN_ID = "x-od-analytics-external-plugin-id";
var ANALYTICS_HEADER_EXTERNAL_PLUGIN_VERSION = "x-od-analytics-external-plugin-version";
var ANALYTICS_HEADER_DISTRIBUTION_MECHANISM = "x-od-analytics-distribution-mechanism";
var ANALYTICS_HEADER_PUBLISHER_CLASS = "x-od-analytics-publisher-class";
var ANALYTICS_HEADER_ATTRIBUTION_QUALITY = "x-od-analytics-attribution-quality";
var ANALYTICS_HEADER_MCP_SESSION_ID = "x-od-analytics-mcp-session-id";

// src/analytics/artifact-id.ts
var FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
var FNV_PRIME = 0x100000001b3n;
var MASK_64 = 0xffffffffffffffffn;
function anonymizeArtifactId(args) {
  const input = `${args.projectId}:${args.fileName}`;
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = hash * FNV_PRIME & MASK_64;
  }
  return hash.toString(16).padStart(16, "0");
}

// src/analytics/observability.ts
var CLIENT_EXPERIENCE_DIAGNOSTIC_EVENT = "client_experience_diagnostic";
function parseClientExperienceDiagnostic(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value;
  const token2 = (x, max = 128) => typeof x === "string" && x.length > 0 && x.length <= max && /^[a-zA-Z0-9_.:-]+$/.test(x);
  if (!token2(v.occurrenceId, 512) || !token2(v.surface) || !token2(v.errorCode) || !["visible_error", "operation_failure", "project_failure", "runtime_failure"].includes(String(v.category)) || typeof v.observedAt !== "number" || !Number.isSafeInteger(v.observedAt) || v.observedAt <= 0) return null;
  for (const name of ["runId", "projectId", "conversationId", "status"]) {
    if (v[name] !== void 0 && !token2(v[name])) return null;
  }
  return {
    occurrenceId: v.occurrenceId,
    category: v.category,
    surface: v.surface,
    errorCode: v.errorCode,
    observedAt: v.observedAt,
    ...v.runId !== void 0 ? { runId: v.runId } : {},
    ...v.projectId !== void 0 ? { projectId: v.projectId } : {},
    ...v.conversationId !== void 0 ? { conversationId: v.conversationId } : {},
    ...v.status !== void 0 ? { status: v.status } : {}
  };
}

// src/analytics/client-observability.ts
import { z } from "zod";
var count = z.number().int().safe().nonnegative();
var ms = z.number().finite().nonnegative();
var responsivenessWindowFields = {
  measurement: z.enum(["long_task", "event_timing"]),
  measurable: z.boolean(),
  unavailable_reason: z.enum(["unsupported", "background_or_sleep"]).nullable(),
  window_ms: ms.nullable(),
  long_task_count: count.nullable().optional(),
  severe_task_count: count.nullable().optional(),
  max_duration_ms: ms.nullable().optional()
};
var inputResponsivenessFields = {
  area: z.enum(["composer", "search", "settings", "other_input"]),
  window_ms: ms,
  input_attempt_count: count,
  qualified_sample_count: count,
  over_500ms_count: count,
  max_input_to_presentation_ms: ms.nullable(),
  max_queue_delay_ms: ms.nullable(),
  sample_floor_ms: z.literal(16)
};
var scrollFrameFields = {
  measurable: z.boolean(),
  window_ms: ms.nullable(),
  frame_count: count.nullable(),
  interval_count: count.nullable(),
  over_50ms_count: count.nullable(),
  max_frame_interval_ms: ms.nullable(),
  sampling_truncated: z.boolean()
};
var responsivenessRecoveryFields = {
  recovery_id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9-]+$/),
  previous_occurred_at: z.string().datetime({ offset: true }),
  duration_ms: ms.nullable(),
  severe_task_count: count,
  reason: z.enum(["unclean_exit_unknown", "observed_severe_task"])
};
var daemonExitObservationSchema = z.object({
  process_instance_id: z.string().uuid(),
  app_session_id: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_.:-]+$/).nullable(),
  launch_attempt_id: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_.:-]+$/).nullable(),
  app_version: z.string().min(1).max(128).nullable(),
  occurred_at: z.string().datetime({ offset: true }),
  exit_code: z.number().int().nullable(),
  signal: z.string().max(24).regex(/^SIG[A-Z0-9]+$/).nullable(),
  reason: z.enum(["killed", "crash", "oom", "clean-exit", "unknown"]),
  delivered: z.boolean()
});

// src/analytics/run-schema-v4.ts
function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function booleanValue(value) {
  return typeof value === "boolean" ? value : void 0;
}
function stringArray(value) {
  if (!Array.isArray(value)) return void 0;
  return value.filter((item) => typeof item === "string" && item.length > 0);
}
function compact(value) {
  const entries = Object.entries(value).filter(([, item]) => item !== void 0);
  return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
function capabilitiesFromLegacy(legacy) {
  const skillIds = stringArray(legacy.skill_ids) ?? (stringValue(legacy.skill_id) ? [stringValue(legacy.skill_id)] : []);
  const mcpServerIds = stringArray(legacy.mcp_ids) ?? (stringValue(legacy.mcp_id) ? [stringValue(legacy.mcp_id)] : []);
  const pluginId = stringValue(legacy.plugin_id);
  return {
    ...pluginId ? { plugin_id: pluginId } : {},
    skill_ids: skillIds,
    mcp_server_ids: mcpServerIds
  };
}
function runContextFromLegacy(legacy) {
  return compact({
    session_run_index: numberValue(legacy.turn_index),
    project_run_index: numberValue(legacy.project_turn_index),
    has_existing_artifacts: booleanValue(legacy.has_existing_artifact),
    is_followup_run: booleanValue(legacy.is_followup_turn)
  });
}
function designSystemFromLegacy(legacy) {
  const selectionSource = stringValue(legacy.design_system_selection_source) ?? stringValue(legacy.design_system_source);
  if (!stringValue(legacy.design_system_id) && selectionSource === "not_applicable") {
    return void 0;
  }
  return compact({
    selection_source: selectionSource,
    edit_surface: stringValue(legacy.edit_surface),
    origin: stringValue(legacy.ds_source_origin),
    input_source_count: numberValue(legacy.source_count),
    has_brand_description: booleanValue(legacy.has_brand_description),
    brand_description_length_bucket: stringValue(legacy.brand_description_length_bucket),
    github_repo_count: numberValue(legacy.github_repo_count),
    local_folder_count: numberValue(legacy.local_folder_count),
    fig_file_count: numberValue(legacy.fig_file_count),
    asset_file_count: numberValue(legacy.asset_file_count)
  });
}
function tokensFromLegacy(legacy, overrides = {}) {
  const userQuery = numberValue(legacy.user_query_tokens);
  const providerInput = numberValue(legacy.input_tokens_provider);
  const effectiveInput = numberValue(legacy.input_tokens_effective);
  const output = numberValue(legacy.output_tokens);
  const cacheRead = numberValue(legacy.cache_read_input_tokens);
  const cacheWrite = numberValue(legacy.cache_creation_input_tokens);
  const total = numberValue(legacy.total_tokens);
  const cacheSource = stringValue(legacy.cache_token_source);
  const firstModelCall = overrides.firstModelCall ?? compact({
    provider_input_tokens: numberValue(legacy.first_call_input_tokens),
    cache_read_tokens: numberValue(legacy.first_call_cache_read_input_tokens)
  });
  return {
    usage_count_source: stringValue(legacy.token_count_source) ?? "unknown",
    ...cacheSource ? { cache_token_source: cacheSource } : {},
    ...overrides.inputAccountingMode ? { input_accounting_mode: overrides.inputAccountingMode } : {},
    ...userQuery !== void 0 ? { user_query_tokens: userQuery } : {},
    ...providerInput !== void 0 ? { provider_input_tokens: providerInput } : {},
    ...effectiveInput !== void 0 ? { effective_input_tokens: effectiveInput } : {},
    ...output !== void 0 ? { output_tokens: output } : {},
    ...providerInput === void 0 || output === void 0 ? total !== void 0 ? { total_tokens: total } : {} : {},
    ...cacheRead !== void 0 ? { cache_read_tokens: cacheRead } : {},
    ...cacheWrite !== void 0 ? { cache_write_tokens: cacheWrite } : {},
    ...firstModelCall ? { first_model_call: firstModelCall } : {}
  };
}
function buildRunCreatedV4Aliases(legacy, lineage) {
  const runContext = runContextFromLegacy(legacy);
  const capabilities = capabilitiesFromLegacy(legacy);
  const designSystem = designSystemFromLegacy(legacy);
  return {
    ...lineage,
    ...stringValue(legacy.entry_from) ? { entry_source: stringValue(legacy.entry_from) } : {},
    ...stringValue(legacy.session_mode) ? { interaction_mode: stringValue(legacy.session_mode) } : {},
    has_attachments: legacy.has_attachment === true,
    ...runContext ? { run_context: runContext } : {},
    ...capabilities ? { capabilities } : {},
    tokens: tokensFromLegacy(legacy),
    ...designSystem ? { design_system: designSystem } : {}
  };
}
function timingFromLegacy(legacy) {
  const queueDuration = numberValue(legacy.queue_duration_ms);
  const processSpawnDuration = numberValue(legacy.process_spawn_duration_ms);
  const firstModelEventDuration = numberValue(legacy.time_to_first_model_event_ms);
  const firstTokenDuration = numberValue(legacy.time_to_first_token_ms);
  const firstVisibleOutputDuration = numberValue(legacy.time_to_first_visible_output_ms);
  const firstArtifactDuration = numberValue(legacy.time_to_first_artifact_ms);
  const generationDuration = numberValue(legacy.generation_duration_ms);
  const modelActiveDuration = numberValue(legacy.model_active_duration_ms);
  const finalizeDuration = numberValue(legacy.finalize_duration_ms);
  const firstModelEventType = stringValue(legacy.first_model_event_type);
  const collectionStatus = stringValue(legacy.phase_timing_status);
  return {
    total_duration_ms: numberValue(legacy.total_duration_ms) ?? 0,
    ...queueDuration !== void 0 ? { queue_duration_ms: queueDuration } : {},
    ...processSpawnDuration !== void 0 ? { process_spawn_duration_ms: processSpawnDuration } : {},
    ...firstModelEventDuration !== void 0 ? { time_to_first_model_event_ms: firstModelEventDuration } : {},
    ...firstModelEventType ? { first_model_event_type: firstModelEventType } : {},
    ...firstTokenDuration !== void 0 ? { time_to_first_token_ms: firstTokenDuration } : {},
    ...firstVisibleOutputDuration !== void 0 ? { time_to_first_visible_output_ms: firstVisibleOutputDuration } : {},
    ...firstArtifactDuration !== void 0 ? { time_to_first_artifact_ms: firstArtifactDuration } : {},
    ...generationDuration !== void 0 ? { generation_duration_ms: generationDuration } : {},
    ...modelActiveDuration !== void 0 ? { model_active_duration_ms: modelActiveDuration } : {},
    ...finalizeDuration !== void 0 ? { finalize_duration_ms: finalizeDuration } : {},
    ...collectionStatus ? { collection_status: collectionStatus } : {}
  };
}
function automaticRetryFromLegacy(legacy) {
  const retryCount = numberValue(legacy.retry_attempt_count);
  const outcome = stringValue(legacy.retry_final_result);
  if (retryCount === void 0 && !outcome) return void 0;
  const attemptIndex = numberValue(legacy.attempt_index);
  const attemptDuration = numberValue(legacy.attempt_duration_ms);
  const attemptFirstToken = numberValue(legacy.attempt_time_to_first_token_ms);
  const lastAttempt = attemptIndex !== void 0 || attemptDuration !== void 0 || attemptFirstToken !== void 0 ? {
    ...attemptIndex !== void 0 ? { index: attemptIndex } : {},
    ...attemptDuration !== void 0 ? { duration_ms: attemptDuration } : {},
    ...attemptFirstToken !== void 0 ? { time_to_first_token_ms: attemptFirstToken } : {}
  } : void 0;
  const suppressedReason = stringValue(legacy.retry_suppressed_reason);
  return {
    retry_count: retryCount ?? 0,
    outcome: outcome ?? "not_attempted",
    ...suppressedReason ? { suppressed_reason: suppressedReason } : {},
    ...lastAttempt ? { last_attempt: lastAttempt } : {}
  };
}
function runActivityFromLegacy(legacy, artifactFiles) {
  const tools = compact({
    call_count: numberValue(legacy.tool_call_count),
    duration_ms: numberValue(legacy.tool_duration_ms)
  });
  const legacyArtifacts = compact({
    changed_file_count: numberValue(legacy.artifact_count),
    created_file_count: numberValue(legacy.artifacts_created),
    modified_file_count: numberValue(legacy.artifacts_modified),
    write_duration_ms: numberValue(legacy.artifact_write_duration_ms),
    write_status: stringValue(legacy.artifact_write_status),
    write_source: stringValue(legacy.artifact_write_source)
  });
  const artifacts = artifactFiles ? { ...legacyArtifacts ?? {}, ...artifactFiles } : legacyArtifacts;
  if (!tools && !artifacts) return void 0;
  return {
    ...tools ? { tools } : {},
    ...artifacts ? { artifacts } : {}
  };
}
function diagnosticsFromLegacy(legacy) {
  if (legacy.result === "success") return void 0;
  const runtimeTiming = compact({
    pre_spawn_duration_ms: numberValue(legacy.pre_spawn_duration_ms),
    prompt_build_duration_ms: numberValue(legacy.prompt_build_duration_ms),
    launch_preflight_duration_ms: numberValue(legacy.launch_preflight_duration_ms),
    stdin_write_duration_ms: numberValue(legacy.stdin_write_duration_ms),
    runtime_init_to_first_token_ms: numberValue(legacy.runtime_init_to_first_token_ms),
    runtime_init_to_first_model_response_ms: numberValue(legacy.runtime_init_to_first_model_response_ms),
    spawn_to_first_token_ms: numberValue(legacy.spawn_to_first_token_ms),
    cli_ready_ms: numberValue(legacy.cli_ready_ms),
    session_init_ms: numberValue(legacy.session_init_ms),
    model_first_token_ms: numberValue(legacy.model_first_token_ms)
  });
  return compact({
    failure_signal_source: stringValue(legacy.diagnostic_source),
    run_close_reason: stringValue(legacy.rpc_close_reason),
    last_observed_phase: stringValue(legacy.last_observed_phase),
    stderr_line_count_bucket: stringValue(legacy.stderr_line_count_bucket),
    stdout_line_count_bucket: stringValue(legacy.stdout_line_count_bucket),
    first_token_seen: booleanValue(legacy.first_token_seen),
    user_visible_output_seen: booleanValue(legacy.user_visible_output_seen),
    tool_call_seen: booleanValue(legacy.tool_call_seen),
    artifact_write_seen: booleanValue(legacy.artifact_write_seen),
    live_artifact_seen: booleanValue(legacy.live_artifact_seen),
    session_resume_fallback_used: booleanValue(legacy.resume_auto_reseeded),
    runtime_timing: runtimeTiming
  });
}
function langfuseDeliveryFromLegacy(legacy) {
  const status = stringValue(legacy.langfuse_delivery_status);
  if (!status) return void 0;
  const dropReason = stringValue(legacy.langfuse_drop_reason);
  return {
    delivery_status: status,
    ...dropReason ? { drop_reason: dropReason } : {}
  };
}
function buildRunFinishedV4Aliases(legacy, lineage, overrides = {}) {
  const created = buildRunCreatedV4Aliases(legacy, lineage);
  const previewModuleCount = numberValue(legacy.preview_module_count);
  const missingFontCount = numberValue(legacy.missing_font_count);
  const designSystem = created.design_system ? {
    ...created.design_system,
    ...overrides.designSystemChangeType ? { change_type: overrides.designSystemChangeType } : {},
    ...previewModuleCount !== void 0 ? { preview_module_count: previewModuleCount } : {},
    ...missingFontCount !== void 0 ? { missing_font_count: missingFontCount } : {}
  } : void 0;
  const failureReason = stringValue(legacy.failure_detail);
  const retryEligible = booleanValue(legacy.retryable);
  const automaticRetry = automaticRetryFromLegacy(legacy);
  const runActivity = runActivityFromLegacy(legacy, overrides.artifactFiles);
  const diagnostics = diagnosticsFromLegacy(legacy);
  const langfuseDelivery = langfuseDeliveryFromLegacy(legacy);
  return {
    ...created,
    tokens: tokensFromLegacy(legacy, overrides),
    ...designSystem ? { design_system: designSystem } : {},
    ...failureReason ? { failure_reason: failureReason } : {},
    ...retryEligible !== void 0 ? { is_automatic_retry_eligible: retryEligible } : {},
    clarification_requested: legacy.asked_user_question === true,
    ...overrides.primaryArtifactChange ? { primary_artifact_change: overrides.primaryArtifactChange } : {},
    timing: timingFromLegacy(legacy),
    ...automaticRetry ? { automatic_retry: automaticRetry } : {},
    ...runActivity ? { run_activity: runActivity } : {},
    ...diagnostics ? { diagnostics } : {},
    ...langfuseDelivery ? { langfuse_delivery: langfuseDelivery } : {}
  };
}

// src/analytics/update-lifecycle.ts
import { z as z2 } from "zod";
var UPDATE_LIFECYCLE_STAGES = [
  "install_requested",
  "shutdown_started",
  "renderer_quiesced",
  "shutdown_completed",
  "cleanup_daemon",
  "cleanup_web",
  "predecessor_wait_started",
  "predecessor_wait_completed",
  "desktop_ready"
];
function parseUpdateLifecycleObservation(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value;
  if (!UPDATE_LIFECYCLE_STAGES.includes(record.stage) || !["started", "completed", "forced", "failed"].includes(String(record.outcome))) return null;
  const result = {
    stage: record.stage,
    outcome: record.outcome
  };
  for (const key of ["duration_ms", "repeated_quit_count", "forced_process_count", "remaining_process_count"]) {
    const value2 = record[key];
    if (value2 !== void 0) {
      if (typeof value2 !== "number" || !Number.isSafeInteger(value2) || value2 < 0 || value2 > 6048e5) return null;
      result[key] = value2;
    }
  }
  return result;
}
var UPDATE_METRIC_STAGES = ["check", "download", "verify", "install_verify", "install_open", "restart"];
var updateStageMetricFields = {
  flow_id: z2.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
  stage: z2.enum(UPDATE_METRIC_STAGES),
  result: z2.enum(["started", "success", "failed", "cancelled", "unknown", "not_applied"]),
  reason_code: z2.enum([
    "check_failed",
    "download_failed",
    "download_incomplete",
    "checksum_mismatch",
    "verification_failed",
    "install_open_failed",
    "operation_failed",
    "version_matches",
    "version_unchanged",
    "same_version_reinstall",
    "identity_mismatch",
    "expired",
    "interrupted",
    "legacy_observation",
    "cancelled"
  ]).nullable(),
  from_version: z2.string().max(128).regex(/^v?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/).nullable(),
  to_version: z2.string().max(128).regex(/^v?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/).nullable(),
  update_path: z2.enum(["installer", "payload"]).nullable(),
  artifact_type: z2.enum(["dmg", "installer", "payload"]).nullable(),
  trigger: z2.enum(["manual", "silent", "unknown"]),
  duration_ms: z2.number().finite().nonnegative().nullable()
};
var updateStageMetricSchema = z2.object(updateStageMetricFields);

// src/analytics/client-metrics.ts
import { z as z3 } from "zod";
import { releaseChannelFromVersion } from "@open-design/release";
var CLIENT_METRIC_SCHEMA_VERSION = 1;
var token = z3.string().min(1).max(128).regex(/^[a-zA-Z0-9_.:-]+$/);
var time = z3.string().datetime({ offset: true });
var measurement = z3.number().finite().nonnegative();
var bytes = measurement.int().safe().nullable();
var version = z3.string().trim().min(1).max(128).refine((value) => value !== "0.0.0" && value !== "unknown");
var clientTelemetryCommonSchema = z3.object({
  event_schema_version: z3.literal(4),
  event_id: token,
  device_id: token.nullable(),
  app_session_id: token.nullable(),
  user_id: token.optional(),
  client_type: z3.enum(["web", "desktop", "daemon", "external_mcp"]),
  capture_source: z3.string().min(1).max(64).regex(/^[a-zA-Z0-9_/-]+$/),
  env: token,
  channel: token,
  app_version: version.nullable(),
  client_version: version.nullable(),
  platform: token.nullable(),
  // Product OS version (e.g. Electron getSystemVersion), never a Darwin/Linux
  // kernel release relabelled as a product version. Null when unavailable.
  os_version: z3.string().min(1).max(128).nullable(),
  arch: token.nullable(),
  occurred_at: time,
  reported_at: time
});
var metricCommonSchema = clientTelemetryCommonSchema.extend({
  metric_schema_version: z3.literal(CLIENT_METRIC_SCHEMA_VERSION),
  telemetry_capability: z3.enum(["supported", "unsupported", "unknown"])
});
var launchFields = {
  launch_attempt_id: token,
  startup_type: z3.enum(["cold", "warm", "reopen"]),
  launch_type: z3.enum(["cold", "warm"]).optional(),
  // process_entry is NOT icon click time. os_launch requires a real OS timestamp.
  measurement_boundary: z3.enum(["process_entry", "os_launch"]),
  started_at: time
};
var launchAttemptSchema = metricCommonSchema.extend(launchFields);
var launchDurations = {
  launch_to_window_shown: measurement.optional(),
  launch_to_first_visible: measurement.optional(),
  launch_to_interactive: measurement.optional(),
  stage_offsets_ms: z3.record(measurement).optional(),
  stage_durations_ms: z3.record(measurement).optional()
};
var businessReadySchema = launchAttemptSchema.extend({ duration_ms: measurement, ...launchDurations });
var launchResultSchema = launchAttemptSchema.extend({
  ...launchDurations,
  result: z3.enum(["ready", "failed", "cancelled", "unknown"]),
  duration_ms: measurement.nullable(),
  reason_code: token.optional()
}).refine((value) => value.result !== "ready" || value.duration_ms !== null);
var navigationSchema = metricCommonSchema.extend({
  navigation_id: token,
  navigation_type: z3.enum(["project_enter", "conversation_switch", "page_switch"]),
  source_type: z3.enum(["home", "project", "conversation", "page", "unknown"]),
  target_type: z3.enum(["home", "project", "conversation", "page"]),
  result: z3.enum(["started", "first_visible", "ready", "cancelled", "failed"]),
  readiness_point: z3.enum(["first_visible", "interactive_ready"]).optional(),
  started_at: time,
  duration_ms: measurement.nullable(),
  reason_code: token.optional(),
  source_page: token.optional(),
  target_page: token.optional()
}).refine((value) => value.result !== "ready" || value.duration_ms !== null);
var previewAttemptSchema = metricCommonSchema.extend({
  preview_attempt_id: token,
  render_mode: z3.enum(["srcdoc", "url_load", "live_artifact"]),
  artifact_kind: token.nullable(),
  started_at: time
});
var previewResultSchema = previewAttemptSchema.extend({
  result: z3.enum(["success", "white_screen", "error", "cancelled"]),
  duration_ms: measurement.nullable(),
  monitoring_kind: z3.enum(["visible_content", "no_visible_paint_after_timeout", "srcdoc_transport_unverified", "preview_error", "left_or_hidden", "probe_unverified"])
});
var memorySchema = metricCommonSchema.extend({
  process_role: z3.enum(["main", "renderer", "gpu", "utility", "daemon"]),
  // Opaque per-process identifier, never a raw PID or filesystem path.
  process_instance_id: token,
  uptime_ms: measurement,
  rss_bytes: bytes,
  heap_used_bytes: bytes,
  heap_limit_bytes: bytes.optional(),
  external_bytes: bytes,
  sampled_at: time,
  sampling_interval_ms: z3.number().finite().positive()
});
function classifyProcessExit(reason) {
  if (reason === "crashed" || reason === "crash" || reason === "abnormal-exit" || reason === "fatal_error") return "crash";
  if (reason === "oom" || reason === "killed" || reason === "clean-exit" || reason === "recovery-attempt") return reason;
  return "unknown";
}
var PROCESS_EXIT_EVENTS = ["desktop_renderer_crash", "desktop_child_process_crash", "desktop_unclean_exit", "daemon_unclean_exit", "packaged_runtime_failed"];
function isProcessExitEventName(event) {
  return PROCESS_EXIT_EVENTS.includes(event);
}
var processExitSchema = metricCommonSchema.extend({
  launch_attempt_id: token.nullable(),
  process_instance_id: token.nullable().optional(),
  signal: z3.string().max(24).regex(/^SIG[A-Z0-9]+$/).nullable().optional(),
  previous_app_version: version.nullable(),
  process_role: z3.enum(["main", "renderer", "gpu", "utility", "daemon", "web", "unknown"]),
  reason: z3.enum(["crash", "oom", "killed", "clean-exit", "recovery-attempt", "unknown"]),
  source_event: z3.enum(PROCESS_EXIT_EVENTS),
  exit_code: z3.number().int().nullable(),
  recovery_suppressed: z3.boolean(),
  occurrence_time_source: z3.enum(["observed", "last_checkpoint", "unknown"]),
  is_backfill: z3.boolean()
});
function processExitMetricFields(event, props) {
  const backfill = event === "desktop_unclean_exit" || event === "daemon_unclean_exit";
  const priorVersion = version.safeParse(props.previous_app_version ?? props.previous_version);
  const role = event === "desktop_renderer_crash" ? "renderer" : event === "daemon_unclean_exit" ? "daemon" : event === "desktop_child_process_crash" ? props.process_type === "GPU" ? "gpu" : props.process_type === "Utility" ? "utility" : "unknown" : event === "packaged_runtime_failed" ? props.failure_kind === "daemon-start" ? "daemon" : props.failure_kind === "web-start" ? "web" : "unknown" : "main";
  return {
    metric_schema_version: CLIENT_METRIC_SCHEMA_VERSION,
    telemetry_capability: "supported",
    launch_attempt_id: props.launch_attempt_id ?? null,
    previous_app_version: backfill && priorVersion.success ? priorVersion.data : null,
    process_role: role,
    reason: classifyProcessExit(props.exit_reason ?? props.reason ?? props.exit_class),
    source_event: event,
    exit_code: typeof props.exit_code === "number" ? props.exit_code : null,
    recovery_suppressed: props.recovery_suppressed === true || props.loop_tripped === true,
    occurrence_time_source: props.occurrence_time_source ?? (backfill ? "unknown" : "observed"),
    is_backfill: typeof props.is_backfill === "boolean" ? props.is_backfill : backfill,
    ...props.process_instance_id !== void 0 ? { process_instance_id: props.process_instance_id } : {},
    ...props.signal !== void 0 ? { signal: props.signal } : {}
  };
}
var CLIENT_METRIC_SCHEMAS = {
  client_process_exit: processExitSchema,
  client_update_stage_result: metricCommonSchema.extend(updateStageMetricFields),
  client_responsiveness_window: metricCommonSchema.extend(responsivenessWindowFields),
  client_input_responsiveness: metricCommonSchema.extend(inputResponsivenessFields).refine((value) => value.over_500ms_count <= value.qualified_sample_count),
  client_chat_scroll_frames: metricCommonSchema.extend(scrollFrameFields),
  client_responsiveness_recovery: metricCommonSchema.extend(responsivenessRecoveryFields),
  client_launch_attempt: launchAttemptSchema,
  client_business_ready: businessReadySchema,
  client_launch_result: launchResultSchema,
  client_navigation_result: navigationSchema,
  client_process_memory_sample: memorySchema,
  client_preview_attempt: previewAttemptSchema,
  client_preview_result: previewResultSchema
};
function isClientMetricEventName(event) {
  return Object.hasOwn(CLIENT_METRIC_SCHEMAS, event);
}
function parseClientMetricEvent(event, properties) {
  if (!isClientMetricEventName(event)) return null;
  const parsed = CLIENT_METRIC_SCHEMAS[event].safeParse(properties);
  return parsed.success ? parsed.data : null;
}
function buildClientTelemetryParams(source, defaults) {
  const text = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
  const resolvedVersion = (value) => {
    const parsed = version.safeParse(value);
    return parsed.success ? parsed.data : null;
  };
  const appVersion = defaults.preserveUnknownAppVersion && source.app_version === null ? null : resolvedVersion(source.app_version) ?? resolvedVersion(defaults.appVersion);
  const occurred = time.safeParse(source.occurred_at);
  return {
    event_schema_version: 4,
    event_id: text(source.event_id) ?? defaults.eventId,
    device_id: text(source.device_id) ?? defaults.deviceId,
    app_session_id: text(source.app_session_id) ?? defaults.appSessionId ?? null,
    ...token.safeParse(source.user_id).success ? { user_id: source.user_id } : {},
    client_type: clientTelemetryCommonSchema.shape.client_type.safeParse(source.client_type).success ? source.client_type : defaults.clientType,
    capture_source: text(source.capture_source) ?? defaults.captureSource,
    env: defaults.env,
    channel: text(source.channel) ?? defaults.channel ?? (appVersion ? releaseChannelFromVersion(appVersion) : null) ?? (defaults.env === "production" && appVersion ? "stable" : defaults.env === "development" || defaults.env === "test" ? "development" : "unknown"),
    app_version: appVersion,
    client_version: resolvedVersion(source.client_version) ?? appVersion,
    platform: text(source.platform) ?? defaults.platform ?? null,
    os_version: text(source.os_version) ?? defaults.osVersion ?? null,
    arch: text(source.arch) ?? defaults.arch ?? null,
    occurred_at: occurred.success ? occurred.data : defaults.occurredAt ?? defaults.reportedAt,
    reported_at: defaults.reportedAt
  };
}

// src/analytics/media-stock.ts
var MEDIA_STOCK_BATCH_LIMITS = { events: 240, bytes: 512 * 1024 };

// src/analytics/share-observation.ts
function publishReceiptObservation(value) {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const receipt = value;
    const version2 = receipt.version;
    const publishedAt = receipt.publishedAt;
    return {
      ...typeof version2 === "number" && Number.isSafeInteger(version2) && version2 > 0 ? { share_version: version2 } : {},
      ...typeof publishedAt === "number" && Number.isSafeInteger(publishedAt) && publishedAt >= 0 ? { published_at: publishedAt } : {}
    };
  } catch {
    return {};
  }
}
function savedCommentIds(value) {
  try {
    if (!Array.isArray(value)) return void 0;
    const ids = /* @__PURE__ */ new Set();
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const attachment = item;
      if (attachment.source === "saved-comment" && typeof attachment.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(attachment.id)) ids.add(attachment.id);
    }
    return [...ids];
  } catch {
    return void 0;
  }
}
export {
  ANALYTICS_HEADER_ATTRIBUTION_QUALITY,
  ANALYTICS_HEADER_CLIENT_TYPE,
  ANALYTICS_HEADER_DEVICE_ID,
  ANALYTICS_HEADER_DISTRIBUTION_MECHANISM,
  ANALYTICS_HEADER_ENTRY_SURFACE,
  ANALYTICS_HEADER_EXTERNAL_PLUGIN_ID,
  ANALYTICS_HEADER_EXTERNAL_PLUGIN_VERSION,
  ANALYTICS_HEADER_HOST_PRODUCT,
  ANALYTICS_HEADER_LOCALE,
  ANALYTICS_HEADER_MCP_SESSION_ID,
  ANALYTICS_HEADER_PUBLISHER_CLASS,
  ANALYTICS_HEADER_REQUEST_ID,
  ANALYTICS_HEADER_SESSION_ID,
  CLIENT_EXPERIENCE_DIAGNOSTIC_EVENT,
  CLIENT_METRIC_SCHEMAS,
  CLIENT_METRIC_SCHEMA_VERSION,
  EVENT_SCHEMA_VERSION,
  MEDIA_STOCK_BATCH_LIMITS,
  PROCESS_EXIT_EVENTS,
  TRACKING_HANDOFF_TARGET_IDS,
  UPDATE_LIFECYCLE_STAGES,
  UPDATE_METRIC_STAGES,
  agentIdToTracking,
  anonymizeArtifactId,
  artifactKindToTracking,
  buildArtifactFocusTelemetry,
  buildClientTelemetryParams,
  buildRunCreatedV4Aliases,
  buildRunFinishedV4Aliases,
  byokProtocolToTracking,
  classifyProcessExit,
  clientTelemetryCommonSchema,
  createTabToTracking,
  daemonExitObservationSchema,
  deriveConfigureGlobals,
  designSystemFolderCountBucket,
  designSystemLengthBucket,
  designSystemModuleSlug,
  designSystemModuleType,
  designSystemRepoHostFromUrl,
  designSystemTotalSizeBucket,
  executionModeToTracking,
  feedbackAgentProviderIdToTracking,
  fidelityToTracking,
  fileSizeBucketToTracking,
  fileTypeToTracking,
  handoffTargetIdToTracking,
  harnessAnalyticsFromRolloutDecision,
  inputResponsivenessFields,
  isClientMetricEventName,
  isProcessExitEventName,
  modelIdForTracking,
  normalizeCustomReason,
  odNextBlockedAnalyticsFromStrategyTask,
  parseClientExperienceDiagnostic,
  parseClientMetricEvent,
  parseUpdateLifecycleObservation,
  processExitMetricFields,
  projectKindFromMetadataToTracking,
  projectKindFromMetadataToTrackingOrLegacyDefault,
  projectKindToTracking,
  publishReceiptObservation,
  questionsFormTrackingId,
  responsivenessRecoveryFields,
  responsivenessWindowFields,
  savedCommentIds,
  scrollFrameFields,
  sessionModeToTracking,
  settingsSectionToTracking,
  updateStageMetricFields,
  updateStageMetricSchema
};
