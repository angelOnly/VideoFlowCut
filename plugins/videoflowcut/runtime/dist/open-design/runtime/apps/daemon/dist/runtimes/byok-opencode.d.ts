import type { ByokChatProviderConfig } from '@open-design/contracts';
export declare const BYOK_OPENCODE_AGENT_ID = "byok-opencode";
export declare const BYOK_OPENCODE_PROVIDER_ID = "open-design-byok";
export declare const BYOK_OPENCODE_API_KEY_ENV = "OPEN_DESIGN_BYOK_API_KEY";
export declare const BYOK_OPENCODE_PROVIDER_REQUIRED_MESSAGE = "BYOK OpenCode requires a complete provider configuration for this run.";
export interface OpenCodeByokProviderConfig {
    providerId: string;
    modelId: string;
    env: Record<string, string>;
    config: Record<string, unknown>;
}
export declare function opencodeByokModelId(model: string | null | undefined): string | null;
export declare function buildOpenCodeByokProviderConfig(provider: ByokChatProviderConfig | null | undefined, model: string | null | undefined): OpenCodeByokProviderConfig | null;
