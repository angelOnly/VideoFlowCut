import type { ReasoningExecutionRequestFields } from './reasoningExecution';
export type ProxyMessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type ProxyMessageContent = string | Array<ProxyTextContentBlock | ProxyImageContentBlock>;
export interface ProxyTextContentBlock {
    type: 'text';
    text: string;
}
export interface ProxyImageContentBlock {
    type: 'image';
    source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
    };
}
export interface ProxyMessage {
    role: ProxyMessageRole;
    content: ProxyMessageContent;
}
export interface ProxyStreamRequest extends ReasoningExecutionRequestFields {
    baseUrl: string;
    apiKey: string;
    model: string;
    systemPrompt?: string;
    messages: ProxyMessage[];
    maxTokens?: number;
    apiVersion?: string;
}
export interface ProxyStreamStartPayload {
    model?: string;
}
export interface ProxyStreamDeltaPayload {
    delta: string;
}
export interface ProxyStreamEndPayload {
    code?: number;
}
//# sourceMappingURL=proxy.d.ts.map