export type DerivedDesignTokenBinding = {
    name: string;
    layer: string;
    value: string;
    confidence: string;
    reason: string;
    sources: readonly string[];
    sourceName?: string;
};
export type DerivedDesignTokenReport = {
    generatedAt: string;
    summary: unknown;
};
export declare function renderDesignTokensJson(input: {
    bindings: readonly DerivedDesignTokenBinding[];
    report: DerivedDesignTokenReport;
}): string;
export declare function renderTailwindV4Css(bindings: readonly Pick<DerivedDesignTokenBinding, 'name'>[]): string;
export declare const TAILWIND_V4_THEME_BINDINGS: ReadonlyArray<readonly [string, string]>;
//# sourceMappingURL=derived-token-outputs.d.ts.map