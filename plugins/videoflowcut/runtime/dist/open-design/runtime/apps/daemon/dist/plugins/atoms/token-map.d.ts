import type { DesignExtractReport, DesignTokenKind } from './design-extract.js';
export interface DesignSystemToken {
    name: string;
    kind: DesignTokenKind;
    value: string;
    description?: string;
}
export interface DesignSystemTokenBag {
    id?: string;
    tokens: DesignSystemToken[];
}
export interface TokenMapMatch {
    source: string;
    sourceName?: string;
    target: string;
    targetValue: string;
    via: 'exact' | 'normalised-hex' | 'name';
    kind: DesignTokenKind;
    sources: string[];
}
export interface TokenMapUnmatched {
    source: string;
    sourceName?: string;
    kind: DesignTokenKind;
    reason: 'no-target-equivalent' | 'target-collision' | 'invalid-source';
    hint?: string;
}
export interface TokenMapReport {
    colors: TokenMapMatch[];
    typography: TokenMapMatch[];
    spacing: TokenMapMatch[];
    radius: TokenMapMatch[];
    shadow: TokenMapMatch[];
    unmatched: TokenMapUnmatched[];
    meta: {
        sourceKind: 'figma' | 'code';
        generatedAt: string;
        atomDigest: string;
        designSystemId?: string;
        targetTokenCount: number;
        sourceTokenCount: number;
        matchedTokenCount: number;
    };
}
export interface TokenMapOptions {
    cwd: string;
    source?: {
        kind: 'figma' | 'code';
        report: DesignExtractReport;
    };
    designSystem: DesignSystemTokenBag;
    strict?: boolean;
}
export declare function runTokenMap(opts: TokenMapOptions): Promise<TokenMapReport>;
export declare function parseDesignSystemTokens(body: string): DesignSystemToken[];
