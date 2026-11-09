import type { OpenDesignHostActionResult, OpenDesignHostDownloadResult, OpenDesignHostBrowserClearDataOptions, OpenDesignHostCaptureOptions, OpenDesignHostCaptureResult, OpenDesignHostGlobalScope, OpenDesignHostPdfPrintOptions, OpenDesignHostPreviewNavigationFailure, OpenDesignHostPreviewNavigationFailureListener, OpenDesignHostPickWorkingDirResult, OpenDesignHostProjectImportInit, OpenDesignHostProjectImportResult, OpenDesignHostProjectReplaceWorkingDirResult, OpenDesignHostUpdaterActionOptions, OpenDesignHostUpdaterMenuLabels, OpenDesignHostUpdaterOpenDialogListener, OpenDesignHostUpdaterResult, OpenDesignHostUpdaterStatusListener } from "./protocol.js";
/** Open an external URL through the host shell. */
export declare function openHostExternalUrl(url: string, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Reveal a project's path through the host shell. */
export declare function openHostProjectPath(projectId: string, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Clear host browser data (cookies and/or storage). */
export declare function clearHostBrowserData(options?: OpenDesignHostBrowserClearDataOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Capture the host page (optionally clipped) as a data URL. */
export declare function captureHostPage(options?: OpenDesignHostCaptureOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostCaptureResult>;
/** Pick and import a project through the host's native dialog. */
export declare function pickAndImportHostProject(init?: OpenDesignHostProjectImportInit, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostProjectImportResult>;
/** Pick and replace a project's working directory through the host. */
export declare function pickAndReplaceHostProjectWorkingDir(projectId: string, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostProjectReplaceWorkingDirResult>;
export declare function pickHostWorkingDir(scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostPickWorkingDirResult>;
/** Print HTML to PDF through the host. */
export declare function printHostPdf(html: string, nonce?: string, options?: OpenDesignHostPdfPrintOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Toggle host pet visibility. */
export declare function setHostPetVisible(visible: boolean, scope?: OpenDesignHostGlobalScope): OpenDesignHostActionResult;
/** Read the latest Electron-observed preview subframe navigation failure. */
export declare function getLatestHostPreviewNavigationFailure(scope?: OpenDesignHostGlobalScope): OpenDesignHostPreviewNavigationFailure | null;
/** Subscribe to Electron-observed preview subframe navigation failures. */
export declare function subscribeHostPreviewNavigationFailure(listener: OpenDesignHostPreviewNavigationFailureListener, scope?: OpenDesignHostGlobalScope): () => void;
/** Get the host updater status. */
export declare function getHostUpdaterStatus(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostUpdaterResult>;
/** Trigger a host updater check. */
export declare function checkHostUpdater(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostUpdaterResult>;
/** Trigger a host updater download. */
export declare function downloadHostUpdater(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostUpdaterResult>;
/** Clear the host updater/launcher caches and reset one-shot update state. */
export declare function clearHostUpdaterCache(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostUpdaterResult>;
/** Trigger a host updater install. */
export declare function installHostUpdater(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostUpdaterResult>;
/** Quit the host after its updater installer has opened. */
export declare function quitHostAfterUpdaterInstallerOpen(options?: OpenDesignHostUpdaterActionOptions, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Subscribe to host updater status changes; returns an unsubscribe fn. */
export declare function subscribeHostUpdater(listener: OpenDesignHostUpdaterStatusListener, scope?: OpenDesignHostGlobalScope): () => void;
/** Subscribe to native host requests to open the updater dialog. */
export declare function subscribeHostUpdaterOpenDialog(listener: OpenDesignHostUpdaterOpenDialogListener, scope?: OpenDesignHostGlobalScope): () => void;
/** Synchronize renderer-localized updater menu labels to the native host. */
export declare function setHostUpdaterMenuLabels(labels: OpenDesignHostUpdaterMenuLabels, scope?: OpenDesignHostGlobalScope): Promise<OpenDesignHostActionResult>;
/** Observe native download completion when the host supports it. */
export declare function subscribeHostDownloads(listener: (result: OpenDesignHostDownloadResult) => void, scope?: OpenDesignHostGlobalScope): (() => void) | null;
//# sourceMappingURL=actions.d.ts.map