export declare const EXPORT_FORMATS: readonly ['html', 'pdf', 'image', 'pptx'];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export declare const EXPORT_IMAGE_FORMATS: readonly ['png', 'jpeg'];
export type ExportImageFormat = (typeof EXPORT_IMAGE_FORMATS)[number];
/** Default deck stage dimensions (16:9) shared by the browser and Electron paths. */
export declare const EXPORT_DEFAULT_WIDTH = 1920;
export declare const EXPORT_DEFAULT_HEIGHT = 1080;
export interface ExportRequest {
    /** Project-relative path of the file to export (e.g. `index.html`). */
    fileName: string;
    /** Display title; used for the output filename and PPTX/PDF metadata. */
    title?: string;
    /** Treat the artifact as a multi-slide deck (one page/slide per `.slide`). */
    deck?: boolean;
    format: ExportFormat;
    /** Only meaningful when `format === 'image'`. Defaults to `png`. */
    imageFormat?: ExportImageFormat;
    /** Deck stage size in CSS px. Defaults to {@link EXPORT_DEFAULT_WIDTH}×{@link EXPORT_DEFAULT_HEIGHT}. */
    width?: number;
    height?: number;
}
/** Request body for the daemon-owned standalone HTML export route. */
export interface StandaloneHtmlExportRequest {
    /** Project-relative path of the HTML entry file. */
    fileName: string;
    /** Display title used for the downloaded filename. */
    title?: string;
    /** Historical snapshots are not supported until their dependency graph is versioned. */
    versionId?: string;
}
/** JSON envelope returned by the daemon/CLI export path (binary modes stream bytes instead). */
export interface ExportResult {
    ok: boolean;
    format: ExportFormat;
    /** Absolute path the file was written to (CLI `--out` / desktop Save dialog). */
    path?: string;
    /** Deprecated CLI JSON alias for `path`; kept for existing automation. */
    out?: string;
    /** Byte size of the produced file when known. */
    bytes?: number;
    /** The user dismissed the desktop Save dialog — treated as a successful no-op. */
    canceled?: boolean;
    error?: string;
}
export declare function isExportFormat(value: unknown): value is ExportFormat;
export declare function isExportImageFormat(value: unknown): value is ExportImageFormat;
//# sourceMappingURL=export.d.ts.map