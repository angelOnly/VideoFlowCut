// src/protocol.ts
var OPEN_DESIGN_HOST_GLOBAL = "__od__";
var OPEN_DESIGN_HOST_VERSION = 2;
var OPEN_DESIGN_HOST_CLIENT_TYPES = Object.freeze({
  DESKTOP: "desktop"
});
var OPEN_DESIGN_HOST_APPEARANCE_THEMES = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system"
});
var OPEN_DESIGN_HOST_UPDATER_ACTIONS = Object.freeze({
  CHECK: "check",
  CLEAR_CACHE: "clear-cache",
  DOWNLOAD: "download",
  INSTALL: "install",
  QUIT: "quit",
  STATUS: "status"
});
var OPEN_DESIGN_HOST_UPDATER_STATES = Object.freeze({
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

// src/detection.ts
function isRecord(value) {
  return typeof value === "object" && value != null && !Array.isArray(value);
}
function hasFunction(record, key) {
  return typeof record[key] === "function";
}
function isOpenDesignHostBridge(value) {
  if (!isRecord(value)) return false;
  if (value.version !== OPEN_DESIGN_HOST_VERSION) return false;
  const client = value.client;
  if (!isRecord(client) || client.type !== OPEN_DESIGN_HOST_CLIENT_TYPES.DESKTOP) return false;
  if (client.platform != null && typeof client.platform !== "string") return false;
  if (client.osLocale != null && typeof client.osLocale !== "string") return false;
  const shell = value.shell;
  if (!isRecord(shell) || !hasFunction(shell, "openExternal") || !hasFunction(shell, "openPath")) return false;
  const browser = value.browser;
  if (!isRecord(browser) || !hasFunction(browser, "clearData")) return false;
  const capture = value.capture;
  if (!isRecord(capture) || !hasFunction(capture, "page")) return false;
  const project = value.project;
  if (!isRecord(project) || !hasFunction(project, "pickAndImport") || !hasFunction(project, "pickAndReplaceWorkingDir")) {
    return false;
  }
  const pdf = value.pdf;
  if (!isRecord(pdf) || !hasFunction(pdf, "print")) return false;
  const pet = value.pet;
  if (!isRecord(pet) || !hasFunction(pet, "setVisible")) return false;
  const updater = value.updater;
  if (!isRecord(updater) || !hasFunction(updater, "status") || !hasFunction(updater, "check") || !hasFunction(updater, "clear-cache") || !hasFunction(updater, "download") || !hasFunction(updater, "install") || !hasFunction(updater, "quit") || !hasFunction(updater, "setMenuLabels") || !hasFunction(updater, "subscribe") || !hasFunction(updater, "subscribeOpenDialog")) {
    return false;
  }
  return true;
}
function candidateFromScope(scope) {
  if (OPEN_DESIGN_HOST_GLOBAL in scope) return scope[OPEN_DESIGN_HOST_GLOBAL];
  const windowValue = scope.window;
  if (isRecord(windowValue) && OPEN_DESIGN_HOST_GLOBAL in windowValue) {
    return windowValue[OPEN_DESIGN_HOST_GLOBAL];
  }
  return void 0;
}
function getOpenDesignHost(scope = globalThis) {
  const candidate = candidateFromScope(scope);
  return isOpenDesignHostBridge(candidate) ? candidate : null;
}
function isOpenDesignHostAvailable(scope = globalThis) {
  return getOpenDesignHost(scope) != null;
}
function detectOpenDesignHostClientType(scope = globalThis) {
  return getOpenDesignHost(scope)?.client.type ?? "web";
}

// src/normalize.ts
function isRecord2(value) {
  return typeof value === "object" && value != null && !Array.isArray(value);
}
function failure(reason, details) {
  return {
    ...details === void 0 ? {} : { details },
    ok: false,
    reason
  };
}
function normalizeOpenDesignHostProjectImportResult(input) {
  if (!isRecord2(input)) {
    return failure("desktop import returned an invalid response", input);
  }
  if (input.ok !== true) {
    if (input.canceled === true) return { canceled: true, ok: false };
    const reason = typeof input.reason === "string" && input.reason.length > 0 ? input.reason : "unknown failure";
    return failure(reason, input.details);
  }
  const response = input.response;
  if (!isRecord2(response)) {
    return failure("daemon import response was not an object", response);
  }
  const project = response.project;
  const rawProjectId = isRecord2(project) ? project.id : null;
  const projectId = typeof rawProjectId === "string" ? rawProjectId : null;
  const conversationId = typeof response.conversationId === "string" ? response.conversationId : null;
  const entryFile = typeof response.entryFile === "string" || response.entryFile === null ? response.entryFile : void 0;
  if (projectId == null || conversationId == null || entryFile === void 0) {
    return failure("daemon import response did not include host project identifiers", response);
  }
  return {
    conversationId,
    entryFile,
    ok: true,
    projectId
  };
}
function normalizeOpenDesignHostProjectReplaceWorkingDirResult(input) {
  if (!isRecord2(input)) {
    return failure("desktop working-dir replace returned an invalid response", input);
  }
  if (input.ok !== true) {
    if (input.canceled === true) return { canceled: true, ok: false };
    const reason = typeof input.reason === "string" && input.reason.length > 0 ? input.reason : "unknown failure";
    return failure(reason, input.details);
  }
  const response = input.response;
  if (!isRecord2(response)) {
    return failure("daemon working-dir response was not an object", response);
  }
  const baseDir = typeof response.baseDir === "string" ? response.baseDir : null;
  const entryFile = typeof response.entryFile === "string" ? response.entryFile : null;
  if (baseDir == null) {
    return failure("daemon working-dir response did not include baseDir", response);
  }
  return { baseDir, entryFile, ok: true };
}
function normalizeOpenDesignHostPickWorkingDirResult(input) {
  if (!isRecord2(input)) {
    return failure("desktop working-dir pick returned an invalid response", input);
  }
  if (input.ok !== true) {
    if (input.canceled === true) return { canceled: true, ok: false };
    const reason = typeof input.reason === "string" && input.reason.length > 0 ? input.reason : "unknown failure";
    return failure(reason, input.details);
  }
  const baseDir = typeof input.baseDir === "string" ? input.baseDir : null;
  const token = typeof input.token === "string" ? input.token : null;
  if (baseDir == null || token == null) {
    return failure("desktop working-dir pick did not include baseDir and token", input);
  }
  return { baseDir, ok: true, token };
}

// src/actions.ts
function failure2(reason, details) {
  return {
    ...details === void 0 ? {} : { details },
    ok: false,
    reason
  };
}
function unavailable(reason) {
  return failure2(reason);
}
async function openHostExternalUrl(url, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.shell.openExternal(url);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function openHostProjectPath(projectId, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.shell.openPath(projectId);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function clearHostBrowserData(options, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.browser.clearData(options);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function captureHostPage(options, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.capture.page(options);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function pickAndImportHostProject(init, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.project.pickAndImport(init);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function pickAndReplaceHostProjectWorkingDir(projectId, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.project.pickAndReplaceWorkingDir(projectId);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function pickHostWorkingDir(scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  if (typeof host.project.pickWorkingDir !== "function") {
    return unavailable("host build does not support pickWorkingDir");
  }
  try {
    return await host.project.pickWorkingDir();
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function printHostPdf(html, nonce, options, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.pdf.print(html, nonce, options);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
function setHostPetVisible(visible, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    host.pet.setVisible(visible);
    return { ok: true };
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
function getLatestHostPreviewNavigationFailure(scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (typeof host?.preview?.getLatestNavigationFailure !== "function") return null;
  try {
    return host.preview.getLatestNavigationFailure();
  } catch {
    return null;
  }
}
function subscribeHostPreviewNavigationFailure(listener, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (typeof host?.preview?.subscribeNavigationFailure !== "function") return () => void 0;
  try {
    return host.preview.subscribeNavigationFailure(listener);
  } catch {
    return () => void 0;
  }
}
async function runHostUpdaterAction(action, options, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return {
      ok: true,
      status: await host.updater[action](options)
    };
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
async function getHostUpdaterStatus(options, scope = globalThis) {
  return await runHostUpdaterAction(OPEN_DESIGN_HOST_UPDATER_ACTIONS.STATUS, options, scope);
}
async function checkHostUpdater(options, scope = globalThis) {
  return await runHostUpdaterAction(OPEN_DESIGN_HOST_UPDATER_ACTIONS.CHECK, options, scope);
}
async function downloadHostUpdater(options, scope = globalThis) {
  return await runHostUpdaterAction(OPEN_DESIGN_HOST_UPDATER_ACTIONS.DOWNLOAD, options, scope);
}
async function clearHostUpdaterCache(options, scope = globalThis) {
  return await runHostUpdaterAction(OPEN_DESIGN_HOST_UPDATER_ACTIONS.CLEAR_CACHE, options, scope);
}
async function installHostUpdater(options, scope = globalThis) {
  return await runHostUpdaterAction(OPEN_DESIGN_HOST_UPDATER_ACTIONS.INSTALL, options, scope);
}
async function quitHostAfterUpdaterInstallerOpen(options, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.updater.quit(options);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
function subscribeHostUpdater(listener, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return () => void 0;
  try {
    return host.updater.subscribe(listener);
  } catch {
    return () => void 0;
  }
}
function subscribeHostUpdaterOpenDialog(listener, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return () => void 0;
  try {
    return host.updater.subscribeOpenDialog(listener);
  } catch {
    return () => void 0;
  }
}
async function setHostUpdaterMenuLabels(labels, scope = globalThis) {
  const host = getOpenDesignHost(scope);
  if (host == null) return unavailable("OpenDesign host is not available");
  try {
    return await host.updater.setMenuLabels(labels);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
function subscribeHostDownloads(listener, scope = globalThis) {
  return getOpenDesignHost(scope)?.downloads?.subscribe(listener) ?? null;
}
export {
  OPEN_DESIGN_HOST_APPEARANCE_THEMES,
  OPEN_DESIGN_HOST_CLIENT_TYPES,
  OPEN_DESIGN_HOST_GLOBAL,
  OPEN_DESIGN_HOST_UPDATER_ACTIONS,
  OPEN_DESIGN_HOST_UPDATER_STATES,
  OPEN_DESIGN_HOST_VERSION,
  captureHostPage,
  checkHostUpdater,
  clearHostBrowserData,
  clearHostUpdaterCache,
  detectOpenDesignHostClientType,
  downloadHostUpdater,
  getHostUpdaterStatus,
  getLatestHostPreviewNavigationFailure,
  getOpenDesignHost,
  installHostUpdater,
  isOpenDesignHostAvailable,
  isOpenDesignHostBridge,
  normalizeOpenDesignHostPickWorkingDirResult,
  normalizeOpenDesignHostProjectImportResult,
  normalizeOpenDesignHostProjectReplaceWorkingDirResult,
  openHostExternalUrl,
  openHostProjectPath,
  pickAndImportHostProject,
  pickAndReplaceHostProjectWorkingDir,
  pickHostWorkingDir,
  printHostPdf,
  quitHostAfterUpdaterInstallerOpen,
  setHostPetVisible,
  setHostUpdaterMenuLabels,
  subscribeHostDownloads,
  subscribeHostPreviewNavigationFailure,
  subscribeHostUpdater,
  subscribeHostUpdaterOpenDialog
};
