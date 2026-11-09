import { type TokenLayer } from '@open-design/contracts/design-systems/token-schema';
export type DesignTokenEvidenceConfidence = 'high' | 'medium' | 'low' | 'fallback' | 'alias';
export type SourceDesignToken = {
    name: string;
    value: string;
    source: string;
    line?: number;
    usage?: string[];
};
export type DesignTokenBinding = {
    name: string;
    layer: TokenLayer;
    value: string;
    confidence: DesignTokenEvidenceConfidence;
    reason: string;
    sources: string[];
    sourceName?: string;
};
export type DesignTokenContractReport = {
    schemaVersion: 1;
    contract: 'TOKEN_SCHEMA';
    generatedAt: string;
    summary: {
        totalTokens: number;
        declaredTokens: number;
        sourceBackedTokens: number;
        sourceBackedA1: number;
        requiredA1: number;
        fallbackTokens: number;
        aliasTokens: number;
        score: number;
        grade: 'excellent' | 'usable' | 'needs-review' | 'needs-rebuild';
        recommendRebuild: boolean;
    };
    layers: Record<TokenLayer, {
        total: number;
        sourceBacked: number;
        fallback: number;
        alias: number;
    }>;
    selfCheck: {
        ok: boolean;
        errors: string[];
        warnings: string[];
    };
    tokens: DesignTokenBinding[];
};
export type DesignTokenContract = {
    bindings: DesignTokenBinding[];
    report: DesignTokenContractReport;
    tokensCss: string;
};
export declare function buildDesignTokenContract(input: {
    sourceTokens: SourceDesignToken[];
    generatedAt?: Date;
}): DesignTokenContract;
export declare function renderDesignTokenContractCss(bindings: readonly DesignTokenBinding[]): string;
export declare function validateDesignTokenOutputs(input: {
    tokensCss: string;
    fixtureHtml?: string;
}): DesignTokenContractReport['selfCheck'];
export declare function buildReportWithSelfCheck(report: DesignTokenContractReport, selfCheck: DesignTokenContractReport['selfCheck']): DesignTokenContractReport;
