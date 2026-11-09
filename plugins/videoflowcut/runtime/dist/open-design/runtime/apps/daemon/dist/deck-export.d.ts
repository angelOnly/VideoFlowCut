import type { DesktopRenderSlidesInput } from '@open-design/sidecar-proto';
type PptxInstance = InstanceType<typeof import('pptxgenjs').default>;
export type PptxConstructor = {
    new (): PptxInstance;
};
export declare function resolvePptxConstructor(mod: unknown): PptxConstructor;
export interface BuildDeckRenderInputOptions {
    baseHref?: string;
    daemonUrl: string;
    deck?: boolean;
    editable?: boolean;
    fileName: string;
    index?: number;
    metadata?: Record<string, unknown> | null;
    outputDir?: string;
    pageImageFormat?: 'png' | 'jpeg';
    projectId: string;
    projectsRoot: string;
    sourceHtml?: string;
    stitch?: boolean;
    width?: number;
    height?: number;
    paginate?: boolean;
    title?: string;
}
export interface DeckRenderRequest {
    defaultFilename: string;
    input: DesktopRenderSlidesInput;
    title: string;
}
/**
 * Reads a deck HTML file and prepares the {@link DesktopRenderSlidesInput} the
 * desktop renderer needs. Mirrors {@link buildDesktopPdfExportInput} in
 * pdf-export.ts: the default `<base href>` resolves relative assets through
 * `/raw/`; authorized callers can supply a narrower renderer-only base.
 */
export declare function buildDeckRenderInput(options: BuildDeckRenderInputOptions): Promise<DeckRenderRequest>;
export interface SlideImage {
    buffer: Buffer;
    jpeg: boolean;
}
/**
 * Decodes the `data:image/(png|jpeg);base64,...` URLs the desktop renderer
 * returns into raw image buffers tagged with their format. Rejects anything that
 * is not a base64 PNG/JPEG data URL so a malformed renderer response surfaces as
 * an export failure rather than a corrupt file.
 */
/**
 * Reads the image files the desktop renderer wrote (the `outputDir` handoff)
 * into raw buffers tagged with their format (by extension). The companion to
 * {@link decodeSlideDataUrls} for the file-path path, which avoids shuttling
 * base64 image bytes through the JSON IPC channel for large images.
 */
export declare function readSlideFiles(paths: string[]): Promise<SlideImage[]>;
export declare function decodeSlideDataUrls(urls: string[]): SlideImage[];
/**
 * Assembles per-slide images into a screenshot-based .pptx — one full-bleed
 * image per slide. The slide aspect ratio follows the deck's authored size
 * (`opts.aspect` = width/height); falls back to 16:9. The slides are
 * pixel-perfect images (not editable text), the "exactly what you see" export
 * mode. Returns the .pptx bytes.
 */
export declare function buildScreenshotPptx(images: SlideImage[], opts?: {
    title?: string;
    aspect?: number;
}): Promise<Buffer>;
export declare function buildScreenshotPdf(images: SlideImage[]): Promise<Buffer>;
export {};
