import type { DesignExtractReport } from './design-extract.js';
export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    parent?: string;
    children?: string[];
    box?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    text?: string;
    fill?: string;
    stroke?: string;
    cornerRadius?: number;
    componentRef?: string;
}
export interface FigmaExtractReport {
    tree: FigmaNode[];
    tokens: DesignExtractReport;
    meta: {
        fileUrl: string;
        fileKey: string;
        version?: string;
        lastModified?: string;
        exportedAt: string;
        atomDigest: string;
        unsupportedNodes: Array<{
            id: string;
            type: string;
            reason: string;
        }>;
        nodeCount: number;
    };
}
export interface FigmaExtractOptions {
    cwd: string;
    fileUrl?: string;
    fileKey?: string;
    token: string;
    fetchFn?: typeof fetch;
    offlineAssets?: boolean;
    assetFormat?: 'svg' | 'png' | 'jpg' | 'pdf';
    assetMaxBytes?: number;
}
export declare function runFigmaExtract(opts: FigmaExtractOptions): Promise<FigmaExtractReport>;
export interface FigmaApiNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaApiNode[];
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    fills?: Array<{
        type: string;
        color?: {
            r: number;
            g: number;
            b: number;
            a?: number;
        };
        opacity?: number;
        visible?: boolean;
    }>;
    strokes?: Array<{
        type: string;
        color?: {
            r: number;
            g: number;
            b: number;
            a?: number;
        };
        opacity?: number;
    }>;
    cornerRadius?: number;
    characters?: string;
    componentId?: string;
    visible?: boolean;
}
export declare function walkNode(node: FigmaApiNode, parent: string | undefined, out: FigmaNode[], unsupported: FigmaExtractReport['meta']['unsupportedNodes']): void;
export declare function pickSolidColor(fills: FigmaApiNode['fills']): string | undefined;
export declare function liftTokens(tree: FigmaNode[]): DesignExtractReport;
