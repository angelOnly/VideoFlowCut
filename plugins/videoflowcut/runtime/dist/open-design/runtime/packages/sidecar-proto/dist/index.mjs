// src/index.ts
import { RELEASE_CHANNELS } from "@open-design/release";
var APP_KEYS = Object.freeze({
  DAEMON: "daemon",
  DESKTOP: "desktop",
  WEB: "web"
});
var SIDECAR_MODES = Object.freeze({
  DEV: "dev",
  RUNTIME: "runtime"
});
var SIDECAR_SOURCES = Object.freeze({
  PACKAGED: "packaged",
  TOOLS_DEV: "tools-dev",
  TOOLS_PACK: "tools-pack"
});
var SIDECAR_ENV = Object.freeze({
  BASE: "OD_SIDECAR_BASE",
  DAEMON_CLI_PATH: "OD_DAEMON_CLI_PATH",
  DAEMON_PORT: "OD_PORT",
  IPC_BASE: "OD_SIDECAR_IPC_BASE",
  IPC_PATH: "OD_SIDECAR_IPC_PATH",
  NAMESPACE: "OD_SIDECAR_NAMESPACE",
  SOURCE: "OD_SIDECAR_SOURCE",
  TOOLS_DEV_PARENT_PID: "OD_TOOLS_DEV_PARENT_PID",
  WEB_DIST_DIR: "OD_WEB_DIST_DIR",
  WEB_PORT: "OD_WEB_PORT",
  WEB_TSCONFIG_PATH: "OD_WEB_TSCONFIG_PATH"
});
var MCP_BOOTSTRAP_CONTRACT = Object.freeze({
  /** Appended to OD_MCP_BOOTSTRAP_ARGS by a managed outer. */
  MANAGED_ARG: "--od-mcp-managed",
  /**
   * JSON `{ daemon: string[]; desktop: string[] }` of absolute sidecar client
   * endpoints for every mode of the registering namespace. They are resolved by
   * the daemon because the MCP process may not share its TMPDIR.
   */
  DISCOVERY_ENV: "OD_MCP_DISCOVERY"
});
var SIDECAR_RUNTIME_ENV = Object.freeze({
  base: SIDECAR_ENV.BASE,
  ipcBase: SIDECAR_ENV.IPC_BASE,
  ipcPath: SIDECAR_ENV.IPC_PATH,
  namespace: SIDECAR_ENV.NAMESPACE,
  source: SIDECAR_ENV.SOURCE
});
var SIDECAR_STAMP_FLAGS = Object.freeze({
  app: "--od-stamp-app",
  ipc: "--od-stamp-ipc",
  mode: "--od-stamp-mode",
  namespace: "--od-stamp-namespace",
  source: "--od-stamp-source"
});
var STAMP_APP_FLAG = SIDECAR_STAMP_FLAGS.app;
var STAMP_IPC_FLAG = SIDECAR_STAMP_FLAGS.ipc;
var STAMP_MODE_FLAG = SIDECAR_STAMP_FLAGS.mode;
var STAMP_NAMESPACE_FLAG = SIDECAR_STAMP_FLAGS.namespace;
var STAMP_SOURCE_FLAG = SIDECAR_STAMP_FLAGS.source;
var SIDECAR_STAMP_FIELDS = ["app", "mode", "namespace", "ipc", "source"];
var SIDECAR_DEFAULTS = Object.freeze({
  host: "127.0.0.1",
  ipcBase: "/tmp/open-design/ipc",
  namespace: "default",
  projectTmpDirName: ".tmp",
  windowsPipePrefix: "open-design"
});
var OPEN_DESIGN_PRODUCT_NAME = "Open Design";
function resolveWindowsReleaseNamespaceToken(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}
function resolveWindowsUninstallRegistryKey(namespace) {
  const namespaceToken = resolveWindowsReleaseNamespaceToken(namespace);
  return `Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${OPEN_DESIGN_PRODUCT_NAME}-${namespaceToken}`;
}
var SIDECAR_MESSAGES = Object.freeze({
  CLICK: "click",
  CONSOLE: "console",
  EVAL: "eval",
  EXPORT_ARTIFACT: "export-artifact",
  EXPORT_PDF: "export-pdf",
  MINT_IMPORT_TOKEN: "mint-import-token",
  REGISTER_DESKTOP_AUTH: "register-desktop-auth",
  REGISTER_WEB_URL: "register-web-url",
  RENDER_FRAMES: "render-frames",
  RENDER_SLIDES: "render-slides",
  SCREENSHOT: "screenshot",
  SHUTDOWN: "shutdown",
  SHOW: "show",
  STATUS: "status",
  UPDATE: "update"
});
var DESKTOP_UPDATE_ACTIONS = Object.freeze({
  CHECK: "check",
  CLEAR_CACHE: "clear-cache",
  DOWNLOAD: "download",
  INSTALL: "install",
  STATUS: "status"
});
var DESKTOP_UPDATE_MODES = Object.freeze({
  JS_INCREMENTAL: "js-incremental",
  PACKAGE_LAUNCHER: "package-launcher"
});
var DESKTOP_UPDATE_CHANNELS = Object.freeze({
  BETA: RELEASE_CHANNELS.BETA,
  PRERELEASE: RELEASE_CHANNELS.PRERELEASE,
  STABLE: RELEASE_CHANNELS.STABLE
});
var DESKTOP_UPDATE_STATES = Object.freeze({
  AVAILABLE: "available",
  CHECKING: "checking",
  DOWNLOADED: "downloaded",
  DOWNLOADING: "downloading",
  ERROR: "error",
  IDLE: "idle",
  INSTALLING: "installing",
  NOT_AVAILABLE: "not-available",
  UNSUPPORTED: "unsupported"
});
var SIDECAR_ERROR_CODES = Object.freeze({
  INVALID_MESSAGE: "SIDECAR_INVALID_MESSAGE",
  UNKNOWN_MESSAGE: "SIDECAR_UNKNOWN_MESSAGE"
});
var SidecarContractError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "SidecarContractError";
    this.code = code;
  }
};
var DESKTOP_ARTIFACT_CAPTURE_MODES = Object.freeze({
  FIRST_VIEWPORT_THUMBNAIL: "first_viewport_thumbnail",
  FULL_PAGE_EXPORT: "full_page_export"
});
var DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES = Object.freeze({
  BLANK_CAPTURE: "capture_blank",
  RENDER_TIMEOUT: "render_timeout",
  UNSUPPORTED_CAPTURE_MODE: "unsupported_capture_mode"
});
var DESKTOP_UPDATE_REINSTALL_REASONS = Object.freeze({
  LAUNCHER_SCHEMA: "launcher-schema",
  OUTER_BELOW_MIN: "outer-below-min",
  OUTER_VERSION_UNREADABLE: "outer-version-unreadable"
});
function assertObject(value, label) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}
function assertKnownKeys(value, allowed, label) {
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unexpected.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unexpected.join(", ")}`);
  }
}
function normalizeNonEmptyString(value, label) {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  if (value.length === 0) throw new Error(`${label} must not be empty`);
  return value;
}
function normalizeNamespace(namespace) {
  if (typeof namespace !== "string") throw new Error("namespace must be a string");
  const value = namespace.trim();
  if (value.length === 0) throw new Error("namespace must not be empty");
  if (value !== namespace) throw new Error("namespace must not contain leading or trailing whitespace");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) {
    throw new Error(`namespace contains unsupported characters: ${value}`);
  }
  if (/[\\/]/.test(value)) throw new Error(`namespace must not contain path separators: ${value}`);
  return value;
}
function isSidecarMode(value) {
  return Object.values(SIDECAR_MODES).includes(value);
}
function normalizeSidecarMode(mode) {
  if (!isSidecarMode(mode)) {
    throw new Error("sidecar mode must be dev or runtime");
  }
  return mode;
}
function isAppKey(value) {
  return Object.values(APP_KEYS).includes(value);
}
function normalizeAppKey(app) {
  if (!isAppKey(app)) throw new Error(`unsupported sidecar app: ${String(app)}`);
  return app;
}
function isSidecarSource(value) {
  return Object.values(SIDECAR_SOURCES).includes(value);
}
function normalizeSidecarSource(source) {
  if (!isSidecarSource(source)) {
    throw new Error(`unsupported sidecar source: ${String(source)}`);
  }
  return source;
}
function isWindowsNamedPipePath(value) {
  return typeof value === "string" && value.startsWith("\\\\.\\pipe\\");
}
function normalizeIpcPath(ipc) {
  if (typeof ipc !== "string") throw new Error("sidecar ipc path must be a string");
  if (ipc.length === 0) throw new Error("sidecar ipc path must not be empty");
  if (ipc.trim() !== ipc) throw new Error("sidecar ipc path must not contain leading or trailing whitespace");
  if (ipc.includes("\0")) throw new Error("sidecar ipc path must not contain null bytes");
  if (isWindowsNamedPipePath(ipc)) return ipc;
  if (!ipc.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(ipc)) {
    throw new Error(`sidecar ipc path must be absolute: ${ipc}`);
  }
  return ipc;
}
function assertKnownStampKeys(value, label) {
  assertKnownKeys(value, SIDECAR_STAMP_FIELDS, label);
}
function normalizeSidecarRuntimeLayout(input) {
  const value = assertObject(input, "sidecar stamp");
  assertKnownStampKeys(value, "sidecar stamp");
  return {
    app: normalizeAppKey(value.app),
    ipc: normalizeIpcPath(value.ipc),
    mode: normalizeSidecarMode(value.mode),
    namespace: normalizeNamespace(value.namespace),
    source: normalizeSidecarSource(value.source)
  };
}
function normalizeSidecarRuntimeLayoutCriteria(input = {}) {
  const value = assertObject(input, "sidecar stamp criteria");
  assertKnownStampKeys(value, "sidecar stamp criteria");
  return {
    ...value.app == null ? {} : { app: normalizeAppKey(value.app) },
    ...value.ipc == null ? {} : { ipc: normalizeIpcPath(value.ipc) },
    ...value.mode == null ? {} : { mode: normalizeSidecarMode(value.mode) },
    ...value.namespace == null ? {} : { namespace: normalizeNamespace(value.namespace) },
    ...value.source == null ? {} : { source: normalizeSidecarSource(value.source) }
  };
}
function normalizeDesktopEvalInput(input) {
  const value = assertObject(input, "desktop eval input");
  assertKnownKeys(value, ["expression"], "desktop eval input");
  return { expression: normalizeNonEmptyString(value.expression, "desktop eval expression") };
}
function normalizeDesktopScreenshotInput(input) {
  const value = assertObject(input, "desktop screenshot input");
  assertKnownKeys(value, ["path"], "desktop screenshot input");
  return { path: normalizeNonEmptyString(value.path, "desktop screenshot path") };
}
function normalizeDesktopClickInput(input) {
  const value = assertObject(input, "desktop click input");
  assertKnownKeys(value, ["selector"], "desktop click input");
  return { selector: normalizeNonEmptyString(value.selector, "desktop click selector") };
}
function normalizeRegisterDesktopAuthInput(input) {
  const value = assertObject(input, "register-desktop-auth input");
  assertKnownKeys(value, ["secret"], "register-desktop-auth input");
  const secret = normalizeNonEmptyString(value.secret, "register-desktop-auth secret");
  if (!/^[A-Za-z0-9+/_=-]+$/.test(secret)) {
    throw new Error("register-desktop-auth secret must be base64-encoded");
  }
  return { secret };
}
function normalizeMintImportTokenInput(input) {
  const value = assertObject(input, "mint-import-token input");
  assertKnownKeys(value, ["baseDir"], "mint-import-token input");
  return { baseDir: normalizeNonEmptyString(value.baseDir, "mint-import-token baseDir") };
}
function normalizeRegisterWebUrlInput(input) {
  const value = assertObject(input, "register-web-url input");
  assertKnownKeys(value, ["url"], "register-web-url input");
  const raw = normalizeNonEmptyString(value.url, "register-web-url url");
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("register-web-url url must be an absolute URL");
  }
  if (parsed.protocol !== "http:") {
    throw new Error("register-web-url url must use HTTP");
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "127.0.0.1" && hostname !== "localhost" && hostname !== "[::1]") {
    throw new Error("register-web-url url must use a loopback host");
  }
  const port = Number(parsed.port);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("register-web-url url must include a valid explicit port");
  }
  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("register-web-url url must be a bare origin");
  }
  return { url: parsed.origin };
}
function normalizeBoolean(value, label) {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean`);
  return value;
}
function normalizeDesktopExportPdfInput(input) {
  const value = assertObject(input, "desktop PDF export input");
  assertKnownKeys(value, ["baseHref", "deck", "defaultFilename", "html", "title"], "desktop PDF export input");
  return {
    ...value.baseHref == null ? {} : { baseHref: normalizeNonEmptyString(value.baseHref, "desktop PDF export baseHref") },
    deck: normalizeBoolean(value.deck, "desktop PDF export deck"),
    defaultFilename: normalizeNonEmptyString(value.defaultFilename, "desktop PDF export defaultFilename"),
    html: normalizeNonEmptyString(value.html, "desktop PDF export html"),
    title: normalizeNonEmptyString(value.title, "desktop PDF export title")
  };
}
function normalizeDesktopRenderSlidesInput(input) {
  const value = assertObject(input, "desktop render slides input");
  assertKnownKeys(value, ["baseHref", "deck", "editable", "height", "html", "index", "outputDir", "pageImageFormat", "stitch", "paginate", "width"], "desktop render slides input");
  if (value.deck != null && typeof value.deck !== "boolean") {
    throw new Error("desktop render slides deck must be a boolean");
  }
  if (value.editable != null && typeof value.editable !== "boolean") {
    throw new Error("desktop render slides editable must be a boolean");
  }
  if (value.index != null && (typeof value.index !== "number" || !Number.isInteger(value.index) || value.index < 0)) {
    throw new Error("desktop render slides index must be a non-negative integer");
  }
  if (value.pageImageFormat != null && value.pageImageFormat !== "png" && value.pageImageFormat !== "jpeg") {
    throw new Error("desktop render slides pageImageFormat must be 'png' or 'jpeg'");
  }
  if (value.stitch != null && typeof value.stitch !== "boolean") {
    throw new Error("desktop render slides stitch must be a boolean");
  }
  if (value.paginate != null && typeof value.paginate !== "boolean") {
    throw new Error("desktop render slides paginate must be a boolean");
  }
  if (value.outputDir != null) {
    const dir = normalizeNonEmptyString(value.outputDir, "desktop render slides outputDir");
    if (!/^(\/|[A-Za-z]:[\\/]|\\\\)/.test(dir)) {
      throw new Error("desktop render slides outputDir must be an absolute path");
    }
  }
  return {
    ...value.baseHref == null ? {} : { baseHref: normalizeNonEmptyString(value.baseHref, "desktop render slides baseHref") },
    ...value.deck == null ? {} : { deck: value.deck },
    ...value.editable == null ? {} : { editable: value.editable },
    html: normalizeNonEmptyString(value.html, "desktop render slides html"),
    ...value.index == null ? {} : { index: value.index },
    ...value.outputDir == null ? {} : { outputDir: normalizeNonEmptyString(value.outputDir, "desktop render slides outputDir") },
    ...value.pageImageFormat == null ? {} : { pageImageFormat: value.pageImageFormat },
    ...value.stitch == null ? {} : { stitch: value.stitch },
    ...value.paginate == null ? {} : { paginate: value.paginate },
    ...value.width == null ? {} : { width: normalizeOptionalPositiveNumber(value.width, "desktop render slides width") },
    ...value.height == null ? {} : { height: normalizeOptionalPositiveNumber(value.height, "desktop render slides height") }
  };
}
function normalizeDesktopRenderFramesInput(input) {
  const value = assertObject(input, "desktop render frames input");
  assertKnownKeys(value, ["baseHref", "fps", "height", "html", "outputDir", "width"], "desktop render frames input");
  const outputDir = normalizeNonEmptyString(value.outputDir, "desktop render frames outputDir");
  if (!/^(\/|[A-Za-z]:[\\/]|\\\\)/.test(outputDir)) {
    throw new Error("desktop render frames outputDir must be an absolute path");
  }
  const width = normalizeOptionalPositiveNumber(value.width, "desktop render frames width");
  const height = normalizeOptionalPositiveNumber(value.height, "desktop render frames height");
  if (width > 8192 || height > 8192) {
    throw new Error("desktop render frames dimensions must not exceed 8192px");
  }
  const fps = normalizeOptionalPositiveNumber(value.fps, "desktop render frames fps");
  if (fps != null && fps > 240) {
    throw new Error("desktop render frames fps must not exceed 240");
  }
  return {
    ...value.baseHref == null ? {} : { baseHref: normalizeNonEmptyString(value.baseHref, "desktop render frames baseHref") },
    ...fps == null ? {} : { fps },
    height,
    html: normalizeNonEmptyString(value.html, "desktop render frames html"),
    outputDir,
    width
  };
}
function normalizeOptionalPositiveNumber(value, label) {
  if (value == null) return void 0;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return value;
}
var DESKTOP_ARTIFACT_CAPTURE_MODE_VALUES = Object.values(DESKTOP_ARTIFACT_CAPTURE_MODES);
var DESKTOP_EXPORT_ARTIFACT_FORMATS = ["pdf", "image"];
var DESKTOP_EXPORT_ARTIFACT_IMAGE_FORMATS = ["png", "jpeg"];
function normalizeDesktopExportArtifactInput(input) {
  const value = assertObject(input, "desktop artifact export input");
  assertKnownKeys(value, ["baseHref", "captureMode", "deck", "format", "html", "imageFormat", "title", "width", "height"], "desktop artifact export input");
  if (!DESKTOP_EXPORT_ARTIFACT_FORMATS.includes(value.format)) {
    throw new Error(`unsupported artifact export format: ${String(value.format)}`);
  }
  if (value.captureMode != null && !DESKTOP_ARTIFACT_CAPTURE_MODE_VALUES.includes(value.captureMode)) {
    throw new Error(`unsupported artifact capture mode: ${String(value.captureMode)}`);
  }
  if (value.captureMode === DESKTOP_ARTIFACT_CAPTURE_MODES.FIRST_VIEWPORT_THUMBNAIL && value.format !== "image") {
    throw new Error(
      `${DESKTOP_ARTIFACT_CAPTURE_MODES.FIRST_VIEWPORT_THUMBNAIL} requires format "image", not "${String(value.format)}"`
    );
  }
  if (value.imageFormat != null && !DESKTOP_EXPORT_ARTIFACT_IMAGE_FORMATS.includes(value.imageFormat)) {
    throw new Error(`unsupported artifact export image format: ${String(value.imageFormat)}`);
  }
  return {
    ...value.baseHref == null ? {} : { baseHref: normalizeNonEmptyString(value.baseHref, "desktop artifact export baseHref") },
    ...value.captureMode == null ? {} : { captureMode: value.captureMode },
    deck: normalizeBoolean(value.deck, "desktop artifact export deck"),
    format: value.format,
    html: normalizeNonEmptyString(value.html, "desktop artifact export html"),
    ...value.imageFormat == null ? {} : { imageFormat: value.imageFormat },
    title: normalizeNonEmptyString(value.title, "desktop artifact export title"),
    ...value.width == null ? {} : { width: normalizeOptionalPositiveNumber(value.width, "desktop artifact export width") },
    ...value.height == null ? {} : { height: normalizeOptionalPositiveNumber(value.height, "desktop artifact export height") }
  };
}
function isDesktopUpdateAction(value) {
  return Object.values(DESKTOP_UPDATE_ACTIONS).includes(value);
}
function normalizeDesktopUpdateInput(input) {
  const value = assertObject(input, "desktop update input");
  assertKnownKeys(value, ["action"], "desktop update input");
  if (!isDesktopUpdateAction(value.action)) {
    throw new Error(`unsupported desktop update action: ${String(value.action)}`);
  }
  return { action: value.action };
}
function normalizeDesktopShowInput(input) {
  const value = assertObject(input, "desktop show input");
  assertKnownKeys(value, ["deeplinkUrl"], "desktop show input");
  if (value.deeplinkUrl == null) return {};
  const deeplinkUrl = normalizeNonEmptyString(value.deeplinkUrl, "desktop show deeplinkUrl");
  if (!deeplinkUrl.startsWith("opendesign://")) {
    throw new Error("desktop show deeplinkUrl must use the opendesign scheme");
  }
  return { deeplinkUrl };
}
function normalizeMessageType(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new SidecarContractError(SIDECAR_ERROR_CODES.INVALID_MESSAGE, `${label} type must be a non-empty string`);
  }
  return value;
}
function normalizeDaemonSidecarMessage(input) {
  const value = assertObject(input, "daemon sidecar message");
  const type = normalizeMessageType(value.type, "daemon sidecar message");
  if (type === SIDECAR_MESSAGES.STATUS || type === SIDECAR_MESSAGES.SHUTDOWN) {
    assertKnownKeys(value, ["type"], "daemon sidecar message");
    return { type };
  }
  if (type === SIDECAR_MESSAGES.REGISTER_DESKTOP_AUTH) {
    assertKnownKeys(value, ["input", "type"], "daemon sidecar message");
    return { input: normalizeRegisterDesktopAuthInput(value.input), type };
  }
  if (type === SIDECAR_MESSAGES.MINT_IMPORT_TOKEN) {
    assertKnownKeys(value, ["input", "type"], "daemon sidecar message");
    return { input: normalizeMintImportTokenInput(value.input), type };
  }
  if (type === SIDECAR_MESSAGES.REGISTER_WEB_URL) {
    assertKnownKeys(value, ["input", "type"], "daemon sidecar message");
    return { input: normalizeRegisterWebUrlInput(value.input), type };
  }
  throw new SidecarContractError(SIDECAR_ERROR_CODES.UNKNOWN_MESSAGE, `unknown daemon sidecar message: ${type}`);
}
function normalizeWebSidecarMessage(input) {
  const value = assertObject(input, "web sidecar message");
  const type = normalizeMessageType(value.type, "web sidecar message");
  if (type === SIDECAR_MESSAGES.STATUS || type === SIDECAR_MESSAGES.SHUTDOWN) {
    assertKnownKeys(value, ["type"], "web sidecar message");
    return { type };
  }
  throw new SidecarContractError(SIDECAR_ERROR_CODES.UNKNOWN_MESSAGE, `unknown web sidecar message: ${type}`);
}
function normalizeDesktopSidecarMessage(input) {
  const value = assertObject(input, "desktop sidecar message");
  const type = normalizeMessageType(value.type, "desktop sidecar message");
  switch (type) {
    case SIDECAR_MESSAGES.STATUS:
    case SIDECAR_MESSAGES.SHUTDOWN:
    case SIDECAR_MESSAGES.CONSOLE:
      assertKnownKeys(value, ["type"], "desktop sidecar message");
      return { type };
    case SIDECAR_MESSAGES.SHOW:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return value.input == null ? { type } : { input: normalizeDesktopShowInput(value.input), type };
    case SIDECAR_MESSAGES.EVAL:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopEvalInput(value.input), type };
    case SIDECAR_MESSAGES.SCREENSHOT:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopScreenshotInput(value.input), type };
    case SIDECAR_MESSAGES.CLICK:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopClickInput(value.input), type };
    case SIDECAR_MESSAGES.EXPORT_PDF:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopExportPdfInput(value.input), type };
    case SIDECAR_MESSAGES.RENDER_FRAMES:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopRenderFramesInput(value.input), type };
    case SIDECAR_MESSAGES.RENDER_SLIDES:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopRenderSlidesInput(value.input), type };
    case SIDECAR_MESSAGES.EXPORT_ARTIFACT:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopExportArtifactInput(value.input), type };
    case SIDECAR_MESSAGES.UPDATE:
      assertKnownKeys(value, ["input", "type"], "desktop sidecar message");
      return { input: normalizeDesktopUpdateInput(value.input), type };
    default:
      throw new SidecarContractError(SIDECAR_ERROR_CODES.UNKNOWN_MESSAGE, `unknown desktop sidecar message: ${type}`);
  }
}
var OPEN_DESIGN_SIDECAR_CONTRACT = Object.freeze({
  appKeys: APP_KEYS,
  defaults: SIDECAR_DEFAULTS,
  env: SIDECAR_RUNTIME_ENV,
  errorCodes: SIDECAR_ERROR_CODES,
  messages: SIDECAR_MESSAGES,
  modes: SIDECAR_MODES,
  normalizeApp: normalizeAppKey,
  normalizeNamespace,
  normalizeSource: normalizeSidecarSource,
  normalizeStamp: normalizeSidecarRuntimeLayout,
  normalizeStampCriteria: normalizeSidecarRuntimeLayoutCriteria,
  sources: SIDECAR_SOURCES,
  stampFields: SIDECAR_STAMP_FIELDS,
  stampFlags: SIDECAR_STAMP_FLAGS,
  updateActions: DESKTOP_UPDATE_ACTIONS,
  updateChannels: DESKTOP_UPDATE_CHANNELS,
  updateModes: DESKTOP_UPDATE_MODES,
  updateStates: DESKTOP_UPDATE_STATES
});
export {
  APP_KEYS,
  DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES,
  DESKTOP_ARTIFACT_CAPTURE_MODES,
  DESKTOP_UPDATE_ACTIONS,
  DESKTOP_UPDATE_CHANNELS,
  DESKTOP_UPDATE_MODES,
  DESKTOP_UPDATE_REINSTALL_REASONS,
  DESKTOP_UPDATE_STATES,
  MCP_BOOTSTRAP_CONTRACT,
  OPEN_DESIGN_PRODUCT_NAME,
  OPEN_DESIGN_SIDECAR_CONTRACT,
  SIDECAR_DEFAULTS,
  SIDECAR_ENV,
  SIDECAR_ERROR_CODES,
  SIDECAR_MESSAGES,
  SIDECAR_MODES,
  SIDECAR_RUNTIME_ENV,
  SIDECAR_SOURCES,
  SIDECAR_STAMP_FIELDS,
  SIDECAR_STAMP_FLAGS,
  STAMP_APP_FLAG,
  STAMP_IPC_FLAG,
  STAMP_MODE_FLAG,
  STAMP_NAMESPACE_FLAG,
  STAMP_SOURCE_FLAG,
  SidecarContractError,
  isAppKey,
  isDesktopUpdateAction,
  isSidecarMode,
  isSidecarSource,
  isWindowsNamedPipePath,
  normalizeAppKey,
  normalizeDaemonSidecarMessage,
  normalizeDesktopSidecarMessage,
  normalizeIpcPath,
  normalizeNamespace,
  normalizeSidecarMode,
  normalizeSidecarRuntimeLayout,
  normalizeSidecarRuntimeLayoutCriteria,
  normalizeSidecarSource,
  normalizeWebSidecarMessage,
  resolveWindowsReleaseNamespaceToken,
  resolveWindowsUninstallRegistryKey
};
