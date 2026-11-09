/** What the asset fundamentally is. */
export type LibraryAssetKind = 'image' | 'color' | 'design-system' | 'font' | 'html' | 'text' | 'url' | 'video';
/**
 * Storage model:
 * - `owned`: the library holds its own content-addressed copy under
 *   LIBRARY_DIR (clipper capture, `od library import`, independent sources).
 * - `referenced`: the bytes already live inside a project / design-system
 *   directory; the library only stores a pointer + metadata + embedding.
 */
export type LibraryStorage = 'owned' | 'referenced';
/** Where a given source record came from — drives the back-link UI. */
export type LibrarySourceKind = 'clipper' | 'manual-upload' | 'agent-task' | 'design-system' | 'generated';
/** A single provenance record for an asset (1 asset : N sources). */
export interface LibraryAssetSource {
    id: string;
    assetId: string;
    sourceKind: LibrarySourceKind;
    /** Project the asset was captured/used in, when applicable. */
    projectId?: string;
    /** Conversation/run that produced or uploaded the asset (agent-task). */
    conversationId?: string;
    runId?: string;
    /** Design system this asset was staged for. */
    designSystemId?: string;
    /** Path of the underlying file relative to its origin project, when referenced. */
    relPath?: string;
    createdAt: number;
}
export interface LibraryAsset {
    id: string;
    kind: LibraryAssetKind;
    storage: LibraryStorage;
    /** Originating page/resource URL (clipper / import). */
    sourceUrl?: string;
    /** Originating page/document title. */
    sourceTitle?: string;
    /** Host of `sourceUrl`, denormalized for cheap domain filtering. */
    sourceDomain?: string;
    /** Unix ms the asset was first captured/registered. */
    capturedAt: number;
    /** `YYYY-MM-DD` local date, drives the daily archive feed. */
    archivedDate: string;
    mime?: string;
    width?: number;
    height?: number;
    size?: number;
    contentHash: string;
    /** AI-enriched (vision) one-line description; absent until enriched. */
    caption?: string;
    /** AI-enriched OCR text; absent until enriched. */
    ocrText?: string;
    /** Programmatic dominant-color palette (hex strings). */
    palette?: string[];
    tags: string[];
    metadata?: Record<string, unknown>;
    /** referenced-only: project that physically owns the bytes. */
    originProjectId?: string;
    /** referenced-only: file path relative to the origin project root. */
    relPath?: string;
    sources: LibraryAssetSource[];
    createdAt: number;
    updatedAt: number;
}
/** Summary projection used by list/grid surfaces (same shape, may omit body text). */
export type LibraryAssetSummary = LibraryAsset;
export type LibraryEnrichmentStage = 'normalize' | 'palette' | 'text' | 'tags' | 'caption' | 'ocr' | 'embedding';
export type LibraryTaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'skipped';
export interface LibraryTaskError {
    message: string;
    code?: string;
}
export interface LibraryTask {
    id: string;
    assetId: string;
    status: LibraryTaskStatus;
    /** Human-readable progress lines, append-only. */
    progress: string[];
    error?: LibraryTaskError | null;
    startedAt: number;
    endedAt?: number | null;
}
export interface LibraryTaskWaitRequest {
    since?: number;
    timeoutMs?: number;
}
export interface LibraryTaskSnapshot {
    taskId: string;
    status: LibraryTaskStatus;
    progress: string[];
    nextSince: number;
    startedAt: number;
    endedAt?: number | null;
    error?: LibraryTaskError | null;
}
export interface LibraryIngestRequest {
    kind?: LibraryAssetKind;
    /** Remote resource the daemon should fetch and store (owned). */
    url?: string;
    /** Inline `data:` URI (e.g. a captured screenshot PNG). */
    dataUrl?: string;
    /** Inline text payload for `text`/`html`/`color`/`url` kinds. */
    text?: string;
    sourceUrl?: string;
    sourceTitle?: string;
    tags?: string[];
    filename?: string;
    /** Free-form metadata to persist on the asset (e.g. clipper back-links). */
    metadata?: Record<string, unknown>;
    /**
     * Clipper-only: the OD Figma capture IR (a JSON node-tree string, see the
     * `figma-plugin/IR.md` schema) produced from the live page alongside an
     * `html` capture. Stored as a sidecar of the HTML asset so the Library can
     * export it as Figma import JSON without re-rendering the page.
     */
    figmaCapture?: string;
    /** Node count of `figmaCapture`, supplied so the daemon never parses the IR. */
    figmaNodeCount?: number;
    /**
     * Legacy clipper element-pick only: the captured element's `outerHTML`, stored
     * as a `.element.html` sidecar of the screenshot asset and served from
     * `/api/library/assets/:id/element`. Current element captures are instead saved
     * as a single self-contained `html` asset (the markup IS the asset), so they
     * ship no `elementHtml` and set `metadata.element.hasHtml = false`; this field
     * remains only for screenshots captured by older clipper builds.
     */
    elementHtml?: string;
}
/**
 * Summary of a captured DOM element, stored at `metadata.element` by the
 * clipper's element picker. Current captures attach it to a self-contained
 * `html` asset (rendered directly in the Library preview); legacy captures
 * attached it to an `image` screenshot whose `.element.html` sidecar held the
 * full markup (gated by {@link hasHtml}). Its presence is what makes a clip read
 * as an `element` in the Library, regardless of the underlying storage kind.
 */
export interface LibraryElementMeta {
    /** Lowercased tag name (e.g. `section`). */
    tag: string;
    id?: string;
    classes?: string[];
    /** A short, human-readable CSS-ish selector for display. */
    selector?: string;
    /** Rendered size in CSS pixels at capture time. */
    width?: number;
    height?: number;
    /** Trimmed text-content preview. */
    text?: string;
    /** True when a `.element.html` sidecar is available. */
    hasHtml?: boolean;
}
/**
 * Marker stamped onto an `html` asset's `metadata.figmaCapture` when a clipper
 * capture shipped an OD Figma IR sidecar. Its presence is what gates the
 * Library "Download as Figma" action and the `od library figma` CLI command.
 */
export interface LibraryFigmaCaptureMeta {
    version: number;
    /** Byte length of the stored IR JSON. */
    size: number;
    /** Number of IR nodes (frames/text/rectangles). */
    nodeCount: number;
}
export interface LibraryIngestResponse {
    asset: LibraryAsset;
    /** Enrichment task id (absent when nothing to enrich). */
    taskId?: string;
    /** True when the content hash already existed and a source was appended. */
    deduped: boolean;
}
export interface LibraryAssetFilter {
    kind?: LibraryAssetKind;
    tag?: string;
    domain?: string;
    /** `YYYY-MM-DD` archive date. */
    date?: string;
    /** Free-text query (keyword fallback when no embeddings). */
    q?: string;
    source?: LibrarySourceKind;
    projectId?: string;
    designSystemId?: string;
    limit?: number;
}
export interface LibraryAssetListResponse {
    assets: LibraryAsset[];
}
export interface LibraryAssetDetailResponse {
    asset: LibraryAsset;
}
export interface LibrarySearchRequest {
    query: string;
    kind?: LibraryAssetKind;
    date?: string;
    limit?: number;
}
export interface LibrarySearchResultItem {
    asset: LibraryAsset;
    score: number;
}
export interface LibrarySearchResponse {
    results: LibrarySearchResultItem[];
    /** True when results came from embedding cosine search; false for keyword fallback. */
    semantic: boolean;
}
export interface LibraryApplyRequest {
    projectId: string;
    /** Optional subdirectory inside the project to copy into. */
    dir?: string;
    /**
     * Legacy element-pick captures only: when true and the asset is an older
     * `image` screenshot carrying `metadata.element` + a `.element.html` sidecar,
     * also copy the captured markup into the project as a companion
     * `.element.html` file. Current element captures are already self-contained
     * `html` assets whose copied file IS the markup, so this is a harmless no-op
     * for them (no sidecar to materialize).
     */
    includeElement?: boolean;
}
export interface LibraryApplyResponse {
    relPath: string;
    /**
     * Project-relative path of the companion element-markup file, present only
     * when `includeElement` was requested for an element-pick capture.
     */
    elementRelPath?: string;
}
/**
 * Turn a captured `html` library asset into a brand-new, editable OD project.
 * The daemon copies the asset's self-contained HTML into a fresh project as an
 * `index.html` file, seeds a conversation, and records a project back-link on
 * the asset. The web client then opens the project on that file so the user can
 * edit it (srcDoc bridge + agent surgical edits) immediately — this is the
 * clipper "capture → editable OD page" exit, driven from the Library.
 */
export interface LibraryEditAsPageResponse {
    projectId: string;
    conversationId: string;
    /** Path of the editable HTML file relative to the project root. */
    relPath: string;
}
/**
 * Result of a Library reconcile pass (`POST /api/library/sync`, the web "Sync"
 * button, and `od library sync`). Reconcile registers *referenced* Library rows
 * for design systems and agent-produced project deliverables so the Library
 * mirrors everything a user has made, not just clips/uploads. It is idempotent —
 * re-running it does not duplicate rows — so the counts report what this pass
 * newly indexed (`*Added`) versus what was already present (`deduped`).
 */
export interface LibrarySyncResponse {
    /** Design-system cards newly registered this pass. */
    designSystems: number;
    /** Project deliverable assets newly registered this pass. */
    projectAssets: number;
    /** Referenced rows skipped because their origin file was already indexed. */
    deduped: number;
    /** Total Library rows newly registered this pass (`designSystems + projectAssets`). */
    total: number;
}
/**
 * Largest manual upload accepted, in bytes. The web UI sends file bytes inline
 * as a base64 `data:` URI through `/api/library/ingest`, which rides the
 * daemon's 4 MB JSON body limit; base64 inflates payloads by ~33%, so the raw
 * ceiling sits at ~3 MB. Enforced on both surfaces so an oversized file fails
 * with a clear message instead of a generic body-parser 413.
 */
export declare const LIBRARY_UPLOAD_MAX_BYTES = 3000000;
/** MIME families accepted for manual upload (prefix match). */
export declare const LIBRARY_UPLOAD_MIME_PREFIXES: readonly ['image/', 'font/', 'text/'];
/**
 * Exact MIME types accepted beyond the prefixes — JSON / design data and the
 * `application/*`-namespaced font and XML types. Any `application/*+json` or
 * `application/*+xml` subtype is also accepted via the suffix check in
 * {@link isLibraryUploadMimeAllowed}.
 */
export declare const LIBRARY_UPLOAD_MIME_EXACT: readonly ['application/json', 'application/ld+json', 'application/xml', 'application/font-woff', 'application/font-sfnt', 'application/x-font-ttf', 'application/x-font-otf', 'application/vnd.ms-opentype', 'image/vnd.microsoft.icon'];
/**
 * MIME families explicitly rejected. Audio and video are not useful as design
 * assets, so they are refused even though some future accepted prefix could
 * otherwise sweep them in.
 */
export declare const LIBRARY_UPLOAD_REJECT_PREFIXES: readonly ['audio/', 'video/'];
/**
 * File extensions accepted for manual upload, driving the file-picker `accept`
 * attribute and the drag-drop / paste pre-filter, and the daemon's extension
 * fallback when a file arrives without a usable MIME type. Kept in sync with the
 * MIME policy above; the MIME policy stays authoritative.
 */
export declare const LIBRARY_UPLOAD_EXTENSIONS: readonly ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico', '.tiff', '.tif', '.woff', '.woff2', '.ttf', '.otf', '.txt', '.md', '.markdown', '.csv', '.html', '.htm', '.css', '.xml', '.json', '.json5', '.geojson'];
/**
 * Whether a `(mime, filename)` pair may be manually uploaded to the Library.
 *
 * The MIME type is authoritative: an `audio/*` or `video/*` type is rejected
 * outright; an accepted prefix / `+json` / `+xml` / exact type passes; anything
 * else is refused. When the MIME is missing or a generic
 * `application/octet-stream` (the daemon's sniff fallback, or a browser that
 * reports no type), the file extension is consulted so a known design extension
 * still gets through.
 *
 * Pure string logic — safe to run in the browser pre-flight and in the daemon
 * ingest guard from this one shared definition.
 */
export declare function isLibraryUploadMimeAllowed(mime: string | undefined, filename?: string): boolean;
/** `accept` attribute value for a Library upload file-picker. */
export declare function libraryUploadAcceptAttr(): string;
export interface LibraryDigest {
    date: string;
    projectId?: string;
    artifactPath?: string;
    summary?: string;
}
export interface LibraryArchiveResponse {
    date: string;
    assets: LibraryAsset[];
    digest?: LibraryDigest;
}
export interface LibraryPairingStartResponse {
    /** Short human-typeable pairing code, shown in the OD UI. */
    code: string;
    /** Unix ms the code stops being valid. */
    expiresAt: number;
}
export interface LibraryPairingConfirmRequest {
    code: string;
    /** `chrome-extension://<id>` origin to allowlist. */
    extensionOrigin: string;
    label?: string;
}
export interface LibraryPairingConfirmResponse {
    /** Long-lived `odlt_…` bearer token for the extension. */
    token: string;
    label: string;
}
export interface LibraryConnectionStatus {
    paired: boolean;
    tokens: Array<{
        label: string;
        extensionOrigin: string;
        createdAt: number;
        lastUsedAt: number;
    }>;
}
//# sourceMappingURL=library.d.ts.map