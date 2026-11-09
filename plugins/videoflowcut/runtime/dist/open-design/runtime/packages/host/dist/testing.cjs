"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/testing.ts
var testing_exports = {};
__export(testing_exports, {
  createMockOpenDesignHost: () => createMockOpenDesignHost,
  installMockOpenDesignHost: () => installMockOpenDesignHost
});
module.exports = __toCommonJS(testing_exports);

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

// src/testing.ts
function defaultHost() {
  const updaterStatus = {
    arch: "arm64",
    capabilities: {
      canApplyInPlace: false,
      canDownload: true,
      canOpenInstaller: true,
      requiresManualInstall: true
    },
    channel: "beta",
    currentVersion: "1.0.0-beta.0",
    enabled: true,
    mode: "package-launcher",
    platform: "darwin",
    state: "idle",
    supported: true
  };
  return {
    version: OPEN_DESIGN_HOST_VERSION,
    browser: {
      clearData: async () => ({ ok: true })
    },
    capture: {
      page: async () => ({ ok: true, dataUrl: "data:image/png;base64,", h: 1, w: 1 })
    },
    client: {
      type: "desktop",
      platform: "test"
    },
    shell: {
      openExternal: async () => ({ ok: true }),
      openPath: async () => ({ ok: true })
    },
    project: {
      pickAndImport: async () => ({
        ok: true,
        projectId: "project-test",
        conversationId: "conversation-test",
        entryFile: "index.html"
      }),
      pickAndReplaceWorkingDir: async () => ({
        ok: true,
        baseDir: "/tmp/open-design-test",
        entryFile: null
      })
    },
    pdf: {
      print: async () => ({ ok: true })
    },
    pet: {
      setVisible: () => void 0
    },
    preview: {
      getLatestNavigationFailure: () => null,
      subscribeNavigationFailure: () => () => void 0
    },
    updater: {
      check: async () => updaterStatus,
      "clear-cache": async () => updaterStatus,
      download: async () => updaterStatus,
      install: async () => updaterStatus,
      quit: async () => ({ ok: true }),
      setMenuLabels: async () => ({ ok: true }),
      status: async () => updaterStatus,
      subscribe: () => () => void 0,
      subscribeOpenDialog: () => () => void 0
    }
  };
}
function createMockOpenDesignHost(overrides = {}) {
  const base = defaultHost();
  return {
    ...base,
    ...overrides,
    browser: { ...base.browser, ...overrides.browser },
    capture: { ...base.capture, ...overrides.capture },
    client: { ...base.client, ...overrides.client },
    shell: { ...base.shell, ...overrides.shell },
    project: { ...base.project, ...overrides.project },
    pdf: { ...base.pdf, ...overrides.pdf },
    pet: { ...base.pet, ...overrides.pet },
    preview: {
      getLatestNavigationFailure: overrides.preview?.getLatestNavigationFailure ?? base.preview.getLatestNavigationFailure,
      subscribeNavigationFailure: overrides.preview?.subscribeNavigationFailure ?? base.preview.subscribeNavigationFailure
    },
    updater: { ...base.updater, ...overrides.updater }
  };
}
function installMockOpenDesignHost(options = {}) {
  const scope = options.scope ?? globalThis;
  const host = createMockOpenDesignHost(options.host);
  const windowValue = scope.window;
  const targets = [
    scope,
    ...typeof windowValue === "object" && windowValue != null && windowValue !== scope ? [windowValue] : []
  ];
  const previous = targets.map((target) => ({
    had: Object.prototype.hasOwnProperty.call(target, OPEN_DESIGN_HOST_GLOBAL),
    target,
    value: target[OPEN_DESIGN_HOST_GLOBAL]
  }));
  for (const target of targets) {
    Object.defineProperty(target, OPEN_DESIGN_HOST_GLOBAL, {
      configurable: true,
      value: host,
      writable: true
    });
  }
  return () => {
    for (const entry of previous) {
      if (entry.had) {
        Object.defineProperty(entry.target, OPEN_DESIGN_HOST_GLOBAL, {
          configurable: true,
          value: entry.value,
          writable: true
        });
      } else {
        delete entry.target[OPEN_DESIGN_HOST_GLOBAL];
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createMockOpenDesignHost,
  installMockOpenDesignHost
});
