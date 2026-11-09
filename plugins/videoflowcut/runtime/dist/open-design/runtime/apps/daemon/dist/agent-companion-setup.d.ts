import type { AgentCompanionSetupResponse } from '@open-design/contracts';
export declare class AgentCompanionSetupError extends Error {
    readonly code: 'AGENT_NOT_INSTALLED' | 'BUNDLED_COMPANION_INVALID' | 'COMPANION_INSTALL_FAILED' | 'COMPANION_STILL_INCOMPATIBLE';
    constructor(code: 'AGENT_NOT_INSTALLED' | 'BUNDLED_COMPANION_INVALID' | 'COMPANION_INSTALL_FAILED' | 'COMPANION_STILL_INCOMPATIBLE', message: string);
}
export declare function installDeepSeekHarnessCompanion(options: {
    projectRoot: string;
    resourceRoot: string;
    runtimeDataDir: string;
}): Promise<AgentCompanionSetupResponse>;
