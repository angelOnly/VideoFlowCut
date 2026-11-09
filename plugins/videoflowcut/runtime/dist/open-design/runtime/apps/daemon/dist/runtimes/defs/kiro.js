import { detectAcpModels, DEFAULT_MODEL_OPTION } from './shared.js';
export const kiroAgentDef = {
    id: 'kiro',
    name: 'Kiro CLI',
    bin: 'kiro-cli',
    versionArgs: ['--version'],
    fetchModels: async (resolvedBin, env) => detectAcpModels({
        bin: resolvedBin,
        args: ['acp'],
        env,
        timeoutMs: 15_000,
        defaultModelOption: DEFAULT_MODEL_OPTION,
    }),
    fallbackModels: [DEFAULT_MODEL_OPTION],
    buildArgs: () => ['acp'],
    streamFormat: 'acp-json-rpc',
    acpTurnEndCompletesPrompt: true,
    externalMcpInjection: 'acp-merge',
};
//# sourceMappingURL=kiro.js.map