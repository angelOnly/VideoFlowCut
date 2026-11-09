import type { BoundedJsonObject } from './schema.js';
export declare const LIVE_ARTIFACT_RENDER_FORMAT: 'html_template_v1';
export declare const LIVE_ARTIFACT_TEMPLATE_ENTRY: 'template.html';
export declare const LIVE_ARTIFACT_DATA_ENTRY: 'data.json';
export declare const LIVE_ARTIFACT_GENERATED_PREVIEW_ENTRY: 'index.html';
export interface LiveArtifactRenderInput {
    templateHtml: string;
    dataJson: BoundedJsonObject;
}
export interface LiveArtifactRenderOutput {
    html: string;
}
export declare function validateHtmlTemplateV1Security(templateHtml: string): void;
export declare function escapeHtmlTemplateValue(value: unknown): string;
export declare function renderHtmlTemplateV1(input: LiveArtifactRenderInput): LiveArtifactRenderOutput;
