export declare function usesMaxCompletionTokens(model: string): boolean;
export declare function buildOpenAIChatTokenParam(model: string, maxTokens: number): {
    max_tokens: number;
} | {
    max_completion_tokens: number;
};
export declare function buildLegacyMaxTokensParam(maxTokens: number): {
    max_tokens: number;
};
export declare function buildMaxCompletionTokensParam(maxTokens: number): {
    max_completion_tokens: number;
};
export declare function isAzureOpenAIHostname(hostname: string): boolean;
export declare function isUnsupportedMaxTokensError(detail: string): boolean;
