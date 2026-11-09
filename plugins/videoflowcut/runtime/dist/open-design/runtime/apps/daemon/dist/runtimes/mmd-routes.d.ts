import type { RuntimeEnv, RuntimeModelOption } from './types.js';
export type MmdRouteLaunchEnv = {
    ANTHROPIC_BASE_URL: string;
    ANTHROPIC_AUTH_TOKEN?: string;
};
export declare function resolveMmdRoutesFile(env: RuntimeEnv): string | null;
export declare function parseMmdRouteModelIds(raw: unknown): string[];
export declare function resolveMmdRouteLaunchEnv(raw: unknown, modelId: string | null | undefined): MmdRouteLaunchEnv | null;
export declare function mergeMmdRouteModels(routeIds: readonly string[], fallbackModels: readonly RuntimeModelOption[]): RuntimeModelOption[];
export declare function loadMmdRouteModels(env: RuntimeEnv, fallbackModels: readonly RuntimeModelOption[]): Promise<RuntimeModelOption[] | null>;
export declare function loadMmdRouteLaunchEnv(env: RuntimeEnv, modelId: string | null | undefined): Promise<MmdRouteLaunchEnv | null>;
