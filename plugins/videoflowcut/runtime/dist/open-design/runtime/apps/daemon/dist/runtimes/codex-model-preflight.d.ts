type StableCodexVersion = {
    major: number;
    minor: number;
    patch: number;
};
export type CodexModelPreflightResult = {
    status: 'not_applicable' | 'unknown';
    reason: 'explicit_model' | 'project_config' | 'config_unavailable' | 'configured_model_missing' | 'custom_provider' | 'config_overlay' | 'auth_override' | 'system_config' | 'managed_config' | 'version_unavailable' | 'no_known_requirement' | 'auth_unconfirmed';
} | {
    status: 'compatible' | 'incompatible';
    model: string;
    cliVersion: string;
    requiredCliVersion: string;
};
export interface CodexModelPreflightInput {
    launchPath: string;
    env: NodeJS.ProcessEnv;
    requestedModel: string | null | undefined;
    projectRoot?: string | null;
}
export declare function extractCodexRootModelConfig(content: string): {
    model: string | null;
    modelProvider: string | null;
    hasCompatibilityOverlay: boolean;
};
export declare function parseStableCodexVersion(value: string): StableCodexVersion | null;
export declare function preflightCodexDefaultModel(input: CodexModelPreflightInput): Promise<CodexModelPreflightResult>;
export {};
