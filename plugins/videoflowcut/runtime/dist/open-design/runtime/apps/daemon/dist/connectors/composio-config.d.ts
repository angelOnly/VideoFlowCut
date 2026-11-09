export interface ComposioConfig {
    apiKey: string;
    authConfigIds: Record<string, string>;
}
export interface PublicComposioConfig {
    configured: boolean;
    apiKeyTail: string;
}
export declare function configureComposioConfigStore(dataDir: string): void;
export declare function readComposioConfig(): ComposioConfig;
export declare function readPublicComposioConfig(): PublicComposioConfig;
export declare function writeComposioConfig(input: unknown): PublicComposioConfig;
export declare function setComposioAuthConfigId(connectorId: string, authConfigId: string): void;
export declare function deleteComposioAuthConfigId(connectorId: string): void;
