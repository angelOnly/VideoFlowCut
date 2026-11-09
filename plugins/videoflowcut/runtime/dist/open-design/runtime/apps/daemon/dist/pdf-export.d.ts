import type { DesktopExportArtifactFormat, DesktopExportArtifactImageFormat, DesktopExportArtifactInput, DesktopExportPdfInput } from '@open-design/sidecar-proto';
export interface BuildDesktopPdfExportInputOptions {
    daemonUrl: string;
    deck?: boolean;
    fileName: string;
    metadata?: Record<string, unknown> | null;
    projectId: string;
    projectsRoot: string;
    sourceHtml?: string;
    title?: string;
}
export declare function buildDesktopPdfExportInput(options: BuildDesktopPdfExportInputOptions): Promise<DesktopExportPdfInput>;
export interface BuildDesktopArtifactExportInputOptions {
    baseHref?: string;
    daemonUrl: string;
    deck?: boolean;
    fileName: string;
    format: DesktopExportArtifactFormat;
    imageFormat?: DesktopExportArtifactImageFormat;
    metadata?: Record<string, unknown> | null;
    projectId: string;
    projectsRoot: string;
    sourceHtml?: string;
    title?: string;
    width?: number;
    height?: number;
}
export declare function buildDesktopArtifactExportInput(options: BuildDesktopArtifactExportInputOptions): Promise<DesktopExportArtifactInput>;
