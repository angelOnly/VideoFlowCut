import type { ExportFormat, ExportImageFormat, ExportResult } from "@open-design/contracts";
export interface ExportCliRequestOptions {
    fileName: string;
    format: ExportFormat;
    deck?: boolean;
    imageFormat?: ExportImageFormat;
    title?: string;
}
export interface ExportCliDeckModeOptions {
    format: ExportFormat;
    deck?: boolean;
    page?: boolean;
    noDeck?: boolean;
}
export declare function resolveExportCliDeckMode(options: ExportCliDeckModeOptions): boolean | undefined;
export declare function buildExportCliRequestBody(options: ExportCliRequestOptions): Record<string, unknown>;
export declare function buildExportCliResultEnvelope(options: {
    bytes: number;
    format: ExportFormat;
    path: string;
}): ExportResult;
