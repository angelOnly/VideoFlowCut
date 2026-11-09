import type { RuntimeModelOption } from '../types.js';
export type VelaModelJsonSource = 'preset' | 'remote';
export declare function normalizeVelaModelId(rawId: string): string | null;
export declare function isVelaChatCapableModelId(modelId: string): boolean;
export declare function parseVelaModels(stdout: string): RuntimeModelOption[];
export declare function parseVelaModelJson(stdout: string, expectedSource: VelaModelJsonSource): RuntimeModelOption[];
export declare function fetchVelaPresetModels(resolvedBin: string, env: NodeJS.ProcessEnv): Promise<RuntimeModelOption[]>;
export declare function fetchVelaRemoteModelsWithRetry(resolvedBin: string, env: NodeJS.ProcessEnv): Promise<RuntimeModelOption[]>;
/** Live account fields parsed from `vela billing summary --format json`. */
export interface VelaBillingSummary {
    /** Real subscription tier (e.g. "max"); absent for free accounts. */
    plan?: string;
    /** Total available balance in USD (string), or null when unavailable. */
    balanceUsd?: string | null;
}
/**
 * Read the signed-in account's billing summary via the vela CLI — the same
 * data source used for models, so balance/tier come through the versioned CLI
 * contract rather than a separate HTTP call. Returns total available balance
 * and the real membership tier.
 */
export declare function fetchVelaBillingSummary(resolvedBin: string, env: NodeJS.ProcessEnv): Promise<VelaBillingSummary>;
export declare const amrAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fetchModels: typeof fetchVelaRemoteModelsWithRetry;
    fallbackModels: RuntimeModelOption[];
    buildArgs: () => string[];
    streamFormat: string;
    resumesSessionViaAcpLoad: true;
    supportsCustomModel: false;
    supportsImagePaths: true;
    defaultModelEnvVar: string;
    inactivityTimeoutMs: number;
    firstOutputTimeoutMs: number;
};
