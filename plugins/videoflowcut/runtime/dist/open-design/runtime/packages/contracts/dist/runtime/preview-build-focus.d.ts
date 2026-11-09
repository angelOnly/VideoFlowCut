/**
 * Cross-runtime protocol used by a live artifact preview to tell the Open
 * Design host WHERE in the rendered page the agent is currently working, so the
 * host can park a cursor there.
 *
 * Two ways to say where. The host can send a short literal string the agent
 * just wrote (see the web's `RunProgressStep.anchor`), which the frame finds
 * by text; or it can name one of the page's own top-level SECTIONS, which the
 * frame enumerates and broadcasts after every load. Either way the frame
 * scrolls the target into view and reports its box in its own viewport
 * coordinates. Sections are what let the host walk the cursor down a page as
 * it is written — one stop per part that just appeared — instead of jumping
 * once to wherever the last written run of text happens to be. The frame is sandboxed
 * without `allow-same-origin`, so its origin is opaque: it must post to `'*'`,
 * and the host must identify it by `event.source`, never by `event.origin`.
 *
 * Keep this module browser-API free. The browser code is serialized as a
 * string so both the web and daemon runtimes inject exactly the same script.
 */
export declare const PREVIEW_BUILD_FOCUS_BRIDGE_MARKER = "data-od-preview-build-focus";
export declare const PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION = 1;
/** Frame → host, once the bridge can accept requests. */
export declare const PREVIEW_BUILD_FOCUS_READY_TYPE = "od:preview-build-focus-ready";
/** Host → frame: "find this text". */
export declare const PREVIEW_BUILD_FOCUS_REQUEST_TYPE = "od:preview-build-focus";
/** Frame → host: where it landed. */
export declare const PREVIEW_BUILD_FOCUS_RESULT_TYPE = "od:preview-build-focus-rect";
/** Frame → host, unprompted after each load: the page's top-level parts. */
export declare const PREVIEW_BUILD_FOCUS_SECTIONS_TYPE = "od:preview-build-focus-sections";
/** Anchors longer than this are not more precise, only more brittle. */
export declare const PREVIEW_BUILD_FOCUS_MAX_ANCHOR_CHARS = 96;
/** Text nodes the bridge will walk before giving up on a match. */
export declare const PREVIEW_BUILD_FOCUS_MAX_TEXT_NODES = 4000;
/** Elements the end-of-document fallback will consider. */
export declare const PREVIEW_BUILD_FOCUS_MAX_FALLBACK_ELEMENTS = 2000;
/** A page with more parts than this is a list, and a cursor tour of it would
 *  outlast the run it is describing. */
export declare const PREVIEW_BUILD_FOCUS_MAX_SECTIONS = 24;
/** A section label is a caption, not a paragraph. */
export declare const PREVIEW_BUILD_FOCUS_MAX_LABEL_CHARS = 40;
/** Keys are built by the frame from index, tag and label; nothing needs more. */
export declare const PREVIEW_BUILD_FOCUS_MAX_SECTION_KEY_CHARS = 96;
export interface PreviewBuildFocusRequest {
    type: typeof PREVIEW_BUILD_FOCUS_REQUEST_TYPE;
    version: typeof PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION;
    /** Echoed back, so the host can drop results for a request it has replaced. */
    requestId: string;
    /** Text to locate. Null asks for the last visible box in the document. */
    anchor: string | null;
    /** A section key from the frame's own broadcast. Takes precedence over
     *  `anchor` when set — the host is pointing at a PART of the page, not at a
     *  run of text inside it. */
    section: string | null;
}
/** One top-level part of the previewed page, as the frame sees it. */
export interface PreviewSection {
    /** Opaque to the host: index, tag and label, built by the frame. */
    key: string;
    /** What to call this part on screen — its heading, id, or tag. */
    label: string;
}
export interface PreviewBuildFocusSections {
    type: typeof PREVIEW_BUILD_FOCUS_SECTIONS_TYPE;
    version: typeof PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION;
    sections: PreviewSection[];
}
export interface PreviewBuildFocusResult {
    type: typeof PREVIEW_BUILD_FOCUS_RESULT_TYPE;
    version: typeof PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION;
    requestId: string;
    /** False when nothing could be located — the host then hides the cursor. */
    found: boolean;
    /** The located box, in the FRAME's viewport CSS px. */
    x: number;
    y: number;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
}
export interface PreviewBuildFocusReady {
    type: typeof PREVIEW_BUILD_FOCUS_READY_TYPE;
    version: typeof PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION;
}
/** True for a well-formed ready notice from a preview bridge. */
export declare function isPreviewBuildFocusReady(value: unknown): boolean;
/**
 * Validate a frame's result and rebuild it as a fresh, bounded object. The
 * payload comes from generated, untrusted page code, so nothing from it is ever
 * passed through by reference.
 */
export declare function parsePreviewBuildFocusResult(value: unknown): PreviewBuildFocusResult | null;
/**
 * Validate a frame's section broadcast and rebuild it as fresh, bounded data.
 * Labels are page content — generated, untrusted text — so they are capped and
 * copied, never passed through.
 */
export declare function parsePreviewBuildFocusSections(value: unknown): PreviewSection[] | null;
/** Build a request the host can post into a preview frame. */
export declare function previewBuildFocusRequest(requestId: string, anchor: string | null, section?: string | null): PreviewBuildFocusRequest;
/**
 * Locates the host's anchor text, scrolls it into view, and reports its box.
 *
 * The anchor is model output, so it is only ever compared as TEXT — never fed
 * to `querySelector`, where it would throw or match something unrelated.
 */
export declare function buildPreviewBuildFocusBridge(): string;
//# sourceMappingURL=preview-build-focus.d.ts.map