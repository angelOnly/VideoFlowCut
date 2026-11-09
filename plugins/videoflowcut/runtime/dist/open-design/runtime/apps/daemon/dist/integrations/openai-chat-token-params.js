export function usesMaxCompletionTokens(model) {
    const normalized = model.trim().toLowerCase();
    // Keep the generic OpenAI-compatible path on max_tokens by default. Only
    // switch the newer GPT-5/o-series chat-completions families that reject the
    // legacy field.
    return (/^gpt-5(?:[.-]|$)/.test(normalized) ||
        /^o1(?:[.-]|$)/.test(normalized) ||
        /^o3(?:[.-]|$)/.test(normalized) ||
        /^o4(?:[.-]|$)/.test(normalized));
}
export function buildOpenAIChatTokenParam(model, maxTokens) {
    if (usesMaxCompletionTokens(model)) {
        return { max_completion_tokens: maxTokens };
    }
    return { max_tokens: maxTokens };
}
export function buildLegacyMaxTokensParam(maxTokens) {
    return { max_tokens: maxTokens };
}
export function buildMaxCompletionTokensParam(maxTokens) {
    return { max_completion_tokens: maxTokens };
}
const AZURE_OPENAI_HOST_SUFFIXES = [
    '.openai.azure.com',
    '.services.ai.azure.com',
    '.cognitiveservices.azure.com',
];
export function isAzureOpenAIHostname(hostname) {
    const normalized = hostname.trim().toLowerCase().replace(/\.$/, '');
    return AZURE_OPENAI_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
export function isUnsupportedMaxTokensError(detail) {
    const normalized = detail.toLowerCase();
    return (normalized.includes('unsupported parameter') &&
        normalized.includes('max_tokens') &&
        normalized.includes('max_completion_tokens'));
}
//# sourceMappingURL=openai-chat-token-params.js.map