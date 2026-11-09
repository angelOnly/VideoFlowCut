export function buildLiveArtifactsMcpServersForAgent(def, { enabled = true, command = 'od', argsPrefix = [] } = {}) {
    if (!enabled || def?.mcpDiscovery !== 'mature-acp')
        return [];
    const wantsMapEnv = def?.acpMcpEnvFormat === 'map';
    const env = wantsMapEnv
        ? { ELECTRON_RUN_AS_NODE: '1' }
        : [{ name: 'ELECTRON_RUN_AS_NODE', value: '1' }];
    return [
        {
            name: 'open-design-live-artifacts',
            command,
            args: [...argsPrefix, 'mcp', 'live-artifacts'],
            env,
        },
    ];
}
//# sourceMappingURL=mcp.js.map