export type DesignTokenKind = 'color' | 'typography' | 'spacing' | 'radius' | 'shadow';
export interface DesignTokenEntry {
    kind: DesignTokenKind;
    name?: string;
    value: string;
    sources: string[];
    usage: string[];
}
export interface DesignExtractReport {
    colors: DesignTokenEntry[];
    typography: DesignTokenEntry[];
    spacing: DesignTokenEntry[];
    radius: DesignTokenEntry[];
    shadow: DesignTokenEntry[];
    scannedFiles: string[];
    warnings: string[];
    endedAt: string;
}
export type CssCustomPropertyEvidence = {
    name: string;
    value: string;
    source: string;
    line: number;
};
export type DesignTokenEvidenceCollector = ReturnType<typeof createDesignTokenEvidenceCollector>;
export declare function createDesignTokenEvidenceCollector(): {
    scannedFiles: string[];
    scanText({ text, file, language }: {
        text: string;
        file: string;
        language?: string;
    }): void;
    toReport({ warnings, endedAt }: {
        warnings: string[];
        endedAt: string;
    }): DesignExtractReport;
};
export declare function extractCssCustomProperties(text: string, file: string): CssCustomPropertyEvidence[];
export declare function lineNumberAt(text: string, index: number): number;
