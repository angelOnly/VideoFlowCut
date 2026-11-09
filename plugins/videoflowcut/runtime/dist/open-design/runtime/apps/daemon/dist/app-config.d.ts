import type { OdNextRolloutMode } from '@open-design/contracts';
export interface PluginEnvKnobs {
    maxDevloopIterations: number;
    snapshotUnreferencedTtlDays: number;
    snapshotRetentionDays: number | null;
    snapshotGcIntervalMs: number;
}
export declare function readPluginEnvKnobs(): PluginEnvKnobs;
export interface AgentModelPrefs {
    model?: string;
    reasoning?: string;
    serviceTier?: string;
}
export type AgentCliEnvPrefs = Record<string, Record<string, string>>;
export type AgentCliEnvIntentPrefs = Record<string, {
    apiKeyOverride?: boolean;
}>;
export interface TelemetryPrefs {
    metrics?: boolean;
    content?: boolean;
    artifactManifest?: boolean;
}
export interface OrbitConfigPrefs {
    enabled: boolean;
    time: string;
    templateSkillId?: string | null;
    workspaceScope?: {
        workspaceId: string;
        workspaceMemberId: string;
    } | null;
}
export interface ProjectLocationPrefs {
    id: string;
    name: string;
    path: string;
}
export interface AppConfigPrefs {
    onboardingCompleted?: boolean;
    agentId?: string | null;
    agentModels?: Record<string, AgentModelPrefs>;
    agentCliEnv?: AgentCliEnvPrefs;
    agentCliEnvIntent?: AgentCliEnvIntentPrefs;
    skillId?: string | null;
    designSystemId?: string | null;
    disabledSkills?: string[];
    disabledDesignSystems?: string[];
    installationId?: string | null;
    telemetry?: TelemetryPrefs;
    privacyDecisionAt?: number | null;
    allowSilentUpdates?: boolean;
    orbit?: OrbitConfigPrefs;
    customInstructions?: string | null;
    projectLocations?: ProjectLocationPrefs[];
    defaultProjectLocationId?: string | null;
    odNextStrategyMode?: OdNextRolloutMode | null;
    recentLinkedDirs?: string[];
}
export declare const RECENT_LINKED_DIRS_MAX = 5;
export declare function appConfigDir(projectRoot: string, env?: NodeJS.ProcessEnv): string;
export declare function validateAgentCliEnv(raw: unknown): AgentCliEnvPrefs | undefined;
export declare function validateAgentCliEnvIntent(raw: unknown): AgentCliEnvIntentPrefs | undefined;
export declare function agentCliEnvForAgent(prefs: AgentCliEnvPrefs | undefined, agentId: string): Record<string, string>;
export type MetricsConsentRead = {
    status: 'missing' | 'available' | 'unavailable';
    metrics: boolean;
};
/** Unlike general config hydration, consent must distinguish a fresh install
 * from damaged/unreadable saved preferences. Never recover a lost opt-out by
 * silently defaulting a corrupt file to an empty config. */
export declare function readMetricsConsent(dataDir: string): Promise<MetricsConsentRead>;
export declare function readAppConfig(dataDir: string): Promise<AppConfigPrefs>;
export declare function readAppConfigSync(dataDir: string): AppConfigPrefs;
export declare function observeAppConfig(dataDir: string, observer: () => void): () => void;
/** Automatic content upload must fail closed on corrupt preferences instead of applying defaults. */
export declare function automaticDiagnosticsConsent(dataDir: string): boolean;
export declare function writeAppConfig(dataDir: string, partial: Record<string, unknown>): Promise<AppConfigPrefs>;
/** Thrown by `writeAppConfig` when a control key is handed a value it cannot mean. */
export declare class InvalidAppConfigValueError extends Error {
    readonly key: string;
    readonly code = "INVALID_APP_CONFIG_VALUE";
    constructor(key: string, message: string);
}
