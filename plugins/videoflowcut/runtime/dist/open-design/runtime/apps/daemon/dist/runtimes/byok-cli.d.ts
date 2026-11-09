import type { ByokChatProviderConfig } from '@open-design/contracts';
export interface ByokCliOptions {
    protocol?: string;
    baseUrl?: string;
    apiVersion?: string;
    keyEnv?: string;
    keyless?: boolean;
}
export declare function byokProviderFromCliOptions(options: ByokCliOptions, env: NodeJS.ProcessEnv): ByokChatProviderConfig | undefined;
