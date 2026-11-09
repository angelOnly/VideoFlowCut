/**
 * Cross-runtime preview guard constants plus daemon-safe script builders.
 *
 * The srcDoc runtime consumes the shared redirect protocol constants; the
 * daemon uses the inert script builders to install equivalent passive guards
 * in a real-URL response without importing browser-app private source.
 */
export declare const PREVIEW_REDIRECT_GUARD_MAX_HOPS = 15;
export declare const PREVIEW_REDIRECT_GUARD_WINDOW_MS = 4000;
export declare const PREVIEW_REDIRECT_GUARD_SELF_REFRESH_MIN_DELAY_MS = 2000;
export declare const PREVIEW_REDIRECT_LOOP_MESSAGE = "od:redirect-loop-blocked";
/**
 * URL preview responses above this size stay byte-for-byte streamable so the
 * daemon can honor Range requests and avoid buffering a very large document.
 * Callers must not claim URL guards are installed above this boundary.
 */
export declare const PREVIEW_URL_GUARD_MAX_HTML_BYTES: number;
/** Keep inactive controls hidden while allowing later explicit [hidden] overrides. */
export declare function buildPreviewVisibilityGuard(): string;
export declare function previewHtmlHasLoadTimeLocationNavigation(source: string): boolean;
export declare function buildPreviewSandboxShim(): string;
export declare function buildPreviewFocusGuard(): string;
export declare function buildPreviewRedirectGuard(options?: {
    blockLoadTimeScriptRedirect?: boolean;
}): string;
//# sourceMappingURL=preview-guards.d.ts.map