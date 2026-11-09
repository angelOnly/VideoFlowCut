import { type readAppConfig } from '../app-config.js';
import type { VelaCredentialRevision } from '../integrations/vela.js';
export interface ResolveAmrModelProbeDeps {
    dataDir: string;
    env: NodeJS.ProcessEnv;
    readAppConfig: typeof readAppConfig;
}
export interface BuildAmrModelCacheKeyInput {
    launchPath: string;
    env: NodeJS.ProcessEnv;
    credentialRevision: VelaCredentialRevision;
}
export declare function buildAmrModelCacheKey({ launchPath, env, credentialRevision, }: BuildAmrModelCacheKeyInput): string;
export declare function resolveAmrModelProbe({ dataDir, env: baseEnv, readAppConfig, }: ResolveAmrModelProbeDeps): Promise<{
    launchPath: string;
    env: NodeJS.ProcessEnv;
    configuredEnv: Record<string, string>;
    cacheKey: string;
}>;
