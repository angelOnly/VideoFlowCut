/**
 * Cross-runtime protocol used by generated artifact previews to report
 * failures to the OpenDesign host. The bridge runs inside both srcDoc and
 * URL-loaded preview iframes; the host validates this narrow payload before it
 * reaches analytics.
 *
 * Keep this module browser-API free. The browser code is serialized as a
 * string so both the web and daemon runtimes inject exactly the same script.
 */
export declare const PREVIEW_OBSERVABILITY_MESSAGE_TYPE = "od:preview-observability";
export declare const PREVIEW_OBSERVABILITY_HOST_STATE_MESSAGE_TYPE = "od:preview-observability-host-state";
export declare const PREVIEW_OBSERVABILITY_PROTOCOL_VERSION = 1;
export declare const PREVIEW_OBSERVABILITY_BRIDGE_MARKER = "data-od-preview-observability";
export declare const PREVIEW_WHITE_SCREEN_TIMEOUT_MS = 5000;
export declare const PREVIEW_DECK_STAGE_TIMEOUT_MS = 5000;
export declare const PREVIEW_DECK_STAGE_MIN_SCALE = 0.01;
export declare const PREVIEW_WHITE_SCREEN_CONFIRMATION_MS = 1500;
export declare const PREVIEW_BASE_SCOPE_MESSAGE_TYPE = "od:preview-base-scope";
export declare const PREVIEW_BASE_UPDATE_MESSAGE_TYPE = "od:preview-base-update";
export interface PreviewBaseScopeMessage {
    type: typeof PREVIEW_BASE_SCOPE_MESSAGE_TYPE;
    href: string;
    expiresAt: number;
}
export declare function buildPreviewBaseHrefBridge(initialScope?: {
    readonly href: string;
    readonly expiresAt: number;
}): string;
export type PreviewObservabilityEvent = 'runtime_error' | 'unhandled_rejection' | 'console_error' | 'resource_error' | 'white_screen' | 'deck_stage_unscaled';
export interface PreviewObservabilityMessage {
    type: typeof PREVIEW_OBSERVABILITY_MESSAGE_TYPE;
    version: typeof PREVIEW_OBSERVABILITY_PROTOCOL_VERSION;
    event: PreviewObservabilityEvent;
    message?: string;
    name?: string;
    source_url?: string;
    stack?: string;
    line?: number;
    column?: number;
    resource_tag?: string;
    resource_url?: string;
    ready_state?: string;
    visibility_state?: string;
    body_child_count?: number;
    visible_element_count?: number;
    viewport_width?: number;
    viewport_height?: number;
    blank_observation_count?: number;
    sample_interval_ms?: number;
    stage_scale_permille?: number;
    stage_transform?: string;
    stage_kind?: string;
    stage_width?: number;
    stage_height?: number;
    canvas_width?: number;
    canvas_height?: number;
    elapsed_ms?: number;
}
export declare function parsePreviewObservabilityMessage(value: unknown): PreviewObservabilityMessage | null;
/**
 * Runs before author scripts and emits a bounded, deduplicated diagnostic
 * stream. It deliberately does not serialize arbitrary objects or DOM text.
 */
export declare function buildPreviewObservabilityBridge(): string;
//# sourceMappingURL=preview-observability.d.ts.map