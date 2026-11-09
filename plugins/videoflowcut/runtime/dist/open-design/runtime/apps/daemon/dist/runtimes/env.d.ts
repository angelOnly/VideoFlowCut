type RuntimeEnvMap = NodeJS.ProcessEnv | Record<string, string>;
type SpawnEnvOptions = {
    resolvedBin?: string | null;
};
export declare function spawnEnvForAgent(agentId: string, baseEnv: RuntimeEnvMap, configuredEnv?: unknown, systemProxyEnv?: RuntimeEnvMap, _options?: SpawnEnvOptions): NodeJS.ProcessEnv;
export declare function openDesignAmrRunAttempt(input: {
    cumulativeRetryAttemptCount?: number | null;
    retryAttemptCount?: number | null;
    manualResumeAttemptCount?: number | null;
}): number;
export declare function openDesignAmrTraceEnv(input: {
    agentId: string;
    runId: string;
    conversationId?: string | null;
    runAttempt: number;
    workspaceId?: string | null;
    externalPluginAnalytics?: Record<string, unknown> | null;
}): NodeJS.ProcessEnv;
export {};
