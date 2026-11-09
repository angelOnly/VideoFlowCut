import { type ReleaseChannel } from "@open-design/release";
export declare const APP_KEYS: Readonly<{
    readonly DAEMON: "daemon";
    readonly DESKTOP: "desktop";
    readonly WEB: "web";
}>;
export type AppKey = (typeof APP_KEYS)[keyof typeof APP_KEYS];
export declare const SIDECAR_MODES: Readonly<{
    readonly DEV: "dev";
    readonly RUNTIME: "runtime";
}>;
export type SidecarMode = (typeof SIDECAR_MODES)[keyof typeof SIDECAR_MODES];
export declare const SIDECAR_SOURCES: Readonly<{
    readonly PACKAGED: "packaged";
    readonly TOOLS_DEV: "tools-dev";
    readonly TOOLS_PACK: "tools-pack";
}>;
export type SidecarSource = (typeof SIDECAR_SOURCES)[keyof typeof SIDECAR_SOURCES];
export declare const SIDECAR_ENV: Readonly<{
    readonly BASE: "OD_SIDECAR_BASE";
    readonly DAEMON_CLI_PATH: "OD_DAEMON_CLI_PATH";
    readonly DAEMON_PORT: "OD_PORT";
    readonly IPC_BASE: "OD_SIDECAR_IPC_BASE";
    readonly IPC_PATH: "OD_SIDECAR_IPC_PATH";
    readonly NAMESPACE: "OD_SIDECAR_NAMESPACE";
    readonly SOURCE: "OD_SIDECAR_SOURCE";
    readonly TOOLS_DEV_PARENT_PID: "OD_TOOLS_DEV_PARENT_PID";
    readonly WEB_DIST_DIR: "OD_WEB_DIST_DIR";
    readonly WEB_PORT: "OD_WEB_PORT";
    readonly WEB_TSCONFIG_PATH: "OD_WEB_TSCONFIG_PATH";
}>;
/**
 * Shape of an MCP registration written by a daemon whose packaged outer manages
 * the headless bootstrap. Only a managed outer appends `MANAGED_ARG` to the
 * bootstrap argv, so registrations produced under an older outer keep today's
 * shape and today's behavior.
 */
export declare const MCP_BOOTSTRAP_CONTRACT: Readonly<{
    /** Appended to OD_MCP_BOOTSTRAP_ARGS by a managed outer. */
    readonly MANAGED_ARG: "--od-mcp-managed";
    /**
     * JSON `{ daemon: string[]; desktop: string[] }` of absolute sidecar client
     * endpoints for every mode of the registering namespace. They are resolved by
     * the daemon because the MCP process may not share its TMPDIR.
     */
    readonly DISCOVERY_ENV: "OD_MCP_DISCOVERY";
}>;
export declare const SIDECAR_RUNTIME_ENV: Readonly<{
    readonly base: "OD_SIDECAR_BASE";
    readonly ipcBase: "OD_SIDECAR_IPC_BASE";
    readonly ipcPath: "OD_SIDECAR_IPC_PATH";
    readonly namespace: "OD_SIDECAR_NAMESPACE";
    readonly source: "OD_SIDECAR_SOURCE";
}>;
export declare const SIDECAR_STAMP_FLAGS: Readonly<{
    readonly app: "--od-stamp-app";
    readonly ipc: "--od-stamp-ipc";
    readonly mode: "--od-stamp-mode";
    readonly namespace: "--od-stamp-namespace";
    readonly source: "--od-stamp-source";
}>;
export declare const STAMP_APP_FLAG: "--od-stamp-app";
export declare const STAMP_IPC_FLAG: "--od-stamp-ipc";
export declare const STAMP_MODE_FLAG: "--od-stamp-mode";
export declare const STAMP_NAMESPACE_FLAG: "--od-stamp-namespace";
export declare const STAMP_SOURCE_FLAG: "--od-stamp-source";
export declare const SIDECAR_STAMP_FIELDS: readonly ["app", "mode", "namespace", "ipc", "source"];
export declare const SIDECAR_DEFAULTS: Readonly<{
    readonly host: "127.0.0.1";
    readonly ipcBase: "/tmp/open-design/ipc";
    readonly namespace: "default";
    readonly projectTmpDirName: ".tmp";
    readonly windowsPipePrefix: "open-design";
}>;
export declare const OPEN_DESIGN_PRODUCT_NAME = "Open Design";
export declare function resolveWindowsReleaseNamespaceToken(value: string): string;
export declare function resolveWindowsUninstallRegistryKey(namespace: string): string;
export declare const SIDECAR_MESSAGES: Readonly<{
    readonly CLICK: "click";
    readonly CONSOLE: "console";
    readonly EVAL: "eval";
    readonly EXPORT_ARTIFACT: "export-artifact";
    readonly EXPORT_PDF: "export-pdf";
    readonly MINT_IMPORT_TOKEN: "mint-import-token";
    readonly REGISTER_DESKTOP_AUTH: "register-desktop-auth";
    readonly REGISTER_WEB_URL: "register-web-url";
    readonly RENDER_FRAMES: "render-frames";
    readonly RENDER_SLIDES: "render-slides";
    readonly SCREENSHOT: "screenshot";
    readonly SHUTDOWN: "shutdown";
    readonly SHOW: "show";
    readonly STATUS: "status";
    readonly UPDATE: "update";
}>;
export declare const DESKTOP_UPDATE_ACTIONS: Readonly<{
    readonly CHECK: "check";
    readonly CLEAR_CACHE: "clear-cache";
    readonly DOWNLOAD: "download";
    readonly INSTALL: "install";
    readonly STATUS: "status";
}>;
export type DesktopUpdateAction = (typeof DESKTOP_UPDATE_ACTIONS)[keyof typeof DESKTOP_UPDATE_ACTIONS];
export declare const DESKTOP_UPDATE_MODES: Readonly<{
    readonly JS_INCREMENTAL: "js-incremental";
    readonly PACKAGE_LAUNCHER: "package-launcher";
}>;
export type DesktopUpdateMode = (typeof DESKTOP_UPDATE_MODES)[keyof typeof DESKTOP_UPDATE_MODES];
export declare const DESKTOP_UPDATE_CHANNELS: Readonly<{
    readonly BETA: "beta";
    readonly PRERELEASE: "prerelease";
    readonly STABLE: "stable";
}>;
export type DesktopUpdateChannel = ReleaseChannel;
export declare const DESKTOP_UPDATE_STATES: Readonly<{
    readonly AVAILABLE: "available";
    readonly CHECKING: "checking";
    readonly DOWNLOADED: "downloaded";
    readonly DOWNLOADING: "downloading";
    readonly ERROR: "error";
    readonly IDLE: "idle";
    readonly INSTALLING: "installing";
    readonly NOT_AVAILABLE: "not-available";
    readonly UNSUPPORTED: "unsupported";
}>;
export type DesktopUpdateState = (typeof DESKTOP_UPDATE_STATES)[keyof typeof DESKTOP_UPDATE_STATES];
export declare const SIDECAR_ERROR_CODES: Readonly<{
    readonly INVALID_MESSAGE: "SIDECAR_INVALID_MESSAGE";
    readonly UNKNOWN_MESSAGE: "SIDECAR_UNKNOWN_MESSAGE";
}>;
export type SidecarErrorCode = (typeof SIDECAR_ERROR_CODES)[keyof typeof SIDECAR_ERROR_CODES];
export declare class SidecarContractError extends Error {
    readonly code: SidecarErrorCode;
    constructor(code: SidecarErrorCode, message: string);
}
export type ServiceRuntimeState = "idle" | "running" | "starting" | "stopped" | "unknown";
export type DaemonStatusSnapshot = {
    pid?: number | null;
    state: ServiceRuntimeState;
    trustedWebOriginPort?: number | null;
    updatedAt?: string;
    url: string | null;
    /**
     * PR #974 round 6 (mrcfps): true when the daemon's
     * `/api/import/folder` route refuses tokenless requests. Surfaced
     * over IPC so `tools-dev start desktop` can detect a daemon that
     * was spawned without `OD_REQUIRE_DESKTOP_AUTH=1` (the split-start
     * dev flow `start daemon` -> `start desktop`) and restart it
     * before launching desktop main, instead of letting a renderer
     * race the registration handshake. Mirrors
     * `apps/daemon/src/server.ts#isDesktopAuthGateActive()` at the
     * moment the STATUS request was answered.
     */
    desktopAuthGateActive: boolean;
};
export type WebStatusSnapshot = {
    pid?: number | null;
    state: ServiceRuntimeState;
    updatedAt?: string;
    url: string | null;
};
export type DesktopRuntimeState = "idle" | "running" | "unknown";
export type DesktopStatusSnapshot = {
    executablePath?: string;
    capabilities?: {
        /** Hidden Electron Chromium can deterministically capture authored frame timelines. */
        frameRenderer?: boolean;
    };
    pid?: number | null;
    /**
     * True when this owner is a windowless headless runtime that restores its
     * desktop window in place when it receives SHOW. A launcher that sees it
     * sends SHOW instead of restarting the owner.
     */
    restorable?: boolean;
    state: DesktopRuntimeState;
    title?: string | null;
    update?: DesktopUpdateStatusSnapshot;
    updateStatusError?: string;
    updatedAt?: string;
    url?: string | null;
    windowVisible?: boolean;
};
export type DesktopEvalInput = {
    expression: string;
};
export type DesktopEvalResult = {
    error?: string;
    ok: boolean;
    value?: unknown;
};
export type DesktopScreenshotInput = {
    path: string;
};
export type DesktopScreenshotResult = {
    path: string;
};
export type DesktopConsoleEntry = {
    level: string;
    text: string;
    timestamp: string;
};
export type DesktopConsoleResult = {
    entries: DesktopConsoleEntry[];
};
export type DesktopClickInput = {
    selector: string;
};
export type DesktopClickResult = {
    clicked: boolean;
    found: boolean;
};
export type DesktopExportPdfInput = {
    baseHref?: string;
    deck: boolean;
    defaultFilename: string;
    html: string;
    title: string;
};
export type DesktopExportPdfResult = {
    canceled?: boolean;
    error?: string;
    ok: boolean;
    path?: string;
};
export type DesktopRenderSlidesInput = {
    baseHref?: string;
    html: string;
    deck?: boolean;
    editable?: boolean;
    index?: number;
    pageImageFormat?: "png" | "jpeg";
    stitch?: boolean;
    paginate?: boolean;
    width?: number;
    height?: number;
    outputDir?: string;
};
export type DesktopRenderSlidesErrorCode = "NO_SLIDES" | "PAGE_TOO_TALL" | "RENDER_FAILED" | "SLIDE_INDEX_OUT_OF_RANGE";
export type DesktopRenderSlidesResult = {
    error?: string;
    errorCode?: DesktopRenderSlidesErrorCode;
    height?: number;
    mode?: "deck" | "page";
    ok: boolean;
    pptxFile?: string;
    slideFiles?: string[];
    slides?: string[];
    width?: number;
};
/**
 * Render a deterministic HTML timeline through the Electron Chromium already
 * shipped with the desktop app. The document must expose
 * `window.__odFrameRenderer = { ready(), seek(timeSeconds, frameIndex) }`.
 * Desktop owns capture; daemon owns MP4 encoding and scratch cleanup.
 */
export type DesktopRenderFramesInput = {
    baseHref?: string;
    fps?: number;
    height: number;
    html: string;
    outputDir: string;
    width: number;
};
export type DesktopRenderFramesErrorCode = "AUDIO_UNSUPPORTED" | "FRAME_RENDERER_NOT_READY" | "INVALID_FRAME_METADATA" | "RENDER_FAILED" | "RENDER_TIMEOUT";
export type DesktopRenderFramesResult = {
    duration?: number;
    error?: string;
    errorCode?: DesktopRenderFramesErrorCode;
    fps?: number;
    frameCount?: number;
    /** Absolute printf-style path, for example `/tmp/render/frame-%08d.png`. */
    framePattern?: string;
    height?: number;
    ok: boolean;
    width?: number;
};
export type DesktopExportArtifactFormat = "pdf" | "image";
export type DesktopExportArtifactImageFormat = "png" | "jpeg";
/**
 * What the caller wants out of the renderer — stated, not inferred.
 *
 * `full_page_export` is the historical `od export` product: measure the
 * document, grow the surface to its full scroll height, and hand back one tall
 * image (or a paginated PDF). Its cost scales with page length, by design.
 *
 * `first_viewport_thumbnail` is the chat card's static cover: a fixed logical
 * viewport, scrolled to the origin, motion frozen, captured once. It never
 * measures `scrollHeight`, never grows the window, and never stitches — so its
 * cost is independent of how long the page is.
 *
 * Before this enum the only way to ask for "fixed viewport, do not grow" was to
 * claim the document was a deck, which also switched on deck-only DOM surgery.
 */
export declare const DESKTOP_ARTIFACT_CAPTURE_MODES: Readonly<{
    readonly FIRST_VIEWPORT_THUMBNAIL: "first_viewport_thumbnail";
    readonly FULL_PAGE_EXPORT: "full_page_export";
}>;
export type DesktopArtifactCaptureMode = (typeof DESKTOP_ARTIFACT_CAPTURE_MODES)[keyof typeof DESKTOP_ARTIFACT_CAPTURE_MODES];
/**
 * Why a capture produced nothing usable.
 *
 * The chat card falls back to a live iframe whenever there is no snapshot, and
 * it must never invent one. These codes let the daemon record *which* kind of
 * miss happened (retryable render failure vs. a request that can never be
 * served) instead of parsing free-text `error` strings.
 */
export declare const DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES: Readonly<{
    readonly BLANK_CAPTURE: "capture_blank";
    readonly RENDER_TIMEOUT: "render_timeout";
    readonly UNSUPPORTED_CAPTURE_MODE: "unsupported_capture_mode";
}>;
export type DesktopArtifactCaptureErrorCode = (typeof DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES)[keyof typeof DESKTOP_ARTIFACT_CAPTURE_ERROR_CODES];
export type DesktopExportArtifactInput = {
    baseHref?: string;
    /**
     * Omitted means `full_page_export`. Left optional and undefaulted on the wire
     * so an older daemon that has never heard of capture modes keeps producing
     * byte-identical exports.
     */
    captureMode?: DesktopArtifactCaptureMode;
    deck: boolean;
    format: DesktopExportArtifactFormat;
    html: string;
    imageFormat?: DesktopExportArtifactImageFormat;
    title: string;
    width?: number;
    height?: number;
};
export type DesktopExportArtifactResult = {
    bytes?: number;
    /** Set on failure when the reason is one the caller can act on. */
    code?: DesktopArtifactCaptureErrorCode;
    error?: string;
    mime?: string;
    ok: boolean;
    path?: string;
};
export type DesktopUpdateCapabilitySet = {
    canApplyInPlace: boolean;
    canDownload: boolean;
    canOpenInstaller: boolean;
    requiresManualInstall: boolean;
};
export type DesktopUpdatePathSnapshot = {
    downloadRoot?: string;
    manifestPath?: string;
};
export type DesktopUpdateChecksumSnapshot = {
    algorithm: "sha256" | "sha512";
    url?: string;
    value?: string;
};
export type DesktopUpdateArtifactSnapshot = {
    name?: string;
    platformKey?: string;
    size?: number;
    type?: string;
    url: string;
};
export type DesktopUpdateProgressSnapshot = {
    receivedBytes: number;
    totalBytes?: number;
};
export type DesktopUpdateErrorSnapshot = {
    code: string;
    details?: unknown;
    message: string;
};
export type DesktopUpdateInstallResult = {
    activeVersion?: string;
    artifactPath?: string;
    dryRun?: boolean;
    helperLogPath?: string;
    launcherRuntimePath?: string;
    launchPath?: string;
    openedAt: string;
    path: string;
};
export type DesktopUpdateReleaseSnapshot = {
    arch: string;
    artifact: DesktopUpdateArtifactSnapshot;
    checksum: DesktopUpdateChecksumSnapshot;
    channel: DesktopUpdateChannel;
    downloadedAt: string;
    key: string;
    metadata?: Record<string, unknown>;
    path: string;
    platformKey: string;
    version: string;
};
export type DesktopUpdateIncomingSnapshot = {
    arch: string;
    artifact: DesktopUpdateArtifactSnapshot;
    channel: DesktopUpdateChannel;
    key?: string;
    metadata?: Record<string, unknown>;
    progress?: DesktopUpdateProgressSnapshot;
    startedAt: string;
    version: string;
};
export type DesktopUpdateCacheLifecycleTrigger = "cold-start" | "manual" | "next-version-ready";
export type DesktopUpdateReleaseLifecycleState = "cleanup-deferred" | "cleanup-removed" | "deprecated" | "retained" | "unknown";
export type DesktopUpdateCacheLifecycleSummary = {
    lastRunAt?: string;
    lastTrigger?: DesktopUpdateCacheLifecycleTrigger;
    platform: string;
    releases: {
        cleanupDeferred: number;
        cleanupRemoved: number;
        deprecated: number;
        errors: number;
        retained: number;
        total: number;
        unknown: number;
    };
};
export type DesktopUpdateCacheSnapshot = {
    lifecycle?: DesktopUpdateCacheLifecycleSummary;
};
export declare const DESKTOP_UPDATE_REINSTALL_REASONS: Readonly<{
    readonly LAUNCHER_SCHEMA: "launcher-schema";
    readonly OUTER_BELOW_MIN: "outer-below-min";
    readonly OUTER_VERSION_UNREADABLE: "outer-version-unreadable";
}>;
export type DesktopUpdateReinstallReason = (typeof DESKTOP_UPDATE_REINSTALL_REASONS)[keyof typeof DESKTOP_UPDATE_REINSTALL_REASONS];
/**
 * Present on a status snapshot when the release feed requires a full installer
 * reinstall instead of an in-place payload update. `installedVersion` is the
 * physically installed outer package version (not the running payload version);
 * it is omitted when the outer bundle config could not be read. `url` is an
 * optional operator-supplied explanation link from
 * `control.launcher.version.url`.
 */
export type DesktopUpdateReinstallSnapshot = {
    installedVersion?: string;
    minVersion?: string;
    reason: DesktopUpdateReinstallReason;
    url?: string;
};
export type DesktopUpdateStatusSnapshot = {
    active?: DesktopUpdateReleaseSnapshot;
    arch: string;
    artifact?: DesktopUpdateArtifactSnapshot;
    artifactUrl?: string;
    availableVersion?: string;
    cache?: DesktopUpdateCacheSnapshot;
    capabilities: DesktopUpdateCapabilitySet;
    channel: DesktopUpdateChannel;
    checksum?: DesktopUpdateChecksumSnapshot;
    currentVersion: string;
    downloadPath?: string;
    enabled: boolean;
    error?: DesktopUpdateErrorSnapshot;
    incoming?: DesktopUpdateIncomingSnapshot;
    installResult?: DesktopUpdateInstallResult;
    lastCheckedAt?: string;
    metadata?: Record<string, unknown>;
    mode: DesktopUpdateMode;
    paths?: DesktopUpdatePathSnapshot;
    platform: string;
    progress?: DesktopUpdateProgressSnapshot;
    reinstall?: DesktopUpdateReinstallSnapshot;
    state: DesktopUpdateState;
    supported: boolean;
};
export type DesktopUpdateInput = {
    action: DesktopUpdateAction;
};
export type DesktopUpdateResult = DesktopUpdateStatusSnapshot;
export type SidecarStatusMessage = {
    type: typeof SIDECAR_MESSAGES.STATUS;
};
export type SidecarShutdownMessage = {
    type: typeof SIDECAR_MESSAGES.SHUTDOWN;
};
export type DesktopEvalMessage = {
    input: DesktopEvalInput;
    type: typeof SIDECAR_MESSAGES.EVAL;
};
export type DesktopScreenshotMessage = {
    input: DesktopScreenshotInput;
    type: typeof SIDECAR_MESSAGES.SCREENSHOT;
};
export type DesktopConsoleMessage = {
    type: typeof SIDECAR_MESSAGES.CONSOLE;
};
export type DesktopShowInput = {
    deeplinkUrl?: string;
};
export type DesktopShowMessage = {
    input?: DesktopShowInput;
    type: typeof SIDECAR_MESSAGES.SHOW;
};
export type DesktopClickMessage = {
    input: DesktopClickInput;
    type: typeof SIDECAR_MESSAGES.CLICK;
};
export type DesktopExportPdfMessage = {
    input: DesktopExportPdfInput;
    type: typeof SIDECAR_MESSAGES.EXPORT_PDF;
};
export type DesktopRenderFramesMessage = {
    input: DesktopRenderFramesInput;
    type: typeof SIDECAR_MESSAGES.RENDER_FRAMES;
};
export type DesktopRenderSlidesMessage = {
    input: DesktopRenderSlidesInput;
    type: typeof SIDECAR_MESSAGES.RENDER_SLIDES;
};
export type DesktopExportArtifactMessage = {
    input: DesktopExportArtifactInput;
    type: typeof SIDECAR_MESSAGES.EXPORT_ARTIFACT;
};
export type DesktopUpdateMessage = {
    input: DesktopUpdateInput;
    type: typeof SIDECAR_MESSAGES.UPDATE;
};
export type RegisterDesktopAuthInput = {
    secret: string;
};
export type RegisterDesktopAuthMessage = {
    input: RegisterDesktopAuthInput;
    type: typeof SIDECAR_MESSAGES.REGISTER_DESKTOP_AUTH;
};
export type RegisterDesktopAuthResult = {
    accepted: true;
};
export type MintImportTokenInput = {
    baseDir: string;
};
export type MintImportTokenMessage = {
    input: MintImportTokenInput;
    type: typeof SIDECAR_MESSAGES.MINT_IMPORT_TOKEN;
};
export type MintImportTokenResult = {
    ok: true;
    expiresAt: string;
    token: string;
} | {
    ok: false;
    code: "DESKTOP_AUTH_INACTIVE";
    message: string;
    retryable: false;
} | {
    ok: false;
    code: "DESKTOP_AUTH_PENDING";
    message: string;
    retryable: true;
};
/**
 * Registers the browser-facing URL after a packaged web sidecar has bound its
 * dynamic port. The message travels over the namespace-scoped daemon IPC, so
 * it cannot accidentally update another packaged runtime.
 */
export type RegisterWebUrlInput = {
    url: string;
};
export type RegisterWebUrlMessage = {
    input: RegisterWebUrlInput;
    type: typeof SIDECAR_MESSAGES.REGISTER_WEB_URL;
};
export type RegisterWebUrlResult = {
    accepted: true;
};
export type DaemonSidecarMessage = SidecarStatusMessage | SidecarShutdownMessage | RegisterDesktopAuthMessage | MintImportTokenMessage | RegisterWebUrlMessage;
export type WebSidecarMessage = SidecarStatusMessage | SidecarShutdownMessage;
export type DesktopSidecarMessage = SidecarStatusMessage | SidecarShutdownMessage | DesktopEvalMessage | DesktopScreenshotMessage | DesktopConsoleMessage | DesktopShowMessage | DesktopClickMessage | DesktopExportPdfMessage | DesktopRenderFramesMessage | DesktopRenderSlidesMessage | DesktopExportArtifactMessage | DesktopUpdateMessage;
export type ShutdownResult = {
    accepted: true;
};
/**
 * Legacy runtime-layout descriptor retained for the generic path/bootstrap
 * contract. This is not sidecar process identity: `@open-design/sidecar` owns
 * the authoritative five-field argv stamp, and IPC is private transport state.
 */
export type LegacySidecarRuntimeLayout = {
    app: AppKey;
    ipc: string;
    mode: SidecarMode;
    namespace: string;
    source: SidecarSource;
};
type LegacySidecarRuntimeLayoutCriteria = Partial<LegacySidecarRuntimeLayout>;
export type OpenDesignSidecarContract = {
    appKeys: typeof APP_KEYS;
    defaults: typeof SIDECAR_DEFAULTS;
    env: typeof SIDECAR_RUNTIME_ENV;
    errorCodes: typeof SIDECAR_ERROR_CODES;
    messages: typeof SIDECAR_MESSAGES;
    modes: typeof SIDECAR_MODES;
    normalizeApp: typeof normalizeAppKey;
    normalizeNamespace: typeof normalizeNamespace;
    normalizeSource: typeof normalizeSidecarSource;
    normalizeStamp: typeof normalizeSidecarRuntimeLayout;
    normalizeStampCriteria: typeof normalizeSidecarRuntimeLayoutCriteria;
    sources: typeof SIDECAR_SOURCES;
    stampFields: typeof SIDECAR_STAMP_FIELDS;
    stampFlags: typeof SIDECAR_STAMP_FLAGS;
    updateActions: typeof DESKTOP_UPDATE_ACTIONS;
    updateChannels: typeof DESKTOP_UPDATE_CHANNELS;
    updateModes: typeof DESKTOP_UPDATE_MODES;
    updateStates: typeof DESKTOP_UPDATE_STATES;
};
export declare function normalizeNamespace(namespace: unknown): string;
export declare function isSidecarMode(value: unknown): value is SidecarMode;
export declare function normalizeSidecarMode(mode: unknown): SidecarMode;
export declare function isAppKey(value: unknown): value is AppKey;
export declare function normalizeAppKey(app: unknown): AppKey;
export declare function isSidecarSource(value: unknown): value is SidecarSource;
export declare function normalizeSidecarSource(source: unknown): SidecarSource;
export declare function isWindowsNamedPipePath(value: unknown): boolean;
export declare function normalizeIpcPath(ipc: unknown): string;
export declare function normalizeSidecarRuntimeLayout(input: unknown): LegacySidecarRuntimeLayout;
export declare function normalizeSidecarRuntimeLayoutCriteria(input?: unknown): LegacySidecarRuntimeLayoutCriteria;
export declare function isDesktopUpdateAction(value: unknown): value is DesktopUpdateAction;
export declare function normalizeDaemonSidecarMessage(input: unknown): DaemonSidecarMessage;
export declare function normalizeWebSidecarMessage(input: unknown): WebSidecarMessage;
export declare function normalizeDesktopSidecarMessage(input: unknown): DesktopSidecarMessage;
export declare const OPEN_DESIGN_SIDECAR_CONTRACT: Readonly<{
    readonly appKeys: Readonly<{
        readonly DAEMON: "daemon";
        readonly DESKTOP: "desktop";
        readonly WEB: "web";
    }>;
    readonly defaults: Readonly<{
        readonly host: "127.0.0.1";
        readonly ipcBase: "/tmp/open-design/ipc";
        readonly namespace: "default";
        readonly projectTmpDirName: ".tmp";
        readonly windowsPipePrefix: "open-design";
    }>;
    readonly env: Readonly<{
        readonly base: "OD_SIDECAR_BASE";
        readonly ipcBase: "OD_SIDECAR_IPC_BASE";
        readonly ipcPath: "OD_SIDECAR_IPC_PATH";
        readonly namespace: "OD_SIDECAR_NAMESPACE";
        readonly source: "OD_SIDECAR_SOURCE";
    }>;
    readonly errorCodes: Readonly<{
        readonly INVALID_MESSAGE: "SIDECAR_INVALID_MESSAGE";
        readonly UNKNOWN_MESSAGE: "SIDECAR_UNKNOWN_MESSAGE";
    }>;
    readonly messages: Readonly<{
        readonly CLICK: "click";
        readonly CONSOLE: "console";
        readonly EVAL: "eval";
        readonly EXPORT_ARTIFACT: "export-artifact";
        readonly EXPORT_PDF: "export-pdf";
        readonly MINT_IMPORT_TOKEN: "mint-import-token";
        readonly REGISTER_DESKTOP_AUTH: "register-desktop-auth";
        readonly REGISTER_WEB_URL: "register-web-url";
        readonly RENDER_FRAMES: "render-frames";
        readonly RENDER_SLIDES: "render-slides";
        readonly SCREENSHOT: "screenshot";
        readonly SHUTDOWN: "shutdown";
        readonly SHOW: "show";
        readonly STATUS: "status";
        readonly UPDATE: "update";
    }>;
    readonly modes: Readonly<{
        readonly DEV: "dev";
        readonly RUNTIME: "runtime";
    }>;
    readonly normalizeApp: typeof normalizeAppKey;
    readonly normalizeNamespace: typeof normalizeNamespace;
    readonly normalizeSource: typeof normalizeSidecarSource;
    readonly normalizeStamp: typeof normalizeSidecarRuntimeLayout;
    readonly normalizeStampCriteria: typeof normalizeSidecarRuntimeLayoutCriteria;
    readonly sources: Readonly<{
        readonly PACKAGED: "packaged";
        readonly TOOLS_DEV: "tools-dev";
        readonly TOOLS_PACK: "tools-pack";
    }>;
    readonly stampFields: readonly ["app", "mode", "namespace", "ipc", "source"];
    readonly stampFlags: Readonly<{
        readonly app: "--od-stamp-app";
        readonly ipc: "--od-stamp-ipc";
        readonly mode: "--od-stamp-mode";
        readonly namespace: "--od-stamp-namespace";
        readonly source: "--od-stamp-source";
    }>;
    readonly updateActions: Readonly<{
        readonly CHECK: "check";
        readonly CLEAR_CACHE: "clear-cache";
        readonly DOWNLOAD: "download";
        readonly INSTALL: "install";
        readonly STATUS: "status";
    }>;
    readonly updateChannels: Readonly<{
        readonly BETA: "beta";
        readonly PRERELEASE: "prerelease";
        readonly STABLE: "stable";
    }>;
    readonly updateModes: Readonly<{
        readonly JS_INCREMENTAL: "js-incremental";
        readonly PACKAGE_LAUNCHER: "package-launcher";
    }>;
    readonly updateStates: Readonly<{
        readonly AVAILABLE: "available";
        readonly CHECKING: "checking";
        readonly DOWNLOADED: "downloaded";
        readonly DOWNLOADING: "downloading";
        readonly ERROR: "error";
        readonly IDLE: "idle";
        readonly INSTALLING: "installing";
        readonly NOT_AVAILABLE: "not-available";
        readonly UNSUPPORTED: "unsupported";
    }>;
}>;
export {};
//# sourceMappingURL=index.d.ts.map