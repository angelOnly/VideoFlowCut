#!/usr/bin/env node

// src/index.ts
import { spawn } from "node:child_process";
import { lstat, mkdir, open, readdir, rm, symlink, writeFile } from "node:fs/promises";
import path5 from "node:path";
import { cac } from "cac";
import {
  APP_KEYS as APP_KEYS5,
  SIDECAR_ENV as SIDECAR_ENV2,
  SIDECAR_MESSAGES,
  SIDECAR_SOURCES as SIDECAR_SOURCES2
} from "@open-design/sidecar-proto";
import {
  findSidecarProcesses,
  invokeSidecar,
  launchSidecar,
  restartSidecar,
  stopSidecar
} from "@open-design/sidecar";
import {
  createPackageManagerInvocation,
  isProcessAlive,
  readLogTail
} from "@open-design/platform";

// src/config.ts
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_KEYS,
  OPEN_DESIGN_SIDECAR_CONTRACT,
  SIDECAR_ENV,
  SIDECAR_SOURCES
} from "@open-design/sidecar-proto";
import {
  resolveAppRuntimePath,
  resolveLogFilePath,
  resolveNamespace,
  resolveNamespaceRoot,
  resolveSidecarBase,
  resolveSourceRuntimeRoot
} from "@open-design/sidecar";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
var ALL_APPS = [APP_KEYS.DAEMON, APP_KEYS.WEB, APP_KEYS.DESKTOP];
var DEFAULT_START_APPS = [APP_KEYS.DAEMON, APP_KEYS.WEB, APP_KEYS.DESKTOP];
var DEFAULT_RUN_APPS = [APP_KEYS.DAEMON, APP_KEYS.WEB];
var DEFAULT_STOP_APPS = [APP_KEYS.DESKTOP, APP_KEYS.WEB, APP_KEYS.DAEMON];
function resolveTsxCliPath() {
  const require2 = createRequire(import.meta.url);
  return require2.resolve("tsx/cli");
}
function resolveElectronBinaryPath(workspaceRoot) {
  const packageJsonPath = path.join(workspaceRoot, "apps/desktop/package.json");
  const require2 = createRequire(packageJsonPath);
  const electron = require2("electron");
  if (typeof electron === "string" && electron.length > 0) return electron;
  return require2.resolve("electron/cli.js");
}
function resolveAppConfig(options) {
  return {
    app: options.app,
    latestLogPath: resolveLogFilePath({ runtimeRoot: options.namespaceRoot, app: options.app, contract: OPEN_DESIGN_SIDECAR_CONTRACT }),
    logDir: path.dirname(resolveLogFilePath({ runtimeRoot: options.namespaceRoot, app: options.app, contract: OPEN_DESIGN_SIDECAR_CONTRACT }))
  };
}
function isToolDevAppName(value) {
  return ALL_APPS.includes(value);
}
function unsupportedAppError(value) {
  return new Error(`unsupported tools-dev app: ${value} (expected one of: ${ALL_APPS.join(", ")})`);
}
function resolveTargetApps(appName, defaults) {
  if (appName == null) return [...defaults];
  if (!isToolDevAppName(appName)) throw unsupportedAppError(appName);
  return [appName];
}
function resolveStartApps(appName) {
  if (appName == null) return [...DEFAULT_START_APPS];
  if (!isToolDevAppName(appName)) throw unsupportedAppError(appName);
  if (appName === APP_KEYS.WEB) return [APP_KEYS.DAEMON, APP_KEYS.WEB];
  if (appName === APP_KEYS.DESKTOP) return [APP_KEYS.DAEMON, APP_KEYS.WEB, APP_KEYS.DESKTOP];
  return [APP_KEYS.DAEMON];
}
function resolveRunApps(appName) {
  if (appName == null) return [...DEFAULT_RUN_APPS];
  return resolveStartApps(appName);
}
function resolveStopApps(appName) {
  if (appName == null) return [...DEFAULT_STOP_APPS];
  if (!isToolDevAppName(appName)) throw unsupportedAppError(appName);
  if (appName === APP_KEYS.WEB) return [APP_KEYS.WEB, APP_KEYS.DAEMON];
  if (appName === APP_KEYS.DESKTOP) return [APP_KEYS.DESKTOP];
  return [APP_KEYS.DAEMON];
}
function parsePortOption(value, optionName) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${optionName} must be an integer between 1 and 65535`);
  }
  return parsed;
}
function parseParentPidOption(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`--parent-pid must be a positive safe integer`);
  }
  return parsed;
}
function resolveToolDevConfig(options = {}) {
  const namespace = resolveNamespace({ namespace: options.namespace, env: process.env, contract: OPEN_DESIGN_SIDECAR_CONTRACT });
  const toolsDevRoot = resolveSidecarBase({
    base: options.toolsDevRoot ?? process.env[SIDECAR_ENV.BASE] ?? resolveSourceRuntimeRoot({
      contract: OPEN_DESIGN_SIDECAR_CONTRACT,
      projectRoot: WORKSPACE_ROOT,
      source: SIDECAR_SOURCES.TOOLS_DEV
    }),
    contract: OPEN_DESIGN_SIDECAR_CONTRACT,
    env: process.env,
    projectRoot: WORKSPACE_ROOT,
    source: SIDECAR_SOURCES.TOOLS_DEV
  });
  const namespaceRoot = resolveNamespaceRoot({ base: toolsDevRoot, namespace, contract: OPEN_DESIGN_SIDECAR_CONTRACT });
  const daemon = resolveAppConfig({ app: APP_KEYS.DAEMON, namespace, namespaceRoot, toolsDevRoot });
  const desktop = resolveAppConfig({ app: APP_KEYS.DESKTOP, namespace, namespaceRoot, toolsDevRoot });
  const web = resolveAppConfig({ app: APP_KEYS.WEB, namespace, namespaceRoot, toolsDevRoot });
  const desktopPackageJsonPath = path.join(WORKSPACE_ROOT, "apps/desktop/package.json");
  let cachedElectronBinaryPath;
  return {
    apps: {
      daemon: {
        ...daemon,
        sidecarEntryPath: path.join(WORKSPACE_ROOT, "apps/daemon/src/sidecar/index.ts")
      },
      desktop: {
        ...desktop,
        get electronBinaryPath() {
          if (cachedElectronBinaryPath == null) cachedElectronBinaryPath = resolveElectronBinaryPath(WORKSPACE_ROOT);
          return cachedElectronBinaryPath;
        },
        mainEntryPath: path.join(WORKSPACE_ROOT, "apps/desktop/dist/main/index.js"),
        packageJsonPath: desktopPackageJsonPath
      },
      web: {
        ...web,
        nextDistDir: resolveAppRuntimePath({ app: APP_KEYS.WEB, namespaceRoot, fileName: "next", contract: OPEN_DESIGN_SIDECAR_CONTRACT }),
        nextTsconfigPath: resolveAppRuntimePath({ app: APP_KEYS.WEB, namespaceRoot, fileName: "tsconfig.json", contract: OPEN_DESIGN_SIDECAR_CONTRACT }),
        sidecarEntryPath: path.join(WORKSPACE_ROOT, "apps/web/sidecar/index.ts")
      }
    },
    namespace,
    namespaceRoot,
    toolsDevRoot,
    tsxCliPath: resolveTsxCliPath(),
    workspaceRoot: WORKSPACE_ROOT
  };
}

// src/data-root.ts
import { homedir } from "node:os";
import path2 from "node:path";
function resolveToolsDevDataRoot(workspaceRoot, env = process.env) {
  const configured = env.OD_DATA_DIR?.trim();
  if (configured == null || configured.length === 0) return null;
  const home = homedir();
  const expanded = configured.replace(/^~(?=$|[\\/])/, home).replace(/^\$HOME(?=$|[\\/])/, home).replace(/^\$\{HOME\}(?=$|[\\/])/, home);
  return path2.isAbsolute(expanded) ? path2.resolve(expanded) : path2.resolve(workspaceRoot, expanded);
}

// src/diagnostics.ts
var SUPPORTED_NODE_MAJOR = 24;
var SUPPORTED_NODE_RANGE = "Node ~24";
var NATIVE_ADDON_ABI_MISMATCH_PATTERN = /was compiled against a different Node\.js version[\s\S]*?NODE_MODULE_VERSION\s+\d+[\s\S]*?requires\s+NODE_MODULE_VERSION\s+\d+/i;
var NODE_MODULE_VERSION_PATTERN = /NODE_MODULE_VERSION\s+\d+[\s\S]*?NODE_MODULE_VERSION\s+\d+/i;
var NEXT_PACKAGE_RESOLUTION_PATTERN = /couldn't find the Next\.js package.*from the project directory:/i;
function currentNodeRuntime() {
  return {
    nodeModuleVersion: process.versions.modules,
    nodeVersion: process.version
  };
}
function parseNodeMajor(nodeVersion) {
  const match = /^v?(\d+)\./.exec(nodeVersion);
  if (match == null) return null;
  return Number(match[1]);
}
function isSupportedNodeRuntime(nodeVersion = process.version) {
  return parseNodeMajor(nodeVersion) === SUPPORTED_NODE_MAJOR;
}
function formatUnsupportedNodeRuntimeMessage(runtime = currentNodeRuntime()) {
  return [
    `tools-dev must run with ${SUPPORTED_NODE_RANGE} before starting OpenDesign.`,
    `Current runtime: Node ${runtime.nodeVersion} (NODE_MODULE_VERSION ${runtime.nodeModuleVersion}).`,
    "Switch to Node 24 first, then refresh native dependencies if this worktree was installed under another Node:",
    "  nvm use 24",
    "  corepack pnpm install --frozen-lockfile",
    "  corepack pnpm --filter @open-design/daemon rebuild better-sqlite3 --pending"
  ].join("\n");
}
function createUnsupportedNodeRuntimeError(runtime) {
  return new Error(formatUnsupportedNodeRuntimeMessage(runtime));
}
function formatNativeAddonAbiMismatchRecommendation(runtime) {
  const base = [
    "OpenDesign's dev stack must run with Node ~24.",
    `Current tools-dev runtime: Node ${runtime.nodeVersion} (NODE_MODULE_VERSION ${runtime.nodeModuleVersion}).`
  ];
  if (!isSupportedNodeRuntime(runtime.nodeVersion)) {
    return [
      ...base,
      "Switch to Node 24 first, then refresh native daemon dependencies:",
      "  nvm use 24",
      "  corepack pnpm install --frozen-lockfile",
      "  corepack pnpm --filter @open-design/daemon rebuild better-sqlite3 --pending"
    ].join("\n");
  }
  return [
    ...base,
    "Refresh native daemon dependencies for the active Node 24 runtime:",
    "  corepack pnpm --filter @open-design/daemon rebuild better-sqlite3 --pending",
    "or refresh the workspace install:",
    "  corepack pnpm install --frozen-lockfile"
  ].join("\n");
}
function detectLogDiagnostics(lines, runtime = currentNodeRuntime()) {
  const logText = lines.join("\n");
  const diagnostics = [];
  if (NATIVE_ADDON_ABI_MISMATCH_PATTERN.test(logText) || NODE_MODULE_VERSION_PATTERN.test(logText)) {
    diagnostics.push({
      message: "Detected a native Node addon ABI mismatch in the daemon log.",
      recommendation: formatNativeAddonAbiMismatchRecommendation(runtime)
    });
  }
  if (NEXT_PACKAGE_RESOLUTION_PATTERN.test(logText)) {
    diagnostics.push({
      message: "Detected that the Next.js package is not resolvable during web startup.",
      recommendation: [
        "Refresh the workspace install so apps/web/node_modules/next points at the pnpm-managed Next.js package:",
        "  pnpm install --frozen-lockfile",
        "If it still fails, inspect the package link:",
        "  ls -la apps/web/node_modules/next",
        `  node -p "require.resolve('next/package.json', { paths: [process.cwd() + '/apps/web/app'] })"`
      ].join("\n")
    });
  }
  return diagnostics;
}
function formatLogDiagnostics(diagnostics) {
  if (diagnostics.length === 0) return null;
  return diagnostics.map((diagnostic) => `${diagnostic.message}
${diagnostic.recommendation}`).join("\n\n");
}
function createStartupLogDiagnostics(logPath, lines) {
  return {
    diagnostics: detectLogDiagnostics(lines),
    lines: [...lines],
    logPath
  };
}
function appendStartupLogDiagnostics(error, appName, details) {
  const baseMessage = error instanceof Error ? error.message : String(error);
  const sections = [baseMessage, `${appName} log tail (${details.logPath}):`];
  sections.push(details.lines.length > 0 ? details.lines.join("\n") : "(no log lines)");
  const formattedDiagnostics = formatLogDiagnostics(details.diagnostics);
  if (formattedDiagnostics != null) sections.push(formattedDiagnostics);
  return new Error(sections.join("\n\n"), error instanceof Error ? { cause: error } : void 0);
}

// src/sidecar-client.ts
import {
  APP_KEYS as APP_KEYS2
} from "@open-design/sidecar-proto";
import { getSidecarStatus } from "@open-design/sidecar";
function convergedStamp(runtime, app) {
  return {
    app,
    channel: "local",
    mode: "dev",
    namespace: runtime.namespace,
    source: "tools-dev"
  };
}
var DAEMON_STARTUP_TIMEOUT_MS = 12e4;
var WEB_STARTUP_TIMEOUT_MS = process.env.CI === "true" ? 12e4 : 35e3;
var DESKTOP_STARTUP_TIMEOUT_MS = 15e3;
function assertSpawnedProcessAlive(appName, isProcessAlive2) {
  if (isProcessAlive2?.() === false) {
    throw new Error(`${appName} exited before exposing status`);
  }
}
async function inspectDaemonRuntime(runtime, timeoutMs = 800) {
  try {
    return await getSidecarStatus(convergedStamp(runtime, APP_KEYS2.DAEMON), { timeoutMs });
  } catch {
    return null;
  }
}
async function waitForDaemonRuntime(runtime, timeoutMs = DAEMON_STARTUP_TIMEOUT_MS, isProcessAlive2) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    assertSpawnedProcessAlive(APP_KEYS2.DAEMON, isProcessAlive2);
    const snapshot = await inspectDaemonRuntime(runtime, 800);
    if (snapshot?.url != null) return snapshot;
    assertSpawnedProcessAlive(APP_KEYS2.DAEMON, isProcessAlive2);
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  assertSpawnedProcessAlive(APP_KEYS2.DAEMON, isProcessAlive2);
  throw new Error("daemon did not expose status in time");
}
async function inspectWebRuntime(runtime, timeoutMs = 800) {
  try {
    return await getSidecarStatus(convergedStamp(runtime, APP_KEYS2.WEB), { timeoutMs });
  } catch {
    return null;
  }
}
async function waitForWebRuntime(runtime, timeoutMs = WEB_STARTUP_TIMEOUT_MS, isProcessAlive2) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    assertSpawnedProcessAlive(APP_KEYS2.WEB, isProcessAlive2);
    const snapshot = await inspectWebRuntime(runtime, 800);
    if (snapshot?.url != null) return snapshot;
    assertSpawnedProcessAlive(APP_KEYS2.WEB, isProcessAlive2);
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  assertSpawnedProcessAlive(APP_KEYS2.WEB, isProcessAlive2);
  throw new Error("web did not expose status in time");
}
async function inspectDesktopRuntime(runtime, timeoutMs = 800) {
  try {
    return await getSidecarStatus(convergedStamp(runtime, APP_KEYS2.DESKTOP), { timeoutMs });
  } catch {
    return null;
  }
}
async function waitForDesktopRuntime(runtime, timeoutMs = DESKTOP_STARTUP_TIMEOUT_MS, isProcessAlive2) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    assertSpawnedProcessAlive(APP_KEYS2.DESKTOP, isProcessAlive2);
    const snapshot = await inspectDesktopRuntime(runtime, 800);
    if (snapshot != null) return snapshot;
    assertSpawnedProcessAlive(APP_KEYS2.DESKTOP, isProcessAlive2);
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  assertSpawnedProcessAlive(APP_KEYS2.DESKTOP, isProcessAlive2);
  throw new Error("desktop did not expose status in time");
}

// src/cli-args.ts
var CLI_COMMANDS = /* @__PURE__ */ new Set(["start", "run", "status", "stop", "restart", "logs", "inspect", "check", "help"]);
var OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set([
  "--daemon-port",
  "--env-file",
  "--expr",
  "--namespace",
  "--parent-pid",
  "--path",
  "--selector",
  "--timeout",
  "--tools-dev-root",
  "--update-action",
  "--web-port"
]);
function rewriteCliArgsForDefaultStart(args) {
  const firstPositionalIndex = firstPositionalArgIndex(args);
  const firstPositional = firstPositionalIndex >= 0 ? args[firstPositionalIndex] : void 0;
  if (isGlobalHelpRequest(args, firstPositional) || CLI_COMMANDS.has(firstPositional ?? "")) return [...args];
  const rewritten = [...args];
  rewritten.splice(firstPositionalIndex >= 0 ? firstPositionalIndex : 0, 0, "start");
  return rewritten;
}
function isGlobalHelpRequest(args, firstPositional) {
  return firstPositional === void 0 && args.some((arg) => arg === "--help" || arg === "-h");
}
function firstPositionalArgIndex(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") return index + 1 < args.length ? index + 1 : -1;
    if (arg.startsWith("--") && arg.includes("=")) continue;
    if (OPTIONS_WITH_VALUE.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("-")) continue;
    return index;
  }
  return -1;
}

// src/desktop-auth-gate.ts
import { APP_KEYS as APP_KEYS3 } from "@open-design/sidecar-proto";
function extractRuntimePort(url) {
  if (url == null || url.length === 0) return null;
  try {
    const port = new URL(url).port;
    if (port.length === 0) return null;
    const parsed = Number(port);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : null;
  } catch {
    return null;
  }
}
async function ensureDaemonGateForDesktop(deps) {
  const daemon = await deps.inspectDaemon();
  if (daemon == null) return;
  if (daemon.desktopAuthGateActive) return;
  deps.log(
    "[tools-dev] daemon is running without desktop-auth gate; restarting daemon (and web, if running) before desktop start"
  );
  const web = await deps.inspectWeb();
  const daemonPort = extractRuntimePort(daemon.url);
  const webPort = extractRuntimePort(web?.url);
  if (web != null) await deps.stopApp(APP_KEYS3.WEB);
  await deps.stopApp(APP_KEYS3.DAEMON);
  await deps.startDaemonGated({ port: daemonPort, webPort });
  if (web != null) await deps.startWeb({ port: webPort });
}

// src/local-env.ts
import { readFileSync, statSync } from "node:fs";
import path3 from "node:path";
var DEFAULT_LOCAL_ENV_FILE_NAMES = [".env.development.local", ".env.local", ".env.development", ".env"];
var LOCAL_DEVELOPMENT_TELEMETRY_ENV = "local_development";
var TELEMETRY_ENV_KEY = "OD_TELEMETRY_ENV";
function loadWorkspaceLocalEnv(options) {
  const flags = parseLocalEnvFlags(options.args ?? []);
  if (flags.disabled || flags.help) return { envPath: null, loaded: false, loadedFiles: [], keys: [], skippedFiles: [] };
  const env = options.env ?? process.env;
  const envFileNames = flags.explicitFiles.length > 0 ? flags.explicitFiles : [...DEFAULT_LOCAL_ENV_FILE_NAMES];
  const explicit = flags.explicitFiles.length > 0;
  const loadedFiles = [];
  const skippedFiles = [];
  const loadedKeys = /* @__PURE__ */ new Set();
  for (const fileName of envFileNames) {
    const envPath = resolveEnvFilePath(options.workspaceRoot, fileName);
    if (!isReadableFile(envPath)) {
      if (explicit) throw new Error(`env file not found: ${fileName}`);
      skippedFiles.push(fileName);
      continue;
    }
    const parsed = parseDotEnvLocal(readFileSync(envPath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (loadedKeys.has(key)) continue;
      env[key] = value;
      loadedKeys.add(key);
    }
    loadedFiles.push(fileName);
  }
  if (loadedFiles.length === 0) {
    return { envPath: null, loaded: false, loadedFiles, keys: [], skippedFiles };
  }
  if (env[TELEMETRY_ENV_KEY] == null || env[TELEMETRY_ENV_KEY]?.trim() === "") {
    env[TELEMETRY_ENV_KEY] = LOCAL_DEVELOPMENT_TELEMETRY_ENV;
    loadedKeys.add(TELEMETRY_ENV_KEY);
  }
  if (!flags.json) {
    options.log?.(`tools-dev env: loaded ${loadedFiles.join(", ")}`);
  }
  return {
    envPath: resolveEnvFilePath(options.workspaceRoot, loadedFiles[0]),
    loaded: true,
    loadedFiles,
    keys: [...loadedKeys].sort(),
    skippedFiles
  };
}
function parseLocalEnvFlags(args) {
  const explicitFiles = [];
  let disabled = false;
  let help = false;
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") break;
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h" || arg === "help") {
      help = true;
      continue;
    }
    if (arg === "--no-env-file") {
      disabled = true;
      continue;
    }
    if (arg === "--env-file") {
      const value = args[index + 1];
      if (value == null || value.startsWith("-")) throw new Error("--env-file requires a path");
      explicitFiles.push(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--env-file=")) {
      const value = arg.slice("--env-file=".length);
      if (value.length === 0) throw new Error("--env-file requires a path");
      explicitFiles.push(value);
    }
  }
  return { disabled, explicitFiles, help, json };
}
function resolveEnvFilePath(workspaceRoot, filePath) {
  return path3.isAbsolute(filePath) ? filePath : path3.join(workspaceRoot, filePath);
}
function isReadableFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch (error) {
    const code = error.code;
    if (code === "ENOENT" || code === "ENOTDIR") return false;
    throw error;
  }
}
function parseDotEnvLocal(content) {
  const parsed = /* @__PURE__ */ Object.create(null);
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice("export ".length).trimStart() : line;
    const equalsIndex = normalized.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = normalized.slice(0, equalsIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const rawValue = normalized.slice(equalsIndex + 1).trim();
    parsed[key] = parseDotEnvValue(rawValue);
  }
  return parsed;
}
function parseDotEnvValue(rawValue) {
  if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
    return parseQuotedValue(rawValue);
  }
  return stripInlineComment(rawValue).trim();
}
function parseQuotedValue(rawValue) {
  const quote = rawValue[0];
  let escaped = false;
  let value = "";
  for (let i = 1; i < rawValue.length; i += 1) {
    const char = rawValue[i];
    if (escaped) {
      value += quote === '"' ? decodeEscape(char) : char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === quote) return value;
    value += char;
  }
  return value;
}
function decodeEscape(char) {
  if (char === "n") return "\n";
  if (char === "r") return "\r";
  if (char === "t") return "	";
  return char;
}
function stripInlineComment(value) {
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] !== "#") continue;
    if (i === 0 || /\s/.test(value[i - 1])) return value.slice(0, i);
  }
  return value;
}

// src/shared-ports.ts
import { allocatePort } from "@open-design/sidecar";
import { APP_KEYS as APP_KEYS4 } from "@open-design/sidecar-proto";
function portFromUrl(url) {
  if (url == null) return null;
  const parsed = new URL(url);
  if (parsed.port.length > 0) return Number(parsed.port);
  return parsed.protocol === "https:" ? 443 : 80;
}
async function ensureSharedPortsResolved(targets, options, runningWebUrl, runningDaemonUrl, allocate = allocatePort) {
  if (!targets.includes(APP_KEYS4.WEB)) return;
  const daemonRequested = targets.includes(APP_KEYS4.DAEMON);
  const reserved = /* @__PURE__ */ new Set();
  const webPort = parsePortOption(options.webPort, "--web-port");
  if (webPort != null) reserved.add(webPort);
  let daemonPort = parsePortOption(options.daemonPort, "--daemon-port");
  if (daemonRequested && daemonPort == null) {
    daemonPort = portFromUrl(runningDaemonUrl);
    if (daemonPort != null) {
      options.daemonPort = String(daemonPort);
    }
  }
  if (daemonPort != null) reserved.add(daemonPort);
  if (daemonRequested && daemonPort == null) {
    const allocation = await allocate({
      host: "127.0.0.1",
      label: "daemon",
      reserved
    });
    daemonPort = allocation.port;
    reserved.add(daemonPort);
    options.daemonPort = String(daemonPort);
  }
  if (webPort != null) return;
  if (runningWebUrl != null) {
    const url = new URL(runningWebUrl);
    options.webPort = String(url.port || (url.protocol === "https:" ? 443 : 80));
    return;
  }
  const { port } = await allocate({
    host: "127.0.0.1",
    label: "web",
    reserved
  });
  options.webPort = String(port);
}
async function resolveSharedPortsFromRunningState(targets, options, urls) {
  const runningDaemonUrl = targets.includes(APP_KEYS4.DAEMON) ? await urls.daemonUrl?.() ?? null : null;
  const runningWebUrl = targets.includes(APP_KEYS4.WEB) ? await urls.webUrl?.() ?? null : null;
  await ensureSharedPortsResolved(targets, options, runningWebUrl, runningDaemonUrl);
}

// src/vela-runtime.ts
import { accessSync, constants } from "node:fs";
import { createRequire as createRequire2 } from "node:module";
import path4 from "node:path";
function resolveDevVelaEnv(workspaceRoot, env = process.env, log) {
  if (env.VELA_BIN?.trim()) return {};
  const require2 = createRequire2(path4.join(workspaceRoot, "tools/dev/package.json"));
  let packagePath;
  try {
    packagePath = require2.resolve("@powerformer/vela-cli");
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    log?.("[tools-dev] workspace Vela is unavailable; run pnpm install to use the pinned CLI. Falling back to PATH; cloud tasks may require a newer CLI.");
    return {};
  }
  try {
    const resolver = require2(packagePath);
    const binary = resolver.resolveVelaCliBin({ strict: true });
    if (typeof binary !== "string" || !path4.isAbsolute(binary)) {
      throw new Error("Vela package returned no absolute binary path");
    }
    accessSync(binary, process.platform === "win32" ? constants.F_OK : constants.X_OK);
    log?.(`[tools-dev] using workspace Vela: ${binary}`);
    return { VELA_BIN: binary };
  } catch (error) {
    throw new Error("Unable to resolve workspace Vela; run pnpm install or explicitly configure VELA_BIN.", { cause: error });
  }
}

// src/index.ts
var TOOLS_DEV_PARENT_PID_ENV = SIDECAR_ENV2.TOOLS_DEV_PARENT_PID;
function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
function exitWithError(error) {
  process.stderr.write(`${formatError(error)}
`);
  process.exit(1);
}
process.on("uncaughtException", exitWithError);
process.on("unhandledRejection", exitWithError);
function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
}
function output(payload, options = {}) {
  if (typeof payload === "string" && options.json !== true) {
    process.stdout.write(`${payload}
`);
    return;
  }
  printJson(payload);
}
function assertSupportedNodeRuntimeForStart() {
  if (!isSupportedNodeRuntime()) throw createUnsupportedNodeRuntimeError();
}
function normalizeDisplayUrl(url) {
  return url.endsWith("/") ? url : `${url}/`;
}
function colorizeLink(url) {
  if (process.env.NO_COLOR != null || process.stdout.isTTY !== true) return url;
  const reset = "\x1B[0m";
  const cyan = "\x1B[36m";
  const underline = "\x1B[4m";
  return `${cyan}${underline}${url}${reset}`;
}
function asRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function stringField(record, key) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
function numberField(record, key) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function numberArrayField(record, key) {
  const value = record?.[key];
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "number" && Number.isFinite(entry)) : [];
}
function formatProcessList(pids) {
  if (pids.length === 0) return null;
  const visible = pids.slice(0, 5).join(", ");
  return pids.length > 5 ? `${visible}, +${pids.length - 5} more` : visible;
}
function formatStatusSummary(status2) {
  const record = asRecord(status2);
  if (record == null) return "status unavailable";
  const parts = [stringField(record, "state") ?? "unknown"];
  const url = stringField(record, "url");
  const pid = numberField(record, "pid");
  const title = stringField(record, "title");
  const windowVisible = record.windowVisible;
  if (url != null) parts.push(url);
  if (pid != null) parts.push(`pid ${pid}`);
  if (title != null) parts.push(`title ${JSON.stringify(title)}`);
  if (typeof windowVisible === "boolean") parts.push(`window ${windowVisible ? "visible" : "hidden"}`);
  return parts.join(" \xB7 ");
}
function printStatusEntries(apps) {
  for (const [appName, appStatus] of Object.entries(apps)) {
    process.stdout.write(`- ${appName}: ${formatStatusSummary(appStatus)}
`);
  }
}
function printStartSection(result, heading) {
  process.stdout.write(`${heading}
`);
  const entries = Object.entries(result);
  if (entries.length === 0) {
    process.stdout.write("(no apps)\n");
    return;
  }
  for (const [appName, rawEntry] of entries) {
    const entry = asRecord(rawEntry);
    const created = entry?.created;
    const action = created === true ? "started" : created === false ? "already running" : "ready";
    process.stdout.write(`- ${appName}: ${action} \xB7 ${formatStatusSummary(entry?.status)}
`);
    const logPath = entry == null ? null : stringField(entry, "logPath");
    if (logPath != null) process.stdout.write(`  log: ${logPath}
`);
  }
}
function printStartResult(result, options, heading = "tools-dev start") {
  if (options.json === true) {
    printJson(result);
    return;
  }
  printStartSection(result, heading);
}
function printStopSection(result, heading) {
  process.stdout.write(`${heading}
`);
  const entries = Object.entries(result);
  if (entries.length === 0) {
    process.stdout.write("(no apps)\n");
    return;
  }
  for (const [appName, rawEntry] of entries) {
    const entry = asRecord(rawEntry);
    const stop = asRecord(entry?.stop);
    const stoppedPids = formatProcessList(numberArrayField(stop, "stoppedPids"));
    const remainingPids = formatProcessList(numberArrayField(stop, "remainingPids"));
    const parts = [entry == null ? "unknown" : stringField(entry, "status") ?? "unknown"];
    const via = entry == null ? null : stringField(entry, "via");
    if (via != null) parts.push(`via ${via}`);
    if (stoppedPids != null) parts.push(`stopped pids ${stoppedPids}`);
    if (remainingPids != null) parts.push(`remaining pids ${remainingPids}`);
    process.stdout.write(`- ${appName}: ${parts.join(" \xB7 ")}
`);
  }
}
function printStopResult(result, options, heading = "tools-dev stop") {
  if (options.json === true) {
    printJson(result);
    return;
  }
  printStopSection(result, heading);
}
function printRestartResult(result, options) {
  if (options.json === true) {
    printJson(result);
    return;
  }
  const record = asRecord(result);
  process.stdout.write("tools-dev restart\n");
  printStopSection(asRecord(record?.stop) ?? {}, "Stop");
  printStartSection(asRecord(record?.start) ?? {}, "Start");
}
function printStatusResult(result, options, appName) {
  if (options.json === true) {
    printJson(result);
    return;
  }
  const record = asRecord(result);
  const apps = asRecord(record?.apps);
  if (apps != null) {
    const namespace = stringField(record ?? {}, "namespace");
    const statusLabel = stringField(record ?? {}, "status");
    const details = [namespace == null ? null : `namespace ${namespace}`, statusLabel].filter((entry) => entry != null);
    process.stdout.write(`tools-dev status${details.length > 0 ? ` (${details.join(" \xB7 ")})` : ""}
`);
    printStatusEntries(apps);
    return;
  }
  process.stdout.write("tools-dev status\n");
  process.stdout.write(`- ${appName ?? ALL_APPS.join("/")}: ${formatStatusSummary(result)}
`);
}
function printRunForegroundResult(started, options) {
  if (options.json === true) {
    printJson({ mode: "foreground", started });
    return;
  }
  const webStatus = asRecord(asRecord(started.web)?.status);
  const daemonStatus = asRecord(asRecord(started.daemon)?.status);
  const webUrl = stringField(webStatus ?? {}, "url");
  const daemonUrl = stringField(daemonStatus ?? {}, "url");
  if (webUrl != null || daemonUrl != null) {
    process.stdout.write("\n  OpenDesign dev server ready\n\n");
    if (webUrl != null) process.stdout.write(`  \u279C  Web:    ${colorizeLink(normalizeDisplayUrl(webUrl))}
`);
    if (daemonUrl != null) process.stdout.write(`  \u279C  Daemon: ${colorizeLink(normalizeDisplayUrl(daemonUrl))}
`);
    process.stdout.write("\n  Press Ctrl+C to stop\n\n");
    return;
  }
  printStartSection(started, "tools-dev run");
  process.stdout.write("Foreground loop is active. Press Ctrl+C to stop.\n");
}
function runtimeLookup(config) {
  return { base: config.toolsDevRoot, namespace: config.namespace };
}
function appConfig(config, appName) {
  return config.apps[appName];
}
function urlPort(url) {
  const parsed = new URL(url);
  if (parsed.port) return parsed.port;
  return parsed.protocol === "https:" ? "443" : "80";
}
function statusMatchesForcedPort(url, forcedPort) {
  return forcedPort == null || url != null && urlPort(url) === String(forcedPort);
}
function prependNodePath(entries, current = process.env.NODE_PATH) {
  const existing = current == null || current.length === 0 ? [] : current.split(path5.delimiter);
  return [...entries, ...existing].join(path5.delimiter);
}
async function openAppLog(config, appName) {
  const logPath = appConfig(config, appName).latestLogPath;
  await mkdir(path5.dirname(logPath), { recursive: true });
  return await open(logPath, "a");
}
async function runLoggedCommand(request) {
  const child = spawn(request.command, request.args, {
    cwd: request.cwd,
    env: request.env,
    shell: false,
    stdio: ["ignore", request.logFd, request.logFd],
    windowsHide: process.platform === "win32",
    windowsVerbatimArguments: request.windowsVerbatimArguments
  });
  await new Promise((resolveRun, rejectRun) => {
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`command failed: ${request.command} ${request.args.join(" ")} (${signal ?? code})`));
    });
  });
}
function createConvergedAppStamp(config, appName) {
  return {
    app: appName,
    channel: "local",
    mode: "dev",
    namespace: config.namespace,
    source: SIDECAR_SOURCES2.TOOLS_DEV
  };
}
async function findAppProcessTree(config, appName) {
  const roots = await findSidecarProcesses(createConvergedAppStamp(config, appName));
  const rootPids = roots.map(({ pid }) => pid);
  return { pids: rootPids, rootPids };
}
async function assertNoStaleActiveProcess(config, appName) {
  const active = await findAppProcessTree(config, appName);
  if (active.pids.length > 0) {
    throw new Error(`${appName} has active stamped processes but no reachable IPC status; run tools-dev stop ${appName} first`);
  }
}
async function spawnSidecarRuntime(request) {
  const sidecarConfig = request.config.apps[request.appName];
  const launchRequest = {
    args: [request.config.tsxCliPath, sidecarConfig.sidecarEntryPath],
    command: process.execPath,
    cwd: request.config.workspaceRoot,
    detached: true,
    env: { ...process.env, ...request.env },
    logFd: request.logHandle.fd,
    resources: {
      dataRoot: resolveToolsDevDataRoot(request.config.workspaceRoot),
      ownerPid: request.env[TOOLS_DEV_PARENT_PID_ENV] == null ? null : Number(request.env[TOOLS_DEV_PARENT_PID_ENV]),
      port: Number(request.env[request.appName === APP_KEYS5.DAEMON ? SIDECAR_ENV2.DAEMON_PORT : SIDECAR_ENV2.WEB_PORT] ?? 0),
      runtimeRoot: request.config.toolsDevRoot
    },
    stamp: createConvergedAppStamp(request.config, request.appName)
  };
  return request.restart === true ? await restartSidecar(launchRequest, request.restartOptions) : await launchSidecar(launchRequest);
}
async function spawnDaemonRuntime(config, options, spawnOptions = {}) {
  const daemonPort = parsePortOption(options.daemonPort, "--daemon-port");
  const webPort = parsePortOption(options.webPort, "--web-port");
  const logHandle = await openAppLog(config, APP_KEYS5.DAEMON);
  try {
    await ensureDaemonCliBuild(config, logHandle);
    const velaLogs = [];
    const velaEnv = resolveDevVelaEnv(config.workspaceRoot, process.env, (message) => velaLogs.push(message));
    if (velaLogs.length > 0) {
      const message = `${velaLogs.join("\n")}
`;
      process.stderr.write(message);
      await logHandle.write(message);
    }
    await logHandle.write(`
[tools-dev] launching daemon at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
    if (webPort != null) await logHandle.write(`[tools-dev] trusting web origin port ${webPort}
`);
    if (spawnOptions.requireDesktopAuth) {
      await logHandle.write(`[tools-dev] requiring desktop auth on /api/import/folder
`);
    }
    return await spawnSidecarRuntime({
      appName: APP_KEYS5.DAEMON,
      config,
      env: {
        ...velaEnv,
        [SIDECAR_ENV2.DAEMON_PORT]: String(daemonPort ?? 0),
        ...webPort == null ? {} : { [SIDECAR_ENV2.WEB_PORT]: String(webPort) },
        ...options.parentPid == null ? {} : { [TOOLS_DEV_PARENT_PID_ENV]: String(options.parentPid) },
        ...spawnOptions.requireDesktopAuth ? { OD_REQUIRE_DESKTOP_AUTH: "1" } : {}
      },
      logHandle,
      ...spawnOptions.restart === void 0 ? {} : { restart: spawnOptions.restart },
      ...spawnOptions.restartOptions === void 0 ? {} : { restartOptions: spawnOptions.restartOptions }
    });
  } finally {
    await logHandle.close();
  }
}
async function spawnWebRuntime(config, options) {
  const daemonStatus = await waitForDaemonRuntime(runtimeLookup(config));
  if (daemonStatus.url == null) throw new Error("daemon must be running before web starts");
  const webPort = parsePortOption(options.webPort, "--web-port");
  const daemonPort = urlPort(daemonStatus.url);
  const logHandle = await openAppLog(config, APP_KEYS5.WEB);
  try {
    await ensureWebDevNodeModules(config);
    await writeWebDevTsconfig(config);
    await logHandle.write(`
[tools-dev] launching web at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
    await logHandle.write(`[tools-dev] proxying web API requests to daemon port ${daemonPort}
`);
    return await spawnSidecarRuntime({
      appName: APP_KEYS5.WEB,
      config,
      env: {
        NODE_PATH: prependNodePath([
          path5.join(config.workspaceRoot, "apps/web/node_modules"),
          path5.join(config.workspaceRoot, "node_modules")
        ]),
        [SIDECAR_ENV2.DAEMON_PORT]: daemonPort,
        // 正式构建使用应用自身的 .next；隔离目录只供开发模式使用。
        ...options.prod === true ? process.env.VIDEOFLOWCUT_OD_WEB_DIST_DIR ? {
          [SIDECAR_ENV2.WEB_DIST_DIR]: process.env.VIDEOFLOWCUT_OD_WEB_DIST_DIR
        } : {} : {
          [SIDECAR_ENV2.WEB_DIST_DIR]: config.apps.web.nextDistDir,
          [SIDECAR_ENV2.WEB_TSCONFIG_PATH]: config.apps.web.nextTsconfigPath
        },
        [SIDECAR_ENV2.WEB_PORT]: String(webPort ?? 0),
        PORT: String(webPort ?? 0),
        ...options.parentPid == null ? {} : { [TOOLS_DEV_PARENT_PID_ENV]: String(options.parentPid) },
        ...options.prod === true ? { NODE_ENV: "production", OD_WEB_OUTPUT_MODE: "server", OD_WEB_PROD: "1" } : {}
      },
      logHandle
    });
  } finally {
    await logHandle.close();
  }
}
async function buildDesktop(config, logHandle) {
  await logHandle.write(`
[tools-dev] building @open-design/desktop at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
  const invocation = createPackageManagerInvocation(["--filter", "@open-design/desktop", "build"], process.env);
  await runLoggedCommand({
    args: invocation.args,
    command: invocation.command,
    cwd: config.workspaceRoot,
    env: process.env,
    logFd: logHandle.fd,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
}
async function latestMtimeMs(filePath) {
  const entry = await lstat(filePath).catch(() => null);
  if (entry == null) return 0;
  if (!entry.isDirectory()) return entry.mtimeMs;
  const children = await readdir(filePath, { withFileTypes: true }).catch(() => []);
  let latest = entry.mtimeMs;
  for (const child of children) {
    if (child.name === "node_modules" || child.name === "dist" || child.name === ".tmp") continue;
    latest = Math.max(latest, await latestMtimeMs(path5.join(filePath, child.name)));
  }
  return latest;
}
async function ensureDaemonCliBuild(config, logHandle) {
  await ensureContractsBuild(config, logHandle);
  const daemonRoot = path5.join(config.workspaceRoot, "apps/daemon");
  const distCliPath = path5.join(daemonRoot, "dist/cli.js");
  const distMtime = await latestMtimeMs(distCliPath);
  const sourceMtime = Math.max(
    await latestMtimeMs(path5.join(daemonRoot, "src")),
    await latestMtimeMs(path5.join(daemonRoot, "package.json")),
    await latestMtimeMs(path5.join(daemonRoot, "tsconfig.json"))
  );
  if (distMtime > 0 && distMtime >= sourceMtime) return;
  const reason = distMtime > 0 ? "source is newer than apps/daemon/dist/cli.js" : "apps/daemon/dist/cli.js is missing";
  await logHandle.write(`
[tools-dev] building @open-design/daemon because ${reason} at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
  const invocation = createPackageManagerInvocation(["--filter", "@open-design/daemon", "build"], process.env);
  await runLoggedCommand({
    args: invocation.args,
    command: invocation.command,
    cwd: config.workspaceRoot,
    env: process.env,
    logFd: logHandle.fd,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
}
async function ensureContractsBuild(config, logHandle) {
  const contractsRoot = path5.join(config.workspaceRoot, "packages/contracts");
  const distDeclarationPath = path5.join(contractsRoot, "dist/index.d.ts");
  const distMtime = await latestMtimeMs(distDeclarationPath);
  const sourceMtime = Math.max(
    await latestMtimeMs(path5.join(contractsRoot, "src")),
    await latestMtimeMs(path5.join(contractsRoot, "package.json")),
    await latestMtimeMs(path5.join(contractsRoot, "tsconfig.json")),
    await latestMtimeMs(path5.join(contractsRoot, "esbuild.config.mjs"))
  );
  if (distMtime > 0 && distMtime >= sourceMtime) return;
  const reason = distMtime > 0 ? "source is newer than packages/contracts/dist/index.d.ts" : "packages/contracts/dist/index.d.ts is missing";
  await logHandle.write(`
[tools-dev] building @open-design/contracts because ${reason} at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
  const invocation = createPackageManagerInvocation(["--filter", "@open-design/contracts", "build"], process.env);
  await runLoggedCommand({
    args: invocation.args,
    command: invocation.command,
    cwd: config.workspaceRoot,
    env: process.env,
    logFd: logHandle.fd,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
}
async function ensureWebDevNodeModules(config) {
  const webRuntimeRoot = path5.dirname(config.apps.web.nextDistDir);
  const runtimeNodeModules = path5.join(webRuntimeRoot, "node_modules");
  const webNodeModules = path5.join(config.workspaceRoot, "apps/web/node_modules");
  await mkdir(webRuntimeRoot, { recursive: true });
  const current = await lstat(runtimeNodeModules).catch(() => null);
  if (current?.isSymbolicLink()) return;
  if (current != null) await rm(runtimeNodeModules, { force: true, recursive: true });
  await symlink(webNodeModules, runtimeNodeModules, "junction");
}
async function writeWebDevTsconfig(config) {
  const webRoot = path5.join(config.workspaceRoot, "apps/web");
  const tsconfigPath = config.apps.web.nextTsconfigPath;
  const tsconfigDir = path5.dirname(tsconfigPath);
  const sourceTsconfig = path5.join(webRoot, "tsconfig.json");
  const relativeSourceTsconfig = (path5.relative(tsconfigDir, sourceTsconfig) || "./tsconfig.json").replaceAll("\\", "/");
  await mkdir(tsconfigDir, { recursive: true });
  await writeFile(
    tsconfigPath,
    `${JSON.stringify({
      extends: relativeSourceTsconfig,
      compilerOptions: {
        plugins: [{ name: "next" }]
      }
    }, null, 2)}
`,
    "utf8"
  );
}
async function spawnDesktopRuntime(config, options) {
  const logHandle = await openAppLog(config, APP_KEYS5.DESKTOP);
  try {
    await buildDesktop(config, logHandle);
    await logHandle.write(`[tools-dev] launching desktop at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
    const spawnEnv = {
      ...process.env,
      ...options.parentPid == null ? {} : { [TOOLS_DEV_PARENT_PID_ENV]: String(options.parentPid) }
    };
    for (const key of Object.keys(spawnEnv)) {
      if (key.toUpperCase() === "ELECTRON_RUN_AS_NODE") {
        delete spawnEnv[key];
      }
    }
    const spawned = await launchSidecar({
      args: [config.apps.desktop.mainEntryPath],
      command: config.apps.desktop.electronBinaryPath,
      cwd: config.workspaceRoot,
      detached: true,
      env: spawnEnv,
      logFd: logHandle.fd,
      resources: {
        dataRoot: resolveToolsDevDataRoot(config.workspaceRoot),
        ownerPid: options.parentPid ?? null,
        port: 0,
        runtimeRoot: config.toolsDevRoot
      },
      stamp: createConvergedAppStamp(config, APP_KEYS5.DESKTOP)
    });
    return { pid: spawned.pid };
  } finally {
    await logHandle.close();
  }
}
async function startDaemon(config, options, startOptions = {}) {
  const daemonPort = parsePortOption(options.daemonPort, "--daemon-port");
  const webPort = parsePortOption(options.webPort, "--web-port");
  let existing = await inspectDaemonRuntime(runtimeLookup(config));
  const shouldRefreshWebOrigin = startOptions.refreshWebOrigin === true && webPort != null;
  const existingWeb = shouldRefreshWebOrigin ? await inspectWebRuntime(runtimeLookup(config)) : null;
  if (existingWeb?.url != null && !statusMatchesForcedPort(existingWeb.url, webPort)) {
    throw new Error(`${APP_KEYS5.WEB} is already running in namespace ${config.namespace} at ${existingWeb.url}; stop it or choose another namespace`);
  }
  const daemonTrustedWebOriginPort = existing?.trustedWebOriginPort ?? null;
  if (existing?.url != null && statusMatchesForcedPort(existing.url, daemonPort)) {
    if (options.parentPid != null) {
      throw new Error(
        `${APP_KEYS5.DAEMON} is already running in namespace ${config.namespace} at ${existing.url}; owner-bound starts require a clean namespace, so stop it or choose another namespace`
      );
    }
    if (shouldRefreshWebOrigin && daemonTrustedWebOriginPort !== webPort) {
      if (existingWeb?.url != null) {
        await stopApp(config, APP_KEYS5.WEB);
      }
      await stopApp(config, APP_KEYS5.DAEMON);
      existing = null;
    } else {
      return { app: APP_KEYS5.DAEMON, created: false, logPath: config.apps.daemon.latestLogPath, status: existing };
    }
  }
  if (existing?.url != null) {
    throw new Error(`${APP_KEYS5.DAEMON} is already running in namespace ${config.namespace} at ${existing.url}; stop it or choose another namespace`);
  }
  await assertNoStaleActiveProcess(config, APP_KEYS5.DAEMON);
  const desktopAlreadyRunning = await inspectDesktopRuntime(runtimeLookup(config));
  const requireDesktopAuth = (startOptions.requireDesktopAuth ?? false) || desktopAlreadyRunning != null;
  const spawned = await spawnDaemonRuntime(config, options, { requireDesktopAuth });
  try {
    const status2 = await waitForDaemonRuntime(
      runtimeLookup(config),
      void 0,
      () => isProcessAlive(spawned.pid)
    );
    return {
      app: APP_KEYS5.DAEMON,
      created: true,
      logPath: config.apps.daemon.latestLogPath,
      pid: spawned.pid,
      status: status2
    };
  } catch (error) {
    const logPath = config.apps.daemon.latestLogPath;
    const lines = await readLogTail(logPath, 80).catch(() => []);
    await stopApp(config, APP_KEYS5.DAEMON).catch(() => void 0);
    throw appendStartupLogDiagnostics(error, APP_KEYS5.DAEMON, createStartupLogDiagnostics(logPath, lines));
  }
}
async function restartDaemon(config, options) {
  const runningDaemon = await inspectDaemonRuntime(runtimeLookup(config));
  const runningWeb = await inspectWebRuntime(runtimeLookup(config));
  const requestedDaemonPort = parsePortOption(options.daemonPort, "--daemon-port");
  const requestedWebPort = parsePortOption(options.webPort, "--web-port");
  const runningDaemonPort = runningDaemon?.url == null ? null : Number(urlPort(runningDaemon.url));
  const runningWebPort = runningWeb?.url == null ? null : Number(urlPort(runningWeb.url));
  if (runningWebPort != null && requestedWebPort != null && requestedWebPort !== runningWebPort) {
    throw new Error(
      `${APP_KEYS5.WEB} is already running in namespace ${config.namespace} at ${runningWeb?.url}; restart web to change its port`
    );
  }
  if (runningWebPort != null && requestedDaemonPort != null && runningDaemonPort != null && requestedDaemonPort !== runningDaemonPort) {
    throw new Error(
      `${APP_KEYS5.WEB} still depends on daemon port ${runningDaemonPort}; restart web to change the daemon port`
    );
  }
  const restartOptions = {
    ...options,
    ...runningWebPort == null ? {} : { webPort: runningWebPort },
    ...requestedDaemonPort == null && runningDaemonPort != null ? { daemonPort: runningDaemonPort } : {}
  };
  const desktopAlreadyRunning = await inspectDesktopRuntime(runtimeLookup(config));
  const restarted = await spawnDaemonRuntime(config, restartOptions, {
    requireDesktopAuth: desktopAlreadyRunning != null,
    restart: true,
    restartOptions: { requireConcretePort: runningWebPort != null }
  });
  if (!("stop" in restarted)) throw new Error("sidecar restart did not return its stopped generation");
  try {
    const status2 = await waitForDaemonRuntime(
      runtimeLookup(config),
      void 0,
      () => isProcessAlive(restarted.pid)
    );
    return {
      start: {
        [APP_KEYS5.DAEMON]: {
          app: APP_KEYS5.DAEMON,
          created: true,
          logPath: config.apps.daemon.latestLogPath,
          pid: restarted.pid,
          status: status2
        }
      },
      stop: {
        [APP_KEYS5.DAEMON]: formatStopAppResult(APP_KEYS5.DAEMON, restarted.stop)
      }
    };
  } catch (error) {
    const logPath = config.apps.daemon.latestLogPath;
    const lines = await readLogTail(logPath, 80).catch(() => []);
    await stopApp(config, APP_KEYS5.DAEMON).catch(() => void 0);
    throw appendStartupLogDiagnostics(error, APP_KEYS5.DAEMON, createStartupLogDiagnostics(logPath, lines));
  }
}
async function startWeb(config, options) {
  const webPort = parsePortOption(options.webPort, "--web-port");
  const existing = await inspectWebRuntime(runtimeLookup(config));
  if (existing?.url != null && statusMatchesForcedPort(existing.url, webPort)) {
    if (options.parentPid != null) {
      throw new Error(
        `${APP_KEYS5.WEB} is already running in namespace ${config.namespace} at ${existing.url}; owner-bound starts require a clean namespace, so stop it or choose another namespace`
      );
    }
    return { app: APP_KEYS5.WEB, created: false, logPath: config.apps.web.latestLogPath, status: existing };
  }
  if (existing?.url != null) {
    throw new Error(`${APP_KEYS5.WEB} is already running in namespace ${config.namespace} at ${existing.url}; stop it or choose another namespace`);
  }
  await assertNoStaleActiveProcess(config, APP_KEYS5.WEB);
  const spawned = await spawnWebRuntime(config, options);
  try {
    const status2 = await waitForWebRuntime(
      runtimeLookup(config),
      void 0,
      () => isProcessAlive(spawned.pid)
    );
    return {
      app: APP_KEYS5.WEB,
      created: true,
      logPath: config.apps.web.latestLogPath,
      pid: spawned.pid,
      status: status2
    };
  } catch (error) {
    const logPath = config.apps.web.latestLogPath;
    const lines = await readLogTail(logPath, 80).catch(() => []);
    await stopApp(config, APP_KEYS5.WEB).catch(() => void 0);
    throw appendStartupLogDiagnostics(error, APP_KEYS5.WEB, createStartupLogDiagnostics(logPath, lines));
  }
}
async function startDesktop(config, options) {
  const existing = await inspectDesktopRuntime(runtimeLookup(config));
  if (existing != null) {
    if (options.parentPid != null) {
      throw new Error(
        `${APP_KEYS5.DESKTOP} is already running in namespace ${config.namespace}; owner-bound starts require a clean namespace, so stop it or choose another namespace`
      );
    }
    return { app: APP_KEYS5.DESKTOP, created: false, logPath: config.apps.desktop.latestLogPath, status: existing };
  }
  await assertNoStaleActiveProcess(config, APP_KEYS5.DESKTOP);
  const spawned = await spawnDesktopRuntime(config, options);
  try {
    const status2 = await waitForDesktopRuntime(
      runtimeLookup(config),
      void 0,
      () => isProcessAlive(spawned.pid)
    );
    return {
      app: APP_KEYS5.DESKTOP,
      created: true,
      logPath: config.apps.desktop.latestLogPath,
      pid: spawned.pid,
      status: status2
    };
  } catch (error) {
    await stopApp(config, APP_KEYS5.DESKTOP).catch(() => void 0);
    throw error;
  }
}
async function startApp(config, appName, options, context = {}) {
  switch (appName) {
    case APP_KEYS5.DAEMON:
      return await startDaemon(config, options, {
        // PR #974 round-4 P1: when daemon is being spawned alongside
        // desktop in the same orchestrator invocation, pin the import-
        // auth gate via env var so the daemon refuses tokenless imports
        // before desktop has had a chance to register. The introspection
        // case (desktop already running) is handled inside startDaemon.
        refreshWebOrigin: context.targets?.includes(APP_KEYS5.WEB) === true,
        requireDesktopAuth: context.targets?.includes(APP_KEYS5.DESKTOP) === true
      });
    case APP_KEYS5.WEB:
      return await startWeb(config, options);
    case APP_KEYS5.DESKTOP:
      await ensureDaemonGateForDesktop({
        inspectDaemon: () => inspectDaemonRuntime(runtimeLookup(config)),
        inspectWeb: () => inspectWebRuntime(runtimeLookup(config)),
        stopApp: async (app) => {
          await stopApp(config, app);
        },
        // Round 7 (lefarcen P2): preserve the running daemon/web ports
        // across the hardening restart. Without this, a stack started
        // with `--daemon-port`/`--web-port` would silently drift to
        // random ports during the restart, breaking pinned browsers.
        startDaemonGated: async ({ port, webPort }) => {
          const portedOptions = port != null ? { ...options, daemonPort: port } : { ...options };
          if (webPort != null) portedOptions.webPort = webPort;
          await startDaemon(config, portedOptions, {
            refreshWebOrigin: webPort != null,
            requireDesktopAuth: true
          });
        },
        startWeb: async ({ port }) => {
          const portedOptions = port != null ? { ...options, webPort: port } : options;
          await startWeb(config, portedOptions);
        },
        log: (msg) => process.stderr.write(`${msg}
`)
      });
      return await startDesktop(config, options);
  }
}
function formatStopAppResult(appName, stop) {
  return {
    app: appName,
    status: stop.alreadyStopped && !stop.gracefulAccepted ? "not-running" : stop.remainingPids.length === 0 ? "stopped" : "partial",
    stop,
    via: stop.gracefulAccepted ? stop.forcedPids.length === 0 ? "ipc" : "ipc+fallback" : "fallback"
  };
}
async function stopApp(config, appName) {
  return formatStopAppResult(appName, await stopSidecar(createConvergedAppStamp(config, appName)));
}
async function inspectAppStatus(config, appName) {
  if (appName === APP_KEYS5.DAEMON) {
    const status3 = await inspectDaemonRuntime(runtimeLookup(config));
    if (status3 != null) return status3;
    const active2 = await findAppProcessTree(config, appName);
    return {
      // PR #974 round 6: synthetic snapshot when the IPC is unreachable
      // — daemon is starting or idle, so the gate is definitionally not
      // active yet. The desktop-auth-gate helper treats this branch as
      // "no daemon running" via the null check, but the type contract
      // still requires the field.
      desktopAuthGateActive: false,
      pid: active2.rootPids[0] ?? null,
      state: active2.pids.length > 0 ? "starting" : "idle",
      url: null
    };
  }
  if (appName === APP_KEYS5.WEB) {
    const status3 = await inspectWebRuntime(runtimeLookup(config));
    if (status3 != null) return status3;
    const active2 = await findAppProcessTree(config, appName);
    return { pid: active2.rootPids[0] ?? null, state: active2.pids.length > 0 ? "starting" : "idle", url: null };
  }
  const status2 = await inspectDesktopRuntime(runtimeLookup(config));
  if (status2 != null) return status2;
  const active = await findAppProcessTree(config, appName);
  return { pid: active.rootPids[0] ?? null, state: active.pids.length > 0 ? "unknown" : "idle", url: null };
}
function summarizeStatus(apps) {
  const states = Object.values(apps).map((entry) => entry?.state);
  if (states.every((state) => state === "idle")) return "not-running";
  if (states.every((state) => state === "running")) return "running";
  return "partial";
}
async function status(config, appName) {
  const targets = resolveTargetApps(appName, DEFAULT_START_APPS);
  if (targets.length === 1) return await inspectAppStatus(config, targets[0]);
  const apps = Object.fromEntries(
    await Promise.all(targets.map(async (target) => [target, await inspectAppStatus(config, target)]))
  );
  return { apps, namespace: config.namespace, status: summarizeStatus(apps) };
}
async function restartTargets(config, appName, options) {
  if (appName === APP_KEYS5.DAEMON) return await restartDaemon(config, options);
  const stopTargets = resolveStopApps(appName);
  const startTargets = resolveStartApps(appName);
  await resolveSharedPortsFromRunningState(startTargets, options, {
    daemonUrl: async () => (await inspectDaemonRuntime(runtimeLookup(config)))?.url,
    webUrl: async () => (await inspectWebRuntime(runtimeLookup(config)))?.url
  });
  return {
    stop: await runSequential(stopTargets, (target) => stopApp(config, target)),
    start: await runSequential(startTargets, (target) => startApp(config, target, options, { targets: startTargets }))
  };
}
async function readLogs(config, appName) {
  const logPath = appConfig(config, appName).latestLogPath;
  return { app: appName, lines: await readLogTail(logPath, 200), logPath };
}
function createLogDiagnostics(logs) {
  return Object.fromEntries(
    Object.entries(logs).map(([appName, log]) => [appName, detectLogDiagnostics(log.lines)])
  );
}
function isLogResult(value) {
  return Array.isArray(value.lines);
}
function printLogs(result, options) {
  if (options.json === true) {
    printJson(result);
    return;
  }
  const entries = isLogResult(result) ? [[result.app, result]] : Object.entries(result);
  for (const [appName, entry] of entries) {
    process.stdout.write(`[${appName}] ${entry.logPath}
`);
    process.stdout.write(entry.lines.length > 0 ? `${entry.lines.join("\n")}
` : "(no log lines)\n");
  }
}
function printCheckResult(result, options) {
  if (options.json === true) {
    printJson(result);
    return;
  }
  const record = asRecord(result);
  const namespace = record == null ? null : stringField(record, "namespace");
  process.stdout.write(`tools-dev check${namespace == null ? "" : ` (namespace ${namespace})`}
`);
  const apps = asRecord(record?.apps);
  if (apps != null) {
    process.stdout.write("Status\n");
    printStatusEntries(apps);
  }
  const logs = asRecord(record?.logs);
  if (logs != null) {
    process.stdout.write("\nLogs\n");
    printLogs(logs, options);
  }
  const diagnostics = asRecord(record?.diagnostics);
  if (diagnostics != null) {
    const entries = Object.entries(diagnostics).map(([appName, value]) => [appName, Array.isArray(value) ? formatLogDiagnostics(value) : null]).filter((entry) => entry[1] != null);
    if (entries.length > 0) {
      process.stdout.write("\nDiagnostics\n");
      for (const [appName, message] of entries) {
        process.stdout.write(`[${appName}] ${message}
`);
      }
    }
  }
}
function parseTimeoutMs(value) {
  if (value == null) return void 0;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("--timeout must be a positive number of seconds");
  return seconds * 1e3;
}
async function inspectDesktop(config, target, options) {
  const operation = target ?? "status";
  const timeoutMs = parseTimeoutMs(options.timeout) ?? 3e4;
  switch (operation) {
    case "status":
      return await inspectDesktopRuntime(runtimeLookup(config), 1e3) ?? { state: "idle" };
    case "eval":
      if (options.expr == null) throw new Error("--expr is required for desktop eval");
      return await invokeSidecar(createConvergedAppStamp(config, APP_KEYS5.DESKTOP), SIDECAR_MESSAGES.EVAL, { expression: options.expr }, { timeoutMs });
    case "screenshot":
      if (options.path == null) throw new Error("--path is required for desktop screenshot");
      return await invokeSidecar(createConvergedAppStamp(config, APP_KEYS5.DESKTOP), SIDECAR_MESSAGES.SCREENSHOT, { path: options.path }, { timeoutMs });
    case "console":
      return await invokeSidecar(createConvergedAppStamp(config, APP_KEYS5.DESKTOP), SIDECAR_MESSAGES.CONSOLE, void 0, { timeoutMs });
    case "update":
      if (options.updateAction != null && !["status", "check", "download", "install"].includes(options.updateAction)) {
        throw new Error("--update-action must be status, check, download, or install");
      }
      return await invokeSidecar(createConvergedAppStamp(config, APP_KEYS5.DESKTOP), SIDECAR_MESSAGES.UPDATE, { action: options.updateAction ?? "status" }, { timeoutMs });
    case "click":
      if (options.selector == null) throw new Error("--selector is required for desktop click");
      return await invokeSidecar(createConvergedAppStamp(config, APP_KEYS5.DESKTOP), SIDECAR_MESSAGES.CLICK, { selector: options.selector }, { timeoutMs });
    default:
      throw new Error(`unsupported desktop inspect target: ${operation}`);
  }
}
async function inspect(config, appName, target, options) {
  if (appName === APP_KEYS5.DAEMON) {
    if (target != null && target !== "status") throw new Error(`unsupported daemon inspect target: ${target}`);
    return await inspectDaemonRuntime(runtimeLookup(config), 1e3) ?? { desktopAuthGateActive: false, state: "idle", url: null };
  }
  if (appName === APP_KEYS5.WEB) {
    if (target != null && target !== "status") throw new Error(`unsupported web inspect target: ${target}`);
    return await inspectWebRuntime(runtimeLookup(config), 1e3) ?? { state: "idle", url: null };
  }
  if (appName !== APP_KEYS5.DESKTOP) throw new Error(`unsupported tools-dev app: ${appName}`);
  return await inspectDesktop(config, target, options);
}
async function runSequential(targets, operation) {
  const result = {};
  for (const target of targets) result[target] = await operation(target);
  return result;
}
function stopOrderFor(targets) {
  const selected = new Set(targets);
  return DEFAULT_STOP_APPS.filter((target) => selected.has(target));
}
async function runForeground(config, appName, options) {
  const targets = resolveRunApps(appName);
  const foregroundOptions = { ...options, parentPid: process.pid };
  await resolveSharedPortsFromRunningState(targets, foregroundOptions, {
    daemonUrl: async () => (await inspectDaemonRuntime(runtimeLookup(config)))?.url,
    webUrl: async () => (await inspectWebRuntime(runtimeLookup(config)))?.url
  });
  const started = await runSequential(targets, (target) => startApp(config, target, foregroundOptions, { targets }));
  printRunForegroundResult(started, options);
  let shuttingDown = false;
  const keepAlive = setInterval(() => void 0, 6e4);
  await new Promise((resolveDone) => {
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      clearInterval(keepAlive);
      process.stderr.write("\nStopping OpenDesign dev server...\n");
      void runSequential(stopOrderFor(targets), (target) => stopApp(config, target)).finally(() => {
        for (const sig of ["SIGINT", "SIGTERM"]) {
          process.off(sig, shutdown);
        }
        process.exitCode = 0;
        resolveDone();
      });
    };
    for (const sig of ["SIGINT", "SIGTERM"]) {
      process.on(sig, shutdown);
    }
  });
}
var cli = cac("tools-dev");
function addSharedOptions(command) {
  return command.option("--namespace <name>", "runtime namespace (default: default)").option("--tools-dev-root <path>", "tools-dev runtime root").option("--env-file <path>", "load env file before resolving tools-dev config; repeatable").option("--no-env-file", "skip automatic .env file loading", { default: false }).option("--json", "print JSON");
}
function addPortOptions(command) {
  return command.option("--daemon-port <port>", "force daemon port; conflict quick-fails").option("--web-port <port>", "force web port; conflict quick-fails").option("--prod", "use production build (requires pnpm --filter @open-design/web build first)");
}
addPortOptions(addSharedOptions(cli.command("start [app]", "Start daemon, web, desktop, or all when app is omitted"))).option("--parent-pid <pid>", "stop started apps when this owner process exits").action(
  async (appName, options) => {
    assertSupportedNodeRuntimeForStart();
    const parentPid = parseParentPidOption(options.parentPid);
    if (parentPid != null && !isProcessAlive(parentPid)) {
      throw new Error(`--parent-pid process is not alive: ${parentPid}`);
    }
    const startOptions = parentPid == null ? options : { ...options, parentPid };
    const config = resolveToolDevConfig(startOptions);
    const targets = resolveStartApps(appName);
    await resolveSharedPortsFromRunningState(targets, startOptions, {
      daemonUrl: async () => (await inspectDaemonRuntime(runtimeLookup(config)))?.url,
      webUrl: async () => (await inspectWebRuntime(runtimeLookup(config)))?.url
    });
    const result = await runSequential(
      targets,
      (target) => startApp(config, target, startOptions, { targets })
    );
    printStartResult(result, startOptions);
  }
);
addPortOptions(addSharedOptions(cli.command("run [app]", "Start apps and keep this command alive until interrupted"))).action(
  async (appName, options) => {
    assertSupportedNodeRuntimeForStart();
    await runForeground(resolveToolDevConfig(options), appName, options);
  }
);
addSharedOptions(cli.command("status [app]", "Show app status for daemon, web, desktop, or all")).action(
  async (appName, options) => {
    printStatusResult(await status(resolveToolDevConfig(options), appName), options, appName);
  }
);
addSharedOptions(cli.command("stop [app]", "Stop daemon, web, desktop, or all when app is omitted")).action(
  async (appName, options) => {
    const config = resolveToolDevConfig(options);
    const targets = resolveStopApps(appName);
    const result = await runSequential(targets, (target) => stopApp(config, target));
    printStopResult(result, options);
  }
);
addPortOptions(addSharedOptions(cli.command("restart [app]", "Restart daemon, web, desktop, or all when app is omitted"))).action(
  async (appName, options) => {
    assertSupportedNodeRuntimeForStart();
    printRestartResult(await restartTargets(resolveToolDevConfig(options), appName, options), options);
  }
);
addSharedOptions(cli.command("logs [app]", "Show log tail for daemon, web, desktop, or all")).action(
  async (appName, options) => {
    const config = resolveToolDevConfig(options);
    const targets = resolveTargetApps(appName, DEFAULT_START_APPS);
    const result = targets.length === 1 ? await readLogs(config, targets[0]) : Object.fromEntries(await Promise.all(targets.map(async (target) => [target, await readLogs(config, target)])));
    printLogs(result, options);
  }
);
addSharedOptions(
  cli.command("inspect <app> [target]", "Inspect daemon/web status or desktop status/eval/screenshot/console/click")
).option("--expr <js>", "JavaScript expression for desktop eval").option("--path <file>", "Output path for desktop screenshot").option("--selector <css>", "CSS selector for desktop click").option("--timeout <seconds>", "Desktop inspect timeout in seconds").option("--update-action <action>", "Desktop update action: status|check|download|install").action(async (appName, target, options) => {
  output(await inspect(resolveToolDevConfig(options), appName, target, options), options);
});
addSharedOptions(cli.command("check [app]", "Print status and recent logs for quick diagnostics")).action(
  async (appName, options) => {
    const config = resolveToolDevConfig(options);
    const targets = resolveTargetApps(appName, DEFAULT_START_APPS);
    const apps = Object.fromEntries(
      await Promise.all(targets.map(async (target) => [target, await inspectAppStatus(config, target)]))
    );
    const logs = Object.fromEntries(
      await Promise.all(targets.map(async (target) => [target, await readLogs(config, target)]))
    );
    printCheckResult({ apps, diagnostics: createLogDiagnostics(logs), logs, namespace: config.namespace }, options);
  }
);
cli.help();
var rawCliArgs = process.argv.slice(2);
var cliArgs = rawCliArgs[0] === "--" ? rawCliArgs.slice(1) : rawCliArgs;
loadWorkspaceLocalEnv({
  args: cliArgs,
  log: (message) => process.stderr.write(`${message}
`),
  workspaceRoot: WORKSPACE_ROOT
});
process.argv.splice(2, process.argv.length - 2, ...rewriteCliArgsForDefaultStart(cliArgs));
cli.parse();
